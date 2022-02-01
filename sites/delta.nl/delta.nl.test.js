// node ./scripts/channels.js --config=./sites/delta.nl/delta.nl.config.js --output=./sites/delta.nl/delta.nl_nl.channels.xml
// npx epg-grabber --config=sites/delta.nl/delta.nl.config.js --channels=sites/delta.nl/delta.nl_nl.channels.xml --output=.gh-pages/guides/nl/delta.nl.epg.xml --days=2

const { parser, url, request } = require('./delta.nl.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-12', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1',
  xmltv_id: 'NPO1.nl'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://clientapi.tv.delta.nl/guide/channels/list?start=1636675200&end=1636761600&includeDetails=true&channels=1'
  )
})

it('can parse response', () => {
  const content = `{"1":[{"ID":"P~945cb98e-3d19-11ec-8456-953363d7a344","seriesID":"S~d37c4626-b691-11ea-ba69-255835135f02","channelID":"1","start":1636674960,"end":1636676520,"catchupAvailableUntil":1637279760,"title":"NOS Journaal","images":{"thumbnail":{"url":"https://cdn.gvidi.tv/img/booxmedia/e19c/static/NOS%20Journaal5.jpg"}},"additionalInformation":{"metadataID":"M~944f3c6e-3d19-11ec-9faf-2735f2e98d2a","externalMetadataID":"E~TV01-2026117420668"},"parentalGuidance":{"kijkwijzer":["AL"]},"restrictions":{"startoverDisabled":false,"catchupDisabled":false,"recordingDisabled":false},"isFiller":false}]}`
  const result = parser({ date, channel, content })

  expect(result).toMatchObject([
    {
      start: '2021-11-11T23:56:00.000Z',
      stop: '2021-11-12T00:22:00.000Z',
      title: 'NOS Journaal',
      icon: 'https://cdn.gvidi.tv/img/booxmedia/e19c/static/NOS%20Journaal5.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"code":500,"message":"Error retrieving guide"}`
  })
  expect(result).toMatchObject([])
})
