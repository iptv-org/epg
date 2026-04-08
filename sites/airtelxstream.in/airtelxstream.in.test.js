const { parser, url, channels } = require('./airtelxstream.in.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)
const axios = require('axios')

jest.mock('axios')

// Date used for URL generation test
const date = dayjs.utc('2025-12-28', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'LIVETV_LIVETVCHANNEL_ZEE_CINEMA' }

it('can generate valid url', () => {
  const startTime = date.valueOf()
  const endTime = date.add(1, 'day').valueOf()
  
  expect(url({ channel, date })).toBe(
    `https://epg.airtel.tv/app/v2/content/channel/epg?channelId=LIVETV_LIVETVCHANNEL_ZEE_CINEMA&startTime=${startTime}&endTime=${endTime}`
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  
  const results = parser({ content })

  expect(results.length).toBeGreaterThan(0)
  
  expect(results[0]).toMatchObject({
    title: 'Bengal Tiger',
    description: "Starring: Ravi Teja,Tamannaah Bhatia. Simple man Akash loves politician Gajapathi's daughter, Meera. When Gajapathi discovers Akash's father's identity, suspicions arise about past vendettas.",
    start: dayjs(1766868120000), 
    stop: dayjs(1766875380000),
    image: 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/PROGRAM/LIVETV_PROGRAM_ZEE_CINEMA_1006193_28DEC021200_28DEC041300/images/LANDSCAPE_169_HD/ZEECINEMA_BengalTiger_1006193.jpg',
    category: [] 
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '{"programGuide": {}}' })
  expect(results).toMatchObject([])
})

it('can parse channel list', async () => {
  axios.get.mockResolvedValue({
    data: {
      data: [
        {
          id: 'STREAM_ID_123',
          epgChannelId: 'EPG_ID_ZEE',
          title: 'Zee Cinema',
          images: {
            LOGO_HD: 'http://logo.png'
          }
        },
        // Duplicate stream for same channel (should be removed by map)
        {
          id: 'STREAM_ID_456',
          epgChannelId: 'EPG_ID_ZEE',
          title: 'Zee Cinema Duplicate', 
          images: {}
        }
      ]
    }
  })

  const results = await channels()

  expect(results.length).toBe(1) // Should deduplicate based on epgChannelId

  expect(results[0]).toMatchObject({
    lang: 'en',
    site_id: 'EPG_ID_ZEE', // Should prefer epgChannelId over id
    name: 'Zee Cinema'
    //logo: 'http://logo.png' // Logo is commented out in your config, so we don't expect it here
  })
})