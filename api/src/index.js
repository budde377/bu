// @flow
import Koa from 'koa'
import KoaRouter from 'koa-router'
import koaBody from 'koa-bodyparser'
import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa'
import config from 'config'
import schema from './graphql/schema'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { execute, subscribe } from 'graphql'
import cors from '@koa/cors'
import { cachedTokenToUser } from './auth'

const app = new Koa()
const router = new KoaRouter()
app.use(cors())
app.use(koaBody())

async function ctxToContext (ctx) {
  const authHeader = ctx.request.header.authentication
  if (!authHeader || !/Bearer .+/.exec(authHeader)) {
    return {}
  }
  const token = authHeader.substr(7).trim()
  const currentUser = await cachedTokenToUser(token)
  return {currentUser}
}

async function onConnect (connectionParams) {
  if (!connectionParams.authToken) {
    return {}
  }
  const currentUser = await cachedTokenToUser(connectionParams.authToken)
  if (!currentUser) {
    return {}
  }
  return {
    currentUser
  }
}

router.post('/graphql', async (ctx, next) => graphqlKoa({schema, context: await ctxToContext(ctx)})(ctx, next))
router.get('/graphql', async (ctx, next) => graphqlKoa({schema, context: await ctxToContext(ctx)})(ctx, next))

// Setup the /graphiql route to show the GraphiQL UI
router.get(
  '/graphiql',
  graphiqlKoa({
    endpointURL: '/graphql',
    subscriptionsEndpoint: 'ws://localhost:3000/subscriptions'
  })
)

app.use(router.routes())
app.use(router.allowedMethods())
const server = app.listen(config.port)

// eslint-disable-next-line no-new
new SubscriptionServer({
  execute,
  subscribe,
  onConnect,
  schema
}, {
  path: '/subscriptions',
  server
})
