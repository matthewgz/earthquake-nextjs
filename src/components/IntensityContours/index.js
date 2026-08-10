'use client'

import React from 'react'
import { GeoJSON } from 'react-leaflet'

/**
 * Paleta oficial de ShakeMap para la escala Mercalli. Se mantiene igual que la
 * de USGS a propósito: cualquiera que haya visto un mapa suyo reconoce los
 * colores, y reinventarlos solo añadiría confusión.
 */
const INTENSITY_COLORS = [
  { max: 2, color: '#bfccff' },
  { max: 3, color: '#a0e6ff' },
  { max: 4, color: '#80ffff' },
  { max: 5, color: '#7aff93' },
  { max: 6, color: '#ffff00' },
  { max: 7, color: '#ffc800' },
  { max: 8, color: '#ff9100' },
  { max: 9, color: '#ff0000' },
  { max: Infinity, color: '#c80000' },
]

const getColor = (value) =>
  INTENSITY_COLORS.find((step) => value < step.max)?.color ?? '#c80000'

/**
 * Dibuja las líneas de isointensidad del ShakeMap: el área donde se sintió el
 * sismo, y con qué fuerza.
 *
 * Son `MultiLineString`, no polígonos, así que se trazan como contornos y no
 * como manchas rellenas. Van por debajo de los markers en su propio panel para
 * no interceptar los clics.
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
        color: getColor(feature.properties.value),
        weight: 2,
        opacity: 0.9,
      })}
    />
  )
}

export default IntensityContours
