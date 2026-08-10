/**
 * Se muestra mientras el servidor resuelve la consulta inicial a USGS. Antes la
 * pantalla quedaba en blanco durante ese tiempo.
 *
 * No reutiliza el componente `Loader` a propósito: este archivo es un Server
 * Component y `Loader` está hecho con styled-components, que solo funciona en
 * el cliente.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Cargando sismos"
      style={{
        alignItems: 'center',
        display: 'flex',
        height: '100dvh',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          animation: 'earthquake-spin 2s linear infinite',
          border: '10px solid #eee',
          borderTopColor: '#666',
          borderRadius: '50%',
          display: 'block',
          height: '40px',
          width: '40px',
        }}
      />
      <style>{`@keyframes earthquake-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
