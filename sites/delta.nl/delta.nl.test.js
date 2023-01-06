// npm run channels:parse --config=./sites/delta.nl/delta.nl.config.js --output=./sites/delta.nl/delta.nl.channels.xml
// npx epg-grabber --config=sites/delta.nl/delta.nl.config.js --channels=sites/delta.nl/delta.nl.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./delta.nl.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

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

it('can parse response', done => {
  axios.get.mockImplementation(() =>
    Promise.resolve({
      data: JSON.parse(
        `{"ID":"P~945cb98e-3d19-11ec-8456-953363d7a344","seriesID":"S~d37c4626-b691-11ea-ba69-255835135f02","channelID":"1","start":1636674960,"end":1636676520,"catchupAvailableUntil":1637279760,"title":"Eigen Huis & Tuin: Lekker Leven","description":"Nederlands lifestyleprogramma uit 2022 (ook in HD) met dagelijkse inspiratie voor een lekker leven in en om het huis.\\nPresentatrice Froukje de Both, kok Hugo Kennis en een team van experts, onder wie tuinman Tom Groot, geven praktische tips op het gebied van wonen, lifestyle, tuinieren en koken. Daarmee kun je zelf direct aan de slag om je leven leuker én gezonder te maken. Afl. 15 van seizoen 4.","images":{"thumbnail":{"url":"https://cdn.gvidi.tv/img/booxmedia/b291/561946.jpg"}},"additionalInformation":{"metadataID":"M~c512c206-95e5-11ec-87d8-494f70130311","externalMetadataID":"E~RTL4-89d99356_6599_4b65_a7a0_a93f39019645"},"parentalGuidance":{"kijkwijzer":["AL"]},"restrictions":{"startoverDisabled":false,"catchupDisabled":false,"recordingDisabled":false},"isFiller":false}`
      )
    })
  )

  const content = `{"1":[{"ID":"P~945cb98e-3d19-11ec-8456-953363d7a344","seriesID":"S~d37c4626-b691-11ea-ba69-255835135f02","channelID":"1","start":1636674960,"end":1636676520,"catchupAvailableUntil":1637279760,"title":"NOS Journaal","images":{"thumbnail":{"url":"https://cdn.gvidi.tv/img/booxmedia/e19c/static/NOS%20Journaal5.jpg"}},"additionalInformation":{"metadataID":"M~944f3c6e-3d19-11ec-9faf-2735f2e98d2a","externalMetadataID":"E~TV01-2026117420668"},"parentalGuidance":{"kijkwijzer":["AL"]},"restrictions":{"startoverDisabled":false,"catchupDisabled":false,"recordingDisabled":false},"isFiller":false}]}`

  parser({ date, channel, content })
    .then(result => {
      expect(result).toMatchObject([
        {
          start: '2021-11-11T23:56:00.000Z',
          stop: '2021-11-12T00:22:00.000Z',
          title: 'NOS Journaal',
          description:
            'Nederlands lifestyleprogramma uit 2022 (ook in HD) met dagelijkse inspiratie voor een lekker leven in en om het huis.\nPresentatrice Froukje de Both, kok Hugo Kennis en een team van experts, onder wie tuinman Tom Groot, geven praktische tips op het gebied van wonen, lifestyle, tuinieren en koken. Daarmee kun je zelf direct aan de slag om je leven leuker én gezonder te maken. Afl. 15 van seizoen 4.',
          icon: 'https://cdn.gvidi.tv/img/booxmedia/e19c/static/NOS%20Journaal5.jpg'
        }
      ])
      done()
    })
    .catch(error => {
      done(error)
    })
})

it('can handle empty guide', done => {
  parser({
    date,
    channel,
    content: `{"code":500,"message":"Error retrieving guide"}`
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(error => {
      done(error)
    })
})
