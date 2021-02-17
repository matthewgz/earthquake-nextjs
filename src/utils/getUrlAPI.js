import moment from 'moment'

const getUrlAPI = (dates, minMagnitude) => {
  const URL =
    process.env.NEXT_PUBLIC_ENV_URL_API +
    `&starttime=${moment(dates?.to).format('YYYY-MM-DDT00:00:00')}` +
    `&minmagnitude=${minMagnitude}` +
    `&endtime=${moment(dates?.from).format('YYYY-MM-DDT23:59:59')}`

  return URL
}

export default getUrlAPI
