import { Router } from 'express';
import db from '../db/connection.js';

// Builds a full CRUD router for a simple table.
// `fields` describes every writable column and whether it's required on create.
export function createCrudRouter(table, fields) {
  const router = Router();

  function validateBody(body, { partial } = { partial: false }) {
    const errors = [];
    const values = {};

    for (const field of fields) {
      const hasValue = Object.prototype.hasOwnProperty.call(body, field.name);
      if (!hasValue) {
        if (!partial && field.required) {
          errors.push(`"${field.name}" is required`);
        }
        continue;
      }
      values[field.name] = body[field.name];
    }

    return { errors, values };
  }

  router.get('/', (req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
    res.json(rows);
  });

  router.get('/:id', (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: `${table} row not found` });
    }
    res.json(row);
  });

  router.post('/', (req, res) => {
    const { errors, values } = validateBody(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const cols = Object.keys(values);
    const placeholders = cols.map(() => '?').join(', ');
    const stmt = db.prepare(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
    );

    try {
      const result = stmt.run(...cols.map((c) => values[c]));
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid);
      res.status(201).json(row);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.put('/:id', (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: `${table} row not found` });
    }

    const { errors, values } = validateBody(req.body || {}, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const cols = Object.keys(values);
    if (cols.length === 0) {
      return res.status(400).json({ error: 'no updatable fields provided' });
    }

    const setClause = cols.map((c) => `${c} = ?`).join(', ');
    const stmt = db.prepare(
      `UPDATE ${table} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    );

    try {
      stmt.run(...cols.map((c) => values[c]), req.params.id);
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
      res.json(row);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:id', (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: `${table} row not found` });
    }
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.json(existing);
  });

  return router;
}
