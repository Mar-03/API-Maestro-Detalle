const { registrarMaestroDetalle } = require('../services/registro.service');

async function registrar(req, res, next) {
  try {
    const result = await registrarMaestroDetalle(req.body);
    return res.status(result.status).json(result.data);
  } catch (error) {
    return next(error);
  }
}

module.exports = { registrar };
