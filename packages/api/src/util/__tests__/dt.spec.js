// @flow

import { dtToTimestamp, timestampToDt, timestampToWeekday, now, daysDiff, startOfDay, addDay } from '../dt'

const validDate = {year: 1990, month: 8, day: 18, hour: 8, minute: 32}
const invalidDate = {year: 1990, month: 2, day: 31, hour: 8, minute: 32}

describe('dt', () => {
  describe('dtToTimestamp', () => {
    it('should succeed', () => expect(dtToTimestamp(validDate)).toBe(650968320000))
    it('should fail on invalid date', () => expect(dtToTimestamp(invalidDate)).toBeNull())
  })

  describe('timestampToDt', () => {
    // $FlowFixMe ok
    it('should do good', () => expect(timestampToDt(dtToTimestamp(validDate))).toEqual(validDate))
  })

  describe('timestampToWeekday', () => {
    // $FlowFixMe ok
    it('should do good', () => expect(timestampToWeekday(dtToTimestamp({...validDate, day: 12}))).toEqual('sun'))
    // $FlowFixMe ok
    it('should do good2', () => expect(timestampToWeekday(dtToTimestamp({...validDate, day: 13}))).toEqual('mon'))
    // $FlowFixMe ok
    it('should do good3', () => expect(timestampToWeekday(dtToTimestamp({...validDate, day: 14}))).toEqual('tue'))
    // $FlowFixMe ok
    it('should do good4', () => expect(timestampToWeekday(dtToTimestamp({...validDate, day: 15}))).toEqual('wed'))
    // $FlowFixMe ok
    it('should do good5', () => expect(timestampToWeekday(dtToTimestamp({...validDate, day: 16}))).toEqual('thu'))
    // $FlowFixMe ok
    it('should do good6', () => expect(timestampToWeekday(dtToTimestamp({...validDate, day: 17}))).toEqual('fri'))
    // $FlowFixMe ok
    it('should do good7', () => expect(timestampToWeekday(dtToTimestamp({...validDate, day: 18}))).toEqual('sat'))
    // $FlowFixMe ok
    it('should do good8', () => expect(timestampToWeekday(dtToTimestamp({...validDate, day: 19}))).toEqual('sun'))
    // $FlowFixMe ok
    it('should do good9', () => expect(timestampToWeekday(dtToTimestamp({...validDate, day: 20}))).toEqual('mon'))
  })
  describe('now', () => {
    it('should be a number', () => expect(typeof now()).toBe('number'))
  })
  describe('daysDiff', () => {
    it('should be right', () => expect(daysDiff(Date.now() + 24 * 60 * 60 * 1000, Date.now())).toBe(1))
  })
  describe('startOfDay', () => {
    it('should be right', () => expect(startOfDay(1527444866811)).toBe(1527379200000))
  })
  describe('addDay', () => {
    it('should be right', () => expect(addDay(1527379200000, 1)).toBe(1527379200000 + 24 * 60 * 60 * 1000))
  })
})
