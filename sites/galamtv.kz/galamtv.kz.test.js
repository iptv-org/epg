const { parser, url } = require('./galamtv.kz.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '636e54cf8a8f73bae8244f41',
  xmltv_id: 'Qazaqstan.kz'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    `https://galam.server-api.lfstrm.tv/channels/${
      channel.site_id
    }/programs?period=${date.unix()}:${date.add(1, 'day').unix()}`
  )
})

it('can parse response', () => {
  const content = JSON.stringify({
    programs: [
      {
        metaInfo: {
          title: 'Гимн',
          description: 'Государственный гимн Республики Казахстан'
        },
        scheduleInfo: {
          start: 1736470800,
          end: 1736471100
        },
        mediaInfo: {
          thumbnails: [
            {
              url: 'http://galam.server-img.lfstrm.tv:80/image/aHR0cDovL2dhbGFtLmltZy1vcmlnaW5hbHMubGZzdHJtLnR2OjgwL3R2aW1hZ2VzL3RodW1iL2YyNWFmYWY2ZDkzYjU5YjdkMjBiZDNiODhiZjg4NWI0X29yaWcuanBn'
            }
          ]
        }
      }
    ]
  })

  const result = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2025-01-10T01:00:00.000Z',
      stop: '2025-01-10T01:05:00.000Z',
      title: 'Гимн',
      description: 'Государственный гимн Республики Казахстан',
      image:
        'http://galam.server-img.lfstrm.tv:80/image/aHR0cDovL2dhbGFtLmltZy1vcmlnaW5hbHMubGZzdHJtLnR2OjgwL3R2aW1hZ2VzL3RodW1iL2YyNWFmYWY2ZDkzYjU5YjdkMjBiZDNiODhiZjg4NWI0X29yaWcuanBn'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '{"programs":[]}'
  })
  expect(result).toMatchObject([])
})
