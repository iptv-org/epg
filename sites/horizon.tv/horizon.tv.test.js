const { parser, url } = require('./horizon.tv.config.js')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2023-02-07', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '10024',
  xmltv_id: 'AMCCzechRepublic.cz'
}

it('can generate valid url', () => {
  expect(url({ date, channel })).toBe(
    'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/programschedules/20230207/1'
  )
})

it('can parse response', done => {
  const content = JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8'))

  axios.get.mockImplementation(url => {
    if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/programschedules/20230207/2'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content_1.json'), 'utf8'))
      })
    } else if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/programschedules/20230207/3'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content_2.json'), 'utf8'))
      })
    } else if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/programschedules/20230207/4'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content_3.json'), 'utf8'))
      })
    } else if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/listings/crid:~~2F~~2Fport.cs~~2F122941980,imi:7ca159c917344e0dd3fbe1cd8db5ff8043d96a78'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content_listings_1.json'), 'utf8'))
      })
    } else if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/listings/crid:~~2F~~2Fport.cs~~2F248281986,imi:e85129f9d1e211406a521df7a36f22237c22651b'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content_listings_2.json'), 'utf8'))
      })
    } else if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/listings/crid:~~2F~~2Fport.cs~~2F1379541,imi:5f806a2a0bc13e9745e14907a27116c60ea2c6ad'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content_listings_3.json'), 'utf8'))
      })
    } else if (
      url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/listings/crid:~~2F~~2Fport.cs~~2F71927954,imi:f1b4b0285b72cf44cba74e1c62322a4c682385c7'
    ) {
      return Promise.resolve({
        data: JSON.parse(fs.readFileSync(path.resolve(__dirname, '__data__/content_listings_4.json'), 'utf8'))
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  parser({ content, channel, date })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2023-02-06T21:35:00.000Z',
          stop: '2023-02-06T23:05:00.000Z',
          title: 'Avengement',
          description:
            'Během propustky z vězení za účelem návštěvy umírající matky v nemocnici zločinec Cain Burgess (Scott Adkins) unikne svým dozorcům a mizí v ulicích Londýna. Jde o epickou cestu krve a bolesti za dosažením vytoužené pomsty na těch, kteří z něj udělali chladnokrevného vraha.',
          category: ['Drama', 'Akcia'],
          directors: ['Jesse V. Johnson'],
          actors: [
            'Scott Adkins',
            'Craig Fairbrass',
            'Thomas Turgoose',
            'Nick Moran',
            'Kierston Wareing',
            'Leo Gregory',
            'Mark Strange',
            'Luke LaFontaine',
            'Beau Fowler',
            'Dan Styles',
            'Christopher Sciueref',
            'Matt Routledge',
            'Jane Thorne',
            'Louis Mandylor',
            'Terence Maynard',
            'Greg Burridge',
            'Michael Higgs',
            'Damian Gallagher',
            'Daniel Adegboyega',
            'John Ioannou',
            'Sofie Golding-Spittle',
            'Joe Egan',
            'Darren Swain',
            'Lee Charles',
            'Dominic Kinnaird',
            "Ross O'Hennessy",
            'Teresa Mahoney',
            'Andrew Dunkelberger',
            'Sam Hardy',
            'Ivan Moy',
            'Mark Sears',
            'Phillip Ray Tommy'
          ],
          date: '2019'
        },
        {
          start: '2023-02-07T04:35:00.000Z',
          stop: '2023-02-07T05:00:00.000Z',
          title: 'Zoom In',
          description: 'Film/Kino',
          category: ['Hudba a umenie', 'Film'],
          date: '2010'
        },
        {
          start: '2023-02-07T09:10:00.000Z',
          stop: '2023-02-07T11:00:00.000Z',
          title: 'Studentka',
          description:
            'Ambiciózní vysokoškolačka Valentina (Sophie Marceau) studuje literaturu na pařížské Sorbonně a právě se připravuje k závěrečným zkouškám. Žádný odpočinek, žádné volno, žádné večírky, téměř žádný spánek a především a hlavně ... žádná láska! Věří, že jedině tak obstojí před zkušební komisí. Jednoho dne se však odehraje něco, s čím nepočítala. Potká charismatického hudebníka Neda - a bláznivě se zamiluje. V tuto chvíli stojí před osudovým rozhodnutím: zahodí roky obrovského studijního nasazení, nebo odmítne lásku? Nebo se snad dá obojí skloubit dohromady?',
          category: ['Film', 'Komédia'],
          actors: [
            'Sophie Marceauová',
            'Vincent Lindon',
            'Elisabeth Vitali',
            'Elena Pompei',
            'Jean-Claude Leguay',
            'Brigitte Chamarande',
            'Christian Pereira',
            'Gérard Dacier',
            'Roberto Attias',
            'Beppe Chierici',
            'Nathalie Mann',
            'Anne Macina',
            'Janine Souchon',
            'Virginie Demians',
            'Hugues Leforestier',
            'Jacqueline Noëlle',
            'Marc-André Brunet',
            'Isabelle Caubère',
            'André Chazel',
            'Med Salah Cheurfi',
            'Guillaume Corea',
            'Eric Denize',
            'Gilles Gaston-Dreyfuss',
            'Benoît Gourley',
            'Marc Innocenti',
            'Najim Laouriga',
            'Laurent Ledermann',
            'Philippe Maygal',
            'Dominique Pifarely',
            'Ysé Tran'
          ],
          directors: ['Francis De Gueltz', 'Dominique Talmon', 'Claude Pinoteau'],
          date: '1988'
        },
        {
          start: '2023-02-07T16:05:00.000Z',
          stop: '2023-02-07T17:45:00.000Z',
          title: 'Zilionáři',
          description:
            'David (Zach Galifianakis) je nekomplikovaný muž, který uvízl v monotónním životě. Den co den usedá za volant svého obrněného automobilu, aby odvážel obrovské sumy peněz jiných lidí. Jediným vzrušujícím momentem v jeho životě je flirtování s kolegyní Kelly (Kristen Wiig), která ho však brzy zatáhne do těžko uvěřitelného dobrodružství. Skupinka nepříliš inteligentních loserů, pod vedením Steva (Owen Wilson), plánuje vyloupit banku a David jim v tom má samozřejmě pomoci. Navzdory absolutně amatérskému plánu se ale stane nemožné a oni mají najednou v kapse 17 miliónů dolarů. A protože tato partička je opravdu bláznivá, začne je hned ve velkém roztáčet. Peníze létají vzduchem za luxusní a kolikrát i zbytečné věci, ale nedochází jim, že pro policii tak zanechávají jasné stopy...',
          category: ['Drama', 'Akcia'],
          actors: [
            'Zach Galifianakis',
            'Kristen Wiigová',
            'Owen Wilson',
            'Kate McKinnon',
            'Leslie Jones',
            'Jason Sudeikis',
            'Ross Kimball',
            'Devin Ratray',
            'Mary Elizabeth Ellisová',
            'Jon Daly',
            'Ken Marino',
            'Daniel Zacapa',
            'Tom Werme',
            'Njema Williams',
            'Nils Cruz',
            'Michael Fraguada',
            'Christian Gonzalez',
            'Candace Blanchard',
            'Karsten Friske',
            'Dallas Edwards',
            'Barry Ratcliffe',
            'Shelton Grant',
            'Laura Palka',
            'Reegus Flenory',
            'Wynn Reichert',
            'Jill Jane Clements',
            'Joseph S. Wilson',
            'Jee An',
            'Rhoda Griffisová',
            'Nicole Dupre Sobchack'
          ],
          directors: [
            'Scott August',
            'Richard L. Fox',
            'Michelle Malley-Campos',
            'Sebastian Mazzola',
            'Steven Ritzi',
            'Pete Waterman',
            'Jared Hess'
          ],
          date: '2016'
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', done => {
  parser({
    content: fs.readFileSync(path.resolve(__dirname, '__data__/no_content.json')),
    channel,
    date
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
