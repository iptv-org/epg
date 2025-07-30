const axios = require('axios')
const dayjs = require('dayjs')

module.exports = {
  site: 'chaines-tv.orange.fr',
  days: 2,
  url({ channel, date }) {
    return `https://rp-ott-mediation-tv.woopic.com/api-gw/live/v3/applications/STB4PC/programs?groupBy=channel&includeEmptyChannels=false&period=${date.valueOf()},${date
      .add(1, 'd')
      .valueOf()}&after=${channel.site_id}&limit=1`
  },
  async parser({ content, channel }) {
    let programs = []
    const items = parseItems(content, channel)

    for (const item of items) {
      const start = parseStart(item)
      const stop = parseStop(item, start)
      const url = parseDetailURL(item)
      let itemDetails = null
      if (url) {    
  	    try {
          const response = await axios.get(url, {}, {
  				headers: {
    				'Accept': 'application/json',
    				'Content-Type': 'application/json'
  				}	
			})
		  itemDetails = response.data
        } catch (err) {
          console.error(`Error fetching details for item: ${url}`, err)
        }
  	  }
      
      programs.push({
        title: item.title,
        subTitle: item.season?.serie?.title,
        category: item.genreDetailed,
        description: item.synopsis,
        season: parseSeason(item),
        episode: parseEpisode(item),
        image: parseImage(item),
        start: start.toJSON(),
        stop: stop.toJSON(),
        date: itemDetails?.productionDate,
        directors: parseDirectors(itemDetails),
        actors: parseActors(itemDetails),
        country: itemDetails?.productionCountries
      })
    }
    return programs
  },
  async channels() {
    const token = await getTVToken()
    const json = await axios
      .get('https://mediation-tv.orange.fr/all/api-gw/bff-live-player-rights/v1/auth/accountToken/livePlayerRights?customerOrangePopulation=OTT_Metro&deviceCategory=W_PC',{
        headers: {'tv_token': 'Bearer ' + token, 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
        }})
      .then(r => r.data)
      .catch(console.log)

    const data = json
    const items = data.channels

    return items.map(item => {
      return {
        lang: 'fr',
        site_id: item.epgId,
        name: item.name,
        logo: item.logos[0]?.logoImageUrl.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
      }
    })
  }
}

async function getTVToken() {
    try {
        const response = await axios.get('https://tv.orange.fr/')
        const html = response.data
        
        // Look for window.__pinia = {...} specifically
        const match = html.match(/window\.__pinia\s*=\s*({[^;]+})/)
        
        if (!match) {
            console.log('__pinia pattern not found')
            return null
        }
        
        const [, piniaData] = match
        const data = JSON.parse(piniaData)
        return data.authStore?.authInitEw?.token
    } catch (error) {
        console.error('Error:', error)
        return null
    }
}

function parseDetailURL(item) {
	return item?.links && item?.links.length ? item?.links[0]?.href : null
}

function parseDirectors(itemDetails) {
  if (!itemDetails) return []
  if (!itemDetails?.contributors) return []
  if (!itemDetails?.contributors?.directors) return []
  // Add value in the array of directors instead of firstName + lastName see:
  // https://www.npmjs.com/package/epg-grabber
  return itemDetails?.contributors?.directors.map(director => ({value: `${director.firstName} ${director.lastName}`}))
}

function parseActors(itemDetails) {
  if (!itemDetails) return []
  if (!itemDetails?.contributors) return []
  if (!itemDetails?.contributors?.actors) return []
  // Add value in the array of actors instead of firstName + lastName see:
  // https://www.npmjs.com/package/epg-grabber
  return itemDetails?.contributors?.actors.map(actor => ({value: `${actor.firstName} ${actor.lastName}`}))
}

function parseImage(item) {
  return item.covers && item.covers.length ? item.covers[0].url : null
}

function parseStart(item) {
  return dayjs.unix(item.diffusionDate)
}

function parseStop(item, start) {
  return start.add(item.duration, 's')
}

function parseSeason(item) {
  return item.season?.number
}

function parseEpisode(item) {
  return item.episodeNumber
}

function parseItems(content, channel) {
  const data = JSON.parse(content)

  return data && data[channel.site_id] ? data[channel.site_id] : []
}
