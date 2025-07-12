const { parser, url } = require('./tvcubana.icrt.cu.config.js')
const dayjs = require('dayjs')
const fs = require('fs')
const path = require('path')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-22', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'cv',
  xmltv_id: 'CubavisionNacional.cu'
}
let content = fs.readFileSync(path.resolve(__dirname, './__data__/content.json'), {encoding: 'utf8'})
// in the specific case of this site, the unicode escape sequences are double-escaped
content = content.replace(/\\\\u([0-9a-fA-F]{4})/g, '\\u$1')

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.tvcubana.icrt.cu/cartv/cv/lunes.php')
})

it('can generate valid url for next day', () => {
  expect(url({ channel, date: date.add(2, 'd') })).toBe(
    'https://www.tvcubana.icrt.cu/cartv/cv/miercoles.php'
  )
})

it('can parse response', () => {
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result).toMatchObject([
    {
      start: '2021-11-22T05:40:00.000Z',
      stop: '2021-11-22T05:50:00.000Z',
      title: 'CARIBE NOTICIAS',
      description: 'EMISIÓN DE CIERRE.'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, './__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
