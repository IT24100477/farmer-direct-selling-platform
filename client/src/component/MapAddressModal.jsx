import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default marker icon paths when bundled with Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
});

const SRI_LANKA = [7.8731, 80.7718];
const DEFAULT_ZOOM = 8;

// ─── place a/update the marker on the Leaflet map ────────────────────────────
const placeMarker = (map, markerRef, lat, lng) => {
  if (markerRef.current) {
    markerRef.current.setLatLng([lat, lng]);
  } else {
    markerRef.current = L.marker([lat, lng]).addTo(map);
  }
};

const MapAddressModal = ({ open, onClose, onAddressSelect }) => {
  const mapContainerRef  = useRef(null);
  const leafletMapRef    = useRef(null);
  const markerRef        = useRef(null);
  const clickDebounceRef = useRef(null);  // debounce for map-click reverse-geocode
  const searchDebounceRef = useRef(null); // debounce for search input
  const searchWrapperRef  = useRef(null); // for click-outside detection

  // ── map / geocode state ───────────────────────────────────────────────────
  const [locating,  setLocating]  = useState(false); // waiting for GPS
  const [geocoding, setGeocoding] = useState(false); // waiting for Nominatim reverse
  const [fetchedAddress, setFetchedAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [locError, setLocError] = useState('');

  // ── search state ──────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false); // Nominatim /search in flight
  const [searchError,   setSearchError]   = useState('');
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [activeIndex,   setActiveIndex]   = useState(-1);   // keyboard highlight

  const loading = locating || geocoding;

  // ── reset everything when modal opens ────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    setFetchedAddress('');
    setSelectedCoords(null);
    setLocError('');
    setLocating(false);
    setGeocoding(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearching(false);
    setSearchError('');
    setShowDropdown(false);
    setActiveIndex(-1);

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }

      const map = L.map(mapContainerRef.current).setView(SRI_LANKA, DEFAULT_ZOOM);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      map.invalidateSize();
      leafletMapRef.current = map;

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setSelectedCoords({ lat, lng });
        placeMarker(map, markerRef, lat, lng);
        // close search dropdown if open
        setShowDropdown(false);
        clearTimeout(clickDebounceRef.current);
        clickDebounceRef.current = setTimeout(() => reverseGeocode(lat, lng), 500);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [open]);

  // ── destroy map on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      clearTimeout(clickDebounceRef.current);
      clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // ── close dropdown when clicking outside the search wrapper ──────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── reverse geocode (map click or GPS) ───────────────────────────────────
  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    setLocError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setFetchedAddress(data.display_name || '');
    } catch {
      setLocError('Could not fetch address. Please try again.');
      setFetchedAddress('');
    } finally {
      setGeocoding(false);
    }
  };

  // ── forward geocode (search bar) ──────────────────────────────────────────
  const searchPlaces = useCallback(async (query) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data);
      setShowDropdown(true);
      setActiveIndex(-1);
    } catch {
      setSearchError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // ── handle input change — debounce the search call ───────────────────────
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchError('');

    if (!value.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      clearTimeout(searchDebounceRef.current);
      return;
    }

    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => searchPlaces(value), 400);
  };

  // ── pick a result from the dropdown ──────────────────────────────────────
  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const map = leafletMapRef.current;
    if (!map) return;

    map.setView([lat, lng], 16);
    setSelectedCoords({ lat, lng });
    placeMarker(map, markerRef, lat, lng);

    // use the result's display_name directly — no need for a round-trip reverse call
    setFetchedAddress(result.display_name);
    setLocError('');

    // reset search UI
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  // ── keyboard navigation inside the dropdown ───────────────────────────────
  const handleSearchKeyDown = (e) => {
    if (!showDropdown || !searchResults.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && searchResults[activeIndex]) {
        handleSelectResult(searchResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // ── GPS location ──────────────────────────────────────────────────────────
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocError('');
    setFetchedAddress('');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude, accuracy } = coords;
        setLocating(false);

        const map = leafletMapRef.current;
        if (!map) return;

        const zoom = accuracy <= 50 ? 17 : accuracy <= 500 ? 15 : 13;
        map.setView([latitude, longitude], zoom);
        setSelectedCoords({ lat: latitude, lng: longitude });
        placeMarker(map, markerRef, latitude, longitude);
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        setLocating(false);
        const messages = {
          1: 'Location access was denied. Please allow location permission in your browser settings and try again.',
          2: 'Your position could not be determined. Check that location services are enabled on your device.',
          3: 'Location request timed out. Move to an area with better signal and try again.'
        };
        setLocError(messages[err.code] || 'Unable to retrieve your location.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // ── done ──────────────────────────────────────────────────────────────────
  const handleDone = () => {
    if (fetchedAddress && selectedCoords) {
      onAddressSelect(fetchedAddress, selectedCoords.lat, selectedCoords.lng);
    }
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f17]/60 px-4 backdrop-blur-sm map-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[#d2e4d8] bg-white shadow-2xl flex flex-col map-modal-panel">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#deeadf] flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-[#153a2b]">Select Delivery Location</h3>
            <p className="text-xs text-[#5e7a6a] mt-0.5">Search a place, click on the map, or use your GPS</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full w-8 h-8 flex items-center justify-center text-[#315744] hover:bg-[#f4faf6] transition text-lg leading-none"
            aria-label="Close map"
          >
            ✕
          </button>
        </div>

        {/* ── Search bar ── */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-[#eef4ef]" ref={searchWrapperRef}>
          <div className="relative">
            {/* Input */}
            <div className="relative flex items-center">
              {/* Search icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 h-4 w-4 text-[#94a8a0] pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>

              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search for a city, street or place…"
                className="w-full rounded-lg border border-[#c9ddcf] bg-white py-2.5 pl-9 pr-9 text-sm text-[#153a2b] outline-none transition placeholder:text-[#94a8a0] focus:border-[#1f7a4d] focus:ring-2 focus:ring-[#1f7a4d]/20"
                autoComplete="off"
              />

              {/* Spinner while searching */}
              {searching && (
                <svg
                  className="absolute right-3 h-4 w-4 animate-spin text-[#1f7a4d]"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}

              {/* Clear button */}
              {searchQuery && !searching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowDropdown(false);
                    setSearchError('');
                    clearTimeout(searchDebounceRef.current);
                  }}
                  className="absolute right-3 flex h-4 w-4 items-center justify-center rounded-full text-[#94a8a0] hover:text-[#315744] transition"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search error */}
            {searchError && (
              <p className="mt-1 text-xs text-red-500">{searchError}</p>
            )}

            {/* ── Dropdown results ── */}
            {showDropdown && searchResults.length > 0 && (
              <ul
                className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#d2e4d8] bg-white shadow-xl"
                role="listbox"
              >
                {searchResults.map((result, i) => {
                  const isActive = i === activeIndex;
                  // build a short type label (e.g. "city", "road", "suburb")
                  const typeLabel = result.type || result.class || '';
                  return (
                    <li
                      key={result.place_id}
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={() => handleSelectResult(result)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex cursor-pointer items-start gap-2.5 px-3 py-2.5 transition ${
                        isActive ? 'bg-[#edf5ef]' : 'hover:bg-[#f5faf6]'
                      }`}
                    >
                      {/* pin icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#1f7a4d]"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#153a2b]">
                          {result.display_name.split(',')[0]}
                        </p>
                        <p className="truncate text-xs text-[#5e7a6a]">
                          {result.display_name.split(',').slice(1).join(',').trim()}
                        </p>
                        {typeLabel && (
                          <span className="mt-0.5 inline-block rounded-full bg-[#ecf6ef] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#1f7a4d]">
                            {typeLabel}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* No results */}
            {showDropdown && !searching && searchResults.length === 0 && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full z-[1000] mt-1 rounded-xl border border-[#d2e4d8] bg-white px-4 py-3 shadow-xl text-sm text-[#94a8a0]">
                No places found for "<span className="font-medium text-[#315744]">{searchQuery}</span>".
              </div>
            )}
          </div>
        </div>

        {/* ── Map ── */}
        <div ref={mapContainerRef} style={{ height: '380px', width: '100%' }} />

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-[#deeadf] space-y-2 flex-shrink-0">
          {(locating || geocoding) && (
            <div className="flex items-center gap-2 text-sm text-[#5e7a6a]">
              <svg className="h-4 w-4 animate-spin text-[#1f7a4d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {locating ? 'Acquiring GPS position…' : 'Fetching address…'}
            </div>
          )}

          {locError && <p className="text-xs text-red-500">{locError}</p>}

          {fetchedAddress && !loading && (
            <div className="flex items-start gap-2 rounded-lg border border-[#deeadf] bg-[#f5faf6] px-3 py-2 text-sm text-[#153a2b]">
              <span className="mt-0.5 flex-shrink-0">📍</span>
              <span className="break-words">{fetchedAddress}</span>
            </div>
          )}

          {!fetchedAddress && !loading && !locError && (
            <p className="text-xs text-[#94a8a0]">No location selected yet — search above or click on the map.</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="flex items-center gap-1.5 rounded-lg border border-[#c7dccd] bg-white px-3 py-2 text-sm font-semibold text-[#315744] transition hover:bg-[#f4faf6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1f7a4d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
              </svg>
              Use My Location
            </button>
            <button
              type="button"
              onClick={handleDone}
              disabled={!fetchedAddress || loading}
              className="ml-auto btn px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapAddressModal;
