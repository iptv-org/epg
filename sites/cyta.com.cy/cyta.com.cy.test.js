const { url, parser } = require('./cyta.com.cy.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(utc)
dayjs.extend(customParseFormat)

const date = dayjs.utc('2025-01-03', 'YYYY-MM-DD').startOf('day')
const channel = {
  site_id: '561066',
  xmltv_id: 'RIK1.cy'
}

it('can generate valid url', () => {
  const generatedUrl = url({ date, channel })
  expect(generatedUrl).toBe(
    'https://epg.cyta.com.cy/api/mediacatalog/fetchEpg?startTimeEpoch=1735862400000&endTimeEpoch=1735948800000&language=1&channelIds=561066'
  )
})

it('can parse response', () => {
  const content = `
  {
    "channelEpgs": [
        {
            "epgPlayables": [
                { "name": "Πρώτη Ενημέρωση", "startTime": 1735879500000, "endTime": 1735889400000 }
            ]
        }
    ]
  }`

  const result = parser({ content })

  expect(result).toMatchObject([
    {
      title: 'Πρώτη Ενημέρωση',
      start: '2025-01-03T04:45:00.000Z',
      stop: '2025-01-03T07:30:00.000Z'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '{"channelEpgs":[]}'
  })
  expect(result).toMatchObject([])
})
