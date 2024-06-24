const { parser, url, request } = require('./web.magentatv.de.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-09', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '255',
  xmltv_id: '13thStreet.de'
}

it('can generate valid url', () => {
  expect(url).toBe('https://api.prod.sngtv.magentatv.de/EPG/JSON/PlayBillList')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', async () => {
  const headers = await request.headers()

  expect(headers).toHaveProperty('Cookie')
  expect(headers).toHaveProperty('X_CSRFTOKEN')

  expect(headers.Cookie).toMatch(/JSESSIONID=[\dA-F]+;/i)
  expect(headers.Cookie).toMatch(/CSESSIONID=[\dA-F]+;/i)
  expect(headers.Cookie).toMatch(/CSRFSESSION=[\dA-F]+;/i)
  expect(headers.Cookie).toMatch(/JSESSIONID=[\dA-F]+;/i)
  expect(headers.X_CSRFTOKEN).toMatch(/[\dA-F]/i)
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    count: -1,
    isFillProgram: 1,
    offset: 0,
    properties: [
      {
        include: 'endtime,genres,id,name,starttime,channelid,pictures,introduce',
        name: 'playbill'
      }
    ],
    type: 2,
    begintime: '20220309000000',
    channelid: '255',
    endtime: '20220310000000'
  })
})

it('can parse response', () => {
  const content =
    '{"playbilllist":[{"id":"39328203","name":"Twenty Foot Plus","introduce":"Die besten Big-Wave-Surfer werden bei ihrer Suche nach der nächsten großen Welle begleitet.","channelid":"5027","starttime":"2023-10-23 23:58:55 UTC+00:00","endtime":"2023-10-24 00:11:05 UTC+00:00","genres":"Sport","pictures":[{"rel":"image","href":"http://ngiss.t-online.de/cm1s/media/gracenote/2/4/p24832950_e_h9_aa_2023-06-22T10_12_01.jpg","imageType":"1","mimeType":"image/jpeg","resolution":["1440","1080"]}]}]}'
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2023-10-23T23:58:55.000Z',
      stop: '2023-10-24T00:11:05.000Z',
      title: 'Twenty Foot Plus',
      description:
        'Die besten Big-Wave-Surfer werden bei ihrer Suche nach der nächsten großen Welle begleitet.',
      image:
        'http://ngiss.t-online.de/cm1s/media/gracenote/2/4/p24832950_e_h9_aa_2023-06-22T10_12_01.jpg',
      category: ['Sport']
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: '{"counttotal":"0"}'
  })
  expect(result).toMatchObject([])
})
