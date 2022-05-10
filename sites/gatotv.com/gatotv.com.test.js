// node ./scripts/channels.js --config=./sites/gatotv.com/gatotv.com.config.js --output=./sites/gatotv.com/gatotv.com_cr.channels.xml --set=country:costa_rica
// npx epg-grabber --config=sites/gatotv.com/gatotv.com.config.js --channels=sites/gatotv.com/gatotv.com_ar.channels.xml --output=.gh-pages/guides/ar/gatotv.com.epg.xml --days=2

const { parser, url, request } = require('./gatotv.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2021-11-13', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '13_de_argentina',
  xmltv_id: 'ElTrece.ar'
}
const content = `<html> <head></head> <body> <div class="div_content" itemscope="" itemtype="http://schema.org/TelevisionChannel"> <div class="div_SiteMap"></div><div class="div_Clock"></div><div class="div_Dark_Light_Mode"></div><div class="div_divisor"></div><div class="div_divisor"></div><table class="tbl_recommend"></table> <div class="div_divisor"></div><table style="width: 1015px"> <tbody> <tr></tr><tr> <td style="vertical-align: top; width: 677px"> <div class="div_MainDiv"> <div class="div_MainPicture"> <a href="https://www.gatotv.com/canal/13_de_argentina"> <picture> <source media="(prefers-color-scheme: dark)" title="Canal 13 de Argentina (El Trece)" srcset=" https://imagenes.gatotv.com/logos/canales/claros/13_de_argentina-mediano.png "/> <img src="https://imagenes.gatotv.com/logos/canales/oscuros/13_de_argentina-mediano.png" alt="Logo Canal 13 de Argentina (El Trece)" title="Canal 13 de Argentina (El Trece)" width="160" height="70"/> </picture> </a> </div></div><table class="tbl_EPG"> <tbody> <tr> <th id="horarios_de_programacion" class="tbl_EPG_th" colspan="8"> <h2>Horarios de Programación</h2> </th> </tr><tr> <th class="tbl_EPG_th0" colspan="1">Hora Inicio</th> <th class="tbl_EPG_th0" colspan="1">Hora Fin</th> <th class="tbl_EPG_th" colspan="6">Programa</th> </tr><tr> <th id="madrugada" class="tbl_EPG_th" colspan="8">Madrugada</th> </tr><tr class="tbl_EPG_row"><td colspan="1"><div class="tbl_EPG_TimesColumnOutOfSchedule"><time datetime="23:00">23:00</time></div></td><td colspan="1"><div class="tbl_EPG_TimesColumn"><time datetime="00:30">00:30</time></div></td><td colspan="6" class="programa"><div class="tbl_EPG_ProgramsColumn programa"><div class="div_program_title_on_channel"><span>Bienvenidos a bordo</span></div></div></td></tr><tr class="tbl_EPG_row"> <td colspan="1"> <div class="tbl_EPG_TimesColumn"> <time datetime="00:30">00:30</time> </div></td><td colspan="1"> <div class="tbl_EPG_TimesColumn"> <time datetime="01:45">01:45</time> </div></td><td colspan="6" class="pelicula"> <div class="tbl_EPG_ProgramsColumn pelicula"> <div class="div_program_title_on_channel"> <span>Ciudad de sombras</span> </div></div></td></tr><tr class="tbl_EPG_rowAlternate"> <td colspan="1"> <div class="tbl_EPG_TimesColumn"> <time datetime="01:45">01:45</time> </div></td><td colspan="1"> <div class="tbl_EPG_TimesColumn"> <time datetime="03:30">03:30</time> </div></td><td style="padding: 0px; width: 112px"> <a href="https://www.gatotv.com/pelicula/rascacielos_rescate_en_las_alturas" title="Rascacielos: Rescate en las Alturas" > <img src="https://imagenes.gatotv.com/categorias/peliculas/miniatura/rascacielos.jpg" width="112" height="84"/> </a> </td><td colspan="5" class="pelicula"> <div class="tbl_EPG_ProgramsColumn pelicula"> <div class="div_program_title_on_channel"> <a itemprop="url" href="https://www.gatotv.com/pelicula/rascacielos_rescate_en_las_alturas" title="Rascacielos: Rescate en las Alturas" > <span>Rascacielos: Rescate en las Alturas</span> </a> </div>Cuando un ex rescatista de rehenes del FBI evalúa la seguridad de un rascacielos en China, un incendio repentino hace que sea acusado injustamente. </div></td></tr><tr class="tbl_EPG_row"><td colspan="1"><div class="tbl_EPG_TimesColumn"><time datetime="13:30">13:30</time></div></td><td colspan="1"><div class="tbl_EPG_TimesColumn"><time datetime="13:41">13:41</time></div></td><td style="padding:0px; width:112px;"><a href="https://www.gatotv.com/caricatura/los_jovenes_titanes_en_accion" title="Los Jóvenes Titanes En Acción"><img src="https://imagenes.gatotv.com/categorias/caricaturas/miniatura/los_jovenes_titanes_en_accion.jpg" width="112" height="84"></a></td><td colspan="5" class="caricatura"><div class="tbl_EPG_ProgramsColumn caricatura"><div class="div_program_title_on_channel"><a itemprop="url" href="https://www.gatotv.com/caricatura/los_jovenes_titanes_en_accion" title="Los Jóvenes Titanes En Acción"><span>Los Jóvenes Titanes En Acción</span></a></div>Robin, Starfire, Raven, Chico Bestia y Cyborg se preparan para nuevas aventuras cómicas después de hacer un sándwich, jugar algún videojuego o lavar la ropa.</div></td></tr><tr class="tbl_EPG_rowAlternate"> <td colspan="1"> <div class="tbl_EPG_TimesColumn"> <time datetime="23:55">23:55</time> </div></td><td colspan="1"> <div class="tbl_EPG_TimesColumnOutOfSchedule"> <time datetime="04:00">04:00</time> </div></td><td colspan="6" class="programa"> <div class="tbl_EPG_ProgramsColumn programa"> <div class="div_program_title_on_channel"> <span>Decisión 2021</span> </div></div></td></tr></tbody> </table> </td><td style="vertical-align: top; float: right"> <div itemprop="inBroadcastLineup" itemscope="" itemtype="http://schema.org/CableOrSatelliteService" > <table class="tbl_EPG" style="width: 99%"> <tbody> <tr> <th colspan="5" class="tbl_EPG_th">Disponibilidad</th> </tr><tr class="tbl_EPG_row"> <td colspan="1" style="width: 10px; text-align: center"> <a href="https://www.gatotv.com/guia_tv/directv_latinoamerica"> <picture> <source media="(prefers-color-scheme: dark)" title="DirecTV Latinoamérica" srcset=" https://imagenes.gatotv.com/guias_tv/claros/miniatura/directv.png "/> <img src="https://imagenes.gatotv.com/guias_tv/oscuros/miniatura/directv.png" alt="DirecTV Latinoamérica" title="DirecTV Latinoamérica"/> </picture> </a> </td><td colspan="4"> <a href="https://www.gatotv.com/guia_tv/directv_latinoamerica"> <span itemprop="name" style="float: left; margin: 5px" >DirecTV Latinoamérica</span > </a> <span class="default_color" style="float: right; margin: 5px" >Canal 124</span > </td></tr></tbody> </table> </div></td></tr></tbody> </table> </div></body></html>`

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://www.gatotv.com/canal/13_de_argentina/2021-11-13')
})

it('can parse response', () => {
  const result = parser({ date, channel, content }).map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()

    return p
  })

  expect(result).toMatchObject([
    {
      start: '2021-11-13T04:00:00.000Z',
      stop: '2021-11-13T05:30:00.000Z',
      title: 'Bienvenidos a bordo'
    },
    {
      start: '2021-11-13T05:30:00.000Z',
      stop: '2021-11-13T06:45:00.000Z',
      title: 'Ciudad de sombras'
    },
    {
      start: '2021-11-13T06:45:00.000Z',
      stop: '2021-11-13T08:30:00.000Z',
      title: 'Rascacielos: Rescate en las Alturas',
      icon: 'https://imagenes.gatotv.com/categorias/peliculas/miniatura/rascacielos.jpg',
      description:
        'Cuando un ex rescatista de rehenes del FBI evalúa la seguridad de un rascacielos en China, un incendio repentino hace que sea acusado injustamente.'
    },
    {
      start: '2021-11-13T18:30:00.000Z',
      stop: '2021-11-13T18:41:00.000Z',
      title: 'Los Jóvenes Titanes En Acción',
      icon: 'https://imagenes.gatotv.com/categorias/caricaturas/miniatura/los_jovenes_titanes_en_accion.jpg',
      description:
        'Robin, Starfire, Raven, Chico Bestia y Cyborg se preparan para nuevas aventuras cómicas después de hacer un sándwich, jugar algún videojuego o lavar la ropa.'
    },
    {
      start: '2021-11-14T04:55:00.000Z',
      stop: '2021-11-14T09:00:00.000Z',
      title: 'Decisión 2021'
    }
  ])
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: `<!DOCTYPE html><html><head></head><body></body></html>`
  })
  expect(result).toMatchObject([])
})
