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

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export interface PromiseIDBParams {
  name: string;
  store: string;
  key?: string;
  keyPath?: string;
  version?: number;
}
