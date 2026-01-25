import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EpicIntro, BattleBanner, HumorBanner, FeedbackModal, AchievementToast, FloatingActions, InvestorBanner } from './EpicComponents';
import { useTheme, THEMES } from './contexts/ThemeContext';
import ThemeSwitcher from './components/ThemeSwitcher';

const GRID_SIZE = 10;
const MAX_HISTORY = 50;
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 5;

const FabOSProto = ({ onBack }) => {
  const { theme } = useTheme();
  const isFabOS = theme === THEMES.FABOS;

  const [tool, setTool] = useState('select');
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [selectedHole, setSelectedHole] = useState(null);
  const [hoveredShape, setHoveredShape] = useState(null);
  const [hoveredHole, setHoveredHole] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDraggingHole, setIsDraggingHole] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [editingDimension, setEditingDimension] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [material, setMaterial] = useState('S235');
  const [thickness, setThickness] = useState(3);
  const [holeSize, setHoleSize] = useState(10);

  // Polygon drawing state
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null); // For arc editing

  // Cutout drawing state - for drawing polygon holes directly into a shape
  const [isDrawingCutout, setIsDrawingCutout] = useState(false);
  const [cutoutTargetShape, setCutoutTargetShape] = useState(null);
  const [cutoutPoints, setCutoutPoints] = useState([]);

  // AI Chat state
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', content: 'Hei! Olen levykaupan AI-avustaja.\n\nVoin:\n• Luoda uusia muotoja\n• Muokata valittua muotoa\n• Lisätä reikiä\n• Poistaa muotoja\n\nKerro mitä haluat tehdä!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const chatEndRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Dimensions visibility
  const [showAllDimensions, setShowAllDimensions] = useState(false);

  // Parts list management
  const [parts, setParts] = useState([]);
  const [currentPartName, setCurrentPartName] = useState('Osa 1');
  const [currentPartQuantity, setCurrentPartQuantity] = useState(1);
  const [editingPartIndex, setEditingPartIndex] = useState(null);

  // Epic UI state
  const [showIntro, setShowIntro] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [achievement, setAchievement] = useState(null);
  const [shapesCreated, setShapesCreated] = useState(0);
  const [battle, setBattle] = useState(null);
  const [battlesWatched, setBattlesWatched] = useState(0);

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const materials = [
    { id: 'S235', name: 'Teräs S235', price: 2.5 },
    { id: 'S355', name: 'Teräs S355', price: 3.0 },
    { id: '304', name: 'RST 304', price: 8.0 },
    { id: '316', name: 'RST 316', price: 12.0 },
    { id: 'AL', name: 'Alumiini', price: 6.0 },
  ];

  const thicknesses = [1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];

  // History management
  const updateShapes = useCallback((newShapes, skipHistory = false) => {
    setShapes(newShapes);
    if (!skipHistory) {
      setHistory(prev => {
        const truncated = prev.slice(0, historyIndex + 1);
        const updated = [...truncated, JSON.parse(JSON.stringify(newShapes))];
        if (updated.length > MAX_HISTORY) return updated.slice(-MAX_HISTORY);
        return updated;
      });
      setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    }
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setShapes(JSON.parse(JSON.stringify(history[newIndex])));
      setSelectedShape(null);
      setSelectedHole(null);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setShapes(JSON.parse(JSON.stringify(history[newIndex])));
      setSelectedShape(null);
      setSelectedHole(null);
    }
  }, [historyIndex, history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Track shape creation and show achievements
  const trackShapeCreation = useCallback(() => {
    const newCount = shapesCreated + 1;
    setShapesCreated(newCount);
    if (newCount === 1) {
      setAchievement({ title: 'Ensimmäinen Luomus! 🎨', description: 'Loit ensimmäisen muotosi!' });
    } else if (newCount === 5) {
      setAchievement({ title: 'Tuotantolinjan Mestari! 🏭', description: 'Olet luonut 5 muotoa!' });
    } else if (newCount === 10) {
      setAchievement({ title: 'Teräsmies! 🦸', description: 'Olet luonut 10 muotoa!' });
    }
  }, [shapesCreated]);

  // Toggle shape dimensions visibility
  const toggleShapeDimensions = (index) => {
    const updatedShapes = [...shapes];
    updatedShapes[index].showDimensions = !updatedShapes[index].showDimensions;
    updateShapes(updatedShapes);
  };

  // Polygon helper functions
  const calculateSegmentLength = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const calculatePolygonArea = (points) => {
    if (!points || points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  };

  const calculatePolygonPerimeter = (points) => {
    if (!points || points.length < 2) return 0;
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      perimeter += calculateSegmentLength(points[i], points[j]);
    }
    return perimeter;
  };

  const getPolygonBounds = (points) => {
    if (!points || points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  };

  // Generate SVG path with filleted (rounded) corners
  const generateFilletedPath = (points, globalRadius, pointFillets = []) => {
    if (points.length < 3) return '';

    const n = points.length;
    let pathData = '';

    for (let i = 0; i < n; i++) {
      const prev = points[(i - 1 + n) % n];
      const curr = points[i];
      const next = points[(i + 1) % n];

      // Get fillet radius for this corner (point-specific or global)
      const filletRadius = pointFillets[i]?.fillet ?? globalRadius ?? 0;

      if (filletRadius <= 0) {
        // No fillet - sharp corner
        if (i === 0) {
          pathData += `M ${curr.x} ${curr.y}`;
        } else {
          pathData += ` L ${curr.x} ${curr.y}`;
        }
      } else {
        // Calculate vectors from current point to neighbors
        const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
        const v2 = { x: next.x - curr.x, y: next.y - curr.y };

        // Normalize vectors
        const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

        if (len1 === 0 || len2 === 0) {
          if (i === 0) {
            pathData += `M ${curr.x} ${curr.y}`;
          } else {
            pathData += ` L ${curr.x} ${curr.y}`;
          }
          continue;
        }

        const u1 = { x: v1.x / len1, y: v1.y / len1 };
        const u2 = { x: v2.x / len2, y: v2.y / len2 };

        // Calculate angle between vectors
        const angle = Math.acos(Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y)));

        // Limit fillet radius to not exceed half of adjacent segment lengths
        const maxRadius = Math.min(len1, len2) / 2 * 0.9;
        const actualRadius = Math.min(filletRadius, maxRadius);

        // Distance from corner to arc start/end
        const tangentLength = actualRadius / Math.tan(angle / 2);

        // Arc start and end points
        const arcStart = {
          x: curr.x + u1.x * tangentLength,
          y: curr.y + u1.y * tangentLength
        };
        const arcEnd = {
          x: curr.x + u2.x * tangentLength,
          y: curr.y + u2.y * tangentLength
        };

        // Determine sweep direction (clockwise or counter-clockwise)
        const cross = u1.x * u2.y - u1.y * u2.x;
        const sweepFlag = cross > 0 ? 0 : 1;

        if (i === 0) {
          pathData += `M ${arcStart.x} ${arcStart.y}`;
        } else {
          pathData += ` L ${arcStart.x} ${arcStart.y}`;
        }
        pathData += ` A ${actualRadius} ${actualRadius} 0 0 ${sweepFlag} ${arcEnd.x} ${arcEnd.y}`;
      }
    }

    pathData += ' Z';
    return pathData;
  };

  // Generate SVG path with arcs on segments
  // Each point can have an 'arc' property: { bulge: number } where bulge is the arc height
  // Positive bulge = arc bulges outward (convex), negative = inward (concave)
  const generatePathWithArcs = (points, globalFilletRadius = 0) => {
    if (points.length < 3) return '';

    const n = points.length;
    let pathData = '';

    for (let i = 0; i < n; i++) {
      const curr = points[i];
      const next = points[(i + 1) % n];
      const prev = points[(i - 1 + n) % n];
      const nextNext = points[(i + 2) % n];

      // Get fillet radius for current corner
      const filletRadius = curr.fillet ?? globalFilletRadius ?? 0;

      // Check if current segment has an arc
      const arcBulge = curr.arc?.bulge || 0;

      if (i === 0) {
        // Start point - apply fillet if needed
        if (filletRadius > 0) {
          const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
          const v2 = { x: next.x - curr.x, y: next.y - curr.y };
          const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
          if (len1 > 0 && len2 > 0) {
            const u1 = { x: v1.x / len1, y: v1.y / len1 };
            const u2 = { x: v2.x / len2, y: v2.y / len2 };
            const angle = Math.acos(Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y)));
            const maxR = Math.min(len1, len2) / 2 * 0.9;
            const r = Math.min(filletRadius, maxR);
            const tangent = r / Math.tan(angle / 2);
            const arcEnd = { x: curr.x + u2.x * tangent, y: curr.y + u2.y * tangent };
            pathData = `M ${arcEnd.x} ${arcEnd.y}`;
          } else {
            pathData = `M ${curr.x} ${curr.y}`;
          }
        } else {
          pathData = `M ${curr.x} ${curr.y}`;
        }
      }

      // Check if current segment has a bezier curve
      const bezierCp = curr.bezier; // { cx, cy } control point relative to segment midpoint

      // Draw segment to next point (with arc, bezier, or straight line)
      if (bezierCp) {
        // Quadratic bezier curve
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        const cpX = midX + (bezierCp.cx || 0);
        const cpY = midY + (bezierCp.cy || 0);

        // Apply fillet to next corner if needed
        const nextFillet = next.fillet ?? globalFilletRadius ?? 0;
        let endPoint = next;

        if (nextFillet > 0) {
          const v1 = { x: curr.x - next.x, y: curr.y - next.y };
          const v2 = { x: nextNext.x - next.x, y: nextNext.y - next.y };
          const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
          if (len1 > 0 && len2 > 0) {
            const u1 = { x: v1.x / len1, y: v1.y / len1 };
            const angle = Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (len1 * len2))));
            const maxR = Math.min(len1, len2) / 2 * 0.9;
            const r = Math.min(nextFillet, maxR);
            const tangent = r / Math.tan(angle / 2);
            endPoint = { x: next.x + u1.x * tangent, y: next.y + u1.y * tangent };
          }
        }

        pathData += ` Q ${cpX} ${cpY} ${endPoint.x} ${endPoint.y}`;

        // Add fillet arc if needed
        if (nextFillet > 0 && i < n - 1) {
          const v1 = { x: curr.x - next.x, y: curr.y - next.y };
          const v2 = { x: nextNext.x - next.x, y: nextNext.y - next.y };
          const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
          if (len1 > 0 && len2 > 0) {
            const u2 = { x: v2.x / len2, y: v2.y / len2 };
            const angle = Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (len1 * len2))));
            const maxR = Math.min(len1, len2) / 2 * 0.9;
            const r = Math.min(nextFillet, maxR);
            const tangent = r / Math.tan(angle / 2);
            const arcEnd = { x: next.x + u2.x * tangent, y: next.y + u2.y * tangent };
            const cross = v1.x * v2.y - v1.y * v2.x;
            const sweepFillet = cross > 0 ? 0 : 1;
            pathData += ` A ${r} ${r} 0 0 ${sweepFillet} ${arcEnd.x} ${arcEnd.y}`;
          }
        }
      } else if (arcBulge !== 0) {
        // Calculate arc parameters from bulge
        const dx = next.x - curr.x;
        const dy = next.y - curr.y;
        const chordLen = Math.sqrt(dx * dx + dy * dy);
        const bulgeHeight = arcBulge; // in mm, positive = outward

        // Calculate radius from chord and bulge
        // r = (h/2) + (c²)/(8h) where h=bulge height, c=chord length
        const absH = Math.abs(bulgeHeight);
        const radius = (absH / 2) + (chordLen * chordLen) / (8 * absH);

        // Large arc flag (0 if less than 180°, 1 if more)
        const largeArc = absH > chordLen / 2 ? 1 : 0;
        // Sweep flag depends on bulge direction
        const sweep = bulgeHeight > 0 ? 0 : 1;

        // Apply fillet to next corner if needed
        const nextFillet = next.fillet ?? globalFilletRadius ?? 0;
        let endPoint = next;

        if (nextFillet > 0) {
          const v1 = { x: curr.x - next.x, y: curr.y - next.y };
          const v2 = { x: nextNext.x - next.x, y: nextNext.y - next.y };
          const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
          if (len1 > 0 && len2 > 0) {
            const u1 = { x: v1.x / len1, y: v1.y / len1 };
            const angle = Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (len1 * len2))));
            const maxR = Math.min(len1, len2) / 2 * 0.9;
            const r = Math.min(nextFillet, maxR);
            const tangent = r / Math.tan(angle / 2);
            endPoint = { x: next.x + u1.x * tangent, y: next.y + u1.y * tangent };
          }
        }

        pathData += ` A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endPoint.x} ${endPoint.y}`;

        // Add fillet arc if needed
        if (nextFillet > 0 && i < n - 1) {
          const v1 = { x: curr.x - next.x, y: curr.y - next.y };
          const v2 = { x: nextNext.x - next.x, y: nextNext.y - next.y };
          const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
          if (len1 > 0 && len2 > 0) {
            const u2 = { x: v2.x / len2, y: v2.y / len2 };
            const angle = Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (len1 * len2))));
            const maxR = Math.min(len1, len2) / 2 * 0.9;
            const r = Math.min(nextFillet, maxR);
            const tangent = r / Math.tan(angle / 2);
            const arcEnd = { x: next.x + u2.x * tangent, y: next.y + u2.y * tangent };
            const cross = v1.x * v2.y - v1.y * v2.x;
            const sweepFillet = cross > 0 ? 0 : 1;
            pathData += ` A ${r} ${r} 0 0 ${sweepFillet} ${arcEnd.x} ${arcEnd.y}`;
          }
        }
      } else {
        // Straight line - apply fillet to next corner if needed
        const nextFillet = next.fillet ?? globalFilletRadius ?? 0;

        if (nextFillet > 0) {
          const v1 = { x: curr.x - next.x, y: curr.y - next.y };
          const v2 = { x: nextNext.x - next.x, y: nextNext.y - next.y };
          const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

          if (len1 > 0 && len2 > 0) {
            const u1 = { x: v1.x / len1, y: v1.y / len1 };
            const u2 = { x: v2.x / len2, y: v2.y / len2 };
            const angle = Math.acos(Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y)));
            const maxR = Math.min(len1, len2) / 2 * 0.9;
            const r = Math.min(nextFillet, maxR);
            const tangent = r / Math.tan(angle / 2);
            const arcStart = { x: next.x + u1.x * tangent, y: next.y + u1.y * tangent };
            const arcEnd = { x: next.x + u2.x * tangent, y: next.y + u2.y * tangent };
            const cross = u1.x * u2.y - u1.y * u2.x;
            const sweepFillet = cross > 0 ? 0 : 1;

            pathData += ` L ${arcStart.x} ${arcStart.y}`;
            pathData += ` A ${r} ${r} 0 0 ${sweepFillet} ${arcEnd.x} ${arcEnd.y}`;
          } else {
            pathData += ` L ${next.x} ${next.y}`;
          }
        } else {
          pathData += ` L ${next.x} ${next.y}`;
        }
      }
    }

    pathData += ' Z';
    return pathData;
  };

  // Close and save polygon
  const closePolygon = useCallback(() => {
    if (polygonPoints.length >= 3) {
      const bounds = getPolygonBounds(polygonPoints);
      const newShape = {
        type: 'polygon',
        points: [...polygonPoints],
        holes: [],
        showDimensions: true
      };
      updateShapes([...shapes, newShape]);
      setSelectedShape(shapes.length);
      trackShapeCreation();
    }
    setPolygonPoints([]);
    setIsDrawingPolygon(false);
  }, [polygonPoints, shapes, updateShapes, trackShapeCreation]);

  // Cancel polygon drawing
  const cancelPolygon = useCallback(() => {
    setPolygonPoints([]);
    setIsDrawingPolygon(false);
  }, []);

  // Start drawing a cutout polygon on the selected shape
  const startCutoutDrawing = useCallback((shapeIndex) => {
    setIsDrawingCutout(true);
    setCutoutTargetShape(shapeIndex);
    setCutoutPoints([]);
    setTool('select'); // Use select tool mode but enable cutout drawing
  }, []);

  // Cancel cutout drawing
  const cancelCutout = useCallback(() => {
    setIsDrawingCutout(false);
    setCutoutTargetShape(null);
    setCutoutPoints([]);
  }, []);

  // Close and finish cutout polygon
  const closeCutout = useCallback(() => {
    // Capture values before any state changes
    const points = cutoutPoints;
    const targetIdx = cutoutTargetShape;

    if (!points || points.length < 3 || targetIdx === null) {
      setIsDrawingCutout(false);
      setCutoutTargetShape(null);
      setCutoutPoints([]);
      return;
    }

    const targetShape = shapes[targetIdx];
    if (!targetShape) {
      setIsDrawingCutout(false);
      setCutoutTargetShape(null);
      setCutoutPoints([]);
      return;
    }

    // Calculate bounds to get offset
    const bounds = {
      minX: Math.min(...points.map(p => p.x)),
      minY: Math.min(...points.map(p => p.y)),
    };

    // Calculate position relative to target shape
    let offsetX, offsetY;
    if (targetShape.type === 'rectangle' || targetShape.type === 'lshape') {
      offsetX = bounds.minX - targetShape.x;
      offsetY = bounds.minY - targetShape.y;
    } else if (targetShape.type === 'circle') {
      offsetX = bounds.minX - targetShape.cx + targetShape.radius;
      offsetY = bounds.minY - targetShape.cy + targetShape.radius;
    } else if (targetShape.type === 'polygon' && targetShape.points) {
      const targetBounds = getPolygonBounds(targetShape.points);
      offsetX = bounds.minX - targetBounds.minX;
      offsetY = bounds.minY - targetBounds.minY;
    } else {
      offsetX = bounds.minX;
      offsetY = bounds.minY;
    }

    // Create cutout with relative points
    const cutout = {
      type: 'cutout',
      x: offsetX,
      y: offsetY,
      points: points.map(p => ({
        x: p.x - bounds.minX,
        y: p.y - bounds.minY,
        fillet: p.fillet,
        arc: p.arc
      })),
      filletRadius: 0
    };

    // Add cutout to target shape
    const updated = [...shapes];

    // Safety check
    if (!updated[targetIdx]) {
      setIsDrawingCutout(false);
      setCutoutTargetShape(null);
      setCutoutPoints([]);
      return;
    }

    if (!updated[targetIdx].holes) {
      updated[targetIdx].holes = [];
    }
    updated[targetIdx].holes.push(cutout);
    const holeIndex = updated[targetIdx].holes.length - 1;

    // Clear cutout drawing state BEFORE updating shapes to avoid race condition
    setIsDrawingCutout(false);
    setCutoutTargetShape(null);
    setCutoutPoints([]);

    // Then update shapes and selections
    updateShapes(updated);
    setSelectedShape(targetIdx);
    setSelectedHole({ shapeIndex: targetIdx, holeIndex });
  }, [cutoutPoints, cutoutTargetShape, shapes, updateShapes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputActive = document.activeElement?.tagName === 'INPUT' ||
                           document.activeElement?.tagName === 'SELECT' ||
                           document.activeElement?.tagName === 'TEXTAREA';

      // Don't handle shortcuts when typing in input fields (except Ctrl+Z/Y)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey))) { e.preventDefault(); redo(); }

      // Skip other shortcuts if input is active
      if (isInputActive) return;

      // Polygon-specific controls
      if (isDrawingPolygon) {
        if (e.key === 'Enter') {
          e.preventDefault();
          closePolygon();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelPolygon();
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          if (polygonPoints.length > 0) {
            setPolygonPoints(prev => prev.slice(0, -1));
            if (polygonPoints.length === 1) {
              setIsDrawingPolygon(false);
            }
          }
          return;
        }
      }

      // Cutout drawing controls
      if (isDrawingCutout) {
        if (e.key === 'Enter') {
          e.preventDefault();
          closeCutout();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelCutout();
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          if (cutoutPoints.length > 0) {
            setCutoutPoints(prev => prev.slice(0, -1));
            if (cutoutPoints.length === 1) {
              cancelCutout();
            }
          }
          return;
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !editingDimension) {
        e.preventDefault();
        if (selectedHole) {
          deleteHole(selectedHole.shapeIndex, selectedHole.holeIndex);
        } else if (selectedShape !== null) {
          deleteShape(selectedShape);
        }
      }

      if (e.key === 'Escape') {
        setSelectedHole(null);
        setEditingDimension(null);
      }

      // Toggle dimensions with 'D' key
      if (e.key === 'd') {
        setShowAllDimensions(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedShape, selectedHole, editingDimension, isDrawingPolygon, polygonPoints, closePolygon, cancelPolygon, isDrawingCutout, cutoutPoints, closeCutout, cancelCutout]);

  useEffect(() => {
    if (editingDimension && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingDimension]);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const worldX = mouseX / zoom - pan.x;
      const worldY = mouseY / zoom - pan.y;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
      setZoom(newZoom);
      setPan({ x: mouseX / newZoom - worldX, y: mouseY / newZoom - worldY });
    }
  }, [zoom, pan]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const getMousePosition = (e, snap = true) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / zoom - pan.x);
    const y = ((e.clientY - rect.top) / zoom - pan.y);
    if (snap) {
      return { x: Math.round(x / GRID_SIZE) * GRID_SIZE, y: Math.round(y / GRID_SIZE) * GRID_SIZE };
    }
    return { x, y };
  };

  // Current mouse position for polygon preview
  const [currentMousePos, setCurrentMousePos] = useState({ x: 0, y: 0 });

  const getHoleWorldPosition = (shape, hole) => {
    // Handle cutout type - use x,y as offset
    const holeX = hole.x || 0;
    const holeY = hole.y || 0;

    if (shape.type === 'circle') {
      return { x: shape.cx + holeX, y: shape.cy + holeY };
    }
    if (shape.type === 'polygon' && shape.points) {
      const bounds = getPolygonBounds(shape.points);
      return { x: bounds.minX + holeX, y: bounds.minY + holeY };
    }
    return { x: (shape.x || 0) + holeX, y: (shape.y || 0) + holeY };
  };

  const worldToHolePosition = (shape, worldX, worldY) => {
    if (shape.type === 'circle') {
      return { x: worldX - shape.cx, y: worldY - shape.cy };
    }
    if (shape.type === 'polygon' && shape.points) {
      const bounds = getPolygonBounds(shape.points);
      return { x: worldX - bounds.minX, y: worldY - bounds.minY };
    }
    return { x: worldX - (shape.x || 0), y: worldY - (shape.y || 0) };
  };

  const getHoleDimensions = (shape, hole) => {
    const holeX = hole.x || 0;
    const holeY = hole.y || 0;

    // For cutouts, return special type
    if (hole.type === 'cutout') {
      const bounds = hole.points ? getPolygonBounds(hole.points) : { width: 0, height: 0 };
      return { type: 'cutout', fromLeft: holeX, fromTop: holeY, width: bounds.width, height: bounds.height };
    }

    if (shape.type === 'circle') {
      const distance = Math.sqrt(holeX * holeX + holeY * holeY);
      let angle = Math.atan2(holeY, holeX) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      return { type: 'polar', distance, angle, diameter: hole.diameter };
    } else if (shape.type === 'polygon' && shape.points) {
      const bounds = getPolygonBounds(shape.points);
      return { type: 'cartesian', fromLeft: holeX, fromBottom: bounds.height - holeY, diameter: hole.diameter };
    } else {
      const fromLeft = holeX;
      const fromBottom = (shape.height || 0) - holeY;
      return { type: 'cartesian', fromLeft, fromBottom, diameter: hole.diameter };
    }
  };

  const updateHoleFromDimensions = (shapeIndex, holeIndex, dims) => {
    const shape = shapes[shapeIndex];
    const updatedShapes = [...shapes];

    if (shape.type === 'circle' && dims.type === 'polar') {
      const angleRad = dims.angle * (Math.PI / 180);
      updatedShapes[shapeIndex].holes[holeIndex].x = dims.distance * Math.cos(angleRad);
      updatedShapes[shapeIndex].holes[holeIndex].y = dims.distance * Math.sin(angleRad);
    } else if (dims.type === 'cartesian') {
      updatedShapes[shapeIndex].holes[holeIndex].x = dims.fromLeft;
      if (shape.type === 'polygon' && shape.points) {
        const bounds = getPolygonBounds(shape.points);
        updatedShapes[shapeIndex].holes[holeIndex].y = bounds.height - dims.fromBottom;
      } else {
        updatedShapes[shapeIndex].holes[holeIndex].y = shape.height - dims.fromBottom;
      }
    }

    if (dims.diameter !== undefined) {
      updatedShapes[shapeIndex].holes[holeIndex].diameter = dims.diameter;
    }

    updateShapes(updatedShapes);
  };

  // Parts list functions
  const addPartToList = () => {
    if (shapes.length === 0) {
      alert('Piirrä ensin geometria!');
      return;
    }

    const newPart = {
      id: Date.now(),
      name: currentPartName,
      quantity: currentPartQuantity,
      shapes: JSON.parse(JSON.stringify(shapes)),
      material,
      thickness
    };

    if (editingPartIndex !== null) {
      const updatedParts = [...parts];
      updatedParts[editingPartIndex] = newPart;
      setParts(updatedParts);
      setEditingPartIndex(null);
    } else {
      setParts([...parts, newPart]);
    }

    resetCanvas();
  };

  const resetCanvas = () => {
    setShapes([]);
    setSelectedShape(null);
    setSelectedHole(null);
    setHoveredShape(null);
    setHoveredHole(null);
    setCurrentPartName(`Osa ${parts.length + 2}`);
    setCurrentPartQuantity(1);
    setMaterial('S235');
    setThickness(3);
    setHistory([[]]);
    setHistoryIndex(0);
    setZoom(1);
    setPan({ x: 50, y: 50 });
  };

  const editPart = (index) => {
    const part = parts[index];
    setShapes(JSON.parse(JSON.stringify(part.shapes)));
    setCurrentPartName(part.name);
    setCurrentPartQuantity(part.quantity);
    setMaterial(part.material);
    setThickness(part.thickness);
    setEditingPartIndex(index);
    setSelectedShape(null);
    setSelectedHole(null);
    setHistory([JSON.parse(JSON.stringify(part.shapes))]);
    setHistoryIndex(0);
    setTimeout(() => zoomFit(), 50);
  };

  const deletePart = (index) => {
    if (confirm('Poistetaanko osa luettelosta?')) {
      setParts(parts.filter((_, i) => i !== index));
      if (editingPartIndex === index) {
        resetCanvas();
        setEditingPartIndex(null);
      }
    }
  };

  const cancelEditing = () => {
    setEditingPartIndex(null);
    resetCanvas();
  };

  const handleMouseDown = (e) => {
    if (editingDimension) return;

    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x * zoom, y: e.clientY - pan.y * zoom });
      return;
    }

    const pos = getMousePosition(e);

    // Polygon tool handling
    if (tool === 'polygon') {
      // Double-click to close polygon
      if (e.detail === 2 && polygonPoints.length >= 3) {
        closePolygon();
        return;
      }

      // Check if clicking near first point to close
      if (polygonPoints.length >= 3) {
        const dist = calculateSegmentLength(pos, polygonPoints[0]);
        if (dist < 15) {
          closePolygon();
          return;
        }
      }

      // Add new point
      setPolygonPoints(prev => [...prev, pos]);
      if (!isDrawingPolygon) {
        setIsDrawingPolygon(true);
      }
      return;
    }

    // Cutout drawing mode
    if (isDrawingCutout && cutoutTargetShape !== null) {
      // Double-click to close cutout
      if (e.detail === 2 && cutoutPoints.length >= 3) {
        closeCutout();
        return;
      }

      // Check if clicking near first point to close
      if (cutoutPoints.length >= 3 && cutoutPoints[0]) {
        const dist = calculateSegmentLength(pos, cutoutPoints[0]);
        if (dist < 15) {
          closeCutout();
          return;
        }
      }

      // Add new point
      setCutoutPoints(prev => [...prev, pos]);
      return;
    }

    // Handle dragging polygon vertex
    if (tool === 'select' && selectedShape !== null && shapes[selectedShape]?.type === 'polygon') {
      const shape = shapes[selectedShape];
      for (let i = 0; i < shape.points.length; i++) {
        const dist = calculateSegmentLength(pos, shape.points[i]);
        if (dist < 10) {
          setDraggingPoint({ shapeIndex: selectedShape, pointIndex: i });
          return;
        }
      }
    }

    if (tool === 'select') {
      setSelectedShape(null);
      setSelectedHole(null);
      return;
    }

    setIsDrawing(true);
    setStartPoint(pos);

    if (tool === 'hole' && selectedShape !== null) {
      const shape = shapes[selectedShape];
      const relPos = worldToHolePosition(shape, pos.x, pos.y);

      const newHole = { x: relPos.x, y: relPos.y, diameter: holeSize };
      const updatedShapes = [...shapes];
      if (!updatedShapes[selectedShape].holes) updatedShapes[selectedShape].holes = [];
      const newHoleIndex = updatedShapes[selectedShape].holes.length;
      updatedShapes[selectedShape].holes.push(newHole);
      updateShapes(updatedShapes);

      setSelectedHole({ shapeIndex: selectedShape, holeIndex: newHoleIndex });
      setIsDrawing(false);
      return;
    }

    if (tool === 'rectangle') setCurrentShape({ type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0, holes: [], showDimensions: true });
    else if (tool === 'circle') setCurrentShape({ type: 'circle', cx: pos.x, cy: pos.y, radius: 0, holes: [], showDimensions: true });
    else if (tool === 'lshape') setCurrentShape({ type: 'lshape', x: pos.x, y: pos.y, width: 0, height: 0, legWidth: 30, holes: [], showDimensions: true });
  };

  const handleMouseMove = (e) => {
    const pos = getMousePosition(e);
    setCurrentMousePos(pos);

    if (isPanning) {
      setPan({ x: (e.clientX - panStart.x) / zoom, y: (e.clientY - panStart.y) / zoom });
      return;
    }

    // Handle dragging polygon vertex
    if (draggingPoint !== null) {
      const updatedShapes = [...shapes];
      updatedShapes[draggingPoint.shapeIndex].points[draggingPoint.pointIndex] = pos;
      setShapes(updatedShapes);
      return;
    }

    if (isDraggingHole && selectedHole) {
      const shape = shapes[selectedHole.shapeIndex];
      const relPos = worldToHolePosition(shape, pos.x, pos.y);

      const updatedShapes = [...shapes];
      updatedShapes[selectedHole.shapeIndex].holes[selectedHole.holeIndex].x = relPos.x;
      updatedShapes[selectedHole.shapeIndex].holes[selectedHole.holeIndex].y = relPos.y;
      setShapes(updatedShapes);
      return;
    }

    if (!isDrawing || !startPoint || tool === 'hole' || tool === 'polygon') return;

    if (tool === 'rectangle') {
      setCurrentShape({ ...currentShape, width: Math.abs(pos.x - startPoint.x), height: Math.abs(pos.y - startPoint.y), x: Math.min(pos.x, startPoint.x), y: Math.min(pos.y, startPoint.y) });
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startPoint.x, 2) + Math.pow(pos.y - startPoint.y, 2));
      setCurrentShape({ ...currentShape, radius: Math.round(radius / GRID_SIZE) * GRID_SIZE });
    } else if (tool === 'lshape') {
      setCurrentShape({ ...currentShape, width: Math.abs(pos.x - startPoint.x), height: Math.abs(pos.y - startPoint.y), x: Math.min(pos.x, startPoint.x), y: Math.min(pos.y, startPoint.y) });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) { setIsPanning(false); return; }

    // Save polygon vertex drag
    if (draggingPoint !== null) {
      updateShapes([...shapes]);
      setDraggingPoint(null);
      return;
    }

    if (isDraggingHole) {
      setIsDraggingHole(false);
      updateShapes([...shapes]);
      return;
    }

    if (isDrawing && currentShape && tool !== 'hole' && tool !== 'polygon') {
      if ((currentShape.type === 'rectangle' && currentShape.width > 10 && currentShape.height > 10) ||
          (currentShape.type === 'circle' && currentShape.radius > 10) ||
          (currentShape.type === 'lshape' && currentShape.width > 20 && currentShape.height > 20)) {
        updateShapes([...shapes, currentShape]);
        setSelectedShape(shapes.length);
        setSelectedHole(null);
        trackShapeCreation();
      }
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentShape(null);
  };

  const handleShapeClick = (e, index) => {
    e.stopPropagation();
    if (editingDimension || isPanning) return;
    setSelectedShape(index);
    setSelectedHole(null);
    setSelectedSegment(null);
    if (tool !== 'hole') setTool('select');
  };

  const handleHoleClick = (e, shapeIndex, holeIndex) => {
    e.stopPropagation();
    if (editingDimension || isPanning) return;
    setSelectedShape(shapeIndex);
    setSelectedHole({ shapeIndex, holeIndex });
    setTool('select');
  };

  const handleHoleMouseDown = (e, shapeIndex, holeIndex) => {
    e.stopPropagation();
    if (tool === 'select' || tool === 'hole') {
      setSelectedShape(shapeIndex);
      setSelectedHole({ shapeIndex, holeIndex });
      setIsDraggingHole(true);
    }
  };

  const startEditDimension = (e, shapeIndex, dimension, currentValue, x, y) => {
    e.stopPropagation();
    setEditingDimension({ shapeIndex, dimension, x, y });
    setEditValue(currentValue.toString());
  };

  const applyDimension = () => {
    if (!editingDimension) return;
    const { shapeIndex, dimension } = editingDimension;
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue) && newValue > 0) {
      const updatedShapes = [...shapes];
      updatedShapes[shapeIndex][dimension] = newValue;
      updateShapes(updatedShapes);
    }
    setEditingDimension(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') applyDimension();
    else if (e.key === 'Escape') { setEditingDimension(null); setEditValue(''); }
  };

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(MAX_ZOOM, prev * 1.3));
  const zoomOut = () => setZoom(prev => Math.max(MIN_ZOOM, prev / 1.3));
  const zoomReset = () => { setZoom(1); setPan({ x: 50, y: 50 }); };

  const zoomFit = () => {
    if (shapes.length === 0) { zoomReset(); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach(shape => {
      if (shape.type === 'rectangle' || shape.type === 'lshape') {
        minX = Math.min(minX, shape.x); minY = Math.min(minY, shape.y);
        maxX = Math.max(maxX, shape.x + shape.width); maxY = Math.max(maxY, shape.y + shape.height);
      } else if (shape.type === 'circle') {
        minX = Math.min(minX, shape.cx - shape.radius); minY = Math.min(minY, shape.cy - shape.radius);
        maxX = Math.max(maxX, shape.cx + shape.radius); maxY = Math.max(maxY, shape.cy + shape.radius);
      } else if (shape.type === 'polygon') {
        const bounds = getPolygonBounds(shape.points);
        minX = Math.min(minX, bounds.minX); minY = Math.min(minY, bounds.minY);
        maxX = Math.max(maxX, bounds.maxX); maxY = Math.max(maxY, bounds.maxY);
      }
    });
    const padding = 100;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    const container = containerRef.current;
    if (container) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const newZoom = Math.min(containerWidth / contentWidth, containerHeight / contentHeight, 2);
      setZoom(newZoom);
      setPan({ x: -minX + padding + (containerWidth / newZoom - contentWidth) / 2, y: -minY + padding + (containerHeight / newZoom - contentHeight) / 2 });
    }
  };

  const updateShapeDimension = (index, key, value) => {
    const updatedShapes = [...shapes];
    updatedShapes[index][key] = parseFloat(value) || 0;
    updateShapes(updatedShapes);
  };

  const deleteShape = (index) => {
    updateShapes(shapes.filter((_, i) => i !== index));
    setSelectedShape(null);
    setSelectedHole(null);
    setHoveredShape(null);
    setHoveredHole(null);
  };

  const deleteHole = (shapeIndex, holeIndex) => {
    const updatedShapes = [...shapes];
    updatedShapes[shapeIndex].holes = updatedShapes[shapeIndex].holes.filter((_, i) => i !== holeIndex);
    updateShapes(updatedShapes);
    setSelectedHole(null);
    setHoveredHole(null);
  };

  const clearCanvas = () => {
    if (shapes.length > 0 && confirm('Tyhjennä piirtopöytä?')) {
      updateShapes([]);
      setSelectedShape(null);
      setSelectedHole(null);
      setHoveredShape(null);
      setHoveredHole(null);
    }
  };

  // ===== AI CHAT FUNCTIONS =====

  // AI loading state
  const [aiLoading, setAiLoading] = useState(false);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  // Execute AI command from JSON
  const executeAiCommand = (command) => {
    try {
      const { action, type, width, height, diameter, base, sides, size, leg, property, value, x, y } = command;

      if (action === 'create') {
        if (type === 'rectangle') {
          const shape = {
            type: 'rectangle',
            x: 50,
            y: 50,
            width: Math.max(10, width || 100),
            height: Math.max(10, height || 100),
            holes: [],
            showDimensions: true
          };
          updateShapes([...shapes, shape]);
          setSelectedShape(shapes.length);
          setTimeout(() => zoomFit(), 100);
          return true;
        }
        if (type === 'circle') {
          const diam = diameter || 100;
          const shape = {
            type: 'circle',
            cx: 100 + diam/2,
            cy: 100 + diam/2,
            radius: Math.max(5, diam / 2),
            holes: [],
            showDimensions: true
          };
          updateShapes([...shapes, shape]);
          setSelectedShape(shapes.length);
          setTimeout(() => zoomFit(), 100);
          return true;
        }
        if (type === 'triangle') {
          const b = base || 100;
          const h = height || 80;
          const points = [
            { x: 50, y: 50 + h },
            { x: 50 + b, y: 50 + h },
            { x: 50 + b/2, y: 50 }
          ];
          const shape = { type: 'polygon', points, holes: [], showDimensions: true };
          updateShapes([...shapes, shape]);
          setSelectedShape(shapes.length);
          setTimeout(() => zoomFit(), 100);
          return true;
        }
        if (type === 'polygon') {
          const s = sides || 6;
          const sz = size || 100;
          const points = [];
          const radius = sz / 2;
          const cx = 100 + radius;
          const cy = 100 + radius;
          for (let i = 0; i < s; i++) {
            const angle = (i * 2 * Math.PI / s) - Math.PI / 2;
            points.push({
              x: Math.round((cx + radius * Math.cos(angle)) / GRID_SIZE) * GRID_SIZE,
              y: Math.round((cy + radius * Math.sin(angle)) / GRID_SIZE) * GRID_SIZE
            });
          }
          const shape = { type: 'polygon', points, holes: [], showDimensions: true };
          updateShapes([...shapes, shape]);
          setSelectedShape(shapes.length);
          setTimeout(() => zoomFit(), 100);
          return true;
        }
        if (type === 'lshape') {
          const shape = {
            type: 'lshape',
            x: 50,
            y: 50,
            width: Math.max(20, width || 200),
            height: Math.max(20, height || 150),
            legWidth: Math.min(Math.max(10, leg || 50), Math.min(width || 200, height || 150) - 10),
            holes: [],
            showDimensions: true
          };
          updateShapes([...shapes, shape]);
          setSelectedShape(shapes.length);
          setTimeout(() => zoomFit(), 100);
          return true;
        }
      }

      if (action === 'modify') {
        if (selectedShape === null || !shapes[selectedShape]) {
          return false;
        }
        const updated = [...shapes];
        const shape = { ...updated[selectedShape] };

        if (property === 'width' && (shape.type === 'rectangle' || shape.type === 'lshape')) {
          shape.width = Math.max(10, value);
        } else if (property === 'height' && (shape.type === 'rectangle' || shape.type === 'lshape')) {
          shape.height = Math.max(10, value);
        } else if (property === 'diameter' && shape.type === 'circle') {
          shape.radius = Math.max(5, value / 2);
        } else if (property === 'radius' && shape.type === 'circle') {
          shape.radius = Math.max(5, value);
        } else if (property === 'legWidth' && shape.type === 'lshape') {
          shape.legWidth = Math.max(10, value);
        }

        updated[selectedShape] = shape;
        updateShapes(updated);
        setTimeout(() => zoomFit(), 100);
        return true;
      }

      if (action === 'addHole') {
        const idx = selectedShape !== null ? selectedShape : shapes.length - 1;
        if (idx < 0 || !shapes[idx]) return false;

        const shape = shapes[idx];
        const updated = [...shapes];
        if (!updated[idx].holes) updated[idx].holes = [];

        let holeX, holeY;
        if (x !== undefined && y !== undefined) {
          holeX = x;
          holeY = y;
        } else if (shape.type === 'rectangle' || shape.type === 'lshape') {
          holeX = shape.width / 2;
          holeY = shape.height / 2;
        } else if (shape.type === 'circle') {
          holeX = 0;
          holeY = 0;
        } else if (shape.type === 'polygon') {
          const bounds = getPolygonBounds(shape.points);
          holeX = bounds.width / 2;
          holeY = bounds.height / 2;
        }

        updated[idx] = { ...updated[idx], holes: [...updated[idx].holes, { x: holeX, y: holeY, diameter: Math.max(1, diameter || 10) }] };
        updateShapes(updated);
        setSelectedShape(idx);
        return true;
      }

      if (action === 'delete') {
        if (selectedHole !== null && selectedShape !== null) {
          const updated = [...shapes];
          updated[selectedShape] = {
            ...updated[selectedShape],
            holes: updated[selectedShape].holes.filter((_, i) => i !== selectedHole)
          };
          updateShapes(updated);
          setSelectedHole(null);
          return true;
        }
        if (selectedShape !== null) {
          updateShapes(shapes.filter((_, i) => i !== selectedShape));
          setSelectedShape(null);
          return true;
        }
        return false;
      }

      if (action === 'info') {
        return true;
      }

      return false;
    } catch (e) {
      console.error('AI command error:', e);
      return false;
    }
  };

  // Parse JSON commands from AI response (supports multiple commands)
  const parseAiResponse = (response) => {
    const commands = [];
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;

    while ((match = jsonRegex.exec(response)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        // Handle both single command and array of commands
        if (Array.isArray(parsed)) {
          commands.push(...parsed);
        } else {
          commands.push(parsed);
        }
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }

    return commands.length > 0 ? commands : null;
  };

  // Execute multiple AI commands at once (handles state correctly)
  const executeAiCommands = (commands) => {
    let currentShapes = [...shapes];
    let currentSelectedShape = selectedShape;
    let needsZoomFit = false;

    for (const command of commands) {
      const { action, type, width, height, diameter, base, sides, size, leg, property, value, x, y } = command;

      if (action === 'create') {
        let newShape = null;

        if (type === 'rectangle') {
          newShape = {
            type: 'rectangle',
            x: 50,
            y: 50,
            width: Math.max(10, width || 100),
            height: Math.max(10, height || 100),
            holes: [],
            showDimensions: true
          };
        } else if (type === 'circle') {
          const diam = diameter || 100;
          newShape = {
            type: 'circle',
            cx: 100 + diam/2,
            cy: 100 + diam/2,
            radius: Math.max(5, diam / 2),
            holes: [],
            showDimensions: true
          };
        } else if (type === 'triangle') {
          const b = base || 100;
          const h = height || 80;
          newShape = {
            type: 'polygon',
            points: [
              { x: 50, y: 50 + h },
              { x: 50 + b, y: 50 + h },
              { x: 50 + b/2, y: 50 }
            ],
            holes: [],
            showDimensions: true
          };
        } else if (type === 'polygon') {
          const s = sides || 6;
          const sz = size || 100;
          const points = [];
          const radius = sz / 2;
          const cx = 100 + radius;
          const cy = 100 + radius;
          for (let i = 0; i < s; i++) {
            const angle = (i * 2 * Math.PI / s) - Math.PI / 2;
            points.push({
              x: Math.round((cx + radius * Math.cos(angle)) / GRID_SIZE) * GRID_SIZE,
              y: Math.round((cy + radius * Math.sin(angle)) / GRID_SIZE) * GRID_SIZE
            });
          }
          newShape = { type: 'polygon', points, holes: [], showDimensions: true };
        } else if (type === 'lshape') {
          newShape = {
            type: 'lshape',
            x: 50,
            y: 50,
            width: Math.max(20, width || 200),
            height: Math.max(20, height || 150),
            legWidth: Math.min(Math.max(10, leg || 50), Math.min(width || 200, height || 150) - 10),
            holes: [],
            showDimensions: true
          };
        }

        if (newShape) {
          currentShapes = [...currentShapes, newShape];
          currentSelectedShape = currentShapes.length - 1;
          needsZoomFit = true;
        }
      }

      else if (action === 'modify') {
        if (currentSelectedShape !== null && currentShapes[currentSelectedShape]) {
          const shape = { ...currentShapes[currentSelectedShape] };

          if (property === 'width' && (shape.type === 'rectangle' || shape.type === 'lshape')) {
            shape.width = Math.max(10, value);
          } else if (property === 'height' && (shape.type === 'rectangle' || shape.type === 'lshape')) {
            shape.height = Math.max(10, value);
          } else if (property === 'diameter' && shape.type === 'circle') {
            shape.radius = Math.max(5, value / 2);
          } else if (property === 'radius' && shape.type === 'circle') {
            shape.radius = Math.max(5, value);
          } else if (property === 'legWidth' && shape.type === 'lshape') {
            shape.legWidth = Math.max(10, value);
          } else if (property === 'filletRadius' && shape.type === 'polygon') {
            shape.filletRadius = Math.max(0, value);
          }

          currentShapes[currentSelectedShape] = shape;
          needsZoomFit = true;
        }
      }

      else if (action === 'addHole') {
        const idx = currentSelectedShape !== null ? currentSelectedShape : currentShapes.length - 1;
        if (idx >= 0 && currentShapes[idx]) {
          const shape = currentShapes[idx];
          const holes = shape.holes ? [...shape.holes] : [];

          let holeX, holeY;
          if (x !== undefined && y !== undefined) {
            holeX = x;
            holeY = y;
          } else if (shape.type === 'rectangle' || shape.type === 'lshape') {
            holeX = shape.width / 2;
            holeY = shape.height / 2;
          } else if (shape.type === 'circle') {
            holeX = 0;
            holeY = 0;
          } else if (shape.type === 'polygon') {
            const bounds = getPolygonBounds(shape.points);
            holeX = bounds.width / 2;
            holeY = bounds.height / 2;
          }

          holes.push({ x: holeX, y: holeY, diameter: Math.max(1, diameter || 10) });
          currentShapes[idx] = { ...shape, holes };
          currentSelectedShape = idx;
        }
      }

      else if (action === 'removeHoles') {
        // Remove holes from selected shape
        const idx = currentSelectedShape !== null ? currentSelectedShape : currentShapes.length - 1;
        if (idx >= 0 && currentShapes[idx]) {
          const holeIndex = command.holeIndex;
          if (holeIndex !== undefined && currentShapes[idx].holes) {
            // Remove specific hole by index
            currentShapes[idx] = {
              ...currentShapes[idx],
              holes: currentShapes[idx].holes.filter((_, i) => i !== holeIndex)
            };
          } else {
            // Remove ALL holes
            currentShapes[idx] = { ...currentShapes[idx], holes: [] };
          }
        }
      }

      else if (action === 'deleteShape') {
        // Delete the entire shape
        if (currentSelectedShape !== null) {
          currentShapes = currentShapes.filter((_, i) => i !== currentSelectedShape);
          currentSelectedShape = null;
        }
      }

      else if (action === 'delete') {
        // Legacy support - behaves like deleteShape
        if (currentSelectedShape !== null) {
          currentShapes = currentShapes.filter((_, i) => i !== currentSelectedShape);
          currentSelectedShape = null;
        }
      }
    }

    // Update state once with all changes
    updateShapes(currentShapes);
    setSelectedShape(currentSelectedShape);
    if (needsZoomFit) {
      setTimeout(() => zoomFit(), 100);
    }
  };

  // Handle chat submit with Claude API
  const handleAiSubmit = async () => {
    const inputText = aiInput.trim();
    if (!inputText || aiLoading) return;

    const userMsg = { role: 'user', content: inputText };
    setAiMessages(msgs => [...msgs, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      // Get conversation history (exclude first greeting, keep last 10 messages)
      const conversationHistory = aiMessages
        .slice(1)
        .slice(-10)
        .concat(userMsg)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('http://localhost:3001/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          selectedShape,
          shapes
        })
      });

      if (!response.ok) {
        throw new Error('API virhe');
      }

      const data = await response.json();
      const aiResponse = data.content;

      // Parse and execute commands (supports multiple)
      const commands = parseAiResponse(aiResponse);
      if (commands) {
        executeAiCommands(commands);
      }

      // Show response without JSON block
      const cleanResponse = aiResponse.replace(/```json[\s\S]*?```/g, '').trim();
      setAiMessages(msgs => [...msgs, { role: 'assistant', content: cleanResponse || '✓ Tehty!' }]);
    } catch (error) {
      console.error('AI error:', error);
      setAiMessages(msgs => [...msgs, {
        role: 'assistant',
        content: '⚠️ Yhteys AI-palvelimeen epäonnistui.\n\nVarmista että:\n1. Backend käynnissä: npm run server\n2. API-avain .env-tiedostossa'
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Clear chat
  const clearAiChat = () => {
    setAiMessages([
      { role: 'assistant', content: 'Hei! Olen levykaupan AI-avustaja.\n\nVoin:\n• Luoda uusia muotoja\n• Muokata valittua muotoa\n• Lisätä reikiä\n• Poistaa muotoja\n\nKerro mitä haluat tehdä!' }
    ]);
  };

  // ===== END AI CHAT FUNCTIONS =====

  // Geometry list helpers
  const getShapeIcon = (type) => {
    switch (type) {
      case 'rectangle': return '▭';
      case 'circle': return '○';
      case 'lshape': return '⌐';
      case 'polygon': return '⬡';
      default: return '?';
    }
  };

  const getShapeDescription = (shape) => {
    switch (shape.type) {
      case 'rectangle': return `${shape.width.toFixed(0)}×${shape.height.toFixed(0)} mm`;
      case 'circle': return `Ø${(shape.radius * 2).toFixed(0)} mm`;
      case 'lshape': return `${shape.width.toFixed(0)}×${shape.height.toFixed(0)} mm`;
      case 'polygon': {
        const bounds = getPolygonBounds(shape.points);
        return `${shape.points.length} pistettä (${bounds.width.toFixed(0)}×${bounds.height.toFixed(0)})`;
      }
      default: return '';
    }
  };

  const getHoleDescription = (shape, hole) => {
    const dims = getHoleDimensions(shape, hole);
    if (dims.type === 'cartesian') {
      return `Ø${hole.diameter} (X:${dims.fromLeft.toFixed(0)}, Y:${dims.fromBottom.toFixed(0)})`;
    } else {
      return `Ø${hole.diameter} (r:${dims.distance.toFixed(0)}, ${dims.angle.toFixed(0)}°)`;
    }
  };

  // Select from geometry list
  const selectShapeFromList = (index) => {
    setSelectedShape(index);
    setSelectedHole(null);
    setTool('select');
  };

  const selectHoleFromList = (shapeIndex, holeIndex) => {
    setSelectedShape(shapeIndex);
    setSelectedHole({ shapeIndex, holeIndex });
    setTool('select');
  };

  // Calculations
  const calculateAreaForShapes = (shapesList) => {
    let totalArea = 0, holeArea = 0;
    shapesList.forEach((shape) => {
      if (shape.type === 'rectangle') totalArea += shape.width * shape.height;
      else if (shape.type === 'circle') totalArea += Math.PI * Math.pow(shape.radius, 2);
      else if (shape.type === 'lshape') {
        const w = shape.width, h = shape.height, leg = shape.legWidth;
        totalArea += w * leg + (h - leg) * leg;
      } else if (shape.type === 'polygon') {
        totalArea += calculatePolygonArea(shape.points);
      }
      if (shape.holes) shape.holes.forEach((hole) => {
        if (hole.type === 'cutout' && hole.points) {
          holeArea += calculatePolygonArea(hole.points);
        } else if (hole.diameter) {
          holeArea += Math.PI * Math.pow(hole.diameter / 2, 2);
        }
      });
    });
    return { totalArea: totalArea - holeArea, holeArea };
  };

  const calculatePriceForPart = (shapesList, mat, thick, qty) => {
    const { totalArea } = calculateAreaForShapes(shapesList);
    const materialPrice = materials.find((m) => m.id === mat)?.price || 0;
    const areaM2 = totalArea / 1000000;
    const weight = areaM2 * thick * 7.85;
    const materialCost = weight * materialPrice;
    const cuttingCost = shapesList.reduce((acc, shape) => {
      let perimeter = 0;
      if (shape.type === 'rectangle') perimeter = 2 * (shape.width + shape.height);
      else if (shape.type === 'circle') perimeter = 2 * Math.PI * shape.radius;
      else if (shape.type === 'lshape') perimeter = 2 * (shape.width + shape.height);
      else if (shape.type === 'polygon') perimeter = calculatePolygonPerimeter(shape.points);
      if (shape.holes) shape.holes.forEach((hole) => {
        if (hole.type === 'cutout' && hole.points) {
          perimeter += calculatePolygonPerimeter(hole.points);
        } else if (hole.diameter) {
          perimeter += Math.PI * hole.diameter;
        }
      });
      return acc + perimeter * 0.5;
    }, 0);
    return (materialCost + cuttingCost) * qty;
  };

  const currentPartPrice = shapes.length > 0 ? calculatePriceForPart(shapes, material, thickness, currentPartQuantity) : 0;

  const totalOrderPrice = parts.reduce((sum, part) => {
    return sum + calculatePriceForPart(part.shapes, part.material, part.thickness, part.quantity);
  }, 0) + (editingPartIndex === null ? currentPartPrice : 0);

  // Scaled sizes
  const getScaledFontSize = (baseSize) => Math.max(baseSize / zoom, baseSize * 0.5);
  const getScaledStroke = (baseWidth) => Math.max(baseWidth / zoom, baseWidth * 0.3);

  // Render dimension label with color parameter
  const renderDimensionLabel = (shape, shapeIndex, dimension, value, x, y, color = '#00aaff', isActive = true) => {
    const isEditing = editingDimension?.shapeIndex === shapeIndex && editingDimension?.dimension === dimension;
    if (isEditing) return null;
    const boxWidth = 70 / zoom, boxHeight = 28 / zoom, fontSize = getScaledFontSize(14), rx = 4 / zoom;
    const opacity = isActive ? 1 : 0.6;
    return (
      <g key={`dim-${dimension}`} onClick={(e) => isActive && startEditDimension(e, shapeIndex, dimension, value.toFixed(0), x, y)} style={{ cursor: isActive ? 'pointer' : 'default', opacity }}>
        <rect x={x - boxWidth/2} y={y - boxHeight/2} width={boxWidth} height={boxHeight} rx={rx} fill="#1e293b" stroke={color} strokeWidth={getScaledStroke(1.5)} />
        <text x={x} y={y + fontSize * 0.35} fill={color} fontSize={fontSize} fontWeight="bold" textAnchor="middle">{value.toFixed(0)} mm</text>
      </g>
    );
  };

  const renderHole = (shape, shapeIndex, hole, holeIndex, showDims = false) => {
    const isSelected = selectedHole?.shapeIndex === shapeIndex && selectedHole?.holeIndex === holeIndex;
    const isHovered = hoveredHole?.shapeIndex === shapeIndex && hoveredHole?.holeIndex === holeIndex;
    const worldPos = getHoleWorldPosition(shape, hole);
    const dims = getHoleDimensions(shape, hole);
    const strokeWidth = getScaledStroke(isSelected || isHovered ? 2.5 : 1);
    const fontSize = getScaledFontSize(11);
    const dimLineStroke = getScaledStroke(1);
    const strokeColor = isSelected ? '#fbbf24' : isHovered ? '#f97316' : '#888';
    const shouldShowDims = isSelected || isHovered || showDims;

    // Render polygon cutout
    if (hole.type === 'cutout' && hole.points) {
      const cutoutPath = hole.points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${worldPos.x + p.x} ${worldPos.y + p.y}`
      ).join(' ') + ' Z';

      const bounds = getPolygonBounds(hole.points);
      const centerX = worldPos.x + bounds.width / 2;
      const centerY = worldPos.y + bounds.height / 2;

      return (
        <g key={`cutout-${shapeIndex}-${holeIndex}`}>
          <path d={cutoutPath}
            fill={isHovered && !isSelected ? 'rgba(249, 115, 22, 0.2)' : '#1a1a2e'}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            onMouseDown={(e) => handleHoleMouseDown(e, shapeIndex, holeIndex)}
            onClick={(e) => handleHoleClick(e, shapeIndex, holeIndex)}
            style={{ cursor: isDraggingHole ? 'grabbing' : 'grab' }} />
          <text x={centerX} y={centerY + fontSize * 0.35}
            fill={strokeColor} fontSize={fontSize} textAnchor="middle"
            style={{ pointerEvents: 'none' }}>
            ⬡
          </text>
        </g>
      );
    }

    // Render circular hole (default)
    // Get shape origin for dimension lines (handle different shape types)
    let shapeOriginX, shapeOriginY, shapeHeight;
    if (shape.type === 'circle') {
      shapeOriginX = shape.cx - shape.radius;
      shapeOriginY = shape.cy - shape.radius;
      shapeHeight = shape.radius * 2;
    } else if (shape.type === 'polygon') {
      const bounds = getPolygonBounds(shape.points);
      shapeOriginX = bounds.minX;
      shapeOriginY = bounds.minY;
      shapeHeight = bounds.height;
    } else {
      shapeOriginX = shape.x || 0;
      shapeOriginY = shape.y || 0;
      shapeHeight = shape.height || 0;
    }

    return (
      <g key={`hole-${shapeIndex}-${holeIndex}`}>
        <circle cx={worldPos.x} cy={worldPos.y} r={hole.diameter / 2} fill={isHovered && !isSelected ? 'rgba(249, 115, 22, 0.2)' : '#1a1a2e'} stroke={strokeColor} strokeWidth={strokeWidth}
          onMouseDown={(e) => handleHoleMouseDown(e, shapeIndex, holeIndex)} onClick={(e) => handleHoleClick(e, shapeIndex, holeIndex)} style={{ cursor: isDraggingHole ? 'grabbing' : 'grab' }} />
        <text x={worldPos.x} y={worldPos.y + fontSize * 0.35} fill={strokeColor} fontSize={fontSize} textAnchor="middle" style={{ pointerEvents: 'none' }}>Ø{hole.diameter}</text>
        {shouldShowDims && dims.type === 'cartesian' && (
          <>
            <line x1={shapeOriginX} y1={worldPos.y} x2={worldPos.x} y2={worldPos.y} stroke={isSelected ? '#fbbf24' : '#64748b'} strokeWidth={dimLineStroke} strokeDasharray={`${4/zoom},${2/zoom}`} opacity={isSelected ? 1 : 0.6} />
            <line x1={worldPos.x} y1={shapeOriginY + shapeHeight} x2={worldPos.x} y2={worldPos.y} stroke={isSelected ? '#fbbf24' : '#64748b'} strokeWidth={dimLineStroke} strokeDasharray={`${4/zoom},${2/zoom}`} opacity={isSelected ? 1 : 0.6} />
            <g opacity={isSelected ? 1 : 0.6}><rect x={shapeOriginX + dims.fromLeft / 2 - 30 / zoom} y={worldPos.y - 25 / zoom} width={60 / zoom} height={20 / zoom} rx={3 / zoom} fill="#1e293b" stroke={isSelected ? '#fbbf24' : '#64748b'} strokeWidth={dimLineStroke} />
            <text x={shapeOriginX + dims.fromLeft / 2} y={worldPos.y - 12 / zoom} fill={isSelected ? '#fbbf24' : '#94a3b8'} fontSize={fontSize} textAnchor="middle">{dims.fromLeft.toFixed(0)}</text></g>
            <g opacity={isSelected ? 1 : 0.6}><rect x={worldPos.x + 10 / zoom} y={worldPos.y + dims.fromBottom / 2 - 10 / zoom} width={60 / zoom} height={20 / zoom} rx={3 / zoom} fill="#1e293b" stroke={isSelected ? '#fbbf24' : '#64748b'} strokeWidth={dimLineStroke} />
            <text x={worldPos.x + 40 / zoom} y={worldPos.y + dims.fromBottom / 2 + 3 / zoom} fill={isSelected ? '#fbbf24' : '#94a3b8'} fontSize={fontSize} textAnchor="middle">{dims.fromBottom.toFixed(0)}</text></g>
          </>
        )}
        {shouldShowDims && dims.type === 'polar' && (
          <>
            <line x1={shape.cx} y1={shape.cy} x2={worldPos.x} y2={worldPos.y} stroke={isSelected ? '#fbbf24' : '#64748b'} strokeWidth={dimLineStroke} strokeDasharray={`${4/zoom},${2/zoom}`} opacity={isSelected ? 1 : 0.6} />
            <g opacity={isSelected ? 1 : 0.6}><rect x={(shape.cx + worldPos.x) / 2 - 35 / zoom} y={(shape.cy + worldPos.y) / 2 - 25 / zoom} width={70 / zoom} height={20 / zoom} rx={3 / zoom} fill="#1e293b" stroke={isSelected ? '#fbbf24' : '#64748b'} strokeWidth={dimLineStroke} />
            <text x={(shape.cx + worldPos.x) / 2} y={(shape.cy + worldPos.y) / 2 - 12 / zoom} fill={isSelected ? '#fbbf24' : '#94a3b8'} fontSize={fontSize} textAnchor="middle">r={dims.distance.toFixed(0)}</text></g>
            <g opacity={isSelected ? 1 : 0.6}><rect x={shape.cx + 30 / zoom} y={shape.cy - 10 / zoom} width={50 / zoom} height={20 / zoom} rx={3 / zoom} fill="#1e293b" stroke={isSelected ? '#fbbf24' : '#64748b'} strokeWidth={dimLineStroke} />
            <text x={shape.cx + 55 / zoom} y={shape.cy + 3 / zoom} fill={isSelected ? '#fbbf24' : '#94a3b8'} fontSize={fontSize} textAnchor="middle">{dims.angle.toFixed(0)}°</text></g>
          </>
        )}
      </g>
    );
  };

  // Render segment dimension label for polygon
  const renderSegmentDimension = (p1, p2, index, dimColor, isActive) => {
    const length = calculateSegmentLength(p1, p2);
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const offsetX = Math.sin(angle) * 20 / zoom;
    const offsetY = -Math.cos(angle) * 20 / zoom;
    const boxWidth = 50 / zoom, boxHeight = 20 / zoom, fontSize = getScaledFontSize(11), rx = 3 / zoom;

    return (
      <g key={`seg-${index}`} style={{ opacity: isActive ? 1 : 0.6 }}>
        <rect x={midX + offsetX - boxWidth/2} y={midY + offsetY - boxHeight/2} width={boxWidth} height={boxHeight} rx={rx} fill="#1e293b" stroke={dimColor} strokeWidth={getScaledStroke(1)} />
        <text x={midX + offsetX} y={midY + offsetY + fontSize * 0.35} fill={dimColor} fontSize={fontSize} textAnchor="middle">{length.toFixed(0)}</text>
      </g>
    );
  };

  // Render polygon shape
  const renderPolygon = (shape, index, isPreview = false) => {
    const isSelected = selectedShape === index && !isPreview;
    const isHovered = hoveredShape === index && !isPreview && !isSelected;
    const strokeColor = isPreview ? '#00ff88' : isSelected ? '#00aaff' : isHovered ? '#f97316' : '#ffffff';
    const strokeWidth = getScaledStroke(isSelected || isHovered ? 2 : 1);
    const fillColor = isPreview ? 'rgba(0, 255, 136, 0.1)' : isHovered ? 'rgba(249, 115, 22, 0.2)' : 'rgba(100, 150, 255, 0.2)';

    const shapeDimsEnabled = shape.showDimensions !== false;
    const shouldShowShapeDims = isSelected || (showAllDimensions && shapeDimsEnabled);
    const showHoleDims = showAllDimensions && shapeDimsEnabled;
    const dimColor = isSelected ? '#00aaff' : '#64748b';
    const isActiveDim = isSelected;

    // Create path from points - use arc path if any segment has arc, otherwise use fillet path
    const hasArcs = shape.points.some(p => p.arc?.bulge || p.bezier);
    const hasFillets = shape.filletRadius > 0 || shape.points.some(p => p.fillet > 0);

    let pathData;
    if (hasArcs || hasFillets) {
      pathData = generatePathWithArcs(shape.points, shape.filletRadius || 0);
    } else {
      pathData = shape.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    }

    return (
      <g key={index}>
        {/* Main shape */}
        <path d={pathData} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth}
          onClick={(e) => !isPreview && handleShapeClick(e, index)} style={{ cursor: 'pointer' }} />

        {/* Clickable segments for arc/bezier editing (when selected) */}
        {isSelected && shape.points.map((p, i) => {
          const nextP = shape.points[(i + 1) % shape.points.length];
          const midX = (p.x + nextP.x) / 2;
          const midY = (p.y + nextP.y) / 2;
          const isSegSelected = selectedSegment?.shapeIndex === index && selectedSegment?.segmentIndex === i;
          const hasArc = p.arc?.bulge;
          const hasBezier = p.bezier;
          const bezierCpX = hasBezier ? midX + (p.bezier.cx || 0) : midX;
          const bezierCpY = hasBezier ? midY + (p.bezier.cy || 0) : midY;

          return (
            <g key={`seg-click-${i}`}>
              {/* Invisible wider line for easier clicking */}
              <line x1={p.x} y1={p.y} x2={nextP.x} y2={nextP.y}
                stroke="transparent" strokeWidth={15 / zoom}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSegment({ shapeIndex: index, segmentIndex: i });
                }} />
              {/* Bezier control point and handle lines (when bezier is active) */}
              {hasBezier && isSegSelected && (
                <>
                  <line x1={p.x} y1={p.y} x2={bezierCpX} y2={bezierCpY}
                    stroke="#ec4899" strokeWidth={getScaledStroke(1)} strokeDasharray={`${3/zoom},${2/zoom}`} opacity={0.7} />
                  <line x1={nextP.x} y1={nextP.y} x2={bezierCpX} y2={bezierCpY}
                    stroke="#ec4899" strokeWidth={getScaledStroke(1)} strokeDasharray={`${3/zoom},${2/zoom}`} opacity={0.7} />
                </>
              )}
              {/* Bezier control point (draggable) */}
              {hasBezier && (
                <circle cx={bezierCpX} cy={bezierCpY} r={5 / zoom}
                  fill={isSegSelected ? '#ec4899' : '#9333ea'}
                  stroke="#fff" strokeWidth={getScaledStroke(1.5)}
                  style={{ cursor: 'move', pointerEvents: 'all' }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedSegment({ shapeIndex: index, segmentIndex: i });
                    // Start dragging bezier control point
                    const rect = svgRef.current.getBoundingClientRect();
                    const startX = (e.clientX - rect.left) / zoom - pan.x;
                    const startY = (e.clientY - rect.top) / zoom - pan.y;
                    const startCx = p.bezier.cx || 0;
                    const startCy = p.bezier.cy || 0;

                    const handleMouseMove = (moveE) => {
                      const currentX = (moveE.clientX - rect.left) / zoom - pan.x;
                      const currentY = (moveE.clientY - rect.top) / zoom - pan.y;
                      const dx = currentX - startX;
                      const dy = currentY - startY;
                      const updated = [...shapes];
                      updated[index].points[i].bezier = {
                        cx: startCx + dx,
                        cy: startCy + dy
                      };
                      updateShapes(updated);
                    };

                    const handleMouseUp = () => {
                      window.removeEventListener('mousemove', handleMouseMove);
                      window.removeEventListener('mouseup', handleMouseUp);
                    };

                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);
                  }} />
              )}
              {/* Arc drag handle (when arc is active) */}
              {hasArc && (
                (() => {
                  // Calculate arc midpoint position
                  const dx = nextP.x - p.x;
                  const dy = nextP.y - p.y;
                  const chordLen = Math.sqrt(dx * dx + dy * dy);
                  const bulge = p.arc.bulge || 0;
                  // Normal vector (perpendicular to chord)
                  const nx = -dy / chordLen;
                  const ny = dx / chordLen;
                  // Arc handle position
                  const arcHandleX = midX + nx * bulge;
                  const arcHandleY = midY + ny * bulge;

                  return (
                    <>
                      {/* Line from midpoint to arc handle */}
                      {isSegSelected && (
                        <line x1={midX} y1={midY} x2={arcHandleX} y2={arcHandleY}
                          stroke="#8b5cf6" strokeWidth={getScaledStroke(1)} strokeDasharray={`${3/zoom},${2/zoom}`} opacity={0.7} />
                      )}
                      {/* Draggable arc handle */}
                      <circle cx={arcHandleX} cy={arcHandleY} r={6 / zoom}
                        fill={isSegSelected ? '#8b5cf6' : '#7c3aed'}
                        stroke="#fff" strokeWidth={getScaledStroke(1.5)}
                        style={{ cursor: 'move', pointerEvents: 'all' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setSelectedSegment({ shapeIndex: index, segmentIndex: i });

                          const rect = svgRef.current.getBoundingClientRect();
                          const startBulge = p.arc.bulge || 0;
                          const startMouseX = (e.clientX - rect.left) / zoom - pan.x;
                          const startMouseY = (e.clientY - rect.top) / zoom - pan.y;

                          const handleMouseMove = (moveE) => {
                            const currentX = (moveE.clientX - rect.left) / zoom - pan.x;
                            const currentY = (moveE.clientY - rect.top) / zoom - pan.y;
                            // Project mouse movement onto normal direction
                            const mouseDx = currentX - startMouseX;
                            const mouseDy = currentY - startMouseY;
                            const projection = mouseDx * nx + mouseDy * ny;
                            const newBulge = startBulge + projection;

                            const updated = [...shapes];
                            updated[index].points[i].arc = { bulge: newBulge };
                            updateShapes(updated);
                          };

                          const handleMouseUp = () => {
                            window.removeEventListener('mousemove', handleMouseMove);
                            window.removeEventListener('mouseup', handleMouseUp);
                          };

                          window.addEventListener('mousemove', handleMouseMove);
                          window.addEventListener('mouseup', handleMouseUp);
                        }} />
                    </>
                  );
                })()
              )}
              {/* Segment midpoint indicator (for selecting segment, not for arc/bezier that have handles) */}
              <circle cx={midX} cy={midY} r={hasArc || hasBezier ? 4 / zoom : 6 / zoom}
                fill={isSegSelected ? '#f59e0b' : hasBezier ? '#ec4899' : hasArc ? '#8b5cf6' : '#475569'}
                stroke={isSegSelected ? '#fbbf24' : '#fff'}
                strokeWidth={getScaledStroke(1.5)}
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setSelectedSegment({ shapeIndex: index, segmentIndex: i });
                }} />
              {/* Arc indicator if segment has arc */}
              {hasArc && (
                <text x={midX + 8/zoom} y={midY - 8/zoom}
                  fill="#8b5cf6" fontSize={getScaledFontSize(9)} fontWeight="bold">
                  ◠{Math.abs(p.arc.bulge).toFixed(0)}
                </text>
              )}
              {/* Bezier indicator if segment has bezier */}
              {hasBezier && (
                <text x={midX + 8/zoom} y={midY - 8/zoom}
                  fill="#ec4899" fontSize={getScaledFontSize(9)} fontWeight="bold">
                  ∿
                </text>
              )}
            </g>
          );
        })}

        {/* Vertices (draggable when selected) */}
        {isSelected && shape.points.map((p, i) => {
          const hasFillet = (p.fillet > 0) || (shape.filletRadius > 0 && p.fillet !== 0);
          return (
            <circle key={`vertex-${i}`} cx={p.x} cy={p.y} r={6 / zoom}
              fill={draggingPoint?.pointIndex === i ? '#fbbf24' : hasFillet ? '#22c55e' : '#00aaff'}
              stroke="#fff" strokeWidth={getScaledStroke(1.5)}
              style={{ cursor: 'move' }} />
          );
        })}

        {/* Holes */}
        {shape.holes?.map((hole, holeIndex) => renderHole(shape, index, hole, holeIndex, showHoleDims))}

        {/* Segment dimensions */}
        {shouldShowShapeDims && shape.points.map((p, i) => {
          const nextP = shape.points[(i + 1) % shape.points.length];
          return renderSegmentDimension(p, nextP, i, dimColor, isActiveDim);
        })}

        {/* Fillet radius indicator when selected */}
        {isSelected && (shape.filletRadius > 0) && (
          <text x={shape.points[0].x + 15/zoom} y={shape.points[0].y - 15/zoom}
            fill="#22c55e" fontSize={getScaledFontSize(10)} fontWeight="bold">
            R{shape.filletRadius}
          </text>
        )}
      </g>
    );
  };

  // Render polygon being drawn (preview)
  const renderPolygonPreview = () => {
    if (!isDrawingPolygon || polygonPoints.length === 0) return null;

    const fontSize = getScaledFontSize(11);
    const points = polygonPoints;

    // Check if mouse is near first point (to show "close" indicator)
    const nearFirst = points.length >= 3 && calculateSegmentLength(currentMousePos, points[0]) < 15;

    return (
      <g>
        {/* Lines between existing points */}
        {points.map((p, i) => {
          if (i === 0) return null;
          const prevP = points[i - 1];
          const length = calculateSegmentLength(prevP, p);
          const midX = (prevP.x + p.x) / 2;
          const midY = (prevP.y + p.y) / 2;
          return (
            <g key={`line-${i}`}>
              <line x1={prevP.x} y1={prevP.y} x2={p.x} y2={p.y} stroke="#00ff88" strokeWidth={getScaledStroke(1.5)} />
              <text x={midX} y={midY - 10 / zoom} fill="#00ff88" fontSize={fontSize} textAnchor="middle">{length.toFixed(0)}</text>
            </g>
          );
        })}

        {/* Line from last point to cursor */}
        {points.length > 0 && (
          <g>
            <line x1={points[points.length - 1].x} y1={points[points.length - 1].y}
              x2={currentMousePos.x} y2={currentMousePos.y}
              stroke="#00ff88" strokeWidth={getScaledStroke(1)} strokeDasharray={`${5/zoom},${3/zoom}`} opacity={0.7} />
            <text x={(points[points.length - 1].x + currentMousePos.x) / 2}
              y={(points[points.length - 1].y + currentMousePos.y) / 2 - 10 / zoom}
              fill="#00ff88" fontSize={fontSize} textAnchor="middle" opacity={0.7}>
              {calculateSegmentLength(points[points.length - 1], currentMousePos).toFixed(0)}
            </text>
          </g>
        )}

        {/* Closing line preview */}
        {nearFirst && (
          <line x1={currentMousePos.x} y1={currentMousePos.y}
            x2={points[0].x} y2={points[0].y}
            stroke="#22c55e" strokeWidth={getScaledStroke(1.5)} strokeDasharray={`${5/zoom},${3/zoom}`} />
        )}

        {/* Vertices */}
        {points.map((p, i) => (
          <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={(i === 0 && nearFirst) ? 12 / zoom : 5 / zoom}
            fill={(i === 0 && nearFirst) ? '#22c55e' : '#00ff88'}
            stroke="#fff" strokeWidth={getScaledStroke(1.5)}
            style={(i === 0 && nearFirst) ? { cursor: 'pointer', pointerEvents: 'all' } : {}}
            onMouseDown={(i === 0 && nearFirst) ? (e) => { e.stopPropagation(); e.preventDefault(); closePolygon(); } : undefined} />
        ))}

        {/* Close hint */}
        {nearFirst && (
          <text x={points[0].x} y={points[0].y - 20 / zoom} fill="#22c55e" fontSize={fontSize} textAnchor="middle" fontWeight="bold">
            Klikkaa sulkeaksesi
          </text>
        )}
      </g>
    );
  };

  // Render cutout polygon being drawn (preview) - same style as polygon but in orange color
  const renderCutoutPreview = () => {
    if (!isDrawingCutout || !cutoutPoints || cutoutPoints.length === 0) return null;

    const fontSize = getScaledFontSize(11);
    const points = cutoutPoints;

    // Safety check - ensure points[0] exists
    if (!points[0]) return null;

    // Check if mouse is near first point (to show "close" indicator)
    const nearFirst = points.length >= 3 && calculateSegmentLength(currentMousePos, points[0]) < 15;

    return (
      <g>
        {/* Lines between existing points */}
        {points.map((p, i) => {
          if (i === 0) return null;
          const prevP = points[i - 1];
          const length = calculateSegmentLength(prevP, p);
          const midX = (prevP.x + p.x) / 2;
          const midY = (prevP.y + p.y) / 2;
          return (
            <g key={`cutout-line-${i}`}>
              <line x1={prevP.x} y1={prevP.y} x2={p.x} y2={p.y} stroke="#ff8800" strokeWidth={getScaledStroke(2)} />
              <text x={midX} y={midY - 10 / zoom} fill="#ff8800" fontSize={fontSize} textAnchor="middle">{length.toFixed(0)}</text>
            </g>
          );
        })}

        {/* Line from last point to cursor */}
        {points.length > 0 && (
          <g>
            <line x1={points[points.length - 1].x} y1={points[points.length - 1].y}
              x2={currentMousePos.x} y2={currentMousePos.y}
              stroke="#ff8800" strokeWidth={getScaledStroke(1)} strokeDasharray={`${5/zoom},${3/zoom}`} opacity={0.7} />
            <text x={(points[points.length - 1].x + currentMousePos.x) / 2}
              y={(points[points.length - 1].y + currentMousePos.y) / 2 - 10 / zoom}
              fill="#ff8800" fontSize={fontSize} textAnchor="middle" opacity={0.7}>
              {calculateSegmentLength(points[points.length - 1], currentMousePos).toFixed(0)}
            </text>
          </g>
        )}

        {/* Closing line preview */}
        {nearFirst && (
          <line x1={currentMousePos.x} y1={currentMousePos.y}
            x2={points[0].x} y2={points[0].y}
            stroke="#f97316" strokeWidth={getScaledStroke(2)} strokeDasharray={`${5/zoom},${3/zoom}`} />
        )}

        {/* Vertices */}
        {points.map((p, i) => (
          <circle key={`cutout-pt-${i}`} cx={p.x} cy={p.y} r={(i === 0 && nearFirst) ? 12 / zoom : 5 / zoom}
            fill={(i === 0 && nearFirst) ? '#f97316' : '#ff8800'}
            stroke="#fff" strokeWidth={getScaledStroke(1.5)}
            style={(i === 0 && nearFirst) ? { cursor: 'pointer', pointerEvents: 'all' } : {}}
            onMouseDown={(i === 0 && nearFirst) ? (e) => { e.stopPropagation(); e.preventDefault(); closeCutout(); } : undefined} />
        ))}

        {/* Close hint */}
        {nearFirst && (
          <text x={points[0].x} y={points[0].y - 20 / zoom} fill="#f97316" fontSize={fontSize} textAnchor="middle" fontWeight="bold">
            Klikkaa sulkeaksesi aukko
          </text>
        )}

        {/* Info text */}
        <text x={points[0].x} y={points[0].y + 25 / zoom} fill="#ff8800" fontSize={fontSize} textAnchor="middle" opacity={0.8}>
          Piirretään aukkoa
        </text>
      </g>
    );
  };

  const renderShape = (shape, index, isPreview = false) => {
    // Use dedicated polygon renderer
    if (shape.type === 'polygon') {
      return renderPolygon(shape, index, isPreview);
    }

    const isSelected = selectedShape === index && !isPreview;
    const isHovered = hoveredShape === index && !isPreview && !isSelected;
    const strokeColor = isPreview ? '#00ff88' : isSelected ? '#00aaff' : isHovered ? '#f97316' : '#ffffff';
    const strokeWidth = getScaledStroke(isSelected || isHovered ? 2 : 1);
    const dimLineStroke = getScaledStroke(1);
    const dimOffset = 30 / zoom;
    const fillColor = isPreview ? 'rgba(0, 255, 136, 0.1)' : isHovered ? 'rgba(249, 115, 22, 0.2)' : 'rgba(100, 150, 255, 0.2)';

    // Determine if dimensions should be shown
    // Shape's own toggle (default true if not set)
    const shapeDimsEnabled = shape.showDimensions !== false;
    // Show dims if: selected OR (global on AND shape's own toggle on)
    const shouldShowShapeDims = isSelected || (showAllDimensions && shapeDimsEnabled);
    // Show hole dims if: global on AND shape's own toggle on (holes follow parent shape setting)
    const showHoleDims = showAllDimensions && shapeDimsEnabled;

    const dimColor = isSelected ? '#00aaff' : '#64748b';
    const isActiveDim = isSelected;

    if (shape.type === 'rectangle') {
      return (
        <g key={index}>
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => !isPreview && handleShapeClick(e, index)} style={{ cursor: 'pointer' }} />
          {shape.holes?.map((hole, holeIndex) => renderHole(shape, index, hole, holeIndex, showHoleDims))}
          {shouldShowShapeDims && (
            <>
              <line x1={shape.x} y1={shape.y - dimOffset} x2={shape.x + shape.width} y2={shape.y - dimOffset} stroke={dimColor} strokeWidth={dimLineStroke} opacity={isActiveDim ? 1 : 0.6} />
              <line x1={shape.x} y1={shape.y - dimOffset - 6/zoom} x2={shape.x} y2={shape.y - dimOffset + 6/zoom} stroke={dimColor} strokeWidth={dimLineStroke} opacity={isActiveDim ? 1 : 0.6} />
              <line x1={shape.x + shape.width} y1={shape.y - dimOffset - 6/zoom} x2={shape.x + shape.width} y2={shape.y - dimOffset + 6/zoom} stroke={dimColor} strokeWidth={dimLineStroke} opacity={isActiveDim ? 1 : 0.6} />
              {renderDimensionLabel(shape, index, 'width', shape.width, shape.x + shape.width / 2, shape.y - dimOffset, dimColor, isActiveDim)}
              <line x1={shape.x - dimOffset} y1={shape.y} x2={shape.x - dimOffset} y2={shape.y + shape.height} stroke={dimColor} strokeWidth={dimLineStroke} opacity={isActiveDim ? 1 : 0.6} />
              <line x1={shape.x - dimOffset - 6/zoom} y1={shape.y} x2={shape.x - dimOffset + 6/zoom} y2={shape.y} stroke={dimColor} strokeWidth={dimLineStroke} opacity={isActiveDim ? 1 : 0.6} />
              <line x1={shape.x - dimOffset - 6/zoom} y1={shape.y + shape.height} x2={shape.x - dimOffset + 6/zoom} y2={shape.y + shape.height} stroke={dimColor} strokeWidth={dimLineStroke} opacity={isActiveDim ? 1 : 0.6} />
              {renderDimensionLabel(shape, index, 'height', shape.height, shape.x - dimOffset, shape.y + shape.height / 2, dimColor, isActiveDim)}
            </>
          )}
        </g>
      );
    } else if (shape.type === 'circle') {
      return (
        <g key={index}>
          <circle cx={shape.cx} cy={shape.cy} r={shape.radius} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => !isPreview && handleShapeClick(e, index)} style={{ cursor: 'pointer' }} />
          {(isSelected || shouldShowShapeDims) && <circle cx={shape.cx} cy={shape.cy} r={3/zoom} fill={isSelected ? "#00aaff" : "#64748b"} />}
          {shape.holes?.map((hole, holeIndex) => renderHole(shape, index, hole, holeIndex, showHoleDims))}
          {shouldShowShapeDims && (
            <>
              <line x1={shape.cx} y1={shape.cy} x2={shape.cx + shape.radius} y2={shape.cy} stroke={dimColor} strokeWidth={dimLineStroke} strokeDasharray={`${4/zoom},${2/zoom}`} opacity={isActiveDim ? 1 : 0.6} />
              {renderDimensionLabel(shape, index, 'radius', shape.radius, shape.cx + shape.radius / 2, shape.cy - dimOffset/2, dimColor, isActiveDim)}
            </>
          )}
        </g>
      );
    } else if (shape.type === 'lshape') {
      const leg = shape.legWidth;
      const path = `M ${shape.x} ${shape.y} L ${shape.x + shape.width} ${shape.y} L ${shape.x + shape.width} ${shape.y + leg} L ${shape.x + leg} ${shape.y + leg} L ${shape.x + leg} ${shape.y + shape.height} L ${shape.x} ${shape.y + shape.height} Z`;
      return (
        <g key={index}>
          <path d={path} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} onClick={(e) => !isPreview && handleShapeClick(e, index)} style={{ cursor: 'pointer' }} />
          {shape.holes?.map((hole, holeIndex) => renderHole(shape, index, hole, holeIndex, showHoleDims))}
          {shouldShowShapeDims && (
            <>
              <line x1={shape.x} y1={shape.y - dimOffset} x2={shape.x + shape.width} y2={shape.y - dimOffset} stroke={dimColor} strokeWidth={dimLineStroke} opacity={isActiveDim ? 1 : 0.6} />
              {renderDimensionLabel(shape, index, 'width', shape.width, shape.x + shape.width / 2, shape.y - dimOffset, dimColor, isActiveDim)}
              <line x1={shape.x - dimOffset} y1={shape.y} x2={shape.x - dimOffset} y2={shape.y + shape.height} stroke={dimColor} strokeWidth={dimLineStroke} opacity={isActiveDim ? 1 : 0.6} />
              {renderDimensionLabel(shape, index, 'height', shape.height, shape.x - dimOffset, shape.y + shape.height / 2, dimColor, isActiveDim)}
              <line x1={shape.x + leg} y1={shape.y + leg + dimOffset/2} x2={shape.x + shape.width} y2={shape.y + leg + dimOffset/2} stroke={isActiveDim ? '#22c55e' : '#4b5563'} strokeWidth={dimLineStroke} opacity={isActiveDim ? 1 : 0.6} />
              {renderDimensionLabel(shape, index, 'legWidth', shape.legWidth, shape.x + leg + (shape.width - leg) / 2, shape.y + leg + dimOffset/2, isActiveDim ? '#22c55e' : '#4b5563', isActiveDim)}
            </>
          )}
        </g>
      );
    }
    return null;
  };

  const { totalArea } = calculateAreaForShapes(shapes);
  const gridSmall = zoom < 0.1 ? 100 : zoom < 0.3 ? 50 : zoom < 0.7 ? 20 : 10;
  const gridLarge = gridSmall * 10;

  const selectedHoleInfo = selectedHole ? {
    shape: shapes[selectedHole.shapeIndex],
    hole: shapes[selectedHole.shapeIndex]?.holes?.[selectedHole.holeIndex],
    dims: shapes[selectedHole.shapeIndex] && shapes[selectedHole.shapeIndex].holes?.[selectedHole.holeIndex]
      ? getHoleDimensions(shapes[selectedHole.shapeIndex], shapes[selectedHole.shapeIndex].holes[selectedHole.holeIndex]) : null
  } : null;

  // Count total geometry items
  const totalGeometryCount = shapes.reduce((count, shape) => count + 1 + (shape.holes?.length || 0), 0);

  return (
    <div className={isFabOS
      ? "min-h-screen bg-[#F7F7F7] text-gray-900 font-sans"
      : "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans"
    }>
      {/* Epic Intro - only show in legacy theme */}
      {!isFabOS && showIntro && <EpicIntro onComplete={() => setShowIntro(false)} />}

      {/* Humor Banner - only show in legacy theme */}
      {!isFabOS && <HumorBanner />}

      {/* Battle Banner - only show in legacy theme */}
      {!isFabOS && battle && (
        <BattleBanner
          battle={battle}
          onClose={() => {
            setBattle(null);
            const newCount = battlesWatched + 1;
            setBattlesWatched(newCount);
            if (newCount === 1) {
              setAchievement({ title: 'Taistelun Todistaja! ⚔️', description: 'Näit ensimmäisen taistelun!' });
            }
          }}
        />
      )}

      {/* Achievement Toast - only show in legacy theme */}
      {!isFabOS && achievement && (
        <AchievementToast
          achievement={achievement}
          onClose={() => setAchievement(null)}
        />
      )}

      {/* Feedback Modal - only show in legacy theme */}
      {!isFabOS && showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}

      {/* Floating Actions - only show in legacy theme */}
      {!isFabOS && (
        <FloatingActions
          onFeedback={() => setShowFeedback(true)}
          onBattle={() => setBattle({
            title: 'Nopeus',
            us: { name: 'FabOS', value: '2 min', advantage: true },
            them: { name: 'Perinteinen tarjouspyyntö', value: '2-5 pv' }
          })}
        />
      )}

      {/* Investor Banner - only show in legacy theme */}
      {!isFabOS && (
        <InvestorBanner
          onContact={() => {
            window.location.href = 'mailto:sijoittajat@fabos.fi?subject=Sijoituskeskustelu%20-%20FabOS&body=Hei!%0A%0AOlen%20kiinnostunut%20kuulemaan%20lis%C3%A4%C3%A4%20FabOS%20sijoitusmahdollisuudesta.%0A%0AYstävällisin%20terveisin,';
          }}
        />
      )}

      {/* Header */}
      <header className={isFabOS
        ? "bg-[#1A1A2E] border-b border-gray-700 px-6 py-3"
        : "bg-slate-800/80 backdrop-blur border-b border-slate-700 px-6 py-3"
      }>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back to version selector */}
            {onBack && (
              <button
                onClick={onBack}
                className={isFabOS
                  ? "flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  : "flex items-center gap-1 bg-slate-700/50 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors text-sm"
                }
                title="Vaihda versiota"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">{isFabOS ? 'Takaisin' : 'Versiot'}</span>
              </button>
            )}
            {isFabOS ? (
              <div className="flex items-center">
                <span className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Fab</span>
                <span className="text-xl font-bold text-[#FF6B35]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>OS</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" /></svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold cinzel gradient-text">FabOS</h1>
                  <p className="text-xs text-slate-400">V0.1 - Nykyinen versio</p>
                </div>
              </>
            )}
            {isFabOS && (
              <div className="hidden md:flex items-center gap-2 ml-4">
                <span className="px-2 py-1 bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-bold rounded">V0.1</span>
                <span className="text-white font-medium" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Laserleikkeet</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isFabOS && (
              <button
                onClick={() => setShowAiChat(!showAiChat)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showAiChat ? 'bg-purple-500 text-white' : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'}`}
              >
                <span className="text-lg">🤖</span>
                <span className="text-sm">AI-avustaja</span>
              </button>
            )}

            <div className={isFabOS
              ? "flex items-center bg-white/10 rounded-lg overflow-hidden"
              : "flex items-center bg-slate-700/50 rounded-lg overflow-hidden"
            }>
              <button onClick={undo} disabled={!canUndo} className={`px-3 py-2 flex items-center gap-1 ${canUndo ? 'hover:bg-white/10' : 'text-gray-500 cursor-not-allowed'}`} title="Kumoa (Ctrl+Z)">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              </button>
              <div className={isFabOS ? "w-px h-5 bg-white/20" : "w-px h-5 bg-slate-600"} />
              <button onClick={redo} disabled={!canRedo} className={`px-3 py-2 flex items-center gap-1 ${canRedo ? 'hover:bg-white/10' : 'text-gray-500 cursor-not-allowed'}`} title="Toista (Ctrl+Y)">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
              </button>
            </div>

            <div className="text-right">
              <div className={isFabOS ? "text-xs text-gray-400" : "text-xs text-slate-400"}>Tilaus yhteensä</div>
              <div className={isFabOS
                ? "text-2xl font-bold text-[#FF6B35]"
                : "text-2xl font-bold text-emerald-400"
              } style={isFabOS ? { fontFamily: 'JetBrains Mono, monospace' } : {}}>
                {totalOrderPrice.toFixed(2)} €
              </div>
            </div>
            <button className={isFabOS
              ? "bg-gradient-to-r from-[#FF6B35] to-orange-500 hover:shadow-lg hover:shadow-[#FF6B35]/30 px-6 py-2.5 rounded-xl font-semibold text-white"
              : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-emerald-500/20"
            }>
              Tilaa ({parts.length + (shapes.length > 0 && editingPartIndex === null ? 1 : 0)})
            </button>

            <ThemeSwitcher variant="dark" />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-80 p-4 space-y-4 overflow-y-auto ${
          isFabOS
            ? "bg-white border-r border-gray-200"
            : "bg-slate-800/50 border-r border-slate-700"
        }`} style={{ maxHeight: 'calc(100vh - 70px)' }}>

          {/* Polygon Drawing Info */}
          {isDrawingPolygon && (
            <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">⬡ Piirretään monikulmio</h3>
              <div className="text-xs text-slate-300 space-y-1">
                <p>Pisteitä: <span className="font-mono text-emerald-400">{polygonPoints.length}</span></p>
                {polygonPoints.length < 3 && <p className="text-amber-400">Lisää vähintään 3 pistettä</p>}
              </div>
              <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                <p>• Klikkaa lisätäksesi pisteitä</p>
                <p>• <kbd className="bg-slate-700 px-1 rounded">Enter</kbd> tai klikkaa 1. pistettä sulkeaksesi</p>
                <p>• <kbd className="bg-slate-700 px-1 rounded">Backspace</kbd> poistaa viimeisen pisteen</p>
                <p>• <kbd className="bg-slate-700 px-1 rounded">Esc</kbd> peruuttaa</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={closePolygon} disabled={polygonPoints.length < 3}
                  className={`flex-1 text-xs py-1.5 rounded font-medium ${polygonPoints.length >= 3 ? 'bg-emerald-500 hover:bg-emerald-400 text-black' : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}>
                  ✓ Sulje muoto
                </button>
                <button onClick={cancelPolygon} className="text-xs py-1.5 px-3 rounded bg-slate-700 hover:bg-slate-600">
                  ✕ Peruuta
                </button>
              </div>
            </div>
          )}

          {/* Current Part Settings */}
          <div className={`rounded-lg p-4 border ${editingPartIndex !== null ? 'bg-amber-900/20 border-amber-600/50' : 'bg-cyan-900/20 border-cyan-600/50'}`}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              {editingPartIndex !== null ? '✏️ Muokataan osaa' : '➕ Uusi osa'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Osan nimi</label>
                <input type="text" value={currentPartName} onChange={(e) => setCurrentPartName(e.target.value)}
                  className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm" placeholder="Anna osalle nimi" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Määrä (kpl)</label>
                  <input type="number" value={currentPartQuantity} onChange={(e) => setCurrentPartQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm" min={1} />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Hinta</label>
                  <div className="mt-1 bg-slate-600/50 rounded px-3 py-2 text-sm font-mono text-emerald-400">
                    {currentPartPrice.toFixed(2)} €
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400">Materiaali</label>
                  <select value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs">
                    {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Paksuus</label>
                  <select value={thickness} onChange={(e) => setThickness(parseFloat(e.target.value))} className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs">
                    {thicknesses.map((t) => <option key={t} value={t}>{t} mm</option>)}
                  </select>
                </div>
              </div>

              <button onClick={addPartToList} disabled={shapes.length === 0}
                className={`w-full py-2.5 rounded-lg font-semibold transition-all ${shapes.length === 0 ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : editingPartIndex !== null ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-cyan-500 hover:bg-cyan-400 text-black'}`}>
                {editingPartIndex !== null ? '💾 Tallenna muutokset' : '➕ Lisää osa luetteloon'}
              </button>

              {editingPartIndex !== null && (
                <button onClick={cancelEditing} className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm">
                  Peruuta muokkaus
                </button>
              )}
            </div>
          </div>

          {/* Geometry List */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>📐 Geometria ({totalGeometryCount})</span>
              </h3>
              <div className="flex items-center gap-2">
                {shapes.length > 0 && <span className="text-xs text-slate-500">{(totalArea / 100).toFixed(1)} cm²</span>}
                <button
                  onClick={() => setShowAllDimensions(!showAllDimensions)}
                  className={`p-1.5 rounded transition-all ${showAllDimensions ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-600/50 text-slate-400 hover:text-slate-300'}`}
                  title={showAllDimensions ? 'Piilota kaikki mitat (D)' : 'Näytä kaikki mitat (D)'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showAllDimensions ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {shapes.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">Ei geometriaa. Piirrä muotoja työkaluilla.</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {shapes.map((shape, shapeIndex) => (
                  <div key={shapeIndex}>
                    {/* Shape row */}
                    <div
                      className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-all ${
                        selectedShape === shapeIndex && !selectedHole
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : hoveredShape === shapeIndex
                          ? 'bg-orange-500/10 border border-orange-500/30'
                          : 'hover:bg-slate-600/50 border border-transparent'
                      }`}
                      onClick={() => selectShapeFromList(shapeIndex)}
                      onMouseEnter={() => setHoveredShape(shapeIndex)}
                      onMouseLeave={() => setHoveredShape(null)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{getShapeIcon(shape.type)}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {shape.type === 'rectangle' ? 'Suorakaide' : shape.type === 'circle' ? 'Ympyrä' : shape.type === 'polygon' ? 'Monikulmio' : 'L-muoto'}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{getShapeDescription(shape)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Toggle dimensions visibility for this shape */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleShapeDimensions(shapeIndex); }}
                          className={`p-1 rounded transition-colors ${shape.showDimensions !== false ? 'text-cyan-400 hover:bg-cyan-500/20' : 'text-slate-500 hover:bg-slate-600'}`}
                          title={shape.showDimensions !== false ? 'Piilota mitat' : 'Näytä mitat'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {shape.showDimensions !== false ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            )}
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteShape(shapeIndex); }}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                          title="Poista muoto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Holes under this shape */}
                    {shape.holes?.map((hole, holeIndex) => (
                      <div
                        key={`hole-${shapeIndex}-${holeIndex}`}
                        className={`flex items-center justify-between px-2 py-1 ml-4 rounded cursor-pointer transition-all ${
                          selectedHole?.shapeIndex === shapeIndex && selectedHole?.holeIndex === holeIndex
                            ? 'bg-amber-500/20 border border-amber-500/50'
                            : hoveredHole?.shapeIndex === shapeIndex && hoveredHole?.holeIndex === holeIndex
                            ? 'bg-orange-500/10 border border-orange-500/30'
                            : 'hover:bg-slate-600/50 border border-transparent'
                        }`}
                        onClick={() => selectHoleFromList(shapeIndex, holeIndex)}
                        onMouseEnter={() => setHoveredHole({ shapeIndex, holeIndex })}
                        onMouseLeave={() => setHoveredHole(null)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-500">└</span>
                          <span className="text-sm">◉</span>
                          <div className="text-xs text-slate-300 truncate">{getHoleDescription(shape, hole)}</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteHole(shapeIndex, holeIndex); }}
                          className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
                          title="Poista reikä"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parts List */}
          <div className="bg-slate-700/30 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>📦 Osaluettelo ({parts.length})</span>
              {parts.length > 0 && <span className="text-emerald-400">{parts.reduce((s, p) => s + calculatePriceForPart(p.shapes, p.material, p.thickness, p.quantity), 0).toFixed(2)} €</span>}
            </h3>

            {parts.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-3">Ei osia luettelossa</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parts.map((part, index) => (
                  <div key={part.id} className={`bg-slate-800/50 rounded-lg p-3 border ${editingPartIndex === index ? 'border-amber-500' : 'border-slate-600'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium text-sm">{part.name}</div>
                        <div className="text-xs text-slate-400">{part.quantity} kpl • {materials.find(m => m.id === part.material)?.name} • {part.thickness}mm</div>
                      </div>
                      <div className="text-sm font-mono text-emerald-400">
                        {calculatePriceForPart(part.shapes, part.material, part.thickness, part.quantity).toFixed(2)} €
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => editPart(index)} className="flex-1 text-xs bg-slate-700 hover:bg-slate-600 py-1.5 rounded">✏️ Muokkaa</button>
                      <button onClick={() => deletePart(index)} className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 py-1.5 px-3 rounded">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Muodot</h3>
            <div className="grid grid-cols-5 gap-1">
              {[
                { id: 'select', icon: '↖', label: 'Valitse' },
                { id: 'rectangle', icon: '▭', label: 'Suorakaide' },
                { id: 'circle', icon: '○', label: 'Ympyrä' },
                { id: 'lshape', icon: '⌐', label: 'L-muoto' },
                { id: 'polygon', icon: '⬡', label: 'Monikulmio' },
              ].map((t) => (
                <button key={t.id} onClick={() => { setTool(t.id); if (t.id !== 'polygon') cancelPolygon(); cancelCutout(); }} className={`p-2 rounded-lg text-center transition-all ${tool === t.id ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400' : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700'}`} title={t.label}>
                  <div className="text-lg">{t.icon}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">Valitse muoto ja lisää aukot sen jälkeen</p>
          </div>

          {/* Selected Hole */}
          {selectedHoleInfo && selectedHoleInfo.dims && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-amber-400 uppercase mb-2">
                {selectedHoleInfo.hole?.type === 'cutout' ? '⬡ Valittu aukko' : '◉ Valittu reikä'}
              </h3>
              <div className="space-y-2 text-sm">
                {/* Cutout type info */}
                {selectedHoleInfo.dims.type === 'cutout' && (
                  <>
                    <div className="text-xs text-slate-400">
                      <p>Tyyppi: <span className="text-orange-400 font-medium">Monikulmioaukko</span></p>
                      <p>Koko: <span className="text-amber-300 font-mono">{selectedHoleInfo.dims.width?.toFixed(0) || 0} × {selectedHoleInfo.dims.height?.toFixed(0) || 0} mm</span></p>
                    </div>
                    <div><label className="text-slate-400 text-xs">X siirtymä (mm)</label>
                    <input type="number" value={(selectedHoleInfo.hole?.x || 0).toFixed(0)} onChange={(e) => {
                      const updated = [...shapes];
                      updated[selectedHole.shapeIndex].holes[selectedHole.holeIndex].x = parseFloat(e.target.value) || 0;
                      updateShapes(updated);
                    }} className="w-full mt-1 bg-slate-700 border border-amber-500/50 rounded px-3 py-1.5 text-sm font-mono text-amber-300" /></div>
                    <div><label className="text-slate-400 text-xs">Y siirtymä (mm)</label>
                    <input type="number" value={(selectedHoleInfo.hole?.y || 0).toFixed(0)} onChange={(e) => {
                      const updated = [...shapes];
                      updated[selectedHole.shapeIndex].holes[selectedHole.holeIndex].y = parseFloat(e.target.value) || 0;
                      updateShapes(updated);
                    }} className="w-full mt-1 bg-slate-700 border border-amber-500/50 rounded px-3 py-1.5 text-sm font-mono text-amber-300" /></div>
                  </>
                )}
                {/* Circular hole */}
                {selectedHoleInfo.dims.type !== 'cutout' && selectedHoleInfo.hole?.diameter != null && (
                  <div>
                    <label className="text-slate-400 text-xs">Halkaisija (mm)</label>
                    <input type="number" value={(selectedHoleInfo.hole.diameter || 10).toFixed(0)} onChange={(e) => updateHoleFromDimensions(selectedHole.shapeIndex, selectedHole.holeIndex, { ...selectedHoleInfo.dims, diameter: parseFloat(e.target.value) || 1 })} className="w-full mt-1 bg-slate-700 border border-amber-500/50 rounded px-3 py-1.5 text-sm font-mono text-amber-300" />
                  </div>
                )}
                {selectedHoleInfo.dims.type === 'cartesian' && selectedHoleInfo.dims.fromBottom !== undefined && (
                  <>
                    <div><label className="text-slate-400 text-xs">X vasemmasta (mm)</label>
                    <input type="number" value={selectedHoleInfo.dims.fromLeft?.toFixed(0) || 0} onChange={(e) => updateHoleFromDimensions(selectedHole.shapeIndex, selectedHole.holeIndex, { ...selectedHoleInfo.dims, fromLeft: parseFloat(e.target.value) || 0 })} className="w-full mt-1 bg-slate-700 border border-amber-500/50 rounded px-3 py-1.5 text-sm font-mono text-amber-300" /></div>
                    <div><label className="text-slate-400 text-xs">Y alhaalta (mm)</label>
                    <input type="number" value={selectedHoleInfo.dims.fromBottom?.toFixed(0) || 0} onChange={(e) => updateHoleFromDimensions(selectedHole.shapeIndex, selectedHole.holeIndex, { ...selectedHoleInfo.dims, fromBottom: parseFloat(e.target.value) || 0 })} className="w-full mt-1 bg-slate-700 border border-amber-500/50 rounded px-3 py-1.5 text-sm font-mono text-amber-300" /></div>
                  </>
                )}
                {selectedHoleInfo.dims.type === 'polar' && selectedHoleInfo.dims.distance !== undefined && (
                  <>
                    <div><label className="text-slate-400 text-xs">Etäisyys (mm)</label>
                    <input type="number" value={selectedHoleInfo.dims.distance?.toFixed(0) || 0} onChange={(e) => updateHoleFromDimensions(selectedHole.shapeIndex, selectedHole.holeIndex, { ...selectedHoleInfo.dims, distance: parseFloat(e.target.value) || 0 })} className="w-full mt-1 bg-slate-700 border border-amber-500/50 rounded px-3 py-1.5 text-sm font-mono text-amber-300" /></div>
                    <div><label className="text-slate-400 text-xs">Kulma (°)</label>
                    <input type="number" value={selectedHoleInfo.dims.angle?.toFixed(0) || 0} onChange={(e) => updateHoleFromDimensions(selectedHole.shapeIndex, selectedHole.holeIndex, { ...selectedHoleInfo.dims, angle: parseFloat(e.target.value) || 0 })} className="w-full mt-1 bg-slate-700 border border-amber-500/50 rounded px-3 py-1.5 text-sm font-mono text-amber-300" /></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Selected Polygon */}
          {selectedShape !== null && shapes[selectedShape]?.type === 'polygon' && !selectedHole && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-cyan-400 uppercase mb-2">⬡ Monikulmio</h3>

              {/* Global Fillet Radius */}
              <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded">
                <label className="text-green-400 text-xs font-medium flex items-center gap-1">
                  <span>◠</span> Kulmien pyöristys (R)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={shapes[selectedShape]?.filletRadius || 0}
                    onChange={(e) => {
                      if (!shapes[selectedShape]) return;
                      const updated = [...shapes];
                      updated[selectedShape].filletRadius = parseFloat(e.target.value) || 0;
                      updateShapes(updated);
                    }}
                    className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={shapes[selectedShape]?.filletRadius || 0}
                    onChange={(e) => {
                      if (!shapes[selectedShape]) return;
                      const updated = [...shapes];
                      updated[selectedShape].filletRadius = Math.max(0, parseFloat(e.target.value) || 0);
                      updateShapes(updated);
                    }}
                    className="w-14 bg-slate-700 border border-green-500/50 rounded px-1.5 py-0.5 text-center font-mono text-green-300 text-xs"
                  />
                  <span className="text-green-400 text-xs">mm</span>
                </div>
              </div>

              {/* Points list */}
              <h4 className="text-xs text-slate-400 mb-1">Pisteet:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {shapes[selectedShape]?.points?.map((point, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 w-4">{i + 1}.</span>
                    <input type="number" value={point.x.toFixed(0)}
                      onChange={(e) => {
                        if (!shapes[selectedShape]?.points?.[i]) return;
                        const updated = [...shapes];
                        updated[selectedShape].points[i].x = parseFloat(e.target.value) || 0;
                        updateShapes(updated);
                      }}
                      className="w-12 bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-center font-mono text-cyan-300"
                      title="X"
                    />
                    <input type="number" value={point.y.toFixed(0)}
                      onChange={(e) => {
                        if (!shapes[selectedShape]?.points?.[i]) return;
                        const updated = [...shapes];
                        updated[selectedShape].points[i].y = parseFloat(e.target.value) || 0;
                        updateShapes(updated);
                      }}
                      className="w-12 bg-slate-700 border border-slate-600 rounded px-1 py-0.5 text-center font-mono text-cyan-300"
                      title="Y"
                    />
                    <span className="text-green-400" title="Kulman pyöristys">R:</span>
                    <input type="number" value={point.fillet || 0}
                      onChange={(e) => {
                        if (!shapes[selectedShape]?.points?.[i]) return;
                        const updated = [...shapes];
                        updated[selectedShape].points[i].fillet = Math.max(0, parseFloat(e.target.value) || 0);
                        updateShapes(updated);
                      }}
                      className="w-10 bg-slate-700 border border-green-500/30 rounded px-1 py-0.5 text-center font-mono text-green-300"
                      title="Tämän kulman pyöristys (0 = käytä globaalia)"
                      min="0"
                    />
                  </div>
                ))}
              </div>
              {/* Selected Segment Arc/Bezier Editor */}
              {selectedSegment?.shapeIndex === selectedShape && shapes[selectedShape]?.points && (
                <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded">
                  <label className="text-purple-400 text-xs font-medium flex items-center gap-1 mb-2">
                    Segmentti {selectedSegment.segmentIndex + 1}
                  </label>

                  {/* Segment type selector */}
                  <div className="flex gap-1 mb-2">
                    <button
                      onClick={() => {
                        if (!shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]) return;
                        const updated = [...shapes];
                        const point = updated[selectedShape].points[selectedSegment.segmentIndex];
                        delete point.arc;
                        delete point.bezier;
                        updateShapes(updated);
                      }}
                      className={`flex-1 text-xs py-1 rounded ${
                        !shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.arc?.bulge &&
                        !shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.bezier
                          ? 'bg-slate-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      Suora
                    </button>
                    <button
                      onClick={() => {
                        if (!shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]) return;
                        const updated = [...shapes];
                        const point = updated[selectedShape].points[selectedSegment.segmentIndex];
                        delete point.bezier;
                        if (!point.arc) point.arc = { bulge: 10 };
                        updateShapes(updated);
                      }}
                      className={`flex-1 text-xs py-1 rounded ${
                        shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.arc?.bulge
                          ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      ◠ Kaari
                    </button>
                    <button
                      onClick={() => {
                        if (!shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]) return;
                        const updated = [...shapes];
                        const point = updated[selectedShape].points[selectedSegment.segmentIndex];
                        delete point.arc;
                        if (!point.bezier) point.bezier = { cx: 0, cy: -20 };
                        updateShapes(updated);
                      }}
                      className={`flex-1 text-xs py-1 rounded ${
                        shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.bezier
                          ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      ∿ Bezier
                    </button>
                  </div>

                  {/* Arc controls */}
                  {shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.arc?.bulge !== undefined && (
                    <div className="mt-2">
                      <label className="text-purple-400 text-xs">Kaaren korkeus</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          value={shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.arc?.bulge || 0}
                          onChange={(e) => {
                            if (!shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]) return;
                            const updated = [...shapes];
                            const val = parseFloat(e.target.value) || 0;
                            if (!updated[selectedShape].points[selectedSegment.segmentIndex].arc) {
                              updated[selectedShape].points[selectedSegment.segmentIndex].arc = {};
                            }
                            updated[selectedShape].points[selectedSegment.segmentIndex].arc.bulge = val;
                            updateShapes(updated);
                          }}
                          className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <input
                          type="number"
                          value={shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.arc?.bulge || 0}
                          onChange={(e) => {
                            if (!shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]) return;
                            const updated = [...shapes];
                            const val = parseFloat(e.target.value) || 0;
                            if (!updated[selectedShape].points[selectedSegment.segmentIndex].arc) {
                              updated[selectedShape].points[selectedSegment.segmentIndex].arc = {};
                            }
                            updated[selectedShape].points[selectedSegment.segmentIndex].arc.bulge = val;
                            updateShapes(updated);
                          }}
                          className="w-14 bg-slate-700 border border-purple-500/50 rounded px-1.5 py-0.5 text-center font-mono text-purple-300 text-xs"
                        />
                        <span className="text-purple-400 text-xs">mm</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">+ = ulospäin, − = sisäänpäin</p>
                    </div>
                  )}

                  {/* Bezier controls */}
                  {shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.bezier && (
                    <div className="mt-2 space-y-2">
                      <p className="text-pink-400 text-xs">Kontrollipiste (suhteessa keskipisteeseen)</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 text-xs">X</label>
                          <input
                            type="number"
                            value={(shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.bezier?.cx || 0).toFixed(0)}
                            onChange={(e) => {
                              if (!shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]) return;
                              const updated = [...shapes];
                              const val = parseFloat(e.target.value) || 0;
                              if (!updated[selectedShape].points[selectedSegment.segmentIndex].bezier) {
                                updated[selectedShape].points[selectedSegment.segmentIndex].bezier = { cx: 0, cy: 0 };
                              }
                              updated[selectedShape].points[selectedSegment.segmentIndex].bezier.cx = val;
                              updateShapes(updated);
                            }}
                            className="w-full bg-slate-700 border border-pink-500/50 rounded px-2 py-1 text-center font-mono text-pink-300 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs">Y</label>
                          <input
                            type="number"
                            value={(shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]?.bezier?.cy || 0).toFixed(0)}
                            onChange={(e) => {
                              if (!shapes[selectedShape]?.points?.[selectedSegment.segmentIndex]) return;
                              const updated = [...shapes];
                              const val = parseFloat(e.target.value) || 0;
                              if (!updated[selectedShape].points[selectedSegment.segmentIndex].bezier) {
                                updated[selectedShape].points[selectedSegment.segmentIndex].bezier = { cx: 0, cy: 0 };
                              }
                              updated[selectedShape].points[selectedSegment.segmentIndex].bezier.cy = val;
                              updateShapes(updated);
                            }}
                            className="w-full bg-slate-700 border border-pink-500/50 rounded px-2 py-1 text-center font-mono text-pink-300 text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Raahaa kontrollipisteettä SVG:ssä tai syötä arvot</p>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedSegment(null)}
                    className="mt-3 text-xs text-slate-400 hover:text-slate-300"
                  >
                    ✕ Sulje
                  </button>
                </div>
              )}

              {shapes[selectedShape]?.points && (
                <div className="mt-2 pt-2 border-t border-slate-600 text-xs text-slate-400">
                  <p>Pinta-ala: <span className="text-cyan-400 font-mono">{(calculatePolygonArea(shapes[selectedShape]?.points || []) / 100).toFixed(1)} cm²</span></p>
                  <p>Piiri: <span className="text-cyan-400 font-mono">{calculatePolygonPerimeter(shapes[selectedShape]?.points || []).toFixed(0)} mm</span></p>
                </div>
              )}
            </div>
          )}

          {/* Selected Shape (non-polygon) */}
          {selectedShape !== null && shapes[selectedShape] && !selectedHole && shapes[selectedShape].type !== 'polygon' && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Valittu muoto</h3>
              <div className="space-y-2 text-sm">
                {shapes[selectedShape].type === 'rectangle' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-slate-400 text-xs">Leveys (mm)</label><input type="number" value={shapes[selectedShape].width.toFixed(0)} onChange={(e) => updateShapeDimension(selectedShape, 'width', e.target.value)} className="w-full mt-1 bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm font-mono" /></div>
                    <div><label className="text-slate-400 text-xs">Korkeus (mm)</label><input type="number" value={shapes[selectedShape].height.toFixed(0)} onChange={(e) => updateShapeDimension(selectedShape, 'height', e.target.value)} className="w-full mt-1 bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm font-mono" /></div>
                  </div>
                )}
                {shapes[selectedShape].type === 'circle' && (
                  <div><label className="text-slate-400 text-xs">Säde (mm)</label><input type="number" value={shapes[selectedShape].radius.toFixed(0)} onChange={(e) => updateShapeDimension(selectedShape, 'radius', e.target.value)} className="w-full mt-1 bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm font-mono" /></div>
                )}
                {shapes[selectedShape].type === 'lshape' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-slate-400 text-xs">Leveys</label><input type="number" value={shapes[selectedShape].width.toFixed(0)} onChange={(e) => updateShapeDimension(selectedShape, 'width', e.target.value)} className="w-full mt-1 bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm font-mono" /></div>
                    <div><label className="text-slate-400 text-xs">Korkeus</label><input type="number" value={shapes[selectedShape].height.toFixed(0)} onChange={(e) => updateShapeDimension(selectedShape, 'height', e.target.value)} className="w-full mt-1 bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm font-mono" /></div>
                    <div><label className="text-slate-400 text-xs">Laippa</label><input type="number" value={shapes[selectedShape].legWidth.toFixed(0)} onChange={(e) => updateShapeDimension(selectedShape, 'legWidth', e.target.value)} className="w-full mt-1 bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm font-mono" /></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Hole Section - shown when any shape is selected */}
          {selectedShape !== null && shapes[selectedShape] && !selectedHole && !isDrawingCutout && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-orange-400 uppercase mb-2">✂️ Lisää aukko</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setTool('hole');
                  }}
                  className={`p-2 rounded-lg text-center transition-all flex flex-col items-center gap-1 ${
                    tool === 'hole'
                      ? 'bg-orange-500/30 border-2 border-orange-500 text-orange-300'
                      : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-lg">◉</span>
                  <span className="text-xs">Ympyrä</span>
                </button>
                <button
                  onClick={() => startCutoutDrawing(selectedShape)}
                  className="p-2 rounded-lg text-center transition-all flex flex-col items-center gap-1 bg-slate-700/50 border-2 border-transparent hover:bg-slate-700 hover:border-orange-500/50 text-slate-300"
                >
                  <span className="text-lg">⬡</span>
                  <span className="text-xs">Monikulmio</span>
                </button>
              </div>
              {tool === 'hole' && (
                <div className="mt-2">
                  <label className="text-xs text-slate-400">Reiän Ø (mm)</label>
                  <input type="number" value={holeSize} onChange={(e) => setHoleSize(parseFloat(e.target.value) || 10)} className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm" min={1} />
                  <p className="text-xs text-slate-500 mt-1">Klikkaa muotoa lisätäksesi reikä</p>
                </div>
              )}
            </div>
          )}

          {/* Cutout Drawing Mode Indicator */}
          {isDrawingCutout && cutoutTargetShape !== null && (
            <div className="bg-orange-500/20 border-2 border-orange-500 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-orange-400 uppercase mb-2">✂️ Piirretään aukkoa</h3>
              <p className="text-xs text-orange-300 mb-2">
                Klikkaa lisätäksesi pisteitä. {cutoutPoints.length} pistettä.
              </p>
              <p className="text-xs text-slate-400 mb-3">
                • Vähintään 3 pistettä vaaditaan<br/>
                • Klikkaa ensimmäistä pistettä sulkeaksesi<br/>
                • Enter = sulje, Esc = peruuta
              </p>
              <div className="flex gap-2">
                <button
                  onClick={closeCutout}
                  disabled={cutoutPoints.length < 3}
                  className="flex-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs rounded font-medium transition-colors"
                >
                  ✓ Valmis
                </button>
                <button
                  onClick={cancelCutout}
                  className="flex-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded font-medium transition-colors"
                >
                  ✕ Peruuta
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Main Canvas */}
        <main className={`flex-1 p-4 flex gap-4 ${isFabOS ? 'bg-gray-50' : ''}`}>
          {/* AI Chat Panel */}
          {showAiChat && (
            <div className="w-80 bg-slate-800/90 rounded-xl border border-purple-500/30 flex flex-col shadow-xl">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between bg-purple-900/20 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h3 className="font-semibold text-purple-300">AI-avustaja</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={clearAiChat} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-300" title="Tyhjennä">
                    🗑️
                  </button>
                  <button onClick={() => setShowAiChat(false)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-300" title="Sulje">
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '450px', minHeight: '300px' }}>
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/40'
                        : 'bg-slate-700/70 text-slate-200 border border-slate-600/50'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700/70 text-slate-200 border border-slate-600/50 rounded-lg px-3 py-2 text-sm">
                      <span className="inline-flex gap-1">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 border-t border-slate-700 bg-slate-800/50 rounded-b-xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !aiLoading) {
                        handleAiSubmit();
                      }
                    }}
                    disabled={aiLoading}
                    placeholder={aiLoading ? "Odota..." : "Esim. 'muuta leveys 300mm'"}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={() => handleAiSubmit()}
                    disabled={aiLoading}
                    className="px-4 py-2 rounded-lg font-medium bg-purple-500 hover:bg-purple-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? '⏳' : '➤'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Canvas area */}
          <div className="flex-1">
          <div className={`rounded-xl overflow-hidden shadow-2xl ${
            isFabOS
              ? "bg-white border border-gray-200"
              : "bg-slate-900 border border-slate-700"
          }`}>
            <div className={`px-4 py-2 flex items-center justify-between ${
              isFabOS
                ? "bg-gray-50 border-b border-gray-200"
                : "bg-slate-800/50 border-b border-slate-700"
            }`}>
              <span className="text-xs text-slate-400">{editingPartIndex !== null ? `✏️ Muokataan: ${currentPartName}` : `➕ Uusi osa: ${currentPartName}`}</span>
              <div className="flex items-center gap-2">
                {/* Dimensions toggle in toolbar */}
                <button
                  onClick={() => setShowAllDimensions(!showAllDimensions)}
                  className={`text-xs px-2 py-1.5 rounded flex items-center gap-1 transition-all ${showAllDimensions ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                  title="Näytä/piilota mitat (D)"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showAllDimensions ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    )}
                  </svg>
                  Mitat
                </button>
                <div className="w-px h-5 bg-slate-600" />
                <div className="flex items-center bg-slate-700 rounded-lg overflow-hidden">
                  <button onClick={zoomOut} className="px-3 py-1.5 hover:bg-slate-600 text-lg font-bold">−</button>
                  <div className="px-3 py-1.5 bg-slate-800 min-w-[60px] text-center text-xs font-mono">{(zoom * 100).toFixed(0)}%</div>
                  <button onClick={zoomIn} className="px-3 py-1.5 hover:bg-slate-600 text-lg font-bold">+</button>
                </div>
                <button onClick={zoomReset} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1.5 rounded">100%</button>
                <button onClick={zoomFit} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1.5 rounded">Sovita</button>
                <div className="w-px h-5 bg-slate-600" />
                <button onClick={clearCanvas} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1.5 rounded">Tyhjennä</button>
              </div>
            </div>

            <div ref={containerRef} className="relative overflow-hidden" style={{ height: '520px', cursor: isPanning ? 'grabbing' : isDraggingHole ? 'grabbing' : (tool === 'select' ? 'default' : 'crosshair') }}>
              <svg ref={svgRef} width="100%" height="100%" style={{ background: isFabOS ? '#1A1A2E' : '#0f172a' }}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <defs>
                  <pattern id="smallGrid" width={gridSmall} height={gridSmall} patternUnits="userSpaceOnUse">
                    <path d={`M ${gridSmall} 0 L 0 0 0 ${gridSmall}`} fill="none" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="0.5" />
                  </pattern>
                  <pattern id="largeGrid" width={gridLarge} height={gridLarge} patternUnits="userSpaceOnUse">
                    <rect width={gridLarge} height={gridLarge} fill="url(#smallGrid)" />
                    <path d={`M ${gridLarge} 0 L 0 0 0 ${gridLarge}`} fill="none" stroke="rgba(100, 116, 139, 0.4)" strokeWidth="1" />
                  </pattern>
                </defs>

                <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`}>
                  <rect x={-50000} y={-50000} width={100000} height={100000} fill="url(#largeGrid)" />
                  <circle cx="0" cy="0" r={5 / zoom} fill="#00aaff" />
                  <text x={10 / zoom} y={-5 / zoom} fill="#00aaff" fontSize={getScaledFontSize(12)}>0,0</text>
                  <line x1="0" y1="0" x2={80 / zoom} y2="0" stroke="#00aaff" strokeWidth={getScaledStroke(1.5)} />
                  <line x1="0" y1="0" x2="0" y2={80 / zoom} stroke="#00aaff" strokeWidth={getScaledStroke(1.5)} />
                  <line x1={0} y1={-40 / zoom} x2={100} y2={-40 / zoom} stroke="#22c55e" strokeWidth={getScaledStroke(2)} />
                  <text x={50} y={-50 / zoom} fill="#22c55e" fontSize={getScaledFontSize(11)} textAnchor="middle">100mm</text>
                  {shapes.map((shape, index) => renderShape(shape, index))}
                  {currentShape && renderShape(currentShape, -1, true)}
                  {renderPolygonPreview()}
                  {renderCutoutPreview()}
                </g>
              </svg>

              {editingDimension && (
                <div className="absolute" style={{ left: (editingDimension.x * zoom + pan.x * zoom), top: (editingDimension.y * zoom + pan.y * zoom) - 20, zIndex: 100 }}>
                  <input ref={inputRef} type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={applyDimension}
                    className="w-20 bg-slate-800 border-2 border-cyan-500 rounded px-2 py-1 text-center text-cyan-400 font-mono font-bold text-sm shadow-lg" />
                  <span className="ml-1 text-cyan-400 text-sm">mm</span>
                </div>
              )}

              <div className="absolute bottom-3 right-3 bg-slate-800/80 px-2 py-1 rounded text-xs text-slate-400">
                {(zoom * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="mt-3 bg-slate-800/30 rounded-lg p-3 text-xs text-slate-400 grid grid-cols-4 gap-4">
            <div><strong className="text-slate-300">Piirtäminen:</strong> Vedä tai monikulmio</div>
            <div><strong className="text-slate-300">AI-avustaja:</strong> 🤖 nappi yläpalkissa</div>
            <div><strong className="text-slate-300">Mitat:</strong> D-näppäin tai 👁️-nappi</div>
            <div><strong className="text-slate-300">Zoom:</strong> Ctrl + rulla</div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FabOSProto;
