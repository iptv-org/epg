const { parser, url } = require('./nzxmltv.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-21').startOf('d')
const channel = {
  site_id: 'xmltv/guide#1',
  xmltv_id: 'TVNZ1.nz'
}

it('can generate valid url', () => {
  expect(url({ channel })).toBe('https://nzxmltv.com/xmltv/guide.xml')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml'))
  const results = parser({ content, channel, date })

  expect(results[0]).toMatchObject({
    start: '2023-11-21T10:30:00.000Z',
    stop: '2023-11-21T11:25:00.000Z',
    title: 'Sunday',
    description:
      'On Sunday, an unmissable show with stories about divorce, weight loss, and the incomprehensible devastation of Gaza.',
    season: 2023,
    episode: 37,
    icon: 'https://www.thetvdb.com/banners/posters/5dbebff2986f2.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})
