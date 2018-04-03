// @flow

import React from 'react'

class OnMount extends React.Component<{ f: () => mixed }> {
  componentDidMount () {
    this.props.f()
  }

  render () {
    return null
  }
}

export default OnMount
