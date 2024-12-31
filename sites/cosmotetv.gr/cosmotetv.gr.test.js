const { parser, url, channels } = require('./cosmotetv.gr.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const timezone = require('dayjs/plugin/timezone')
const axios = require('axios')

dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(timezone)

jest.mock('axios')

const date = dayjs.utc('2024-12-26', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'vouli', xmltv_id: 'HellenicParliamentTV.gr' }

const mockChannelData = {
  "channels": [
    {
      "guid": "XTV100000954",
      "title": "ΒΟΥΛΗ HD",
      "callSign": "vouli",
      "logos": {
        "square": "https://tr.static.cdn.cosmotetvott.gr/ote-prod/channel_logos/vouli1-normal.png",
        "wide": "https://tr.static.cdn.cosmotetvott.gr/ote-prod/channel_logos/vouli1-wide.png"
      }
    }
  ]
}

const mockEpgData = {
  "channels": [
    {
      "items": [
        {
          "startTime": "2024-12-26T23:00:00+00:00",
          "endTime": "2024-12-27T00:00:00+00:00",
          "title": "Τι Λέει ο Νόμος",
          "description": "νημερωτική εκπομπή. Συζήτηση με τους εισηγητές των κομμάτων για το νομοθετικό έργο.",
          "qoe": {
            "genre": "Special"
          },
          "thumbnails": {
            "standard": "https://gr-ermou-prod-cache05.static.cdn.cosmotetvott.gr/ote-prod/70/280/040029714812000800_1734415727199.jpg"
          }
        }
      ]
    }
  ]
}

it('can generate valid url', () => {
  const startOfDay = dayjs(date).startOf('day').utc().unix()
  const endOfDay = dayjs(date).endOf('day').utc().unix()
  expect(url({ date, channel })).toBe(`https://mwapi-prod.cosmotetvott.gr/api/v3.4/epg/listings/el?from=${startOfDay}&to=${endOfDay}&callSigns=${channel.site_id}&endingIncludedInRange=false`)
})

it('can parse response', () => {
  const content = JSON.stringify(mockEpgData)
  const result = parser({ date, content }).map(p => {
    p.start = dayjs(p.start).toISOString()
    p.stop = dayjs(p.stop).toISOString()
    return p
  })

  expect(result).toMatchObject([
    {
      title: "Τι Λέει ο Νόμος",
      description: "νημερωτική εκπομπή. Συζήτηση με τους εισηγητές των κομμάτων για το νομοθετικό έργο.",
      category: "Special",
      image: "https://gr-ermou-prod-cache05.static.cdn.cosmotetvott.gr/ote-prod/70/280/040029714812000800_1734415727199.jpg",
      start: "2024-12-26T23:00:00.000Z",
      stop: "2024-12-27T00:00:00.000Z"
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({ date, channel, content: '{"date":"2024-12-26","categories":[],"channels":[]}' });
  expect(result).toMatchObject([])
})
