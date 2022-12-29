// [Geo-blocked] node ./scripts/commands/parse-channels.js --config=./sites/canalplus-afrique.com/canalplus-afrique.com.config.js --output=./sites/canalplus-afrique.com/canalplus-afrique.com_bf.channels.xml --set=country:bf
// npx epg-grabber --config=sites/canalplus-afrique.com/canalplus-afrique.com.config.js --channels=sites/canalplus-afrique.com/canalplus-afrique.com_bf.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./canalplus-afrique.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const channel = {
  site_id: '80759',
  xmltv_id: 'Animaux.fr'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/83001/channel/80759/events?filter.day=0'
  )
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/83001/channel/80759/events?filter.day=1'
  )
})

it('can parse response', done => {
  const content = `{"timeSlices":[{"contents":[{"title":"A petit pas","subtitle":"Episode 1 - La naissance","thirdTitle":"ANIMAUX","startTime":1660794900,"endTime":1660797900,"onClick":{"displayTemplate":"miniDetail","displayName":"A petit pas","URLPage":"https://service.canal-overseas.com/ott-frontend/vector/83001/event/140280189","URLVitrine":"https://service.canal-overseas.com/ott-frontend/vector/83001/program/104991257/recommendations"},"programID":104991257,"diffusionID":"140280189","URLImageDefault":"https://service.canal-overseas.com/image-api/v1/image/generic","URLImage":"https://service.canal-overseas.com/image-api/v1/image/7dedf4a579b66153a1988637e9e023f5"}],"timeSlice":"1"}]}`
  axios.get.mockImplementation(url => {
    if (url === 'https://service.canal-overseas.com/ott-frontend/vector/83001/event/140280189') {
      return Promise.resolve({
        data: JSON.parse(`{
            "currentPage": {
            "displayName": "A petit pas",
            "displayTemplate": "detailPage",
            "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/83001/program/104991257/recommendations"
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
            "channelName": "ANIMAUX",
            "startTime": 1660794900,
            "endTime": 1660797900,
            "title": "A petit pas",
            "subtitle": "Episode 1 - La naissance",
            "thirdTitle": "ANIMAUX",
            "genre": "Découverte",
            "subGenre": "Doc. Animalier",
            "editorialTitle": "Découverte, France, 2013, 0h50",
            "audioLanguage": "VF",
            "personnalities": [
            {
            "prefix": "De :",
            "content": "Emilie Fertil"
            }
            ],
            "summary": "Suivi pendant une année entière de trois bébés animaux, un border collie, un poulain et un lémurien, prédestinés par leur maître à devenir de véritables champions.",
            "summaryMedium": "Suivi pendant une année entière de trois bébés animaux, un border collie, un poulain et un lémurien, prédestinés par leur maître à devenir de véritables champions.",
            "programID": 104991257,
            "sharingURL": "https://www.canalplus-afrique.com/grille-tv/event/140280189-a-petit-pas.html",
            "EpgId": 80759,
            "CSA": 1,
            "HD": false,
            "3D": false,
            "diffusionID": "140280189",
            "duration": "3000",
            "URLImageDefault": "https://service.canal-overseas.com/image-api/v1/image/generic",
            "URLImage": "https://service.canal-overseas.com/image-api/v1/image/7dedf4a579b66153a1988637e9e023f5",
            "URLLogo": "https://service.canal-overseas.com/image-api/v1/image/9d91bf8d25632e77d004cf5b84f296b1",
            "URLLogoBlack": "https://service.canal-overseas.com/image-api/v1/image/9d91bf8d25632e77d004cf5b84f296b1",
            "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/83001/program/104991257/recommendations"
            },
            "diffusions": [
            {
            "diffusionDateUTC": 1660794900,
            "sharingUrl": "https://www.canalplus-afrique.com/grille-tv/event/140280189-a-petit-pas.html",
            "broadcastId": "140280189",
            "name": "ANIMAUX",
            "epgID": "80759",
            "ZapNumber": "161",
            "URLLogo": "https://service.canal-overseas.com/image-api/v1/image/9d91bf8d25632e77d004cf5b84f296b1",
            "URLLogoBlack": "https://service.canal-overseas.com/image-api/v1/image/9d91bf8d25632e77d004cf5b84f296b1"
            },
            {
            "diffusionDateUTC": 1661475600,
            "sharingUrl": "https://www.canalplus-afrique.com/grille-tv/event/141170299-a-petit-pas.html",
            "broadcastId": "141170299",
            "name": "ANIMAUX",
            "epgID": "80759",
            "ZapNumber": "161",
            "URLLogo": "https://service.canal-overseas.com/image-api/v1/image/9d91bf8d25632e77d004cf5b84f296b1",
            "URLLogoBlack": "https://service.canal-overseas.com/image-api/v1/image/9d91bf8d25632e77d004cf5b84f296b1"
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
          start: '2022-08-18T03:55:00.000Z',
          stop: '2022-08-18T04:45:00.000Z',
          title: 'A petit pas',
          icon: 'https://service.canal-overseas.com/image-api/v1/image/7dedf4a579b66153a1988637e9e023f5',
          category: 'Doc. Animalier',
          description:
            'Suivi pendant une année entière de trois bébés animaux, un border collie, un poulain et un lémurien, prédestinés par leur maître à devenir de véritables champions.'
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
