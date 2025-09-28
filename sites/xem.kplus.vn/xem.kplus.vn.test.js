const { parser, url, request } = require('./xem.kplus.vn.config.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

axios.post.mockImplementation(url => {
  if (url === 'https://tvapi-sgn.solocoo.tv/v1/session') {
    return Promise.resolve({
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/session.json')))
    })
  } else {
    return Promise.resolve({
      data: {}
    })
  }
})

const date = dayjs.utc('2025-01-18', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'F31WvdXdwYNOInUaTeIC-ixsLQVsrSNgUczDSFCN',
  xmltv_id: 'KPlusKids.vn'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tvapi-sgn.solocoo.tv/v1/assets?query=schedule,forrelated,F31WvdXdwYNOInUaTeIC-ixsLQVsrSNgUczDSFCN&from=2025-01-18T00:00:00Z&limit=1000'
  )
})

it('can generate valid request headers', async () => {
  expect(await request.headers()).toMatchObject({
    authorization:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0di5zb2xvY29vLmF1dGgiOnsicyI6Inc0MDhhMGViMC1kNTBmLTExZWYtYWZmYS1hZjk3NzViODM4YWQiLCJ1IjoiQW8yZXd1S3o3M2tjX2UtOFZmWGVnZyIsImwiOiJlbl9VUyIsImQiOiJQQyIsImRtIjoiQ2hyb21lIiwib20iOiJPIiwiYyI6ImJ6bXZPVEFOM05qdzZadjYtYnZveThwbnMwNHBtbTdxeG9QOUVwaVNQVzAiLCJzdCI6ImZ1bGwiLCJnIjoiZXlKaWNpSTZJblp6ZEhZaUxDSjFjQ0k2SW1Od2FTSXNJbkIwSWpwbVlXeHpaU3dpWkdVaU9pSmljbUZ1WkUxaGNIQnBibWNpTENKa1lpSTZabUZzYzJWOSIsImYiOjYsImIiOiJ2c3R2In0sIm5iZiI6MTczNzE0NTk1NCwiZXhwIjoxNzM3MTYzNzg0LCJpYXQiOjE3MzcxNDU5NTQsImF1ZCI6ImNwaSJ9.25av5gdR38FW0SmnzNiE4EV1D4Gozox2Wgvoh7QKZaM'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  let results = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(100)
  expect(results[0]).toMatchObject({
    start: '2025-01-18T00:03:00.000Z',
    stop: '2025-01-18T00:10:00.000Z',
    title: 'Masha and the Bear S1, Ep01',
    categories: ['Children'],
    images: [
      'https://img.kplus.vn/images?filename=Media/HDVN/2021_11/KID_CAR_21__2660472_0a13b965-0b37-4552-99d5-a5998ca20156.jpg&orientation=landscape&w=460&h=260'
    ]
  })
  expect(results[99]).toMatchObject({
    start: '2025-01-18T20:59:00.000Z',
    stop: '2025-01-18T21:28:00.000Z',
    title: 'KID SHOW: BUG SHAPE BOOKMARK - WOODEATER PAPERWEIGHT',
    categories: ['Children'],
    images: [
      'https://img.kplus.vn/images?filename=Media/HDVN/2012_02/KID_EDU_HNCP__VN_20200_9d92b5d2-02da-49ac-969e-4b20aad8ccec.jpg&orientation=landscape&w=460&h=260'
    ]
  })
})

it('can handle empty guide', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  const result = parser({ content, channel, date })
  expect(result).toMatchObject([])
})
