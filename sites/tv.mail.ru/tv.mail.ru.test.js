const { parser, url } = require('./tv.mail.ru.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const fs = require('fs')
const path = require('path')

dayjs.extend(customParseFormat)
dayjs.extend(utc)
process.env.EPG_DETAILED_GUIDE = 1

jest.mock('axios')

const date = dayjs.utc('2026-06-18').startOf('d')
const channel = {
  site_id: '3161',
  xmltv_id: 'MosfilmGoldCollection.ru@SD'
}

axios.head.mockImplementation(() => Promise.resolve({}))
axios.get.mockImplementation(url => {
  const urls = {
    'https://tv.mail.ru/ajax/service/index/schedule/?region_id=70&channel_type=all&date=2026-06-18&appearance=grid&period=all':
      'content1.json',
    'https://tv.mail.ru/ajax/service/index/schedule/?region_id=70&channel_type=all&date=2026-06-18&appearance=grid&period=all&page=2':
      'content2.json',
    'https://tv.mail.ru/ajax/service/index/schedule/?region_id=70&channel_type=all&date=2026-06-17&appearance=grid&period=all&page=2':
      'content2a.json',
    'https://tv.mail.ru/moskva/event/777111/?event_id=277465076':
      'program1.html',
    'https://tv.mail.ru/moskva/event/702859/?event_id=277466578':
      'program2.html'
  }
  let data = ''
  if (urls[url] !== undefined) {
    data = fs.readFileSync(path.join(__dirname, '__data__', urls[url])).toString()
  }
  return Promise.resolve({ data })
})

it('can generate valid url', async () => {
  expect(await url({ date })).toBe(
    'https://tv.mail.ru/ajax/service/index/schedule/?region_id=70&channel_type=all&date=2026-06-18&appearance=grid&period=all'
  )
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.join(__dirname, '__data__', 'content1.json'))
  const result = (await parser({ content, channel, date }))
    .map(p => {
      p.start = p.start.toJSON()
      p.stop = p.stop.toJSON()
      return p
    })

  expect(result.length).toBe(26)
  expect(result[0]).toMatchObject({
    start: '2026-06-17T23:50:00.000Z',
    stop: '2026-06-18T01:15:00.000Z',
    title: 'Слезы капали',
    description:
      'Узнаем, что же случилось с Павлом Ивановичем Васиным, жителем городка Зареченска. Любящий муж и отец, отзывчивый сосед и сослуживец, словом, душа-человек в один прекрасный день превратился в недовольного всем чинушу и формалиста. А все из-за того, что ему в глаз попал осколок волшебного зеркала…',
    category: 'драма',
    country: 'СССР',
    date: '1982',
    image: 'https://tv.mail.ru/tvpic/3/72/8639450.jpg'
  })
  expect(result[25]).toMatchObject({
    start: '2026-06-18T23:45:00.000Z',
    stop: '2026-06-19T01:00:00.000Z',
    title: 'Путешествие мсье Перришона',
    description:
      'Музыкальная комедия по пьесе французского драматурга Эжена Лабиша. Двое молодых людей - Арман и Даниэль - влюбляются в дочь каретника Перришона. Девушка тоже пока не поняла, кто ей больше нравится. Она решила проверить их в деле: отправилась с ними в горы искать клад. Пусть в полевых условиях поухаживают. Вот тогда и станет ясно, кто из женихов больше достоин руки девушки…',
    actor:
      ['Валентин Гафт', 'Олег Табаков', 'Татьяна Васильева', 'Георгиос Совчис', 'Игорь Скляр', 'Татьяна Догилева', 'Марина Зудина', 'Александр Филиппенко', 'Александр Мохов', 'Екатерина Васильева'],
    director: 'Сергей Микаэлян',
    country: 'СССР',
    date: '1986',
    image: 'https://tv.mail.ru/tvpic/2/71/6928921.jpg'
  })
})

it('can handle empty guide', async () => {
  const result = await parser({
    date,
    channel,
    content: ''
  })
  expect(result).toMatchObject([])
})
