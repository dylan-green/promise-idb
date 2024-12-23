export interface IEventHandlers {
  onsuccess?: Function;
  onerror?: Function;
  blocked?: Function;
  blocking?: Function;
  upgrade?: Function;
  terminated?: Function;
}

export type ObjectStoreMethods =
  | 'add'
  | 'clear'
  | 'count'
  | 'delete'
  | 'get'
  | 'getAll'
  | 'getAllKeys'
  | 'getKey'
  | 'index'
  | 'openCursor'
  | 'openKeyCursor'
  | 'put';

enum AutoEnum {
  auto,
  null,
}

export type KeyPath = string | string[];

export type CreateIndexOptions = {
  unique?: boolean;
  multientry?: boolean;
  locale?: string | AutoEnum;
};

export interface ICreateIndexParams {
  indexName: string;
  keyPath: KeyPath;
  options?: CreateIndexOptions;
}

export type OmitFieldType<T, K extends keyof T> = T & Omit<T, K>;

export type Override<T, K extends string, J> = Omit<T, K> & { [P in K]: J };

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface IPromiseIDBParams {
  name: string;
  store: string;
  key?: string;
  keyPath?: KeyPath;
  version?: number;
}
