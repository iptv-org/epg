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
  setApiVersion: function (version) {
    apiVersion = version
  },
  getApiVersion: function () {
    return apiVersion
  },
  fetchApiVersion: fetchApiVersion,
  url: async function ({ channel, date }) {
    if (!apiVersion) {
      await fetchApiVersion()
    }
    return `https://px-epg.azureedge.net/minified-airings/${apiVersion}/${date.format(
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
    if (!content) return programs
    const data = JSON.parse(content)
    const airings = data.airings.data
    const programsData = data.programs.data

    airings.forEach(airing => {
      const programReferenceNumber = airing[2]
      const program = programsData.find(p => p[13] === programReferenceNumber)
      if (program) {
      programs.push({
        title: program[20],
        sub_title: program[11],
        description: program[8],
        category: program[24]?.[channel.lang] ? program[24][channel.lang] : program[7].split('.')[1],
        image: program[12] ? `https://experience-cache.proximustv.be/posterserver/poster/EPG/w-166_h-110/${program[12]}` : null,
        season: program[16],
        episode: program[10],
        actors: program[0],
        director: program[9] ? [program[9]] : null,
        start: dayjs.utc(airing[3]),
        stop: dayjs.utc(airing[4])
      })
      }
    })

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
      .post('https://api.proximusmwc.be/tiams/v3/graphql', query)
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
      // you'll never find what happened here :)
      // load pickx bundle and get react version hash (regex).
      // it's not the best way to get the version but it's the only way to get it.

      // find bundle version
      let bundleVer = "" // default 
      const minBundleVer = "https://www.pickx.be/minimal-bundle-version"
      const bundleVerData = await axios.get(minBundleVer, {
          headers: {
            Origin: 'https://www.pickx.be',
            Referer: 'https://www.pickx.be/'
          }
      })

      if (bundleVerData.status !== 200) {
        bundleVer = "6.1"; // default value in case there's an issue with the API
        console.error(`Using default bundle version: ${bundleVer} since API could not be contacted.`)
      } else {
        bundleVer = bundleVerData.data.version
      }
      // get the minified JS app bundle
      const bundleUrl = `https://components.pickx.be/pxReactPlayer/${bundleVer}/bundle.min.js`

      // now, find the react hash inside the bundle URL
      const bundle = await axios.get(bundleUrl).then(r => {
        const re = /REACT_APP_VERSION_HASH:"([^"]+)"/
        const match = r.data.match(re)
        if (match && match[1]) {
          return match[1]
        } else {
          throw new Error('React app version hash not found')
        }
      }).catch(console.error)

      const versionUrl = `https://www.pickx.be/api/s-${bundle.replace('/REACT_APP_VERSION_HASH:"', '')}`

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
      console.error('Error during fetchApiVersion:', error)
      reject(error)
    }
  })
}
