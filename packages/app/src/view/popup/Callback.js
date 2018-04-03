// @flow

import React from 'react'
import { callback, updateAuth } from '../../auth'
import { withRouter } from 'react-router'
import LogoLoader from '../LogoLoader'
import { FormattedMessage } from 'react-intl'

class Callback extends React.Component<*> {
  async componentDidMount () {
    const result = await callback(this.props.location.hash)
    if (window.opener) {
      window.opener.postMessage(result, window.location.origin)
    } else {
      updateAuth(result)
    }
  }

  render () {
    return (
      <div style={{textAlign: 'center', padding: '10% 0'}}>
        <div style={{height: '4em', width: '4em', margin: 'auto'}}>
          <LogoLoader />
        </div>
        <div style={{padding: '2em 0'}}>
          <FormattedMessage id='loggingIn' />
        </div>
      </div>
    )
  }
}

export default withRouter(Callback)
