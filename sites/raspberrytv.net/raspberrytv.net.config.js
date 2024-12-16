const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');

module.exports = {
  site: 'raspberrytv.net',
  channels: 'raspberrytv.net.channels.xml',
  days: 7,
  request: {
    cache: {
      ttl: 60 * 60 * 1000 // 1 hour
    }
  },
  url({ channel }) {
    return `https://raspberrytv.net/tv-guide/${channel.site_id}`;
  },
  async parser({ content, date }) {
    const $ = cheerio.load(content);
    const programs = [];
    
    $('ul.list-group li.list-group-item').each((index, element) => {
      const time = $(element).find('strong').text().trim();
      const title = $(element).contents().not('strong').text().trim().split('\n')[0].trim();
      const description = $(element).find('p').text().trim();
      
      const start = dayjs(`${date.format('YYYY-MM-DD')} ${time}`, 'YYYY-MM-DD HH:mm').utc().format();
      const stop = dayjs(start).add(1, 'hour').utc().format(); // assuming 1 hour duration, adjust accordingly
      
      programs.push({
        title,
        description,
        start,
        stop
      });
    });

    return programs;
  }
};
