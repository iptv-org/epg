const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');
const { DateTime } = require('luxon');

module.exports = {
  site: 'movistarplus.es',
  days: 3,

  url: function ({ date, channel }) {
    return `https://www.movistarplus.es/programacion-tv/${channel.site_id}/${dayjs(date).format('YYYY-MM-DD')}?v=json`;
  },

  async parser({ content, channel, date }) {
    let programs = [];
    const jsonData = await extractJSONFromHTML(content);

    if (!jsonData || !jsonData.itemListElement) {
      console.error('No se encontraron elementos de la programación.');
      return programs;
    }

    const $ = cheerio.load(content);

    for (const item of jsonData.itemListElement) {
      if (item.item && item.item.startDate && item.item.endDate) {
        const startTime = DateTime.fromISO(item.item.startDate, { zone: 'Europe/Madrid' });
        const stopTime = DateTime.fromISO(item.item.endDate, { zone: 'Europe/Madrid' });

        // Extraer información adicional del HTML usando Cheerio
        const programTime = startTime.toFormat('HH:mm');
        const containerBox = $(`li.time:contains(${programTime})`).closest('.container_box');

        const programLink = containerBox.find('a').first().attr('href');
        const genre = containerBox.find('li.genre').text().trim() || 'Sin clasificar';

        let programDetails = { description: 'Sin descripción', image: 'Sin imagen' };
        if (programLink) {
          programDetails = await fetchProgramDetails(programLink);
        }

        // Agregar el programa a la lista
        programs.push({
          title: item.item.name,
          start: startTime.toISO(),
          stop: stopTime.toISO(),
          description: item.item.description || programDetails.description,
          icon: programDetails.image,
          category: genre,
        });
      }
    }

    return programs;
  },

  async channels() {
    return [
      {
        lang: 'es',
        site_id: 'LA2',
        name: 'La 2',
      },
    ];
  },
};

// Función para extraer JSON del HTML
async function extractJSONFromHTML(html) {
  const $ = cheerio.load(html);
  let extractedJSON = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    const scriptContent = $(el).html();
    if (scriptContent) {
      try {
        const parsedJSON = JSON.parse(scriptContent);
        if (parsedJSON['@type'] === 'ItemList') {
          extractedJSON = parsedJSON;
        }
      } catch (error) {
        console.error('Error al parsear JSON:', error.message);
      }
    }
  });

  return extractedJSON;
}

// Función para obtener contenido de una URL
async function fetchContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener contenido:', error.message);
    return null;
  }
}

// Función para obtener detalles adicionales del programa
async function fetchProgramDetails(programUrl) {
  try {
    const content = await fetchContent(programUrl);
    const $ = cheerio.load(content);

    let iconUrl = 'Sin imagen';
    const imgElements = $('img[id]');
    if (imgElements.length >= 3) {
      iconUrl = imgElements.eq(2).attr('src');
    } else if (imgElements.length >= 2) {
      iconUrl = imgElements.eq(1).attr('src');
    } else {
      const jsonLd = $('script[type="application/ld+json"]').html();
      if (jsonLd) {
        try {
          const parsedData = JSON.parse(jsonLd);
          if (parsedData.image) {
            iconUrl = parsedData.image;
          }
        } catch (error) {
          console.error('Error al analizar JSON-LD:', error);
        }
      }
    }

    if (iconUrl !== 'Sin imagen') {
      iconUrl = iconUrl.replace('/galeria/', '/detallegaleriah/');
    }

    const description = $('meta[name="description"]').attr('content');

    return { description: description || 'Sin descripción', image: iconUrl };
  } catch (error) {
    console.error('Error al obtener detalles del programa:', error.message);
    return { description: 'Sin descripción', image: 'Sin imagen' };
  }
}
