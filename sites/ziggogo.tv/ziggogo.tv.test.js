// npm run channels:parse -- --config=./sites/ziggogo.tv/ziggogo.tv.config.js --output=./sites/ziggogo.tv/ziggogo.tv_nl.channels.xml
// npx epg-grabber --config=sites/ziggogo.tv/ziggogo.tv.config.js --channels=sites/ziggogo.tv/ziggogo.tv_nl.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./ziggogo.tv.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-03-18', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'NL_000001_019401',
  xmltv_id: 'NPO1.nl'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://obo-prod.oesp.ziggogo.tv/oesp/v4/NL/nld/web/programschedules/20220318/1'
  )
})

it('can parse response', done => {
  const content = `{"entryCount":372,"totalResults":372,"updated":1647612646768,"expires":1647613819245,"title":"EPG","periods":4,"periodStartTime":1647558000000,"periodEndTime":1647579600000,"entries":[{"o":"lgi-nl-prod-master:NL_000001_019401","l":[{"i":"crid:~~2F~~2Fgn.tv~~2F19262235~~2FSH037248380000~~2F114418219,imi:9622001b4e91bba1bbee1720c88e67e3d58d6426","t":"NOS Journaal Laat","s":1647557820000,"e":1647559020000,"c":"lgi-nl-prod-master:genre-22","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`

  axios.get.mockImplementation(url => {
    if (url === 'https://obo-prod.oesp.ziggogo.tv/oesp/v4/NL/nld/web/programschedules/20220318/2') {
      return Promise.resolve({
        data: JSON.parse(
          `{"entryCount":372,"totalResults":372,"updated":1647612660456,"expires":1647613812828,"title":"EPG","periods":4,"periodStartTime":1647579600000,"periodEndTime":1647601200000,"entries":[{"o":"lgi-nl-prod-master:NL_000001_019401","l":[{"i":"crid:~~2F~~2Fgn.tv~~2F21625105~~2FEP010806490167,imi:7473c7359429eba4f52bb878bb61c502a7215680","t":"Nederland in Beweging","s":1647579060000,"e":1647580020000,"c":"lgi-nl-prod-master:genre-229","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (url === 'https://obo-prod.oesp.ziggogo.tv/oesp/v4/NL/nld/web/programschedules/20220318/3') {
      return Promise.resolve({
        data: JSON.parse(
          `{"entryCount":372,"totalResults":372,"updated":1647613247098,"expires":1647614130201,"title":"EPG","periods":4,"periodStartTime":1647601200000,"periodEndTime":1647622800000,"entries":[{"o":"lgi-nl-prod-master:NL_000001_019401","l":[{"i":"crid:~~2F~~2Fgn.tv~~2F21691432~~2FEP021727630938,imi:cff2a1f907652211a67a58701892b254d44132ff","t":"Tijd voor Max","s":1647598440000,"e":1647601200000,"c":"lgi-nl-prod-master:genre-28","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (url === 'https://obo-prod.oesp.ziggogo.tv/oesp/v4/NL/nld/web/programschedules/20220318/4') {
        return Promise.resolve({
          data: JSON.parse(
            `{"entryCount":372,"totalResults":372,"updated":1647613247098,"expires":1647614121897,"title":"EPG","periods":4,"periodStartTime":1647622800000,"periodEndTime":1647644400000,"entries":[{"o":"lgi-nl-prod-master:NL_000001_019401","l":[{"i":"crid:~~2F~~2Fgn.tv~~2F11722435~~2FEP021725040006,imi:2e7a718710666af9b56e98191e557ca30b4c2d25","t":"Politieke Partijen","s":1647622680000,"e":1647622800000,"c":"lgi-nl-prod-master:genre-153","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`
          )
        })
    } else if (url === 'https://obo-prod.oesp.ziggogo.tv/oesp/v4/NL/nld/web/listings/crid:~~2F~~2Fgn.tv~~2F19262235~~2FSH037248380000~~2F114418219,imi:9622001b4e91bba1bbee1720c88e67e3d58d6426') {
        return Promise.resolve({
          data: JSON.parse(
            `{"id":"crid:~~2F~~2Fgn.tv~~2F19262235~~2FSH037248380000~~2F114418219,imi:9622001b4e91bba1bbee1720c88e67e3d58d6426","subtitleLanguages":["nl"],"startTime":1647557820000,"endTime":1647559020000,"actualStartTime":1647557820000,"actualEndTime":1647559020000,"expirationDate":1648162620000,"stationId":"lgi-nl-prod-master:NL_000001_019401","imi":"imi:9622001b4e91bba1bbee1720c88e67e3d58d6426","scCridImi":"crid:~~2F~~2Fgn.tv~~2F19262235~~2FSH037248380000~~2F114418219,imi:9622001b4e91bba1bbee1720c88e67e3d58d6426","mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F19262235~~2FSH037248380000","program":{"id":"crid:~~2F~~2Fgn.tv~~2F19262235~~2FSH037248380000~~2F114418219","title":"NOS Journaal Laat","description":"Met het laatste nieuws, de sport van de dag en de actuele weersverwachting.","longDescription":"Met het laatste nieuws, de sport van de dag en de actuele weersverwachting.","medium":"TV","categories":[{"id":"lgi-nl-prod-master:genre-22","title":"Nieuws","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"cast":["Malou Petter","Mark Visser","Rob Trip","Jeroen Overbeek","Simone Weimans","Annechien Steenhuizen","Jeroen Tjepkema","Saïda Maggé","Winfried Baijens"],"directors":[],"images":[{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-nl-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p19262235_b_v8_ac.jpg"},{"assetType":"TitleTreatment","assetTypes":["TitleTreatment"],"url":"https://staticqbr-nl-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p19262235_ttl_h95_aa.png"}],"parentId":"crid:~~2F~~2Fgn.tv~~2F123456789~~2FSH037248380000","rootId":"crid:~~2F~~2Fgn.tv~~2F19262235~~2FSH037248380000","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F19262235~~2FSH037248380000","shortDescription":"Met het laatste nieuws, de sport van de dag en de actuele weersverwachting.","mediaType":"Episode","seriesEpisodeNumber":"114418219","seriesNumber":"48380000","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"parentId":"crid:~~2F~~2Fgn.tv~~2F123456789~~2FSH037248380000","rootId":"crid:~~2F~~2Fgn.tv~~2F19262235~~2FSH037248380000","replayTvAvailable":true,"audioTracks":[{"lang":"nl","audioPurpose":"main"}],"ratings":[],"offersLatestExpirationDate":1647559020000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false}`
          )
        })
    } else if (url === 'https://obo-prod.oesp.ziggogo.tv/oesp/v4/NL/nld/web/listings/crid:~~2F~~2Fgn.tv~~2F21625105~~2FEP010806490167,imi:7473c7359429eba4f52bb878bb61c502a7215680') {
        return Promise.resolve({
          data: JSON.parse(
            `{"id":"crid:~~2F~~2Fgn.tv~~2F21625105~~2FEP010806490167,imi:7473c7359429eba4f52bb878bb61c502a7215680","subtitleLanguages":["nl"],"startTime":1647579060000,"endTime":1647580020000,"actualStartTime":1647579060000,"actualEndTime":1647580020000,"expirationDate":1648183860000,"stationId":"lgi-nl-prod-master:NL_000001_019401","imi":"imi:7473c7359429eba4f52bb878bb61c502a7215680","scCridImi":"crid:~~2F~~2Fgn.tv~~2F21625105~~2FEP010806490167,imi:7473c7359429eba4f52bb878bb61c502a7215680","mediaGroupId":"crid:~~2F~~2Fbds.tv~~2F37394960","program":{"id":"crid:~~2F~~2Fgn.tv~~2F21625105~~2FEP010806490167","title":"Nederland in Beweging","description":"Programma voor volwassenen waarin lichaamsbeweging centraal staat. De presentatoren begeleiden enkele gasten bij de oefeningen en zo tegelijkertijd ook de kijker, die geholpen wordt in diens gezondheid te investeren.","longDescription":"Programma voor volwassenen waarin lichaamsbeweging centraal staat. De presentatoren begeleiden enkele gasten bij de oefeningen en zo tegelijkertijd ook de kijker, die geholpen wordt in diens gezondheid te investeren.","medium":"TV","categories":[{"id":"lgi-nl-prod-master:genre-229","title":"Exercise","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"cast":["Olga Commandeur","Duco Bauwens"],"directors":[],"images":[{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-nl-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p21271071_b_v12_aa.jpg"},{"assetType":"TitleTreatment","assetTypes":["TitleTreatment"],"url":"https://staticqbr-nl-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p821488_ttd_h95_ac.png"}],"parentId":"crid:~~2F~~2Fgn.tv~~2F21271071~~2FSH010806490000","rootId":"crid:~~2F~~2Fbds.tv~~2F37394960","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fbds.tv~~2F37394960","shortDescription":"Programma voor volwassenen waarin lichaamsbeweging centraal staat. De presentatoren begeleiden enkele gasten bij de oefeningen en zo tegelijkertijd ook de kijker, die geholpen wordt in diens gezondheid te investeren.","mediaType":"Episode","year":"2022","seriesEpisodeNumber":"54","seriesNumber":"22","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"parentId":"crid:~~2F~~2Fgn.tv~~2F21271071~~2FSH010806490000","rootId":"crid:~~2F~~2Fbds.tv~~2F37394960","replayTvAvailable":true,"audioTracks":[{"lang":"nl","audioPurpose":"main"}],"ratings":[],"offersLatestExpirationDate":1648612260000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false,"mergedId":"21625105|nl"}`
          )
        })
    } else if (url === 'https://obo-prod.oesp.ziggogo.tv/oesp/v4/NL/nld/web/listings/crid:~~2F~~2Fgn.tv~~2F21691432~~2FEP021727630938,imi:cff2a1f907652211a67a58701892b254d44132ff') {
        return Promise.resolve({
          data: JSON.parse(
            `{"id":"crid:~~2F~~2Fgn.tv~~2F21691432~~2FEP021727630938,imi:cff2a1f907652211a67a58701892b254d44132ff","subtitleLanguages":["nl"],"startTime":1647598440000,"endTime":1647601200000,"actualStartTime":1647598440000,"actualEndTime":1647601200000,"expirationDate":1648203240000,"stationId":"lgi-nl-prod-master:NL_000001_019401","imi":"imi:cff2a1f907652211a67a58701892b254d44132ff","scCridImi":"crid:~~2F~~2Fgn.tv~~2F21691432~~2FEP021727630938,imi:cff2a1f907652211a67a58701892b254d44132ff","mediaGroupId":"crid:~~2F~~2Fbds.tv~~2F37395234","program":{"id":"crid:~~2F~~2Fgn.tv~~2F21691432~~2FEP021727630938","title":"Tijd voor Max","description":"Speciale uitzending volledig in het teken van Stichting MAX Maakt Mogelijk. Jan Slagter is net terug uit Moldavië en heeft gezien hoe Stichting MAX Maakt Mogelijk de gevluchte Oekraïners kan helpen.","longDescription":"Speciale uitzending volledig in het teken van Stichting MAX Maakt Mogelijk. Jan Slagter is net terug uit Moldavië en heeft gezien hoe Stichting MAX Maakt Mogelijk de gevluchte Oekraïners kan helpen.","medium":"TV","categories":[{"id":"lgi-nl-prod-master:genre-28","title":"Talkshow","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"cast":["Sybrand Niessen","Martine van Os"],"directors":[],"images":[{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-nl-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p21276620_b_v12_aa.jpg"},{"assetType":"TitleTreatment","assetTypes":["TitleTreatment"],"url":"https://staticqbr-nl-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p959050_ttn_h95_ab.png"}],"parentId":"crid:~~2F~~2Fgn.tv~~2F21276620~~2FSH021727630000","rootId":"crid:~~2F~~2Fbds.tv~~2F37395234","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fbds.tv~~2F37395234","shortDescription":"Speciale uitzending volledig in het teken van Stichting MAX Maakt Mogelijk. Jan Slagter is net terug uit Moldavië en heeft gezien hoe Stichting MAX Maakt Mogelijk de gevluchte Oekraïners kan helpen.","mediaType":"Episode","year":"2022","seriesEpisodeNumber":"54","seriesNumber":"22","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"parentId":"crid:~~2F~~2Fgn.tv~~2F21276620~~2FSH021727630000","rootId":"crid:~~2F~~2Fbds.tv~~2F37395234","replayTvAvailable":true,"audioTracks":[{"lang":"nl","audioPurpose":"main"}],"ratings":[],"offersLatestExpirationDate":1647671100000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false,"mergedId":"21691432|nl"}`
          )
        })
    } else if (url === 'https://obo-prod.oesp.ziggogo.tv/oesp/v4/NL/nld/web/listings/crid:~~2F~~2Fgn.tv~~2F11722435~~2FEP021725040006,imi:2e7a718710666af9b56e98191e557ca30b4c2d25') {
        return Promise.resolve({
          data: JSON.parse(
            `{"id":"crid:~~2F~~2Fgn.tv~~2F11722435~~2FEP021725040006,imi:2e7a718710666af9b56e98191e557ca30b4c2d25","subtitleLanguages":["nl"],"startTime":1647622680000,"endTime":1647622800000,"actualStartTime":1647622680000,"actualEndTime":1647622800000,"expirationDate":1648227480000,"stationId":"lgi-nl-prod-master:NL_000001_019401","imi":"imi:2e7a718710666af9b56e98191e557ca30b4c2d25","scCridImi":"crid:~~2F~~2Fgn.tv~~2F11722435~~2FEP021725040006,imi:2e7a718710666af9b56e98191e557ca30b4c2d25","mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F11721625~~2FSH021725040000","program":{"id":"crid:~~2F~~2Fgn.tv~~2F11722435~~2FEP021725040006","title":"Politieke Partijen","description":"Programma dat inzicht biedt in de verschillende Nederlandse politieke partijen.","longDescription":"Programma dat inzicht biedt in de verschillende Nederlandse politieke partijen.","medium":"TV","categories":[{"id":"lgi-nl-prod-master:genre-153","title":"Politiek","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"cast":[],"directors":[],"images":[{"assetType":"HighResLandscapeProductionStill","assetTypes":["HighResLandscapeProductionStill"],"url":"https://staticqbr-nl-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p11722435_e_h10_aa.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-nl-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p11721625_b_v12_ad.jpg"}],"parentId":"crid:~~2F~~2Fgn.tv~~2F123456789~~2FSH021725040000","rootId":"crid:~~2F~~2Fgn.tv~~2F11721625~~2FSH021725040000","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F11721625~~2FSH021725040000","shortDescription":"Programma dat inzicht biedt in de verschillende Nederlandse politieke partijen.","mediaType":"Episode","seriesEpisodeNumber":"2015042006","seriesNumber":"25040000","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[],"secondaryTitle":"PVV"},"parentId":"crid:~~2F~~2Fgn.tv~~2F123456789~~2FSH021725040000","rootId":"crid:~~2F~~2Fgn.tv~~2F11721625~~2FSH021725040000","replayTvAvailable":true,"audioTracks":[{"lang":"nl","audioPurpose":"main"}],"ratings":[],"offersLatestExpirationDate":1647622800000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false,"mergedId":"11722435|nl"}`
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
          start: '2022-03-17T22:57:00.000Z',
          stop: '2022-03-17T23:17:00.000Z',
          title: 'NOS Journaal Laat',
          description: 'Met het laatste nieuws, de sport van de dag en de actuele weersverwachting.',
          category: ['Nieuws'],
          season: '48380000',
          episode: '114418219'
        },
        {
          start: '2022-03-18T04:51:00.000Z',
          stop: '2022-03-18T05:07:00.000Z',
          title: 'Nederland in Beweging',
          description: 'Programma voor volwassenen waarin lichaamsbeweging centraal staat. De presentatoren begeleiden enkele gasten bij de oefeningen en zo tegelijkertijd ook de kijker, die geholpen wordt in diens gezondheid te investeren.',
          category: ['Exercise'],
          season: '22',
          episode: '54'
        },
        {
          start: '2022-03-18T10:14:00.000Z',
          stop: '2022-03-18T11:00:00.000Z',
          title: 'Tijd voor Max',
          description: 'Speciale uitzending volledig in het teken van Stichting MAX Maakt Mogelijk. Jan Slagter is net terug uit Moldavië en heeft gezien hoe Stichting MAX Maakt Mogelijk de gevluchte Oekraïners kan helpen.',
          category: ['Talkshow'],
          season: '22',
          episode: '54'
        },
        {
          start: '2022-03-18T16:58:00.000Z',
          stop: '2022-03-18T17:00:00.000Z',
          title: 'Politieke Partijen',
          description: 'Programma dat inzicht biedt in de verschillende Nederlandse politieke partijen.',
          category: ['Politiek'],
          season: '25040000',
          episode: '2015042006'
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
