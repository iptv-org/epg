const { parser, url, request } = require('./mncvision.id.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const multifetch = require('../../scripts/core/multifetch')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-11-19').startOf('d')
const channel = {
  site_id: '154',
  xmltv_id: 'AXN.id',
  lang: 'id'
}
const indonesiaHeaders = {
  'set-cookie': [
    's1nd0vL=uo6gsashc1rmloqbb50m6b13qkglfvpl; expires=Sat, 18-Nov-2023 20:45:02 GMT; Max-Age=7200; path=/; HttpOnly'
  ]
}
const englishHeaders = {
  'set-cookie': [
    's1nd0vL=imtot2v1cs0pbemaohj9fee3hlbqo699; expires=Sat, 18-Nov-2023 20:38:31 GMT; Max-Age=7200; path=/; HttpOnly'
  ]
}

beforeEach(() => {
  const getCookie = headers => {
    if (Array.isArray(headers['set-cookie'])) {
      return headers['set-cookie'][0].split('; ')[0]
    }
  }

  multifetch.setMocks({
    'https://www.mncvision.id/language_switcher/setlang/indonesia/': () => ({
      headers: indonesiaHeaders
    }),
    'https://www.mncvision.id/language_switcher/setlang/english/': () => ({
      headers: englishHeaders
    }),
    'https://www.mncvision.id/schedule/detail/20231119001500154/Blue-Bloods-S13-Ep-19/1': (url, config) => {
      if (config?.headers?.['Cookie'] === getCookie(indonesiaHeaders)) {
        return { data: fs.readFileSync(path.resolve(__dirname, '__data__/program_id.html'), 'utf8'), status: 200 }
      }
      if (config?.headers?.['Cookie'] === getCookie(englishHeaders)) {
        return { data: fs.readFileSync(path.resolve(__dirname, '__data__/program_en.html'), 'utf8'), status: 200 }
      }
      return { data: '', status: 404 }
    }
  })
})

afterEach(() => {
  multifetch.clearMocks()
})

it('can generate valid url', () => {
  expect(url).toBe('https://www.mncvision.id/schedule/table')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', async () => {
  expect(await request.headers({ channel })).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const data = request.data({ channel, date })
  expect(data.get('search_model')).toBe('channel')
  expect(data.get('af0rmelement')).toBe('aformelement')
  expect(data.get('fdate')).toBe('2023-11-19')
  expect(data.get('fchannel')).toBe('154')
  expect(data.get('submit')).toBe('Search')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const indonesiaResults = (
    await parser({ date, content, channel, headers: indonesiaHeaders })
  ).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(indonesiaResults[0]).toMatchObject({
    start: '2023-11-18T17:15:00.000Z',
    stop: '2023-11-18T18:05:00.000Z',
    title: 'Blue Bloods S13, Ep 19',
    episode: 19,
    description:
      'Jamie bekerja sama dengan FDNY untuk menemukan pelaku pembakaran yang bertanggung jawab atas kebakaran hebat yang terjadi di fasilitas penyimpanan bukti milik NYPD.'
  })

  const englishResults = (
    await parser({ date, content, channel: { ...channel, lang: 'en' }, headers: englishHeaders })
  ).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })
  expect(englishResults[0]).toMatchObject({
    start: '2023-11-18T17:15:00.000Z',
    stop: '2023-11-18T18:05:00.000Z',
    title: 'Blue Bloods S13, Ep 19',
    episode: 19,
    description:
      'Jamie partners with the FDNY to find the arsonist responsible for a massive fire at an NYPD evidence storage facility.'
  })
})

it('can handle empty guide', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  const results = await parser({
    date,
    channel,
    content,
    headers: indonesiaHeaders
  })
  expect(results).toMatchObject([])
})
