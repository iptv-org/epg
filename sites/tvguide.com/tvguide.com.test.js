// npx epg-grabber --config=sites/tvguide.com/tvguide.com.config.js --channels=sites/tvguide.com/tvguide.com.channels.xml --output=guide.xml

const { parser, url } = require('./tvguide.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-10-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '9100001138#9200018514',
  xmltv_id: 'CBSEast.us'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://fandom-prod.apigee.net/v1/xapi/tvschedules/tvguide/9100001138/web?start=1667088000&duration=1440&channelSourceIds=9200018514'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://fandom-prod.apigee.net/v1/xapi/tvschedules/tvguide/programdetails/6060613824/web'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  let results = await parser({ content, channel, date })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[5]).toMatchObject({
    start: '2022-10-30T13:00:00.000Z',
    stop: '2022-10-30T14:30:00.000Z',
    title: 'CBS Sunday Morning',
    sub_title: '10-30-2022',
    description:
      'The Backseat Lovers perform on the "Saturday Sessions"; and Daisy Ryan guests on "The Dish." Also: comedian Fortune Feimster.',
    categories: ['Talk & Interview', 'Other'],
    season: 40,
    episode: 248,
    rating: {
      system: 'MPA',
      value: 'TV-PG'
    }
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no-content.json'))
  })
  expect(results).toMatchObject([])
})
