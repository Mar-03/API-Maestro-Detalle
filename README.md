# API Maestro-Detalle con Catálogo y Control de Estado

Proyecto de laboratorio en Node.js + Express + SQL Server.

## Endpoints

- `GET /api/health`
- `POST /api/registro`
- `GET /api/misiones`
- `GET /api/estudiantes`
- `/` muestra el frontend del tablero.

## 1. Configuración

```bash
npm install
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Completa `.env` con las credenciales entregadas por el catedrático. **No subas `.env` a GitHub.**

## 2. Ejecutar

```bash
npm run dev
```

Abrir:

- Frontend: `http://localhost:3000/`
- Salud API: `http://localhost:3000/api/health`
- Catálogo: `http://localhost:3000/api/misiones`

## 3. JSON de prueba

```json
{
  "maestro": {
    "carnet": "TU-CARNET",
    "nombre": "TU NOMBRE COMPLETO",
    "correo": "tu-correo@miumg.edu.gt"
  },
  "detalle": [
    { "misionId": 1, "estado": true },
    { "misionId": 2, "estado": false },
    { "misionId": 3, "estado": true }
  ]
}
```

### PowerShell

```powershell
$body = @{
  maestro = @{
    carnet = "TU-CARNET"
    nombre = "TU NOMBRE COMPLETO"
    correo = "tu-correo@miumg.edu.gt"
  }
  detalle = @(
    @{ misionId = 1; estado = $true }
    @{ misionId = 2; estado = $false }
    @{ misionId = 3; estado = $true }
  )
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/registro" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## 4. Comportamiento esperado

- Primer POST del carnet: inserta `Estudiantes` y crea los detalles recibidos.
- POST posteriores del mismo carnet: actualizan nombre/correo y estado de cada misión recibida.
- Un `misionId` inexistente produce `422` y hace rollback de toda la operación.
- Un correo duplicado que viole la restricción UNIQUE produce `409`.
- El detalle usa la restricción única `(Carnet, MisionID)` para impedir duplicados lógicos.

## 5. Consulta rápida de catálogo en SQL Server

```sql
SELECT MisionID, Nombre, Descripcion
FROM dbo.Misiones
ORDER BY MisionID;
```

## 6. Seguridad

Las credenciales reales sólo deben vivir en `.env` local o en las variables de entorno del hosting. Nunca las escribas en el código, README, commits ni capturas públicas.
