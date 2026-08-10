import React, { useContext } from 'react'
import Card from 'components/Card'
import getLatLng from 'utils/getLatLng'
import { Context } from 'context/index'

import styled from 'styled-components'

const Container = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  & > li {
    margin-bottom: 16px;
  }

  & > li:last-child {
    margin-bottom: 0;
  }
`

const Item = styled.li`
  &:focus-visible {
    outline: 2px solid #e5edef;
    outline-offset: 2px;
    border-radius: 4px;
  }
`

const ListOfCards = (props) => {
  const { data } = props

  const { setMarker } = useContext(Context)

  const select = (item) => {
    // Sin `zoom`: el mapa se desplaza hasta el sismo pero conserva el nivel de
    // zoom que tuviera el usuario.
    setMarker({ id: item.id, position: getLatLng(item) })
  }

  return (
    <Container>
      {data.map((item) => (
        // Las tarjetas eran `div`s con onClick: no enfocables ni operables con
        // teclado. Se usa `role="button"` en lugar de un `<button>` real porque
        // la tarjeta contiene un encabezado, que no es contenido válido dentro
        // de un botón.
        <Item
          key={item.id}
          role="button"
          tabIndex={0}
          aria-label={`Ver ${item.properties.place} en el mapa`}
          onClick={() => select(item)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              select(item)
            }
          }}
        >
          <Card {...item} $inList $clickable />
        </Item>
      ))}
    </Container>
  )
}

export default ListOfCards
