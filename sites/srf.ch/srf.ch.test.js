const { parser, url } = require('./srf.ch.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-03-23', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '23FFBE1B-65CE-4188-ADD2-C724186C2C9F', name: 'SRF 1', lang: 'de' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://il.srgssr.ch/integrationlayer/2.0/srf/programGuide/tv/byDate/2026-03-23?reduced=false&channelId=23FFBE1B-65CE-4188-ADD2-C724186C2C9F'
  )
})

it('can parse response', () => {
  const content = JSON.stringify({
    programGuide: [
      {
        channel: { id: '23FFBE1B-65CE-4188-ADD2-C724186C2C9F', vendor: 'SRF', title: 'SRF 1' },
        programList: [
          {
            title: 'Tagesschau',
            startTime: '2026-03-23T19:30:00+01:00',
            endTime: '2026-03-23T19:55:00+01:00',
            imageUrl: 'https://www.srf.ch/programm/tv/image/redirect/abc123.jpg',
            genre: 'Nachrichten',
            subtitle: 'Hauptausgabe',
          },
          {
            title: 'Meteo',
            startTime: '2026-03-23T19:55:00+01:00',
            endTime: '2026-03-23T20:10:00+01:00',
            imageUrl: 'https://www.srf.ch/programm/tv/image/redirect/def456.jpg',
            genre: 'Nachrichten',
            description: 'Das Wetter für die Schweiz.',
          },
        ],
      },
    ],
  })

  const results = parser({ content })

  expect(results[0]).toMatchObject({
    title: 'Tagesschau',
    subTitle: 'Hauptausgabe',
    start: '2026-03-23T18:30:00.000Z',
    stop: '2026-03-23T18:55:00.000Z',
    category: 'Nachrichten',
    icon: { src: 'https://www.srf.ch/programm/tv/image/redirect/abc123.jpg' },
  })
  expect(results[1]).toMatchObject({
    title: 'Meteo',
    start: '2026-03-23T18:55:00.000Z',
    stop: '2026-03-23T19:10:00.000Z',
    description: 'Das Wetter für die Schweiz.',
  })
})

it('can handle empty programList', () => {
  const content = JSON.stringify({
    programGuide: [
      { channel: { id: '23FFBE1B-65CE-4188-ADD2-C724186C2C9F', vendor: 'SRF', title: 'SRF 1' }, programList: [] },
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
