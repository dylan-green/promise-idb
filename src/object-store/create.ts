import type {
  IDBObjectStoreParams,
  IDBRequestOptions,
  IDBPromise,
} from 'src/object-store/types';

import { INDEXED_DB, NO_INDEXED_DB } from 'src/constants';

/**
 *
 * @param {IDBObjectStoreParams & IDBRequestOptions} options
 * @returns
 */
export function createObjectStore(
  params: IDBObjectStoreParams,
  requestOptions: IDBRequestOptions = {},
): IDBPromise {
  return new Promise((resolve, reject) => {
    if (!window || !(INDEXED_DB in window)) {
      reject(NO_INDEXED_DB);
    }

    const { name, store, version, keyPath = 'id' } = params;
    const { onerror, onsuccess } = requestOptions;

    const indexedDB: IDBOpenDBRequest = window.indexedDB.open(name, version);

    indexedDB.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      // @ts-ignore
      const db: IDBDatabase = event?.target?.result;

      db.onerror = (error: Event) => {
        // run user-provided error callback, passing in the erro that occurred
        if (onerror) onerror(error);

        reject(error);
      };

      if (!db.objectStoreNames.contains(store)) {
        db.createObjectStore(store, { keyPath });

        if (onsuccess) onsuccess(db);
      }

      resolve(db);
    };

    indexedDB.onerror = (error: Event) => {
      if (onerror) onerror(error);

      reject(error);
    };
  });
}
