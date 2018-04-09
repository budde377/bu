// @flow

import React from 'react'
import { FormattedMessage } from 'react-intl'
import { H1 } from '../styled/Header'

const BaseThang = () => (
  <div>
    <H1>
      <FormattedMessage id={'baseThang.header'} />
    </H1>
    <p>
      <FormattedMessage id={'baseThang.description'} />
    </p>
  </div>)

export default BaseThang
