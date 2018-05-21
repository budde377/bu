// @flow
import { graphql } from 'graphql'
import schema from '../schema'
import faker from 'faker'
import type { User, Thang, Booking } from '../../db'
import * as db from '../../db'

import { userPicture } from '../../util/communications'
import { dtToTimestamp } from '../../util/dt'
import { booking } from '../../db'
import * as auth from '../../auth'

jest.mock('../../auth')

function fakeUser (): User {
  const givenName = faker.name.firstName()
  const familyName = faker.name.lastName()
  const name = `${givenName} ${familyName}`
  return {
    name,
    emailVerified: true,
    email: faker.internet.email(),
    familyName,
    givenName,
    nickname: faker.internet.userName(),
    picture: null,
    id: faker.random.uuid(),
    timezone: 'America/New_York',
    userId: faker.internet.userName()
  }
}

async function createThang (owner: User): Promise<Thang> {
  const id = await db.createThang({
    name: faker.commerce.productName(),
    collection: null,
    owners: [owner.email],
    timezone: owner.timezone,
    users: [owner.email]
  })
  const t = await db.thang(id)
  if (!t) {
    throw new Error('WATTT')
  }
  return t
}

async function createBooking (thang: Thang, owner: User): Promise<Booking> {
  const id = await db.createBooking({
    owner: owner.email,
    thang: thang.id,
    from: {year: 2017, month: 1, day: 1, hour: 1, minute: 1},
    fromTime: new Date(dtToTimestamp({year: 2017, month: 1, day: 1, hour: 1, minute: 1}) || 0),
    to: {year: 2017, month: 1, day: 1, hour: 2, minute: 1},
    toTime: new Date(dtToTimestamp({year: 2017, month: 1, day: 1, hour: 2, minute: 1}) || 0),
  })
  const b = await booking(id)
  if (!b) {
    throw new Error('WATTT')
  }
  return b
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

function buildContext (user = null, profile = {emailVerified: true}) {
  return {userProfile: user ? {user, profile} : null}
}

describe('schema', () => {
  let user1
  let user2
  let user3
  let thang
  let booking
  beforeAll(async () => {
    await db.reset()
  })
  beforeEach(async () => {
    user1 = fakeUser()
    await db.createUser(user1)
    user2 = fakeUser()
    await db.createUser(user2)
    user3 = fakeUser()
    await db.createUser(user3)
    thang = await createThang(user2)
    booking = await createBooking(thang, user1)
  })

  describe('query: me', () => {
    const meQuery = `
      query {
        me {
          id
          name
          nickname
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
            name: user1.name,
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [],
            displayName: user1.givenName || user1.nickname,
            emailVerified: user1.emailVerified,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1.id,
            nickname: user1.nickname,
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
            name: user1.name,
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [],
            displayName: user1.givenName || user1.nickname,
            emailVerified: false,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1.id,
            nickname: user1.nickname,
            picture: userPicture(user1),
            timezone: user1.timezone
          }
        }
      })
    })
  })

  describe('query: user', () => {
    const q = ({id = user1.id, email}: { email?: string, id?: string } = {}) => `
      query {
        user${id || email ? '(' : ''}${id ? 'id: "' + id + '"' : ''}${email && id ? ',' : ''}${email ? 'email: "' + email + '"' : ''}${id || email ? ')' : ''} {
          id
          name
          nickname
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
            id: user1.id,
            name: null,
            picture: userPicture(user1),
            displayName: user1.givenName || user1.nickname,
            collections: [],
            thangs: [],
            bookings: [],
            timezone: null,
            nickname: null,
            givenName: null,
            familyName: null
          }
        }
      })
    })
    it('should not fetch too much on other user', async () => {
      const result = await graphql(schema, q({id: user2.id}), {}, buildContext(user1))
      expect(result).toEqual({
        data: {
          user: {
            email: null,
            emailVerified: null,
            id: user2.id,
            name: null,
            picture: userPicture(user2),
            displayName: user2.givenName || user2.nickname,
            collections: [],
            thangs: [],
            bookings: [],
            timezone: null,
            nickname: null,
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
            id: user1.id,
            name: null,
            picture: userPicture(user1),
            displayName: user1.givenName || user1.nickname,
            collections: [],
            thangs: [],
            bookings: [],
            timezone: null,
            nickname: null,
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
            name: user1.name,
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [{id: booking.id}],
            displayName: user1.givenName || user1.nickname,
            emailVerified: user1.emailVerified,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1.id,
            nickname: user1.nickname,
            picture: userPicture(user1),
            timezone: user1.timezone
          }
        }
      })
    })
    it('should fetch thangs on self', async () => {
      const result = await graphql(schema, q({id: user2.id}), {}, buildContext(user2))
      expect(result).toEqual({
        data: {
          user: {
            name: user2.name,
            email: user2.email,
            collections: [],
            bookings: [],
            thangs: [{id: thang.id}],
            displayName: user2.givenName || user2.nickname,
            emailVerified: user2.emailVerified,
            familyName: user2.familyName,
            givenName: user2.givenName,
            id: user2.id,
            nickname: user2.nickname,
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
            name: user1.name,
            email: user1.email,
            collections: [],
            thangs: [],
            bookings: [{id: booking.id}],
            displayName: user1.givenName || user1.nickname,
            emailVerified: user1.emailVerified,
            familyName: user1.familyName,
            givenName: user1.givenName,
            id: user1.id,
            nickname: user1.nickname,
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
    const q = (id) => `
    query {
      thang(id: "${id}") {
        name
        id
      }
    }
    `
    let thang
    beforeEach(async () => {
      const id = await db.createThang({
        owners: [user1.email],
        users: [user1.email],
        timezone: user1.timezone,
        name: 'Foobar',
        collection: null
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
      const result = await graphql(schema, q(thang.id), {}, buildContext())
      expect(result).toEqual({
        data: {
          thang: {
            id: thang.id,
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
      expect(result).toEqual({data: {sendVerificationEmail: {sent: 0}}})
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

  describe('mutation: createBooking', () => {
    let year = (new Date()).getFullYear()
    const createBooking = (id = 'baz', from = `{hour: 1, minute: 1, day: 1, month: 1, year: ${year + 1}}`, to = `{hour: 2, minute: 1, day: 1, month: 1, year: ${year + 1}}`) => `
    mutation {
      createBooking(thang: "${id}", from: ${from}, to: ${to}) {
        id
        owner {
          id
        }
        thang {
          bookings(input: {from: ${from}, to: ${to}}) {
            id
          }
        }
      }
    }
  `
    it('should fail on not logged in', async () => {
      const from = `{hour: 1, minute: 1, day: 27, month: 2, year: ${year + 2000}}`
      const to = `{hour: 1, minute: 1, day: 30, month: 2, year: ${year + 2000}}`
      const result = await graphql(schema, createBooking('bas', from, to), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on invalid thang id', async () => {
      const from = `{hour: 1, minute: 1, day: 27, month: 2, year: ${year + 2001}}`
      const to = `{hour: 1, minute: 1, day: 30, month: 2, year: ${year + 2001}}`
      const result = await graphql(schema, createBooking('bas', from, to), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('NOT_FOUND')
    })
    it('should create booking', async () => {
      // $FlowFixMe
      const from = `{hour: 1, minute: 1, day: 27, month: 2, year: ${year + 2002}}`
      const to = `{hour: 1, minute: 1, day: 28, month: 2, year: ${year + 2002}}`
      // $FlowFixMe
      const result = await graphql(schema, createBooking(thang.id, from, to), {}, buildContext(user1))
      expect(result.data).toBeTruthy()
      expect(result.data.createBooking.owner).toEqual({id: user1.id})
      expect(result.data.createBooking.thang.bookings).toEqual([{id: result.data.createBooking.id}])
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, createBooking(), {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
    it('should fail invalid from date', async () => {
      const from = `{hour: 1, minute: 1, day: 30, month: 2, year: ${year + 2010}}`
      const to = `{hour: 1, minute: 1, day: 30, month: 3, year: ${year + 2010}}`
      const result = await graphql(schema, createBooking(thang.id, from, to), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail invalid to date', async () => {
      const from = `{hour: 1, minute: 1, day: 27, month: 2, year: ${year + 2010}}`
      const to = `{hour: 1, minute: 1, day: 30, month: 2, year: ${year + 2010}}`
      const result = await graphql(schema, createBooking(thang.id, from, to), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail with from after to', async () => {
      const from = `{hour: 1, minute: 1, day: 1, month: 2, year: ${year + 2010}}`
      const to = `{hour: 1, minute: 1, day: 1, month: 1, year: ${year + 2010}}`
      const result = await graphql(schema, createBooking(thang.id, from, to), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail with from eq to to', async () => {
      const from = `{hour: 1, minute: 1, day: 1, month: 1, year: ${year + 2010}}`
      const to = `{hour: 1, minute: 1, day: 1, month: 1, year: ${year + 2010}}`
      const result = await graphql(schema, createBooking(thang.id, from, to), {}, buildContext(user1))
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_INPUT')
    })
    it('should fail with overlap', async () => {
      const from1 = `{hour: 1, minute: 1, day: 1, month: 2, year: ${year + 2020}}`
      const to1 = `{hour: 1, minute: 1, day: 2, month: 2, year: ${year + 2020}}`
      const r1 = await graphql(schema, createBooking(thang.id, from1, to1), {}, buildContext(user1))
      expect(r1.data).toBeTruthy()
      const from2 = `{hour: 1, minute: 1, day: 1, month: 1, year: ${year + 2020}}`
      const to2 = `{hour: 1, minute: 1, day: 1, month: 3, year: ${year + 2020}}`
      const r2 = await graphql(schema, createBooking(thang.id, from2, to2), {}, buildContext(user1))
      // $FlowFixMe
      expect(r2).toFailWithCode('DUPLICATE')
    })
    it('should fail with overlap 2', async () => {
      const from1 = `{hour: 1, minute: 1, day: 1, month: 2, year: ${year + 2021}}`
      const to1 = `{hour: 1, minute: 1, day: 2, month: 2, year: ${year + 2021}}`
      const r1 = await graphql(schema, createBooking(thang.id, from1, to1), {}, buildContext(user1))
      expect(r1.data).toBeTruthy()
      const from2 = `{hour: 1, minute: 1, day: 1, month: 2, year: ${year + 2021}}`
      const to2 = `{hour: 1, minute: 1, day: 2, month: 2, year: ${year + 2021}}`
      const r2 = await graphql(schema, createBooking(thang.id, from2, to2), {}, buildContext(user1))
      // $FlowFixMe
      expect(r2).toFailWithCode('DUPLICATE')
    })
    it('should fail with overlap 4', async () => {
      const from1 = `{hour: 1, minute: 1, day: 1, month: 2, year: ${year + 2023}}`
      const to1 = `{hour: 1, minute: 1, day: 3, month: 2, year: ${year + 2023}}`
      const r1 = await graphql(schema, createBooking(thang.id, from1, to1), {}, buildContext(user1))
      expect(r1.data).toBeTruthy()
      const from2 = `{hour: 1, minute: 1, day: 1, month: 2, year: ${year + 2023}}`
      const to2 = `{hour: 1, minute: 1, day: 2, month: 2, year: ${year + 2023}}`
      const r2 = await graphql(schema, createBooking(thang.id, from2, to2), {}, buildContext(user1))
      // $FlowFixMe
      expect(r2).toFailWithCode('DUPLICATE')
    })
    it('should fail with time passed', async () => {
      const from1 = `{hour: 1, minute: 1, day: 1, month: 2, year: 2000}`
      const to1 = `{hour: 1, minute: 1, day: 3, month: 2, year: 2000}`
      const r1 = await graphql(schema, createBooking(thang.id, from1, to1), {}, buildContext(user1))
      // $FlowFixMe
      expect(r1).toFailWithCode('INVALID_INPUT')
    })
    it('should succeed with close to overlap', async () => {
      const from1 = `{hour: 1, minute: 1, day: 1, month: 2, year: ${year + 2024}}`
      const to1 = `{hour: 1, minute: 1, day: 3, month: 2, year: ${year + 2024}}`
      const r1 = await graphql(schema, createBooking(thang.id, from1, to1), {}, buildContext(user1))
      expect(r1.data).toBeTruthy()
      const from2 = `{hour: 1, minute: 1, day: 3, month: 2, year: ${year + 2024}}`
      const to2 = `{hour: 1, minute: 1, day: 6, month: 2, year: ${year + 2024}}`
      const r2 = await graphql(schema, createBooking(thang.id, from2, to2), {}, buildContext(user1))
      expect(r2.data).toBeTruthy()
    })
    it('should succeed with close to overlap 2', async () => {
      const from1 = `{hour: 1, minute: 1, day: 3, month: 2, year: ${year + 2024}}`
      const to1 = `{hour: 1, minute: 1, day: 6, month: 2, year: ${year + 2024}}`
      const r1 = await graphql(schema, createBooking(thang.id, from1, to1), {}, buildContext(user1))
      expect(r1.data).toBeTruthy()
      const from2 = `{hour: 1, minute: 1, day: 1, month: 2, year: ${year + 2024}}`
      const to2 = `{hour: 1, minute: 1, day: 3, month: 2, year: ${year + 2024}}`
      const r2 = await graphql(schema, createBooking(thang.id, from2, to2), {}, buildContext(user1))
      expect(r2.data).toBeTruthy()
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
      expect(result.data.createThang.users).toEqual([{id: user1.id}])
      expect(result.data.createThang.owners).toEqual([{id: user1.id}])
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
      expect(result.data.createThangCollection.owners).toEqual([{id: user1.id}])
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, createThangCollection(), {}, buildContext(user1, {emailVerified: false}))
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
  })
  describe('mutation: deleteBooking', () => {
    const deleteBooking = (id) => `
      mutation {
        deleteBooking(id: "${id}") {
          deleted
        }
      }
    `
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, deleteBooking(booking.id), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on not owner', async () => {
      const result = await graphql(schema, deleteBooking(booking.id), {}, buildContext(user3))
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should succeed when owner', async () => {
      const result = await graphql(schema, deleteBooking(booking.id), {}, buildContext(user1))
      expect(result).toEqual({data: {deleteBooking: {deleted: 1}}})
    })
    it('should succeed when thang owner', async () => {
      const result = await graphql(schema, deleteBooking(booking.id), {}, buildContext(user2))
      expect(result).toEqual({data: {deleteBooking: {deleted: 1}}})
    })
    it('should succeed no thang', async () => {
      const result = await graphql(schema, deleteBooking('foobar'), {}, buildContext(user2))
      expect(result).toEqual({data: {deleteBooking: {deleted: 0}}})
    })
  })
  describe('mutation: deleteThang', () => {
    const deleteThang = (id) => `
      mutation {
        deleteThang(id: "${id}") {
          deleted
        }
      }
    `
    let thang
    beforeEach(async () => {
      const id = await db.createThang({
        owners: [user1.email],
        users: [user1.email],
        timezone: user1.timezone,
        name: 'Foobar',
        collection: null
      })
      const b = await db.thang(id)
      if (!b) {
        throw new Error('WTF')
      }
      thang = b
    })
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, deleteThang(thang.id), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on not owner', async () => {
      const result = await graphql(schema, deleteThang(thang.id), {}, buildContext(user3))
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should succeed when owner', async () => {
      const result = await graphql(schema, deleteThang(thang.id), {}, buildContext(user1))
      expect(result).toEqual({data: {deleteThang: {deleted: 1}}})
    })
    it('should succeed no thang', async () => {
      const result = await graphql(schema, deleteThang('Foobar'), {}, buildContext(user2))
      expect(result).toEqual({data: {deleteThang: {deleted: 0}}})
    })
  })
  describe('mutation: deleteThang', () => {
    const deleteThangCollection = (id) => `
      mutation {
        deleteThangCollection(id: "${id}") {
          deleted
        }
      }
    `
    let thang
    beforeEach(async () => {
      const id = await db.createThangCollection({
        owners: [user1.email],
        name: 'Foobar'
      })
      const b = await db.thangCollection(id)
      if (!b) {
        throw new Error('WTF')
      }
      thang = b
    })
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, deleteThangCollection(thang.id), {}, buildContext())
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on not owner', async () => {
      const result = await graphql(schema, deleteThangCollection(thang.id), {}, buildContext(user3))
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should succeed when owner', async () => {
      const result = await graphql(schema, deleteThangCollection(thang.id), {}, buildContext(user1))
      expect(result).toEqual({data: {deleteThangCollection: {deleted: 1}}})
    })
    it('should succeed no thang', async () => {
      const result = await graphql(schema, deleteThangCollection('Foobar'), {}, buildContext(user2))
      expect(result).toEqual({data: {deleteThangCollection: {deleted: 0}}})
    })
  })
  describe('mutation: visitTang', () => {
    const visitThang = (id) => `
      mutation {
        visitThang(id: "${id}") {
          id
          thang {
            id
          }
        }
      }
    `
    let thang
    beforeAll(async () => {
      const id = await db.createThang({
        owners: [user1.email],
        users: [user1.email],
        timezone: user1.timezone,
        name: 'Foobar',
        collection: null
      })
      const b = await db.thang(id)
      if (!b) {
        throw new Error('WTF')
      }
      thang = b
    })
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, visitThang(thang.id), {}, {})
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on no such thang', async () => {
      const result = await graphql(schema, visitThang('foobar'), {}, buildContext(user2))
      // $FlowFixMe
      expect(result).toFailWithCode('NOT_FOUND')
    })
    it('should succeed when owner', async () => {
      // $FlowFixMe
      const result = await graphql(schema, visitThang(thang.id), {}, buildContext(user1))
      expect(result.data).toBeTruthy()
      expect(result.data.visitThang.thang).toEqual({
        id: thang.id
      })
    })
  })
})
