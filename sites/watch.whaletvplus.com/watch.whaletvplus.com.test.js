const { parser, url, channels } = require('./watch.whaletvplus.com.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const axios = require('axios')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2026-01-08', 'YYYY-MM-DD').startOf('d')

const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')

it('can generate valid url', () => {
  const channel = { site_id: '878765717599035555' }
  
  const generatedUrl = url({ channel, date })
  
  expect(generatedUrl).toBe(
    'https://rlaxx.zeasn.tv/livetv/api/device/browser/v1/epg?channelIds=878765717599035555&startTime=1767830400000&endTime=1767916800000'
  )
})

it('can parse response', async () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('auth/access')) {
      return Promise.resolve({
        data: { data: { token: 'mock_token' } }
      })
    }
    if (url.includes('epg/detail')) {
      return Promise.resolve({
        data: { data: { prgDesc: 'Test Description' } }
      })
    }
    return Promise.resolve({ data: {} })
  })

  const json = JSON.parse(content)
  const firstChannel = json.data && json.data.length > 0 ? json.data[0] : null
  const validSiteId = firstChannel ? firstChannel.chlId : '878765717599035555'

  const channel = { 
    site_id: validSiteId, 
    xmltv_id: 'Test.Channel' 
  }
  
  const result = await parser({ content, channel })

  expect(result).toBeInstanceOf(Array)
  expect(result.length).toBeGreaterThan(0)

  expect(result[0]).toMatchObject({
    title: expect.any(String),
    start: expect.any(Object),
    stop: expect.any(Object)
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    content: '{"data":[]}',
    channel: { site_id: '123' }
  })
  expect(result).toMatchObject([])
})

it('can parse channel list', async () => {
  axios.get.mockImplementation((reqUrl) => {
    if (reqUrl.includes('auth/access')) {
      return Promise.resolve({
        data: { data: { token: 'mock_token_123' } }
      })
    }
    
    if (reqUrl.includes('category/channels')) {
      return Promise.resolve({
        data: {
          data: [
            {
              channels: [
                {
                  chlId: '878765717599035555',
                  chlName: 'Wedo Movies',
                  chlLangCode: 'en'
                },
                {
                  chlId: '999420644834214633',
                  chlName: 'FIFA+',
                  chlLangCode: 'es'
                }
              ]
            }
          ]
        }
      })
    }
    return Promise.resolve({ data: {} })
  })

  const result = await channels()

  expect(result).toBeInstanceOf(Array)
  expect(result.length).toBeGreaterThan(0)
  expect(result[0]).toMatchObject({
    name: expect.any(String),
    site_id: expect.any(String),
    lang: expect.any(String)
  })
})

it('can parse token', async () => {
  jest.resetModules()
  const { request } = require('./watch.whaletvplus.com.config.js')
  const axios = require('axios')

  axios.get.mockImplementation((url) => {
    if (url.includes('auth/access')) {
      return Promise.resolve({
        data: { data: { token: 'test_token' } }
      })
    }
    return Promise.resolve({ data: {} })
  })

  const headers = await request.headers()
  expect(headers.token).toBe('test_token')
})