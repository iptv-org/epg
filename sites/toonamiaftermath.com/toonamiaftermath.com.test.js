const { parser, url } = require('./toonamiaftermath.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2026-07-04').startOf('d')
const channel = {
  site_id: 'Toonami Aftermath EST+180',
  xmltv_id: 'ToonamiAftermath.us@West'
}

axios.get.mockImplementation(url => {
  const urls = {
    'https://api.toonamiaftermath.com/playlists?scheduleName=Toonami%20Aftermath%20EST&startDate=2026-07-04T00:00:00.000Z&thisWeek=true&weekStartDay=monday':
      'playlists.json',
    'https://api.toonamiaftermath.com/playlist?id=6a216d80d02137d17554246e&addInfo=true': 'content01.json',
    'https://api.toonamiaftermath.com/playlist?id=6a22befed02137d17593d644&addInfo=true': 'content02.json'
  }
  let data = ''
  if (urls[url]) {
    data = JSON.parse(fs.readFileSync(path.join(__dirname, '__data__', urls[url])))
  }

  return Promise.resolve({ data })
})

it('can generate valid url', async () => {
  expect(await url({ channel, date })).toBe('https://api.toonamiaftermath.com/playlist?id=6a216d80d02137d17554246e&addInfo=true')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content01.json'))
  const results = (await parser({ content, channel, date }))
    .map(p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    })

  expect(results.length).toBe(73)
  expect(results[0]).toMatchObject({
    start: '2026-07-04T00:01:30.791Z',
    stop: '2026-07-04T00:22:14.992Z',
    title: 'Dragonball',
    description: 'Dragon Ball',
    sub_title: 'Milk Delivery',
    image: 'https://i.imgur.com/cQBxAVU.gif'
  })
  expect(results[72]).toMatchObject({
    start: '2026-07-04T23:53:06.041Z',
    stop: '2026-07-05T00:17:49.153Z',
    title: 'Patlabor',
    description: 'Patlabor: The Mobile Police',
    sub_title: 'You Win!',
    image: 'https://i.imgur.com/lP8LKsc.gif'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})
