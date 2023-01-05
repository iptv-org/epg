// npx epg-grabber --config=sites/tvcubana.icrt.cu/tvcubana.icrt.cu.config.js --channels=sites/tvcubana.icrt.cu/tvcubana.icrt.cu.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./tvcubana.icrt.cu.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-22', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'cv',
  xmltv_id: 'CubavisionNacional.cu'
}
const content = `[{"eventId":"6169c2300ad38b0a8d9e3760","title":"CARIBE NOTICIAS","description":"EMISI\\u00d3N DE CIERRE.","eventInitialDate":"2021-11-22T00:00:00","eventEndDate":"2021-11-22T00:00:00","idFromEprog":"5c096ea5bad1b202541503cf","extendedDescription":"","transmission":"Estreno","pid":"","space":"CARIBE NOTICIAS","eventStartTime":{"value":{"ticks":24000000000,"days":0,"hours":0,"milliseconds":0,"minutes":40,"seconds":0,"totalDays":0.027777777777777776,"totalHours":0.6666666666666666,"totalMilliseconds":2400000,"totalMinutes":40,"totalSeconds":2400},"hasValue":true},"eventEndTime":{"value":{"ticks":30000000000,"days":0,"hours":0,"milliseconds":0,"minutes":50,"seconds":0,"totalDays":0.034722222222222224,"totalHours":0.8333333333333334,"totalMilliseconds":3000000,"totalMinutes":50,"totalSeconds":3000},"hasValue":true},"eventDuration":"00:10:00","channelName":"Cubavisi\\u00f3n","eventInitialDateTime":"2021-11-22T00:40:00","eventEndDateTime":"2021-11-22T00:50:00","isEventWithNegativeDuration":false,"isEventWithDurationOver24Hrs":false,"isEventWithTextOverLength":false,"created":"2021-11-22T10:32:27.476824","id":5309687}]`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.tvcubana.icrt.cu/cartv/cv/lunes.php')
})

it('can generate valid url for next day', () => {
  expect(url({ channel, date: date.add(2, 'd') })).toBe(
    'https://www.tvcubana.icrt.cu/cartv/cv/miercoles.php'
  )
})

it('can parse response', () => {
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result).toMatchObject([
    {
      start: '2021-11-22T05:40:00.000Z',
      stop: '2021-11-22T05:50:00.000Z',
      title: 'CARIBE NOTICIAS',
      description: `EMISIÓN DE CIERRE.`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html lang="es-es" dir="ltr"><head></head><body class="error-page" ></body></html>`
  })
  expect(result).toMatchObject([])
})
