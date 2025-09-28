const { parser, url, request } = require('./siba.com.co.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '395',
  xmltv_id: 'CanalClaro.cl'
}

it('can generate valid url', () => {
  expect(url).toBe('http://devportal.siba.com.co/index.php?action=grilla')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ channel, date })
  expect(result.has('servicio')).toBe(true)
  expect(result.has('ini')).toBe(true)
  expect(result.has('end')).toBe(true)
  expect(result.has('chn')).toBe(true)
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-11T00:00:00.000Z',
      stop: '2021-11-11T01:00:00.000Z',
      title: 'Worst Cooks In America'
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
