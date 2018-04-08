// @flow

import styled from 'styled-components'
import { Link } from 'react-router-dom'
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

export const Menu = styled.nav`
  background-color: #F7F7F7;
  height: 5rem;
  display: block;
`

export const AvatarContainer = styled.div`
  width: 20rem;
  height: 100%;
  float: right;
  background-color: #aaa;
  position: relative;
  overflow: hidden;
  
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
export const Header = H1.extend`
  font-style: italic;
  font-size: 1.2em;
  padding-top: 1em;
`

export const Content = styled.div`
  background-color: #fff;
  height: calc(100vh - 5rem);
  position: relative;
`

export const SecondaryContent = styled.div`
  padding: 2em 1em;
`

export const SecondaryMenu = styled.nav`
    background-color: #EDEDED;
    width: calc(20rem - 2em);
    padding: 1em;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    
`

export const Item = styled.li`
  
`

export const Empty = styled.div`
  padding: 2em 0;
  text-align: center;
`

export const Items = styled.ul`
  
`
