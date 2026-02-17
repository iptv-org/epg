const { parser, url } = require('./melita.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-04-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '4d40a9f9-12fd-4f03-8072-61c637ff6995',
  xmltv_id: 'TVM.mt'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://androme.melitacable.com/api/epg/v1/schedule/channel/4d40a9f9-12fd-4f03-8072-61c637ff6995/from/2022-04-20T00:00+00:00/until/2022-04-21T00:00+00:00'
  )
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
      start: '2022-04-20T06:25:00.000Z',
      stop: '2022-04-20T06:45:00.000Z',
      title: 'How I Met Your Mother',
      description:
        'Symphony of Illumination - Robin gets some bad news and decides to keep it to herself. Marshall decorates the house.',
      season: 7,
      episode: 12,
      image:
        'https://androme.melitacable.com/media/images/epg/bc/07/p8953134_e_h10_ad.jpg?form=epg-card-6',
      category: ['comedy']
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '{}'
  })
  expect(result).toMatchObject([])
})
