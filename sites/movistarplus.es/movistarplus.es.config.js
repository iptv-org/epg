const { DateTime } = require('luxon')

const API_PROGRAM_ENDPOINT = 'https://comunicacion.movistarplus.es'
const API_IMAGE_ENDPOINT = 'https://www.movistarplus.es/recorte/n/caratulaH/';

module.exports = {
  site: 'movistarplus.es',
  days: 2,
  url: function ({ channel, date }) {
    return `${API_PROGRAM_ENDPOINT}/wp-admin/admin-ajax.php`
  },
  request: {
    method: 'POST',
    headers: {
      Origin: API_PROGRAM_ENDPOINT,
      Referer: `${API_PROGRAM_ENDPOINT}/programacion/`,
      "Content-Type" : 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    data: function ({ channel, date }) {
      return {
        action: 'getProgramation',
        day: date.format('YYYY-MM-DD'),
        "channels[]": channel.site_id,
      };
    },
  },
  parser({ content, channel, date }) {
    let programs = []
    let items = parseItems(content, channel);
    if (!items.length) return programs;

    items.forEach(item => {
      let startTime = DateTime.fromFormat(
        `${item.f_evento_rejilla}`,
        'yyyy-MM-dd HH:mm:ss',
        { zone: 'Europe/Madrid' }
      ).toUTC();

      let stopTime = DateTime.fromFormat(
        `${item.f_fin_evento_rejilla}`,
        'yyyy-MM-dd HH:mm:ss',
        { zone: 'Europe/Madrid' }
      ).toUTC()

      // Adjust stop time if it's on the next day
      if (stopTime < startTime) {
        stopTime = stopTime.plus({ days: 1 });
      }

      programs.push({
        title: item.des_evento_rejilla,
        icon: parseIcon(item, channel),
        category: item.des_genero,
        start: startTime,
        stop: stopTime,
      })
    })

    return programs
  },
}

function parseIcon(item, channel) {
  return `${API_IMAGE_ENDPOINT}/M${channel.site_id}P${item.cod_evento_rejilla}`;
}

function parseItems(content, channel) {
  const json = typeof content === 'string' ? JSON.parse(content) : content;
  const data = json.channelsProgram;

  if (data.length !== 1) return [];
  return data[0];
}