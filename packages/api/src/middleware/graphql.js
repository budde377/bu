import { graphqlKoa } from 'apollo-server-koa'
import schema from '../graphql/schema'
import KoaRouter from 'koa-router'
import { cachedTokenToUser } from '../auth'
import compose from 'koa-compose'

const router = new KoaRouter()

async function ctxToContext (ctx) {
  const authHeader = ctx.request.header.authentication
  if (!authHeader || !/Bearer .+/.exec(authHeader)) {
    return {}
  }
  const token = authHeader.substr(7).trim()
  const currentUser = await cachedTokenToUser(token)
  return {currentUser}
}

router.post('/graphql', async (ctx, next) => graphqlKoa({schema, context: await ctxToContext(ctx)})(ctx, next))
router.get('/graphql', async (ctx, next) => graphqlKoa({schema, context: await ctxToContext(ctx)})(ctx, next))
export default compose([router.routes(), router.allowedMethods()])
