const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const { upperCase } = require('lodash')

let X_CSRFTOKEN
let Cookie
const cookiesToExtract = ['JSESSIONID', 'CSESSIONID', 'CSRFSESSION']

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'web.magentatv.de',
  days: 2,
  url: 'https://api.prod.sngtv.magentatv.de/EPG/JSON/PlayBillList',
  request: {
    method: 'POST',
    async headers() {
      return await setHeaders()
    },
    data({ channel, date }) {
      return {
        count: -1,
        isFillProgram: 1,
        offset: 0,
        properties: [
          {
            include:
              'endtime,genres,id,name,starttime,channelid,pictures,introduce,subName,seasonNum,subNum,cast,country,producedate,externalIds',
            name: 'playbill'
          }
        ],
        type: 2,
        begintime: date.format('YYYYMMDD000000'),
        channelid: channel.site_id,
        endtime: date.add(1, 'd').format('YYYYMMDD000000')
      }
    }
  },
  parser({ content }) {
    const programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.name,
        description: item.introduce,
        image: parseImage(item),
        category: parseCategory(item),
        start: parseStart(item),
        stop: parseStop(item),
        sub_title: item.subName,
        season: item.seasonNum,
        episode: item.subNum,
        directors: parseDirectors(item),
        producers: parseProducers(item),
        adapters: parseAdapters(item),
        country: upperCase(item.country),
        date: item.producedate,
        urls: parseUrls(item)
      })
    })
    return programs
  },
  async channels() {
    const url = 'https://api.prod.sngtv.magentatv.de/EPG/JSON/AllChannel'
    const body = {
      channelNamespace: 2,
      filterlist: [
        {
          key: 'IsHide',
          value: '-1'
        }
      ],
      metaDataVer: 'Channel/1.1',
      properties: [
        {
          include: '/channellist/logicalChannel/contentId,/channellist/logicalChannel/name',
          name: 'logicalChannel'
        }
      ],
      returnSatChannel: 0
    }
    const params = {
      headers: await setHeaders()
    }

    const data = await axios
      .post(url, body, params)
      .then(r => r.data)
      .catch(console.log)

    return data.channellist.map(item => {
      return {
        lang: 'de',
        site_id: item.contentId,
        name: item.name
      }
    })
  }
}

function parseCategory(item) {
  return item.genres
    ? item.genres
        .replace('und', ',')
        .split(',')
        .map(i => i.trim())
    : []
}

function parseDirectors(item) {
  if (!item.cast || !item.cast.director) return []
  return item.cast.director
    .replace('und', ',')
    .split(',')
    .map(i => i.trim())
}

function parseProducers(item) {
  if (!item.cast || !item.cast.producer) return []
  return item.cast.producer
    .replace('und', ',')
    .split(',')
    .map(i => i.trim())
}

function parseAdapters(item) {
  if (!item.cast || !item.cast.adaptor) return []
  return item.cast.adaptor
    .replace('und', ',')
    .split(',')
    .map(i => i.trim())
}

function parseUrls(item) {
  // currently only a imdb id is returned by the api, thus we can construct the url here
  if (!item.externalIds) return []
  return JSON.parse(item.externalIds)
    .filter(externalId => externalId.type === 'imdb' && externalId.id)
    .map(externalId => ({ system: 'imdb', value: `https://www.imdb.com/title/${externalId.id}` }))
}

function parseImage(item) {
  if (!Array.isArray(item.pictures) || !item.pictures.length) return null

  return item.pictures[0].href
}

function parseStart(item) {
  return dayjs.utc(item.starttime, 'YYYY-MM-DD HH:mm:ss')
}

function parseStop(item) {
  return dayjs.utc(item.endtime, 'YYYY-MM-DD HH:mm:ss')
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.playbilllist)) return []

  return data.playbilllist
}

async function fetchCookieAndToken() {
  // Only fetch the cookies and csrfToken if they are not already set
  if (X_CSRFTOKEN && Cookie) {
    return
  }

  try {
    const response = await axios.request({
      url: 'https://api.prod.sngtv.magentatv.de/EPG/JSON/Authenticate',
      params: {
        SID: 'firstup',
        T: 'Windows_chrome_118'
      },
      method: 'POST',
      data: '{"terminalid":"00:00:00:00:00:00","mac":"00:00:00:00:00:00","terminaltype":"WEBTV","utcEnable":1,"timezone":"Etc/GMT0","userType":3,"terminalvendor":"Unknown"}',
    })

    // Extract the cookies specified in cookiesToExtract
    const setCookieHeader = response.headers['set-cookie'] || []
    const extractedCookies = []
    cookiesToExtract.forEach(cookieName => {
      const regex = new RegExp(`${cookieName}=(.+?)(;|$)`)
      const match = setCookieHeader.find(header => regex.test(header))

      if (match) {
        const cookieString = regex.exec(match)[0]
        extractedCookies.push(cookieString)
      }
    })

    // check if we recieved a csrfToken only then store the values
    if (!response.data.csrfToken) {
      console.log('csrfToken not found in the response.')
      return
    }

    X_CSRFTOKEN = response.data.csrfToken
    Cookie = extractedCookies.join(' ')

  } catch(error) {
    console.error(error)
  }
}

async function setHeaders() {
  await fetchCookieAndToken()

  return { X_CSRFTOKEN, Cookie }
}
