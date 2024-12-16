import type {
  IDBObjectStoreParams,
  IDBRequestOptions,
  IDBPromise,
} from 'src/object-store/types';

/**
 *
 * @param {string} key
 * @param {String} name
 * @returns {Promise}
 */
export function deleteFromObjectStore(
  params: IDBObjectStoreParams,
  requestOptions: IDBRequestOptions = {},
): IDBPromise {
  return new Promise((resolve, reject) => {});
}
