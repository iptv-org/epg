const { parser, url } = require('./teliatv.ee.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  lang: 'et',
  site_id: 'et#1',
  xmltv_id: 'ETV.ee'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://api.teliatv.ee/dtv-api/3.2/et/epg/guide?channelIds=1&relations=programmes&images=webGuideItemLarge&startAt=2021-11-21T00:00&startAtOp=lte&endAt=2021-11-20T00:00&endAtOp=gt'
  )
})

it('can generate valid url with different language', () => {
  const ruChannel = {
    lang: 'ru',
    site_id: 'ru#1',
    xmltv_id: 'ETV.ee'
  }
  expect(url({ date, channel: ruChannel })).toBe(
    'https://api.teliatv.ee/dtv-api/3.2/ru/epg/guide?channelIds=1&relations=programmes&images=webGuideItemLarge&startAt=2021-11-21T00:00&startAtOp=lte&endAt=2021-11-20T00:00&endAtOp=gt'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-19T22:05:00.000Z',
      stop: '2021-11-19T22:55:00.000Z',
      title: 'Inimjaht',
      image:
        'https://inet-static.mw.elion.ee/resized/ri93Qj4OLXXvg7QAsUOcKMnIb3g=/570x330/filters:format(jpeg)/inet-static.mw.elion.ee/epg_images/9/b/17e48b3966e65c02.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
