const { parser, url, request } = require('./epg.telemach.ba.config.js')
const fs = require('fs')
const axios = require('axios')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

axios.post.mockImplementation((url, data, opts) => {
  if (
    url === 'https://api-web.ug-be.cdn.united.cloud/oauth/token?grant_type=client_credentials' &&
    JSON.stringify(opts.headers) ===
      JSON.stringify({
        Authorization:
          'Basic MjdlMTFmNWUtODhlMi00OGU0LWJkNDItOGUxNWFiYmM2NmY1OjEyejJzMXJ3bXdhZmsxMGNkdzl0cjloOWFjYjZwdjJoZDhscXZ0aGc='
      })
  ) {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/session.json')))
    })
  } else {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/no_session.json')))
    })
  }
})

const date = dayjs.utc('2025-01-20', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1607',
  xmltv_id: 'N1HD.hr'
}

it('can generate valid url', async () => {
  const result = url({ date, channel, country: 'ba' })

  expect(result).toBe(
    'https://api-web.ug-be.cdn.united.cloud/v1/public/events/epg?fromTime=2025-01-20T00:00:00-00:00&toTime=2025-01-20T23:59:59-00:00&communityId=12&languageId=59&cid=1607'
  )
})

it('can generate valid request headers', async () => {
  const result = await request.headers()

  expect(result).toMatchObject({
    Authorization:
      'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsidWMtaW5mby1zZXJ2aWNlIl0sInNjb3BlIjpbInJlYWQiXSwiZXhwIjoxNzM3Mzc3NDUxLCJhdXRob3JpdGllcyI6WyJST0xFX1BVQkxJQ19FUEciXSwianRpIjoiUVBubHdRSDczS1EwSnU0WDZwRTc2Zm5mUmRnIiwiY2xpZW50X2lkIjoiMjdlMTFmNWUtODhlMi00OGU0LWJkNDItOGUxNWFiYmM2NmY1In0.LqJAZUWEqIOcLrRSMpxZxnF-f1arKbHgfweLMXt-MBjCDbVJD39OQEsh_b68mtePAoa3n8LRbf3IFT40Ys5Vbe-k_Btm4a9gdEGr6cNi_4HGk4Bto6RUDvCp59VRfoRZhWe145Q2b5TS6szmC4Ws2YWIcZU5vrJcYs2GZiCk6U11MOcd1i52WmZj8cLPq0ZPDB_bzmTgYkvkVa7zOzUOPSl4M8T6fPUa__vVKUt0jOgtFoHeue2mQVgISC2puEGsBN0jJwvJ8PzM6IVxXrQno3MBv0VJy_qILiFPcxRePGRAmKLuEqagvikO7P_XQgFjZgg-j8u8wX2WwO0Yxft0Pg'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  let results = parser({ content })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(35)
  expect(results[0]).toMatchObject({
    start: '2025-01-20T00:00:00.000Z',
    stop: '2025-01-20T00:30:00.000Z',
    title: 'DW Euromaxx',
    description:
      'Euromaxx je lifestyle Europe magazine, koji nam donosi zanimljivosti iz evropskih gradova, priče o načinu života ljudi i upoznaje nas sa njihovim kulturama.',
    image:
      'https://images-web.ug-be.cdn.united.cloud/2021/02/18/06/05/21/stb_xl_cd4f72e01d308ecce782e29b69af7de6707b9e85.jpg',
    season: null,
    episode: null
  })
  expect(results[34]).toMatchObject({
    start: '2025-01-20T23:50:00.000Z',
    stop: '2025-01-21T00:00:00.000Z',
    title: 'DW Shift',
    description: 'Tjedni magazin koji nam donosi najnovije vijesti vezane za Internet.',
    image:
      'https://images-web.ug-be.cdn.united.cloud/2023/06/09/13/07/53/stb_xl_0849d5d70c1337651b85b6335e340e15bd5d6a73_340fc454bc73019d052cf936ebee5da3.jpg',
    season: null,
    episode: null
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'), 'utf8')
  })

  expect(results).toMatchObject([])
})
