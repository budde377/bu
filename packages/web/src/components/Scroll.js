import React from 'react'

export default class Scroll extends React.Component {

  _f = event => this.props.f(event)

  componentDidMount () {
    window.addEventListener('scroll', this._f)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this._f)
  }

  render () {
    return null
  }
}

