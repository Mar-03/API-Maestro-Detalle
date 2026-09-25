const { getPool } = require('../config/db');

async function listarEstudiantes(_req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        e.Carnet,
        e.Nombre AS EstudianteNombre,
        e.Correo,
        m.MisionID,
        m.Nombre AS MisionNombre,
        m.Descripcion,
        CAST(COALESCE(em.Estado, 0) AS bit) AS Estado,
        em.FechaRegistro
      FROM dbo.Estudiantes e
      CROSS JOIN dbo.Misiones m
      LEFT JOIN dbo.EstudianteMisiones em
        ON em.Carnet = e.Carnet
       AND em.MisionID = m.MisionID
      ORDER BY e.Nombre, e.Carnet, m.MisionID;
    `);

    const students = new Map();

    for (const row of result.recordset) {
      if (!students.has(row.Carnet)) {
        students.set(row.Carnet, {
          carnet: row.Carnet,
          nombre: row.EstudianteNombre,
          correo: row.Correo,
          completadas: 0,
          total: 0,
          porcentaje: 0,
          misiones: []
        });
      }

      const student = students.get(row.Carnet);
      const estado = Boolean(row.Estado);

      student.total += 1;
      if (estado) student.completadas += 1;
      student.misiones.push({
        misionId: row.MisionID,
        nombre: row.MisionNombre,
        descripcion: row.Descripcion,
        estado,
        fechaRegistro: row.FechaRegistro
      });
    }

    const response = Array.from(students.values()).map((student) => ({
      ...student,
      porcentaje:
        student.total === 0
          ? 0
          : Number(((student.completadas / student.total) * 100).toFixed(2))
    }));

    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listarEstudiantes };
