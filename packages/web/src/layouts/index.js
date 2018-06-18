import React from 'react'
import PropTypes from 'prop-types'
import Helmet from 'react-helmet'
import styled, { injectGlobal } from 'styled-components'
import TopNav from '../components/TopNav'

import 'reset-css'
import 'typeface-open-sans'
import 'typeface-lato'
import 'typeface-fira-sans'

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
  ${TopNav} {
    left: 0;
    right: 0;
    position: absolute;
    top: 0;
  }

`

const Layout = ({ children, data }) => (
  <Container>
    <Helmet
      title={data.site.siteMetadata.title}
      meta={[
        { name: 'description', content: 'Sample' },
        { name: 'keywords', content: 'sample, something' },
      ]}
    />
    <TopNav />
      {children()}
  </Container>
)

Layout.propTypes = {
  children: PropTypes.func,
}

export default Layout

export const query = graphql`
  query SiteTitleQuery {
    site {
      siteMetadata {
        title
      }
    }
  }
`
