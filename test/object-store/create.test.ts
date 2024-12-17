import { createObjectStore } from 'src/object-store/create';

test('it opens indexedDB and creates an object store with provided params', async () => {
  const params = {
    name: 'todo-list',
    store: 'user-todo',
    version: 1,
  };

  const db: IDBDatabase = await createObjectStore(params);

  expect(db).toBeInstanceOf(IDBDatabase);
  expect(db.name).toEqual('todo-list');
  expect(db.objectStoreNames).toEqual(['user-todo']);
  expect(db.version).toEqual(1);
});
