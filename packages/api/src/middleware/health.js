import KoaRouter from 'koa-router'
import compose from 'koa-compose'

const router = new KoaRouter()

router.get('/health', (ctx: *, next: *) => {
  ctx.response.body = JSON.stringify({status: 'OK'})
  ctx.response.type = 'application/json'
})

export default compose([router.routes(), router.allowedMethods()])
