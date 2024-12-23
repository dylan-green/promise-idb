import type {
  CreateIndexParams,
  OmitFieldType,
  PromiseIDBParams,
  PromiseIDBEventHandlers,
  RequiredFields,
} from './types';
import {
  ADD,
  CLEAR,
  GET,
  PUT,
  INDEXED_DB,
  NO_INDEXED_DB,
  READ_WRITE,
} from './constants';

type OSInstanceMethods = 'add' | 'clear' | 'delete' | 'get' | 'put';

export class PromiseIDB {
  #idbDatabaseMap: Map<string, IDBDatabase>;

  constructor() {
    this.#idbDatabaseMap = new Map<string, IDBDatabase>();
  }

  /**
   * Adds a new record to the specified objectStore.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/add
   *
   * @param {PromiseIDBParams} params
   * @param {any} value
   * @param {string} key
   * @returns {Promise<PromiseIDB>}
   */
  async add(
    params: PromiseIDBParams,
    value: any,
    key?: string,
  ): Promise<PromiseIDB> {
    return this.#callObjectStoreMethod(params, ADD, [value, key]);
  }

  /**
   * Deletes all the current data out of the specified objectStore.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/clear
   *
   * @param {PromiseIDBParams} params
   * @returns {Promise<PromiseIDB>}
   */
  async clear(params: PromiseIDBParams): Promise<PromiseIDB> {
    return this.#callObjectStoreMethod(params, CLEAR, null);
  }

  /**
   * Creates one or more new fields/columns defining a new data point for each database record to contain.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/createIndex
   *
   * @param {PromiseIDBParams} params
   * @param {CreateIndexParams | CreateIndexParams[]} indexes
   * @returns {Promise<PromiseIDB>}
   */
  async createIndex(
    params: PromiseIDBParams,
    indexes: CreateIndexParams | CreateIndexParams[],
  ): Promise<PromiseIDB> {
    const { name, store } = params;
    const db: IDBDatabase | undefined = await this.#getIDBDatabase(name);
    const nextVersion = db?.version ? db?.version + 1 : 1;
    const nextParams = { version: nextVersion, ...params };

    db?.close();

    const upgrade = (event: IDBVersionChangeEvent) => {
      // @ts-ignore
      const db = event?.target?.result;
      // @ts-ignore
      const transaction = event?.target?.transaction;
      const objectStore: IDBObjectStore = transaction.objectStore(store);

      if (Array.isArray(indexes)) {
        indexes.forEach((index) => {
          const { indexName, keyPath, options } = index;
          objectStore.createIndex(indexName, keyPath, options);
        });
      } else {
        const { indexName, keyPath, options } = indexes;
        objectStore.createIndex(indexName, keyPath, options);
      }
    };

    return this.openDB(nextParams, { upgrade });
  }

  /**
   * Creates a new objectStore in the specified IDBDatabase.
   *
   * @param {PromiseIDBParams} params
   * @param {PromiseIDBEventHandlers} eventHandlers
   * @returns {Promise<PromiseIDB>}
   */
  async createStore(
    params: PromiseIDBParams,
    eventHandlers: OmitFieldType<PromiseIDBEventHandlers, 'upgrade'> = {},
  ): Promise<PromiseIDB> {
    const db = await this.#getIDBDatabase(params.name);
    const nextVersion = db?.version ? db?.version + 1 : 1;
    const nextParams = { version: nextVersion, ...params };

    db?.close();

    const upgrade = (event: IDBVersionChangeEvent) => {
      // @ts-ignore
      const indexedDB = event?.target?.result;
      const { store, keyPath = 'id' } = nextParams;
      if (!indexedDB.objectStoreNames.contains(store)) {
        indexedDB.createObjectStore(store, {
          keyPath,
        });
      }
    };

    return this.openDB(nextParams, {
      upgrade,
      ...eventHandlers,
    });
  }

  /**
   * Deletes the specified record or records.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/delete
   *
   * @param {PromiseIDBParams} params
   * @param {string | IDBKeyRange} key
   * @returns {Promise<PromiseIDB>}
   */
  async delete(
    params: PromiseIDBParams,
    key: string | IDBKeyRange,
  ): Promise<PromiseIDB> {
    return this.#callObjectStoreMethod(params, 'delete', [key]);
  }

  /**
   * Destroys the index with the specified name in the connected database, used during a version upgrade.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/deleteIndex
   *
   * @param {PromiseIDBParams} params
   * @param {string} indexName
   * @returns {Promise<PromiseIDB>}
   */
  async deleteIndex(
    params: PromiseIDBParams,
    indexName: string,
  ): Promise<PromiseIDB> {
    const { name, store } = params;
    const db: IDBDatabase | undefined = await this.#getIDBDatabase(name);
    const nextVersion = db?.version ? db?.version + 1 : 1;
    const nextParams = { version: nextVersion, ...params };

    db?.close();

    const upgrade = (event: IDBVersionChangeEvent) => {
      // @ts-ignore
      const transaction = event?.target?.transaction;
      const objectStore: IDBObjectStore = transaction.objectStore(store);
      objectStore.deleteIndex(indexName);
    };

    return this.openDB(nextParams, { upgrade });
  }

  /**
   * Retrieves a specific record from the specified objectStore.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/get
   *
   * @param {RequiredFields<PromiseIDBParams, 'key'>} params
   * @returns {Promise<PromiseIDB>}
   */
  async get(
    params: RequiredFields<PromiseIDBParams, 'key'>,
  ): Promise<PromiseIDB> {
    const { key } = params;
    return this.#callObjectStoreMethod(params, GET, [key]);
  }

  async getAll(): Promise<PromiseIDB> {
    return new Promise((resolve, reject) => {});
  }

  async getAllKeys(): Promise<PromiseIDB> {
    return new Promise((resolve, reject) => {});
  }

  /**
   * Get the current version of the named IDBDatabase.
   *
   * @param {string} name
   * @returns {Promise<number | undefined>}
   */
  async getDBVersion(name: string): Promise<number | undefined> {
    const db = await this.#getIDBDatabase(name);
    return db?.version;
  }

  async getKey(): Promise<PromiseIDB> {
    return new Promise((resolve, reject) => {});
  }

  /**
   * Opens an IDBDatabase - creates a new db if one does not already exist.
   *
   * Accepts callback functions for all IDBOpenDBRequest events,
   * in addition to custom onsuccess and onerror event callbacks.
   *
   * @param {PromiseIDBParams} params
   * @param {PromiseIDBEventHandlers} handlers
   * @returns {Promise<PromiseIDB>}
   */
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
    const { name, version } = params;

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
          this.#setIDBDatabase(name, db);

          detach();
          return resolve(this);
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
          // register error handler for this db instance
          db.onerror = (error: Event) => {
            return reject(error);
          };
          // set new db in #idbDatabaseMap
          this.#setIDBDatabase(name, db);
          // call upgrade handler
          if (upgrade) upgrade(event);
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

  /**
   * Updates a given record in a database, or inserts a new record if the given item does not already exist.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put
   *
   * @param {RequiredFields<PromiseIDBParams, 'key'>} params
   * @param {any} data
   * @returns {Promise<PromiseIDB>}
   */
  async put(
    params: RequiredFields<PromiseIDBParams, 'key'>,
    data: any,
  ): Promise<PromiseIDB> {
    const { key, keyPath = 'id' } = params;
    const methodArgs = {
      ...data,
      [keyPath]: key,
    };

    return this.#callObjectStoreMethod(params, PUT, [methodArgs]);
  }

  /**
   * Sets IDBDatabase into #idbDatabaseMap.
   *
   * @param {string} name
   * @param {IDBDatabase} db
   */
  #setIDBDatabase(name: string, db: IDBDatabase): void {
    this.#idbDatabaseMap.set(name, db);
  }

  /**
   * Get IDBdatabase from internal mapping, or calls indexedDB.open.
   * On error the promise will resolve with 'undefined' - promise never rejects.
   *
   * @param {string} name
   * @returns {Promise}
   */
  #getIDBDatabase(name: string): Promise<IDBDatabase | undefined> {
    return new Promise((resolve) => {
      if (this.#idbDatabaseMap.has(name)) {
        return resolve(this.#idbDatabaseMap.get(name));
      }

      try {
        const idbOpenRequest: IDBOpenDBRequest = window.indexedDB.open(name);

        idbOpenRequest.onerror = (event: Event) => {
          return resolve(undefined);
        };

        // onsuccess, set the db into internal mapping, and resolve with the db
        idbOpenRequest.onsuccess = (event: Event): void => {
          // @ts-ignore
          const db: IDBDatabase = event?.target?.result;
          this.#setIDBDatabase(name, db);
          return resolve(db);
        };
      } catch (error) {
        return resolve(undefined);
      }
    });
  }

  /**
   * Handles the common pattern of beginning a db transaction, retrieving the
   * objectStore, and creating an IDBRequest by dispatching an objectStore method.
   *
   * @param {PromiseIDBParams} params
   * @param {OSInstanceMethods} method
   * @param {any[] | null} methodArgs
   * @returns {Promise<PromiseIDB>}
   */
  async #callObjectStoreMethod(
    params: PromiseIDBParams,
    method: OSInstanceMethods,
    methodArgs: any[] | null,
  ): Promise<PromiseIDB> {
    const { name, store } = params;
    const db: IDBDatabase | undefined = await this.#getIDBDatabase(name);
    const args = methodArgs ?? [];

    return new Promise((resolve, reject) => {
      if (!db) {
        return reject(`No database ${name}`);
      }

      try {
        if (db.objectStoreNames.contains(store)) {
          const transaction: IDBTransaction = db.transaction(store, READ_WRITE);
          const objectStore: IDBObjectStore = transaction.objectStore(store);
          // @ts-ignore
          const request: IDBRequest = objectStore[method](...args);

          request.onsuccess = (ev: Event) => {
            return resolve(this);
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
