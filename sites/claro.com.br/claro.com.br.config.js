// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  site: 'claro.com.br',
  days: 2,
  url: function ({ date, channel }) {
    const dateRange = `${date.format('YYYY-M-DD')}T00:00:00Z+TO+${date.format('YYYY-M-DD')}T23:59:00Z`;
    const city_id = channel.site_id.split('_')[0];
    return `https://programacao.claro.com.br/gatekeeper/exibicao/select?q=id_revel:(${channel.site_id})+AND+id_cidade:${city_id}&wt=json&rows=100000&start=0&sort=id_canal+asc,dh_inicio+asc&fl=dh_fim, dh_inicio, titulo, genero, id_canal, id_cidade&fq=dh_inicio:[${dateRange}]`;
  },
  request: {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    },
  },
  parser({ content }) {
    let programs = [];
    const data = JSON.parse(content).response.docs;

    if (!data || !Array.isArray(data)) return programs;

    data.forEach(program => {
      programs.push({
        title: program.titulo,
        category: program.genero,
        start: parceDate(program.dh_inicio),
        stop: parceDate(program.dh_fim),
      });
    });
    return programs;
  }
};

function parceDate(date) {
  return dayjs.tz(date, 'YYYY-MM-DDTHH:mm:ss[Z]', 'America/Sao_Paulo')
}
