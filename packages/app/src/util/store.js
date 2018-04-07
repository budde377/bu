// @flow
import redis from 'redis'
import config from 'config'

const client = redis.createClient(config.redis)

function get (key: string): Promise<?string> {
  return new Promise((resolve, reject) => {
    client.get(key, (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

function del (key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.del(key, (err, data) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

function set (key: string, value: string, ttl: number): Promise<void> {
  return new Promise((resolve, reject) => {
    client.set(key, value, 'EX', ttl, (err, data) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export interface Store<S: {}> {
  get(key: string, maxAge: number, o: {rolling: bool}): Promise<?S>;
  set(key: string, sess: S, maxAge: number, o: {rolling: boolean, changed: boolean}): Promise<void>;
  destroy(key: string): Promise<void>
}

export class RedisStore<S: {}> implements Store<S> {
  async get (key: string, maxAge: number, {rolling}: {rolling: boolean}) {
    try {
      const res = await get(key)
      if (!res) {
        return null // Return if not existing
      }
      if (rolling) {
        await set(key, res, Math.ceil(maxAge / 1000)) // Update TTL if rolling
      }
      return JSON.parse(res) // Decode and return
    } catch (err) {
      return null
    }
  }
  async set (key: string, val: {}, maxAge: number, {rolling, changed}: {rolling: boolean, changed: boolean}) {
    await set(key, JSON.stringify(val), Math.ceil(maxAge / 1000)) // Save!
  }
  async destroy (key: string) {
    await del(key)
  }
}
