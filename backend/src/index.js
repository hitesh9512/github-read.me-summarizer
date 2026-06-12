require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const summaryRoutes = require('./routes/summary.routes');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/summary', summaryRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  console.error(`[ERROR] ${status} - ${message}`);
  res.status(status).json({ error: message });
});

// Export for Vercel serverless
module.exports = app;

// Local dev server
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
