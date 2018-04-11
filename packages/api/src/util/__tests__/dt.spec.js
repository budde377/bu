// @flow

import { dtToTimestamp } from '../dt'

const validDate = {year: 1990, month: 8, day: 18, hour: 8, minute: 32}
const invalidDate = {year: 1990, month: 2, day: 31, hour: 8, minute: 32}

describe('dtToTimestamp', () => {
  it('should succeed', () => expect(dtToTimestamp(validDate)).toBe(650968320000))
  it('should fail on invalid date', () => expect(dtToTimestamp(invalidDate)).toBeNull())
})
