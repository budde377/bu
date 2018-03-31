// @flow

import React from 'react'
import { Header } from 'semantic-ui-react'
import { FormattedMessage } from 'react-intl'

const BaseThang = () => (
  <div>
    <Header>
      <FormattedMessage id={'baseThang.header'} />
    </Header>
    <p>
      <FormattedMessage id={'baseThang.description'} />
    </p>
  </div>)

export default BaseThang
