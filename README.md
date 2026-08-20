# PsiTransfer

Simple open source self-hosted file sharing solution.
It's an alternative to paid services like Dropbox, WeTransfer.

* No accounts, no logins
* Mobile friendly responsive interface
* Supports many and very big files (Streams ftw)
* Resumable up- and downloads ([tus.io](https://tus.io))
* Set an expire-time for your upload bucket
* One-time downloads
* Download all files as zip/tar.gz archive
* Modal-style file preview
* Password protected download list (hashed with [argon2](https://en.wikipedia.org/wiki/Argon2))
* `/admin` page lists bucket information (_disabled until you set `adminPass` in config_)
* Lightweight [Vue](https://vuejs.org) based frontend apps
* Explicit named bucket IDs with query param `sid=<myBucketID>`
* Folder uploads/downloads keep their directory structure, browsable as a folder tree
* Optional one-time email notification when a shared file is downloaded

This is a fork of [psi-4ward/psitransfer](https://github.com/psi-4ward/psitransfer), with the
following additions on top of upstream:

* Rate limiting on the admin/upload/download password checks and on new-upload creation, to
  slow down brute-force and mass-spam attempts without throttling legitimate large uploads
* Bucket and upload passwords hashed with argon2 instead of stored/compared in a weaker form
* Sortable, filterable `/admin` bucket table
* Folder-tree navigation for uploads and downloads with subfolders
* Optional download-notification emails (`plugins/file-downloaded-email.js`)

## Quickstart

### Manual, from source

```bash
# Compile the frontend apps
$ cd app
$ npm install
$ npm run build

# Install dependencies
$ cd ..
$ npm install
$ npm start
```

Requires Node >= 24 (see `.nvmrc`).

### Configuration

There are some configs in `config.js` like port and data-dir.
You can:
* Edit the `config.js` **(not recommended)**
* Add a `config.<NODE_ENV>.js`, e.g. `config.production.js` (git-ignored by default, since
  it's the natural place for per-environment secrets)
* Define environment variables like `PSITRANSFER_UPLOAD_DIR` to set the upload directory
* To secure your instance if exposed to the internet against unwanted, non-authorized uploads,
  use the `PSITRANSFER_UPLOAD_PASS` environment variable
* Set `notifyFromAddress` (or `PSITRANSFER_NOTIFY_FROM_ADDRESS`) if you enable the
  download-notification email plugin

See `docs/configuration.md` for the full list of options.

### Customization

`public/pug/upload.pug` and `download.pug` are kept simple.
You can alter these files and add your own logo and styles — custom CSS goes in
`public/pug/partials/head_custom.pug`. See `docs/layout-customization.md`.
Please keep a footnote like *Powered by PsiTransfer* :)

### Debug

Uses [debug](https://github.com/visionmedia/debug):

```bash
DEBUG=psitransfer:* npm start
```

## Side notes

* **There is no (end-to-end) payload encryption (yet)**.
* `Download all as ZIP` does not support resuming the download.

## Credits

Built on top of [psi-4ward/psitransfer](https://github.com/psi-4ward/psitransfer) by
Christoph Wiechert. See `LICENSE` for the original copyright notice.

## License

[BSD-2-Clause](LICENSE)
