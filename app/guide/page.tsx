import Link from "next/link";
import { HostShell } from "../components/host-shell";

export default function Guide() {
  return (
    <HostShell>
      <section className="panel">
        <p className="eyebrow">Guía de inicio</p>
        <h1 className="mt-3 text-3xl font-bold">
          De la plantilla a tu propio MCP
        </h1>
        <p className="hint mt-4">
          MCP es un protocolo para publicar herramientas que otras aplicaciones
          pueden descubrir y ejecutar. Esta plantilla incluye un servidor, un
          panel para probar herramientas y un chat que puede utilizarlas.
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
          <a href="#try">Probar</a>
          <a href="#create">Crear</a>
          <a href="#connect">Conectar</a>
          <a href="#chat">Chat</a>
          <a href="#deploy">Desplegar</a>
        </div>
      </section>
      <section id="try" className="panel">
        <h2 className="text-xl font-semibold">1. Probar sin claves</h2>
        <ol className="guide-list">
          <li>
            Con Node.js 22, crea tu copia mediante un fork o descarga el
            repositorio.
          </li>
          <li>
            Ejecuta <code>npm ci</code>, copia <code>.env.example</code> a{" "}
            <code>.env.local</code> y ejecuta <code>npm run dev</code>.
          </li>
          <li>
            Abre <code>http://localhost:3000</code>. Pulsa «Añadir MCP de
            ejemplo» y después «Conectar».
          </li>
          <li>
            En echo, introduce un mensaje y pulsa «Ejecutar herramienta». En
            roll_dice, introduce 6.
          </li>
        </ol>
        <p className="hint">
          El resultado de echo será «Echo: tu mensaje». El dado devolverá un
          valor entre 1 y 6.
        </p>
      </section>
      <section id="create" className="panel">
        <h2 className="text-xl font-semibold">2. Crear tus herramientas</h2>
        <p className="mt-3">
          Edita <code>lib/mcp-tools.ts</code>. Cada herramienta tiene un nombre
          único, una descripción, un esquema de argumentos y una función que
          devuelve contenido MCP.
        </p>
        <pre className="result">{`server.registerTool("saludar", {
  description: "Saluda a una persona por su nombre.",
  inputSchema: { nombre: z.string().min(1) },
}, async ({ nombre }) => ({
  content: [{ type: "text", text: \`Hola, \${nombre}\` }],
}));`}</pre>
        <p className="hint">
          Añade este bloque dentro de registerTools. Guarda, vuelve a conectar
          desde el panel y prueba saludar. No tienes que modificar la ruta HTTP.
          Consulta el ejemplo completo en docs/create-mcp.md.
        </p>
      </section>
      <section id="connect" className="panel">
        <h2 className="text-xl font-semibold">3. Conectar otros servidores</h2>
        <ol className="guide-list">
          <li>
            Obtén la URL completa de su endpoint HTTP Streamable, por ejemplo{" "}
            <code>https://mi-servidor.com/api/mcp</code>.
          </li>
          <li>
            Añádela a <code>MCP_ALLOWED_URLS</code> en <code>.env.local</code>.
            Para varias URLs, sepáralas con comas. Reinicia Next.js.
          </li>
          <li>
            Si requiere una clave, configura sus headers en{" "}
            <code>MCP_SERVER_HEADERS</code>. No pegues claves en la URL ni en el
            panel.
          </li>
          <li>
            Añade un nombre y la URL en el panel y pulsa «Conectar». El servidor
            debe ser accesible desde donde se ejecuta esta aplicación.
          </li>
        </ol>
        <p className="hint">
          Se admiten herramientas mediante HTTP Streamable y headers estáticos.
          Esta plantilla no implementa inicio de sesión OAuth, transporte stdio,
          SSE heredado, resources ni prompts MCP. Un servidor de Cursor basado
          en un comando local necesita un adaptador HTTP.
        </p>
      </section>
      <section id="chat" className="panel">
        <h2 className="text-xl font-semibold">4. Consultar desde el chat</h2>
        <ol className="guide-list">
          <li>
            Configura <code>GOOGLE_GENERATIVE_AI_API_KEY</code> en el servidor.
            Opcionalmente cambia <code>GEMINI_MODEL</code>.
          </li>
          <li>
            Reinicia la app y abre{" "}
            <Link className="underline" href="/chat">
              Chat
            </Link>
            .
          </li>
          <li>
            Selecciona los MCP que puede usar Gemini y pregunta por sus
            herramientas o datos.
          </li>
        </ol>
        <p className="hint">
          El chat conecta de nuevo a los servidores seleccionados en cada
          mensaje. Si uno falla, indica cuál; comprueba su conexión en el panel.
          Los mensajes no se guardan al recargar. Gemini recibe el historial,
          las descripciones de las herramientas y los resultados que utiliza.
        </p>
      </section>
      <section id="deploy" className="panel">
        <h2 className="text-xl font-semibold">5. Publicar tu copia</h2>
        <p className="mt-3">
          Despliega como aplicación Next.js con Node.js, configura{" "}
          <code>MCP_LOCAL_URL</code> con tu dominio y{" "}
          <code>HOST_ACCESS_TOKEN</code> con una clave larga y aleatoria.
          Introduce esa clave en «Acceso al host» para usar el panel y el chat.
          Para proteger también tu MCP, configura <code>MCP_BEARER_TOKEN</code>.
        </p>
        <p className="hint mt-3">
          La clave compartida es un acceso básico para tu copia. Para un
          servicio abierto a múltiples usuarios, añade cuentas, permisos y un
          limitador distribuido. Revisa docs/deployment.md antes de publicar
          herramientas que modifiquen datos.
        </p>
      </section>
      <section className="panel">
        <h2 className="text-xl font-semibold">Dónde se guarda cada cosa</h2>
        <ul className="guide-list">
          <li>Nombres, URLs y selección: localStorage de este navegador.</li>
          <li>Clave de acceso al host: sessionStorage de esta pestaña.</li>
          <li>
            Claves de Gemini y servidores remotos: variables privadas del
            servidor.
          </li>
          <li>
            Mensajes: memoria de la pantalla, hasta recargar, cambiar servidores
            o iniciar una conversación nueva.
          </li>
        </ul>
        <p className="hint">
          La documentación completa, arquitectura y solución de problemas están
          en el{" "}
          <a className="underline" href="https://github.com/amadevss/mcp-host">
            repositorio de GitHub
          </a>
          .
        </p>
      </section>
    </HostShell>
  );
}
