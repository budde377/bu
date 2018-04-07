// @flow
import { graphql } from 'graphql'
import schema from '../schema'
import faker from 'faker'
import type { User } from '../../db'
import * as db from '../../db'

import { userPicture } from '../../util/communications'

jest.mock('../../db')

function fakeUser (): User {
  const givenName = faker.name.firstName()
  const familyName = faker.name.lastName()
  const name = `${givenName} ${familyName}`
  return {
    name,
    emailVerified: false,
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

const user1 = fakeUser()
const user2 = fakeUser()
const users = [
  user1, user2
]
// $FlowFixMe
db.user.mockImplementation((email) => Promise.resolve(users.find(u => u.email === email) || null))
// $FlowFixMe
db.userFromId.mockImplementation((id) => Promise.resolve(users.find(u => u.id === id) || null))
// $FlowFixMe
db.userThangs.mockReturnValue([])
// $FlowFixMe
db.userCollections.mockReturnValue([])

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
