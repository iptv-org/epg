// npm run channels:parse -- --config=./sites/xumo.tv/xumo.tv.config.js --output=./sites/xumo.tv/xumo.tv.channels.xml
// npx epg-grabber --config=sites/xumo.tv/xumo.tv.config.js --channels=sites/xumo.tv/xumo.tv.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./xumo.tv.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios', () => {
  return {
    create: jest.fn().mockReturnValue({
      get: jest.fn()
    })
  }
})

const API_ENDPOINT = `https://valencia-app-mds.xumo.com/v2`

const date = dayjs.utc('2022-11-06', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '0#99991247',
  xmltv_id: 'NBCNewsNow.us'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    `${API_ENDPOINT}/epg/10006/20221106/0.json?f=asset.title&f=asset.descriptions&limit=50&offset=0`
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_0.json'))

  axios.create().get.mockImplementation(url => {
    if (
      url ===
      `${API_ENDPOINT}/epg/10006/20221106/1.json?f=asset.title&f=asset.descriptions&limit=50&offset=0`
    ) {
      return Promise.resolve({
        data: Buffer.from(fs.readFileSync(path.resolve(__dirname, '__data__/content_1.json')))
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

  expect(results[0]).toMatchObject({
    start: '2022-11-05T23:00:00.000Z',
    stop: '2022-11-06T01:00:00.000Z',
    title: 'Dateline',
    sub_title: 'The Disappearance of Laci Peterson',
    description:
      "After following Laci Peterson's case for more than 15 years, the show delivers a comprehensive report with rarely seen interrogation video, new insight from prosecutors, and surprising details from Amber Frey, who helped uncover the truth."
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    content: Buffer.from(fs.readFileSync(path.resolve(__dirname, '__data__/no-content.json'))),
    channel,
    date
  })

  expect(results).toMatchObject([])
})
