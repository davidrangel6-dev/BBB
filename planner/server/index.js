import express from 'express';
import cors from 'cors';
import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';
import categoriesRouter from './routes/categories.js';
import tasksRouter from './routes/tasks.js';
import eventsRouter from './routes/events.js';
import goalsRouter from './routes/goals.js';
import notesRouter from './routes/notes.js';

migrate();
seed();

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

app.use('/api/categories', categoriesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/events', eventsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/notes', notesRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, HOST, () => {
  console.log(`Planner server listening on http://${HOST}:${PORT}`);
});
