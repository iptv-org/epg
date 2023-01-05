// [Geo-blocked] node ./scripts/channels.js --config=./sites/canalplus-caraibes.com/canalplus-caraibes.com.config.js --output=./sites/canalplus-caraibes.com/canalplus-caraibes.com.channels.xml
// npx epg-grabber --config=sites/canalplus-caraibes.com/canalplus-caraibes.com.config.js --channels=sites/canalplus-caraibes.com/canalplus-caraibes.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./canalplus-caraibes.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const channel = {
  site_id: '50115',
  xmltv_id: 'beINSports1France.fr'
}

it('can generate valid url for today', () => {
  const date = dayjs.utc().startOf('d')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/53001/channel/50115/events?filter.day=0'
  )
})

it('can generate valid url for tomorrow', () => {
  const date = dayjs.utc().startOf('d').add(1, 'd')
  expect(url({ channel, date })).toBe(
    'https://service.canal-overseas.com/ott-frontend/vector/53001/channel/50115/events?filter.day=1'
  )
})

it('can parse response', done => {
  const content = `{"timeSlices":[{"contents":[{"title":"Rugby - Leinster / La Rochelle","subtitle":"Rugby","thirdTitle":"BEIN SPORTS 1 HD","startTime":1660815000,"endTime":1660816800,"onClick":{"displayTemplate":"miniDetail","displayName":"Rugby - Leinster / La Rochelle","URLPage":"https://service.canal-overseas.com/ott-frontend/vector/53001/event/140377765","URLVitrine":"https://service.canal-overseas.com/ott-frontend/vector/53001/program/224515801/recommendations"},"programID":224515801,"diffusionID":"140377765","URLImageDefault":"https://service.canal-overseas.com/image-api/v1/image/75fca4586fdc3458930dd1ab6fc2e643","URLImage":"https://service.canal-overseas.com/image-api/v1/image/7854e20fb6efecd398598653c57cc771"}],"timeSlice":"4"}]}`
  axios.get.mockImplementation(url => {
    if (url === 'https://service.canal-overseas.com/ott-frontend/vector/53001/event/140377765') {
      return Promise.resolve({
        data: JSON.parse(`{
                    "currentPage": {
                    "displayName": "Rugby - Leinster / La Rochelle",
                    "displayTemplate": "detailPage",
                    "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/53001/program/224515801/recommendations"
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
                    "channelName": "BEIN SPORTS 1 HD",
                    "startTime": 1660815000,
                    "endTime": 1660816800,
                    "title": "Rugby - Leinster / La Rochelle",
                    "subtitle": "Rugby",
                    "thirdTitle": "BEIN SPORTS 1 HD",
                    "genre": "Sport",
                    "subGenre": "Rugby",
                    "editorialTitle": "Sport, France, 0h30",
                    "audioLanguage": "VF",
                    "summary": "Retransmission d'un match de Champions Cup de rugby à XV. L'European Rugby Champions Cup est une compétition annuelle interclubs de rugby à XV disputée par les meilleures équipes en Europe. Jusqu'en 2014, cette compétition s'appelait Heineken Cup, ou H Cup, et était sous l'égide de l'ERC, et depuis cette date l'EPRC lui a succédé. La première édition s'est déroulée en 1995.",
                    "summaryMedium": "Retransmission d'un match de Champions Cup de rugby à XV. L'European Rugby Champions Cup est une compétition annuelle interclubs de rugby à XV disputée par les meilleures équipes en Europe. Jusqu'en 2014, cette compétition s'appelait Heineken Cup, ou H Cup, et était sous l'égide de l'ERC, et depuis cette date l'EPRC lui a succédé. La première édition s'est déroulée en 1995.",
                    "programID": 224515801,
                    "sharingURL": "https://www.canalplus-caraibes.com/grille-tv/event/140377765-rugby-leinster-la-rochelle.html",
                    "EpgId": 50115,
                    "CSA": 1,
                    "HD": false,
                    "3D": false,
                    "diffusionID": "140377765",
                    "duration": "1800",
                    "URLImageDefault": "https://service.canal-overseas.com/image-api/v1/image/75fca4586fdc3458930dd1ab6fc2e643",
                    "URLImage": "https://service.canal-overseas.com/image-api/v1/image/7854e20fb6efecd398598653c57cc771",
                    "URLLogo": "https://service.canal-overseas.com/image-api/v1/image/4e121baf92f46b2df622c6d4f9cebf8e",
                    "URLLogoBlack": "https://service.canal-overseas.com/image-api/v1/image/4e121baf92f46b2df622c6d4f9cebf8e",
                    "URLVitrine": "https://service.canal-overseas.com/ott-frontend/vector/53001/program/224515801/recommendations"
                    },
                    "diffusions": [
                    {
                    "diffusionDateUTC": 1660815000,
                    "sharingUrl": "https://www.canalplus-caraibes.com/grille-tv/event/140377765-rugby-leinster-la-rochelle.html",
                    "broadcastId": "140377765",
                    "name": "BEIN SPORTS 1 HD",
                    "epgID": "50115",
                    "ZapNumber": "191",
                    "URLLogo": "https://service.canal-overseas.com/image-api/v1/image/4e121baf92f46b2df622c6d4f9cebf8e",
                    "URLLogoBlack": "https://service.canal-overseas.com/image-api/v1/image/4e121baf92f46b2df622c6d4f9cebf8e"
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
          start: '2022-08-18T09:30:00.000Z',
          stop: '2022-08-18T10:00:00.000Z',
          title: 'Rugby - Leinster / La Rochelle',
          icon: 'https://service.canal-overseas.com/image-api/v1/image/7854e20fb6efecd398598653c57cc771',
          category: 'Rugby',
          description:
            "Retransmission d'un match de Champions Cup de rugby à XV. L'European Rugby Champions Cup est une compétition annuelle interclubs de rugby à XV disputée par les meilleures équipes en Europe. Jusqu'en 2014, cette compétition s'appelait Heineken Cup, ou H Cup, et était sous l'égide de l'ERC, et depuis cette date l'EPRC lui a succédé. La première édition s'est déroulée en 1995."
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
