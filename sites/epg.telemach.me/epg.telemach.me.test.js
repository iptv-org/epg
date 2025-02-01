const { parser, url, request } = require('./epg.telemach.me.config.js')
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
  site_id: '92',
  xmltv_id: 'PinkKids.rs'
}

it('can generate valid url', async () => {
  const result = url({ date, channel })

  expect(result).toBe(
    'https://api-web.ug-be.cdn.united.cloud/v1/public/events/epg?fromTime=2025-01-20T00:00:00-00:00&toTime=2025-01-20T23:59:59-00:00&communityId=5&languageId=10001&cid=92'
  )
})

it('can generate valid request headers', async () => {
  const result = await request.headers()

  expect(result).toMatchObject({
    Authorization:
      'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsidWMtaW5mby1zZXJ2aWNlIl0sInNjb3BlIjpbInJlYWQiXSwiZXhwIjoxNzM3Mzc3NDUxLCJhdXRob3JpdGllcyI6WyJST0xFX1BVQkxJQ19FUEciXSwianRpIjoiUVBubHdRSDczS1EwSnU0WDZwRTc2Zm5mUmRnIiwiY2xpZW50X2lkIjoiMjdlMTFmNWUtODhlMi00OGU0LWJkNDItOGUxNWFiYmM2NmY1In0.LqJAZUWEqIOcLrRSMpxZxnF-f1arKbHgfweLMXt-MBjCDbVJD39OQEsh_b68mtePAoa3n8LRbf3IFT40Ys5Vbe-k_Btm4a9gdEGr6cNi_4HGk4Bto6RUDvCp59VRfoRZhWe145Q2b5TS6szmC4Ws2YWIcZU5vrJcYs2GZiCk6U11MOcd1i52WmZj8cLPq0ZPDB_bzmTgYkvkVa7zOzUOPSl4M8T6fPUa__vVKUt0jOgtFoHeue2mQVgISC2puEGsBN0jJwvJ8PzM6IVxXrQno3MBv0VJy_qILiFPcxRePGRAmKLuEqagvikO7P_XQgFjZgg-j8u8wX2WwO0Yxft0Pg',
    Referer: 'https://epg.telemach.me/'
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

  expect(results.length).toBe(55)
  expect(results[0]).toMatchObject({
    start: '2025-01-19T23:20:00.000Z',
    stop: '2025-01-20T00:10:00.000Z',
    title: 'Pinkove Zvezdice',
    description:
      'Četvrta sezona najgledanijeg dečijeg muzičkog takmičenja, "Pinkove zvezdice" došlo do promena, pa će tako gledaoci imati priliku da najtalentovaniju decu gledaju na novoj, spektakularnoj sceni. Nova...',
    image:
      'https://images-web.ug-be.cdn.united.cloud/2023/06/22/11/19/19/stb_xl_115752ec1e05872b86ceda7726d347f533e17f43_340fc454bc73019d052cf936ebee5da3.jpg',
    season: null,
    episode: null
  })
  expect(results[54]).toMatchObject({
    start: '2025-01-20T23:50:00.000Z',
    stop: '2025-01-21T00:10:00.000Z',
    title: 'Hajdi',
    description:
      'Život nekada nije jednostavan. To najbolje zna Hajdi. Nakon što je ostala siroče, njena tetka je odvodi visoko u Alpe kod njenog dede. Ona uz nove prijatelje i dedu uskoro zavoli svoj novi život. Ipak...',
    image:
      'https://images-web.ug-be.cdn.united.cloud/2024/05/10/14/49/09/stb_xl_7d1c73ee4df7de5c4157e9daccae098d50ee853d_99230e7f5bdc95451f37aa31f8425b4d.jpg',
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
