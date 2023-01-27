const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'teliatv.ee',
  days: 2,
  url({ date, channel }) {
    const [lang, channelId] = channel.site_id.split('#')
    return `https://api.teliatv.ee/dtv-api/3.2/${lang}/epg/guide?channelIds=${
      channelId
    }&relations=programmes&images=webGuideItemLarge&startAt=${date
      .add(1, 'd')
      .format('YYYY-MM-DDTHH:mm')}&startAtOp=lte&endAt=${date.format(
      'YYYY-MM-DDTHH:mm'
    )}&endAtOp=gt`
  },
  parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.name,
        icon: parseIcon(item),
        start: dayjs(item.startAt),
        stop: dayjs(item.endAt)
      })
    })

    return programs
  },
  async channels({ lang }) {
    const data = await axios
      .get(`https://api.teliatv.ee/dtv-api/3.0/${lang}/channel-lists?listClass=tv&ui=tv-web`)
      .then(r => r.data)
      .catch(console.log)

    return Object.values(data.channels).map(item => {
      return {
        lang,
        site_id: item.id,
        name: item.title
      }
    })
  }
}

function parseIcon(item) {
  return item.images.webGuideItemLarge
    ? `https://inet-static.mw.elion.ee${item.images.webGuideItemLarge}`
    : null
}

function parseItems(content, channel) {
  const data = JSON.parse(content)
  if (!data || !data.relations || !data.categoryItems) return []
  const [, channelId] = channel.site_id.split('#')
  const items = data.categoryItems[channelId] || []

  return items
    .map(i => {
      const programmeId = i.related.programmeIds[0]
      if (!programmeId) return null
      const progData = data.relations.programmes[programmeId]
      if (!progData) return null

      return { ...i, ...progData }
    })
    .filter(i => i)
}
