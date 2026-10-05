const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

module.exports = {
  site: 'vivoplay.com.br',
  days: 2,
  url({ channel, date }) {
    const starttime = date.unix()
    const endtime = date.add(1, 'd').unix()

    return `https://contentapi-br.cdn.telefonica.com/25/default/pt-BR/schedules?ca_deviceTypes=null%7C401&ca_channelmaps=779%7Cnull&fields=Pid,Title,Description,ChannelName,ChannelNumber,CallLetter,Start,End,LiveChannelPid,LiveProgramPid,EpgSerieId,SeriesPid,SeriesId,SeasonPid,SeasonNumber,EpisodeNumber,images.videoFrame,images.banner,LiveToVod,AgeRatingPid,forbiddenTechnology,IsSoDisabled&includeRelations=Genre&orderBy=START_TIME%3Aa&filteravailability=false&includeAttributes=ca_cpvrDisable,ca_descriptors,ca_blackout_target,ca_blackout_areas&starttime=${starttime}&endtime=${endtime}&livechannelpids=${channel.site_id}&offset=0&limit=1000`
  },
  parser: function ({ content }) {
    let programs = []
    const items = parseItems(content)
    items.forEach(item => {
      programs.push({
        title: item['Title'],
        description: item['Description'],
        season: item['SeasonNumber'] > 0 ? item['SeasonNumber'] : null,
        episode: item['EpisodeNumber'] > 0 ? item['EpisodeNumber'] : null,
        images: parseImages(item),
        start: dayjs.unix(item['Start']),
        stop: dayjs.unix(item['End'])
      })
    })

    return programs
  },
  async channels() {
    const data = await axios
      .get(
        'https://contentapi-br.cdn.telefonica.com/25/default/pt-BR/contents/all?ca_deviceTypes=401&contentTypes=LCH&ca_active=true&ca_requiresPin=false&includeAttributes=ca_channelmapnumber,ca_devicetypes_qualities,ca_deviceTypes_isPlayback,ca_deviceTypes_isStartOverEnabled,ca_deviceTypes_isPvrPlayback,ca_deviceTypes_isPvrManageable,ca_deviceTypes_isCatchup,ca_channelmaps&includeRelations=ProductDependencies,Media&fields=Pid,Name,ChannelNumber,Dvr,EpgLiveChannelReferenceId,CallLetter,ProviderChannel,LXDChannel,AdvancedCDNServices,CdnBuffer,DefaultLanguageOrders,DistributorId,IsLatencyKey,images.logo,images.icon,UxReference,HasPlaylistExperience,IsHomeBlocked,IsStoverFfwdDisabled,IsStoverRwdDisabled,IsCpvrFfwdDisabled,IsCpvrRwdDisabled,IsCatchupFfwdDisabled,IsCatchupRwdDisabled,IsCowatchEnabled,IsFastChannel,MaxLiveNowGap&orderBy=contentOrder&offset=0&limit=1000'
      )
      .then(r => r.data)
      .catch(console.error)

    return data['Content']['List'].map(channel => ({
      lang: 'pt',
      name: channel['Name'],
      site_id: channel['Pid'].toLowerCase()
    }))
  }
}

function parseImages(item) {
  return item['Images'] && Array.isArray(item['Images']['VideoFrame'])
    ? item['Images']['VideoFrame'].map(vf => vf['Url'])
    : []
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data['Content'])) return []

    return data['Content']
  } catch {
    return []
  }
}
