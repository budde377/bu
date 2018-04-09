// @flow

import styled from 'styled-components'
import { H1 } from './Header'
import { Form } from './Form'
import { Icon } from './Icon'

const modalWidth = 30

export const Modal = styled.div`
  background: #3cafaf;
  position: absolute;
  top: 20%;
  width: ${modalWidth - 2}rem;
  left: calc(50% - ${modalWidth / 2}rem);
  min-height: 5rem;
  border-bottom: 0.1em solid #dcdcdc;
  padding-bottom: 2em;
  ${H1} {
    font-size: 1.3em;
    background-color: #3fc7c7;
    color: #fff;
    padding: 1.5em 0 0.7em 0.6em;  
  }
  ${Form} {
    padding: 1em 1em 0 1em;
    color: #fff;
  }
  p {
    padding: 1em 1em 0 1em;
    color: #fff;
  }
`

export const ModalContainer = styled.div`
  position: fixed;
  height: ${props => props.show ? 100 : 0}%;
  transition: 1s height;
  overflow: hidden;
  width: 100%;
  top: 0;
  left: 0;
  ${Modal} {
    transition: 0.3s opacity;
    opacity: ${props => props.show ? 1 : 0};
  }
`

export const ModalBackdrop = styled.div`
  background-color: rgba(255,255,255,0.8);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%; 
`

export const Closer = styled.div`
  height: 1em;
  width: 1em;
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  cursor: pointer;
  ${Icon} {
    width: 100%;
    height: 100%;
  }
  ${Icon} svg {
    fill: #fff;
  }
`
