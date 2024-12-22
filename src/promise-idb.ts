import type {
  CreateIndexOptions,
  PromiseIDBParams,
  PromiseIDBEventHandlers,
  RequiredFields,
} from './types';
import { INDEXED_DB, NO_INDEXED_DB, READ_WRITE } from './constants';

type OSInstanceMethods = 'add' | 'clear' | 'get' | 'put';

export class PromiseIDB {
  #idbDatabaseMap: Map<string, IDBDatabase>;

  constructor() {
    this.#idbDatabaseMap = new Map<string, IDBDatabase>();
  }

  async add(
    params: PromiseIDBParams,
    value: any,
    key?: string,
  ): Promise<PromiseIDB> {
    return this.#callObjectStoreMethod(params, 'add', [value, key]);
  }

  async clear(params: PromiseIDBParams): Promise<PromiseIDB> {
    return this.#callObjectStoreMethod(params, 'clear', null);
  }

  async createIndex(
    indexName: string,
    keyPath: string | string[],
    params: PromiseIDBParams,
    options: CreateIndexOptions = {},
  ): Promise<PromiseIDB> {
    const { name, store } = params;
    const db: IDBDatabase | undefined = await this.#getIDBDatabase(name);
    const nextVersion = db?.version ? db?.version + 1 : 1;
    // In order for onupgradeneeded event to fire again db needs
    // to be closed before opening with an incremented version
    db?.close();

    return new Promise((resolve, reject) => {
      if (!window || !(INDEXED_DB in window)) {
        return reject(NO_INDEXED_DB);
      }

      try {
        const idbOpenRequest: IDBOpenDBRequest = window.indexedDB.open(
          name,
          nextVersion,
        );

        idbOpenRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          // @ts-ignore
          const db = event?.target?.result;
          // @ts-ignore
          const transaction = event?.target?.transaction;
          // const transaction: IDBTransaction = db.transaction(store);
          const objectStore: IDBObjectStore = transaction.objectStore(store);

          db.onerror = (error: Event) => {
            return reject(error);
          };

          objectStore.createIndex(indexName, keyPath, options);
          return resolve(this);
        };

        idbOpenRequest.onerror = (error: Event) => {
          return reject(error);
        };
      } catch (error) {
        return reject(error);
      }
    });
  }

  async createStore(
    params: PromiseIDBParams,
    eventHandlers: PromiseIDBEventHandlers = {},
  ): Promise<PromiseIDB> {
    const db = await this.#getIDBDatabase(params.name);
    const nextVersion = db?.version ? db?.version + 1 : 1;
    const nextParams = {
      version: nextVersion,
      ...params,
    };
    // In order for onupgradeneeded event to fire again db needs
    // to be closed before opening with an incremented version
    db?.close();

    return this.openDB(nextParams, eventHandlers);
  }

  async delete(): Promise<PromiseIDB> {
    return new Promise((resolve, reject) => {});
  }

  async deleteIndex(): Promise<PromiseIDB> {
    return new Promise((resolve, reject) => {});
  }

  async get(
    params: RequiredFields<PromiseIDBParams, 'key'>,
  ): Promise<PromiseIDB> {
    const { key } = params;
    return this.#callObjectStoreMethod(params, 'get', [key]);
  }

  async getAll(): Promise<PromiseIDB> {
    return new Promise((resolve, reject) => {});
  }

  async getAllKeys(): Promise<PromiseIDB> {
    return new Promise((resolve, reject) => {});
  }

  async getKey(): Promise<PromiseIDB> {
    return new Promise((resolve, reject) => {});
  }

  async openDB(
    params: PromiseIDBParams,
    {
      blocked,
      blocking,
      terminated,
      upgrade,
      onsuccess,
      onerror,
    }: PromiseIDBEventHandlers = {},
  ): Promise<PromiseIDB> {
    const { name, store, version, keyPath = 'id' } = params;

    return new Promise((resolve, reject) => {
      if (!window || !(INDEXED_DB in window)) {
        return reject(NO_INDEXED_DB);
      }

      if (!name) {
        return reject('Missing database name');
      }

      try {
        const idbOpenRequest: IDBOpenDBRequest = window.indexedDB.open(
          name,
          version,
        );

        // clean up event listeners on the IDBOpenDBRequest event
        const detach = (): void => {
          idbOpenRequest.removeEventListener('success', success);
          idbOpenRequest.removeEventListener('error', error);
        };

        const success = (event: Event): void => {
          // @ts-ignore
          const db: IDBDatabase = event?.target?.result;

          if (onsuccess) onsuccess(db);

          detach();
          resolve(this);
        };

        const error = (error: Event): void => {
          detach();
          return reject(error);
        };

        idbOpenRequest.onsuccess = success;
        idbOpenRequest.onerror = error;

        if (blocked) {
          idbOpenRequest.onblocked = (event: IDBVersionChangeEvent) => {
            blocked(event);
          };
        }

        idbOpenRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          // @ts-ignore
          const db = event?.target?.result;
          this.#setIDBDatabase(name, db);

          if (upgrade) upgrade(db);

          // register onerror handler for IDBDatabase
          db.onerror = (error: Event) => {
            if (onerror) onerror(error);
          };

          // create new objectStore if it does not exist
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, {
              keyPath,
            });
          }
        };
      } catch (error: any) {
        /**
         * indexedDB.open throws a TypeError when the provided version is less than 1.
         * We can safely reject the promise here; in all other instances we will execute
         * the event target onerror handlers.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open#exceptions
         */
        return reject(error);
      }
    });
  }

  async put(
    params: RequiredFields<PromiseIDBParams, 'key'>,
    data: any,
  ): Promise<PromiseIDB> {
    const { key, keyPath = 'id' } = params;
    const methodArgs = {
      ...data,
      [keyPath]: key,
    };

    return this.#callObjectStoreMethod(params, 'put', [methodArgs]);
  }

  #setIDBDatabase(name: string, db: IDBDatabase): void {
    this.#idbDatabaseMap.set(name, db);
  }

  #getIDBDatabase(name: string): Promise<IDBDatabase | undefined> {
    return new Promise((resolve) => {
      if (this.#idbDatabaseMap.has(name)) {
        resolve(this.#idbDatabaseMap.get(name));
      }
      try {
        const idbOpenRequest: IDBOpenDBRequest = window.indexedDB.open(name);

        idbOpenRequest.onsuccess = (event: Event): void => {
          // @ts-ignore
          const db: IDBDatabase = event?.target?.result;
          this.#setIDBDatabase(name, db);
          resolve(db);
        };

        idbOpenRequest.onerror = (event: Event) => {
          resolve(undefined);
        };
      } catch (error) {
        resolve(undefined);
      }
    });
  }

  async #callObjectStoreMethod(
    params: PromiseIDBParams,
    method: OSInstanceMethods,
    methodArgs: any[] | null,
  ): Promise<PromiseIDB> {
    const { name, store } = params;
    const db: IDBDatabase | undefined = await this.#getIDBDatabase(name);

    return new Promise((resolve, reject) => {
      if (!db) {
        return reject(`No database ${name}`);
      }

      try {
        if (db.objectStoreNames.contains(store)) {
          const transaction: IDBTransaction = db.transaction(store, READ_WRITE);
          const objectStore: IDBObjectStore = transaction.objectStore(store);
          // @ts-ignore
          const request: IDBRequest = objectStore[method](...methodArgs);

          request.onsuccess = (ev: Event) => {
            resolve(this);
          };

          request.onerror = (ev: Event) => {
            return reject(ev);
          };
        }
      } catch (error) {
        /**
         * objectStore throws a DataError not handled by request.onerror
         * By catching here we can reject on any unhandled error to reject the promise.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put
         */
        return reject(error);
      }
    });
  }
}