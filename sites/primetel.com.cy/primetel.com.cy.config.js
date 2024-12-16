const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

module.exports = {
  site: 'primetel.com.cy',
  days: 7, // maxdays=7
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    },
    headers: {
      'Accept-Encoding': 'gzip, deflate',
      'X-Requested-With': 'XMLHttpRequest'
    }
  },
  url({ date }) {
    const formattedDate = date.add(2, 'days').format('YYYY-MM-DD');
    return `https://primetel.com.cy/tv_guide_json/tv${formattedDate}.json`;
  },
  async parser({ content, channel }) {
    const shows = [];
    let data;

    try {
      if (content.trim().length === 0) {
        throw new Error('Empty response content');
      }
      
      if (!isJSON(content)) {
        throw new Error('Response is not in JSON format');
      }
      
      data = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return shows; // Return empty shows array if parsing fails
    }

    data.forEach(item => {
      if (item.id === channel.site_id) {
        item.pr.forEach(pr => {
          const show = {
            title: pr.title || '',
            startTime: dayjs(pr.starting).utc().format(),
            endTime: dayjs(pr.ending).utc().format(),
            description: pr.description || 'No description available'
          };
          if (pr.description) {
            const seasonEpisodeMatch = pr.description.match(/Season#(\d+)Episode#(\d+)/);
            if (seasonEpisodeMatch) {
              show.episode = `S${seasonEpisodeMatch[1]}E${seasonEpisodeMatch[2]}`;
              show.description = show.description.replace(/Season#\d+Episode#\d+/, '').trim();
            }
            const synopsisMatch = pr.description.match(/.*?Synopsis:/);
            if (synopsisMatch) {
              show.subtitle = pr.description.split('Synopsis:')[0].trim();
              show.description = pr.description.split('Synopsis:')[1].trim();
            }
          }
          shows.push(show);
        });
      }
    });

    return shows;
  },
  async channels() {
    const url = `https://primetel.com.cy/tv_guide_json/tv${dayjs().format('YYYY-MM-DD')}.json`;
    const response = await axios.get(url, {
      headers: {
        'Accept-Encoding': 'gzip, deflate',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = response.data;
    const channels = [];

    data.forEach(channel => {
      channels.push({
        lang: 'el',
        name: channel.ch || 'Unknown',
        site_id: channel.id.toString()
      });
    });

    return channels;
  }
};

// Helper function to check if content is in JSON format
function isJSON(content) {
  try {
    JSON.parse(content);
    return true;
  } catch (error) {
    return false;
  }
}
