import React, { forwardRef, useContext } from 'react'

import styled from 'styled-components'
import { Context } from 'context/index'
import {
  formatCount,
  formatDepth,
  formatEventDate,
  formatEventTime,
  formatFelt,
  toDateTimeAttribute,
} from 'utils/formatters'
import {
  getAlertInfo,
  getDepth,
  getDepthLabel,
  getEventTypeLabel,
  getIntensityLabel,
} from 'utils/earthquakeInfo'

const Tooltip = styled.div`
  margin: 0;
  padding: 5px;
  border-radius: 10px;
  width: auto;
  visibility: hidden;
  background-color: lightgrey;
  opacity: 0;
  transition: opacity 0.5s ease;
  font-size: 10px;
  position: absolute;
  top: -24px;
  left: 0;
  z-index: 10000;

  &:hover {
    transition: opacity 0.5s ease;
    opacity: 1;
    visibility: visible;
  }
`

const Title = styled.div`
  display: flex;
  align-items: center;
  position: relative;

  /* Deja sitio al botón de cerrar, que si no se solapa con la magnitud. */
  ${(props) => props.$withClose && `padding-right: 32px;`}

  h4 {
    margin: 0;
    padding: 0;
    max-width: 168px;
    white-space: nowrap;
    overflow: hidden;
    position: relative;
    font-size: 18px;
    font-weight: bold;
    text-overflow: ellipsis;

    &:hover + ${Tooltip} {
      transition: opacity 0.5s ease;
      opacity: 1;
      visibility: visible;
    }
  }
`

const Label = styled.div`
  align-items: center;
  background: #93aebf;
  border-radius: 8px;
  display: flex;
  font-size: 18px;
  font-weight: bold;
  height: 24px;
  justify-content: center;
  position: absolute;
  width: 40px;
  right: 0;
`

const Text = styled.p`
  font-size: 14px;
  margin: 0 !important;
  margin-top: 8px !important;

  & span {
    font-weight: 500;
    width: 46px;
    display: inline-block;
  }
`

const Container = styled.div`
  background-color: #7b92a6;
  border-radius: 4px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  padding: 16px;
  position: relative;
  user-select: none;
  width: 253px;
  box-sizing: border-box;

  ${(props) => props.$clickable && `cursor: pointer`};
  ${(props) => props.$selected && `border: 2px white solid`};

  /*
    En el popup del mapa la tarjeta lleva el bloque de detalle y puede pasar de
    380 px. Acotarla evita que el popup se salga del mapa cuando el sismo está
    cerca del borde superior, sin depender de que el auto-encuadre de Leaflet
    acierte con un contenido que además crece de forma asíncrona.
  */
  ${(props) =>
    props.$detailed &&
    `
    max-height: min(320px, 60dvh);
    overflow-y: auto;
    overscroll-behavior: contain;
  `};
`

const CloseButton = styled.button`
  background: rgba(0, 0, 0, 0.25);
  border: none;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 4px 7px;
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 1;

  &:hover {
    background: rgba(0, 0, 0, 0.4);
  }

  &:focus-visible {
    outline: 2px solid #e5edef;
    outline-offset: 2px;
  }
`

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;

  &:empty {
    display: none;
  }
`

const Badge = styled.span`
  align-items: center;
  background: ${(props) => props.$color ?? 'rgba(255, 255, 255, 0.18)'};
  border-radius: 4px;
  display: inline-flex;
  font-size: 11px;
  font-weight: 600;
  gap: 4px;
  line-height: 1;
  padding: 4px 6px;
`

const Detail = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.25);
  margin-top: 12px;
  padding-top: 10px;

  & p {
    font-size: 12px;
    line-height: 1.35;
  }

  & p + p {
    margin-top: 6px;
  }
`

const Caveat = styled.span`
  display: block;
  font-size: 10px;
  opacity: 0.75;
`

const UsgsLink = styled.a`
  display: inline-block;
  font-size: 12px;
  margin-top: 10px;
  text-decoration: underline;

  &:focus-visible {
    outline: 2px solid #e5edef;
    outline-offset: 2px;
  }
`

const Card = forwardRef((props, ref) => {
  // `$clickable` y `$selected` son props transitorias: sin el prefijo `$`,
  // styled-components v6 las reenvía al DOM y React avisa de atributos
  // desconocidos.
  const {
    properties,
    geometry,
    id,
    $clickable,
    $inList,
    $detailed,
    detail,
    onClose,
    ...restProps
  } = props
  const { marker } = useContext(Context)

  const magnitude = Number.isFinite(properties?.mag)
    ? properties.mag.toFixed(1)
    : '—'

  const depth = getDepth({ geometry })
  const depthLabel = getDepthLabel(depth)
  const typeLabel = getEventTypeLabel(properties.type)
  const alertInfo = getAlertInfo(properties.alert)
  const intensity = properties.cdi ?? properties.mmi
  const intensityLabel = getIntensityLabel(intensity)

  return (
    <Container
      ref={ref}
      $clickable={$clickable}
      $selected={$inList && marker?.id === id}
      $detailed={$detailed}
      {...restProps}
    >
      {onClose && (
        <CloseButton
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
        >
          ×
        </CloseButton>
      )}
      <Title $withClose={Boolean(onClose)}>
        <h4>{properties.place}</h4>
        <Tooltip>{properties.place}</Tooltip>
        <Label aria-label={`Magnitud ${magnitude}`}>{magnitude}</Label>
      </Title>
      <Text>
        <span>Fecha: </span>
        {/*
          `Card` también se renderiza en el servidor, donde la zona horaria es
          la del host: formatear en hora local produce necesariamente un texto
          distinto al del cliente. `suppressHydrationWarning` es el mecanismo
          previsto por React para este caso concreto, y el atributo `dateTime`
          conserva el instante exacto en ISO para lectores y buscadores.
        */}
        <time
          dateTime={toDateTimeAttribute(properties.time)}
          suppressHydrationWarning
        >
          {formatEventDate(properties.time)}
        </time>
      </Text>
      <Text>
        <span>Hora: </span>
        <time
          dateTime={toDateTimeAttribute(properties.time)}
          suppressHydrationWarning
        >
          {formatEventTime(properties.time)}
        </time>
      </Text>
      {depth !== null && (
        <Text>
          <span>Prof.: </span>
          {formatDepth(depth)}
          {depthLabel && ` (${depthLabel})`}
        </Text>
      )}

      {/*
        Las insignias solo aparecen cuando hay algo que decir. Por debajo de
        magnitud 5, la mayoría de estos campos vienen vacíos desde USGS, así que
        una tarjeta sin ellas es el caso normal, no un fallo.
      */}
      <Badges>
        {typeLabel && (
          <Badge
            $color="rgba(0, 0, 0, 0.35)"
            title="Este evento no es un sismo natural"
          >
            {typeLabel}
          </Badge>
        )}
        {properties.tsunami === 1 && (
          <Badge $color="#0b5394">Aviso de tsunami</Badge>
        )}
        {alertInfo && (
          <Badge $color={alertInfo.color} title="Alerta PAGER de USGS">
            {alertInfo.label}
          </Badge>
        )}
        {intensityLabel && (
          <Badge title={`Intensidad Mercalli ${intensity.toFixed(1)}`}>
            {intensityLabel}
          </Badge>
        )}
        {properties.felt > 0 && (
          <Badge title="Reportes del programa «Did You Feel It?» de USGS">
            {formatFelt(properties.felt)}
          </Badge>
        )}
      </Badges>

      {/*
        Datos que exigen una petición extra, así que solo se piden y se muestran
        cuando el usuario abre un sismo concreto.
      */}
      {$detailed && detail?.status === 'success' && detail.detail && (
        <Detail>
          {detail.detail.ruptureDuration && (
            <p>
              Ruptura de ~{detail.detail.ruptureDuration} s
              {/*
                Es la duración de la función de fuente del tensor de momento: un
                valor MODELADO a partir del momento sísmico, no una medición.
                Presentarlo como «duró X segundos» sería engañoso, porque el
                movimiento percibido dura bastante más que la ruptura.
              */}
              <Caveat>
                Estimación del tiempo de ruptura de la falla, no de cuánto se
                sintió el movimiento.
              </Caveat>
            </p>
          )}
          {detail.detail.responses > 0 && (
            <p>
              {formatCount(detail.detail.responses)} reportes ciudadanos
              {detail.detail.maxReportedIntensity && (
                <Caveat>
                  Intensidad máxima reportada:{' '}
                  {getIntensityLabel(detail.detail.maxReportedIntensity)}
                </Caveat>
              )}
            </p>
          )}
          {detail.detail.intensityContours && (
            <p>
              <Caveat>El área donde se sintió está dibujada en el mapa.</Caveat>
            </p>
          )}
        </Detail>
      )}

      {/*
        Solo en el popup del mapa: en la lista, un enlace por tarjeta añadiría
        una parada de tabulación por resultado y haría el recorrido con teclado
        mucho más pesado.
      */}
      {$detailed && properties.url && (
        <UsgsLink
          href={properties.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          Ver ficha completa en USGS ↗
        </UsgsLink>
      )}
    </Container>
  )
})

Card.displayName = 'Card'

export default Card
