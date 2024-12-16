const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const cheerio = require('cheerio');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const siteUrl = 'https://www.ishow.gr';

module.exports = {
  site: 'ishow.gr',
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
    const formattedDate = date.format('DD/MM/YYYY');
    return `${siteUrl}/ShowTodayChannelProgramm.asp?cid=${channel.site_id}&gotoDay=${formattedDate}`;
  },
  async parser({ content }) {
    const shows = [];
    const $ = cheerio.load(content);
    const rows = $('tr[id^="progTr"]');

    rows.each((index, row) => {
      const tds = $(row).find('td');
      const show = {
        title: $(tds[2]).text().trim(),
        startTime: dayjs($(tds[0]).text().trim(), 'HH:mm').format(),
        category: $(tds[1]).text().trim(),
        description: ''
      };

      const onclick = $(row).attr('onclick');
      if (onclick && onclick.includes('=')) {
        const url = onclick.split('=')[1].replace(/'/g, '').trim();
        show.description = getDescription(`${siteUrl}${url}`);
      }

      shows.push(show);
    });

    return shows;
  },
  async channels() {
    const url = `${siteUrl}/channels.asp`;
    const response = await axios.get(url, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });
    const $ = cheerio.load(response.data);
    const channels = [];

    $('div.channel_box').each((index, element) => {
      const siteId = $(element).attr('onclick').match(/\?cid=(\d+)/)[1];
      const name = $(element).text().trim();

      channels.push({
        lang: 'el',
        name: name,
        site_id: siteId
      });
    });

    return channels;
  }
};

async function getDescription(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });
    const $ = cheerio.load(response.data);
    return $('div.show_text').text().trim();
  } catch (error) {
    console.error('Error fetching description:', error);
    return '';
  }
}
