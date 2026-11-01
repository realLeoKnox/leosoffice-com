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
    const inside = frame(viewBounds(allObjPts, INSIDE), aspect, small ? { x0: 0.05, x1: 0.95, y0: 0.14, y1: 0.8 } : { x0: 0.1, x1: 0.9, y0: 0.12, y1: 0.84 });
    const focus = {};
    const insideHeight = inside.top - inside.bottom;
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

    // Pin the HTML labels to their anchors.
    for (const [key, el] of Object.entries(labelEls.current)) {
      if (!el) continue;
      v.copy(room.anchors[key]); v.y += room.interactives[key].hover; v.project(camera);
      el.style.transform = `translate3d(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px, 0)`;
    }
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
  const room = useMemo(() => buildRoom(), []);
  const shared = useRef({
    p: 0, yawOffset: 0, hover: '', selected: '', dragged: false, invalidate: () => {},
    reduced: mq('(prefers-reduced-motion: reduce)').matches,
  }).current;
  const labelEls = useRef({});
  const [inside, setInside] = useState(false);
  const [selected, setSelected] = useState('');
  const [hover, setHoverState] = useState('');
  const [headingFrac, setHeadingFrac] = useState(0.36);
  const [small, setSmall] = useState(() => mq('(max-width: 700px)').matches);
  const cardLink = useRef(null);

  const select = useCallback((key) => { shared.selected = key; setSelected(key); shared.invalidate(); }, [shared]);
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

  // Escape closes the card; opening it moves focus to its link.
  useEffect(() => {
    const onKey = (ev) => { if (ev.key === 'Escape' && shared.selected) select(''); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [select, shared]);
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
          <button
            key={s.key}
            type="button"
            className="office-label"
            data-hover={hover === s.key ? 'true' : undefined}
            ref={(el) => { labelEls.current[s.key] = el; }}
            tabIndex={inside && !selected ? 0 : -1}
            onClick={() => select(s.key)}
            onPointerEnter={() => onHover(s.key)}
            onPointerLeave={() => onHover('')}
          >
            <span className="office-label-inner"><span aria-hidden="true">{s.icon}</span>{s.label}<small>{s.domain}</small></span>
          </button>
        ))}
      </div>
      <p className="office-explore" data-visible={inside && !selected ? 'true' : 'false'}>{data.explore}</p>
      <aside className="office-card" data-open={space ? 'true' : 'false'} aria-hidden={space ? undefined : 'true'} aria-labelledby="office-card-title">
        {space && (
          <>
            <p className="office-card-domain"><span aria-hidden="true">{space.icon}</span> {space.domain}</p>
            <h3 id="office-card-title">{space.name}</h3>
            <p>{space.description}</p>
            <div className="office-card-actions">
              <a ref={cardLink} className="office-card-go" href={space.url}>{data.visit} <span aria-hidden="true">↗</span></a>
              <button type="button" className="office-card-back" onClick={() => select('')}>← {data.back}</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
