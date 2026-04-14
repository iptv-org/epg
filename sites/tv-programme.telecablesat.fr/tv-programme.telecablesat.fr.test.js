const { parser, url, request } = require('./tv-programme.telecablesat.fr.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '13',
  xmltv_id: 'DasErste.de'
}
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0'
}

jest.mock('axios')

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tv-programme.telecablesat.fr/chaine/13/index.html?date=2023-11-30&period=morning'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject(headers)
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_morning.html'))

  axios.get.mockImplementation((url, config) => {
    if (
      url ===
        'https://tv-programme.telecablesat.fr/chaine/13/index.html?date=2023-11-30&period=noon' &&
      JSON.stringify(config.headers) === JSON.stringify(headers)
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_noon.html'))
      })
    } else if (
      url ===
        'https://tv-programme.telecablesat.fr/chaine/13/index.html?date=2023-11-30&period=afternoon' &&
      JSON.stringify(config.headers) === JSON.stringify(headers)
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_afternoon.html'))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-11-30T08:00:00.000Z',
    stop: '2023-11-30T08:05:00.000Z',
    title: 'Tagesschau',
    description:
      'Die Tagesschau ist eine Institution in der deutschen Fernsehlandschaft. Seit 1952 wird kurz und bündig von aktuellen Geschehnissen in Deutschland und der Welt berichtet. Bis heute ist die Redaktion der sachlichen Berichterstattung treu geblieben und...',
    image:
      'https://tv.cdnartwhere.eu/cache/i2/Dc5BDoMgEADAv3Cuwoqy4Fu4LLho24hEaNK06d_rcW7zFYEqi1lsrZU6e-nlXrqyHe2oXVxyT5_Xybys3GduXsYjN7pnPqdkI0CkJbk4gnKWMQFAQLQUtHZesuEwOgWa7DCkKV4cGFEBG0eQrCJSwY3YP8oqbmKn-rwexuBb20n8_g.jpg'
  })

  expect(results[36]).toMatchObject({
    start: '2023-12-01T04:30:00.000Z',
    stop: '2023-12-01T05:30:00.000Z',
    title: 'ZDF-Morgenmagazin',
    description: 'Für einen guten Start in den Tag',
    image:
      'https://tv.cdnartwhere.eu/cache/i2/Dc5BDoMgEADAv3CuIiIu-BYuu7Bo24hEaNK06d_rbY7zFYSVxSK21kpdvPRyL13ZjnbULsTc4-d1MseV-8zNy3DkhvfMp0k2KBUwJhcmNTjLkJRSBGCRtHZe2gQTYXRhJNCoL1NyyiTiSI6IhtHADOT6R1nFTexYn9djnuGtrRG_Pw.jpg'
  })
})

it('can handle empty guide', done => {
  parser({
    content:
      '<!DOCTYPE html><html lang="fr" dir="ltr" prefix=""> <head></head> <body></body></html>',
    date,
    channel
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
