// @flow
import Koa from 'koa'
import logger from 'koa-logger'
import koaBody from 'koa-bodyparser'
import config from 'config'
import schema from './graphql/schema'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { execute, subscribe } from 'graphql'
import cors from '@koa/cors'
import { cachedTokenToUser } from './auth'
import mw from './middleware'
import type { Context } from './graphql/schema'
import Db from './db'

const app = new Koa()
app.use(cors())
app.use(koaBody())
app.use(logger())

async function onConnect (connectionParams): Promise<Context> {
  if (!connectionParams.authToken) {
    return {userProfile: null, db: new Db()}
  }
  const db = new Db()
  const userProfile = await cachedTokenToUser(db, connectionParams.authToken)
  return {userProfile: userProfile, db}
}

app.use(mw)

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

// eslint-disable-next-line no-console
console.log(`Listening on port ${config.port} - version ${config.version}`)
