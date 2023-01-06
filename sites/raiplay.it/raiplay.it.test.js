// npx epg-grabber --config=sites/raiplay.it/raiplay.it.config.js --channels=sites/raiplay.it/raiplay.it.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./raiplay.it.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-05-03', 'YYYY-MM-DD')
const channel = {
  site_id: 'rai-2',
  xmltv_id: 'Rai2.it'
}

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.raiplay.it/palinsesto/app/rai-2/03-05-2022.json')
})

it('can parse response', () => {
  const content = `{  "id": "Page-e120a813-1b92-4057-a214-15943d95aa68",  "title": "Pagina Palinsesto",  "channel": "Rai 2",  "date": "03-05-2022",  "events": [    {      "id": "ContentItem-2f81030d-803b-456a-9ea5-40233234fd9d",      "name": "The Good Doctor S3E5 - La prima volta",      "episode_title": "La prima volta",      "episode": "5",      "season": "3",  "description": "Shaun affronta il suo primo intervento. Il caso si rivela complicato e, nonostante Shaun abbia un'idea geniale, sarà Andrews a portare a termine l'operazione.",      "channel": "Rai 2",      "date": "03/05/2022",      "hour": "19:40",      "duration": "00:50:00",      "duration_in_minutes": "50 min",      "path_id": "",      "weblink": "",      "event_weblink": "/dirette/rai2/The-Good-Doctor-S3E5---La-prima-volta-2f81030d-803b-456a-9ea5-40233234fd9d.html",      "has_video": false,      "image": "/dl/img/2020/03/09/1583748471860_dddddd.jpg",      "playlist_id": "11430689",      "program": {        "name": "The Good Doctor",        "path_id": "/programmi/thegooddoctor.json",        "info_url": "/programmi/info/757edeac-6fff-4dea-afcd-0bcb39f9ea83.json",        "weblink": "/programmi/thegooddoctor"      }    }  ],  "track_info": {    "id": "",    "domain": "raiplay",    "platform": "[platform]",    "media_type": "",    "page_type": "",    "editor": "raiplay",    "year": "2019",    "edit_year": "",    "section": "guida tv",    "sub_section": "rai 2",    "content": "guida tv",    "title": "",    "channel": "",    "date": "2019-09-08",    "typology": "",    "genres": [],    "sub_genres": [],    "program_title": "",    "program_typology": "",    "program_genres": [],    "program_sub_genres": [],    "edition": "",    "season": "",    "episode_number": "",    "episode_title": "",    "form": "",    "listaDateMo": [],    "dfp": {}  }}`
  const result = parser({ content, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-05-03T17:40:00.000Z',
      stop: '2022-05-03T18:30:00.000Z',
      title: 'The Good Doctor S3E5 - La prima volta',
      description:
        "Shaun affronta il suo primo intervento. Il caso si rivela complicato e, nonostante Shaun abbia un'idea geniale, sarà Andrews a portare a termine l'operazione.",
      season: '3',
      episode: '5',
      sub_title: 'La prima volta',
      icon: 'https://www.raiplay.it/dl/img/2020/03/09/1583748471860_dddddd.jpg',
      url: 'https://www.raiplay.it/dirette/rai2/The-Good-Doctor-S3E5---La-prima-volta-2f81030d-803b-456a-9ea5-40233234fd9d.html'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    content: `{"events":[],"total":0}`
  })
  expect(result).toMatchObject([])
})
