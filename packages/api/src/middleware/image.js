import KoaRouter from 'koa-router'
import compose from 'koa-compose'
import { userFromId } from '../db'
import type { User } from '../db'
import { identiconFromString } from '../util/identicon'

const router = new KoaRouter()

function userPicture (uf: (s: string) => Promise<?User>, f: (ctx: *) => string) {
  return async (ctx) => {
    const id = f(ctx)
    const u = await uf(id)
    const {data, mime, fetched} = (u && u.picture) || identiconFromString(id)
    ctx.body = data
    ctx.type = mime
    ctx.set('ETag', fetched.toString())
  }
}

router.get('/i/id/:id', userPicture(userFromId, ctx => ctx.params.id))

export default compose([router.routes(), router.allowedMethods()])
