import React from 'react'

import { ERROR_CODES } from 'utils/fetchEarthquakes'

import styled from 'styled-components'

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 8px;
  text-align: center;
`

const Title = styled.p`
  font-size: 14px;
  font-weight: 600;
`

const Detail = styled.p`
  font-size: 13px;
  line-height: 1.4;
  opacity: 0.85;
`

const RetryButton = styled.button`
  background: #7b92a6;
  border: 1px solid #e5edef;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  padding: 8px 16px;

  &:hover {
    background: #93aebf;
  }

  &:focus-visible {
    outline: 2px solid #e5edef;
    outline-offset: 2px;
  }
`

/**
 * Mensajes para los tres modos de fallo reales de USGS, más el rango inválido
 * y el resultado vacío. Antes no existía ninguno: un fallo era indistinguible
 * de "todavía cargando", y cero resultados se veía como una lista en blanco.
 */
const MESSAGES = {
  [ERROR_CODES.badRequest]: {
    title: 'No pudimos aplicar esos filtros',
    detail:
      'Los valores seleccionados no son válidos. Revisa la magnitud y el rango de fechas.',
  },
  [ERROR_CODES.tooMany]: {
    title: 'El rango es demasiado amplio',
    detail:
      'Hay demasiados sismos en ese periodo. Acorta las fechas o sube la magnitud mínima.',
  },
  [ERROR_CODES.network]: {
    title: 'No pudimos conectar con USGS',
    detail:
      'El servicio no respondió. Puede ser un problema temporal de conexión.',
  },
  invalid_range: {
    title: 'El rango de fechas no es válido',
    detail: 'La fecha "Desde" tiene que ser anterior o igual a la de "Hasta".',
  },
  empty: {
    title: 'No hay sismos en este rango',
    detail:
      'Prueba a ampliar las fechas o a bajar la magnitud mínima para ver más resultados.',
  },
}

const StatusMessage = (props) => {
  const { kind, onRetry } = props

  const message = MESSAGES[kind] ?? MESSAGES[ERROR_CODES.network]

  return (
    // `role="status"` hace que los lectores de pantalla anuncien el cambio sin
    // robar el foco.
    <Container role="status">
      <Title>{message.title}</Title>
      <Detail>{message.detail}</Detail>
      {onRetry && (
        <RetryButton type="button" onClick={onRetry}>
          Reintentar
        </RetryButton>
      )}
    </Container>
  )
}

export default StatusMessage
