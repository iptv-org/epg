// npx epg-grabber --config=sites/programme.tvb.com/programme.tvb.com.config.js --channels=sites/programme.tvb.com/programme.tvb.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./programme.tvb.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-11-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'B',
  xmltv_id: 'J2.hk'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://programme.tvb.com/ajax.php?action=channellist&code=B&date=2022-11-15'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-11-14T22:00:00.000Z',
    stop: '2022-11-14T23:00:00.000Z',
    title: '想見你#3[粵/普][PG]',
    description:
      '韻如因父母離婚都不要自己而跑出家門，遇到子維，兩人互吐心事。雨萱順著照片上的唱片行線索，找到一家同名咖啡店，從文磊處得知照片中人是已經過世的韻如，從而推測那個男生也不是詮勝，但她內心反而更加痛苦。'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no-content.html')),
    date
  })
  expect(result).toMatchObject([])
})
