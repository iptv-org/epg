// npm run channels:parse -- --config=./sites/canalplus.com/canalplus.com.config.js --output=./sites/canalplus.com/canalplus.com.channels.xml
// npx epg-grabber --config=sites/canalplus.com/canalplus.com.config.js --channels=sites/canalplus.com/canalplus.com.channels.xml --output=guide.xml

const { parser, url } = require('./canalplus.com.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)
jest.mock('axios')

const channel = {
  site_id: 'bi#198',
  xmltv_id: 'CanalPlusCinemaFrance.fr'
}

it('can generate valid url for today', done => {
  axios.get.mockImplementation(url => {
    if (url === 'https://www.canalplus.com/bi/programme-tv/') {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/programme-tv.html'))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  const today = dayjs.utc().startOf('d')
  url({ channel, date: today })
    .then(result => {
      expect(result).toBe(
        'https://hodor.canalplus.pro/api/v2/mycanal/channels/f000c6f4ebf44647682b3a0fa66d7d99/198/broadcasts/day/0'
      )
      done()
    })
    .catch(done)
})

it('can generate valid url for tomorrow', done => {
  axios.get.mockImplementation(url => {
    if (url === 'https://www.canalplus.com/bi/programme-tv/') {
      return Promise.resolve({
        data: fs.readFileSync(path.resolve(__dirname, '__data__/programme-tv.html'))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  const tomorrow = dayjs.utc().startOf('d').add(1, 'd')
  url({ channel, date: tomorrow })
    .then(result => {
      expect(result).toBe(
        'https://hodor.canalplus.pro/api/v2/mycanal/channels/f000c6f4ebf44647682b3a0fa66d7d99/198/broadcasts/day/1'
      )
      done()
    })
    .catch(done)
})

it('can parse response', done => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  axios.get.mockImplementation(url => {
    if (
      url ===
      'https://hodor.canalplus.pro/api/v2/mycanal/detail/f000c6f4ebf44647682b3a0fa66d7d99/okapi/6564630_50001.json?detailType=detailSeason&objectType=season&broadcastID=PLM_1196447642&episodeId=20482220_50001&brandID=4501558_50001&fromDiff=true'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/program1.json')))
      })
    } else if (
      url ===
      'https://hodor.canalplus.pro/api/v2/mycanal/detail/f000c6f4ebf44647682b3a0fa66d7d99/okapi/17230453_50001.json?detailType=detailPage&objectType=unit&broadcastID=PLM_1196447637&fromDiff=true'
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
          start: '2023-01-12T06:28:00.000Z',
          stop: '2023-01-12T12:06:00.000Z',
          title: 'Le cercle',
          description: `Tant qu'il y aura du cinéma, LE CERCLE sera là. C'est la seule émission télévisée de débats critiques 100% consacrée au cinéma et elle rentre dans sa 18e saison. Chaque semaine, elle offre des joutes enflammées, joyeuses et sans condescendance, sur les films à l'affiche ; et invite avec \"Le questionnaire du CERCLE\" les réalisatrices et réalisateurs à venir partager leur passion cinéphile.`,
          icon: 'https://thumb.canalplus.pro/http/unsafe/{resolutionXY}/filters:quality({imageQualityPercentage})/img-hapi.canalplus.pro:80/ServiceImage/ImageID/107297573',
          presenter: ['Lily Bloom'],
          rating: {
            system: 'CSA',
            value: '-10'
          }
        },
        {
          start: '2023-01-12T12:06:00.000Z',
          stop: '2023-01-12T13:06:00.000Z',
          title: 'Illusions perdues',
          description: `Pendant la Restauration, Lucien de Rubempré, jeune provincial d'Angoulême, se rêve poète. Il débarque à Paris en quête de gloire. Il a le soutien de Louise de Bargeton, une aristocrate qui croit en son talent. Pour gagner sa vie, Lucien trouve un emploi dans le journal dirigé par le peu scrupuleux Etienne Lousteau...`,
          icon: 'https://thumb.canalplus.pro/http/unsafe/{resolutionXY}/filters:quality({imageQualityPercentage})/img-hapi.canalplus.pro:80/ServiceImage/ImageID/107356485',
          director: ['Xavier Giannoli'],
          actors: [
            'Benjamin Voisin',
            'Cécile de France',
            'Vincent Lacoste',
            'Xavier Dolan',
            'Gérard Depardieu',
            'Salomé Dewaels',
            'Jeanne Balibar',
            'Louis-Do de Lencquesaing',
            'Alexis Barbosa',
            'Jean-François Stévenin',
            'André Marcon',
            'Marie Cornillon'
          ],
          writer: ['Xavier Giannoli'],
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
