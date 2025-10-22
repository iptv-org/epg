const { parser, url } = require('./skyperfectv.co.jp.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-08-01', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'basic_BS193',
  name: 'ＷＯＷＯＷシネマ',
  xmltv_id: 'WOWOWCinema.jp'
}

const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe(
    'https://www.skyperfectv.co.jp/program/schedule/basic/channel:BS193/date:240801'
  )
})

it('can parse response', async () => {
  const result = (await parser({ date, channel, content })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result.filter(p => p.title == 'ヴァルキリードライヴマーメイド #06')).toMatchObject([
    {
      start: '2024-07-31T19:00:00.000Z', // UTC time
      stop: '2024-07-31T19:30:00.000Z', // UTC
      title: 'ヴァルキリードライヴマーメイド #06',
      image:
        'https://pm-img-ap.skyperfectv.co.jp/uploads/thumbnail/image/11301805/S_BC929697780313_be7975d4e26a4cad9b89fc6c94807e38_20240613144158569.jpg'
    }
  ])
})

const empty = fs.readFileSync(path.resolve(__dirname, '__data__/empty.html'))

it('can handle empty guide', async () => {
  const result = parser({
    date,
    channel,
    content: empty
  })
  expect(result).toMatchObject([])
})
