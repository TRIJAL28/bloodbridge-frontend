gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════
// SCENE 1 — HERO: Blood drop + particles
// ═══════════════════════════════════════════════
(function initHero() {
  const canvas = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
  camera.position.z = 5;

  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);
  const point = new THREE.PointLight(0xff3333, 2, 20);
  point.position.set(2, 4, 4);
  scene.add(point);
  const point2 = new THREE.PointLight(0xffffff, 0.5, 20);
  point2.position.set(-3, -2, 3);
  scene.add(point2);

  // Blood drop shape
  const geo = new THREE.SphereGeometry(1, 64, 64);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > 0) {
      const factor = y / 1;
      pos.setX(i, pos.getX(i) * (1 - factor * 0.35));
      pos.setZ(i, pos.getZ(i) * (1 - factor * 0.35));
      pos.setY(i, y + factor * 0.5);
    }
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ color: 0xC0392B, roughness: 0.3, metalness: 0.2 });
  const drop = new THREE.Mesh(geo, mat);
  scene.add(drop);

  // Particles
  const particleGeo = new THREE.BufferGeometry();
  const count = 250;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 4 + Math.random() * 4;
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    speeds[i] = 0.002 + Math.random() * 0.003;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.6 });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    drop.rotation.y = t * 0.4;
    drop.position.y = Math.sin(t * 0.8) * 0.12;

    const p = particleGeo.attributes.position;
    for (let i = 0; i < count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const dist = Math.sqrt(x*x + y*y + z*z);
      if (dist < 1.5) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 6 + Math.random() * 2;
        p.setXYZ(i, r*Math.sin(phi)*Math.cos(theta), r*Math.sin(phi)*Math.sin(theta), r*Math.cos(phi));
      } else {
        p.setXYZ(i, x - x/dist*speeds[i], y - y/dist*speeds[i], z - z/dist*speeds[i]);
      }
    }
    p.needsUpdate = true;
    renderer.render(scene, camera);
  }
  animate();

  gsap.to('#hero-canvas', {
    opacity: 0,
    scrollTrigger: { trigger: '#hero', start: 'top top', end: '40% top', scrub: true }
  });

  window.addEventListener('resize', () => {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
})();

// ═══════════════════════════════════════════════
// GSAP — Stat cards
// ═══════════════════════════════════════════════
gsap.utils.toArray('.stat-card').forEach((card, i) => {
  gsap.to(card, {
    opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: i * 0.15,
    scrollTrigger: { trigger: card, start: 'top 85%' }
  });
});

// ═══════════════════════════════════════════════
// GSAP — Flip cards
// ═══════════════════════════════════════════════
gsap.utils.toArray('.flip-card').forEach((card, i) => {
  gsap.to(card, {
    opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out', delay: i * 0.15,
    scrollTrigger: { trigger: card, start: 'top 85%' }
  });
});

// ═══════════════════════════════════════════════
// Counter animation
// ═══════════════════════════════════════════════
gsap.utils.toArray('.counter-number').forEach(el => {
  const target = parseInt(el.dataset.target);
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter: () => {
      gsap.to({ val: 0 }, {
        val: target, duration: 2, ease: 'power2.out',
        onUpdate: function() {
          el.textContent = Math.round(this.targets()[0].val).toLocaleString();
        }
      });
    }
  });
});

// ═══════════════════════════════════════════════
// SCENE 2 — GLOBE
// ═══════════════════════════════════════════════
(function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
  camera.position.z = 4;

  const globeGeo = new THREE.IcosahedronGeometry(1.5, 2);
  const globeMat = new THREE.MeshBasicMaterial({ color: 0xC0392B, wireframe: true, transparent: true, opacity: 0.35 });
  const globe = new THREE.Mesh(globeGeo, globeMat);
  scene.add(globe);

  const cities = [
    { lat: 28.6, lng: 77.2 }, { lat: 19.1, lng: 72.9 },
    { lat: 27.5, lng: 77.7 }, { lat: 27.2, lng: 78.0 },
    { lat: 26.8, lng: 80.9 }, { lat: 26.9, lng: 75.8 },
    { lat: 23.3, lng: 77.4 }, { lat: 25.6, lng: 85.1 },
    { lat: 26.4, lng: 80.3 },
  ];

  cities.forEach(city => {
    const phi = (90 - city.lat) * (Math.PI / 180);
    const theta = (city.lng + 180) * (Math.PI / 180);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xE74C3C })
    );
    dot.position.set(
      -1.52 * Math.sin(phi) * Math.cos(theta),
       1.52 * Math.cos(phi),
       1.52 * Math.sin(phi) * Math.sin(theta)
    );
    scene.add(dot);
  });

  function setSize() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  setSize();

  (function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.003;
    renderer.render(scene, camera);
  })();

  gsap.to('#globe-canvas', {
    opacity: 1, scale: 1, duration: 1, ease: 'power2.out',
    scrollTrigger: { trigger: '#globe-section', start: 'top 75%' }
  });

  window.addEventListener('resize', setSize);
})();

// ═══════════════════════════════════════════════
// SCENE 3 — BAR CHART
// ═══════════════════════════════════════════════
(function initBarChart() {
  const canvas = document.getElementById('bar-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
  camera.position.set(0, 2, 6);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const light = new THREE.PointLight(0xff3333, 1.5, 20);
  light.position.set(3, 5, 3);
  scene.add(light);

  const heights = [2.2, 0.8, 1.8, 0.6, 2.8, 1.0, 1.4, 0.5];
  const group = new THREE.Group();

  heights.forEach((h, i) => {
    const color = new THREE.Color().lerpColors(
      new THREE.Color(0x6B1A1A),
      new THREE.Color(0xE74C3C),
      h / 2.8
    );
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, h, 0.4),
      new THREE.MeshStandardMaterial({ color })
    );
    bar.position.set((i - 3.5) * 0.7, h / 2 - 1.5, 0);
    group.add(bar);
  });

  scene.add(group);

  function setSize() {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  setSize();

  (function animate() {
    requestAnimationFrame(animate);
    group.rotation.y += 0.008;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', setSize);
})();