const { parser, url } = require('./chaines-tv.orange.fr.config.js')
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
const content =
  '{"192":[{"id":1635062528017,"programType":"EPISODE","title":"Tête de liste","channelId":"192","channelZappingNumber":11,"covers":[{"format":"RATIO_16_9","url":"https://proxymedia.woopic.com/340/p/169_EMI_9697669.jpg"},{"format":"RATIO_4_3","url":"https://proxymedia.woopic.com/340/p/43_EMI_9697669.jpg"}],"diffusionDate":1636328100,"duration":2700,"csa":2,"synopsis":"Un tueur en série prend un plaisir pervers à prévenir les autorités de Tallahassee avant chaque nouveau meurtre. Rossi apprend le décès d\'un de ses vieux amis.","languageVersion":"VM","hearingImpaired":true,"audioDescription":false,"season":{"number":10,"episodesCount":23,"serie":{"title":"Esprits criminels"}},"episodeNumber":12,"definition":"SD","links":[{"rel":"SELF","href":"https://rp-live.orange.fr/live-webapp/v3/applications/STB4PC/programs/1635062528017"}],"dayPart":"OTHER","catchupId":null,"genre":"Série","genreDetailed":"Série Suspense"}]}'

it('can generate valid url', () => {
  const result = url({ channel, date })
  expect(result).toBe(
    'https://rp-ott-mediation-tv.woopic.com/api-gw/live/v3/applications/STB4PC/programs?groupBy=channel&includeEmptyChannels=false&period=1636329600000,1636416000000&after=192&limit=1'
  )
})

it('can parse response', () => {
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
    content:
      '{"code":60,"message":"Resource not found","param":{},"description":"L\'URI demandé ou la ressource demandée n\'existe pas.","stackTrace":null}'
  })
  expect(result).toMatchObject([])
})
