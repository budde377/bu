// @flow

import MongoClient, { ObjectID } from 'mongodb'
import config from 'config'
import usersSchema from '../schemas/users.schema'
import thangSchema from '../schemas/thangs.schema'
import collectionsSchema from '../schemas/collections.schema'
import visitsSchema from '../schemas/visits.schema'
import bookingsSchema from '../schemas/bookings.schema'

export type ID = ObjectID

const collectionDefinitions = {
  users: async db => {
    const collection = await db.createCollection('users', {
      validator: {
        $jsonSchema: usersSchema
      }
    })
    await collection.createIndex(
      {email: 1},
      {
        collation: {
          locale: 'en',
          strength: 1
        },
        unique: true
      }
    )
  },
  thangs: async db => {
    await db.createCollection('thangs', {
      validator: {
        $jsonSchema: thangSchema
      }
    })
  },
  collections: async db => {
    await db.createCollection('collections', {
      validator: {
        $jsonSchema: collectionsSchema
      }
    })
  },
  bookings: async db => {
    await db.createCollection('bookings', {
      validator: {
        $jsonSchema: bookingsSchema
      }
    })
  },
  visits: async db => {
    await db.createCollection('visits', {
      validator: {
        $jsonSchema: visitsSchema
      }
    })
  }
}

export type Change<T> = {| kind: 'add', doc: T |} | {| kind: 'update', doc: T |} | {| kind: 'remove', id: ID |}

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

const _clientPromise = MongoClient.connect(config.get('mongo.url'), {useNewUrlParser: true})

export default class Db {
  _dbP: Promise<*>

  id (id: string | number): ?ID {
    try {
      return new ObjectID(id)
    } catch (_) {
      return null
    }
  }

  static async dbs (): Promise<Db[]> {
    const client = await _clientPromise
    const databases = await client.admin.listDatabases()
    return databases.map(db => new Db(db.databaseName))
  }

  constructor (db?: string) {
    this._dbP = this._init(db)
  }

  async _init (dbName?: string) {
    const client = await _clientPromise
    const db = client.db(dbName)
    const collections = await db.collections()
    const collectionSet = new Set(collections.map(c => c.collectionName))
    await Promise.all(
      Object
        .keys(collectionDefinitions)
        .filter(table => !collectionSet.has(table))
        .map(table => collectionDefinitions[table](db))
    )
    return db
  }

  async user (id: ID): Promise<?User> {
    return (await this._dbP).collection('users').findOne(id)
  }

  async userFromEmail (email: string): Promise<?User> {
    return (await this._dbP)
      .collection('users')
      .find({email})
      .collation({
        locale: 'en',
        strength: 1
      })
      .next()
  }

  async thang (id: ID): Promise<?Thang> {
    return (await this._dbP).collection('thangs').findOne(id)
  }

  async thangCollection (id: ID): Promise<?ThangCollection> {
    return (await this._dbP).collection('collections').findOne(id)
  }

  async booking (id: ID): Promise<?Booking> {
    return (await this._dbP).collection('bookings').findOne(id)
  }

  async visitLogEntry (id: ID): Promise<?VisitLogEntry> {
    return (await this._dbP).collection('visits').findOne(id)
  }

  async createThang (args: WithoutId<Thang>): Promise<ID> {
    const {insertedId} = await (await this._dbP).collection('thangs').insertOne(args)
    return insertedId
  }

  async createThangCollection (args: WithoutId<ThangCollection>): Promise<ID> {
    const {insertedId} = await (await this._dbP).collection('collections').insertOne(args)
    return insertedId
  }

  async createBooking (args: WithoutId<Booking>): Promise<ID> {
    const {insertedId} = await (await this._dbP).collection('bookings').insertOne(args)
    return insertedId
  }

  async createUser (profile: WithoutId<User>): Promise<ID> {
    const db = await this._dbP
    const {insertedId} = await db.collection('users').insertOne(profile)
    return insertedId
  }

  async createVisitLogEntry (entry: WithoutId<VisitLogEntry>): Promise<ID> {
    const {insertedId} = await (await this._dbP).collection('visits').insertOne(entry)
    return insertedId
  }

  async updateUser (id: ID, profile: $Shape<User>): Promise<{| updated: number |}> {
    const res = await (await this._dbP)
      .collection('users')
      .update(
        {_id: id},
        {$set: profile}
      )
    return {updated: res.result.nModified}
  }

  async thangAddUser (thang: ID, user: ID): Promise<{| updated: number |}> {
    const res = await (await this._dbP)
      .collection('thangs')
      .update(
        {_id: thang},
        {$addToSet: {users: user}}
      )
    return {updated: res.result.nModified}
  }

  async userThangs (id: ID): Promise<Thang[]> {
    return (await this._dbP)
      .collection('thangs')
      .find({owners: id})
      .toArray()
  }

  async collectionThangs (id: ID): Promise<Thang[]> {
    return (await this._dbP)
      .collection('thangs')
      .find({collection: id})
      .toArray()
  }

  async collectionOwners (id: ID): Promise<User[]> {
    return await (await this._dbP)
      .collection('collections')
      .aggregate([
        {$match: {_id: id}},
        {$unwind: '$owners'},
        {
          $lookup: {
            from: 'users',
            localField: 'owners',
            foreignField: '_id',
            as: 'owners'
          }
        },
        {$unwind: '$owners'},
        {$replaceRoot: {newRoot: '$owners'}}
      ])
      .toArray()
  }

  async thangOwners (id: ID): Promise<User[]> {
    return await (await this._dbP)
      .collection('thangs')
      .aggregate([
        {$match: {_id: id}},
        {$unwind: '$owners'},
        {
          $lookup: {
            from: 'users',
            localField: 'owners',
            foreignField: '_id',
            as: 'owners'
          }
        },
        {$unwind: '$owners'},
        {$replaceRoot: {newRoot: '$owners'}}
      ])
      .toArray()
  }

  async thangUsers (id: ID): Promise<User[]> {
    return await (await this._dbP)
      .collection('thangs')
      .aggregate([
        {$match: {_id: id}},
        {$unwind: '$users'},
        {
          $lookup: {
            from: 'users',
            localField: 'users',
            foreignField: '_id',
            as: 'users'
          }
        },
        {$unwind: '$users'},
        {$replaceRoot: {newRoot: '$users'}}
      ])
      .toArray()
  }

  _timeQuery (time: { from: number, to: number }) {
    return (
      {
        $or: [
          { // Check from is contained
            $and: [
              {from: {$gte: new Date(time.from)}},
              {from: {$lt: new Date(time.to)}}
            ]
          },
          { // Check to is contained
            $and: [
              {to: {$gt: new Date(time.from)}},
              {to: {$lte: new Date(time.to)}}
            ]
          }
        ]
      }
    )
  }

  async thangBookings (id: ID, time: ?{ from: number, to: number } = null): Promise<Booking[]> {
    const thangF = {thang: id}
    return (await this._dbP)
      .collection('bookings')
      .find(
        time
          ? (
            {
              $and: [
                thangF,
                this._timeQuery(time)
              ]
            }
          )
          : thangF)
      .toArray()
  }

  async userBookings (id: ID, time: ?{ from: number, to: number } = null): Promise<Booking[]> {
    const ownerF = {owner: id}
    return (await this._dbP)
      .collection('bookings')
      .find(
        time
          ? (
            {
              $and: [
                ownerF, // Check owner
                this._timeQuery(time)
              ]
            })
          : ownerF)
      .toArray()
  }

  async userCollections (id: ID): Promise<ThangCollection[]> {
    return (await this._dbP)
      .collection('collections')
      .find({owners: id})
      .toArray()
  }

  async deleteBooking (id: ID): Promise<{|deleted: number|}> {
    const res = await (await this._dbP)
      .collection('bookings')
      .deleteOne({_id: id})
    return {deleted: res.deletedCount}
  }

  async deleteThang (id: ID): Promise<{|deleted: number|}> {
    const {deletedCount} = await (await this._dbP)
      .collection('thangs')
      .deleteOne({_id: id})
    return {deleted: deletedCount}
  }

  async deleteUser (id: ID): Promise<{|deleted: number|}> {
    const {deletedCount} = await (await this._dbP)
      .collection('users')
      .deleteOne({_id: id})
    return {deleted: deletedCount}
  }

  async deleteThangCollection (id: ID): Promise<{|deleted: number|}> {
    const {deletedCount} = await (await this._dbP)
      .collection('collections')
      .deleteOne({_id: id})
    return {deleted: deletedCount}
  }

  async thangBookingChanges (thang: string, time: ?{ from: number, to: number } = null): Promise<AsyncIterator<{ type: 'add' | 'remove' | 'update', booking: Booking }>> {
    const filter = time
      ? r.row('thang').eq(thang)
        .and(
          r.row('fromTime').during(new Date(time.from), new Date(time.to), {leftBound: 'closed', rightBound: 'open'})
            .or(r.row('toTime').during(new Date(time.from), new Date(time.to), {
              leftBound: 'open',
              rightBound: 'closed'
            }))
        )
      : r.row('thang').eq(thang)
    const res = await r
      .table('bookings')
      .filter(filter)
      .changes({includeTypes: true})
      .run(await connectionP)
    return feedGenerator(res)
  }

  async userThangChanges (email: string): Promise<AsyncIterator<{ type: 'add' | 'remove' | 'update', thang: Thang }>> {
    const res = await r
      .table('thangs')
      .filter(r.row('owners').contains(email))
      .changes({includeTypes: true})
      .run(await connectionP)
    return feedGenerator(res)
  }

  async thangChange (thang: string): Promise<AsyncIterator<{ type: 'add' | 'remove' | 'update', thang: Thang }>> {
    const res = await r
      .table('thangs')
      .get(thang)
      .changes({includeTypes: true})
      .run(await connectionP)
    return feedGenerator(res)
  }

}

export type Picture = {| data: Buffer, mime: string, fetched: number |}

export type Profile = {|
  name: string,
  nickname: string,
  picture: ?Picture,
  userId: string,
  email: string,
  emailVerified: boolean,
  givenName: ?string,
  familyName: ?string
|}

export type User = {|
  _id: ID,
  email: string,
  givenName: ?string,
  familyName: ?string,
  timezone: string,
  profile: Profile
|}

export type Thang = {|
  _id: ID,
  name: string,
  owners: ID[],
  users: ID[],
  collection: ?ID,
  timezone: string
|}

export type ThangCollection = {|
  _id: ID,
  name: string,
  owners: ID[]
|}

export type Booking = {|
  _id: ID,
  from: Date,
  to: Date,
  owner: ID,
  thang: ID
|}

export type VisitLogEntry = {|
  _id: ID,
  thang: ID,
  user: ID,
  time: Date
|}

export type WithoutId<V> = $Diff<V, { _id: ID }>
