import ClientHome from '../src/components/ClientHome'
import { MIN_MAGNITUDE } from '../src/utils/constants'
import { todayISO } from '../src/utils/dateRange'
import { projectFeatures } from '../src/utils/fetchEarthquakes'
import { buildQuery, getQueryUrl } from '../src/utils/usgsApi'

async function getEarthquakeData(query) {
  try {
    const res = await fetch(getQueryUrl(query), { next: { revalidate: 300 } })

    // USGS responde 400 con cuerpo `text/plain` ante parámetros inválidos, así
    // que hay que comprobar el estado antes de intentar parsear JSON.
    if (!res.ok) {
      return []
    }

    const data = await res.json()

    // Se proyecta con la misma función que usa el cliente, para que la forma de
    // los datos iniciales y la de los refetch sea idéntica.
    return projectFeatures(data?.features)
  } catch {
    // Degradar a vacío en vez de propagar: un fallo de USGS no debería tumbar
    // la página entera con un 500. El cliente reintentará al cambiar filtros.
    return []
  }
}

export default async function Home() {
  // "Hoy" según la zona horaria del servidor, que es la única disponible aquí.
  // Si no coincide con el día local del navegador, el cliente lo detecta
  // comparando `initialQuery` con la consulta que él deriva, y hace una única
  // petición correctiva.
  const today = todayISO()

  // Tiene que coincidir con los valores por defecto del contexto; si no, el
  // cliente detectaría una consulta distinta y haría una petición correctiva
  // innecesaria en cada carga.
  const initialQuery = buildQuery({
    minMagnitude: MIN_MAGNITUDE,
    onlyEarthquakes: true,
    start: today,
    end: today,
  })

  const initialData = await getEarthquakeData(initialQuery)

  return (
    <ClientHome
      initialData={initialData}
      initialQuery={initialQuery}
      initialTotal={initialData.length}
    />
  )
}
