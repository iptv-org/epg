const { DateTime } = require('luxon')

module.exports = {
  site: 'meo.pt',
  days: 2,
  url: 'https://authservice.apps.meo.pt/Services/GridTv/GridTvMng.svc/getProgramsFromChannels',
  request: {
    method: 'POST',
    headers: {
      Origin: 'https://www.meo.pt',
      'User-Agent': 'Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 6.1; WOW64; en-US Trident/4.0)'
    },
    data: function ({ channel, date }) {
      return {
        service: 'channelsguide',
        channels: [channel.site_id],
        dateStart: date.format('YYYY-MM-DDT00:00:00-00:00'),
        dateEnd: date.add(1, 'd').format('YYYY-MM-DDT00:00:00-00:00'),
        accountID: ''
      }
    }
  },
  async parser({ content }) {
    const axios = require('axios')
    let programs = []
    const items = parseItems(content)
    if (!items.length) return programs

    // simple per-run in-memory cache
    const detailsCache = new Map()

    for (const item of items) {
      const start = parseStart(item)
      let stop = parseStop(item)
      if (stop < start) {
        stop = stop.plus({ days: 1 })
      }

      let description = ''
      let image = ''

      const programID = item.uniqueId || item.programID || null
      if (programID) {
        let details = detailsCache.get(programID)
        if (!details) {
          details = await fetchProgramDetails(programID, axios).catch(() => null)
          if (details) detailsCache.set(programID, details)
        }
        if (details) {
          description = details.description || description
          image = details.image || image
        }
      }

      const prog = {
        title: item.name || 'Sem título',
        start,
        stop
      }
      if (description) prog.description = description
      if (image) {
        prog.icon = { src: image }
        prog.image = image
      }
      programs.push(prog)
    }

    return programs
  },
  async channels() {
    const axios = require('axios')
    const data = await axios
      .post('https://authservice.apps.meo.pt/Services/GridTv/GridTvMng.svc/getGridAnon', null, {
        headers: {
          Origin: 'https://www.meo.pt'
        }
      })
      .then(r => r.data)
      .catch(console.log)

    // channel logo at data.d.channels.logo

    return data.d.channels
      .map(item => {
        return {
          lang: 'pt',
          site_id: item.sigla,
          name: item.name
        }
      })
      .filter(channel => channel.site_id)
  }
}

function parseStart(item) {
  return DateTime.fromFormat(`${item.date} ${item.timeIni}`, 'd-M-yyyy HH:mm', {
    zone: 'Europe/Lisbon'
  }).toUTC()
}

function parseStop(item) {
  return DateTime.fromFormat(`${item.date} ${item.timeEnd}`, 'd-M-yyyy HH:mm', {
    zone: 'Europe/Lisbon'
  }).toUTC()
}

function parseItems(content) {
  if (!content) return []
  const data = JSON.parse(content)
  const programs = data?.d?.channels?.[0]?.programs

  return Array.isArray(programs) ? programs : []
}

async function fetchProgramDetails(programID, axiosInstance) {
  try {
    const response = await axiosInstance.post(
      'https://authservice.apps.meo.pt/Services/GridTv/GridTvMng.svc/getProgramDetails',
      {
        service: 'programdetail',
        programID: String(programID),
        accountID: ''
      },
      {
        headers: {
          Origin: 'https://www.meo.pt',
          'User-Agent': 'Mozilla/5.0 (compatible; MSIE 7.0; Windows NT 6.1; WOW64; en-US Trident/4.0)'
        },
        timeout: 10000
      }
    )

    //console.log(response.data)
    //output:
    //{
    //  d: {
    //    date: '27-10-2025',
    //    startTime: '07:30',
    //    endTime: '08:00',
    //    channelNum: 262,
    //    channelName: 'Euronews (A)',
    //    channelSigla: 'EURNA',
    //    channelLogo: 'https://www.meo.pt/PublishingImages/canais/euronews-a-meo-logo.webp',
    //    channelFriendlyUrlName: 'Euronews_a',
    //    channelMoreInfo: { Label: '', Link: '' },
    //    progId: 22132185,
    //    uniqueId: 41262380,
    //    progName: 'Wake up Europe',
    //    progImageM: 'http://services.online.meo.pt/Data/2013/11/programs/media/image/22132185/M',
    //    progImageL: 'http://services.online.meo.pt/Data/2013/11/programs/media/image/22132185/L',
    //    progImageXL: 'http://services.online.meo.pt/Data/2013/11/programs/media/image/22132185/XL',
    //    isAdultContent: false,
    //    description: "Live headlines,breaking news, analysis and interviews from Europe's News Centre.",
    //    onlineLnk: 'https://meogo.meo.pt/ver?programa=22132185',
    //    timeTable: [],
    //    recordType: -1,
    //    recordingDefinitionID: '00000000-0000-0000-0000-000000000000',
    //    recordingprogramID: '00000000-0000-0000-0000-000000000000',
    //    seriesID: '609494288',
    //    hardPadEndSeconds: -1,
    //    keepUntil: -1,
    //    airTime: -1,
    //    showTime: -1
    //  }
    //}

    const data = response.data
    // Response structure has program data directly in data.d
    const program = data?.d
    if (!program || typeof program !== 'object') return null

    // Try different image sizes in order of preference (XL > L > M)
    const image =
      program.progImageXL || program.progImageL || program.progImageM || null
    const description = program.description || null

    return { description, image }
  } catch (err) {
    // Silent fail returning null so parser continues
    return null
  }
}
