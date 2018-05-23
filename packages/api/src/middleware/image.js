// @flow
import KoaRouter from 'koa-router'
import compose from 'koa-compose'
import { identiconFromString } from '../util/identicon'

const router = new KoaRouter()

function userPicture () {
  return async (ctx, next) => {
    const id = ctx.params.id
    const u = await ctx.db.user(id)
    if (!u) {
      return next()
    }
    const {data, mime, fetched} = u.profile.picture || identiconFromString(u.email)
    ctx.body = data
    ctx.type = mime
    ctx.set('ETag', fetched.toString())
  }
}

router.get('/i/id/:id', userPicture())

export default compose([router.routes(), router.allowedMethods()])
