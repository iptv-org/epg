// npx epg-grabber --config=sites/programetv.ro/programetv.ro.config.js --channels=sites/programetv.ro/programetv.ro.channels.xml --output=guide.xml --days=2

const { parser, url } = require('./programetv.ro.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-10-24', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'pro-tv', xmltv_id: 'ProTV.ro' }
const content = `
<!DOCTYPE html>
<html lang="en-US">
<head>
<script>
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-WPX9FM9');
var cfg = {"homeUrl":"https:\/\/www.programetv.ro\/","loginUrl":"https:\/\/www.programetv.ro\/auth\/login","logoutUrl":"https:\/\/www.programetv.ro\/auth\/logout","nowOnTvUrl":"https:\/\/www.programetv.ro\/acum-la-tv\/","favoriteStationsUrl":"https:\/\/www.programetv.ro\/posturi-tv\/favorite\/","saveFavoritesUrl":"https:\/\/www.programetv.ro\/save-favorites\/","popularStationsUrl":"https:\/\/www.programetv.ro\/posturi-tv\/populare\/","stationListUrl":"https:\/\/www.programetv.ro\/posturi-tv\/","privacyPolicyUrl":"https:\/\/www.programetv.ro\/privacy-policy\/","user":false,"showMovieDetails":true,"banners":{"inlist":{"enabled":true,"code":"9647692440"},"footer":{"enabled":true,"code":"9608163999"},"modal":{"enabled":true,"code":"3427954368"}}};
var __stations = [];
var pageData = {"station":{"id":"1","displayName":"PRO TV","domain":"Românești","icon":"https://static.cinemagia.ro/img/tv_station/pro-tv.jpg","tvProvider":[{"tvPId":"2","tvPPos":["113"]},{"tvPId":"3","tvPPos":["113"]},{"tvPId":"4","tvPPos":["113"]},{"tvPId":"5","tvPPos":["3"]},{"tvPId":"6","tvPPos":["3"]},{"tvPId":"8","tvPPos":["4"]},{"tvPId":"11","tvPPos":["111"]}]},"shows":[{"id":"690127679","start":"2021-11-07T07:00:00+02:00","stop":"2021-11-07T09:59:59+02:00","stationId":"1","replay":false,"live":true,"online":true,"OTTRights":true,"categories":["Ştiri"],"title":"Ştirile Pro Tv","tvShowId":"5","desc":"În fiecare zi, cele mai importante evenimente, transmisiuni LIVE, analize, anchete şi reportaje sunt la Ştirile ProTV.","obs":"În fiecare zi, cele mai importante evenimente, transmisiuni LIVE, analize, anchete şi reportaje sunt la Ştirile ProTV.","icon":"https://www.programetv.ro/img/shows/84/54/stirile-pro-tv.png?key=Z2lfZnVial90cmFyZXZwLzAwLzAwLzA1LzE4MzgxMnktMTIwazE3MC1hLW40NTk4MW9zLmNhdA==","templating":[]}],"date":"2021-11-07","controls ":[{"date":"2021-11-03","slug":"ieri","label":"Ieri","name":"Ieri","url":"https://www.programetv.ro/post/pro-tv/ieri/"},{"date":"2021-11-04","slug":"azi","label":"Azi","name":"Azi","url":"https://www.programetv.ro/post/pro-tv/"},{"date":"2021-11-05","slug":"vineri","label":"Vi","name":"Vineri","url":"https://www.programetv.ro/post/pro-tv/vineri/"},{"date":"2021-11-06","slug":"sambata","label":"Sb","name":"Sâmbătă","url":"https://www.programetv.ro/post/pro-tv/sambata/"},{"date":"2021-11-07","slug":"duminica","label":"Du","name":"Duminică","url":"https://www.programetv.ro/post/pro-tv/duminica/"},{"date":"2021-11-08","slug":"luni","label":"Lu","name":"Luni","url":"https://www.programetv.ro/post/pro-tv/luni/"},{"date":"2021-11-09","slug":"marti","label":"Ma","name":"Marți","url":"https://www.programetv.ro/post/pro-tv/marti/"}],"todayDate":"2021-11-04","adsenabled":true};
var __controls = [{"date":"2021-11-03","slug":"ieri","label":"Ieri","name":"Ieri","url":"https://www.programetv.ro/post/pro-tv/ieri/"},{"date":"2021-11-04","slug":"azi","label":"Azi","name":"Azi","url":"https://www.programetv.ro/post/pro-tv/"},{"date":"2021-11-05","slug":"vineri","label":"Vi","name":"Vineri","url":"https://www.programetv.ro/post/pro-tv/vineri/"},{"date":"2021-11-06","slug":"sambata","label":"Sb","name":"Sâmbătă","url":"https://www.programetv.ro/post/pro-tv/sambata/"},{"date":"2021-11-07","slug":"duminica","label":"Du","name":"Duminică","url":"https://www.programetv.ro/post/pro-tv/duminica/"},{"date":"2021-11-08","slug":"luni","label":"Lu","name":"Luni","url":"https://www.programetv.ro/post/pro-tv/luni/"},{"date":"2021-11-09","slug":"marti","label":"Ma","name":"Marți","url":"https://www.programetv.ro/post/pro-tv/marti/"}];</script></head>
<body></body>
</html>`

it('can generate valid url', () => {
  const result = url({ date, channel })
  expect(result).toBe('https://www.programetv.ro/post/pro-tv/duminica/')
})

it('can parse response', () => {
  const result = parser({ date, channel, content })
  expect(result).toMatchObject([
    {
      start: '2021-11-07T05:00:00.000Z',
      stop: '2021-11-07T07:59:59.000Z',
      title: 'Ştirile Pro Tv',
      description: `În fiecare zi, cele mai importante evenimente, transmisiuni LIVE, analize, anchete şi reportaje sunt la Ştirile ProTV.`,
      category: ['Ştiri'],
      icon: 'https://www.programetv.ro/img/shows/84/54/stirile-pro-tv.png?key=Z2lfZnVial90cmFyZXZwLzAwLzAwLzA1LzE4MzgxMnktMTIwazE3MC1hLW40NTk4MW9zLmNhdA=='
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `
<!DOCTYPE html>
<html lang="en-US">
<head>
<script>
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-WPX9FM9');
var cfg = {"homeUrl":"https:\/\/www.programetv.ro\/","loginUrl":"https:\/\/www.programetv.ro\/auth\/login","logoutUrl":"https:\/\/www.programetv.ro\/auth\/logout","nowOnTvUrl":"https:\/\/www.programetv.ro\/acum-la-tv\/","favoriteStationsUrl":"https:\/\/www.programetv.ro\/posturi-tv\/favorite\/","saveFavoritesUrl":"https:\/\/www.programetv.ro\/save-favorites\/","popularStationsUrl":"https:\/\/www.programetv.ro\/posturi-tv\/populare\/","stationListUrl":"https:\/\/www.programetv.ro\/posturi-tv\/","privacyPolicyUrl":"https:\/\/www.programetv.ro\/privacy-policy\/","user":false,"showMovieDetails":true,"banners":{"inlist":{"enabled":true,"code":"9647692440"},"footer":{"enabled":true,"code":"9608163999"},"modal":{"enabled":true,"code":"3427954368"}}};
var __stations = [];</script></head>
<body></body>
</html>
`
  })
  expect(result).toMatchObject([])
})
