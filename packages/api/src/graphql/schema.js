// @flow
import { makeExecutableSchema } from 'graphql-tools'
import { userPicture } from '../util/communications'
import moment from 'moment-timezone'
import Db, { type Thang, type ID } from '../db'
// $FlowFixMe Its OK flow... Good boy.
import typeDefs from '../../graphql/schema.graphqls'
import { dtToTimestamp, timestampToDt } from '../util/dt'
import * as auth from '../auth'
import type { UserProfile } from '../auth'
import type { Dt } from '../util/dt'
import type { Booking, Change, ThangCollection, User, VisitLogEntry } from '../db'

export type CustomErrorCode =
  'USER_NOT_LOGGED_IN'
  | 'USER_EMAIL_NOT_VERIFIED'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'DUPLICATE'

export type Context = {|
  userProfile: ?UserProfile,
  db: Db
|}

function checkUserOrReturnValue<TArgs, TResult> (f: ((ctx: User, arg: TArgs, userProfile: UserProfile, db: Db) => TResult | Promise<TResult>), defaultValue: TResult): Resolver<User, TArgs, TResult> {
  return (ctx, arg, {userProfile, db}: Context) => userProfile && userProfile.user._id.toHexString() === ctx._id.toHexString()
    ? f(ctx, arg, userProfile, db)
    : defaultValue
}

export class CustomError extends Error {
  extensions: { code: CustomErrorCode }

  constructor (message: string, code: CustomErrorCode) {
    super(message)
    this.extensions = {code}
  }
}

async function assert<T> (t: Promise<?T>): Promise<T> {
  const r = await t
  if (!r) {
    throw new Error('Assertion Error!') // TODO fix message
  }
  return r
}

type Update<T> = {| add?: T, remove?: string, update?: T |}

function resolve<T> (change: Change<T>): Update<T> {
  switch (change.kind) {
    case 'add':
      return {
        remove: undefined,
        update: undefined,
        add: change.doc
      }
    case 'remove':
      return {
        add: undefined,
        update: undefined,
        remove: change.id.toHexString()
      }
    case 'update':
      return {
        add: undefined,
        remove: undefined,
        update: change.doc
      }
    default:
      return {
        add: undefined,
        remove: undefined,
        update: undefined
      }
  }
}

function checkUserLoggedIn<TCtx, TArgs, TResult> (f: (ctx: TCtx, args: TArgs, profile: UserProfile, db: Db) => Promise<TResult>): Resolver<TCtx, TArgs, TResult> {
  return (ctx, args, wat: Context) => {
    if (!wat.userProfile) {
      throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
    }
    return f(ctx, args, wat.userProfile, wat.db)
  }
}

function checkEmailVerified<TCtx, TArgs, TResult> (f: (ctx: TCtx, args: TArgs, profile: UserProfile, db: Db) => Promise<TResult>): Resolver<TCtx, TArgs, TResult> {
  return checkUserLoggedIn((ctx, args, wat: UserProfile, db: Db) => {
    if (!wat.profile.emailVerified) {
      throw new CustomError('User email is not verified', 'USER_EMAIL_NOT_VERIFIED')
    }
    return f(ctx, args, wat, db)
  })
}

async function validateThang (db: Db, id: string): Promise<Thang> {
  const i = db.id(id)
  const t = i && await db.thang(i)
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

function validateDt (from: Dt, to: Dt): { to: number, from: number } {
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
  return {from: fromTimestamp, to: toTimestamp}
}

async function validateOverlap (db: Db, id: ID, from: number, to: number): Promise<void> {
  const bookings = await db.thangBookings(id, {from, to})
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

type Resolver<TCtx=any, TArgs=any, TResult=any> = (ctx: TCtx, args: TArgs, c: Context) => TResult | Promise<TResult>
type SubscriptionResolver<TCtx=any, TArgs=any, TResult=any, TIntermediate=any> = {|
  subscribe: Resolver<TCtx, TArgs, AsyncIterator<TIntermediate>>,
  resolve: (r: TIntermediate) => TResult
|}
type DeleteResult = {| deleted: number |}
type SentResult = {| sent: number |}

type Resolvers = {|
  Mutation: {|
    createBooking: Resolver<void, { thang: string, from: Dt, to: Dt }, Booking>,
    createThang: Resolver<void, { name: string, timezone: ?string }, Thang>,
    createThangCollection: Resolver<void, { name: string }, ThangCollection>,
    deleteThang: Resolver<void, { id: string }, DeleteResult>,
    deleteBooking: Resolver<void, { id: string }, DeleteResult>,
    visitThang: Resolver<void, { id: string }, VisitLogEntry>,
    deleteThangCollection: Resolver<void, { id: string }, DeleteResult>,
    deleteUser: Resolver<void, { id: string }, DeleteResult>,
    sendVerificationEmail: Resolver<void, void, SentResult>,
    sendResetPasswordMail: Resolver<void, void, SentResult>,
    updateUser: Resolver<void, { id: string, givenName: ?string, familyName: ?string, timezone: ?string }, User>,
  |},
  Query: {|
    thang: Resolver<void, { id: string }, ?Thang>,
    user: Resolver<void, { id: ?string, email: ?string }, ?User>,
    me: Resolver<void, void, ?User>
  |},
  Subscription: {
    bookingsChange: SubscriptionResolver<void, { thang: string, input: ?{ from: Dt, to: Dt } }, Update<Booking>>,
    myThangsChange: SubscriptionResolver<void, void, Update<Thang>>,
    thangChange: SubscriptionResolver<void, { thang: string }, Update<Thang>>
  },
  Booking: {|
    id: Resolver<Booking, void, string>,
    thang: Resolver<Booking, void, ?Thang>,
    owner: Resolver<Booking, void, ?User>,
    from: Resolver<Booking, void, Dt>,
    to: Resolver<Booking, void, Dt>
  |},
  User: {|
    id: Resolver<User, void, string>,
    thangs: Resolver<User, void, Thang[]>,
    bookings: Resolver<User, { input: ?{ from: Dt, to: Dt } }, Booking[]>,
    collections: Resolver<User, void, ThangCollection[]>,
    email: Resolver<User, void, ?string>,
    emailVerified: Resolver<User, void, ?boolean>,
    timezone: Resolver<User, void, ?string>,
    familyName: Resolver<User, void, ?string>,
    givenName: Resolver<User, void, ?string>,
    picture: Resolver<User, void, string>,
    displayName: Resolver<User, void, string>,
  |},
  Thang: {|
    id: Resolver<Thang, void, string>,
    collection: Resolver<Thang, void, ?ThangCollection>,
    bookings: Resolver<Thang, { input: ?{ from: Dt, to: Dt } }, Booking[]>,
    owners: Resolver<Thang, void, User[]>,
    users: Resolver<Thang, void, User[]>
  |},
  ThangCollection: {|
    id: Resolver<ThangCollection, void, string>,
    thangs: Resolver<ThangCollection, void, Thang[]>,
    owners: Resolver<ThangCollection, void, User[]>
  |},
  VisitLogEntry: {|
    id: Resolver<VisitLogEntry, void, string>,
    thang: Resolver<VisitLogEntry, void, ?Thang>,
    user: Resolver<VisitLogEntry, void, ?User>
  |}
|}

async function* infinityIterator () {
  await new Promise((resolve) => {})
}

const resolvers: Resolvers = {
  Subscription: {
    bookingsChange: {
      resolve,
      subscribe: (ctx, {thang, input}, {db}) => {
        const out = input ? validateDt(input.from, input.to) : null
        const i = db.id(thang)
        if (!i) {
          return infinityIterator()
        }
        return db.thangBookingChanges(i, out ? {from: out.from, to: out.to} : null)
      }
    },
    myThangsChange: {
      resolve,
      subscribe: (ctx, args, {userProfile, db}) => {
        if (!userProfile) {
          throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN')
        }
        return db.userThangChanges(userProfile.user._id)
      }
    },
    thangChange: {
      resolve,
      subscribe: (ctx, {thang}, {db}) => {
        const i = db.id(thang)
        if (!i) {
          return infinityIterator()
        }
        return db.thangChange(i)
      }
    }
  },
  Booking: {
    id: ({_id}) => _id.toHexString(),
    async thang ({thang: t}, _, {db}: Context) {
      return db.thang(t)
    },
    async owner ({owner}, _, {db}) {
      return db.user(owner)
    },
    from: ({from}: {from: Date}) => {
      const res = timestampToDt(from.getTime())
      return res
    },
    to: ({to}: {to: Date}) => timestampToDt(to.getTime())
  },
  Query: {
    thang (ctx, {id}, {db}) {
      const i = db.id(id)
      return i && db.thang(i)
    },
    user (ctx, {id, email}, {db}) {
      if (id) {
        const transformedId = db.id(id)
        return transformedId ? db.user(transformedId) : null
      }
      if (email) {
        return db.userFromEmail(email)
      }
      return null
    },
    me (ctx, args, {userProfile, db}: Context) {
      return userProfile && db.user(userProfile.user._id)
    }
  },
  User: {
    id: ({_id}) => _id.toHexString(),
    thangs: checkUserOrReturnValue(({_id}, _, _2, db) => db.userThangs(_id), []),
    collections: checkUserOrReturnValue(({_id}, _, _2, db) => db.userCollections(_id), []),
    email: checkUserOrReturnValue(({email}) => email, null),
    emailVerified: checkUserOrReturnValue((c, a, {profile}) => profile.emailVerified, null),
    timezone: checkUserOrReturnValue(({timezone}) => timezone),
    givenName: checkUserOrReturnValue(({givenName}) => givenName),
    familyName: checkUserOrReturnValue(({familyName}) => familyName),
    bookings: checkUserOrReturnValue(({_id}, {input}, _, db) => {
      const out = input ? validateDt(input.from, input.to) : null
      return db.userBookings(_id, out ? {from: out.from, to: out.to} : null)
    }, []),
    async picture (user) {
      return userPicture(user)
    },
    async displayName ({givenName, profile}) {
      return givenName || profile.givenName || profile.nickname
    }
  },
  Thang: {
    id: ({_id}) => _id.toHexString(),
    async collection ({collection}, _, {db}) {
      return collection
        ? await db.thangCollection(collection)
        : null
    },
    async bookings ({_id}, {input}, {db}) {
      const out = input ? validateDt(input.from, input.to) : null
      return db.thangBookings(_id, out ? {from: out.from, to: out.to} : null)
    },
    async owners ({_id}, _, {db}) {
      return await db.thangOwners(_id)
    },
    users ({_id}, _, {db}) {
      return db.thangUsers(_id)
    }
  },
  ThangCollection: {
    id: ({_id}) => _id.toHexString(),
    async thangs ({_id}, _, {db}) {
      return await db.collectionThangs(_id)
    },
    async owners ({_id}, _, {db}) {
      return await db.collectionOwners(_id)
    }
  },
  VisitLogEntry: {
    id: ({_id}) => _id.toHexString(),
    async thang ({thang: id}, _, {db}) {
      const thang = await db.thang(id)
      return thang
    },
    async user ({user: id}, _, {db}) {
      const user = await db.user(id)
      return user
    }
  },
  Mutation: {
    createBooking:
      checkEmailVerified(async (ctx, args, {user}: UserProfile, db) => {
        const t = await validateThang(db, args.thang)
        const {from, to} = validateDt(args.from, args.to)
        await validateExpired(t, args.from)
        await validateOverlap(db, t._id, from, to)
        const id = await db.createBooking({
          from: new Date(from),
          to: new Date(to),
          owner: user._id,
          thang: t._id,
          deleted: false
        })
        await db.thangAddUser(t._id, user._id)
        return assert(db.booking(id))
      }),
    sendVerificationEmail:
      checkUserLoggedIn(async (ctx, args, {profile}) => {
        if (profile.emailVerified) {
          return {sent: 0}
        }
        return auth.sendVerificationEmail(profile.userId)
      }),
    sendResetPasswordMail:
      checkUserLoggedIn((ctx, args, {user}) => auth.resetPasswordEmail(user.email)),
    updateUser: checkUserLoggedIn(async (ctx, {id, givenName, familyName, timezone}, {user}, db) => {
      if (id !== user._id.toHexString()) {
        throw new CustomError('Can\'t update user', 'INSUFFICIENT_PERMISSIONS')
      }
      const options = {}
      if (typeof givenName === 'string') {
        if (!givenName.trim()) {
          throw new CustomError('Invalid given name', 'INVALID_INPUT')
        }
        options.givenName = givenName.trim()
      }
      if (typeof familyName === 'string') {
        if (!familyName.trim()) {
          throw new CustomError('Invalid family name', 'INVALID_INPUT')
        }
        options.familyName = familyName.trim()
      }
      if (typeof timezone === 'string') {
        validateTimezone(timezone)
        options.timezone = timezone
      }
      if (Object.keys(options).length) {
        await db.updateUser(user._id, options)
      }
      return assert(db.user(user._id))
    }),
    deleteUser: checkUserLoggedIn(async (ctx, {id}, {user}, db) => {
      if (id !== user._id.toHexString()) {
        throw new CustomError('Can\'t update user', 'INSUFFICIENT_PERMISSIONS')
      }
      const [collections, thangs] = await Promise.all([
        db.userCollections(user._id),
        db.userThangs(user._id)
      ])
      if (collections.length || thangs.length) {
        const message = collections.length
          ? 'Can\'t delete user when owning collections'
          : 'Can\'t delete user when owning thangs'
        throw new CustomError(message, 'INVALID_INPUT')
      }
      const [{deleted: del1}, {deleted: del2}] = await Promise.all([
        auth.deleteUser(user.profile.userId),
        db.deleteUser(user._id)
      ])
      return {deleted: del1 || del2}
    }),
    createThang:
      checkEmailVerified(async (ctx, args, {user}: UserProfile, db) => {
        const timezone = args.timezone || user.timezone
        validateTimezone(timezone)
        validateName(args.name)
        const id = await db.createThang({
          name: args.name,
          owners: [user._id],
          users: [user._id],
          collection: null,
          deleted: false,
          timezone
        })
        const t: Thang = await assert(db.thang(id))
        return t
      }),
    createThangCollection:
      checkEmailVerified(async (ctx, args, {user}: UserProfile, db) => {
        validateName(args.name)
        const id = await db.createThangCollection({
          name: args.name,
          owners: [user._id],
          deleted: false
        })
        return assert(db.thangCollection(id))
      }),
    deleteBooking:
      checkEmailVerified(async (ctx, {id}, {user}: UserProfile, db) => {
        const i = db.id(id)
        const b = i && (await db.booking(i))
        if (!b) {
          return {deleted: 0}
        }
        if (b.owner.toHexString() === user._id.toHexString()) {
          return await db.deleteBooking(b._id)
        }
        const t = await db.thang(b.thang)
        if (t && t.owners.find(o => o.toHexString() === user._id.toHexString())) {
          return await db.deleteBooking(b._id)
        }
        throw new CustomError(
          `User with id ${user._id.toHexString()} can't delete booking with id ${id}`,
          'INSUFFICIENT_PERMISSIONS')
      }),
    deleteThang:
      checkEmailVerified(async (ctx, {id}, {user}: UserProfile, db) => {
        const i = db.id(id)
        const t = i && (await db.thang(i))
        if (!t) {
          return {deleted: 0}
        }
        if (!t.owners.find(o => o.toHexString() === user._id.toHexString())) {
          throw new CustomError(
            `User with id ${user._id.toHexString()} can't delete thang with id ${id}`,
            'INSUFFICIENT_PERMISSIONS')
        }
        return db.deleteThang(t._id)
      }),
    deleteThangCollection:
      checkEmailVerified(async (ctx, {id}, {user}: UserProfile, db) => {
        const i = db.id(id)
        const t = i && (await db.thangCollection(i))
        if (!t) {
          return {deleted: 0}
        }
        if (!t.owners.find(o => o.toHexString() === user._id.toHexString())) {
          throw new CustomError(
            `User with id ${user._id.toHexString()} can't delete thang collection with id ${id}`,
            'INSUFFICIENT_PERMISSIONS')
        }
        return db.deleteThangCollection(t._id)
      }),
    visitThang:
      checkUserLoggedIn(async (ctx, {id}, {user}: UserProfile, db: Db) => {
        const t = await validateThang(db, id)
        const eId = await db.createVisitLogEntry({thang: t._id, user: user._id, time: new Date()})
        return assert(db.visitLogEntry(eId))
      })
  }
}

export default makeExecutableSchema({typeDefs, resolvers})
