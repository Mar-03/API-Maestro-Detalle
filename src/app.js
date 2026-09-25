const path = require('path');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', apiRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({
    error: 'NO_ENCONTRADO',
    mensaje: 'Endpoint de API no encontrado.'
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(errorHandler);

module.exports = app;
