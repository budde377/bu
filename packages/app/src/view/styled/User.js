// @flow

import styled from 'styled-components'

export const Avatar = styled.span`
  background-image: url(${props => props.picture});
  background-size: cover;
  background-position: center center;
  display: block;
`
