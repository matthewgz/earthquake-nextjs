const getLatLng = (data) => ({
  lat: data.geometry.coordinates[1],
  lng: data.geometry.coordinates[0],
})

export default getLatLng
