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

function gqlClient (accessToken: ?string) {
  return new ApolloClient({
    ssrMode: true,
    link: createHttpLink({
      // $FlowFixMe: This is ok
      uri: `${config.api.server.http}/graphql`,
      headers: accessToken ? {authentication: `Bearer ${accessToken}`} : {},
      fetch
    }),
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
    const content = ReactDOMServer.renderToString(A)
    if (context.statusCode) {
      ctx.status = context.statusCode
    }
    if (context.url) {
      return ctx.redirect(context.url)
    }
    const initialState = client.extract()
    const html = (
      <Html content={content} config={conf} apolloState={initialState} version={config.version} />
    )
    ctx.body = `<!doctype html>\n${ReactDOMServer.renderToStaticMarkup(html)}`
  }
export default m
