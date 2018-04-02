import KoaRouter from 'koa-router'
import compose from 'koa-compose'
import { userFromId } from '../db'
import type { User } from '../db'
import { identiconFromString } from '../util/identicon'

const router = new KoaRouter()

function userPicture (uf: (s: string) => Promise<?User>, f: (ctx: *) => string) {
  return async (ctx, next) => {
    const id = f(ctx)
    const u = await uf(id)
    if (!u) {
      return next()
    }
    const {data, mime, fetched} = u.picture || identiconFromString(u.email)
    ctx.body = data
    ctx.type = mime
    ctx.set('ETag', fetched.toString())
  }
}

router.get('/i/id/:id', userPicture(userFromId, ctx => ctx.params.id))

export default compose([router.routes(), router.allowedMethods()])
