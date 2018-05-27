// @flow
import KoaRouter from 'koa-router'
import compose from 'koa-compose'
import { identiconFromString } from '../util/identicon'

const router = new KoaRouter()

function userPicture () {
  return async (ctx, next) => {
    const id: string = ctx.params.id
    const i = ctx.db.id(id)
    if (!i) {
      return next()
    }
    const u = await ctx.db.user(i)
    if (!u) {
      return next()
    }
    const {data, mime, fetched} = u.profile.picture || identiconFromString(u.email)
    ctx.response.body = Buffer.from(data.toString('base64'), 'base64')
    ctx.response.type = mime
    ctx.set('ETag', fetched.getTime().toString())
  }
}

router.get('/i/id/:id', userPicture())

export default compose([router.routes(), router.allowedMethods()])
