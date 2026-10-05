const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'tv.movistar.co',
  days: 2,
  url({ channel, date }) {
    return `https://contentapi-co.cdn.telefonica.com/33/default/es-CO/schedules?ca_deviceTypes=null%7C401&ca_channelmaps=166%7Cnull&fields=Pid,Title,Description,ChannelName,ChannelNumber,CallLetter,Start,End,EpgNetworkDvr,LiveChannelPid,LiveProgramPid,EpgSerieId,SeriesPid,SeriesId,SeasonPid,SeasonNumber,images.videoFrame,images.banner,LiveToVod,AgeRatingPid,forbiddenTechnology,IsSoDisabled&includeRelations=Genre&orderBy=START_TIME%3Aa&filteravailability=false&includeAttributes=ca_cpvrDisable,ca_descriptors,ca_blackout_target,ca_blackout_areas&starttime=${date.unix()}&endtime=${date.add(1, 'd').unix()}&livechannelpids=${channel.site_id}&offset=0&limit=1000`
  },
  parser({ content }) {
    const items = parseItems(content)

    return items.map(item => {
      return {
        title: item.Title,
        description: item.Description,
        images: parseImages(item),
        start: dayjs.unix(item.Start),
        stop: dayjs.unix(item.End)
      }
    })
  },
  async channels() {
    const data = await axios
      .get(
        'https://contentapi-co.cdn.telefonica.com/33/default/es-CO/contents/all?ca_deviceTypes=401&contentTypes=LCH&ca_active=true&ca_requiresPin=false&includeAttributes=ca_channelmapnumber,ca_devicetypes_qualities,ca_deviceTypes_isPlayback,ca_deviceTypes_isStartOverEnabled,ca_deviceTypes_isPvrPlayback,ca_deviceTypes_isPvrManageable,ca_deviceTypes_isCatchup,ca_channelmaps&includeRelations=ProductDependencies,Media&fields=Pid,Name,ChannelNumber,Dvr,EpgLiveChannelReferenceId,CallLetter,ProviderChannel,LXDChannel,AdvancedCDNServices,CdnBuffer,DefaultLanguageOrders,DistributorId,IsLatencyKey,images.logo,images.icon,UxReference,HasPlaylistExperience,IsHomeBlocked,IsStoverFfwdDisabled,IsStoverRwdDisabled,IsCpvrFfwdDisabled,IsCpvrRwdDisabled,IsCatchupFfwdDisabled,IsCatchupRwdDisabled,IsCowatchEnabled,IsFastChannel,MaxLiveNowGap,IsDolby,IsDolbyAtmos&orderBy=contentOrder&offset=0&limit=1000'
      )
      .then(r => r.data)
      .catch(console.error)

    return data.Content.List.map(channel => {
      return {
        lang: 'es',
        site_id: channel.Pid.toLowerCase(),
        name: channel.Title
      }
    })
  }
}

function parseImages(item) {
  if (!item.Images || !Array.isArray(item.Images.VideoFrame)) return []

  return item.Images.VideoFrame.map(frame => frame.Url)
}

function parseItems(content) {
  try {
    const data = JSON.parse(content)
    if (!data || !Array.isArray(data.Content)) return []

    return data.Content
  } catch {
    return []
  }
}
