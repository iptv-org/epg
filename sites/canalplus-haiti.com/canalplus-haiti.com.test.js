// [Geo-blocked] npm run channels:parse --config=./sites/canalplus-haiti.com/canalplus-haiti.com.config.js --output=./sites/canalplus-haiti.com/canalplus-haiti.com.channels.xml
// npx epg-grabber --config=sites/canalplus-haiti.com/canalplus-haiti.com.config.js --channels=sites/canalplus-haiti.com/canalplus-haiti.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./canalplus-haiti.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const channel = {
  site_id: '51006',
  xmltv_id: 'ViaATV.mq'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/53101/channel/51006/events?filter.day=0'
  )
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/53101/channel/51006/events?filter.day=1'
  )
})

it('can parse response', done => {
  const content = `{
        "timeSlices": [
            {
                "contents": [
                    {
                        "title": "New Amsterdam - S3 - Ep7",
                        "subtitle": "Episode 7 - Le mur de la honte",
                        "thirdTitle": "viaATV",
                        "startTime": 1660780500,
                        "endTime": 1660783200,
                        "onClick": {
                            "displayTemplate": "miniDetail",
                            "displayName": "New Amsterdam - S3 - Ep7",
                            "URLPage": "https://service.canal-overseas.com/ott-frontend/vector/53101/event/140952809",
                            "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/53101/program/187882282/recommendations"
                        },
                        "programID": 187882282,
                        "diffusionID": "140952809",
                        "URLImageDefault": "https://service.canal-overseas.com/image-api/v1/image/generic",
                        "URLImage": "https://service.canal-overseas.com/image-api/v1/image/52a18a209e28380b199201961c27097e"
                    }
                ],
                "timeSlice": "2"
            }
        ]
    }`
  axios.get.mockImplementation(url => {
    if (url === 'https://service.canal-overseas.com/ott-frontend/vector/53101/event/140952809') {
      return Promise.resolve({
        data: JSON.parse(`{
                    "currentPage": {
                    "displayName": "New Amsterdam - S3 - Ep7",
                    "displayTemplate": "detailPage",
                    "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/53101/program/187882282/recommendations"
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
                    "channelName": "viaATV",
                    "startTime": 1660780500,
                    "endTime": 1660783200,
                    "title": "New Amsterdam - S3 - Ep7",
                    "subtitle": "Episode 7 - Le mur de la honte",
                    "thirdTitle": "viaATV",
                    "genre": "Séries",
                    "subGenre": "Série Hôpital",
                    "editorialTitle": "Séries, Etats-Unis, 2020, 0h45",
                    "audioLanguage": "VF",
                    "personnalities": [
                    {
                    "prefix": "De :",
                    "content": "Darnell Martin"
                    },
                    {
                    "prefix": "Avec :",
                    "content": "André De Shields, Anna Suzuki, Anupam Kher, Baylen Thomas, Christine Chang, Craig Wedren, Daniel Dae Kim, Dierdre Friel, Em Grosland, Emma Ramos, Freema Agyeman, Gina Gershon, Graham Norris, Jamie Ann Romero, Janet Montgomery, Jefferson Friedman, Joshua Gitta, Kerry Flanagan, Larry Bryggman, Mike Doyle, Nora Clow, Opal Clow, Ryan Eggold, Simone Policano, Stephen Spinella, Tyler Labine"
                    }
                    ],
                    "summary": "C'est la journée nationale de dépistage du VIH et Max offre des soins gratuits à tous les malades séropositifs qui se présentent à New Amsterdam.",
                    "summaryMedium": "C'est la journée nationale de dépistage du VIH et Max offre des soins gratuits à tous les malades séropositifs qui se présentent à New Amsterdam.",
                    "programID": 187882282,
                    "sharingURL": "https://www.canalplus-haiti.com/grille-tv/event/140952809-new-amsterdam-s3-ep7.html",
                    "labels": {
                    "allocine": false,
                    "telerama": false,
                    "sensCritique": false
                    },
                    "EpgId": 51006,
                    "CSA": 1,
                    "HD": false,
                    "3D": false,
                    "diffusionID": "140952809",
                    "duration": "2700",
                    "URLImageDefault": "https://service.canal-overseas.com/image-api/v1/image/generic",
                    "URLImage": "https://service.canal-overseas.com/image-api/v1/image/52a18a209e28380b199201961c27097e",
                    "URLLogo": "https://service.canal-overseas.com/image-api/v1/image/0f67b2e85f74101c4c776cf423240fce",
                    "URLLogoBlack": "https://service.canal-overseas.com/image-api/v1/image/0f67b2e85f74101c4c776cf423240fce",
                    "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/53101/program/187882282/recommendations"
                    },
                    "diffusions": [
                    {
                    "diffusionDateUTC": 1660780500,
                    "sharingUrl": "https://www.canalplus-haiti.com/grille-tv/event/140952809-new-amsterdam.html",
                    "broadcastId": "140952809",
                    "name": "viaATV",
                    "epgID": "51006",
                    "ZapNumber": "28",
                    "URLLogo": "https://service.canal-overseas.com/image-api/v1/image/0f67b2e85f74101c4c776cf423240fce",
                    "URLLogoBlack": "https://service.canal-overseas.com/image-api/v1/image/0f67b2e85f74101c4c776cf423240fce"
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
          start: '2022-08-17T23:55:00.000Z',
          stop: '2022-08-18T00:40:00.000Z',
          title: 'New Amsterdam - S3 - Ep7',
          icon: 'https://service.canal-overseas.com/image-api/v1/image/52a18a209e28380b199201961c27097e',
          category: 'Série Hôpital',
          description:
            "C'est la journée nationale de dépistage du VIH et Max offre des soins gratuits à tous les malades séropositifs qui se présentent à New Amsterdam."
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
