# Hi, I'm Phil

Frontend engineer in Columbus, Ohio. I build accessible, component-driven web products, and AI tools are a big part of how I work.

- Software engineer at Hims & Hers, shipping React and Next.js features for a telehealth platform serving nearly 3 million customers
- Led my team's Claude Code rollout: documentation, training sessions, and a custom internal agent
- Built a Claude-powered WCAG audit tool that won the Audience Choice Award at our company hackathon
- Previously built Meta.com launch pages for Meta Quest 3 and Ray-Ban Meta smart glasses
- Run [Lorien Web](https://lorienweb.com), a small studio building accessible sites for small businesses, churches, and nonprofits

## Client work

Client code is private. Case studies, decision records, and scan results live in my **[portfolio repo](https://github.com/philorien/portfolio)**.

- **[Hope Presbyterian Church](https://github.com/philorien/portfolio/tree/main/case-studies/hope-church)**: Moved a church site off a hosted platform onto Next.js and Sanity, starting from a 22-point audit, with an automated WCAG 2.2 scan of every page. [Live site](https://www.hopechurchcolumbus.org) *Next.js, Sanity, Tailwind CSS, Vercel*
- **[Dragonfly Bookshop](https://github.com/philorien/portfolio/tree/main/case-studies/dragonfly)**: A first website for an independent bookstore, with the catalog pulled from the shop's Square register, online special orders, and events. 1,206 visitors in its first month. [Live site](https://www.dragonflybookshop.com) *Next.js, TypeScript, Square API, Airtable, Vercel*

## Selected work

- **[a11y-scan](https://github.com/philorien/portfolio/tree/main/tools/a11y-scan)**: Runs axe-core against every page in a sitemap and fails CI on serious WCAG 2.2 issues. Works on any site with a sitemap. *Node, Playwright, axe-core*
- **[calorie-chat-public](https://github.com/philorien/calorie-chat-public)**: A conversational calorie tracker. Claude looks up foods in USDA and Open Food Facts data, with barcode scanning and prompt caching to keep token costs down. *Next.js, TypeScript, Supabase, Vercel AI SDK*
- **[dcma-site](https://github.com/philorien/dcma-site)**: The [public website](https://dcma-site.vercel.app) for Door County Mutual Aid. Editors publish through Sanity without touching code, pages use incremental static regeneration, and every image requires alt text. *Nuxt 4, Sanity, Vitest, Vercel*
- **[vue-starter](https://github.com/philorien/vue-starter)**: A Vue 3 and Vite starter with Tailwind v4 and a built-in design system. *Vue 3, Vite, Tailwind CSS*
- **[cbz2epub](https://github.com/philorien/cbz2epub)**: Converts CBZ comic archives to fixed-layout EPUB3, from the command line or a local web UI. The core runs on the Python standard library alone. *Python, Flask*

## Open source

- **[activist-org/activist#1939](https://github.com/activist-org/activist/pull/1939)**: Accessibility fixes for an open-source organizing platform, adding alt text to map tooltip images and making an edit toggle keyboard accessible

## How I work

- **Accessibility first.** WCAG 2.2 AA is a requirement, not a polish step. Automated scans catch part of it; keyboard and screen reader testing cover the rest.
- **Decisions written down.** Each project keeps short decision records explaining what I chose, what I rejected, and why.
- **AI-assisted, human-reviewed.** I use Claude Code daily. I own the architecture and review everything it writes.

---

Also working toward a BA in sociology at Ohio University. Find me on [LinkedIn](https://www.linkedin.com/in/phil-linley).
