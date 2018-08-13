import React from 'react'
import Helmet from 'react-helmet'
import styled, { injectGlobal } from 'styled-components'
import { StaticQuery, graphql } from 'gatsby'

import 'reset-css'
import 'typeface-open-sans'
import 'typeface-lato'
import 'typeface-fira-sans'
import Icon from './Icon'

injectGlobal`
  html {
    height: 100%;
  }
  body {
    min-height: 100%;
    background-color: #F5F5F5;
    font-weight: 300;
    font-family: "Open Sans", sans-serif;
  }
  #___gatsby {
    min-height: 100%;
  }
`

const Container = styled.div`
  font-size: 1em;
  line-height: 1.3em;
  position: relative;
  font-family: "Open sans", sans-serif;

  p {
    line-height: 1.8em;
    color: #444444;
    font-weight: 300;
  }
  p + p {
    padding-top: 1em;
  }
  h2 {
    font-family: "Fira Sans", sans-serif;
    font-weight: 300;
    font-size: 1.8em;
    line-height: 1.3em;
    color: #B02C7F;
    ${Icon} {
      fill: #B02C7F;
      height: 0.8em;
      width: 0.8em;
      margin-right: 0.5em;
    }
  }
  h3 {
    font-family: "Open Sans", sans-serif;
    font-weight: 400;
    font-size: 1.25em;
    color: #B02C7F;
  }
`

const Layout = ({ children }) => (
  <StaticQuery
    render={data => (
      <Container>
        <Helmet
          title={data.site.siteMetadata.title}
          meta={[
            { name: 'description', content: 'Sample' },
            { name: 'keywords', content: 'sample, something' },
          ]}
        />
        {children}
      </Container>
    )}
    query={
      graphql`
          query SiteTitleQuery {
            site {
              siteMetadata {
                title
              }
            }
          }
        `
    }
  />
)

export default Layout

