import React, { useContext, useState, useCallback, useEffect } from 'react'
import CustomMarker from 'components/CustomMarker'
import { Context } from 'context/index'
import isEmpty from 'lodash.isempty'
import getLatLng from 'utils/getLatLng'
import {
  GoogleMap,
  useJsApiLoader,
  MarkerClusterer,
} from '@react-google-maps/api'

const containerStyle = {
  height: '100%',
}

const GoogleMaps = (props) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_ENV_GOOGLEMAPS_API,
  })
  const { marker } = useContext(Context)
  const [map, setMap] = useState(null)

  const { data } = props

  const defaultLatLng = { lat: -18.4518246, lng: -64.0274937 }

  const dynamicLatLng = getLatLng(data[0])

  const latLng = !isEmpty(data) ? dynamicLatLng : defaultLatLng

  function createKey(location) {
    return location.lat + location.lng
  }

  const onLoad = useCallback(function callback(map) {
    setMap(map)
  }, [])

  const onUnmount = useCallback(function callback(map) {
    setMap(null)
  }, [])

  useEffect(() => {
    if (isLoaded && map && marker?.position) {
      const bounds = new window.google.maps.LatLngBounds(marker.position)
      map.fitBounds(bounds)
      map.setZoom(marker.zoom)
    }
  }, [marker?.position])

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={4}
      center={latLng}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <MarkerClusterer>
        {(clusterer) => {
          return data.map((item) => (
            <CustomMarker
              key={createKey(location)}
              {...item}
              clusterer={clusterer}
            />
          ))
        }}
      </MarkerClusterer>
    </GoogleMap>
  ) : null
}

export default GoogleMaps
