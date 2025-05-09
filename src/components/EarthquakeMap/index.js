'use client'

import React, { useContext, useEffect } from 'react'
import isEmpty from 'lodash.isempty'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

import CustomMarker from 'components/CustomMarker'
import { Context } from 'context/index'
import getLatLng from 'utils/getLatLng'
import 'leaflet/dist/leaflet.css'

const containerStyle = {
  height: '100%',
  width: '100%',
}

// Componente para controlar el mapa
function MapController({ marker }) {
  const map = useMap()

  useEffect(() => {
    if (marker?.position) {
      map.setView([marker.position.lat, marker.position.lng], marker.zoom || 4)
    }
  }, [map, marker?.position])

  return null
}

const EarthquakeMap = (props) => {
  const { marker } = useContext(Context)
  const { data } = props

  const defaultLatLng = { lat: -18.4518246, lng: -64.0274937 }
  const dynamicLatLng = getLatLng(data[0])
  const latLng = !isEmpty(data) ? dynamicLatLng : defaultLatLng

  // Arreglar el problema de los iconos en Leaflet
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    })
  }, [])

  return (
    <MapContainer
      style={containerStyle}
      center={[latLng.lat, latLng.lng]}
      zoom={marker?.zoom || 4}
    >
      <MapController marker={marker} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {data.map((item) => (
        <CustomMarker key={item.id} {...item} />
      ))}
    </MapContainer>
  )
}

export default EarthquakeMap
