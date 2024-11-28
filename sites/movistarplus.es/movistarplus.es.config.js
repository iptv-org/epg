const axios = require('axios');
const cheerio = require('cheerio');
const dayjs = require('dayjs');
const { DateTime } = require('luxon');
const fs = require('fs');
const xml2js = require('xml2js');

module.exports = {
  site: 'movistarplus.es',
  days: 3, // Usamos los 3 días consecutivos

  url: function ({ date, channel }) {
    return `https://www.movistarplus.es/programacion-tv/${channel.site_id}/${dayjs(date).format('YYYY-MM-DD')}?v=json`;
  },

// Función parser para manejar múltiples días
async parser({ content, channel, date }) {
  let programs = [];

  const jsonData = await extractJSONFromHTML(content);
  if (!jsonData || !jsonData.itemListElement) {
    console.error('No se encontraron elementos de la programación.');
    return programs;
  }

  // Cargar el HTML para obtener el género y otros detalles del programa
  const $ = cheerio.load(content);

  for (const item of jsonData.itemListElement) {
    if (item.item && item.item.startDate && item.item.endDate) {
      const startTime = DateTime.fromISO(item.item.startDate, { zone: 'Europe/Madrid' });
      const stopTime = DateTime.fromISO(item.item.endDate, { zone: 'Europe/Madrid' });

      // Buscar el enlace correspondiente en el HTML que coincide con la hora
      const programTime = startTime.toFormat('HH:mm');
      const containerBox = $(`li.time:contains(${programTime})`).closest('.container_box');

      const programLink = containerBox.find('a').first().attr('href');
      const genre = containerBox.find('li.genre').text().trim() || 'Sin clasificar';

      // Si se encuentra un enlace, obtener los detalles del programa
      let programDetails = { description: 'Sin descripción', image: 'Sin imagen' };
      if (programLink) {
        programDetails = await fetchProgramDetails(programLink);
      }

      // Añadir el programa a la lista
      programs.push({
        title: item.item.name,
        start: startTime.toISO(),
        stop: stopTime.toISO(),
        description: item.item.description || programDetails.description,
        icon: programDetails.image,
        category: genre, // Incluimos el género en la información del programa
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

// Función genérica para reintentar una tarea hasta un número de veces con un retraso
async function retryTask(taskFn, maxRetries = 5, delay = 2000) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      return await taskFn(); // Intentar ejecutar la tarea
    } catch (error) {
      attempts++;
      console.error(`Error al intentar la tarea (intento ${attempts}):`, error.message);

      // Si se trata de un error de red (ECONNRESET, ECONNREFUSED, socket hang up), reintentar
      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.message.includes('socket hang up')) {
        console.log(`Reintentando en ${delay} ms...`);
        await new Promise(resolve => setTimeout(resolve, delay)); // Esperar antes de reintentar
      } else {
        // Si el error no es de red, detener los reintentos
        console.error('Error desconocido:', error.message);
        break;
      }
    }
  }
  throw new Error('Número máximo de intentos alcanzado.');
}

// Función para extraer JSON del HTML
async function extractJSONFromHTML(html) {
  const $ = cheerio.load(html);
  const scriptContent = $('script[type="application/ld+json"]').first().html();
  if (scriptContent) {
    try {
      return JSON.parse(scriptContent);
    } catch (error) {
      console.error('Error al parsear JSON del script:', error.message);
    }
  }
  return null;
}

// Función para obtener el contenido de la URL
async function fetchContent(url) {
  return retryTask(async () => {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      },
    });
    if (!response.data) throw new Error('La respuesta está vacía.');
    return response.data;
  }, 5, 2000); // Reintentar hasta 5 veces con un retraso de 2 segundos entre intentos
}

// Función para obtener detalles del programa
async function fetchProgramDetails(programUrl) {
  return retryTask(async () => {
    const content = await fetchContent(programUrl);
    const $ = cheerio.load(content);

    // Buscar las imágenes con id
    let iconUrl = 'Sin imagen';
    const imgElements = $('img[id]'); // Buscar todas las imágenes con un id

    if (imgElements.length >= 3) {
      // Si hay 3 o más imágenes, seleccionamos la tercera
      iconUrl = imgElements.eq(2).attr('src');
    } else if (imgElements.length >= 2) {
      // Si no hay 3, seleccionamos la segunda imagen
      iconUrl = imgElements.eq(1).attr('src');
    } else {
      // Si no existen ni la tercera ni la segunda imagen, buscar la URL en el esquema JSON
      const jsonLd = $('script[type="application/ld+json"]').html(); // Obtener el JSON-LD del contenido
      if (jsonLd) {
        try {
          const parsedData = JSON.parse(jsonLd); // Parsear el JSON
          if (parsedData.image) {
            iconUrl = parsedData.image; // Usar la URL de "image" si está disponible
          }
        } catch (error) {
          console.error('Error al analizar JSON-LD:', error);
        }
      }
    }

    // Reemplazar 'galeria' por 'detallegaleriah' en la URL, si la imagen se encuentra
    if (iconUrl !== 'Sin imagen') {
      iconUrl = iconUrl.replace('/galeria/', '/detallegaleriah/');
    }

    // Obtener la descripción
    const description = $('meta[name="description"]').attr('content');

    return { description: description || 'Sin descripción', image: iconUrl };
  }, 5, 2000); // Reintentar hasta 5 veces con un retraso de 2 segundos entre intentos
}

// Ejemplo de uso
(async () => {
  const channel = { site_id: 'LA2' }; // ID del canal, por ejemplo 'LA2'

  // Arreglo para acumular todos los programas
  let allPrograms = [];

  // Recorrer los días para obtener la programación de 3 días consecutivos
  for (let i = 0; i < module.exports.days; i++) {
    const date = dayjs().add(i, 'day'); // Ajustar la fecha para cada día consecutivo
    const url = `https://www.movistarplus.es/programacion-tv/${channel.site_id}/${date.format('YYYY-MM-DD')}?v=json`;
    const content = await fetchContent(url);

    if (content) {
      const jsonData = await extractJSONFromHTML(content);
      if (jsonData) {
        const programs = await module.exports.parser({ content, channel, date });
        allPrograms = allPrograms.concat(programs); // Acumular los programas
      }
    }
  }
})();
