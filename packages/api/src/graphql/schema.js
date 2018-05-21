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
  userBookings,
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
import type { Dt, Thang } from '../db'
// $FlowFixMe Its OK flow... Good boy.
import typeDefs from '../../graphql/schema.graphqls'
import { dtToTimestamp } from '../util/dt'
import * as auth from '../auth'
import type { UserProfile } from '../auth'

export type CustomErrorCode =
  'USER_NOT_LOGGED_IN'
  | 'USER_EMAIL_NOT_VERIFIED'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'DUPLICATE'

export type Context = {|
  userProfile: ?UserProfile
|}

function checkEmail (f: (ctx: *, arg: *, userProfile: UserProfile) => *, defaultValue = null) {
  return (ctx, arg, {userProfile}: Context) => userProfile && userProfile.user.email === ctx.email
    ? f(ctx, arg, userProfile)
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

function checkUserLoggedIn (f: (ctx: *, args: *, profile: UserProfile) => *) {
  return (ctx, args, wat: Context) => {
    if (!wat.userProfile) {
      throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
    }
    return f(ctx, args, wat.userProfile)
  }
}

function checkEmailVerified (f: (ctx: *, args: *, profile: UserProfile) => *) {
  return checkUserLoggedIn((ctx, args, wat: UserProfile) => {
    if (!wat.profile.emailVerified) {
      throw new CustomError('User email is not verified', 'USER_EMAIL_NOT_VERIFIED')
    }
    return f(ctx, args, wat)
  })
}

async function validateThang (id): Promise<Thang> {
  const t = await thang(id)
  if (!t) {
    throw new CustomError(`Thang with id ${id} not found`, 'NOT_FOUND')
  }
  return t
}

function validateExpired (thang: Thang, from: Dt) {
  const time = moment
    .tz(thang.timezone)
    .hour(from.hour)
    .minute(from.minute)
    .date(from.day)
    .month(from.month - 1)
    .year(from.year)
  const now = moment().tz(thang.timezone)
  if (now.isSameOrAfter(time)) {
    throw new CustomError('Time provided has passed', 'INVALID_INPUT')
  }
}

function validateDt (from: Dt, to: Dt): { fromTimestamp: number, toTimestamp: number } {
  const fromTimestamp = dtToTimestamp(from)
  if (typeof fromTimestamp !== 'number') {
    throw new CustomError('Invalid from timestamp', 'INVALID_INPUT')
  }
  const toTimestamp = dtToTimestamp(to)
  if (typeof toTimestamp !== 'number') {
    throw new CustomError('Invalid to timestamp', 'INVALID_INPUT')
  }
  if (fromTimestamp >= toTimestamp) {
    throw new CustomError('From must be before to', 'INVALID_INPUT')
  }
  return {fromTimestamp, toTimestamp}
}

async function validateOverlap (id: string, from: number, to: number): Promise<void> {
  const bookings = await thangBookings(id, {from, to})
  if (bookings.length) {
    throw new CustomError('Booking is overlapping with existing booking', 'DUPLICATE')
  }
}

function validateTimezone (tz) {
  if (!moment.tz.zone(tz)) {
    throw new CustomError(`Invalid timezone: ${tz}`, 'INVALID_INPUT')
  }
}

function validateName (name) {
  if (!name) {
    throw new CustomError(`Invalid name: "${name}"`, 'INVALID_INPUT')
  }
}

const resolvers = {
  Subscription: {
    bookingsChange: {
      resolve,
      subscribe: (ctx, {thang, input}) => {
        const out = input ? validateDt(input.from, input.to) : null
        return thangBookingChanges(thang, out ? {from: out.fromTimestamp, to: out.toTimestamp} : null)
      }
    },
    myThangsChange: {
      resolve,
      subscribe: (ctx, args, {userProfile}: Context) => {
        if (!userProfile) {
          throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
        }
        return userThangChanges(userProfile.user.email)
      }
    },
    thangChange: {
      resolve,
      subscribe: (ctx, {thang}, {userProfile}: Context) => {
        if (!userProfile) {
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
    me (ctx, args, {userProfile}: Context) {
      return userProfile && user(userProfile.user.email)
    }
  },

  User: {
    thangs: checkEmail(({email}) => userThangs(email), []),
    collections: checkEmail(({email}) => userCollections(email), []),
    email: checkEmail(({email}) => email),
    emailVerified: checkEmail((c, a, {profile}) => profile.emailVerified),
    timezone: checkEmail(({timezone}) => timezone),
    name: checkEmail(({name}) => name),
    nickname: checkEmail(({nickname}) => nickname),
    givenName: checkEmail(({givenName}) => givenName),
    familyName: checkEmail(({familyName}) => familyName),
    bookings: checkEmail(({email}, {input}) => {
      const out = input ? validateDt(input.from, input.to) : null
      return userBookings(email, out ? {from: out.fromTimestamp, to: out.toTimestamp} : null)
    }, []),
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
    async bookings ({id}, {input}) {
      const out = input ? validateDt(input.from, input.to) : null
      return thangBookings(id, out ? {from: out.fromTimestamp, to: out.toTimestamp} : null)
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
      checkEmailVerified(async (ctx, args, {user}: UserProfile) => {
        const t = await validateThang(args.thang)
        const {fromTimestamp, toTimestamp} = validateDt(args.from, args.to)
        await validateExpired(t, args.from)
        await validateOverlap(args.thang, fromTimestamp, toTimestamp)
        const id = await createBooking({
          from: args.from,
          to: args.to,
          fromTime: new Date(fromTimestamp),
          toTime: new Date(toTimestamp),
          owner: user.email,
          thang: args.thang
        })
        await thangAddUser(args.thang, user.email)
        return booking(id)
      }),
    sendVerificationEmail:
      async (ctx, args, {userProfile}: Context) => {
        if (!userProfile || userProfile.profile.emailVerified) {
          return {sent: 0}
        }
        return auth.sendVerificationEmail(userProfile.profile.userId)
      },
    createThang:
      checkEmailVerified(async (ctx, args, {user}: UserProfile) => {
        const timezone = args.timezone || user.timezone
        validateTimezone(timezone)
        validateName(args.name)
        const id = await createThang({
          name: args.name,
          owners: [user.email],
          users: [user.email],
          collection: null,
          timezone
        })
        return thang(id)
      }),
    createThangCollection:
      checkEmailVerified(async (ctx, args, {user}: UserProfile) => {
        validateName(args.name)
        const id = await createThangCollection({
          name: args.name,
          owners: [user.email]
        })
        return thangCollection(id)
      }),
    deleteBooking:
      checkEmailVerified(async (ctx, {id}, {user}: UserProfile) => {
        const b = await booking(id)
        if (!b) {
          return {deleted: 0}
        }
        if (b.owner === user.email) {
          const deleted = await deleteBooking(id)
          return {deleted}
        }
        const t = await thang(b.thang)
        if (t && t.owners.indexOf(user.email) >= 0) {
          const deleted = await deleteBooking(id)
          return {deleted}
        }
        throw new CustomError(
          `User with id ${user.id} can't delete booking with id ${id}`,
          'INSUFFICIENT_PERMISSIONS')
      }),
    deleteThang:
      checkEmailVerified(async (ctx, {id}, {user}: UserProfile) => {
        const t = await thang(id)
        if (!t) {
          return {deleted: 0}
        }
        if (t.owners.indexOf(user.email) < 0) {
          throw new CustomError(
            `User with id ${user.id} can't delete thang with id ${id}`,
            'INSUFFICIENT_PERMISSIONS')
        }
        return {deleted: await deleteThang(id)}
      }),
    deleteThangCollection:
      checkEmailVerified(async (ctx, {id}, {user}: UserProfile) => {
        const t = await thangCollection(id)
        if (!t) {
          return {deleted: 0}
        }
        if (t.owners.indexOf(user.email) < 0) {
          throw new CustomError(
            `User with id ${user.id} can't delete thang with id ${id}`,
            'INSUFFICIENT_PERMISSIONS')
        }
        return {deleted: await deleteThangCollection(id)}
      }),
    visitThang:
      checkUserLoggedIn(async (ctx, {id}, {user}: UserProfile) => {
        await validateThang(id)
        const eId = await createVisitLogEntry(id, user.email)
        return visitLogEntry(eId)
      })
  }
}

export default makeExecutableSchema({typeDefs, resolvers})
