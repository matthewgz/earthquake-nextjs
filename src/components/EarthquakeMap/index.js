'use client'

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'

import Card from 'components/Card'
import CustomMarker from 'components/CustomMarker'
import IntensityContours from 'components/IntensityContours'
import { Context } from 'context/index'
import useEarthquakeDetail from 'hooks/useEarthquakeDetail'
import getLatLng from 'utils/getLatLng'

import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'

const containerStyle = {
  height: '100%',
  width: '100%',
}

// Bolivia: encuadre por defecto cuando no hay datos que mostrar.
const DEFAULT_CENTER = [-18.4518246, -64.0274937]
const DEFAULT_ZOOM = 4

// Ancho del cajón de resultados, que se superpone al mapa por la izquierda.
// Debe coincidir con el `width` del contenedor de `Results`.
const RESULTS_DRAWER_WIDTH = 285

// Deben coincidir con el tamaño de la tarjeta detallada en `Card`.
const POPUP_MAX_HEIGHT = 320
const POPUP_MAX_WIDTH = 280

/**
 * Leaflet mide el contenedor al inicializarse. Como el mapa se carga con
 * `dynamic(ssr:false)`, en ese momento el contenedor todavía puede tener 0×0, y
 * un mapa de tamaño cero rompe dos cosas: las teselas se cargan a medias, y
 * `fitBounds` calcula el centro bien pero dispara el zoom al tope porque cree
 * que no cabe nada.
 *
 * El `ResizeObserver` avisa a Leaflet del tamaño real y, además, habilita el
 * encuadre solo cuando ya hay dimensiones con las que calcularlo.
 */
function useMapHasSize(map) {
  const [hasSize, setHasSize] = useState(() => map.getSize().x > 0)

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
      setHasSize(map.getSize().x > 0)
    })

    observer.observe(map.getContainer())

    return () => observer.disconnect()
  }, [map])

  return hasSize
}

function MapController({ marker, features, detailStatus, drawerWidth }) {
  const map = useMap()
  const hasSize = useMapHasSize(map)

  useEffect(() => {
    if (marker?.position) {
      map.setView(
        [marker.position.lat, marker.position.lng],
        marker.zoom ?? DEFAULT_ZOOM,
      )
    }
  }, [map, marker?.position, marker?.zoom])

  /**
   * El bloque de detalle llega después de abrir el popup y lo hace más alto.
   * `autoPan` solo se ejecuta al abrirlo, así que sin esto un popup que crece
   * puede quedar mordido por el borde superior del mapa. `panInside` reencuadra
   * lo justo, respetando el ancho del cajón de resultados que se le superpone.
   */
  useEffect(() => {
    if (!marker?.position || detailStatus !== 'success') {
      return
    }

    // `panInside` encaja el MARKER, no el popup. Como el popup se despliega
    // hacia arriba y centrado sobre él, hay que reservar su alto por arriba y
    // media anchura a cada lado.
    const halfWidth = POPUP_MAX_WIDTH / 2

    map.panInside([marker.position.lat, marker.position.lng], {
      paddingTopLeft: [drawerWidth + halfWidth + 24, POPUP_MAX_HEIGHT + 48],
      paddingBottomRight: [halfWidth + 24, 24],
      animate: false,
    })
  }, [map, marker?.position, detailStatus, drawerWidth])

  /**
   * Al cambiar el conjunto de resultados sin selección, encuadra todos los
   * puntos. Antes el mapa se quedaba donde estuviera, así que filtrar a otra
   * región dejaba la vista mirando a otro lado.
   */
  useEffect(() => {
    if (!hasSize || marker?.position || features.length === 0) {
      return
    }

    const bounds = L.latLngBounds(
      features.map((item) => {
        const { lat, lng } = getLatLng(item)

        return [lat, lng]
      }),
    )

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 })
  }, [map, hasSize, features, marker?.position])

  return null
}

const EarthquakeMap = (props) => {
  const { data } = props

  const { marker, setMarker, showResults } = useContext(Context)

  const markerId = marker?.id

  // Sin `useMemo`: un `find` sobre como mucho 1000 elementos es trivial, y
  // envolverlo hacía que el compilador de React descartara la memoización de
  // todo el componente.
  const selected = markerId ? data.find((item) => item.id === markerId) : null

  // Una petición por sismo abierto, cacheada. No se pide para la lista.
  const detail = useEarthquakeDetail(markerId)

  const popupRef = useRef(null)

  /**
   * El bloque de detalle llega después de abrir el popup y lo hace más alto.
   * `autoPan` solo se ejecuta al abrirlo, así que sin esto el popup crecido se
   * sale por arriba de la ventana. `update()` recalcula tamaño y reposiciona.
   */
  useEffect(() => {
    if (detail.status === 'success') {
      popupRef.current?.update()
    }
  }, [detail.status])

  /**
   * Estable, para que `memo` en `CustomMarker` sirva de algo. La lógica de
   * selección vive aquí y no en cada marker, lo que además elimina el
   * `setTimeout(100)` que reentraba en los manejadores de Leaflet
   * (`markerRef.current.options.eventHandlers.click()`) para reproducir la
   * selección hecha desde la lista.
   */
  const handleSelect = useCallback(
    // La posición llega desde el propio marker en vez de buscarse en `data`:
    // así la función no depende de la lista y es estable de verdad.
    (id, position) => {
      setMarker((prev) =>
        prev?.id === id
          ? { id: null, position: null, zoom: prev.zoom }
          : { id, position, zoom: 5 },
      )
    },
    [setMarker],
  )

  const closePopup = useCallback(() => {
    setMarker((prev) => ({ id: null, position: null, zoom: prev.zoom }))
  }, [setMarker])

  return (
    <MapContainer
      style={containerStyle}
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
    >
      <MapController
        marker={marker}
        features={data}
        detailStatus={detail.status}
        drawerWidth={showResults ? RESULTS_DRAWER_WIDTH : 0}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/*
        `chunkedLoading` reparte el alta de markers en varios frames para no
        bloquear el hilo principal cuando llegan cientos de golpe.
      */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        disableClusteringAtZoom={8}
      >
        {data.map((item) => {
          const { lat, lng } = getLatLng(item)

          return (
            <CustomMarker
              key={item.id}
              id={item.id}
              lat={lat}
              lng={lng}
              onSelect={handleSelect}
            />
          )
        })}
      </MarkerClusterGroup>

      {/*
        Un único popup posicionado, en lugar de uno por marker. Además de ser
        mucho más barato, funciona con clustering: un popup anclado a un marker
        no se puede abrir mientras ese marker está escondido dentro de un
        clúster.
      */}
      {/*
        Área donde se sintió, según el ShakeMap del sismo seleccionado. Va antes
        del popup para quedar por debajo en el orden de pintado.
      */}
      {detail.detail?.intensityContours && (
        <IntensityContours
          key={markerId}
          data={detail.detail.intensityContours}
        />
      )}

      {selected && (
        <Popup
          ref={popupRef}
          position={[getLatLng(selected).lat, getLatLng(selected).lng]}
          eventHandlers={{ popupclose: closePopup }}
          maxWidth={320}
          /*
            Leaflet solo conoce el tamaño de su contenedor, no los paneles que
            se superponen. Sin este margen el popup se abre debajo del cajón de
            resultados y por encima del borde superior de la ventana.
          */
          autoPanPaddingTopLeft={[showResults ? 300 : 20, 76]}
          autoPanPaddingBottomRight={[20, 20]}
        >
          <Card {...selected} $detailed detail={detail} />
        </Popup>
      )}
    </MapContainer>
  )
}

export default EarthquakeMap
