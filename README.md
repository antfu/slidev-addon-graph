# slidev-addon-graph

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

Slidev addon for draggable graphs

> [!WARNING]
> This is work in progress.

## Usage

```bash
pnpm add -D slidev-addon-graph
```

In the frontmatter of your `slides.md`:

```md
---
addons:
  - slidev-addon-graph
---
```

In your slides:

```md
<SlidevGraph
  id="graph1"
  :items="[
    { name: 'foo', color: '#155' },
    { name: 'bar', color: '#551', from: 'foo' },
  ]"
/>
```

`id` is required and should be unique for each graph. When the graph is rendered, you can double click the graph to make it draggable, new positions of the nodes will be saved under `.slidev/graph/${id}.json` that you should commit to your source control.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2024-PRESENT [Anthony Fu](https://github.com/antfu)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/slidev-addon-graph?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/slidev-addon-graph
[npm-downloads-src]: https://img.shields.io/npm/dm/slidev-addon-graph?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/slidev-addon-graph
[bundle-src]: https://img.shields.io/bundlephobia/minzip/slidev-addon-graph?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=slidev-addon-graph
[license-src]: https://img.shields.io/github/license/antfu/slidev-addon-graph.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/slidev-addon-graph/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/slidev-addon-graph
