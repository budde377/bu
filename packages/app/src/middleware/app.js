// @flow
import React from 'react'
import { StaticRouter } from 'react-router'
import ReactDOMServer from 'react-dom/server'
import App from '../view/App'
import Html from '../view/Html'
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'
import { getDataFromTree, ApolloProvider } from 'react-apollo'
import fetch from 'node-fetch'
import config from 'config'
import type { Middleware } from 'koa'
import { ServerStyleSheet } from 'styled-components'
import {Helmet} from 'react-helmet'

function gqlClient (accessToken: ?string) {
  const link = createHttpLink({
    uri: `${config.api.server.http}/graphql`,
    headers: accessToken ? {authentication: `Bearer ${accessToken}`} : {},
    fetch
  })
  return new ApolloClient({
    ssrMode: true,
    // $FlowFixMe stupid imports
    link,
    cache: new InMemoryCache()
  })
}

const m: () => Middleware = () =>
  async (ctx: *) => {
    const accessToken = ctx.session.accessToken || null
    const client = gqlClient(accessToken)
    const context = {}
    const conf = {
      api: {
        http: config.get('api.client.http'),
        ws: config.get('api.client.ws')
      },
      accessToken
    }
    const A = (
      <ApolloProvider client={client}>
        <StaticRouter
          location={ctx.url}
          context={context}>
          <App />
        </StaticRouter>
      </ApolloProvider>
    )
    await getDataFromTree(A)
    const sheet = new ServerStyleSheet()
    const content = ReactDOMServer.renderToString(sheet.collectStyles(A))
    if (context.statusCode) {
      ctx.status = context.statusCode
    }
    if (context.url) {
      return ctx.redirect(context.url)
    }
    // $FlowFixMe this exists
    const initialState = client.extract()
    const staticHelmet = Helmet.renderStatic()
    const html = (
      <Html helmet={staticHelmet} styles={sheet.getStyleElement()} content={content} config={conf} apolloState={initialState} version={config.version} />
    )
    ctx.body = `<!doctype html>\n${ReactDOMServer.renderToStaticMarkup(html)}`
  }
export default m
