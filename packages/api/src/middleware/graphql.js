// @flow
import { graphiqlKoa, graphqlKoa } from 'apollo-server-koa'
import schema from '../graphql/schema'
import KoaRouter from 'koa-router'
import { cachedTokenToUser } from '../auth'
import compose from 'koa-compose'
import type { Context } from '../graphql/schema'
import Db from '../db'

const router = new KoaRouter()

async function ctxToContext (ctx): Promise<Context> {
  const authHeader = ctx.request.header.authentication
  if (!authHeader || !/Bearer .+/.exec(authHeader)) {
    return {userProfile: null, db: new Db()}
  }
  const token = authHeader.substr(7).trim()
  const userProfile = await cachedTokenToUser(token)
  return {userProfile, db: new Db()}
}

router.post('/graphql', async (ctx, next) => graphqlKoa({
  schema,
  context: await ctxToContext(ctx)
})(ctx, next))
router.get('/graphql', async (ctx, next) => graphqlKoa({
  schema,
  context: await ctxToContext(ctx)
})(ctx, next))

// Setup the /graphiql route to show the GraphiQL UI
router.get(
  '/graphiql',
  graphiqlKoa({
    endpointURL: '/graphql',
    subscriptionsEndpoint: 'ws://localhost:3000/subscriptions'
  })
)

export default compose([router.routes(), router.allowedMethods()])
