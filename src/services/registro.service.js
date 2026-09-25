const { sql, getPool } = require('../config/db');

function normalizePayload(body) {
  if (!body || typeof body !== 'object') {
    const error = new Error('El cuerpo de la solicitud debe ser un JSON válido.');
    error.status = 400;
    throw error;
  }

  const { maestro, detalle } = body;

  if (!maestro || typeof maestro !== 'object') {
    const error = new Error('El objeto maestro es obligatorio.');
    error.status = 400;
    throw error;
  }

  const carnet = String(maestro.carnet || '').trim();
  const nombre = String(maestro.nombre || '').trim();
  const correo = String(maestro.correo || '').trim();

  if (!carnet || carnet.length > 25) {
    const error = new Error('maestro.carnet es obligatorio y debe tener máximo 25 caracteres.');
    error.status = 400;
    throw error;
  }

  if (!nombre || nombre.length > 150) {
    const error = new Error('maestro.nombre es obligatorio y debe tener máximo 150 caracteres.');
    error.status = 400;
    throw error;
  }

  if (!correo || correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    const error = new Error('maestro.correo es obligatorio y debe ser un correo válido de máximo 150 caracteres.');
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(detalle) || detalle.length === 0) {
    const error = new Error('detalle debe ser un arreglo con al menos una misión.');
    error.status = 400;
    throw error;
  }

  const missionIds = new Set();
  const normalizedDetalle = detalle.map((item, index) => {
    const misionId = Number(item?.misionId);
    const estado = item?.estado;

    if (!Number.isInteger(misionId) || misionId <= 0) {
      const error = new Error(`detalle[${index}].misionId debe ser un entero positivo.`);
      error.status = 400;
      throw error;
    }

    if (typeof estado !== 'boolean') {
      const error = new Error(`detalle[${index}].estado debe ser true o false.`);
      error.status = 400;
      throw error;
    }

    if (missionIds.has(misionId)) {
      const error = new Error(`La misión ${misionId} está repetida en el detalle.`);
      error.status = 400;
      throw error;
    }

    missionIds.add(misionId);
    return { misionId, estado };
  });

  return {
    maestro: { carnet, nombre, correo },
    detalle: normalizedDetalle
  };
}

async function registrarMaestroDetalle(body) {
  const payload = normalizePayload(body);
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);

  try {
    const { carnet, nombre, correo } = payload.maestro;

    // 1) Validar primero todas las referencias del catálogo.
    for (const item of payload.detalle) {
      const mission = await new sql.Request(transaction)
        .input('MisionID', sql.Int, item.misionId)
        .query(`
          SELECT MisionID
          FROM dbo.Misiones
          WHERE MisionID = @MisionID;
        `);

      if (mission.recordset.length === 0) {
        const error = new Error(`La misión con ID ${item.misionId} no existe en el catálogo.`);
        error.status = 422;
        error.code = 'MISION_NO_EXISTE';
        throw error;
      }
    }

    // 2) Insertar o actualizar estudiante.
    const existingStudent = await new sql.Request(transaction)
      .input('Carnet', sql.VarChar(25), carnet)
      .query(`
        SELECT Carnet
        FROM dbo.Estudiantes WITH (UPDLOCK, HOLDLOCK)
        WHERE Carnet = @Carnet;
      `);

    const studentCreated = existingStudent.recordset.length === 0;

    if (studentCreated) {
      await new sql.Request(transaction)
        .input('Carnet', sql.VarChar(25), carnet)
        .input('Nombre', sql.NVarChar(150), nombre)
        .input('Correo', sql.NVarChar(150), correo)
        .query(`
          INSERT INTO dbo.Estudiantes (Carnet, Nombre, Correo)
          VALUES (@Carnet, @Nombre, @Correo);
        `);
    } else {
      await new sql.Request(transaction)
        .input('Carnet', sql.VarChar(25), carnet)
        .input('Nombre', sql.NVarChar(150), nombre)
        .input('Correo', sql.NVarChar(150), correo)
        .query(`
          UPDATE dbo.Estudiantes
          SET Nombre = @Nombre,
              Correo = @Correo
          WHERE Carnet = @Carnet;
        `);
    }

    // 3) Insertar o actualizar cada detalle.
    let inserted = 0;
    let updated = 0;

    for (const item of payload.detalle) {
      const result = await new sql.Request(transaction)
        .input('Carnet', sql.VarChar(25), carnet)
        .input('MisionID', sql.Int, item.misionId)
        .input('Estado', sql.Bit, item.estado)
        .query(`
          UPDATE dbo.EstudianteMisiones
          SET Estado = @Estado
          WHERE Carnet = @Carnet
            AND MisionID = @MisionID;

          IF @@ROWCOUNT = 0
          BEGIN
            INSERT INTO dbo.EstudianteMisiones (Carnet, MisionID, Estado)
            VALUES (@Carnet, @MisionID, @Estado);
            SELECT CAST(1 AS bit) AS Insertado;
          END
          ELSE
          BEGIN
            SELECT CAST(0 AS bit) AS Insertado;
          END;
        `);

      if (result.recordset[0]?.Insertado) inserted += 1;
      else updated += 1;
    }

    const progress = await new sql.Request(transaction)
      .input('Carnet', sql.VarChar(25), carnet)
      .query(`
        SELECT
          COUNT(m.MisionID) AS TotalMisiones,
          SUM(CASE WHEN em.Estado = 1 THEN 1 ELSE 0 END) AS Completadas
        FROM dbo.Misiones m
        LEFT JOIN dbo.EstudianteMisiones em
          ON em.MisionID = m.MisionID
         AND em.Carnet = @Carnet;
      `);

    await transaction.commit();

    const total = Number(progress.recordset[0]?.TotalMisiones || 0);
    const completadas = Number(progress.recordset[0]?.Completadas || 0);

    return {
      status: studentCreated ? 201 : 200,
      data: {
        mensaje: studentCreated
          ? 'Estudiante registrado y misiones procesadas correctamente.'
          : 'Estudiante actualizado y misiones procesadas correctamente.',
        estudiante: { carnet, nombre, correo },
        detalleProcesado: {
          insertadas: inserted,
          actualizadas: updated
        },
        avance: {
          completadas,
          total,
          porcentaje: total === 0 ? 0 : Number(((completadas / total) * 100).toFixed(2))
        }
      }
    };
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (_) {
      // La transacción puede estar cerrada si SQL Server la abortó.
    }

    throw error;
  }
}

module.exports = { registrarMaestroDetalle };
