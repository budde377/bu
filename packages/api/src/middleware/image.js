import KoaRouter from 'koa-router'
import compose from 'koa-compose'
import { user, userFromId } from '../db'
import type { User } from '../db'
import { identiconFromString } from '../util/identicon'

const router = new KoaRouter()

function userPicture (uf: (s: string) => Promise<?User>, f: (ctx: *) => string) {
  return async (ctx, next) => {
    const id = f(ctx)
    const u = await uf(id)
    if (!u) {
      next()
    }
    const {data, mime, fetched} = u.picture || identiconFromString(id)
    ctx.body = data
    ctx.type = mime
    ctx.set('ETag', fetched.toString())
  }
}

router.get('/i/id/:id', userPicture(userFromId, ctx => ctx.params.id))

router.get('/i/email/:email', userPicture(user, ctx => ctx.params.email))

export default compose([router.routes(), router.allowedMethods()])
