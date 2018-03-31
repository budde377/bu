// @flow

import React from 'react'
import { login } from '../../auth'

class Login extends React.Component<{}> {
  componentDidMount () {
    login()
  }

  render () {
    return null
  }
}

export default Login
