// @flow

import type { User } from '../db'
import config from 'config'

export function userPicture (user: User) {
  return `${config.url.http}/i/id/${user.id}`
}
