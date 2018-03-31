// @flow

import React from 'react'
import { Button } from 'semantic-ui-react'
import { logout } from '../../auth'

export default class LoginButton extends React.Component<{}> {
  _onClick = () => {
    logout()
  }

  render () {
    return (
      <Button onClick={this._onClick}>
        Log out
      </Button>
    )
  }
}
