import { createCrudRouter } from './crudFactory.js';

export default createCrudRouter('notes', [
  { name: 'category_id', required: false },
  { name: 'title', required: false },
  { name: 'body', required: true },
]);
