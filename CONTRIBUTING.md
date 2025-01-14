# Contributing Guide

- [How to?](#how-to)
- [Project Structure](#project-structure)
- [Scripts](#scripts)

## How to?

### How to add a channel to the guide?

First, select a site from the [SITES.md](SITES.md) that you know has a guide for the channel you need. Then go to the folder with its config and open the file `*.channels.xml`.

Make sure that the desired channel is not already in the list. If it is not, simply add its description to the end of the list as shown here:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<channels>
  ...
  <channel site="SITE" lang="LANGUAGE_CODE" xmltv_id="CHANNEL_ID" site_id="SITE_ID">CHANNEL_NAME</channel>
</channels>
```

| Attribute     | Description                                                                                                                                                        | Example       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| SITE          | Site domain name.                                                                                                                                                  | `example.com` |
| LANGUAGE_CODE | Language of the guide ([ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) code).                                                                   | `en`          |
| CHANNEL_ID    | Channel ID from [iptv-org/database](https://github.com/iptv-org/database). A complete list of supported channels can also be found at https://iptv-org.github.io/. | `BBCOne.uk`   |
| SITE_ID       | Unique ID of the channel used in the source.                                                                                                                       | `bbc1`        |
| CHANNEL_NAME  | Name of the channel used in the source.                                                                                                                            | `BBC One`     |

After that just [commit](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits) all changes and send a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

### How to map the channels?

In order for the guides to be linked with playlists from [iptv-org/iptv](https://github.com/iptv-org/iptv) and also with our other projects, each channel must have the same ID in the description as in our [iptv-org/database](https://github.com/iptv-org/database).

To check this, select one of the sites in the [SITES.md](SITES.md), open its `*.channels.xml` file and check that all channels have a valid `xmltv_id`. If it is missing somewhere, just copy the matching ID from the [iptv-org.github.io](https://iptv-org.github.io/). If the channel is not in our database yet, you can add it to it through this [form](https://github.com/iptv-org/database/issues/new?assignees=&labels=channels%3Aadd&projects=&template=__channels_add.yml&title=Add%3A+).

If the `*.channels.xml` file contains many channels without `xmltv_id`, you can speed up the process by running the command in the [Console](https://en.wikipedia.org/wiki/Windows_Console) (or [Terminal](<https://en.wikipedia.org/wiki/Terminal_(macOS)>) if you have macOS):

```sh
npm run channels:edit path/to/channels.xml
```

This way, you can map channels by simply selecting the proper ID from the list:

```sh
? Select xmltv_id for "BBC One" (bbc1): (Use arrow keys)
❯ BBC One (BBC1, BBC Television, BBC Television Service) | BBCOne.uk
  BBC One HD | BBCOneHD.uk
  Type...
  Skip
```

Once complete, [commit](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits) all changes and send a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

### How to add a new source to the repository?

To do this, you will need to create a new folder in the [/sites](/sites) directory with at least 4 files:

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
  parser({ content }) {
    try {
      return JSON.parse(content)
    } catch {
      return []
    }
  }
}
```

More detailed instructions for this file can be found here: https://github.com/freearhey/epg-grabber#site-config

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

To run all of these tests use the following command:

```sh
npm test --- example.com
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

Once you are done working on the config make sure the tests pass, the guide downloads correctly, [commit](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits) all changes and send us a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

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
