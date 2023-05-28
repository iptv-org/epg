# EPG

Utilities for downloading the EPG (Electronic Program Guide) for thousands of TV channels from hundreds of sources.

__IMPORTANT:__ We are no longer able to provide pre-made guides due to the disabling of GitHub Actions (Read more: https://github.com/orgs/iptv-org/discussions/12#discussioncomment-5219050). This repository now contains only utilities and configurations for downloading guides yourself.

## Table of contents

- 🚀 [How to use?](#how-to-use)
- 📺 [Playlists](#playlists)
- 🗄 [Database](#database)
- 👨‍💻 [API](#api)
- 📚 [Resources](#resources)
- 💬 [Discussions](#discussions)
- 🛠 [Contribution](#contribution)
- © [License](#license)

## How to use?

To download the guide from one of the supported sites you must have [Node.js](https://nodejs.org/en) installed on your computer first.

You will also need to install [Git](https://git-scm.com/downloads) to follow these instructions.

After installing them, you need to open the [Console](https://en.wikipedia.org/wiki/Windows_Console) (or [Terminal](https://en.wikipedia.org/wiki/Terminal_(macOS)) if you have macOS) and type the following command:

```sh
git clone --depth 1 -b master https://github.com/iptv-org/epg.git
```

Then also through the Console navigate to the just downloaded `epg` folder:

```sh
cd epg
```

And install all the necessary dependencies:

```sh
npm install
```

Now choose one of the sources (their complete list can be found in the [/sites](https://github.com/iptv-org/epg/tree/master/sites) folder) and start downloading the guide using the command:

```sh
SITE=example.com npm run grab
```

After the download is completed in the current directory will appear a new folder `guides`, which will store all XML files:

```sh
guides
└── en
    └── example.com.xml
```

Also you can make these guides available via URL by running your own server:

```sh
npm run serve
```

After that all the downloaded guides will be available at a link like this:

```
http://localhost:3000/guides/en/example.com.xml
```

In addition, they will be available on your local network at:

```
http://<your_local_ip_address>:3000/guides/en/example.com.xml
```

## Playlists

Playlists with already linked guides can be found in the [iptv-org/iptv](https://github.com/iptv-org/iptv) repository.

## Database

All channel data is taken from the [iptv-org/database](https://github.com/iptv-org/database) repository. If you find any errors please open a new [issue](https://github.com/iptv-org/database/issues) there.

## API

The API documentation can be found in the [iptv-org/api](https://github.com/iptv-org/api) repository.

## Resources

Links to other useful IPTV-related resources can be found in the [iptv-org/awesome-iptv](https://github.com/iptv-org/awesome-iptv) repository.

## Discussions

If you have a question or an idea, you can post it in the [Discussions](https://github.com/orgs/iptv-org/discussions) tab.

## Contribution

Please make sure to read the [Contributing Guide](https://github.com/iptv-org/epg/blob/master/CONTRIBUTING.md) before sending [issue](https://github.com/iptv-org/epg/issues) or a [pull request](https://github.com/iptv-org/epg/pulls).

And thank you to everyone who has already contributed!

### Backers

<a href="https://opencollective.com/iptv-org"><img src="https://opencollective.com/iptv-org/backers.svg?width=890" /></a>

### Contributors

<a href="https://github.com/iptv-org/epg/graphs/contributors"><img src="https://opencollective.com/iptv-org/contributors.svg?width=890" /></a>

## License

[![CC0](http://mirrors.creativecommons.org/presskit/buttons/88x31/svg/cc-zero.svg)](LICENSE)
