const { parser, url } = require('./clarotvmais.com.br.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

dayjs.tz.setDefault('America/Sao_Paulo')

const date = dayjs('2025-12-13', 'YYYY-MM-DD').startOf('day').unix()
const channel = { site_id: '1' }

it('can generate valid url', () => {
    const startOfDay = Math.floor(dayjs(date).startOf('day').unix())
    const endOfDay = Math.floor(dayjs(date).endOf('day').unix())
    expect(url({ channel, date })).toBe(
        `https://www.clarotvmais.com.br/avsclient/1.2/epg/livechannels?types=&channelIds=1&startTime=${startOfDay}&endTime=${endOfDay}&location=SAO%20PAULO,AMAZONAS&channel=PCTV`
    )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content })
  results = results.map(p => {
    p.start = new Date(p.start).toJSON()
    p.stop = new Date(p.stop).toJSON()

    return p
  })

  expect(results.length).toBe(119)
  expect(results[0]).toMatchObject({
    title: 'Peppa Pig',
    description: 'Peppa e George brincam com walkie-talkies na casa da Vovó e do Vovô Pig. Vovô Pig ensina a Peppa e George a usar codinomes para conversarem usando os aparelhos.',
    episode: 8,
    season: 10,
    start: '2025-12-12T23:00:00.000Z',
    stop: '2025-12-12T23:05:00.000Z'
  })
  expect(results[118]).toMatchObject({
    title: 'Peppa Pig',
    description: 'Peppa e George acordam no trailer e percebem que estão no meio de um nevoeiro. Quando ele se dissipa, eles percebem que a família estacionou no alto de um penhasco, o mesmo que Mamãe Pig queria visitar.',
    episode: 26,
    season: 10,
    start: '2025-12-13T22:56:00.000Z',
    stop: '2025-12-13T23:01:00.000Z'
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const results = parser({ content })

  expect(results).toMatchObject([])
})
