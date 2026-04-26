# Siteglow

<div align="center">

![Siteglow](https://github.com/xtrafr/siteglow/blob/main/.github/siteglow.png)

**A high performance technical auditing engine that lives in your browser**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/?repo=siteglow)

</div>

---

## Features

- **Where it's hosted** - Instantly find the IP address, server location, and hosting provider
- **Security check** - Real time audit of SSL certificates, security headers, and domain safety
- **Asset Explorer** - IDE style file explorer to browse a site's images, scripts, and styles
- **Subdomains** - Automatic mapping of the digital ecosystem surrounding any domain
- **Email Protection** - Detection of SPF and DMARC configurations to prevent spoofing
- **Beautiful UI** - Minimalist, high density dashboard with smooth animations

## Quick Start

### Use it now
Start the project locally and enter any URL to begin your audit.

### Clone locally
```bash
git clone https://github.com/xtrafr/webdna.git
cd webdna
npm install
```

Set up your environment variables:
1. Create a `.env` file in the root directory.
2. Add your free [ScrapingAnt](https://scrapingant.com/) API key (10,000 free requests/month) to bypass Cloudflare protection:
   ```env
   SCRAPINGANT_API_KEY="your_api_key_here"
   ```

Run the development server:
```bash
npm run dev
```

## Tech Stack

- **Framework**: SvelteKit 5 (Fast and modern)
- **Styling**: Tailwind CSS (Clean and responsive)
- **Logic**: Node.js + Cheerio (High speed site parsing)
- **Proxy**: ScrapingAnt API (Free Cloudflare/WAF bypass)
- **Icons**: Lucide Svelte (Technical and precise)

## Project Structure

```
webdna/
├── src/
│   ├── lib/
│   │   ├── server/      # Core scanning logic & network probes
│   │   ├── components/  # Reusable UI modules
│   │   └── stores/      # App state and history management
│   └── routes/          # Inspection pages and streaming data
├── static/              # Fonts and global assets
├── package.json         # Project dependencies
└── README.md            # This file
```

## Why WebDNA?

- **Privacy first** - Audits are performed on your terms
- **Instant** - No loading time, no complex setup
- **Deep Intelligence** - See the tech stack and file system of any target
- **Actionable** - Export colors as CSS or copy technical data in one click

## License

MIT © [Xtra](https://github.com/xtrafr)

---

<div align="center">
Made with love by <a href="https://github.com/xtrafr">Xtra</a>
</div>
