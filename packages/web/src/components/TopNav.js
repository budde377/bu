import React from 'react'
import styled from 'styled-components'
import Logo from './Logo'
import Button from './Button'
import Link from 'gatsby-link'

const L = styled(Link).attrs({activeClassName: 'active'})`
  text-decoration: none;
  color: inherit;
  display: inline-block;
  line-height: 2em;
  font-family: "Open Sans", sans-serif;
  font-weight: 400;
  transition: 0.1s border;
  border-bottom: 0.0625em solid transparent;
  :hover {
    border-bottom-color: rgba(255, 255, 255, 0.5);
  }
  &.active {
    border-bottom-color: #fff;
  }

`

const Container = styled.div`
  max-width: 88em;
  margin: auto;
  padding: 1em;
  display: flex;
  justify-content: space-between;
  ${Logo} {
    flex-grow: 0;
    flex-shrink: 0;
  }
  ul {
    flex-grow: 1;
    max-width: 45em;
    flex-shrink: 1;
    list-style-type: none;
    display: flex;
    li {
      flex-grow: 1;
      flex-shrink: 1;
      line-height:3.0625em;
      color: #fff;
      text-align: center;
      :last-of-type {
        flex-grow: 0;
        flex-shrink: 0;
      }
      ${Button} {
        padding: 0 3.5em;
      }
    }
  }
`

const LogoL = styled(Link)`
  display: flex;
  justify-content: center;
  align-items: center;
`

export default styled(({className}) => (
  <nav className={className}>
    <Container>
      <LogoL to='/'>
        <Logo />
      </LogoL>
      <ul>
        <li>
          <L to='/faq/'>
            FAQ
          </L>
        </li>
        <li>
          <L to='/tutorials/'>
            Tutorials
          </L>
        </li>
        <li>
          <L to='/developers/'>
            Developers
          </L>
        </li>
        <li>
          <L to='/pricing/'>
            Pricing
          </L>
        </li>
        <li>
          <L to='/contact/'>
            Contact
          </L>
        </li>
        <li>
          <Button inverted>
            Login
          </Button>
        </li>
      </ul>
    </Container>
  </nav>
))`
  background-image: linear-gradient(270deg, #AE2370 10%, #C83787 90%);
  height: 5em;
`