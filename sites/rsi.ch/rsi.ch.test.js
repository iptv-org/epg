const { parser, url } = require('./rsi.ch.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-03-23', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'la1', name: 'La 1', lang: 'it' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://il.srgssr.ch/integrationlayer/2.0/rsi/programGuide/tv/byDate/2026-03-23?reduced=false&channelId=la1'
  )
})

it('can parse response', () => {
  const content = JSON.stringify({
    programGuide: [
      {
        channel: { id: 'la1', vendor: 'RSI', title: 'La 1' },
        programList: [
          {
            title: 'TG',
            startTime: '2026-03-23T20:00:00+01:00',
            endTime: '2026-03-23T20:30:00+01:00',
            imageUrl: 'https://www.rsi.ch/programm/tv/image/redirect/abc123.jpg',
            genre: 'Informazione',
            subtitle: 'Edizione serale',
          },
          {
            title: 'Meteo',
            startTime: '2026-03-23T20:30:00+01:00',
            endTime: '2026-03-23T20:35:00+01:00',
            imageUrl: 'https://www.rsi.ch/programm/tv/image/redirect/def456.jpg',
            genre: 'Informazione',
            description: 'Le previsioni del tempo.',
          },
        ],
      },
    ],
  })

  const results = parser({ content })

  expect(results[0]).toMatchObject({
    title: 'TG',
    subTitle: 'Edizione serale',
    start: '2026-03-23T19:00:00.000Z',
    stop: '2026-03-23T19:30:00.000Z',
    category: 'Informazione',
    icon: { src: 'https://www.rsi.ch/programm/tv/image/redirect/abc123.jpg' },
  })
  expect(results[1]).toMatchObject({
    title: 'Meteo',
    start: '2026-03-23T19:30:00.000Z',
    stop: '2026-03-23T19:35:00.000Z',
    description: 'Le previsioni del tempo.',
  })
})

it('can handle empty programList', () => {
  const content = JSON.stringify({
    programGuide: [
      { channel: { id: 'la1', vendor: 'RSI', title: 'La 1' }, programList: [] },
    ],
  })
  expect(parser({ content })).toMatchObject([])
})

it('can handle empty guide', () => {
  expect(parser({ content: '' })).toMatchObject([])
})

it('can handle malformed JSON', () => {
  expect(parser({ content: 'not-json' })).toMatchObject([])
})
