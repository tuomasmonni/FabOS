import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme, THEMES } from './contexts/ThemeContext';
import ThemeSwitcher from './components/ThemeSwitcher';
import AIChat from './components/AIChat';
import DevelopmentMode from './components/DevelopmentMode';
import VersionGallery from './components/VersionGallery';

// ============================================
// PARAMETRIT - Oletusarvot putkikoon mukaan
// ============================================
const DEFAULT_PIPE_PARAMS = {
  20: {
    bendRadius: 30,      // mm, taivutussäde
    minStraight: 40,     // mm, suoraosuus minimi
    maxAngle: 180,       // astetta
    springback: 2,       // astetta, takaisinjousto
    minWall: 1.0,        // mm
    maxWall: 2.5,        // mm
    materials: ['steel', 'stainless', 'aluminum']
  },
  25: {
    bendRadius: 40,
    minStraight: 50,
    maxAngle: 180,
    springback: 2.5,
    minWall: 1.5,
    maxWall: 3.0,
    materials: ['steel', 'stainless', 'aluminum']
  },
  32: {
    bendRadius: 50,
    minStraight: 65,
    maxAngle: 180,
    springback: 3,
    minWall: 1.5,
    maxWall: 3.5,
    materials: ['steel', 'stainless']
  },
  40: {
    bendRadius: 60,
    minStraight: 80,
    maxAngle: 170,
    springback: 3.5,
    minWall: 2.0,
    maxWall: 4.0,
    materials: ['steel', 'stainless']
  },
  50: {
    bendRadius: 75,
    minStraight: 100,
    maxAngle: 160,
    springback: 4,
    minWall: 2.0,
    maxWall: 5.0,
    materials: ['steel']
  }
};

// ============================================
// 3D PUTKI KOMPONENTTI
// ============================================
function Pipe3D({ diameter, wallThickness, bends, startStraight, bendData, color = '#888888' }) {
  const meshRef = useRef();

  // Luo putken geometria taivutuksilla
  const geometry = useMemo(() => {
    const points = [];
    const radius = diameter / 2;
    let currentPos = new THREE.Vector3(0, 0, 0);
    let currentDir = new THREE.Vector3(1, 0, 0); // Alkusuunta X-akselia pitkin

    // Skaalaus 3D-näkymään (mm -> yksiköt, 1 yksikkö = 10mm)
    const scale = 0.01;

    points.push(currentPos.clone());

    // Käytä uutta rakennetta: startStraight + bendData (kulma + straightAfter)
    const straightStart = startStraight || 100;
    const bendsToUse = bendData || [];

    // Alkusuora
    if (straightStart > 0) {
      currentPos = currentPos.clone().add(currentDir.clone().multiplyScalar(straightStart * scale));
      points.push(currentPos.clone());
    }

    // Käy läpi taivutukset järjestyksessä
    bendsToUse.forEach((bend) => {
      if (bend.angle === 0) return;

      // Taivutus - luodaan kaaren pisteet
      const bendRadiusScaled = (bend.radius || 40) * scale;
      const angleRad = THREE.MathUtils.degToRad(bend.angle);
      const segments = Math.max(8, Math.round(Math.abs(bend.angle) / 5));

      // Taivutuksen keskipiste (kohtisuoraan nykyiseen suuntaan)
      // Käytä oikeaa perpendicular-vektoria nykyisen suunnan mukaan
      const perpendicular = new THREE.Vector3(-currentDir.y, currentDir.x, 0).normalize();
      const bendCenter = currentPos.clone().add(perpendicular.clone().multiplyScalar(bendRadiusScaled));

      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        // Laske kaaren piste suhteessa keskipisteeseen
        const startAngle = Math.atan2(currentPos.y - bendCenter.y, currentPos.x - bendCenter.x);
        const currentAngle = startAngle + angleRad * t;
        const newPos = new THREE.Vector3(
          bendCenter.x + Math.cos(currentAngle) * bendRadiusScaled,
          bendCenter.y + Math.sin(currentAngle) * bendRadiusScaled,
          currentPos.z
        );
        points.push(newPos);
      }

      // Päivitä nykyinen sijainti
      const lastPoint = points[points.length - 1];
      currentPos = lastPoint.clone();

      // Päivitä suunta taivutuksen jälkeen
      const rotationMatrix = new THREE.Matrix4().makeRotationZ(angleRad);
      currentDir.applyMatrix4(rotationMatrix).normalize();

      // Suora osuus taivutuksen jälkeen
      const straightAfter = bend.straightAfter || 0;
      if (straightAfter > 0) {
        currentPos = currentPos.clone().add(currentDir.clone().multiplyScalar(straightAfter * scale));
        points.push(currentPos.clone());
      }
    });

    // Luo putken polku
    if (points.length < 2) {
      points.push(new THREE.Vector3(100 * scale, 0, 0));
    }

    const path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1);
    const tubeGeometry = new THREE.TubeGeometry(path, 64, radius * scale, 16, false);

    return tubeGeometry;
  }, [diameter, startStraight, bendData]);

  // Pyöritä hieman animaatiota varten
  useFrame((state) => {
    if (meshRef.current) {
      // Hienoinen kellunta
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================
// 3D NÄKYMÄ
// ============================================
function Preview3D({ diameter, wallThickness, startStraight, bendData, color }) {
  return (
    <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
      <Canvas>
        <PerspectiveCamera makeDefault position={[5, 3, 5]} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />

        <Pipe3D
          diameter={diameter}
          wallThickness={wallThickness}
          startStraight={startStraight}
          bendData={bendData}
          color={color}
        />

        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#334155"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#475569"
          fadeDistance={30}
          position={[0, -1, 0]}
        />
      </Canvas>
    </div>
  );
}

// ============================================
// PREVIEW COMPONENT FOR DEVELOPMENT MODE
// ============================================
// Täysi interaktiivinen esikatselu DevelopmentMode:a varten
export function PipeBendingPreview({ config, isPreview, isFabOS = true }) {
  const diameter = config?.defaults?.pipeDiameter || 25;
  const wallThickness = config?.defaults?.wallThickness || 2;
  const pipeColor = config?.ui?.pipeColor || '#888888';
  const maxBends = config?.features?.maxBends || 10;

  // Interaktiivinen state esikatselussa
  const [startStraight, setStartStraight] = useState(100);
  const [bends, setBends] = useState([
    { id: 1, angle: 90, straightAfter: 100, type: 'lesti', radius: diameter * 2 }
  ]);
  const [selectedMaterial, setSelectedMaterial] = useState(config?.defaults?.material || 'steel');

  // Päivitä säteet kun diameter muuttuu configista
  useEffect(() => {
    setBends(prev => prev.map(b => ({
      ...b,
      radius: b.type === 'lesti' ? diameter * 2 : Math.max(b.radius, diameter * 4)
    })));
  }, [diameter]);

  const addBend = () => {
    if (bends.length >= maxBends) return;
    setBends([...bends, {
      id: Date.now(),
      angle: 90,
      straightAfter: 80,
      type: 'lesti',
      radius: diameter * 2
    }]);
  };

  const updateBend = (id, field, value) => {
    setBends(bends.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const updateBendType = (id, newType) => {
    setBends(bends.map(b => {
      if (b.id === id) {
        const newRadius = newType === 'lesti' ? diameter * 2 : diameter * 4;
        return { ...b, type: newType, radius: newRadius };
      }
      return b;
    }));
  };

  const removeBend = (id) => {
    setBends(bends.filter(b => b.id !== id));
  };

  // Laske kokonaispituus
  const calculateTotalLength = () => {
    let total = startStraight;
    bends.forEach(bend => {
      const arcLength = (Math.abs(bend.angle) / 180) * Math.PI * bend.radius;
      total += arcLength + bend.straightAfter;
    });
    return Math.round(total);
  };

  const materialNames = {
    steel: 'Teräs',
    stainless: 'RST',
    aluminum: 'Alumiini',
    copper: 'Kupari'
  };

  return (
    <div className={`h-full flex flex-col relative ${isFabOS ? 'bg-gray-50' : 'bg-slate-900'}`}>
      {/* ESIKATSELU-INDIKAATTORI - Selkeä visuaalinen merkki */}
      <div className={`absolute inset-0 pointer-events-none z-10 border-4 rounded-lg ${
        isFabOS ? 'border-[#FF6B35]/60' : 'border-amber-500/60'
      }`}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-xs font-bold ${
          isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-amber-500 text-black'
        }`}>
          👁️ ESIKATSELU - Muutokset eivät tallennu
        </div>
      </div>

      {/* Header with config info */}
      <div className={`px-4 py-3 border-b ${isFabOS ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <h3 className={`font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                Putkentaivutus
              </h3>
              <p className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                Ø{diameter}mm • {wallThickness}mm seinämä
              </p>
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex gap-2 items-center flex-wrap justify-end">
            {config?.features?.['3dVisualization'] && (
              <span className={`text-xs px-2 py-1 rounded ${isFabOS ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400'}`}>
                3D ✓
              </span>
            )}
            {config?.features?.exportDXF && (
              <span className={`text-xs px-2 py-1 rounded ${isFabOS ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>
                DXF ✓
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded ${isFabOS ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-400'}`}>
              Max {maxBends} taivutusta
            </span>
            {pipeColor !== '#888888' && (
              <span
                className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: pipeColor }}
                title={`Väri: ${pipeColor}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Putken tiedot */}
        <div className={`rounded-xl p-4 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
          <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'}`}>1</span>
            Putken tiedot
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Halkaisija</label>
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${isFabOS ? 'bg-gray-100 text-gray-900' : 'bg-slate-700 text-white'}`}>
                Ø{diameter} mm
              </div>
            </div>
            <div>
              <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Seinämä</label>
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${isFabOS ? 'bg-gray-100 text-gray-900' : 'bg-slate-700 text-white'}`}>
                {wallThickness} mm
              </div>
            </div>
            <div>
              <label className={`block text-xs mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Materiaali</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm ${isFabOS ? 'bg-gray-100 text-gray-900 border border-gray-200' : 'bg-slate-700 text-white border border-slate-600'}`}
              >
                {(config?.materials || ['steel', 'stainless', 'aluminum']).map(mat => (
                  <option key={mat} value={mat}>{materialNames[mat] || mat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Taivutukset */}
        <div className={`rounded-xl p-4 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`text-sm font-semibold flex items-center gap-2 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'}`}>2</span>
              Taivutukset ({bends.length}/{maxBends})
            </h4>
            <button
              onClick={addBend}
              disabled={bends.length >= maxBends}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                bends.length >= maxBends
                  ? isFabOS ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : isFabOS ? 'bg-[#FF6B35] text-white hover:bg-[#e5612f]' : 'bg-emerald-500 text-white hover:bg-emerald-400'
              }`}
            >
              + Lisää
            </button>
          </div>

          {/* Alkusuora */}
          <div className={`p-3 rounded-lg mb-2 ${isFabOS ? 'bg-green-50 border border-green-200' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isFabOS ? 'text-green-700' : 'text-emerald-400'}`}>Alkusuora</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={startStraight}
                  onChange={(e) => setStartStraight(Number(e.target.value))}
                  className={`w-20 px-2 py-1 rounded text-sm text-center ${isFabOS ? 'bg-white border border-green-300 text-gray-900' : 'bg-slate-800 border border-emerald-500/50 text-white'}`}
                  min={0}
                  step={10}
                />
                <span className={`text-sm ${isFabOS ? 'text-green-600' : 'text-emerald-400'}`}>mm</span>
              </div>
            </div>
          </div>

          {/* Taivutuslista */}
          <div className="space-y-2">
            {bends.map((bend, index) => (
              <div
                key={bend.id}
                className={`p-3 rounded-lg ${isFabOS ? 'bg-gray-50 border border-gray-200' : 'bg-slate-700/50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>
                      Taivutus {index + 1}
                    </span>
                    {/* Tyyppi toggle */}
                    <div className={`flex rounded-md p-0.5 ${isFabOS ? 'bg-gray-200' : 'bg-slate-600'}`}>
                      <button
                        onClick={() => updateBendType(bend.id, 'lesti')}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                          bend.type === 'lesti'
                            ? 'bg-amber-500 text-white'
                            : isFabOS ? 'text-gray-500' : 'text-slate-400'
                        }`}
                      >
                        L
                      </button>
                      <button
                        onClick={() => updateBendType(bend.id, 'rullaus')}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                          bend.type === 'rullaus'
                            ? 'bg-cyan-500 text-white'
                            : isFabOS ? 'text-gray-500' : 'text-slate-400'
                        }`}
                      >
                        R
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeBend(bend.id)}
                    className={`text-xs ${isFabOS ? 'text-gray-400 hover:text-red-500' : 'text-slate-500 hover:text-red-400'}`}
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={`block text-[10px] mb-0.5 ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>Kulma</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={bend.angle}
                        onChange={(e) => updateBend(bend.id, 'angle', Number(e.target.value))}
                        className={`w-full px-2 py-1 rounded text-sm ${isFabOS ? 'bg-white border border-gray-300 text-gray-900' : 'bg-slate-800 border border-slate-600 text-white'}`}
                        min={-180}
                        max={180}
                        step={5}
                      />
                      <span className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>°</span>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] mb-0.5 ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>Suora jälkeen</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={bend.straightAfter}
                        onChange={(e) => updateBend(bend.id, 'straightAfter', Number(e.target.value))}
                        className={`w-full px-2 py-1 rounded text-sm ${isFabOS ? 'bg-white border border-gray-300 text-gray-900' : 'bg-slate-800 border border-slate-600 text-white'}`}
                        min={0}
                        step={10}
                      />
                      <span className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>mm</span>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] mb-0.5 ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>Säde R</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={bend.radius}
                        onChange={(e) => updateBend(bend.id, 'radius', Number(e.target.value))}
                        disabled={bend.type === 'lesti'}
                        className={`w-full px-2 py-1 rounded text-sm ${
                          bend.type === 'lesti'
                            ? isFabOS ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : isFabOS ? 'bg-white border border-gray-300 text-gray-900' : 'bg-slate-800 border border-slate-600 text-white'
                        }`}
                        min={bend.type === 'lesti' ? diameter * 2 : diameter * 4}
                        step={5}
                      />
                      <span className={`text-xs ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>mm</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {bends.length === 0 && (
            <div className={`text-center py-4 text-sm ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
              Lisää taivutus yllä olevasta napista
            </div>
          )}
        </div>

        {/* Esikatselu - 2D ja 3D */}
        <div className={`rounded-xl p-4 ${isFabOS ? 'bg-white border border-gray-200' : 'bg-slate-800/50'}`}>
          <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'}`}>3</span>
            Esikatselu
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* 2D Piirtopöytä */}
            <div className="h-64 rounded-lg overflow-hidden">
              <Preview2D
                diameter={diameter}
                startStraight={startStraight}
                bendData={bends}
                viewDirection="top"
              />
            </div>
            {/* 3D Näkymä */}
            <div className="h-64 rounded-lg overflow-hidden">
              <Preview3D
                diameter={diameter}
                wallThickness={wallThickness}
                startStraight={startStraight}
                bendData={bends}
                color={pipeColor}
              />
            </div>
          </div>
          <div className={`mt-2 text-xs flex items-center gap-3 ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
            <span>3D: 🖱️ Pyöritä • 🔍 Zoomaa • ⌨️ Shift+siirrä</span>
            <span>|</span>
            <span>2D: 📐 Mitat ja kulmat</span>
          </div>
        </div>
      </div>

      {/* Footer summary */}
      <div className={`px-4 py-3 border-t ${isFabOS ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700'}`}>
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-4 text-center flex-1">
            <div>
              <div className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Pituus</div>
              <div className={`font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>{calculateTotalLength()} mm</div>
            </div>
            <div>
              <div className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Taivutuksia</div>
              <div className={`font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>{bends.length} kpl</div>
            </div>
            <div>
              <div className={`text-xs ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>Materiaali</div>
              <div className={`font-semibold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>{materialNames[selectedMaterial]}</div>
            </div>
          </div>
          <button
            disabled
            className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium ${
              isFabOS ? 'bg-gray-200 text-gray-400' : 'bg-slate-700 text-slate-500'
            } cursor-not-allowed`}
            title="Pyydä tarjous -toiminto ei ole käytettävissä esikatselussa"
          >
            Pyydä tarjous
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 2D PIIRTOPÖYTÄ
// ============================================
function Preview2D({ diameter, startStraight, bendData, viewDirection }) {
  const svgRef = useRef(null);

  // Laske putken pisteet 2D-näkymää varten
  const calculatePath = () => {
    const points = [];
    const dimensions = []; // Mitat ja kulmat näytettäväksi
    let currentPos = { x: 50, y: 150 }; // Aloituspiste SVG:ssä
    let currentAngle = 0; // Suunta asteina (0 = oikealle)

    const scale = 0.3; // Skaalaus mm -> pikselit

    points.push({ ...currentPos });

    // Alkusuora
    if (startStraight > 0) {
      const endX = currentPos.x + Math.cos(currentAngle * Math.PI / 180) * startStraight * scale;
      const endY = currentPos.y + Math.sin(currentAngle * Math.PI / 180) * startStraight * scale;

      dimensions.push({
        type: 'straight',
        value: startStraight,
        x1: currentPos.x,
        y1: currentPos.y,
        x2: endX,
        y2: endY,
        midX: (currentPos.x + endX) / 2,
        midY: (currentPos.y + endY) / 2 - 15
      });

      currentPos = { x: endX, y: endY };
      points.push({ ...currentPos });
    }

    // Taivutukset
    (bendData || []).forEach((bend, index) => {
      if (bend.angle === 0) return;

      const bendRadius = bend.radius * scale;
      const angleRad = bend.angle * Math.PI / 180;

      // Taivutuksen keskipiste
      const perpAngle = currentAngle + 90;
      const centerX = currentPos.x + Math.cos(perpAngle * Math.PI / 180) * bendRadius;
      const centerY = currentPos.y + Math.sin(perpAngle * Math.PI / 180) * bendRadius;

      // Kaaren pisteet
      const segments = Math.max(8, Math.round(Math.abs(bend.angle) / 10));
      const startAngleRad = (currentAngle - 90) * Math.PI / 180;

      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const arcAngle = startAngleRad + angleRad * t;
        const arcX = centerX + Math.cos(arcAngle) * bendRadius;
        const arcY = centerY + Math.sin(arcAngle) * bendRadius;
        points.push({ x: arcX, y: arcY });
      }

      // Taivutuksen mitta
      dimensions.push({
        type: 'bend',
        angle: bend.angle,
        radius: bend.radius,
        bendType: bend.type,
        x: centerX,
        y: centerY,
        labelX: centerX + Math.cos(startAngleRad + angleRad / 2) * (bendRadius + 25),
        labelY: centerY + Math.sin(startAngleRad + angleRad / 2) * (bendRadius + 25)
      });

      // Päivitä sijainti ja suunta
      currentPos = points[points.length - 1];
      currentAngle += bend.angle;

      // Suora taivutuksen jälkeen
      if (bend.straightAfter > 0) {
        const endX = currentPos.x + Math.cos(currentAngle * Math.PI / 180) * bend.straightAfter * scale;
        const endY = currentPos.y + Math.sin(currentAngle * Math.PI / 180) * bend.straightAfter * scale;

        dimensions.push({
          type: 'straight',
          value: bend.straightAfter,
          x1: currentPos.x,
          y1: currentPos.y,
          x2: endX,
          y2: endY,
          midX: (currentPos.x + endX) / 2,
          midY: (currentPos.y + endY) / 2 - 15
        });

        currentPos = { x: endX, y: endY };
        points.push({ ...currentPos });
      }
    });

    return { points, dimensions };
  };

  const { points, dimensions } = calculatePath();

  // Luo SVG polku
  const pathD = points.length > 0
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  // Laske bounding box ja keskitä näkymä
  const minX = Math.min(...points.map(p => p.x)) - 60;
  const maxX = Math.max(...points.map(p => p.x)) + 60;
  const minY = Math.min(...points.map(p => p.y)) - 60;
  const maxY = Math.max(...points.map(p => p.y)) + 60;
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  return (
    <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative">
      {/* Näkymän suunta-valitsin */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button
          className={`px-2 py-1 text-xs rounded ${viewDirection === 'top' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Ylhäältä"
        >
          ↓
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${viewDirection === 'front' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Edestä"
        >
          →
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${viewDirection === 'side' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}
          title="Sivulta"
        >
          ⊙
        </button>
      </div>

      {/* 2D Label */}
      <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-slate-800/80 rounded text-xs text-slate-400">
        2D Piirtopöytä
      </div>

      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      >
        {/* Ruudukko */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill="url(#grid)" />

        {/* Putki */}
        <path
          d={pathD}
          fill="none"
          stroke="#94a3b8"
          strokeWidth={diameter * 0.3 * 0.3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Keskilinja */}
        <path
          d={pathD}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1"
          strokeDasharray="4 2"
          strokeLinecap="round"
        />

        {/* Mitat ja kulmat */}
        {dimensions.map((dim, i) => (
          <g key={i}>
            {dim.type === 'straight' && (
              <>
                {/* Mittaviiva */}
                <line
                  x1={dim.x1}
                  y1={dim.y1 - 8}
                  x2={dim.x2}
                  y2={dim.y2 - 8}
                  stroke="#10b981"
                  strokeWidth="1"
                  markerStart="url(#arrowStart)"
                  markerEnd="url(#arrowEnd)"
                />
                {/* Mitta-arvo */}
                <rect
                  x={dim.midX - 18}
                  y={dim.midY - 8}
                  width="36"
                  height="14"
                  fill="#0f172a"
                  rx="2"
                />
                <text
                  x={dim.midX}
                  y={dim.midY + 3}
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {dim.value}
                </text>
              </>
            )}
            {dim.type === 'bend' && (
              <>
                {/* Kulma ja säde */}
                <circle
                  cx={dim.x}
                  cy={dim.y}
                  r="3"
                  fill={dim.bendType === 'lesti' ? '#f59e0b' : '#06b6d4'}
                />
                <rect
                  x={dim.labelX - 28}
                  y={dim.labelY - 8}
                  width="56"
                  height="16"
                  fill="#0f172a"
                  rx="2"
                />
                <text
                  x={dim.labelX}
                  y={dim.labelY + 4}
                  textAnchor="middle"
                  fill={dim.bendType === 'lesti' ? '#f59e0b' : '#06b6d4'}
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {dim.angle}° R{dim.radius}
                </text>
              </>
            )}
          </g>
        ))}

        {/* Nuolimerkinnät */}
        <defs>
          <marker id="arrowStart" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
            <path d="M6,0 L0,3 L6,6" fill="none" stroke="#10b981" strokeWidth="1"/>
          </marker>
          <marker id="arrowEnd" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6" fill="none" stroke="#10b981" strokeWidth="1"/>
          </marker>
        </defs>

        {/* Alkupiste merkki */}
        <circle
          cx={points[0]?.x || 50}
          cy={points[0]?.y || 150}
          r="4"
          fill="#22c55e"
          stroke="#0f172a"
          strokeWidth="2"
        />

        {/* Loppupiste merkki */}
        {points.length > 1 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Legenda */}
      <div className="absolute bottom-2 left-2 flex gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-slate-400">Alku</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-slate-400">Loppu</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-cyan-400"></span>
          <span className="text-slate-400">Keskilinja</span>
        </span>
      </div>
    </div>
  );
}

// ============================================
// PARAMETRIT VÄLILEHTI (ADMIN)
// ============================================
function ParametersTab({ params, setParams, selectedSize, setSelectedSize }) {
  const pipeSizes = Object.keys(params).map(Number).sort((a, b) => a - b);
  const currentParams = params[selectedSize] || DEFAULT_PIPE_PARAMS[25];

  const updateParam = (key, value) => {
    setParams(prev => ({
      ...prev,
      [selectedSize]: {
        ...prev[selectedSize],
        [key]: value
      }
    }));
  };

  const toggleMaterial = (material) => {
    const materials = currentParams.materials || [];
    if (materials.includes(material)) {
      updateParam('materials', materials.filter(m => m !== material));
    } else {
      updateParam('materials', [...materials, material]);
    }
  };

  const addPipeSize = () => {
    const newSize = prompt('Anna uusi putkikoko (mm):', '60');
    if (newSize && !isNaN(Number(newSize))) {
      const size = Number(newSize);
      if (!params[size]) {
        setParams(prev => ({
          ...prev,
          [size]: {
            bendRadius: Math.round(size * 1.5),
            minStraight: Math.round(size * 2),
            maxAngle: 180,
            springback: 3,
            minWall: 1.5,
            maxWall: Math.round(size / 10),
            materials: ['steel', 'stainless']
          }
        }));
        setSelectedSize(size);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Putkikoot */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Putkikoko</label>
        <div className="flex flex-wrap gap-2">
          {pipeSizes.map(size => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedSize === size
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Ø{size}mm
            </button>
          ))}
          <button
            onClick={addPipeSize}
            className="px-4 py-2 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-dashed border-emerald-500/50"
          >
            + Lisää
          </button>
        </div>
      </div>

      {/* Parametrit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Taivutussäde */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Taivutussäde (R)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={currentParams.bendRadius}
              onChange={(e) => updateParam('bendRadius', Number(e.target.value))}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
            />
            <span className="text-slate-300 font-medium">mm</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Suositus: {selectedSize * 1.5}-{selectedSize * 2}mm</p>
        </div>

        {/* Suoraosuus minimi */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Suoraosuus minimi
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={currentParams.minStraight}
              onChange={(e) => updateParam('minStraight', Number(e.target.value))}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
            />
            <span className="text-slate-300 font-medium">mm</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Taivutusten välinen minimietäisyys</p>
        </div>

        {/* Maksimitaivutuskulma */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Maksimitaivutuskulma
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={currentParams.maxAngle}
              onChange={(e) => updateParam('maxAngle', Number(e.target.value))}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
              max={180}
            />
            <span className="text-slate-300 font-medium">°</span>
          </div>
        </div>

        {/* Takaisinjousto */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Takaisinjousto-korjaus
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={currentParams.springback}
              onChange={(e) => updateParam('springback', Number(e.target.value))}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
              step={0.5}
            />
            <span className="text-slate-300 font-medium">°</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Springback-kompensaatio</p>
        </div>

        {/* Seinämäpaksuus */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Seinämäpaksuus
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={currentParams.minWall}
              onChange={(e) => updateParam('minWall', Number(e.target.value))}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center"
              step={0.5}
            />
            <span className="text-slate-300">-</span>
            <input
              type="number"
              value={currentParams.maxWall}
              onChange={(e) => updateParam('maxWall', Number(e.target.value))}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center"
              step={0.5}
            />
            <span className="text-slate-300 font-medium">mm</span>
          </div>
        </div>

        {/* Materiaalit */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Tuetut materiaalit
          </label>
          <div className="flex flex-wrap gap-2">
            {['steel', 'stainless', 'aluminum'].map(mat => (
              <button
                key={mat}
                onClick={() => toggleMaterial(mat)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  currentParams.materials?.includes(mat)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-slate-700 text-slate-400 border border-slate-600'
                }`}
              >
                {mat === 'steel' ? 'Teräs' : mat === 'stainless' ? 'RST' : 'Alumiini'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tallennus info */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Parametrit tallentuvat automaattisesti selaimen muistiin
      </div>
    </div>
  );
}

// ============================================
// KÄYTTÖ VÄLILEHTI (ASIAKAS)
// ============================================
function UsageTab({ params, selectedSize, pipeColor }) {
  const currentParams = params[selectedSize] || DEFAULT_PIPE_PARAMS[25];
  const availableSizes = Object.keys(params).map(Number).sort((a, b) => a - b);

  const [pipeData, setPipeData] = useState({
    diameter: selectedSize,
    wallThickness: currentParams.minWall,
    material: currentParams.materials?.[0] || 'steel'
  });

  // Uusi rakenne: alkusuora + taivutukset (kulma + suora taivutuksen jälkeen)
  const [startStraight, setStartStraight] = useState(100);

  // Taivutustyypit: 'lesti' = kiinteä R (2x halkaisija), 'rullaus' = säädettävä R (min 4x halkaisija)
  const getDefaultRadius = (type, diameter) => {
    if (type === 'lesti') {
      return diameter * 2; // Lesti: R = 2 × halkaisija
    }
    return diameter * 4; // Rullaus: oletus R = 4 × halkaisija (minimi)
  };

  const getMinRadius = (type, diameter) => {
    if (type === 'lesti') {
      return diameter * 2; // Lesti: kiinteä
    }
    return diameter * 4; // Rullaus: minimi 4 × halkaisija
  };

  const [bends, setBends] = useState([
    { id: 1, angle: 90, straightAfter: 100, type: 'lesti', radius: selectedSize * 2 }
  ]);

  // Päivitä kun koko vaihtuu
  useEffect(() => {
    setPipeData(prev => ({
      ...prev,
      diameter: selectedSize,
      wallThickness: currentParams.minWall,
      material: currentParams.materials?.[0] || 'steel'
    }));
    // Päivitä säteet uuden koon mukaan
    setBends(prev => prev.map(b => ({
      ...b,
      radius: b.type === 'lesti' ? selectedSize * 2 : Math.max(b.radius, selectedSize * 4)
    })));
  }, [selectedSize, currentParams]);

  const addBend = () => {
    setBends([...bends, {
      id: Date.now(),
      angle: 90,
      straightAfter: currentParams.minStraight + 20,
      type: 'lesti',
      radius: pipeData.diameter * 2
    }]);
  };

  const updateBendType = (id, newType) => {
    setBends(bends.map(b => {
      if (b.id === id) {
        const newRadius = getDefaultRadius(newType, pipeData.diameter);
        return { ...b, type: newType, radius: newRadius };
      }
      return b;
    }));
  };

  const updateBend = (id, field, value) => {
    setBends(bends.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBend = (id) => {
    setBends(bends.filter(b => b.id !== id));
  };

  // Validoi taivutukset
  const validateBends = () => {
    const errors = [];

    // Tarkista alkusuora
    if (startStraight < currentParams.minStraight) {
      errors.push({ bendId: 'start', type: 'start', message: `Alkusuora ${startStraight}mm < minimi ${currentParams.minStraight}mm` });
    }

    bends.forEach((bend, index) => {
      // Tarkista kulma
      if (Math.abs(bend.angle) > currentParams.maxAngle) {
        errors.push({ bendId: bend.id, type: 'angle', message: `Taivutus ${index + 1}: Kulma ${bend.angle}° ylittää maksimin ${currentParams.maxAngle}°` });
      }

      // Tarkista suoraosuus taivutuksen jälkeen
      if (bend.straightAfter < currentParams.minStraight) {
        errors.push({ bendId: bend.id, type: 'straight', message: `Taivutus ${index + 1}: Suora ${bend.straightAfter}mm < minimi ${currentParams.minStraight}mm` });
      }

      // Tarkista säde taivutustyypin mukaan
      const minRadius = getMinRadius(bend.type, pipeData.diameter);
      if (bend.radius < minRadius) {
        errors.push({ bendId: bend.id, type: 'radius', message: `Taivutus ${index + 1}: Säde ${bend.radius}mm < minimi ${minRadius}mm (${bend.type === 'lesti' ? 'lesti' : 'rullaus'})` });
      }
    });

    return errors;
  };

  const errors = validateBends();
  const getBendErrors = (bendId) => errors.filter(e => e.bendId === bendId);

  // Laske kokonaispituus (sis. taivutusvarat)
  const calculateTotalLength = () => {
    let total = startStraight;
    bends.forEach(bend => {
      // Taivutuksen kaaren pituus keskilinjalla
      const arcLength = (Math.abs(bend.angle) / 180) * Math.PI * bend.radius;
      total += arcLength + bend.straightAfter;
    });
    return Math.round(total);
  };

  const materialNames = {
    steel: 'Teräs',
    stainless: 'Ruostumaton teräs (RST)',
    aluminum: 'Alumiini'
  };

  return (
    <div className="space-y-6">
      {/* 1. Putken tiedot */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm flex items-center justify-center">1</span>
          Putken tiedot
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Ulkohalkaisija</label>
            <select
              value={pipeData.diameter}
              onChange={(e) => setPipeData({ ...pipeData, diameter: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              {availableSizes.map(size => (
                <option key={size} value={size}>Ø{size} mm</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Seinämä</label>
            <select
              value={pipeData.wallThickness}
              onChange={(e) => setPipeData({ ...pipeData, wallThickness: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              {[currentParams.minWall, (currentParams.minWall + currentParams.maxWall) / 2, currentParams.maxWall].map(w => (
                <option key={w} value={w}>{w.toFixed(1)} mm</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Materiaali</label>
            <select
              value={pipeData.material}
              onChange={(e) => setPipeData({ ...pipeData, material: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              {currentParams.materials?.map(mat => (
                <option key={mat} value={mat}>{materialNames[mat]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Taivutukset */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm flex items-center justify-center">2</span>
            Taivutukset
          </h3>
          <button
            onClick={addBend}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Lisää taivutus
          </button>
        </div>

        <div className="space-y-3">
          {/* Alkusuora */}
          <div className={`p-4 rounded-lg ${
            getBendErrors('start').length > 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'
          }`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-medium">Alkusuora</span>
                <span className="text-slate-300 text-sm">(ennen ensimmäistä taivutusta)</span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="number"
                  value={startStraight}
                  onChange={(e) => setStartStraight(Number(e.target.value))}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-center"
                  min={0}
                  step={5}
                />
                <span className="text-slate-300 font-medium">mm</span>
                {getBendErrors('start').length > 0 ? (
                  <span className="text-red-400" title={getBendErrors('start')[0].message}>⚠️</span>
                ) : (
                  <span className="text-emerald-400">✓</span>
                )}
              </div>
            </div>
          </div>

          {/* Taivutuslista */}
          {bends.length > 0 && (
            <>
              {bends.map((bend, index) => {
                const bendErrors = getBendErrors(bend.id);
                const hasError = bendErrors.length > 0;
                const minRadius = getMinRadius(bend.type, pipeData.diameter);

                return (
                  <div
                    key={bend.id}
                    className={`p-4 rounded-lg ${
                      hasError ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-900/50'
                    }`}
                  >
                    {/* Taivutuksen otsikko ja tyyppi */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-medium">Taivutus {index + 1}</span>
                        {/* Taivutustyyppi toggle */}
                        <div className="flex bg-slate-800 rounded-lg p-0.5">
                          <button
                            onClick={() => updateBendType(bend.id, 'lesti')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                              bend.type === 'lesti'
                                ? 'bg-amber-500 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Lesti
                          </button>
                          <button
                            onClick={() => updateBendType(bend.id, 'rullaus')}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                              bend.type === 'rullaus'
                                ? 'bg-cyan-500 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Rullaus
                          </button>
                        </div>
                        <span className="text-xs text-slate-500">
                          {bend.type === 'lesti' ? `(R = 2×Ø = ${pipeData.diameter * 2}mm)` : `(min R = 4×Ø = ${pipeData.diameter * 4}mm)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasError ? (
                          <span className="text-red-400" title={bendErrors[0].message}>⚠️</span>
                        ) : (
                          <span className="text-emerald-400">✓</span>
                        )}
                        <button
                          onClick={() => removeBend(bend.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Taivutuksen arvot */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Kulma</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={bend.angle}
                            onChange={(e) => updateBend(bend.id, 'angle', Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-sm"
                            min={-180}
                            max={180}
                            step={5}
                          />
                          <span className="text-slate-300 text-sm font-medium">°</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Suora jälkeen</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={bend.straightAfter}
                            onChange={(e) => updateBend(bend.id, 'straightAfter', Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-sm"
                            min={0}
                            step={5}
                          />
                          <span className="text-slate-300 text-sm font-medium">mm</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Säde (R) {bend.type === 'lesti' && <span className="text-amber-400">(kiinteä)</span>}
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={bend.radius}
                            onChange={(e) => updateBend(bend.id, 'radius', Number(e.target.value))}
                            className={`w-full border rounded px-2 py-1.5 text-white text-sm ${
                              bend.type === 'lesti'
                                ? 'bg-slate-700 border-slate-600 cursor-not-allowed'
                                : 'bg-slate-800 border-slate-700'
                            }`}
                            min={minRadius}
                            step={5}
                            disabled={bend.type === 'lesti'}
                          />
                          <span className="text-slate-300 text-sm font-medium">mm</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {bends.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              Ei taivutuksia. Lisää taivutus yllä olevasta napista.
            </div>
          )}
        </div>

        {/* Virheet */}
        {errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <h4 className="text-red-400 font-medium mb-2">Huomiot:</h4>
            <ul className="text-sm text-red-300 space-y-1">
              {errors.map((error, i) => (
                <li key={i}>• {error.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Visuaalinen esitys */}
        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
          <div className="text-sm text-slate-300 mb-2">Rakenne:</div>
          <div className="flex items-center gap-1 flex-wrap text-sm">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">{startStraight}mm</span>
            {bends.map((bend, index) => (
              <React.Fragment key={bend.id}>
                <span className="text-slate-500">→</span>
                <span className={`px-2 py-1 rounded ${
                  bend.type === 'lesti'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {bend.angle}° {bend.type === 'lesti' ? '(L)' : '(R)'} R{bend.radius}
                </span>
                <span className="text-slate-500">→</span>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">{bend.straightAfter}mm</span>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            <span className="text-amber-400">(L)</span> = Lesti, <span className="text-cyan-400">(R)</span> = Rullaus
          </div>
        </div>
      </div>

      {/* 3. Esikatselu - 2D ja 3D vierekkäin */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm flex items-center justify-center">3</span>
          Esikatselu
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 2D Piirtopöytä */}
          <div className="h-80">
            <Preview2D
              diameter={pipeData.diameter}
              startStraight={startStraight}
              bendData={bends}
              viewDirection="top"
            />
          </div>

          {/* 3D Näkymä */}
          <div className="h-80">
            <Preview3D
              diameter={pipeData.diameter}
              wallThickness={pipeData.wallThickness}
              startStraight={startStraight}
              bendData={bends}
              color={pipeColor}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
          <span className="font-medium text-slate-300">3D:</span>
          <span>🖱️ Pyöritä</span>
          <span>🔍 Zoomaa</span>
          <span>⌨️ Shift+siirrä</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="font-medium text-slate-300">2D:</span>
          <span>📐 Mitat ja kulmat</span>
        </div>
      </div>

      {/* Yhteenveto */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-slate-800/50 rounded-xl p-6 border border-emerald-500/30">
        <h3 className="text-lg font-semibold text-white mb-4">Yhteenveto</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-sm text-slate-300">Kokonaispituus</div>
            <div className="text-2xl font-bold text-white">{calculateTotalLength()} mm</div>
          </div>
          <div>
            <div className="text-sm text-slate-300">Taivutuksia</div>
            <div className="text-2xl font-bold text-white">{bends.length} kpl</div>
          </div>
          <div>
            <div className="text-sm text-slate-300">Materiaali</div>
            <div className="text-2xl font-bold text-white">{materialNames[pipeData.material]}</div>
          </div>
          <div>
            <div className="text-sm text-slate-300">Status</div>
            <div className={`text-2xl font-bold ${errors.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {errors.length > 0 ? 'Tarkista' : 'OK'}
            </div>
          </div>
        </div>

        <button
          disabled={errors.length > 0}
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            errors.length > 0
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {errors.length > 0 ? 'Korjaa virheet ensin' : 'Pyydä tarjous'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// PÄÄKOMPONENTTI
// ============================================
const PipeBendingApp = ({ onBack }) => {
  const { theme } = useTheme();
  const isFabOS = theme === THEMES.FABOS;
  const [activeTab, setActiveTab] = useState('usage'); // 'usage' | 'params'
  const [selectedSize, setSelectedSize] = useState(25);

  // AI Platform state
  const [showAIChat, setShowAIChat] = useState(false);
  const [showDevelopmentMode, setShowDevelopmentMode] = useState(false);
  const [showVersionGallery, setShowVersionGallery] = useState(false);
  const [currentVersionId, setCurrentVersionId] = useState(null);
  const [currentVersionName, setCurrentVersionName] = useState('Perusversio');

  // Module configuration from selected version
  const [moduleConfig, setModuleConfig] = useState({
    features: {
      '3dVisualization': true,
      multipleBends: true,
      maxBends: 10,
      exportDXF: false,
      autoRotate: false
    },
    ui: {
      theme: 'default',
      showGrid: true,
      showAxes: true
    },
    defaults: {
      pipeDiameter: 25,
      wallThickness: 2,
      material: 'steel'
    },
    limits: {
      minDiameter: 10,
      maxDiameter: 100,
      minRadius: 20,
      maxRadius: 500
    },
    materials: ['steel', 'stainless', 'aluminum', 'copper']
  });

  // Lataa parametrit localStoragesta
  const [params, setParams] = useState(() => {
    const saved = localStorage.getItem('pipeBending_params');
    return saved ? JSON.parse(saved) : DEFAULT_PIPE_PARAMS;
  });

  // Tallenna parametrit localStorageen
  useEffect(() => {
    localStorage.setItem('pipeBending_params', JSON.stringify(params));
  }, [params]);

  // Handle version selection from gallery
  const handleVersionSelect = (version) => {
    setCurrentVersionId(version.id);
    setCurrentVersionName(version.name);

    // Apply version config if available
    if (version.config) {
      const config = version.config;

      // Update module configuration
      setModuleConfig(prev => ({
        features: { ...prev.features, ...config.features },
        ui: { ...prev.ui, ...config.ui },
        defaults: { ...prev.defaults, ...config.defaults },
        limits: { ...prev.limits, ...config.limits },
        materials: config.materials || prev.materials
      }));

      // Apply defaults to selected size if specified
      if (config.defaults?.pipeDiameter) {
        const newSize = config.defaults.pipeDiameter;
        if (params[newSize]) {
          setSelectedSize(newSize);
        }
      }

      console.log('Applied version config:', config);
    }

    setShowVersionGallery(false);
  };

  // Handle new version created from AI chat
  const handleVersionCreated = (newVersion) => {
    console.log('New version created:', newVersion);

    // Apply the new version's config
    if (newVersion.config) {
      handleVersionSelect(newVersion);
    }
  };

  return (
    <div className={isFabOS
      ? "min-h-screen bg-[#F7F7F7] text-gray-900"
      : "min-h-screen bg-[#0a0a0f] text-white"
    }>
      {/* Header */}
      <header className={isFabOS
        ? "border-b border-gray-200 px-6 py-4 bg-[#1A1A2E]"
        : "border-b border-emerald-500/30 px-6 py-4 bg-gradient-to-r from-emerald-500/5 to-transparent"
      }>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
            <div className={isFabOS ? "h-6 w-px bg-gray-600" : "h-6 w-px bg-slate-800"} />
            {isFabOS ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
                  <span className="text-xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
                </div>
                <span className="px-2 py-1 bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold rounded">V0.3</span>
                <span className="text-white font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Putkentaivutus</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔧</span>
                <h1 className="text-xl font-bold text-emerald-400">Putkentaivutus</h1>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">BETA</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* AI Platform Buttons */}
            {/* Current version indicator */}
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              isFabOS
                ? 'bg-slate-700/50 text-slate-300'
                : 'bg-slate-800/50 text-slate-400'
            }`}>
              <span className="opacity-60">Versio:</span>{' '}
              <span className="font-semibold">{currentVersionName}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowVersionGallery(true)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isFabOS
                    ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                    : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                }`}
                title="Selaa kaikkia versioita"
              >
                <span>📚</span>
                <span className="hidden sm:inline">Versiot</span>
              </button>
              <button
                onClick={() => setShowDevelopmentMode(true)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  isFabOS
                    ? 'bg-gradient-to-r from-[#FF6B35] to-amber-500 text-white hover:opacity-90'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90'
                }`}
                title="Avaa AI-kehitystila esikatselulla"
              >
                <span>🤖</span>
                <span className="hidden sm:inline">Tee uusi kehitysversio</span>
              </button>
            </div>

            <div className={isFabOS ? "h-6 w-px bg-gray-600" : "h-6 w-px bg-slate-700"} />

            {/* Tabs */}
            <div className={isFabOS
              ? "flex bg-white/10 rounded-lg p-1"
              : "flex bg-slate-800 rounded-lg p-1"
            }>
              <button
                onClick={() => setActiveTab('usage')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'usage'
                    ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'
                    : isFabOS ? 'text-gray-300 hover:text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Käyttö
              </button>
              <button
                onClick={() => setActiveTab('params')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'params'
                    ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-emerald-500 text-white'
                    : isFabOS ? 'text-gray-300 hover:text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Parametrit
              </button>
            </div>
            <ThemeSwitcher variant="dark" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'params' ? (
          <ParametersTab
            params={params}
            setParams={setParams}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
          />
        ) : (
          <UsageTab
            params={params}
            selectedSize={selectedSize}
            pipeColor={moduleConfig?.ui?.pipeColor}
          />
        )}
      </main>

      {/* AI Chat Modal */}
      {showAIChat && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-4 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAIChat(false)}
          />
          {/* Modal - positioned higher so version number stays below */}
          <div className={`relative w-full max-w-lg h-[75vh] rounded-2xl overflow-hidden shadow-2xl ${
            isFabOS ? 'bg-white' : 'bg-slate-800'
          }`}>
            {/* Header with full development mode button */}
            <div className={`absolute top-0 right-12 z-10 p-2`}>
              <button
                onClick={() => {
                  setShowAIChat(false);
                  setShowDevelopmentMode(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  isFabOS
                    ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                    : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
                }`}
                title="Avaa täysi kehitystila esikatselulla"
              >
                <span>🖥️</span>
                Täysi kehitystila
              </button>
            </div>
            <AIChat
              moduleId="pipe-bending"
              currentConfig={moduleConfig}
              isFabOS={isFabOS}
              onVersionCreated={handleVersionCreated}
              onClose={() => setShowAIChat(false)}
            />
          </div>
        </div>
      )}

      {/* Full Development Mode */}
      {showDevelopmentMode && (
        <div className="fixed inset-0 z-50">
          <DevelopmentMode
            moduleId="pipe-bending"
            currentConfig={moduleConfig}
            isFabOS={isFabOS}
            onVersionCreated={handleVersionCreated}
            onClose={() => setShowDevelopmentMode(false)}
            AppComponent={PipeBendingPreview}
            appProps={{ isFabOS }}
          />
        </div>
      )}

      {/* Version Gallery Modal */}
      {showVersionGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowVersionGallery(false)}
          />
          {/* Modal */}
          <div className={`relative w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl ${
            isFabOS ? 'bg-white' : 'bg-slate-900'
          }`}>
            <VersionGallery
              moduleId="pipe-bending"
              isFabOS={isFabOS}
              currentVersionId={currentVersionId}
              onSelectVersion={handleVersionSelect}
              onClose={() => setShowVersionGallery(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PipeBendingApp;
