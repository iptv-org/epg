# Contributing Guide

- [How to?](#how-to)
- [Project Structure](#project-structure)
- [Scripts](#scripts)

## How to?

### How to add a channel to the guide?

To ask for help with adding a channel simply fill out this [form](https://github.com/iptv-org/epg/issues/new?assignees=&labels=channel+request&projects=&template=2_channel-request.yml).

If you want to add a channel to the list yourself, here are the instructions on how to do it.

First select the site from [SITES.md](SITES.md) that you know has a guide for the channel you need. Then go to the folder with its config and open the file `*.channels.xml`.

Make sure that the desired channel is not already in the list. If it is not, simply add its description to the end of the list as shown here:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<channels>
  ...
  <channel site="SITE" lang="LANGUAGE_CODE" xmltv_id="CHANNEL_ID" site_id="SITE_ID">CHANNEL_NAME</channel>
</channels>
```

| Attribute     | Description                                                                                                                                   | Example       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| SITE          | Site domain name.                                                                                                                             | `example.com` |
| LANGUAGE_CODE | Language of the guide ([ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) code).                                              | `en`          |
| CHANNEL_ID    | ID of the channel. Full list of supported channels with corresponding ID could be found on [iptv-org.github.io](https://iptv-org.github.io/). | `HBO.us@East` |
| SITE_ID       | Unique ID of the channel used in the source.                                                                                                  | `hbo`         |
| CHANNEL_NAME  | Name of the channel used in the source.                                                                                                       | `HBO East`    |

After that just [commit](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits) all changes and send a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

### How to report broken guide?

If you start to get errors when downloading the guide or if nothing loads at all, please let us know via this [form](https://github.com/iptv-org/epg/issues/new?assignees=&labels=broken+guide&projects=&template=3_broken-guide.yml).

### How to add a new source to the repository?

If you are not familiar with javascript programming, you can ask for help from other community members through this [form](https://github.com/iptv-org/epg/issues/new?assignees=&labels=source+request&projects=&template=1_source-request.yml). Otherwise, below are the instructions for you.

To start with, you need to create a new folder in the [/sites](/sites) folder and put at least 4 files in it:

<details>
<summary>example.com.config.js</summary>
<br>

This file describes what kind of request we need to send to get the guide for a particular channel on a certain date and how to parse the response.

```js
module.exports = {
  site: 'example.com',
  url({ channel, date }) {
    return `https://example.com/api/${channel.site_id}/${date.format('YYYY-MM-DD')}`
  },
  parser(context) {
    try {
      return JSON.parse(context.content)
    } catch {
      return []
    }
  }
}
```

### Context Object

From each function in `config.js` you can access a `context` object containing the following data:

- `channel`: The object describing the current channel (xmltv_id, site_id, name, lang)
- `date`: The 'dayjs' instance with the requested date
- `content`: The response data as a String
- `buffer`: The response data as an ArrayBuffer
- `headers`: The response headers
- `request`: The request config
- `cached`: A boolean to check whether this request was cached or not

### Program Properties

List of properties that can be assigned to each program during parsing.

| Property        | Aliases                          | Type                                       | Required |
| --------------- | -------------------------------- | ------------------------------------------ | -------- |
| start           |                                  | `String \| Number \| Date()`               | true     |
| stop            |                                  | `String \| Number \| Date()`               | true     |
| title           | titles                           | `String \| Object \| String[] \| Object[]` | true     |
| subTitle        | subTitles, sub_title, sub_titles | `String \| Object \| String[] \| Object[]` | false    |
| description     | desc, descriptions               | `String \| Object \| String[] \| Object[]` | false    |
| date            |                                  | `String \| Number \| Date()`               | false    |
| category        | categories                       | `String \| Object \| String[] \| Object[]` | false    |
| keyword         | keywords                         | `String \| Object \| String[] \| Object[]` | false    |
| language        | languages                        | `String \| Object \| String[] \| Object[]` | false    |
| origLanguage    | origLanguages                    | `String \| Object \| String[] \| Object[]` | false    |
| length          |                                  | `String \| Object \| String[] \| Object[]` | false    |
| url             | urls                             | `String \| Object \| String[] \| Object[]` | false    |
| country         | countries                        | `String \| Object \| String[] \| Object[]` | false    |
| video           |                                  | `Object`                                   | false    |
| audio           |                                  | `Object`                                   | false    |
| season          |                                  | `String \| Number`                         | false    |
| episode         |                                  | `String \| Number`                         | false    |
| episodeNumber   | episodeNum, episodeNumbers       | `Object`                                   | false    |
| previouslyShown |                                  | `String \| Object \| String[] \| Object[]` | false    |
| premiere        |                                  | `String \| Object \| String[] \| Object[]` | false    |
| lastChance      |                                  | `String \| Object \| String[] \| Object[]` | false    |
| new             |                                  | `Boolean`                                  | false    |
| subtitles       |                                  | `Object \| Object[]`                       | false    |
| rating          | ratings                          | `String \| Object \| String[] \| Object[]` | false    |
| starRating      | starRatings                      | `String \| Object \| String[] \| Object[]` | false    |
| review          | reviews                          | `String \| Object \| String[] \| Object[]` | false    |
| director        | directors                        | `String \| Object \| String[] \| Object[]` | false    |
| actor           | actors                           | `String \| Object \| String[] \| Object[]` | false    |
| writer          | writers                          | `String \| Object \| String[] \| Object[]` | false    |
| adapter         | adapters                         | `String \| Object \| String[] \| Object[]` | false    |
| producer        | producers                        | `String \| Object \| String[] \| Object[]` | false    |
| presenter       | presenters                       | `String \| Object \| String[] \| Object[]` | false    |
| composer        | composers                        | `String \| Object \| String[] \| Object[]` | false    |
| editor          | editors                          | `String \| Object \| String[] \| Object[]` | false    |
| commentator     | commentators                     | `String \| Object \| String[] \| Object[]` | false    |
| guest           | guests                           | `String \| Object \| String[] \| Object[]` | false    |
| image           | images                           | `String \| Object \| String[] \| Object[]` | false    |
| icon            | icons                            | `String \| Object \| String[] \| Object[]` | false    |

Example:

```js
{
  start: '2021-03-19T06:00:00.000Z',
  stop: '2021-03-19T06:30:00.000Z',
  title: 'Program 1',
  subTitle: 'Sub-title & 1',
  description: 'Description for Program 1',
  date: '2022-05-06',
  categories: ['Comedy', 'Drama'],
  keywords: [
    { lang: 'en', value: 'physical-comedy' },
    { lang: 'en', value: 'romantic' }
  ],
  language: 'English',
  origLanguage: { lang: 'en', value: 'French' },
  length: { units: 'minutes', value: '60' },
  url: 'http://example.com/title.html',
  country: 'US',
  video: {
    present: 'yes',
    colour: 'no',
    aspect: '16:9',
    quality: 'HDTV'
  },
  audio: {
    present: 'yes',
    stereo: 'Dolby Digital'
  },
  season: 9,
  episode: 239,
  previouslyShown: [{ start: '20080711000000', channel: 'channel-two.tv' }],
  premiere: 'First time on British TV',
  lastChance: [{ lang: 'en', value: 'Last time on this channel' }],
  new: true,
  subtitles: [
    { type: 'teletext', language: 'English' },
    { type: 'onscreen', language: [{ lang: 'en', value: 'Spanish' }] }
  ],
  rating: {
    system: 'MPAA',
    value: 'P&G',
    icon: 'http://example.com/pg_symbol.png'
  },
  starRatings: [
    {
      system: 'TV Guide',
      value: '4/5',
      icon: [{ src: 'stars.png', width: 100, height: 100 }]
    },
    {
      system: 'IMDB',
      value: '8/10'
    }
  ],
  reviews: [
    {
      type: 'text',
      source: 'Rotten Tomatoes',
      reviewer: 'Joe Bloggs',
      lang: 'en',
      value: 'This is a fantastic show!'
    },
    {
      type: 'text',
      source: 'IDMB',
      reviewer: 'Jane Doe',
      lang: 'en',
      value: 'I love this show!'
    },
    {
      type: 'url',
      source: 'Rotten Tomatoes',
      reviewer: 'Joe Bloggs',
      lang: 'en',
      value: 'https://example.com/programme_one_review'
    }
  ],
  directors: [
    {
      value: 'Director 1',
      url: { value: 'http://example.com/director1.html', system: 'TestSystem' },
      image: [
        'https://example.com/image1.jpg',
        {
          value: 'https://example.com/image2.jpg',
          type: 'person',
          size: '2',
          system: 'TestSystem',
          orient: 'P'
        }
      ]
    },
    'Director 2'
  ],
  actors: ['Actor 1', 'Actor 2'],
  writer: 'Writer 1',
  producers: 'Roger Dobkowitz',
  presenters: 'Drew Carey',
  images: [
    {
      type: 'poster',
      size: '1',
      orient: 'P',
      system: 'tvdb',
      value: 'https://tvdb.com/programme_one_poster_1.jpg'
    },
    {
      type: 'poster',
      size: '2',
      orient: 'P',
      system: 'tmdb',
      value: 'https://tmdb.com/programme_one_poster_2.jpg'
    },
    {
      type: 'backdrop',
      size: '3',
      orient: 'L',
      system: 'tvdb',
      value: 'https://tvdb.com/programme_one_backdrop_3.jpg'
    }
  ],
  icon: 'https://example.com/images/Program1.png?x=шеллы&sid=777'
}
```

</details>

<details>
<summary>example.com.test.js</summary>
<br>

With this file we can test the previously created config and make sure it works as you expect.

```js
const { parser, url } = require('./example.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
dayjs.extend(utc)

const date = dayjs.utc('2025-01-12', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'bbc1', xmltv_id: 'BBCOne.uk' }

it('can generate valid url', () => {
  expect(url({ channel, date })).toBe('https://example.com/api/bbc1/2025-01-12')
})

it('can parse response', () => {
  const content =
    '[{"title":"Program 1","start":"2025-01-12T00:00:00.000Z","stop":"2025-01-12T00:30:00.000Z"},{"title":"Program 2","start":"2025-01-12T00:30:00.000Z","stop":"2025-01-12T01:00:00.000Z"}]'

  const results = parser({ content })

  expect(results.length).toBe(2)
  expect(results[0]).toMatchObject({
    title: 'Program 1',
    start: '2025-01-12T00:00:00.000Z',
    stop: '2025-01-12T00:30:00.000Z'
  })
  expect(results[1]).toMatchObject({
    title: 'Program 2',
    start: '2025-01-12T00:30:00.000Z',
    stop: '2025-01-12T01:00:00.000Z'
  })
})

it('can handle empty guide', () => {
  const result = parser({
    date,
    channel,
    content: ''
  })

  expect(result).toMatchObject([])
})
```

Detailed documentation for the tests can be found here: https://jestjs.io/docs/using-matchers

</details>

<details>
<summary>example.com.channels.xml</summary>
<br>

This file contains a list of channels available at the source.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<channels>
  <channel site="example.com" lang="en" xmltv_id="BBCOne.uk" site_id="bbc1">BBC One</channel>
</channels>
```

</details>

<details>
<summary>readme.md</summary>
<br>

This file contains instructions on how to use this config.

````
# example.com

https://example.com

### Download the guide

```sh
npm run grab --- --site=example.com
```

### Test

```sh
npm test --- example.com
```
````

</details>

The fastest way to create all these files is to use the command:

```sh
npm run sites:init --- example.com
```

After you finish working on the files you can make sure that everything works by running the config test:

```
npm test --- example.com
```

Then check that all channels have the correct `xmltv-id`:

```
npm run channels:validate sites/example.com/example.com.channels.xml
```

And then try downloading the guide itself:

```
npm run grab --- example.com
```

If everything goes well just [commit](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits) all changes and send us a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

### How to map the channels?

In order for the guides to be linked with playlists from [iptv-org/iptv](https://github.com/iptv-org/iptv) and also with our other projects, each channel must have the same ID in the description as in our [iptv-org/database](https://github.com/iptv-org/database).

To check this, select one of the sites in the [SITES.md](SITES.md), open its `*.channels.xml` file and check that all channels have a valid `xmltv_id`. A list of all channels with corresponding IDs can be found at [iptv-org.github.io](https://iptv-org.github.io/).

If the channel is not in our database yet, you can add it to it through this [form](https://github.com/iptv-org/database/issues/new?assignees=&labels=channels%3Aadd&projects=&template=1_channels_add.yml&title=Add%3A+).

If the `*.channels.xml` file contains many channels without `xmltv_id`, you can speed up the process by running the command in the [Console](https://en.wikipedia.org/wiki/Windows_Console) (or [Terminal](<https://en.wikipedia.org/wiki/Terminal_(macOS)>) if you have macOS):

```sh
npm run channels:edit path/to/channels.xml
```

This way, you can map channels by simply selecting the proper ID from the list:

```sh
? Select channel ID for "BBC One" (bbc1): (Use arrow keys)
❯ BBCOne.uk (BBC One, BBC1, BBC Television, BBC Television Service)
  BBCOneHD.uk (BBC One HD)
  Type...
  Skip
```

Once complete, [commit](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits) all changes and send a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

## Project Structure

- `.github/`
  - `ISSUE_TEMPLATE/`: issue templates for the repository.
  - `workflows`: contains [GitHub actions](https://docs.github.com/en/actions/quickstart) workflows.
  - `CODE_OF_CONDUCT.md`: rules you shouldn't break if you don't want to get banned.
- `scripts/`: contains all scripts used in the repository.
- `sites/`: contains configurations, channel lists and tests for all sites.
- `tests/`: contains tests to check the scripts.
- `CONTRIBUTING.md`: file you are currently reading.
- `README.md`: project description displayed on the home page.
- `SITES.md`: list of all supported sites and their current status.

## Scripts

These scripts are created to automate routine processes in the repository and make it a bit easier to maintain.

For scripts to work, you must have [Node.js](https://nodejs.org/en) installed on your computer.

To run scripts use the `npm run <script-name>` command.

- `act:check`: allows to test the [check](https://github.com/iptv-org/iptv/blob/master/.github/workflows/check.yml) workflow locally. Depends on [nektos/act](https://github.com/nektos/act).
- `act:update`: allows to test the [update](https://github.com/iptv-org/iptv/blob/master/.github/workflows/update.yml) workflow locally. Depends on [nektos/act](https://github.com/nektos/act).
- `api:load`: downloads the latest channels data from the [iptv-org/api](https://github.com/iptv-org/api).
- `api:generate`: generates a JSON file with all channels for the [iptv-org/api](https://github.com/iptv-org/api) repository.
- `channels:lint`: сhecks the channel lists for syntax errors.
- `channels:parse`: generates a list of channels based on the site configuration.
- `channels:edit`: utility for quick channels mapping.
- `channels:validate`: checks the description of channels for errors.
- `sites:init`: creates a new site config from the template.
- `sites:update`: updates the list of sites and their status in [SITES.md](SITES.md).
- `grab`: downloads a program from a specified source.
- `serve`: starts the [web server](https://github.com/vercel/serve).
- `lint`: сhecks the scripts for syntax errors.
- `test`: runs a test of all the scripts described above.
