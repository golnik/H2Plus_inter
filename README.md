# Quantum Dynamics Interactive Learning Tool

An interactive, in-browser visualization of ultrafast electron-nuclear dynamics in the H<sub>2</sub><sup>+</sup> molecular ion. Built as a learning tool for exploring quantum dynamics concepts through live, adjustable plots rather than static figures.

**[Live demo](https://h2plus.ngolubev.com/)**

## What it covers

The tool is organized into four sections:

- **Theory** - background on the physical concepts and computational methodology used throughout the tool.
- **Electronic Structure** - the bonding/antibonding potential energy surfaces of H<sub>2</sub><sup>+</sup> and the corresponding electron probability densities.
- **Electron Dynamics** - how the electron density evolves in time when the system is in a superposition of the bonding and antibonding states.
- **Nuclear Dynamics** - nuclear wavepacket dynamics on each potential energy surface.
- **Full Quantum Dynamics** - coupled electron-nuclear dynamics, combining the above into a single time-dependent picture.

Each plot has an accompanying info icon with a plain-language explanation of what's being shown.

## Running locally

This is a static site with no build step. Serve the directory with any static file server and open it in a browser, for example:

```bash
python3 -m http.server
```

Then visit `http://localhost:8000`.

## Tech stack

- Vanilla HTML/CSS/JS (no framework)
- [Plotly.js](https://plotly.com/javascript/) for plotting
- [MathJax](https://www.mathjax.org/) / [KaTeX](https://katex.org/) for math rendering
- Precomputed simulation data loaded from `qdata.json`

## Developers

Alex Klyber, Maximillian Thomas, and Nikolay Golubev

## License

[GPL-3.0](LICENSE)
