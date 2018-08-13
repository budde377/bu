import React from 'react'
import styled from 'styled-components'

export default styled(({src, ...props}) => (
  <div {...props}>
    <div />
  </div>
))`
  width: 4em;
  display: inline-block;
    div {
      background-image: url(${({src}) => src});
      background-size: cover;
      border-radius: 50%;
      padding-top: 100%;
      width: 100%;
    }
`
