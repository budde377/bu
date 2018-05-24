// @flow
import mw from '../db'
import Db from '../../db'

describe('middleware', () => {
  describe('db', () => {
    it('should set db', async () => {
      const ctx = {}
      await new Promise(resolve => mw(ctx, resolve))
      expect(ctx.db).toBeInstanceOf(Db)
    })
  })
})
