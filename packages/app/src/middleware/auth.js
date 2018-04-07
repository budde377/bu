// @flow
import uuidV4 from 'uuid/v4'
import qs from 'querystring'
import config from 'config'
import fetch from 'node-fetch'
import type {Middleware} from 'koa'

async function fetchAccessToken (code: string): Promise<string> {
  try {
    const res = await fetch(
      `https://${config.auth0.domain}/oauth/token`,
      {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: config.auth0.clientId,
          client_secret: config.auth0.clientSecret,
          code,
          redirect_uri: config.auth0.redirectUri
        })})
    const {access_token: accessToken} = await res.json()
    return accessToken
  } catch (err) {
    throw new Error(err.message)
  }
}

const middleware: () => Middleware = () => async (ctx: *, next: *) => {
  switch (ctx.path) {
    case '/auth/login':
      const {domain, audience, scope, clientId, redirectUri} = config.get('auth0')
      const state = uuidV4()
      const responseType = 'code'
      const q = {
        audience,
        scope,
        client_id: clientId,
        redirect_uri: redirectUri,
        state,
        response_type: responseType
      }
      ctx.session.authState = state
      ctx.redirect(`https://${domain}/authorize?${qs.stringify(q)}`)
      break
    case '/auth/callback':
      const {code, state: newState} = ctx.request.query
      const oldState = await ctx.session.authState
      if (oldState === newState) {
        const auth = await fetchAccessToken(code)
        ctx.session.accessToken = auth
        ctx.session.authState = null
      } else {
        ctx.session.authState = null
      }
      ctx.redirect('/')
      break
    case '/auth/logout':
      ctx.session.accessToken = null
      ctx.redirect('/')
      break
    default:
      await next()
  }
}
export default middleware
