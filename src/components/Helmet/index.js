'use client'

import { useEffect } from 'react'

const Helmet = (props) => {
  const { title } = props

  const description =
    'Con esta web podras visualizar sismos en determinado rango de fechas y filtrar por magnitud.'

  useEffect(() => {
    // Actualizar el título dinámicamente en el cliente
    document.title = title

    // Actualizar otras metaetiquetas si es necesario
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', description)
    }

    // Actualizar metaetiquetas Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) {
      ogTitle.setAttribute('content', title)
    }

    const ogDescription = document.querySelector(
      'meta[property="og:description"]',
    )
    if (ogDescription) {
      ogDescription.setAttribute('content', description)
    }

    // Actualizar metaetiquetas Twitter
    const twitterTitle = document.querySelector(
      'meta[property="twitter:title"]',
    )
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title)
    }

    const twitterDescription = document.querySelector(
      'meta[property="twitter:description"]',
    )
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description)
    }
  }, [title])

  return null
}

export default Helmet
