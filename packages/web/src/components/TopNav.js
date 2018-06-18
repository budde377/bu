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
  transition: 0.1s border;
  border-bottom: 0.0625em solid transparent;
  &.active {
    border-bottom-color: #fff;
  }
  :hover {
    border-bottom-color: rgba(255, 255, 255, 0.5);
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

export default styled(({className}) => (
  <nav className={className}>
    <Container>
      <Logo />
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
  height: 5em;
`