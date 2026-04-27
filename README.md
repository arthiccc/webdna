# WebDNA

<div align="center">

![WebDNA](https://github.com/xtrafr/webdna/blob/main/.github/webdnapreview.png)

**See everything behind any website in 1 click.**

**DNS, infrastructure, security, assets, colors, fonts, all in one clean dashboard.**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/?repo=xtrafr/webdna)

</div>

---

## Features

**Design DNA**: Automatic extraction of brand colors and precise typography analysis.

**WHOIS Intelligence**: Comprehensive WHOIS and DNS propagation scanner developed by [b1s4](https://github.com/b1s4/).

**DNS Propagation**: Global DNS resolution tracking with interactive world mapping.

**Infrastructure**: Instantly find the IP address, server location, and hosting provider.

**Asset Explorer**: IDE-style file explorer to browse a site's images, scripts, and styles.

**Security Audit**: Real-time audit of SSL certificates, security headers, and domain safety.

**Subdomains**: Automatic mapping of the digital ecosystem surrounding any domain.

**Email Protection**: Detection of SPF and DMARC configurations to prevent spoofing.

**Beautiful UI**: Minimalist, high-density dashboard with smooth animations.

---

## Global DNS Propagation

<div align="center">

![Whois Preview](https://github.com/xtrafr/webdna/blob/main/.github/whoispreview.png)

</div>

## Quick Start

### 1. Clone locally
```bash
git clone https://github.com/xtrafr/webdna.git
cd webdna
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and add your [ScrapingAnt](https://scrapingant.com/) API key to bypass WAFs:
```env
SCRAPINGANT_API_KEY="your_api_key_here"
```

### 3. Development
```bash
npm run dev
```

## Tech Stack

**Framework**: SvelteKit 5 (Runes)

**Styling**: Tailwind CSS

**Parsing**: Cheerio + Custom Network Probes

**Proxy**: ScrapingAnt API (WAF bypass)

**Icons**: Lucide Svelte

## API Reference

<details>
<summary><b>Analyze Endpoint</b> (Internal)</summary>

### `GET /inspect/[url]`
The primary entry point for website analysis. It streams the data using SvelteKit's `streamed` data pattern.

**Parameters:**
: `url`: The encoded URL to analyze (e.g., `https%3A%2F%2Fgoogle.com`)

**Response:**
Returns a `report` object containing:
: `branding`: Logos, favicons, and primary colors.
: `typography`: Detected font families and weights.
: `infrastructure`: IP, Provider, and ASN details.
: `assets`: Full tree of scripts, styles, and images.
: `dns_propagation`: Real-time global DNS resolution data.
</details>

<details>
<summary><b>Asset Proxy</b></summary>

### `GET /api/proxy-asset?url=[url]`
A security-first proxy to fetch and preview remote assets (CSS/JS) without CORS issues.
</details>

## Project Structure

```
webdna/
├── src/
│   ├── lib/
│   │   ├── server/      # Core scanning logic & network probes
│   │   ├── components/  # Reusable UI modules
│   │   └── stores/      # App state and history management
│   └── routes/          # Inspection pages and streaming data
├── static/              # Favicon, OG images, and global assets
├── package.json         # Project dependencies
└── README.md            # This file
```

## Authors

[Xtra](https://github.com/xtrafr) - Owner & Lead Developer

[b1s4](https://github.com/b1s4/) - Whois & DNS Propagation Developer

## License

MIT © [Xtra](https://github.com/xtrafr)

---

<div align="center">
Made with DNA by <a href="https://github.com/xtrafr">Xtra</a> & <a href="https://github.com/b1s4/">b1s4</a>
</div>
