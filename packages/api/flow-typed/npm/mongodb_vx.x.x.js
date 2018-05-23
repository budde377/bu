declare module 'mongodb' {
  declare export class ObjectID {
    id: string | number;
    constructor(id: string | number): this;
    toHexString(): string;
  }
}
