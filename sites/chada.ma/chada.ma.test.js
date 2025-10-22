const { parser, url } = require('./chada.ma.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

jest.mock('axios')

it('can generate valid url', () => {
  expect(url()).toBe('https://chada.ma/fr/chada-tv/grille-tv/')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.html'), 'utf8')
  const result = parser({ content }).map(p => {
    p.start = dayjs(p.start).tz('Africa/Casablanca').format('YYYY-MM-DDTHH:mm:ssZ')
    p.stop = dayjs(p.stop).tz('Africa/Casablanca').format('YYYY-MM-DDTHH:mm:ssZ')
    return p
  })

  expect(result).toMatchObject([
    {
      title: 'Bloc Prime + Clips',
      description: 'No description available',
      start: dayjs.tz('00:00', 'HH:mm', 'Africa/Casablanca').format('YYYY-MM-DDTHH:mm:ssZ'),
      stop: dayjs.tz('09:00', 'HH:mm', 'Africa/Casablanca').format('YYYY-MM-DDTHH:mm:ssZ')
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
