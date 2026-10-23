const { parser, url } = require('./starhubtvplus.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  lang: 'en',
  site_id: 'd258444e-b66b-4cbe-88db-e09f31ab8a1f',
  xmltv_id: 'AXN.sg'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://waf-starhub-metadata-api-p001.ifs.vubiquity.com/v3.1/epg/schedules?locale=${languages[channel.lang]}&locale_default=${languages[channel.lang]}&device=1&in_channel_id=${channel.site_id}&gt_end=${date.unix()}&lt_start=${date.add(1, 'd').unix()}&limit=100&page=1'
  )
})

it('can parse response', async () => {
  const fs = require('fs')
  const path = require('path')
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content.json'))
  const result = (await parser({ content, date, channel })).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2024-12-03T17:25:00.000Z',
      stop: '2024-12-03T18:20:00.000Z',
      title: 'Hudson & Rex (Season 5)',
      subTitle: 'Northern Rexposure',
      description:
        "When Jesse's sister contacts him for help, he, Sarah and Rex head to Northern Ontario and find themselves in the middle of a deadly situation.",
      category: ['Drama'],
      image: [
        'https://poster.starhubgo.com/poster/ch511_hudson_rex5.jpg?w=960&h=540',
        'https://poster.starhubgo.com/poster/ch511_hudson_rex5.jpg?w=341&h=192'
      ],
      season: 5,
      episode: 15,
      rating: 'PG13'
    }
  ])
})

it('can handle empty guide', async () => {
  const result = await parser({ content: '' })
  expect(result).toMatchObject([])
})
