// npm run channels:parse --config=./sites/mncvision.id/mncvision.id.config.js --output=./sites/mncvision.id/mncvision.id.channels.xml
// npx epg-grabber --config=sites/mncvision.id/mncvision.id.config.js --channels=sites/mncvision.id/mncvision.id.channels.xml --output=guide.xml --timeout=30000 --days=2

const { parser, url, request } = require('./mncvision.id.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-10-05', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '38',
  xmltv_id: 'MiaoMi.hk',
  lang: 'id'
}
const headers = {
  'set-cookie': [
    's1nd0vL=05e9pr6gi112tdmutsn7big93o75r0b0; expires=Wed, 05-Oct-2022 14:18:22 GMT; Max-Age=7200; path=/; HttpOnly'
  ]
}

it('can generate valid url', () => {
  expect(url).toBe('https://mncvision.id/schedule/table')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded'
  })
})

it('can generate valid request data', () => {
  const data = request.data({ channel, date })
  expect(data.get('search_model')).toBe('channel')
  expect(data.get('af0rmelement')).toBe('aformelement')
  expect(data.get('fdate')).toBe('2022-10-05')
  expect(data.get('fchannel')).toBe('38')
  expect(data.get('submit')).toBe('Search')
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const indonesiaHeaders = {
    'set-cookie': [
      's1nd0vL=e3vjb0oaf9vijiqsg7cml4i7fdkq16db; expires=Wed, 05-Oct-2022 14:54:16 GMT; Max-Age=7200; path=/; HttpOnly'
    ]
  }
  const englishHeaders = {
    'set-cookie': [
      's1nd0vL=hfd6hpnpr6gvgart0d8rf7ef6t4gi7nr; expires=Wed, 05-Oct-2022 15:08:55 GMT; Max-Age=7200; path=/; HttpOnly'
    ]
  }
  axios.get.mockImplementation((url, opts) => {
    if (
      url === 'https://www.mncvision.id/schedule/table/startno/50' &&
      opts.headers['Cookie'] === headers['set-cookie'][0]
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/content_p2.html'))
      })
    } else if (url === 'https://www.mncvision.id/language_switcher/setlang/indonesia/') {
      return Promise.resolve({
        headers: indonesiaHeaders
      })
    } else if (url === 'https://www.mncvision.id/language_switcher/setlang/english/') {
      return Promise.resolve({
        headers: englishHeaders
      })
    } else if (
      url ===
        'https://mncvision.id/schedule/detail/2022100500000038/Adventures-With-Miao-Mi-Ep-1/1' &&
      opts.headers['Cookie'] === indonesiaHeaders['set-cookie'][0]
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/program_id.html'))
      })
    } else if (
      url ===
        'https://mncvision.id/schedule/detail/2022100500000038/Adventures-With-Miao-Mi-Ep-1/1' &&
      opts.headers['Cookie'] === englishHeaders['set-cookie'][0]
    ) {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/program_en.html'))
      })
    }

    return Promise.resolve({ data: '' })
  })

  let indonesiaResults = await parser({ date, content, channel, headers })
  indonesiaResults = indonesiaResults.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(indonesiaResults[0]).toMatchObject({
    start: '2022-10-04T17:00:00.000Z',
    stop: '2022-10-04T17:06:00.000Z',
    title: 'Adventures With Miao Mi, Ep 1',
    episode: 1,
    description:
      'Ketika anak-anak mulai menghilang, sekelompok anak kecil harus menghadapi ketakutan terbesar mereka ketika mereka melawan sesosok badut pembunuh yang jahat.'
  })

  expect(indonesiaResults[4]).toMatchObject({
    start: '2022-10-04T17:33:00.000Z',
    stop: '2022-10-04T17:46:00.000Z',
    title: 'Leo Wildlife Ranger S2, Ep 27',
    season: 2,
    episode: 27
  })

  let englishResults = await parser({ date, content, channel: { ...channel, lang: 'en' }, headers })
  englishResults = englishResults.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(englishResults[0]).toMatchObject({
    start: '2022-10-04T17:00:00.000Z',
    stop: '2022-10-04T17:06:00.000Z',
    title: 'Adventures With Miao Mi, Ep 1',
    episode: 1,
    description:
      'When children begin to disappear, a group of young kids have to face their biggest fears when they square off against a murderous, evil clown.'
  })
})

it('can handle empty guide', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'))
  let results = await parser({
    date,
    channel,
    content,
    headers
  })
  expect(results).toMatchObject([])
})
