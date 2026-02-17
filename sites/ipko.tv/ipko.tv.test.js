const { parser, url } = require('./ipko.tv.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-24', 'YYYY-MM-DD').startOf('day')
const channel = {
  site_id: 'ipko-promo',
  xmltv_id: 'IPKOPROMO'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe('https://stargate.ipko.tv/api/titan.tv.WebEpg/GetWebEpgData')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel })

  expect(result).toMatchObject([
    {
      title: 'IPKO Promo',
      description: 'No description available',
      start: '2024-12-24T04:00:00.000Z',
      stop: '2024-12-24T06:00:00.000Z',
      thumbnail: 'https://vimg.ipko.tv/mtcms/18/2/1/1821cc68-a9bf-4733-b1af-9a5d80163b78.jpg'
    },
    {
      title: 'IPKO Promo',
      description: 'No description available',
      start: '2024-12-24T06:00:00.000Z',
      stop: '2024-12-24T08:00:00.000Z',
      thumbnail: 'https://vimg.ipko.tv/mtcms/18/2/1/1821cc68-a9bf-4733-b1af-9a5d80163b78.jpg'
    },
    {
      title: 'IPKO Promo',
      description: 'No description available',
      start: '2024-12-24T08:00:00.000Z',
      stop: '2024-12-24T10:00:00.000Z',
      thumbnail: 'https://vimg.ipko.tv/mtcms/18/2/1/1821cc68-a9bf-4733-b1af-9a5d80163b78.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
