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

// Note: This corresponds to approx Dec 15, 2025
const date = dayjs(1765784623000)

const channel = { site_id: 'LIVETV_LIVETVCHANNEL_COLORS_MARATHI_HD' }

it('can generate valid url', () => {
  const startTime = date.valueOf()
  // The config adds 1 day (24 hours), so we calculate that expectation here
  const endTime = date.add(1, 'day').valueOf()
  
  expect(url({ channel, date })).toBe(
    `https://livetv.airtel.tv/v1/epg?channelId=LIVETV_LIVETVCHANNEL_COLORS_MARATHI_HD&appId=WEB&startTime=${startTime}&endTime=${endTime}&dt=&bn=&os=`
  )
})

it('can parse response', () => {
  
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  
  const results = parser({ content })

  expect(results.length).toBeGreaterThan(0)
  
  expect(results[0]).toMatchObject({
    title: 'Aai Tuljabhavani',
    description: 'Aai Tuljabhavani represents Parvati\'s watchfulness and fierce dedication to safeguarding her followers, showcasing the bond between a deity and her devoted believers.',
    start: dayjs(1765783800000), // Matches startTime in JSON
    stop: dayjs(1765785600000),  // Matches endTime in JSON
    image: 'https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/PROGRAM/LIVETV_PROGRAM_COLORS_MARATHI_HD_1724623_15DEC130000_15DEC133000/images/LANDSCAPE_169_HD/ColorsMarathiHD_AaiTuljabhavani_1724623.jpg',
    category: ['Entertainment']
  })
})

it('can handle empty guide', () => {
  const results = parser({ content: '{"data":[]}' })
  expect(results).toMatchObject([])
})

it('can parse channel list', async () => {
  axios.get.mockResolvedValue({
    data: {
      data: [
        {
          id: 'LIVETV_LIVETVCHANNEL_COLORS_MARATHI_HD',
          title: 'Colors Marathi HD',
          images: {
            LOGO_HD: 'http://logo.png'
          }
        }
      ]
    }
  })

  const results = await channels()

  expect(results[0]).toMatchObject({
    lang: 'en',
    site_id: 'LIVETV_LIVETVCHANNEL_COLORS_MARATHI_HD',
    name: 'Colors Marathi HD',
    logo: 'http://logo.png'
  })
})