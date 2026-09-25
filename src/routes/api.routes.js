const express = require('express');
const { registrar } = require('../controllers/registro.controller');
const { listarMisiones } = require('../controllers/catalogo.controller');
const { listarEstudiantes } = require('../controllers/estudiantes.controller');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, servicio: 'API Maestro-Detalle' });
});

router.post('/registro', registrar);
router.get('/misiones', listarMisiones);
router.get('/estudiantes', listarEstudiantes);

module.exports = router;
