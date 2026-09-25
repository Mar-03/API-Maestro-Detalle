require('dotenv').config();

const app = require('./app');
const { getPool } = require('./config/db');

const port = Number(process.env.PORT || 3000);

async function start() {
  try {
    await getPool();
    console.log('Conexión a SQL Server establecida.');

    app.listen(port, () => {
      console.log(`Servidor disponible en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No fue posible conectar con SQL Server:', error.message);
    process.exit(1);
  }
}

start();
