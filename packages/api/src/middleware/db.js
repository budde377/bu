import Db from '../db'

export default (ctx, next) => {
  ctx.db = new Db()
  return next()
}
