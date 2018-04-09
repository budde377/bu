// @flow

import styled, { css } from 'styled-components'

const style = css`
  background-color: #DDDDDD;
  color: #565656;
  font-family: 'Lato', sans-serif;
  padding: 0.8em 2em;
  font-weight: 700;
  border-radius: 0.2em;
  border: 0.1em solid #aaa;
  border-style: none none solid none;
  display: inline-block;
  transition: 0.1s background-color;
  text-decoration: none;
  &:focus {
    background-color: #c6c6c6;
    outline: none;
    text-decoration: none;
  }
  &:hover {
    background-color: #e0e0e0;
    color: inherit;
  }
  `

export const Button = styled.button`
  ${style}  
`

export const A = Button.withComponent('a')
