// npx epg-grabber --config=sites/vtm.be/vtm.be.config.js --channels=sites/vtm.be/vtm.be.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./vtm.be.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-10', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'vtm',
  xmltv_id: 'VTM.be'
}
const content = `<html lang="nl"> <head></head> <body> <script id="__EPG_DATA__"> window.__EPG_REDUX_DATA__={"broadcasts":{"cf7964f8-ca12-473b-ae4e-d22c51a9f6a9":{"uuid":"cf7964f8-ca12-473b-ae4e-d22c51a9f6a9","playableUuid":"07eb41c8-38f5-420b-b615-3854d25a1425","programUuid":null,"channelUuid":"d8659669-b964-414c-aa9c-e31d8d15696b","from":1636333200000,"to":1636344300000,"technicalFrom":1636333382000,"technicalTo":1636344500000,"contentFrom":null,"contentTo":null,"title":"Geen uitzending","alternativeMainTitle":null,"alternativeDetailTitle":null,"productionCountries":[],"live":false,"rerun":false,"prime":false,"pillar":null,"legalIcons":["PGAL"],"duration":null,"synopsis":null,"playableType":"oneoffs","genre":null,"subGenres":[],"tip":false,"rating":null,"imageUrl":null,"imageFormat":null,"imageUrlVariants":null,"videoOnDemandLinks":[],"entitlements":[],"lastUpdated":"2021-11-08T08:12:47.808963","fromIso":"2021-11-08T01:00:00","toIso":"2021-11-08T04:05:00"},"9ea3fc5c-605c-4296-888d-56ac5b5aee0d":{"uuid":"9ea3fc5c-605c-4296-888d-56ac5b5aee0d","playableUuid":"c9ddab4c-bf23-4d3e-8a73-238be8029725","programUuid":"60fc4f49-6714-499d-92b5-3c6d41c8b6de","channelUuid":"d8659669-b964-414c-aa9c-e31d8d15696b","from":1636344300000,"to":1636344900000,"technicalFrom":1636344500000,"technicalTo":1636345072000,"contentFrom":1636344500640,"contentTo":1636345061080,"title":"Brandweerman Sam","alternativeMainTitle":null,"alternativeDetailTitle":null,"productionCountries":[{"code":"GBR","name":"Verenigd Koninkrijk"}],"live":false,"rerun":false,"prime":false,"pillar":null,"legalIcons":["PGAL"],"duration":595,"synopsis":"Norman Price en zijn vrienden vinden het heerlijk om te spelen, maar daardoor raken ze vaak in de problemen. Zo zitten ze vast in een brandend gebouw, kunnen ze niet meer van een hoge rotswand af o...","playableType":"episodes","genre":"Jeugdprogramma","subGenres":["Animatie"],"tip":false,"rating":null,"imageUrl":"https://images4.persgroep.net/rcs/gPz9G1B0FJw0D3hFrCLtEfEYuRE/diocontent/169211784/_fill/600/400?appId=da11c75db9b73ea0f41f0cd0da631c71","imageFormat":"LANDSCAPE","entitlements":[],"lastUpdated":"2021-11-09T13:58:07.112125","fromIso":"2021-11-08T04:05:00","toIso":"2021-11-08T04:15:00"},"f344fdcf-8fe6-4e86-9e26-30b18deb00ea":{"uuid":"f344fdcf-8fe6-4e86-9e26-30b18deb00ea","playableUuid":"1fa62b03-3498-49c2-b9be-658274106be5","programUuid":"10b85c6a-dae4-4840-a99e-01b49a063e4a","channelUuid":"d8659669-b964-414c-aa9c-e31d8d15696b","from":1636587900000,"to":1636590000000,"technicalFrom":1636588156600,"technicalTo":1636590256880,"contentFrom":1636588163600,"contentTo":1636589871040,"title":"Wooninspiraties","alternativeMainTitle":null,"alternativeDetailTitle":null,"productionCountries":[{"code":"BEL","name":"België"}],"live":false,"rerun":false,"prime":false,"pillar":null,"legalIcons":["PGAL","PP"],"duration":1295,"synopsis":"Een team gaat op pad om inspiratie op te doen over alles wat met wonen en leven te maken heeft; Ze trekken heel het land door om de laatste trends en tips op het gebied van wonen te achterhalen.","playableType":"episodes","genre":"Magazine","subGenres":["Lifestyle"],"tip":false,"rating":null,"imageUrl":"https://images4.persgroep.net/rcs/z5qrZHumkjuN5rWzoaRJ_BTdL7A/diocontent/209688322/_fill/600/400?appId=da11c75db9b73ea0f41f0cd0da631c71","imageFormat":"LANDSCAPE","lastUpdated":"2021-11-10T12:51:13.201342","fromIso":"2021-11-10T23:45:00","toIso":"2021-11-11T00:20:00"}},"channelDetail":{"vtm":{"from":1636344000000,"to":1637208000000,"name":"VTM","seoKey":"vtm","uuid":"d8659669-b964-414c-aa9c-e31d8d15696b","channelLogoUrl":"https://images4.persgroep.net/rcs/-JpJ692wUcyJ14N20YNDKhK3JEU/diocontent/175372657/_fitwidth/500?appId=da11c75db9b73ea0f41f0cd0da631c71","liveStreamLinks":[],"broadcasts":[]}}};
window.__EPG__={"baseUrl":"/tv-gids","selectedChannel":null,"language":"nl","brand":"vtmepg","tipsUrl":null,"overview":"VERTICAL_GROUPED","dateRangeFrom":-2,"dateRangeTo":7,"overviewRatingProvider":null,"supportedChannels":["d8659669-b964-414c-aa9c-e31d8d15696b","ea826456-6b19-4612-8969-864d1c818347","5f8f153a-72cb-476c-9e7b-4802808470b2","8c1d440a-8b88-4ef8-9026-2acd542d7ceb","57940c42-a225-44be-8691-46d5175e2d01","ded88047-1313-4dd1-b6b1-8f85dda47458","1ee09d9c-5c00-4a5d-8bab-438f897eb1a2"],"externalLinkProducts":["VTM_GO"],"showLinkInOverview":true,"bypassEmbargo":false,"bypassRerun":true,"supportedRatingProviders":[],"imageConfig":null,"blacklistedFields":["ALTERNATIVETITLES","DESCRIPTION_S","DESCRIPTION_M","DESCRIPTION_L"],"platformType":"TVGUIDE","toppickImageEntitlementProduct":null,"supportedEntitlementProducts":[],"reviewConsumers":[],"printImageUrl":false,"lastUpdatedDate":"2021-03-05T18:18:54.395"};</script> </body></html>`

it('can generate valid url', () => {
  const result = url({ channel })
  expect(result).toBe('https://vtm.be/tv-gids/vtm')
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-10T23:45:00.000Z',
      stop: '2021-11-11T00:20:00.000Z',
      title: 'Wooninspiraties',
      icon: 'https://images4.persgroep.net/rcs/z5qrZHumkjuN5rWzoaRJ_BTdL7A/diocontent/209688322/_fill/600/400?appId=da11c75db9b73ea0f41f0cd0da631c71',
      description: `Een team gaat op pad om inspiratie op te doen over alles wat met wonen en leven te maken heeft; Ze trekken heel het land door om de laatste trends en tips op het gebied van wonen te achterhalen.`,
      category: 'Magazine'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<html lang="nl"> <head></head> <body></body></html>`
  })
  expect(result).toMatchObject([])
})
