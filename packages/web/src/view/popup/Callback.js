// @flow

import React from 'react'
import { callback, updateAuth } from '../../auth'
import { withRouter } from 'react-router'
import { Loader } from 'semantic-ui-react'

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
      <Loader active>
        Logging in
      </Loader>
    )
  }
}

export default withRouter(Callback)
