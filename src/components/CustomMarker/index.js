'use client'

import React, { useEffect, useContext, useMemo, useRef } from 'react'
import getLatLng from 'utils/getLatLng'
import Card from 'components/Card'
import { Marker, Popup } from 'react-leaflet'
import { Context } from 'context/index'
import L from 'leaflet'

const CustomMarker = (props) => {
  const { id, geometry, ...otherProps } = props
  const { marker, setMarker } = useContext(Context)
  const markerRef = useRef(null)

  const customIcon = useMemo(
    () =>
      L.icon({
        iconUrl: '/marker.svg',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      }),
    [],
  )

  const handleToggleShowInfo = () => {
    if (marker?.id === id) {
      setMarker({ id: null, position: undefined })
    } else {
      const markerPosition = getLatLng(props)
      setMarker({
        id: id,
        position: markerPosition,
        zoom: 5,
      })
    }
  }

  useEffect(() => {
    if (marker?.id === id && markerRef.current) {
      setTimeout(() => {
        markerRef.current.options.eventHandlers.click()
        markerRef.current.openPopup()
      }, 100)
    }
  }, [marker?.id, id])

  const position = [getLatLng(props).lat, getLatLng(props).lng]

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={customIcon}
      eventHandlers={{
        click: handleToggleShowInfo,
      }}
    >
      <Popup>
        <Card {...otherProps} id={id} geometry={geometry} />
      </Popup>
    </Marker>
  )
}

export default CustomMarker
