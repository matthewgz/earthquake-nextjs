import '../styles/globals.css'
import '../styles/leaflet-fix.css'
import 'leaflet/dist/leaflet.css'
import StyledComponentsRegistry from '../lib/registry'
import { Provider } from '../src/context/index'
import { headers } from 'next/headers'
import { UAParser } from 'ua-parser-js'

export const metadata = {
  title: 'Earthquake App',
  description: 'Aplicación para visualizar datos de terremotos en tiempo real',
}

// Moving viewport to its own export to fix the warning
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }) {
  // Detectar si el dispositivo es móvil server-side
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const parser = new UAParser(userAgent)
  const isMobile = parser.getDevice().type === 'mobile'

  return (
    <html lang="es">
      <body>
        <StyledComponentsRegistry>
          <Provider isMobile={isMobile}>{children}</Provider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
