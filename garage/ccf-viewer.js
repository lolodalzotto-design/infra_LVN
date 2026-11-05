import { faces } from './ccf-geometry.js';

// Each report still uses a face and two percentages. Projecting those
// coordinates back onto the mesh also keeps existing cube reports visible.
const sides = {
  Avant:   { axis: 0, sign:  1, u: [2, 1, -1], v: [1, 2.5, 0] },
  Arrière: { axis: 0, sign: -1, u: [2, -1, 1], v: [1, 2.5, 0] },
  Droite:  { axis: 2, sign: -1, u: [0, 3, -3], v: [1, 2.5, 0] },
  Gauche:  { axis: 2, sign:  1, u: [0, -3, 3], v: [1, 2.5, 0] },
  Dessus:  { axis: 1, sign:  1, u: [0, -3, 3], v: [2, -1, 1] },
  Dessous: { axis: 1, sign: -1, u: [0, -3, 3], v: [2, 1, -1] }
};
const colors = { reported: '#ef4444', 'in-progress': '#f59e0b', resolved: '#22c55e' };
const degrees = Math.PI / 180;
const clamp = value => Math.max(0, Math.min(100, value));

function triangleWeights(a, b, c, x, y) {
  const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(det) < 1e-8) return null;
  const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / det;
  const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / det;
  const w = 1 - u - v;
  return Math.min(u, v, w) >= -1e-8 ? [u, v, w] : null;
}

function surfaceAt(polygons, x, y) {
  let hit = null;
  for (const { points, projected } of polygons) {
    for (let i = 1; i < points.length - 1; i++) {
      const a = projected[0], b = projected[i], c = projected[i + 1];
      const weights = triangleWeights(a, b, c, x, y);
      if (!weights) continue;
      const [u, v, w] = weights;
      const depth = a[2] * u + b[2] * v + c[2] * w;
      if (!hit || depth > hit.depth) {
        const vertices = [points[0], points[i], points[i + 1]];
        const point = vertices[0].map((n, k) => n * u + vertices[1][k] * v + vertices[2][k] * w);
        hit = { depth, point, vertices };
      }
      break;
    }
  }
  return hit;
}

const sideProjections = Object.fromEntries(Object.entries(sides).map(([name, side]) => [
  name, faces.map(({ points }) => ({
    points,
    projected: points.map(point => [point[side.u[0]], point[side.v[0]], point[side.axis] * side.sign])
  }))
]));

function pointForPin(pin) {
  const side = sides[pin.face];
  if (!side || !Number.isFinite(pin.u) || !Number.isFinite(pin.v)) return null;
  const point = [0, 0, 0];
  for (const [value, [axis, start, end]] of [[pin.u, side.u], [pin.v, side.v]]) {
    point[axis] = start + clamp(value) * (end - start) / 100;
  }
  const hit = surfaceAt(sideProjections[pin.face], point[side.u[0]], point[side.v[0]]);
  if (hit) return hit.point;
  // A pin placed on an empty part of the old cube stays at its original face position.
  point[side.axis] = side.axis === 1 ? (side.sign > 0 ? 2.5 : 0) : side.sign * (side.axis === 0 ? 3 : 1);
  return point;
}

export function createCcfViewer(canvas) {
  const ctx = canvas.getContext('2d');
  let camera = { x: -20, y: -30, zoom: 1, shiftX: 0, shiftY: 0 };
  let polygons = [];
  let pins = [];
  let toward = [0, 0, 1];

  function draw() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!ctx || canvas.hidden || !width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * dpr), pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const pitch = -camera.x * degrees, yaw = -camera.y * degrees;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const scale = Math.min(width / 7.4, height / 4.4) * camera.zoom;
    toward = [sy * cp, sp, cy * cp];

    function project([x, y, z]) {
      const heightFromCenter = y - 1.25;
      const a = x * cy - z * sy, b = x * sy + z * cy;
      return [
        width / 2 + a * scale + camera.shiftX,
        height / 2 - (heightFromCenter * cp - b * sp) * scale + camera.shiftY,
        heightFromCenter * sp + b * cp
      ];
    }

    polygons = faces.map(face => {
      const projected = face.points.map(project);
      const depth = projected.reduce((sum, p) => sum + p[2], 0) / projected.length;
      return { ...face, projected, depth };
    }).sort((a, b) => a.depth - b.depth);

    ctx.lineJoin = 'round';
    ctx.lineWidth = .75;
    for (const { projected, fill, outline } of polygons) {
      ctx.beginPath();
      projected.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.stroke();
    }

    for (const pin of pins) {
      const side = sides[pin.face];
      if (!side || toward[side.axis] * side.sign <= .03) continue;
      const point = pointForPin(pin);
      if (!point) continue;
      const [x, y, depth] = project(point);
      const surface = surfaceAt(polygons, x, y);
      if (surface && surface.depth > depth + .07) continue;
      const color = colors[pin.status] || colors.reported;
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fillStyle = color + '70';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  new ResizeObserver(draw).observe(canvas);
  return {
    setCamera(next) { camera = next; draw(); },
    setPins(next) { pins = next; draw(); },
    pick(clientX, clientY) {
      const box = canvas.getBoundingClientRect();
      const hit = surfaceAt(polygons, clientX - box.left, clientY - box.top);
      if (!hit) return null;
      const [a, b, c] = hit.vertices;
      const u = b.map((n, i) => n - a[i]), v = c.map((n, i) => n - a[i]);
      const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const axis = [0, 1, 2].reduce((best, i) => Math.abs(normal[i] * toward[i]) > Math.abs(normal[best] * toward[best]) ? i : best);
      const [face, side] = Object.entries(sides).find(([, s]) => s.axis === axis && s.sign * toward[axis] > 0);
      const percent = ([i, start, end]) => clamp((hit.point[i] - start) * 100 / (end - start));
      return { face, u: percent(side.u), v: percent(side.v) };
    }
  };
}
