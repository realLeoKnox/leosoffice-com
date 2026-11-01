import { Component } from 'react';
import { createRoot } from 'react-dom/client';
import Office from './Office.jsx';

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

// Turns the static hero into the scroll-driven 3D office. Falls back to the
// static illustration (already in the HTML) if anything goes wrong.
export function mountOffice(root) {
  const section = root.closest('.office');
  const heading = section.querySelector('.hero-heading');
  const data = JSON.parse(root.dataset.office);
  const fallback = root.querySelector('.room-fallback');
  const html = document.documentElement;
  const fail = () => {
    html.classList.remove('office-3d');
    root.dataset.unavailable = 'true';
    if (fallback && !root.contains(fallback)) root.append(fallback);
  };
  fallback?.remove();
  html.classList.add('office-3d');
  createRoot(root).render(
    <Boundary onFail={fail}>
      <Office data={data} section={section} root={root} heading={heading} />
    </Boundary>,
  );
  return fail;
}
