'use client'

import React from 'react'
import { GeoJSON } from 'react-leaflet'

import { getIntensityColor } from 'utils/earthquakeInfo'

/**
 * Líneas de isointensidad del ShakeMap: hasta dónde llegó el movimiento y con
 * qué fuerza, **según el modelo** de USGS a partir de los sismógrafos.
 *
 * Son `MultiLineString`, no polígonos, así que se trazan como contornos y no
 * como manchas. Van sin interactividad para no robarle los clics a los markers.
 */
const IntensityContours = ({ data }) => {
  if (!data?.features?.length) {
    return null
  }

  return (
    // El padre le pone `key` con el id del evento: react-leaflet no
    // re-renderiza un GeoJSON cuando solo cambian sus datos, hay que remontarlo.
    <GeoJSON
      data={data}
      interactive={false}
      style={(feature) => ({
        color: getIntensityColor(feature.properties.value),
        weight: 2,
        opacity: 0.9,
      })}
    />
  )
}

export default IntensityContours
