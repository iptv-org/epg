const { parser, url, request } = require('./meo.pt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const axios = require('axios')

jest.mock('axios')

const date = dayjs.utc('2022-12-02', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'RTPM',
  xmltv_id: 'RTPMadeira.pt'
}

it('can generate valid url', () => {
  expect(url).toBe(
    'https://authservice.apps.meo.pt/Services/GridTv/GridTvMng.svc/getProgramsFromChannels'
  )
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    Origin: 'https://www.meo.pt'
  })
})

it('can generate valid request method', () => {
  expect(request.data({ channel, date })).toMatchObject({
    service: 'channelsguide',
    channels: ['RTPM'],
    dateStart: '2022-12-02T00:00:00-00:00',
    dateEnd: '2022-12-03T00:00:00-00:00',
    accountID: ''
  })
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  axios.post.mockResolvedValue({ data: {} })

  let results = await parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-12-01T23:35:00.000Z',
    stop: '2022-12-02T00:17:00.000Z',
    title: 'Walker, O Ranger Do Texas T6 - Ep. 14'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})
