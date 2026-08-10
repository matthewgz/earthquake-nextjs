'use client'

import React, { memo } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'

/**
 * Una sola instancia compartida por todos los markers. Antes cada `CustomMarker`
 * creaba la suya con `useMemo`, lo que con mil markers son mil objetos `L.icon`
 * idénticos.
 */
const icon = L.icon({
  iconUrl: '/marker.svg',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

/**
 * Hoja del mapa: renderiza un único `<Marker>` y nada más.
 *
 * Antes montaba también un `<Popup>` con una `<Card>` dentro. react-leaflet
 * monta los hijos del popup en un nodo DOM aparte ya al montar el marker, así
 * que con mil markers había mil `Card` montadas y mil suscriptores de contexto
 * que se re-renderizaban cada vez que cambiaba cualquier estado, por ejemplo al
 * abrir el panel de filtros. Clusterizar reduce el trabajo de Leaflet, no el de
 * React: esto sí.
 *
 * Por eso no lee contexto y recibe props primitivas, para que `memo` sirva de
 * algo.
 */
const CustomMarker = memo(function CustomMarker({ id, lat, lng, onSelect }) {
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{ click: () => onSelect(id, { lat, lng }) }}
    />
  )
})

export default CustomMarker
