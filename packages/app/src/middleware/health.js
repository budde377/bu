// @flow

export default () => (ctx: *, next: *) => {
  switch (ctx.path) {
    case '/health':
      ctx.response.body = JSON.stringify({status: 'OK'})
      ctx.response.type = 'application/json'
      break
    default:
      return next()
  }
}
