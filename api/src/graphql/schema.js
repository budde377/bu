// @flow
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'

import {
  user,
  thang,
  booking,
  createUser,
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
  thangBookingAdded
} from '../db'
import { makeExecutableSchema } from 'graphql-tools'

const typeDefs = [
`
scalar Date

type User {
  id: ID!
  name: String!
  thangs: [Thang]!
  collections: [ThangCollection]!
  email: String
}
type ThangCollection {
  id: ID!
  name: String!
  thangs: [Thang]!
  owners: [User]!
}
type Thang {
  id: ID!
  name: String!
  owners: [User]!
  bookings(from: Date, to: Date, owner: ID): [Booking]!
  collection: ThangCollection
}
type Booking {
  id: ID!
  from: Date!
  to: Date!
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

enum CreateThangErrorCode {
  USER_NOT_LOGGED_IN
}

type CreateThangResult {
  thang: Thang
  error: CreateThangErrorCode
}

enum CreateThangCollectionErrorCode {
  USER_NOT_LOGGED_IN
}

type CreateThangCollectionResult {
  collection: ThangCollection
  error: CreateThangCollectionErrorCode
}

enum CreateBookingErrorCode {
  USER_NOT_LOGGED_IN
}

type CreateBookingResult {
  booking: Booking
  error: CreateBookingErrorCode
}

type CreateUserResult {
  user: User
}

type Mutation {
  createBooking(thang: ID!, from: Date!, to: Date!): CreateBookingResult!
  createThang(name: String!): CreateThangResult!
  createThangCollection(name: String!): CreateThangCollectionResult!
  deleteThang(id: ID!): DeleteResult!
  deleteBooking(id: ID!): DeleteResult!
  deleteThangCollection(id: ID!): DeleteResult!
  createUser(name: String!, email: String!): CreateUserResult!
}

type ChangeBooking {
  addBooking: Booking
  removeBooking: Booking
  changeBooking: Booking
}


type Subscription {
  bookingsChange(thang: ID!, from: Date, to: Date, owner: ID): ChangeBooking!
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}`
]

const resolvers = {
  Subscription: {
    bookingsChange: {
      resolve: v => {
        const {type, new_val, old_val} = v
        switch (type) {
          case 'add':
            return {
              addBooking: new_val
            }
          case 'remove':
            return {
              removeBooking: old_val
            }
          case 'change':
            return {
              changeBooking: new_val
            }
        }
      },
      subscribe: (ctx, {thang}) => thangBookingAdded(thang)
    }
  },
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value)
    },
    serialize(value) {
      return value.getTime()
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(parseInt(ast.value, 10))
      }
      return null
    },
  }),
  Booking: {
    async thang({thang: t}) {
      return thang(t)
    },
    async owner({owner}) {
      return user(owner)
    }
  },
  Query: {
    async thang(ctx, {id}) {
      return thang(id)
    },
    user(ctx, {id}) {
      return user(id)
    },
    me(ctx, args, {currentUser}) {
      return user(currentUser)
    }
  },
  User: {
    async thangs({id}) {
      return await userThangs(id)
    },
    async collections({id}) {
      return await userCollections(id)
    }
  },
  Thang: {
    async collection({collection}) {
      return collection
        ? await thangCollection(collection)
        : null
    },
    async bookings({id}) {
      return thangBookings(id)
    }
  },
  ThangCollection: {
    async thangs({id}) {
      return await collectionThangs(id)
    },
    async owners({id}) {
      return await collectionOwners(id)
    }
  },
  Mutation: {
    async createBooking(ctx, args, {currentUser}) {
      if (!currentUser) {
        return {error: 'USER_NOT_LOGGED_IN'}
      }
      const id = await createBooking({from: args.from, to: args.to, owner: currentUser, thang: args.thang})
      return {booking: await booking(id)}
    },
    async createThang(ctx, args, {currentUser}) {
      if (!currentUser) {
        return {error: 'USER_NOT_LOGGED_IN'}
      }
      const id = await createThang({name: args.name, owner: currentUser})
      return {thang: await thang(id)}
    },
    async createThangCollection(ctx, args, {currentUser}) {
      if (!currentUser) {
        return {error: 'USER_NOT_LOGGED_IN'}
      }
      const id = await createThangCollection({name: args.name, owners: [currentUser]})
      return {collection: await thangCollection(id)}
    },
    async createUser(ctx, args) {
      const id = await createUser({name: args.name, email: args.email})
      return {user: await user(id)}
    },
    async deleteBooking(ctx, {id}) {
      const deleted = await deleteBooking(id)
      return {deleted}
    },
    async deleteThang(ctx, {id}) {
      const deleted = await deleteThang(id)
      return {deleted}
    },
    async deleteThangCollection(ctx, {id}) {
      const deleted = await deleteThangCollection(id)
      return {deleted}
    }
  }
}

export default makeExecutableSchema({typeDefs, resolvers})
