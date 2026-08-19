'use client'

import React, { useMemo } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'

import { getBoundaryLabel, isSubduction } from 'utils/tectonicPlates'

// Magenta: es el hueco que deja la paleta Mercalli, que va de azules y verdes a
// amarillos, naranjas y rojos. Cualquier otro tono se confundiría con una
// isolínea de intensidad.
const COLOR = '#e8368f'

/**
 * Panel propio, por debajo del `overlayPane` (400) donde van las capas del
 * sismo. Sin él, Leaflet apila por orden de montaje y encender las placas con
 * un sismo ya abierto las dejaba pintadas *encima* de sus contornos de
 * intensidad, que es justo lo que hay que poder leer.
 */
const PANE = 'placas'
const PANE_Z_INDEX = 350

const ATTRIBUTION =
  'Placas: <a href="https://github.com/fraxen/tectonicplates">Hugo Ahlenius, Nordpil</a> &middot; Peter Bird (2003)'

/**
 * Límites entre placas tectónicas del modelo PB2002.
 *
 * Es la capa que explica el mapa: los sismos no salpican el planeta al azar,
 * se alinean con estos trazos. Por eso va debajo de todo lo demás —contexto,
 * no protagonista— y arranca apagada.
 *
 * A diferencia de `IntensityContours`, esta capa **sí es interactiva**: el
 * tooltip con el nombre de las dos placas es la mitad de lo que aporta. Los
 * clics siguen llegando al mapa (`bubblingMouseEvents`), así que pulsar sobre
 * una línea cierra el popup abierto igual que pulsar sobre el fondo.
 */
const TectonicPlates = ({ data }) => {
  const map = useMap()

  // En `useMemo` y no en un efecto: el panel tiene que existir **antes** de que
  // `GeoJSON` monte su capa, y los efectos corren después del render.
  useMemo(() => {
    if (!map.getPane(PANE)) {
      map.createPane(PANE).style.zIndex = PANE_Z_INDEX
    }
  }, [map])

  if (!data?.features?.length) {
    return null
  }

  return (
    <GeoJSON
      data={data}
      pane={PANE}
      attribution={ATTRIBUTION}
      bubblingMouseEvents
      style={(feature) => ({
        color: COLOR,
        // Los tramos de subducción, más gruesos: es donde una placa se hunde
        // bajo otra y donde ocurren los sismos profundos y los más grandes.
        weight: isSubduction(feature.properties) ? 3 : 2,
        opacity: 0.85,
      })}
      onEachFeature={(feature, layer) => {
        const label = getBoundaryLabel(feature.properties)

        if (!label) {
          return
        }

        // Nodo con `textContent` y no un string, como en `FeltReports`:
        // `bindTooltip` asigna `innerHTML` cuando recibe una cadena.
        const content = document.createElement('span')

        content.textContent = label

        // `sticky`: el tooltip sigue al cursor a lo largo de la línea. Anclado
        // al centro del tramo aparecería a miles de kilómetros del puntero,
        // porque un tramo puede cruzar medio océano.
        layer.bindTooltip(content, { sticky: true })
      }}
    />
  )
}

export default TectonicPlates
