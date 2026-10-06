# Taiga — Inari Explorer

An interactive Three.js landscape based on a roughly 7 × 7 km elevation tile around Lake Inari, Finland.

**Live site:** https://taiga-inari-explorer.shashwatdogra1.chatgpt.site (owner-private access)

## Run locally

Install Node.js, then run:

```sh
npm start
```

Open http://127.0.0.1:4173 in a browser with WebGL 2 support. No dependency installation or build step is required: Three.js r186 and its controls/water modules are vendored in `dist/vendor/`.

## Explore

- Orbit: drag, scroll to zoom, and right-drag to pan.
- Fly: drag to steer; WASD to move; Q/E to descend/ascend; Shift to accelerate.
- Drift: automatic slow orbit.
- Seven viewpoints include the birch grove, beach cliff, blueberry patch, and woodland pond.
- Spring, summer, autumn, and winter change foliage, berries/blossoms, snow, and lake ice.
- Controls adjust sunlight, mist, elevation exaggeration, forest visibility, contours, and shadows.

The scene includes pine, birch, oak, willow, fern and blueberry representations, pinecones, low bushes, rocks, a modelled beach/cliff and pond, reflective water, wind effects, snow shaders, and cloud banks around the map border.

Water uses distance-filtered analytic ripples, softened highlights and antialiased shoreline foam. Terrain and object placement share one triangulated height field; sand blends into the terrain rather than an overlapping ground plane. Fine vegetation no longer produces noisy self-shadows. The look is an original stylized interpretation, not assets from a commercial game.

Run the terrain-placement regression check with `node tests/terrain.test.mjs`. It compares sampled heights against actual mesh raycasts and verifies that the pond basin lies below its water surface.

## Source layout

| File | Purpose |
| --- | --- |
| `dist/app.js` | Terrain, scene setup, exploration and UI |
| `dist/nature.js` | Birch trees, leaves and ferns |
| `dist/habitat.js` | Oak/willow trees, blueberries, rocks, cliff, beach and snow |
| `dist/lake.js` | Reflective water, ripples and shoreline foam |
| `dist/terrain.js` | Shared height field, landscaped pond basin, blended ground and sand |
| `dist/frontier.js` | Pinecones, low bushes, grass and border clouds |
| `dist/dem.png`, `dist/region.json` | Terrarium elevation tile and its bounds |
| `dist/index.html`, `dist/style.css` | Interface and styling |
| `.openai/hosting.json` | Existing Sites deployment identity; not needed for local running |

## Geography and credits

The base elevation comes from real data; the vegetation, beach, cliff, pond, local ground variation, softened lake shores, weather and seasons are artistic reconstructions. Oak and ornamental willow forms are imaginative additions rather than surveyed local habitat. Relief defaults to 2×; choose 1× for unexaggerated elevations. This is not a navigation map.

- Elevation: [Mapzen/Tilezen Terrain Tiles on AWS](https://registry.opendata.aws/terrain-tiles/), Terrarium tile `11/1179/476`.
- Europe: produced using Copernicus data and information funded by the European Union — EU-DEM layers.
- ArcticDEM: data created from DigitalGlobe imagery and funded under NSF awards 1043681, 1559691 and 1542736.
- Global GMTED2010/SRTM: courtesy of the US Geological Survey.
- [Full elevation attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md).
- [Inari visitor information](https://www.luontoon.fi/en/destinations/inari-hiking-area/activities-and-trails/hiking-and-outdoor-recreation).
- Three.js is MIT-licensed; see `dist/vendor/LICENSE`.
- Fonts load from Google Fonts when available, with local fallback fonts.

To host elsewhere, serve the contents of `dist/` over HTTP(S). Keep its assets and vendor license together.
