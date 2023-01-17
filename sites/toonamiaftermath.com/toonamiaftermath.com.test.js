// npx epg-grabber --config=sites/toonamiaftermath.com/toonamiaftermath.com.config.js --channels=sites/toonamiaftermath.com/toonamiaftermath.com.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./toonamiaftermath.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const API_ENDPOINT = `https://api.toonamiaftermath.com`

const date = dayjs.utc('2022-11-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'Toonami Aftermath EST',
  xmltv_id: 'ToonamiAftermathEast.us'
}

it('can generate valid url', async () => {
  axios.get.mockImplementation(url => {
    if (
      url ===
      `${API_ENDPOINT}/playlists?scheduleName=Toonami Aftermath EST&startDate=2022-11-30T00:00:00.000Z&thisWeek=true&weekStartDay=monday`
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/playlists.json')))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  const result = await url({ channel, date })

  expect(result).toBe(`${API_ENDPOINT}/playlist?id=635fbd8117f6824d953a216e&addInfo=true`)
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(62)
  expect(results[0]).toMatchObject({
    start: '2022-11-29T17:00:30.231Z',
    stop: '2022-11-29T17:20:54.031Z',
    title: 'X-Men',
    sub_title: 'Reunion (Part 1)',
    icon: 'https://i.imgur.com/ZSZ0x1m.gif'
  })
})

it('can handle empty guide', () => {
  const result = parser({ content: '', date })
  expect(result).toMatchObject([])
})
