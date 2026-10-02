const { url, parser } = require('./www3.nhk.or.jp.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2025-10-20', 'YYYY-MM-DD').startOf('d')

const channel = {
  site_id: '0',
  xmltv_id: 'NHKWorldJapan.jp',
  lang: 'en',
  logo: 'https://www3.nhk.or.jp/nhkworld/common/site_images/nw_webapp_1024x1024.png'
}

const content = fs.readFileSync(path.resolve(__dirname, '__data__/schedule.json'), 'utf8')

const context = { channel: channel, content: content, date: date }

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://masterpl.hls.nhkworld.jp/epg/w/20251020.json'
  )
})

it('can handle empty guide', async () => {
  const results = await parser({ content: '' })
  expect(results).toMatchObject([])
})

it('can parse response', async () => {
  const results = await parser(context)

  expect(results[0]).toMatchObject(
    {
      title: 'NHK NEWSLINE',
      sub_title: '',
      start: dayjs('2025-10-19T15:00:00.000Z'),
      stop: dayjs('2025-10-19T15:10:00.000Z'),
      description: 'NHK NEWSLINE brings you up to date with the latest from Japan, Asia and around the world. Our team covers breaking news and major developments, with trusted anchors to tie it all together.',
      image: '',
    }
  )

  expect(results[1]).toMatchObject(
    {
      title: 'J-MELO',
      sub_title: 'Furui Riho and shallm',
      start: dayjs('2025-10-19T15:10:00.000Z'),
      stop: dayjs('2025-10-19T15:38:00.000Z'),
      description: '*This program was first broadcast on April 13, 2025. \nJoin May J. for Japanese music! This week: Furui Riho (a singer-songwriter with gospel roots) and shallm (a band project from vocalist, lyricist, and composer lia).\nOn Demand until October 26, 2025',
      image: 'https://www3.nhk.or.jp/nhkworld/en/shows/2004445/images/wide_l_7eJOqZrlZQFF8GEPfH0emqOOlggwyC543Cv71Oou.jpg',
    }
  )

  expect(results[2]).toMatchObject(
    {
      title: 'INFO',
      sub_title: '',
      start: dayjs('2025-10-19T15:38:00.000Z'),
      stop: dayjs('2025-10-19T15:40:00.000Z'),
      description: ' ',
      image: '',
    }
  )
})
