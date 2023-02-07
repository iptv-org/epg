// npm run channels:parse -- --config=./sites/horizon.tv/horizon.tv.config.js --output=./sites/horizon.tv/horizon.tv.channels.xml
// npx epg-grabber --config=sites/horizon.tv/horizon.tv.config.js --channels=sites/horizon.tv/horizon.tv.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./horizon.tv.config.js')
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
  const content = `{"entryCount":184,"totalResults":184,"updated":1675790518889,"expires":1675791343825,"title":"EPG","periods":4,"periodStartTime":1675724400000,"periodEndTime":1675746000000,"entries":[{"o":"lgi-obolite-sk-prod-master:10024","l":[{"i":"crid:~~2F~~2Fport.cs~~2F122941980,imi:7ca159c917344e0dd3fbe1cd8db5ff8043d96a78","t":"Avengement","s":1675719300000,"e":1675724700000,"c":"lgi-obolite-sk-prod-master:genre-9","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`

  axios.get.mockImplementation(url => {
    if (url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/programschedules/20230207/2') {
      return Promise.resolve({
        data: JSON.parse(`{"entryCount":184,"totalResults":184,"updated":1675790518889,"expires":1675791376097,"title":"EPG","periods":4,"periodStartTime":1675746000000,"periodEndTime":1675767600000,"entries":[{"o":"lgi-obolite-sk-prod-master:10024","l":[{"i":"crid:~~2F~~2Fport.cs~~2F248281986,imi:e85129f9d1e211406a521df7a36f22237c22651b","t":"Zoom In","s":1675744500000,"e":1675746000000,"c":"lgi-obolite-sk-prod-master:genre-21","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`)
      })
    } else if (url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/programschedules/20230207/3') {
      return Promise.resolve({
        data: JSON.parse(`{"entryCount":184,"totalResults":184,"updated":1675789948804,"expires":1675791024984,"title":"EPG","periods":4,"periodStartTime":1675767600000,"periodEndTime":1675789200000,"entries":[{"o":"lgi-obolite-sk-prod-master:10024","l":[{"i":"crid:~~2F~~2Fport.cs~~2F1379541,imi:5f806a2a0bc13e9745e14907a27116c60ea2c6ad","t":"Studentka","s":1675761000000,"e":1675767600000,"c":"lgi-obolite-sk-prod-master:genre-14","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`)
      })
    } else if (url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/programschedules/20230207/4') {
      return Promise.resolve({
        data: JSON.parse(`{"entryCount":184,"totalResults":184,"updated":1675789948804,"expires":1675790973469,"title":"EPG","periods":4,"periodStartTime":1675789200000,"periodEndTime":1675810800000,"entries":[{"o":"lgi-obolite-sk-prod-master:10024","l":[{"i":"crid:~~2F~~2Fport.cs~~2F71927954,imi:f1b4b0285b72cf44cba74e1c62322a4c682385c7","t":"Zilionáři","s":1675785900000,"e":1675791900000,"c":"lgi-obolite-sk-prod-master:genre-9","a":false,"r":true,"rm":true,"rs":0,"re":604800,"rst":"cloud","ra":false,"ad":[],"sl":[]}]}]}`)
      })
    } else if (url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/listings/crid:~~2F~~2Fport.cs~~2F122941980,imi:7ca159c917344e0dd3fbe1cd8db5ff8043d96a78') {
      return Promise.resolve({
        data: JSON.parse(`{"id":"crid:~~2F~~2Fport.cs~~2F122941980,imi:7ca159c917344e0dd3fbe1cd8db5ff8043d96a78","startTime":1675719300000,"endTime":1675724700000,"actualStartTime":1675719300000,"actualEndTime":1675724700000,"expirationDate":1676324100000,"stationId":"lgi-obolite-sk-prod-master:10024","imi":"imi:7ca159c917344e0dd3fbe1cd8db5ff8043d96a78","scCridImi":"crid:~~2F~~2Fport.cs~~2F122941980,imi:7ca159c917344e0dd3fbe1cd8db5ff8043d96a78","mediaGroupId":"crid:~~2F~~2Fport.cs~~2F122941980","program":{"id":"crid:~~2F~~2Fport.cs~~2F122941980","title":"Avengement","description":"Během propustky z vězení za účelem návštěvy umírající matky v nemocnici zločinec Cain Burgess (Scott Adkins) unikne svým dozorcům a mizí v ulicích Londýna. Jde o epickou cestu krve a bolesti za...","longDescription":"Během propustky z vězení za účelem návštěvy umírající matky v nemocnici zločinec Cain Burgess (Scott Adkins) unikne svým dozorcům a mizí v ulicích Londýna. Jde o epickou cestu krve a bolesti za dosažením vytoužené pomsty na těch, kteří z něj udělali chladnokrevného vraha.","medium":"Movie","categories":[{"id":"lgi-obolite-sk-prod-master:genre-9","title":"Drama","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"},{"id":"lgi-obolite-sk-prod-master:genre-33","title":"Akcia","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"parentalRating":"18","cast":["Scott Adkins","Craig Fairbrass","Thomas Turgoose","Nick Moran","Kierston Wareing","Leo Gregory","Mark Strange","Luke LaFontaine","Beau Fowler","Dan Styles","Christopher Sciueref","Matt Routledge","Jane Thorne","Louis Mandylor","Terence Maynard","Greg Burridge","Michael Higgs","Damian Gallagher","Daniel Adegboyega","John Ioannou","Sofie Golding-Spittle","Joe Egan","Darren Swain","Lee Charles","Dominic Kinnaird","Ross O'Hennessy","Teresa Mahoney","Andrew Dunkelberger","Sam Hardy","Ivan Moy","Mark Sears","Phillip Ray Tommy"],"directors":["Jesse V. Johnson"],"images":[{"assetType":"HighResLandscape","assetTypes":["HighResLandscape"],"url":"http://62.179.125.152/SK/Images/hrl_3fa8387df870473fdacb1024635b52b2496b159c.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"http://62.179.125.152/SK/Images/hrp_19e3a660e637cd39e31046c284a66b3a95d698e4.jpg"},{"assetType":"boxCover","assetTypes":["boxCover"],"url":"http://62.179.125.152/SK/Images/bc_939160772e45a783fb3a19970696f5ebcb6e568b.jpg"},{"assetType":"boxart-small","assetTypes":["boxart-small"],"url":"http://62.179.125.152/SK/Images/bc_939160772e45a783fb3a19970696f5ebcb6e568b.jpg?w=75&h=108&mode=box"},{"assetType":"boxart-medium","assetTypes":["boxart-medium"],"url":"http://62.179.125.152/SK/Images/bc_939160772e45a783fb3a19970696f5ebcb6e568b.jpg?w=110&h=159&mode=box"},{"assetType":"boxart-xlarge","assetTypes":["boxart-xlarge"],"url":"http://62.179.125.152/SK/Images/bc_939160772e45a783fb3a19970696f5ebcb6e568b.jpg?w=210&h=303&mode=box"},{"assetType":"boxart-large","assetTypes":["boxart-large"],"url":"http://62.179.125.152/SK/Images/bc_939160772e45a783fb3a19970696f5ebcb6e568b.jpg?w=180&h=260&mode=box"}],"rootId":"crid:~~2F~~2Fport.cs~~2F122941980","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fport.cs~~2F122941980","shortDescription":"Během propustky z vězení za účelem návštěvy umírající matky v nemocnici zločinec Cain Burgess (Scott Adkins) unikne svým dozorcům a mizí v ulicích Londýna. Jde o epickou cestu krve a bolesti za...","mediaType":"FeatureFilm","year":"2019","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"rootId":"crid:~~2F~~2Fport.cs~~2F122941980","replayTvAvailable":true,"audioTracks":[],"ratings":[],"offersLatestExpirationDate":1676247300000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false}`)
      })
    } else if (url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/listings/crid:~~2F~~2Fport.cs~~2F248281986,imi:e85129f9d1e211406a521df7a36f22237c22651b') {
      return Promise.resolve({
        data: JSON.parse(`{"id":"crid:~~2F~~2Fport.cs~~2F248281986,imi:e85129f9d1e211406a521df7a36f22237c22651b","startTime":1675744500000,"endTime":1675746000000,"actualStartTime":1675744500000,"actualEndTime":1675746000000,"expirationDate":1676349300000,"stationId":"lgi-obolite-sk-prod-master:10024","imi":"imi:e85129f9d1e211406a521df7a36f22237c22651b","scCridImi":"crid:~~2F~~2Fport.cs~~2F248281986,imi:e85129f9d1e211406a521df7a36f22237c22651b","mediaGroupId":"crid:~~2F~~2Fport.cs~~2F41764266","program":{"id":"crid:~~2F~~2Fport.cs~~2F248281986","title":"Zoom In","description":"Film/Kino","longDescription":"Film/Kino","medium":"TV","categories":[{"id":"lgi-obolite-sk-prod-master:genre-21","title":"Hudba a umenie","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"},{"id":"lgi-obolite-sk-prod-master:genre-14","title":"Film","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"parentalRating":"9","cast":[],"directors":[],"images":[{"assetType":"HighResLandscape","assetTypes":["HighResLandscape"],"url":"http://62.179.125.152/SK/Images/hrl_cbed64b557e83227a2292604cbcae2d193877b1c.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"http://62.179.125.152/SK/Images/hrp_cfe405e669385365846b69196e1e94caa3e60de0.jpg"},{"assetType":"boxCover","assetTypes":["boxCover"],"url":"http://62.179.125.152/SK/Images/bc_cfe405e669385365846b69196e1e94caa3e60de0.jpg"},{"assetType":"boxart-small","assetTypes":["boxart-small"],"url":"http://62.179.125.152/SK/Images/bc_cfe405e669385365846b69196e1e94caa3e60de0.jpg?w=75&h=108&mode=box"},{"assetType":"boxart-medium","assetTypes":["boxart-medium"],"url":"http://62.179.125.152/SK/Images/bc_cfe405e669385365846b69196e1e94caa3e60de0.jpg?w=110&h=159&mode=box"},{"assetType":"boxart-xlarge","assetTypes":["boxart-xlarge"],"url":"http://62.179.125.152/SK/Images/bc_cfe405e669385365846b69196e1e94caa3e60de0.jpg?w=210&h=303&mode=box"},{"assetType":"boxart-large","assetTypes":["boxart-large"],"url":"http://62.179.125.152/SK/Images/bc_cfe405e669385365846b69196e1e94caa3e60de0.jpg?w=180&h=260&mode=box"}],"parentId":"crid:~~2F~~2Fport.cs~~2F41764266_series","rootId":"crid:~~2F~~2Fport.cs~~2F41764266","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fport.cs~~2F41764266","shortDescription":"Film/Kino","mediaType":"Episode","year":"2010","seriesEpisodeNumber":"1302070535","seriesNumber":"1302080520","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"parentId":"crid:~~2F~~2Fport.cs~~2F41764266_series","rootId":"crid:~~2F~~2Fport.cs~~2F41764266","replayTvAvailable":true,"audioTracks":[],"ratings":[],"offersLatestExpirationDate":1675746000000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false}`)
      })
    } else if (url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/listings/crid:~~2F~~2Fport.cs~~2F1379541,imi:5f806a2a0bc13e9745e14907a27116c60ea2c6ad') {
      return Promise.resolve({
        data: JSON.parse(`{"id":"crid:~~2F~~2Fport.cs~~2F1379541,imi:5f806a2a0bc13e9745e14907a27116c60ea2c6ad","startTime":1675761000000,"endTime":1675767600000,"actualStartTime":1675761000000,"actualEndTime":1675767600000,"expirationDate":1676365800000,"stationId":"lgi-obolite-sk-prod-master:10024","imi":"imi:5f806a2a0bc13e9745e14907a27116c60ea2c6ad","scCridImi":"crid:~~2F~~2Fport.cs~~2F1379541,imi:5f806a2a0bc13e9745e14907a27116c60ea2c6ad","mediaGroupId":"crid:~~2F~~2Fport.cs~~2F1379541","program":{"id":"crid:~~2F~~2Fport.cs~~2F1379541","title":"Studentka","description":"Ambiciózní vysokoškolačka Valentina (Sophie Marceau) studuje literaturu na pařížské Sorbonně a právě se připravuje k závěrečným zkouškám. Žádný odpočinek, žádné volno, žádné večírky, téměř žádný...","longDescription":"Ambiciózní vysokoškolačka Valentina (Sophie Marceau) studuje literaturu na pařížské Sorbonně a právě se připravuje k závěrečným zkouškám. Žádný odpočinek, žádné volno, žádné večírky, téměř žádný spánek a především a hlavně ... žádná láska! Věří, že jedině tak obstojí před zkušební komisí. Jednoho dne se však odehraje něco, s čím nepočítala. Potká charismatického hudebníka Neda - a bláznivě se zamiluje. V tuto chvíli stojí před osudovým rozhodnutím: zahodí roky obrovského studijního nasazení, nebo odmítne lásku? Nebo se snad dá obojí skloubit dohromady?","medium":"Movie","categories":[{"id":"lgi-obolite-sk-prod-master:genre-14","title":"Film","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"},{"id":"lgi-obolite-sk-prod-master:genre-4","title":"Komédia","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"parentalRating":"9","cast":["Sophie Marceauová","Vincent Lindon","Elisabeth Vitali","Elena Pompei","Jean-Claude Leguay","Brigitte Chamarande","Christian Pereira","Gérard Dacier","Roberto Attias","Beppe Chierici","Nathalie Mann","Anne Macina","Janine Souchon","Virginie Demians","Hugues Leforestier","Jacqueline Noëlle","Marc-André Brunet","Isabelle Caubère","André Chazel","Med Salah Cheurfi","Guillaume Corea","Eric Denize","Gilles Gaston-Dreyfuss","Benoît Gourley","Marc Innocenti","Najim Laouriga","Laurent Ledermann","Philippe Maygal","Dominique Pifarely","Ysé Tran"],"directors":["Francis De Gueltz","Dominique Talmon","Claude Pinoteau"],"images":[{"assetType":"HighResLandscape","assetTypes":["HighResLandscape"],"url":"http://62.179.125.152/SK/Images/hrl_a8abceaa59bbb0aae8031dcdd5deba03aba8a100.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"http://62.179.125.152/SK/Images/hrp_72b11621270454812ac8474698fc75670db4a49d.jpg"},{"assetType":"boxCover","assetTypes":["boxCover"],"url":"http://62.179.125.152/SK/Images/bc_72b11621270454812ac8474698fc75670db4a49d.jpg"},{"assetType":"boxart-small","assetTypes":["boxart-small"],"url":"http://62.179.125.152/SK/Images/bc_72b11621270454812ac8474698fc75670db4a49d.jpg?w=75&h=108&mode=box"},{"assetType":"boxart-medium","assetTypes":["boxart-medium"],"url":"http://62.179.125.152/SK/Images/bc_72b11621270454812ac8474698fc75670db4a49d.jpg?w=110&h=159&mode=box"},{"assetType":"boxart-xlarge","assetTypes":["boxart-xlarge"],"url":"http://62.179.125.152/SK/Images/bc_72b11621270454812ac8474698fc75670db4a49d.jpg?w=210&h=303&mode=box"},{"assetType":"boxart-large","assetTypes":["boxart-large"],"url":"http://62.179.125.152/SK/Images/bc_72b11621270454812ac8474698fc75670db4a49d.jpg?w=180&h=260&mode=box"}],"rootId":"crid:~~2F~~2Fport.cs~~2F1379541","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fport.cs~~2F1379541","shortDescription":"Ambiciózní vysokoškolačka Valentina (Sophie Marceau) studuje literaturu na pařížské Sorbonně a právě se připravuje k závěrečným zkouškám. Žádný odpočinek, žádné volno, žádné večírky, téměř žádný...","mediaType":"FeatureFilm","year":"1988","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"rootId":"crid:~~2F~~2Fport.cs~~2F1379541","replayTvAvailable":true,"audioTracks":[],"ratings":[],"offersLatestExpirationDate":1675767600000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false}`)
      })
    } else if (url === 'https://legacy-static.oesp.horizon.tv/oesp/v4/SK/slk/web/listings/crid:~~2F~~2Fport.cs~~2F71927954,imi:f1b4b0285b72cf44cba74e1c62322a4c682385c7') {
      return Promise.resolve({
        data: JSON.parse(`{"id":"crid:~~2F~~2Fport.cs~~2F71927954,imi:f1b4b0285b72cf44cba74e1c62322a4c682385c7","startTime":1675785900000,"endTime":1675791900000,"actualStartTime":1675785900000,"actualEndTime":1675791900000,"expirationDate":1676390700000,"stationId":"lgi-obolite-sk-prod-master:10024","imi":"imi:f1b4b0285b72cf44cba74e1c62322a4c682385c7","scCridImi":"crid:~~2F~~2Fport.cs~~2F71927954,imi:f1b4b0285b72cf44cba74e1c62322a4c682385c7","mediaGroupId":"crid:~~2F~~2Fport.cs~~2F71927954","program":{"id":"crid:~~2F~~2Fport.cs~~2F71927954","title":"Zilionáři","description":"David (Zach Galifianakis) je nekomplikovaný muž, který uvízl v monotónním životě. Den co den usedá za volant svého obrněného automobilu, aby odvážel obrovské sumy peněz jiných lidí. Jediným...","longDescription":"David (Zach Galifianakis) je nekomplikovaný muž, který uvízl v monotónním životě. Den co den usedá za volant svého obrněného automobilu, aby odvážel obrovské sumy peněz jiných lidí. Jediným vzrušujícím momentem v jeho životě je flirtování s kolegyní Kelly (Kristen Wiig), která ho však brzy zatáhne do těžko uvěřitelného dobrodružství. Skupinka nepříliš inteligentních loserů, pod vedením Steva (Owen Wilson), plánuje vyloupit banku a David jim v tom má samozřejmě pomoci. Navzdory absolutně amatérskému plánu se ale stane nemožné a oni mají najednou v kapse 17 miliónů dolarů. A protože tato partička je opravdu bláznivá, začne je hned ve velkém roztáčet. Peníze létají vzduchem za luxusní a kolikrát i zbytečné věci, ale nedochází jim, že pro policii tak zanechávají jasné stopy...","medium":"Movie","categories":[{"id":"lgi-obolite-sk-prod-master:genre-9","title":"Drama","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"},{"id":"lgi-obolite-sk-prod-master:genre-33","title":"Akcia","scheme":"urn:libertyglobal:metadata:cs:ContentCS:2014_1"}],"isAdult":false,"parentalRating":"15","cast":["Zach Galifianakis","Kristen Wiigová","Owen Wilson","Kate McKinnon","Leslie Jones","Jason Sudeikis","Ross Kimball","Devin Ratray","Mary Elizabeth Ellisová","Jon Daly","Ken Marino","Daniel Zacapa","Tom Werme","Njema Williams","Nils Cruz","Michael Fraguada","Christian Gonzalez","Candace Blanchard","Karsten Friske","Dallas Edwards","Barry Ratcliffe","Shelton Grant","Laura Palka","Reegus Flenory","Wynn Reichert","Jill Jane Clements","Joseph S. Wilson","Jee An","Rhoda Griffisová","Nicole Dupre Sobchack"],"directors":["Scott August","Richard L. Fox","Michelle Malley-Campos","Sebastian Mazzola","Steven Ritzi","Pete Waterman","Jared Hess"],"images":[{"assetType":"HighResLandscape","assetTypes":["HighResLandscape"],"url":"http://62.179.125.152/SK/Images/hrl_fd098116bac1429318aaf5fdae498ce76e258782.jpg"},{"assetType":"HighResPortrait","assetTypes":["HighResPortrait"],"url":"http://62.179.125.152/SK/Images/hrp_6f857ae9375b3bcceb6353a5b35775f52cd85302.jpg"},{"assetType":"boxCover","assetTypes":["boxCover"],"url":"http://62.179.125.152/SK/Images/bc_3f5a24412c7f4f434094fa1147a304aa6a5ebda6.jpg"},{"assetType":"boxart-small","assetTypes":["boxart-small"],"url":"http://62.179.125.152/SK/Images/bc_3f5a24412c7f4f434094fa1147a304aa6a5ebda6.jpg?w=75&h=108&mode=box"},{"assetType":"boxart-medium","assetTypes":["boxart-medium"],"url":"http://62.179.125.152/SK/Images/bc_3f5a24412c7f4f434094fa1147a304aa6a5ebda6.jpg?w=110&h=159&mode=box"},{"assetType":"boxart-xlarge","assetTypes":["boxart-xlarge"],"url":"http://62.179.125.152/SK/Images/bc_3f5a24412c7f4f434094fa1147a304aa6a5ebda6.jpg?w=210&h=303&mode=box"},{"assetType":"boxart-large","assetTypes":["boxart-large"],"url":"http://62.179.125.152/SK/Images/bc_3f5a24412c7f4f434094fa1147a304aa6a5ebda6.jpg?w=180&h=260&mode=box"}],"rootId":"crid:~~2F~~2Fport.cs~~2F71927954","parentalRatingDescription":[],"resolutions":[],"mediaGroupId":"crid:~~2F~~2Fport.cs~~2F71927954","shortDescription":"David (Zach Galifianakis) je nekomplikovaný muž, který uvízl v monotónním životě. Den co den usedá za volant svého obrněného automobilu, aby odvážel obrovské sumy peněz jiných lidí. Jediným...","mediaType":"FeatureFilm","year":"2016","videos":[],"videoStreams":[],"entitlements":["VIP","_OPEN_"],"currentProductIds":[],"currentTvodProductIds":[]},"rootId":"crid:~~2F~~2Fport.cs~~2F71927954","replayTvAvailable":true,"audioTracks":[],"ratings":[],"offersLatestExpirationDate":1676187900000,"replayTvStartOffset":0,"replayTvEndOffset":604800,"replayEnabledOnMobileClients":true,"replaySource":"cloud","isGoReplayableViaExternalApp":false}`)
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
          description: `Během propustky z vězení za účelem návštěvy umírající matky v nemocnici zločinec Cain Burgess (Scott Adkins) unikne svým dozorcům a mizí v ulicích Londýna. Jde o epickou cestu krve a bolesti za dosažením vytoužené pomsty na těch, kteří z něj udělali chladnokrevného vraha.`,
          category: [
            'Drama',
            'Akcia'
          ],
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
            `Ross O'Hennessy`,
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
          description: 'Ambiciózní vysokoškolačka Valentina (Sophie Marceau) studuje literaturu na pařížské Sorbonně a právě se připravuje k závěrečným zkouškám. Žádný odpočinek, žádné volno, žádné večírky, téměř žádný spánek a především a hlavně ... žádná láska! Věří, že jedině tak obstojí před zkušební komisí. Jednoho dne se však odehraje něco, s čím nepočítala. Potká charismatického hudebníka Neda - a bláznivě se zamiluje. V tuto chvíli stojí před osudovým rozhodnutím: zahodí roky obrovského studijního nasazení, nebo odmítne lásku? Nebo se snad dá obojí skloubit dohromady?',
          category: ['Film', 'Komédia'],
          actors: [
            "Sophie Marceauová",
            "Vincent Lindon",
            "Elisabeth Vitali",
            "Elena Pompei",
            "Jean-Claude Leguay",
            "Brigitte Chamarande",
            "Christian Pereira",
            "Gérard Dacier",
            "Roberto Attias",
            "Beppe Chierici",
            "Nathalie Mann",
            "Anne Macina",
            "Janine Souchon",
            "Virginie Demians",
            "Hugues Leforestier",
            "Jacqueline Noëlle",
            "Marc-André Brunet",
            "Isabelle Caubère",
            "André Chazel",
            "Med Salah Cheurfi",
            "Guillaume Corea",
            "Eric Denize",
            "Gilles Gaston-Dreyfuss",
            "Benoît Gourley",
            "Marc Innocenti",
            "Najim Laouriga",
            "Laurent Ledermann",
            "Philippe Maygal",
            "Dominique Pifarely",
            "Ysé Tran"
          ],
          directors: [
            "Francis De Gueltz",
			      "Dominique Talmon",
			      "Claude Pinoteau"
          ],
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
            "Zach Galifianakis",
            "Kristen Wiigová",
            "Owen Wilson",
            "Kate McKinnon",
            "Leslie Jones",
            "Jason Sudeikis",
            "Ross Kimball",
            "Devin Ratray",
            "Mary Elizabeth Ellisová",
            "Jon Daly",
            "Ken Marino",
            "Daniel Zacapa",
            "Tom Werme",
            "Njema Williams",
            "Nils Cruz",
            "Michael Fraguada",
            "Christian Gonzalez",
            "Candace Blanchard",
            "Karsten Friske",
            "Dallas Edwards",
            "Barry Ratcliffe",
            "Shelton Grant",
            "Laura Palka",
            "Reegus Flenory",
            "Wynn Reichert",
            "Jill Jane Clements",
            "Joseph S. Wilson",
            "Jee An",
            "Rhoda Griffisová",
            "Nicole Dupre Sobchack"
          ],
          directors: [
            "Scott August",
            "Richard L. Fox",
            "Michelle Malley-Campos",
            "Sebastian Mazzola",
            "Steven Ritzi",
            "Pete Waterman",
            "Jared Hess"
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
