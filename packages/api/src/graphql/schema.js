// @flow
import { makeExecutableSchema } from 'graphql-tools'
import { userPicture } from '../util/communications'
import moment from 'moment-timezone'
import Db, { type Thang, type ID } from '../db'
// $FlowFixMe Its OK flow... Good boy.
import typeDefs from '../../graphql/schema.graphqls'
import { now, dtToTimestamp, timestampToDt, timestampToWeekday, daysDiff, startOfDay, addDay } from '../util/dt'
import * as auth from '../auth'
import type { UserProfile } from '../auth'
import type { Dt } from '../util/dt'
import type { Booking, Change, ThangCollection, User } from '../db'
import * as array from '../util/array'

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

function validateSingleDt (from: Dt, msg: string): number {
  const ts = dtToTimestamp(from)
  if (typeof ts !== 'number') {
    throw new CustomError(msg, 'INVALID_INPUT')
  }
  return ts
}

function validateDt (from: Dt, to: Dt): { to: number, from: number } {
  const fromTimestamp = validateSingleDt(from, 'Invalid from timestamp')
  const toTimestamp = validateSingleDt(to, 'Invalid to timestamp')
  if (fromTimestamp >= toTimestamp) {
    throw new CustomError('From must be before to', 'INVALID_INPUT')
  }
  return {from: fromTimestamp, to: toTimestamp}
}

async function validateTimeAgainstThang (db: Db, thang: Thang, user: User, from: number, to: number) {
  if (thang.range.last && to > thang.range.last) {
    throw new CustomError('to must not be later than last in range', 'INVALID_INPUT')
  }
  if (thang.range.first && from < thang.range.first) {
    throw new CustomError('to must not be later than last in range', 'INVALID_INPUT')
  }
  const wdf = timestampToWeekday(from)
  if (!thang.weekdays[wdf]) {
    throw new CustomError('Weekday on from is disabled', 'INVALID_INPUT')
  }
  const wdt = timestampToWeekday(to)
  if (!thang.weekdays[wdt]) {
    throw new CustomError('Weekday on to is disabled', 'INVALID_INPUT')
  }
  if (thang.userRestrictions.maxBookingMinutes) {
    const userBookings = await db.userThangBookings(thang._id, user._id, {from: now()})
    const used = userBookings.reduce((acc, {from, to}) => acc + (to - from), to - from)
    if (used / (1000 * 60)) {
      throw new CustomError('Max booking minutes exceeded', 'INVALID_INPUT')
    }
  }
  if (thang.userRestrictions.maxDailyBookingMinutes) {
    const userBookings = await db.userThangBookings(thang._id, user._id, {
      from: startOfDay(from),
      to: startOfDay(to + 24 * 60 * 60 * 1000)
    })
    const usage: { [string]: number } = [...userBookings, {from, to}]
      .reduce(
        (acc, {from, to}) => {
          const d = daysDiff(startOfDay(to), startOfDay(from)) + 1
          return array
            .range(d)
            .reduce((acc, offset: number) => {
              const f = startOfDay(addDay(from, offset))
              const t = startOfDay(addDay(from, offset + 1))
              const value = Math.min(t, to) - Math.max(f, from)
              const fs = f.toString(10)
              return {...acc, [fs]: (acc[fs] || 0) + value}
            }, acc)
        }, {})
    const limit = thang.userRestrictions.maxDailyBookingMinutes * 60 * 1000
    const overUsed = Object.keys(usage).find(k => usage[k] > limit)
    if (overUsed) {
      throw new CustomError('Max daily booking minutes exceeded', 'INVALID_INPUT')
    }
  }
}

function valdiateSlots (thang: Thang, from: Dt, to: Dt) {
  const fromMinutes = from.minute + from.hour * 60
  const d1 = (fromMinutes - thang.slots.start) / thang.slots.size
  if (d1 % 1 !== 0 || d1 > thang.slots.num) {
    throw new CustomError('Invalid from', 'INVALID_INPUT')
  }
  const toMinutes = to.minute + to.hour * 60
  const d2 = (toMinutes - thang.slots.start) / thang.slots.size
  if (d2 % 1 !== 0 || d2 > thang.slots.num) {
    throw new CustomError('Invalid to', 'INVALID_INPUT')
  }
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
    deleteThangCollection: Resolver<void, { id: string }, DeleteResult>,
    deleteUser: Resolver<void, { id: string }, DeleteResult>,
    sendVerificationEmail: Resolver<void, void, SentResult>,
    sendResetPasswordMail: Resolver<void, void, SentResult>,
    updateUser: Resolver<void, { id: string, givenName: ?string, familyName: ?string, timezone: ?string }, User>,
    updateThang: Resolver<void, {
      id: string,
      name: ?string,
      timezone: ?string,
      weekdays: ?{| mon: boolean, tue: boolean, wed: boolean, thu: boolean, fri: boolean, sat: boolean, sun: boolean |},
      range: ?{| first: ?Dt, last: ?Dt |},
      userRestrictions: ?{| maxBookingMinutes: number, maxDailyBookingMinutes: number |},
      slots: ?{| size: number, start: number, num: number |}
    }, Thang>
  |},
  RangeRules: {|
    first: Resolver<{ first: ?Date, last: ?Date }, void, ?Dt>,
    last: Resolver<{ first: ?Date, last: ?Date }, void, ?Dt>
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
    from: ({from}: { from: Date }) => {
      return timestampToDt(from.getTime())
    },
    to: ({to}: { to: Date }) => timestampToDt(to.getTime())
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
    async users ({_id}, _, {db}) {
      const r = await db.thangUsers(_id)
      return r
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
  RangeRules: {
    first: ({first: date}) => date && timestampToDt(date.getTime()),
    last: ({last: date}) => date && timestampToDt(date.getTime())
  },
  Mutation: {
    createBooking:
      checkEmailVerified(async (ctx, args, {user}: UserProfile, db) => {
        const t = await validateThang(db, args.thang)
        const {from, to} = validateDt(args.from, args.to)
        await validateTimeAgainstThang(db, t, user, from, to)
        await valdiateSlots(t, args.to, args.from)
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
    updateUser:
      checkEmailVerified(async (ctx, {id, givenName, familyName, timezone}, {user}, db) => {
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
    updateThang:
      checkEmailVerified(async (ctx, {id, name, timezone, weekdays, range, userRestrictions, slots}, {user}, db) => {
        const i = db.id(id)
        if (!i) {
          throw new CustomError('Thang not found', 'NOT_FOUND')
        }
        const thang = await db.thang(i)
        if (!thang) {
          throw new CustomError('Thang not found', 'NOT_FOUND')
        }
        if (!thang.owners.find(id => id.equals(user._id))) {
          throw new CustomError('Can\'t update thang', 'INSUFFICIENT_PERMISSIONS')
        }
        const options = {}
        if (typeof name === 'string') {
          if (!name.trim()) {
            throw new CustomError('Invalid family name', 'INVALID_INPUT')
          }
          options.name = name
        }
        if (typeof timezone === 'string') {
          validateTimezone(timezone)
          options.timezone = timezone
        }
        if (weekdays) {
          options.weekdays = weekdays
        }
        if (userRestrictions) {
          if (userRestrictions.maxBookingMinutes < 0 || userRestrictions.maxDailyBookingMinutes < 0) {
            throw new CustomError('Invalid userRestrictions', 'INVALID_INPUT')
          }
          options.userRestrictions = userRestrictions
        }
        if (slots) {
          if (slots.size <= 0 || slots.start < 0 || slots.num <= 0) {
            throw new CustomError('Invalid slots', 'INVALID_INPUT')
          }
          if (slots.size * slots.num > 24 * 60) {
            throw new CustomError('Slots can not be longer than 24 hours', 'INVALID_INPUT')
          }
          options.slots = slots
        }
        if (range) {
          const first = range.first && new Date(validateSingleDt(range.first, 'Invalid first time'))
          const last = range.last && new Date(validateSingleDt(range.last, 'Invalid last time'))
          if (first && last && first.getTime() > last.getTime()) {
            throw new CustomError('First is after last', 'INVALID_INPUT')
          }
          options.range = {first, last}
        }
        if (Object.keys(options).length) {
          await db.updateThang(i, options)
        }
        return assert(db.thang(i))
      }),
    deleteUser:
      checkEmailVerified(async (ctx, {id}, {user: contextUser}, db) => {
        if (id !== contextUser._id.toHexString()) {
          throw new CustomError('Can\'t update user', 'INSUFFICIENT_PERMISSIONS')
        }
        const user = await db.user(contextUser._id)
        if (!user || user.deleted) {
          return ({deleted: 0})
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
          range: {
            first: null,
            last: null
          },
          slots: {
            num: 24,
            size: 60,
            start: 0
          },
          userRestrictions: {
            maxBookingMinutes: 0,
            maxDailyBookingMinutes: 0
          },
          weekdays: {
            mon: true,
            tue: true,
            wed: true,
            thu: true,
            fri: true,
            sat: true,
            sun: true
          },
          timezone
        })
        return await assert(db.thang(id))
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
      })
  }
}

export default makeExecutableSchema({typeDefs, resolvers})
