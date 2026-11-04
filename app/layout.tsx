import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "MCP Host — crea y conecta tus herramientas",
  description:
    "Plantilla abierta para crear un servidor MCP, conectar varios servidores y consultar sus herramientas con Gemini.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
