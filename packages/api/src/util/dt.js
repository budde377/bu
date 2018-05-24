// @flow

import moment from 'moment'

export type Dt = {|
  hour: number,
  minute: number,
  day: number,
  month: number,
  year: number
|}

export function dtToTimestamp (dt: Dt): ?number {
  const ts = moment.utc([dt.year, dt.month - 1, dt.day, dt.hour, dt.minute]).unix()
  return isNaN(ts) ? null : ts * 1000
}

export function timestampToDt (n: number): Dt {
  const ts = moment(n).utc()
  return {
    hour: ts.hour(),
    minute: ts.minute(),
    day: ts.date(),
    month: ts.month() + 1,
    year: ts.year()
  }
}
