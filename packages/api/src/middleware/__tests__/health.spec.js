// @flow
import mw from '../health'

describe('middleware', () => {
  describe('health', () => {
    it('should return health on get', async () => {
      const ctx = {
        set: () => {},
        method: 'GET',
        path: '/health',
        response: {}
      }
      await mw(ctx, () => {})
      expect(ctx.response).toEqual({body: JSON.stringify({status: 'OK'}), type: 'application/json'})
    })
    it('should not return health on post', async () => {
      const ctx = {
        set: () => {},
        method: 'POST',
        path: '/health',
        response: {}
      }
      await new Promise(resolve => mw(ctx, resolve))
      expect(ctx.response).toEqual({})
    })
  })
})
