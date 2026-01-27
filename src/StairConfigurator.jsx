import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme, THEMES } from './contexts/ThemeContext';
import ThemeSwitcher from './components/ThemeSwitcher';
import { ProfileDropdown } from './components/auth';

// ═══════════════════════════════════════════════════════════════════════════════
// IFC-GENEROINTI
// ═══════════════════════════════════════════════════════════════════════════════

function generateGuid() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
  return Array.from({length: 22}, () => chars[Math.floor(Math.random() * 64)]).join('');
}

function generateIFC(params) {
  const {
    askelmia, askelnousu, askelmaLeveys, askelmaSyvyys, askelmaKorkeus,
    lattaKorkeus, sivupalkkiH, sivupalkkiW, sivupalkkiT,
    valitukiKoko, ylalevyL, ylalevyW, alalevyL, alalevyW, levyPaksuus
  } = params;

  const kokonaisKorkeus = askelmia * askelnousu;
  const kokonaisPituus = askelmia * askelmaSyvyys;
  const stringerAngle = Math.atan2(kokonaisKorkeus, kokonaisPituus);
  const stringerLength = Math.sqrt(kokonaisPituus ** 2 + kokonaisKorkeus ** 2);
  const jiiriDepth = sivupalkkiH * Math.tan(stringerAngle);

  let entityId = 0;
  const nextId = () => ++entityId;
  const now = new Date().toISOString().split('.')[0];

  let ifc = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition[DesignTransferView]'),'2;1');
FILE_NAME('LK_Porras_Suora.ifc','${now}',('LK Porras Konfiguraattori'),('LK Porras Oy'),'','','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
`;

  // Yksiköt ja perustiedot
  const unitIds = { length: nextId(), area: nextId(), volume: nextId(), assign: nextId() };
  ifc += `#${unitIds.length}=IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);
#${unitIds.area}=IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);
#${unitIds.volume}=IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);
#${unitIds.assign}=IFCUNITASSIGNMENT((#${unitIds.length},#${unitIds.area},#${unitIds.volume}));
`;

  // Origo ja akselit
  const originId = nextId();
  const zDirId = nextId();
  const xDirId = nextId();
  const axis2Id = nextId();
  ifc += `#${originId}=IFCCARTESIANPOINT((0.,0.,0.));
#${zDirId}=IFCDIRECTION((0.,0.,1.));
#${xDirId}=IFCDIRECTION((1.,0.,0.));
#${axis2Id}=IFCAXIS2PLACEMENT3D(#${originId},#${zDirId},#${xDirId});
`;

  // Konteksti
  const contextId = nextId();
  const subContextId = nextId();
  ifc += `#${contextId}=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#${axis2Id},$);
#${subContextId}=IFCGEOMETRICREPRESENTATIONSUBCONTEXT('Body','Model',*,*,*,*,#${contextId},$,.MODEL_VIEW.,$);
`;

  // Owner history
  const personId = nextId();
  const orgId = nextId();
  const personOrgId = nextId();
  const appId = nextId();
  const ownerHistoryId = nextId();
  ifc += `#${personId}=IFCPERSON($,'Kayttaja',$,$,$,$,$,$);
#${orgId}=IFCORGANIZATION($,'LK Porras Oy',$,$,$);
#${personOrgId}=IFCPERSONANDORGANIZATION(#${personId},#${orgId},$);
#${appId}=IFCAPPLICATION(#${orgId},'1.0','LK Porras Konfiguraattori','LKPORRAS');
#${ownerHistoryId}=IFCOWNERHISTORY(#${personOrgId},#${appId},$,.ADDED.,${Math.floor(Date.now()/1000)},#${personOrgId},#${appId},${Math.floor(Date.now()/1000)});
`;

  // Projekti
  const projectId = nextId();
  ifc += `#${projectId}=IFCPROJECT('${generateGuid()}',#${ownerHistoryId},'LK Porras - Suora porras',$,$,$,$,(#${contextId}),#${unitIds.assign});
`;

  // Site, Building, Storey
  const sitePlacementId = nextId();
  const siteId = nextId();
  ifc += `#${sitePlacementId}=IFCLOCALPLACEMENT($,#${axis2Id});
#${siteId}=IFCSITE('${generateGuid()}',#${ownerHistoryId},'Tyomaa',$,$,#${sitePlacementId},$,$,.ELEMENT.,$,$,$,$,$);
`;

  const buildingPlacementId = nextId();
  const buildingId = nextId();
  ifc += `#${buildingPlacementId}=IFCLOCALPLACEMENT(#${sitePlacementId},#${axis2Id});
#${buildingId}=IFCBUILDING('${generateGuid()}',#${ownerHistoryId},'Rakennus',$,$,#${buildingPlacementId},$,$,.ELEMENT.,$,$,$);
`;

  const storeyPlacementId = nextId();
  const storeyId = nextId();
  ifc += `#${storeyPlacementId}=IFCLOCALPLACEMENT(#${buildingPlacementId},#${axis2Id});
#${storeyId}=IFCBUILDINGSTOREY('${generateGuid()}',#${ownerHistoryId},'Kerros 1',$,$,#${storeyPlacementId},$,$,.ELEMENT.,0.);
`;

  // Aggregaatiot
  ifc += `#${nextId()}=IFCRELAGGREGATES('${generateGuid()}',#${ownerHistoryId},$,$,#${projectId},(#${siteId}));
#${nextId()}=IFCRELAGGREGATES('${generateGuid()}',#${ownerHistoryId},$,$,#${siteId},(#${buildingId}));
#${nextId()}=IFCRELAGGREGATES('${generateGuid()}',#${ownerHistoryId},$,$,#${buildingId},(#${storeyId}));
`;

  const elementIds = [];

  // Apufunktio: Luo RHS-profiili
  function createRHSProfile(name, h, w, t) {
    const profId = nextId();
    const placementId = nextId();
    const p2dId = nextId();
    const dirId = nextId();
    ifc += `#${p2dId}=IFCCARTESIANPOINT((0.,0.));
#${dirId}=IFCDIRECTION((1.,0.));
#${placementId}=IFCAXIS2PLACEMENT2D(#${p2dId},#${dirId});
#${profId}=IFCRECTANGLEHOLLOWPROFILEDEF(.AREA.,'${name}',#${placementId},${h.toFixed(2)},${w.toFixed(2)},${t.toFixed(2)},${t.toFixed(2)},${t.toFixed(2)});
`;
    return profId;
  }

  // Apufunktio: Luo suorakaide-profiili
  function createRectProfile(name, h, w) {
    const profId = nextId();
    const placementId = nextId();
    const p2dId = nextId();
    const dirId = nextId();
    ifc += `#${p2dId}=IFCCARTESIANPOINT((0.,0.));
#${dirId}=IFCDIRECTION((1.,0.));
#${placementId}=IFCAXIS2PLACEMENT2D(#${p2dId},#${dirId});
#${profId}=IFCRECTANGLEPROFILEDEF(.AREA.,'${name}',#${placementId},${h.toFixed(2)},${w.toFixed(2)});
`;
    return profId;
  }

  // Apufunktio: Luo pursotus
  function createExtrusion(profileId, length, originX, originY, originZ, dirX = 0, dirY = 0, dirZ = 1, refX = 1, refY = 0, refZ = 0) {
    const locId = nextId();
    const axisZId = nextId();
    const axisXId = nextId();
    const axis3dId = nextId();
    const extDirId = nextId();
    const solidId = nextId();

    ifc += `#${locId}=IFCCARTESIANPOINT((${originX.toFixed(2)},${originY.toFixed(2)},${originZ.toFixed(2)}));
#${axisZId}=IFCDIRECTION((${dirX.toFixed(6)},${dirY.toFixed(6)},${dirZ.toFixed(6)}));
#${axisXId}=IFCDIRECTION((${refX.toFixed(6)},${refY.toFixed(6)},${refZ.toFixed(6)}));
#${axis3dId}=IFCAXIS2PLACEMENT3D(#${locId},#${axisZId},#${axisXId});
#${extDirId}=IFCDIRECTION((0.,0.,1.));
#${solidId}=IFCEXTRUDEDAREASOLID(#${profileId},#${axis3dId},#${extDirId},${length.toFixed(2)});
`;
    return solidId;
  }

  // Apufunktio: Luo elementti
  function createElement(name, ifcClass, solidId) {
    const shapeRepId = nextId();
    const prodDefId = nextId();
    const placementId = nextId();
    const elemId = nextId();

    ifc += `#${shapeRepId}=IFCSHAPEREPRESENTATION(#${subContextId},'Body','SweptSolid',(#${solidId}));
#${prodDefId}=IFCPRODUCTDEFINITIONSHAPE($,$,(#${shapeRepId}));
#${placementId}=IFCLOCALPLACEMENT(#${storeyPlacementId},#${axis2Id});
#${elemId}=${ifcClass}('${generateGuid()}',#${ownerHistoryId},'${name}',$,$,#${placementId},#${prodDefId},$,$);
`;
    elementIds.push(elemId);
    return elemId;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GEOMETRIAN LUONTI
  // ═══════════════════════════════════════════════════════════════════════════

  const cos = Math.cos(stringerAngle);
  const sin = Math.sin(stringerAngle);
  const sivuOffset = askelmaLeveys / 2 + sivupalkkiW / 2 + 10;

  // --- SIVUPALKIT RHS ---
  const rhsProfileId = createRHSProfile(`RHS${sivupalkkiH}x${sivupalkkiW}x${sivupalkkiT}`, sivupalkkiH, sivupalkkiW, sivupalkkiT);

  // Vasen sivupalkki (kalteva)
  const leftStringerSolid = createExtrusion(
    rhsProfileId, stringerLength,
    jiiriDepth, -sivuOffset, sivupalkkiH / 2,
    cos, 0, sin,
    0, 1, 0
  );
  createElement('Sivupalkki_vasen_RHS', 'IFCMEMBER', leftStringerSolid);

  // Oikea sivupalkki (kalteva)
  const rightStringerSolid = createExtrusion(
    rhsProfileId, stringerLength,
    jiiriDepth, sivuOffset, sivupalkkiH / 2,
    cos, 0, sin,
    0, 1, 0
  );
  createElement('Sivupalkki_oikea_RHS', 'IFCMEMBER', rightStringerSolid);

  // --- ALAPÄÄN VAAKAJALAT ---
  const footLength = 150;
  const leftFootSolid = createExtrusion(
    rhsProfileId, footLength,
    -footLength + jiiriDepth, -sivuOffset, sivupalkkiH / 2,
    1, 0, 0,
    0, 1, 0
  );
  createElement('Jalka_vasen', 'IFCMEMBER', leftFootSolid);

  const rightFootSolid = createExtrusion(
    rhsProfileId, footLength,
    -footLength + jiiriDepth, sivuOffset, sivupalkkiH / 2,
    1, 0, 0,
    0, 1, 0
  );
  createElement('Jalka_oikea', 'IFCMEMBER', rightFootSolid);

  // --- ALALEVYT PL6 ---
  const alalevyProfile = createRectProfile('Alalevy', alalevyL, alalevyW);
  const leftAlalevySolid = createExtrusion(
    alalevyProfile, levyPaksuus,
    -footLength + jiiriDepth - alalevyL / 2, -sivuOffset, 0,
    0, 0, 1,
    1, 0, 0
  );
  createElement('Alalevy_vasen', 'IFCPLATE', leftAlalevySolid);

  const rightAlalevySolid = createExtrusion(
    alalevyProfile, levyPaksuus,
    -footLength + jiiriDepth - alalevyL / 2, sivuOffset, 0,
    0, 0, 1,
    1, 0, 0
  );
  createElement('Alalevy_oikea', 'IFCPLATE', rightAlalevySolid);

  // --- YLÄLEVYT PL6 ---
  const ylalevyProfile = createRectProfile('Ylalevy', ylalevyL, ylalevyW);
  const ylaX = kokonaisPituus + jiiriDepth;
  const leftYlalevySolid = createExtrusion(
    ylalevyProfile, levyPaksuus,
    ylaX, -sivuOffset, kokonaisKorkeus - sivupalkkiH / 2,
    0, 0, 1,
    1, 0, 0
  );
  createElement('Ylalevy_vasen', 'IFCPLATE', leftYlalevySolid);

  const rightYlalevySolid = createExtrusion(
    ylalevyProfile, levyPaksuus,
    ylaX, sivuOffset, kokonaisKorkeus - sivupalkkiH / 2,
    0, 0, 1,
    1, 0, 0
  );
  createElement('Ylalevy_oikea', 'IFCPLATE', rightYlalevySolid);

  // --- ASKELMAT (ritilä + latta) ---
  const askelmaProfile = createRectProfile('Ritila', askelmaKorkeus, askelmaLeveys);
  const lattaProfile = createRectProfile('Latta', lattaKorkeus, askelmaLeveys);

  for (let i = 0; i < askelmia; i++) {
    const stepX = (i + 0.5) * askelmaSyvyys + jiiriDepth;
    const stepZ = (i + 1) * askelnousu;

    // Ritilä-askelma
    const ritilaSolid = createExtrusion(
      askelmaProfile, askelmaSyvyys,
      stepX - askelmaSyvyys / 2, 0, stepZ - askelmaKorkeus,
      1, 0, 0,
      0, 1, 0
    );
    createElement(`Askelma_${i + 1}_ritila`, 'IFCSLAB', ritilaSolid);

    // Etulatta
    const lattaSolid = createExtrusion(
      lattaProfile, 5,
      stepX - askelmaSyvyys / 2 - 5, 0, stepZ - lattaKorkeus,
      1, 0, 0,
      0, 1, 0
    );
    createElement(`Askelma_${i + 1}_latta`, 'IFCPLATE', lattaSolid);
  }

  // --- VÄLITUET 30x30x3 ---
  const valitukiProfile = createRectProfile('Valituki', valitukiKoko, valitukiKoko);
  for (let i = 0; i < askelmia; i++) {
    const stepX = (i + 0.5) * askelmaSyvyys + jiiriDepth;
    const stepZ = (i + 1) * askelnousu;

    // Vasen välituki
    const leftTukiSolid = createExtrusion(
      valitukiProfile, sivupalkkiH - 20,
      stepX, -askelmaLeveys / 2 + 50, stepZ - askelmaKorkeus - sivupalkkiH + 20,
      0, 0, 1,
      1, 0, 0
    );
    createElement(`Valituki_${i + 1}_vasen`, 'IFCMEMBER', leftTukiSolid);

    // Oikea välituki
    const rightTukiSolid = createExtrusion(
      valitukiProfile, sivupalkkiH - 20,
      stepX, askelmaLeveys / 2 - 50, stepZ - askelmaKorkeus - sivupalkkiH + 20,
      0, 0, 1,
      1, 0, 0
    );
    createElement(`Valituki_${i + 1}_oikea`, 'IFCMEMBER', rightTukiSolid);
  }

  // Spatiaalinen liitos
  ifc += `#${nextId()}=IFCRELCONTAINEDINSPATIALSTRUCTURE('${generateGuid()}',#${ownerHistoryId},$,$,(${elementIds.map(id => '#' + id).join(',')}),#${storeyId});
`;

  ifc += `ENDSEC;
END-ISO-10303-21;
`;

  return ifc;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORBIT CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════

class OrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0.5, 0);
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    this.scale = 1;
    this.panOffset = new THREE.Vector3();
    this.rotateSpeed = 0.005;
    this.zoomSpeed = 0.001;
    this.panSpeed = 0.003;
    this.isMouseDown = false;
    this.mouseButton = -1;
    this.lastX = 0;
    this.lastY = 0;

    const offset = new THREE.Vector3().copy(camera.position).sub(this.target);
    this.spherical.setFromVector3(offset);
    this.bindEvents();
  }

  bindEvents() {
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);

    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', e => e.preventDefault());
    this.domElement.addEventListener('touchstart', this.onTouchStart);
    this.domElement.addEventListener('touchmove', this.onTouchMove);
    this.domElement.addEventListener('touchend', this.onTouchEnd);
  }

  onMouseDown(e) {
    this.isMouseDown = true;
    this.mouseButton = e.button;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  onMouseMove(e) {
    if (!this.isMouseDown) return;
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;

    if (this.mouseButton === 0) {
      this.sphericalDelta.theta -= dx * this.rotateSpeed;
      this.sphericalDelta.phi -= dy * this.rotateSpeed;
    } else if (this.mouseButton === 2) {
      const panX = dx * this.panSpeed;
      const panY = -dy * this.panSpeed;
      const offset = new THREE.Vector3();
      offset.setFromMatrixColumn(this.camera.matrix, 0).multiplyScalar(-panX);
      this.panOffset.add(offset);
      offset.setFromMatrixColumn(this.camera.matrix, 1).multiplyScalar(panY);
      this.panOffset.add(offset);
    }

    this.lastX = e.clientX;
    this.lastY = e.clientY;
    this.update();
  }

  onMouseUp() {
    this.isMouseDown = false;
    this.mouseButton = -1;
  }

  onWheel(e) {
    e.preventDefault();
    this.scale *= e.deltaY > 0 ? 1.1 : 0.9;
    this.scale = Math.max(0.3, Math.min(5, this.scale));
    this.update();
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      this.isMouseDown = true;
      this.mouseButton = 0;
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
    }
  }

  onTouchMove(e) {
    if (!this.isMouseDown || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - this.lastX;
    const dy = e.touches[0].clientY - this.lastY;
    this.sphericalDelta.theta -= dx * this.rotateSpeed;
    this.sphericalDelta.phi -= dy * this.rotateSpeed;
    this.lastX = e.touches[0].clientX;
    this.lastY = e.touches[0].clientY;
    this.update();
  }

  onTouchEnd() {
    this.isMouseDown = false;
  }

  update() {
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
    this.spherical.radius *= this.scale;
    this.spherical.radius = Math.max(1, Math.min(15, this.spherical.radius));
    this.target.add(this.panOffset);

    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);

    this.sphericalDelta.set(0, 0, 0);
    this.scale = 1;
    this.panOffset.set(0, 0, 0);
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    this.domElement.removeEventListener('touchmove', this.onTouchMove);
    this.domElement.removeEventListener('touchend', this.onTouchEnd);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// APUFUNKTIO: Luo jiirillinen sivupalkki ExtrudeGeometry:llä
// ═══════════════════════════════════════════════════════════════════════════════

function createMiteredStringer(params, side) {
  const {
    totalLength, totalHeight, stairAngle,
    sivupalkkiH, sivupalkkiW, askelmaSyvyys,
    sivupalkkiOffset = 0
  } = params;

  const s = 0.001; // mm -> m

  // Sivupalkin offset (kohtisuoraan portaan pintaan nähden)
  const cos = Math.cos(stairAngle);
  const sin = Math.sin(stairAngle);
  const offsetX = -sivupalkkiOffset * sin;
  const offsetY = -sivupalkkiOffset * cos;

  // Jiirin sijainti = alimman askelman keskikohta (+ offset)
  const jiiriX = askelmaSyvyys / 2 + offsetX;
  const jiiriY = (askelmaSyvyys / 2) * Math.tan(stairAngle) + offsetY;

  // Jiirikulma = portaan kulma / 2
  const jiiriAngle = stairAngle / 2;

  // Palkin puolikkaan korkeus
  const halfH = sivupalkkiH / 2;

  // ═══════════════════════════════════════════════════════════════════
  // Lasketaan palkin reunapisteet (2D profiili XY-tasossa)
  // Palkki koostuu kahdesta osasta jotka kohtaavat jiirissä
  // ═══════════════════════════════════════════════════════════════════

  // Pääpalkin yläpään koordinaatit (+ ylitys + offset)
  const overhang = 100; // mm
  const topEndX = totalLength + overhang * cos + offsetX;
  const topEndY = totalHeight + overhang * sin + offsetY;

  // Pääpalkin reunat yläpäässä
  const topUpperX = topEndX - halfH * sin;
  const topUpperY = topEndY + halfH * cos;
  const topLowerX = topEndX + halfH * sin;
  const topLowerY = topEndY - halfH * cos;

  // ═══════════════════════════════════════════════════════════════════
  // Jiirin leikkauspisteet
  // ═══════════════════════════════════════════════════════════════════

  // Jiirin tason normaali (osoittaa ylös-oikealle 45° kulmassa portaan kulmaan nähden)
  const jiiriNormX = Math.cos(Math.PI/2 - jiiriAngle);
  const jiiriNormY = Math.sin(Math.PI/2 - jiiriAngle);

  // Jiirin tason suunta (kohtisuorassa normaaliin)
  const jiiriDirX = -jiiriNormY;
  const jiiriDirY = jiiriNormX;

  // Pääpalkin yläreuna leikkaa jiirin
  // Yläreuna kulkee suuntaan (cos, sin) ja alkaa jostain
  // Ratkaistaan leikkauspiste parametrisesti

  // Pääpalkin yläreunan suorayhtälö: kulkee pisteen (topUpperX, topUpperY) kautta suuntaan (-cos, -sin)
  // Jiirin suorayhtälö: kulkee pisteen (jiiriX, jiiriY) kautta suuntaan (jiiriDirX, jiiriDirY)

  // Leikkauspiste: P_upper + t * (-cos, -sin) = P_jiiri + s * (jiiriDirX, jiiriDirY)
  // Ratkaisu 2x2 yhtälöryhmästä

  function lineIntersection(p1x, p1y, d1x, d1y, p2x, p2y, d2x, d2y) {
    // p1 + t*d1 = p2 + s*d2
    // t*d1x - s*d2x = p2x - p1x
    // t*d1y - s*d2y = p2y - p1y
    const det = d1x * (-d2y) - d1y * (-d2x);
    if (Math.abs(det) < 1e-10) return null;
    const t = ((p2x - p1x) * (-d2y) - (p2y - p1y) * (-d2x)) / det;
    return { x: p1x + t * d1x, y: p1y + t * d1y };
  }

  // Pääpalkin yläreunan ja jiirin leikkaus
  const upperJiiriPoint = lineIntersection(
    topUpperX, topUpperY, -cos, -sin,
    jiiriX, jiiriY, jiiriDirX, jiiriDirY
  );

  // Pääpalkin alareunan ja jiirin leikkaus
  const lowerJiiriPoint = lineIntersection(
    topLowerX, topLowerY, -cos, -sin,
    jiiriX, jiiriY, jiiriDirX, jiiriDirY
  );

  // ═══════════════════════════════════════════════════════════════════
  // Alaosan (pystysuora) reunat
  // ═══════════════════════════════════════════════════════════════════

  // Alaosa on pystysuora palkki, jonka keskiviiva on x = jiiriX
  // Vasemman reunan x = jiiriX - halfH
  // Oikean reunan x = jiiriX + halfH
  // Huom: jiiriX sisältää jo offsetX:n

  const alaLeftX = jiiriX - halfH;
  const alaRightX = jiiriX + halfH;

  // Alaosan vasemman reunan ja jiirin leikkaus
  const alaLeftJiiriPoint = lineIntersection(
    alaLeftX, 0, 0, 1,
    jiiriX, jiiriY, jiiriDirX, jiiriDirY
  );

  // Alaosan oikean reunan ja jiirin leikkaus
  const alaRightJiiriPoint = lineIntersection(
    alaRightX, 0, 0, 1,
    jiiriX, jiiriY, jiiriDirX, jiiriDirY
  );

  // ═══════════════════════════════════════════════════════════════════
  // Luo 2D Shape pääpalkille (kalteva osa)
  // ═══════════════════════════════════════════════════════════════════

  const paapalkkiShape = new THREE.Shape();
  paapalkkiShape.moveTo(upperJiiriPoint.x * s, upperJiiriPoint.y * s);
  paapalkkiShape.lineTo(topUpperX * s, topUpperY * s);
  paapalkkiShape.lineTo(topLowerX * s, topLowerY * s);
  paapalkkiShape.lineTo(lowerJiiriPoint.x * s, lowerJiiriPoint.y * s);
  paapalkkiShape.closePath();

  // ═══════════════════════════════════════════════════════════════════
  // Luo 2D Shape alaosalle (pystysuora osa)
  // ═══════════════════════════════════════════════════════════════════

  const alaosaShape = new THREE.Shape();
  alaosaShape.moveTo(alaLeftX * s, 0);
  alaosaShape.lineTo(alaLeftJiiriPoint.x * s, alaLeftJiiriPoint.y * s);
  alaosaShape.lineTo(alaRightJiiriPoint.x * s, alaRightJiiriPoint.y * s);
  alaosaShape.lineTo(alaRightX * s, 0);
  alaosaShape.closePath();

  // ═══════════════════════════════════════════════════════════════════
  // Luo ExtrudeGeometry molemmille
  // ═══════════════════════════════════════════════════════════════════

  const extrudeSettings = {
    steps: 1,
    depth: sivupalkkiW * s,
    bevelEnabled: false
  };

  const paapalkkiGeom = new THREE.ExtrudeGeometry(paapalkkiShape, extrudeSettings);
  const alaosaGeom = new THREE.ExtrudeGeometry(alaosaShape, extrudeSettings);

  // Keskitä Z-suunnassa
  paapalkkiGeom.translate(0, 0, -sivupalkkiW * s / 2);
  alaosaGeom.translate(0, 0, -sivupalkkiW * s / 2);

  return { paapalkkiGeom, alaosaGeom };
}

// ═══════════════════════════════════════════════════════════════════════════════
// REACT KOMPONENTTI
// ═══════════════════════════════════════════════════════════════════════════════

export default function StairConfigurator({ onBack }) {
  const { theme } = useTheme();
  const isFabOS = theme === THEMES.FABOS;
  const [params, setParams] = useState({
    // Perusparametrit
    askelmia: 7,
    askelnousu: 170,
    askelmaLeveys: 1200,
    askelmaSyvyys: 271,
    askelmaKorkeus: 70,
    lattaKorkeus: 60,
    // Sivupalkit RHS
    sivupalkkiH: 150,
    sivupalkkiW: 50,
    sivupalkkiT: 5,
    // Sivupalkin korkeusasema suhteessa askelmiin (mm)
    // 0 = palkin yläreuna askelman yläpinnan tasolla
    // Positiivinen = palkki alempana, negatiivinen = palkki ylempänä
    sivupalkkiOffset: 0,
    // Sivupalkin alapään tyyppi: 'suora' tai 'jiiri'
    alapaanTyyppi: 'suora',
    // Välituet
    valitukiKoko: 30,
    // Levyt
    ylalevyL: 290,
    ylalevyW: 116,
    alalevyL: 160,
    alalevyW: 105,
    levyPaksuus: 6,
  });

  const [activeView, setActiveView] = useState('iso');

  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const stairGroupRef = useRef(null);
  const controlsRef = useRef(null);

  // Näkymän vaihto
  const setView = (viewName) => {
    if (!cameraRef.current || !controlsRef.current) return;

    setActiveView(viewName);

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    // Lasketaan portaan keskipiste
    const totalHeight = params.askelmia * params.askelnousu * 0.001;
    const totalLength = params.askelmia * params.askelmaSyvyys * 0.001;
    const centerY = totalHeight / 2;
    const centerX = 0; // Group on jo keskitetty

    // Kameran etäisyys kohteesta
    const distance = Math.max(totalLength, totalHeight, params.askelmaLeveys * 0.001) * 1.5 + 1;

    // Aseta target portaan keskelle
    controls.target.set(centerX, centerY, 0);

    switch (viewName) {
      case 'front':
        // Edestä (katsotaan X-akselin suunnasta)
        camera.position.set(-distance, centerY, 0);
        break;
      case 'right':
        // Oikealta (katsotaan Z-akselin suunnasta)
        camera.position.set(centerX, centerY, distance);
        break;
      case 'top':
        // Ylhäältä (katsotaan Y-akselin suunnasta)
        camera.position.set(centerX, distance + centerY, 0.01); // Pieni Z-offset välttää gimbal lock
        break;
      case 'iso':
      default:
        // Isometrinen (oletus 3D-näkymä)
        camera.position.set(distance * 0.7, centerY + distance * 0.5, distance * 0.7);
        break;
    }

    camera.lookAt(controls.target);

    // Päivitä OrbitControls spherical koordinaatit
    const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
    controls.spherical.setFromVector3(offset);
    controls.update();
  };

  // Lasketut arvot
  const kokonaisKorkeus = params.askelmia * params.askelnousu;
  const kokonaisPituus = params.askelmia * params.askelmaSyvyys;
  const kaltevuus = Math.atan2(kokonaisKorkeus, kokonaisPituus) * 180 / Math.PI;
  const stringerLength = Math.sqrt(kokonaisPituus ** 2 + kokonaisKorkeus ** 2);

  // Three.js alustus
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4, 2, 4);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Valaistus
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);
    scene.add(new THREE.DirectionalLight(0x4a9eff, 0.3).translateX(-5).translateY(5).translateZ(-5));

    // Grid ja lattia
    scene.add(new THREE.GridHelper(6, 30, 0x334155, 0x1e293b));
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, side: THREE.DoubleSide })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    const stairGroup = new THREE.Group();
    scene.add(stairGroup);
    stairGroupRef.current = stairGroup;

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // 3D-mallin päivitys
  useEffect(() => {
    if (!stairGroupRef.current) return;
    const group = stairGroupRef.current;

    // Tyhjennä
    while (group.children.length) {
      const child = group.children[0];
      child.geometry?.dispose();
      child.material?.dispose();
      group.remove(child);
    }

    const s = 0.001; // mm -> m
    const {
      askelmia, askelnousu, askelmaLeveys, askelmaSyvyys, askelmaKorkeus,
      lattaKorkeus, sivupalkkiH, sivupalkkiW, sivupalkkiT, valitukiKoko,
      ylalevyL, ylalevyW, alalevyL, alalevyW, levyPaksuus
    } = params;

    const totalHeight = askelmia * askelnousu;
    const totalLength = askelmia * askelmaSyvyys;
    const stairAngle = Math.atan2(totalHeight, totalLength);
    const strLen = Math.sqrt(totalLength ** 2 + totalHeight ** 2);

    // Sivupalkin etäisyys keskeltä
    const sivuOffsetZ = (askelmaLeveys / 2 + sivupalkkiW / 2 + 10) * s;

    // Materiaalit
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x707080, metalness: 0.7, roughness: 0.3 });
    const gratingMat = new THREE.MeshStandardMaterial({ color: 0x505060, metalness: 0.5, roughness: 0.5 });

    // ═══════════════════════════════════════════════════════════════════
    // SIVUPALKIT
    // ═══════════════════════════════════════════════════════════════════

    if (params.alapaanTyyppi === 'suora') {
      // ═══════════════════════════════════════════════════════════════
      // VAIHTOEHTO A: SUORA - Sivupalkki leikkautuu maanpintaan
      // ═══════════════════════════════════════════════════════════════

      const cos = Math.cos(stairAngle);
      const sin = Math.sin(stairAngle);

      // Sivupalkin offset (kohtisuoraan portaan pintaan nähden)
      const offsetNormal = params.sivupalkkiOffset || 0;
      // Muunnetaan offset X ja Y komponenteiksi (kohtisuorassa portaan suuntaan)
      const offsetX = -offsetNormal * sin;
      const offsetY = -offsetNormal * cos;

      // Lasketaan alapään koordinaatit niin että palkki jatkuu reilusti maan alle
      const extendBelow = sivupalkkiH * 2;
      const bottomY = -extendBelow + offsetY;
      const overhang = 100;
      const topX = totalLength + overhang * cos + offsetX;
      const topY = totalHeight + overhang * sin + offsetY;
      const bottomX = topX - (topY - bottomY) / Math.tan(stairAngle);

      // Sivupalkin pituus ja keskipiste
      const dx = topX - bottomX;
      const dy = topY - bottomY;
      const actualLength = Math.sqrt(dx * dx + dy * dy);

      const midX = (bottomX + topX) / 2;
      const midY = (bottomY + topY) / 2;

      // BoxGeometry sivupalkille
      const stringerGeom = new THREE.BoxGeometry(actualLength * s, sivupalkkiH * s, sivupalkkiW * s);

      // Clipping plane maanpinnan tasolla
      const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

      const clippedSteelMat = new THREE.MeshStandardMaterial({
        color: 0x707080,
        metalness: 0.7,
        roughness: 0.3,
        clippingPlanes: [clipPlane],
        clipShadows: true
      });

      // Vasen sivupalkki
      const stringerLeft = new THREE.Mesh(stringerGeom, clippedSteelMat);
      stringerLeft.position.set(midX * s, midY * s, -sivuOffsetZ);
      stringerLeft.rotation.z = stairAngle;
      stringerLeft.castShadow = true;
      group.add(stringerLeft);

      // Oikea sivupalkki
      const stringerRight = new THREE.Mesh(stringerGeom.clone(), clippedSteelMat);
      stringerRight.position.set(midX * s, midY * s, sivuOffsetZ);
      stringerRight.rotation.z = stairAngle;
      stringerRight.castShadow = true;
      group.add(stringerRight);

    } else {
      // ═══════════════════════════════════════════════════════════════
      // VAIHTOEHTO B: JIIRI - Käytä ExtrudeGeometry tarkkaan geometriaan
      // ═══════════════════════════════════════════════════════════════

      const geometryParams = {
        totalLength,
        totalHeight,
        stairAngle,
        sivupalkkiH,
        sivupalkkiW,
        askelmaSyvyys,
        sivupalkkiOffset: params.sivupalkkiOffset || 0
      };

      const { paapalkkiGeom, alaosaGeom } = createMiteredStringer(geometryParams, 'left');

      // Vasen pääpalkki
      const paapalkkiLeft = new THREE.Mesh(paapalkkiGeom, steelMat);
      paapalkkiLeft.position.set(0, 0, -sivuOffsetZ);
      paapalkkiLeft.castShadow = true;
      group.add(paapalkkiLeft);

      // Vasen alaosa
      const alaosaLeft = new THREE.Mesh(alaosaGeom, steelMat);
      alaosaLeft.position.set(0, 0, -sivuOffsetZ);
      alaosaLeft.castShadow = true;
      group.add(alaosaLeft);

      // Oikea pääpalkki (kopioi geometria)
      const paapalkkiRight = new THREE.Mesh(paapalkkiGeom.clone(), steelMat);
      paapalkkiRight.position.set(0, 0, sivuOffsetZ);
      paapalkkiRight.castShadow = true;
      group.add(paapalkkiRight);

      // Oikea alaosa
      const alaosaRight = new THREE.Mesh(alaosaGeom.clone(), steelMat);
      alaosaRight.position.set(0, 0, sivuOffsetZ);
      alaosaRight.castShadow = true;
      group.add(alaosaRight);
    }

    // ═══════════════════════════════════════════════════════════════════
    // ASKELMAT (RITILÄ + ETULATTA)
    // ═══════════════════════════════════════════════════════════════════

    const ritilaGeom = new THREE.BoxGeometry(askelmaSyvyys * s, askelmaKorkeus * s, askelmaLeveys * s);
    const lattaGeom = new THREE.BoxGeometry(5 * s, lattaKorkeus * s, askelmaLeveys * s);

    for (let i = 0; i < askelmia; i++) {
      // Askelman sijainti
      const stepCenterX = (i + 0.5) * askelmaSyvyys;
      const stepTopY = (i + 1) * askelnousu;

      // Ritilä-askelma
      const ritila = new THREE.Mesh(ritilaGeom, gratingMat);
      ritila.position.set(
        stepCenterX * s,
        (stepTopY - askelmaKorkeus / 2) * s,
        0
      );
      ritila.castShadow = true;
      ritila.receiveShadow = true;
      group.add(ritila);

      // Etulatta
      const latta = new THREE.Mesh(lattaGeom, steelMat);
      latta.position.set(
        (stepCenterX - askelmaSyvyys/2 - 2.5) * s,
        (stepTopY - askelmaKorkeus/2) * s,
        0
      );
      latta.castShadow = true;
      group.add(latta);
    }

    // Keskitä malli X-suunnassa
    group.position.set(-totalLength/2 * s, 0, 0);

  }, [params]);

  const updateParam = (key, value) => setParams(prev => ({ ...prev, [key]: value }));

  const downloadIFC = () => {
    const ifc = generateIFC(params);
    const blob = new Blob([ifc], { type: 'application/x-step' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LK_Porras_${params.askelmia}ask_${params.askelmaLeveys}mm.ifc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={isFabOS
      ? "flex flex-col h-screen bg-[#F7F7F7] text-gray-900"
      : "flex flex-col h-screen bg-slate-900 text-white"
    }>
      {/* Header */}
      <header className={isFabOS
        ? "bg-[#1A1A2E] border-b border-gray-700 sticky top-0 z-50"
        : "bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50"
      }>
        <div className="max-w-full px-4 py-3 flex items-center justify-between">
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
                <span className="px-2 py-1 bg-[#10B981]/20 text-[#10B981] text-xs font-bold rounded">V0.6</span>
                <span className="text-white font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Porras Konfiguraattori</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-indigo-500/30">
                  🪜
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">V0.6 Porras Konfiguraattori</h1>
                  <p className="text-sm text-slate-400">Suora teräsporras • RHS-sivupalkit • IFC-vienti</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isFabOS && (
              <div className="bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-full px-3 py-1">
                <span className="text-indigo-300 text-xs font-semibold">BETA</span>
              </div>
            )}
            <ThemeSwitcher variant="dark" />
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 3D Näkymä */}
        <div ref={containerRef} className="flex-1 relative">
          {/* Näkymäpainikkeet */}
          <div className={`absolute top-4 right-4 backdrop-blur p-2 rounded-xl flex flex-col gap-2 z-10 border ${
            isFabOS
              ? 'bg-white/90 border-gray-200'
              : 'bg-slate-800/90 border-slate-700/50'
          }`}>
            <div className={`text-xs text-center mb-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>Näkymä</div>
            <button
              onClick={() => setView('iso')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'iso'
                  ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-indigo-600 text-white'
                  : isFabOS ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title="Isometrinen näkymä"
            >
              3D
            </button>
            <button
              onClick={() => setView('front')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'front'
                  ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-indigo-600 text-white'
                  : isFabOS ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title="Edestä"
            >
              Edestä
            </button>
            <button
              onClick={() => setView('right')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'right'
                  ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-indigo-600 text-white'
                  : isFabOS ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title="Oikealta"
            >
              Sivulta
            </button>
            <button
              onClick={() => setView('top')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeView === 'top'
                  ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-indigo-600 text-white'
                  : isFabOS ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
              title="Ylhäältä"
            >
              Ylhäältä
            </button>
          </div>

          <div className={`absolute bottom-4 left-4 backdrop-blur p-2 rounded-lg text-xs border ${
            isFabOS
              ? 'bg-white/80 border-gray-200 text-gray-500'
              : 'bg-slate-800/80 border-slate-700/50 text-slate-400'
          }`}>
            Vasen: Pyöritä | Oikea: Panoroi | Rulla: Zoomaa
          </div>

          <div className={`absolute top-4 left-4 backdrop-blur p-4 rounded-xl text-sm space-y-1 border ${
            isFabOS
              ? 'bg-white/90 border-gray-200'
              : 'bg-slate-800/90 border-slate-700/50'
          }`}>
            <div className={`font-semibold pb-1 mb-2 border-b ${
              isFabOS
                ? 'text-[#FF6B35] border-gray-200'
                : 'text-indigo-400 border-slate-700'
            }`}>Lasketut mitat</div>
            <div className={isFabOS ? 'text-gray-700' : ''}>Kokonaiskorkeus: <span className={`font-mono ${isFabOS ? 'text-[#10B981]' : 'text-emerald-400'}`}>{kokonaisKorkeus} mm</span></div>
            <div className={isFabOS ? 'text-gray-700' : ''}>Kokonaispituus: <span className={`font-mono ${isFabOS ? 'text-[#10B981]' : 'text-emerald-400'}`}>{kokonaisPituus} mm</span></div>
            <div className={isFabOS ? 'text-gray-700' : ''}>Sivupalkin pituus: <span className={`font-mono ${isFabOS ? 'text-[#10B981]' : 'text-emerald-400'}`}>{Math.round(stringerLength)} mm</span></div>
            <div className={isFabOS ? 'text-gray-700' : ''}>Kaltevuus: <span className={`font-mono ${kaltevuus > 45 ? 'text-amber-500' : isFabOS ? 'text-[#10B981]' : 'text-emerald-400'}`}>{kaltevuus.toFixed(1)}°</span></div>
          </div>
        </div>

        {/* Parametrit */}
        <div className={`w-80 p-4 overflow-y-auto border-l ${
          isFabOS
            ? 'bg-white border-gray-200'
            : 'bg-slate-800/50 border-slate-700/50'
        }`}>
          <h2 className={`text-lg font-semibold mb-4 pb-2 border-b ${
            isFabOS
              ? 'text-[#FF6B35] border-gray-200'
              : 'text-indigo-400 border-slate-700'
          }`}>Parametrit</h2>

          {/* Perusparametrit */}
          <Section title="PORTAAN MITAT" isFabOS={isFabOS}>
            <Slider label="Askelmien määrä" value={params.askelmia} min={3} max={15} step={1} onChange={v => updateParam('askelmia', v)} isFabOS={isFabOS} />
            <Slider label="Askelnousu" value={params.askelnousu} min={150} max={210} step={5} unit="mm" onChange={v => updateParam('askelnousu', v)} isFabOS={isFabOS} />
            <Slider label="Askelman leveys" value={params.askelmaLeveys} min={800} max={1400} step={100} unit="mm" onChange={v => updateParam('askelmaLeveys', v)} isFabOS={isFabOS} />
          </Section>

          {/* Sivupalkit */}
          <Section title="SIVUPALKIT RHS" isFabOS={isFabOS}>
            <div className={`rounded p-2 mb-3 text-xs text-center ${
              isFabOS
                ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35]'
                : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
            }`}>
              RHS {params.sivupalkkiH}×{params.sivupalkkiW}×{params.sivupalkkiT}
            </div>
            <Slider label="Korkeus (H)" value={params.sivupalkkiH} min={100} max={200} step={10} unit="mm" onChange={v => updateParam('sivupalkkiH', v)} isFabOS={isFabOS} />
            <Slider label="Leveys (W)" value={params.sivupalkkiW} min={40} max={80} step={10} unit="mm" onChange={v => updateParam('sivupalkkiW', v)} isFabOS={isFabOS} />
            <Slider label="Seinämä (T)" value={params.sivupalkkiT} min={3} max={8} step={1} unit="mm" onChange={v => updateParam('sivupalkkiT', v)} isFabOS={isFabOS} />

            {/* Korkeusasema */}
            <div className="mt-4 mb-2">
              <label className={`block text-sm mb-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>Korkeusasema:</label>
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => updateParam('sivupalkkiOffset', -params.sivupalkkiH / 2 + params.askelmaKorkeus)}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                    params.sivupalkkiOffset === -params.sivupalkkiH / 2 + params.askelmaKorkeus
                      ? isFabOS ? 'bg-[#10B981] text-white' : 'bg-emerald-600 text-white'
                      : isFabOS ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title="Palkin yläreuna askelman yläpinnan tasolla"
                >
                  Ylä
                </button>
                <button
                  onClick={() => updateParam('sivupalkkiOffset', 0)}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                    params.sivupalkkiOffset === 0
                      ? isFabOS ? 'bg-[#10B981] text-white' : 'bg-emerald-600 text-white'
                      : isFabOS ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title="Palkin keskiviiva askelman keskiviivan tasolla"
                >
                  Keski
                </button>
                <button
                  onClick={() => updateParam('sivupalkkiOffset', params.sivupalkkiH / 2 - params.askelmaKorkeus)}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-all ${
                    params.sivupalkkiOffset === params.sivupalkkiH / 2 - params.askelmaKorkeus
                      ? isFabOS ? 'bg-[#10B981] text-white' : 'bg-emerald-600 text-white'
                      : isFabOS ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title="Palkin alareuna askelman alapinnan tasolla"
                >
                  Ala
                </button>
              </div>
              <Slider
                label="Hienosäätö"
                value={params.sivupalkkiOffset}
                min={-100}
                max={100}
                step={5}
                unit="mm"
                onChange={v => updateParam('sivupalkkiOffset', v)}
                isFabOS={isFabOS}
              />
              <div className={`text-xs mt-1 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>
                − = ylemmäs, + = alemmas
              </div>
            </div>

            {/* Alapään tyyppi */}
            <div className="mt-4 mb-2">
              <label className={`block text-sm mb-2 ${isFabOS ? 'text-gray-600' : 'text-slate-400'}`}>Alapään tyyppi:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateParam('alapaanTyyppi', 'suora')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    params.alapaanTyyppi === 'suora'
                      ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-indigo-600 text-white'
                      : isFabOS ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Suora
                </button>
                <button
                  onClick={() => updateParam('alapaanTyyppi', 'jiiri')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    params.alapaanTyyppi === 'jiiri'
                      ? isFabOS ? 'bg-[#FF6B35] text-white' : 'bg-indigo-600 text-white'
                      : isFabOS ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Jiiri
                </button>
              </div>
            </div>
          </Section>

          {/* Askelmat */}
          <Section title="ASKELMAT (Meiser)" isFabOS={isFabOS}>
            <div className={`text-xs mb-2 ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>Ritilä {params.askelmaKorkeus}×{params.askelmaSyvyys}×{params.askelmaLeveys}</div>
            <Slider label="Ritilän korkeus" value={params.askelmaKorkeus} min={30} max={100} step={5} unit="mm" onChange={v => updateParam('askelmaKorkeus', v)} isFabOS={isFabOS} />
            <Slider label="Etulatta" value={params.lattaKorkeus} min={40} max={80} step={5} unit="mm" onChange={v => updateParam('lattaKorkeus', v)} isFabOS={isFabOS} />
          </Section>

          {/* Yhteenveto */}
          <div className={`rounded-xl p-4 mb-4 border ${
            isFabOS
              ? 'bg-gray-50 border-gray-200'
              : 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600/30'
          }`}>
            <h3 className={`text-sm font-semibold mb-2 ${isFabOS ? 'text-[#10B981]' : 'text-emerald-400'}`}>YHTEENVETO</h3>
            <div className="text-xs space-y-1">
              <Row label="Askelmat" value={`${params.askelmia} kpl × ${params.askelmaLeveys} mm`} isFabOS={isFabOS} />
              <Row label="Nousu / etenemä" value={`${params.askelnousu} / ${params.askelmaSyvyys} mm`} isFabOS={isFabOS} />
              <Row label="Kokonaiskorkeus" value={`${kokonaisKorkeus} mm`} isFabOS={isFabOS} />
              <Row label="Sivupalkit" value={`RHS ${params.sivupalkkiH}×${params.sivupalkkiW}×${params.sivupalkkiT}`} isFabOS={isFabOS} />
              <Row label="Palkin offset" value={`${params.sivupalkkiOffset >= 0 ? '+' : ''}${params.sivupalkkiOffset} mm`} isFabOS={isFabOS} />
              <Row label="Alapään tyyppi" value={params.alapaanTyyppi === 'suora' ? 'Suora' : 'Jiiri'} isFabOS={isFabOS} />
              <Row label="Kaltevuus" value={`${kaltevuus.toFixed(1)}°`} warn={kaltevuus > 45} isFabOS={isFabOS} />
            </div>
          </div>

          {/* Lataus */}
          <button onClick={downloadIFC} className={`w-full font-semibold py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
            isFabOS
              ? 'bg-gradient-to-r from-[#10B981] to-teal-500 hover:from-[#059669] hover:to-teal-600 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Lataa IFC
          </button>
          <p className={`text-xs mt-2 text-center ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>IFC4 • BIM-yhteensopiva</p>
          <div className={`mt-2 rounded p-2 text-xs text-center font-mono ${
            isFabOS
              ? 'bg-gray-100 text-gray-600'
              : 'bg-slate-700/30 text-slate-400'
          }`}>
            LK_Porras_{params.askelmia}ask_{params.askelmaLeveys}mm.ifc
          </div>
        </div>
      </div>
    </div>
  );
}

// Apukomponentit
function Section({ title, children, isFabOS }) {
  return (
    <div className="mb-5">
      <h3 className={`text-xs font-semibold mb-3 tracking-wide ${isFabOS ? 'text-gray-500' : 'text-slate-500'}`}>{title}</h3>
      {children}
    </div>
  );
}

function Slider({ label, value, min, max, step, unit = '', onChange, isFabOS }) {
  return (
    <div className="mb-3">
      <label className={`block text-sm mb-1 ${isFabOS ? 'text-gray-700' : 'text-slate-300'}`}>
        {label}: <span className={`font-mono ${isFabOS ? 'text-[#FF6B35]' : 'text-indigo-400'}`}>{value}{unit}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
          isFabOS
            ? 'bg-gray-200 accent-[#FF6B35]'
            : 'bg-slate-700 accent-indigo-500'
        }`}
      />
    </div>
  );
}

function Row({ label, value, warn, isFabOS }) {
  return (
    <div className="flex justify-between">
      <span className={isFabOS ? 'text-gray-500' : 'text-slate-400'}>{label}:</span>
      <span className={warn ? 'text-amber-500' : isFabOS ? 'text-gray-800' : 'text-slate-200'}>{value}</span>
    </div>
  );
}
