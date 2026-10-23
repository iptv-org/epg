const { parser, url, request } = require('./ontvtonight.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const AwsWaf = require('@ntlab/awswaf')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-25', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'au#1692/7two',
  xmltv_id: '7two.au'
}

jest.mock('axios')
jest.mock('@ntlab/awswaf')

axios.head.mockImplementation(() => Promise.resolve({}))

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://www.ontvtonight.com/au/guide/listings/channel/1692/7two.html?dt=2021-11-25'
  )
})

it('can generate valid request headers', async () => {
  expect(await request.headers({ channel, date })).toMatchObject({
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
  })
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-24T13:10:00.000Z',
      stop: '2021-11-24T13:50:00.000Z',
      title: 'What A Carry On'
    },
    {
      start: '2021-11-24T13:50:00.000Z',
      stop: '2021-11-25T11:50:00.000Z',
      title: 'Bones',
      description: 'The Devil In The Details'
    },
    {
      start: '2021-11-25T11:50:00.000Z',
      stop: '2021-11-25T12:50:00.000Z',
      title: 'Inspector Morse: The Remorseful Day'
    }
  ])
})

it('can parse nested title and description markup', () => {
  const content = `
    <table>
      <tbody>
        <tr>
          <td><h5>8:30 pm</h5></td>
          <td>
            <div>
              <h5><a href="#">The Princess Diaries</a></h5>
            </div>
            <h6>Movie description</h6>
          </td>
        </tr>
      </tbody>
    </table>
  `

  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'The Princess Diaries',
      description: 'Movie description'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})

it('waits for a WAF token being fetched by another request', async () => {
  let release
  AwsWaf.mockImplementation(() => ({
    getToken: () => new Promise(resolve => (release = () => resolve('token')))
  }))
  const waf = new axios.AxiosError()
  waf.status = 405
  waf.response = {
    data: '<script src="https://example.token.awswaf.com/example/challenge.js"></script>'
  }
  axios.head.mockImplementationOnce(() => Promise.reject(waf))
  axios.get.mockImplementationOnce(() => Promise.reject(waf))
  const tick = () => new Promise(resolve => setTimeout(resolve))

  const first = request.headers({ channel, date })
  await tick()
  const second = request.headers({ channel, date })
  await tick()
  release()

  const headers = await Promise.all([first, second])
  headers.forEach(h => expect(h.cookie).toContain('aws-waf-token=token'))
})
