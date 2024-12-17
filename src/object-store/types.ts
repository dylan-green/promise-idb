export interface IDBRequestOptions {
  onsuccess?: Function;
  onerror?: Function;
}

export type IDBObjectStoreParams = {
  name: string;
  store: string;
  version: number;
  id?: string;
  key?: string;
  keyPath?: string;
};

export type IDBPromise = Promise<IDBDatabase>;
