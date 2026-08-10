'use client'

/**
 * Boundary de error de la ruta. Antes no existía ninguno: cualquier excepción
 * durante el render dejaba la pantalla en blanco sin explicación ni salida.
 */
export default function Error({ error, reset }) {
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100dvh',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '20px' }}>Algo salió mal</h1>
      <p style={{ fontSize: '14px', maxWidth: '40ch', lineHeight: 1.5 }}>
        No pudimos cargar el mapa de sismos. Puede ser un problema temporal del
        servicio de USGS.
      </p>
      {error?.digest && (
        <p style={{ fontSize: '12px', opacity: 0.6 }}>
          Referencia: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        style={{
          background: '#7b92a6',
          border: '1px solid #e5edef',
          borderRadius: '4px',
          color: 'inherit',
          cursor: 'pointer',
          font: 'inherit',
          padding: '8px 16px',
        }}
      >
        Reintentar
      </button>
    </div>
  )
}
