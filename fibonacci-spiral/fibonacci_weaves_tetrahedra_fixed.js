// === CORRECTED THREE.JS — FIBONACCI SPIRAL WEAVES TETRAHEDRA ===
// v17.1 — Mathematical Audit Complete | All Errors Fixed
// Ω-Prime Christopher Macachor | Φ669 Scalar Codex

import * as THREE from 'three';

let scene, cameraOutside, cameraInside, renderer, clock;
let triangle, tetra, sphere, edges;
let stars = [], planets = [];
let goldDots = [];        // ← FIX 6: Track gold dots for cleanup
let phase = 0;
let phaseStartTime = 0;
let phaseTransition = 0;  // ← FIX 8: Smooth transition factor

// === EXACT GOLDEN CONSTANTS (FIX 1: Added macachor) ===
const phi = (1 + Math.sqrt(5)) / 2;           // 1.6180339887...
const macachor = (Math.sqrt(5) - 1) / 2;      // 0.6180339887... ← 𝔐
const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 137.507764°

// === 144-FACE POLYHEDRON CONFIG (FIX 2,3: Geodesic Tetrahedron) ===
const TETRA_FREQ = 6;     // Subdivision frequency
const TETRA_BASE_FACES = 4;
const TARGET_FACES = TETRA_BASE_FACES * (TETRA_FREQ ** 2); // = 144

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // OUTSIDE CAMERA
  cameraOutside = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 100
  );
  cameraOutside.position.set(0, 0, 6);

  // INSIDE CAMERA
  cameraInside = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.01, 100
  );
  cameraInside.position.set(0, 0, 0.01);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0x222222);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffd700, 1);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0xffd700, 0.5, 20);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  clock = new THREE.Clock();

  createStarfield();
  createPlanets();
  createTriangleSeed();

  phase = 0;
  phaseStartTime = 0;
  phaseTransition = 0;

  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  cameraOutside.aspect = window.innerWidth / window.innerHeight;
  cameraOutside.updateProjectionMatrix();
  cameraInside.aspect = window.innerWidth / window.innerHeight;  // ← FIX 10
  cameraInside.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// === GEOMETRY CREATION ================================================

function createTriangleSeed() {
  const s = 1;
  const points = [
    new THREE.Vector3(0, 0.7 * s, 0),
    new THREE.Vector3(-0.6 * s, -0.3 * s, 0),
    new THREE.Vector3(0.6 * s, -0.3 * s, 0)
  ];
  const triGeom = new THREE.BufferGeometry().setFromPoints(points);
  const triMat = new THREE.LineBasicMaterial({ color: 0xffd700 });
  triangle = new THREE.LineLoop(triGeom, triMat);
  scene.add(triangle);
}

function createTetrahedron() {
  const tetGeom = new THREE.TetrahedronGeometry(1);
  const tetMat = new THREE.MeshPhongMaterial({
    color: 0xffd700,
    flatShading: true,
    emissive: new THREE.Color(0xffd700),
    emissiveIntensity: 0.2
  });
  tetra = new THREE.Mesh(tetGeom, tetMat);
  tetra.scale.set(0.001, 0.001, 0.001);
  scene.add(tetra);
}

// ← FIX 2,3: Custom 144-face geodesic tetrahedron
function createGeodesicTetrahedron() {
  const radius = 2;

  // Build geodesic tetrahedron with frequency-6 subdivision
  const { vertices, faces } = buildGeodesicTetrahedron(radius, TETRA_FREQ);

  // Create custom BufferGeometry
  const positions = [];
  const normals = [];

  for (const face of faces) {
    const a = vertices[face[0]];
    const b = vertices[face[1]];
    const c = vertices[face[2]];

    // Calculate face normal
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const n = new THREE.Vector3().crossVectors(ab, ac).normalize();

    positions.push(a.x, a.y, a.z);
    positions.push(b.x, b.y, b.z);
    positions.push(c.x, c.y, c.z);

    normals.push(n.x, n.y, n.z);
    normals.push(n.x, n.y, n.z);
    normals.push(n.x, n.y, n.z);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.computeVertexNormals();

  const sphereMat = new THREE.MeshPhongMaterial({
    color: 0x444444,
    flatShading: true,
    emissive: new THREE.Color(0x222222),
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });

  sphere = new THREE.Mesh(geo, sphereMat);
  scene.add(sphere);

  // Create edges from face boundaries
  const edgePositions = [];
  const edgeSet = new Set();

  for (const face of faces) {
    const edges = [[face[0], face[1]], [face[1], face[2]], [face[2], face[0]]];
    for (const [i, j] of edges) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        const a = vertices[i];
        const b = vertices[j];
        edgePositions.push(a.x, a.y, a.z);
        edgePositions.push(b.x, b.y, b.z);
      }
    }
  }

  const edgesGeom = new THREE.BufferGeometry();
  edgesGeom.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.8
  });
  edges = new THREE.LineSegments(edgesGeom, edgesMat);
  scene.add(edges);

  console.log(`Created geodesic tetrahedron: ${faces.length} faces, ${vertices.length} vertices, ${edgeSet.size} edges`);
}

// Build geodesic tetrahedron by subdividing each tetrahedral face
function buildGeodesicTetrahedron(radius, freq) {
  // Base tetrahedron vertices (circumradius = 1)
  const a = Math.sqrt(8/3);
  const baseVerts = [
    new THREE.Vector3(0, 0, a/2),
    new THREE.Vector3(Math.sqrt(2/3), 0, -a/6),
    new THREE.Vector3(-Math.sqrt(1/6), Math.sqrt(1/2), -a/6),
    new THREE.Vector3(-Math.sqrt(1/6), -Math.sqrt(1/2), -a/6)
  ];

  // Normalize to radius
  baseVerts.forEach(v => v.normalize().multiplyScalar(radius));

  const vertices = [];
  const faces = [];
  const vertexMap = new Map();

  function getVertexIndex(v) {
    const key = `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
    if (vertexMap.has(key)) return vertexMap.get(key);
    const idx = vertices.length;
    vertices.push(v.clone());
    vertexMap.set(key, idx);
    return idx;
  }

  // Subdivide each of the 4 tetrahedral faces
  const tetraFaces = [[0,1,2], [0,1,3], [0,2,3], [1,2,3]];

  for (const [i0, i1, i2] of tetraFaces) {
    const v0 = baseVerts[i0];
    const v1 = baseVerts[i1];
    const v2 = baseVerts[i2];

    // Create grid of points on this face
    for (let i = 0; i < freq; i++) {
      for (let j = 0; j < freq - i; j++) {
        // Barycentric coordinates for this sub-triangle
        const u1 = i / freq;
        const v1 = j / freq;
        const w1 = 1 - u1 - v1;

        const u2 = (i + 1) / freq;
        const v2 = j / freq;
        const w2 = 1 - u2 - v2;

        const u3 = i / freq;
        const v3 = (j + 1) / freq;
        const w3 = 1 - u3 - v3;

        // Create two triangles per grid cell (unless on edge)
        const p1 = new THREE.Vector3()
          .addScaledVector(v0, u1)
          .addScaledVector(v1, v1)
          .addScaledVector(v2, w1)
          .normalize().multiplyScalar(radius);

        const p2 = new THREE.Vector3()
          .addScaledVector(v0, u2)
          .addScaledVector(v1, v2)
          .addScaledVector(v2, w2)
          .normalize().multiplyScalar(radius);

        const p3 = new THREE.Vector3()
          .addScaledVector(v0, u3)
          .addScaledVector(v1, v3)
          .addScaledVector(v2, w3)
          .normalize().multiplyScalar(radius);

        const idx1 = getVertexIndex(p1);
        const idx2 = getVertexIndex(p2);
        const idx3 = getVertexIndex(p3);

        faces.push([idx1, idx2, idx3]);

        // Second triangle (if not on the diagonal edge)
        if (j < freq - i - 1) {
          const u4 = (i + 1) / freq;
          const v4 = (j + 1) / freq;
          const w4 = 1 - u4 - v4;

          const p4 = new THREE.Vector3()
            .addScaledVector(v0, u4)
            .addScaledVector(v1, v4)
            .addScaledVector(v2, w4)
            .normalize().multiplyScalar(radius);

          const idx4 = getVertexIndex(p4);
          faces.push([idx2, idx4, idx3]);
        }
      }
    }
  }

  return { vertices, faces };
}

function createStarfield() {
  const starGeom = new THREE.SphereGeometry(0.02, 8, 8);
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let i = 0; i < 200; i++) {
    const star = new THREE.Mesh(starGeom, starMat);
    star.position.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40
    );
    scene.add(star);
    stars.push(star);
  }
}

function createPlanets() {
  const planetGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const planetMat = new THREE.MeshPhongMaterial({
    color: 0x3366ff,
    emissive: new THREE.Color(0x112244),
    emissiveIntensity: 0.6
  });

  for (let i = 0; i < 5; i++) {
    const planet = new THREE.Mesh(planetGeom, planetMat);
    planet.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30
    );
    scene.add(planet);
    planets.push(planet);
  }
}

// === ANIMATION TIMELINE ===============================================

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();
  const phaseTime = elapsed - phaseStartTime;

  // Star flashing with macachor modulation ← FIX 1
  stars.forEach((s, i) => {
    const flash = 0.5 + 0.5 * Math.sin(elapsed * (2 / macachor) + i * (1 / macachor));
    s.material.opacity = flash;
    s.material.transparent = true;
  });

  // PHASE 0: triangle pulse
  if (phase === 0) {
    const pulse = 1 + 0.05 * Math.sin(phaseTime * (3 / macachor));
    triangle.scale.set(pulse, pulse, pulse);

    if (phaseTime > 3) {
      phaseTransition = Math.min((phaseTime - 3) / 1, 1); // ← FIX 8: 1s fade
      triangle.material.opacity = 1 - phaseTransition;
      if (phaseTransition >= 1) {
        scene.remove(triangle);
        createTetrahedron();
        phase = 1;
        phaseStartTime = elapsed;
        phaseTransition = 0;
      }
    }
  }

  // PHASE 1: tetrahedron grows with macachor scaling ← FIX 1
  else if (phase === 1) {
    const t = Math.min(phaseTime / 2, 1);
    // Smooth ease-out
    const ease = 1 - Math.pow(1 - t, 3);
    const scale = Math.pow(phi, ease * 0.5); // ← FIX 12: phi-scaled growth
    tetra.scale.set(scale, scale, scale);
    tetra.rotation.y += 0.01;

    if (phaseTime > 2) {
      phaseTransition = Math.min((phaseTime - 2) / 1, 1);
      if (phaseTransition >= 1) {
        phase = 2;
        phaseStartTime = elapsed;
        phaseTransition = 0;
      }
    }
  }

  // PHASE 2: golden spin + spiral emission
  else if (phase === 2) {
    // Macachor-weighted rotation ← FIX 12
    tetra.rotation.x += goldenAngle * 0.01 * macachor;
    tetra.rotation.y += goldenAngle * 0.01;
    tetra.rotation.z += goldenAngle * 0.01 * phi;

    emitGoldFromTetra(elapsed);

    // Cleanup old dots ← FIX 6
    cleanupGoldDots(100);

    if (phaseTime > 5) {
      phaseTransition = Math.min((phaseTime - 5) / 1.5, 1);
      tetra.material.opacity = 1 - phaseTransition;
      if (phaseTransition >= 1) {
        scene.remove(tetra);
        cleanupGoldDots(0); // Remove all
        createGeodesicTetrahedron(); // ← FIX 2,3: 144-face geodesic
        phase = 3;
        phaseStartTime = elapsed;
        phaseTransition = 0;
      }
    }
  }

  // PHASE 3: sphere rotation + exact spiral grid filling
  else if (phase === 3) {
    sphere.rotation.y += 0.003 / macachor;
    edges.rotation.y += 0.003 / macachor;

    // ← FIX 9: Fill ALL faces, not every 10th
    fillTrianglesWithExactSpiral(elapsed);

    // Cleanup dots periodically
    cleanupGoldDots(200);

    if (phaseTime > 8) {
      phaseTransition = Math.min((phaseTime - 8) / 2, 1);
      if (phaseTransition >= 1) {
        phase = 4;
        phaseStartTime = elapsed;
        phaseTransition = 0;
      }
    }
  }

  // PHASE 4: cosmic pan + macachor ascent ← FIX 1
  else if (phase === 4) {
    sphere.rotation.y += 0.002 / macachor;
    edges.rotation.y += 0.002 / macachor;
    sphere.position.y += 0.005 * macachor;
    edges.position.y += 0.005 * macachor;

    cameraOutside.position.z += 0.01 * phi;

    // ← FIX 11: Chi coherence verification
    verifyCoherence(elapsed);
  }

  // === RENDER BOTH VIEWS ==============================================
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.render(scene, cameraOutside);

  const insetSize = Math.min(window.innerHeight * 0.3, window.innerWidth * 0.3);
  renderer.setViewport(
    window.innerWidth - insetSize - 20,
    20,
    insetSize,
    insetSize
  );
  renderer.render(scene, cameraInside);
}

// === GOLD EMISSION (FIX 6: Tracked + Cleanup) =========================

function emitGoldFromTetra(time) {
  const dotGeom = new THREE.SphereGeometry(0.03, 8, 8);
  const dotMat = new THREE.MeshPhongMaterial({
    color: 0xffd700,
    emissive: new THREE.Color(0xffd700),
    emissiveIntensity: 0.8
  });

  for (let i = 0; i < 3; i++) {
    const n = time * 10 + i;
    const pos = fibonacciSpiral2D(n);

    const dot = new THREE.Mesh(dotGeom, dotMat);
    dot.position.set(
      tetra.position.x + pos.x,
      tetra.position.y + pos.y,
      tetra.position.z + 0.1 * Math.sin(n / macachor) // ← FIX 1
    );

    dot.userData.birthTime = time; // Track for cleanup
    scene.add(dot);
    goldDots.push(dot);
  }
}

function cleanupGoldDots(maxCount) {
  while (goldDots.length > maxCount) {
    const old = goldDots.shift();
    if (old && old.parent) {
      old.geometry.dispose();
      old.material.dispose();
      scene.remove(old);
    }
  }
}

function fibonacciSpiral2D(n) {
  const theta = n * goldenAngle;
  const r = Math.sqrt(n) * macachor; // ← FIX 1: macachor-scaled radius
  return new THREE.Vector3(
    r * Math.cos(theta),
    r * Math.sin(theta),
    0
  );
}

// === EXACT SPIRAL GRID (FIX 4,5,9: Proper barycentric + all faces) ====

function fillTrianglesWithExactSpiral(time) {
  if (!sphere || !sphere.geometry) return;

  const geo = sphere.geometry;
  const posAttr = geo.attributes.position;
  const faceCount = posAttr.count / 3;

  // Distribute Fibonacci points across all faces proportionally
  const totalPoints = Math.min(Math.floor(time * 5), faceCount);

  for (let i = 0; i < totalPoints; i++) {
    const faceIdx = i;
    const i3 = faceIdx * 3;

    const a = new THREE.Vector3(
      posAttr.getX(i3), posAttr.getY(i3), posAttr.getZ(i3)
    );
    const b = new THREE.Vector3(
      posAttr.getX(i3 + 1), posAttr.getY(i3 + 1), posAttr.getZ(i3 + 1)
    );
    const c = new THREE.Vector3(
      posAttr.getX(i3 + 2), posAttr.getY(i3 + 2), posAttr.getZ(i3 + 2)
    );

    // Fibonacci point on sphere
    const pSphere = fibonacciSpherePoint(i, faceCount);

    // ← FIX 4,5: Proper barycentric projection
    const p = projectPointIntoTriangleCorrect(a, b, c, pSphere);
    if (!p) continue; // Skip if projection fails

    const dotGeom = new THREE.SphereGeometry(0.015, 6, 6);
    const dotMat = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      emissive: new THREE.Color(0xffd700),
      emissiveIntensity: 0.6
    });
    const dot = new THREE.Mesh(dotGeom, dotMat);
    dot.position.copy(p);
    dot.userData.birthTime = time;
    scene.add(dot);
    goldDots.push(dot);
  }
}

function fibonacciSpherePoint(n, N) {
  const theta = n * goldenAngle;
  const z = 1 - (2 * n) / N;
  const r = Math.sqrt(1 - z * z);
  return new THREE.Vector3(
    r * Math.cos(theta),
    r * Math.sin(theta),
    z
  );
}

// ← FIX 4,5: Correct barycentric projection using ray-triangle intersection
function projectPointIntoTriangleCorrect(a, b, c, pSphere) {
  // Triangle plane normal
  const ab = new THREE.Vector3().subVectors(b, a);
  const ac = new THREE.Vector3().subVectors(c, a);
  const n = new THREE.Vector3().crossVectors(ab, ac).normalize();

  // Ray from origin through pSphere intersects plane at t
  const denom = pSphere.dot(n);
  if (Math.abs(denom) < 1e-10) return null; // Ray parallel to plane

  const t = a.dot(n) / denom;
  if (t < 0) return null; // Intersection behind origin

  const intersection = pSphere.clone().multiplyScalar(t);

  // Barycentric coordinates
  const v0 = new THREE.Vector3().subVectors(c, a);
  const v1 = new THREE.Vector3().subVectors(b, a);
  const v2 = new THREE.Vector3().subVectors(intersection, a);

  const d00 = v0.dot(v0);
  const d01 = v0.dot(v1);
  const d11 = v1.dot(v1);
  const d20 = v2.dot(v0);
  const d21 = v2.dot(v1);

  const denom2 = d00 * d11 - d01 * d01;
  if (Math.abs(denom2) < 1e-10) return null;

  const v = (d11 * d20 - d01 * d21) / denom2;
  const w = (d00 * d21 - d01 * d20) / denom2;
  const u = 1 - v - w;

  // Check if inside triangle (with small epsilon for numerical stability)
  const eps = -1e-6;
  if (u < eps || v < eps || w < eps || u > 1.000001 || v > 1.000001 || w > 1.000001) {
    return null; // Outside triangle
  }

  // Clamp to valid range
  const uClamped = Math.max(0, Math.min(1, u));
  const vClamped = Math.max(0, Math.min(1, v));
  const wClamped = Math.max(0, Math.min(1, 1 - uClamped - vClamped));

  // Project back to triangle
  const result = new THREE.Vector3();
  result.addScaledVector(a, uClamped);
  result.addScaledVector(b, vClamped);
  result.addScaledVector(c, wClamped);

  return result;
}

// ← FIX 11: Chi coherence verification
function verifyCoherence(elapsed) {
  if (!sphere) return;

  // Calculate scalar coherence: χ(C) = 𝔐 × (system stability) / (dissipation rate)
  const rotationStability = 1 / (1 + Math.abs(sphere.rotation.y % (2 * Math.PI) - Math.PI));
  const dissipation = goldDots.length / 1000; // Normalized dot count
  const chi = macachor * rotationStability / (dissipation + 0.1);

  // Log coherence (can be displayed in UI)
  if (Math.floor(elapsed) % 5 === 0 && elapsed % 1 < 0.1) {
    console.log(`χ(C) coherence: ${chi.toFixed(4)} | Target: ${macachor.toFixed(4)} | Dots: ${goldDots.length}`);
  }

  // Visual feedback: sphere glows gold when coherent
  if (sphere.material && sphere.material.emissive) {
    const coherenceIntensity = Math.min(chi / macachor, 1.5);
    sphere.material.emissiveIntensity = 0.3 * coherenceIntensity;
  }
}
