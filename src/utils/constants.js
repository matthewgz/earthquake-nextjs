export const MIN_MAGNITUDE = 5

export const PER_PAGE = 10

export const TYPES = {
  start: 'START',
  loaded: 'LOADED',
  more: 'MORE',
  reset: 'RESET',
}

export const GOOGLE_MAPS_URL = `https://maps.googleapis.com/maps/api/js?${
  process.env.NEXT_PUBLIC_ENV_GOOGLEMAPS_API &&
  `key=${process.env.NEXT_PUBLIC_ENV_GOOGLEMAPS_API}&`
}v=3.exp&libraries=geometry,drawing,places`
