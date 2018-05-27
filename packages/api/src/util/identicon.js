// @flow

import jdenticon from 'jdenticon'
import type { Picture } from '../db'
jdenticon.config.backColor = '#ffffff'
export function identiconFromString (s: string): Picture {
  return {data: jdenticon.toPng(s, 500), mime: 'image/png', fetched: new Date(0)}
}
