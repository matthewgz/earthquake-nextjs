import React, { useState, useEffect, useContext, useRef } from 'react'
import Ribbon from 'components/Ribbon'
import ListOfCards from 'components/ListOfCards'
import Loader from 'components/Loader'
import StatusMessage from 'components/StatusMessage'
import { Context } from 'context/index'
import { STATUS } from 'hooks/useEarthquakes'
import { move } from 'styles/keyframes'
import { MAX_RESULTS } from 'utils/constants'
import { formatCount, getTimeZoneLabel } from 'utils/formatters'
import { useInView } from 'react-intersection-observer'

import styled from 'styled-components'

const InnerContainer = styled.div`
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
  padding: 16px;
  width: 100%;

  /* width */
  ::-webkit-scrollbar {
    width: 4px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`

const Summary = styled.div`
  margin-bottom: 24px;
  text-align: center;

  & > p {
    font-size: 14px;
  }

  & > small {
    font-size: 11px;
    opacity: 0.75;
  }
`

const Container = styled.div`
  background: rgba(73, 91, 115, 0.9);
  border-radius: 0px 8px 8px 0px;
  position: absolute;
  width: 285px;
  z-index: 10000;

  animation: ${(props) => move(props)} ease-out 1s;
  ${(props) => props.$fin?.right && `right: ${props.$fin?.right}`};
  ${(props) => props.$fin?.left && `left: ${props.$fin?.left}`};
  ${(props) => props.$fin?.top && `top: ${props.$fin?.top}`};
  ${(props) => props.$fin?.bottom && `bottom: ${props.$fin?.bottom}`};
`

const show = {
  ini: {
    bottom: '0px',
    top: '0px',
    left: '-285px',
  },
  fin: {
    bottom: '0px',
    top: '0px',
    left: '0px',
  },
}

const hide = {
  fin: {
    bottom: '0px',
    top: '0px',
    left: '-285px',
  },
  ini: {
    bottom: '0px',
    top: '0px',
    left: '0px',
  },
}

const timeZoneLabel = getTimeZoneLabel()

const Results = (props) => {
  const { data, total, truncated, status, error, hasMore, loadMore, retry } =
    props

  const { showResults, isMobile, setShowResults } = useContext(Context)

  const [animation, setAnimation] = useState({
    fin: showResults ? show.fin : hide.fin,
  })

  const { ref, inView } = useInView({ threshold: 1 })

  const firstUpdate = useRef(true)

  const isLoading = status === STATUS.loading

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false

      return
    }

    setAnimation(showResults ? show : hide)
  }, [showResults])

  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])

  useEffect(() => {
    setShowResults(!isMobile)
  }, [isMobile, setShowResults])

  const statusKind =
    status === STATUS.error
      ? error?.code
      : status === STATUS.invalidRange
        ? 'invalid_range'
        : status === STATUS.success && data.length === 0
          ? 'empty'
          : null

  return (
    <Container $fin={animation.fin}>
      {/*
        `Ribbon` va fuera de `InnerContainer` justamente porque es el control
        que vuelve a abrir el panel: si quedara dentro de la región `inert`, con
        el panel cerrado no se podría accionar.
      */}
      <Ribbon />
      <InnerContainer inert={!showResults}>
        <Summary>
          {/*
            `aria-live` anuncia el nuevo total tras filtrar; antes el cambio
            era invisible para un lector de pantalla.
          */}
          <p aria-live="polite">
            {truncated
              ? `Mostrando ${formatCount(data.length ? MAX_RESULTS : 0)} de ${formatCount(total)} sismos`
              : `${formatCount(total)} resultados...`}
          </p>
          {/*
            Las horas de los sismos se muestran en la zona local del navegador,
            pero USGS las entrega en UTC. Sin esta etiqueta no hay forma de
            saber en qué zona se está leyendo. Va una sola vez aquí, y no en
            cada tarjeta, para no ensuciar la lista.
          */}
          <small suppressHydrationWarning>Horas en {timeZoneLabel}</small>
        </Summary>

        {statusKind ? (
          <StatusMessage
            kind={statusKind}
            onRetry={status === STATUS.error ? retry : undefined}
          />
        ) : (
          <ListOfCards data={data} />
        )}

        {isLoading && <Loader />}
        {/*
          El centinela se desmonta mientras carga y al agotarse los resultados;
          remontarlo es lo que vuelve a armar el IntersectionObserver.
        */}
        {!isLoading && hasMore && <div ref={ref} />}
      </InnerContainer>
    </Container>
  )
}

export default Results
