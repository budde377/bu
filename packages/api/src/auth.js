// @flow
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import jwkToPem from 'jwk-to-pem'
import fetch from 'node-fetch'
import type { Picture, User } from './db'
import { createUser, updateUser, user } from './db'
import LRU from 'lru-cache'
import config from 'config'
import { logError } from './util/error'

const uuidv4 = require('uuid/v4')

const cache = LRU(config.auth.cache)

const client = jwksClient(config.auth.jwks)

async function verify (token: string): Promise<boolean> {
  const key = await getKey()
  return new Promise(resolve => {
    jwt.verify(token, key,
      config.auth.verify,
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
  picture: ?Picture,
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

const fetchCache: { [string]: Promise<?Profile> } = {}

function cachedFetchProfile (token: string): Promise<?Profile> {
  if (fetchCache[token]) {
    return fetchCache[token]
  }
  const res = fetchProfile(token)
  fetchCache[token] = res
  res.then(res => {
    if (fetchCache[token] !== res) {
      return
    }
    delete fetchCache[token]
  })
  return res
}

async function fetchPicture (url: string): Promise<?Picture> {
  try {
    const res = await fetch(url)
    const mime = res.headers.get('Content-Type')
    if (!mime) {
      return null
    }
    const data = await res.buffer()
    return {data, mime, fetched: Date.now()}
  } catch (err) {
    logError(err)
    return null
  }
}

async function fetchProfile (token: string): Promise<?Profile> {
  const res = await fetch(
    config.auth.userInfoUrl,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  const body: mixed = await res.json()
  if (!isObject(body)) {
    return null
  }
  const {
    name,
    nickname,
    sub: userId,
    picture: pictureUrl,
    email,
    email_verified: emailVerified,
    given_name: givenName,
    family_name: familyName
  } = body
  if (
    !isString(name) ||
    !isString(nickname) ||
    !isString(userId) ||
    !isString(pictureUrl) ||
    !isString(email) ||
    !isBoolean(emailVerified) ||
    (givenName !== undefined && !isString(givenName)) ||
    (familyName !== undefined && !isString(familyName))
  ) {
    return null
  }
  const picture = name !== email
    ? await fetchPicture(pictureUrl)
    : null
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
  const u = await user(profile.email)
  if (u && profile.email === profile.name) {
    return u.id
  }
  if (u) {
    await updateUser(u.email, profile)
    return u.id
  }
  const timezone = config.defaultTimezone
  const id = uuidv4()
  await createUser({...profile, id, timezone})
  return id
}

export async function tokenToUser (token: string): Promise<?User> {
  // Validate token
  const valid = await verify(token)
  if (!valid) {
    return null
  }
  // Fetch external profile
  const profile = await cachedFetchProfile(token)
  if (!profile) {
    return null
  }
  // Create or update the user
  await createOrUpdateUser(profile)
  // If the email was verified is relative to the token
  return {...await user(profile.email), emailVerified: profile.emailVerified}
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
