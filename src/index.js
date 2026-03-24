import express from 'express';
import dotenv from 'dotenv';
import corsMiddleware from './middleware/cors.js';
import countriesRouter from './routes/countries.js';
import chaptersRouter from './routes/chapters.js';
import ratesRouter from './routes/rates.js';
import bulletinRouter from './routes/bulletin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/countries', countriesRouter);
app.use('/api/chapters',  chaptersRouter);
app.use('/api/rates',     ratesRouter);
app.use('/api/bulletin',  bulletinRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Tariff Calculator API running on port ${PORT}`);
});