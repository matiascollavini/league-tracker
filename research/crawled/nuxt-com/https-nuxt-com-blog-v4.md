[](https://nuxt.com/)[v4.7.0](https://github.com/nuxt/nuxt/releases/tag/v4.7.0)
  * [Docs](https://nuxt.com/docs/4.x)
  * [Modules](https://nuxt.com/modules)
  * [Templates](https://nuxt.com/templates)
  * [Showcase](https://nuxt.com/showcase)
  * [Nuxters](https://nuxt.com/nuxters)
  * [Updates](https://nuxt.com/updates)
  * More


Ask Nuxi
Search…`⌘Ctrl``k`
[61.1K](https://go.nuxt.com/github)
[Releases](https://nuxt.com/updates?category=release)·Jul 15, 2025·5 min read
# Announcing Nuxt 4.0
Nuxt 4.0 is here! A thoughtful evolution focused on developer experience, with better project organization, smarter data fetching, and improved type safety.
![Daniel Roe avatar](https://ipx.nuxt.com/s_28x28/gh_avatar/danielroe)
[Daniel Roe](https://nuxt.com/nuxters/danielroe)
Copy page
On This Page
On This Page
  * [🔥 What's new?](https://nuxt.com/blog/v4#whats-new)
    * [🗂️ New project structure](https://nuxt.com/blog/v4#new-project-structure)
      * [🎨 Updated UI templates](https://nuxt.com/blog/v4#updated-ui-templates)
    * [🔄 Smarter data fetching](https://nuxt.com/blog/v4#smarter-data-fetching)
    * [🔧 Better TypeScript experience](https://nuxt.com/blog/v4#better-typescript-experience)
    * [⚡ Faster CLI and development](https://nuxt.com/blog/v4#faster-cli-and-development)
  * [🚀 How to upgrade](https://nuxt.com/blog/v4#how-to-upgrade)
    * [1. Update Nuxt](https://nuxt.com/blog/v4#_1-update-nuxt)
    * [2. Optional: use migration tools](https://nuxt.com/blog/v4#_2-optional-use-migration-tools)
    * [3. Test and adjust](https://nuxt.com/blog/v4#_3-test-and-adjust)
  * [🗺️ What's next?](https://nuxt.com/blog/v4#whats-next)
  * [❤️ Thank you](https://nuxt.com/blog/v4#thank-you)
  * [📑 Full release notes](https://nuxt.com/blog/v4#full-release-notes)


5 min left, back to top
**Nuxt 4.0 is here!** 🎉
After a year of real-world testing, we're excited to announce the official release of Nuxt 4. This is a stability-focused major release, introducing a few thoughtful breaking changes in order to improve development experience.
If you've been following along, you'll recognize many of these features and changes — and if you're new to them, we hope you'll welcome them.
## [🔥 What's new?](https://nuxt.com/blog/v4#whats-new)
Nuxt 4 is all about making your development experience smoother:
  * **Cleaner project organization** with the new `app/` directory structure
  * **Smarter data fetching** - we've taken the opportunity to address some inconsistencies and improve performance with the data layer
  * **Better TypeScript support** with project-based separation between the different contexts in your project - app code, server code, `shared/` folder, and configuration
  * **Faster CLI and development** with adoption of internal sockets and a faster CLI


Why these features in particular? Mostly because these kind of improvements have required making changes that are technically breaking.
In general, we aim for a hype-free approach to releases. Rather than save up features for a big release, we've been shipping improvements in Nuxt 3 minor releases.
We've also spent a lot of time figuring out how to implement these changes in a backwards-compatible way, and I hope that means that most Nuxt 3 projects can upgrade with a minimum of effort.
I'd advise reading through the [upgrade guide](https://nuxt.com/docs/4.x/getting-started/upgrade) before you start, to understand what areas of your app might be affected.
### [🗂️ New project structure](https://nuxt.com/blog/v4#new-project-structure)
The biggest visible change is how projects are organized. Your application code now lives in an `app/` directory by default:

```
my-nuxt-app/
├─ app/
│  ├─ assets/
│  ├─ components/
│  ├─ composables/
│  ├─ layouts/
│  ├─ middleware/
│  ├─ pages/
│  ├─ plugins/
│  ├─ utils/
│  ├─ app.vue
│  ├─ app.config.ts
│  └─ error.vue
├─ content/
├─ public/
├─ shared/
├─ server/
└─ nuxt.config.ts
```

This helps keep your code separate from `node_modules/` and `.git/`, which makes file watchers faster (especially on Windows and Linux). It also gives your IDE better context about whether you're working with client or server code.
**Don't want to migrate?** That's totally fine! Nuxt will detect your existing structure and keep working exactly as before.
#### [🎨 Updated UI templates](https://nuxt.com/blog/v4#updated-ui-templates)
Nuxt’s starter templates have an all new look, with improved accessibility, default titles, and template polish ([#27843](https://github.com/nuxt/nuxt/pull/27843)).
### [🔄 Smarter data fetching](https://nuxt.com/blog/v4#smarter-data-fetching)
We've made `useAsyncData` and `useFetch` work better. Multiple components using the same key now share their data automatically. There's also automatic cleanup when components unmount, and you can use reactive keys to refetch data when needed. Plus, we've given you more control over when cached data gets used.
Some of these features have already been made available in Nuxt v3 minor releases, because we've been rolling this out gradually. Nuxt v4 brings different defaults, and we expect to continue to work on this data layer in the days to come.
### [🔧 Better TypeScript experience](https://nuxt.com/blog/v4#better-typescript-experience)
Nuxt now creates separate TypeScript projects for your app code, server code, `shared/` folder, and builder code. This should mean better autocompletion, more accurate type inference and fewer confusing errors when you're working in different contexts.
With Nuxt 4, you will only need one `tsconfig.json` file in your project root!
This is probably the single issue that is most likely to cause surprises when upgrading, but it should also make your TypeScript experience much smoother in the long run. Please report any issues you encounter. 🙏
### [⚡ Faster CLI and development](https://nuxt.com/blog/v4#faster-cli-and-development)
In parallel with the release of v4, we've been working on speeding up `@nuxt/cli`.
  * **Faster cold starts** - Development server startup is noticeably faster
  * **Node.js compile cache** - Automatic reuse of the v8 compile cache
  * **Native file watching** - Uses `fs.watch` APIs for fewer system resources
  * **Socket-based communication** - The CLI and Vite dev server now communicate via internal sockets instead of network ports, reducing overhead — particularly on Windows


These improvements combined can make a really noticeable difference in your day-to-day development experience, and we have more planned.
## [🚀 How to upgrade](https://nuxt.com/blog/v4#how-to-upgrade)
Although any major release brings breaking changes, one of our main aims for this release is to ensure that the upgrade path is as smooth as possible. Most of the breaking changes have been testable with a compatibility flag for over a year.
Most projects should upgrade smoothly, but there are a few things to be aware of:
  * Nuxt 2 compatibility has been removed from `@nuxt/kit`. (This will particularly affect module authors.)
  * Some legacy utilities and deprecated features have been cleaned up.
  * The new TypeScript setup might surface some type issues that were hidden before.
  * A few modules might need further updates for full Nuxt 4 compatibility.


Don't worry though — for most breaking changes, there are configuration options to revert to the old behavior while you adjust.
### [1. Update Nuxt](https://nuxt.com/blog/v4#_1-update-nuxt)
Our recommendation for upgrading is to run:

```
npx nuxt upgrade --dedupe
```

This will deduplicate your lockfile as well, and help ensure that you pull in updates from other dependencies that Nuxt relies on, particularly in the unjs ecosystem.
### [2. Optional: use migration tools](https://nuxt.com/blog/v4#_2-optional-use-migration-tools)
We’ve also partnered with [Codemod](https://github.com/codemod-com/codemod) to automate many, though not all, migration steps:
npmyarnpnpmbun

```
npx codemod@latest nuxt/4/migration-recipe
```


```
yarn dlx codemod@latest nuxt/4/migration-recipe
```


```
pnpm dlx codemod@latest nuxt/4/migration-recipe
```


```
bun x codemod@latest nuxt/4/migration-recipe
```

### [3. Test and adjust](https://nuxt.com/blog/v4#_3-test-and-adjust)
Run your tests, check that everything builds correctly, and fix any issues that come up. The [upgrade guide](https://nuxt.com/docs/4.x/getting-started/upgrade) has detailed migration steps for specific scenarios.
We'd recommend reading through it in full before starting your upgrade, to understand what areas of your app might be affected.
## [🗺️ What's next?](https://nuxt.com/blog/v4#whats-next)
We're planning quick patch releases to address any issues that come up. Nuxt 3 will continue to receive maintenance updates (both bug fixes and backports of features from Nuxt 4) until the end of January 2026, so there's no rush if you need time to migrate.
Looking ahead, we plan to release Nuxt 5 on the sooner side, which will bring Nitro v3 and h3 v2 for even better performance, as well as adopting the Vite Environment API for an improved (and faster!) development experience. And there's a lot more in the works too!
And, quite apart from major releases, we have a lot of exciting features planned to make their way into Nuxt 3.x and 4.x release branches, including support for SSR streaming ([#4753](https://github.com/nuxt/nuxt/issues/4753)), a first-party accessibility module ([#23255](https://github.com/nuxt/nuxt/issues/23255)), built-in fetch caching strategies ([#26017](https://github.com/nuxt/nuxt/issues/26017)), more strongly typed fetch calls (landing in Nitro v3), dynamic route discovery ([#32196](https://github.com/nuxt/nuxt/issues/32196)), multi-app support ([#21635](https://github.com/nuxt/nuxt/issues/21635)) and more.
## [❤️ Thank you](https://nuxt.com/blog/v4#thank-you)
This release is credit to so many people, particularly those who have been testing v4 compatibility mode over the past year. I'm really grateful — thank you for all your help!
Happy coding with Nuxt 4! 🚀
## [📑 Full release notes](https://nuxt.com/blog/v4#full-release-notes)
[](https://github.com/nuxt/nuxt/releases/tag/v4.0.0)Read the full release notes of Nuxt `v4.0.0`.
A huge thank you to everyone who's been a part of this release. ❤️
[Edit This Post](https://github.com/nuxt/nuxt.com/edit/main/content/blog/36.v4.md)
##  Release History 
[ Nuxt 3.18 Nuxt 3.18 is out - bringing v4 features to v3, improved accessibility, better browser dev tooling integration, and performance enhancements! ](https://nuxt.com/blog/v3-18)[ Nuxt 3.17 Nuxt 3.17 is out - bringing a major reworking of the async data layer, a new built-in component, better warnings, and performance improvements! ](https://nuxt.com/blog/v3-17)
###  Community
  * [Nuxters](https://nuxt.com/nuxters)
  * [Team](https://nuxt.com/team)
  * [Design Kit](https://nuxt.com/design-kit)


###  Explore
  * [Templates](https://nuxt.com/templates)
  * [Showcase](https://nuxt.com/showcase)
  * [AI Evals](https://nuxt.com/evals)


###  Enterprise
  * [Agencies](https://nuxt.com/enterprise/agencies)
  * [Sponsors](https://nuxt.com/sponsors)


Subscribe to our newsletter
Stay updated on new releases and features, guides, and community updates.
Subscribe
[Nuxt on X](https://go.nuxt.com/x)[Nuxt on BlueSky](https://go.nuxt.com/bluesky)[Nuxt on LinkedIn](https://go.nuxt.com/linkedin)[Nuxt on Discord](https://go.nuxt.com/discord)[Nuxt on GitHub](https://go.nuxt.com/github)
Copyright © 2016-2026 Nuxt - [ MIT License ](https://go.nuxt.com/license)
`⌘Ctrl``I`
