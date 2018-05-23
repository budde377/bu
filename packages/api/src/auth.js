// @flow
import jwksClient from 'jwks-rsa'
import jwt from 'jsonwebtoken'
import jwkToPem from 'jwk-to-pem'
import fetch from 'node-fetch'
import LRU from 'lru-cache'
import config from 'config'
import { logError } from './util/error'
import type Db, { Profile, Picture, User, ID } from './db'

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

export async function sendVerificationEmail (userId: string): Promise<{| sent: number |}> {
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

export async function deleteUser (userId: string): Promise<{| deleted: 0 | 1 |}> {
  const token = await fetchManagementToken()
  if (!token) {
    return {deleted: 0}
  }
  const res = await fetch(
    `https://thang.eu.auth0.com/api/v2/users/${encodeURIComponent(userId)}`,
    {
      method: 'DELETE'
    }
  )
  return {deleted: res.ok ? 1 : 0}
}

export async function resetPasswordEmail (email: string): Promise<{| sent: number |}> {
  const res = await fetch(
    'https://thang.eu.auth0.com/dbconnections/change_password',
    {
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        client_id: config.get('auth.management.clientId'),
        email,
        connection: 'Username-Password-Authentication'
      })
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

async function createOrUpdateUser (db: Db, profile: Profile): Promise<ID> {
  const u = await db.userFromEmail(profile.email)
  if (u && profile.email === profile.name) {
    return u._id
  }
  if (u) {
    await db.updateUser(u._id, {profile})
    return u._id
  }
  const timezone = config.defaultTimezone
  const id = await db.createUser({profile, timezone, familyName: null, givenName: null, email: profile.email})
  return id
}

export async function tokenToUser (db: Db, token: string): Promise<?UserProfile> {
  // Validate token
  const valid = await verify(token)
  if (!valid) {
    return null
  }
  // Fetch external profile
  const profile: ?Profile = await cachedFetchProfile(token)
  if (!profile) {
    return null
  }
  // Create or update the user
  await createOrUpdateUser(db, profile)
  // If the email was verified is relative to the token
  const user = await db.userFromEmail(profile.email)
  if (!user) {
    return null
  }
  return {user, profile}
}

export async function cachedTokenToUser (db: Db, token: string): Promise<?UserProfile> {
  const cached = cache.get(token)
  if (cached) {
    return cached
  }
  const user = await tokenToUser(db, token)
  if (!user) {
    return user
  }
  cache.set(token, user)
  return user
}
