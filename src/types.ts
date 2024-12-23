export interface PromiseIDBEventHandlers {
  onsuccess?: Function;
  onerror?: Function;
  blocked?: Function;
  blocking?: Function;
  upgrade?: Function;
  terminated?: Function;
}

enum AutoEnum {
  auto,
  null,
}

export type CreateIndexOptions = {
  unique?: boolean;
  multientry?: boolean;
  locale?: string | AutoEnum;
};

export interface CreateIndexParams {
  indexName: string;
  keyPath: string | string[];
  options?: CreateIndexOptions;
}

export type OmitFieldType<T, K extends keyof T> = T & Omit<T, K>;

export type Override<T, K extends string, J> = Omit<T, K> & { [P in K]: J };

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface PromiseIDBParams {
  name: string;
  store: string;
  key?: string;
  keyPath?: string;
  version?: number;
}
