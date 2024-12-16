import type {
  IDBObjectStoreParams,
  IDBRequestOptions,
  IDBPromise,
} from 'src/object-store/types';

import { INDEXED_DB, NO_INDEXED_DB } from 'src/constants';

/**
 *
 * @param {string} name
 * @param {object} [data={}]
 * @returns {Promise}
 */
export function putToObjectStore(
  params: IDBObjectStoreParams,
  data: any = {},
  requestOptions: IDBRequestOptions = {},
): IDBPromise {
  return new Promise((resolve, reject) => {
    if (!window || !(INDEXED_DB in window)) {
      reject(NO_INDEXED_DB);
    }

    const { id, name, store, version } = params;
    const { onsuccess, onerror } = requestOptions;

    const indexedDB: IDBOpenDBRequest = window.indexedDB.open(name, version);

    indexedDB.onsuccess = (event: Event) => {
      try {
        //@ts-ignore
        const db: IDBDatabase = event?.target?.result;
        const transaction: IDBTransaction = db.transaction(store, 'readwrite');
        const objectStore: IDBObjectStore = transaction.objectStore(store);
        const request: IDBRequest = objectStore.put({
          id,
          ...data,
        });

        request.onsuccess = (ev: Event) => {
          if (onsuccess) onsuccess(ev);

          resolve(db);
        };
      } catch (error) {
        if (onerror) onerror(error);

        reject(error);
      }
    };

    indexedDB.onerror = (error: Event) => {
      if (onerror) onerror(error);

      reject(error);
    };
  });
}
