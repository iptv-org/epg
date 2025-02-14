const { parser, url } = require('./nostv.pt.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-12-11').startOf('d')
const channel = {
  site_id: '510',
  xmltv_id: 'SPlus.pt'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://api.clg.nos.pt/nostv/ott/schedule/range/contents/guest?channels=510&minDate=2023-12-11T00:00:00Z&maxDate=2023-12-11T23:59:59Z&isDateInclusive=true&client_id=xe1dgrShwdR1DVOKGmsj8Ut4QLlGyOFI'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/data.json'))
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-12-11T16:30:00.000Z',
    stop: '2023-12-11T17:00:00.000Z',
    title: 'Village Vets',
    description:
      'A história de dois melhores amigos veterinários e o seu extraordinário trabalho na Austrália.',
    season: 1,
    episode: 12,
    image:
      'https://mage.stream.nos.pt/v1/nostv_mage/Images?sourceUri=http://vip.pam.local.internal/PAM.Images/Store/8329ed1aec5d4c0faa2056972256ff9f&profile=ott_1_452x340&client_id=xe1dgrShwdR1DVOKGmsj8Ut4QLlGyOFI'
  })
})

it('can handle empty guide', async () => {
  const results = await parser({
    date,
    content: '[]'
  })

  expect(results).toMatchObject([])
})
