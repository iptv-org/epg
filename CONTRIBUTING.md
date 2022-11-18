# Contributing Guide

### How do I add a program guide for the channel?

First, open the [/sites](/sites) folder and select the source that you know has the guide for the channel you want.

Then in the selected folder open the file `*.channels.xml` and add to it:

```xml
<channel lang="LANGUAGE_CODE" xmltv_id="CHANNEL_ID" site_id="SITE_ID">CHANNEL_NAME</channel>
```

| Attribute     | Description                                                                                                                                                        | Example     |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| LANGUAGE_CODE | Language of the guide ([ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) code).                                                                   | `en`        |
| CHANNEL_ID    | Channel ID from [iptv-org/database](https://github.com/iptv-org/database). A complete list of supported channels can also be found at https://iptv-org.github.io/. | `BBCOne.uk` |
| SITE_ID       | Unique ID of the channel used in the source.                                                                                                                       | `bbc1`      |
| CHANNEL_NAME  | Name of the channel used in the source.                                                                                                                            | `BBC 1`     |

After that just commit all changes and send a pull request.

### How to add a new source to the repository?

To do this, you must create a new folder in the [/sites](/sites) with at least 3 files:

<details>
<summary>example.com.config.js</summary>
<br>

This file describes what kind of request we need to send to get the guide for a particular channel on a certain date. It also describes how to parse the response.

```js
module.exports = {
	site: 'example.com',
	url: function ({ channel, date }) {
		return `https://example.com/api/${channel.site_id}/${date.format('YYYY-MM-DD')}`
	},
	parser: function ({ content }) {
		return JSON.parse(content)
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
const { url, parser } = require('./example.com.config.js')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = dayjs.utc('2022-11-18', 'YYYY-MM-DD').startOf('d')
const channel = { site_id: 'bbc1', xmltv_id: 'BBCOne.uk', lang: 'en' }

it('can generate valid url', () => {
	expect(url({ channel, date })).toBe('https://example.com/api/bbc1/2022-11-18')
})

it('can parse response', () => {
	const content = `[{"start":"2022-11-18T01:30:00.000Z","stop":"2022-11-18T02:00:00.000Z","title":"Program 1"}]`
	const results = parser({ content })

	expect(results).toMatchObject([
		{
			start: '2022-11-18T01:30:00.000Z',
			stop: '2022-11-18T02:00:00.000Z',
			title: 'Program 1'
		}
	])
})

it('can handle empty guide', () => {
	const results = parser({ content: '' })

	expect(results).toMatchObject([])
})
```

To run the tests you can use the following command:

```sh
npm test -- example.com
```

Detailed documentation for the tests can be found here: https://jestjs.io/docs/using-matchers

</details>

<details>
<summary>example.com.channels.xml</summary>
<br>

This file contains a list of channels available at the source.

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<site site="example.com">
 <channels>
   <channel lang="en" xmltv_id="BBCOne.uk" site_id="bbc1">BBC 1</channel>
 </channels>
</site>
```

</details>

After creating all the files we can make sure that the guide loads correctly and has no errors using the command:

```sh
npx epg-grabber --config=sites/example.com/example.com.config.js --channels=sites/example.com/example.com.channels.xml --output=guide.xml --days=2
```

If the download is successful, the `guide.xml` file with the ready to use program should appear in the root directory.

After that, all that remains is to commit all the changes and send a pull request.
