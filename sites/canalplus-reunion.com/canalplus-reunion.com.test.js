// npx epg-grabber --config=sites/canalplus-reunion.com/canalplus-reunion.com.config.js --channels=sites/canalplus-reunion.com/canalplus-reunion.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./canalplus-reunion.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const channel = {
  site_id: '60243',
  xmltv_id: 'beINSports2France.fr'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/63001/channel/60243/events?filter.day=0'
  )
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/63001/channel/60243/events?filter.day=1'
  )
})

it('can parse response', done => {
  const content = `{
        "timeSlices": [
            {
                "contents": [
                    {
                        "title": "Almeria / Real Madrid",
                        "subtitle": "Football",
                        "thirdTitle": "BEIN SPORTS 2 HD",
                        "startTime": 1660780800,
                        "endTime": 1660788000,
                        "onClick": {
                            "displayTemplate": "miniDetail",
                            "displayName": "Almeria / Real Madrid",
                            "URLPage": "https://service.canal-overseas.com/ott-frontend/vector/63001/event/140382363",
                            "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/63001/program/224523053/recommendations"
                        },
                        "programID": 224523053,
                        "diffusionID": "140382363",
                        "URLImageDefault": "https://service.canal-overseas.com/image-api/v1/image/a6b640e16608ffa3d862e2bd8a4b3e4c",
                        "URLImage": "https://service.canal-overseas.com/image-api/v1/image/47000149dabce60d1769589c766aad20"
                    }
                ],
                "timeSlice": "4"
            }
        ]
    }`
  axios.get.mockImplementation(url => {
    if (url === 'https://service.canal-overseas.com/ott-frontend/vector/63001/event/140382363') {
      return Promise.resolve({
        data: JSON.parse(`{
                    "currentPage": {
                    "displayName": "Almeria / Real Madrid",
                    "displayTemplate": "detailPage",
                    "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/63001/program/224523053/recommendations"
                    },
                    "detail": {
                    "informations": {
                    "programmeType": "EPG",
                    "isInOffer": false,
                    "isInOfferOnDevice": false,
                    "isInOfferForD2G": false,
                    "availableInVoDOnDevice": false,
                    "availableInVoDOnG5": false,
                    "availableInD2GOnDevice": false,
                    "availableInLiveOnDevice": false,
                    "rediffusions": true,
                    "canBeRecorded": false,
                    "channelName": "BEIN SPORTS 2 HD",
                    "startTime": 1660780800,
                    "endTime": 1660788000,
                    "title": "Almeria / Real Madrid",
                    "subtitle": "Football",
                    "thirdTitle": "BEIN SPORTS 2 HD",
                    "genre": "Sport",
                    "subGenre": "Football",
                    "editorialTitle": "Sport, Espagne, 2h00",
                    "audioLanguage": "VF",
                    "summary": "Diffusion d'un match de LaLiga Santander, championnat d'Espagne de football, la plus haute compétition de football d'Espagne. Cette compétition professionnelle, placée sous la supervision de la Fédération espagnole de football, a été fondée en 1928 et s'appelle Primera Division jusqu'en 2008. Elle se nomme ensuite Liga BBVA jusqu'en 2016 puis LaLiga Santander depuis cette date.",
                    "summaryMedium": "Diffusion d'un match de LaLiga Santander, championnat d'Espagne de football, la plus haute compétition de football d'Espagne. Cette compétition professionnelle, placée sous la supervision de la Fédération espagnole de football, a été fondée en 1928 et s'appelle Primera Division jusqu'en 2008. Elle se nomme ensuite Liga BBVA jusqu'en 2016 puis LaLiga Santander depuis cette date.",
                    "programID": 224523053,
                    "sharingURL": "https://www.canalplus-reunion.com/grille-tv/event/140382363-almeria-real-madrid.html",
                    "EpgId": 60243,
                    "CSA": 1,
                    "HD": false,
                    "3D": false,
                    "diffusionID": "140382363",
                    "duration": "7200",
                    "URLImageDefault": "https://service.canal-overseas.com/image-api/v1/image/a6b640e16608ffa3d862e2bd8a4b3e4c",
                    "URLImage": "https://service.canal-overseas.com/image-api/v1/image/47000149dabce60d1769589c766aad20",
                    "URLLogo": "https://service.canal-overseas.com/image-api/v1/image/6e2124827406ed41236a8430352d4ed9",
                    "URLLogoBlack": "https://service.canal-overseas.com/image-api/v1/image/6e2124827406ed41236a8430352d4ed9",
                    "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/63001/program/224523053/recommendations"
                    },
                    "diffusions": [
                    {
                    "diffusionDateUTC": 1660780800,
                    "sharingUrl": "https://www.canalplus-reunion.com/grille-tv/event/140382363-almeria-real-madrid.html",
                    "broadcastId": "140382363",
                    "name": "BEIN SPORTS 2 HD",
                    "epgID": "60243",
                    "ZapNumber": "96",
                    "URLLogo": "https://service.canal-overseas.com/image-api/v1/image/6e2124827406ed41236a8430352d4ed9",
                    "URLLogoBlack": "https://service.canal-overseas.com/image-api/v1/image/6e2124827406ed41236a8430352d4ed9"
                    }
                    ]
                    }
                    }`)
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  parser({ content })
    .then(result => {
      result = result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2022-08-18T00:00:00.000Z',
          stop: '2022-08-18T02:00:00.000Z',
          title: 'Almeria / Real Madrid',
          icon: 'https://service.canal-overseas.com/image-api/v1/image/47000149dabce60d1769589c766aad20',
          category: 'Football',
          description:
            "Diffusion d'un match de LaLiga Santander, championnat d'Espagne de football, la plus haute compétition de football d'Espagne. Cette compétition professionnelle, placée sous la supervision de la Fédération espagnole de football, a été fondée en 1928 et s'appelle Primera Division jusqu'en 2008. Elle se nomme ensuite Liga BBVA jusqu'en 2016 puis LaLiga Santander depuis cette date."
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', done => {
  parser({
    content: `{"currentPage":{"displayTemplate":"error","BOName":"Page introuvable"},"title":"Page introuvable","text":"La page que vous demandez est introuvable. Si le problème persiste, vous pouvez contacter l'assistance de CANAL+/CANALSAT.","code":404}`
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
