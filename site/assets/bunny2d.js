// The Stanford bunny lives on the floor (bottom) of every page.
//
// Body:  simple physics (gravity, bounces, friction, window edges). You can grab it
//        (it dangles and jiggles), then drop or throw it.
// Brain: a hidden "trust" value, saved in localStorage so it remembers you.
//        Rough handling makes it scared, carrots (press K) make it friendly.
//          scared   -> hides in the window corner farthest from the mouse (wherever the mouse is),
//                      shivers harder the closer the mouse gets, and if you corner it,
//                      leaps past you and runs for the other corner
//          neutral  -> hops away when you get close
//          friendly -> lets you near, comes to sit next to a still cursor,
//                      purrs when you stroke it with the cursor
//          playful  -> (high trust + energy) plays with the cursor: follows it,
//                      pounces on it, leapfrogs over it, enjoys gentle tosses, fetches thrown
//                      carrots, does binkies (twisting happy leaps) and the occasional zoomies
//        A friendly bunny also nudges a cursor that sits still next to it.
//        Only *rough* handling costs trust, and the more it trusts you the more it tolerates.
//        Play uses energy; a tired bunny wants rest (and throwing it then is rough).
//        It also falls asleep when left alone, and eats carrots you drop.
//
// The sprites in assets/bunny-*.png are pre-rendered clay renders of the real mesh.
(() => {
  const W = 35;                              // sprite width in px
  const G = 2400;                            // gravity, px/s^2
  const BOUNCE = 0.3;                        // vertical restitution on landing
  const WALL = 0.5;                          // restitution off the window edges
  const FRICTION = 10;                       // ground friction (1/s)
  const SLEEP_AFTER = 25000;                 // ms alone before it dozes off
  const MAX_JUMP = 420;                      // highest it can jump (px above the floor)
  const WONT_TRY = 750;                      // cursor higher than this: it doesn't even try

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(pointer: coarse)").matches;

  // ------------------------------------------------------------------ elements
  const hare = document.createElement("div");
  hare.className = "hare";
  hare.style.width = W + "px";
  hare.innerHTML = `
    <div class="hare-shadow"></div>
    <div class="hare-zzz" aria-hidden="true">z</div>
    <div class="hare-hint" aria-hidden="true"></div>
    <div class="hare-body">
      <div class="hare-sprite">
        <img class="for-light" src="/assets/bunny-light.png" alt="" draggable="false">
        <img class="for-dark" src="/assets/bunny-dark.png" alt="" draggable="false">
      </div>
    </div>`;
  document.body.append(hare);
  const body = hare.querySelector(".hare-body"), shadow = hare.querySelector(".hare-shadow");
  const zzz = hare.querySelector(".hare-zzz"), hint = hare.querySelector(".hare-hint");

  // ------------------------------------------------------------------ memory
  let saved = null, mind = { trust: 0, hinted: false };
  try { saved = JSON.parse(sessionStorage.getItem("bunny")); } catch {}
  try { Object.assign(mind, JSON.parse(localStorage.getItem("bunny-mind")) || {}); } catch {}
  const remember = () => { try { localStorage.setItem("bunny-mind", JSON.stringify(mind)); } catch {} };
  function trust(delta) {
    mind.trust = Math.max(-1, Math.min(1, mind.trust + delta));
    remember();
  }
  const mood = () => (mind.trust < -0.35 ? "scared" : mind.trust > 0.35 ? "friendly" : "neutral");
  const terrified = () => mind.trust < -0.75;                      // past this it's barely catchable
  const tolerance = () => 1 + Math.max(0, mind.trust) * 0.4;      // how much rough play it puts up with
  let energy = 1, lastPlay = 0;                                     // play tires it out, rest refills
  const tired = () => energy < 0.2;
  const playful = () => mind.trust > 0.6 && energy > 0.25;
  function tire(a) { energy = Math.max(0, energy - a); lastPlay = performance.now(); }
  setInterval(() => { if (performance.now() - lastPlay > 3000) energy = Math.min(1, energy + 0.05); }, 1000);

  // ------------------------------------------------------------------ body state
  const width = () => document.documentElement.clientWidth;
  const lo = () => 8, hi = () => width() - W - 8;
  const clampX = (v) => Math.max(lo(), Math.min(hi(), v));
  let x = saved?.x ?? width() * 0.75;        // left edge, px
  let y = 0;                                 // height offset, <= 0 means above the floor
  let vx = 0, vy = 0;                        // px/s (vy > 0 is downward)
  let facing = saved?.facing ?? -1;          // sprite faces left
  let squash = 1;
  let held = false, swing = 0, swingV = 0;   // dangling angle (rad) while held
  let running = false, lastT = 0, cooldownUntil = 0, scurry = 0, comeBack = false;
  let playCooldown = 0, crouching = false;
  let spin = 0, spinV = 0, tumbling = false;   // rotation (rad) while flying after a throw
  let sprintTarget = null;                    // x it is sprinting to (null = not sprinting)
  let binkyT = 0, binkyDur = 0, binkyKind = "back";   // binky: an excited leap (flip, twist, double hop)
  let zoomies = 0, zoomed = false;            // zoomies: laps left
  let fetches = 0, fetchTo = 0, nudgeAt = 0;
  const SPRINT_MAX = 950, SPRINT_ACCEL = 2800, SPRINT_BRAKE = 1800;  // px/s, px/s^2, px/s^2
  let asleep = false, lastBother = performance.now();
  const save = () => { try { sessionStorage.setItem("bunny", JSON.stringify({ x, facing })); } catch {} };
  const onGround = () => y >= 0 && vy === 0;
  const midX = () => x + W / 2;

  // sprinting: lean forward (head down) the faster it goes
  let leanNow = 0;
  const lean = () => leanNow;
  function render() {
    hare.style.transform = `translateX(${x}px)`;
    const stretch = !held && y < 0 ? 1 + Math.min(0.08, Math.abs(vy) / 9000) : 1;
    body.classList.toggle("held", held);
    body.style.transform = held
      ? `translateY(${y}px) scaleX(${-facing}) rotate(${swing * -facing}rad)`
      : `translateY(${y}px) scaleX(${-facing}) rotate(${spin * -facing + lean()}rad) scaleY(${squash * stretch})`;
    body.classList.toggle("tumbling", tumbling || binkyT > 0);
    if (carrot?.carried) {                   // carrying a carrot in its mouth
      const mx = facing < 0 ? x - 9 : x + W - 9;
      carrot.x = mx;
      carrot.el.style.transform = `translate(${mx}px, ${y - 7}px) rotate(${facing < 0 ? 25 : -65}deg)`;
    }
    const k = 1 / (1 + Math.abs(y) / 12);    // shadow shrinks/fades with height
    shadow.style.transform = `translateX(-50%) scale(${k})`;
    shadow.style.opacity = 0.2 + 0.8 * k;
  }

  // ------------------------------------------------------------------ physics
  function tick(now) {
    const dt = Math.max(0, Math.min(0.033, (now - lastT) / 1000));   // rAF time can precede lastT
    lastT = now;

    if (held) {
      // dangling: an underdamped spring pulled by the hand's sideways motion,
      // plus a little constant wiggle (Google Maps pegman style). Scared bunnies flail more.
      const target = Math.max(-0.7, Math.min(0.7, -hand.vx / 1400));
      const flail = terrified() ? 0.05 : mood() === "scared" || tired() ? 0.012 : mood() === "friendly" ? 0.001 : 0.004;
      swingV += ((target - swing) * 160 - swingV * 7) * dt;
      swing += swingV * dt + Math.sin(now / 90) * flail;
      hand.vx *= Math.exp(-6 * dt);
    } else {
      if (y < 0 || vy !== 0) {                                // in the air
        vy += G * dt;
        y += vy * dt;
        if (binkyT) {                                         // binky: flip or twist, eased
          const pr = Math.min(1, Math.max(0, (now - binkyT) / binkyDur));
          const e = 0.5 - 0.5 * Math.cos(Math.PI * pr);
          spin = binkyKind === "back" ? e * 2 * Math.PI
               : binkyKind === "front" ? -e * 2 * Math.PI
               : Math.sin(pr * Math.PI) * 0.9;                // twist
        }
        if (tumbling) {
          spin += spinV * dt;                                 // frantic spinning...
          const upright = Math.round(spin / (2 * Math.PI)) * 2 * Math.PI;
          // ...but it rights itself in the last ~0.15 s before hitting the floor, so it lands on its feet
          const timeLeft = vy > 0 ? -y / vy : Infinity;
          const closeness = Math.max(0, 1 - timeLeft / 0.15);
          spin += (upright - spin) * Math.min(1, Math.sqrt(closeness) * dt * 45);
        }
        if (y >= 0) {                                         // touch down
          y = 0;
          binkyT = 0;
          spin = Math.round(spin / (2 * Math.PI)) * 2 * Math.PI;   // upright on contact
          squash = 1 - Math.min(0.3, vy / 3500);
          if (tumbling) {                                     // thrown: proper bounces
            vy = vy > 160 ? -vy * 0.5 : 0;
            spinV *= vy < -450 ? 0.6 * (Math.random() < 0.5 ? -1 : 1) : 0;   // small bounces: no more spinning
          } else vy = vy > 250 ? -vy * BOUNCE : 0;            // hop: small bounce if it landed hard
          if (sprintTarget !== null && !tumbling) stride();  // sprinting: push off again, keep momentum
          else vx *= 0.75;
        }
      } else {
        vx *= Math.exp(-FRICTION * dt);                       // slide to a stop
      }
      if (sprintTarget !== null && !tumbling) sprintStep(dt);
      leanNow += ((sprintTarget !== null ? -Math.min(0.2, Math.abs(vx) / 4800) : 0) - leanNow) * Math.min(1, dt * 10);
      x += vx * dt;
      if (x < lo() || x > hi()) {                             // bounce off the window edge
        x = x < lo() ? lo() : hi();
        if (Math.abs(vx) > Math.min(1400, 900 * tolerance())) trust(-0.04);   // slammed into the wall
        vx = -vx * WALL;
        if (tumbling) spinV = -spinV * 0.8 + vx / 60;
        if (Math.abs(vx) > 1) facing = Math.sign(vx);
      }
      squash += (1 - squash) * Math.min(1, dt * 14);
    }
    render();

    const settled = !held && onGround() && Math.abs(vx) < 4 && Math.abs(1 - squash) < 0.01;
    if (!settled) return requestAnimationFrame(tick);
    running = false; vx = 0; squash = 1; spin = 0; spinV = 0; tumbling = false; render(); save();
    if (comeBack) { comeBack = false; happy(); }                                 // "again!"
    else if (scurry > 0) { scurry--; cooldownUntil = 0; fleeFrom(cursor.x, true); }   // after a drop: run off
  }
  function wake() { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(tick); } }

  function hop(vxNew, up) {
    if (still || held || !onGround()) return;
    vx = vxNew; vy = -up; y = -0.01; squash = 0.85;
    if (Math.abs(vxNew) > 1) facing = Math.sign(vxNew);
    wake();
  }
  // Sprinting: speed changes smoothly (accelerate up to top speed, then brake in time to stop
  // at the target), while the body does quick low strides that get flatter the faster it goes.
  function sprintStep(dt) {
    const dist = sprintTarget - x, dir = Math.sign(dist) || facing;
    const stopDist = (vx * vx) / (2 * SPRINT_BRAKE);
    const braking = Math.sign(vx) === dir && Math.abs(dist) <= stopDist + 4;
    const want = braking ? 0 : dir * SPRINT_MAX;
    const rate = braking ? SPRINT_BRAKE : SPRINT_ACCEL;
    vx += Math.max(-rate * dt, Math.min(rate * dt, want - vx));
    if (Math.abs(vx) > 30) facing = Math.sign(vx);
    if (Math.abs(dist) < 10 && Math.abs(vx) < 200) { sprintTarget = null; vx = 0; }   // arrived: stop right there
  }
  function stride() {
    const speed = Math.abs(vx);
    vy = -Math.max(175, 250 - speed * 0.08);          // a bit flatter and quicker at speed
    y = -0.01;
    squash = 1 - Math.min(0.12, 0.06 + speed / 12000);
  }
  function sprintTo(tx) {
    sprintTarget = clampX(tx);
    if (onGround()) { stride(); wake(); }
  }

  // a small hop that covers about `dist` px
  const hopToward = (dist) => hop(Math.sign(dist) * Math.min(260, 60 + Math.abs(dist) * 2.2), 200);
  const clamp90 = (d) => Math.max(-90, Math.min(90, d));
  // a jump that lands `dist` px away (ballistic: flight time = 2 * up / G)
  const leapBy = (dist, up) => hop(dist / ((2 * up) / G), up);

  // ------------------------------------------------------------------ play moves
  function wiggle() {
    body.classList.remove("wiggle"); void body.offsetWidth; body.classList.add("wiggle");
    setTimeout(() => body.classList.remove("wiggle"), 600);
  }
  function happy() {                         // little bounce, then hop back toward you
    hop(0, 220);
    setTimeout(() => {
      wiggle();
      const d = cursor.x - midX();
      if (cursor.t && Math.abs(d) > 50) hopToward(clamp90(d - Math.sign(d) * 30));
    }, 380);
  }
  // A binky is an excited happy-rabbit leap. Each one is a random variant:
  // a backflip, a frontflip, a mid-air twist, or a double hop.
  function binky() {
    if (!onGround() || held) return;
    const r = Math.random();
    binkyKind = r < 0.3 ? "back" : r < 0.6 ? "front" : r < 0.8 ? "twist" : "double";
    const f = facing;
    if (binkyKind === "double") {              // two quick excited hops in place
      hop(0, 330);
      setTimeout(() => { hop(0, 400); setTimeout(wiggle, 300); }, (2 * 330 / G) * 1000 + 60);
      return;
    }
    const up = binkyKind === "twist" ? 450 : 580;
    hop((binkyKind === "front" ? f : -f) * 45, up);   // drifts a little with the flip
    facing = f;                                // keep facing forward while flipping
    binkyT = performance.now(); binkyDur = (2 * up / G) * 1000;
  }
  // Leap up at a cursor that's above the floor and try to catch it at the top of the jump.
  // Higher jumps need a longer, deeper crouch first ("charging up").
  function jumpAt(dx, hTarget) {
    const h = Math.min(hTarget, MAX_JUMP);     // it can only jump so high
    const short = hTarget > MAX_JUMP + 20;     // ...so it may fall short
    const up = Math.sqrt(2 * G * h);           // speed needed to peak at height h
    const tPeak = up / G;
    facing = Math.sign(dx) || facing;
    const charge = 220 + h * 1.2;              // ms of crouching: ~0.25 s small jump .. ~1 s big one
    const deepest = 0.82 - 0.2 * Math.min(1, h / 600);
    crouching = true;
    const c0 = performance.now();
    (function windUp(now) {                     // sink lower and lower, with a little quiver
      if (!crouching) return;
      const k = Math.min(1, (now - c0) / charge);
      squash = 1 - (1 - deepest) * k + Math.sin(now / 25) * 0.012 * k;
      render();
      if (k < 1) requestAnimationFrame(windUp);
    })(c0);
    setTimeout(() => {
      crouching = false; squash = 1;
      hop(dx / tPeak, up);
      setTimeout(() => {                         // at the top: did it get it?
        const [bx, by] = center();
        if (Math.hypot(cursor.x - bx, cursor.y - by) < 34) { trust(0.01); setTimeout(wiggle, tPeak * 1000 + 80); }
        else if (short) setTimeout(sulk, tPeak * 1000 + 120);   // didn't make it
      }, tPeak * 1000);
    }, charge);
  }
  function sulk(tries = 0) {                 // fell short: a little disappointed slump
    if (held) return;
    if (!onGround() || running) { if (tries < 20) setTimeout(() => sulk(tries + 1), 80); return; }   // wait until it's down
    crouching = true; squash = 0.86; render();
    setTimeout(() => { crouching = false; squash = 1; render(); }, 900);
  }
  function nudge(dist) {                     // bump into a cursor that's been sitting still
    const dir = Math.sign(dist) || -facing;
    facing = dir;
    hop(dir * 110, 95);
    setTimeout(wiggle, 260);
  }
  function plop() {                          // after zoomies: flop down, out of breath
    crouching = true; squash = 0.72; render();
    tire(0.3);
    setTimeout(() => { crouching = false; squash = 1; render(); }, 1600);
  }
  function pounce(dist) {                    // crouch... then jump onto the cursor
    crouching = true;
    facing = Math.sign(dist) || facing;
    squash = 0.72; render();
    setTimeout(() => {
      crouching = false; squash = 1;
      const up = 440;
      leapBy(dist, up);
      setTimeout(wiggle, (2 * up / G) * 1000 + 120);
    }, 300);
  }

  // ------------------------------------------------------------------ sleeping
  function setAsleep(v) {
    asleep = v;
    zzz.classList.toggle("on", v);
  }
  function bother() {                        // something happened near the bunny
    lastBother = performance.now();
    if (asleep) setAsleep(false);
  }

  // ------------------------------------------------------------------ fleeing
  const cursor = { x: -1e4, y: -1e4, t: 0, speed: 0 };
  const center = () => { const r = body.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  function fleeFrom(cx, force = false) {
    const now = performance.now();
    if (held || (!force && now < cooldownUntil) || !onGround()) return;
    const [bx] = center();
    let dir = cx < bx ? 1 : -1;
    const cornered = (dir > 0 && x > hi() - 20) || (dir < 0 && x < lo() + 20);
    if (cornered && mood() === "scared") {
      // cornered and terrified: big leap over/past the cursor, then run for the other corner
      hideSide = -dir;
      leapBy(-dir * (220 + Math.random() * 80), 520);
      sprintTarget = -dir > 0 ? hi() : lo();                           // ...and keep running
      cooldownUntil = now + 500;
      trust(-0.006);
      return;
    }
    if (cornered) dir = -dir;                                         // dodge past
    const panic = mood() === "scared" ? 1.35 : 1;
    hop(dir * (170 + Math.random() * 90) * panic, (300 + Math.random() * 120) * Math.sqrt(panic));
    cooldownUntil = now + (mood() === "scared" ? 60 : 120);
    play.flees++; maybeHint();
    trust(-0.006);                           // being chased is a bit stressful
  }
  addEventListener("pointermove", (e) => {
    const now = performance.now();
    const stroke = cursor.t ? Math.abs(e.clientX - cursor.x) : 0;
    if (cursor.t) {
      const dt = Math.max(1, now - cursor.t);
      cursor.speed = 0.6 * cursor.speed + 0.4 * Math.hypot(e.clientX - cursor.x, e.clientY - cursor.y) / dt;
    }
    Object.assign(cursor, { x: e.clientX, y: e.clientY, t: now });
    if (held) return;
    const [bx, by] = center();
    const d = Math.hypot(e.clientX - bx, e.clientY - by);
    if (d < 200) bother();
    const m = mood();
    if (petting(e, stroke, now)) return;     // a trusting bunny lets you pet it instead of running
    // how fast the cursor is closing in on the bunny (px/ms, positive = approaching)
    approachV = 0.5 * approachV + 0.5 * (isFinite(lastD) ? (lastD - d) / Math.max(1, now - lastDT) : 0);
    lastD = d; lastDT = now;
    if (m === "scared") {
      // only bolts when it thinks you're about to catch it: very close, or coming at it fast
      const threat = d < (terrified() ? 120 : 90) || (d < 240 && approachV > 0.7);
      if (threat && !eating) fleeFrom(e.clientX);
    } else {
      // friendly bunnies only bolt if you rush at them
      const radius = m === "friendly" ? (cursor.speed > 2.5 ? 60 : 0) : 95;
      if (d < radius && !eating) fleeFrom(e.clientX);
    }
    fear(d);
  }, { capture: true });

  // ------------------------------------------------------------------ fear
  // A scared bunny cares about where the mouse is anywhere on the page, not just up close:
  // it hides on the side of the window away from the mouse and shivers harder as it gets closer.
  let hideSide = 0;                          // -1 = left corner, +1 = right corner
  let lastD = Infinity, lastDT = 0, approachV = 0;
  function fear(d = Infinity) {
    const scared = mood() === "scared" && !held && cursor.t;
    if (!scared) { body.classList.remove("shiver", "cower"); return; }
    // how scared overall (trust -0.35 .. -1) and how close the mouse is (anywhere on screen)
    const depth = Math.min(1, (-mind.trust - 0.35) / 0.65 + 0.3);
    const near = Math.max(0, 1 - d / 900);
    const k = terrified() ? 0.55 + 0.45 * near : depth * (0.25 + 0.75 * near);   // closer = worse
    body.classList.add("shiver");
    body.classList.toggle("cower", terrified());
    body.style.setProperty("--shiver-amp", `${(0.4 + (terrified() ? 2.4 : 1.6) * k).toFixed(2)}px`);
    body.style.setProperty("--shiver-speed", `${(0.16 - 0.11 * k).toFixed(3)}s`);
    // pick the side away from the mouse. A merely scared bunny switches sides when the mouse
    // comes well over to its side; a terrified one stays put and only flees when threatened.
    const w = width(), m = cursor.x / w;
    if (hideSide === 0) hideSide = m > 0.5 ? -1 : 1;
    else if (!terrified() && hideSide < 0 && m < 0.25) hideSide = 1;
    else if (!terrified() && hideSide > 0 && m > 0.75) hideSide = -1;
  }

  // ------------------------------------------------------------------ petting
  // When it trusts you enough, stroking it (moving the cursor back and forth over it) makes it purr.
  const PET_TRUST = 0.35;                  // as soon as it's friendly
  const pet = { amount: 0, last: 0, purring: false, lastPrr: 0 };
  function petting(e, stroke, now) {
    if (mind.trust < PET_TRUST || !onGround() || eating) return false;
    const r = body.getBoundingClientRect();
    const over = e.clientX > r.left - 4 && e.clientX < r.right + 4 && e.clientY > r.top - 4 && e.clientY < r.bottom + 4;
    if (!over) return false;
    pet.amount = pet.amount * Math.exp(-(now - pet.last) / 700) + stroke;
    pet.last = now;
    if (pet.amount > 25 && !pet.purring) { pet.purring = true; body.classList.add("purr"); purr(); }
    return true;
  }
  function purr() {
    if (!pet.purring) return;
    if (performance.now() - pet.last > 800) {                  // you stopped petting
      pet.purring = false; pet.amount = 0; body.classList.remove("purr");
      return;
    }
    const bubble = document.createElement("div");
    bubble.className = "hare-prr";
    bubble.textContent = Math.random() < 0.25 ? "♥" : "prr";
    bubble.style.left = `${20 + Math.random() * 40}%`;
    hare.append(bubble);
    setTimeout(() => bubble.remove(), 1400);
    trust(0.01);
    setTimeout(purr, 650);
  }

  // ------------------------------------------------------------------ grabbing
  const hand = { x: 0, y: 0, t: 0, vx: 0, vy: 0, ox: 0, oy: 0 };
  let grabTimes = [];
  body.addEventListener("pointerdown", (e) => {
    if (still) return;
    e.preventDefault();
    if (terrified() && !onGround() && Math.random() < 0.9) return;   // can't even get a hold of it mid-air
    if (terrified() && onGround() && Math.random() < 0.9) {         // squirms out of your grasp
      const [bx] = center();
      const dir = e.clientX < bx ? 1 : -1;
      const cornered = (dir > 0 && x > hi() - 20) || (dir < 0 && x < lo() + 20);
      leapBy((cornered ? -dir : dir) * (240 + Math.random() * 80), 480);
      trust(-0.01);
      return;
    }
    body.setPointerCapture(e.pointerId);
    held = true; scurry = 0; eating = false; sprintTarget = null; zoomies = 0; bother();
    if (carrot?.carried) { carrot.carried = false; fall(carrot, 0, -100); }
    body.classList.remove("shiver");
    const r = body.getBoundingClientRect();
    hand.ox = e.clientX - x;                 // keep the spot you grabbed it by
    hand.oy = e.clientY - r.top;
    Object.assign(hand, { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 });
    vx = vy = 0; swing = 0; swingV = 0;
    follow(e);
    wake();
    if (terrified()) setTimeout(() => {                              // wriggles free
      if (!held) return;
      hand.vx = (Math.random() < 0.5 ? -1 : 1) * 500; hand.vy = -500; hand.t = performance.now();
      release();
    }, 350 + Math.random() * 250);
    play.grabs++; maybeHint();
    grabTimes = grabTimes.filter((t) => performance.now() - t < 8000).concat(performance.now());
    if (grabTimes.length >= 4 && !playful()) trust(-0.04);           // grabbing it over and over
    else if (tired()) trust(-0.02);
  });
  function follow(e) {
    const now = performance.now(), dt = Math.max(1, now - hand.t) / 1000;
    hand.vx = 0.5 * hand.vx + 0.5 * (e.clientX - hand.x) / dt;
    hand.vy = 0.5 * hand.vy + 0.5 * (e.clientY - hand.y) / dt;
    Object.assign(hand, { x: e.clientX, y: e.clientY, t: now });
    const floor = hare.getBoundingClientRect().bottom;                    // the page floor, in viewport px
    x = clampX(e.clientX - hand.ox);
    y = Math.min(0, e.clientY - hand.oy + body.offsetHeight - floor);     // body bottom follows the hand
    if (Math.abs(hand.vx) > 30) facing = Math.sign(hand.vx);
  }
  body.addEventListener("pointermove", (e) => { if (held) follow(e); });
  function release() {
    if (!held) return;
    held = false;
    // keep the hand's velocity (capped) -> drop or throw. If the hand had stopped, it's a plain drop.
    if (performance.now() - hand.t > 80) hand.vx = hand.vy = 0;
    vx = Math.max(-1600, Math.min(1600, hand.vx));
    vy = Math.max(-1400, Math.min(1400, hand.vy));
    if (y >= 0 && vy >= 0) vy = 0;
    // in the air it tumbles: the harder the throw, the faster it spins
    const fling = Math.hypot(vx, vy);
    tumbling = y < -2 || vy < 0;
    spin = 0;
    spinV = tumbling ? (Math.sign(vx) || (Math.random() < 0.5 ? -1 : 1)) * (fling > 200 ? 4 + fling / 90 : 0) : 0;
    // Only rough handling costs trust; what counts as rough depends on how much it trusts you.
    const speed = Math.hypot(vx, vy), height = -y, tol = tolerance();
    // (throws are capped at ~1600 px/s, so keep the speed limit below that)
    const rough = speed > Math.min(1450, 1050 * tol) || height > 320 * tol || (tired() && (speed > 400 || height > 120));
    const toss = speed > 250 || height > 50;
    comeBack = false;
    if (rough) { trust(-0.12); scurry = mood() === "scared" ? 3 : 2; }
    else if (playful() && toss) { trust(0.02); tire(0.12); scurry = 0; comeBack = true; }   // "wheee"
    else scurry = mood() === "scared" ? 3 : mood() === "friendly" ? 0 : toss ? 1 : 0;
    wake();
  }
  body.addEventListener("pointerup", release);
  body.addEventListener("pointercancel", release);

  // ------------------------------------------------------------------ hint (shown once, ever)
  const play = { grabs: 0, flees: 0 };
  function maybeHint() {
    if (mind.hinted || (play.grabs < 2 && play.flees < 6)) return;
    mind.hinted = true; remember();
    showHint(touch ? "tap the floor to drop a carrot" : "press K to drop a carrot");
  }
  function showHint(text) {
    hint.textContent = text;
    hint.classList.add("on");
    clearTimeout(showHint.t);
    showHint.t = setTimeout(() => hint.classList.remove("on"), 6000);
  }

  // ------------------------------------------------------------------ carrots
  let carrot = null, eating = false;
  const CARROT_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 7 C17 3 19 2 21 1 M14.5 7.5 C17 6 20 6 22.5 6.5 M13.8 7.2 C14 4 13 2 12 0.5" stroke="#8fa77a" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M15.5 8.5 C13 6 9 7 6.5 11 L2.2 19.8 C1.8 20.8 2.9 21.9 3.9 21.4 L12.7 16.9 C16.6 14.6 18 11 15.5 8.5 Z" fill="url(#cg)"/>
    <path d="M7 14 L9.5 15 M9.5 11.5 L12 12.5 M5 17.5 L7 18.3" stroke="rgba(0,0,0,0.12)" stroke-width="0.9" stroke-linecap="round"/>
    <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8a76b"/><stop offset="1" stop-color="#c97a43"/></linearGradient></defs>
  </svg>`;
  function dropCarrot(cx, cy) {
    if (carrot || still) return;
    const el = document.createElement("div");
    el.className = "carrot";
    el.innerHTML = CARROT_SVG;
    document.body.append(el);
    const floor = hare.getBoundingClientRect().bottom;
    carrot = { el, x: Math.max(8, Math.min(width() - 26, cx - 9)), y: Math.min(0, cy - floor), vy: 0, bites: 0, landed: false, held: false, carried: false, thrown: false };
    fetches = 0;
    grabbable(carrot);
    fall(carrot);
  }
  function fall(c, vx0 = 0, vy0 = 0) {
    c.vx = vx0; c.vy = vy0; c.landed = false; c.t = performance.now();
    let rot = 0;
    (function step(now) {
      if (carrot !== c || c.held || c.carried) return;
      const dt = Math.max(0, Math.min(0.033, (now - c.t) / 1000)); c.t = now;
      if (c.y < 0 || c.vy !== 0) {
        c.vy += G * dt; c.y += c.vy * dt;
        rot += c.vx * dt * 1.5;                                        // it spins a bit when thrown
        if (c.y >= 0) { c.y = 0; c.vy = c.vy > 200 ? -c.vy * 0.25 : 0; rot = 0; }
      } else c.vx *= Math.exp(-6 * dt);                               // slides to a stop
      c.x += c.vx * dt;
      if (c.x < 8 || c.x > width() - 26) { c.x = Math.max(8, Math.min(width() - 26, c.x)); c.vx = -c.vx * 0.4; }
      c.el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${rot}deg)`;
      if (c.y < 0 || c.vy !== 0 || Math.abs(c.vx) > 5) requestAnimationFrame(step);
      else { c.landed = true; c.vx = 0; c.el.style.transform = `translate(${c.x}px, 0)`; bother(); }
    })(c.t);
  }
  // you can pick a carrot up and put it somewhere else (snatching it mid-meal is a bit mean)
  function grabbable(c) {
    let ox = 0, oy = 0, hx = 0, hy = 0, ht = 0, hvx = 0, hvy = 0;
    c.el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      c.el.setPointerCapture(e.pointerId);
      if (eating) { eating = false; trust(-0.02); }
      c.held = true; c.landed = false; c.carried = false;
      c.el.classList.add("held");
      hx = e.clientX; hy = e.clientY; ht = performance.now(); hvx = hvy = 0;
      const r = c.el.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
    });
    c.el.addEventListener("pointermove", (e) => {
      if (!c.held) return;
      const now = performance.now(), dt = Math.max(1, now - ht) / 1000;
      hvx = 0.5 * hvx + 0.5 * (e.clientX - hx) / dt; hvy = 0.5 * hvy + 0.5 * (e.clientY - hy) / dt;
      hx = e.clientX; hy = e.clientY; ht = now;
      const floor = hare.getBoundingClientRect().bottom;
      c.x = Math.max(8, Math.min(width() - 26, e.clientX - ox));
      c.y = Math.min(0, e.clientY - oy + c.el.offsetHeight - floor);
      c.el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(-15deg)`;
    });
    const drop = () => {
      if (!c.held) return;
      c.held = false; c.el.classList.remove("held");
      if (performance.now() - ht > 80) hvx = hvy = 0;                  // hand had stopped: plain drop
      const vx0 = Math.max(-1400, Math.min(1400, hvx)), vy0 = Math.max(-1200, Math.min(1200, hvy));
      c.thrown = Math.hypot(vx0, vy0) > 350;                           // a throw -> a playful bunny fetches it
      fetchTo = hx;
      fall(c, vx0, vy0);
    };
    c.el.addEventListener("pointerup", drop);
    c.el.addEventListener("pointercancel", drop);
  }
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "k" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable) return;
    const cx = cursor.t ? cursor.x : midX() + (Math.random() < 0.5 ? -120 : 120);
    dropCarrot(cx, cursor.t ? cursor.y : 0);
  });
  if (touch) addEventListener("pointerdown", (e) => {
    if (!mind.hinted || body.contains(e.target)) return;
    const floor = hare.getBoundingClientRect().bottom;
    if (floor - e.clientY < 90 && !e.target.closest("a, button")) dropCarrot(e.clientX, e.clientY - 120);
  });

  function eatStep() {
    const c = carrot;
    if (!c || held || c.held || !eating) { eating = false; return; }
    c.bites++;
    hop(0, 90);                                        // nibble
    c.el.style.setProperty("--bitten", 1 - c.bites * 0.3);
    if (c.bites < 3) return setTimeout(eatStep, 650);
    c.el.remove(); carrot = null; eating = false; fetches = 0;
    trust(0.15);
    setTimeout(binky, 400);                            // happy binky
  }

  // ------------------------------------------------------------------ brain
  // Runs a few times a second and decides what to do next.
  function think() {
    if (still || held || !onGround() || eating || crouching || tumbling) return;
    if (running && mood() !== "scared") return;                      // scared bunnies don't wait to stop sliding
    const now = performance.now(), m = mood();
    const [bx] = center();
    const cursorNear = Math.abs(cursor.x - bx) < 450 && hare.getBoundingClientRect().bottom - cursor.y < 260;

    // 1) food (or fetch, if it's playful and you threw the carrot)
    if (carrot?.carried) {                                             // bring it back to you
      const side = fetchTo > midX() ? -1 : 1;
      const target = clampX(fetchTo - W / 2 + side * 28);
      if (Math.abs(target - x) > 12) { if (sprintTarget === null) sprintTo(target); return; }
      facing = -side; render();
      carrot.carried = false; carrot.thrown = false; carrot.offeredAt = now;   // drop it at your feet
      fall(carrot, -side * 60, -160);
      fetches++; trust(0.02); tire(0.06);
      setTimeout(binky, 450);
      return;
    }
    if (carrot?.landed) {
      if (m === "scared" && Math.abs(cursor.x - (carrot.x + 9)) < 160 && now - cursor.t < 3000) return;   // too risky
      bother();
      const fetchIt = playful() && carrot.thrown && fetches < 3;
      if (!carrot.thrown && carrot.offeredAt && now - carrot.offeredAt < 7000) return;   // "throw it again!"
      const dist = carrot.x + 9 - midX();
      if (Math.abs(dist) < 18) {
        facing = Math.sign(dist) || facing;
        if (fetchIt) { carrot.carried = true; carrot.landed = false; render(); return; }   // pick it up
        render();
        eating = true; eatStep();
      } else if (fetchIt) { if (sprintTarget === null) sprintTo(carrot.x + 9 - W / 2); }
      else hopToward(Math.max(-90, Math.min(90, dist)));
      return;
    }

    // 2) sleep when left alone
    if (!asleep && m !== "scared" && now - lastBother > (tired() ? 6000 : SLEEP_AFTER)) return setAsleep(true);
    if (asleep) return;

    // 3) scared: run to the hiding corner and huddle there facing the wall
    if (m === "scared" && cursor.t) {
      fear(Math.hypot(cursor.x - bx, cursor.y - center()[1]));
      const target = hideSide < 0 ? lo() : hi();
      const dist = target - x;
      if (Math.abs(dist) > 30) {                                       // close enough to the corner is fine
        if (sprintTarget === null) sprintTo(target); else sprintTarget = target;
        return;
      }
      facing = hideSide;                                               // face the wall
      render();
      // panicked jumping: more often, higher and more chaotic the closer the mouse is
      const near = Math.max(0, 1 - Math.hypot(cursor.x - bx, cursor.y - center()[1]) / 600);
      const chance = terrified() ? 0.05 + 0.85 * near : 0.15 * near;
      if (Math.random() < chance) {
        hop((Math.random() - 0.5) * 90 * near, 120 + Math.random() * (80 + 400 * near));
        if (near > 0.5 && Math.random() < 0.5) facing = -facing;      // twisting around in panic
      }
      return;
    }

    // 4) zoomies: laps back and forth at full sprint, then flop down
    if (zoomies > 0) {
      zoomies--;
      tire(0.05);
      return sprintTo(zoomies === 0 ? width() / 2 - W / 2 : x < width() / 2 ? hi() : lo());
    }
    if (zoomed) { zoomed = false; return plop(); }
    if (playful() && energy > 0.6 && now - cursor.t > 2500 && Math.random() < 0.012) {
      zoomies = 3 + Math.floor(Math.random() * 2); zoomed = true;
      return;
    }

    // 5) playful: play with the cursor when it's down near the floor
    if (playful() && cursor.t && now > playCooldown) {
      const dist = cursor.x - midX();
      const low = hare.getBoundingClientRect().bottom - cursor.y < 160;
      const restingFor = now - cursor.t;
      if (low && restingFor > 4000 && Math.abs(dist) <= 60 && now > nudgeAt) {
        nudgeAt = now + 1800;                                          // nudge it: "play with me"
        return nudge(dist);
      }
      if (low && restingFor < 300 && cursor.speed < 1.5 && Math.abs(dist) > 60 && Math.abs(dist) < 500) {
        tire(0.01);                                                    // follow it along the floor
        return hopToward(clamp90(dist - Math.sign(dist) * 30));
      }
      // cursor up in the air (not too high): leap up and try to catch it
      const h = hare.getBoundingClientRect().bottom - cursor.y - 17;
      if (!low && restingFor > 600 && restingFor < 5000 && Math.abs(dist) < 360) {
        if (h > WONT_TRY) {                                          // way out of reach: just look up at it
          facing = Math.sign(dist) || facing; render();
        } else {
          const hj = Math.min(h, MAX_JUMP);
          playCooldown = now + 2200 + hj * 3 + (h > MAX_JUMP ? 2500 : 0);   // big (or failed) jumps need more rest
          tire(0.05 + hj / 4000);
          return jumpAt(dist, h);
        }
      }
      if (low && restingFor > 700 && restingFor < 5000 && Math.abs(dist) > 50 && Math.abs(dist) < 260) {
        playCooldown = now + 2500; tire(0.08);                         // pounce on it
        return pounce(dist);
      }
      if (low && restingFor > 1500 && Math.abs(dist) <= 50 && Math.random() < 0.15) {
        playCooldown = now + 3000; tire(0.06);                         // leapfrog over it
        const side = Math.sign(dist) || -facing;
        return leapBy(dist + side * 50, 460);
      }
      if (Math.random() < 0.015) { playCooldown = now + 2000; return binky(); }   // just happy
    }

    // 6) friendly: come and sit next to a cursor that's resting near the floor, then nudge it
    if (m === "friendly" && cursor.t && now - cursor.t > 1200 && cursorNear) {
      const dist = cursor.x - midX();
      if (Math.abs(dist) > 45) return hopToward(Math.max(-80, Math.min(80, dist - Math.sign(dist) * 35)));
      const low = hare.getBoundingClientRect().bottom - cursor.y < 120;
      if (low && now - cursor.t > 4000 && now > nudgeAt) { nudgeAt = now + 2200; return nudge(dist); }
      facing = Math.sign(dist) || facing; render();                     // look at it
      return;
    }

    // 7) idle: the occasional hop
    if (Math.random() < 0.025) {
      if (Math.random() < 0.5) hop(0, 180);
      else hop((Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 60), 220);
    }
  }
  setInterval(think, 300);

  // slowly forgives you when left alone
  setInterval(() => { if (performance.now() - lastBother > 20000 && mind.trust < 0.2) trust(0.02); }, 30000);

  // ------------------------------------------------------------------ debug panel
  // Open any page with ?debug (stays on while you browse in that tab; ?debug=0 turns it off).
  const q = new URLSearchParams(location.search).get("debug");
  try { if (q !== null) sessionStorage.setItem("bunny-debug", q === "0" ? "" : "1"); } catch {}
  let debugOn = false;
  try { debugOn = !!sessionStorage.getItem("bunny-debug"); } catch {}
  if (debugOn) {
    const panel = document.createElement("div");
    panel.className = "bunny-debug";
    panel.innerHTML = `
      <b>bunny</b> <span data-k="mood"></span>
      <label>trust <input data-k="trust" type="range" min="-1" max="1" step="0.01"> <output data-k="tv"></output></label>
      <label>energy <input data-k="energy" type="range" min="0" max="1" step="0.01"> <output data-k="ev"></output></label>
      <div><button data-a="terrified">terrified</button><button data-a="scared">scared</button><button data-a="neutral">neutral</button><button data-a="friendly">friendly</button><button data-a="playful">playful</button></div>
      <div><button data-a="carrot">carrot</button><button data-a="binky">binky</button><button data-a="zoomies">zoomies</button></div>
      <div><button data-a="sleep">sleep</button><button data-a="reset">reset</button></div>`;
    document.body.append(panel);
    const $ = (k) => panel.querySelector(`[data-k="${k}"]`);
    // read-only snapshot for the console: bunny.state
    window.bunny = { get state() { return { x, y, vx, vy, mood: mood(), trust: mind.trust, energy, held, running, asleep, eating, crouching, tumbling, sprintTarget, hideSide, onGround: onGround(), carrot: carrot && { x: carrot.x, landed: carrot.landed, thrown: carrot.thrown, carried: carrot.carried } }; } };
    const setTrust = (t) => { mind.trust = t; remember(); fear(); };
    $("trust").addEventListener("input", (e) => setTrust(+e.target.value));
    $("energy").addEventListener("input", (e) => { energy = +e.target.value; });
    panel.addEventListener("click", (e) => {
      const a = e.target.dataset?.a;
      if (a === "terrified") setTrust(-0.95);
      if (a === "scared") setTrust(-0.55);
      if (a === "neutral") setTrust(0);
      if (a === "friendly") setTrust(0.45);
      if (a === "playful") { setTrust(0.85); energy = 1; }
      if (a === "carrot") dropCarrot(midX() + (Math.random() < 0.5 ? -200 : 200), hare.getBoundingClientRect().bottom - 300);
      if (a === "sleep") setAsleep(true);
      if (a === "binky") binky();
      if (a === "zoomies") { zoomies = 4; zoomed = true; }
      if (a === "reset") { mind.trust = 0; mind.hinted = false; energy = 1; remember(); }
    });
    setInterval(() => {
      const label = terrified() ? "terrified" : mood() === "friendly" && playful() ? "playful" : mood();
      $("mood").textContent = `${label}${tired() ? ", tired" : ""}${asleep ? ", asleep" : ""}`;
      if (document.activeElement !== $("trust")) $("trust").value = mind.trust;
      if (document.activeElement !== $("energy")) $("energy").value = energy;
      $("tv").textContent = mind.trust.toFixed(2);
      $("ev").textContent = energy.toFixed(2);
    }, 200);
  }

  addEventListener("resize", () => { x = clampX(x); render(); });
  x = clampX(x);
  render();
})();
