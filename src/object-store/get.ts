import type {
  IDBObjectStoreParams,
  IDBRequestOptions,
  IDBPromise,
} from 'src/object-store/types';

/**
 *
 * @param {string} name
 * @param {string} [version='']
 * @returns {Promise}
 */
export function getFromObjectStore(
  params: IDBObjectStoreParams,
  requestOptions: IDBRequestOptions = {},
): IDBPromise {
  return new Promise((resolve, reject) => {});
}
