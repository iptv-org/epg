const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const fetch = require('node-fetch')

let X_CSRFTOKEN
let COOKIE
const cookiesToExtract = ['JSESSIONID', 'CSESSIONID', 'CSRFSESSION']
const extractedCookies = {}

dayjs.extend(utc)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'web.magentatv.de',
  days: 2,
  url: 'https://api.prod.sngtv.magentatv.de/EPG/JSON/PlayBillList',
  request: {
    method: 'POST',
    headers: function () {
      return setHeaders()
    },

    data({ channel, date }) {
      return {
        count: -1,
        isFillProgram: 1,
        offset: 0,
        properties: [
          {
            include: 'endtime,genres,id,name,starttime,channelid,pictures,introduce',
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
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item.name,
        description: item.introduce,
        image: parseImage(item),
        category: parseCategory(item),
        start: parseStart(item),
        stop: parseStop(item)
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

// Function to try to fetch COOKIE and X_CSRFTOKEN
function fetchCookieAndToken() {
  return fetch(
    'https://api.prod.sngtv.magentatv.de/EPG/JSON/Authenticate?SID=firstup&T=Windows_chrome_118',
    {
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        Referer: 'https://web.magentatv.de/',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      },
      body: '{"terminalid":"00:00:00:00:00:00","mac":"00:00:00:00:00:00","terminaltype":"WEBTV","utcEnable":1,"timezone":"Etc/GMT0","userType":3,"terminalvendor":"Unknown"}',
      method: 'POST'
    }
  )
    .then(response => {
      // Check if the response status is OK (2xx)
      if (!response.ok) {
        throw new Error('HTTP request failed')
      }

      // Extract the set-cookie header
      const setCookieHeader = response.headers.raw()['set-cookie']

      // Extract the cookies specified in cookiesToExtract
      cookiesToExtract.forEach(cookieName => {
        const regex = new RegExp(`${cookieName}=(.+?)(;|$)`)
        const match = setCookieHeader.find(header => regex.test(header))

        if (match) {
          const cookieValue = regex.exec(match)[1]
          extractedCookies[cookieName] = cookieValue
        }
      })

      return response.json()
    })
    .then(data => {
      if (data.csrfToken) {
        X_CSRFTOKEN = data.csrfToken
        COOKIE = `JSESSIONID=${extractedCookies.JSESSIONID}; CSESSIONID=${extractedCookies.CSESSIONID}; CSRFSESSION=${extractedCookies.CSRFSESSION}; JSESSIONID=${extractedCookies.JSESSIONID};`
      } else {
        console.log('csrfToken not found in the response.')
      }
    })
    .catch(error => {
      console.error(error)
    })
}

function setHeaders() {
  return fetchCookieAndToken().then(() => {
    return {
      X_CSRFTOKEN: X_CSRFTOKEN,
      'Content-Type': 'application/json',
      Cookie: COOKIE
    }
  })
}
