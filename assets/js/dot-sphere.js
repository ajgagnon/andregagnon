/* <dot-sphere> — decorative animated dot-sphere background (vanilla custom element).
   Sage particles on a slow rotation with a Perlin-style wobble whose intensity
   follows the cursor's vertical position. Respects prefers-reduced-motion.
   Self-registers; just drop <dot-sphere></dot-sphere> into a positioned parent. */
(() => {
  if (customElements.get('dot-sphere')) return;

  class DotSphere extends HTMLElement {
    connectedCallback() {
      this.style.position = this.style.position || 'absolute';
      this.style.pointerEvents = 'none';
      const canvas = document.createElement('canvas');
      Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block' });
      this.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const color = this.getAttribute('color') || '96,135,132';
      const N = parseInt(this.getAttribute('count') || '760', 10);

      const pts = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - (i / (N - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const phi = i * golden;
        pts.push({ x: Math.cos(phi) * r, y, z: Math.sin(phi) * r, phi });
      }

      const mouse = { y: 0.5 };
      this._onMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        if (!rect.height) return;
        mouse.y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      };
      window.addEventListener('pointermove', this._onMove);

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let w = 0, h = 0, t = 0;

      const resize = () => {
        w = this.clientWidth; h = this.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
      };
      resize();
      this._ro = new ResizeObserver(resize);
      this._ro.observe(this);

      const draw = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const R = Math.min(w, h) * 0.46;
        const cx = w * 0.6, cy = h * 0.42;
        const ay = t * 0.0024, tilt = -0.32, fov = 3.2;
        const cosY = Math.cos(ay), sinY = Math.sin(ay);
        const cosX = Math.cos(tilt), sinX = Math.sin(tilt);
        const amp = 0.04 + (1 - mouse.y) * 0.22;
        const arr = [];
        for (let i = 0; i < N; i++) {
          const p = pts[i];
          const wob = 1 + Math.sin(p.phi * 3 + t * 0.018) * amp;
          const x = p.x * wob, y0 = p.y * wob, z = p.z * wob;
          const x1 = x * cosY - z * sinY;
          const z1 = x * sinY + z * cosY;
          const y1 = y0 * cosX - z1 * sinX;
          const z2 = y0 * sinX + z1 * cosX;
          arr.push([x1, y1, z2]);
        }
        arr.sort((a, b) => a[2] - b[2]);
        for (let i = 0; i < arr.length; i++) {
          const a = arr[i];
          const scale = fov / (fov - a[2]);
          const sx = cx + a[0] * R * scale;
          const sy = cy + a[1] * R * scale;
          const depth = (a[2] + 1) / 2;
          const size = (0.5 + depth * 1.8) * scale;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.3, size), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${color},${0.08 + depth * 0.46})`;
          ctx.fill();
        }
        t += 1;
        if (!reduce) this._raf = requestAnimationFrame(draw);
      };
      draw();
    }

    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      if (this._onMove) window.removeEventListener('pointermove', this._onMove);
      if (this._ro) this._ro.disconnect();
    }
  }

  customElements.define('dot-sphere', DotSphere);
})();
