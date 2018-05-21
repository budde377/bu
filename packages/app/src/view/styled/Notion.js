// @flow

import styled from 'styled-components'
import { Icon } from './Icon'

export const Header = styled.div`
  font-weight: bold;
`

export const Message = styled.div`
  display: block;
`

export const Notion = styled.div`
  border: 0.1em solid ${({error}) => error ? '#e23333' : '#aaa'};
  padding: 1em;
  color: ${({error}) => error ? '#611010' : '#000'};
  background: ${({error}) => error ? '#f9d4d4' : '#fff'};
  border-radius: 0.2em;
  position: relative;
  > ${Icon} svg {
    fill: ${({error}) => error ? '#e23333' : '#292929'}
  }
  > ${Icon} {
    height: 2em;
    width: 2em;
    margin: 0.50em auto;
    display: block;
  }
  > ${Icon} + ${Header}, > ${Icon} + ${Message} {
    padding-top: 0.5em;
  }  
  > ${Header} + ${Message} {
    padding-top: 0.5em;
  }
  a {
    font-style: italic;
    color: inherit;
  }
`
