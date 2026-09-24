const axios = require('axios')
const { parser, url, request } = require('./foxtel.com.au.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

axios.get.mockImplementation(url => {
  if (
    url ===
    'https://www.foxtel.com.au/webepg/ws/foxtel/event/174868153?movieHeight=213&tvShowHeight=213&regionId=8336'
  ) {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program_1.json')))
    })
  } else {
    return Promise.resolve({
      data: '{}'
    })
  }
})

const date = dayjs.utc('2022-11-08', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'Channel-9-Sydney/NIN',
  xmltv_id: 'Channel9Sydney.au'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.foxtel.com.au/tv-guide/channel/Channel-9-Sydney/NIN/2022/11/08'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Accept-Language': 'en-US,en;',
    Cookie: 'AAMC_foxtel_0=REGION|7'
  })
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

  let results = await parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-07T12:40:00.000Z',
    stop: '2022-11-07T13:30:00.000Z',
    title: 'The Equalizer',
    sub_title: 'Glory',
    description:
      "While Danny chaperones Grace's winter formal, terrorists seize the venue and hold everyone hostage in order to kidnap a diplomat's son.",
    image:
      'https://images1.resources.foxtel.com.au/store2/mount1/16/3/69e0v.jpg?maxheight=90&limit=91aa1c7a2c485aeeba0706941f79f111adb35830',
    rating: {
      system: 'ACB',
      value: 'M'
    },
    season: 1,
    episode: 2
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no-content.html'))
  })
  expect(result).toMatchObject([])
})
