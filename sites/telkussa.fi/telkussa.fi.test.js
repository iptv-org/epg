const { parser, url } = require('./telkussa.fi.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2023-11-30', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '88',
  xmltv_id: 'TV5.fi'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe('https://telkussa.fi/API/Channel/88/20231130')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'))
  const results = parser({ content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results[0]).toMatchObject({
    start: '2023-11-29T20:40:00.000Z',
    stop: '2023-11-29T23:20:00.000Z',
    title: 'The Suicide Squad: Suicide Mission',
    description:
      'SUOMEN TV-ENSI-ILTA Tervetuloa helvettiin - toisin sanoen Belle Reven vankilaan, missä henki on höllemmessä kuin missään muualla koko Amerikanmaalla. Missä pidetään pahimpia superroistoja ja missä ollaan valmiita tekemään mitä vain, jotta pääsisi pois - jopa liittymään supersalaiseen, superhämärään ryhmään nimeltä Task Force X. Ja mikä on päivän itsetuhoinen tehtävä? Kerää kokoon joukko vankeja, mukaan lukien Bloodsport, Peacemaker, Captain Boomerang, Ratcatcher 2, Savant, King Shark, Blackguard, Javelin ja kaikkien lempisekopää Harley Quinn. Anna heille raskas aseistus ja pudota heidät (kirjaimellisesti) Corto Maltesen syrjäiselle, vihollisia kuhisevalle saarelle. Halki viidakon, joka vilisee sotaisia vastustajia ja sissijoukkoja, ryhmä taivaltaa kohti tuhoamistehtäväänsä. Matkalla heitä kurissa yrittää pitää vain eversti Rick Flag… sekä Amanda Wallerin tekniikkavelhot, jotka antavat jatkuvasti ohjeita korvanappeihin. Ja kuten aina, yksikin väärä liike tietää kuolemaa (tuli se sitten vastustajan, toverin tai Wallerin itsensä toimesta). Jos joku haluaa lyödä vetoa, fiksuinta lienee veikata heitä vastaan - kaikkia heitä. 132 min. Ohjaus: James Gunn. Pääosissa: Margot Robbie, Idris Elba, John Cena, Joel Kinnaman ja Jai Courtney. (The Suicide Squad, Toiminta, Yhdysvallat, 2021)'
  })

  expect(results[31]).toMatchObject({
    start: '2023-12-01T03:25:00.000Z',
    stop: '2023-12-01T03:55:00.000Z',
    title: 'Asunnon metsästäjät',
    description:
      'Sarjassa sinkut, pariskunnat ja perheet etsivät uutta kotia asunnonvälittäjän avustuksella Yhdysvalloissa. .(House Hunters, Tosi-tv, Yhdysvallat, 2018) S148E02'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    content: '[]'
  })
  expect(result).toMatchObject([])
})
