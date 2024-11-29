const dayjs = require('dayjs')

const API_PROGRAM_ENDPOINT = 'https://epg.orangetv.orange.es/epg/Smartphone_Android/1_PRO'
const API_CHANNEL_ENDPOINT = 'https://pc.orangetv.orange.es/pc/api/rtv/v1/GetChannelList?bouquet_id=1&model_external_id=PC&filter_unsupported_channels=false&client=json'
const API_IMAGE_ENDPOINT = 'https://pc.orangetv.orange.es/pc/api/rtv/v1/images'



module.exports = {
  site: 'orangetv.es',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ date }) {
    return `${API_PROGRAM_ENDPOINT}/${date.format('YYYYMMDD')}_8h_1.json`
  },
  parser: function ({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)
    items.forEach(item => {
      programs.push({
        title: item.name,
        description: item.description,
        season: item.seriesSeason || null,
        episode: item.episodeId || null,
        icon: parseIcon(item),
        start: dayjs.utc(item.startDate) || null,
        stop: dayjs.utc(item.endDate) || null,
      })
    })

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .get(API_CHANNEL_ENDPOINT)
      .then(r => r.data)
      .catch(console.log)
    return data.response.map(item => {
      return {
        lang: 'es',
	      name: item.name,
        site_id: item.externalChannelId
      }
    })
  }
}

function parseIcon(item){
  
  if(item.attachments.length > 0){
    const cover = item.attachments.find(i => i.name === "COVER" || i.name === "cover")

    if(cover)
    {
      return `${API_IMAGE_ENDPOINT}${cover.value}`;
    }
  }

  return ''
}

function parseItems(content, channel) {
  const json = typeof content === 'string' ? JSON.parse(content) : content

  const channelData = json.find(i => i.channelExternalId == channel.site_id);

  if(!channelData)
    return [];


  return channelData.programs;
}