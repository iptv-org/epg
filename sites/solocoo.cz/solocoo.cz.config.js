const axios = require('axios')
// const dayjs = require('dayjs')

const tokenCZ = process.env.token_CZ.replaceAll("\"", "")
const tokenSK = process.env.token_SK.replaceAll("\"", "")

module.exports = {
  site: 'skylink.cz',
  maxConnections: 5,
  request: {
    headers: {
      "origin": "https://livetv.skylink.cz",
      "referer": "https://livetv.skylink.cz",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0",
      "Accept": "application/json",
      "authorization": `Bearer ${tokenCZ}`
    },
    timeout: 9000, //
    delay: 3000, // 3 seconds
    cache: {
      ttl: 3 * 60 * 60 * 1000 // 3h
    }
  },
  url: function ({ date, channel }) {
    const channelId = channel.site_id

    const from = date.toJSON()    //date.format('YYYY-MM-DDT[00:00:00.000Z]')
    const until = date.add(1, 'day').toJSON()  //date.add(1, 'day').format('YYYY-MM-DDT[00:00:00.000Z]')

    // console.log("👉 channelId:", channelId)
    // console.log("👉 from:", from)
    // console.log("👉 until:", until)
    // console.log("👉 ISO :", date.add(1, 'day').toJSON())

    return `https://tvapi.solocoo.tv/v1/schedule?channels=${channelId}&from=${from}&until=${until}`
  },
  async parser({ content, channel }) {
    const channelId = channel.site_id
    let programs = []
    let items = parseItems(content).epg[channelId]
    // console.log("👉 items.length:", items.length)



    for (let item of items) {
      // console.log("👉 item:",item)
      // console.log("👉 item.title:", (item.title))
      const detail = await loadProgramDetails(item)
      //console.log("👉 detail:",detail)

      programs.push({
        title: item.title,
        sub_title: parseGenres(item) + parseSeason(item) + parseEpisode(item),
        start: item.params.start,
        stop: item.params.end,
        description: parseSub(detail),
        category: parseFormats(item),
        icon: parseIcon(detail)
      })
    }
    // console.log("👉 programs:",programs)
    return programs
  }
}


async function loadProgramDetails(item, channel) {
  if (!item.id) return {}
  //console.log("item", String(item).length)
  const url = `https://tvapi.solocoo.tv/v1/assets/${(item.id)}/`
  const data = await axios
    .get(
      url, {
      headers: {
        "origin": "https://livetv.skylink.cz",
        "referer": "https://livetv.skylink.cz",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0",
        "Accept": "application/json",
        "authorization": `Bearer ${tokenCZ}`
      },
    }
    )

    .then(r => r.data)
    .catch(console.log)
  //console.log("url 👉",url)
  // console.log("data 👉",data)
  return data || {}

}



function parseItems(content) {
  return JSON.parse(content)
}

function parseSub(detail) {
  if (!detail.desc) return []
  //console.log("detail.desc 👉",detail.desc)
  return detail.desc
}

function parseIcon(detail) {
  if (!detail.images[1]) return []
  //console.log("parseIcon", "detail.images[1].url + "&w=464&h=261")
  return detail.images[1].url + "&w=464&h=261"
}

function parseGenres(item) {
  if (!item.params.genres) return []
  let catUb = item.params.genres.map((genres) => genres.title).join(', ')
  //console.log("detail.map",detail.params.genres.map((title) => title).join(', '))
  return catUb
}


function parseEpisode(item) {
  //console.log("E-lemdh: 👉",(String(item.params.seriesEpisode).length))
  if (!item.params.seriesEpisode) return []
  if (String(item.params.seriesEpisode).length > 3) return []
  return [
    " E:" + item.params.seriesEpisode
  ]
}
function parseSeason(item) {
  //console.log("S-lemdh: 👉",(String(item.params.seriesSeason).length))
  if (!item.params.seriesSeason) return []
  if (String(item.params.seriesSeason).length > 2) return []
  return [
    " S:" + item.params.seriesSeason
  ]
}

function parseFormats(item) {
  if (!item.params.formats) return []
  let catFo = item.params.formats.map((formats) => formats.title).join(', ')
  return catFo
}
