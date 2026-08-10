import React, { useContext, useEffect, useId, useRef, useState } from 'react'
import { IoIosArrowDown } from 'react-icons/io'

import { Context } from 'context/index'
import useOutsideAlerter from 'hooks/useOutsideAlerter'
import { MAGNITUDE_OPTIONS } from 'utils/constants'

import styled from 'styled-components'

const Option = styled.li`
  align-items: center;
  cursor: pointer;
  display: flex;
  margin: 0;
  padding: 8px 16px;
  border-bottom: 1px groove white;

  &:hover,
  &[data-active='true'] {
    background: #495b73;
  }

  &[aria-selected='true'] {
    font-weight: 700;
  }
`

const ListOfOptions = styled.ul`
  border: 1px solid #e5edef;
  background: #7b92a6;
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 40vh;
  position: absolute;
  right: 0;
  left: 0;
  top: 64px;
  z-index: 800;
  overflow: auto;
`

const Trigger = styled.button`
  align-items: center;
  background: #7b92a6;
  border: none;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  color: inherit;
  cursor: pointer;
  display: flex;
  font: inherit;
  font-size: 18px;
  height: 56px;
  justify-content: space-between;
  padding: 0 16px;
  text-align: left;
  width: 100%;

  &:focus-visible {
    outline: 2px solid #e5edef;
    outline-offset: 2px;
  }
`

const Container = styled.div`
  position: relative;
`

/**
 * Selector de magnitud mínima.
 *
 * Se implementa como listbox siguiendo el patrón APG en lugar de un `<select>`
 * nativo porque el desplegable se superpone al mapa con estilo propio y, en
 * móvil, un `<select>` abriría la rueda del sistema y rompería la coherencia
 * visual con los dos selectores de fecha que van al lado. `appearance: none`
 * tampoco permite estilar la lista de opciones.
 *
 * Antes era un conjunto de `div`s con `onClick`: no era enfocable, no tenía
 * roles ni estado accesible, y era imposible de operar con teclado.
 */
const Select = (props) => {
  const { className } = props

  const { setMinMagnitude, minMagnitude, setShowFilters } = useContext(Context)

  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, MAGNITUDE_OPTIONS.indexOf(minMagnitude)),
  )

  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const listboxId = useId()
  const optionId = (index) => `${listboxId}-option-${index}`

  useOutsideAlerter(containerRef, setIsOpen)

  // Al cerrar con teclado el foco debe volver al disparador; si no, queda
  // huérfano en el body y el usuario pierde su sitio.
  const close = ({ restoreFocus = false } = {}) => {
    setIsOpen(false)

    if (restoreFocus) {
      triggerRef.current?.focus()
    }
  }

  const commit = (value) => {
    setMinMagnitude(value)
    setActiveIndex(MAGNITUDE_OPTIONS.indexOf(value))
    close({ restoreFocus: true })
    setShowFilters(false)
  }

  const open = (index = activeIndex) => {
    setActiveIndex(index)
    setIsOpen(true)
  }

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        isOpen
          ? setActiveIndex((i) => Math.min(i + 1, MAGNITUDE_OPTIONS.length - 1))
          : open()
        break

      case 'ArrowUp':
        event.preventDefault()
        isOpen ? setActiveIndex((i) => Math.max(i - 1, 0)) : open()
        break

      case 'Home':
        if (isOpen) {
          event.preventDefault()
          setActiveIndex(0)
        }
        break

      case 'End':
        if (isOpen) {
          event.preventDefault()
          setActiveIndex(MAGNITUDE_OPTIONS.length - 1)
        }
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        isOpen ? commit(MAGNITUDE_OPTIONS[activeIndex]) : open()
        break

      case 'Escape':
        if (isOpen) {
          event.preventDefault()
          close({ restoreFocus: true })
        }
        break

      case 'Tab':
        close()
        break

      default:
        break
    }
  }

  // Mantiene visible la opción activa al recorrer la lista con las flechas.
  useEffect(() => {
    if (!isOpen) {
      return
    }

    document
      .getElementById(optionId(activeIndex))
      ?.scrollIntoView({ block: 'nearest' })
    // `optionId` se recrea en cada render pero solo depende de `listboxId`,
    // que es estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex, listboxId])

  return (
    <Container ref={containerRef} className={className}>
      <Trigger
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? optionId(activeIndex) : undefined}
        aria-label="Magnitud mínima"
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleKeyDown}
      >
        {/*
          Comparar contra `null` y no por veracidad: con `minMagnitude ? ... : ...`
          la magnitud 0 (un valor perfectamente válido) mostraba el placeholder.
          Se muestra como «≥ N» porque el número suelto no comunica que es un
          mínimo.
        */}
        <span>
          {minMagnitude == null ? 'Magnitud' : `Magnitud ≥ ${minMagnitude}`}
        </span>
        <IoIosArrowDown size={32} aria-hidden="true" />
      </Trigger>

      {isOpen && (
        <ListOfOptions
          id={listboxId}
          role="listbox"
          aria-label="Magnitud mínima"
        >
          {MAGNITUDE_OPTIONS.map((value, index) => (
            <Option
              key={value}
              id={optionId(index)}
              role="option"
              aria-selected={value === minMagnitude}
              data-active={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => commit(value)}
            >
              {value}
            </Option>
          ))}
        </ListOfOptions>
      )}
    </Container>
  )
}

export default Select
