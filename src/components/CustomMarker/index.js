import React, { useState, useRef, useEffect, useContext } from 'react'
import markerIcon from 'public/marker.svg'
import getLatLng from 'utils/getLatLng'
import Card from 'components/Card'
import { Marker, InfoWindow } from '@react-google-maps/api'
import { Context } from 'context/index'

const CustomMarker = (props) => {
  const { id, clusterer } = props

  const { marker, setMarker } = useContext(Context)

  const [showWindowInfo, setShowWindowInfo] = useState(false)

  const handleCloseInfo = () => {
    setMarker({ id: null })
    setShowWindowInfo(false)
  }

  const handleToggleShowInfo = () => {
    setShowWindowInfo(!showWindowInfo)
    if (showWindowInfo) {
      setMarker({ id: null, position: undefined })
    } else {
      setMarker({
        id: id,
        position: undefined,
      })
    }
  }

  useEffect(() => {
    if (marker?.id === id) {
      setShowWindowInfo(true)
    } else {
      setShowWindowInfo(false)
    }
  }, [marker.id])

  return (
    <Marker
      position={getLatLng(props)}
      onClick={handleToggleShowInfo}
      icon={markerIcon}
      clusterer={clusterer}
    >
      {showWindowInfo ? (
        <InfoWindow onCloseClick={handleCloseInfo} position={getLatLng(props)}>
          <Card {...props} />
        </InfoWindow>
      ) : null}
    </Marker>
  )
}

export default CustomMarker
