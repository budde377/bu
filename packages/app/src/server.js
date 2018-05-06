// @flow
import Koa from 'koa'
import logger from 'koa-logger'
import compress from 'koa-compress'
import etag from 'koa-etag'
import serve from 'koa-static'
import path from 'path'
import session from 'koa-session'
import config from 'config'
import appM from './middleware/app'
import auth from './middleware/auth'
import health from './middleware/health'
import {RedisStore} from './util/store'

const app = new Koa()
app.keys = [config.get('server.key')]

app.use(logger())
app.use(compress()) // Compress!
app.use(etag()) // Add ETag
app.use(session({...config.session, store: new RedisStore()}, app))

app.use(serve(path.join('dist', 'client'), {maxage: 1000 * 60 * 60 * 24})) // Cache 1d
app.use(serve('static', {maxage: 1000 * 60 * 60 * 24 * 7})) // Cache 1w

app.use(health())
app.use(auth())
app.use(appM())

const port = config.get('port')

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Listening on port ${port} - version ${config.version}`)
})
