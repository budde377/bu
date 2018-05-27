import EventEmitter from 'events'

declare module 'mongodb' {
  declare export class ObjectID {
    id: string | number;
    constructor (id: string | number): this;
    toHexString (): string;
  }

  declare class ReadPreference {
    static PRIMARY: 'primary';
    static PRIMARY_PREFERRED: 'primaryPreferred';
    static SECONDARY: 'secondary';
    static SECONDARY_PREFERRED: 'secondaryPreferred';
    static NEAREST: 'nearest';
  }

  declare type ReadPreferenceConstants =
    | typeof ReadPreference.PRIMARY
    | typeof ReadPreference.PRIMARY_PREFERRED
    | typeof ReadPreference.SECONDARY
    | typeof ReadPreference.SECONDARY_PREFERRED
    | typeof ReadPreference.NEAREST

  declare type MongoClientConnectOptions = {|
    poolSize?: number,
    ssl?: boolean,
    sslValidate?: boolean,
    sslCA?: Buffer,
    sslCert?: Buffer,
    sslKey?: Buffer,
    sslPass?: string,
    sslCRL?: Buffer,
    autoReconnect?: boolean,
    noDelay?: boolean,
    keepAlive?: boolean,
    keepAliveInitialDelay?: number,
    connectTimeoutMS?: number,
    family?: 4 | 6 | null,
    socketTimeoutMS?: number,
    reconnectTries?: number,
    reconnectInterval?: number,
    ha?: boolean,
    haInterval?: number,
    replicaSet?: string,
    secondaryAcceptableLatencyMS?: number,
    acceptableLatencyMS?: number,
    connectWithNoPrimary?: boolean,
    authSource?: string,
    w?: number | string,
    wtimeout?: number,
    j?: boolean,
    forceServerObjectId?: boolean,
    serializeFunctions?: boolean,
    ignoreUndefined?: boolean,
    raw?: boolean,
    bufferMaxEntries?: number,
    readPreference?: ReadPreference | ReadPreferenceConstants,
    pkFactory?: Object,
    promiseLibrary?: Object,
    readConcern?: {| level: 'local' | 'majority' |},
    maxStalenessSeconds?: number,
    loggerLevel?: 'error' | 'warn' | 'info' | 'debug',
    logger?: Object,
    promoteValues?: boolean,
    promoteBuffers?: boolean,
    promoteLongs?: boolean,
    domainsEnabled?: boolean,
    checkServerIdentity?: boolean | Function,
    validateOptions?: Object,
    appname?: string,
    auth?: {| user?: string, password?: string |},
    authMechanism?: string,
    compression?: Object,
    fsync?: boolean,
    readPreferenceTags?: Array<*>,
    numberOfRetries?: number,
    auto_reconnect?: boolean,
    minSize?: number,
    useNewUrlParser?: boolean
  |}

  declare export class Admin {
    listDatabases (): Promise<Array<Db>>;
  }

  declare type IndexSpec = {}
  declare type Locale = string
  declare type CollationOptions = {|
    locale: Locale,
    strength?: 1 | 2 | 3 | 4 | 5,
    caseLevel?: boolean,
    caseFirst?: string,
    numericOrdering?: boolean,
    alternate?: string,
    maxVariable?: string,
    backwards?: boolean,
    normalization?: boolean
  |}
  declare type CollectionCreateIndexOptions = {|
    unique?: boolean,
    collation?: CollationOptions
  |}
  declare type Query = {} | ObjectID

  declare class Cursor<TDoc=any> extends EventEmitter {
    collation (options: CollationOptions): Cursor<TDoc>;
    next (): Promise<?TDoc>;
    sort(key: $Keys<TDoc> | Array<$Keys<TDoc>>, order: 1 | -1): Cursor<TDoc>;
    toArray (): Promise<Array<TDoc>>;
  }

  declare type Update<TDoc> = {| $set?: $Shape<TDoc>, $addToSet?: {}, $currentDate?: {} |}

  declare export type AggregatorCommand =
    | {| $match: {} |}
    | {| $unwind: string |}
    | {| $lookup: {| from: string, localField: string, foreignField: string, as: string |} |}
    | {| $replaceRoot: {| newRoot: string |} |}

  declare export type Pipeline<TDocIn, TDocOut> = Array<AggregatorCommand>

  declare type ChangeStreamDocumentBase = {|
    _id: {},
    documentKey: {
      _id: ObjectID
    }
  |}

  declare type ChangeStreamDocumentInsert<TDoc> = {|
    operationType: 'insert',
    fullDocument: TDoc,
    ...ChangeStreamDocumentBase
  |}
  declare type ChangeStreamDocumentDelete<TDoc> = {|
    operationType: 'delete',
    fullDocument: TDoc,
    ...ChangeStreamDocumentBase
  |}
  declare type ChangeStreamDocumentReplace<TDoc> = {|
    operationType: 'replace',
    fullDocument: TDoc,
    ...ChangeStreamDocumentBase
  |}
  declare type ChangeStreamDocumentInvalidate = {|
    _id: {},
    operationType: 'invalidate',
  |}
  declare type ChangeStreamDocumentUpdate = {|
    operationType: 'update',
    updateDescription: {|
      updatedFields?: any,
      removedFields?: string[]
    |},
    ...ChangeStreamDocumentBase
  |}
  declare type ChangeStreamDocumentUpdateUpdateLookup<TDoc> = {|
    operationType: 'update',
    updateDescription: {|
      updatedFields?: any,
      removedFields?: string[]
    |},
    fullDocument: TDoc,
    ...ChangeStreamDocumentBase
  |}

  declare export type ChangeStreamDocument<TDoc> =
    | ChangeStreamDocumentInsert<TDoc>
    | ChangeStreamDocumentDelete<TDoc>
    | ChangeStreamDocumentReplace<TDoc>
    | ChangeStreamDocumentInvalidate
    | ChangeStreamDocumentUpdate

  declare export type ChangeStreamDocumentUpdateLookup<TDoc> =
    | ChangeStreamDocumentInsert<TDoc>
    | ChangeStreamDocumentDelete<TDoc>
    | ChangeStreamDocumentReplace<TDoc>
    | ChangeStreamDocumentInvalidate
    | ChangeStreamDocumentUpdateUpdateLookup<TDoc>

  declare export class ChangeStream<TDoc=any> extends EventEmitter {
    close (): void;
    next (): Promise<TDoc>;
    hasNext (): Promise<boolean>;
    pipe (destination: *): void;
  }

  declare export class Collection<TDoc=any> {
    collectionName: string;
    createIndex (string | IndexSpec, options?: CollectionCreateIndexOptions): Promise<any>;
    findOne (query: Query): Promise<?TDoc>;
    find (query?: Query): Cursor<TDoc>;
    aggregate<TDocRes> (pipeline: Pipeline<TDoc, TDocRes>): Cursor<TDocRes>;
    updateOne (filter: Query, update: Update<TDoc>): Promise<{| acknowledged: boolean, matchedCount: number, modifiedCount: number |}>;
    deleteOne (filter: Query): Promise<{| acknowledged: boolean, deletedCount: number |}>;
    insertOne (o: $Diff<TDoc, { _id: ObjectID }> | TDoc): Promise<{| insertedId: ObjectID, acknowledged: boolean |}>;
    watch<TDocRes> (pipeline?: Pipeline<TDoc, TDocRes>, options?: {| fullDocument?: 'default' |}): ChangeStream<ChangeStreamDocument<TDocRes>>;
    watch<TDocRes> (pipeline?: Pipeline<TDoc, TDocRes>, options: {| fullDocument?: 'updateLookup' |}): ChangeStream<ChangeStreamDocumentUpdateLookup<TDocRes>>;
  }

  declare export type DbCreateCollectionOptions = {|
    validator?: {|
      $jsonSchema?: Object
    |}
  |}

  declare export class Db {
    databaseName: string,
    createCollection (name: string, options?: DbCreateCollectionOptions): Promise<Collection<>>;
    collections (): Promise<Array<Collection<>>>;
    collection (string): Collection<>;
    admin (): Admin;
  }

  declare export class MongoClient {
    static connect (url: string, options?: MongoClientConnectOptions): Promise<MongoClient>;
    constructor (url: string, options?: MongoClientConnectOptions): this;
    db (name?: string, options?: {| noListener: boolean, returnNonCachedInstance: boolean |}): Db;
  }
}
