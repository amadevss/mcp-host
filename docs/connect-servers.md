# Conectar varios servidores MCP

[Volver al README](../README.md)

## 1. Comprueba compatibilidad

Necesitas el endpoint **Streamable HTTP** completo. Ejemplos:

- Tu copia: `http://localhost:3000/api/mcp`.
- Otro MCP: `https://servicio.example/mcp`.

La app no añade `/api/mcp` automáticamente. Usa exactamente la ruta publicada por el proveedor, incluidas sus barras finales si las requiere. No se admiten comandos stdio, SSE heredado ni flujo de login OAuth.

## 2. Permite los destinos

En `.env.local`:

```dotenv
MCP_LOCAL_URL=http://localhost:3000/api/mcp
MCP_ALLOWED_URLS=https://servicio.example/mcp,https://otro.example/api/mcp
```

Reinicia la aplicación. El servidor local se permite mediante `MCP_LOCAL_URL`; no hace falta repetirlo. Las URLs se comparan completas y normalizadas con la API URL: esquema, host, puerto, ruta y query. No hay comodines. Se rechazan credenciales incrustadas, fragmentos y redirecciones.

La lista evita que un visitante convierta tu API en un proxy hacia cualquier dirección. Añade solo destinos bajo tu control o de proveedores de confianza. No permitas dominios controlados por usuarios desconocidos ni URLs que cambien de destino mediante DNS.

## 3. Configura autenticación privada

Para headers estáticos, usa un objeto JSON de **URL exacta → headers**. Ejemplo con Neon:

```dotenv
MCP_ALLOWED_URLS=https://mcp.neon.tech/mcp
MCP_SERVER_HEADERS='{"https://mcp.neon.tech/mcp":{"Authorization":"Bearer TU_CLAVE_NEON","x-read-only":"true"}}'
```

En un panel de hosting, introduce el JSON como valor, sin las comillas simples exteriores que usa el archivo dotenv. El ejemplo requiere una clave Neon válida y las capacidades que permita tu cuenta.

El chat ya no añade Neon de forma implícita por `NEON_API_KEY`. **Migración:** configura URL y headers como arriba, añade Neon en el panel y selecciónalo en el chat. Así todos los servidores siguen el mismo recorrido.

Las credenciales son compartidas por la instalación: quien tenga acceso al host puede utilizar sus MCP permitidos. No son cuentas individuales.

## 4. Añade y comprueba

En el panel, escribe un nombre, pega la URL y pulsa **Añadir servidor**. Después pulsa **Conectar** para listar las herramientas.

- Un MCP sin herramientas puede conectar correctamente; verás «0 herramientas».
- Para argumentos simples hay campos; los obligatorios llevan un asterisco.
- Para listas, objetos y esquemas complejos usa el editor JSON y consulta «Ver esquema».
- Los campos opcionales vacíos se omiten, no se rellenan con valores inventados.
- El servidor MCP valida las restricciones finales del esquema.
- Dos servidores con una herramienta del mismo nombre conservan campos y resultados independientes.

## 5. Consulta desde el chat

Marca **Usar en chat** o el checkbox en la pantalla Chat. Hasta seis servidores y cien herramientas en total por solicitud. No necesitas mantener una conexión del panel abierta; el chat vuelve a comprobar los servidores.

## Acceso de red

Las conexiones salen desde **Next.js**, no desde el navegador. `localhost` es la máquina o contenedor de Next.js. Un despliegue en Vercel no puede acceder al localhost de tu laptop. Publica el MCP mediante HTTPS o configura una red privada accesible desde tu hosting.

Un MCP con sesión puede exigir mantener contexto entre llamadas. Esta plantilla abre sesiones nuevas por consulta manual y por respuesta de chat; no mantiene sesiones entre mensajes.
