const { parser, url } = require('./tvheute.at.config.js')
const dayjs = require('dayjs')
const path = require('path')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const { readFileSync } = require('fs')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-08', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'orf1', xmltv_id: 'ORF1.at' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tvheute.at/part/channel-shows/partial/orf1/08-11-2021'
  )
})

it('can parse response', () => {
  expect(parser({ date, channel, content: readFileSync(path.resolve(__dirname, './__data__/content.html'), 'utf8') })).toMatchObject([
    {
      start: '2021-11-08T05:00:00.000Z',
      stop: '2021-11-08T05:10:00.000Z',
      title: 'Monchhichi (Wh.)',
      category: 'Kids',
      description:
        'Roger hat sich Ärger mit Dr. Bellows eingehandelt, der ihn für einen Monat strafversetzen möchte. Einmal mehr hadert Roger mit dem Schicksal, dass er keinen eigenen Flaschengeist besitzt, der ihm aus der Patsche helfen kann. Jeannie schlägt vor, ihm Cousine Marilla zu schicken. Doch Tony ist strikt dagegen. Als ein Zaubererpärchen im exotischen Bühnenoutfit für die Zeit von Rogers Abwesenheit sein Apartment in Untermiete bezieht, glaubt Roger, Jeannie habe ihm ihre Verwandte doch noch gesandt.',
      image: 'https://tvheute.at/images/orf1/monchhichi_kids--1895216560-00.jpg'
    },
    {
      start: '2021-11-08T17:00:00.000Z',
      stop: '2021-11-08T17:10:00.000Z',
      title: 'ZIB 18'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: readFileSync(path.resolve(__dirname, './__data__/no_content.html'), 'utf8')
  })
  expect(result).toMatchObject([])
})
