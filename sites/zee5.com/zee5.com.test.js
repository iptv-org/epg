const { parser, url, channels } = require('./zee5.com.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

jest.mock('axios')

const date = dayjs.tz('2025-12-02', 'Asia/Kolkata').startOf('d')
const channel = { site_id: '0-9-zeecinema', xmltv_id: 'ZeeCinema.in' }

it('can generate valid url', () => {
  const result = url({ channel, date })
  expect(result).toMatch('https://gwapi.zee5.com/v1/epg')
  expect(result).toMatch('channels=0-9-zeecinema')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const result = parser({ content })

  expect(result.length).toBe(9)
  expect(result[0]).toMatchObject(
    {
      title: 'Tamilarasan',
      description: 'An officer seizes control of a hospital, defying orders, which sparks a fierce conflict. His rebellion sets off a chain of events that could lead to a dramatic clash with authorities.',
      start: dayjs('2026-04-25T20:03:00Z'),
      stop: dayjs('2026-04-25T22:03:00Z'),
      image: 'https://akamaividz2.zee5.com/image/upload/resources/0-10-CHN-007790000-20260426013300/list/ZeeCinemaHDTamilarasan1567745cf08a3ba1a9946d890a2f523ab71f38e.jpg',
      category: ['Film'],
      lang: ['hi']
    }
  )
})

it('can handle empty guide', () => {
  const result = parser({ content: '[]' })
  expect(result).toMatchObject([])
})

it('can parse channel list', async () => {
  axios.get.mockResolvedValue({
    data: {
      items: [
        {
          id: '0-9-channel_1643519345',
          title: 'Zing USA',
          list_image: '1920x1080listclean721faf534a79451fa714b25d2102de48.png'
        }
      ]
    }
  })

  const result = await channels()
  expect(result.length).toBe(1)
  expect(result[0]).toMatchObject({
    lang: 'en',
    site_id: '0-9-channel_1643519345',
    name: 'Zing USA',
    logo: 'https://akamaividz2.zee5.com/image/upload/resources/0-9-channel_1643519345/channel_list/1920x1080listclean721faf534a79451fa714b25d2102de48.png'
  })
})
