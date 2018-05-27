// @flow
import {
  MongoClient,
  ObjectID,
  Db as MDb,
  Collection,
  type ChangeStream,
  type ChangeStreamDocumentUpdateLookup
} from 'mongodb'
import config from 'config'
import usersSchema from '../schemas/users.schema'
import thangSchema from '../schemas/thangs.schema'
import collectionsSchema from '../schemas/collections.schema'
import bookingsSchema from '../schemas/bookings.schema'
import { Transform } from 'stream'

export type ID = ObjectID
type I = (db: MDb, tableName: string) => Promise<any>

// eslint-disable-next-line no-unused-vars
type CollectionInitiator<V> = Array<I>
const collectionDefinitions: {|
  users: CollectionInitiator<User>,
  thangs: CollectionInitiator<Thang>,
  collections: CollectionInitiator<ThangCollection>,
  bookings: CollectionInitiator<Booking>
|} = {
  users: [
    async (db, tableName) => {
      const collection = await db.createCollection(tableName, {
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
    }],
  thangs: [
    async (db, tableName) => {
      await db.createCollection(tableName, {
        validator: {
          $jsonSchema: thangSchema
        }
      })
    }],
  collections: [
    async (db, tableName) => {
      await db.createCollection(tableName, {
        validator: {
          $jsonSchema: collectionsSchema
        }
      })
    }],
  bookings: [
    async (db, tableName) => {
      await db.createCollection(tableName, {
        validator: {
          $jsonSchema: bookingsSchema
        }
      })
    }]
}

export type Change<T> = {| kind: 'add', doc: T |} | {| kind: 'update', doc: T |} | {| kind: 'remove', id: ID |}

const streams: {|
  thang: ?ChangeStream<ChangeStreamDocumentUpdateLookup<Thang>>,
  booking: ?ChangeStream<ChangeStreamDocumentUpdateLookup<Booking>>
|} = {
  thang: null,
  booking: null
}

class FilterTransform<T> extends Transform {
  _filter: (t: T) => boolean

  constructor (filter: *) {
    super({
      readableObjectMode: true,
      writableObjectMode: true
    })
    this._filter = filter
  }

  _transform (data: any, encoding, callback: (e: ?Error, data?: any) => mixed) {
    if (this._filter(data)) {
      callback(null, data)
    } else {
      callback()
    }
  }
}

function toChange<T> (t: ChangeStreamDocumentUpdateLookup<T>): ?Change<T> {
  switch (t.operationType) {
    case 'insert':
      return {kind: 'add', doc: t.fullDocument}
    case 'delete':
      return {kind: 'remove', id: t.documentKey._id}
    case 'replace':
      return {kind: 'update', doc: t.fullDocument}
    case 'update':
      if (t.updateDescription.updatedFields && t.updateDescription.updatedFields.deleted === true) {
        return {kind: 'remove', id: t.documentKey._id}
      }
      return {kind: 'update', doc: t.fullDocument}
    default:
      return null
  }
}

const clientP = MongoClient.connect(config.get('mongo.url'), {useNewUrlParser: true, poolSize: 100})

async function* changeStreamToAsyncIterator<T> (stream: FilterTransform<T>): AsyncIterator<Change<T>> {
  try {
    // $FlowFixMe This is experimental and OK
    for await (const d of stream) {
      const c = toChange(d)
      if (!c) continue
      yield c
    }
  } finally {
    stream.unpipe()
  }
}

export default class Db {
  _dbP: Promise<MDb>
  _collectionsP: Promise<$ObjMap<typeof collectionDefinitions, <V>(CollectionInitiator<V>) => Collection<V>>>

  id (id: string | number): ?ID {
    try {
      return new ObjectID(id)
    } catch (_) {
      return null
    }
  }

  static async dbs (): Promise<Db[]> {
    const databases = await (await clientP).db('admin').admin().listDatabases()
    return databases.map(db => new Db(db.databaseName))
  }

  constructor (db?: string) {
    this._dbP = clientP.then(client => client.db(db))
    this._collectionsP = this._init()
  }

  async _init (): Promise<*> {
    const db = await this._dbP
    const collections = await db.collections()
    const collectionSet = new Set(collections.map(c => c.collectionName))

    const expandedDefinitions: { i: I, table: string }[] =
      Object
        .keys(collectionDefinitions)
        .reduce(
          (acc, key) => (
            [
              ...acc,
              ...(
                collectionDefinitions[key]
                  .reduce((acc, i: I, index: number) => ([...acc, {table: `${key}-v${index}`, i}]), [])
              )
            ]),
          [])
    await expandedDefinitions
      .filter(({table}) => !collectionSet.has(table))
      .reduce(
        async (acc, {i, table}) => {
          await acc
          await i(db, table)
        },
        Promise.resolve())
    return (
      {
        bookings: db.collection(`bookings-v${collectionDefinitions.bookings.length - 1}`),
        thangs: db.collection(`thangs-v${collectionDefinitions.thangs.length - 1}`),
        users: db.collection(`users-v${collectionDefinitions.users.length - 1}`),
        collections: db.collection(`collections-v${collectionDefinitions.collections.length - 1}`)
      })
  }

  async user (id: ID): Promise<?User> {
    return (await this._collectionsP).users.findOne({_id: id, deleted: false})
  }

  async userFromEmail (email: string): Promise<?User> {
    return (await this._collectionsP).users
      .find({email})
      .collation({
        locale: 'en',
        strength: 1
      })
      .next()
  }

  async thang (id: ID): Promise<?Thang> {
    return (await this._collectionsP).thangs.findOne({_id: id, deleted: false})
  }

  async thangCollection (id: ID): Promise<?ThangCollection> {
    return (await this._collectionsP).collections.findOne({_id: id, deleted: false})
  }

  async booking (id: ID): Promise<?Booking> {
    return (await this._collectionsP).bookings.findOne({_id: id, deleted: false})
  }

  async createThang (args: WithoutIdAndTimestamps<Thang>): Promise<ID> {
    const {insertedId} = await (await this._collectionsP).thangs.insertOne({
      ...args,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null
    })
    return insertedId
  }

  async createThangCollection (args: WithoutIdAndTimestamps<ThangCollection>): Promise<ID> {
    const {insertedId} = await (await this._collectionsP).collections.insertOne({
      ...args,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null
    })
    return insertedId
  }

  async createBooking (args: WithoutIdAndTimestamps<Booking>): Promise<ID> {
    const {insertedId} = await (await this._collectionsP).bookings.insertOne({
      ...args,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null
    })
    return insertedId
  }

  async createUser (profile: WithoutIdAndTimestamps<User>): Promise<ID> {
    const p = {
      ...profile,
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null
    }
    const {insertedId} = await (await this._collectionsP).users.insertOne(p)
    return insertedId
  }

  async updateUser (id: ID, profile: $Shape<User>): Promise<{| updated: number |}> {
    const res = await (await this._collectionsP).users
      .updateOne(
        {_id: id},
        {
          $set: {...profile},
          $currentDate: {updatedAt: true}
        }
      )
    return {updated: res.modifiedCount}
  }

  async thangAddUser (thang: ID, user: ID): Promise<{| updated: number |}> {
    const res = await (await this._collectionsP).thangs
      .updateOne(
        {_id: thang},
        {
          $addToSet: {users: user},
          $currentDate: {updatedAt: true}
        }
      )
    return {updated: res.modifiedCount}
  }

  async userThangs (id: ID): Promise<Thang[]> {
    return (await this._collectionsP).thangs
      .find({owners: id, deleted: false})
      .sort('createdAt', 1)
      .toArray()
  }

  async collectionThangs (id: ID): Promise<Thang[]> {
    return (await this._collectionsP).thangs
      .find({collection: id, deleted: false})
      .sort('createdAt', 1)
      .toArray()
  }

  async collectionOwners (id: ID): Promise<User[]> {
    const cs = await (await this._collectionsP)

    return cs
      .collections
      .aggregate([
        {$match: {_id: id, deleted: false}},
        {$unwind: '$owners'},
        {
          $lookup: {
            from: cs.users.collectionName,
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
    const cs = await (await this._collectionsP)
    return await cs.thangs
      .aggregate([
        {$match: {_id: id, deleted: false}},
        {$unwind: '$owners'},
        {
          $lookup: {
            from: cs.users.collectionName,
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
    const cs = await (await this._collectionsP)
    return await cs.thangs
      .aggregate([
        {$match: {_id: id, deleted: false}},
        {$unwind: '$users'},
        {
          $lookup: {
            from: cs.users.collectionName,
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
    const thangF = {thang: id, deleted: false}
    return (await this._collectionsP).bookings
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
      .sort('createdAt', 1)
      .toArray()
  }

  async userBookings (id: ID, time: ?{ from: number, to: number } = null): Promise<Booking[]> {
    const ownerF = {owner: id, deleted: false}
    return (await this._collectionsP).bookings
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
      .sort('createdAt', 1)
      .toArray()
  }

  async userCollections (id: ID): Promise<ThangCollection[]> {
    return (await this._collectionsP).collections
      .find({owners: id, deleted: false})
      .sort('createdAt', 1)
      .toArray()
  }

  async deleteBooking (id: ID): Promise<{| deleted: number |}> {
    const res = await (await this._collectionsP)
      .bookings
      .updateOne(
        {_id: id},
        {
          $set: {deleted: true},
          $currentDate: {deletedAt: true}
        }
      )
    return {deleted: res.modifiedCount}
  }

  async deleteThang (id: ID): Promise<{| deleted: number |}> {
    const res = await (await this._collectionsP)
      .thangs
      .updateOne(
        {_id: id},
        {
          $set: {deleted: true},
          $currentDate: {deletedAt: true}
        }
      )
    return {deleted: res.modifiedCount}
  }

  async deleteUser (id: ID): Promise<{| deleted: number |}> {
    const email = `${id.toHexString()}@thang.io`
    const res = await (await this._collectionsP).users
      .updateOne(
        {_id: id},
        {
          $set: {
            email,
            deleted: true,
            familyName: null,
            givenName: null,
            timezone: config.get('defaultTimezone'),
            profile: {
              name: 'Deleted',
              nickname: 'Deleted',
              picture: null,
              userId: id.toHexString(),
              email,
              emailVerified: false,
              givenName: null,
              familyName: null
            }
          },
          $currentDate: {
            deletedAt: true
          }
        }
      )
    return {deleted: res.modifiedCount}
  }

  async deleteThangCollection (id: ID): Promise<{| deleted: number |}> {
    const res = await (await this._collectionsP)
      .collections
      .updateOne(
        {_id: id},
        {
          $set: {deleted: true},
          $currentDate: {deletedAt: true}
        }
      )
    return {deleted: res.modifiedCount}
  }

  async _thangStream (): Promise<ChangeStream<ChangeStreamDocumentUpdateLookup<Thang>>> {
    if (streams.thang) {
      return streams.thang
    }
    const stream = (await this._collectionsP).thangs.watch([], {fullDocument: 'updateLookup'})
    streams.thang = stream
    return stream
  }

  async _bookingStream (): Promise<ChangeStream<ChangeStreamDocumentUpdateLookup<Booking>>> {
    if (streams.booking) {
      return streams.booking
    }
    const stream = (await this._collectionsP).bookings.watch([], {fullDocument: 'updateLookup'})
    streams.booking = stream
    return stream
  }

  async thangBookingChanges (thang: ID, time: ?{ from: number, to: number } = null): Promise<AsyncIterator<Change<Booking>>> {
    const stream = await this._bookingStream()
    const t = new FilterTransform((a) => {
      const isThang = a.fullDocument.thang.equals(thang)
      if (!time) {
        return isThang
      }
      const from = a.fullDocument.from.getTime()
      const to = a.fullDocument.to.getTime()
      return (
        isThang &&
        (
          (from >= time.from && from < time.to) ||
          (to > time.from && to <= time.to)
        ))
    })
    stream.pipe(t)
    return changeStreamToAsyncIterator(t)
  }

  async userThangChanges (id: ID): Promise<AsyncIterator<Change<Thang>>> {
    const stream = await this._thangStream()
    const t = new FilterTransform((a) => a.fullDocument.owners.find(i => i.equals(id)))
    stream.pipe(t)
    return changeStreamToAsyncIterator(t)
  }

  async thangChange (thang: ID): Promise<AsyncIterator<Change<Thang>>> {
    const stream = await this._thangStream()
    const t = new FilterTransform(a => a.fullDocument._id.equals(thang))
    stream.pipe(t)
    return changeStreamToAsyncIterator(t)
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
  deleted: boolean,
  email: string,
  givenName: ?string,
  familyName: ?string,
  timezone: string,
  profile: Profile,
  createdAt: Date,
  updatedAt: ?Date,
  deletedAt: ?Date
|}

export type Thang = {|
  _id: ID,
  deleted: boolean,
  name: string,
  owners: ID[],
  users: ID[],
  collection: ?ID,
  timezone: string,
  createdAt: Date,
  updatedAt: ?Date,
  deletedAt: ?Date
|}

export type ThangCollection = {|
  _id: ID,
  deleted: boolean,
  name: string,
  owners: ID[],
  createdAt: Date,
  updatedAt: ?Date,
  deletedAt: ?Date
|}

export type Booking = {|
  _id: ID,
  from: Date,
  to: Date,
  deleted: boolean,
  owner: ID,
  thang: ID,
  createdAt: Date,
  updatedAt: ?Date,
  deletedAt: ?Date
|}

// export type WithoutId<V> = $Diff<V, { _id: ID }>

export type WithoutIdAndTimestamps<V> = $Diff<V, { _id: ID, createdAt: Date, updatedAt: ?Date, deletedAt: ?Date }>
