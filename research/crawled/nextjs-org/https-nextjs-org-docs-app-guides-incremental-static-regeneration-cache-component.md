[](https://vercel.com/oss)[![NextjsLogotype](https://nextjs.org/_next/static/immutable/media/nextjs-logotype-light.00-_80jv8_dct.svg)![NextjsLogotype](https://nextjs.org/_next/static/immutable/media/nextjs-logotype-dark.3h4a2z2v_dkod.svg)](https://nextjs.org/)
  * [![NextjsLogotype](https://nextjs.org/_next/static/immutable/media/nextjs-logotype-light.00-_80jv8_dct.svg)![NextjsLogotype](https://nextjs.org/_next/static/immutable/media/nextjs-logotype-dark.3h4a2z2v_dkod.svg)](https://nextjs.org/)


  * [Docs](https://nextjs.org/docs)
  * [Learn](https://nextjs.org/learn)
  * [Showcase](https://nextjs.org/showcase)
  * [Blog](https://nextjs.org/blog)
  * [Templates](https://vercel.com/templates/next.js)
  * [Deploy](https://vercel.com/new)


Search…`⌘K`Ask AIAsk AI[![](https://nextjs.org/_next/static/immutable/media/logo-github-light.3dl3lqjq1azpp.svg)![](https://nextjs.org/_next/static/immutable/media/logo-github-dark.1k-70sin_m3qn.svg)](https://github.com/vercel/next.js)
Search…`⌘K`
[Docs](https://nextjs.org/docs)[Learn](https://nextjs.org/learn)[Showcase](https://nextjs.org/showcase)[Blog](https://nextjs.org/blog)[Templates](https://vercel.com/templates/next.js)[Deploy](https://vercel.com/new)[GitHub](https://github.com/vercel/next.js)Vercel OSS
Latest
  * [eve](https://eve.dev/)


Frameworks
  * [Svelte](https://svelte.dev/)
  * [Nuxt](https://nuxt.com/)
  * [Nitro](https://nitro.build/)


SDKs
  * [AI SDK](https://ai-sdk.dev/)
  * [Chat SDK](https://chat-sdk.dev/)
  * [Flags SDK](https://flags-sdk.dev/)
  * [Workflow SDK](https://workflow-sdk.dev/)


Other
  * [Turborepo](https://turborepo.dev/)
  * [shadcn/ui](https://ui.shadcn.com/)
  * [SWR](https://swr.vercel.app/)
  * [just-bash](https://justbash.dev/)
  * [deepsec](https://deepsec.sh/)


Select a display theme: systemlightdark
Using App RouterFeatures available in /appLatestv16.4.6
  * [Getting Started](https://nextjs.org/docs/app/getting-started)
    * [Installation](https://nextjs.org/docs/app/getting-started/installation)
    * [Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
    * [Layouts and Pages](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
    * [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
    * [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
    * [Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
    * [Mutating Data](https://nextjs.org/docs/app/getting-started/mutating-data)
    * [Caching](https://nextjs.org/docs/app/getting-started/caching)
    * [Revalidating](https://nextjs.org/docs/app/getting-started/revalidating)
    * [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
    * [CSS](https://nextjs.org/docs/app/getting-started/css)
    * [Image Optimization](https://nextjs.org/docs/app/getting-started/images)
    * [Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
    * [Metadata and OG images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
    * [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
    * [Proxy](https://nextjs.org/docs/app/getting-started/proxy)
    * [Deploying](https://nextjs.org/docs/app/getting-started/deploying)
    * [Upgrading](https://nextjs.org/docs/app/getting-started/upgrading)
  * [Guides](https://nextjs.org/docs/app/guides)
  * [API Reference](https://nextjs.org/docs/app/api-reference)
  * [Glossary](https://nextjs.org/docs/app/glossary)
  * [Architecture](https://nextjs.org/docs/architecture)
    * [Accessibility](https://nextjs.org/docs/architecture/accessibility)
    * [Fast Refresh](https://nextjs.org/docs/architecture/fast-refresh)
    * [Next.js Compiler](https://nextjs.org/docs/architecture/nextjs-compiler)
    * [Supported Browsers](https://nextjs.org/docs/architecture/supported-browsers)
  * [Community](https://nextjs.org/docs/community)
    * [Contribution Guide](https://nextjs.org/docs/community/contribution-guide)
    * [Rspack](https://nextjs.org/docs/community/rspack)


[App Router](https://nextjs.org/docs/app)[Guides](https://nextjs.org/docs/app/guides)
Menu
# Incremental Static Regeneration with Cache Components
Copy for LLMView MarkdownAsk AI about this page
[Incremental Static Regeneration (ISR)](https://nextjs.org/docs/app/glossary#incremental-static-regeneration-isr) with [`cacheComponents`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) and [Partial Prefetching](https://nextjs.org/docs/app/api-reference/config/next-config-js/partialPrefetching) gives every route an instant first visit, even for URLs that weren't included in the build.
During build, Partial Prerendering splits each render into two parts:
  * The **App Shell** : the generic, reusable part of the page that doesn't depend on URL data
  * The rest of the statically renderable content: the param-specific prerenders for the URLs you list in [`generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)


For a visit to a URL whose params were included in `generateStaticParams`, Next.js serves the fully prerendered page from the cache. For a visit to a URL whose params weren't, Next.js serves the App Shell instantly, then upgrades it in the background with the now-known params. Subsequent visits to that URL get the upgraded result from the cache, skipping the App Shell entirely.
If you have used [ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration) or [`fallback: true`](https://nextjs.org/docs/pages/api-reference/functions/get-static-paths#fallback-true) in the Pages Router, this is the Cache Components equivalent.
Enable both [`cacheComponents`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) and [Partial Prefetching](https://nextjs.org/docs/app/api-reference/config/next-config-js/partialPrefetching).
Cache Components prerenders a static shell that can include fallback UI. For paths not returned by `generateStaticParams`, Next.js can render the path on demand and store the completed result in the ISR cache.
Partial Prefetching determines whether the fallback is served before the URL-specific render completes:
  * **With Partial Prefetching:** You can await `params` inside `<Suspense>`. Next.js can immediately serve the fallback for an unlisted path, render the URL-specific content, and store the completed result in the ISR cache.
  * **Without Partial Prefetching:** The first request for an unlisted path must wait for the URL-specific render to complete. Await `params` outside any `<Suspense>` boundary, including one created by [`loading.tsx`](https://nextjs.org/docs/app/api-reference/file-conventions/loading), so Next.js creates an ISR entry for that URL.


Good to know
Without Partial Prefetching, awaiting `params` inside `<Suspense>` causes Next.js to keep serving the shared fallback instead of creating a URL-specific ISR entry. Data fetched by the route can still be cached independently.
next.config.ts

```
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
}

export default nextConfig
```

## [Example](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#example)
We'll build a product catalog with category layouts and product detail pages using the [Recipe API](https://next-recipe-api.vercel.dev/). You can find the resources used in this example here:
  * [Demo](https://partial-fallbacks.labs.vercel.dev/)
  * [Code](https://github.com/nextjs/partial-fallbacks)


### [Prepare your routes](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#prepare-your-routes)
Use [`generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) to define which param values to prerender. When rendering these routes, the param values are known at build time. The prerender process builds a static shell until it reaches a [Request-time API](https://nextjs.org/docs/app/glossary#request-time-apis) or uncached data. See [Prerendering](https://nextjs.org/docs/app/getting-started/caching#prerendering) for more details.
The category layout prerenders two categories:
app/[category]/layout.tsx

```
import Link from 'next/link'
import { Suspense } from 'react'
import { getCategory, getTopCategories } from '../lib/data'

export async function generateStaticParams() {
  const categories = await getTopCategories()
  return categories.map((c) => ({ category: c.slug }))
}

async function CategoryHeader({
  params,
}: Pick<LayoutProps<'/[category]'>, 'params'>) {
  const { category } = await params
  const data = await getCategory(category)

  return (
    <div>
      <Link href="/">&larr; All categories</Link>
      <h1>{data?.name ?? 'Category'}</h1>
      {data?.description && <p>{data.description}</p>}
    </div>
  )
}

export default function CategoryLayout(props: LayoutProps<'/[category]'>) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <CategoryHeader params={props.params} />
      </Suspense>
      {props.children}
    </div>
  )
}
```

Notice that `CategoryLayout` does not `await props.params` itself. Instead, it passes the `params` promise to `CategoryHeader` inside `<Suspense>`. The `await` happens inside the boundary, so for unknown categories Next.js can still generate the App Shell. Keep the read inside the boundary even for the categories `generateStaticParams` covers. A statically known param still belongs to one URL, so awaiting it above the Suspense boundary would tie this layout's App Shell to that URL. See [Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation) for structuring routes this way.
The product page prerenders one product per category. `generateStaticParams` receives the parent `category` param:
app/[category]/[product]/page.tsx

```
import { Suspense } from 'react'
import Link from 'next/link'
import { getProduct, getPopularProducts } from '../../lib/data'

export async function generateStaticParams({
  params,
}: {
  params: { category: string }
}) {
  const products = await getPopularProducts(params.category)
  return products.map((p) => ({ product: p.slug }))
}

async function ProductDetails(props: PageProps<'/[category]/[product]'>) {
  const { category, product } = await props.params
  const data = await getProduct(category, product)

  if (!data) {
    return <p>Product not found.</p>
  }

  return (
    <>
      <Link href={`/${category}`} prefetch={true}>
        &larr; Back to products
      </Link>
      <h2>{data.name}</h2>
      <p>${data.price}</p>
      <p>{data.description}</p>
    </>
  )
}

export default function ProductPage(props: PageProps<'/[category]/[product]'>) {
  return (
    <div>
      <Suspense fallback={<div>Loading product...</div>}>
        <ProductDetails {...props} />
      </Suspense>
    </div>
  )
}
```

Good to know
You can also use [`loading.tsx`](https://nextjs.org/docs/app/api-reference/file-conventions/loading) files instead of `<Suspense>` in JSX. `loading.tsx` puts the boundary at the segment edge, while inline `<Suspense>` lets you place it anywhere in the tree.
The data helpers use `'use cache'` at the module level so all exported functions are cached. This lets their results be included in the static shell:
app/lib/data.ts

```
'use cache'

const API = 'https://next-recipe-api.vercel.dev'

export async function getCategory(slug: string) {
  const res = await fetch(`${API}/categories/${slug}`)
  if (!res.ok) return null
  return res.json()
}

export async function getProduct(category: string, slug: string) {
  const res = await fetch(`${API}/products/${category}/${slug}`)
  if (!res.ok) return null
  return res.json()
}

export async function getTopCategories() {
  const res = await fetch(`${API}/categories`)
  const categories = await res.json()
  return categories.slice(0, 2)
}

export async function getPopularProducts(category: string) {
  const res = await fetch(`${API}/products?category=${category}`)
  const products = await res.json()
  return products.slice(0, 1)
}
```

If a component accesses a Request-time API such as `cookies()` or `headers()`, wrap it in `<Suspense>`. During prerendering, Next.js includes the nearest fallback in the static shell. To keep the component out of a `<Link prefetch={true}>` as well, await [`navigation()`](https://nextjs.org/docs/app/api-reference/functions/navigation) before the request-time access. See [Keep the prefetch static](https://nextjs.org/docs/app/guides/optimizing-prefetching#keep-the-prefetch-static).
### [At build time](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#at-build-time)
When you run `next build`, Next.js prerenders the layout for each known category (`tops`, `shorts`), plus one render where `await params` suspends, producing the App Shell for `[category]`.
It also prerenders the page for each known product under each category (`tee` under `tops`, `joggers` under `shorts`), plus one render where `await params` suspends, producing the App Shell for `[product]`.
These are combined into:
  * `/tops/tee`, `/shorts/joggers`: fully static pages, both params known
  * `/tops/[product]`, `/shorts/[product]`: category header rendered, product shows fallback
  * `/[category]/[product]`: both show fallback


A shell's unknown params always come last, in route order. A URL can't have an unknown segment in the middle, so there is no `/[category]/tee` shell. A visit with an unlisted category gets `/[category]/[product]`, whatever the product.
### [At runtime](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#at-runtime)
A visitor navigates to `/tops/tee`. Both params were prerendered. They get a fully static page.
The first visit to `/tops/overshirt`. The product `overshirt` is unknown, but the category `tops` was prerendered. Next.js serves the App Shell for `/tops/[product]` with the category header already rendered. The product streams in.
The first visit to `/shoes/basketball-shoes`. Neither param was prerendered. Next.js serves the generic App Shell for `/[category]/[product]`. Both the category and the product stream in.
After the first visit, Next.js renders these routes in the background with the now-known params. The next visitor to the same URLs gets the upgraded result.
When a [`<Link prefetch={true}>`](https://nextjs.org/docs/app/api-reference/components/link#prefetch) to an unlisted URL enters the viewport, Next.js starts the background upgrade before the click, just as a first visit would, so navigation lands on the upgraded result.
Links to these pages need `prefetch={true}`. A default `<Link>` prefetches only the App Shell, which links to the same route share.
Good to know
The App Shell for unlisted params is served from Next.js 16.3. Earlier versions wait for a full server render before sending the response.
### [Wait for complete static output](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#wait-for-complete-static-output)
For an unlisted parameter, [`ensureStatic = 'navigation'`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/ensureStatic#navigation) makes the first request wait for the complete static page. Without this requirement, Next.js can return a prerendered fallback while it generates the page in the background. Next.js stores the completed page for later requests.
### [What the upgrade produces](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#what-the-upgrade-produces)
After the first visit, Next.js renders the page in the background with the known params and tries to push the static boundary as far down the component tree as possible:
  * If every data access is cached and all params are resolved, the upgrade produces a **fully static page**.
  * If all params are resolved but the render still reaches uncached data or Request-time APIs (`cookies()`, `headers()`) wrapped in `<Suspense>` boundaries, the upgrade produces a **cached page with those fallbacks**. The uncached or request-specific parts stream in at request time.


## [Choosing what to prerender](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#choosing-what-to-prerender)
Not every route needs to be prerendered. Every page you prerender increases build work and produces output that has to be stored and deployed. Many routes may never be visited before your next deployment, making that work unnecessary.
Instead, use [`generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) to prerender the routes that benefit most from being ready ahead of time, such as popular pages or predictable content. Less frequently visited routes are generated on demand and upgraded after their first visit, so you don't spend build time and storage on pages that may never be requested.
## [Coming from the Pages Router](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#coming-from-the-pages-router)
If you are migrating from the Pages Router:
  * `fallback: true` in `getStaticPaths` maps to Cache Components with Partial Prefetching. Visitors get a `<Suspense>` fallback instantly, and Next.js stores the completed route for subsequent visits.
  * [`fallback: 'blocking'`](https://nextjs.org/docs/pages/api-reference/functions/get-static-paths#fallback-blocking) maps to Cache Components without Partial Prefetching. Await `params` outside `<Suspense>` so the first request waits for the completed route, which Next.js then stores for subsequent visits.
  * `router.isFallback` is not needed. The prerendering step generates a static shell, and you can grow it further with `'use cache'`.
  * `getStaticProps` with `revalidate` maps to `'use cache'` with [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife).
  * `getStaticPaths` maps to [`generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params).


## [Next steps](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#next-steps)
  * [Caching with Cache Components](https://nextjs.org/docs/app/getting-started/caching) for the full caching model
  * [`generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) for controlling which param combinations are prerendered
  * [`loading.tsx`](https://nextjs.org/docs/app/api-reference/file-conventions/loading) for providing skeleton UI in App Shells
  * [Streaming](https://nextjs.org/docs/app/guides/streaming) to learn how to progressively render UI as data becomes available
  * [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting#caching-and-isr) to keep an existing ISR [`cacheHandler`](https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath) alongside [`cacheHandlers`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers) for `'use cache'`


### [cacheComponents Learn how to enable the cacheComponents flag in Next.js.](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)### [generateStaticParams API reference for the generateStaticParams function.](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)### [loading.js API reference for the loading.js file.](https://nextjs.org/docs/app/api-reference/file-conventions/loading)### [Caching Learn how to cache data and UI in Next.js](https://nextjs.org/docs/app/getting-started/caching)
Last updated November 18, 2026
[PreviousHow Revalidation Works](https://nextjs.org/docs/app/guides/how-revalidation-works)[NextISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
On this page
[Example](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#example)[Prepare your routes](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#prepare-your-routes)[At build time](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#at-build-time)[At runtime](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#at-runtime)[Wait for complete static output](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#wait-for-complete-static-output)[What the upgrade produces](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#what-the-upgrade-produces)[Choosing what to prerender](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#choosing-what-to-prerender)[Coming from the Pages Router](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#coming-from-the-pages-router)[Next steps](https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components#next-steps)
Give feedback[Edit this page on GitHub](https://github.com/vercel/next.js/edit/canary/docs/01-app/02-guides/incremental-static-regeneration-cache-components.mdx)
## Get started
[Docs](https://nextjs.org/docs)[Support Policy](https://nextjs.org/support-policy)[Learn](https://nextjs.org/learn)[Showcase](https://nextjs.org/showcase)[Blog](https://nextjs.org/blog)[Team](https://nextjs.org/team)[Analytics](https://vercel.com/analytics?utm_source=next-site&utm_medium=footer&utm_campaign=docs_app_guides_incremental-static-regeneration-cache-components)[Next.js Conf](https://nextjs.org/conf)[Previews](https://vercel.com/products/previews?utm_source=next-site&utm_medium=footer&utm_campaign=docs_app_guides_incremental-static-regeneration-cache-components)[Evals](https://nextjs.org/evals)
## More
[Next.js Commerce](https://vercel.com/templates/next.js/nextjs-commerce?utm_source=next-site&utm_medium=footer&utm_campaign=docs_app_guides_incremental-static-regeneration-cache-components)[Contact Sales](https://vercel.com/contact/sales?utm_source=next-site&utm_medium=footer&utm_campaign=docs_app_guides_incremental-static-regeneration-cache-components)[Community](https://community.vercel.com)[GitHub](https://github.com/vercel/next.js)[Releases](https://github.com/vercel/next.js/releases)[Telemetry](https://nextjs.org/telemetry)[Governance](https://nextjs.org/governance)[Ecosystem Working Group](https://nextjs.org/ecosystem-working-group)
## About Vercel
[About Vercel](https://vercel.com/about?utm_source=next-site&utm_medium=footer&utm_campaign=docs_app_guides_incremental-static-regeneration-cache-components)[Next.js + Vercel](https://vercel.com/solutions/nextjs?utm_source=next-site&utm_medium=footer&utm_campaign=docs_app_guides_incremental-static-regeneration-cache-components)[Open Source Software](https://vercel.com/oss?utm_source=next-site&utm_medium=footer&utm_campaign=docs_app_guides_incremental-static-regeneration-cache-components)[GitHub](https://github.com/vercel)[Bluesky](https://bsky.app/profile/vercel.com)[X](https://x.com/vercel)
## Legal
[Privacy Policy](https://vercel.com/legal/privacy-policy)Cookie Preferences
Subscribe to our newsletter
Subscribe
Stay updated on new releases and features, guides, and case studies.
Select a display theme: systemlightdark
