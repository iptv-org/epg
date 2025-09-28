const { parser, url } = require('./epg.iptvx.one.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const fs = require('fs')
const path = require('path')

dayjs.extend(utc)
dayjs.extend(timezone)

const date = dayjs.utc('2025-09-24', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: '12-omsk', xmltv_id: 'Channel12.ru' }

it('can generate valid url', () => {
  expect(url).toBe('https://iptvx.one/epg/epg_noarch.xml.gz')
})

it('can parse response', () => {
  const buffer = fs.readFileSync(path.resolve(__dirname, '__data__/content.xml.gz'))
  const results = parser({ date, buffer, channel })

  expect(results.length).toBe(33)
  expect(results[0]).toMatchObject({
    start: '2025-09-24T00:00:00.000Z',
    stop: '2025-09-24T00:25:00.000Z',
    title: 'Час новостей',
    description:
      'Каждый день наша программа рассказывает вам о самых горячих событиях. Наше преимущество – оперативность: мы всегда там, где происходит что-то важное. Наш девиз – объективность: у нас нет запретных тем и героев вне критики. Наша цель – быть интересными каждому из вас. Мы живем рядом с вами, нас волнуют общие проблемы, каждую – мы обсуждаем, как свою'
  })
  expect(results[32]).toMatchObject({
    start: '2025-09-24T22:35:00.000Z',
    stop: '2025-09-25T00:00:00.000Z',
    title: 'д/с Необыкновенные люди',
    description:
      'В этом документальном цикле герои – врачи, спортсмены, волонтеры, творческие личности и многие другие – делятся своими историями. Их работа и деятельность имеют важное значение для жизни особенных людей, которые сталкиваются с непростыми жизненными условиями. Россия'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    buffer: ''
  })
  expect(result).toMatchObject([])
})
