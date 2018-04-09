// @flow
import React from 'react'
import Logo from './Logo'
import { FormattedMessage } from 'react-intl'
import { A as Button } from './styled/Button'

export default () => (
  <div style={{textAlign: 'center'}}>
    <div style={{width: '5em', margin: 'auto', padding: '4em 0'}}>
      <Logo />
    </div>
    <Button href='/auth/login'>
      <FormattedMessage id={'login'} />
    </Button>
  </div>
)
