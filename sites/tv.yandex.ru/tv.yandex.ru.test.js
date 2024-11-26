const { parser, url, request } = require('./tv.yandex.ru.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-11-26').startOf('d')
const channel = {
  site_id: '16',
  xmltv_id: 'ChannelOne.ru'
}
axios.get.mockImplementation((url, opts) => {
  if (url === 'https://tv.yandex.ru/?date=2023-11-26&grid=all&period=all-day') {
    return Promise.resolve({
      headers: {},
      data: fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
    })
  }
  if (url === 'https://tv.yandex.ru/api/120809?date=2023-11-26&grid=all&period=all-day') {
    return Promise.resolve({
      headers: {},
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/schedule.json')))
    })
  }
  if (url === 'https://tv.yandex.ru/api/120809/main/chunk?page=0&date=2023-11-26&period=all-day&offset=0&limit=11') {
    return Promise.resolve({
      headers: {},
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/schedule0.json')))
    })
  }
  if (url === 'https://tv.yandex.ru/api/120809/event?eventId=217749657&programCoId=') {
    return Promise.resolve({
      headers: {},
      data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program.json')))
    })
  }
})

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://tv.yandex.ru/?date=2023-11-26&grid=all&period=all-day'
  )
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    Cookie:
      'i=dkim62pClrWWC4CShVQYMpVw1ELNVw4XJdL/lzT4E2r05IgcST1GtCA4ho/UyGgW2AO4qftDfZzGX2OHqCzwY7GUkpM=; ' +
      'spravka=dD0xNzMyMzg1MjQ4O2k9MTgwLjI0Ny4yNDEuNzA7RD1DMjQ4OTYzRURBNEE1NjVEMjg0Rjc5MDQyNEYzMjdGRDVERTg0MkQ2ODBCOUNCREUwQjk4OEYzRThDREIwQjVBNTUwRjc1OTFCRkMwRTRBRTM3RDA4MjZCMDAyNzhDMjEwMUYzOTE0NEQ5NjhBNjJGNENDRTYwM0ZDQUY4QjBBRTA0NDRGNjNENTQ0OUQ5MzkxMTdFRTMyQkVEMDM2RUJBRkEyNDhDMTM7dT0xNzMyMzg1MjQ4NDQ3MDkzNTg1O2g9MmZlZDc2M2EyNDA5NDFkMzIwYWIwYjI3ZThlYmExYWE=; tvoid=1; bltsr=1; user_display=563; _yasc=2xvlftNDZixh3JWMMTAAGeCgprMjSRqe/D5O+sz+USg0zxL17E9zLMzQXmTAy7BsF92BMrYAfh0NfQ==; bh=EjkiQ2hyb21pdW0iO3Y9IjEyOCIsICJOb3Q7QT1CcmFuZCI7dj0iMjQiLCAiT3BlcmEiO3Y9IjExNCIqAj8wOgkiV2luZG93cyJgh+uVugZqIdzK4f8IktihsQOfz+HqA/v68OcN6//99g+2xsyHCKWEAg==; ' +
      'yandexuid=1197179041732383499; ' +
      'yashr=4682342911732383504; ' +
      'yuidss=1197179041732383499; ' +
      'user_display=563'
  })
})

it('can parse response', async () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'))
  const result = (
    await parser({ content, date, channel })
  ).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2023-11-26T01:35:00.000Z',
      stop: '2023-11-26T02:10:00.000Z',
      title: 'ПОДКАСТ.ЛАБ. Мелодии моей жизни',
      category: 'досуг',
      description: 'Впереди вся ночь и есть о чем поговорить. Фильмы, музыка, любовь, звезды, еда, мода, анекдоты, спорт, деньги, настоящее, будущее - все это в творческом эксперименте.\nЛариса Гузеева читает любовные письма. Леонид Якубович рассказывает, кого не берут в пилоты. Арина Холина - какой секс способен довести до мужа или до развода. Валерий Сюткин на ходу сочиняет песню для Карины Кросс и Вали Карнавал. Дмитрий Дибров дарит новую жизнь любимой \"Антропологии\". Денис Казанский - все о футболе, хоккее и не только.\n\"ПОДКАСТЫ. ЛАБ\" - серия подкастов разной тематики, которые невозможно проспать. Интеллектуальные дискуссии после полуночи с самыми компетентными экспертами и актуальными спикерами.'
    }
  ])
})

it('can handle empty guide', async () => {
  const result = await parser({
    date,
    channel,
    content: '<!DOCTYPE html><html><head></head><body></body></html>'
  })
  expect(result).toMatchObject([])
})
