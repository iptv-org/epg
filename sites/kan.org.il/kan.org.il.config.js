const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')
const cheerio = require('cheerio')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const urls = {
  "Kan11": "https://www.isramedia.net/%D7%9C%D7%95%D7%97-%D7%A9%D7%99%D7%93%D7%95%D7%A8%D7%99%D7%9D/1/%D7%A2%D7%A8%D7%95%D7%A5-11-%D7%A9%D7%99%D7%93%D7%95%D7%A8-%D7%97%D7%99",
  "KanEducational": "https://www.isramedia.net/%D7%9C%D7%95%D7%97-%D7%A9%D7%99%D7%93%D7%95%D7%A8%D7%99%D7%9D/326/%D7%97%D7%99%D7%A0%D7%95%D7%9B%D7%99%D7%AA-23-%D7%A9%D7%99%D7%93%D7%95%D7%A8-%D7%97%D7%99"
}

module.exports = {
  site: 'kan.org.il',
  days: 2,
  url: function ({channel, date}) {
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    const days = Math.floor((date - currentDate) / (24 * 3600 * 1000))
    return urls[channel.site_id] + `?days=${days}`
  },
  parser: function ({content, buffer}) {
    const cont = buffer ? new TextDecoder("windows-1255").decode(buffer) : content;
    let programs = []
    const items = parseItems(cont)
    items.forEach(item => {
      const start = dayjs(parseStart(item))
      const duration = parseDuration(item)
      let stop = start.clone()
      stop = stop.add(Number(duration[0]), 'h')
      stop = stop.add(Number(duration[1]), 'm')
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item),
        start: start,
        stop: stop
      })
    })

    return programs
  },
  request: {
    timeout: 5000,
    responseType: "arraybuffer",
    responseEncoding: 'binary'
  }
}

function parseTitle(item) {
  return item[0].find(".tvguideshowname").text().trim()
}

function parseDuration(item) {
  return item[0].find(".tvshowduration").text().trim().split(":")
}

function parseStart(item) {
  return new Date(item[0].find("time").attr("datetime").toString())
}

function parseDescription(item) {
  return cheerio.load(item[1].find("td")[1]).text().trim()
}

function parseItems(content) {
  const $ = cheerio.load(content)
  const trs = $("tr")
  const items = []
  for (let i = 1; i < trs.length; i += 2) {
    items.push([$(trs.get(i)), $(trs.get(i + 1))])
  }
  return items;
}
