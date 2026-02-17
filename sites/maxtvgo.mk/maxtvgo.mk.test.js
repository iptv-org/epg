const { parser, url } = require('./maxtvgo.mk.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '105',
  xmltv_id: 'MRT1.mk'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://prd-static-mkt.spectar.tv/rev-1636968171/client_api.php/epg/list/instance_id/1/language/mk/channel_id/105/start/20211117000000/stop/20211118000000/include_current/true/format/json'
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
      start: '2021-11-16T22:10:00.000Z',
      stop: '2021-11-17T00:00:00.000Z',
      title: 'Палмето - игран филм',
      category: 'Останато',
      description:
        'Екстремниот рибар, Џереми Вејд, е во потрага по слатководни риби кои јадат човечко месо. Со форензички методи, Џереми им илустрира на гледачите како овие нови чудовишта се создадени да убиваат.',
      image:
        'https://prd-static-mkt.spectar.tv/rev-1636968170/image_transform.php/transform/1/epg_program_id/21949063/instance_id/1'
    }
  ])
})

it('can parse response with no description', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content_no_description.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-16T22:10:00.000Z',
      stop: '2021-11-17T00:00:00.000Z',
      title: 'Палмето - игран филм',
      category: 'Останато',
      description: null,
      image:
        'https://prd-static-mkt.spectar.tv/rev-1636968170/image_transform.php/transform/1/epg_program_id/21949063/instance_id/1'
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
