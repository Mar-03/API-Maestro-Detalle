function errorHandler(error, _req, res, _next) {
  console.error(error);

  if (error.status) {
    return res.status(error.status).json({
      error: error.code || 'SOLICITUD_INVALIDA',
      mensaje: error.message
    });
  }

  // SQL Server: violación de UNIQUE / PK.
  if (error.number === 2601 || error.number === 2627) {
    return res.status(409).json({
      error: 'DATO_DUPLICADO',
      mensaje: 'Existe un valor duplicado que viola una restricción única. Verifica carnet/correo.'
    });
  }

  // SQL Server: conflicto de clave foránea.
  if (error.number === 547) {
    return res.status(422).json({
      error: 'REFERENCIA_INVALIDA',
      mensaje: 'La solicitud contiene una referencia que no existe.'
    });
  }

  return res.status(500).json({
    error: 'ERROR_INTERNO',
    mensaje: 'Ocurrió un error interno al procesar la solicitud.'
  });
}

module.exports = { errorHandler };
