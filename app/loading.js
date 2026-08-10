import Loader from '../src/components/Loader'

/**
 * Se muestra mientras el servidor resuelve la consulta inicial a USGS. Antes la
 * pantalla quedaba en blanco durante ese tiempo.
 */
export default function Loading() {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        height: '100dvh',
        justifyContent: 'center',
      }}
    >
      <Loader />
    </div>
  )
}
