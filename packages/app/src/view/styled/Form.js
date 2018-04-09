// @flow

import styled from 'styled-components'
import { Button } from './Button'

export const Hint = styled.div`
  opacity: ${props => props.show ? 1 : 0};
  transition: 0.1s opacity, 0.2s top;
  position: absolute;
  top: -${props => props.show ? 0 : 0.5}em;
  height: 1.7em;
  line-height: 1.7em;
  right: 0;
  left: 0;
  font-style: italic;
`

export const Label = styled.label`
  padding-top: 2em;
  display: block;
  overflow: hidden;
  position: relative;
`

export const Input = styled.input`
  border: 0;
  height: 3em;
  display: block;
  padding: 0 1em;
  width: calc(100% - 2em);
  border-radius: 0.2em;
  outline: none;
  font-size: inherit;

`
export const Form = styled.form`
  ${Button} {
    margin-top: 2em;
  }
`
