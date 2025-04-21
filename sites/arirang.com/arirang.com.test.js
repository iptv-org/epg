const { url, parser } = require('./arirang.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.tz('2025-04-20', 'Asia/Seoul').startOf('d')
const channel = {
  xmltv_id: 'ArirangWorld.kr',
  site_id: 'CH_W',
  name: 'Arirang World',
  lang: 'en',
  logo: 'https://i.imgur.com/5Aoithj.png'
}
const content = fs.readFileSync(path.resolve(__dirname, '__data__/schedule.json'), 'utf8')
const programDetail = fs.readFileSync(path.resolve(__dirname, '__data__/detail.json'), 'utf8')
const context = { channel: channel, content: content, date: date }

it('can generate valid url', () => {
  expect(url).toBe('https://www.arirang.com/v1.0/open/external/proxy')
})

it('can handle empty guide', async () => {
  const results = await parser({ channel: channel, content: '', date: date })
  expect(results).toMatchObject([])
})

it('can parse response', async () => {
  axios.post.mockImplementation((url, data) => {
    if (
      url === 'https://www.arirang.com/v1.0/open/external/proxy' &&
      JSON.stringify(data) ===
      JSON.stringify({
        address: 'https://script.arirang.com/api/v1/bis/listScheduleV3.do',
        method: 'POST',
        headers: {},
        body: { data: { dmParam: { chanId: 'CH_W', broadYmd: '20250420', planNo: '1' } } }
      })
    ) {
      return Promise.resolve({
        data: JSON.parse(content)
      })
    } else if (
      url === 'https://www.arirang.com/v1.0/open/program/detail' &&
      JSON.stringify(data) === JSON.stringify({ bis_program_code: '2025006T' })
    ) {
      return Promise.resolve({
        data: JSON.parse(programDetail)
      })
    } else {
      return Promise.resolve({
        data: ''
      })
    }
  })

  const results = await parser(context)

  expect(results[0]).toMatchObject({
    title: 'Diplomat Archives: Hidden Stories',
    start: dayjs.tz(date, 'Asia/Seoul'),
    stop: dayjs.tz(date, 'Asia/Seoul').add(30, 'minute'),
    image:
      'https://img.arirang.com/v1/AUTH_d52449c16d3b4bbca17d4fffd9fc44af/public/images/202504/2985531324875408146.jpg',
    description: 'As of April 2025, S. Korea has established diplomatic relations with a total of 194 countries.\nAmong them are countries that have had ties and exchanges with Korea for hundreds of years.\nWith such long-standing relationships with so many nations,\nmight there be fascinating hidden stories between Korea and the rest of the world that we don’t know yet? \n\n"Diplomat’s Archives: Hidden Stories" begins with this very question.\nTogether with foreign embassies in Korea, the series uncovers and sheds light on meaningful yet lesser-known stories between Korea and other countries.\nThrough this, we aim to reaffirm the deep friendships that have been built over time, highlight how countries are interconnected—bilaterally and multilaterally—\nand emphasize the importance of cooperation on the global stage today.',
    category: 'Current Affairs'
  })
})