// npm run channels:parse -- --config=./sites/telecablesat.fr/telecablesat.fr.config.js --output=./sites/telecablesat.fr/telecablesat.fr.channels.xml
// npx epg-grabber --config=sites/telecablesat.fr/telecablesat.fr.config.js --channels=sites/telecablesat.fr/telecablesat.fr.channels.xml --output=guide.xml

const { parser, url } = require('./telecablesat.fr.config.js')
const axios = require('axios')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2022-03-11', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '2',
  xmltv_id: '13emeRue.fr'
}

jest.mock('axios')

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe(
    'https://tv-programme.telecablesat.fr/chaine/2/index.html?date=2022-03-11'
  )
})

it('can parse response', done => {
  const content = `<!DOCTYPE html><html lang="fr" dir="ltr" prefix=""> <head></head> <body itemscope itemtype="http://schema.org/WebPage"> <div class="dialog-off-canvas-main-canvas" data-off-canvas-main-canvas> <div id="wrapper" data-color="dark-blue"> <div id="main-section"> <section class="module"> <div class="container"> <div class="row no-gutter"> <div id="pgtv_container"> <div id="ptgv_left"> <div class="container"> <div class="row no-gutter"> <div class="col-md-8"> <div class="panel panel-flat"> <div class="panel-body"> <div class="tabbable"> <div class="tab-content"> <div class="tab-pane active"> <div class="row no-gutter"> <div class="news"> <div class="col-xs-12 col-sm-1 col-md-1"> <div class="schedule-hour">06:25</div></div><div class="col-xs-12 col-sm-11 col-md-11"> <div class="item"> <div class="item-image-2"> <div data-diffusion="1093039463" class="img-link" href="/emission/alex-hugo-164524955.html"><img class="img-responsive img-full" src="//tv.cdnartwhere.eu/cache/i2/Dc5BDsIgEADAv3C2pQvC0r6FCyxLq6aUFEyMxr_rvGA-IobGYhFb77UtXnq516FuRz_aQKmM4f08mdPKY-HuJR2lh1vh02RHABRSnukK0-wYMwBERBei1rOXUwBjOc2oCSgbIqUQ0KrILqNh5VwEl9iO97qKi9hDe_wf1uJLOyO-Pw.jpg" alt="Alex Hugo"></div></div><div class="item-content"> <div class="title-left title-style04 underline04"> <h3><a data-diffusion="1093039463" href="/emission/alex-hugo-164524955.html"><strong>Alex Hugo</strong></a></h3> </div><p>Des randonneurs font une macabre découverte en installant leur tente dans la nature : une jeune fille de Lusagne a en effet été sauvagement assassinée et son corps a été dissimulé sommairement dans les buissons. Rapidement, des lettres anonymes...</p></div></div></div></div><div class="news"> <div class="col-xs-12 col-sm-1 col-md-1"> <div class="schedule-hour">08:05</div></div><div class="col-xs-12 col-sm-11 col-md-11"> <div class="item"> <div class="item-image-2"> <div data-diffusion="1093039472" class="img-link" href="/emission/les-saisons-meurtrieres-hiver-rouge-31199593.html"><img class="img-responsive img-full" src="//tv.cdnartwhere.eu/cache/i2/Dc5BDoMgEEDRu7Cu4AgIeBY2DAzaNiIRmjRteve6_Mlb_C_D0IgtbOu9tsULL_Y61O3oRxtiKjx8XidRWokX6l7Eo_RwL3TqbCNADCm7qGB0lkwGADTGBpTSeXEBbeyk1EguAybptJbyapyQAmogG9VMwB91ZTe2h_a8PubZvKXV7PcH.jpg" alt="Les saisons meurtrières : hiver rouge"></div></div><div class="item-content"> <div class="title-left title-style04 underline04"> <h3><a data-diffusion="1093039472" href="/emission/les-saisons-meurtrieres-hiver-rouge-31199593.html"><strong>Les saisons meurtrières : hiver rouge</strong></a></h3> </div><p>Alors que les fêtes de fin d'année battent leur plein, le commissaire Rousseau se voit confronté à une délicate affaire. En peu de temps, une troisième jeune fille vient d'être retrouvée assassinée. Le vieux limier ne croit pas à l'hypothèse...</p></div></div></div></div></div></div></div></div></div></div></div><div class="col-md-4"></div></div></div></div></div></div></div></div></section> </div></div></body></html>`

  axios.get.mockImplementation(url => {
    if (
      url === 'https://tv-programme.telecablesat.fr/chaine/2/index.html?date=2022-03-11&period=noon'
    ) {
      return Promise.resolve({
        data: '<!DOCTYPE html><html lang="fr" dir="ltr" prefix=""> <head></head> <body itemscope itemtype="http://schema.org/WebPage"> <div class="dialog-off-canvas-main-canvas" data-off-canvas-main-canvas> <div id="wrapper" data-color="dark-blue"> <div id="main-section"> <section class="module"> <div class="container"> <div class="row no-gutter"> <div id="pgtv_container"> <div id="ptgv_left"> <div class="container"> <div class="row no-gutter"> <div class="col-md-8"> <div class="panel panel-flat"> <div class="panel-body"> <div class="tabbable"> <div class="tab-content"> <div class="tab-pane active"> <div class="row no-gutter"> <div class="news"> <div class="col-xs-12 col-sm-1 col-md-1"> <div class="schedule-hour">12:35</div></div><div class="col-xs-12 col-sm-11 col-md-11"> <div class="item"> <div class="item-image-2"> <div data-diffusion="1093039476" class="img-link" href="/emission/chicago-fire-157374472.html"><img class="img-responsive img-full" src="//tv.cdnartwhere.eu/cache/i2/Dc5BDsIgEADAv3DWwpayQN_CZaFLq6aUFEyMxr_rvGA-IlJjMYut99rmIIPc67VuRz_aNS1loPfzZF5WHgr3INNROt0Knya7BJBoyT5NoLxjmwEgWusoau2DtCqBc1OOiCZNI2vvVLSAigzl0WSvAVFHPdzrKi5ip_b4PxDtSzsjvj8.jpg" alt="Chicago Fire"></div></div><div class="item-content"> <div class="title-left title-style04 underline04"> <h3><a data-diffusion="1093039476" href="/emission/chicago-fire-157374472.html"><strong>Chicago Fire</strong></a></h3> </div><p>Brett, Foster et Kidd font une virée dans l\'Indiana. Sur la route, ils sont les témoins d\'un accident. Un bus qui transporte une équipe de hockey percute une voiture en panne. Sans réseau téléphonique, ils ne peuvent prévenir leurs collègues. En...</p></div></div></div></div></div></div></div></div></div></div></div><div class="col-md-4"></div></div></div></div></div></div></div></div></section> </div></div></body></html>'
      })
    } else if (
      url ===
      'https://tv-programme.telecablesat.fr/chaine/2/index.html?date=2022-03-11&period=afternoon'
    ) {
      return Promise.resolve({
        data: '<!DOCTYPE html><html lang="fr" dir="ltr" prefix=""> <head></head> <body itemscope itemtype="http://schema.org/WebPage"> <div class="dialog-off-canvas-main-canvas" data-off-canvas-main-canvas> <div id="wrapper" data-color="dark-blue"> <div id="main-section"> <section class="module"> <div class="container"> <div class="row no-gutter"> <div id="pgtv_container"> <div id="ptgv_left"> <div class="container"> <div class="row no-gutter"> <div class="col-md-8"> <div class="panel panel-flat"> <div class="panel-body"> <div class="tabbable"> <div class="tab-content"> <div class="tab-pane active"> <div class="row no-gutter"> <div class="news"> <div class="col-xs-12 col-sm-1 col-md-1"> <div class="schedule-hour">01:45</div></div><div class="col-xs-12 col-sm-11 col-md-11"> <div class="item"> <div class="item-image-2"> <div data-diffusion="1093039486" class="img-link" href="/emission/chicago-fire-157374512.html"><img class="img-responsive img-full" src="//tv.cdnartwhere.eu/cache/i2/Dc5BDsIgEADAv3C2hZVSoG_hsixLq6aUFEyMxr_rvGA-ImJjsYit99qWIIPc61C3ox9toFRGfD9P5rTyWLgHSUfpeCt8muwIgDBlTxMo79hmAIjWOoxa-yCT9loxMqIBjhMb7eFqk8qTy6CJZ01GUTTjva7iInZsj_9jnu1LOyO-Pw.jpg" alt="Chicago Fire"></div></div><div class="item-content"> <div class="title-left title-style04 underline04"> <h3><a data-diffusion="1093039486" href="/emission/chicago-fire-157374512.html"><strong>Chicago Fire</strong></a></h3> </div><p>Lors d\'une urgence, la vie du lieutenant Casey est soudainement mise en danger : un homme le menace avec une arme. Grissom prévient la caserne qu\'ils devront se préparer à une évaluation de leur performance. Otis apprend qu\'il a remporté un prix...</p></div></div></div></div><div class="news"> <div class="col-xs-12 col-sm-1 col-md-1"> <div class="schedule-hour">05:05</div></div><div class="col-xs-12 col-sm-11 col-md-11"> <div class="item"> <div class="item-image-2"> <div data-diffusion="1101145662" class="img-link" href="/emission/fin-des-programmes-195239083.html"><img class="img-responsive img-full" src="//tv.cdnartwhere.eu/cache/i2/Dc5LDsIgEADQu7C2hXEKTHsWNsOvVVNKCiZG4931neB9hOeWxCK23mtbnHRyr0Pdjn60IcQy8vt5phTXNJbUnQxH6Xwr6dSZAkDgmOcwgZop2QwA3lpijzg7yUZ7iHMgUhRMRONz1IioMKvAekpwhYkJx3tdxUXs3B7_hzH2haTF9wc.jpg" alt="Fin des programmes"></div></div><div class="item-content"> <div class="title-left title-style04 underline04"> <h3><a data-diffusion="1101145662" href="/emission/fin-des-programmes-195239083.html"><strong>Fin des programmes</strong></a></h3> </div><p>Nos programmes se terminent pour cette journée, en attendant ceux de demain.</p></div></div></div></div></div></div></div></div></div></div></div><div class="col-md-4"></div></div></div></div></div></div></div></div></section> </div></div></body></html>'
      })
    } else {
      return Promise.resolve({ data: '' })
    }
  })

  parser({ content, date, channel })
    .then(result => {
      result.map(p => {
        p.start = p.start.toJSON()
        p.stop = p.stop.toJSON()
        return p
      })

      expect(result).toMatchObject([
        {
          start: '2022-03-11T05:25:00.000Z',
          stop: '2022-03-11T07:05:00.000Z',
          title: 'Alex Hugo',
          description:
            'Des randonneurs font une macabre découverte en installant leur tente dans la nature : une jeune fille de Lusagne a en effet été sauvagement assassinée et son corps a été dissimulé sommairement dans les buissons. Rapidement, des lettres anonymes...',
          icon: 'https://tv.cdnartwhere.eu/cache/i2/Dc5BDsIgEADAv3C2pQvC0r6FCyxLq6aUFEyMxr_rvGA-IobGYhFb77UtXnq516FuRz_aQKmM4f08mdPKY-HuJR2lh1vh02RHABRSnukK0-wYMwBERBei1rOXUwBjOc2oCSgbIqUQ0KrILqNh5VwEl9iO97qKi9hDe_wf1uJLOyO-Pw.jpg'
        },
        {
          start: '2022-03-11T07:05:00.000Z',
          stop: '2022-03-11T11:35:00.000Z',
          title: 'Les saisons meurtrières : hiver rouge',
          description:
            "Alors que les fêtes de fin d'année battent leur plein, le commissaire Rousseau se voit confronté à une délicate affaire. En peu de temps, une troisième jeune fille vient d'être retrouvée assassinée. Le vieux limier ne croit pas à l'hypothèse...",
          icon: 'https://tv.cdnartwhere.eu/cache/i2/Dc5BDoMgEEDRu7Cu4AgIeBY2DAzaNiIRmjRteve6_Mlb_C_D0IgtbOu9tsULL_Y61O3oRxtiKjx8XidRWokX6l7Eo_RwL3TqbCNADCm7qGB0lkwGADTGBpTSeXEBbeyk1EguAybptJbyapyQAmogG9VMwB91ZTe2h_a8PubZvKXV7PcH.jpg'
        },
        {
          start: '2022-03-11T11:35:00.000Z',
          stop: '2022-03-12T00:45:00.000Z',
          title: 'Chicago Fire',
          description:
            "Brett, Foster et Kidd font une virée dans l'Indiana. Sur la route, ils sont les témoins d'un accident. Un bus qui transporte une équipe de hockey percute une voiture en panne. Sans réseau téléphonique, ils ne peuvent prévenir leurs collègues. En...",
          icon: 'https://tv.cdnartwhere.eu/cache/i2/Dc5BDsIgEADAv3DWwpayQN_CZaFLq6aUFEyMxr_rvGA-IlJjMYut99rmIIPc67VuRz_aNS1loPfzZF5WHgr3INNROt0Knya7BJBoyT5NoLxjmwEgWusoau2DtCqBc1OOiCZNI2vvVLSAigzl0WSvAVFHPdzrKi5ip_b4PxDtSzsjvj8.jpg'
        },
        {
          start: '2022-03-12T00:45:00.000Z',
          stop: '2022-03-12T04:05:00.000Z',
          title: 'Chicago Fire',
          description:
            "Lors d'une urgence, la vie du lieutenant Casey est soudainement mise en danger : un homme le menace avec une arme. Grissom prévient la caserne qu'ils devront se préparer à une évaluation de leur performance. Otis apprend qu'il a remporté un prix...",
          icon: 'https://tv.cdnartwhere.eu/cache/i2/Dc5BDsIgEADAv3C2hZVSoG_hsixLq6aUFEyMxr_rvGA-ImJjsYit99qWIIPc61C3ox9toFRGfD9P5rTyWLgHSUfpeCt8muwIgDBlTxMo79hmAIjWOoxa-yCT9loxMqIBjhMb7eFqk8qTy6CJZ01GUTTjva7iInZsj_9jnu1LOyO-Pw.jpg'
        },
        {
          start: '2022-03-12T04:05:00.000Z',
          stop: '2022-03-12T05:05:00.000Z',
          title: 'Fin des programmes',
          description:
            'Nos programmes se terminent pour cette journée, en attendant ceux de demain.',
          icon: 'https://tv.cdnartwhere.eu/cache/i2/Dc5LDsIgEADQu7C2hXEKTHsWNsOvVVNKCiZG4931neB9hOeWxCK23mtbnHRyr0Pdjn60IcQy8vt5phTXNJbUnQxH6Xwr6dSZAkDgmOcwgZop2QwA3lpijzg7yUZ7iHMgUhRMRONz1IioMKvAekpwhYkJx3tdxUXs3B7_hzH2haTF9wc.jpg'
        }
      ])
      done()
    })
    .catch(done)
})

it('can handle empty guide', done => {
  parser({
    content: `<!DOCTYPE html><html lang="fr" dir="ltr" prefix=""> <head></head> <body></body></html>`,
    date,
    channel
  })
    .then(result => {
      expect(result).toMatchObject([])
      done()
    })
    .catch(done)
})
