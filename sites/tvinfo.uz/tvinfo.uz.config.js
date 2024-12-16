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
  site: 'tvinfo.uz',
  days: 5, // maxdays=5
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
    return `https://tvinfo.uz/${channel.site_id}?date=${formattedDate}`;
  },
  async parser({ content, date }) {
    const $ = cheerio.load(content);
  const programs = [];
  let previousTime = null;

  $('div.flex.text-sm').each((index, element) => {
    const time = $(element).find('div.w-12.shrink-0').text().trim();
    const title = $(element).find('div').not('.w-12.shrink-0').text().trim();
    
    const start = dayjs(`${date} ${time}`, 'YYYY-MM-DD HH:mm').utc().format();
    
    if (previousTime) {
      const stop = start;
      programs[programs.length - 1].stop = stop;  // Set stop time for the previous program
    }

    programs.push({
      title,
      start,
      stop: null  // Temporarily set stop to null, will update it in the next iteration
    });
    
    previousTime = start;  // Update previous time
  });

  // Set stop time for the last program (assuming it ends after an hour as default)
  if (programs.length > 0) {
    programs[programs.length - 1].stop = dayjs(previousTime).add(1, 'hour').utc().format();
  }

  return programs;
},
  async channels() {
    const url = 'https://tvinfo.uz/';
    const response = await axios.get(url, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });
    const $ = cheerio.load(response.data);
    const channels = [];

    $('h3.grow.leading-tight').each((index, element) => {
      const siteId = $(element).find('a').attr('href').match(/https:\/\/tvinfo\.uz\/(.*)/)[1];
      const name = $(element).text().trim();

      channels.push({
        lang: 'uz',
        name: name,
        site_id: siteId
      });
    });

    return channels;
  }
};
