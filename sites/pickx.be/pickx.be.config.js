const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')

let apiVersion
let isApiVersionFetched = false

;(async () => {
  try {
    await fetchApiVersion()
    isApiVersionFetched = true
  } catch (error) {
    console.error('Error during script initialization:', error)
  }
})()

dayjs.extend(utc)

module.exports = {
  site: 'pickx.be',
  days: 2,
  apiVersion: function () {
    return apiVersion
  },
  fetchApiVersion: fetchApiVersion, // Export fetchApiVersion
  url: async function ({ channel, date }) {
    while (!isApiVersionFetched) {
      await new Promise(resolve => setTimeout(resolve, 100)) // Wait for 100 milliseconds
    }
    return `https://px-epg.azureedge.net/airings/${apiVersion}/${date.format(
      'YYYY-MM-DD'
    )}/channel/${channel.site_id}?timezone=Europe%2FBrussels`
  },
  request: {
    headers: {
      Origin: 'https://www.pickx.be',
      Referer: 'https://www.pickx.be/'
    }
  },
  parser({ channel, content }) {
    const programs = []
    if (content) {
      const items = JSON.parse(content)
      items.forEach(item => {
        programs.push({
          title: item.program.title,
          sub_title: item.program.episodeTitle,
          description: item.program.description,
          category: item.program.translatedCategory?.[channel.lang]
            ? item.program.translatedCategory[channel.lang]
            : item.program.category.split('.')[1],
          image: item.program.posterFileName
            ? `https://experience-cache.proximustv.be/posterserver/poster/EPG/w-166_h-110/${item.program.posterFileName}`
            : null,
          season: item.program.seasonNumber,
          episode: item.program.episodeNumber,
          actors: item.program.actors,
          director: item.program.director ? [item.program.director] : null,
          start: dayjs.utc(item.programScheduleStart),
          stop: dayjs.utc(item.programScheduleEnd)
        })
      })
    }

    return programs
  },
  async channels({ lang = '' }) {
    const query = {
      operationName: 'getChannels',
      variables: {
        language: lang,
        queryParams: {},
        id: '0',
        params: {
          shouldReadFromCache: true
        }
      },
      query: `query getChannels($language: String!, $queryParams: ChannelQueryParams, $id: String, $params: ChannelParams) {
          channels(language: $language, queryParams: $queryParams, id: $id, params: $params) {
            id
            channelReferenceNumber
            name
            callLetter
            number
            logo {
              key
              url
              __typename
            }
            language
            hd
            radio
            replayable
            ottReplayable
            playable
            ottPlayable
            recordable
            subscribed
            cloudRecordable
            catchUpWindowInHours
            isOttNPVREnabled
            ottNPVRStart
            subscription {
              channelRef
              subscribed
              upselling {
                upsellable
                packages
                __typename
              }
              __typename
            }
            packages
            __typename
          }
        }`
    }
    const result = await axios
      .post('https://api.proximusmwc.be/tiams/v2/graphql', query)
      .then(r => r.data)
      .catch(console.error)

    return (
      result?.data?.channels
        .filter(
          channel =>
            !channel.radio && (!lang || channel.language === (lang === 'de' ? 'ger' : lang))
        )
        .map(channel => {
          return {
            lang: channel.language === 'ger' ? 'de' : channel.language,
            site_id: channel.id,
            name: channel.name
          }
        }) || []
    )
  }
}
function fetchApiVersion() {
  return new Promise(async (resolve, reject) => {
    try {
      // https://px-epg.azureedge.net/version is deprecated
      // probably the version url will be changed around over time

      //history of used version urls
      //const versionUrl = 'https://www.pickx.be/api/s-3b36540f3cef64510112f3f95c2c0cdca321997ed2b1042ad778523235e155eb'
      //const versionUrl = 'https://www.pickx.be/api/s-671f172425e1bc74cd0440fd67aaa6cbe68b582f3f401186c2f46ae97e80516b'
      //const versionUrl = 'https://www.pickx.be/api/s-a6b4b4fefaa20e438523a6167e63b8504d96b9df8303473349763c4418cffe30'
      //const versionUrl = 'https://www.pickx.be/api/s-8546c5fd136241d42aab714d2fe3ccc5671fd899035efae07cd0b8f4eb23994e'
      //const versionUrl = 'https://www.pickx.be/api/s-64464ad9a3bc117af5dca620027216ecade6a51c230135a0f134c0ee042ff407';
      //const versionUrl = 'https://www.pickx.be/api/s-626d8fdabfb1d44e5a614cd69f4b45d6843fdb63566fc80ea4f97f40e4ea3152';
      //const versionUrl = 'https://www.pickx.be/api/s-cefaf96e249e53648c4895c279e7a621233c50b4357d62b0bdf6bff45f31b5c0';
      //const versionUrl = 'https://www.pickx.be/api/s-7fa35253080e9665f9c7d9d85e707d6fb1d1bf07ede11965e859fcb57c723949';
      //the new strategy to break the provider is to leave old version url's available and to return invalid results on those endpoints

      const versionUrl = 'https://www.pickx.be/api/s-0e58be3938175b6b900dfb5233bd5cfc0bcf915b633fe57b935f7ce8dbe5f6eb';


      const response = await axios.get(versionUrl, {
        headers: {
          Origin: 'https://www.pickx.be',
          Referer: 'https://www.pickx.be/'
        }
      })

      if (response.status === 200) {
        apiVersion = response.data.version
        resolve()
      } else {
        console.error(`Failed to fetch API version. Status: ${response.status}`)
        reject(`Failed to fetch API version. Status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching API version:', error.message)
      reject(error)
    }
  })
}
