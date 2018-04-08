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
  thangOwners,
  userThangChanges,
  userFromId,
  createVisitLogEntry,
  visitLogEntry,
  thangAddUser, thangUsers, thangChange
} from '../db'
import { makeExecutableSchema } from 'graphql-tools'
import { userPicture } from '../util/communications'
import moment from 'moment-timezone'
import type { Thang } from '../db'

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
  thangs: [Thang!]!
  picture: String!
  collections: [ThangCollection!]!
  email: String
  emailVerified: Boolean
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
  thangChange(thang: ID!): ChangeThang!
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}`
]

export type CustomErrorCode =
  'USER_NOT_LOGGED_IN'
  | 'USER_EMAIL_NOT_VERIFIED'
  | 'REFERENCE_ERROR'
  | 'INVALID_TIMEZONE'
  | 'INVALID_NAME'
  | 'INSUFFICIENT_PERMISSIONS'

function checkEmail (f, defaultValue = null) {
  return (ctx, arg, {currentUser}) => currentUser && currentUser.email === ctx.email
    ? f(ctx)
    : defaultValue
}

export class CustomError extends Error {
  extensions: { code: CustomErrorCode }

  constructor (message: string, code: CustomErrorCode) {
    super(message)
    this.extensions = {code}
  }
}

function resolve (change) {
  const {type, new_val: newVal, old_val: oldVal} = change
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
}

function checkUserLoggedIn (f) {
  return (ctx, args, wat) => {
    if (!wat.currentUser) {
      throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
    }
    return f(ctx, args, wat)
  }
}

function checkEmailVerified (f) {
  return checkUserLoggedIn((ctx, args, wat) => {
    if (!wat.currentUser.emailVerified) {
      throw new CustomError('User email is not verified', 'USER_EMAIL_NOT_VERIFIED')
    }
    return f(ctx, args, wat)
  })
}

async function validateThang (id): Promise<Thang> {
  const t = await thang(id)
  if (!t) {
    throw new CustomError(`Thang with id ${id} not found`, 'REFERENCE_ERROR')
  }
  return t
}

function validateTimezone (tz) {
  if (!moment.tz.zone(tz)) {
    throw new CustomError(`Invalid timezone: ${tz}`, 'INVALID_TIMEZONE')
  }
}

function validateName (name) {
  if (!name) {
    throw new CustomError(`Invalid name: "${name}"`, 'INVALID_NAME')
  }
}

const resolvers = {
  Subscription: {
    bookingsChange: {
      resolve,
      subscribe: (ctx, {thang}) => thangBookingChanges(thang) // TODO use from and to
    },
    myThangsChange: {
      resolve,
      subscribe: (ctx, args, {currentUser}) => {
        if (!currentUser) {
          throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
        }
        return userThangChanges(currentUser.email)
      }
    },
    thangChange: {
      resolve,
      subscribe: (ctx, {thang}, {currentUser}) => {
        if (!currentUser) {
          throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
        }
        return thangChange(thang)
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
    thangs: checkEmail(({email}) => userThangs(email), []),
    collections: checkEmail(({email}) => userCollections(email), []),
    email: checkEmail(({email}) => email),
    emailVerified: checkEmail(({emailVerified}) => emailVerified),
    timezone: checkEmail(({timezone}) => timezone),
    name: checkEmail(({name}) => name),
    nickname: checkEmail(({nickname}) => nickname),
    givenName: checkEmail(({givenName}) => givenName),
    familyName: checkEmail(({familyName}) => familyName),
    async picture (user) {
      return userPicture(user)
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
    createBooking:
      checkEmailVerified(async (ctx, args, {currentUser}) => {
        await validateThang(args.thang)
        const id = await createBooking({
          from: args.from,
          to: args.to,
          owner: currentUser.email,
          thang: args.thang
        })
        await thangAddUser(args.thang, currentUser.email)
        return booking(id)
      }),
    createThang:
      checkEmailVerified(async (ctx, args, {currentUser}) => {
        const timezone = args.timezone || currentUser.timezone
        validateTimezone(timezone)
        validateName(args.name)
        const id = await createThang({
          name: args.name,
          owners: [currentUser.email],
          users: [currentUser.email],
          collection: null,
          timezone
        })
        return thang(id)
      }),
    createThangCollection:
      checkEmailVerified(async (ctx, args, {currentUser}) => {
        validateName(args.name)
        const id = await createThangCollection({
          name: args.name,
          owners: [currentUser.email]
        })
        return thangCollection(id)
      }),
    deleteBooking:
      checkEmailVerified(async (ctx, {id}, {currentUser}) => {
        const b = await booking(id)
        if (!b) {
          return {deleted: 0}
        }
        if (b.owner === currentUser.email) {
          const deleted = await deleteBooking(id)
          return {deleted}
        }
        const t = await thang(b.thang)
        if (t && t.owners.indexOf(currentUser.email) >= 0) {
          const deleted = await deleteBooking(id)
          return {deleted}
        }
        throw new CustomError(
          `User with id ${currentUser.id} can't delete booking with id ${id}`,
          'INSUFFICIENT_PERMISSIONS')
      }),
    deleteThang:
      checkEmailVerified(async (ctx, {id}, {currentUser}) => {
        const t = await thang(id)
        if (!t) {
          return {deleted: 0}
        }
        if (t.owners.indexOf(currentUser.email) < 0) {
          throw new CustomError(
            `User with id ${currentUser.id} can't delete thang with id ${id}`,
            'INSUFFICIENT_PERMISSIONS')
        }
        return {deleted: await deleteThang(id)}
      }),
    deleteThangCollection:
      checkEmailVerified(async (ctx, {id}, {currentUser}) => {
        const t = await thangCollection(id)
        if (!t) {
          return {deleted: 0}
        }
        if (t.owners.indexOf(currentUser.email) < 0) {
          throw new CustomError(
            `User with id ${currentUser.id} can't delete thang with id ${id}`,
            'INSUFFICIENT_PERMISSIONS')
        }
        return {deleted: await deleteThangCollection(id)}
      }),
    visitThang:
      checkUserLoggedIn(async (ctx, {id}, {currentUser}) => {
        await validateThang(id)
        const eId = await createVisitLogEntry(id, currentUser.email)
        return visitLogEntry(eId)
      })
  }
}

export default makeExecutableSchema({typeDefs, resolvers})
