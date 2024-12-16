const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const cheerio = require('cheerio');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

module.exports = {
  site: 'siminn.is',
  days: 7, // maxdays=7
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    },
    headers: {
      'Accept-Encoding': 'gzip, deflate, br'
    }
  },
  url({ channel, date }) {
    const formattedDate = date.format('YYYY-MM-DD');
    return `https://siminn-proxy.siminn.is/api/getChannels?channelId=${channel.site_id}&time=${formattedDate}`;
  },
  parser: function ({ content, date, channel }) {
    let programs = []
    const data = JSON.parse(content)
	if (!data || !Array.isArray(data)) return []
    return data.map(item => ({
        title: item.title,
        description: item.description,
        episode: item.episode ? {
         title: item.episode.title,
         description: item.episode.description,
         seasonNumber: item.episode.seasonNumber,
         episodeNumber: item.episode.episodeNumber
        } : null,
        start: dayjs(item.start).utc().format(),
        stop: dayjs(item.end).utc().format()
    }))

    return programs
  },
  async channels() {
    const url = 'https://www.siminn.is/sjonvarp';
    const response = await axios.get(url, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    const $ = cheerio.load(response.data);
    const channels = [];

    $('.channelinfo').each((index, element) => {
      const siteId = $(element).find('.channelID').text().trim();
      const name = $(element).find('.channelName').text().trim();

      channels.push({
        lang: 'is',
        name: name,
        site_id: siteId
      });
    });

    return channels;
  }
};
