const { parser, url, request } = require('./nowplayer.now.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const channel = {
  lang: 'zh',
  site_id: '096',
  xmltv_id: 'ViuTVsix.hk'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ channel, date })).toBe(
    'https://nowplayer.now.com/tvguide/epglist?channelIdList[]=096&day=1'
  )
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date })).toBe(
    'https://nowplayer.now.com/tvguide/epglist?channelIdList[]=096&day=2'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers({ channel })).toMatchObject({
    Cookie: 'LANG=zh; Expires=null; Path=/; Domain=nowplayer.now.com'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-23T18:00:00.000Z',
      stop: '2021-11-24T01:00:00.000Z',
      title: 'ViuTVsix Station Closing'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[[]]'
  })
  expect(result).toMatchObject([])
})
