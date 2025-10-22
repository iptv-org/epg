const { parser, url } = require('./iltalehti.fi.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-10-29', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1#yle-tv1',
  xmltv_id: 'YleTV1.fi'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://telkku.com/api/channel-groups/default_builtin_channelgroup1/offering?startTime=00%3A00%3A00.000&duration=PT24H&inclusionPolicy=IncludeOngoingAlso&limit=1000&tvDate=2022-10-29&view=PublicationDetails'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content, channel }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2022-10-28T20:50:00.000Z',
    stop: '2022-10-28T21:20:00.000Z',
    title: 'Puoli seitsemän',
    description:
      'Vieraana näyttelijä Elias Salonen. Puoli seiskassa vietetään sekä halloweeniä että joulua, kun Olli-Pekka tapaa todellisen jouluttajan. Juontajina Anniina Valtonen, Tuulianna Tola ja Olli-Pekka Kursi.',
    image:
      'https://thumbor.prod.telkku.com/YTglotoUl7aJtzPtYnvM9tH03sY=/1200x630/smart/filters:quality(86):format(jpeg)/img.prod.telkku.com/program-images/0f885238ac16ce167a9d80eace450254.jpg'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no-content.json')),
    channel
  })
  expect(result).toMatchObject([])
})
