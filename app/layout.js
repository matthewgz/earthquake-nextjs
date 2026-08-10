import '../styles/globals.css'
import '../styles/leaflet-fix.css'
import StyledComponentsRegistry from '../lib/registry'
import { Provider } from '../src/context/index'
import { headers } from 'next/headers'
import { UAParser } from 'ua-parser-js'

const title = 'Earthquake — sismos en tiempo real'
const description =
  'Visualiza sismos en el mapa filtrando por rango de fechas y magnitud mínima. Datos del servicio público de USGS.'

/**
 * Las metaetiquetas se declaran aquí, con la API de metadata de Next. Antes un
 * componente `Helmet` las mutaba imperativamente desde un efecto, y además
 * apuntaba a etiquetas Open Graph y Twitter que no existían en el documento,
 * así que esas actualizaciones no hacían nada.
 */
export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'es',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }) {
  // Pista para el primer render: evita que la barra de filtros salte de diseño
  // al hidratar. A partir de ahí manda `matchMedia` (ver src/context).
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const isMobile = new UAParser(userAgent).getDevice().type === 'mobile'

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
