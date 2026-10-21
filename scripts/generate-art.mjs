// Generates the demo artwork in public/art. Run: node scripts/generate-art.mjs
import { writeFileSync, mkdirSync } from "node:fs";

const W = 600;
const H = 800;
const out = new URL("../public/art/", import.meta.url);
mkdirSync(out, { recursive: true });

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const svg = (body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`;
const rect = (fill, x = 0, y = 0, w = W, h = H, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const circle = (cx, cy, r, fill, extra = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const grad = (id, stops, vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops
    .map((c, i) => `<stop offset="${(i / (stops.length - 1)) * 100}%" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;
const text = (x, y, size, fill, content, extra = "") =>
  `<text x="${x}" y="${y}" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" fill="${fill}" text-anchor="middle" ${extra}>${content}</text>`;
const wave = (y, amp, len, fill, phase = 0) => {
  let d = `M0 ${y}`;
  for (let x = 0; x <= W; x += 10) d += ` L${x} ${(y + Math.sin((x / len) * Math.PI * 2 + phase) * amp).toFixed(1)}`;
  return `<path d="${d} L${W} ${H} L0 ${H} Z" fill="${fill}"/>`;
};
const ridge = (base, rough, fill) => {
  let d = `M0 ${base}`;
  let y = base;
  for (let x = 0; x <= W; x += 30) {
    y = base + (rand() - 0.5) * rough;
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return `<path d="${d} L${W} ${H} L0 ${H} Z" fill="${fill}"/>`;
};

const art = {
  "sunset-dunes": () =>
    svg(
      rect("url(#sky)") + circle(300, 360, 120, "#fff1d6", 'opacity="0.95"') +
        wave(470, 30, 520, "#e9a178", 0.4) + wave(540, 26, 420, "#d2774f", 1.6) +
        wave(620, 22, 600, "#a8512f", 3) + wave(700, 18, 380, "#7a3520", 0.8),
      grad("sky", ["#f7c59f", "#f4a688", "#e98b78"])
    ),
  "bauhaus-balance": () =>
    svg(
      rect("#f2ebdf") + rect("#1f3a5f", 60, 60, 240, 340) + circle(420, 230, 120, "#e3a72f") +
        `<path d="M60 700 A240 240 0 0 1 540 700 Z" fill="#c4553a"/>` + rect("#1d1d1b", 300, 430, 240, 30) +
        circle(180, 520, 60, "#f2ebdf") + circle(180, 520, 30, "#1d1d1b")
    ),
  "terracotta-arches": () => {
    const colors = ["#c96f4a", "#e6b89c", "#8f4a32", "#f3dccb", "#b85c3c"];
    let body = rect("#f6ede4");
    colors.forEach((c, i) => {
      const r = 230 - i * 42;
      body += `<path d="M${300 - r} 720 L${300 - r} 420 A${r} ${r} 0 0 1 ${300 + r} 420 L${300 + r} 720 Z" fill="${c}"/>`;
    });
    return svg(body + rect("#3b2a22", 0, 720, W, 80));
  },
  "misty-mountains": () => {
    seed = 21;
    return svg(
      rect("url(#m)") + circle(420, 210, 60, "#ffffff", 'opacity="0.7"') +
        ridge(380, 160, "#9fb4c7") + ridge(470, 140, "#7893ab") + ridge(560, 120, "#4f6d88") + ridge(660, 90, "#2e4a63"),
      grad("m", ["#dfe7ee", "#c3d1dd"])
    );
  },
  "ocean-lines": () => {
    let body = rect("#f4f1ea");
    for (let i = 0; i < 26; i++) {
      let d = `M40 ${140 + i * 20}`;
      for (let x = 40; x <= 560; x += 8) d += ` L${x} ${(140 + i * 20 + Math.sin(x / 40 + i * 0.5) * 12).toFixed(1)}`;
      body += `<path d="${d}" stroke="${i % 3 === 0 ? "#1f4e79" : "#5b8db8"}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    return svg(body);
  },
  "moon-phases": () => {
    let body = rect("#141a2e");
    seed = 3;
    for (let i = 0; i < 90; i++) body += circle(rand() * W, rand() * H, rand() * 1.8 + 0.4, "#ffffff", `opacity="${(rand() * 0.6 + 0.2).toFixed(2)}"`);
    const ys = [130, 230, 330, 430, 530, 630];
    ys.forEach((y, i) => {
      body += circle(300, y, 38, "#2a3352");
      const off = -76 + i * 30;
      body += `<clipPath id="c${i}"><circle cx="300" cy="${y}" r="38"/></clipPath>`;
      body += `<g clip-path="url(#c${i})">${circle(300, y, 38, "#f3e6c4")}${circle(300 + off, y, 38, "#2a3352")}</g>`;
    });
    return svg(body);
  },
  "monstera-shadow": () => {
    let body = rect("#e8eadf");
    const leaf = (x, y, rot, s, c) =>
      `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C-90 -40 -110 -170 0 -260 C110 -170 90 -40 0 0 Z" fill="${c}"/><path d="M0 0 L0 -250" stroke="#e8eadf" stroke-width="5"/>${[-200, -150, -100, -60]
        .map((yy) => `<path d="M0 ${yy} L-60 ${yy - 40} M0 ${yy} L60 ${yy - 40}" stroke="#e8eadf" stroke-width="4"/>`)
        .join("")}</g>`;
    body += leaf(300, 720, 0, 1.6, "#2f5d46") + leaf(200, 640, -35, 1.1, "#3f7a5b") + leaf(420, 660, 32, 1.15, "#4c8d68");
    return svg(body);
  },
  "organic-blobs": () =>
    svg(
      rect("#f7efe6") +
        `<path d="M140 180 C240 90 380 150 360 260 C340 360 200 380 150 320 C100 260 80 230 140 180Z" fill="#e2a48a"/>` +
        `<path d="M300 380 C420 330 520 420 480 530 C440 640 300 620 270 540 C240 460 240 410 300 380Z" fill="#7d9a86"/>` +
        `<path d="M110 520 C170 470 250 520 230 600 C210 680 120 690 95 630 C70 570 70 550 110 520Z" fill="#d9b860"/>` +
        circle(450, 180, 40, "#2d3a4a")
    ),
  "golden-hour": () => {
    let body = rect("#f3e3cc") + circle(300, 400, 170, "#e59d4b");
    for (let i = 0; i < 8; i++) body += rect("#f3e3cc", 0, 410 + i * 22, W, 10 - i * 0.6);
    return svg(body + rect("#3d2b1f", 0, 640, W, 160));
  },
  "swiss-dots": () => {
    let body = rect("#f5f3ef");
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 6; c++) {
        const hot = (r === 3 && c === 4) || (r === 6 && c === 1);
        body += circle(75 + c * 90, 100 + r * 75, hot ? 28 : 16, hot ? "#e4472f" : "#1d1d1b");
      }
    return svg(body);
  },
  "stay-curious": () =>
    svg(
      rect("#1d1d1b") + circle(300, 300, 150, "#e4b363") +
        text(300, 560, 82, "#f5efe4", "stay", 'font-style="italic"') +
        text(300, 650, 82, "#f5efe4", "curious.", 'font-weight="bold"')
    ),
  "good-things": () =>
    svg(
      rect("#efe3d3") +
        text(300, 300, 64, "#7a3520", "good things") + text(300, 390, 64, "#7a3520", "take", 'font-style="italic"') +
        text(300, 480, 64, "#7a3520", "time") + rect("#7a3520", 250, 540, 100, 4)
    ),
  "desert-cactus": () =>
    svg(
      rect("url(#d)") + circle(450, 200, 70, "#fbe3b8") +
        wave(620, 14, 700, "#d89a62") +
        `<g fill="#3f6b4f"><rect x="270" y="300" width="60" height="360" rx="30"/><rect x="180" y="400" width="50" height="150" rx="25"/><rect x="180" y="510" width="110" height="45" rx="22"/><rect x="370" y="360" width="50" height="140" rx="25"/><rect x="310" y="460" width="110" height="45" rx="22"/></g>`,
      grad("d", ["#f1b98c", "#f3cfa8"])
    ),
  "pine-forest": () => {
    seed = 11;
    let body = rect("url(#p)");
    for (let i = 0; i < 26; i++) {
      const x = rand() * W;
      const h = 160 + rand() * 220;
      const y = 560 + rand() * 180;
      const c = ["#1f3d33", "#2c5444", "#3b6b56"][i % 3];
      body += `<path d="M${x} ${y - h} L${x + h * 0.28} ${y} L${x - h * 0.28} ${y} Z" fill="${c}"/>`;
    }
    return svg(body, grad("p", ["#c9dbd0", "#e8efe9"]));
  },
  "retro-rainbow": () => {
    const colors = ["#c4553a", "#e08a3c", "#e9b949", "#7d9a86", "#3e6d8c"];
    let body = rect("#f4ead9");
    colors.forEach((c, i) => {
      const r = 250 - i * 40;
      body += `<path d="M${300 - r} 600 A${r} ${r} 0 0 1 ${300 + r} 600" stroke="${c}" stroke-width="40" fill="none"/>`;
    });
    return svg(body);
  },
  "matisse-cutouts": () =>
    svg(
      rect("#f2ece2") +
        `<path d="M150 150 Q190 90 230 150 Q290 130 270 200 Q330 240 270 270 Q290 340 230 320 Q190 380 150 320 Q90 340 110 270 Q50 240 110 200 Q90 130 150 150Z" fill="#2457a6"/>` +
        `<path d="M380 380 Q430 300 470 380 Q540 360 510 430 Q570 480 500 510 Q520 590 450 560 Q400 630 370 560 Q300 580 320 510 Q260 470 320 430 Q300 360 380 380Z" fill="#e2603f"/>` +
        `<path d="M120 520 Q170 480 200 540 Q230 600 180 650 Q130 700 100 640 Q70 580 120 520Z" fill="#f0b73d"/>`
    ),
  "city-nights": () => {
    seed = 5;
    let body = rect("url(#n)");
    let x = 0;
    while (x < W) {
      const w = 50 + rand() * 60;
      const h = 220 + rand() * 330;
      body += rect("#1b2238", x, H - h, w - 4, h);
      for (let wy = H - h + 20; wy < H - 20; wy += 26)
        for (let wx = x + 10; wx < x + w - 16; wx += 16) if (rand() > 0.55) body += rect("#f5c86b", wx, wy, 7, 11);
      x += w;
    }
    return svg(body + circle(470, 140, 40, "#f5e6c4"), grad("n", ["#2a3b6b", "#6b4f7a", "#c97a6d"]));
  },
  "terrazzo": () => {
    seed = 17;
    let body = rect("#f3eee7");
    const cs = ["#c4553a", "#7d9a86", "#e9b949", "#2d3a4a", "#e6b89c"];
    for (let i = 0; i < 70; i++) {
      const cx = rand() * W, cy = rand() * H, r = 6 + rand() * 18;
      let d = "";
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const rr = r * (0.6 + rand() * 0.6);
        d += `${k ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `;
      }
      body += `<path d="${d}Z" fill="${cs[i % cs.length]}"/>`;
    }
    return svg(body);
  },
};

for (const [name, fn] of Object.entries(art)) writeFileSync(new URL(`${name}.svg`, out), fn());
console.log(`Wrote ${Object.keys(art).length} artworks`);
