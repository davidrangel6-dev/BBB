import { createCrudRouter } from './crudFactory.js';

export default createCrudRouter('goals', [
  { name: 'category_id', required: false },
  { name: 'title', required: true },
  { name: 'description', required: false },
  { name: 'target_date', required: false },
  { name: 'status', required: false },
]);
