import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useTheme, THEMES } from './contexts/ThemeContext';
import {
  MATERIALS,
  SURFACE_TREATMENTS,
  BEARING_BAR_PROFILES,
  BEARING_BAR_SPACINGS,
  MESH_COMPATIBILITY,
  ANTI_SLIP_OPTIONS,
  NOSING_OPTIONS,
  STANDARD_TREAD_WIDTHS,
  COMMON_MESHES,
  MANUFACTURING_LIMITS,
  COLORS,
  VALIDATION_RULES,
  calculateGratingPrice,
  snapToGrid
} from './data/gratingData';

// ═══════════════════════════════════════════════════════════════════════════════
// VAKIO RITILÄT TAB
// ═══════════════════════════════════════════════════════════════════════════════
function StandardGratingsTab({ isFabOS, cart, setCart }) {
  // Vakiokoko: aina 6100 x 1000 mm
  const STANDARD_LENGTH = 6100;
  const STANDARD_WIDTH = 1000;

  const [config, setConfig] = useState({
    material: 'steel',
    surfaceTreatment: 'hot_dip_galvanized',
    bearingBarProfile: '30/3',
    bearingBarSpacing: 34.30,
    crossBarSpacing: 76.2,
    antiSlip: 'plain',
    edgeBanding: 'flat_bar',
    length: STANDARD_LENGTH,
    width: STANDARD_WIDTH,
    quantity: 1
  });

  const availableCrossBars = MESH_COMPATIBILITY[config.bearingBarSpacing] || [];

  const price = useMemo(() => calculateGratingPrice(config), [config]);

  const handleChange = (field, value) => {
    setConfig(prev => {
      const updated = { ...prev, [field]: value };

      // Jos kantoteräsjako muuttuu, tarkista sideteräsjako
      if (field === 'bearingBarSpacing') {
        const compatible = MESH_COMPATIBILITY[value] || [];
        if (!compatible.includes(updated.crossBarSpacing)) {
          updated.crossBarSpacing = compatible[0] || 76.2;
        }
      }

      return updated;
    });
  };

  const addToCart = () => {
    setCart(prev => [...prev, {
      type: 'grating',
      ...config,
      price,
      id: Date.now()
    }]);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Konfiguraattori */}
      <div className={`rounded-2xl p-6 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
          Konfiguroi ritiläpaneeli
        </h3>

        <div className="space-y-4">
          {/* Materiaali */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Materiaali
            </label>
            <select
              value={config.material}
              onChange={e => handleChange('material', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg ${isFabOS
                ? 'bg-gray-50 border border-gray-200 text-gray-900'
                : 'bg-slate-700 border border-slate-600 text-white'}`}
            >
              {MATERIALS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Pintakäsittely */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Pintakäsittely
            </label>
            <select
              value={config.surfaceTreatment}
              onChange={e => handleChange('surfaceTreatment', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg ${isFabOS
                ? 'bg-gray-50 border border-gray-200 text-gray-900'
                : 'bg-slate-700 border border-slate-600 text-white'}`}
            >
              {SURFACE_TREATMENTS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Kantoteräs */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Kantoteräs (korkeus/paksuus)
            </label>
            <select
              value={config.bearingBarProfile}
              onChange={e => handleChange('bearingBarProfile', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg ${isFabOS
                ? 'bg-gray-50 border border-gray-200 text-gray-900'
                : 'bg-slate-700 border border-slate-600 text-white'}`}
            >
              {BEARING_BAR_PROFILES.map(p => (
                <option key={p.code} value={p.code}>{p.code} mm</option>
              ))}
            </select>
          </div>

          {/* Silmäkoko */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                Kantoteräsjako
              </label>
              <select
                value={config.bearingBarSpacing}
                onChange={e => handleChange('bearingBarSpacing', parseFloat(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg ${isFabOS
                  ? 'bg-gray-50 border border-gray-200 text-gray-900'
                  : 'bg-slate-700 border border-slate-600 text-white'}`}
              >
                {BEARING_BAR_SPACINGS.map(s => (
                  <option key={s} value={s}>{s} mm</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                Sideteräsjako
              </label>
              <select
                value={config.crossBarSpacing}
                onChange={e => handleChange('crossBarSpacing', parseFloat(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg ${isFabOS
                  ? 'bg-gray-50 border border-gray-200 text-gray-900'
                  : 'bg-slate-700 border border-slate-600 text-white'}`}
              >
                {availableCrossBars.map(s => (
                  <option key={s} value={s}>{s} mm</option>
                ))}
              </select>
            </div>
          </div>

          {/* Liukuturva */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Liukuturva
            </label>
            <div className="flex gap-2">
              {ANTI_SLIP_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleChange('antiSlip', opt.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    config.antiSlip === opt.id
                      ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'
                      : isFabOS ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Vakiokoko (ei muokattavissa) */}
          <div className={`p-3 rounded-lg ${isFabOS ? 'bg-gray-100' : 'bg-slate-700/50'}`}>
            <label className={`block text-sm font-medium mb-2 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Vakiokoko
            </label>
            <div className={`text-lg font-mono font-bold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
              {STANDARD_LENGTH} x {STANDARD_WIDTH} mm
            </div>
            <p className={`text-xs mt-1 ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
              Räätälöidyt mitat: valitse "Oma geometria" -välilehti
            </p>
          </div>

          {/* Määrä */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Määrä (kpl)
            </label>
            <input
              type="number"
              value={config.quantity}
              onChange={e => handleChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
              className={`w-full px-3 py-2 rounded-lg ${isFabOS
                ? 'bg-gray-50 border border-gray-200 text-gray-900'
                : 'bg-slate-700 border border-slate-600 text-white'}`}
            />
          </div>
        </div>

        {/* Hinta ja tilaus */}
        <div className={`mt-6 pt-4 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex justify-between items-center mb-4">
            <span className={`text-sm ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>Yhteensä</span>
            <span className={`text-2xl font-bold ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {price.toFixed(2)} €
            </span>
          </div>
          <button
            onClick={addToCart}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${isFabOS
              ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white'}`}
          >
            Lisää ostoskoriin
          </button>
        </div>
      </div>

      {/* Esikatselupaneeli */}
      <div className={`rounded-2xl p-6 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
          Esikatselu
        </h3>

        <GratingPreview
          config={config}
          isFabOS={isFabOS}
        />

        {/* Tekniset tiedot */}
        <div className={`mt-4 p-4 rounded-lg ${isFabOS ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
          <h4 className={`text-sm font-semibold mb-2 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
            Tekniset tiedot
          </h4>
          <div className={`text-xs space-y-1 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
            <p>Silmäkoko: {config.bearingBarSpacing} x {config.crossBarSpacing} mm</p>
            <p>Pinta-ala: {((config.length / 1000) * (config.width / 1000)).toFixed(3)} m²</p>
            <p>Kantoteräksiä: ~{Math.floor(config.width / config.bearingBarSpacing) + 1} kpl</p>
            <p>Sideteräksiä: ~{Math.floor(config.length / config.crossBarSpacing) + 1} kpl</p>
          </div>
        </div>

        {/* Yleiset silmäkoot */}
        <div className="mt-4">
          <h4 className={`text-sm font-semibold mb-2 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
            Suositellut silmäkoot
          </h4>
          <div className="flex flex-wrap gap-2">
            {COMMON_MESHES.map(mesh => (
              <button
                key={mesh.code}
                onClick={() => {
                  handleChange('bearingBarSpacing', mesh.bearingBar);
                  setTimeout(() => handleChange('crossBarSpacing', mesh.crossBar), 0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  config.bearingBarSpacing === mesh.bearingBar && config.crossBarSpacing === mesh.crossBar
                    ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'
                    : isFabOS ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title={mesh.note}
              >
                {mesh.code}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VAKIO ASKELMAT TAB
// ═══════════════════════════════════════════════════════════════════════════════
function StandardTreadsTab({ isFabOS, cart, setCart }) {
  const [treadConfig, setTreadConfig] = useState({
    material: 'steel',
    surfaceTreatment: 'hot_dip_galvanized',
    width: 270,
    length: 800,
    nosing: 'ls_nosing',
    quantity: 1
  });

  const selectedWidth = STANDARD_TREAD_WIDTHS.find(w => w.width === treadConfig.width);

  const price = useMemo(() => {
    const mat = MATERIALS.find(m => m.id === treadConfig.material);
    const surf = SURFACE_TREATMENTS.find(s => s.id === treadConfig.surfaceTreatment);
    const basePrice = 45; // €/kpl perus
    return basePrice * (mat?.priceMultiplier || 1) * (surf?.priceMultiplier || 1) * (treadConfig.length / 800) * treadConfig.quantity;
  }, [treadConfig]);

  const addToCart = () => {
    setCart(prev => [...prev, {
      type: 'tread',
      treadType: 'straight',
      ...treadConfig,
      price,
      id: Date.now()
    }]);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Askelmien konfiguraattori */}
      <div className={`rounded-2xl p-6 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
          Porrasaskelma
        </h3>
            <p className={`text-sm mb-4 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
              Vakiosilmäkoko 34 x 76 mm, LS-liukastumisestolista
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                    Materiaali
                  </label>
                  <select
                    value={treadConfig.material}
                    onChange={e => setTreadConfig(prev => ({ ...prev, material: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${isFabOS
                      ? 'bg-gray-50 border border-gray-200 text-gray-900'
                      : 'bg-slate-700 border border-slate-600 text-white'}`}
                  >
                    {MATERIALS.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                    Pintakäsittely
                  </label>
                  <select
                    value={treadConfig.surfaceTreatment}
                    onChange={e => setTreadConfig(prev => ({ ...prev, surfaceTreatment: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg text-sm ${isFabOS
                      ? 'bg-gray-50 border border-gray-200 text-gray-900'
                      : 'bg-slate-700 border border-slate-600 text-white'}`}
                  >
                    {SURFACE_TREATMENTS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                  Askelman syvyys (leveys)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {STANDARD_TREAD_WIDTHS.map(w => (
                    <button
                      key={w.width}
                      onClick={() => setTreadConfig(prev => ({ ...prev, width: w.width }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                        treadConfig.width === w.width
                          ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'
                          : isFabOS ? 'bg-gray-100 text-gray-700' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {w.width} mm
                    </button>
                  ))}
                </div>
                {selectedWidth && (
                  <p className={`text-xs mt-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
                    Porausväli: {selectedWidth.drillDistance} mm
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                  Pituus (mm)
                </label>
                <input
                  type="number"
                  value={treadConfig.length}
                  onChange={e => setTreadConfig(prev => ({ ...prev, length: Math.max(400, parseInt(e.target.value) || 400) }))}
                  min={400}
                  step={100}
                  className={`w-full px-3 py-2 rounded-lg ${isFabOS
                    ? 'bg-gray-50 border border-gray-200 text-gray-900'
                    : 'bg-slate-700 border border-slate-600 text-white'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                  Turvanokka
                </label>
                <div className="space-y-2">
                  {NOSING_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setTreadConfig(prev => ({ ...prev, nosing: opt.id }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        treadConfig.nosing === opt.id
                          ? isFabOS ? 'bg-[#FF6B35]/10 border-2 border-[#FF6B35]' : 'bg-emerald-500/10 border-2 border-emerald-500'
                          : isFabOS ? 'bg-gray-50 border border-gray-200' : 'bg-slate-700 border border-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        treadConfig.nosing === opt.id
                          ? isFabOS ? 'border-[#FF6B35]' : 'border-emerald-500'
                          : isFabOS ? 'border-gray-300' : 'border-slate-500'
                      }`}>
                        {treadConfig.nosing === opt.id && (
                          <div className={`w-2 h-2 rounded-full ${isFabOS ? 'bg-[#FF6B35]' : 'bg-emerald-500'}`} />
                        )}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isFabOS ? 'text-gray-900' : 'text-white'}`}>{opt.name}</div>
                        {opt.slipClass && (
                          <div className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                            Liukuturvaluokka: {opt.slipClass}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                  Määrä (kpl)
                </label>
                <input
                  type="number"
                  value={treadConfig.quantity}
                  onChange={e => setTreadConfig(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                  min={1}
                  className={`w-full px-3 py-2 rounded-lg ${isFabOS
                    ? 'bg-gray-50 border border-gray-200 text-gray-900'
                    : 'bg-slate-700 border border-slate-600 text-white'}`}
                />
              </div>
            </div>

        <div className={`mt-6 pt-4 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex justify-between items-center mb-4">
            <span className={`text-sm ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>Yhteensä</span>
            <span className={`text-2xl font-bold ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {price.toFixed(2)} €
            </span>
          </div>
          <button
            onClick={addToCart}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${isFabOS
              ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white'}`}
          >
            Lisää ostoskoriin
          </button>
        </div>
      </div>

      {/* Askelman esikatselu */}
      <div className={`rounded-2xl p-6 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
          Esikatselu
        </h3>
        <TreadPreview config={treadConfig} isFabOS={isFabOS} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OMA GEOMETRIA TAB (Piirtotyökalu)
// ═══════════════════════════════════════════════════════════════════════════════
function CustomGeometryTab({ isFabOS, cart, setCart }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [config, setConfig] = useState({
    material: 'steel',
    surfaceTreatment: 'hot_dip_galvanized',
    bearingBarProfile: '30/3',
    bearingBarSpacing: 34.30,
    crossBarSpacing: 76.2,
    bearingBarDirection: 'length', // 'length' tai 'width'
    antiSlip: 'plain',
    edgeBanding: 'flat_bar',
    length: 600,
    width: 400
  });

  const [cutouts, setCutouts] = useState([]);
  const [selectedCutout, setSelectedCutout] = useState(null);
  const [tool, setTool] = useState('select'); // 'select', 'rectangle', 'circle', 'corner'
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentDraw, setCurrentDraw] = useState(null);

  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 50, y: 50 });

  const scale = zoom;
  const availableCrossBars = MESH_COMPATIBILITY[config.bearingBarSpacing] || [];

  // Hintalaskelma
  const price = useMemo(() => {
    let base = calculateGratingPrice(config);
    // Lisää leikkausten hinta (yksinkertaistettu)
    base += cutouts.length * 15;
    return base;
  }, [config, cutouts]);

  const handleConfigChange = (field, value) => {
    setConfig(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'bearingBarSpacing') {
        const compatible = MESH_COMPATIBILITY[value] || [];
        if (!compatible.includes(updated.crossBarSpacing)) {
          updated.crossBarSpacing = compatible[0] || 76.2;
        }
      }
      return updated;
    });
  };

  // Snap-funktio kantoteräksen suuntaan
  const snapValue = useCallback((value, direction) => {
    if (config.bearingBarDirection === direction) {
      // Kantoteräksen suunnassa snap
      return snapToGrid(value, config.bearingBarSpacing);
    }
    // Sideteräksen suunnassa vapaa
    return Math.round(value);
  }, [config.bearingBarSpacing, config.bearingBarDirection]);

  const getMousePos = useCallback((e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - pan.x;
    const y = (e.clientY - rect.top) / scale - pan.y;
    return { x, y };
  }, [scale, pan]);

  const handleMouseDown = useCallback((e) => {
    if (tool === 'select') return;

    const pos = getMousePos(e);
    setIsDrawing(true);
    setDrawStart(pos);

    if (tool === 'circle') {
      // Ympyrälle: centerX, centerY, radius
      setCurrentDraw({ centerX: pos.x, centerY: pos.y, radius: 0, type: tool });
    } else {
      setCurrentDraw({ x: pos.x, y: pos.y, width: 0, height: 0, type: tool });
    }
  }, [tool, getMousePos]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || !drawStart) return;

    const pos = getMousePos(e);

    if (tool === 'circle') {
      // Ympyrä: laske säde alkupisteestä
      const dx = pos.x - drawStart.x;
      const dy = pos.y - drawStart.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      // Snap radius kantoteräksen suuntaan
      const snappedRadius = snapValue(radius, config.bearingBarDirection);

      setCurrentDraw({
        centerX: drawStart.x,
        centerY: drawStart.y,
        radius: snappedRadius,
        type: tool
      });
    } else {
      // Suorakulmio: leveys ja korkeus
      let width = pos.x - drawStart.x;
      let height = pos.y - drawStart.y;

      // Snap-logiikka
      const snappedWidth = snapValue(Math.abs(width), 'width');
      const snappedHeight = snapValue(Math.abs(height), 'length');

      setCurrentDraw({
        x: width >= 0 ? drawStart.x : drawStart.x - snappedWidth,
        y: height >= 0 ? drawStart.y : drawStart.y - snappedHeight,
        width: snappedWidth,
        height: snappedHeight,
        type: tool
      });
    }
  }, [isDrawing, drawStart, getMousePos, snapValue, tool, config.bearingBarDirection]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentDraw) {
      setIsDrawing(false);
      return;
    }

    // Validoi minimikoko
    if (currentDraw.type === 'circle') {
      // Ympyrä: tarkista säde
      if (currentDraw.radius >= VALIDATION_RULES.minCutSize / 2) {
        setCutouts(prev => [...prev, {
          ...currentDraw,
          id: Date.now(),
          edgeFinish: 'open'
        }]);
      }
    } else {
      // Suorakulmio: tarkista leveys ja korkeus
      if (currentDraw.width >= VALIDATION_RULES.minCutSize &&
          currentDraw.height >= VALIDATION_RULES.minCutSize) {
        setCutouts(prev => [...prev, {
          ...currentDraw,
          id: Date.now(),
          edgeFinish: 'open'
        }]);
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);
  }, [isDrawing, currentDraw]);

  const deleteCutout = (id) => {
    setCutouts(prev => prev.filter(c => c.id !== id));
    setSelectedCutout(null);
  };

  const toggleEdgeFinish = (id) => {
    setCutouts(prev => prev.map(c =>
      c.id === id ? { ...c, edgeFinish: c.edgeFinish === 'open' ? 'banded' : 'open' } : c
    ));
  };

  // Laske leikkauksen mitat suhteessa ritilään
  const getCutoutDimensions = useCallback((cutout) => {
    if (cutout.type === 'circle') {
      const diameter = cutout.radius * 2;
      return {
        type: 'circle',
        diameter,
        centerX: cutout.centerX,
        centerY: cutout.centerY,
        fromLeft: cutout.centerX,
        fromTop: cutout.centerY,
        fromRight: config.length - cutout.centerX,
        fromBottom: config.width - cutout.centerY
      };
    } else {
      return {
        type: 'rectangle',
        width: cutout.width,
        height: cutout.height,
        x: cutout.x,
        y: cutout.y,
        fromLeft: cutout.x,
        fromTop: cutout.y,
        fromRight: config.length - (cutout.x + cutout.width),
        fromBottom: config.width - (cutout.y + cutout.height)
      };
    }
  }, [config.length, config.width]);

  // Päivitä leikkaus parametrien perusteella
  const updateCutoutFromDimensions = useCallback((cutoutId, newDims) => {
    setCutouts(prev => prev.map(cutout => {
      if (cutout.id !== cutoutId) return cutout;

      if (cutout.type === 'circle') {
        let newCenterX = cutout.centerX;
        let newCenterY = cutout.centerY;
        let newRadius = cutout.radius;

        // Päivitä halkaisija
        if (newDims.diameter !== undefined) {
          newRadius = Math.max(VALIDATION_RULES.minCutSize / 2, newDims.diameter / 2);
        }

        // Päivitä sijainti reunoista
        if (newDims.fromLeft !== undefined) {
          newCenterX = Math.max(newRadius, Math.min(config.length - newRadius, newDims.fromLeft));
        }
        if (newDims.fromTop !== undefined) {
          newCenterY = Math.max(newRadius, Math.min(config.width - newRadius, newDims.fromTop));
        }
        if (newDims.fromRight !== undefined) {
          newCenterX = Math.max(newRadius, Math.min(config.length - newRadius, config.length - newDims.fromRight));
        }
        if (newDims.fromBottom !== undefined) {
          newCenterY = Math.max(newRadius, Math.min(config.width - newRadius, config.width - newDims.fromBottom));
        }

        return { ...cutout, centerX: newCenterX, centerY: newCenterY, radius: newRadius };
      } else {
        let newX = cutout.x;
        let newY = cutout.y;
        let newWidth = cutout.width;
        let newHeight = cutout.height;

        // Päivitä koko
        if (newDims.width !== undefined) {
          newWidth = Math.max(VALIDATION_RULES.minCutSize, newDims.width);
        }
        if (newDims.height !== undefined) {
          newHeight = Math.max(VALIDATION_RULES.minCutSize, newDims.height);
        }

        // Päivitä sijainti reunoista
        if (newDims.fromLeft !== undefined) {
          newX = Math.max(0, Math.min(config.length - newWidth, newDims.fromLeft));
        }
        if (newDims.fromTop !== undefined) {
          newY = Math.max(0, Math.min(config.width - newHeight, newDims.fromTop));
        }
        if (newDims.fromRight !== undefined) {
          newX = Math.max(0, Math.min(config.length - newWidth, config.length - newDims.fromRight - newWidth));
        }
        if (newDims.fromBottom !== undefined) {
          newY = Math.max(0, Math.min(config.width - newHeight, config.width - newDims.fromBottom - newHeight));
        }

        return { ...cutout, x: newX, y: newY, width: newWidth, height: newHeight };
      }
    }));
  }, [config.length, config.width]);

  // Valitun leikkauksen tiedot
  const selectedCutoutData = useMemo(() => {
    if (selectedCutout === null) return null;
    const cutout = cutouts.find(c => c.id === selectedCutout);
    if (!cutout) return null;
    return {
      cutout,
      dims: getCutoutDimensions(cutout)
    };
  }, [selectedCutout, cutouts, getCutoutDimensions]);

  const addToCart = () => {
    setCart(prev => [...prev, {
      type: 'custom_grating',
      ...config,
      cutouts,
      price,
      id: Date.now()
    }]);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Canvas */}
      <div className={`lg:col-span-2 rounded-2xl overflow-hidden ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
        {/* Toolbar */}
        <div className={`px-4 py-2 border-b flex items-center justify-between ${isFabOS ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-slate-700'}`}>
          <div className="flex gap-1">
            {[
              { id: 'select', icon: '↖', label: 'Valitse' },
              { id: 'rectangle', icon: '▭', label: 'Suorakaide' },
              { id: 'circle', icon: '○', label: 'Ympyrä' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`px-3 py-1.5 rounded text-sm transition-all ${
                  tool === t.id
                    ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'
                    : isFabOS ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
              className={`px-2 py-1 rounded ${isFabOS ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              −
            </button>
            <span className={`text-xs font-mono w-12 text-center ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className={`px-2 py-1 rounded ${isFabOS ? 'bg-white text-gray-700 hover:bg-gray-100' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              +
            </button>
          </div>
        </div>

        {/* SVG Canvas */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{ height: '500px', cursor: tool === 'select' ? 'default' : 'crosshair' }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ background: isFabOS ? '#f8fafc' : '#0f172a' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <g transform={`scale(${scale}) translate(${pan.x}, ${pan.y})`}>
              {/* Grid */}
              <defs>
                <pattern id="smallGrid" width={config.bearingBarSpacing} height={config.crossBarSpacing} patternUnits="userSpaceOnUse">
                  <path
                    d={`M ${config.bearingBarSpacing} 0 L 0 0 0 ${config.crossBarSpacing}`}
                    fill="none"
                    stroke={isFabOS ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>

              {/* Ritilän pohja */}
              <rect
                x={0}
                y={0}
                width={config.length}
                height={config.width}
                fill="url(#smallGrid)"
                stroke={COLORS.edgeBanding2D}
                strokeWidth={3}
              />

              {/* Kantoteräkset */}
              {config.bearingBarDirection === 'length' ? (
                // Kantoteräs kulkee pituussuunnassa (pystyviivat)
                Array.from({ length: Math.floor(config.width / config.bearingBarSpacing) + 1 }).map((_, i) => {
                  const y = i * config.bearingBarSpacing;
                  if (y > config.width) return null;
                  return (
                    <line
                      key={`bb-${i}`}
                      x1={0}
                      y1={y}
                      x2={config.length}
                      y2={y}
                      stroke={COLORS.bearingBar2D}
                      strokeWidth={2}
                    />
                  );
                })
              ) : (
                // Kantoteräs kulkee leveyssuunnassa (vaakaviivat)
                Array.from({ length: Math.floor(config.length / config.bearingBarSpacing) + 1 }).map((_, i) => {
                  const x = i * config.bearingBarSpacing;
                  if (x > config.length) return null;
                  return (
                    <line
                      key={`bb-${i}`}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={config.width}
                      stroke={COLORS.bearingBar2D}
                      strokeWidth={2}
                    />
                  );
                })
              )}

              {/* Sideteräkset */}
              {config.bearingBarDirection === 'length' ? (
                // Sideteräs kulkee leveyssuunnassa
                Array.from({ length: Math.floor(config.length / config.crossBarSpacing) + 1 }).map((_, i) => {
                  const x = i * config.crossBarSpacing;
                  if (x > config.length) return null;
                  return (
                    <line
                      key={`cb-${i}`}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={config.width}
                      stroke={COLORS.crossBar2D}
                      strokeWidth={1}
                    />
                  );
                })
              ) : (
                // Sideteräs kulkee pituussuunnassa
                Array.from({ length: Math.floor(config.width / config.crossBarSpacing) + 1 }).map((_, i) => {
                  const y = i * config.crossBarSpacing;
                  if (y > config.width) return null;
                  return (
                    <line
                      key={`cb-${i}`}
                      x1={0}
                      y1={y}
                      x2={config.length}
                      y2={y}
                      stroke={COLORS.crossBar2D}
                      strokeWidth={1}
                    />
                  );
                })
              )}

              {/* Leikkaukset */}
              {cutouts.map(cutout => (
                <g key={cutout.id}>
                  {cutout.type === 'rectangle' && (
                    <rect
                      x={cutout.x}
                      y={cutout.y}
                      width={cutout.width}
                      height={cutout.height}
                      fill={isFabOS ? '#f8fafc' : '#0f172a'}
                      stroke={cutout.edgeFinish === 'open' ? COLORS.cutEdgeOpen2D : COLORS.cutEdgeBanded2D}
                      strokeWidth={cutout.edgeFinish === 'open' ? 3 : 2}
                      strokeDasharray={cutout.edgeFinish === 'open' ? '5,5' : 'none'}
                      onClick={() => setSelectedCutout(cutout.id)}
                      className="cursor-pointer"
                    />
                  )}
                  {cutout.type === 'circle' && (
                    <circle
                      cx={cutout.centerX}
                      cy={cutout.centerY}
                      r={cutout.radius}
                      fill={isFabOS ? '#f8fafc' : '#0f172a'}
                      stroke={cutout.edgeFinish === 'open' ? COLORS.cutEdgeOpen2D : COLORS.cutEdgeBanded2D}
                      strokeWidth={cutout.edgeFinish === 'open' ? 3 : 2}
                      strokeDasharray={cutout.edgeFinish === 'open' ? '5,5' : 'none'}
                      onClick={() => setSelectedCutout(cutout.id)}
                      className="cursor-pointer"
                    />
                  )}
                </g>
              ))}

              {/* Piirrettävä leikkaus */}
              {currentDraw && currentDraw.type === 'circle' && (
                <circle
                  cx={currentDraw.centerX}
                  cy={currentDraw.centerY}
                  r={currentDraw.radius}
                  fill="rgba(237, 137, 54, 0.2)"
                  stroke={COLORS.cutEdgeOpen2D}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}
              {currentDraw && currentDraw.type === 'rectangle' && (
                <rect
                  x={currentDraw.x}
                  y={currentDraw.y}
                  width={currentDraw.width}
                  height={currentDraw.height}
                  fill="rgba(237, 137, 54, 0.2)"
                  stroke={COLORS.cutEdgeOpen2D}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              )}

              {/* Mitat */}
              <text x={config.length / 2} y={-15} textAnchor="middle" fill={isFabOS ? '#374151' : '#94a3b8'} fontSize="12">
                {config.length} mm
              </text>
              <text x={-15} y={config.width / 2} textAnchor="middle" fill={isFabOS ? '#374151' : '#94a3b8'} fontSize="12" transform={`rotate(-90, -15, ${config.width / 2})`}>
                {config.width} mm
              </text>

              {/* Valitun leikkauksen mitoitusviivat */}
              {selectedCutoutData && (
                <g className="dimension-lines">
                  {selectedCutoutData.cutout.type === 'circle' ? (
                    <>
                      {/* Ympyrän keskipiste */}
                      <circle
                        cx={selectedCutoutData.cutout.centerX}
                        cy={selectedCutoutData.cutout.centerY}
                        r={4}
                        fill={isFabOS ? '#FF6B35' : '#22c55e'}
                      />

                      {/* Etäisyys vasemmasta */}
                      <line
                        x1={0}
                        y1={selectedCutoutData.cutout.centerY}
                        x2={selectedCutoutData.cutout.centerX - selectedCutoutData.cutout.radius}
                        y2={selectedCutoutData.cutout.centerY}
                        stroke={isFabOS ? '#FF6B35' : '#22c55e'}
                        strokeWidth={1.5}
                        strokeDasharray="4,2"
                      />
                      <text
                        x={selectedCutoutData.dims.fromLeft / 2}
                        y={selectedCutoutData.cutout.centerY - 8}
                        textAnchor="middle"
                        fill={isFabOS ? '#FF6B35' : '#22c55e'}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {selectedCutoutData.dims.fromLeft.toFixed(0)}
                      </text>

                      {/* Etäisyys ylhäältä */}
                      <line
                        x1={selectedCutoutData.cutout.centerX}
                        y1={0}
                        x2={selectedCutoutData.cutout.centerX}
                        y2={selectedCutoutData.cutout.centerY - selectedCutoutData.cutout.radius}
                        stroke={isFabOS ? '#FF6B35' : '#22c55e'}
                        strokeWidth={1.5}
                        strokeDasharray="4,2"
                      />
                      <text
                        x={selectedCutoutData.cutout.centerX + 8}
                        y={selectedCutoutData.dims.fromTop / 2}
                        textAnchor="start"
                        fill={isFabOS ? '#FF6B35' : '#22c55e'}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {selectedCutoutData.dims.fromTop.toFixed(0)}
                      </text>

                      {/* Halkaisija */}
                      <line
                        x1={selectedCutoutData.cutout.centerX - selectedCutoutData.cutout.radius}
                        y1={selectedCutoutData.cutout.centerY}
                        x2={selectedCutoutData.cutout.centerX + selectedCutoutData.cutout.radius}
                        y2={selectedCutoutData.cutout.centerY}
                        stroke={isFabOS ? '#f59e0b' : '#f59e0b'}
                        strokeWidth={2}
                      />
                      <text
                        x={selectedCutoutData.cutout.centerX}
                        y={selectedCutoutData.cutout.centerY + selectedCutoutData.cutout.radius + 15}
                        textAnchor="middle"
                        fill={isFabOS ? '#f59e0b' : '#f59e0b'}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        ⌀{selectedCutoutData.dims.diameter.toFixed(0)}
                      </text>
                    </>
                  ) : (
                    <>
                      {/* Suorakaiteen kulmat */}
                      <rect
                        x={selectedCutoutData.cutout.x - 2}
                        y={selectedCutoutData.cutout.y - 2}
                        width={selectedCutoutData.cutout.width + 4}
                        height={selectedCutoutData.cutout.height + 4}
                        fill="none"
                        stroke={isFabOS ? '#FF6B35' : '#22c55e'}
                        strokeWidth={2}
                      />

                      {/* Etäisyys vasemmasta */}
                      <line
                        x1={0}
                        y1={selectedCutoutData.cutout.y + selectedCutoutData.cutout.height / 2}
                        x2={selectedCutoutData.cutout.x}
                        y2={selectedCutoutData.cutout.y + selectedCutoutData.cutout.height / 2}
                        stroke={isFabOS ? '#FF6B35' : '#22c55e'}
                        strokeWidth={1.5}
                        strokeDasharray="4,2"
                      />
                      <text
                        x={selectedCutoutData.dims.fromLeft / 2}
                        y={selectedCutoutData.cutout.y + selectedCutoutData.cutout.height / 2 - 8}
                        textAnchor="middle"
                        fill={isFabOS ? '#FF6B35' : '#22c55e'}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {selectedCutoutData.dims.fromLeft.toFixed(0)}
                      </text>

                      {/* Etäisyys ylhäältä */}
                      <line
                        x1={selectedCutoutData.cutout.x + selectedCutoutData.cutout.width / 2}
                        y1={0}
                        x2={selectedCutoutData.cutout.x + selectedCutoutData.cutout.width / 2}
                        y2={selectedCutoutData.cutout.y}
                        stroke={isFabOS ? '#FF6B35' : '#22c55e'}
                        strokeWidth={1.5}
                        strokeDasharray="4,2"
                      />
                      <text
                        x={selectedCutoutData.cutout.x + selectedCutoutData.cutout.width / 2 + 8}
                        y={selectedCutoutData.dims.fromTop / 2}
                        textAnchor="start"
                        fill={isFabOS ? '#FF6B35' : '#22c55e'}
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {selectedCutoutData.dims.fromTop.toFixed(0)}
                      </text>

                      {/* Leveys */}
                      <line
                        x1={selectedCutoutData.cutout.x}
                        y1={selectedCutoutData.cutout.y + selectedCutoutData.cutout.height + 12}
                        x2={selectedCutoutData.cutout.x + selectedCutoutData.cutout.width}
                        y2={selectedCutoutData.cutout.y + selectedCutoutData.cutout.height + 12}
                        stroke={isFabOS ? '#f59e0b' : '#f59e0b'}
                        strokeWidth={2}
                      />
                      <text
                        x={selectedCutoutData.cutout.x + selectedCutoutData.cutout.width / 2}
                        y={selectedCutoutData.cutout.y + selectedCutoutData.cutout.height + 25}
                        textAnchor="middle"
                        fill={isFabOS ? '#f59e0b' : '#f59e0b'}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {selectedCutoutData.dims.width.toFixed(0)}
                      </text>

                      {/* Korkeus */}
                      <line
                        x1={selectedCutoutData.cutout.x + selectedCutoutData.cutout.width + 12}
                        y1={selectedCutoutData.cutout.y}
                        x2={selectedCutoutData.cutout.x + selectedCutoutData.cutout.width + 12}
                        y2={selectedCutoutData.cutout.y + selectedCutoutData.cutout.height}
                        stroke={isFabOS ? '#f59e0b' : '#f59e0b'}
                        strokeWidth={2}
                      />
                      <text
                        x={selectedCutoutData.cutout.x + selectedCutoutData.cutout.width + 20}
                        y={selectedCutoutData.cutout.y + selectedCutoutData.cutout.height / 2 + 4}
                        textAnchor="start"
                        fill={isFabOS ? '#f59e0b' : '#f59e0b'}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {selectedCutoutData.dims.height.toFixed(0)}
                      </text>
                    </>
                  )}
                </g>
              )}
            </g>
          </svg>
        </div>

        {/* Leikkausten lista */}
        {cutouts.length > 0 && (
          <div className={`px-4 py-3 border-t ${isFabOS ? 'bg-gray-50 border-gray-200' : 'bg-slate-900/50 border-slate-700'}`}>
            <div className={`text-xs font-medium mb-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
              Leikkaukset ({cutouts.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {cutouts.map(cutout => (
                <div
                  key={cutout.id}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                    selectedCutout === cutout.id
                      ? isFabOS ? 'bg-[#FF6B35]/20 border border-[#FF6B35]' : 'bg-emerald-500/20 border border-emerald-500'
                      : isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-700 border border-slate-600'
                  }`}
                >
                  <span className={isFabOS ? 'text-gray-700' : 'text-slate-300'}>
                    {cutout.type === 'circle'
                      ? `⌀${(cutout.radius * 2).toFixed(0)}`
                      : `${cutout.width.toFixed(0)}x${cutout.height.toFixed(0)}`
                    }
                  </span>
                  <button
                    onClick={() => toggleEdgeFinish(cutout.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      cutout.edgeFinish === 'open'
                        ? 'bg-orange-500/20 text-orange-500'
                        : isFabOS ? 'bg-gray-200 text-gray-600' : 'bg-slate-600 text-slate-300'
                    }`}
                    title={cutout.edgeFinish === 'open' ? 'Avoin reuna' : 'Reunalistoitettu'}
                  >
                    {cutout.edgeFinish === 'open' ? 'Avoin' : 'Lista'}
                  </button>
                  <button
                    onClick={() => deleteCutout(cutout.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Parametripaneeli */}
      <div className={`rounded-2xl p-6 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
          Parametrit
        </h3>

        <div className="space-y-4">
          {/* Mitat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                Pituus (mm)
              </label>
              <input
                type="number"
                value={config.length}
                onChange={e => handleConfigChange('length', Math.min(MANUFACTURING_LIMITS.maxBearingBarLength, Math.max(100, parseInt(e.target.value) || 100)))}
                className={`w-full px-2 py-1.5 rounded text-sm ${isFabOS
                  ? 'bg-gray-50 border border-gray-200 text-gray-900'
                  : 'bg-slate-700 border border-slate-600 text-white'}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                Leveys (mm)
              </label>
              <input
                type="number"
                value={config.width}
                onChange={e => handleConfigChange('width', Math.min(MANUFACTURING_LIMITS.maxCrossBarLength, Math.max(100, parseInt(e.target.value) || 100)))}
                className={`w-full px-2 py-1.5 rounded text-sm ${isFabOS
                  ? 'bg-gray-50 border border-gray-200 text-gray-900'
                  : 'bg-slate-700 border border-slate-600 text-white'}`}
              />
            </div>
          </div>

          {/* Kantoteräksen suunta */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Kantoteräksen suunta
            </label>
            <div className="flex gap-2">
              {[
                { id: 'length', label: 'Pituus' },
                { id: 'width', label: 'Leveys' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => handleConfigChange('bearingBarDirection', opt.id)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    config.bearingBarDirection === opt.id
                      ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'
                      : isFabOS ? 'bg-gray-100 text-gray-700' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Materiaali */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Materiaali
            </label>
            <select
              value={config.material}
              onChange={e => handleConfigChange('material', e.target.value)}
              className={`w-full px-2 py-1.5 rounded text-sm ${isFabOS
                ? 'bg-gray-50 border border-gray-200 text-gray-900'
                : 'bg-slate-700 border border-slate-600 text-white'}`}
            >
              {MATERIALS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Kantoteräs */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Kantoteräs
            </label>
            <select
              value={config.bearingBarProfile}
              onChange={e => handleConfigChange('bearingBarProfile', e.target.value)}
              className={`w-full px-2 py-1.5 rounded text-sm ${isFabOS
                ? 'bg-gray-50 border border-gray-200 text-gray-900'
                : 'bg-slate-700 border border-slate-600 text-white'}`}
            >
              {BEARING_BAR_PROFILES.map(p => (
                <option key={p.code} value={p.code}>{p.code} mm</option>
              ))}
            </select>
          </div>

          {/* Silmäkoko */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                Kantoteräsjako
              </label>
              <select
                value={config.bearingBarSpacing}
                onChange={e => handleConfigChange('bearingBarSpacing', parseFloat(e.target.value))}
                className={`w-full px-2 py-1.5 rounded text-sm ${isFabOS
                  ? 'bg-gray-50 border border-gray-200 text-gray-900'
                  : 'bg-slate-700 border border-slate-600 text-white'}`}
              >
                {BEARING_BAR_SPACINGS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                Sideteräsjako
              </label>
              <select
                value={config.crossBarSpacing}
                onChange={e => handleConfigChange('crossBarSpacing', parseFloat(e.target.value))}
                className={`w-full px-2 py-1.5 rounded text-sm ${isFabOS
                  ? 'bg-gray-50 border border-gray-200 text-gray-900'
                  : 'bg-slate-700 border border-slate-600 text-white'}`}
              >
                {availableCrossBars.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Liukuturva */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Liukuturva
            </label>
            <select
              value={config.antiSlip}
              onChange={e => handleConfigChange('antiSlip', e.target.value)}
              className={`w-full px-2 py-1.5 rounded text-sm ${isFabOS
                ? 'bg-gray-50 border border-gray-200 text-gray-900'
                : 'bg-slate-700 border border-slate-600 text-white'}`}
            >
              {ANTI_SLIP_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          {/* Pintakäsittely */}
          <div>
            <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
              Pintakäsittely
            </label>
            <select
              value={config.surfaceTreatment}
              onChange={e => handleConfigChange('surfaceTreatment', e.target.value)}
              className={`w-full px-2 py-1.5 rounded text-sm ${isFabOS
                ? 'bg-gray-50 border border-gray-200 text-gray-900'
                : 'bg-slate-700 border border-slate-600 text-white'}`}
            >
              {SURFACE_TREATMENTS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hinta */}
        <div className={`mt-6 pt-4 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
          <div className="flex justify-between items-center mb-4">
            <span className={`text-sm ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>Yhteensä</span>
            <span className={`text-2xl font-bold ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {price.toFixed(2)} €
            </span>
          </div>
          <button
            onClick={addToCart}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${isFabOS
              ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-white'}`}
          >
            Lisää ostoskoriin
          </button>
        </div>

        {/* Valitun leikkauksen parametrit */}
        {selectedCutoutData && (
          <div className={`mt-4 p-4 rounded-xl border-2 ${isFabOS ? 'bg-[#FF6B35]/5 border-[#FF6B35]/30' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-semibold text-sm ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`}>
                {selectedCutoutData.cutout.type === 'circle' ? '○ Ympyrä' : '▭ Suorakaide'} - Parametrit
              </h4>
              <button
                onClick={() => setSelectedCutout(null)}
                className={`text-xs px-2 py-1 rounded ${isFabOS ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
              >
                ✕ Sulje
              </button>
            </div>

            {/* Koko */}
            <div className={`mb-3 pb-3 border-b ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
              <label className={`block text-xs font-medium mb-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                Koko
              </label>
              {selectedCutoutData.cutout.type === 'circle' ? (
                <div>
                  <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>Halkaisija (mm)</label>
                  <input
                    type="number"
                    value={selectedCutoutData.dims.diameter.toFixed(0)}
                    onChange={(e) => updateCutoutFromDimensions(selectedCutout, { diameter: parseFloat(e.target.value) || VALIDATION_RULES.minCutSize })}
                    className={`w-full px-2 py-1.5 rounded text-sm font-mono ${isFabOS
                      ? 'bg-white border-2 border-[#f59e0b]/50 text-[#f59e0b]'
                      : 'bg-slate-700 border-2 border-amber-500/50 text-amber-400'}`}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>Leveys (mm)</label>
                    <input
                      type="number"
                      value={selectedCutoutData.dims.width.toFixed(0)}
                      onChange={(e) => updateCutoutFromDimensions(selectedCutout, { width: parseFloat(e.target.value) || VALIDATION_RULES.minCutSize })}
                      className={`w-full px-2 py-1.5 rounded text-sm font-mono ${isFabOS
                        ? 'bg-white border-2 border-[#f59e0b]/50 text-[#f59e0b]'
                        : 'bg-slate-700 border-2 border-amber-500/50 text-amber-400'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>Korkeus (mm)</label>
                    <input
                      type="number"
                      value={selectedCutoutData.dims.height.toFixed(0)}
                      onChange={(e) => updateCutoutFromDimensions(selectedCutout, { height: parseFloat(e.target.value) || VALIDATION_RULES.minCutSize })}
                      className={`w-full px-2 py-1.5 rounded text-sm font-mono ${isFabOS
                        ? 'bg-white border-2 border-[#f59e0b]/50 text-[#f59e0b]'
                        : 'bg-slate-700 border-2 border-amber-500/50 text-amber-400'}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sijainti suhteessa reunoihin */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                Sijainti reunoista
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
                    ← Vasen (mm)
                  </label>
                  <input
                    type="number"
                    value={selectedCutoutData.dims.fromLeft.toFixed(0)}
                    onChange={(e) => updateCutoutFromDimensions(selectedCutout, { fromLeft: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-2 py-1.5 rounded text-sm font-mono ${isFabOS
                      ? 'bg-white border-2 border-[#FF6B35]/50 text-[#FF6B35]'
                      : 'bg-slate-700 border-2 border-emerald-500/50 text-emerald-400'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
                    → Oikea (mm)
                  </label>
                  <input
                    type="number"
                    value={selectedCutoutData.dims.fromRight.toFixed(0)}
                    onChange={(e) => updateCutoutFromDimensions(selectedCutout, { fromRight: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-2 py-1.5 rounded text-sm font-mono ${isFabOS
                      ? 'bg-white border border-gray-300 text-gray-700'
                      : 'bg-slate-700 border border-slate-600 text-slate-300'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
                    ↑ Ylä (mm)
                  </label>
                  <input
                    type="number"
                    value={selectedCutoutData.dims.fromTop.toFixed(0)}
                    onChange={(e) => updateCutoutFromDimensions(selectedCutout, { fromTop: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-2 py-1.5 rounded text-sm font-mono ${isFabOS
                      ? 'bg-white border-2 border-[#FF6B35]/50 text-[#FF6B35]'
                      : 'bg-slate-700 border-2 border-emerald-500/50 text-emerald-400'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
                    ↓ Ala (mm)
                  </label>
                  <input
                    type="number"
                    value={selectedCutoutData.dims.fromBottom.toFixed(0)}
                    onChange={(e) => updateCutoutFromDimensions(selectedCutout, { fromBottom: parseFloat(e.target.value) || 0 })}
                    className={`w-full px-2 py-1.5 rounded text-sm font-mono ${isFabOS
                      ? 'bg-white border border-gray-300 text-gray-700'
                      : 'bg-slate-700 border border-slate-600 text-slate-300'}`}
                  />
                </div>
              </div>
            </div>

            {/* Reunan viimeistely */}
            <div className={`mt-3 pt-3 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
              <label className={`block text-xs font-medium mb-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                Reunan viimeistely
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleEdgeFinish(selectedCutout)}
                  className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all ${
                    selectedCutoutData.cutout.edgeFinish === 'open'
                      ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50'
                      : isFabOS ? 'bg-gray-100 text-gray-600' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  Avoin reuna
                </button>
                <button
                  onClick={() => toggleEdgeFinish(selectedCutout)}
                  className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-all ${
                    selectedCutoutData.cutout.edgeFinish === 'banded'
                      ? isFabOS ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : isFabOS ? 'bg-gray-100 text-gray-600' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  Reunalistoitettu
                </button>
              </div>
            </div>

            {/* Poista-nappi */}
            <button
              onClick={() => deleteCutout(selectedCutout)}
              className="w-full mt-3 px-3 py-2 rounded text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-all"
            >
              🗑 Poista leikkaus
            </button>
          </div>
        )}

        {/* Info */}
        <div className={`mt-4 p-3 rounded-lg text-xs ${isFabOS ? 'bg-amber-50 text-amber-800' : 'bg-amber-900/20 text-amber-300'}`}>
          <p className="font-medium mb-1">Snap-to-grid</p>
          <p>Kantoteräksen suunnassa leikkaukset pyöristyvät jakoon ({config.bearingBarSpacing} mm).</p>
          {cutouts.length > 0 && !selectedCutout && (
            <p className="mt-2 text-xs opacity-75">💡 Klikkaa leikkausta muokataksesi sen parametreja.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HINNASTOT TAB (Admin)
// ═══════════════════════════════════════════════════════════════════════════════
function PricingTab({ isFabOS, pricing, setPricing }) {
  const [activeSection, setActiveSection] = useState('base');

  const updatePricing = (category, key, value) => {
    setPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: parseFloat(value) || 0
      }
    }));
  };

  const updateNestedPricing = (category, subKey, key, value) => {
    setPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subKey]: {
          ...prev[category][subKey],
          [key]: parseFloat(value) || 0
        }
      }
    }));
  };

  const sections = [
    { id: 'base', label: 'Perushinnat', icon: '💰' },
    { id: 'materials', label: 'Materiaalit', icon: '🔩' },
    { id: 'surface', label: 'Pintakäsittely', icon: '🎨' },
    { id: 'profiles', label: 'Kantoteräkset', icon: '📏' },
    { id: 'extras', label: 'Lisäpalvelut', icon: '⚙️' },
    { id: 'treads', label: 'Askelmat', icon: '🪜' }
  ];

  const PriceInput = ({ label, value, onChange, unit = '€', description }) => (
    <div className={`p-3 rounded-lg ${isFabOS ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <label className={`block text-sm font-medium ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
            {label}
          </label>
          {description && (
            <p className={`text-xs mt-0.5 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            step="0.01"
            className={`w-24 px-2 py-1 rounded text-sm text-right font-mono ${isFabOS
              ? 'bg-white border border-gray-200 text-gray-900'
              : 'bg-slate-700 border border-slate-600 text-white'}`}
          />
          <span className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>{unit}</span>
        </div>
      </div>
    </div>
  );

  const MultiplierInput = ({ label, value, onChange, description }) => (
    <div className={`p-3 rounded-lg ${isFabOS ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <label className={`block text-sm font-medium ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
            {label}
          </label>
          {description && (
            <p className={`text-xs mt-0.5 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            step="0.1"
            min="0"
            className={`w-20 px-2 py-1 rounded text-sm text-right font-mono ${isFabOS
              ? 'bg-white border border-gray-200 text-gray-900'
              : 'bg-slate-700 border border-slate-600 text-white'}`}
          />
          <span className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>×</span>
        </div>
      </div>
      {/* Visual indicator */}
      <div className="mt-2">
        <div className={`h-2 rounded-full overflow-hidden ${isFabOS ? 'bg-gray-200' : 'bg-slate-700'}`}>
          <div
            className={`h-full transition-all ${value > 1 ? 'bg-amber-500' : value < 1 ? 'bg-emerald-500' : isFabOS ? 'bg-gray-400' : 'bg-slate-500'}`}
            style={{ width: `${Math.min(100, (value / 5) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>0×</span>
          <span className={`text-xs font-medium ${
            value > 1 ? 'text-amber-500' : value < 1 ? 'text-emerald-500' : isFabOS ? 'text-gray-500' : 'text-slate-400'
          }`}>
            {value > 1 ? `+${((value - 1) * 100).toFixed(0)}%` : value < 1 ? `-${((1 - value) * 100).toFixed(0)}%` : 'Perus'}
          </span>
          <span className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>5×</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Sivupaneeli - osiot */}
      <div className={`rounded-2xl p-4 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">⚙️</span>
          <h3 className={`text-lg font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
            Admin
          </h3>
        </div>

        <div className={`mb-4 p-3 rounded-lg ${isFabOS ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-700'}`}>
          <p className={`text-xs ${isFabOS ? 'text-amber-800' : 'text-amber-300'}`}>
            <strong>Demo-tila:</strong> Muutokset näkyvät vain tässä sessiossa.
          </p>
        </div>

        <nav className="space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                activeSection === section.id
                  ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'
                  : isFabOS ? 'text-gray-700 hover:bg-gray-100' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{section.icon}</span>
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          ))}
        </nav>

        {/* Reset button */}
        <button
          onClick={() => setPricing(getDefaultPricing())}
          className={`w-full mt-4 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            isFabOS
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Palauta oletukset
        </button>
      </div>

      {/* Hinnoittelupaneeli */}
      <div className={`lg:col-span-3 rounded-2xl p-6 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50 border border-slate-700'}`}>
        {/* Perushinnat */}
        {activeSection === 'base' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className={`text-xl font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                  Perushinnat
                </h3>
                <p className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                  Ritilöiden ja leikkausten perushinnoittelu
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <PriceInput
                label="Ritilän perushinta"
                value={pricing.base.gratingPerSqm}
                onChange={v => updatePricing('base', 'gratingPerSqm', v)}
                unit="€/m²"
                description="Teräs 30/3 kuumasinkitty"
              />
              <PriceInput
                label="Minimiveloitus"
                value={pricing.base.minimumCharge}
                onChange={v => updatePricing('base', 'minimumCharge', v)}
                unit="€"
                description="Pienin laskutettava summa"
              />
              <PriceInput
                label="Leikkauksen perushinta"
                value={pricing.base.cutoutBase}
                onChange={v => updatePricing('base', 'cutoutBase', v)}
                unit="€/kpl"
                description="Suorakaide- tai ympyräleikkaus"
              />
              <PriceInput
                label="Reunalistan lisähinta"
                value={pricing.base.edgeBandingPerMeter}
                onChange={v => updatePricing('base', 'edgeBandingPerMeter', v)}
                unit="€/m"
                description="Leikkausreunan viimeistely"
              />
              <PriceInput
                label="Kiinnitysreikä"
                value={pricing.base.mountingHole}
                onChange={v => updatePricing('base', 'mountingHole', v)}
                unit="€/kpl"
                description="Lisäporaus kiinnitykselle"
              />
              <PriceInput
                label="Erikoismuoto-lisä"
                value={pricing.base.customShapeMultiplier}
                onChange={v => updatePricing('base', 'customShapeMultiplier', v)}
                unit="€"
                description="Monikulmioleikkaus"
              />
            </div>
          </div>
        )}

        {/* Materiaalit */}
        {activeSection === 'materials' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔩</span>
              <div>
                <h3 className={`text-xl font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                  Materiaalikertoimet
                </h3>
                <p className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                  Materiaali vaikuttaa perushintaan kertoimella
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <MultiplierInput
                label="Teräs S235JR"
                value={pricing.materials.steel}
                onChange={v => updatePricing('materials', 'steel', v)}
                description="Perusmateriaali (kerroin 1.0 = perushinta)"
              />
              <MultiplierInput
                label="RST V2A (AISI 304)"
                value={pricing.materials.stainless_v2a}
                onChange={v => updatePricing('materials', 'stainless_v2a', v)}
                description="Ruostumaton teräs, yleiskäyttö"
              />
              <MultiplierInput
                label="Haponkestävä V4A (AISI 316L)"
                value={pricing.materials.stainless_v4a}
                onChange={v => updatePricing('materials', 'stainless_v4a', v)}
                description="Haponkestävä, vaativat olosuhteet"
              />
            </div>
          </div>
        )}

        {/* Pintakäsittely */}
        {activeSection === 'surface' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🎨</span>
              <div>
                <h3 className={`text-xl font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                  Pintakäsittelykertoimet
                </h3>
                <p className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                  Pintakäsittely vaikuttaa perushintaan kertoimella
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <MultiplierInput
                label="Kuumasinkitty"
                value={pricing.surface.hot_dip_galvanized}
                onChange={v => updatePricing('surface', 'hot_dip_galvanized', v)}
                description="Vakiopintakäsittely, EN ISO 1461"
              />
              <MultiplierInput
                label="Käsittelemätön"
                value={pricing.surface.untreated}
                onChange={v => updatePricing('surface', 'untreated', v)}
                description="Raaka pinta, asiakkaan käsiteltäväksi"
              />
              <MultiplierInput
                label="Maalattu"
                value={pricing.surface.painted}
                onChange={v => updatePricing('surface', 'painted', v)}
                description="Pulverimaalaus RAL-sävyyn"
              />
              <MultiplierInput
                label="Liukuturvaloveukset"
                value={pricing.surface.serrated}
                onChange={v => updatePricing('surface', 'serrated', v)}
                description="Hammastettu pinta R11-R13"
              />
            </div>
          </div>
        )}

        {/* Kantoteräkset */}
        {activeSection === 'profiles' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📏</span>
              <div>
                <h3 className={`text-xl font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                  Kantoteräsprofiilien hinnoittelu
                </h3>
                <p className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                  Profiilien korkeus vaikuttaa hintaan
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${isFabOS ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
              <p className={`text-sm mb-4 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                Hinta lasketaan kaavalla: <code className={`px-2 py-0.5 rounded ${isFabOS ? 'bg-gray-200' : 'bg-slate-700'}`}>
                  perushinta × (1 + (korkeus - 30) × kerroin)
                </code>
              </p>
              <PriceInput
                label="Korkeuskerroin"
                value={pricing.profiles.heightMultiplier}
                onChange={v => updatePricing('profiles', 'heightMultiplier', v)}
                unit="per mm"
                description="Jokainen mm yli 30mm korottaa hintaa"
              />
            </div>

            {/* Esimerkkitaulukko */}
            <div className={`mt-4 p-4 rounded-lg ${isFabOS ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
              <h4 className={`text-sm font-semibold mb-3 ${isFabOS ? 'text-blue-800' : 'text-blue-300'}`}>
                Esimerkkihinnat (perushinta {pricing.base.gratingPerSqm} €/m²)
              </h4>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {['20/2', '30/3', '40/4', '50/5'].map(profile => {
                  const height = parseInt(profile.split('/')[0]);
                  const multiplier = 1 + (height - 30) * pricing.profiles.heightMultiplier;
                  const price = pricing.base.gratingPerSqm * multiplier;
                  return (
                    <div key={profile} className={`p-2 rounded ${isFabOS ? 'bg-white' : 'bg-slate-800'}`}>
                      <div className={`font-mono font-bold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>{profile}</div>
                      <div className={`${isFabOS ? 'text-blue-600' : 'text-blue-400'}`}>{price.toFixed(2)} €/m²</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Lisäpalvelut */}
        {activeSection === 'extras' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚙️</span>
              <div>
                <h3 className={`text-xl font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                  Lisäpalvelut ja toimitus
                </h3>
                <p className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                  Toimitukseen ja käsittelyyn liittyvät hinnat
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <PriceInput
                label="Pikatoimitus"
                value={pricing.extras.expressDelivery}
                onChange={v => updatePricing('extras', 'expressDelivery', v)}
                unit="€"
                description="1-3 arkipäivän toimitus"
              />
              <PriceInput
                label="Pakkauskulu"
                value={pricing.extras.packaging}
                onChange={v => updatePricing('extras', 'packaging', v)}
                unit="€/tilaus"
                description="Erikoispakkaus suuria eriä varten"
              />
              <PriceInput
                label="Sertifikaatti"
                value={pricing.extras.certificate}
                onChange={v => updatePricing('extras', 'certificate', v)}
                unit="€/kpl"
                description="3.1 materiaalitodistus"
              />
              <PriceInput
                label="Piirustukset"
                value={pricing.extras.drawings}
                onChange={v => updatePricing('extras', 'drawings', v)}
                unit="€/kpl"
                description="Valmistuspiirustus DXF/PDF"
              />
            </div>

            {/* Toimituskustannukset */}
            <div className={`p-4 rounded-lg ${isFabOS ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
              <h4 className={`text-sm font-semibold mb-3 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                Toimituskustannukset
              </h4>
              <div className="space-y-3">
                <PriceInput
                  label="Perustoimitus"
                  value={pricing.extras.delivery.base}
                  onChange={v => updateNestedPricing('extras', 'delivery', 'base', v)}
                  unit="€"
                  description="Nouto tehtaalta"
                />
                <PriceInput
                  label="Kotimaan rahti"
                  value={pricing.extras.delivery.domestic}
                  onChange={v => updateNestedPricing('extras', 'delivery', 'domestic', v)}
                  unit="€"
                  description="Toimitus Suomessa"
                />
                <PriceInput
                  label="Kansainvälinen"
                  value={pricing.extras.delivery.international}
                  onChange={v => updateNestedPricing('extras', 'delivery', 'international', v)}
                  unit="€"
                  description="Vienti EU-alueelle"
                />
              </div>
            </div>
          </div>
        )}

        {/* Askelmat */}
        {activeSection === 'treads' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🪜</span>
              <div>
                <h3 className={`text-xl font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                  Porrasaskelmien hinnoittelu
                </h3>
                <p className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                  Suorien askelmien perushinnat
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <PriceInput
                label="Askelman perushinta"
                value={pricing.treads.basePrice}
                onChange={v => updatePricing('treads', 'basePrice', v)}
                unit="€/kpl"
                description="800mm askelma, teräs"
              />
              <PriceInput
                label="LS-turvanokka"
                value={pricing.treads.lsNosing}
                onChange={v => updatePricing('treads', 'lsNosing', v)}
                unit="€/kpl"
                description="Liukuturvalista"
              />
              <PriceInput
                label="Ruutulevynokka"
                value={pricing.treads.checkerNosing}
                onChange={v => updatePricing('treads', 'checkerNosing', v)}
                unit="€/kpl"
                description="Ruutulevyreunalla"
              />
              <PriceInput
                label="Rei'itetty nokka"
                value={pricing.treads.perforatedNosing}
                onChange={v => updatePricing('treads', 'perforatedNosing', v)}
                unit="€/kpl"
                description="ÖNORM B 5371"
              />
            </div>

            {/* Leveydet */}
            <div className={`p-4 rounded-lg ${isFabOS ? 'bg-gray-50' : 'bg-slate-800/50'}`}>
              <h4 className={`text-sm font-semibold mb-3 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
                Leveyskertoimet
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { width: 240, key: 'width240' },
                  { width: 270, key: 'width270' },
                  { width: 300, key: 'width300' },
                  { width: 305, key: 'width305' }
                ].map(item => (
                  <div key={item.width}>
                    <label className={`block text-xs font-medium mb-1 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                      {item.width} mm
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={pricing.treads.widths[item.key]}
                        onChange={e => updateNestedPricing('treads', 'widths', item.key, e.target.value)}
                        step="0.1"
                        className={`w-full px-2 py-1 rounded text-sm text-right font-mono ${isFabOS
                          ? 'bg-white border border-gray-200 text-gray-900'
                          : 'bg-slate-700 border border-slate-600 text-white'}`}
                      />
                      <span className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>×</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Oletushinnoittelu
function getDefaultPricing() {
  return {
    base: {
      gratingPerSqm: 85,
      minimumCharge: 50,
      cutoutBase: 15,
      edgeBandingPerMeter: 8,
      mountingHole: 3,
      customShapeMultiplier: 25
    },
    materials: {
      steel: 1.0,
      stainless_v2a: 3.2,
      stainless_v4a: 4.5
    },
    surface: {
      hot_dip_galvanized: 1.2,
      untreated: 1.0,
      painted: 1.4,
      serrated: 1.15
    },
    profiles: {
      heightMultiplier: 0.01
    },
    extras: {
      expressDelivery: 150,
      packaging: 25,
      certificate: 15,
      drawings: 10,
      delivery: {
        base: 0,
        domestic: 85,
        international: 250
      }
    },
    treads: {
      basePrice: 45,
      lsNosing: 12,
      checkerNosing: 18,
      perforatedNosing: 22,
      widths: {
        width240: 0.9,
        width270: 1.0,
        width300: 1.1,
        width305: 1.12
      }
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// APUKOMPONENTIT
// ═══════════════════════════════════════════════════════════════════════════════
function GratingPreview({ config, isFabOS }) {
  const scale = Math.min(250 / config.length, 200 / config.width) * 0.9;

  return (
    <svg width="100%" height="200" className={`rounded-lg ${isFabOS ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
      <g transform={`translate(${125 - (config.length * scale) / 2}, ${100 - (config.width * scale) / 2})`}>
        {/* Ritilän kehys */}
        <rect
          x={0}
          y={0}
          width={config.length * scale}
          height={config.width * scale}
          fill="none"
          stroke={COLORS.edgeBanding2D}
          strokeWidth={2}
        />

        {/* Yksinkertaistettu ritilä-pattern */}
        {Array.from({ length: Math.min(15, Math.floor(config.width / config.bearingBarSpacing)) }).map((_, i) => (
          <line
            key={`bb-${i}`}
            x1={0}
            y1={(i + 1) * (config.width * scale) / Math.min(15, Math.floor(config.width / config.bearingBarSpacing))}
            x2={config.length * scale}
            y2={(i + 1) * (config.width * scale) / Math.min(15, Math.floor(config.width / config.bearingBarSpacing))}
            stroke={COLORS.bearingBar2D}
            strokeWidth={1.5}
          />
        ))}
        {Array.from({ length: Math.min(20, Math.floor(config.length / config.crossBarSpacing)) }).map((_, i) => (
          <line
            key={`cb-${i}`}
            x1={(i + 1) * (config.length * scale) / Math.min(20, Math.floor(config.length / config.crossBarSpacing))}
            y1={0}
            x2={(i + 1) * (config.length * scale) / Math.min(20, Math.floor(config.length / config.crossBarSpacing))}
            y2={config.width * scale}
            stroke={COLORS.crossBar2D}
            strokeWidth={0.5}
          />
        ))}
      </g>
    </svg>
  );
}

function TreadPreview({ config, isFabOS }) {
  return (
    <svg width="100%" height="200" className={`rounded-lg ${isFabOS ? 'bg-gray-50' : 'bg-slate-900/50'}`}>
      <g transform="translate(50, 30)">
        {/* Askelman runko */}
        <rect
          x={0}
          y={30}
          width={150}
          height={config.width * 0.4}
          fill={COLORS.bearingBar2D}
          stroke={COLORS.edgeBanding2D}
          strokeWidth={2}
          rx={2}
        />

        {/* Turvanokka (LS-lista) */}
        <rect
          x={0}
          y={20}
          width={150}
          height={15}
          fill="#FFB020"
          stroke={COLORS.edgeBanding2D}
          strokeWidth={1}
          rx={1}
        />

        {/* Ritilä-pattern */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`line-${i}`}
            x1={10 + i * 17}
            y1={35}
            x2={10 + i * 17}
            y2={30 + config.width * 0.35}
            stroke={COLORS.crossBar2D}
            strokeWidth={1}
          />
        ))}

        {/* Mitat */}
        <text x={75} y={config.width * 0.4 + 60} textAnchor="middle" fill={isFabOS ? '#374151' : '#94a3b8'} fontSize="11">
          {config.length} x {config.width} mm
        </text>
      </g>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÄÄKOMPONENTTI
// ═══════════════════════════════════════════════════════════════════════════════
export default function GratingConfigurator({ onBack }) {
  const { theme } = useTheme();
  const isFabOS = theme === THEMES.FABOS;

  const [activeTab, setActiveTab] = useState('standard'); // 'standard' | 'treads' | 'custom' | 'pricing'
  const [cart, setCart] = useState([]);
  const [pricing, setPricing] = useState(getDefaultPricing());

  const totalPrice = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className={isFabOS
      ? "min-h-screen bg-[#F7F7F7] text-gray-900"
      : "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
    }>
      {/* Header */}
      <header className={isFabOS
        ? "bg-[#1A1A2E] border-b border-gray-700 sticky top-0 z-50"
        : "bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50"
      }>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={isFabOS
                ? "flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                : "flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Takaisin</span>
            </button>
            <div className={isFabOS ? "w-px h-6 bg-gray-600" : "w-px h-6 bg-slate-700"}></div>
            {isFabOS ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
                  <span className="text-xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
                </div>
                <span className="px-2 py-1 bg-[#EF4444]/20 text-[#EF4444] text-xs font-bold rounded">V0.4</span>
                <span className="text-white font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Ritiläkonfiguraattori</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-red-500/30">
                  #
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">V0.4 Ritiläkonfiguraattori</h1>
                  <p className="text-sm text-slate-400">Puristehitsatut ritilät ja askelmat</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs + Cart bar */}
        <div className={`flex items-center justify-between mb-6 ${isFabOS ? '' : ''}`}>
          <div className={`flex gap-1 ${isFabOS ? 'bg-gray-100 rounded-lg p-1' : 'bg-slate-800 rounded-lg p-1'}`}>
            {[
              { id: 'standard', label: 'Vakio ritilät', icon: '#' },
              { id: 'treads', label: 'Askelmat', icon: '▬' },
              { id: 'custom', label: 'Oma geometria', icon: '✎' },
              { id: 'pricing', label: 'Hinnastot', icon: '€' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? isFabOS
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-emerald-500 text-white'
                    : isFabOS
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          {cart.length > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isFabOS ? 'bg-gray-100 border border-gray-200' : 'bg-slate-800'}`}>
              <span className={`text-sm ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                {cart.length} tuotetta
              </span>
              <span className={`font-bold ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {totalPrice.toFixed(2)} €
              </span>
            </div>
          )}
        </div>

        {activeTab === 'standard' && (
          <StandardGratingsTab isFabOS={isFabOS} cart={cart} setCart={setCart} />
        )}
        {activeTab === 'treads' && (
          <StandardTreadsTab isFabOS={isFabOS} cart={cart} setCart={setCart} />
        )}
        {activeTab === 'custom' && (
          <CustomGeometryTab isFabOS={isFabOS} cart={cart} setCart={setCart} />
        )}
        {activeTab === 'pricing' && (
          <PricingTab isFabOS={isFabOS} pricing={pricing} setPricing={setPricing} />
        )}
      </main>

      {/* Ostoskori Footer */}
      {cart.length > 0 && (
        <div className={`fixed bottom-0 left-0 right-0 border-t ${
          isFabOS
            ? 'bg-white border-gray-200 shadow-lg'
            : 'bg-slate-900 border-slate-700'
        }`}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`font-medium ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                  Ostoskori ({cart.length})
                </span>
                <div className="flex gap-2 overflow-x-auto max-w-md">
                  {cart.slice(0, 3).map(item => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
                        isFabOS ? 'bg-gray-100' : 'bg-slate-800'
                      }`}
                    >
                      <span className={isFabOS ? 'text-gray-700' : 'text-slate-300'}>
                        {item.type === 'grating' ? 'Ritilä' : item.type === 'tread' ? 'Askelma' : 'Räätälöity'}
                      </span>
                      <span className={isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}>
                        {item.price.toFixed(0)}€
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {cart.length > 3 && (
                    <span className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
                      +{cart.length - 3} muuta
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Yhteensä</div>
                  <div className={`text-xl font-bold ${isFabOS ? 'text-[#FF6B35]' : 'text-emerald-400'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {totalPrice.toFixed(2)} €
                  </div>
                </div>
                <button
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                    isFabOS
                      ? 'bg-[#FF6B35] hover:bg-[#e5612f] text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                  }`}
                >
                  Siirry kassalle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
