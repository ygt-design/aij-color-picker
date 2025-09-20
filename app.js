function normalizeHex(hex) {
  if (!hex) return null;
  hex = hex.trim().toLowerCase();
  if (hex[0] !== "#") hex = "#" + hex;
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  if (hex.length === 4) {
    // expand #rgb -> #rrggbb
    hex = "#" + [...hex.slice(1)].map((ch) => ch + ch).join("");
  }
  return hex.toUpperCase();
}

function hexToRgb(hex) {
  const n = (h, i) => parseInt(h.slice(i, i + 2), 16);
  return [n(hex, 1), n(hex, 3), n(hex, 5)];
}

function updateHud(hex) {
  const [r, g, b] = hexToRgb(hex);
  document.getElementById("hexVal").textContent = hex;
  document.getElementById("rgbVal").textContent = `${r}, ${g}, ${b}`;
}

async function inlineAndPrepareSVG(mount) {
  const src = mount.dataset.src;
  if (!src) throw new Error("Missing data-src on #svgMount");

  const res = await fetch(src);
  if (!res.ok)
    throw new Error(`Failed to load SVG: ${res.status} ${res.statusText}`);
  const svgText = await res.text();

  mount.innerHTML = svgText;
  const svg = mount.querySelector("svg");
  if (!svg) throw new Error("No <svg> found in loaded file.");

  if (!svg.getAttribute("viewBox")) {
    const w = parseFloat(svg.getAttribute("width")) || 100;
    const h = parseFloat(svg.getAttribute("height")) || 100;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.removeAttribute("width");
    svg.removeAttribute("height");
  }

  svg.querySelectorAll("style").forEach((style) => style.remove());

  return svg;
}

function applyColor(svg, hex) {
  svg.querySelectorAll("*").forEach((el) => {
    const fill = el.getAttribute("fill");
    const stroke = el.getAttribute("stroke");

    if (fill && fill.toLowerCase() !== "none") {
      el.setAttribute("fill", hex);
    }

    if (stroke && stroke.toLowerCase() !== "none") {
      el.setAttribute("stroke", hex);
    }

    if (el.className && el.className.baseVal) {
      const classes = el.className.baseVal.split(" ");
      if (classes.some((cls) => cls.startsWith("cls-"))) {
        el.setAttribute("fill", hex);
      }
    }
  });

  updateHud(hex);
}

function applyBackgroundColor(mount, hex) {
  mount.style.backgroundColor = hex;
}

(async function init() {
  const picker = document.getElementById("colorPicker");
  const hexInput = document.getElementById("hexInput");
  const bgColorPicker = document.getElementById("bgColorPicker");
  const bgHexInput = document.getElementById("bgHexInput");
  const mount = document.getElementById("svgMount");
  const svgOptions = document.querySelectorAll(".svg-option");

  let currentSvg;

  async function loadSVG(svgPath) {
    mount.dataset.src = svgPath;
    mount.innerHTML = '<div class="loading">Loading SVG...</div>';

    try {
      currentSvg = await inlineAndPrepareSVG(mount);

      const currentHex = normalizeHex(picker.value) || "#D1D1D1";
      applyColor(currentSvg, currentHex);
    } catch (err) {
      console.error(err);
      mount.innerHTML = `<p style="color:#666;opacity:.8">Error: ${String(
        err.message || err
      )}</p>`;
    }
  }

  await loadSVG(mount.dataset.src || "./assets/aij-1seamless.svg");

  const startHex = normalizeHex(picker.value) || "#D1D1D1";
  picker.value = startHex;
  hexInput.value = startHex;
  if (currentSvg) {
    applyColor(currentSvg, startHex);
  }

  const startBgHex = normalizeHex(bgColorPicker.value) || "#1F1F1F";
  bgColorPicker.value = startBgHex;
  bgHexInput.value = startBgHex;
  applyBackgroundColor(mount, startBgHex);

  svgOptions.forEach((option) => {
    option.addEventListener("click", async (e) => {
      svgOptions.forEach((opt) => opt.classList.remove("active"));

      e.target.classList.add("active");

      const svgPath = e.target.dataset.svg;
      await loadSVG(svgPath);
    });
  });

  picker.addEventListener("input", (e) => {
    const hex = normalizeHex(e.target.value);
    if (hex && currentSvg) {
      hexInput.value = hex;
      applyColor(currentSvg, hex);
    }
  });

  hexInput.addEventListener("input", (e) => {
    const normalized = normalizeHex(e.target.value);
    if (normalized && currentSvg) {
      picker.value = normalized;
      applyColor(currentSvg, normalized);
    }
  });

  bgColorPicker.addEventListener("input", (e) => {
    const hex = normalizeHex(e.target.value);
    if (hex) {
      bgHexInput.value = hex;
      applyBackgroundColor(mount, hex);
    }
  });

  bgHexInput.addEventListener("input", (e) => {
    const normalized = normalizeHex(e.target.value);
    if (normalized) {
      bgColorPicker.value = normalized;
      applyBackgroundColor(mount, normalized);
    }
  });
})();
