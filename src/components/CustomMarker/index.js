import React, { useState, useRef, useEffect, useContext } from 'react'
import marker from 'public/marker.svg'
import getLatLng from 'utils/getLatLng'
import Card from 'components/Card'
import { Marker, InfoWindow } from 'react-google-maps'
import { Context } from 'context/index'
import { isEqual } from 'lodash'

const CustomMarker = (props) => {
  const { id } = props

  const { idEarthquakeInfo, setIdEarthquakeInfo } = useContext(Context)

  const [showWindowInfo, setShowWindowInfo] = useState(false)

  const firstUpdate = useRef(true)

  const handleCloseInfo = (e) => {
    setIdEarthquakeInfo(null)

    setShowWindowInfo(e)
  }

  const handleToggleShowInfo = () => {
    setShowWindowInfo(!showWindowInfo)
  }

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false

      return
    }

    if (isEqual(idEarthquakeInfo, id)) {
      setShowWindowInfo(true)
    } else {
      setShowWindowInfo(false)
    }
  }, [idEarthquakeInfo])

  return (
    <Marker
      position={getLatLng(props)}
      onClick={handleToggleShowInfo}
      icon={marker}
    >
      {showWindowInfo && (
        <InfoWindow onCloseClick={() => handleCloseInfo(false)}>
          <Card {...props} />
        </InfoWindow>
      )}
    </Marker>
  )
}

export default CustomMarker
