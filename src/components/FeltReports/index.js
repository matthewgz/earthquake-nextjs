'use client'

import React, { useMemo } from 'react'
import { GeoJSON } from 'react-leaflet'
import L from 'leaflet'

import { getIntensityColor, getIntensityLabel } from 'utils/earthquakeInfo'

/**
 * USGS mete HTML en el nombre de la celda:
 * `"UTM:(17M 063 975 10000)<br>Eloy Alfaro"`. Solo interesa la parte legible,
 * y se extrae como **texto**: inyectar HTML que viene de una API sería una vía
 * de XSS por mucho que la fuente sea de fiar.
 */
const getPlaceName = (name) => {
  if (typeof name !== 'string') {
    return null
  }

  const readable = name.split('<br>').pop()?.trim()

  return readable && !readable.startsWith('UTM:') ? readable : null
}

const formatReports = (count) =>
  count === 1 ? '1 reporte' : `${count} reportes`

/** Centro del rectángulo que define la celda. */
const getCentroid = (coordinates) => {
  const ring = coordinates?.[0] ?? []

  if (!ring.length) {
    return null
  }

  const lngs = ring.map(([lng]) => lng)
  const lats = ring.map(([, lat]) => lat)

  return [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ]
}

/**
 * Radio en píxeles, ligeramente mayor cuanta más gente reportó desde esa celda.
 * La raíz cuadrada evita que una celda con 38 reportes eclipse a las de 1.
 */
const getRadius = (responses) => 4 + Math.min(5, Math.sqrt(responses || 1))

/**
 * Celdas del programa «Did You Feel It?»: lo que dijeron las personas que
 * estaban ahí, agregado por zonas de 10 km.
 *
 * Se dibujan como círculos de tamaño fijo en píxeles y no como los polígonos
 * originales. El motivo es concreto: los reportes de un sismo grande llegan
 * desde miles de kilómetros (en el M7.3 de Puerto Madero, hasta 2.361 km), y al
 * zoom necesario para abarcarlos una celda de 10 km mide menos de un píxel
 * —literalmente se renderizaba como `M927 721L927 720z`—. Con círculos se ven a
 * cualquier escala, que es lo único que hace útil a esta capa.
 *
 * A diferencia de los contornos del ShakeMap esto no es un modelo, sino dato
 * humano, y su cobertura depende de quién reporte. Por eso conviene verlo junto
 * al modelo y no en su lugar.
 */
const FeltReports = ({ data }) => {
  const points = useMemo(() => {
    if (!data?.features?.length) {
      return null
    }

    return {
      type: 'FeatureCollection',
      features: data.features
        .map((feature) => {
          const center = getCentroid(feature.geometry?.coordinates)

          return center
            ? {
                type: 'Feature',
                properties: feature.properties,
                geometry: {
                  type: 'Point',
                  coordinates: [center[1], center[0]],
                },
              }
            : null
        })
        .filter(Boolean),
    }
  }, [data])

  if (!points?.features.length) {
    return null
  }

  return (
    <GeoJSON
      data={points}
      pointToLayer={(feature, latlng) =>
        L.circleMarker(latlng, {
          radius: getRadius(feature.properties.nresp),
          color: '#11142699',
          fillColor: getIntensityColor(feature.properties.cdi),
          fillOpacity: 0.85,
          weight: 1,
        })
      }
      onEachFeature={(feature, layer) => {
        const { cdi, nresp, name } = feature.properties

        // Se pasa un nodo con `textContent` y no un string: `bindTooltip` con
        // string asigna `innerHTML`, así que el nombre que viene de la API
        // acabaría interpretándose como marcado.
        const content = document.createElement('span')

        content.textContent = [
          getPlaceName(name),
          getIntensityLabel(cdi),
          formatReports(nresp),
        ]
          .filter(Boolean)
          .join(' · ')

        layer.bindTooltip(content, { direction: 'top' })
      }}
    />
  )
}

export default FeltReports
