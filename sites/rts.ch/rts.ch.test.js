const { parser, url } = require('./rts.ch.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2026-03-20', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '143932a79bb5a123a646b68b1d1188d7ae493e5b', name: 'RTS 1', lang: 'fr' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.rts.ch/play/v3/api/rts/production/tv-program-guide?date=2026-03-20'
  )
})

it('can parse response', () => {
  const content = JSON.stringify({
    data: [
      {
        channel: { id: '143932a79bb5a123a646b68b1d1188d7ae493e5b', title: 'RTS 1' },
        programList: [
          {
            title: '19h30',
            startTime: '2026-03-20T19:30:00+01:00',
            endTime: '2026-03-20T20:01:00+01:00',
            imageUrl: 'https://kingfisher.rts.ch/res/img/cdns3/sherlock/urn:orphea-image:1035156',
            genre: 'Actualité',
            description: 'Le journal du soir.',
          },
          {
            title: 'Météo',
            startTime: '2026-03-20T20:00:00+01:00',
            endTime: '2026-03-20T20:03:00+01:00',
            imageUrl: 'https://kingfisher.rts.ch/res/img/cdns3/sherlock/urn:orphea-image:400670',
            genre: 'Actualité',
          },
        ],
      },
    ],
  })

  const results = parser({ content, channel })

  expect(results[0]).toMatchObject({
    title: '19h30',
    start: '2026-03-20T18:30:00.000Z',
    stop: '2026-03-20T19:01:00.000Z',
    description: 'Le journal du soir.',
    category: 'Actualité',
    icon: { src: 'https://kingfisher.rts.ch/res/img/cdns3/sherlock/urn:orphea-image:1035156' },
  })
  expect(results[1]).toMatchObject({
    title: 'Météo',
    start: '2026-03-20T19:00:00.000Z',
    stop: '2026-03-20T19:03:00.000Z',
  })
})

it('can handle channel not found in response', () => {
  const content = JSON.stringify({
    data: [
      {
        channel: { id: 'some-other-channel-id', title: 'Other' },
        programList: [{ title: 'Show', startTime: '2026-03-20T10:00:00+01:00', endTime: '2026-03-20T11:00:00+01:00' }],
      },
    ],
  })

  const results = parser({ content, channel })
  expect(results).toMatchObject([])
})

it('can handle empty guide', () => {
  const results = parser({ content: '', channel })
  expect(results).toMatchObject([])
})

it('can handle malformed JSON', () => {
  const results = parser({ content: 'not-json', channel })
  expect(results).toMatchObject([])
})