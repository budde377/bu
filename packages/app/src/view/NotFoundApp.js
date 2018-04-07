// @flow

import React from 'react'
import {Header} from 'semantic-ui-react'
import Status from './Status'

export default () => (
  <div>
    <Status statusCode={404} />
    <Header> Not found 😢</Header>
  </div>
)
