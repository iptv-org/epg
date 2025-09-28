const { parser, url } = require('./tvcesoir.fr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '847049/tf-1',
  xmltv_id: 'TF1.fr'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.tvcesoir.fr/programme-tv/programme/chaine/847049/tf-1.html?dt=2023-11-24'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-11-24T01:00:00.000Z',
    stop: '2023-11-24T01:10:00.000Z',
    title: "Tirage de l'Euro Millions"
  })

  expect(results[26]).toMatchObject({
    start: '2023-11-24T22:45:00.000Z',
    stop: '2023-11-24T23:15:00.000Z',
    title: 'Juge Arthur'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, './__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
