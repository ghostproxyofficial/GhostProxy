<div align="center">
  
  <img src="https://raw.githubusercontent.com/ghostproxyofficial/GhostProxy/refs/heads/main/public/ghost-text-logo-white.png" width="644" />
  <hr />
  Ghost is a web browser for proxying requests & entertainment.
  
  <br />
  <br />
  <img width="1278" height="628" alt="preview" src="https://raw.githubusercontent.com/ghostproxyofficial/GhostProxy/refs/heads/main/public/preview.png" />
</div>

## Overview
Ghost is a browser-in-browser style web proxy that lets you route requests through a built-in proxy engine, built with [React](https://github.com/facebook/react).

> [!IMPORTANT]
> Please consider starring the repository if you are forking it!

### List of features:
| Feature | Implemented |
|---------|-------------|
| Web Proxy | Yes |
| Browser-like UI | Yes |
| Cloak Features | Yes |
| Quick Links | Yes |
| Search Engine Switcher | Yes |
| Themes/Site Customization | Yes |
| Multiple Backends (Scramjet/UV) | Yes |
| Multiple Transports (Libcurl/Epoxy/Bare-Mux) | Yes |

---

### Development & Building
#### Production:
```bash
git clone https://github.com/ghostproxyofficial/ghost.git
cd ghost
npm i
npm run build
node server.js
```

#### Development:
```bash
git clone https://github.com/ghostproxyofficial/ghost.git
cd ghost
npm i
npm run dev
```

---

> [!NOTE]
> This project uses the Wisp protocol for proxying. You can host your own endpoint with [ghostproxyofficial/wisp-server](https://github.com/ghostproxyofficial/wisp-server) and configure Ghost to use it.

---

### Contributors / Developers
| Name | Role | GitHub |
|------|------|--------|
| Ghost | Lead Developer | [@ghostproxyofficial](https://github.com/ghostproxyofficial) |
| Derpman | Original Creator | [@qerionx](https://github.com/qerionx) |

> [!NOTE]
> Want to be on this list? Make a few pull requests!

---

### Made possible thanks to:
* [MercuryWorkshop/wisp-server-node](https://github.com/MercuryWorkshop/wisp-server-node)
* [MercuryWorkshop/scramjet](https://github.com/MercuryWorkshop/scramjet)
* [MercuryWorkshop/epoxy-transport](https://github.com/MercuryWorkshop/epoxy-transport)
* [MercuryWorkshop/libcurl-transport](https://github.com/MercuryWorkshop/libcurl-transport)
* [mercuryworkshop/bare-mux](https://github.com/MercuryWorkshop/bare-mux)
* [titaniumnetwork-dev/Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet)
* [lucide-icons/lucide](https://github.com/lucide-icons/lucide)
* [pmndrs/zustand](https://github.com/pmndrs/zustand)
* [Stuk/jszip](https://github.com/Stuk/jszip)

## License
This project is licensed under the **GNU Affero GPL v3 (AGPL-3.0)**.  
See the [LICENSE](LICENSE) file for more details.
