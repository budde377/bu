// @flow

import r from 'rethinkdb'
import config from 'config'

const connectionP = r.connect(config.rethink).then(init)

const requiredTables = [
  'users',
  'bookings',
  'thangs',
  'thangCollections'
]

export type User = {
  id: string,
  name: string,
  picture: string,
  email: string,
  emailVerified: boolean,
  givenName: ?string,
  familyName: ?string,
  timezone: string
}

type Thang = {
  id: string,
  name: string,
  owners: string[],
  collection: ?string,
  timezone: string
}

type ThangCollection = {
  id: string,
  name: string,
  thangs: string[],
  owners: string[]
}

type Booking = {
  id: string,
  from: Date,
  to: Date,
  owner: string,
  thang: string
}

type WithoutId<V> = $Diff<V, { id: string }>

async function init (conn) {
  const tables = await r.tableList().run(conn)
  await Promise.all(requiredTables.map(t => tables.indexOf(t) >= 0 ? null : r.tableCreate(t).run(conn)))
  return conn
}

export async function user (id: string): Promise<?User> {
  return await r.table('users').get(id).run(await connectionP)
}

export async function thang (id: string): Promise<?Thang> {
  return await r.table('thangs').get(id).run(await connectionP)
}

export async function thangCollection (id: string): Promise<?ThangCollection> {
  return await r.table('thangCollections').get(id).run(await connectionP)
}

export async function booking (id: string): Promise<?Booking> {
  return await r.table('bookings').get(id).run(await connectionP)
}

export async function createThang (args: WithoutId<Thang>): Promise<string> {
  const {generated_keys: [id]} = await r
    .table('thangs')
    .insert({...args, created: Date.now()})
    .run(await connectionP)
  return id
}

export async function createThangCollection ({owners, name}: WithoutId<ThangCollection>): Promise<string> {
  const {generated_keys: [id]} = await r
    .table('thangCollections')
    .insert({owners, name, created: Date.now()})
    .run(await connectionP)
  return id
}

export async function createBooking ({owner, from, to, thang}: WithoutId<Booking>): Promise<string> {
  const {generated_keys: [id]} = await r
    .table('bookings')
    .insert({owner, from, to, thang, created: Date.now()})
    .run(await connectionP)
  return id
}

export async function createUser (profile: WithoutId<User>): Promise<string> {
  const {generated_keys: [id]} = await r
    .table('users')
    .insert({...profile, created: Date.now()})
    .run(await connectionP)
  return id
}

export async function updateUser (id: string, profile: $Shape<WithoutId<User>>): Promise<{ updated: number }> {
  const res = await r
    .table('users')
    .get('id')
    .update({...profile, updated: Date.now()})
    .run(await connectionP)
  return {updated: res.replaced}
}

export async function userFromEmail (email: string): Promise<?User> {
  const res = await r
    .table('users')
    .filter(r.row('email').eq(email))
    .limit(1)
    .run(await connectionP)
  const [user] = await res.toArray()
  return user || null
}

export async function userThangs (id: string): Promise<Thang[]> {
  const res = await r
    .table('thangs')
    .filter(r.row('owners').contains(id))
    .run(await connectionP)
  return await res.toArray()
}

export async function collectionThangs (id: string): Promise<Thang[]> {
  const res = await r
    .table('thangs')
    .filter(r.row('collection').eq(id))
    .run(await connectionP)
  return await res.toArray()
}

export async function collectionOwners (id: string): Promise<User[]> {
  return r
    .table('thangCollections')
    .get(id)
    .do(col => col('owners').map(id => r.table('users').get(id)))
    .run(await connectionP)
}

export async function thangOwners (id: string): Promise<User[]> {
  return r
    .table('thangs')
    .get(id)
    .do(col => col('owners').map(id => r.table('users').get(id)))
    .run(await connectionP)
}

export async function thangBookings (id: string): Promise<Booking[]> {
  const res = await r
    .table('bookings')
    .filter(r.row('thang').eq(id))
    .run(await connectionP)
  return res.toArray()
}

export async function userCollections (id: string): Promise<ThangCollection[]> {
  const res = await r
    .table('thangCollections')
    .filter(r.row('owners').contains(id))
    .run(await connectionP)
  return await res.toArray()
}

export async function deleteBooking (id: string): Promise<number> {
  const {deleted} = await r
    .table('bookings')
    .get(id)
    .delete()
    .run(await connectionP)
  return deleted
}

export async function deleteThang (id: string): Promise<number> {
  const {deleted} = await r
    .table('thangs')
    .get(id)
    .delete()
    .run(await connectionP)
  return deleted
}

export async function deleteThangCollection (id: string): Promise<number> {
  const {deleted} = await r
    .table('thangCollections')
    .get(id)
    .delete()
    .run(await connectionP)
  return deleted
}

async function* feedGenerator (feed) {
  while (true) {
    const v = await feed.next()
    yield v
  }
}

export async function thangBookingChanges (thang: string): Promise<AsyncIterator<{ type: 'add' | 'remove' | 'update', booking: Booking }>> {
  const res = await r
    .table('bookings')
    .filter(r.row('thang').eq(thang))
    .changes({includeTypes: true})
    .run(await connectionP)
  return feedGenerator(res)
}

export async function userThangChanges (user: string): Promise<AsyncIterator<{ type: 'add' | 'remove' | 'update', thang: Thang }>> {
  const res = await r
    .table('thangs')
    .filter(r.row('owners').contains(user))
    .changes({includeTypes: true})
    .run(await connectionP)
  return feedGenerator(res)
}
