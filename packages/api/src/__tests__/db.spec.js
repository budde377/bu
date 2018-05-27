// @flow
import Db from '../db'
import faker from 'faker'

describe('db', () => {
  let db: Db
  beforeAll(() => {
    db = new Db(`jest-test-db-${faker.random.uuid()}`)
  })
  describe('createUser', () => {
    it('should create', async () => {
      const res = await db.createUser({
        profile:
          {
            name: 'budde377@gmail.com',
            nickname: 'budde377',
            userId: 'auth0|5ac1321952b98d7c024327a6',
            picture: null,
            email: 'budde377@gmail.com',
            emailVerified: true,
            givenName: null,
            familyName: null
          },
        timezone: 'Europe/Copenhagen',
        familyName: null,
        givenName: null,
        email: 'budde377@gmail.com',
        deleted: false
      })

      expect(typeof res.toHexString()).toEqual('string')
    })
    it('should create with picture', async () => {
      const res = await db.createUser({
        profile:
          {
            name: 'budde377+2@gmail.com',
            nickname: 'budde377',
            userId: 'auth0|5ac1321952b98d7c024327a6',
            picture: {
              data: Buffer.from('Foobar'),
              mime: 'image/jpeg',
              fetched: new Date(1527459019842)
            },
            email: 'budde377@gmail.com',
            emailVerified: true,
            givenName: null,
            familyName: null
          },
        timezone: 'Europe/Copenhagen',
        familyName: null,
        givenName: null,
        email: 'budde377+2@gmail.com',
        deleted: false
      })

      expect(typeof res.toHexString()).toEqual('string')
    })
  })
})
