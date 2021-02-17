import React, { Children, useContext } from 'react'
import { map } from 'lodash'
import Card from 'components/Card'
import { Context } from 'context/index'

import styled from 'styled-components'

const Container = styled.div`
  & > * {
    margin-bottom: 16px;
  }

  & :last-child {
    margin-bottom: 0;
  }
`

const ListOfCards = (props) => {
  const { data } = props

  const { setIdEarthquakeInfo } = useContext(Context)

  return (
    <Container>
      {Children.toArray(
        map(data, (item) => {
          return (
            <Card
              {...item}
              cursor={'true'}
              onClick={() => {
                setIdEarthquakeInfo(item.id)
              }}
            />
          )
        }),
      )}
    </Container>
  )
}

export default ListOfCards
