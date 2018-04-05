// @flow
import React from 'react'
import Koa from 'koa'
import logger from 'koa-logger'
import serve from 'koa-static'
import path from 'path'
import config from 'config'
import { StaticRouter } from 'react-router'
import ReactDOMServer from 'react-dom/server'
import App from './view/App'
import Html from './view/Html'
import ApolloClient from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createHttpLink } from 'apollo-link-http'
import { getDataFromTree, ApolloProvider } from 'react-apollo'
import fetch from 'node-fetch'
const app = new Koa()
function gqlClient () {
  return new ApolloClient({
    ssrMode: true,
    link: createHttpLink({
      // $FlowFixMe: This is ok
      uri: `${config.api.server.http}/graphql`,
      fetch
    }),
    cache: new InMemoryCache()
  })
}

app.use(logger())

app.use(serve(path.resolve('static')))

app.use(serve(path.resolve('dist', 'client')))

app.use(async (ctx) => {
  const client = gqlClient()
  const context = {}
  const conf = {
    api: {
      http: config.get('api.client.http'),
      ws: config.get('api.client.ws')
    }
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
  if (context.url) {
    return ctx.redirect(context.url)
  }
  const initialState = client.extract()
  const html = (
    <Html content={content} config={conf} apolloState={initialState} />
  )
  ctx.body = `<!doctype html>\n${ReactDOMServer.renderToStaticMarkup(html)}`
})

const port = config.get('port')

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on port ${port} - version ${config.version}`)
})
