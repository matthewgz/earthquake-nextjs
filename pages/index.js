import { useReducer, useContext, useEffect, useRef, useState } from 'react'
import Helmet from 'components/Helmet'
import Header from 'components/Header'
import Results from 'components/Results'
import GoogleMaps from 'components/GoogleMaps'
import { Context } from 'context/index'
import { MIN_MAGNITUDE, PER_PAGE, TYPES } from 'utils/constants'
import getUrlAPI from 'utils/getUrlAPI'
import { isEqual } from 'lodash'

import styled from 'styled-components'

const Container = styled.div`
  position: relative;
  height: 100vh;

  & main {
    position: absolute;
    top: 60px;
    bottom: 0;
    right: 0;
    left: 0;
  }
`

const getInitialState = (data) => ({
  allData: data,
  loading: false,
  more: data.length >= PER_PAGE,
  data: data.slice(0, PER_PAGE),
  total: data.length,
  after: 10,
  error: undefined,
})

const reducer = (state, action) => {
  switch (action.type) {
    case TYPES.start:
      return { ...state, loading: true }

    case TYPES.loaded:
      return {
        ...state,
        loading: false,
        data: [...state.data, ...action.newData],
        more: action.newData.length === PER_PAGE,
        after: state.after + action.newData.length,
        total: action.allData.length,
        allData: action.allData,
      }

    case TYPES.more:
      return {
        ...state,
        more: true,
        allData: action.allData,
        total: action.allData.length,
      }

    case TYPES.reset:
      return getInitialState(action.allData)

    default:
      throw new Error("Don't understand action")
  }
}

const Home = (props) => {
  const { data = [] } = props

  const firstUpdate = useRef(true)

  const { minMagnitude, dates } = useContext(Context)

  const [state, dispatch] = useReducer(reducer, getInitialState(data))

  const load = () => {
    dispatch({ type: TYPES.start })

    setTimeout(() => {
      const newData = state.allData.slice(state.after, state.after + PER_PAGE)

      dispatch({ type: TYPES.loaded, newData, allData: state.allData })
    }, 300)
  }

  useEffect(async () => {
    if (firstUpdate.current) {
      firstUpdate.current = false

      return
    }

    dispatch({ type: TYPES.start })

    const URL = getUrlAPI(dates, minMagnitude)

    const res = await fetch(URL)

    const dataRes = await res.json()

    dispatch({ type: TYPES.more, allData: dataRes?.features })
  }, [minMagnitude, dates])

  useEffect(() => {
    if (isEqual(state.allData, data)) {
      return
    }

    dispatch({ type: TYPES.reset, allData: state.allData })
  }, [state.allData])

  return (
    <Container>
      <Helmet title="Earthquake" />
      <Header />
      <main>
        <Results {...state} load={load} />
        <GoogleMaps isMarkerShown data={state.data} />
      </main>
    </Container>
  )
}

export async function getServerSideProps() {
  const URL = getUrlAPI({}, MIN_MAGNITUDE)

  const res = await fetch(URL)

  const data = await res.json()

  return { props: { data: data?.features } }
}

export default Home
