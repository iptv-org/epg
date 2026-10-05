const { parser, url, request } = require('./vrt.be.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

jest.mock('axios')

const channelsContent = fs.readFileSync(path.resolve(__dirname, '__data__/channels.json'), 'utf8')
axios.post.mockResolvedValue({ data: JSON.parse(channelsContent) })

const date = dayjs.utc('2026-03-09').startOf('d')
const channel = {
  lang: 'nl',
  site_id: 'vrt1'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.vrt.be/vrtnu-api/graphql/public/v1')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({ 'content-type': 'application/json', 'x-vrt-client-name': 'WEB' })
})

it('can generate valid request data', () => {
  const data = request.data({ channel, date })
  expect(data.variables).toMatchObject({
    pageId: '/vrtmax/tv-gids/vrt1/2026-03-09/'
  })
  expect(typeof data.query).toBe('string')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result[0]).toMatchObject({
    title: 'Mr. Magoo',
    description: 'Rondleiding door de stad',
    image: 'https://images.vrt.be/orig/2024/12/07/7c0854d3-67e3-4271-9e4f-43ca80b63c87.jpg',
    start: '2026-03-09T05:00:08.000Z',
    stop: '2026-03-09T05:07:43.760Z'
  })

  const last = result[result.length - 1]
  expect(last.title).toBe('Het weer')
  expect(last.start).toBe('2026-03-10T00:37:00.120Z')
  expect(last.stop).toBe('2026-03-10T00:40:00.120Z')
})

it('can parse cursor with any channel prefix', () => {
  const content = JSON.stringify({
    data: {
      page: {
        previous: { paginatedItems: { edges: [] } },
        next: {
          paginatedItems: {
            edges: [
              {
                cursor: 'epg#1H#2026-03-16T11:00:00.000Z',
                node: { title: 'Test', description: null, indexMeta: [], progress: null, status: { text: { small: '30 min' } }, image: null, action: null }
              },
              {
                cursor: 'epg#1H#2026-03-16T11:30:00.000Z',
                node: { title: 'Test 2', description: null, indexMeta: [], progress: null, status: null, image: null, action: null }
              }
            ]
          }
        }
      }
    }
  })
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(result[0]).toMatchObject({
    title: 'Test',
    start: '2026-03-16T11:00:00.000Z',
    stop: '2026-03-16T11:30:00.000Z'
  })
})

it('can handle empty guide', () => {
  const result = parser({ content: '', channel, date })
  expect(result).toMatchObject([])
})

it('can load channels', async () => {
  const result = await require('./vrt.be.config.js').channels()
  expect(result[0]).toMatchObject({
    lang: 'nl',
    site_id: 'vrt1',
    name: 'VRT 1'
  })
  expect(result.length).toBe(10)
})
