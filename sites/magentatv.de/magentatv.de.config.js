const axios = require('axios')
const dayjs = require('dayjs')

const X_CSRFTOKEN = '6da89c6b271b8c0fabd133b2722ee9e1ddba9564010af8e3'
const COOKIE =
  'JSESSIONID=CDE7D4E5E7C05900BBEAD7DF8FB1DBB0; CSESSIONID=D36E1BF69875141F63B3240B86AFB9B7; CSRFSESSION=6da89c6b271b8c0fabd133b2722ee9e1ddba9564010af8e3; JSESSIONID=CDE7D4E5E7C05900BBEAD7DF8FB1DBB0'

module.exports = {
  site: 'magentatv.de',
  days: 2,
  url: 'https://api.prod.sngtv.magentatv.de/EPG/JSON/PlayBillList',
  request: {
    method: 'POST',
    headers: {
      X_CSRFToken: X_CSRFTOKEN,
      'Content-Type': 'application/json',
      Cookie: COOKIE
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
        icon: parseIcon(item),
        category: parseCategory(item),
        start: parseStart(item),
        stop: parseStop(item)
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .post(
        'https://api.prod.sngtv.magentatv.de/EPG/JSON/AllChannel',
        {
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
        },
        {
          headers: {
            X_CSRFToken: X_CSRFTOKEN,
            'Content-Type': 'application/json',
            Cookie: COOKIE
          }
        }
      )
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

function parseIcon(item) {
  if (!Array.isArray(item.pictures) || !item.pictures.length) return null

  return item.pictures[0].href
}

function parseStart(item) {
  return dayjs(item.starttime)
}

function parseStop(item) {
  return dayjs(item.endtime)
}

function parseItems(content) {
  const data = JSON.parse(content)
  if (!data || !Array.isArray(data.playbilllist)) return []

  return data.playbilllist
}
