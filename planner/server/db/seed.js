import db from './connection.js';

const CATEGORIES = [
  { name: 'AFL', color: '#8B5E3C' },
  { name: 'BBB', color: '#1F3A5F' },
  { name: 'Mason', color: '#3E7C4F' },
  { name: 'Me', color: '#6B7280' },
];

export function seed() {
  const insert = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
  const insertMany = db.transaction((categories) => {
    for (const category of categories) {
      insert.run(category.name, category.color);
    }
  });

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM categories').get();
  if (count === 0) {
    insertMany(CATEGORIES);
  }
}
