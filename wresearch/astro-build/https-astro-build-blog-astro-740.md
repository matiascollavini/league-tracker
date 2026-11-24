[Skip to content](https://astro.build/blog/astro-740/#main)
[Astro Logo](https://astro.build/ "Home")
[Documentation](https://docs.astro.build)[Blog](https://astro.build/blog/)Resources
  * [ Themes](https://astro.build/themes/)
  * [ Integrations](https://astro.build/integrations/)
  * [ Site showcase](https://astro.build/showcase/)
  * [ Playground](https://play.astro.build)
  * [ Tutorials](https://docs.astro.build/en/tutorial/0-introduction/)

Community
  * [ Discord](https://astro.build/chat/)
  * [ Sponsors](https://opencollective.com/astrodotbuild)
  * [ Merch](https://shop.astro.build/)

Enterprise
  * [ AgenciesNew](https://astro.build/agencies/)
  * [ Case studies](https://astro.build/case-studies/)


[Go to Astro's GitHub repo](https://github.com/withastro/astro)
Show Menu
[Blog](https://astro.build/blog/)Resources
[ Themes ](https://astro.build/themes/)[ Integrations ](https://astro.build/integrations/)[ Site showcase ](https://astro.build/showcase/)[ Playground ](https://play.astro.build)[ Tutorials ](https://docs.astro.build/en/tutorial/0-introduction/)
Community
[ Discord ](https://astro.build/chat/)[ Sponsors ](https://opencollective.com/astrodotbuild)[ Merch ](https://shop.astro.build/)
Enterprise
[ Agencies New](https://astro.build/agencies/)[ Case studies ](https://astro.build/case-studies/)
[Follow Astro on Bluesky](https://bsky.app/profile/astro.build)[Join the Astro community on Discord](https://astro.build/chat)[Go to Astro's GitHub repo](https://github.com/withastro/astro)[Follow Astro on LinkedIn](https://www.linkedin.com/company/withastro)[Follow Astro on Mastodon](https://m.webtoo.ls/@astro)[Join the official Astro community on Reddit](https://www.reddit.com/r/withastro/)[Follow Astro on x.com (formerly Twitter)](https://x.com/astrodotbuild)[Follow Astro on YouTube](https://www.youtube.com/@astrodotbuild)
[Read the docs](https://docs.astro.build/)
![](https://astro.build/_astro/blog-post-astro-7.4.OmmySr-m_Z2dtuy4.webp)
October 15, 2026
# Astro 7.4
By
![](https://astro.build/_astro/matthew.Do99gaJm.webp)Matthew Phillips
* * *
**Astro 7.4 is here!** The headline feature is a new `--timings` flag for `astro build` that shows exactly where your build spends its time. This release also lets you use different image services for prerendered and on-demand pages, adds a `notFound()` handler for custom entrypoints, and warns you about font settings your provider can’t serve. Two new experimental features round it out: parallel prerendering across worker threads and a custom redirect page for static builds.
Explore what’s new in this release:
  * **[Build timings](https://astro.build/blog/astro-740/#build-timings)**
  * **[Separate build and runtime image services](https://astro.build/blog/astro-740/#separate-build-and-runtime-image-services)**
  * **[notFound() handler for custom entrypoints](https://astro.build/blog/astro-740/#notfound-handler-for-custom-entrypoints)**
  * **[Font configuration warnings](https://astro.build/blog/astro-740/#font-configuration-warnings)**
  * **[Updated minimum Node.js version](https://astro.build/blog/astro-740/#updated-minimum-nodejs-version)**
  * **[Experimental: parallel prerendering](https://astro.build/blog/astro-740/#experimental-parallel-prerendering)**
  * **[Experimental: custom redirect page](https://astro.build/blog/astro-740/#experimental-custom-redirect-page)**
  * **[Community](https://astro.build/blog/astro-740/#community)**


To upgrade an existing project, use the automated `@astrojs/upgrade` CLI tool. Alternatively, upgrade manually by running the upgrade command for your package manager:

```

# Recommended:



npx @astrojs/upgrade







# Manual:



npm install astro@latest




pnpm upgrade astro --latest




yarn upgrade astro --latest


```

## Build timings
When a build gets slow, it’s not always obvious why. Is it a Vite plugin, syntax highlighting, image processing, or rendering one particularly heavy page?
`astro build` now accepts a `--timings` flag:

```


astro build --timings


```

When the build finishes, Astro prints a summary of where the time went: build phases, Vite plugins, Markdown processing and syntax highlighting, page rendering, images, and integrations.
Here’s what that looks like in practice. We took the [blog starter](https://github.com/withastro/astro/tree/main/examples/blog) and added a `<CommentSection>` component to its blog post layout. It fetches a post’s comments, and each `<Comment>` inside it then fetches the commenter’s profile:
src/components/Comment.astro
```

---



const { comment } = Astro.props;



// Look up the commenter's profile for every comment



const res = await fetch(`https://jsonplaceholder.typicode.com/users?email=${comment.email}`);




const [user] = await res.json();



---







<article>




  <strong>{user?.name ?? comment.name}</strong>




  <p>{comment.body}</p>




</article>


```

Nothing about this looks wrong in the editor, but the profile requests can’t start until the comments come back, so every page waits on two network round trips in a row. Running `astro build --timings` makes that easy to see (some sections trimmed):

```


 build timings



total 2.61s · 9 pages · output "static"






Build phases



  resolve config                        59ms   2.3% ▄·····················




  setup                                225ms   8.6% ▃█▅···················




    route discovery                      2ms   0.1% ▁·····················




    vite config                         14ms   0.5% ▁·····················




    content sync                       206ms   7.9% ▂█▅···················




  prerender bundle                     151ms   5.8% ··▃█··················




  client bundle                         21ms   0.8% ····▂·················




  manifest injection                     2ms   0.1% ····▁·················




  generate pages                       2.10s  80.6% ····▇█████████████████




    prerenderer setup                    6ms   0.2% ····▁·················




    static paths                         3ms   0.1% ····▁·················







Page rendering (2.09s across 9 pages)



  component render                     2.08s  79.6% ····▆█████████████████




  page pipeline                         13ms   0.5%







Slowest pages (median 297ms · p95 571ms)



  /about                               571ms




  /blog/first-post                     307ms         /blog/[...slug]




  /blog/using-mdx                      303ms         /blog/[...slug]




  /blog/second-post                    299ms         /blog/[...slug]




  /blog/third-post                     297ms         /blog/[...slug]




  /blog/markdown-style-guide           296ms         /blog/[...slug]




  /rss.xml                              10ms




  /blog                                  6ms


```

The report tells the story from the top down. Generating pages takes 81% of the build, and nearly all of that is spent inside components rather than in Astro’s own page pipeline. The slowest pages are the ones that use the blog post layout, while `/blog` and `/rss.xml` render in milliseconds. That points straight at something the layout renders.
Fetching the comments and all the profiles at once with `Promise.all()` in `<CommentSection>`, and passing each profile down to `<Comment>`, cut page generation from 2.10s to 1.13s and halved the time for each blog post.
The report also covers Vite plugins, the slowest files to bundle, Markdown plugins, syntax highlighting, and image transforms, so the same flag helps whether your slow build comes from rendering, bundling, or images. It’s a good first step before trying flags like parallel prerendering or incremental builds, so you know which part of the build to target. See the [`--timings` reference](https://docs.astro.build/en/reference/cli-reference/#--timings) for more.
## Separate build and runtime image services
Prerendered pages and on-demand pages have different needs when it comes to images. At build time you have plenty of time and a full Node.js environment, so a local optimizer like Sharp works well. On-demand pages run on your server or at the edge, often in a runtime where Sharp can’t run, so an image CDN is usually the better fit. Until now you had to pick one image service for both, or rely on your adapter to make the choice for you.
In Astro 7.4, `image.service` also accepts a `build` and a `runtime` service:
astro.config.mjs
```


import { defineConfig } from 'astro/config';








export default defineConfig({




  image: {




    service: {




      build: { entrypoint: 'astro/assets/services/sharp' },




      runtime: { entrypoint: 'my-image-cdn-service' },




    },




  },



});

```

The `build` service handles images on prerendered pages, generates them during the build, and is also used during development. The `runtime` service handles on-demand pages and the image endpoint in production. Passing a single service still works the same as before.
To make this possible, we reworked how Astro tracks the images used during a build. Prerenderers now take part in Astro’s own image pipeline instead of having to recreate it themselves. As a result, `@astrojs/cloudflare` now processes images on prerendered pages through the same pipeline as every other adapter.
For integration authors
`config.image.service` keeps the shape the user configured. When a project sets `build` and `runtime` services, `config.image.service.entrypoint` and `config.image.service.config` are `undefined`, so check for the `runtime` property if your integration reads the image service:

```


'astro:config:done': ({ config }) => {




  const { service } = config.image;




  const runtimeService = 'runtime' in service ? service.runtime : service;




  // ...



},

```

Custom prerenderers now report the images used on each page through the metadata that `getStaticPaths()` and `render()` return. If you wrap Astro’s default prerenderer with [`setPrerenderer()`](https://docs.astro.build/en/reference/integrations-reference/#setprerenderer-option), pass that metadata through:

```


setPrerenderer((defaultPrerenderer) => ({




  name: 'my-prerenderer',




  async getStaticPaths() {




    const result = await defaultPrerenderer.getStaticPaths();




    const { paths, metadata } = Array.isArray(result) ? { paths: result } : result;




    return { paths: paths.filter(({ pathname }) => !pathname.startsWith('/drafts')), metadata };




  },




  render(request, options) {




    return defaultPrerenderer.render(request, options);




  },



}));

```

Returning a plain array from `getStaticPaths()` or a plain `Response` from `render()` still works, but is deprecated, and images on those pages won’t be generated. Upgrade `@astrojs/cloudflare` and `@astrojs/markdoc` along with `astro`, since their new versions require `astro@^7.4.0`.
## notFound() handler for custom entrypoints
The composable handlers in `astro/fetch` and `astro/hono` let you build your own server or worker entrypoint from Astro’s pieces. However, if you used `pages()` without the all-in-one `astro()` handler, a request that didn’t match any route returned an empty 404 instead of your custom `404.astro` page, even if it was prerendered.
Astro 7.4 adds a `notFound()` handler. Add it before `pages()` to render your 404 page when no route matches:
src/worker.ts
```


import { Hono } from 'hono';




import { notFound, pages } from 'astro/hono';




import { cf } from '@astrojs/cloudflare/hono';








const app = new Hono();








app.use(cf());




app.use(notFound());




app.use(pages());








export default app;


```

The same handler is available from `astro/fetch`. `astro()` already includes this behavior, so you only need `notFound()` when you compose the handlers yourself. See the [`notFound()` reference](https://docs.astro.build/en/reference/modules/astro-fetch/#notfound) for details.
## Font configuration warnings
It’s easy to ask for a font weight or subset that a font family doesn’t offer, and until now you’d only find out when the text looked wrong. Font providers can now implement an optional `getFontProperties()` callback that reports the weights, styles, subsets, and formats a family actually has, and Astro warns you about any values in your config that the provider can’t serve.
All of Astro’s built-in font providers support this. If you maintain a custom font provider, we recommend implementing `getFontProperties()` now. It’s optional in Astro 7, but will be required in Astro 8:

```


import type { FontProvider } from 'astro';








const provider: FontProvider = {




  name: 'my-provider',




  resolveFont: ({ familyName }) => {




    // ...




  },




  getFontProperties: ({ familyName }) => ({




    weights: ['400', '700'],




    styles: ['normal', 'italic'],




    subsets: ['latin'],




    formats: ['woff2'],




  }),



};

```

The `init()` context for font providers also gains a `fetch()` function that retries transient failures. Providers that wrap a third-party unifont provider can pass the context straight through to it. See the [font provider reference](https://docs.astro.build/en/reference/font-provider-reference/#getfontproperties) for details.
## Updated minimum Node.js version
The minimum supported Node.js version for Astro and its official integrations is now 22.22.0. This is the latest Node.js 22 release supported by StackBlitz, and the change follows Astro’s [Node.js support policy](https://docs.astro.build/en/upgrade-astro/#support). If you’re on an older Node.js 22 release, upgrade Node.js before upgrading Astro. See the [installation prerequisites](https://docs.astro.build/en/install-and-setup/#prerequisites) for the full list of requirements.
## Experimental: parallel prerendering
Astro renders static pages concurrently, but until now all of that rendering happened on a single thread. On large sites with CPU-heavy pages, the build was limited to one core no matter how many your machine had.
Astro 7.4 adds the `experimental.parallelPrerender` flag, which renders static pages in Node.js worker threads:
astro.config.mjs
```


import { defineConfig } from 'astro/config';








export default defineConfig({




  experimental: {




    parallelPrerender: true,




  },



});

```

By default, Astro uses all available CPU cores but one. Each worker adds to the memory your build uses, so if your build runs out of memory or doesn’t get faster, set `workers` to a lower number:
astro.config.mjs
```


import { defineConfig } from 'astro/config';








export default defineConfig({




  experimental: {




    parallelPrerender: {




      workers: 4,




    },




  },



});

```

Each worker renders as many pages at once as your [`build.concurrency`](https://docs.astro.build/en/reference/configuration-reference/#buildconcurrency) setting allows.
The flag has no effect when your adapter provides its own way of prerendering pages. Among official adapters, that’s only `@astrojs/cloudflare`, and Astro logs a warning during the build when the flag is ignored.
This pairs well with [incremental static builds](https://astro.build/blog/astro-720/#experimental-incremental-static-builds): incremental builds skip pages that haven’t changed, and parallel prerendering spreads the pages that do need rendering across your CPU cores. See the [experimental parallel prerendering docs](https://docs.astro.build/en/reference/experimental-flags/parallel-prerender/) for more.
## Experimental: custom redirect page
A static site has no server to send an HTTP `Location` header, so for every redirect it builds, Astro generates a small HTML page with a `<meta http-equiv="refresh">` tag. That includes your [`redirects`](https://docs.astro.build/en/reference/configuration-reference/#redirects) config, `Astro.redirect()` calls in prerendered pages, and i18n redirects. That page’s markup, wording, and delay were fixed, so you couldn’t brand or translate it.
The new `experimental.redirectPage` flag lets you provide your own:
astro.config.mjs
```


import { defineConfig } from 'astro/config';








export default defineConfig({




  experimental: {




    redirectPage: true,




  },



});

```

Then create `src/pages/3xx.astro`. Astro renders it once for each redirect, passing that redirect’s `from`, `to`, `status`, and `delay` as props:
src/pages/3xx.astro
```

---



import type { RedirectPageProps as Props } from 'astro';








const { from, to, status, delay } = Astro.props;



---







<html lang="en">




  <head>




    <meta http-equiv="refresh" content={`${delay};url=${to}`} />




    <meta name="robots" content="noindex" />




    <title>Redirecting…</title>




  </head>




  <body>




    <p>This page has moved. <a href={to}>Continue to {to}</a>.</p>




  </body>




</html>


```

In a static build, the `<meta http-equiv="refresh">` tag is the redirect, so your page must render one that points to `to`. Astro logs a warning during the build if it’s missing, and falls back to the built-in page if yours fails to render. Redirects from on-demand pages are unchanged.
See the [experimental redirect page docs](https://docs.astro.build/en/reference/experimental-flags/redirect-page/) for more, and leave feedback on the [RFC](https://github.com/withastro/roadmap/pull/1444).
## Other improvements
  * **Integrations can control build output directories** — Astro now treats Vite’s resolved `outDir` for each environment as the source of truth for where client, server, and prerender output is written, so integrations and Vite plugins can move it. Custom prerenderers can read the final locations from a new `outputDirectories` context in `setPrerenderer()`, and Vite’s build manifests now stay around until every `buildApp` hook has finished, so deployment integrations can read them. ([#18313](https://github.com/withastro/astro/pull/18313))


For a complete list of bug fixes and smaller improvements, see [the full changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md).
## Community
The Astro core team is:
[![](https://astro.build/_astro/alex.BcX1DXrO.webp)Alexander Niebuhr](https://twitter.com/realalexniebuhr "Follow Alexander Niebuhr on Twitter"), [![](https://astro.build/_astro/armand.BK0kSPh6.webp)Armand Philippot](https://github.com/ArmandPhilippot "Follow Armand Philippot on Github"), [![](https://astro.build/_astro/chris.ZOiiyI05.webp)Chris Swithinbank](https://m.webtoo.ls/@swithinbank "Follow Chris Swithinbank on Mastodon"), [![](https://astro.build/_astro/ema.Cdibg2Q4.webp)Emanuele Stoppa](https://bsky.app/profile/ematipico.xyz "Follow Emanuele Stoppa on Bluesky"), [![](https://astro.build/_astro/erika.D_h-VfLk.webp)Erika](https://bsky.app/profile/erika.florist "Follow Erika on Bluesky"), [![](https://astro.build/_astro/florian.BpVy6U4D.webp)Florian Lefebvre](https://github.com/florian-lefebvre "Follow Florian Lefebvre on Github"), [![](https://astro.build/_astro/fred.CuAgzliB.webp)Fred Schott](https://twitter.com/FredKSchott "Follow Fred Schott on Twitter"), [![](https://astro.build/_astro/hideoo.BJXLtTzx.png)HiDeoo](https://bsky.app/profile/hideoo.dev "Follow HiDeoo on Bluesky"), [![](https://astro.build/_astro/luiz.BmrApS_m.webp)Luiz Ferraz](https://github.com/Fryuni "Follow Luiz Ferraz on Github"), [![](https://astro.build/_astro/matt.DK7kFqz2.webp)Matt Kane](https://bsky.app/profile/mk.gg "Follow Matt Kane on Bluesky"), [![](https://astro.build/_astro/matthew.Do99gaJm.webp)Matthew Phillips](https://bsky.app/profile/fancypenguin.party "Follow Matthew Phillips on Bluesky"), [![](https://astro.build/_astro/reuben.DG3o7sby.png)Reuben Tier](https://bsky.app/profile/otterlord.dev "Follow Reuben Tier on Bluesky"), [![](https://astro.build/_astro/sarah.YNdXa1Yu.webp)Sarah Rainsberger](https://bsky.app/profile/sarah11918.rainsberger.ca "Follow Sarah Rainsberger on Bluesky"), and [![](https://astro.build/_astro/yan.C-HdJwM_.webp)Yan Thomas](https://bsky.app/profile/yanthomas.dev "Follow Yan Thomas on Bluesky").
Special thanks to everyone who contributed to Astro 7.4 with code, docs, reviews, and testing, including:
[Adam Chalemian](https://github.com/adamchal), [Adam Matthiesen](https://github.com/Adammatthiesen), [Alex Hoyau](https://github.com/lexoyo), [Alisson Nunes](https://github.com/Alynva), [Anastasia Y.](https://github.com/nasty23-star), [Andreas Deininger](https://github.com/deining), [Andrei Alba](https://github.com/andreialba), [Angel Marfil](https://github.com/angelmarfil), [Asqar Bäkir](https://github.com/asqar), [Aurora](https://github.com/auroraxo), [Austen Stone](https://github.com/austenstone), [Ben Abulafia](https://github.com/bensynapse), [breken](https://github.com/breken-ai), [bulebrainbrand](https://github.com/bulebrainbrand), [Chowdhury Zaber Bin Zahid](https://github.com/Chy-Zaber-Bin-Zahid), [Dan Barclay](https://github.com/barclayd), [Daniel Mueller](https://github.com/danielmlr), [Danillo Estrela](https://github.com/danilloestrela), [David Umoru](https://github.com/davidumoru), [Edmund Hung](https://github.com/edmundhung), [Felix Schneider](https://github.com/trueberryless), [fkatsuhiro](https://github.com/fkatsuhiro), [Fuan200](https://github.com/Fuan200), [George Zhang](https://github.com/odysseus0), [Harjot Singh](https://github.com/imharjot), [is*hosting](https://github.com/ishosting-admin), [Jack Hanford](https://github.com/hanford), [jacobortiz](https://github.com/jacobortiz), [James Opstad](https://github.com/jamesopstad), [Jassine](https://github.com/koeliga), [joel hansson](https://github.com/qzio), [Junseong Park](https://github.com/jsparkdev), [kdelay](https://github.com/kdelay), [Kevin Deng](https://github.com/sxzz), [KTrain](https://github.com/KTrain5169), [Leif Marcus](https://github.com/leifmarcus), [Liang Xu](https://github.com/lx3133584), [Louis Escher](https://github.com/louisescher), [Luca Agosta](https://github.com/agostaxyz), [Lukas](https://github.com/L4XB), [Madan Kumar](https://github.com/winklemad), [Maninderpreet Singh](https://github.com/SudoDevStudio), [Manuel](https://github.com/manuelgruber), [Mauro Daniel Viveros](https://github.com/mauroviveros), [Michael Wang](https://github.com/EastSun5566), [Mikhail Alabugin](https://github.com/1t1sCooL), [Ming-jun Lu](https://github.com/mingjunlu), [Minho Yoo](https://github.com/irontaek), [mixto](https://github.com/mixto), [mrchatam](https://github.com/mrchatam), [Neil de Carteret](https://github.com/n3dst4), [ocavue](https://github.com/ocavue), [paul valladares](https://github.com/dreyfus92), [Pedro Spengler](https://github.com/PedriSpengler), [Peeranat Danaidusadeekul](https://github.com/peeranat-dan), [Piyush Mehta](https://github.com/piyush97), [Pruthvi Shetty](https://github.com/pruthvi2103), [randomguy-2650](https://github.com/randomguy-2650), [Roman](https://github.com/gameroman), [Sakku 🦉](https://github.com/Yusaku01), [Sapan Mozammel](https://github.com/SapanMozammel), [Shinya Fujino](https://github.com/morinokami), [Shoichi Sasaki](https://github.com/ajfAfg), [surefirestudios](https://github.com/SurefireStudios), [Tobias Breit](https://github.com/pdig-tobiasbreit), [Tomoki Yamauchi](https://github.com/yamotech), [ump45nose](https://github.com/ump45nose), [Wataru Sato](https://github.com/awwa), [Waxer59](https://github.com/Waxer59), [Yhvr](https://github.com/IAmYhvr), and [Zhiqi Zhang](https://github.com/shoutoutuoadi325)
We hope you enjoy Astro 7.4. If you run into issues or want to share feedback, please join us on [Discord](https://astro.build/chat), post on [GitHub](https://github.com/withastro/astro/issues), or reach out on [Bluesky](https://bsky.app/profile/astro.build), [Twitter](https://twitter.com/astrodotbuild), and [Mastodon](https://m.webtoo.ls/@astro).
* * *
[New Astro merch!](https://shop.astro.build/)
Support Astro with custom shirts, stickers, hats, and more from our shop →
![](https://astro.build/_astro/swag.CXx_lILU_ZvCG1J.webp)
* * *
## Related Posts
![](https://astro.build/_astro/blog-post-astro-7.3.BFQSAUJT_Z1aHABw.webp)
[Astro 7.3](https://astro.build/blog/astro-730/)
Astro 7.3 adds an --ignore-lock flag for astro preview, passes Astro's runtime logger into custom image services and cache providers, and ships a finalize() helper for Cloudflare custom worker entrypoints.
![](https://astro.build/_astro/blog-post-astro-7.2.BvC--PbT_Z1cNM8J.webp)
[Astro 7.2](https://astro.build/blog/astro-720/)
Astro 7.2 adds experimental incremental static builds, an option to opt out of session support, background mode for astro preview, and relative logger entrypoints.
Let's keep in touch
Enter your email to stay up to date with the latest updates from Astro.
Email
## Resources
  * [Docs](https://docs.astro.build/en/getting-started/)
  * [Themes](https://astro.build/themes/)
  * [Integrations](https://astro.build/integrations/)
  * [Playground](https://play.astro.build/)
  * [Site showcase](https://astro.build/showcase/)
  * [Starter templates](https://astro.new/)


## About
  * [Blog](https://astro.build/blog/)
  * [Case studies](https://astro.build/case-studies/)
  * [Partner with us](https://astro.build/partnerships/)
  * [Press](https://astro.build/press/)
  * [Agencies](https://astro.build/agencies/)


## Community
  * [Contributing](https://github.com/withastro/astro/blob/main/CONTRIBUTING.md)
  * [Sponsors](https://opencollective.com/astrodotbuild)
  * [Wallpapers](https://astro.build/wallpapers/)
  * [Swag Shop](https://shop.astro.build)


## Legal
  * [Telemetry](https://astro.build/telemetry/)
  * [Privacy Policy](https://astro.build/privacy/)
  * [Terms of Service](https://astro.build/terms/)


* * *
[MIT License © 2026 ](https://github.com/withastro/astro/blob/main/LICENSE)[Astro Contributors](https://github.com/withastro/astro/graphs/contributors)
[Follow Astro on Bluesky](https://bsky.app/profile/astro.build)[Join the Astro community on Discord](https://astro.build/chat)[Go to Astro's GitHub repo](https://github.com/withastro/astro)[Follow Astro on LinkedIn](https://www.linkedin.com/company/withastro)[Follow Astro on Mastodon](https://m.webtoo.ls/@astro)[Join the official Astro community on Reddit](https://www.reddit.com/r/withastro/)[Follow Astro on x.com (formerly Twitter)](https://x.com/astrodotbuild)[Follow Astro on YouTube](https://www.youtube.com/@astrodotbuild)
![](https://cdn.usefathom.com/?h=https%3A%2F%2Fastro.build&p=%2Fblog%2Fastro-740%2F&r=&sid=EZBHTSIG&qs=%7B%7D&cid=44547567)
