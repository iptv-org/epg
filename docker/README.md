# API snapshot

At the start of every Docker workflow run, `iptv-org/api:gh-pages` is resolved to an immutable
commit. The snapshot is downloaded and validated once, then passed unchanged to every platform
build.

The optional `api_ref` workflow input can select a different commit, tag or branch for one run.
The resolved commit and the snapshot digest are recorded in the image metadata.

Local Docker builds use the same validated `gh-pages` snapshot. `api-snapshot.mjs` owns revision
resolution, downloading, retries, JSON validation and checksum verification.
