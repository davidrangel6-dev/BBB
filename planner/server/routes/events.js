import { createCrudRouter } from './crudFactory.js';

export default createCrudRouter('events', [
  { name: 'category_id', required: false },
  { name: 'title', required: true },
  { name: 'description', required: false },
  { name: 'start_time', required: true },
  { name: 'end_time', required: false },
  { name: 'location', required: false },
]);
