// @flow

import React from 'react'
import Status from './Status'
import { H1 } from './styled/Header'

export default () => (
  <div>
    <Status statusCode={404} />
    <H1> Not found 😢</H1>
  </div>
)
