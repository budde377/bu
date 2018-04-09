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
