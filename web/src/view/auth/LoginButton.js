// @flow

import React from 'react'
import { Button } from 'semantic-ui-react'
import { updateAuth, validateAuthResult } from '../../auth'

export default class LoginButton extends React.Component<{}> {
  _popup: ?(typeof window) = null

  _listener = async ({data}: *) => {
    const r = validateAuthResult(data)
    if (!r) return
    await updateAuth(r)
    if (!this._popup) { return }
    this._popup.close()
    this._popup = null
  }

  componentDidMount () {
    window.addEventListener('message', this._listener)
  }

  componentWillUnmount () {
    window.removeEventListener('message', this._listener)
  }

  _onClick = () => {
    if (this._popup) {
      this._popup.close()
    }
    this._popup = window.open('/popup/login', 'login', 'width=350,height=550')
  }

  render () {
    return (
      <Button onClick={this._onClick} primary>
        Log in
      </Button>
    )
  }
}
