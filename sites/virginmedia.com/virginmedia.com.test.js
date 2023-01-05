// npm run channels:parse -- --config=./sites/virginmedia.com/virginmedia.com.config.js --output=./sites/virginmedia.com/virginmedia.com.channels.xml
// npx epg-grabber --config=sites/virginmedia.com/virginmedia.com.config.js --channels=sites/virginmedia.com/virginmedia.com.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./virginmedia.com.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

jest.mock('axios')

const date = dayjs.utc('2022-03-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1761',
  xmltv_id: 'ViaplaySports1.uk'
}

it('can generate valid url', () => {
  expect(url({ date })).toBe(
    'https://prod.oesp.virginmedia.com/oesp/v4/GB/eng/web/programschedules/20220317/1'
  )
})

it('can parse response', done => {
  const content = `{"entryCount":410,"totalResults":410,"updated":1647459686755,"expires":1647460298218,"title":"EPG","periods":4,"periodStartTime":1647475200000,"periodEndTime":1647496800000,"entries":[{"o":"lgi-gb-prodobo-master:1761","l":[{"i":"crid:~~2F~~2Fgn.tv~~2F21763419~~2FEP013520125005,imi:de610af9a9b049c8a0245173f273136d36458f6f","t":"Live: NHL Hockey","s":1647473400000,"e":1647484200000,"c":"lgi-gb-prodobo-master:genre-27","a":false,"r":true,"rm":true,"rs":0,"re":2592000,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`

  axios.get.mockImplementation(url => {
    if (
      url === 'https://prod.oesp.virginmedia.com/oesp/v4/GB/eng/web/programschedules/20220317/2'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"entryCount":410,"totalResults":410,"updated":1647460887411,"expires":1647461895572,"title":"EPG","periods":4,"periodStartTime":1647496800000,"periodEndTime":1647518400000,"entries":[{"o":"lgi-gb-prodobo-master:1761","l":[{"i":"crid:~~2F~~2Fgn.tv~~2F21720572~~2FEP021779870005,imi:d4324f579ad36992f0c3f6e6d35a9b93e98cb78a","t":"Challenge Cup Ice Hockey","s":1647484200000,"e":1647496800000,"c":"lgi-gb-prodobo-master:genre-123","a":false,"r":true,"rm":true,"rs":0,"re":2592000,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (
      url === 'https://prod.oesp.virginmedia.com/oesp/v4/GB/eng/web/programschedules/20220317/3'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"entryCount":410,"totalResults":410,"updated":1647460871713,"expires":1647461910282,"title":"EPG","periods":4,"periodStartTime":1647518400000,"periodEndTime":1647540000000,"entries":[{"o":"lgi-gb-prodobo-master:1761","l":[{"i":"crid:~~2F~~2Fgn.tv~~2F21763550~~2FEP012830215435,imi:9692f5ceb0b63354262339e8529e3a9cb57add9c","t":"NHL Hockey","s":1647511200000,"e":1647518400000,"c":"lgi-gb-prodobo-master:genre-27","a":false,"r":true,"rm":true,"rs":0,"re":2592000,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (
      url === 'https://prod.oesp.virginmedia.com/oesp/v4/GB/eng/web/programschedules/20220317/4'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"entryCount":410,"totalResults":410,"updated":1647460871713,"expires":1647461920720,"title":"EPG","periods":4,"periodStartTime":1647540000000,"periodEndTime":1647561600000,"entries":[{"o":"lgi-gb-prodobo-master:1761","l":[{"i":"crid:~~2F~~2Fgn.tv~~2F21764379~~2FEP025886890145,imi:c02da14358110cec07d14dc154717ce62ba2f489","t":"Boxing World Weekly","s":1647539100000,"e":1647540900000,"c":"lgi-gb-prodobo-master:genre-27","a":false,"r":true,"rm":true,"rs":0,"re":2592000,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`
        )
      })
    } else if (
      url ===
      'https://prod.oesp.virginmedia.com/oesp/v4/GB/eng/web/listings/crid:~~2F~~2Fgn.tv~~2F21763419~~2FEP013520125005,imi:de610af9a9b049c8a0245173f273136d36458f6f'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"id":"crid:~~2F~~2Fgn.tv~~2F21763419~~2FEP013520125005,imi:de610af9a9b049c8a0245173f273136d36458f6f","startTime":1647473400000,"endTime":1647484200000,"actualStartTime":1647473400000,"actualEndTime":1647484200000,"expirationDate":1648078200000,"stationId":"lgi-gb-prodobo-master:1761","imi":"imi:de610af9a9b049c8a0245173f273136d36458f6f","scCridImi":"crid:~~2F~~2Fgn.tv~~2F21763419~~2FEP013520125005,imi:de610af9a9b049c8a0245173f273136d36458f6f","mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F8396306~~2FSH013520120000","program":{"id":"crid:~~2F~~2Fgn.tv~~2F21763419~~2FEP013520125005","title":"Live: NHL Hockey","description":"The Boston Bruins make the trip to Xcel Energy Center for an NHL clash with the Minnesota Wild.","longDescription":"The Boston Bruins make the trip to Xcel Energy Center for an NHL clash with the Minnesota Wild.","medium":"TV","categories":[{"id":"lgi-gb-prodobo-master:genre-27","title":"Sport","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"},{"id":"lgi-gb-prodobo-master:genre-123","title":"Ice Hockey","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"cast":[],"directors":[],"images":[{"assetType":"HighResLandscapeProductionStill","assetTypes":["HighResLandscapeProductionStill"],"url":"https://staticqbr-gb-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p21763419_tb2_h8_aa.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-gb-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p21763419_tb2_v12_aa.jpg"}],"parentId":"crid:~~2F~~2Fgn.tv~~2F123456789~~2FSH013520120000","rootId":"crid:~~2F~~2Fgn.tv~~2F8396306~~2FSH013520120000","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F8396306~~2FSH013520120000","shortDescription":"The Boston Bruins make the trip to Xcel Energy Center for an NHL clash with the Minnesota Wild.","mediaType":"Episode","year":"2022","seriesEpisodeNumber":"2022031605","seriesNumber":"20120000","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[],"secondaryTitle":"Boston Bruins at Minnesota Wild"},"parentId":"crid:~~2F~~2Fgn.tv~~2F123456789~~2FSH013520120000","rootId":"crid:~~2F~~2Fgn.tv~~2F8396306~~2FSH013520120000","replayTvAvailable":true,"audioTracks":[{"lang":"en","audioPurpose":"main"}],"ratings":[],"offersLatestExpirationDate":1647484200000,"replayTvStartOffset":0,"replayTvEndOffset":2592000,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false,"mergedId":"21763419|en-GB"}`
        )
      })
    } else if (
      url ===
      'https://prod.oesp.virginmedia.com/oesp/v4/GB/eng/web/listings/crid:~~2F~~2Fgn.tv~~2F21720572~~2FEP021779870005,imi:d4324f579ad36992f0c3f6e6d35a9b93e98cb78a'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"id":"crid:~~2F~~2Fgn.tv~~2F21720572~~2FEP021779870005,imi:d4324f579ad36992f0c3f6e6d35a9b93e98cb78a","startTime":1647484200000,"endTime":1647496800000,"actualStartTime":1647484200000,"actualEndTime":1647496800000,"expirationDate":1648089000000,"stationId":"lgi-gb-prodobo-master:1761","imi":"imi:d4324f579ad36992f0c3f6e6d35a9b93e98cb78a","scCridImi":"crid:~~2F~~2Fgn.tv~~2F21720572~~2FEP021779870005,imi:d4324f579ad36992f0c3f6e6d35a9b93e98cb78a","mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F11743980~~2FSH021779870000","program":{"id":"crid:~~2F~~2Fgn.tv~~2F21720572~~2FEP021779870005","title":"Challenge Cup Ice Hockey","description":"Exclusive coverage from SSE Arena of the Premier Sports Challenge Final between Belfast Giants and Cardiff Devils.","longDescription":"Exclusive coverage from SSE Arena of the Premier Sports Challenge Final between Belfast Giants and Cardiff Devils.","medium":"TV","categories":[{"id":"lgi-gb-prodobo-master:genre-123","title":"Ice Hockey","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"cast":[],"directors":[],"images":[{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-gb-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p11743980_b_v12_aa.jpg"}],"parentId":"crid:~~2F~~2Fgn.tv~~2F123456789~~2FSH021779870000","rootId":"crid:~~2F~~2Fgn.tv~~2F11743980~~2FSH021779870000","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F11743980~~2FSH021779870000","shortDescription":"Exclusive coverage from SSE Arena of the Premier Sports Challenge Final between Belfast Giants and Cardiff Devils.","mediaType":"Episode","year":"2022","seriesEpisodeNumber":"2022031605","seriesNumber":"79870000","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[],"secondaryTitle":"Final: Belfast Giants v Cardiff Devils"},"parentId":"crid:~~2F~~2Fgn.tv~~2F123456789~~2FSH021779870000","rootId":"crid:~~2F~~2Fgn.tv~~2F11743980~~2FSH021779870000","replayTvAvailable":true,"audioTracks":[{"lang":"en","audioPurpose":"main"}],"ratings":[],"offersLatestExpirationDate":1647928800000,"replayTvStartOffset":0,"replayTvEndOffset":2592000,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false,"mergedId":"21720572|en-GB"}`
        )
      })
    } else if (
      url ===
      'https://prod.oesp.virginmedia.com/oesp/v4/GB/eng/web/listings/crid:~~2F~~2Fgn.tv~~2F21763550~~2FEP012830215435,imi:9692f5ceb0b63354262339e8529e3a9cb57add9c'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"id":"crid:~~2F~~2Fgn.tv~~2F21763550~~2FEP012830215435,imi:9692f5ceb0b63354262339e8529e3a9cb57add9c","startTime":1647511200000,"endTime":1647518400000,"actualStartTime":1647511200000,"actualEndTime":1647518400000,"expirationDate":1648116000000,"stationId":"lgi-gb-prodobo-master:1761","imi":"imi:9692f5ceb0b63354262339e8529e3a9cb57add9c","scCridImi":"crid:~~2F~~2Fgn.tv~~2F21763550~~2FEP012830215435,imi:9692f5ceb0b63354262339e8529e3a9cb57add9c","mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F448880~~2FSH012830210000","program":{"id":"crid:~~2F~~2Fgn.tv~~2F21763550~~2FEP012830215435","title":"NHL Hockey","description":"The Calgary Flames play host to the New Jersey Devils in this NHL encounter from Scotiabank Saddledome.","longDescription":"The Calgary Flames play host to the New Jersey Devils in this NHL encounter from Scotiabank Saddledome.","medium":"TV","categories":[{"id":"lgi-gb-prodobo-master:genre-27","title":"Sport","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"},{"id":"lgi-gb-prodobo-master:genre-123","title":"Ice Hockey","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"cast":[],"directors":[],"images":[{"assetType":"HighResLandscapeProductionStill","assetTypes":["HighResLandscapeProductionStill"],"url":"https://staticqbr-gb-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p448880_b_h8_ak.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-gb-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p448880_b_v12_ak.jpg"}],"parentId":"crid:~~2F~~2Fgn.tv~~2F21275201~~2FSH012830210000","rootId":"crid:~~2F~~2Fgn.tv~~2F448880~~2FSH012830210000","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F448880~~2FSH012830210000","shortDescription":"The Calgary Flames play host to the New Jersey Devils in this NHL encounter from Scotiabank Saddledome.","mediaType":"Episode","year":"2022","seriesEpisodeNumber":"194","seriesNumber":"102022","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[],"secondaryTitle":"New Jersey Devils at Calgary Flames"},"parentId":"crid:~~2F~~2Fgn.tv~~2F21275201~~2FSH012830210000","rootId":"crid:~~2F~~2Fgn.tv~~2F448880~~2FSH012830210000","replayTvAvailable":true,"audioTracks":[{"lang":"en","audioPurpose":"main"}],"ratings":[],"offersLatestExpirationDate":1647583200000,"replayTvStartOffset":0,"replayTvEndOffset":2592000,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false,"mergedId":"21763550|en-GB"}`
        )
      })
    } else if (
      url ===
      'https://prod.oesp.virginmedia.com/oesp/v4/GB/eng/web/listings/crid:~~2F~~2Fgn.tv~~2F21764379~~2FEP025886890145,imi:c02da14358110cec07d14dc154717ce62ba2f489'
    ) {
      return Promise.resolve({
        data: JSON.parse(
          `{"id":"crid:~~2F~~2Fgn.tv~~2F21764379~~2FEP025886890145,imi:c02da14358110cec07d14dc154717ce62ba2f489","startTime":1647539100000,"endTime":1647540900000,"actualStartTime":1647539100000,"actualEndTime":1647540900000,"expirationDate":1648143900000,"stationId":"lgi-gb-prodobo-master:1761","imi":"imi:c02da14358110cec07d14dc154717ce62ba2f489","scCridImi":"crid:~~2F~~2Fgn.tv~~2F21764379~~2FEP025886890145,imi:c02da14358110cec07d14dc154717ce62ba2f489","mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F13641079~~2FSH025886890000","program":{"id":"crid:~~2F~~2Fgn.tv~~2F21764379~~2FEP025886890145","title":"Boxing World Weekly","description":"A weekly series designed to showcase the best of our sport. Boxing World features news, highlights, previews and profiles from the world of pro boxing.","longDescription":"A weekly series designed to showcase the best of our sport. Boxing World features news, highlights, previews and profiles from the world of pro boxing.","medium":"TV","categories":[{"id":"lgi-gb-prodobo-master:genre-27","title":"Sport","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"},{"id":"lgi-gb-prodobo-master:genre-83","title":"Boxing","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"cast":[],"directors":[],"images":[{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"https://staticqbr-gb-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p19340143_b_v8_aa.jpg"},{"assetType":"TitleTreatment","assetTypes":["TitleTreatment"],"url":"https://staticqbr-gb-prod.prod.cdn.dmdsdp.com/image-service/ImagesEPG/EventImages/p13641079_ttl_h95_aa.png"}],"parentId":"crid:~~2F~~2Fgn.tv~~2F19340143~~2FSH025886890000","rootId":"crid:~~2F~~2Fgn.tv~~2F13641079~~2FSH025886890000","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fgn.tv~~2F13641079~~2FSH025886890000","shortDescription":"A weekly series designed to showcase the best of our sport. Boxing World features news, highlights, previews and profiles from the world of pro boxing.","mediaType":"Episode","year":"2022","seriesEpisodeNumber":"60","seriesNumber":"4","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"parentId":"crid:~~2F~~2Fgn.tv~~2F19340143~~2FSH025886890000","rootId":"crid:~~2F~~2Fgn.tv~~2F13641079~~2FSH025886890000","replayTvAvailable":true,"audioTracks":[{"lang":"en","audioPurpose":"main"}],"ratings":[],"offersLatestExpirationDate":1648142400000,"replayTvStartOffset":0,"replayTvEndOffset":2592000,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false,"mergedId":"21764379|en-GB"}`
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
          start: '2022-03-16T23:30:00.000Z',
          stop: '2022-03-17T02:30:00.000Z',
          title: 'Live: NHL Hockey',
          description:
            'The Boston Bruins make the trip to Xcel Energy Center for an NHL clash with the Minnesota Wild.',
          category: ['Sport', 'Ice Hockey']
        },
        {
          start: '2022-03-17T02:30:00.000Z',
          stop: '2022-03-17T06:00:00.000Z',
          title: 'Challenge Cup Ice Hockey',
          description:
            'Exclusive coverage from SSE Arena of the Premier Sports Challenge Final between Belfast Giants and Cardiff Devils.',
          category: ['Ice Hockey']
        },
        {
          start: '2022-03-17T10:00:00.000Z',
          stop: '2022-03-17T12:00:00.000Z',
          title: 'NHL Hockey',
          description:
            'The Calgary Flames play host to the New Jersey Devils in this NHL encounter from Scotiabank Saddledome.',
          category: ['Sport', 'Ice Hockey']
        },
        {
          start: '2022-03-17T17:45:00.000Z',
          stop: '2022-03-17T18:15:00.000Z',
          title: 'Boxing World Weekly',
          description:
            'A weekly series designed to showcase the best of our sport. Boxing World features news, highlights, previews and profiles from the world of pro boxing.',
          category: ['Sport', 'Boxing'],
          season: '4',
          episode: '60'
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
