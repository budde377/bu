// @flow

import React, { Fragment } from 'react'
import { FormattedMessage } from 'react-intl'
import { H1, Text } from '../styled/BuildingBlocks'

const BaseThang = () => (
  <Fragment>
    <H1>
      <FormattedMessage id={'baseThang.header'} />
    </H1>
    <Text>
      <FormattedMessage id={'baseThang.description'} />
    </Text>
  </Fragment>)

export default BaseThang
