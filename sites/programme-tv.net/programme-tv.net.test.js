const { parser, url, request } = require('./programme-tv.net.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-27', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'tf1-19',
  xmltv_id: 'TF1.fr'
}

it('can generate valid url', () => {
  expect(request.headers).toMatchObject({
    cookie: 'authId=b7154156fe4fb8acdb6f38e1207c6231'
  })
})

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://www.programme-tv.net/programme/chaine/2023-11-27/programme-tf1-19.html'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  let results = parser({ content, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-11-27T00:05:00.000Z',
    stop: '2023-11-27T05:30:00.000Z',
    title: 'Programmes de la nuit',
    category: 'Autre',
    image:
      'https://www.programme-tv.net/imgre/fit/~2~program~978eb86d5b99cee0.jpg/960x540/quality/80/programmes-de-la-nuit.jpg'
  })

  expect(results[27]).toMatchObject({
    start: '2023-11-27T22:50:00.000Z',
    stop: '2023-11-27T23:45:00.000Z',
    title: 'Coup de foudre chez le Père Noël',
    category: 'Téléfilm',
    image:
      'https://www.programme-tv.net/imgre/fit/~2~program~5a4e78779c4a3fac.jpg/960x540/quality/80/coup-de-foudre-chez-le-pere-noel.jpg'
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: '',
    date
  })

  expect(results).toMatchObject([])
})
