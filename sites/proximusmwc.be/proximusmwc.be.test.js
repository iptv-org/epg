// npm run channels:parse -- --config=./sites/proximusmwc.be/proximusmwc.be.config.js --output=./sites/proximusmwc.be/proximusmwc.be.channels.xml
// npx epg-grabber --config=sites/proximusmwc.be/proximusmwc.be.config.js --channels=sites/proximusmwc.be/proximusmwc.be.channels.xml --output=guide.xml --days=2

const { parser, url, request } = require('./proximusmwc.be.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-04', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: 'UID0024',
  xmltv_id: 'DasErste.de'
}

it('can generate valid url', () => {
  expect(url).toBe('https://api.proximusmwc.be/v2/graphql')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'Content-Type': 'application/json'
  })
})

it('can generate valid request data', () => {
  expect(request.data({ channel, date })).toMatchObject({
    query:
      'query ($language: String!, $startTime: Int!, $endTime: Int!, $options: SchedulesByIntervalOptions) { schedulesByInterval(language: $language, startTime: $startTime, endTime: $endTime, options: $options) { trailId programReferenceNumber channelId title category startTime endTime image { key url __typename } parentalRating detailUrl grouped description shortDescription category categoryId subCategory links { episodeNumber id seasonId seasonName seriesId seriesTitle title type __typename } seriesId __typename }}',
    variables: {
      endTime: 1646438400,
      language: 'fr',
      options: { channelIds: ['UID0024'] },
      startTime: 1646352000
    }
  })
})

it('can parse response', () => {
  const content = `{"data":{"schedulesByInterval":[{"trailId":"UID0024_202202225537","programReferenceNumber":"107504040014","channelId":"UID0024","title":"Der Bozen-Krimi","category":"C.Magazine","startTime":1646350800,"endTime":1646356200,"description":"Chiara Schoras alias \\"Capo\\" Sonja Schwarz muss im 14. Bozen-Krimi nicht nur einen widersprüchlichen Mordfall aufklären, sondern auch ein Geheimnis ans Licht bringen, das zwei Familien auf schmerzhafte Weise untrennbar verbindet.","image":[{"key":"source","url":"https://experience-cache.proximustv.be:443/posterserver/poster/EPG/250_250_BF6BF77FC28F72FA23EAEA6CAAE98B60.jpg","__typename":"Image"},{"key":"custom","url":"https://experience-cache.proximustv.be:443/posterserver/poster/EPG/w-%width%_h-%height%/250_250_BF6BF77FC28F72FA23EAEA6CAAE98B60.jpg","__typename":"Image"}]}]}}`
  const result = parser({ content, channel, date }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(result).toMatchObject([
    {
      start: '2022-03-03T23:40:00.000Z',
      stop: '2022-03-04T01:10:00.000Z',
      title: `Der Bozen-Krimi`,
      description:
        'Chiara Schoras alias "Capo" Sonja Schwarz muss im 14. Bozen-Krimi nicht nur einen widersprüchlichen Mordfall aufklären, sondern auch ein Geheimnis ans Licht bringen, das zwei Familien auf schmerzhafte Weise untrennbar verbindet.',
      category: 'Magazine',
      icon: 'https://experience-cache.proximustv.be:443/posterserver/poster/EPG/250_250_BF6BF77FC28F72FA23EAEA6CAAE98B60.jpg'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `{"data":{"schedulesByInterval":[]}}`
  })
  expect(result).toMatchObject([])
})
