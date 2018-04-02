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
  thangOwners, userThangChanges, thangUsers, userFromId, createVisitLogEntry, visitLogEntry
} from '../db'
import { makeExecutableSchema } from 'graphql-tools'
import config from 'config'

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
  name: String
  nickname: String
  givenName: String
  familyName: String
  displayName: String!
  thangs: [Thang!]
  picture: String!
  collections: [ThangCollection!]
  email: String
  timezone: String
}
type ThangCollection {
  id: ID!
  name: String!
  thangs: [Thang!]!
  owners: [User!]!
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
}

type Thang {
  id: ID!
  name: String!
  owners: [User!]!
  users: [User!]!
  bookings(input: ListBookingsInput): [Booking!]!
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
  user(id: ID, email: String): User
  me: User
}

type DeleteResult {
  deleted: Int
}

type VisitLogEntry {
  id: ID!
  thang: Thang!
  user: User!
}

type Mutation {
  createBooking(thang: ID!, from: DateTimeInput!, to: DateTimeInput!): Booking!
  createThang(name: String!, timezone: String): Thang!
  createThangCollection(name: String!): ThangCollection!
  deleteThang(id: ID!): DeleteResult!
  deleteBooking(id: ID!): DeleteResult!
  visitThang(id: ID!): VisitLogEntry!
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

type CustomErrorCode = 'USER_NOT_LOGGED_IN'

function checkEmail (f) {
  return (ctx, arg, {currentUser}) => currentUser && currentUser.email === ctx.email
    ? f(ctx)
    : null
}

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
      subscribe: (ctx, {thang}) => thangBookingChanges(thang) // TODO use from and to
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
          throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
        }
        return userThangChanges(currentUser.email)
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
    user (ctx, {id, email}) {
      if (id) {
        return userFromId(id)
      }
      if (email) {
        return user(email)
      }
      return null
    },
    me (ctx, args, {currentUser}) {
      return currentUser && user(currentUser.email)
    }
  },

  User: {
    thangs: checkEmail(({email}) => userThangs(email)),
    collections: checkEmail(({email}) => userCollections(email)),
    email: checkEmail(({email}) => email),
    timezone: checkEmail(({timezone}) => timezone),
    name: checkEmail(({name}) => name),
    nickname: checkEmail(({nickname}) => nickname),
    givenName: checkEmail(({givenName}) => givenName),
    familyName: checkEmail(({familyName}) => familyName),
    async picture ({id}) {
      return `${config.url.http}/i/id/${id}`
    },
    async displayName ({nickname, givenName}) {
      return givenName || nickname
    }
  },
  Thang: {
    async collection ({collection}) {
      return collection
        ? await thangCollection(collection)
        : null
    },
    async bookings ({id}) {
      return thangBookings(id) // TODO use to and from
    },
    async owners ({id}) {
      return await thangOwners(id)
    },
    users ({id}) {
      return thangUsers(id)
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
  VisitLogEntry: {
    async thang ({thang: id}) {
      return thang(id)
    }
  },
  Mutation: {
    async createBooking (ctx, args, {currentUser}) {
      if (!currentUser) {
        throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
      }
      const id = await createBooking({from: args.from, to: args.to, owner: currentUser.email, thang: args.thang})
      return booking(id)
    },
    async createThang (ctx, args, {currentUser}) {
      if (!currentUser) {
        throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
      }
      const id = await createThang({
        name: args.name,
        owners: [currentUser.email],
        collection: null,
        timezone: currentUser.timezone
      })
      return thang(id)
    },
    async createThangCollection (ctx, args, {currentUser}) {
      if (!currentUser) {
        throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
      }
      const id = await createThangCollection({name: args.name, owners: [currentUser.email], thangs: []})
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
    },
    async visitThang (ctx, {id}, {currentUser}) {
      if (!currentUser) {
        throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
      }
      const i = await createVisitLogEntry(id, currentUser.email)
      return visitLogEntry(i)
    }
  }
}

export default makeExecutableSchema({typeDefs, resolvers})
