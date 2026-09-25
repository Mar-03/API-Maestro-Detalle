const { getPool } = require('../config/db');

async function listarMisiones(_req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        MisionID AS misionId,
        Nombre AS nombre,
        Descripcion AS descripcion
      FROM dbo.Misiones
      ORDER BY MisionID;
    `);

    return res.json(result.recordset);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listarMisiones };
