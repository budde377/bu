// @flow
import styled from 'styled-components'
import React from 'react'

export const Icon = styled.div`
  width: 1em;
  height: 1em;
  display: inline-block;
  position: relative;
  svg {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    height: 100%;
    width: 100%;  
  }
`

export const Add = () => (
  <Icon>
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
      <path d='M24 9h-9v-9h-6v9h-9v6h9v9h6v-9h9z' />
    </svg>
  </Icon>)

export const Exit = () => (
  <Icon>
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
      <path
        d='M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z' />
    </svg>
  </Icon>)

export const LogOut = () => (
  <Icon>
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'>
      <path d='M16 9v-4l8 7-8 7v-4h-8v-6h8zm-16-7v20h14v-2h-12v-16h12v-2h-14z' />
    </svg>
  </Icon>)
