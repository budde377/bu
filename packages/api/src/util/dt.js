// @flow

import type { Dt } from '../db'
import moment from 'moment'

export function dtToTimestamp (dt: Dt): ?number {
  const ts = moment.utc([dt.year, dt.month - 1, dt.day, dt.hour, dt.minute]).unix()
  return isNaN(ts) ? null : ts * 1000
}
