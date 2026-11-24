[Skip to content](https://developers.cloudflare.com/kv/platform/limits/#main-content)
> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/kv/llms.txt  
> Use this file to discover all available pages before exploring further.
[![](https://developers.cloudflare.com/_astro/logo.te5VL_aD.svg)Docs](https://developers.cloudflare.com/)[Directory](https://developers.cloudflare.com/directory/)[API](https://developers.cloudflare.com/api/)[SDKs](https://developers.cloudflare.com/fundamentals/api/reference/sdks/)[Changelog](https://developers.cloudflare.com/changelog/)
Search`⌘``K`[](https://github.com/cloudflare/cloudflare-docs)[Log inDashboard](https://dash.cloudflare.com/)
  1. [Home](https://developers.cloudflare.com/)
  2. /[KV](https://developers.cloudflare.com/kv/)
  3. /Platform
  4. /Limits


# Limits
Last updated Oct 30, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/kv/platform/limits/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)
Overview Workers KV Workers KV Instant Additional limits
## Workers KV
[](https://developers.cloudflare.com/kv/platform/limits/#workers-kv)  
| Feature  | Free  | Paid  |  
| --- | --- | --- |  
| Reads  | 100,000 reads per day  | Unlimited  |  
| Writes to different keys  | 1,000 writes per day  | Unlimited  |  
| Writes to same key  | 1 per second  | 1 per second  |  
| Operations/Worker invocation 1  | 1000  | 1000  |  
| Namespaces per account  | 1,000  | Unlimited, with a default limit of 1,000. Each namespace above 1,000 costs [$0.10 per month](https://developers.cloudflare.com/kv/platform/pricing/).  |  
| Storage/account  | 1 GB  | Unlimited  |  
| Storage/namespace  | 1 GB  | Unlimited  |  
| Keys/namespace  | Unlimited  | Unlimited  |  
| Key size  | 512 bytes  | 512 bytes  |  
| Key metadata  | 1024 bytes  | 1024 bytes  |  
| Value size  | 25 MiB  | 25 MiB  |  
| Minimum [`cacheTtl`](https://developers.cloudflare.com/kv/api/read-key-value-pairs/#cachettl-parameter) 2  | 30 seconds  | 30 seconds  |  
## Workers KV Instant
[](https://developers.cloudflare.com/kv/platform/limits/#workers-kv-instant)
Note
Workers KV Instant is currently in private beta. To enroll, contact your Cloudflare account team or [sign up ↗︎](https://www.cloudflare.com/resource/workers-kv-instant-beta/) and tell us about your use case.  
| Feature  | Limit  |  
| --- | --- |  
| Writes/namespace  | 1 per second  |  
| Storage/namespace  | 1 MB  |  
| Keys/namespace  | 10,000  |  
| Key size  | 300 bytes  |  
| Key metadata  | Not supported  |  
| Value size  | Any size that keeps the total namespace within 1 MB  |  
| List pagination  | Not supported. All matching keys are returned in one response.  |  
## Additional limits
[](https://developers.cloudflare.com/kv/platform/limits/#additional-limits)
Need a higher limit?
To request an adjustment to a limit, complete the [Limit Increase Request Form ↗︎](https://forms.gle/eX6pXvit1wBv77Yw5). If the limit can be increased, Cloudflare will contact you with next steps.
Free versus Paid plan pricing
Refer to [KV pricing](https://developers.cloudflare.com/kv/platform/pricing/) to review the specific KV operations you are allowed under each plan with their pricing.
Workers KV REST API limits
Using the REST API to access Cloudflare Workers KV is subject to the [rate limits that apply to all operations of the Cloudflare REST API](https://developers.cloudflare.com/fundamentals/api/reference/limits).
[PreviousPricing](https://developers.cloudflare.com/kv/platform/pricing/)[NextChoose a data or storage product ↗︎](https://developers.cloudflare.com/workers/platform/storage-options/)
Was this helpful?
YesNo
[Edit page](https://github.com/cloudflare/cloudflare-docs/edit/production/src/content/docs/kv/platform/limits.mdx)[Report issue](https://github.com/cloudflare/cloudflare-docs/issues/new/choose)
## On this page
  * [Overview](https://developers.cloudflare.com/kv/platform/limits/#_top)
  * [Workers KV](https://developers.cloudflare.com/kv/platform/limits/#workers-kv)
  * [Workers KV Instant](https://developers.cloudflare.com/kv/platform/limits/#workers-kv-instant)
  * [Additional limits](https://developers.cloudflare.com/kv/platform/limits/#additional-limits)


Was this helpful?
YesNo
[Edit page](https://github.com/cloudflare/cloudflare-docs/edit/production/src/content/docs/kv/platform/limits.mdx)[Report issue](https://github.com/cloudflare/cloudflare-docs/issues/new/choose)
[](https://developers.cloudflare.com/)[KV](https://developers.cloudflare.com/kv/)
`/`
  * [Overview](https://developers.cloudflare.com/kv/)
  * [Getting started](https://developers.cloudflare.com/kv/get-started/)
  * Key concepts
    * [How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
    * [KV bindings](https://developers.cloudflare.com/kv/concepts/kv-bindings/)
    * [KV namespaces](https://developers.cloudflare.com/kv/concepts/kv-namespaces/)
  * Workers Binding API
    * [Read key-value pairs](https://developers.cloudflare.com/kv/api/read-key-value-pairs/)
    * [Write key-value pairs](https://developers.cloudflare.com/kv/api/write-key-value-pairs/)
    * [Delete key-value pairs](https://developers.cloudflare.com/kv/api/delete-key-value-pairs/)
    * [List keys](https://developers.cloudflare.com/kv/api/list-keys/)
  * Examples
    * [Store and retrieve static assets](https://developers.cloudflare.com/kv/examples/workers-kv-to-serve-assets/)
    * [Build a distributed configuration store](https://developers.cloudflare.com/kv/examples/distributed-configuration-with-workers-kv/)
    * [Cache data with Workers KV](https://developers.cloudflare.com/kv/examples/cache-data-with-workers-kv/)
    * [Route requests across various web servers](https://developers.cloudflare.com/kv/examples/routing-with-workers-kv/)
    * [A/B testing with Workers KV ↗︎](https://developers.cloudflare.com/reference-architecture/diagrams/serverless/a-b-testing-using-workers/)
  * [Tutorials](https://developers.cloudflare.com/kv/tutorials/)
  * [Demos and architectures](https://developers.cloudflare.com/kv/demos/)
  * Observability
    * [Metrics and analytics](https://developers.cloudflare.com/kv/observability/metrics-analytics/)
  * Platform
    * [Pricing](https://developers.cloudflare.com/kv/platform/pricing/)
    * [Limits](https://developers.cloudflare.com/kv/platform/limits/)
    * [Choose a data or storage product ↗︎](https://developers.cloudflare.com/workers/platform/storage-options/)
    * [Release notes](https://developers.cloudflare.com/kv/platform/release-notes/)
    * [Event subscriptions](https://developers.cloudflare.com/kv/platform/event-subscriptions/)
  * Reference
    * [Wrangler KV commands](https://developers.cloudflare.com/kv/reference/kv-commands/)
    * [Environments](https://developers.cloudflare.com/kv/reference/environments/)
    * [Data location](https://developers.cloudflare.com/kv/reference/data-location/)
    * [Data security](https://developers.cloudflare.com/kv/reference/data-security/)
    * [FAQ](https://developers.cloudflare.com/kv/reference/faq/)
  * [Glossary](https://developers.cloudflare.com/kv/glossary/)
  * [KV REST API ↗︎API](https://developers.cloudflare.com/api/resources/kv/)
  * Agent resources
    * [Agent setup ↗︎](https://developers.cloudflare.com/agent-setup/)
    * [Cloudflare Skills ↗︎](https://github.com/cloudflare/skills)
    * [Code Mode MCP Server ↗︎](https://github.com/cloudflare/mcp)
    * [Domain-specific MCP Servers ↗︎MCP](https://github.com/cloudflare/mcp-server-cloudflare)
    * [KV llms.txt ↗︎](https://developers.cloudflare.com/kv/llms.txt)
    * [KV llms-full.txt ↗︎](https://developers.cloudflare.com/kv/llms-full.txt)
    * [Cloudflare Docs llms.txt ↗︎](https://developers.cloudflare.com/llms.txt)
    * [Cloudflare Docs llms-full.txt ↗︎](https://developers.cloudflare.com/llms-full.txt)


Getting started
[Plans](https://www.cloudflare.com/plans/)[Contact sales](https://www.cloudflare.com/resource/contact-enterprise-sales/)[Partners](https://www.cloudflare.com/partners/)[Find a partner](https://partnerlocator.cloudflare.com/dashboard)[Startups](https://www.cloudflare.com/startups/)[Under attack?](https://www.cloudflare.com/under-attack-hotline/)[Domain name search](https://domains.cloudflare.com/)
Company
[About](https://www.cloudflare.com/about/)[Careers](https://www.cloudflare.com/careers/)[Investors](https://cloudflare.net/)[Press](https://www.cloudflare.com/press/)[Press kit](https://www.cloudflare.com/press/press-kit/)[Global network](https://www.cloudflare.com/network/)
Public interest
[Project Galileo](https://www.cloudflare.com/galileo/)[Athenian Project](https://www.cloudflare.com/athenian/)[Cloudflare for Campaigns](https://www.cloudflare.com/campaigns/)[Project Fairshot](https://www.cloudflare.com/fair-shot/)[Impact/ESG](https://www.cloudflare.com/impact/)
Compliance
[Compliance resources](https://www.cloudflare.com/trust-hub/compliance-resources/)[Trust Hub](https://www.cloudflare.com/trust-hub/)[Data Protection](https://www.cloudflare.com/trust-hub/gdpr/)[Responsible AI](https://www.cloudflare.com/trust-hub/responsible-ai/)[Transparency report](https://www.cloudflare.com/transparency/)[Report abuse](https://www.cloudflare.com/trust-hub/abuse-approach/)
Resources
[App innovation report](https://www.cloudflare.com/resource/app-innovation-report/)[Cloudflare Radar](https://radar.cloudflare.com/)[Case studies](https://www.cloudflare.com/case-studies/)[Status](https://www.cloudflarestatus.com/)[Support](https://support.cloudflare.com/)[Events](https://www.cloudflare.com/events/)[Blog](https://blog.cloudflare.com/)
Developers
[Documentation](https://developers.cloudflare.com/)[Learning center](https://www.cloudflare.com/learning/)[Community](https://community.cloudflare.com/)
Solutions
[SSE and SASE platform](https://www.cloudflare.com/sase/)[Cloudflare AI Cloud](https://www.cloudflare.com/solutions/ai/)[AI Security](https://www.cloudflare.com/solutions/ai-security/)[Frontend Development Platform](https://www.cloudflare.com/solutions/frontends/)[Multi-Tenant Platform Development](https://www.cloudflare.com/solutions/platforms/)[Web Security Platform](https://www.cloudflare.com/solutions/security/)
[Start Building](https://dash.cloudflare.com/sign-up)[Log In](https://dash.cloudflare.com/login)
© 2026 Cloudflare, Inc.
[Privacy policy](https://www.cloudflare.com/policies/privacy/)| [Report security issues](https://www.cloudflare.com/disclosure/)| [Terms of use](https://www.cloudflare.com/policies/terms/)| [Trademark](https://www.cloudflare.com/trademark/)
|
![privacy options](https://developers.cloudflare.com/cdn-cgi/image/onerror=redirect,width=26,height=12,format=svg/_astro/privacyoptions.BWXSiJOZ.svg)Your privacy choices
[![](https://developers.cloudflare.com/_astro/logo.te5VL_aD.svg)Docs](https://developers.cloudflare.com/)
