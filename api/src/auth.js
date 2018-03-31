// @flow
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import jwkToPem from 'jwk-to-pem'
import request from 'superagent'
import type { User } from './db'
import { createUser, updateUser, user, userFromEmail } from './db'
import LRU from 'lru-cache'

const cache = LRU({
  max: 3000
})

const jwksConfig = {
  strictSsl: true,
  jwksUri: 'https://thang.eu.auth0.com/.well-known/jwks.json'
}

const client = jwksClient(jwksConfig)

async function verify (token: string): Promise<boolean> {
  const key = await getKey()
  return new Promise(resolve => {
    jwt.verify(token, key,
      {
        algorithms: ['RS256'],
        audience: 'https://api.thang.io/',
        issuer: 'https://thang.eu.auth0.com/'
      },
      err => resolve(!err))
  })
}

function getKey () {
  return new Promise((resolve, reject) => {
    client.getKeys((err, data) => {
      if (err) {
        return reject(err)
      }
      if (!data[0]) {
        return
      }
      resolve(jwkToPem(data[0]))
    })
  })
}

type Profile = {
  name: string,
  nickname: string,
  picture: string,
  userId: string,
  email: string,
  emailVerified: boolean,
  givenName: ?string,
  familyName: ?string
}

function isObject (a): boolean %checks {
  return typeof a === 'object' && !!a
}

function isString (a): boolean %checks {
  return typeof a === 'string'
}

function isBoolean (a): boolean %checks {
  return typeof a === 'boolean'
}

async function fetchProfile (token: string): Promise<?Profile> {
  const {body}: { body: mixed } = await request
    .get('https://thang.eu.auth0.com/userinfo')
    .set('Authorization', `Bearer ${token}`)
  if (!isObject(body)) {
    return null
  }
  const {
    name,
    nickname,
    sub: userId,
    picture,
    email,
    email_verified: emailVerified,
    given_name: givenName,
    family_name: familyName
  } = body
  if (
    !isString(name) ||
    !isString(nickname) ||
    !isString(userId) ||
    !isString(picture) ||
    !isString(email) ||
    !isBoolean(emailVerified) ||
    (givenName !== undefined && !isString(givenName)) ||
    (familyName !== undefined && !isString(familyName))
  ) {
    return null
  }
  return {
    name,
    nickname,
    userId,
    picture,
    email,
    emailVerified,
    givenName: givenName || null,
    familyName: familyName || null
  }
}

async function createOrUpdateUser (profile: Profile): Promise<string> {
  const user = await userFromEmail(profile.email)
  if (user) {
    await updateUser(user.id, profile)
    return user.id
  }
  const timezone = 'Europe/Copenhagen'
  return await createUser({...profile, timezone})
}

export async function tokenToUser (token: string): Promise<?User> {
  const valid = await verify(token)
  if (!valid) {
    return null
  }
  const profile = await fetchProfile(token)
  if (!profile) {
    return null
  }
  const id = await createOrUpdateUser(profile)
  return user(id)
}

export async function cachedTokenToUser (token: string): Promise<?User> {
  const cached = cache.get(token)
  if (cached) {
    return cached
  }
  const user = await tokenToUser(token)
  if (!user) {
    return user
  }
  cache.set(token, user)
  return user
}
