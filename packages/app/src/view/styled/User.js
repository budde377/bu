// @flow

import styled from 'styled-components'

export const Avatar = styled.span`
  background-image: url(${props => props.picture});
  background-size: cover;
  height: 1em;
  width: 1em;
  border-radius: 0.5em;
  background-position: center center;
  display: block;
`
