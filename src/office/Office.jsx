import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildRoom } from './room.js';
import { OVERVIEW, INSIDE, placeCamera, viewBounds, frame, boxCorners, smooth, clamp01 } from './framing.js';

// Scroll progress (0..1 across the tall .office section) -> how far we have walked in.
const enterOf = (p) => smooth(clamp01((p - 0.06) / 0.6));
const INSIDE_AT = 0.82; // labels and free exploration from here on
const mq = (q) => (typeof matchMedia === 'function' ? matchMedia(q) : { matches: false });

function Scene({ room, shared, labelEls, onHover, onPick, headingFrac, small }) {
  const { camera, size, invalidate } = useThree();
  const cur = useRef(null);
  const v = useMemo(() => new THREE.Vector3(), []);

  // Frusta for the three states, recomputed whenever the stage resizes.
  const frames = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    const roomPts = boxCorners(new THREE.Box3().setFromObject(room.world));
    const objPts = (key) => [...boxCorners(new THREE.Box3().setFromObject(room.interactives[key].group)), room.anchors[key]];
    const allObjPts = Object.keys(room.interactives).flatMap(objPts);
    const top = Math.min(0.55, headingFrac);
    const overview = frame(viewBounds(roomPts, OVERVIEW), aspect, small ? { x0: 0.03, x1: 0.97, y0: top, y1: 0.9 } : { x0: 0.08, x1: 0.92, y0: top, y1: 0.95 }, { align: small ? 0.15 : 0.5 });
    const inside = aspect >= 1
      ? frame(viewBounds(roomPts, INSIDE), aspect, { x0: 0.03, x1: 0.97, y0: 0.05, y1: 0.92 })
      : frame(viewBounds(allObjPts, INSIDE), aspect, small ? { x0: 0.05, x1: 0.95, y0: 0.14, y1: 0.8 } : { x0: 0.1, x1: 0.9, y0: 0.12, y1: 0.84 });
    const focus = {};
    const objFrame = frame(viewBounds(allObjPts, INSIDE), aspect, { x0: 0.1, x1: 0.9, y0: 0.12, y1: 0.84 });
    const insideHeight = objFrame.top - objFrame.bottom;
    for (const key of Object.keys(room.interactives)) {
      // Never zoom past ~68% of the inside view, so a focused object keeps its surroundings.
      focus[key] = frame(viewBounds(objPts(key), INSIDE), aspect, small ? { x0: 0.12, x1: 0.88, y0: 0.08, y1: 0.5 } : { x0: 0.08, x1: 0.54, y0: 0.16, y1: 0.84 }, { minHeight: insideHeight * 0.68 });
    }
    return { overview, inside, focus };
  }, [size.width, size.height, room, headingFrac, small]);

  useEffect(() => { invalidate(); }, [frames, invalidate]);

  useFrame((state, dt) => {
    const e = enterOf(shared.p);
    const sel = e > 0.5 ? shared.selected : '';
    const base = sel ? frames.focus[sel] : null;
    const lerp = THREE.MathUtils.lerp;
    const goal = {
      yaw: lerp(OVERVIEW.yaw, INSIDE.yaw, e) + shared.yawOffset,
      pitch: lerp(OVERVIEW.pitch, INSIDE.pitch, e),
      tx: lerp(OVERVIEW.target.x, INSIDE.target.x, e), ty: lerp(OVERVIEW.target.y, INSIDE.target.y, e), tz: lerp(OVERVIEW.target.z, INSIDE.target.z, e),
      left: base ? base.left : lerp(frames.overview.left, frames.inside.left, e),
      right: base ? base.right : lerp(frames.overview.right, frames.inside.right, e),
      top: base ? base.top : lerp(frames.overview.top, frames.inside.top, e),
      bottom: base ? base.bottom : lerp(frames.overview.bottom, frames.inside.bottom, e),
    };
    if (!cur.current) cur.current = { ...goal };
    const c = cur.current;
    const k = shared.reduced ? 1 : 1 - Math.exp(-Math.min(dt, 0.05) * 7);
    let delta = 0;
    for (const key of Object.keys(goal)) { const d = goal[key] - c[key]; c[key] += d * k; delta += Math.abs(d); }
    // Snap the last sub-pixel tail so rendering stops promptly once the camera is visually still.
    if (delta < 0.004) { Object.assign(c, goal); delta = 0; }

    placeCamera(camera, c.yaw, c.pitch, v.set(c.tx, c.ty, c.tz));
    camera.left = c.left; camera.right = c.right; camera.top = c.top; camera.bottom = c.bottom;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();

    // Hovered objects lift a little.
    let lifting = false;
    for (const [key, obj] of Object.entries(room.interactives)) {
      const dest = shared.hover === key || sel === key ? 0.08 : 0;
      obj.hover += (dest - obj.hover) * k;
      obj.group.position.y = obj.base + obj.hover;
      if (Math.abs(dest - obj.hover) > 0.001) lifting = true;
    }

    // Pin the HTML labels to their anchors, then nudge apart any that would overlap.
    const pins = [];
    for (const [key, el] of Object.entries(labelEls.current)) {
      if (!el) continue;
      v.copy(room.anchors[key]); v.y += room.interactives[key].hover; v.project(camera);
      const w = el.firstElementChild?.offsetWidth || 120, h = el.firstElementChild?.offsetHeight || 32;
      pins.push({ el, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, w, h });
    }
    for (let pass = 0; pass < 4; pass++) {
      pins.sort((a, b) => a.x - b.x);
      for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) {
        const a = pins[i], b = pins[j];
        if (Math.abs(a.y - b.y) >= (a.h + b.h) / 2 + 4) continue;
        const overlap = (a.w + b.w) / 2 + 8 - (b.x - a.x);
        if (overlap > 0) { a.x -= overlap / 2; b.x += overlap / 2; }
      }
    }
    for (const pin of pins) pin.el.style.transform = `translate3d(${pin.x}px, ${pin.y}px, 0)`;
    if (delta > 0.0005 || lifting) invalidate();
  });

  const dragged = () => shared.dragged;
  return (
    <>
      <primitive object={room.lights} />
      <primitive
        object={room.world}
        onPointerMove={(e) => { e.stopPropagation(); onHover(e.object.userData.officeKey || ''); }}
        onPointerOut={() => onHover('')}
        onClick={(e) => { if (dragged()) return; const key = e.object.userData.officeKey; if (key) { e.stopPropagation(); onPick(key); } }}
      />
    </>
  );
}

export default function Office({ data, section, root, heading }) {
  const shared = useRef({
    p: 0, yawOffset: 0, hover: '', selected: '', dragged: false, invalidate: () => {},
    reduced: mq('(prefers-reduced-motion: reduce)').matches, selectY: 0, pendingY: null,
  }).current;
  const room = useMemo(() => buildRoom({ onTexture: () => shared.invalidate() }), [shared]);
  const order = useMemo(() => data.spaces.map((s) => s.key), [data]);
  const labelEls = useRef({});
  const [inside, setInside] = useState(false);
  const [selected, setSelected] = useState('');
  const [hover, setHoverState] = useState('');
  const [headingFrac, setHeadingFrac] = useState(0.36);
  const [small, setSmall] = useState(() => mq('(max-width: 700px)').matches);
  const cardLink = useRef(null);

  const select = useCallback((key) => {
    if (key && shared.pendingY == null) shared.selectY = scrollY;
    shared.selected = key; setSelected(key); shared.invalidate();
  }, [shared]);
  const step = useCallback((dir) => {
    const i = order.indexOf(shared.selected) + dir;
    select(i < 0 || i >= order.length ? '' : order[i]); // past either end: back to the room
  }, [order, select, shared]);
  const onHover = useCallback((key) => {
    if (shared.hover === key) return;
    shared.hover = key; setHoverState(key); root.style.cursor = key ? 'pointer' : '';
    shared.invalidate();
  }, [shared, root]);

  // Clicking an object before we are inside walks in first, then focuses it.
  const onPick = useCallback((key) => {
    if (enterOf(shared.p) < 0.6) {
      const r = section.getBoundingClientRect();
      const y = window.scrollY + r.top + (section.offsetHeight - innerHeight) * 0.78;
      shared.pendingY = Math.round(y);
      window.scrollTo({ top: y, behavior: shared.reduced ? 'auto' : 'smooth' });
    }
    select(key);
  }, [section, select, shared]);

  // Scroll -> progress, hero fade (CSS variable), inside flag.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const stage = root.getBoundingClientRect();
      const hb = heading.getBoundingClientRect();
      const frac = (hb.bottom - stage.top) / Math.max(1, stage.height) + 0.02;
      setSmall(mq('(max-width: 700px)').matches);
      // The heading sits in the sticky stage, so its position is stable; only re-measure while it is visible.
      if (enterOf(shared.p) < 0.05) setHeadingFrac((old) => (Math.abs(frac - old) > 0.005 ? frac : old));
    };
    const update = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const span = Math.max(1, section.offsetHeight - innerHeight);
      shared.p = clamp01(-r.top / span);
      const e = enterOf(shared.p);
      section.style.setProperty('--enter', e.toFixed(3));
      const now = e > INSIDE_AT;
      setInside((was) => (was === now ? was : now));
      if (e < 0.5 && shared.selected) select('');
      // Arriving from the overview: wait for the smooth scroll to land before tracking movement.
      if (shared.pendingY != null && Math.abs(scrollY - shared.pendingY) < 4) { shared.pendingY = null; shared.selectY = scrollY; }
      // Touch scroll (wheel is intercepted below) while a card is open closes it and keeps scrolling.
      if (shared.selected && shared.pendingY == null && Math.abs(scrollY - shared.selectY) > 60) select('');
      shared.invalidate();
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { measure(); onScroll(); };
    measure(); update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, [section, root, heading, shared, select]);

  // Drag to look around (mouse: any drag; touch: horizontal only, so vertical scroll stays native).
  useEffect(() => {
    let down = null;
    const start = (ev) => { down = { x: ev.clientX, y: ev.clientY, yaw: shared.yawOffset, type: ev.pointerType }; shared.dragged = false; };
    const move = (ev) => {
      if (!down) return;
      const dx = ev.clientX - down.x, dy = ev.clientY - down.y;
      if (down.type !== 'mouse' && Math.abs(dx) < Math.abs(dy) * 1.3) return;
      if (Math.abs(dx) > 6) shared.dragged = true;
      if (shared.dragged) { shared.yawOffset = THREE.MathUtils.clamp(down.yaw - dx * 0.004, -0.42, 0.42); shared.invalidate(); }
    };
    const end = () => { down = null; setTimeout(() => { shared.dragged = false; }, 0); };
    root.addEventListener('pointerdown', start);
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    return () => { root.removeEventListener('pointerdown', start); removeEventListener('pointermove', move); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); };
  }, [root, shared]);

  // While a card is open the wheel browses objects instead of scrolling the page:
  // down = next, up = previous; past the last/first object returns to the room,
  // after which the wheel scrolls the page again. Trackpad momentum is debounced.
  useEffect(() => {
    let acc = 0, lockUntil = 0, idle = 0;
    const onWheel = (ev) => {
      if (!shared.selected || ev.ctrlKey) return;
      ev.preventDefault();
      const now = performance.now();
      clearTimeout(idle); idle = setTimeout(() => { acc = 0; }, 180);
      if (now < lockUntil) return;
      acc += ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
      if (Math.abs(acc) < 50) return;
      const dir = Math.sign(acc); acc = 0; lockUntil = now + 700;
      step(dir);
    };
    const onKey = (ev) => {
      if (!shared.selected) return;
      if (ev.key === 'Escape') select('');
      else if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); step(1); }
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); step(-1); }
    };
    addEventListener('wheel', onWheel, { passive: false });
    addEventListener('keydown', onKey);
    return () => { removeEventListener('wheel', onWheel); removeEventListener('keydown', onKey); clearTimeout(idle); };
  }, [select, step, shared]);
  useEffect(() => { if (selected) cardLink.current?.focus({ preventScroll: true }); }, [selected]);

  const space = data.spaces.find((s) => s.key === selected);
  return (
    <>
      <Canvas
        orthographic
        shadows="percentage"
        frameloop="demand"
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        camera={{ near: 0.1, far: 60, manual: true }}
        onCreated={(state) => { state.gl.setClearColor(0xf4f1e8, 0); state.camera.manual = true; shared.invalidate = state.invalidate; }}
        aria-hidden="true"
      >
        <Scene room={room} shared={shared} labelEls={labelEls} onHover={onHover} onPick={onPick} headingFrac={headingFrac} small={small} />
      </Canvas>
      <div className="office-labels" data-visible={inside && !selected ? 'true' : 'false'}>
        {data.spaces.map((s) => (
          <div key={s.key} className="office-label-pin" ref={(el) => { labelEls.current[s.key] = el; }}>
            <button
              type="button"
              className="office-label"
              data-hover={hover === s.key ? 'true' : undefined}
              tabIndex={inside && !selected ? 0 : -1}
              onClick={() => select(s.key)}
              onPointerEnter={() => onHover(s.key)}
              onPointerLeave={() => onHover('')}
            >
              <span aria-hidden="true">{s.icon}</span>{s.label}<small>{s.domain}</small>
            </button>
          </div>
        ))}
      </div>
      <p className="office-explore" data-visible={inside && !selected ? 'true' : 'false'}>{data.explore}</p>
      <aside className="office-card" data-open={space ? 'true' : 'false'} aria-hidden={space ? undefined : 'true'} aria-labelledby="office-card-title">
        {space && (
          <>
            <div className="office-card-top">
              <p className="office-card-domain"><span aria-hidden="true">{space.icon}</span> {space.domain}</p>
              <div className="office-card-nav">
                <button type="button" onClick={() => step(-1)} aria-label={data.prev} disabled={order.indexOf(space.key) === 0}>‹</button>
                <span aria-live="polite">{order.indexOf(space.key) + 1} / {order.length}</span>
                <button type="button" onClick={() => step(1)} aria-label={data.next} disabled={order.indexOf(space.key) === order.length - 1}>›</button>
              </div>
            </div>
            <h3 id="office-card-title">{space.name}</h3>
            <p>{space.description}</p>
            <div className="office-card-actions">
              <a ref={cardLink} className="office-card-go" href={space.url}>{data.visit} <span aria-hidden="true">↗</span></a>
              <button type="button" className="office-card-back" onClick={() => select('')}>← {data.back}</button>
            </div>
            <p className="office-card-hint">{data.wheelHint}</p>
          </>
        )}
      </aside>
    </>
  );
}
