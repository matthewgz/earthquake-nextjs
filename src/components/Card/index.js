import React, { forwardRef, useContext } from 'react'

import styled from 'styled-components'
import { Context } from 'context/index'
import {
  formatEventDate,
  formatEventTime,
  toDateTimeAttribute,
} from 'utils/formatters'

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
  user-select: none;
  width: 253px;
  box-sizing: border-box;

  ${(props) => props.$clickable && `cursor: pointer`};
  ${(props) => props.$selected && `border: 2px white solid`};
`

const Card = forwardRef((props, ref) => {
  // `$clickable` y `$selected` son props transitorias: sin el prefijo `$`,
  // styled-components v6 las reenvía al DOM y React avisa de atributos
  // desconocidos.
  const { properties, geometry, id, $clickable, $inList, ...restProps } = props
  const { marker } = useContext(Context)

  const magnitude = Number.isFinite(properties?.mag)
    ? properties.mag.toFixed(1)
    : '—'

  return (
    <Container
      ref={ref}
      $clickable={$clickable}
      $selected={$inList && marker?.id === id}
      {...restProps}
    >
      <Title>
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
    </Container>
  )
})

Card.displayName = 'Card'

export default Card
