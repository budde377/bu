// @flow
import React from 'react'
import { Loader } from './styled/Loader'

type LogoProps = { loading?: boolean }

class Logo extends React.Component<LogoProps> {
  render () {
    return (
      <Loader active={this.props.loading}>
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 2000' style={{height: '100%', width: '100%'}}>
          <circle cx='205.8' cy='205.8' r='205.8' />
          <circle cx='205.8' cy='955' r='205.8' />
          <circle cx='205.8' cy='1794.2' r='205.8' />
          <circle cx='1000' cy='205.8' r='205.8' />
          <circle cx='1000' cy='955' r='205.8' />
          <circle cx='1000' cy='1794.2' r='205.8' />
          <circle cx='1794.2' cy='205.8' r='205.8' />
          <circle cx='1794.2' cy='955' r='205.8' />
          <circle cx='1794.2' cy='1794.2' r='205.8' />
        </svg>
      </Loader>
    )
  }
}

export default Logo
