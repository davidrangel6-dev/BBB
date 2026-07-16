import { createCrudRouter } from './crudFactory.js';

export default createCrudRouter('tasks', [
  { name: 'category_id', required: false },
  { name: 'title', required: true },
  { name: 'description', required: false },
  { name: 'due_date', required: false },
  { name: 'completed', required: false },
]);
