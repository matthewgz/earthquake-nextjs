'use client'

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import styled from 'styled-components'

import Card from 'components/Card'
import CustomMarker from 'components/CustomMarker'
import FeltReports from 'components/FeltReports'
import IntensityContours from 'components/IntensityContours'
import IntensityLegend from 'components/IntensityLegend'
import LayerToggles from 'components/LayerToggles'
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

// Contexto de posicionamiento para la leyenda y el control de capas, que se
// superponen al mapa.
const Wrapper = styled.div`
  height: 100%;
  position: relative;
  width: 100%;
`

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

function MapController({
  marker,
  features,
  detailStatus,
  drawerWidth,
  layerBounds,
  onPopupClose,
}) {
  const map = useMap()
  const hasSize = useMapHasSize(map)

  // Último conjunto de resultados que se encuadró, para no repetirlo.
  const fittedFeatures = useRef(null)

  useEffect(() => {
    if (marker?.position) {
      map.setView(
        [marker.position.lat, marker.position.lng],
        marker.zoom ?? DEFAULT_ZOOM,
      )
    }
  }, [map, marker?.position, marker?.zoom])

  /**
   * Reencuadra al llegar el detalle del sismo abierto.
   *
   * Con capas de intensidad se ajusta a su extensión: las celdas de reportes
   * son de 10 km y al zoom con el que se navega la lista no llegan ni a un
   * píxel, así que sin esto se dibujan pero no se ven.
   *
   * Sin capas basta con desplazar lo justo para que quepa el popup. En ambos
   * casos se reserva sitio para el cajón de resultados, que se superpone al
   * mapa y del que Leaflet no sabe nada, y para el popup, que se despliega
   * hacia arriba y centrado sobre el marker.
   */
  useEffect(() => {
    if (!marker?.position || detailStatus !== 'success') {
      return
    }

    const halfWidth = POPUP_MAX_WIDTH / 2
    const padding = {
      paddingTopLeft: [drawerWidth + halfWidth + 24, POPUP_MAX_HEIGHT + 48],
      paddingBottomRight: [halfWidth + 24, 24],
      animate: false,
    }

    if (layerBounds?.isValid()) {
      map.fitBounds(layerBounds, { ...padding, maxZoom: 9 })

      return
    }

    map.panInside([marker.position.lat, marker.position.lng], padding)
  }, [map, marker?.position, detailStatus, drawerWidth, layerBounds])

  /**
   * Al cambiar el conjunto de resultados sin selección, encuadra todos los
   * puntos. Antes el mapa se quedaba donde estuviera, así que filtrar a otra
   * región dejaba la vista mirando a otro lado.
   */
  useEffect(() => {
    if (!hasSize || features.length === 0 || marker?.position) {
      return
    }

    // Solo al cambiar el conjunto de resultados. Sin esta guarda, cerrar el
    // popup de un sismo también reencuadraba el mapa sobre todos los
    // resultados, que es el tirón de zoom que se veía al cerrar.
    if (fittedFeatures.current === features) {
      return
    }

    fittedFeatures.current = features

    const bounds = L.latLngBounds(
      features.map((item) => {
        const { lat, lng } = getLatLng(item)

        return [lat, lng]
      }),
    )

    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 })
  }, [map, hasSize, features, marker?.position])

  /**
   * `popupclose` lo emite el **mapa**, no la capa popup, así que engancharlo al
   * componente `<Popup>` no funcionaba: al cerrar el popup haciendo clic fuera,
   * Leaflet lo quitaba del DOM pero el estado de React seguía con el sismo
   * seleccionado. Volver a pulsar ese mismo marker se interpretaba entonces
   * como «deseleccionar», y el mapa se reencuadraba sobre todos los resultados.
   */
  /**
   * Cerrar al hacer clic fuera.
   *
   * Se escucha `click` del mapa y **no** `popupclose`, aunque este último
   * parezca lo natural. Motivo comprobado: react-leaflet emite un ciclo
   * `popupopen → popupclose → popupopen` por su cuenta al reabrir el popup
   * durante el ciclo de vida, y ese cierre es indistinguible de uno provocado
   * por el usuario. El `click` del mapa sí es inequívoco: Leaflet no lo emite
   * cuando se pulsa un marker ni el propio popup, solo el fondo del mapa.
   */
  useEffect(() => {
    map.on('click', onPopupClose)

    return () => {
      map.off('click', onPopupClose)
    }
  }, [map, onPopupClose])

  return null
}

const EarthquakeMap = (props) => {
  const { data } = props

  const { marker, setMarker, showResults } = useContext(Context)

  // Ambas capas visibles por defecto: compararlas —modelo frente a reportes
  // reales— es justamente lo que aportan.
  const [showContours, setShowContours] = useState(true)
  const [showReports, setShowReports] = useState(true)

  const markerId = marker?.id

  // Sin `useMemo`: un `find` sobre como mucho 1000 elementos es trivial, y
  // envolverlo hacía que el compilador de React descartara la memoización de
  // todo el componente.
  const selected = markerId ? data.find((item) => item.id === markerId) : null

  /**
   * Memoizado a propósito. Con un array nuevo en cada render, react-leaflet
   * volvía a llamar a `openPopup`, que cierra el popup anterior antes de abrir
   * el nuevo: el popup se reabría constantemente y emitía un `popupclose`
   * espurio por cada render, indistinguible de un cierre real del usuario.
   */
  const selectedPosition = useMemo(() => {
    if (!selected) {
      return null
    }

    const { lat, lng } = getLatLng(selected)

    return [lat, lng]
  }, [selected])

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
    setMarker((prev) =>
      // Devolver el mismo objeto cuando ya no hay nada seleccionado hace que
      // React descarte el re-render. Importa porque Leaflet emite
      // `popupclose` también al desmontar el popup, y sin esto cada cierre
      // provocaría un render extra de todos los consumidores del contexto.
      prev.id === null ? prev : { id: null, position: null, zoom: prev.zoom },
    )
  }, [setMarker])

  const hasContours = Boolean(detail.detail?.intensityContours)
  const hasReports = Boolean(detail.detail?.feltReports?.features?.length)

  /**
   * Extensión conjunta de las capas visibles, para encuadrarlas. Se calcula con
   * el propio parser de Leaflet en lugar de recorrer las coordenadas a mano,
   * que con `MultiLineString` y `Polygon` mezclados sería fácil de equivocar.
   */
  const layerBounds = useMemo(() => {
    const visible = [
      showContours && detail.detail?.intensityContours,
      showReports && detail.detail?.feltReports,
    ].filter(Boolean)

    if (!visible.length) {
      return null
    }

    return visible.reduce(
      (acc, data) => acc.extend(L.geoJSON(data).getBounds()),
      L.latLngBounds([]),
    )
  }, [
    showContours,
    showReports,
    detail.detail?.intensityContours,
    detail.detail?.feltReports,
  ])

  return (
    <Wrapper>
      {/*
        Van fuera de `MapContainer` porque son DOM normal, no capas de Leaflet;
        se superponen con posicionamiento absoluto sobre el envoltorio.
      */}
      <LayerToggles
        hasContours={hasContours}
        hasReports={hasReports}
        showContours={showContours}
        showReports={showReports}
        onToggleContours={setShowContours}
        onToggleReports={setShowReports}
      />
      {((hasContours && showContours) || (hasReports && showReports)) && (
        <IntensityLegend
          showsContours={hasContours && showContours}
          showsReports={hasReports && showReports}
        />
      )}

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
          layerBounds={layerBounds}
          onPopupClose={closePopup}
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
        Las dos capas del área sentida, antes del popup para quedar por debajo
        en el orden de pintado. El relleno de reportes va primero para que los
        contornos del modelo se lean encima.
      */}
        {showReports && detail.detail?.feltReports && (
          <FeltReports
            key={`reports-${markerId}`}
            data={detail.detail.feltReports}
          />
        )}
        {showContours && detail.detail?.intensityContours && (
          <IntensityContours
            key={`contours-${markerId}`}
            data={detail.detail.intensityContours}
          />
        )}

        {/*
        Un único popup posicionado, en lugar de uno por marker. Además de ser
        mucho más barato, funciona con clustering: un popup anclado a un marker
        no se puede abrir mientras ese marker está escondido dentro de un
        clúster.
      */}
        {selected && (
          <Popup
            ref={popupRef}
            position={selectedPosition}
            maxWidth={320}
            /*
              Se sustituye la aspa de Leaflet por una propia: la suya cierra el
              popup en el DOM sin avisar a React, dejando el sismo marcado como
              seleccionado. Además su `title` viene en inglés.
            */
            closeButton={false}
            /*
              El auto-encuadre de Leaflet se desactiva a propósito: solo corre
              al abrir el popup, no sabe nada del cajón de resultados que lo
              tapa, y competía con el `panInside` de `MapController`, que sí
              contempla ambas cosas y se re-ejecuta cuando llega el detalle.
            */
            autoPan={false}
          >
            <Card
              {...selected}
              $detailed
              detail={detail}
              onClose={closePopup}
            />
          </Popup>
        )}
      </MapContainer>
    </Wrapper>
  )
}

export default EarthquakeMap
