// @flow
import mw from '../image'

describe('middleware', () => {
  describe('health', () => {
    it('should return health on get', async () => {
      const ctx = {
        set: () => {},
        db: {id: (i) => i, user: () => ({email: 'foobar', profile: {}})},
        method: 'GET',
        path: '/i/id/image',
        response: {}
      }
      await mw(ctx, () => {})
      expect(ctx.response.type).toBe('image/png')
      expect(ctx.response.body).toBeInstanceOf(Buffer)
    })
    it('should not return health on post', async () => {
      const ctx = {
        set: () => {},
        method: 'POST',
        path: '/i/id/image',
        response: {}
      }
      await new Promise(resolve => mw(ctx, resolve))
      expect(ctx.response).toEqual({})
    })
    it('should not return health on invalid id', async () => {
      const ctx = {
        set: () => {},
        db: {id: () => null},
        method: 'GET',
        path: '/i/id/image',
        response: {}
      }
      await new Promise(resolve => mw(ctx, resolve))
      expect(ctx.response).toEqual({})
    })
    it('should not return health on no user', async () => {
      const ctx = {
        set: () => {},
        db: {id: i => i, user: () => null},
        method: 'GET',
        path: '/i/id/image',
        response: {}
      }
      await new Promise(resolve => mw(ctx, resolve))
      expect(ctx.response).toEqual({})
    })
  })
})
