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
  const ts = moment.utc([dt.year, dt.month - 1, dt.day, dt.hour, dt.minute]).valueOf()
  return isNaN(ts) ? null : ts
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

export function now () {
  return moment().utc().valueOf()
}

export function timestampToWeekday (n: number): 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' {
  const wd: 1 | 2 | 3 | 4 | 5 | 6 | 7 = moment(n).utc().isoWeekday()
  switch (wd) {
    case 1:
      return 'mon'
    case 2:
      return 'tue'
    case 3:
      return 'wed'
    case 4:
      return 'thu'
    case 5:
      return 'fri'
    case 6:
      return 'sat'
    case 7:
      return 'sun'
    default:
      throw new Error('Invariant')
  }
}

export function daysDiff (from: number, to: number): number {
  return moment(from).utc().diff(moment(to).utc(), 'd')
}

export function startOfDay (ts: number): number {
  return moment(ts).utc().startOf('d').valueOf()
}

export function addDay (ts: number, num: number): number {
  return moment(ts).utc().add(num, 'd').valueOf()
}
