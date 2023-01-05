// node ./scripts/channels.js --config=./sites/programme-tv.vini.pf/programme-tv.vini.pf.config.js --output=./sites/programme-tv.vini.pf/programme-tv.vini.pf.channels.xml
// npx epg-grabber --config=sites/programme-tv.vini.pf/programme-tv.vini.pf.config.js --channels=sites/programme-tv.vini.pf/programme-tv.vini.pf.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./programme-tv.vini.pf.config.js')
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
        data: Buffer.from(
          `{"programmes":[{"nid":"8857261","src":"https:\/\/programme-tv.vini.pf\/sites\/default\/files\/img-icones\/192.png","alt":"","title":"","url":"\/tf1","programmes":[{"nidP":"24162437","categorieP":"Magazine","categorieTIDP":"1033","episodeP":"-1","titreP":"Les docs du week-end","heureP":"15:10","timestampDeb":1637457000,"timestampFin":1637461800,"altP":"","titleP":"","legendeP":"Que sont-ils devenus ? L'incroyable destin des stars des émissions de télécrochet","desc":"Un documentaire français réalisé en 2019, Cindy Sander, Myriam Abel, Mario, Michal ou encore Magali Vaé ont fait les grandes heures des premières émissions de télécrochet modernes, dans les années 2000, Des années après leur passage, que reste-t-il de leur notoriété ? Comment ces candidats ont-ils vécu leur soudaine médiatisation ? Quels rapports entretenaient-ils avec les autres participants et les membres du jury, souvent intransigeants ?","srcP":"https:\/\/programme-tv.vini.pf\/sites\/default\/files\/img-icones\/6e64cfbc55c1f4cbd11e3011401403d4dc08c6d2.jpg","urlP":"\/les-docs-du-week-end-20112021-1510","width":25,"active":false,"progression":0,"test":0,"nowphp":1637509998},{"nidP":"24162438","categorieP":"Magazine","categorieTIDP":"1033","episodeP":"-1","titreP":"50mn Inside","heureP":"16:30","timestampDeb":1637461800,"timestampFin":1637466300,"altP":"","titleP":"","legendeP":"L'actu","desc":"50'INSIDE, c'est toute l'actualité des stars résumée, chaque samedi, Le rendez-vous glamour pour retrouver toujours,,","srcP":"https:\/\/programme-tv.vini.pf\/sites\/default\/files\/img-icones\/3d7e252312dacb5fb7a1a786fa0022ca1be15499.jpg","urlP":"\/50mn-inside-20112021-1630","width":62.5,"active":false,"progression":0,"test":0,"nowphp":1637509998}]}]}`
        )
      })
    } else {
      return Promise.resolve({
        data: Buffer.from(
          `{"programmes":[{"nid":"8857261","src":"https:\/\/programme-tv.vini.pf\/sites\/default\/files\/img-icones\/192.png","alt":"","title":"","url":"\/tf1","programmes":[]}]}`
        )
      })
    }
  })

  const content = `{"programmes":[{"nid":"8857261","src":"https:\/\/programme-tv.vini.pf\/sites\/default\/files\/img-icones\/192.png","alt":"","title":"","url":"\/tf1","programmes":[{"nidP":"24162436","categorieP":"Magazine","categorieTIDP":"1033","episodeP":"-1","titreP":"Reportages découverte","heureP":"13:50","timestampDeb":1637452200,"timestampFin":1637457000,"altP":"","titleP":"","legendeP":"La coloc ne connaît pas la crise","desc":"Pour faire face à la crise du logement, aux loyers toujours plus élevés, à la solitude ou pour les gardes d'enfants, les colocations ont le vent en poupe, Pour mieux comprendre ce nouveau phénomène, une équipe a partagé le quotidien de quatre foyers : une retraitée qui héberge des étudiants, des mamans solos, enceintes, qui partagent un appartement associatif, trois générations de la même famille sur un domaine viticole et une étudiante qui intègre une colocation XXL.","srcP":"https:\/\/programme-tv.vini.pf\/sites\/default\/files\/img-icones\/52ada51ed86b7e7bc11eaee83ff2192785989d77.jpg","urlP":"\/reportages-decouverte-20112021-1350","width":58.333333333333,"active":false,"progression":0,"test":0,"nowphp":1637509179},{"nidP":"24162437","categorieP":"Magazine","categorieTIDP":"1033","episodeP":"-1","titreP":"Les docs du week-end","heureP":"15:10","timestampDeb":1637457000,"timestampFin":1637461800,"altP":"","titleP":"","legendeP":"Que sont-ils devenus ? L'incroyable destin des stars des émissions de télécrochet","desc":"Un documentaire français réalisé en 2019, Cindy Sander, Myriam Abel, Mario, Michal ou encore Magali Vaé ont fait les grandes heures des premières émissions de télécrochet modernes, dans les années 2000, Des années après leur passage, que reste-t-il de leur notoriété ? Comment ces candidats ont-ils vécu leur soudaine médiatisation ? Quels rapports entretenaient-ils avec les autres participants et les membres du jury, souvent intransigeants ?","srcP":"https:\/\/programme-tv.vini.pf\/sites\/default\/files\/img-icones\/6e64cfbc55c1f4cbd11e3011401403d4dc08c6d2.jpg","urlP":"\/les-docs-du-week-end-20112021-1510","width":41.666666666667,"active":false,"progression":0,"test":0,"nowphp":1637509179}]}]}`

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
          title: `Reportages découverte`,
          category: 'Magazine',
          description: `Pour faire face à la crise du logement, aux loyers toujours plus élevés, à la solitude ou pour les gardes d'enfants, les colocations ont le vent en poupe, Pour mieux comprendre ce nouveau phénomène, une équipe a partagé le quotidien de quatre foyers : une retraitée qui héberge des étudiants, des mamans solos, enceintes, qui partagent un appartement associatif, trois générations de la même famille sur un domaine viticole et une étudiante qui intègre une colocation XXL.`,
          icon: 'https://programme-tv.vini.pf/sites/default/files/img-icones/52ada51ed86b7e7bc11eaee83ff2192785989d77.jpg'
        },
        {
          start: '2021-11-21T01:10:00.000Z',
          stop: '2021-11-21T02:30:00.000Z',
          title: `Les docs du week-end`,
          category: 'Magazine',
          description: `Un documentaire français réalisé en 2019, Cindy Sander, Myriam Abel, Mario, Michal ou encore Magali Vaé ont fait les grandes heures des premières émissions de télécrochet modernes, dans les années 2000, Des années après leur passage, que reste-t-il de leur notoriété ? Comment ces candidats ont-ils vécu leur soudaine médiatisation ? Quels rapports entretenaient-ils avec les autres participants et les membres du jury, souvent intransigeants ?`,
          icon: 'https://programme-tv.vini.pf/sites/default/files/img-icones/6e64cfbc55c1f4cbd11e3011401403d4dc08c6d2.jpg'
        },
        {
          start: '2021-11-21T02:30:00.000Z',
          stop: '2021-11-21T03:45:00.000Z',
          title: `50mn Inside`,
          category: 'Magazine',
          description: `50'INSIDE, c'est toute l'actualité des stars résumée, chaque samedi, Le rendez-vous glamour pour retrouver toujours,,`,
          icon: 'https://programme-tv.vini.pf/sites/default/files/img-icones/3d7e252312dacb5fb7a1a786fa0022ca1be15499.jpg'
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
    content: `{"programmes":[{"nid":"8857261","src":"https:\/\/programme-tv.vini.pf\/sites\/default\/files\/img-icones\/192.png","alt":"","title":"","url":"\/tf1","programmes":[]}]}`
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(err => {
      done(err)
    })
})
