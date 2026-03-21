const { parser, url } = require('./rts.ch.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-03-21', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '5d332a26e06d08eec8ad385d566187df72955623', name: 'RTS Info', lang: 'fr' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://il.srgssr.ch/integrationlayer/2.0/rts/programGuide/tv/byDate/2026-03-21?reduced=false&channelId=5d332a26e06d08eec8ad385d566187df72955623'
  )
})

it('can parse response', () => {
  const content = JSON.stringify({
    programGuide: [
      {
        channel: { id: '5d332a26e06d08eec8ad385d566187df72955623', title: 'RTS Info' },
        programList: [
          {
            title: "L'essentiel de l'actualité",
            startTime: '2026-03-21T07:00:00+01:00',
            endTime: '2026-03-21T19:00:00+01:00',
            imageUrl: 'https://kingfisher.rts.ch/res/img/cdns3/sherlock/urn:orphea-image:1043433',
            genre: 'Actualité',
          },
          {
            title: 'Forum',
            startTime: '2026-03-21T19:00:00+01:00',
            endTime: '2026-03-21T20:00:00+01:00',
            imageUrl: 'https://kingfisher.rts.ch/res/img/cdns3/sherlock/urn:orphea-image:1831387',
            genre: 'Actualité',
            description: 'Le magazine du soir.',
          },
        ],
      },
    ],
  })

  const results = parser({ content })

  expect(results[0]).toMatchObject({
    title: "L'essentiel de l'actualité",
    start: '2026-03-21T06:00:00.000Z',
    stop: '2026-03-21T18:00:00.000Z',
    category: 'Actualité',
    icon: { src: 'https://kingfisher.rts.ch/res/img/cdns3/sherlock/urn:orphea-image:1043433' },
  })
  expect(results[1]).toMatchObject({
    title: 'Forum',
    start: '2026-03-21T18:00:00.000Z',
    stop: '2026-03-21T19:00:00.000Z',
    description: 'Le magazine du soir.',
  })
})

it('can handle empty programList', () => {
  const content = JSON.stringify({
    programGuide: [
      { channel: { id: '5d332a26e06d08eec8ad385d566187df72955623', title: 'RTS Info' }, programList: [] },
    ],
  })

  const results = parser({ content })
  expect(results).toMatchObject([])
})

it('can handle empty guide', () => {
  const results = parser({ content: '' })
  expect(results).toMatchObject([])
})

it('can handle malformed JSON', () => {
  const results = parser({ content: 'not-json' })
  expect(results).toMatchObject([])
})