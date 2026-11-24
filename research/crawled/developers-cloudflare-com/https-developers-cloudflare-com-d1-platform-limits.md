[Skip to content](https://developers.cloudflare.com/d1/platform/limits/#main-content)
> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/d1/llms.txt  
> Use this file to discover all available pages before exploring further.
[![](https://developers.cloudflare.com/_astro/logo.te5VL_aD.svg)Docs](https://developers.cloudflare.com/)[Directory](https://developers.cloudflare.com/directory/)[API](https://developers.cloudflare.com/api/)[SDKs](https://developers.cloudflare.com/fundamentals/api/reference/sdks/)[Changelog](https://developers.cloudflare.com/changelog/)
Search`Ctrl``K`[](https://github.com/cloudflare/cloudflare-docs)[Log inDashboard](https://dash.cloudflare.com/)
  1. [Home](https://developers.cloudflare.com/)
  2. /[D1](https://developers.cloudflare.com/d1/)
  3. /Platform
  4. /Limits


# Limits
Last updated Nov 20, 2026|Copy as Markdown|[View as Markdown](https://developers.cloudflare.com/d1/platform/limits/index.md)|[Agent setup](https://developers.cloudflare.com/agent-setup/)
Overview Frequently Asked Questions How much work can a D1 database do? How many simultaneous connections can a Worker open to D1?  
| Feature  | Limit  |  
| --- | --- |  
| Databases per account  | Workers Paid: 1,000,000. The first 100,000 databases are included. Each database above 100,000 costs [$0.10 per month](https://developers.cloudflare.com/d1/platform/pricing/#billing-metrics). Free: 10.  |  
| Maximum database size  | 10 GB (Workers Paid) / 500 MB (Free)  |  
| Maximum storage per account  | 1 TB (Workers Paid) 1 / 5 GB (Free)  |  
|  [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) duration (point-in-time recovery)  | 30 days (Workers Paid) / 7 days (Free)  |  
| Maximum Time Travel restore operations  | 10 restores per 10 minutes (per database)  |  
| Queries per Worker invocation (read [subrequest limits](https://developers.cloudflare.com/workers/platform/limits/#subrequests))  | 1000 (Workers Paid) / 50 (Free)  |  
| Maximum number of columns per table  | 100  |  
| Maximum number of columns in a query result  | 100  |  
| Maximum number of rows per table  | Unlimited (excluding per-database storage limits)  |  
| Maximum string, `BLOB` or table row size  | 2,000,000 bytes (2 MB)  |  
| Maximum SQL statement length  | 100,000 bytes (100 KB)  |  
| Maximum bound parameters per query  | 100  |  
| Maximum `SELECT` terms in a compound statement (`UNION`, `UNION ALL`, `INTERSECT`, or `EXCEPT`)  | 5  |  
| Maximum arguments per SQL function  | 32  |  
| Maximum characters (bytes) in a `LIKE` or `GLOB` pattern  | 50 bytes  |  
| Maximum bindings per Workers script  | Approximately 5,000 2  |  
| Maximum SQL query duration  | 30 seconds 3  |  
| Maximum file import (`d1 execute`) size  | 5 GB 4  |  
| Maximum query result size  | 50 MB 5  |  
Batch limits
Limits for individual queries (listed above) apply to each individual statement contained within a batch statement. For example, the maximum SQL statement length of 100 KB applies to each statement inside a `db.batch()`.
The Queries per Worker invocation limit is an exception: a `db.batch()` call counts as a single query against it, not one query per statement. For example, a batch containing 2,000 statements executes in a single Worker invocation, while issuing 2,000 individual queries in one invocation fails with `Too many API requests by single Worker invocation`.
Cloudflare also offers other storage solutions such as [Workers KV](https://developers.cloudflare.com/kv/api/), [Durable Objects](https://developers.cloudflare.com/durable-objects/), and [R2](https://developers.cloudflare.com/r2/get-started/). Each product has different advantages and limits. Refer to [Choose a data or storage product](https://developers.cloudflare.com/workers/platform/storage-options/) to review which storage option is right for your use case.
Need a higher limit?
To request an adjustment to a limit, complete the [Limit Increase Request Form ↗︎](https://forms.gle/eX6pXvit1wBv77Yw5). If the limit can be increased, Cloudflare will contact you with next steps.
## Frequently Asked Questions
[](https://developers.cloudflare.com/d1/platform/limits/#frequently-asked-questions)
Frequently asked questions related to D1 limits:
### How much work can a D1 database do?
[](https://developers.cloudflare.com/d1/platform/limits/#how-much-work-can-a-d1-database-do)
D1 is designed for horizontal scale out across multiple, smaller (10 GB) databases, such as per-user, per-tenant or per-entity databases. The Workers Paid plan includes 100,000 databases per account. You pay [$0.10 per D1 database per month](https://developers.cloudflare.com/d1/platform/pricing/#billing-metrics) above the included amount. Query and storage charges apply separately.
#### Storage
[](https://developers.cloudflare.com/d1/platform/limits/#storage)
Each D1 database can store up to 10 GB of data.
Caution
Note that the 10 GB limit of a D1 database cannot be further increased.
#### Concurrency and throughput
[](https://developers.cloudflare.com/d1/platform/limits/#concurrency-and-throughput)
Each individual D1 database is inherently single-threaded, and processes queries one at a time.
Your maximum throughput is directly related to the duration of your queries.
  * If your average query takes 1 ms, you can run at most 1,000 queries per second.
  * If your average query takes 100 ms, you can run at most 10 queries per second.


Note that there is a small overhead per request that is not included in the timings that D1 reports. As a result, a database receiving many small requests would reach its limit before `1 / query duration` requests per second.
To get more throughput from a single database, reduce the number of requests rather than only the duration of each query. For example, use [`batch()`](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) to send multiple statements in a single request, so that the per-request overhead is paid once for the whole batch.
A database that receives too many concurrent requests will first attempt to queue them. If the queue becomes full, the database will return an ["overloaded" error](https://developers.cloudflare.com/d1/observability/debug-d1/#error-list).
Each individual D1 database is backed by a single [Durable Object](https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/). When using [D1 read replication ↗︎](https://developers.cloudflare.com/d1/best-practices/read-replication/#primary-database-instance-vs-read-replicas) each replica instance is a different Durable Object and the guidelines apply to each replica instance independently.
#### Query performance
[](https://developers.cloudflare.com/d1/platform/limits/#query-performance)
Query performance is the most important factor for throughput. As a rough guideline:
  * Read queries like `SELECT name FROM users WHERE id = ?` with an appropriate index on `id` will take less than a millisecond for SQL duration.
  * Write queries like `INSERT` or `UPDATE` can take several milliseconds for SQL duration, and depend on the number of rows written. Writes need to be durably persisted across several locations - learn more on [how D1 persists data under the hood ↗︎](https://blog.cloudflare.com/d1-read-replication-beta/#under-the-hood-how-d1-read-replication-is-implemented).
  * Data migrations like a large `UPDATE` or `DELETE` affecting millions of rows must be run in batches. A single query that attempts to modify hundreds of thousands of rows or hundreds of MBs of data at once will exceed execution limits. Break the work into smaller chunks (e.g., processing 1,000 rows at a time) to stay within platform limits.


To ensure your queries are fast and efficient, [use appropriate indexes in your SQL schema](https://developers.cloudflare.com/d1/best-practices/use-indexes/).
#### CPU and memory
[](https://developers.cloudflare.com/d1/platform/limits/#cpu-and-memory)
Operations on a D1 database, including query execution and result serialization, run within the [Workers platform CPU and memory limits](https://developers.cloudflare.com/workers/platform/limits/#memory).
Exceeding these limits, or hitting other platform limits, will generate errors. Refer to the [D1 error list for more details](https://developers.cloudflare.com/d1/observability/debug-d1/#error-list).
### How many simultaneous connections can a Worker open to D1?
[](https://developers.cloudflare.com/d1/platform/limits/#how-many-simultaneous-connections-can-a-worker-open-to-d1)
You can open up to six connections (to D1) simultaneously for each invocation of your Worker.
For more information on a Worker's simultaneous connections, refer to [Simultaneous open connections](https://developers.cloudflare.com/workers/platform/limits/#simultaneous-open-connections).
[PreviousPricing](https://developers.cloudflare.com/d1/platform/pricing/)[NextAlpha database migration guide](https://developers.cloudflare.com/d1/platform/alpha-migration/)
Was this helpful?
YesNo
[Edit page](https://github.com/cloudflare/cloudflare-docs/edit/production/src/content/docs/d1/platform/limits.mdx)[Report issue](https://github.com/cloudflare/cloudflare-docs/issues/new/choose)
## On this page
  * [Overview](https://developers.cloudflare.com/d1/platform/limits/#_top)
  * [Frequently Asked Questions](https://developers.cloudflare.com/d1/platform/limits/#frequently-asked-questions)
  * [How much work can a D1 database do?](https://developers.cloudflare.com/d1/platform/limits/#how-much-work-can-a-d1-database-do)
  * [How many simultaneous connections can a Worker open to D1?](https://developers.cloudflare.com/d1/platform/limits/#how-many-simultaneous-connections-can-a-worker-open-to-d1)


Was this helpful?
YesNo
[Edit page](https://github.com/cloudflare/cloudflare-docs/edit/production/src/content/docs/d1/platform/limits.mdx)[Report issue](https://github.com/cloudflare/cloudflare-docs/issues/new/choose)
[](https://developers.cloudflare.com/)[D1](https://developers.cloudflare.com/d1/)
`/`
  * [Overview](https://developers.cloudflare.com/d1/)
  * [Getting started](https://developers.cloudflare.com/d1/get-started/)
  * Best practices
    * [Import and export data](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
    * [Query a database](https://developers.cloudflare.com/d1/best-practices/query-d1/)
    * [Retry queries](https://developers.cloudflare.com/d1/best-practices/retry-queries/)
    * [Use indexes](https://developers.cloudflare.com/d1/best-practices/use-indexes/)
    * [Local development](https://developers.cloudflare.com/d1/best-practices/local-development/)
    * [Remote development](https://developers.cloudflare.com/d1/best-practices/remote-development/)
    * [Use D1 from Pages ↗︎](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases)
    * [Global read replicationBeta](https://developers.cloudflare.com/d1/best-practices/read-replication/)
  * Workers Binding API
    * [Overview](https://developers.cloudflare.com/d1/worker-api/)
    * [D1 Database](https://developers.cloudflare.com/d1/worker-api/d1-database/)
    * [Prepared statement methods](https://developers.cloudflare.com/d1/worker-api/prepared-statements/)
    * [Return objects](https://developers.cloudflare.com/d1/worker-api/return-object/)
  * SQL API
    * [SQL statements](https://developers.cloudflare.com/d1/sql-api/sql-statements/)
    * [Define foreign keys](https://developers.cloudflare.com/d1/sql-api/foreign-keys/)
    * [Query JSON](https://developers.cloudflare.com/d1/sql-api/query-json/)
  * [Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
  * [REST API ↗︎API](https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/)
  * Configuration
    * [Data location](https://developers.cloudflare.com/d1/configuration/data-location/)
    * [Environments](https://developers.cloudflare.com/d1/configuration/environments/)
  * Observability
    * [Debug D1](https://developers.cloudflare.com/d1/observability/debug-d1/)
    * [Metrics and analytics](https://developers.cloudflare.com/d1/observability/metrics-analytics/)
    * [Billing](https://developers.cloudflare.com/d1/observability/billing/)
    * [Find slow and expensive queries](https://developers.cloudflare.com/d1/observability/find-expensive-queries/)
    * [Audit Logs](https://developers.cloudflare.com/d1/observability/audit-logs/)
  * Examples
    * [Export and save D1 database ↗︎](https://developers.cloudflare.com/workflows/examples/backup-d1/)
    * [Query D1 from Remix](https://developers.cloudflare.com/d1/examples/d1-and-remix/)
    * [Query D1 from Hono](https://developers.cloudflare.com/d1/examples/d1-and-hono/)
    * [Query D1 from SvelteKit](https://developers.cloudflare.com/d1/examples/d1-and-sveltekit/)
    * [Query D1 from Python Workers](https://developers.cloudflare.com/d1/examples/query-d1-from-python-workers/)
  * [Tutorials](https://developers.cloudflare.com/d1/tutorials/)
  * [Demos and architectures](https://developers.cloudflare.com/d1/demos/)
  * Platform
    * [Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
    * [Limits](https://developers.cloudflare.com/d1/platform/limits/)
    * [Alpha database migration guide](https://developers.cloudflare.com/d1/platform/alpha-migration/)
    * [Choose a data or storage product ↗︎](https://developers.cloudflare.com/workers/platform/storage-options/)
    * [Release notes](https://developers.cloudflare.com/d1/platform/release-notes/)
  * Reference
    * [Migrations](https://developers.cloudflare.com/d1/reference/migrations/)
    * [Time Travel and backups](https://developers.cloudflare.com/d1/reference/time-travel/)
    * [Generated columns](https://developers.cloudflare.com/d1/reference/generated-columns/)
    * [Data security](https://developers.cloudflare.com/d1/reference/data-security/)
    * [Backups (Legacy)](https://developers.cloudflare.com/d1/reference/backups/)
    * [FAQs](https://developers.cloudflare.com/d1/reference/faq/)
    * [Glossary](https://developers.cloudflare.com/d1/reference/glossary/)
  * Agent resources
    * [Agent setup ↗︎](https://developers.cloudflare.com/agent-setup/)
    * [Cloudflare Skills ↗︎](https://github.com/cloudflare/skills)
    * [Code Mode MCP Server ↗︎](https://github.com/cloudflare/mcp)
    * [Domain-specific MCP Servers ↗︎MCP](https://github.com/cloudflare/mcp-server-cloudflare)
    * [D1 llms.txt ↗︎](https://developers.cloudflare.com/d1/llms.txt)
    * [D1 llms-full.txt ↗︎](https://developers.cloudflare.com/d1/llms-full.txt)
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
![privacy options](https://developers.cloudflare.com/cdn-cgi/image/onerror=redirect,width=26,height=12,format=svg/_astro/privacyoptions.BWXSiJOZ.svg)Cookie Preferences
[![](https://developers.cloudflare.com/_astro/logo.te5VL_aD.svg)Docs](https://developers.cloudflare.com/)
