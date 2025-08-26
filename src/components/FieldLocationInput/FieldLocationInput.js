import React, { useEffect, useRef, useState } from 'react';

const TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN; // pk.***

export default function FieldLocationInput({
  input,
  meta,
  label,
  placeholder = 'Search address',
  disabled,
}) {
  const [query, setQuery] = useState(input.value?.address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const close = e => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${TOKEN}&autocomplete=true&limit=5`;
        const res = await fetch(url, { signal: ctl.signal });
        const data = await res.json();
        const items = (data?.features || [])
          .map(f => ({
            id: f.id,
            address: f.place_name,
            lat: f.center?.[1],
            lng: f.center?.[0],
          }))
          .filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng));
        setSuggestions(items);
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query]);

  const select = s => {
    input.onChange({ address: s.address, lat: s.lat, lng: s.lng });
    setQuery(s.address);
    setOpen(false);
  };

  const error = meta.touched && meta.error;

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      {label && <label style={{ display: 'block', marginBottom: 6 }}>{label}</label>}
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => {
          setQuery(e.target.value);
          if (input.value?.address !== e.target.value) input.onChange(null);
        }}
        onFocus={() => suggestions.length && setOpen(true)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: error ? '1px solid #e11d48' : '1px solid #d1d5db',
        }}
      />
      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 10,
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: 240,
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {suggestions.map(s => (
            <li
              key={s.id}
              onMouseDown={e => e.preventDefault()}
              onClick={() => select(s)}
              style={{ padding: '10px 12px', cursor: 'pointer' }}
            >
              {s.address}
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <div style={{ color: '#e11d48', fontSize: 12, marginTop: 6 }}>{meta.error}</div>
      ) : null}
    </div>
  );
}
