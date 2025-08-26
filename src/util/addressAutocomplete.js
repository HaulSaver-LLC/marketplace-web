import { forwardGeocode } from './geocode';

export function attachAddressAutocomplete(inputEl, onSelect) {
  if (!inputEl) return;
  let panel = document.createElement('div');
  panel.style.cssText =
    'position:absolute;z-index:10;background:#fff;border:1px solid #e5e7eb;border-radius:8px;max-height:220px;overflow:auto;width:100%;display:none;';
  inputEl.parentNode.style.position = 'relative';
  inputEl.parentNode.appendChild(panel);

  let timer = null;

  inputEl.addEventListener('input', () => {
    const q = inputEl.value || '';
    clearTimeout(timer);
    if (q.length < 3) {
      panel.style.display = 'none';
      panel.innerHTML = '';
      return;
    }
    timer = setTimeout(async () => {
      const hits = await forwardGeocode(q);
      panel.innerHTML = '';
      hits.forEach(h => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = h.label;
        btn.style.cssText =
          'display:block;width:100%;text-align:left;padding:8px 12px;background:#fff;border:none;cursor:pointer;';
        btn.onmouseover = () => (btn.style.background = '#f9fafb');
        btn.onmouseout = () => (btn.style.background = '#fff');
        btn.onclick = () => {
          inputEl.value = h.label;
          panel.style.display = 'none';
          panel.innerHTML = '';
          onSelect && onSelect(h);
        };
        panel.appendChild(btn);
      });
      panel.style.display = hits.length ? 'block' : 'none';
    }, 250);
  });

  inputEl.addEventListener('focus', () => {
    if (panel.innerHTML) panel.style.display = 'block';
  });
  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== inputEl) panel.style.display = 'none';
  });

  return () => {
    panel.remove();
  }; // detach
}
