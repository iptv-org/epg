const { parser, url, request } = require('./digea.gr.config.js')
const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-17', 'YYYY-MM-DD').startOf('d')
const channel = {
  site_id: '1100',
  xmltv_id: 'AlphaTV.gr'
}

it('can generate valid url', () => {
  expect(url).toBe('https://www.digea.gr/el/api/epg/get-events')
})

it('can generate valid request method', () => {
  expect(request.method).toBe('POST')
})

it('can generate valid request headers', () => {
  expect(request.headers).toMatchObject({
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
  })
})

it('can generate valid request data', () => {
  const data = request.data({ date })

  expect(data.get('action')).toBe('get_events')
  expect(data.get('date')).toBe('2025-1-17')
})

it('can parse response', () => {
  const content = fs.readFileSync(path.resolve(__dirname, '__data__/content.json'), 'utf8')
  let results = parser({ content, channel })
  results = results.map(p => {
    p.start = p.start.toJSON()
    p.stop = p.stop.toJSON()
    return p
  })

  expect(results.length).toBe(19)
  expect(results[0]).toMatchObject({
    start: '2025-01-16T23:30:00.000Z',
    stop: '2025-01-17T01:30:00.000Z',
    title: '[K12] Το Ξεκαθάρισμα (A Score To Settle)',
    description:
      "Περιπέτεια αμερικανικής παραγωγής 2019 [Το πρόγραμμα περιέχει σκηνές σεξουαλικές, βίας, χρήσης ναρκωτικών κι άλλων εξαρτησιογόνων ουσιών και απρεπή εκφορά λόγου]. Ο Φρανκ απελευθερώνεται από τη φυλακή πολλά χρόνια μετά αφού κατηγορήθηκε για ένα έγκλημα που δεν διέπραξε. Τώρα, ελεύθερος, ξεκινά μια πορεία εκδίκησης εναντίον των ανθρώπων των οποίων οι πράξεις τον έστειλαν στη φυλακή. Ηθοποιοί: Νίκολας Κέιτζ, Μπέντζαμιν Μπρατ, Νόα Λε Γκρος, Καρολίνα Γουίντρα. Σενάριο: Σον Κου, Τζον Νιούμαν. Σκηνοθεσία: Σον Κου. Διάρκεια: 94'. "
  })
  expect(results[18]).toMatchObject({
    start: '2025-01-17T21:30:00.000Z',
    stop: '2025-01-17T23:30:00.000Z',
    title: '[K8] Βασικά Καλησπέρα Σας',
    description:
      "Κωμωδία ελληνικής παραγωγής 1982. Δύο πειρατικοί ραδιοσταθμοί, εκ των οποίων ο ένας βάζει λαϊκά άσματα και ο άλλος ροκ μουσική, ανταγωνίζονται για την πρωτιά στην ακροαματικότητα. Ο ανταγωνισμός γίνεται βαθμηδόν όλο και πιο σκληρός, αλλά ξάφνου τα πράγματα αλλάζουν ρότα καθώς ο μεγαλοδύναμος έρως παρεμβαίνει και κάνει το θαύμα του. Παίζουν: Στάθης Ψάλτης, Πάνος Μιχαλόπουλος, Σταμάτης Γαρδέλης, Έφη Πίκουλα, Γιώργος Ρήγας, Γιάννης Μποσταντζόγλου, Σοφία Αλιμπέρτη, Καίτη Φίνου. Σκηνοθεσία - Σενάριο: Γιάννης Δαλιανίδης. Διάρκεια: 89'."
  })
})

it('can handle empty guide', () => {
  const results = parser({
    content: '[]'
  })

  expect(results).toMatchObject([])
})
