// @flow
import { graphql } from 'graphql'
import schema from '../schema'
import faker from 'faker'
import type { User, Thang } from '../../db'
import * as db from '../../db'

import { userPicture } from '../../util/communications'

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
    timezone: 'Europe/Copenhagen',
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
  const user1 = fakeUser()
  const user2 = fakeUser()
  const user3 = fakeUser()
  let thang

  beforeAll(async () => {
    await db.reset()
    await db.createUser(user1)
    await db.createUser(user2)
    await db.createUser(user3)
    thang = await createThang(user2)
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
      const result = await graphql(schema, meQuery, {}, {})
      expect(result).toEqual({data: {me: null}})
    })
    it('Should retrieve on logged in', async () => {
      const result = await graphql(schema, meQuery, {}, {currentUser: user1})
      expect(result).toEqual({
        data: {
          me: {
            name: user1.name,
            email: user1.email,
            collections: [],
            thangs: [],
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
  })

  describe('query: user', () => {
    const q = `
      query {
        user(id: "${user1.id}") {
          id
          name
          nickname
          givenName
          familyName
          displayName
          thangs {
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
      const result = await graphql(schema, q, {}, {})
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
            timezone: null,
            nickname: null,
            givenName: null,
            familyName: null
          }
        }
      })
    })
    it('should not fetch too much on other user', async () => {
      const result = await graphql(schema, q, {}, {currentUser: user2})
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
            timezone: null,
            nickname: null,
            givenName: null,
            familyName: null
          }
        }
      })
    })
    it('should fetch much on self', async () => {
      const result = await graphql(schema, q, {}, {currentUser: user1})
      expect(result).toEqual({
        data: {
          user: {
            name: user1.name,
            email: user1.email,
            collections: [],
            thangs: [],
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
  })

  describe('mutation: createBooking', () => {
    const createBooking = (id = 'baz') => `
    mutation {
      createBooking(thang: "${id}", from: {hour: 1, minute: 1, day: 1, month: 1, year: 2010}, to: {hour: 2, minute: 1, day: 1, month: 1, year: 2010}) {
        id
      }
    }
  `
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, createBooking(), {}, {})
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on invalid thang id', async () => {
      const result = await graphql(schema, createBooking(), {}, {currentUser: user1})
      // $FlowFixMe
      expect(result).toFailWithCode('THANG_NOT_FOUND')
    })
    it('should create booking', async () => {
      const result = await graphql(schema, createBooking(thang.id), {}, {currentUser: user1})
      expect(result.data).toBeTruthy()
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, createBooking(), {}, {currentUser: {...user1, emailVerified: false}})
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
    // TODO test date validity
  })
  describe('mutation: createThang', () => {
    const createThang = ({tz = 'Europe/Copenhagen', name = 'Foobar'}: { name?: string, tz?: string } = {}) => `
    mutation {
      createThang(name: "${name}", timezone: "${tz}") {
        id
      }
    }
  `
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, createThang(), {}, {})
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on invalid timezone', async () => {
      const result = await graphql(schema, createThang({tz: 'Asia/Wattistan'}), {}, {currentUser: user1})
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_TIMEZONE')
    })
    it('should fail on invalid name', async () => {
      const result = await graphql(schema, createThang({name: ''}), {}, {currentUser: user1})
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_NAME')
    })
    it('should create thang', async () => {
      const result = await graphql(schema, createThang(), {}, {currentUser: user1})
      expect(result.data).toBeTruthy()
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, createThang(), {}, {currentUser: {...user1, emailVerified: false}})
      // $FlowFixMe
      expect(result).toFailWithCode('USER_EMAIL_NOT_VERIFIED')
    })
  })
  describe('mutation: createThangCollection', () => {
    const createThangCollection = ({name = 'Foobar'}: { name?: string } = {}) => `
      mutation {
        createThangCollection(name: "${name}") {
          id
          thangs {
            id
          }
        }
      }
    `
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, createThangCollection(), {}, {})
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on invalid name', async () => {
      const result = await graphql(schema, createThangCollection({name: ''}), {}, {currentUser: user1})
      // $FlowFixMe
      expect(result).toFailWithCode('INVALID_NAME')
    })
    it('should create thang collection', async () => {
      // $FlowFixMe
      const result = await graphql(schema, createThangCollection(), {}, {currentUser: user1})
      expect(result.data).toBeTruthy()
      expect(result.data.createThangCollection.thangs).toEqual([])
    })
    it('should fail on email not verified', async () => {
      const result = await graphql(schema, createThangCollection(), {}, {currentUser: {...user1, emailVerified: false}})
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
    let booking
    beforeEach(async () => {
      const id = await db.createBooking({
        owner: user1.email,
        thang: thang.id,
        from: {year: 2017, month: 1, day: 1, hour: 1, minute: 1},
        to: {year: 2017, month: 1, day: 1, hour: 2, minute: 1}
      })
      const b = await db.booking(id)
      if (!b) {
        throw new Error('WTF')
      }
      booking = b
    })
    it('should fail on not logged in', async () => {
      const result = await graphql(schema, deleteBooking(booking.id), {}, {})
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on not owner', async () => {
      const result = await graphql(schema, deleteBooking(booking.id), {}, {currentUser: user3})
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should succeed when owner', async () => {
      const result = await graphql(schema, deleteBooking(booking.id), {}, {currentUser: user1})
      expect(result).toEqual({data: {deleteBooking: {deleted: 1}}})
    })
    it('should succeed when thang owner', async () => {
      const result = await graphql(schema, deleteBooking(booking.id), {}, {currentUser: user2})
      expect(result).toEqual({data: {deleteBooking: {deleted: 1}}})
    })
    it('should succeed no thang', async () => {
      const result = await graphql(schema, deleteBooking('foobar'), {}, {currentUser: user2})
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
      const result = await graphql(schema, deleteThang(thang.id), {}, {})
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on not owner', async () => {
      const result = await graphql(schema, deleteThang(thang.id), {}, {currentUser: user3})
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should succeed when owner', async () => {
      const result = await graphql(schema, deleteThang(thang.id), {}, {currentUser: user1})
      expect(result).toEqual({data: {deleteThang: {deleted: 1}}})
    })
    it('should succeed no thang', async () => {
      const result = await graphql(schema, deleteThang('Foobar'), {}, {currentUser: user2})
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
      const result = await graphql(schema, deleteThangCollection(thang.id), {}, {})
      // $FlowFixMe
      expect(result).toFailWithCode('USER_NOT_LOGGED_IN')
    })
    it('should fail on not owner', async () => {
      const result = await graphql(schema, deleteThangCollection(thang.id), {}, {currentUser: user3})
      // $FlowFixMe
      expect(result).toFailWithCode('INSUFFICIENT_PERMISSIONS')
    })
    it('should succeed when owner', async () => {
      const result = await graphql(schema, deleteThangCollection(thang.id), {}, {currentUser: user1})
      expect(result).toEqual({data: {deleteThangCollection: {deleted: 1}}})
    })
    it('should succeed no thang', async () => {
      const result = await graphql(schema, deleteThangCollection('Foobar'), {}, {currentUser: user2})
      expect(result).toEqual({data: {deleteThangCollection: {deleted: 0}}})
    })
  })
})
