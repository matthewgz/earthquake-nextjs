# Earthquake

Visor de sismos sobre un mapa, con filtro por rango de fechas y magnitud mínima.
Los datos vienen del servicio público [FDSN Event de
USGS](https://earthquake.usgs.gov/fdsnws/event/1/).

Next.js 16 (App Router) · React 19 · styled-components · Leaflet.

## Puesta en marcha

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run dev
```

La app queda en http://localhost:3000.

## Scripts

| Script                 | Qué hace                          |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Servidor de desarrollo            |
| `npm run build`        | Build de producción               |
| `npm start`            | Sirve el build de producción      |
| `npm run lint`         | ESLint (`eslint-config-next`)     |
| `npm test`             | Tests unitarios con `node --test` |
| `npm run format`       | Formatea con Prettier             |
| `npm run format:check` | Comprueba el formato sin escribir |

## Variables de entorno

| Variable                  | Descripción                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_ENV_URL_API` | Raíz del servicio FDSN de USGS, sin `/query` ni querystring. |

La app añade `/query` y `/count` según haga falta. Si no se define, cae al valor
por defecto de USGS.

## Zonas horarias

Es la parte del proyecto que más fácil se rompe, así que conviene tenerla clara:

- **El estado de fecha es siempre un string `YYYY-MM-DD` del calendario local.**
  Ningún `Date` entra al estado: `new Date('2026-08-10')` se parsea como
  medianoche **UTC**, y eso desplaza un día entero la consulta para cualquiera
  en una zona negativa.
- **USGS interpreta como UTC cualquier fecha sin zona horaria.** Por eso
  `src/utils/dateRange.js` convierte el día local elegido al instante UTC
  equivalente y se envía con sufijo `Z`.
- La conversión usa `new Date(año, mes, día)`, que aplica las reglas de horario
  de verano vigentes _en esa fecha_. Calcular el offset a mano con
  `getTimezoneOffset()` daría el de hoy, incorrecto al cruzar un cambio de hora.
- Las horas de los sismos se muestran en la zona local del navegador, con la
  etiqueta correspondiente («Horas en GMT-5») en la cabecera del panel.

Los tests de `src/utils/dateRange.test.js` cubren esto parametrizando la
variable `TZ`, incluida una transición de horario de verano.

## Notas sobre la API de USGS

Comprobado contra el servicio en vivo:

- Sin `limit`, una consulta amplia con magnitud baja supera el tope de 20.000
  resultados y responde **HTTP 400**. Por eso `limit` no es opcional.
- Con `limit` presente, `metadata.count` desaparece de `/query`. El total real
  se obtiene de `/count`, **al que no hay que pasarle `limit`**: también lo
  respeta y devolvería el valor recortado.
- Ante parámetros inválidos responde **400 con cuerpo `text/plain`**, así que
  hay que comprobar el `content-type` antes de parsear.
- Un rango invertido devuelve **200 con `features: []`**, indistinguible de «no
  hubo sismos». Se valida antes de pedir.
- El feed mezcla sismos naturales con **voladuras de cantera, explosiones,
  deslizamientos y sismos de hielo** (~2% del total, siempre de magnitud baja).
  Se filtran con `eventtype=earthquake`, activado por defecto.

### Datos que solo están en el endpoint de detalle

`/query?eventid=<id>` devuelve los productos derivados, a costa de **una
petición por evento**. Solo se pide al abrir un sismo, y se cachea.

- **Duración**: `moment-tensor.sourcetime-duration`. Ojo, es la duración de la
  función de fuente, un valor **modelado** a partir del momento sísmico
  (`sourcetime-type: triangle`) y no una medición: todos los M6.3–6.4 dan 7 s.
  Es el tiempo de ruptura de la falla, **no** cuánto se percibió el temblor,
  que es bastante más. La UI lo etiqueta como tal a propósito.
- **Área donde se sintió**: `shakemap → download/cont_mmi.json`, líneas de
  isointensidad Mercalli en GeoJSON. Se dibujan en el mapa con la paleta oficial
  de ShakeMap.
- **Reportes ciudadanos**: producto `dyfi` («Did You Feel It?»). Además de
  `num-responses` y `maxmmi`, `dyfi_geo_10km.geojson` trae una celda por zona
  con `cdi` y `nresp`. Se dibujan como **círculos de tamaño fijo en píxeles y
  no como los polígonos originales**: los reportes de un sismo grande llegan
  desde miles de kilómetros, y al zoom necesario para abarcarlos una celda de
  10 km mide menos de un píxel. La versión de 1 km existe pero pesa 159 KB
  frente a 65 KB y a escala de mapa no aporta nada.
- El campo `name` de esas celdas **contiene HTML** (`"UTM:(…)<br>Eloy Alfaro"`).
  Se extrae la parte legible y se inserta con `textContent`: `bindTooltip` de
  Leaflet asigna `innerHTML` cuando recibe un string.
- Los archivos de producto viven en otro path de USGS pero tienen
  `access-control-allow-origin: *`, así que se piden directamente del navegador.
- Cobertura muy desigual: `shakemap` y `moment-tensor` están en el 100% de los
  sismos M≥5, pero en el 0–20% por debajo de M4. La UI degrada mostrando solo
  lo que hay.

## Placas tectónicas

Capa opcional, apagada por defecto, que dibuja los límites entre placas. Es lo
que da sentido al mapa: los sismos no salpican el planeta al azar, se alinean
con esos trazos. Al pasar el cursor por un tramo, un tooltip nombra las dos
placas en contacto y avisa si es una zona de subducción, que son los 65 tramos
donde una placa se hunde bajo otra y donde ocurren los sismos profundos y los
de mayor magnitud.

- **Fuente**: modelo PB2002 de _An updated digital model of plate boundaries_
  (Peter Bird, 2003), en la conversión a GeoJSON de Hugo Ahlenius / Nordpil
  ([fraxen/tectonicplates](https://github.com/fraxen/tectonicplates)). 241
  tramos y 6.292 vértices.
- **Licencia [ODC-BY 1.0](https://opendatacommons.org/licenses/by/1-0/), que
  exige atribución.** Se cumple en dos sitios: este párrafo y la opción
  `attribution` de la capa, que Leaflet muestra en su control mientras la capa
  está encendida.
- **El archivo es estático**, en `public/placas-tectonicas.geojson`, en vez de
  pedirse a su origen en cada visita: el dato no cambia desde 2003, así se
  evita depender de un tercero en caliente y de su CORS. Aun así no entra en el
  bundle: sus 164 KB se piden la primera vez que alguien enciende la capa, y
  quien no la use no los descarga.
- **Va en un panel propio de Leaflet** (`placas`, `z-index` 350) por debajo del
  `overlayPane` (400) donde viven las capas del sismo. Sin eso Leaflet apila
  por orden de montaje, y encender las placas con un sismo ya abierto las
  dejaba pintadas encima de sus contornos de intensidad.
- El interruptor **se recuerda en `localStorage`** (`sismos:placas`): es una
  preferencia de lectura, no depende de la consulta. Los toggles de las capas
  del sismo siguen siendo de sesión.

## Estructura

```
app/                 layout, página, boundaries de error y carga
src/components/      componentes de UI
src/context/         estado compartido (filtros, selección, viewport)
src/hooks/           useEarthquakes (fetch, debounce, paginación)
src/utils/           fechas, construcción de URLs, capa de fetch, formateo
styles/              CSS global y ajustes de Leaflet
```
