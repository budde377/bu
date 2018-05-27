// @flow
import { graphql, parse } from 'graphql'
import { subscribe } from 'graphql/subscription'
import schema from '../schema'
import faker from 'faker'
import DB, { type User, type Thang, type Booking, type ThangCollection, type WithoutIdAndTimestamps } from '../../db'
import { userPicture } from '../../util/communications'
import { dtToTimestamp, timestampToDt } from '../../util/dt'
import * as auth from '../../auth'
import type { Dt } from '../../util/dt'

jest.mock('../../auth')

function timeout (t) {
  return new Promise(resolve => setTimeout(() => resolve(), t))
}

function fakeUser (): WithoutIdAndTimestamps<User> {
  const givenName = faker.name.firstName()
  const familyName = faker.name.lastName()
  const email = faker.internet.email()
  return {
    email,
    familyName,
    deleted: false,
    givenName,
    timezone: 'America/New_York',
    profile: {
      name: `${givenName} ${familyName}`,
      nickname: givenName,
      picture: null,
      userId: faker.internet.userName(),
      email,
      emailVerified: true,
      givenName,
      familyName
    }
  }
}

expect.extend({
  toFailWithCode: (received, argument) => {
    const codes = (received.errors || []).map(e => e.originalError.extensions ? e.originalError.extensions.code : undefined).filter(i => i)
    const pass = !!codes.find(c => c === argument)
    const message = () => `expected codes ${codes.join(', ')} to contain ${argument}`
    return {
      message,
      pass
    }
  }
})

describe('schema', () => {
  let user1: User
  let user2: User
  let user3: User
  let thang1: Thang
  let thang2: Thang
  let booking: Booking
  let db
  const buildContext = (user = null, profile = {emailVerified: true}) => ({
    userProfile: user ? {user, profile} : null,
    db
  })

  const createUser = async (): Promise<User> => {
    const user = fakeUser()
    const _id = await db.createUser(user)
    const u = await db.user(_id)
    if (!u) {
      throw new Error('WATTT')
    }
    return u
  }

  const createThang = async (
    owner: User,
    {
      range = {
        first: null,
        last: null
      },
      weekdays = {
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: true,
        sun: true
      },
      userRestrictions = {
        maxBookingMinutes: 0,
        maxDailyBookingMinutes: 0
      },
      slots = {
        num: 24 * 60,
        size: 1,
        start: 0
      }
    } : any = {}): Promise<Thang> => {
    const id = await db.createThang({
      name: faker.commerce.productName(),
      collection: null,
      owners: [owner._id],
      deleted: false,
      timezone: owner.timezone,
      users: [owner._id],
      range: {first: range.first && new Date(dtToTimestamp(range.first) || 0), last: range.last && new Date(dtToTimestamp(range.last) || 0)},
      slots,
      userRestrictions,
      weekdays
    })
    const t = await db.thang(id)
    if (!t) {
      throw new Error('WATTT')
    }
    return t
  }

  const createBooking = async (thang: Thang, owner: User): Promise<Booking> => {
    const id = await db.createBooking({
      owner: owner._id,
      deleted: false,
      thang: thang._id,
      from: new Date(dtToTimestamp({year: 2017, month: 1, day: 1, hour: 1, minute: 1}) || 0),
      to: new Date(dtToTimestamp({year: 2017, month: 1, day: 1, hour: 2, minute: 1}) || 0),
    })
    const b = await db.booking(id)
    if (!b) {
      throw new Error('WATTT')
    }
    return b
  }

  beforeAll(async () => {
    db = new DB(`jest-test-db-${faker.random.uuid()}`)
  })
  beforeEach(async () => {
    user1 = await createUser()
    user2 = await createUser()
    user3 = await createUser()
    thang1 = await createThang(user2)
    thang2 = await createThang(user2)
    booking = await createBooking(thang1, user1)
  })

  describe('query: me', () => {
    const meQuery = `
      query {
        me {
          id
          givenName
          familyName
          displayName
          thangs {
            id
          }
          bookings(input: {from: {year: 2018, month: 1, day: 1, hour: 1, minute: 1}, to: {year: 2018, month: 1, day: 1, hour: 2, minute: 1}}) {
            id
          }
          picture
          collections {
            id
          }
          email
          emailVerified
          timezone
        }
      }
    `

    it('Should not retrieve me on not logged in', async () => {
      const result = await graphql(schema, meQuery, {}, buildContext())
      expect(result).toEqual({data: {me: null}})
    })
    it('Should retrieve on logged in', async () => {
      const result = await graphql(schema, meQuery, {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          me: {
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [],
            displayName: user1.givenName || user1.profile.nickname,
            emailVerified: user1.profile.emailVerified,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1._id.toString(),
            picture: userPicture(user1),
            timezone: user1.timezone
          }
        }
      })
    })
    it('Should retrieve emailVerified from context', async () => {
      const result = await graphql(schema, meQuery, {}, buildContext(user1, {emailVerified: false}))
      expect(result).toEqual({
        data: {
          me: {
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [],
            displayName: user1.givenName,
            emailVerified: false,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1._id.toString(),
            picture: userPicture(user1),
            timezone: user1.timezone
          }
        }
      })
    })
  })

  describe('query: user', () => {
    const q = ({id = user1._id.toHexString(), email}: { email?: string, id?: string } = {}) => `
      query {
        user${id || email ? '(' : ''}${id ? 'id: "' + id + '"' : ''}${email && id ? ',' : ''}${email ? 'email: "' + email + '"' : ''}${id || email ? ')' : ''} {
          id
          givenName
          familyName
          displayName
          thangs {
            id
          }
          bookings {
            id
          }
          picture
          collections {
            id
          }
          email
          emailVerified
          timezone
        }
      }
    `
    it('should not fetch too much on public', async () => {
      const result = await graphql(schema, q(), {}, buildContext())
      expect(result).toEqual({
        data: {
          user: {
            email: null,
            emailVerified: null,
            id: user1._id.toHexString(),
            picture: userPicture(user1),
            displayName: user1.givenName || user1.profile.nickname,
            collections: [],
            thangs: [],
            bookings: [],
            timezone: null,
            givenName: null,
            familyName: null
          }
        }
      })
    })
    it('should not fetch too much on other user', async () => {
      const result = await graphql(schema, q({id: user2._id.toHexString()}), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          user: {
            email: null,
            emailVerified: null,
            id: user2._id.toHexString(),
            picture: userPicture(user2),
            displayName: user2.givenName || user2.profile.nickname,
            collections: [],
            thangs: [],
            bookings: [],
            timezone: null,
            givenName: null,
            familyName: null
          }
        }
      })
    })
    it('should not fetch thang on other user', async () => {
      const result = await graphql(schema, q(), {}, buildContext(user2))
      expect(result).toEqual({
        data: {
          user: {
            email: null,
            emailVerified: null,
            id: user1._id.toHexString(),
            picture: userPicture(user1),
            displayName: user1.givenName || user1.profile.nickname,
            collections: [],
            thangs: [],
            bookings: [],
            timezone: null,
            givenName: null,
            familyName: null
          }
        }
      })
    })
    it('should fetch much on self', async () => {
      const result = await graphql(schema, q(), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          user: {
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [{id: booking._id.toHexString()}],
            displayName: user1.givenName || user1.profile.nickname,
            emailVerified: user1.profile.emailVerified,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1._id.toHexString(),
            picture: userPicture(user1),
            timezone: user1.timezone
          }
        }
      })
    })
    it('should not fetch deleted bookings on self', async () => {
      await db.deleteBooking(booking._id)
      const result = await graphql(schema, q(), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          user: {
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [],
            displayName: user1.givenName || user1.profile.nickname,
            emailVerified: user1.profile.emailVerified,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1._id.toHexString(),
            picture: userPicture(user1),
            timezone: user1.timezone
          }
        }
      })
    })
    it('should fetch thangs on self', async () => {
      const result = await graphql(schema, q({id: user2._id.toHexString()}), {}, buildContext(user2))
      expect(result).toEqual({
        data: {
          user: {
            email: user2.email,
            collections: [],
            bookings: [],
            thangs: [{id: thang1._id.toHexString()}, {id: thang2._id.toHexString()}],
            displayName: user2.givenName || user2.profile.nickname,
            emailVerified: user2.profile.emailVerified,
            familyName: user2.familyName,
            givenName: user2.givenName,
            id: user2._id.toHexString(),
            picture: userPicture(user2),
            timezone: user2.timezone
          }
        }
      })
    })
    it('should not fetch deleted thangs on self', async () => {
      await db.deleteThang(thang1._id)
      const result = await graphql(schema, q({id: user2._id.toHexString()}), {}, buildContext(user2))
      expect(result).toEqual({
        data: {
          user: {
            email: user2.email,
            collections: [],
            bookings: [],
            thangs: [{id: thang2._id.toHexString()}],
            displayName: user2.givenName || user2.profile.nickname,
            emailVerified: user2.profile.emailVerified,
            familyName: user2.familyName,
            givenName: user2.givenName,
            id: user2._id.toHexString(),
            picture: userPicture(user2),
            timezone: user2.timezone
          }
        }
      })
    })
    it('should fetch with email', async () => {
      const result = await graphql(schema, q({id: '', email: user1.email}), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          user: {
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [{id: booking._id.toHexString()}],
            displayName: user1.givenName || user1.profile.nickname,
            emailVerified: user1.profile.emailVerified,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1._id.toHexString(),
            picture: userPicture(user1),
            timezone: user1.timezone
          }
        }
      })
    })
    it('should fetch with email case insensitive', async () => {
      const result = await graphql(schema, q({id: '', email: user1.email.toUpperCase()}), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          user: {
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [{id: booking._id.toHexString()}],
            displayName: user1.givenName || user1.profile.nickname,
            emailVerified: user1.profile.emailVerified,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1._id.toHexString(),
            picture: userPicture(user1),
            timezone: user1.timezone
          }
        }
      })
    })
    it('should succeed on invalid id', async () => {
      const result = await graphql(schema, q({id: faker.random.uuid()}), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          user: null
        }
      })
    })
    it('should succeed on no id or email', async () => {
      const result = await graphql(schema, q({id: ''}), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          user: null
        }
      })
    })
  })

  describe('query: thang', () => {
    const q = (id: string) => `
    query {
      thang(id: "${id}") {
        name
        id
      }
    }
    `
    let thang: Thang
    beforeEach(async () => {
      const id = await db.createThang({
        owners: [user1._id],
        users: [user1._id],
        deleted: false,
        timezone: user1.timezone,
        name: 'Foobar',
        collection: null,
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
        }
      })
      const b = await db.thang(id)
      if (!b) {
        throw new Error('WTF')
      }
      thang = b
    })
    it('should return null on not found', async () => {
      const result = await graphql(schema, q('foobar'), {}, buildContext())
      expect(result).toEqual({data: {thang: null}})
    })
    it('should succeed', async () => {
      const result = await graphql(schema, q(thang._id.toHexString()), {}, buildContext())
      expect(result).toEqual({
        data: {
          thang: {
            id: thang._id.toHexString(),
            name: thang.name
          }
        }
      })
    })
  })

  describe('mutation: sendVerificationEmail', () => {
    beforeEach(() => {
      // $FlowFixMe this is mocked
      auth.sendVerificationEmail.mockClear()
    })
    const mutation = `
      mutation sendVerificationEmail {
          sendVerificationEmail {
              sent
          }
      }
    `
    it('should return right on success', async () => {
      // $FlowFixMe this is mocked
      auth.sendVerificationEmail.mockReturnValue({sent: 1})
      const result = await graphql(schema, mutation, {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe this is mocked
      expect(auth.sendVerificationEmail.mock.calls.length).toBe(1)
      expect(result).toEqual({data: {sendVerificationEmail: {sent: 1}}})
    })

    it('should return zero on email already verified', async () => {
      // $FlowFixMe this is mocked
      auth.sendVerificationEmail.mockReturnValue({sent: 1})
      const result = await graphql(schema, mutation, {}, buildContext(user1, {emailVerified: true}))
      // $FlowFixMe this is mocked
      expect(auth.sendVerificationEmail.mock.calls.length).toBe(0)
      expect(result).toEqual({data: {sendVerificationEmail: {sent: 0}}})
    })

    it('should return zero on user not logged in', async () => {
      // $FlowFixMe this is mocked
      auth.sendVerificationEmail.mockReturnValue({sent: 1})
      const result = await graphql(schema, mutation, {}, buildContext())
      // $FlowFixMe this is mocked
      expect(auth.sendVerificationEmail.mock.calls.length).toBe(0)
      // $FlowFixMe this is mocked
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })

    it('should return zero on return zero', async () => {
      // $FlowFixMe this is mocked
      auth.sendVerificationEmail.mockReturnValue({sent: 0})
      const result = await graphql(schema, mutation, {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe this is mocked
      expect(auth.sendVerificationEmail.mock.calls.length).toBe(1)
      expect(result).toEqual({data: {sendVerificationEmail: {sent: 0}}})
    })
  })

  describe('mutation: sendResetPasswordMail', () => {
    beforeEach(() => {
      // $FlowFixMe this is mocked
      auth.resetPasswordEmail.mockClear()
    })
    const mutation = `
      mutation {
          sendResetPasswordMail {
              sent
          }
      }
    `
    it('should return right on success', async () => {
      // $FlowFixMe this is mocked
      auth.resetPasswordEmail.mockReturnValue({sent: 1})
      const result = await graphql(schema, mutation, {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe this is mocked
      expect(auth.resetPasswordEmail.mock.calls.length).toBe(1)
      expect(result).toEqual({data: {sendResetPasswordMail: {sent: 1}}})
    })

    it('should return zero on user not logged in', async () => {
      // $FlowFixMe this is mocked
      auth.resetPasswordEmail.mockReturnValue({sent: 1})
      const result = await graphql(schema, mutation, {}, buildContext())
      // $FlowFixMe this is mocked
      expect(auth.resetPasswordEmail.mock.calls.length).toBe(0)
      // $FlowFixMe this is mocked
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })

    it('should return zero on return zero', async () => {
      // $FlowFixMe this is mocked
      auth.resetPasswordEmail.mockReturnValue({sent: 0})
      const result = await graphql(schema, mutation, {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe this is mocked
      expect(auth.resetPasswordEmail.mock.calls.length).toBe(1)
      expect(result).toEqual({data: {sendResetPasswordMail: {sent: 0}}})
    })
  })

  describe('mutation: createBooking', () => {
    let year = (new Date()).getFullYear()

    const source = `
    mutation($thang: ID!, $from: DateTimeInput!, $to: DateTimeInput!){
      createBooking(thang: $thang, from: $from, to: $to) {
        id
        from {
          hour
          minute
          year
          day
          month
        }
        to {
          hour
          minute
          year
          day
          month
        }

        owner {
          id
        }
        thang {
          bookings(input: {from: $from, to: $to}) {
            id
          }
        }
      }
    }
    `

    it('should fail on not logged in', async () => {
      const from = {
        hour: 1,
        minute: 1,
        day: 27,
        month: 2,
        year: year + 2000
      }
      const to = {
        hour: 1,
        minute: 1,
        day: 30,
        month: 2,
        year: year + 2000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang: 'baz', from, to},
        contextValue: buildContext()
      })
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on invalid thang id', async () => {
      const from = {
        hour: 1,
        minute: 1,
        day: 27,
        month: 2,
        year: year + 2001
      }
      const to = {
        hour: 1,
        minute: 1,
        day: 30,
        month: 2,
        year: year + 2001
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang: 'baz', from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe
      expect(result).toFailWithCode('NOT_FOUND')
    })
    it('should create booking', async () => {
      const from = {
        hour: 1,
        minute: 1,
        day: 27,
        month: 2,
        year: year + 2002
      }
      const to = {
        hour: 1,
        minute: 1,
        day: 28,
        month: 2,
        year: year + 2002
      }
      // $FlowFixMe
      const result = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from, to},
        contextValue: buildContext(user1)
      })
      expect(result.data).toBeTruthy()
      expect(result.data.createBooking.from).toEqual({hour: 1, minute: 1, day: 27, month: 2, year: year + 2002})
      expect(result.data.createBooking.to).toEqual({hour: 1, minute: 1, day: 28, month: 2, year: year + 2002})
      expect(result.data.createBooking.owner).toEqual({id: user1._id.toString()})
      expect(result.data.createBooking.thang.bookings).toEqual([{id: result.data.createBooking.id}])
    })
    it('should create booking again', async () => {
      const from = {
        hour: 1,
        minute: 1,
        day: 27,
        month: 2,
        year: year + 2002
      }
      const to = {
        hour: 1,
        minute: 1,
        day: 28,
        month: 2,
        year: year + 2002
      }
      // $FlowFixMe
      const result = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from, to},
        contextValue: buildContext(user1)
      })
      expect(result.data).toBeTruthy()
      expect(result.data.createBooking.owner).toEqual({id: user1._id.toHexString()})
      expect(result.data.createBooking.thang.bookings).toEqual([{id: result.data.createBooking.id}])
      // $FlowFixMe
      await db.deleteBooking(db.id(result.data.createBooking.id))
      // $FlowFixMe
      const result2 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from, to},
        contextValue: buildContext(user1)
      })
      expect(result2.data).toBeTruthy()
      expect(result2.data.createBooking.owner).toEqual({id: user1._id.toHexString()})
      expect(result2.data.createBooking.thang.bookings).toEqual([{id: result2.data.createBooking.id}])
    })
    it('should fail on email not verified', async () => {
      const from = {
        hour: 1,
        minute: 1,
        day: 27,
        month: 2,
        year: year + 2002
      }
      const to = {
        hour: 1,
        minute: 1,
        day: 28,
        month: 2,
        year: year + 2002
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from, to},
        contextValue: buildContext(user1, {emailVerified: false})
      })
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
    it('should fail invalid from date', async () => {
      const from = {hour: 1, minute: 1, day: 30, month: 2, year: year + 2010}
      const to = {hour: 1, minute: 1, day: 30, month: 3, year: year + 2010}
      const result = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail invalid to date', async () => {
      const from = {hour: 1, minute: 1, day: 27, month: 2, year: year + 2010}
      const to = {hour: 1, minute: 1, day: 30, month: 2, year: year + 2010}
      const result = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail with from after to', async () => {
      const from = {hour: 1, minute: 1, day: 1, month: 2, year: year + 2010}
      const to = {hour: 1, minute: 1, day: 1, month: 1, year: year + 2010}
      const result = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail with from eq to to', async () => {
      const from = {hour: 1, minute: 1, day: 1, month: 1, year: year + 2010}
      const to = {hour: 1, minute: 1, day: 1, month: 1, year: year + 2010}
      const result = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail with overlap', async () => {
      const from1 = {hour: 1, minute: 1, day: 1, month: 2, year: year + 2020}
      const to1 = {hour: 1, minute: 1, day: 2, month: 2, year: year + 2020}
      const r1 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from1, to: to1},
        contextValue: buildContext(user1)
      })
      expect(r1.data).toBeTruthy()
      const from2 = {hour: 1, minute: 1, day: 1, month: 1, year: year + 2020}
      const to2 = {hour: 1, minute: 1, day: 1, month: 3, year: year + 2020}
      const r2 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from2, to: to2},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe
      expect(r2).toFailWithCode('DUPLICATE')
    })
    it('should fail with overlap 2', async () => {
      const from1 = {hour: 1, minute: 1, day: 1, month: 2, year: year + 2021}
      const to1 = {hour: 1, minute: 1, day: 2, month: 2, year: year + 2021}
      const r1 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from1, to: to1},
        contextValue: buildContext(user1)
      })
      expect(r1.data).toBeTruthy()
      const from2 = {hour: 1, minute: 1, day: 1, month: 2, year: year + 2021}
      const to2 = {hour: 1, minute: 1, day: 2, month: 2, year: year + 2021}
      const r2 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from2, to: to2},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe
      expect(r2).toFailWithCode('DUPLICATE')
    })
    it('should fail with overlap 4', async () => {
      const from1 = {hour: 1, minute: 1, day: 1, month: 2, year: year + 2023}
      const to1 = {hour: 1, minute: 1, day: 3, month: 2, year: year + 2023}
      const r1 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from1, to: to1},
        contextValue: buildContext(user1)
      })
      expect(r1.data).toBeTruthy()
      const from2 = {hour: 1, minute: 1, day: 1, month: 2, year: year + 2023}
      const to2 = {hour: 1, minute: 1, day: 2, month: 2, year: year + 2023}
      const r2 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from2, to: to2},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe
      expect(r2).toFailWithCode('DUPLICATE')
    })
    it('should fail with time passed', async () => {
      const from1 = {hour: 1, minute: 1, day: 1, month: 2, year: 2000}
      const to1 = {hour: 1, minute: 1, day: 3, month: 2, year: 2000}
      const r1 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from1, to: to1},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe
      expect(r1).toFailWithCode('INVALID_INPUT')
    })
    it('should succeed with close to overlap', async () => {
      const from1 = {hour: 1, minute: 1, day: 1, month: 2, year: year + 2024}
      const to1 = {hour: 1, minute: 1, day: 3, month: 2, year: year + 2024}
      const r1 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from1, to: to1},
        contextValue: buildContext(user1)
      })
      expect(r1.data).toBeTruthy()
      const from2 = {hour: 1, minute: 1, day: 3, month: 2, year: year + 2024}
      const to2 = {hour: 1, minute: 1, day: 6, month: 2, year: year + 2024}
      const r2 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from2, to: to2},
        contextValue: buildContext(user1)
      })
      expect(r2.data).toBeTruthy()
    })
    it('should succeed with close to overlap 2', async () => {
      const from1 = {hour: 1, minute: 1, day: 3, month: 2, year: year + 2024}
      const to1 = {hour: 1, minute: 1, day: 6, month: 2, year: year + 2024}
      const r1 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from1, to: to1},
        contextValue: buildContext(user1)
      })
      expect(r1.data).toBeTruthy()
      const from2 = {hour: 1, minute: 1, day: 1, month: 2, year: year + 2024}
      const to2 = {hour: 1, minute: 1, day: 3, month: 2, year: year + 2024}
      const r2 = await graphql({
        schema,
        source,
        variableValues: {thang: thang1._id.toHexString(), from: from2, to: to2},
        contextValue: buildContext(user1)
      })
      expect(r2.data).toBeTruthy()
    })
    it('should not be possible to create booking on invalid weekday', async () => {
      const weekdays = ({
        mon: true,
        tue: true,
        wed: false,
        thu: true,
        fri: true,
        sat: true,
        sun: true
      })
      const {_id: thang} = await createThang(user1, {weekdays})
      const from = {
        hour: 10,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 11,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should not be possible to create booking on invalid weekday 2', async () => {
      const weekdays = ({
        mon: true,
        tue: true,
        wed: false,
        thu: true,
        fri: true,
        sat: true,
        sun: false
      })
      const {_id: thang} = await createThang(user1, {weekdays})
      const from = {
        hour: 10,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 11,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should not be possible to create booking on invalid weekday 3', async () => {
      const weekdays = ({
        mon: true,
        tue: true,
        wed: false,
        thu: true,
        fri: true,
        sat: true,
        sun: false
      })
      const {_id: thang} = await createThang(user1, {weekdays})
      const from = {
        hour: 10,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 11,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should not be possible to create booking after last', async () => {
      const range = ({
        last: {
          hour: 11,
          minute: 0,
          day: 1,
          month: 1,
          year: 3000
        },
        first: null
      })
      const {_id: thang} = await createThang(user1, {range})
      const from = {
        hour: 10,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 12,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should not be possible to create booking before first', async () => {
      const range = ({
        first: {
          hour: 11,
          minute: 0,
          day: 1,
          month: 1,
          year: 3000
        },
        last: null
      })
      const {_id: thang} = await createThang(user1, {range})
      const from = {
        hour: 10,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 12,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should not be possible to create booking exceeding daily limit', async () => {
      const userRestrictions = ({
        maxBookingMinutes: 0,
        maxDailyBookingMinutes: 120
      })
      const {_id: thang} = await createThang(user1, {userRestrictions})
      const from = {
        hour: 10,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 12,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from: {...from, hour: 13}, to: {...to, hour: 14}},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })

    it('should honor cross day', async () => {
      const userRestrictions = ({
        maxBookingMinutes: 0,
        maxDailyBookingMinutes: 120
      })
      const {_id: thang} = await createThang(user1, {userRestrictions})
      const from = {
        hour: 23,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 2,
        minute: 0,
        day: 2,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result.data).toBeTruthy()
    })

    it('should not be possible to create booking exceeding daily limit 2', async () => {
      const userRestrictions = ({
        maxBookingMinutes: 0,
        maxDailyBookingMinutes: 120
      })
      const {_id: thang} = await createThang(user1, {userRestrictions})
      const from = {
        hour: 23,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 2,
        minute: 1,
        day: 2,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })

    it('should not be possible to create booking exceeding limit', async () => {
      const userRestrictions = ({
        maxBookingMinutes: 120,
        maxDailyBookingMinutes: 0
      })
      const {_id: thang} = await createThang(user1, {userRestrictions})
      const from = {
        hour: 10,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 12,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from: {...from, hour: 13}, to: {...to, hour: 14}},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })

    it('should not be possible to create booking exceeding limit 2', async () => {
      const userRestrictions = ({
        maxBookingMinutes: 120,
        maxDailyBookingMinutes: 0
      })
      const {_id: thang} = await createThang(user1, {userRestrictions})
      const from = {
        hour: 10,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 12,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from: {...from, day: 2}, to: {...to, day: 2}},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })

    it('should not be possible to create booking breaking slots', async () => {
      const slots = ({
        num: 12,
        size: 40,
        start: 0
      })
      const {_id: thang} = await createThang(user1, {slots})
      const from = {
        hour: 0,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 1,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should not be possible to create booking breaking slots 2', async () => {
      const slots = ({
        num: 12,
        size: 40,
        start: 0
      })
      const {_id: thang} = await createThang(user1, {slots})
      const from = {
        hour: 0,
        minute: 10,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 1,
        minute: 20,
        day: 1,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail when exceeding number of slots', async () => {
      const slots = ({
        num: 1,
        size: 40,
        start: 0
      })
      const {_id: thang} = await createThang(user1, {slots})
      const from = {
        hour: 0,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 1,
        minute: 20,
        day: 1,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result).toFailWithCode('INVALID_INPUT')
    })

    it('should allow for cross day', async () => {
      const slots = ({
        num: 36,
        size: 40,
        start: 0
      })
      const {_id: thang} = await createThang(user1, {slots})
      const from = {
        hour: 0,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 1,
        minute: 20,
        day: 2,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result.data).toBeTruthy()
    })

    it('should be possible when choosing right stuff', async () => {
      const slots = ({
        num: 12,
        size: 40,
        start: 0
      })
      const {_id: thang} = await createThang(user1, {slots})
      const from = {
        hour: 0,
        minute: 0,
        day: 1,
        month: 1,
        year: 3000
      }
      const to = {
        hour: 1,
        minute: 20,
        day: 1,
        month: 1,
        year: 3000
      }
      const result = await graphql({
        schema,
        source,
        variableValues: {thang, from, to},
        contextValue: buildContext(user1)
      })
      // $FlowFixMe lol
      expect(result.data).toBeTruthy()
    })

  })
  describe('mutation: createThang', () => {
    const createThang = ({tz = 'Europe/Copenhagen', name = 'Foobar'}: { name?: string, tz?: string } = {}) => `
    mutation {
      createThang(name: "${name}"${tz ? ', timezone: "' + tz + '"' : ''}) {
        id
        timezone
        users {
          id
        }
        owners {
          id
        }
        collection {
          id
        }
      }
    }
  `
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, createThang(), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on invalid timezone', async () => {
      const result = await graphql(schema, createThang({tz: 'Asia/Wattistan'}), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on invalid name', async () => {
      const result = await graphql(schema, createThang({name: ''}), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should create thang', async () => {
      const result = await graphql(schema, createThang(), {}, buildContext(user1))
      expect(result.data).toBeTruthy()
    })
    it('should create thang with user timezone', async () => {
      // $FlowFixMe
      const result = await graphql(schema, createThang({tz: null}), {}, buildContext(user1))
      expect(result.data).toBeTruthy()
      expect(result.data.createThang.timezone).toBe(user1.timezone)
      expect(result.data.createThang.users).toEqual([{id: user1._id.toHexString()}])
      expect(result.data.createThang.owners).toEqual([{id: user1._id.toHexString()}])
      expect(result.data.createThang.collection).toBeNull()
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, createThang(), {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
  })
  describe('mutation: createThangCollection', () => {
    const createThangCollection = ({name = 'Foobar'}: { name?: string } = {}) => `
      mutation {
        createThangCollection(name: "${name}") {
          id
          owners {
            id
          }
          thangs {
            id
          }
        }
      }
    `
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, createThangCollection(), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on invalid name', async () => {
      const result = await graphql(schema, createThangCollection({name: ''}), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should create thang collection', async () => {
      // $FlowFixMe
      const result = await graphql(schema, createThangCollection(), {}, buildContext(user1))
      expect(result.data).toBeTruthy()
      expect(result.data.createThangCollection.thangs).toEqual([])
      expect(result.data.createThangCollection.owners).toEqual([{id: user1._id.toHexString()}])
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, createThangCollection(), {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
  })
  describe('mutation: deleteBooking', () => {
    const deleteBooking = (id: string) => `
      mutation {
        deleteBooking(id: "${id}") {
          deleted
        }
      }
    `
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, deleteBooking(booking._id.toHexString()), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, deleteBooking(booking._id.toHexString()), {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
    it('should fail on not owner', async () => {
      const result = await graphql(schema, deleteBooking(booking._id.toHexString()), {}, buildContext(user3))
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should succeed when owner', async () => {
      const result = await graphql(schema, deleteBooking(booking._id.toHexString()), {}, buildContext(user1))
      expect(result).toEqual({data: {deleteBooking: {deleted: 1}}})
    })
    it('should succeed when thang owner', async () => {
      const result = await graphql(schema, deleteBooking(booking._id.toHexString()), {}, buildContext(user2))
      expect(result).toEqual({data: {deleteBooking: {deleted: 1}}})
    })
    it('should succeed when already deleted', async () => {
      const result = await graphql(schema, deleteBooking(booking._id.toHexString()), {}, buildContext(user2))
      expect(result).toEqual({data: {deleteBooking: {deleted: 1}}})
      const result2 = await graphql(schema, deleteBooking(booking._id.toHexString()), {}, buildContext(user2))
      expect(result2).toEqual({data: {deleteBooking: {deleted: 0}}})
    })
    it('should succeed no thang', async () => {
      const result = await graphql(schema, deleteBooking('foobar'), {}, buildContext(user2))
      expect(result).toEqual({data: {deleteBooking: {deleted: 0}}})
    })
  })
  describe('mutation: deleteThang', () => {
    const deleteThang = (id: string) => `
      mutation {
        deleteThang(id: "${id}") {
          deleted
        }
      }
    `
    let thang: Thang
    beforeEach(async () => {
      const id = await db.createThang({
        owners: [user1._id],
        users: [user1._id],
        deleted: false,
        timezone: user1.timezone,
        name: 'Foobar',
        collection: null,
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
        }
      })
      const b = await db.thang(id)
      if (!b) {
        throw new Error('WTF')
      }
      thang = b
    })
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, deleteThang(thang._id.toHexString()), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, deleteThang(thang._id.toHexString()), {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
    it('should fail on not owner', async () => {
      const result = await graphql(schema, deleteThang(thang._id.toHexString()), {}, buildContext(user3))
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should succeed when owner', async () => {
      const result = await graphql(schema, deleteThang(thang._id.toHexString()), {}, buildContext(user1))
      expect(result).toEqual({data: {deleteThang: {deleted: 1}}})
    })
    it('should succeed when already deleted', async () => {
      const result = await graphql(schema, deleteThang(thang._id.toHexString()), {}, buildContext(user1))
      expect(result).toEqual({data: {deleteThang: {deleted: 1}}})
      const result2 = await graphql(schema, deleteThang(thang._id.toHexString()), {}, buildContext(user1))
      expect(result2).toEqual({data: {deleteThang: {deleted: 0}}})
    })
    it('should succeed no thang', async () => {
      const result = await graphql(schema, deleteThang('Foobar'), {}, buildContext(user2))
      expect(result).toEqual({data: {deleteThang: {deleted: 0}}})
    })
  })
  describe('mutation: updateUser', () => {
    const updateUser = (props: { id: string, givenName?: string, familyName?: string, timezone?: string }) => `
      mutation {
        updateUser(${Object.keys(props).map(k => `${k}: ${JSON.stringify(props[k])}`).join(', ')}) {
          givenName
          familyName
          timezone
        }
      }
    `
    it('should update nothing', async () => {
      const result = await graphql(schema, updateUser({id: user1._id.toHexString()}), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          updateUser: {
            givenName: user1.profile.givenName,
            familyName: user1.profile.familyName,
            timezone: user1.timezone
          }
        }
      })
    })
    it('should update givenName', async () => {
      const givenName = 'FooBar2000'
      const result = await graphql(schema, updateUser({
        id: user1._id.toHexString(),
        givenName
      }), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          updateUser: {
            givenName,
            familyName: user1.profile.familyName,
            timezone: user1.timezone
          }
        }
      })
    })
    it('should fail on empty given name', async () => {
      const givenName = ''
      const result = await graphql(schema, updateUser({
        id: user1._id.toHexString(),
        givenName
      }), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on empty given name 2', async () => {
      const givenName = ' '
      const result = await graphql(schema, updateUser({
        id: user1._id.toHexString(),
        givenName
      }), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should update familyName', async () => {
      const familyName = 'FooBar2000'
      const result = await graphql(schema, updateUser({
        id: user1._id.toHexString(),
        familyName
      }), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          updateUser: {
            givenName: user1.profile.givenName,
            familyName,
            timezone: user1.timezone
          }
        }
      })
    })
    it('should fail on empty family name', async () => {
      const familyName = ''
      const result = await graphql(schema, updateUser({
        id: user1._id.toHexString(),
        familyName
      }), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on empty family name 2', async () => {
      const familyName = ' '
      const result = await graphql(schema, updateUser({
        id: user1._id.toHexString(),
        familyName
      }), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should update timezone', async () => {
      const timezone = 'Europe/Copenhagen'
      const result = await graphql(schema, updateUser({id: user1._id.toHexString(), timezone}), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          updateUser: {
            givenName: user1.profile.givenName,
            familyName: user1.profile.familyName,
            timezone
          }
        }
      })
    })
    it('should fail on invalid timezone', async () => {
      const timezone = 'Foo/Bar'
      const result = await graphql(schema, updateUser({id: user1._id.toHexString(), timezone}), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, updateUser({id: user1._id.toHexString()}), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on other user', async () => {
      const result = await graphql(schema, updateUser({id: user2._id.toHexString()}), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should fail on invalid id', async () => {
      const result = await graphql(schema, updateUser({id: faker.random.uuid()}), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, updateUser({id: faker.random.uuid()}), {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
  })
  describe('mutation: updateThang', () => {
    const source = `
      mutation ut($id: ID!, $name: String, $timezone: String, $weekdays: WeekdayInput, $range: RangeInput, $slots: SlotInput, $userRestrictions: UserRestrictionInput) {
        updateThang(id: $id, name: $name, timezone: $timezone, weekdays: $weekdays, range: $range, slots: $slots, userRestrictions: $userRestrictions) {
          name
          timezone
          slots {
            start
            size
            num
          }
          weekdays {
            mon
            tue
            wed
            thu
            fri
            sat
            sun
          }
          range {
            first {
              hour
              minute
              day
              year
              month
            }
            last {
              hour
              minute
              day
              year
              month
            }
          }
          userRestrictions {
            maxBookingMinutes
            maxDailyBookingMinutes
          }
        }
      }
    `
    it('should update nothing', async () => {
      const result = await graphql({
        schema,
        source,
        contextValue: buildContext(user2),
        variableValues: {id: thang1._id.toHexString()}
      })
      expect(result).toEqual({
        data: {
          updateThang: {
            name: thang1.name,
            timezone: thang1.timezone,
            slots: thang1.slots,
            range: {
              first: null,
              last: null
            },
            userRestrictions: thang1.userRestrictions,
            weekdays: thang1.weekdays
          }
        }
      })
    })
    it('should update name', async () => {
      const name = 'FooBar2000'
      const result = await graphql({
        source, schema, contextValue: buildContext(user2), variableValues: {
          id: thang1._id.toHexString(),
          name
        }
      })
      expect(result).toEqual({
        data: {
          updateThang: {
            name,
            timezone: thang1.timezone,
            slots: thang1.slots,
            range: {
              first: null,
              last: null
            },
            userRestrictions: thang1.userRestrictions,
            weekdays: thang1.weekdays
          }
        }
      })
    })
    it('should fail on empty given name', async () => {
      const name = ''
      const result = await graphql({
        source, schema, contextValue: buildContext(user2), variableValues: {
          id: thang1._id.toHexString(),
          name
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on empty given name 2', async () => {
      const name = ' '
      const result = await graphql({
        source, schema, contextValue: buildContext(user2), variableValues: {
          id: thang1._id.toHexString(),
          name
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })

    it('should update timezone', async () => {
      const timezone = 'Europe/Copenhagen'
      const result = await graphql({
        source, schema, contextValue: buildContext(user2), variableValues: {
          id: thang1._id.toHexString(),
          timezone
        }
      })
      expect(result).toEqual({
        data: {
          updateThang: {
            name: thang1.name,
            timezone,
            slots: thang1.slots,
            range: {
              first: null,
              last: null
            },
            userRestrictions: thang1.userRestrictions,
            weekdays: thang1.weekdays
          }
        }
      })
    })
    it('should fail on invalid timezone', async () => {
      const timezone = 'Foo/Bar'
      const result = await graphql({
        source, schema, contextValue: buildContext(user2), variableValues: {
          id: thang1._id.toHexString(),
          timezone
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should update weekday', async () => {
      const weekdays = {
        mon: true,
        tue: false,
        wed: true,
        thu: false,
        fri: true,
        sat: false,
        sun: true
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          weekdays
        }
      })
      expect(result).toEqual({
        data: {
          updateThang: {
            name: thang1.name,
            weekdays,
            timezone: thang1.timezone,
            slots: thang1.slots,
            range: {
              first: null,
              last: null
            },
            userRestrictions: thang1.userRestrictions,
          }
        }
      })
    })
    it('should update first slot', async () => {
      const first = {
        hour: 1,
        minute: 10,
        day: 1,
        month: 1,
        year: 1
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          range: {first}
        }
      })
      expect(result).toEqual({
        data: {
          updateThang: {
            name: thang1.name,
            timezone: thang1.timezone,
            weekdays: thang1.weekdays,
            range: {
              first: first,
              last: null
            },
            slots: thang1.slots,
            userRestrictions: thang1.userRestrictions,
          }
        }
      })
    })
    it('should fail on invalid first slot', async () => {
      const first = {
        hour: 1,
        minute: 10,
        day: 1,
        month: 13,
        year: 1
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          range: {first}
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should update last slot', async () => {
      const last = {
        hour: 1,
        minute: 10,
        day: 1,
        month: 1,
        year: 1
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          range: {last}
        }
      })
      expect(result).toEqual({
        data: {
          updateThang: {
            name: thang1.name,
            weekdays: thang1.weekdays,
            timezone: thang1.timezone,
            range: {last, first: null},
            slots: thang1.slots,
            userRestrictions: thang1.userRestrictions,
          }
        }
      })
    })
    it('should fail on invalid last slot', async () => {
      const last = {
        hour: 1,
        minute: 10,
        day: 1,
        month: 13,
        year: 1
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          range: {last}
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on last slot before first slot', async () => {
      const last = {
        hour: 1,
        minute: 10,
        day: 1,
        month: 2,
        year: 1
      }
      const first = {
        hour: 1,
        minute: 10,
        day: 1,
        month: 3,
        year: 1
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          range: {
            last,
            first
          }
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should update userRestriction ', async () => {
      const userRestrictions = {
        maxBookingMinutes: 60,
        maxDailyBookingMinutes: 10
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          userRestrictions
        }
      })
      expect(result).toEqual({
        data: {
          updateThang: {
            timezone: thang1.timezone,
            name: thang1.name,
            weekdays: thang1.weekdays,
            userRestrictions,
            slots: thang1.slots,
            range: {
              first: null,
              last: null
            }
          }
        }
      })
    })
    it('should fail on below zero values', async () => {
      const userRestrictions = {
        maxBookingMinutes: -1,
        maxDailyBookingMinutes: -1
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          userRestrictions
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on not logged in', async () => {
      const result = await graphql({
        source, schema, contextValue: buildContext(), variableValues: {
          id: thang1._id.toHexString()
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on other user', async () => {
      const result = await graphql({
        source, schema, contextValue: buildContext(user1), variableValues: {
          id: thang2._id.toHexString()
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should fail on email not verified', async () => {
      const result = await graphql({
        source, schema, contextValue: buildContext(user2, {emailVerified: false}), variableValues: {
          id: thang2._id.toHexString()
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
    it('should update slot ', async () => {
      const slots = {
        size: 60,
        start: 10,
        num: 10
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          slots
        }
      })
      expect(result).toEqual({
        data: {
          updateThang: {
            timezone: thang1.timezone,
            name: thang1.name,
            weekdays: thang1.weekdays,
            slots,
            userRestrictions: thang1.userRestrictions,
            range: {
              first: null,
              last: null
            }
          }
        }
      })
    })
    it('should update slot onpoint ', async () => {
      const slots = {
        size: 60,
        start: 10,
        num: 12
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          slots
        }
      })
      expect(result).toEqual({
        data: {
          updateThang: {
            timezone: thang1.timezone,
            name: thang1.name,
            weekdays: thang1.weekdays,
            slots,
            userRestrictions: thang1.userRestrictions,
            range: {
              first: null,
              last: null
            }
          }
        }
      })
    })
    it('should fail on zero values', async () => {
      const slots = {
        size: 0,
        start: 0,
        num: 0
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          slots
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on below zero values', async () => {
      const slots = {
        size: -1,
        start: -1,
        num: -1
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          slots
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on larger than 24*60 sum 1', async () => {
      const slots = {
        size: 24 * 60 + 1,
        start: 0,
        num: 1
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          slots
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail on larger than 24*60 sum 1', async () => {
      const slots = {
        size: 24 * 30,
        start: 0,
        num: 3
      }
      const result = await graphql({
        source, schema,
        contextValue: buildContext(user2),
        variableValues: {
          id: thang1._id.toHexString(),
          slots
        }
      })
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
  })
  describe('mutation: deleteUser', () => {
    const deleteUser = (id: string) => `
      mutation {
        deleteUser(id: ${JSON.stringify(id)}) {
          deleted
        }
      }
    `
    beforeEach(() => {
      // $FlowFixMe this is mocked
      auth.deleteUser.mockClear()
    })

    it('should fail on not logged in', async () => {
      const result = await graphql(schema, deleteUser(user1._id.toHexString()), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, deleteUser(user1._id.toHexString()), {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
    it('should fail on other user', async () => {
      const result = await graphql(schema, deleteUser(user2._id.toHexString()), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should fail when user has collection', async () => {
      await db.createThangCollection({
        owners: [user1._id],
        name: 'Foobar',
        deleted: false
      })
      const result = await graphql(schema, deleteUser(user1._id.toHexString()), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail when user has thang', async () => {
      await db.createThang({
        collection: null,
        timezone: user1.timezone,
        users: [],
        deleted: false,
        owners: [user1._id],
        name: 'Foobar',
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
        }
      })
      const result = await graphql(schema, deleteUser(user1._id.toHexString()), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should succeed', async () => {
      // $FlowFixMe
      auth.deleteUser.mockReturnValue(Promise.resolve({deleted: 1}))
      const result = await graphql(schema, deleteUser(user1._id.toHexString()), {}, buildContext(user1))
      // $FlowFixMe
      expect(auth.deleteUser.mock.calls).toEqual([[user1.profile.userId]])
      expect(await db.user(user1._id)).toBeNull()
      expect(result).toEqual({
        data: {
          deleteUser: {
            deleted: 1
          }
        }
      })
    })
    it('should succeed when deleted from auth0', async () => {
      // $FlowFixMe
      auth.deleteUser.mockReturnValue(Promise.resolve({deleted: 0}))
      const result = await graphql(schema, deleteUser(user1._id.toHexString()), {}, buildContext(user1))
      // $FlowFixMe
      expect(auth.deleteUser.mock.calls).toEqual([[user1.profile.userId]])
      expect(await db.user(user1._id)).toBeNull()
      expect(result).toEqual({
        data: {
          deleteUser: {
            deleted: 1
          }
        }
      })
    })
    it('should succeed with already deleted', async () => {
      // $FlowFixMe
      auth.deleteUser.mockReturnValue(Promise.resolve({deleted: 0}))
      await graphql(schema, deleteUser(user1._id.toHexString()), {}, buildContext(user1))
      const result = await graphql(schema, deleteUser(user1._id.toHexString()), {}, buildContext(user1))
      // $FlowFixMe
      expect(auth.deleteUser.mock.calls).toEqual([[user1.profile.userId]])
      expect(await db.user(user1._id)).toBeNull()
      expect(result).toEqual({
        data: {
          deleteUser: {
            deleted: 0
          }
        }
      })
    })

  })
  describe('mutation: deleteThangCollection', () => {
    const deleteThangCollection = (id: string) => `
      mutation {
        deleteThangCollection(id: "${id}") {
          deleted
        }
      }
    `
    let collection: ThangCollection
    beforeEach(async () => {
      const id = await db.createThangCollection({
        owners: [user1._id],
        deleted: false,
        name: 'Foobar'
      })
      const b = await db.thangCollection(id)
      if (!b) {
        throw new Error('WTF')
      }
      collection = b
    })
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, deleteThangCollection(collection._id.toHexString()), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, deleteThangCollection(collection._id.toHexString()), {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
    it('should fail on not owner', async () => {
      const result = await graphql(schema, deleteThangCollection(collection._id.toHexString()), {}, buildContext(user3))
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should succeed when owner', async () => {
      const result = await graphql(schema, deleteThangCollection(collection._id.toHexString()), {}, buildContext(user1))
      expect(result).toEqual({data: {deleteThangCollection: {deleted: 1}}})
    })
    it('should succeed when already deleted', async () => {
      const result = await graphql(schema, deleteThangCollection(collection._id.toHexString()), {}, buildContext(user1))
      expect(result).toEqual({data: {deleteThangCollection: {deleted: 1}}})
      const result2 = await graphql(schema, deleteThangCollection(collection._id.toHexString()), {}, buildContext(user1))
      expect(result2).toEqual({data: {deleteThangCollection: {deleted: 0}}})
    })
    it('should succeed no thang', async () => {
      const result = await graphql(schema, deleteThangCollection('Foobar'), {}, buildContext(user2))
      expect(result).toEqual({data: {deleteThangCollection: {deleted: 0}}})
    })
  })

  describe('subscription: bookingsChange', () => {
    jest.setTimeout(10000)
    const bookingsChange = (id: string, from, to) => parse(`
      subscription {
        bookingsChange(thang: "${id}"${from && to ? `, input: {from: ${from}, to: ${to}}` : ''}) {
          add {
            id
          }
          remove
          update {
            id
          }
        }
      }
    `)

    it('should work on invalid id', async () => {
      const stream = await subscribe({
        schema,
        document: bookingsChange(faker.random.uuid()),
        contextValue: buildContext(user1)
      })
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const r = Promise.race([stream.next(), timeout(2000)])
      const booking = {
        from: new Date(Date.now() + 1000),
        to: new Date(Date.now() + 2000),
        owner: user1._id,
        thang: thang1._id,
        deleted: false
      }
      db.createBooking(booking)
      expect(await r).toBeFalsy()
    })
    it('should work on actual thang', async () => {
      const stream = await subscribe({
        schema,
        document: bookingsChange(thang1._id.toHexString()),
        contextValue: buildContext(user1)
      })
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const v = stream.next()
      await timeout(1000)
      const booking = {
        from: new Date(Date.now() + 1000),
        to: new Date(Date.now() + 2000),
        owner: user1._id,
        thang: thang1._id,
        deleted: false
      }
      const id = await db.createBooking(booking)
      expect(await v).toEqual({
        done: false,
        value: {
          data: {
            bookingsChange: {
              add: {id: id.toHexString()},
              remove: null,
              update: null
            }
          }
        }
      })
    })
    it('should be limited to thang', async () => {
      const stream = await subscribe({
        schema,
        document: bookingsChange(thang2._id.toHexString()),
        contextValue: buildContext(user1)
      })
      const booking = {
        from: new Date(Date.now() + 1000),
        to: new Date(Date.now() + 2000),
        owner: user1._id,
        thang: thang1._id,
        deleted: false
      }
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const r = Promise.race([stream.next(), timeout(2000)])
      db.createBooking(booking)
      expect(await r).toBeFalsy()
    })
    it('should be limited to time', async () => {
      const from = new Date(1527171676117)
      const to = new Date(1527171676117 + 2000)

      const stream = await subscribe({
        schema,
        document: bookingsChange(thang1._id.toHexString(), `{hour: 10, day: 24, month: 5, year: 2018, minute: 0}`, `{hour: 20, day: 24, month: 5, year: 2018, minute: 0}`),
        contextValue: buildContext(user1)
      })
      const booking = {
        from, to,
        owner: user1._id,
        thang: thang1._id,
        deleted: false
      }
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const r = Promise.race([stream.next(), timeout(5000)])
      // await timeout(1000)
      const id = await db.createBooking(booking)
      expect(await r).toEqual({
        done: false,
        value: {
          data: {
            bookingsChange: {
              add: {id: id.toHexString()},
              remove: null,
              update: null
            }
          }
        }
      })
    })
    it('should be limited to time 2', async () => {
      const from = new Date(1527171676117)
      const to = new Date(1527171676117 + 2000)

      const stream = await subscribe({
        schema,
        document: bookingsChange(thang1._id.toHexString(), `{hour: 10, day: 24, month: 5, year: 2019, minute: 0}`, `{hour: 20, day: 24, month: 5, year: 2019, minute: 0}`),
        contextValue: buildContext(user1)
      })
      const booking = {
        from, to,
        owner: user1._id,
        thang: thang1._id,
        deleted: false
      }
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const r = Promise.race([stream.next(), timeout(2000)])
      db.createBooking(booking)
      expect(await r).toBeFalsy()
    })
    it('should work on deletion', async () => {
      await timeout(1000)
      const stream = await subscribe({
        schema,
        document: bookingsChange(thang1._id.toHexString()),
        contextValue: buildContext(user1)
      })
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const v = stream.next()
      await db.deleteBooking(booking._id)
      expect(await v).toEqual({
        done: false,
        value: {
          data: {
            bookingsChange: {
              add: null,
              remove: booking._id.toHexString(),
              update: null
            }
          }
        }
      })
    })
  })
  describe('subscription: userThangChanges', () => {
    jest.setTimeout(10000)
    const thangChange = parse(`
      subscription {
        myThangsChange {
          add {
            id
          }
          remove
          update {
            id
          }
        }
      }
    `)

    it('should fail on not logged in ', async () => {
      const stream = await subscribe({
        schema,
        document: thangChange,
        contextValue: buildContext()
      })
      // $FlowFixMe lolz
      expect(stream).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should work on user logged in', async () => {
      const stream = await subscribe({
        schema,
        document: thangChange,
        contextValue: buildContext(user1)
      })
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const v = stream.next()
      await timeout(1000)
      const id = await db.createThang({
        collection: null,
        deleted: false,
        name: faker.name.findName(),
        owners: [user1._id],
        users: [],
        timezone: user1.timezone,
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
        }
      })
      expect(await v).toEqual({
        done: false,
        value: {
          data: {
            myThangsChange: {
              add: {id: id.toHexString()},
              remove: null,
              update: null
            }
          }
        }
      })
    })
    it('should work on deletion', async () => {
      await timeout(1000)
      // $FlowFixMe
      const stream = await subscribe({
        schema,
        document: thangChange,
        contextValue: buildContext(user2)
      })
      const v = stream.next()
      await db.deleteThang(thang1._id)
      expect(await v).toEqual({
        done: false,
        value: {
          data: {
            myThangsChange: {
              add: null,
              remove: thang1._id.toHexString(),
              update: null
            }
          }
        }
      })
      await stream.return()
    })
    it('should only work on my thangs', async () => {
      const stream = await subscribe({
        schema,
        document: thangChange,
        contextValue: buildContext(user1)
      })
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const r = Promise.race([stream.next(), timeout(2000)])
      await db.deleteThang(thang1._id)
      expect(await r).toBeFalsy()
    })
  })
  describe('subscription: thangChange', () => {
    jest.setTimeout(10000)
    const thangChange = (id: string) => parse(`
      subscription {
        thangChange(thang: "${id}") {
          add {
            id
          }
          remove
          update {
            id
            users {
              id
            }
          }
        }
      }
    `)

    it('should work on right id', async () => {
      const stream = await subscribe({
        schema,
        document: thangChange(thang1._id.toHexString()),
        contextValue: buildContext(user1)
      })
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const v = stream.next()
      await db.thangAddUser(thang1._id, user1._id)
      expect(await v).toEqual({
        done: false,
        value: {
          data: {
            thangChange: {
              update: {
                id: thang1._id.toHexString(), users: [
                  {id: user2._id.toHexString()},
                  {id: user1._id.toHexString()}
                ]
              },
              remove: null,
              add: null
            }
          }
        }
      })
    })
    it('should work on deletion', async () => {
      await timeout(1000)
      // $FlowFixMe
      const stream = await subscribe({
        schema,
        document: thangChange(thang1._id.toHexString()),
        contextValue: buildContext(user2)
      })
      const v = stream.next()
      await db.deleteThang(thang1._id)
      expect(await v).toEqual({
        done: false,
        value: {
          data: {
            thangChange: {
              add: null,
              remove: thang1._id.toHexString(),
              update: null
            }
          }
        }
      })
      await stream.return()
    })
    it('should only work on my thangs', async () => {
      const stream = await subscribe({
        schema,
        document: thangChange(thang2._id.toHexString()),
        contextValue: buildContext(user1)
      })
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const r = Promise.race([stream.next(), timeout(2000)])
      await db.thangAddUser(thang1._id, user1._id)
      expect(await r).toBeFalsy()
    })
    it('should only work on my thangs2', async () => {
      const stream = await subscribe({
        schema,
        document: thangChange(faker.random.uuid()),
        contextValue: buildContext(user1)
      })
      if (typeof stream.next !== 'function') {
        expect(true).toBe(false)
        return
      }
      const r = Promise.race([stream.next(), timeout(2000)])
      await db.thangAddUser(thang1._id, user1._id)
      expect(await r).toBeFalsy()
    })
  })
})
