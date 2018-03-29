// @flow

import r from 'rethinkdb'
import config from 'config'

const connectionP = r.connect(config.rethink)


export async function user (id) {
  const res = await r.table('users').get(id).run(await connectionP)
  return res
}

export async function thang (id) {
  const res = await r.table('thangs').get(id).run(await connectionP)
  return res
}

export async function thangCollection (id) {
  const res = await r.table('thangCollections').get(id).run(await connectionP)
  return res
}

export async function booking (id) {
  const res = await r.table('bookings').get(id).run(await connectionP)
  return res
}

export async function createThang ({owner, name, collection}) {
  const {generated_keys: [id]} = await r
    .table('thangs')
    .insert({owner, name, collection, reated: Date.now()})
    .run(await connectionP)
  return id
}

export async function createThangCollection ({owners, name}) {
  const {generated_keys: [id]} = await r
    .table('thangCollections')
    .insert({owners, name, created: Date.now()})
    .run(await connectionP)
  return id
}

export async function createBooking ({owner, from, to, thang}) {
  const {generated_keys: [id]} = await r
    .table('bookings')
    .insert({owner, from, to, thang, created: Date.now()})
    .run(await connectionP)
  return id
}

export async function createUser ({name, email}) {
  const {generated_keys: [id]} = await r
    .table('thangs')
    .insert({email, name, created: Date.now()})
    .run(await connectionP)
  return id
}

export async function userThangs (id) {
  const res = await r
    .table('thangs')
    .filter(r.row('owner').eq(id))
    .run(await connectionP)
  return await res.toArray()
}

export async function collectionThangs (id) {
  const res = await r
    .table('thangs')
    .filter(r.row('collection').eq(id))
    .run(await connectionP)
  return await res.toArray()
}

export async function collectionOwners (id) {
  return r
    .table('thangCollections')
    .get(id)
    .do(col => col('owners').map(id => r.table('users').get(id)))
    .run(await connectionP)
}

export async function thangBookings (id) {
  const res = await r
    .table('bookings')
    .filter(r.row('thang').eq(id))
    .run(await connectionP)
  return res.toArray()
}

export async function userCollections (id) {
  const res = await r
    .table('thangCollections')
    .filter(r.row('owners').contains(id))
    .run(await connectionP)
  return await res.toArray()
}

export async function deleteBooking (id) {
  const {deleted} = await r
    .table('bookings')
    .get(id)
    .delete()
    .run(await connectionP)
  return deleted
}
export async function deleteThang (id) {
  const {deleted} = await r
    .table('thangs')
    .get(id)
    .delete()
    .run(await connectionP)
  return deleted
}
export async function deleteThangCollection (id) {
  const {deleted} = await r
    .table('thangCollections')
    .get(id)
    .delete()
    .run(await connectionP)
  return deleted
}

async function* feedGenerator(feed) {
  while (true) {
    const v = await feed.next()
    yield v
  }
}

export async function thangBookingAdded (thang) {
  const res = await r
    .table('bookings')
    .filter(r.row('thang').eq(thang))
    .changes({includeTypes: true})
    .run(await connectionP)
  return feedGenerator(res)
}
