// npm run channels:parse -- --config=./sites/telenettv.be/telenettv.be.config.js --output=./sites/telenettv.be/telenettv.be_be.channels.xml
// npx epg-grabber --config=sites/telenettv.be/telenettv.be.config.js --channels=sites/telenettv.be/telenettv.be_be.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./telenettv.be.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-03-15', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'vierhd',
  xmltv_id: 'Play4.be'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://obo-prod.oesp.telenettv.be/oesp/v4/BE/eng/web/programschedules/20220315/1'
  )
})

it('can parse response', done => {
  const content = `{"entryCount":246,"totalResults":246,"updated":1647371436768,"expires":1647372154557,"title":"EPG","periods":4,"periodStartTime":1647298800000,"periodEndTime":1647320400000,"entries":[{"o":"lgi-be-prod-master:vierhd","l":[{"i":"crid:~~2F~~2Ftelenet.be~~2F9958a3e1-19b3-4322-9fa7-ab7fd44f1092,imi:f18168cd95d436ff631f07f08c7742f098cadb81","t":"Control Pedro","s":1647298200000,"e":1647301200000,"c":"lgi-be-prod-master:genre-18","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`

  axios.get.mockImplementation(url => {
    if (url === 'https://obo-prod.oesp.telenettv.be/oesp/v4/BE/eng/web/programschedules/20220315/2') {
      return Promise.resolve({
        data: JSON.parse(
          `{"entryCount":246,"totalResults":246,"updated":1647371436768,"expires":1647372236730,"title":"EPG","periods":4,"periodStartTime":1647320400000,"periodEndTime":1647342000000,"entries":[{"o":"lgi-be-prod-master:vierhd","l":[{"i":"crid:~~2F~~2Ftelenet.be~~2F047876c2-f18b-4909-b979-319d0db62ac8,imi:251c38754b1d0df6dbf1b09e5204d972910d6c4c","t":"Geen uitzending","s":1647305100000,"e":1647325800000,"c":"lgi-be-prod-master:genre-31","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (url === 'https://obo-prod.oesp.telenettv.be/oesp/v4/BE/eng/web/programschedules/20220315/3') {
      return Promise.resolve({
        data: JSON.parse(
          `{"entryCount":246,"totalResults":246,"updated":1647370845273,"expires":1647371696930,"title":"EPG","periods":4,"periodStartTime":1647342000000,"periodEndTime":1647363600000,"entries":[{"o":"lgi-be-prod-master:vierhd","l":[{"i":"crid:~~2F~~2Ftelenet.be~~2F39d9f084-9df6-46b4-977f-169b3d9d4dac,imi:8977050fcabf581a9df0a1a65f64390788d65512","t":"Superior Donuts","s":1647340800000,"e":1647342600000,"c":"lgi-be-prod-master:genre-25","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (url === 'https://obo-prod.oesp.telenettv.be/oesp/v4/BE/eng/web/programschedules/20220315/4') {
        return Promise.resolve({
          data: JSON.parse(
            `{"entryCount":246,"totalResults":246,"updated":1647370837179,"expires":1647371697340,"title":"EPG","periods":4,"periodStartTime":1647363600000,"periodEndTime":1647385200000,"entries":[{"o":"lgi-be-prod-master:vierhd","l":[{"i":"crid:~~2F~~2Ftelenet.be~~2Fbe6ad1a1-a43a-421c-b425-8aaa347ebb98,imi:0f9efbceed015758c57ee7894a45a469ff5a6ae7","t":"Huizenjagers","s":1647363000000,"e":1647366300000,"c":"lgi-be-prod-master:genre-8","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`
          )
        })
    } else if (url === 'https://obo-prod.oesp.telenettv.be/oesp/v4/BE/eng/web/listings/crid:~~2F~~2Ftelenet.be~~2F9958a3e1-19b3-4322-9fa7-ab7fd44f1092,imi:f18168cd95d436ff631f07f08c7742f098cadb81') {
        return Promise.resolve({
          data: JSON.parse(
            `{"id":"crid:~~2F~~2Ftelenet.be~~2F9958a3e1-19b3-4322-9fa7-ab7fd44f1092,imi:f18168cd95d436ff631f07f08c7742f098cadb81","startTime":1647298200000,"endTime":1647301200000,"actualStartTime":1647298200000,"actualEndTime":1647301200000,"expirationDate":1647903000000,"stationId":"lgi-be-prod-master:vierhd","imi":"imi:f18168cd95d436ff631f07f08c7742f098cadb81","scCridImi":"crid:~~2F~~2Ftelenet.be~~2F9958a3e1-19b3-4322-9fa7-ab7fd44f1092,imi:f18168cd95d436ff631f07f08c7742f098cadb81","mediaGroupId":"crid:~~2F~~2Ftelenet.be~~2Fcc94642f-f752-4fdb-872a-208952fb01e3","program":{"id":"crid:~~2F~~2Ftelenet.be~~2F9958a3e1-19b3-4322-9fa7-ab7fd44f1092","title":"Control Pedro","description":"Gasten: Jelle De Beule, Jeroom, Jan Dircksens en Frances Lefebure.","longDescription":"Gasten: Jelle De Beule, Jeroom, Jan Dircksens en Frances Lefebure.","medium":"TV","categories":[{"id":"lgi-be-prod-master:genre-18","title":"Interests","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"},{"id":"lgi-be-prod-master:genre-18_10","title":"Showbiz","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"parentalRating":"all","cast":[],"directors":[],"images":[{"assetType":"HighResLandscape","assetTypes":["HighResLandscape"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/6d7__944__6d79441b-5aa3-4b50-b4f2-8d5b149de982__W78738332.jpg"},{"assetType":"HighResLandscapeProductionStill","assetTypes":["HighResLandscapeProductionStill"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/639__60b__63960b1a-19a5-4b96-af1f-382f82418880__L106699838.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/5fe__9ad__5fe9ad75-aae2-41db-905d-d92df04dfb50__B143197463.jpg"}],"parentId":"crid:~~2F~~2Ftelenet.be~~2Fa7fa9b0a-5073-4f9a-891a-67519c2a259f","rootId":"crid:~~2F~~2Ftelenet.be~~2Fcc94642f-f752-4fdb-872a-208952fb01e3","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Ftelenet.be~~2Fcc94642f-f752-4fdb-872a-208952fb01e3","shortDescription":"Gasten: Jelle De Beule, Jeroom, Jan Dircksens en Frances Lefebure.","mediaType":"Episode","seriesEpisodeNumber":"6","seriesNumber":"1","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"parentId":"crid:~~2F~~2Ftelenet.be~~2Fa7fa9b0a-5073-4f9a-891a-67519c2a259f","rootId":"crid:~~2F~~2Ftelenet.be~~2Fcc94642f-f752-4fdb-872a-208952fb01e3","replayTvAvailable":true,"audioTracks":[],"ratings":[],"offersLatestExpirationDate":1647301200000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false}`
          )
        })
    } else if (url === 'https://obo-prod.oesp.telenettv.be/oesp/v4/BE/eng/web/listings/crid:~~2F~~2Ftelenet.be~~2F047876c2-f18b-4909-b979-319d0db62ac8,imi:251c38754b1d0df6dbf1b09e5204d972910d6c4c') {
        return Promise.resolve({
          data: JSON.parse(
            `{"id":"crid:~~2F~~2Ftelenet.be~~2F047876c2-f18b-4909-b979-319d0db62ac8,imi:251c38754b1d0df6dbf1b09e5204d972910d6c4c","startTime":1647305100000,"endTime":1647325800000,"actualStartTime":1647305100000,"actualEndTime":1647325800000,"expirationDate":1647909900000,"stationId":"lgi-be-prod-master:vierhd","imi":"imi:251c38754b1d0df6dbf1b09e5204d972910d6c4c","scCridImi":"crid:~~2F~~2Ftelenet.be~~2F047876c2-f18b-4909-b979-319d0db62ac8,imi:251c38754b1d0df6dbf1b09e5204d972910d6c4c","mediaGroupId":"crid:~~2F~~2Ftelenet.be~~2F047876c2-f18b-4909-b979-319d0db62ac8","program":{"id":"crid:~~2F~~2Ftelenet.be~~2F047876c2-f18b-4909-b979-319d0db62ac8","title":"Geen uitzending","description":"Geen uitzending.","longDescription":"Geen uitzending.","medium":"Movie","categories":[{"id":"lgi-be-prod-master:genre-31","title":"Unclassified","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"cast":[],"directors":[],"images":[{"assetType":"HighResLandscapeProductionStill","assetTypes":["HighResLandscapeProductionStill"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/576__a31__576a31db-5065-4b1f-a39f-f26302bba477__L181744529.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/167__ef8__167ef834-7d1c-4336-9234-795ed7efc46a__B181818910.jpg"}],"rootId":"crid:~~2F~~2Ftelenet.be~~2F047876c2-f18b-4909-b979-319d0db62ac8","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Ftelenet.be~~2F047876c2-f18b-4909-b979-319d0db62ac8","shortDescription":"Geen uitzending.","mediaType":"FeatureFilm","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"rootId":"crid:~~2F~~2Ftelenet.be~~2F047876c2-f18b-4909-b979-319d0db62ac8","replayTvAvailable":true,"audioTracks":[],"ratings":[],"offersLatestExpirationDate":1647325800000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false}`
          )
        })
    } else if (url === 'https://obo-prod.oesp.telenettv.be/oesp/v4/BE/eng/web/listings/crid:~~2F~~2Ftelenet.be~~2F39d9f084-9df6-46b4-977f-169b3d9d4dac,imi:8977050fcabf581a9df0a1a65f64390788d65512') {
        return Promise.resolve({
          data: JSON.parse(
            `{"id":"crid:~~2F~~2Ftelenet.be~~2F39d9f084-9df6-46b4-977f-169b3d9d4dac,imi:8977050fcabf581a9df0a1a65f64390788d65512","startTime":1647340800000,"endTime":1647342600000,"actualStartTime":1647340800000,"actualEndTime":1647342600000,"expirationDate":1647945600000,"stationId":"lgi-be-prod-master:vierhd","imi":"imi:8977050fcabf581a9df0a1a65f64390788d65512","scCridImi":"crid:~~2F~~2Ftelenet.be~~2F39d9f084-9df6-46b4-977f-169b3d9d4dac,imi:8977050fcabf581a9df0a1a65f64390788d65512","mediaGroupId":"crid:~~2F~~2Ftelenet.be~~2F32ff65df-723e-4324-98d3-54c38fef574b","program":{"id":"crid:~~2F~~2Ftelenet.be~~2F39d9f084-9df6-46b4-977f-169b3d9d4dac","title":"Superior Donuts","description":"Tush en Sweatpants nemen hun rol als kerstman heel ernstig en al snel wordt het een strijd tussen de twee.","longDescription":"Tush en Sweatpants nemen hun rol als kerstman heel ernstig en al snel wordt het een strijd tussen de twee.","medium":"TV","categories":[{"id":"lgi-be-prod-master:genre-25","title":"Sitcoms","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"parentalRating":"all","cast":["Judd Hirsch","Jermaine Fowler","David Koechner","Maz Jobrani","Katey Sagal"],"directors":[],"images":[{"assetType":"HighResLandscape","assetTypes":["HighResLandscape"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/c1e__fbf__c1efbfbb-d66c-4068-baca-451bafd66bdd__W137149145.jpg"},{"assetType":"HighResLandscapeProductionStill","assetTypes":["HighResLandscapeProductionStill"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/7f6__f32__7f6f3204-c31a-4917-a5be-3e6a6e674f6f__L136396722.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/1e1__4cb__1e14cbdb-0f25-48b8-bcdc-a205f8b10cb1__B134685946.jpg"}],"parentId":"crid:~~2F~~2Ftelenet.be~~2F4139fd13-d201-4edc-8f17-e965a8b590cb","rootId":"crid:~~2F~~2Ftelenet.be~~2F32ff65df-723e-4324-98d3-54c38fef574b","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Ftelenet.be~~2F32ff65df-723e-4324-98d3-54c38fef574b","shortDescription":"Tush en Sweatpants nemen hun rol als kerstman heel ernstig en al snel wordt het een strijd tussen de twee.","mediaType":"Episode","seriesEpisodeNumber":"7","seriesNumber":"2","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[],"secondaryTitle":"Homeless for the Holidays"},"parentId":"crid:~~2F~~2Ftelenet.be~~2F4139fd13-d201-4edc-8f17-e965a8b590cb","rootId":"crid:~~2F~~2Ftelenet.be~~2F32ff65df-723e-4324-98d3-54c38fef574b","replayTvAvailable":true,"audioTracks":[],"ratings":[],"offersLatestExpirationDate":1647342600000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false}`
          )
        })
    } else if (url === 'https://obo-prod.oesp.telenettv.be/oesp/v4/BE/eng/web/listings/crid:~~2F~~2Ftelenet.be~~2Fbe6ad1a1-a43a-421c-b425-8aaa347ebb98,imi:0f9efbceed015758c57ee7894a45a469ff5a6ae7') {
        return Promise.resolve({
          data: JSON.parse(
            `{"id":"crid:~~2F~~2Ftelenet.be~~2Fbe6ad1a1-a43a-421c-b425-8aaa347ebb98,imi:0f9efbceed015758c57ee7894a45a469ff5a6ae7","startTime":1647363000000,"endTime":1647366300000,"actualStartTime":1647363000000,"actualEndTime":1647366300000,"expirationDate":1647967800000,"stationId":"lgi-be-prod-master:vierhd","imi":"imi:0f9efbceed015758c57ee7894a45a469ff5a6ae7","scCridImi":"crid:~~2F~~2Ftelenet.be~~2Fbe6ad1a1-a43a-421c-b425-8aaa347ebb98,imi:0f9efbceed015758c57ee7894a45a469ff5a6ae7","mediaGroupId":"crid:~~2F~~2Ftelenet.be~~2F60df2d31-977c-4e00-8e1c-d1e255fb068e","program":{"id":"crid:~~2F~~2Ftelenet.be~~2Fbe6ad1a1-a43a-421c-b425-8aaa347ebb98","title":"Huizenjagers","description":"Makelaars Alexandra, Kinga en Cedric gaan in de Limburgse Kempen op zoek naar droomwoningen voor enkele kandidaat-kopers.","longDescription":"Makelaars Alexandra, Kinga en Cedric gaan in de Limburgse Kempen op zoek naar droomwoningen voor enkele kandidaat-kopers. De eerste opdracht komt van Aika en Didier, een kieskeurig koppel uit Mol. Ze zoeken een eerste eigen huis met drie slaapkamers en een kleine tuin voor 300.000 euro. Heel belangrijk voor hen is dat er geen inkijk van de buren is. Bovendien moet er voldoende plaats zijn voor al hun fietsen.","medium":"TV","categories":[{"id":"lgi-be-prod-master:genre-8","title":"Documentary","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"},{"id":"lgi-be-prod-master:genre-8_10","title":"Reality TV","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"parentalRating":"all","cast":[],"directors":[],"images":[{"assetType":"HighResLandscape","assetTypes":["HighResLandscape"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/1d1__17e__1d117e2e-644c-4532-a393-2938fb0be42f__W109854859.jpg"},{"assetType":"HighResLandscapeProductionStill","assetTypes":["HighResLandscapeProductionStill"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/b53__ebc__b53ebc21-ba0e-45cc-a7b6-5aca802f0fb5__L132922367.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-be-prod.tnprod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/c81__2a3__c812a3d6-98b4-4964-8d9d-d7d190232f59__B141331067.jpg"}],"parentId":"crid:~~2F~~2Ftelenet.be~~2Fca7eb3e9-97d4-4962-8342-4c5748dcbc98","rootId":"crid:~~2F~~2Ftelenet.be~~2F60df2d31-977c-4e00-8e1c-d1e255fb068e","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Ftelenet.be~~2F60df2d31-977c-4e00-8e1c-d1e255fb068e","shortDescription":"Makelaars Alexandra, Kinga en Cedric gaan in de Limburgse Kempen op zoek naar droomwoningen voor enkele kandidaat-kopers.","mediaType":"Episode","seriesEpisodeNumber":"25","seriesNumber":"3","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[],"secondaryTitle":"Limburgse Kempen"},"parentId":"crid:~~2F~~2Ftelenet.be~~2Fca7eb3e9-97d4-4962-8342-4c5748dcbc98","rootId":"crid:~~2F~~2Ftelenet.be~~2F60df2d31-977c-4e00-8e1c-d1e255fb068e","replayTvAvailable":true,"audioTracks":[],"ratings":[],"offersLatestExpirationDate":1647706200000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false}`
          )
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
          start: '2022-03-14T22:50:00.000Z',
          stop: '2022-03-14T23:40:00.000Z',
          title: 'Control Pedro',
          description: 'Gasten: Jelle De Beule, Jeroom, Jan Dircksens en Frances Lefebure.',
          category: ['Interests', 'Showbiz'],
          season: '1',
          episode: '6'
        },
        {
          start: '2022-03-15T00:45:00.000Z',
          stop: '2022-03-15T06:30:00.000Z',
          title: 'Geen uitzending',
          description: 'Geen uitzending.',
          category: ['Unclassified'],
          season: null,
          episode: null
        },
        {
          start: '2022-03-15T10:40:00.000Z',
          stop: '2022-03-15T11:10:00.000Z',
          title: 'Superior Donuts',
          description: 'Tush en Sweatpants nemen hun rol als kerstman heel ernstig en al snel wordt het een strijd tussen de twee.',
          category: ['Sitcoms'],
          season: '2',
          episode: '7'
        },
        {
          start: '2022-03-15T16:50:00.000Z',
          stop: '2022-03-15T17:45:00.000Z',
          title: 'Huizenjagers',
          description: 'Makelaars Alexandra, Kinga en Cedric gaan in de Limburgse Kempen op zoek naar droomwoningen voor enkele kandidaat-kopers. De eerste opdracht komt van Aika en Didier, een kieskeurig koppel uit Mol. Ze zoeken een eerste eigen huis met drie slaapkamers en een kleine tuin voor 300.000 euro. Heel belangrijk voor hen is dat er geen inkijk van de buren is. Bovendien moet er voldoende plaats zijn voor al hun fietsen.',
          category: ['Documentary', 'Reality TV'],
          season: '3',
          episode: '25'
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', done => {
  parser({
    content: `[{"type":"PATH_PARAM","code":"period","reason":"INVALID"}]`,
    channel,
    date
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
