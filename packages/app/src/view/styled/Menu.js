// @flow

import styled from 'styled-components'
import { Link, NavLink } from 'react-router-dom'
import { Avatar } from './User'
import { H1 } from './Header'

export const LogoLink = styled(Link)`
  height: 2rem;
  padding: 1.5rem 2rem;
  display: block;
  float: left;

  img {
    height: 100%;
  }
`

export const BaseContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
`

export const ContentContainer = styled.div`
  width: calc(100% - 20rem);
  flex-grow: 1;
  flex-shrink: 1;
`

export const MenuContainer = styled.div`
  flex-grow: 0;
  flex-shrink: 0;
  background-color: #ededed;
`

export const Menu = styled.nav`
  background-color: #F7F7F7;
  height: 5rem;
  display: flex;
  flex-direction: row;
  align-content: stretch;
`

export const AvatarContainer = styled.div`
  width: 20rem;
  height: 5rem;
  position: relative;
  overflow: hidden;
  flex-grow: 0;
  flex-shrink: 0;
  
  :before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    filter: blur(1.5em);
    background-size: cover;
    background-position: center center;
    background-image: url(${props => props.backgroundImage});
  }

  ${Avatar} {
    position: absolute;
    height: 3em;
    width: 3em;
    border-radius: 1.5em;
    top: 1em;
    left: 50%;
    margin-left: -1.5em;
  }
`

export const Content = styled.div`
  background-color: #fff;
  min-height: calc(100% - 5rem);
  position: relative;
  display: flex;
  flex-direction: row;
  align-content: stretch;
`

export const SecondaryContent = styled.div`
  flex-grow: 1;
  flex-shrink: 1;
  position: relative;
  ${H1} {
    padding: 1em 2rem 0;
  }
`

export const SecondaryMenu = styled.nav`
    background-color: #EDEDED;
    width: calc(20rem - 2em);
    flex-grow: 0;
    flex-shrink: 0;
    padding: 1em;
    float: right;
    p {
      padding: 1em 0.5em;
      font-style: italic;
    }
    ${H1} {
      font-style: italic;
      font-size: 1.2em;
      padding-top: 1em;
    }
`

export const MenuLink = styled(NavLink)`
  text-decoration: none;
  font-family: "Lato", sans-serif;
  line-height: 2.5em;
  padding-left: 2.5em;
  display: block;
  color: #000;
  position: relative;
  &::before {
    content: '';
    height: 0.7em;
    width: 0.7em;
    border-radius: 0.35em;
    position: absolute;
    left: 0.9em;
    top: 0.9em;
    transition: none;
    background-color: transparent;
  }
  &.active::before{
    transition: 0.5s background-color;
    background-color: #fa4659;
  }
`

export const Item = styled.li`
  border: 0.05em none #C6C6C6;
  border-top-style: solid;
  line-height: 2em;
  &:last-of-type {
    border-bottom-style: solid;  
  }
  ${MenuLink} {
    font-size: inherit;
  }
`

export const Empty = styled.div`
  padding: 2em 0;
  text-align: center;
`

export const Items = styled.ul`
  list-style-type: none;
  padding: 1em 0 2em;
`
