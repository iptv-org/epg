const { parser, url, request } = require('./programme-tv.vini.pf.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2021-11-21', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'tf1',
  xmltv_id: 'TF1.fr'
}

it('can generate valid url', () => {
  expect(url).toBe('https://programme-tv.vini.pf/programmesJSON')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request data', () => {
  expect(request.data({ date })).toMatchObject({ dateDebut: '2021-11-20T14:00:00-10:00' })
})

it('can parse response', done => {
  axios.post.mockImplementation((url, data) => {
    if (data.dateDebut === '2021-11-20T16:00:00-10:00') {
      return Promise.resolve({
        data: Buffer.from(fs.readFileSync(path.resolve(__dirname, '__data__/content_1.json')))
      })
    } else {
      return Promise.resolve({
        data: Buffer.from(fs.readFileSync(path.resolve(__dirname, '__data__/content_2.json')))
    })
  }
})

  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))

  parser({ content, channel, date })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })
      expect(result).toMatchObject([
        {
          start: '2021-11-20T23:50:00.000Z',
          stop: '2021-11-21T01:10:00.000Z',
          title: 'Reportages découverte',
          category: 'Magazine',
          description:
            "Pour faire face à la crise du logement, aux loyers toujours plus élevés, à la solitude ou pour les gardes d'enfants, les colocations ont le vent en poupe, Pour mieux comprendre ce nouveau phénomène, une équipe a partagé le quotidien de quatre foyers : une retraitée qui héberge des étudiants, des mamans solos, enceintes, qui partagent un appartement associatif, trois générations de la même famille sur un domaine viticole et une étudiante qui intègre une colocation XXL.",
          image:
            'https://programme-tv.vini.pf/sites/default/files/img-icones/52ada51ed86b7e7bc11eaee83ff2192785989d77.jpg'
        },
        {
          start: '2021-11-21T01:10:00.000Z',
          stop: '2021-11-21T02:30:00.000Z',
          title: 'Les docs du week-end',
          category: 'Magazine',
          description:
            'Un documentaire français réalisé en 2019, Cindy Sander, Myriam Abel, Mario, Michal ou encore Magali Vaé ont fait les grandes heures des premières émissions de télécrochet modernes, dans les années 2000, Des années après leur passage, que reste-t-il de leur notoriété ? Comment ces candidats ont-ils vécu leur soudaine médiatisation ? Quels rapports entretenaient-ils avec les autres participants et les membres du jury, souvent intransigeants ?',
          image:
            'https://programme-tv.vini.pf/sites/default/files/img-icones/6e64cfbc55c1f4cbd11e3011401403d4dc08c6d2.jpg'
        },
        {
          start: '2021-11-21T02:30:00.000Z',
          stop: '2021-11-21T03:45:00.000Z',
          title: '50mn Inside',
          category: 'Magazine',
          description:
            "50'INSIDE, c'est toute l'actualité des stars résumée, chaque samedi, Le rendez-vous glamour pour retrouver toujours,,",
          image:
            'https://programme-tv.vini.pf/sites/default/files/img-icones/3d7e252312dacb5fb7a1a786fa0022ca1be15499.jpg'
        }
      ])
      done()
    })
    .catch(err => {
      done(err)
    })
})

it('can handle empty guide', done => {
  parser({
    date,
    channel,
    content:
      ''
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(err => {
      done(err)
    })
})
