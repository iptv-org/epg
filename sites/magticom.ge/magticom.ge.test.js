const { parser, url, request } = require('./magticom.ge.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-22', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '260',
  xmltv_id: 'BollywoodHDRussia.ru'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.magticom.ge/request/channel-program.php')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Referer: 'https://www.magticom.ge/en/tv/tv-services/tv-guide'
  })
})

it('can generate valid request data', () => {
  const result = request.data({ channel, date })
  expect(result.has('channelId')).toBe(true)
  expect(result.has('start')).toBe(true)
  expect(result.has('end')).toBe(true)
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-22T03:00:00.000Z',
      stop: '2021-11-22T05:00:00.000Z',
      title: 'Х/ф "Неравный брак".',
      description:
        'Гуджаратец Хасмукх Пател поссорился с новым соседом Гугги Тандоном. Но им приходится помириться, когда их дети влюбляются друг в друга. Режиссер: Санджай Чхел. Актеры: Риши Капур, Пареш Равал, Вир Дас. 2017 год.'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: '[]'
  })
  expect(result).toMatchObject([])
})
