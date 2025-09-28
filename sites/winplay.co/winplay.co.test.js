const { parser, url, request } = require('./winplay.co.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2024-12-24', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '529cff6f6bd2ea6b610000e0',
  xmltv_id: 'WinPlusFutbol.co'
}

it('can generate valid url', () => {
  expect(url).toBe('https://next.platform.mediastre.am/graphql')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    accept: 'application/json',
    'x-client-id': 'a084524ea449c15dfe5e75636fb55ce6a9d0d7601aac946daa',
    'x-ott-language': 'es'
  })
})

it('can generate valid request data', () => {
  expect(request.data()).toMatchObject({
    operationName: 'getLivesEpg',
    variables: { page: 1, hours: 48 },
    query:
      'query getLivesEpg($page: Int = 1, $hours: Int, $ids: [String]) {\n getLives(ids: $ids) {\n _id\n logo\n name\n schedules(hours: $hours, page: {limit: 0, page: $page}) {\n _id\n name\n date_start\n date_end\n current\n match {\n matchDay\n __typename\n }\n show {\n _id\n title\n __typename\n }\n live {\n _id\n dvr\n type\n purchased\n __typename\n }\n __typename\n }\n __typename\n }\n}\n'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')

  const results = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2024-12-24T00:30:00.000Z',
    stop: '2024-12-24T02:30:00.000Z',
    title: 'Los Disruptivos de Win'
  })

  expect(results[1]).toMatchObject({
    start: '2024-12-24T02:30:00.000Z',
    stop: '2024-12-24T03:30:00.000Z',
    title: 'WIn Noticias'
  })
})

it('can handle empty guide', () => {
  const content = '{"status":"ERROR","error":"UNAUTHORIZED_REQUEST"}'
  const results = parser({ content, channel, date })

  expect(results).toMatchObject([])
})
