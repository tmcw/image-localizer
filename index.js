#!/usr/bin/env node
const Remark = require("remark");
const Rehype = require("rehype");
const frontmatter = require("remark-frontmatter");
const select = require("unist-util-select");
const fs = require("fs");
const sharp = require("sharp");
const MagicString = require("magic-string");
const got = require("got");
const slugg = require("slugg");
const { extname, basename } = require("path");
const yaml = require("js-yaml");

let imageDir = "images";

async function localizeImage(image, base, i) {
  const content = await got(image.url, { encoding: null });
  const resized = await sharp(content.body)
    .resize(640 * 2, null, { withoutEnlargement: true })
    .toBuffer();
  let originalFiletype = extname(image.url);
  let imageSlug = image.alt ? slugg(image.alt) : i;
  let path = `${imageDir}/${base}-${imageSlug}${originalFiletype}`;
  fs.writeFileSync(path, resized);
  image.url = `/${path}`;
  return image;
}

async function localizeFile(filename) {
  const rehype = Rehype().data("settings", {
    fragment: true
  });
  const remark = Remark()
    .data("settings", {
      listItemIndent: "1",
      rule: "-"
    })
    .use(frontmatter, "yaml");
  const text = fs.readFileSync(filename, "utf8");
  const s = new MagicString(text);
  const base = basename(filename, ".md");
  const ast = remark.parse(text);
  const images = select(ast, "image");
  const htmls = select(ast, "html");
  const [yamlNode] = select(ast, "yaml");
  const parsedYaml = yaml.safeLoad(yamlNode.value);
  let i = 0;
  let hasFlickrThumbnail =
    parsedYaml.image && parsedYaml.image.match(/static\.?flickr/);
  if (hasFlickrThumbnail) {
    console.log(parsedYaml.image);
    parsedYaml.image = (await localizeImage(
      {
        url: parsedYaml.image,
        alt: "thumbnail-image"
      },
      base,
      i++
    )).url;
    yamlNode.value = yaml.safeDump(parsedYaml);
    s.overwrite(
      yamlNode.position.start.offset,
      yamlNode.position.end.offset,
      remark.stringify(yamlNode)
    );
  }
  const imageTags = htmls.filter(html => {
    return html.value.startsWith("<img");
  });
  for (let imageTag of imageTags) {
    try {
      const ast = rehype.parse(imageTag.value);
      const src = ast.children[0].properties.src;
      if (src.includes(" ")) continue;
      s.overwrite(
        imageTag.position.start.offset,
        imageTag.position.end.offset,
        remark.stringify(
          await localizeImage(
            {
              type: "image",
              url: src,
              alt: ast.children[0].properties.alt || ""
            },
            base,
            i++
          )
        )
      );
    } catch (err) {
      console.error(err);
    }
  }
  const flickrImages = images.filter(img => img.url.match(/static\.?flickr/));
  for (let image of flickrImages) {
    try {
      s.overwrite(
        image.position.start.offset,
        image.position.end.offset,
        remark.stringify(await localizeImage(image, base, i++))
      );
    } catch (error) {
      console.log(image);
      console.error(error);
    }
  }

  if (s.toString() !== text) {
    console.log("rewrote ", filename);
    fs.writeFileSync(filename, s.toString());
  } else {
    console.log("skipped ", filename);
  }
}

localizeFile(process.argv[2]);
