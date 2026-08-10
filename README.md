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

## Estructura

```
app/                 layout, página, boundaries de error y carga
src/components/      componentes de UI
src/context/         estado compartido (filtros, selección, viewport)
src/hooks/           useEarthquakes (fetch, debounce, paginación)
src/utils/           fechas, construcción de URLs, capa de fetch, formateo
styles/              CSS global y ajustes de Leaflet
```
