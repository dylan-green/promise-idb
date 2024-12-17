import type {
  IDBObjectStoreParams,
  IDBPromise,
  IDBRequestOptions,
} from 'src/object-store/types';

import { INDEXED_DB, NO_INDEXED_DB } from 'src/constants';

/**
 * Creates a new IDBObjectStore in an indexedDB database
 * @param {IDBObjectStoreParams} params
 * @param {string} params.name - name of the indexedDB database to open
 * @param {string} params.store - name of the object store to be created
 * @param {number} params.version - version of the database
 * @param {string} params.keyPath - the key path to be used on the new object store
 * @param {IDBRequestOptions} options
 * @returns
 */
export function createObjectStore(
  params: IDBObjectStoreParams,
  options: IDBRequestOptions = {},
): IDBPromise {
  return new Promise((resolve, reject) => {
    if (!window || !(INDEXED_DB in window)) {
      reject(NO_INDEXED_DB);
    }

    const { onerror, onsuccess } = options;
    const { name, store, version, keyPath } = params;

    try {
      const indexedDB: IDBOpenDBRequest = window.indexedDB.open(name, version);

      /**
       * The upgradeneeded event is fired when an attempt was made to open
       * a database with a version number higher than its current version.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest/upgradeneeded_event
       */
      indexedDB.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        // @ts-ignore
        const db: IDBDatabase = event?.target?.result;

        db.onerror = (error: Event) => {
          throw error;
        };

        if (!db.objectStoreNames.contains(store)) {
          const objectStore: IDBObjectStore = db.createObjectStore(store, {
            keyPath,
          });

          // execute user-provided onsuccess callback, passing the new IDBObjectStore
          if (onsuccess) onsuccess(objectStore);
        }

        resolve(db);
      };

      indexedDB.onerror = (error: Event) => {
        throw error;
      };
    } catch (error: any) {
      // execute the user-provided onerror callback
      if (onerror) onerror(error);

      // and reject the promise
      reject(error);
    }
  });
}
