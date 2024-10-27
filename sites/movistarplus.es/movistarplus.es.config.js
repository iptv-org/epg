const { DateTime } = require('luxon');
const axios = require('axios');
const dayjs = require('dayjs');

module.exports = {
  site: 'movistarplus.es',
  days: 3,

  url: function ({ date }) {
    return `https://www.movistarplus.es/programacion-tv/${date.format('YYYY-MM-DD')}?v=json`;
  },

  async parser({ content, channel, date }) {
    let programs = [];
    let items = parseItems(content, channel);
    if (!items.length) return programs;
    let guideDate = date;

    for (const item of items) {
      let startTime = DateTime.fromFormat(
        `${guideDate.format('YYYY-MM-DD')} ${item.HORA_INICIO}`,
        'yyyy-MM-dd HH:mm',
        {
          zone: 'Europe/Madrid'
        }
      ).toUTC();

      let stopTime = DateTime.fromFormat(
        `${guideDate.format('YYYY-MM-DD')} ${item.HORA_FIN}`,
        'yyyy-MM-dd HH:mm',
        {
          zone: 'Europe/Madrid'
        }
      ).toUTC();

      if (stopTime < startTime) {
        guideDate = guideDate.add(1, 'd');
        stopTime = stopTime.plus({ days: 1 });
      }

      const description = await fetchDescription(item.URL);
      const imageUrl = await fetchImageUrl(item.URL);

      programs.push({
        title: item.TITULO,
        category: item.GENERO,
        start: startTime,
        stop: stopTime,
        description: description,
        icon: imageUrl
      });
    }

    return programs;
  },

  async channels() {
    try {
      const data = await axios.get(`https://www.movistarplus.es/programacion-tv/${dayjs().format('YYYY-MM-DD')}?v=json`);
      const channels = Object.values(data.data.data).map(item => {
        return {
          lang: 'es',
          site_id: item.DATOS_CADENA.CODIGO,
          name: item.DATOS_CADENA.NOMBRE,
          url: item.DATOS_CADENA.URL // Añadir URL del canal
        };
      });
      return channels;
    } catch (error) {
      // No imprimir el error en la terminal
      return [];
    }
  }
};

// Función para analizar los elementos de la programación
function parseItems(content, channel) {
  const json = typeof content === 'string' ? JSON.parse(content) : content;
  if (!(`${channel.site_id}-CODE` in json.data)) return [];
  const data = json.data[`${channel.site_id}-CODE`];
  return data ? data.PROGRAMAS : [];
}

// Función para obtener la meta descripción desde la URL
async function fetchDescription(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const metaTagMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
    return metaTagMatch ? metaTagMatch[1] : 'No description available';
  } catch (error) {
    // No imprimir el error en la terminal
    return 'No description available';
  }
}

// Función para obtener la URL de la imagen desde la URL del programa
async function fetchImageUrl(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;

    // Buscar todas las imágenes dentro de bloques <div class="slide">
    const imageMatches = html.match(/<div class="slide">[\s\S]*?<img\s+id="[^"]*"\s+src="([^"]*?)"\s+alt="[^"]*"/g);
    
    // Si hay imágenes encontradas, toma la primera (o la que necesites)
    let imageUrl = 'No image URL available';
    if (imageMatches && imageMatches.length > 0) {
      const firstMatch = imageMatches[0];
      const srcMatch = firstMatch.match(/src="([^"]*?)"/);
      if (srcMatch && srcMatch[1]) {
        // Obtener la URL original y reemplazar "/galeria/" con "/detallegaleriah/"
        imageUrl = srcMatch[1].replace('/galeria/', '/detallegaleriah/');
        
        // Aumentar el último número en la URL
        imageUrl = incrementLastNumber(imageUrl);
      }
    }

    return imageUrl;
  } catch (error) {
    // No imprimir el error en la terminal
    return 'No image URL available';
  }
}

// Función para aumentar el último dígito de la URL
function incrementLastNumber(url) {
  return url.replace(/(\d+)(?!.*\d)/, (match) => (parseInt(match) + 1).toString());
}
