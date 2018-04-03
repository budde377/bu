// @flow

import auth0 from 'auth0-js'
import config from './config'

type AuthResult = {
  token: string
}

export function validateAuthResult (data: mixed): ?AuthResult {
  if (typeof data !== 'object' || !data) {
    return null
  }
  const token = data.token
  if (typeof token !== 'string') {
    return null
  }
  return {token}
}

const auth = new auth0.WebAuth(config.auth)

const authResultKey = 'auth-result'

function save (r: AuthResult) {
  window.localStorage.setItem(authResultKey, JSON.stringify(r))
}

function clear () {
  window.localStorage.removeItem(authResultKey)
}

function load (): ?AuthResult {
  try {
    const r = window.localStorage.getItem(authResultKey)
    return validateAuthResult(JSON.parse(r))
  } catch (err) {
    return null
  }
}

export function login () {
  auth.authorize()
}

export function callback (hash: string): Promise<AuthResult> {
  return new Promise((resolve, reject) => {
    auth.parseHash({hash}, (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve({token: data.accessToken})
    })
  })
}

export async function updateAuth (auth: AuthResult) {
  save(auth)
  window.location = '/'
}

export function authResult (): ?AuthResult {
  return load()
}

export async function logout () {
  clear()
  window.location = '/'
}
