import React, { Children } from 'react'
import { compose, withProps } from 'recompose'
import { GOOGLE_MAPS_URL } from 'utils/constants'
import CustomMarker from 'components/CustomMarker'
import { map, isEmpty } from 'lodash'
import getLatLng from 'utils/getLatLng'
import { withScriptjs, withGoogleMap, GoogleMap } from 'react-google-maps'

const GoogleMaps = compose(
  withProps({
    googleMapURL: GOOGLE_MAPS_URL,
    loadingElement: <div style={{ height: `100%` }} />,
    containerElement: <div style={{ height: `100%` }} />,
    mapElement: <div style={{ height: `100%` }} />,
  }),
  withScriptjs,
  withGoogleMap,
)((props) => {
  const { data } = props

  const defaultLatLng = { lat: -18.4518246, lng: -64.0274937 }

  const dynamicLatLng = getLatLng(data[0])

  const latLng = !isEmpty(data) ? dynamicLatLng : defaultLatLng

  return (
    <GoogleMap defaultZoom={4} center={latLng}>
      {props.isMarkerShown &&
        !isEmpty(data) &&
        Children.toArray(map(data, (item) => <CustomMarker {...item} />))}
    </GoogleMap>
  )
})

export default GoogleMaps
