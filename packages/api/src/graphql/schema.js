// @flow
import {
  user,
  thang,
  booking,
  createThang,
  createBooking,
  userThangs,
  deleteThang,
  userCollections,
  deleteBooking,
  thangCollection,
  collectionThangs,
  createThangCollection,
  deleteThangCollection,
  collectionOwners,
  thangBookings,
  thangBookingChanges,
  thangOwners, userThangChanges
} from '../db'
import { makeExecutableSchema } from 'graphql-tools'

const typeDefs = [
  `

type DateTime {
  hour: Int
  minute: Int
  day: Int
  month: Int
  year: Int
}

type User {
  id: ID!
  name: String!
  givenName: String,
  familyName: String,
  thangs: [Thang]!
  picture: String!
  collections: [ThangCollection]!
  email: String!
  timezone: String!
}
type ThangCollection {
  id: ID!
  name: String!
  thangs: [Thang]!
  owners: [User]!
}

input DateTimeInput {
  hour: Int
  minute: Int
  day: Int
  month: Int
  year: Int
}

input ListBookingsInput {
  from: DateTimeInput
  to: DateTimeInput
  owner: ID
}

type Thang {
  id: ID!
  name: String!
  owners: [User]!
  bookings(input: ListBookingsInput): [Booking]!
  collection: ThangCollection
  timezone: String!
}
type Booking {
  id: ID!
  from: DateTime!
  to: DateTime!
  owner: User!
  thang: Thang!
}
type Query {
  thang(id: ID!): Thang
  user(id: ID!): User
  me: User
}

type DeleteResult {
  deleted: Int
}

type Mutation {
  createBooking(thang: ID!, from: DateTimeInput!, to: DateTimeInput!): Booking!
  createThang(name: String!, timezone: String): Thang!
  createThangCollection(name: String!): ThangCollection!
  deleteThang(id: ID!): DeleteResult!
  deleteBooking(id: ID!): DeleteResult!
  deleteThangCollection(id: ID!): DeleteResult!
}

type ChangeBooking {
  add: Booking
  remove: Booking
  change: Booking
}

type ChangeThang {
  add: Thang
  remove: Thang
  change: Thang
}


type Subscription {
  bookingsChange(thang: ID!, input: ListBookingsInput): ChangeBooking!
  myThangsChange: ChangeThang!
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}`
]

async function* noop () {
  await new Promise(() => {})
}

type CustomErrorCode = 'USER_NOT_LOGGED_IN'

export class CustomError extends Error {
  code: CustomErrorCode

  constructor (message: string, code: CustomErrorCode) {
    super(message)
    this.code = code
  }
}

const resolvers = {
  Subscription: {
    bookingsChange: {
      resolve: v => {
        const {type, new_val: newVal, old_val: oldVal} = v
        switch (type) {
          case 'add':
            return {
              add: newVal
            }
          case 'remove':
            return {
              remove: oldVal
            }
          case 'change':
            return {
              change: newVal
            }
        }
      },
      subscribe: (ctx, {thang}) => thangBookingChanges(thang)
    },
    myThangsChange: {
      resolve: v => {
        const {type, new_val: newVal, old_val: oldVal} = v
        switch (type) {
          case 'add':
            return {
              add: newVal
            }
          case 'remove':
            return {
              remove: oldVal
            }
          case 'change':
            return {
              change: newVal
            }
        }
      },
      subscribe: (ctx, {thang}, {currentUser}) => {
        if (!currentUser) {
          return noop() // TODO is this the right way?!
        }
        return userThangChanges(currentUser.id)
      }
    }
  },
  Booking: {
    async thang ({thang: t}) {
      return thang(t)
    },
    async owner ({owner}) {
      return user(owner)
    }
  },
  Query: {
    async thang (ctx, {id}) {
      return thang(id)
    },
    user (ctx, {id}) {
      return user(id)
    },
    me (ctx, args, {currentUser}) {
      return currentUser
    }
  },

  User: {
    async thangs ({id}) {
      return userThangs(id)
    },
    async collections ({id}) {
      return await userCollections(id)
    },
    async email ({email}, args, {currentUser}) {
      return currentUser && currentUser.email === email ? email : null
    }
  },
  Thang: {
    async collection ({collection}) {
      return collection
        ? await thangCollection(collection)
        : null
    },
    async bookings ({id}) {
      return thangBookings(id)
    },
    async owners ({id}) {
      return await thangOwners(id)
    }
  },
  ThangCollection: {
    async thangs ({id}) {
      return await collectionThangs(id)
    },
    async owners ({id}) {
      return await collectionOwners(id)
    }
  },
  Mutation: {
    async createBooking (ctx, args, {currentUser}) {
      if (!currentUser) {
        throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
      }
      const id = await createBooking({from: args.from, to: args.to, owner: currentUser.id, thang: args.thang})
      return booking(id)
    },
    async createThang (ctx, args, {currentUser}) {
      if (!currentUser) {
        throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
      }
      const id = await createThang({
        name: args.name,
        owners: [currentUser.id],
        collection: null,
        timezone: currentUser.timezone
      })
      return thang(id)
    },
    async createThangCollection (ctx, args, {currentUser}) {
      if (!currentUser) {
        throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
      }
      const id = await createThangCollection({name: args.name, owners: [currentUser.id], thangs: []})
      return thangCollection(id)
    },
    async deleteBooking (ctx, {id}) {
      const deleted = await deleteBooking(id)
      return {deleted}
    },
    async deleteThang (ctx, {id}) {
      const deleted = await deleteThang(id)
      return {deleted}
    },
    async deleteThangCollection (ctx, {id}) {
      const deleted = await deleteThangCollection(id)
      return {deleted}
    }
  }
}

export default makeExecutableSchema({typeDefs, resolvers})
