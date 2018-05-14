## image-localizer

```sh
$ image-localizer file.md
  ...
  image.md now uses local image references
```

A very focused, limited tool that I wrote for myself. It runs over Markdown
files, presumably part of a Jekyll blog, and downloads references to Flickr
and then rewrites the Markdown file to point to those references. Attempts to
avoid unnecessary reformatting as much as possible.

### Features

- Minimizes git differences so that rewriting images doesn't clutter history.
- Rewrites image references both in text and YAML header
- Resizes images and outputs efficient images

### Note

This is a custom tool that I wrote for myself. It's only a few PRs away from being a more general purpose tool. If that means you - if you'd want to use this for your website and want some changes, please make some changes and contribute them back! For example, the image output directory, external image host (Flickr), and image size are all hardcoded, but could easily be configurable with a little change.
