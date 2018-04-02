// @flow

import jdenticon from 'jdenticon'
import type { Picture } from '../db'

export function identiconFromString (s: string): Picture {
  return {data: jdenticon.toPng(s, 500), mime: 'image/png', fetched: 0}
}
