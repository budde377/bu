// @flow
import React from 'react'
import styled from 'styled-components'
import { Icon } from './Icon'
import { NavLink as NavLinkE } from 'react-router-dom'

const themeColors = {
  grey: {
    std: {
      background: '#DDDDDD',
      color: '#565656',
      border: '#aaa',
      fill: '#565656'
    },
    hover: {
      background: '#e0e0e0'
    },
    focus: {
      background: '#c6c6c6'
    }
  },
  teal: {
    std: {
      background: '#43B7BA',
      color: '#fff',
      border: '#348083',
      fill: '#fff'
    },
    hover: {
      background: '#51ccd0'
    }
  },
  red: {
    std: {
      background: '#ba424d',
      color: '#fff',
      border: '#ba2842',
      fill: '#fff'
    },
    hover: {
      background: '#ba2123'
    }
  }
}

export const Button = styled.button`
  background-color: ${props => themeColors[props.color || 'grey'].std.background};
  position: relative;
  color: ${props => themeColors[props.color || 'grey'].std.color};
  font-family: 'Lato', sans-serif;
  font-weight: 700;
  border-radius: 0.2em;
  border: 0.1em solid ${props => themeColors[props.color || 'grey'].std.border};
  cursor: pointer;
  line-height: 3em;
  height: 3em;
  box-sizing: border-box;
  border-style: none none solid none;
  display: ${props => props.fluid ? 'block' : 'inline-block'};
  width: ${props => props.fluid ? '100%' : 'auto'};
  font-size: inherit;
  transition: 0.1s,0.1s background-color,color;
  text-align: center;
  text-decoration: none;
  &:focus {
    background-color: ${props => ({...themeColors[props.color || 'grey'].std, ...(themeColors[props.color || 'grey'].focus || {})}).background};
    outline: none;
    text-decoration: none;
  }
  &:hover {
    background-color: ${props => ({...themeColors[props.color || 'grey'].std, ...(themeColors[props.color || 'grey'].hover || {})}).background};
    color: ${props => ({...themeColors[props.color || 'grey'].std, ...(themeColors[props.color || 'grey'].hover || {})}).color};
  }
  &:active {
    background-color: ${props => ({...themeColors[props.color || 'grey'].std, ...(themeColors[props.color || 'grey'].active || {})}).background};
    border-color: transparent;
  }
  ${Icon} {
    position: absolute;
    left: 1em;
    top: 1em;
  }
  
  ${Icon} svg {
    fill: ${props => themeColors[props.color || 'grey'].std.fill};
  }
  > span {
    padding: 0 2em;
  }
`

export const A = Button.withComponent('a')

export const NavLink = Button.withComponent(({fluid, ...rest}) => <NavLinkE {...rest} />)
