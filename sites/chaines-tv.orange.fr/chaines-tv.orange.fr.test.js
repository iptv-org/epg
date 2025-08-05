const { parser, url } = require('./chaines-tv.orange.fr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-08', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '192',
  xmltv_id: 'TF1.fr'
}

it('can generate valid url', () => {
  const result = url({ channel, date })
  expect(result).toBe(
    'https://rp-ott-mediation-tv.woopic.com/api-gw/live/v3/applications/STB4PC/programs?groupBy=channel&includeEmptyChannels=false&period=1636329600000,1636416000000&after=192&limit=1'
  )
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-07T23:35:00.000Z',
      stop: '2021-11-08T00:20:00.000Z',
      title: 'Tête de liste',
      subTitle: 'Esprits criminels',
      season: 10,
      episode: 12,
      description:
        "Un tueur en série prend un plaisir pervers à prévenir les autorités de Tallahassee avant chaque nouveau meurtre. Rossi apprend le décès d'un de ses vieux amis.",
      category: 'Série Suspense',
      image: 'https://proxymedia.woopic.com/340/p/169_EMI_9697669.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
  })
  expect(result).toMatchObject([])
})
