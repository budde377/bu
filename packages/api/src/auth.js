// @flow
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import jwkToPem from 'jwk-to-pem'
import fetch from 'node-fetch'
import type { Picture, User } from './db/index'
import * as db from './db/index'
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

export type Profile = {|
  name: string,
  nickname: string,
  picture: ?Picture,
  userId: string,
  email: string,
  emailVerified: boolean,
  givenName: ?string,
  familyName: ?string
|}

export type UserProfile = {|
  user: User,
  profile: Profile
|}

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

let accessToken: ?{| token: string, expires: number |} = null

export async function fetchManagementToken (): Promise<?string> {
  if (accessToken && accessToken.expires > Date.now() + 60 * 1000) {
    return accessToken.token
  }
  const res = await fetch(
    `https://${config.get('auth.management.domain')}/oauth/token`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: config.get('auth.management.clientId'),
        client_secret: config.get('auth.management.clientSecret'),
        audience: config.get('auth.management.audience')
      })
    }
  )
  if (!res.ok) {
    return null
  }
  const {expires_in: expiresIn, access_token: token} = await res.json()
  accessToken = {token, expires: Date.now() + expiresIn * 1000}
  return token
}

export async function sendVerificationEmail (userId: string): Promise<{| sent: 0 | 1 |}> {
  const token = await fetchManagementToken()
  if (!token) {
    return {sent: 0}
  }
  const res = await fetch(
    'https://thang.eu.auth0.com/api/v2/jobs/verification-email',
    {
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      method: 'post',
      body: JSON.stringify({user_id: userId})
    }
  )
  return {sent: res.ok ? 1 : 0}
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
  const u = await db.user(profile.email)
  if (u && profile.email === profile.name) {
    return u.id
  }
  if (u) {
    await db.updateUser(u.email, profile)
    return u.id
  }
  const timezone = config.defaultTimezone
  const id = uuidv4()
  await db.createUser({...profile, id, timezone})
  return id
}

export async function tokenToUser (token: string): Promise<?UserProfile> {
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
  const user = await db.user(profile.email)
  if (!user) {
    return null
  }
  return {user, profile}
}

export async function cachedTokenToUser (token: string): Promise<?UserProfile> {
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
