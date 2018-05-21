// @flow
import styled from 'styled-components'
import { Icon } from './Icon'

export const H1 = styled.h1`
  font-family: 'Fira Sans', sans-serif;
  font-weight: 400;
`
export const H2 = styled.h2`
  font-family: 'Fira Sans', sans-serif;
  font-weight: 400;
  ${Icon} {
    float: left;
    margin-right: 0.5em;
  }
`
export const Text = styled.p``

export const Section = styled.section`
  margin: 0 2rem 2em;
  background: ${({red}) => red ? '#ffd0d1' : '#ededed'};
  ${Text} {
    padding: 1em 1em 2em;
  }
  ${H2} {
    font-size: 1em;
    border-bottom: 0.05em solid #fff;
    padding: 1.5em 1em 1em;
    background: ${({red}) => red ? '#ea626a' : '#e2e2e2'};
    color: ${({red}) => red ? '#fff' : 'inherit'};
    ${Icon} svg {
      fill: ${({red}) => red ? '#fff' : '#42b7bb'};
    }
  }
`
