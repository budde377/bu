// @flow

import r from 'rethinkdb'
import config from 'config'

const connectionP = r.connect(config.rethink).then(init)

const requiredTables = { // TODO more advanced init setup
  users: r.tableCreate('users', {primaryKey: 'email'}),
  bookings: r.tableCreate('bookings'),
  thangs: r.tableCreate('thangs'),
  thangCollections: r.tableCreate('thangCollections')
}

export type Picture = { data: Buffer, mime: string, fetched: number }

export type User = {
  id: string,
  name: string,
  nickname: string,
  picture: ?Picture,
  userId: string,
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
  const db = config.rethink.db
  await r.dbList().contains(db).branch(null, r.dbCreate(db)).run(conn)
  const tables = await r.tableList().run(conn)
  await Promise.all(Object.keys(requiredTables).map(t => tables.indexOf(t) >= 0 ? null : requiredTables[t].run(conn)))
  return conn
}

export async function user (email: string): Promise<?User> {
  return await r.table('users').get(email).run(await connectionP)
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

export async function createUser (profile: User): Promise<{ created: number }> {
  const {created} = await r
    .table('users')
    .insert({...profile, created: Date.now()})
    .run(await connectionP)
  return {created}
}

export async function updateUser (email: string, profile: $Shape<User>): Promise<{ updated: number }> {
  const p = {...profile}
  delete p.email
  const res = await r
    .table('users')
    .get(email)
    .update({...p, updated: Date.now()})
    .run(await connectionP)
  return {updated: res.replaced}
}

export async function userFromId (id: string): Promise<?User> {
  const res = await r
    .table('users')
    .filter(r.row('id').eq(id))
    .limit(1)
    .run(await connectionP)
  const [user] = await res.toArray()
  return user || null
}

export async function userThangs (email: string): Promise<Thang[]> {
  const res = await r
    .table('thangs')
    .filter(r.row('owners').contains(email))
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

export async function thangUsers (id: string): Promise<User[]> {
  return r
    .table('bookings')
    .filter(r.row('thang').eq(id))('owner')
    .distinct()
    .filter(u => r.table('thangs').get(id)('owners').contains(u).not())
    .map(i => r.table('users').get(i))
    .run(await connectionP)
}

export async function thangBookings (id: string): Promise<Booking[]> {
  const res = await r
    .table('bookings')
    .filter(r.row('thang').eq(id))
    .run(await connectionP)
  return res.toArray()
}

export async function userCollections (email: string): Promise<ThangCollection[]> {
  const res = await r
    .table('thangCollections')
    .filter(r.row('owners').contains(email))
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
  try {
    while (true) {
      const v = await feed.next()
      yield v
    }
  } finally {
    feed.close()
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

export async function userThangChanges (email: string): Promise<AsyncIterator<{ type: 'add' | 'remove' | 'update', thang: Thang }>> {
  const res = await r
    .table('thangs')
    .filter(r.row('owners').contains(email))
    .changes({includeTypes: true})
    .run(await connectionP)
  return feedGenerator(res)
}
