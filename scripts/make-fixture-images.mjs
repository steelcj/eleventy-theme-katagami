// Generates the stencil-pattern fixture images in src/media/: seigaiha waves, kikko
// hexagons and shippo circles, 1800 by 1200 pixels, larger than the widest processed
// width so that resizing is exercised. Usage: npm run fixture-images
import sharp from "sharp";
import path from "node:path";

const [outDir = "src/media"] = process.argv.slice(2);
const W = 1800, H = 1200;
const washi = "#f5f0e6", indigo = "#24426b", persimmon = "#c4532a", sumi = "#23211e";

function seigaiha() {
  const r = 60, shapes = [];
  for (let row = -1; row * (r / 2) < H + r; row++) {
    for (let col = -1; col * r * 2 < W + r * 2; col++) {
      const cx = col * r * 2 + (row % 2 ? r : 0), cy = row * (r / 2);
      for (let k = 4; k >= 1; k--) {
        shapes.push(`<circle cx="${cx}" cy="${cy}" r="${(r * k) / 4}" fill="${k % 2 ? indigo : washi}"/>`);
      }
    }
  }
  return { bg: washi, shapes };
}

function kikko() {
  const s = 70, h = Math.sqrt(3) * s, shapes = [];
  for (let row = -1; row * h < H + h; row++) {
    for (let col = -1; col * 1.5 * s < W + s; col++) {
      const cx = col * 1.5 * s, cy = row * h + (col % 2 ? h / 2 : 0);
      const pts = [...Array(6)].map((_, i) => `${cx + (s - 8) * Math.cos((Math.PI / 3) * i)},${cy + (s - 8) * Math.sin((Math.PI / 3) * i)}`);
      shapes.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="${sumi}" stroke-width="5"/>`);
    }
  }
  return { bg: washi, shapes };
}

function shippo() {
  const r = 80, shapes = [];
  for (let y = 0; y <= H + r; y += r) {
    for (let x = 0; x <= W + r; x += r) {
      shapes.push(`<circle cx="${x}" cy="${y}" r="${r * 0.71}" fill="none" stroke="${washi}" stroke-width="5"/>`);
    }
  }
  return { bg: persimmon, shapes };
}

for (const [name, pattern] of Object.entries({ seigaiha, kikko, shippo })) {
  const { bg, shapes } = pattern();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${bg}"/>${shapes.join("")}</svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile(path.join(outDir, `${name}.jpg`));
}
