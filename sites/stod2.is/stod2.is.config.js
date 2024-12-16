const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);

module.exports = {
  site: 'stod2.is',
  days: 2,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ channel }) {
    return `https://api.stod2.is/dagskra/api/${channel.site_id}`;
  },
  parser({ content }) {
    let programs = [];
    const items = parseItems(content);

    items.forEach(item => {
      if (!item) return;
      const start = dayjs.utc(item.upphaf);
      const stop = start.add(item.slott, 'm');

      programs.push({
        title: item.isltitill,
        sub_title: item.undirtitill,
        description: item.lysing,
        actors: item.adalhlutverk,
        directors: item.leikstjori,
        start: start.toISOString(),
        stop: stop.toISOString()
      });
    });

    return programs;
  },
  async channels() {
    const axios = require('axios');
    try {
      const response = await axios.get(`https://api.stod2.is/dagskra/api`);
      return response.data.channels.map(item => {
        return {
          lang: 'is',
          name: item.nafn, // Assuming 'nafn' is the name of the channel
          site_id: item.id
        };
      });
    } catch (error) {
      console.error('Error fetching channels:', error);
      return [];
    }
  }
};

function parseItems(content) {
  const data = JSON.parse(content);
  if (!data || !Array.isArray(data)) return [];
  return data;
}
