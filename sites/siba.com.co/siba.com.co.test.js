// npx epg-grabber --config=sites/siba.com.co/siba.com.co.config.js --channels=sites/siba.com.co/siba.com.co.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./siba.com.co.config.js')
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
const content = `{"list":[{"id":"395","nom":"CANAL CLARO","num":"102","logo":"7c4b9e8566a6e867d1db4c7ce845f1f4.jpg","cat":"Exclusivos Claro","prog":[{"id":"665724465","nom":"Worst Cooks In America","ini":1636588800,"fin":1636592400}]}],"error":null}`

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
    content: `{"list":[],"error":null}`
  })
  expect(result).toMatchObject([])
})
