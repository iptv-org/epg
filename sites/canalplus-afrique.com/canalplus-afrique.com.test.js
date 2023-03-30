// [Geo-blocked] node ./scripts/commands/parse-channels.js --config=./sites/canalplus-afrique.com/canalplus-afrique.com.config.js --output=./sites/canalplus-afrique.com/canalplus-afrique.com.channels.xml
// npx epg-grabber --config=sites/canalplus-afrique.com/canalplus-afrique.com.config.js --channels=sites/canalplus-afrique.com/canalplus-afrique.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./canalplus-afrique.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const fs = require('fs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const channel = {
  site_id: '180018',
  xmltv_id: 'CanalPlusPremiereOuest.fr'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ channel, date })).toBe(
    'https://hodor.canalplus.pro/api/v2/mycanal/channels/08e7ee52ff5b639aeb39347d3f850210/180018/broadcasts/day/0'
  )
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date })).toBe(
    'https://hodor.canalplus.pro/api/v2/mycanal/channels/08e7ee52ff5b639aeb39347d3f850210/180018/broadcasts/day/1'
  )
})

it('can parse response', done => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://hodor.canalplus.pro/api/v2/mycanal/detail/08e7ee52ff5b639aeb39347d3f850210/okapi/19955110_50261.json?detailType=detailPage&objectType=unit&broadcastID=PLM_1228891040_180018&fromDiff=true'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program1.json')))
      })
    } else if (
      url ===
      'https://hodor.canalplus.pro/api/v2/mycanal/detail/08e7ee52ff5b639aeb39347d3f850210/okapi/16871923_50261.json?detailType=detailPage&objectType=unit&broadcastID=PLM_1231194477_180018&fromDiff=true'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program2.json')))
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
          start: '2023-03-26T08:30:00.000Z',
          stop: '2023-03-26T10:11:00.000Z',
          title: 'Super Speed',
          description: `Sur le déclin, l'écurie automobile Lions aimerait retrouver son prestige d'antan sur les circuits du championnat super pro de la ligue asiatique. Toute la pression repose sur Jeffery Lee et sur sa coéquipière Lili Lu, une jeune pilote promise à un bel avenir. Lorsque celle-ci est victime d'un accident, l'équipe recrute le gamer Jake Tu, un petit génie des simulateurs de course auto...`,
          icon: 'https://thumb.canalplus.pro/http/unsafe/{resolutionXY}/filters:quality({imageQualityPercentage})/img-hapi.canalplus.pro:80/ServiceImage/ImageID/107851690',
          director: ['Yi-xian Chen'],
          actors: [
            'Hannah Quinlivan',
            'Yu-Ning Tsao',
            'Van Fan',
            'Alan Ko',
            'Ying-Hsuan Kao',
            'Nolay Piho',
            'Ken Lin',
            'Jay Chou',
            'Will Liu',
            'Karry Wang',
            'Evonne Hsu',
            'Rio Peng'
          ],
          writer: [
            'Yi-xian Chen',
            'Jay Chern'
          ],
          rating: {
            system: 'CSA',
            value: ''
          }
        },
        {
          start: '2023-03-26T08:06:00.000Z',
          stop: '2023-03-26T08:30:00.000Z',
          title: 'Les enfants de Bohème',
          description: `Idi et Rita vivent chez leur grand-mère, Manie. Idi essaye de conserver les souvenirs qu’ils ont de leur mère, en dessinant sur son cahier d’école. Par la force de leur désir, les enfants gardent le lien qu’ils ont à leur drôle de maman, malgré la séparation.`,
          icon: 'https://thumb.canalplus.pro/http/unsafe/{resolutionXY}/filters:quality({imageQualityPercentage})/img-hapi.canalplus.pro:80/ServiceImage/ImageID/102124410',
          director: ['Judith Chemla'],
          actors: [
            'Ilion Thierrée',
            'Gloria Manca',
            'Yolande Moreau',
            'Judith Chemla',
          ],
          writer: [''],
          rating: {
            system: 'CSA',
            value: '-10'
          }
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', async () => {
    const content = fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json'))
    const result = await parser({ content })
    expect(result).toMatchObject([])
})
