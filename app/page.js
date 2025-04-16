import ClientHome from '../src/components/ClientHome'
import { MIN_MAGNITUDE } from '../src/utils/constants'
import getUrlAPI from '../src/utils/getUrlAPI'

// Server Component para obtener datos iniciales
async function getEarthquakeData() {
  const URL = getUrlAPI({}, MIN_MAGNITUDE)
  const res = await fetch(URL, { next: { revalidate: 3600 } }) // Revalidar cada hora
  const data = await res.json()
  return data?.features || []
}

export default async function Home() {
  // Obtener datos en el servidor
  const initialData = await getEarthquakeData()

  // Pasar los datos al componente cliente
  return <ClientHome initialData={initialData} />
}
