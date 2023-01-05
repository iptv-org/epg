// node ./scripts/channels.js --config=./sites/magticom.ge/magticom.ge.config.js --output=./sites/magticom.ge/magticom.ge.channels.xml
// npx epg-grabber --config=sites/magticom.ge/magticom.ge.config.js --channels=sites/magticom.ge/magticom.ge.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./magticom.ge.config.js')
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
  const content = `[{\"id\":2313254118,\"channelId\":260,\"startTimestamp\":\"2021-11-22T07:00:00\",\"endTimestamp\":\"2021-11-22T09:00:00\",\"duration\":null,\"title\":\"\\u0425\\\/\\u0444 \\\"\\u041d\\u0435\\u0440\\u0430\\u0432\\u043d\\u044b\\u0439 \\u0431\\u0440\\u0430\\u043a\\\".\",\"subTitle\":\"\\u0425\\\/\\u0444 \\\"\\u041d\\u0435\\u0440\\u0430\\u0432\\u043d\\u044b\\u0439 \\u0431\\u0440\\u0430\\u043a\\\".\",\"info\":\"\\u0413\\u0443\\u0434\\u0436\\u0430\\u0440\\u0430\\u0442\\u0435\\u0446 \\u0425\\u0430\\u0441\\u043c\\u0443\\u043a\\u0445 \\u041f\\u0430\\u0442\\u0435\\u043b \\u043f\\u043e\\u0441\\u0441\\u043e\\u0440\\u0438\\u043b\\u0441\\u044f \\u0441 \\u043d\\u043e\\u0432\\u044b\\u043c \\u0441\\u043e\\u0441\\u0435\\u0434\\u043e\\u043c \\u0413\\u0443\\u0433\\u0433\\u0438 \\u0422\\u0430\\u043d\\u0434\\u043e\\u043d\\u043e\\u043c. \\u041d\\u043e \\u0438\\u043c \\u043f\\u0440\\u0438\\u0445\\u043e\\u0434\\u0438\\u0442\\u0441\\u044f \\u043f\\u043e\\u043c\\u0438\\u0440\\u0438\\u0442\\u044c\\u0441\\u044f, \\u043a\\u043e\\u0433\\u0434\\u0430 \\u0438\\u0445 \\u0434\\u0435\\u0442\\u0438 \\u0432\\u043b\\u044e\\u0431\\u043b\\u044f\\u044e\\u0442\\u0441\\u044f \\u0434\\u0440\\u0443\\u0433 \\u0432 \\u0434\\u0440\\u0443\\u0433\\u0430. \\u0420\\u0435\\u0436\\u0438\\u0441\\u0441\\u0435\\u0440: \\u0421\\u0430\\u043d\\u0434\\u0436\\u0430\\u0439 \\u0427\\u0445\\u0435\\u043b. \\u0410\\u043a\\u0442\\u0435\\u0440\\u044b: \\u0420\\u0438\\u0448\\u0438 \\u041a\\u0430\\u043f\\u0443\\u0440, \\u041f\\u0430\\u0440\\u0435\\u0448 \\u0420\\u0430\\u0432\\u0430\\u043b, \\u0412\\u0438\\u0440 \\u0414\\u0430\\u0441. 2017 \\u0433\\u043e\\u0434.\",\"pg\":null,\"year\":null,\"country\":null,\"imageUrl\":null,\"createdBy\":-200,\"creationTimestamp\":\"2021-11-21T18:04:52\",\"epgSourceId\":8,\"startDateStr\":\"20211122070000\",\"genreByGenreId\":null,\"languageByLanguageId\":{\"id\":3,\"name\":\"\\u10e0\\u10e3\\u10e1\\u10e3\\u10da\\u10d8\",\"orderIndex\":3,\"nameShort\":\"ru\"},\"externalId\":\"2021460000084132\",\"programHumanById\":[],\"date\":null,\"time\":null,\"startDate\":null,\"endDate\":null,\"longInfo\":\"\\u0413\\u0443\\u0434\\u0436\\u0430\\u0440\\u0430\\u0442\\u0435\\u0446 \\u0425\\u0430\\u0441\\u043c\\u0443\\u043a\\u0445 \\u041f\\u0430\\u0442\\u0435\\u043b \\u043f\\u043e\\u0441\\u0441\\u043e\\u0440\\u0438\\u043b\\u0441\\u044f \\u0441 \\u043d\\u043e\\u0432\\u044b\\u043c \\u0441\\u043e\\u0441\\u0435\\u0434\\u043e\\u043c \\u0413\\u0443\\u0433\\u0433\\u0438 \\u0422\\u0430\\u043d\\u0434\\u043e\\u043d\\u043e\\u043c. \\u041d\\u043e \\u0438\\u043c \\u043f\\u0440\\u0438\\u0445\\u043e\\u0434\\u0438\\u0442\\u0441\\u044f \\u043f\\u043e\\u043c\\u0438\\u0440\\u0438\\u0442\\u044c\\u0441\\u044f, \\u043a\\u043e\\u0433\\u0434\\u0430 \\u0438\\u0445 \\u0434\\u0435\\u0442\\u0438 \\u0432\\u043b\\u044e\\u0431\\u043b\\u044f\\u044e\\u0442\\u0441\\u044f \\u0434\\u0440\\u0443\\u0433 \\u0432 \\u0434\\u0440\\u0443\\u0433\\u0430. \\u0420\\u0435\\u0436\\u0438\\u0441\\u0441\\u0435\\u0440: \\u0421\\u0430\\u043d\\u0434\\u0436\\u0430\\u0439 \\u0427\\u0445\\u0435\\u043b. \\u0410\\u043a\\u0442\\u0435\\u0440\\u044b: \\u0420\\u0438\\u0448\\u0438 \\u041a\\u0430\\u043f\\u0443\\u0440, \\u041f\\u0430\\u0440\\u0435\\u0448 \\u0420\\u0430\\u0432\\u0430\\u043b, \\u0412\\u0438\\u0440 \\u0414\\u0430\\u0441. 2017 \\u0433\\u043e\\u0434.\"}]`
  const result = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-22T03:00:00.000Z',
      stop: '2021-11-22T05:00:00.000Z',
      title: `Х/ф "Неравный брак".`,
      description: `Гуджаратец Хасмукх Пател поссорился с новым соседом Гугги Тандоном. Но им приходится помириться, когда их дети влюбляются друг в друга. Режиссер: Санджай Чхел. Актеры: Риши Капур, Пареш Равал, Вир Дас. 2017 год.`
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `[]`
  })
  expect(result).toMatchObject([])
})
