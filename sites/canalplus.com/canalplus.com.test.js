// npm run channels:parse -- --config=./sites/canalplus.com/canalplus.com.config.js --output=./sites/canalplus.com/canalplus.com.channels.xml
// npx epg-grabber --config=sites/canalplus.com/canalplus.com.config.js --channels=sites/canalplus.com/canalplus.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./canalplus.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '312',
  xmltv_id: 'TF1.fr'
}

jest.mock('axios')

it('can generate valid url for today', () => {
  const today = dayjs.utc().startOf('d')
  expect(url({ channel, date: today })).toBe(
    'https://hodor.canalplus.pro/api/v2/mycanal/channels/da2291af3b10e9900d1c55e1a65d3388/312/broadcasts/day/0'
  )
})

it('can generate valid url for tomorrow', () => {
  const tomorrow = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date: tomorrow })).toBe(
    'https://hodor.canalplus.pro/api/v2/mycanal/channels/da2291af3b10e9900d1c55e1a65d3388/312/broadcasts/day/1'
  )
})

it('can parse response', done => {
  const content = `{"timeSlices":[{"timeSlice":"0","contents":[{"contentID":"18257183_50061","title":"TFou","subtitle":"Emission du 07 mars 2022","startTime":1646630700000,"onClick":{"displayTemplate":"detailSeason","displayName":"TFou","path":"/jeunesse/tfou/h/10709960_50061","URLPage":"https://hodor.canalplus.pro/api/v2/mycanal/detail/da2291af3b10e9900d1c55e1a65d3388/okapi/10709339_50061.json?detailType=detailSeason&objectType=season&broadcastID=PLM_1094261940&episodeId=18257183_50061&brandID=10709960_50061&fromDiff=true"}}]},{"timeSlice":"1","contents":[{"contentID":"18257202_50061","title":"Petits plats en équilibre","subtitle":"Mag. Gastronomie","startTime":1646654100000,"onClick":{"displayTemplate":"detailPage","displayName":"Petits plats en équilibre","path":"/divertissement/petits-plats-en-equilibre-mag-gastronomie/h/18257202_50061","URLPage":"https://hodor.canalplus.pro/api/v2/mycanal/detail/da2291af3b10e9900d1c55e1a65d3388/okapi/18257202_50061.json?detailType=detailPage&objectType=unit&broadcastID=PLM_1094380194&fromDiff=true"}}]}]}`

  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://hodor.canalplus.pro/api/v2/mycanal/detail/da2291af3b10e9900d1c55e1a65d3388/okapi/10709339_50061.json?detailType=detailSeason&objectType=season&broadcastID=PLM_1094261940&episodeId=18257183_50061&brandID=10709960_50061&fromDiff=true'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"detail":{"informations":{"URLImage":"https://thumb.canalplus.pro/http/unsafe/{resolutionXY}/filters:quality({imageQualityPercentage})/img-hapi.canalplus.pro:80/ServiceImage/ImageID/97215037","summary":"Une émission jeunesse qui propose les meilleures séries de dessins animés du moment."}}}`
        )
      })
    } else if (
      url ===
      'https://hodor.canalplus.pro/api/v2/mycanal/detail/da2291af3b10e9900d1c55e1a65d3388/okapi/18257202_50061.json?detailType=detailPage&objectType=unit&broadcastID=PLM_1094380194&fromDiff=true'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"detail":{"informations":{"URLImage":"https://thumb.canalplus.pro/http/unsafe/{resolutionXY}/filters:quality({imageQualityPercentage})/img-hapi.canalplus.pro:80/ServiceImage/ImageID/100841894","summary":"Chaque jour, Laurent Mariotte propose des recettes simples et savoureuses pour profiter des ingrédients de saison, en donnant la part belle aux produits locaux."}}}`
        )
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  parser({ content })
    .then(result => {
      result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2022-03-07T05:25:00.000Z',
          stop: '2022-03-07T11:55:00.000Z',
          title: 'TFou',
          description:
            'Une émission jeunesse qui propose les meilleures séries de dessins animés du moment.',
          icon: 'https://thumb.canalplus.pro/http/unsafe/{resolutionXY}/filters:quality({imageQualityPercentage})/img-hapi.canalplus.pro:80/ServiceImage/ImageID/97215037'
        },
        {
          start: '2022-03-07T11:55:00.000Z',
          stop: '2022-03-07T12:55:00.000Z',
          title: 'Petits plats en équilibre',
          description:
            'Chaque jour, Laurent Mariotte propose des recettes simples et savoureuses pour profiter des ingrédients de saison, en donnant la part belle aux produits locaux.',
          icon: 'https://thumb.canalplus.pro/http/unsafe/{resolutionXY}/filters:quality({imageQualityPercentage})/img-hapi.canalplus.pro:80/ServiceImage/ImageID/100841894'
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', done => {
  parser({
    content: `{"currentPage":{"displayTemplate":"error","displayName":"Page introuvable","path":"/erreur","BOName":"Page introuvable","BOLayoutName":"Erreur 404"},"title":"Page introuvable","text":"La page que vous demandez est introuvable. Si le problème persiste, vous pouvez contacter l'assistance de CANAL+.","code":404}`
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
