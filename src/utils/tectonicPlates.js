/**
 * Nombres de las placas del modelo PB2002 (Peter Bird, 2003) y etiquetas para
 * los tramos de límite entre ellas.
 *
 * Vive aparte del componente por el mismo motivo que `earthquakeInfo`: son
 * datos, no presentación, y así se pueden probar sin montar Leaflet.
 */

/**
 * Los códigos de dos letras son los del propio modelo; los 52 que aparecen en
 * `PB2002_boundaries` están cubiertos. Se traducen los nombres con forma
 * castellana asentada (África, Sudamérica, Ojotsk) y se dejan tal cual los
 * topónimos que nadie traduce (Tonga, Kermadec, Woodlark).
 */
export const PLATE_NAMES = {
  AF: 'África',
  AM: 'Amur',
  AN: 'Antártida',
  AP: 'Altiplano',
  AR: 'Arabia',
  AS: 'Mar Egeo',
  AT: 'Anatolia',
  AU: 'Australia',
  BH: 'Cabeza de Pájaro',
  BR: 'Balmoral Reef',
  BS: 'Mar de Banda',
  BU: 'Birmania',
  CA: 'Caribe',
  CL: 'Carolina',
  CO: 'Cocos',
  CR: 'Conway Reef',
  EA: 'Isla de Pascua',
  EU: 'Eurasia',
  FT: 'Futuna',
  GP: 'Galápagos',
  IN: 'India',
  JF: 'Juan de Fuca',
  JZ: 'Juan Fernández',
  KE: 'Kermadec',
  MA: 'Marianas',
  MN: 'Manus',
  MO: 'Maoke',
  MS: 'Mar de las Molucas',
  NA: 'Norteamérica',
  NB: 'Bismarck Norte',
  ND: 'Andes del Norte',
  NH: 'Nuevas Hébridas',
  NI: 'Niuafo’ou',
  NZ: 'Nazca',
  OK: 'Ojotsk',
  ON: 'Okinawa',
  PA: 'Pacífico',
  PM: 'Panamá',
  PS: 'Mar de Filipinas',
  RI: 'Rivera',
  SA: 'Sudamérica',
  SB: 'Bismarck Sur',
  SC: 'Scotia',
  SL: 'Shetland',
  SO: 'Somalia',
  SS: 'Mar de Salomón',
  SU: 'Sonda',
  SW: 'Sandwich',
  TI: 'Timor',
  TO: 'Tonga',
  WL: 'Woodlark',
  YA: 'Yangtsé',
}

/**
 * `Type` solo trae valor en 65 de los 241 tramos, y siempre es `subduction`.
 * Justo donde una placa se hunde bajo otra es donde ocurren los sismos
 * profundos y los de mayor magnitud, así que merece distinguirse.
 */
export const isSubduction = (properties) => properties?.Type === 'subduction'

const getPlateName = (code) => (code ? (PLATE_NAMES[code] ?? code) : null)

/**
 * Etiqueta legible de un tramo: «Nazca – Sudamérica», con el añadido «Zona de
 * subducción» cuando corresponde. Devuelve `null` si el tramo no identifica
 * ninguna placa, para que quien la use pueda omitir el tooltip.
 */
export const getBoundaryLabel = (properties) => {
  const plateA = getPlateName(properties?.PlateA)
  const plateB = getPlateName(properties?.PlateB)

  const plates = [plateA, plateB].filter(Boolean)

  if (!plates.length) {
    return null
  }

  // Raya (–) y no guion: son dos placas enfrentadas, no un nombre compuesto.
  const label = plates.join(' – ')

  return isSubduction(properties) ? `${label} · Zona de subducción` : label
}
