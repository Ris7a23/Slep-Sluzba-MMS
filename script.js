(function(){
  "use strict";

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

  /* ---------- Count-up numbers (hero stats, coverage distances, ...) ---------- */
  /* Any element with data-count-to="N" animates from 0 to N the moment it scrolls into view. */
  var countEls = document.querySelectorAll('[data-count-to]');
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var animateCount = function(el){
    var target = parseFloat(el.getAttribute('data-count-to'));
    if(isNaN(target)) return;
    if(prefersReducedMotion){ el.textContent = target; return; }

    var duration = 1300;
    var startTime = null;

    var step = function(timestamp){
      if(startTime === null){ startTime = timestamp; }
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); /* ease-out-cubic */
      var value = Math.round(eased * target);
      el.textContent = value;
      if(progress < 1){
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    };
    window.requestAnimationFrame(step);
  };

  if(countEls.length){
    if('IntersectionObserver' in window){
      var countObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, {threshold:0.5, rootMargin:'0px 0px -5% 0px'});
      countEls.forEach(function(el){ countObserver.observe(el); });
    } else {
      /* very old browsers: just show the final numbers */
      countEls.forEach(function(el){ el.textContent = el.getAttribute('data-count-to'); });
    }
  }

  /* ---------- Header: providan preko videa, dobija pozadinu kad hero prođe ---------- */
  var header = document.getElementById('siteHeader');
  var heroEl = document.getElementById('hero');
  /* položaj hero-a se meri jednom (ne pri svakom skrolu), da skrol ne izaziva izračunavanje layout-a */
  var HERO = {top:0, height:0};
  function measureHeroBox(){
    if(!heroEl) return;
    var r = heroEl.getBoundingClientRect();
    HERO.top = r.top + window.scrollY;
    HERO.height = r.height;
  }
  measureHeroBox();
  window.addEventListener('load', measureHeroBox);
  window.addEventListener('resize', measureHeroBox);
  var onScrollHeader = function(){
    /* providan dok je video na ekranu; pozadinu dobija kad hero (video) prođe ispod headera */
    var solid = window.scrollY > 1;
    header.classList.toggle('is-solid', solid);
  };
  document.addEventListener('scroll', onScrollHeader, {passive:true});
  window.addEventListener('resize', onScrollHeader);
  onScrollHeader();

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  navToggle.addEventListener('click', function(){
    var open = mainNav.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  mainNav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      mainNav.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded','false');
    });
  });

  /* ---------- Offset anchor scrolling (fixed header) ---------- */
  var headerH = 80;
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if(id.length < 2) return;
      var target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - (headerH + 10);
      window.scrollTo({top:top, behavior:'smooth'});
    });
  });

  /* ---------- FAQ accordion ---------- */
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function(item){
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    var setHeight = function(open){
      if(open){ a.style.maxHeight = a.scrollHeight + 'px'; }
      else{ a.style.maxHeight = '0px'; }
    };
    setHeight(item.classList.contains('is-open'));
    q.addEventListener('click', function(){
      var willOpen = !item.classList.contains('is-open');
      faqItems.forEach(function(other){
        other.classList.remove('is-open');
        other.querySelector('.faq-q').setAttribute('aria-expanded','false');
        setHeight.call(other, false);
      });
      if(willOpen){
        item.classList.add('is-open');
        q.setAttribute('aria-expanded','true');
        setHeight(true);
      }
    });
    window.addEventListener('resize', function(){
      if(item.classList.contains('is-open')) setHeight(true);
    });
  });

  /* ---------- Journey scroll progress ---------- */
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var rail = document.getElementById('journeyInner');
  var railFill = document.getElementById('journeyFill');
  var marker = document.getElementById('journeyMarker');

  function updateJourney(){
    if(!steps.length) return;
    var railRect = rail.getBoundingClientRect();
    var viewportCenter = window.innerHeight * 0.62;
    var activeIndex = -1;
    var lastNodeTop = 0;

    steps.forEach(function(step, i){
      var node = step.querySelector('.node-dot');
      var nodeRect = node.getBoundingClientRect();
      var nodeTopRelative = nodeRect.top - railRect.top + nodeRect.height/2;
      if(nodeRect.top <= viewportCenter){
        step.classList.add('is-active');
        activeIndex = i;
        lastNodeTop = nodeTopRelative;
      } else {
        step.classList.remove('is-active');
      }
    });

    var railHeight = railFill.parentElement.getBoundingClientRect().height;
    var fillPx = activeIndex >= 0 ? lastNodeTop : 0;
    var fillPct = railHeight > 0 ? Math.max(0, Math.min(100, (fillPx/railHeight)*100)) : 0;
    railFill.style.height = fillPct + '%';
    marker.style.top = fillPx + 'px';
  }

  document.addEventListener('scroll', function(){ window.requestAnimationFrame(updateJourney); }, {passive:true});
  window.addEventListener('resize', updateJourney);
  updateJourney();

  /* ---------- Price calculator ---------- */
  var slider = document.getElementById('roadSlider');
  var handle = document.getElementById('sliderHandle');
  var fill = document.getElementById('sliderFill');
  var kmValueEl = document.getElementById('kmValue');
  var resBase = document.getElementById('resBase');
  var resPerKm = document.getElementById('resPerKm');
  var resTotal = document.getElementById('resTotal');
  var vehicleButtons = document.querySelectorAll('.vehicle-btn');

  var state = { km: 15, base: 1500, rate: 150 };

  function formatRSD(n){
    return Math.round(n).toLocaleString('sr-RS') + ' RSD';
  }

  function animateValue(el, to, bump){
    if(prefersReducedMotion){ el.textContent = formatRSD(to); return; }
    var from = typeof el._v === 'number' ? el._v : to;
    el._v = to;
    if(el._raf) cancelAnimationFrame(el._raf);
    var t0 = null, dur = 380;
    var tick = function(ts){
      if(t0 === null) t0 = ts;
      var k = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = formatRSD(from + (to - from) * eased);
      if(k < 1){ el._raf = requestAnimationFrame(tick); }
      else { el._raf = 0; }
    };
    el._raf = requestAnimationFrame(tick);
    if(bump && from !== to){
      el.classList.add('is-bump');
      clearTimeout(el._bt);
      el._bt = setTimeout(function(){ el.classList.remove('is-bump'); }, 180);
    }
  }

  function renderCalc(){
    var pct = (state.km/100)*100;
    handle.style.left = pct + '%';
    fill.style.width = pct + '%';
    kmValueEl.textContent = state.km;
    slider.setAttribute('aria-valuenow', state.km);

    var perKmTotal = state.km * state.rate;
    var total = state.base + perKmTotal;

    animateValue(resBase, state.base, false);
    document.querySelector('.calc-result .row:nth-child(2) .k').textContent = 'Cena po kilometru \u00D7 ' + state.km + ' km';
    animateValue(resPerKm, perKmTotal, false);
    animateValue(resTotal, total, true);
  }

  function setKmFromClientX(clientX){
    var rect = slider.getBoundingClientRect();
    var ratio = (clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    state.km = Math.round(ratio * 100);
    renderCalc();
  }

  var dragging = false;
  slider.addEventListener('pointerdown', function(e){
    dragging = true;
    slider.setPointerCapture(e.pointerId);
    setKmFromClientX(e.clientX);
  });
  slider.addEventListener('pointermove', function(e){
    if(!dragging) return;
    setKmFromClientX(e.clientX);
  });
  ['pointerup','pointercancel'].forEach(function(ev){
    slider.addEventListener(ev, function(){ dragging = false; });
  });
  slider.addEventListener('keydown', function(e){
    var step = e.shiftKey ? 10 : 1;
    if(e.key === 'ArrowRight' || e.key === 'ArrowUp'){ state.km = Math.min(100, state.km+step); renderCalc(); e.preventDefault(); }
    if(e.key === 'ArrowLeft' || e.key === 'ArrowDown'){ state.km = Math.max(0, state.km-step); renderCalc(); e.preventDefault(); }
    if(e.key === 'Home'){ state.km = 0; renderCalc(); e.preventDefault(); }
    if(e.key === 'End'){ state.km = 100; renderCalc(); e.preventDefault(); }
  });

  vehicleButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      vehicleButtons.forEach(function(b){ b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      state.base = parseInt(btn.getAttribute('data-base'), 10);
      state.rate = parseInt(btn.getAttribute('data-rate'), 10);
      renderCalc();
    });
  });

  renderCalc();


  /* =====================================================================
     HERO — video se pokreće sam pri učitavanju i staje na završnom kadru.
     Kadar se vodi preko transform-a (GPU): na telefonu kamera prati prednji
     deo kamiona; ruta i značka prate napredak videa; pri skrolu tekst bledi
     (da se ne sudari sa headerom) a video dobija blagi parallax.
     ===================================================================== */
  (function heroPlay(){
    var hero = document.getElementById('hero');
    if(!hero) return;
    var stage = document.getElementById('heroStage');
    var video = document.getElementById('heroVideo');
    var badge = document.getElementById('heroBadge');
    var segs  = Array.prototype.slice.call(hero.querySelectorAll('.hero-route-seg'));
    var stops = Array.prototype.slice.call(hero.querySelectorAll('.hero-route-stop'));

    var mobile = window.matchMedia('(max-width: 760px)').matches;
    /* OFFSET = vreme u originalnom snimku gde mobilni fajl počinje (isečen je prazan početak) */
    var OFFSET = mobile ? 0.7 : 0;
    var SHIFT  = mobile ? 0 : 2.5;       /* % bočnog klizanja videa (desktop) */
    var VIDEO_AR = 16/9;
    var GRILL_AT = 0.66;                 /* visina grila u kadru videa (0..1) */
    var GRILL_Y  = 0.83;                 /* gde na ekranu telefona želimo grill (0..1) */

    /* Gde je PREDNJI deo kamiona (grill/farovi) u kadru, 0..1 po širini, u zavisnosti od vremena
       u originalnom snimku. Na uskom ekranu kamera prati tu tačku i staje na prednjem delu. */
    var FOCUS = [[0,.95],[1.0,.95],[1.5,.91],[1.9,.89],[2.2,.85],[2.5,.80],[2.75,.74],[3.0,.66],
                 [3.25,.58],[3.5,.48],[3.75,.39],[4.0,.32],[4.25,.265],[4.5,.25],[5.0,.245]];
    function focusAt(t){
      if(t <= FOCUS[0][0]) return FOCUS[0][1];
      for(var i = 1; i < FOCUS.length; i++){
        if(t <= FOCUS[i][0]){
          var a = FOCUS[i-1], b = FOCUS[i], k = (t - a[0]) / (b[0] - a[0]);
          return a[1] + (b[1] - a[1]) * k;
        }
      }
      return FOCUS[FOCUS.length-1][1];
    }

    var SW = 0, SH = 0, coverW = 0, coverH = 0, vis = 1;
    var st = {p:0, srcT:0, par:0};         /* trenutno stanje: napredak 0..1, vreme u originalu, parallax */
    var lastTransform = '', lastF = [-1,-1];
    var playRaf = 0, started = false, finished = false;
    var saveData = navigator.connection && navigator.connection.saveData;
    var clamp = function(v,a,b){ return Math.max(a, Math.min(b, v)); };

    /* "cover" veličina videa u pikselima; kasnije se video samo pomera transform-om (GPU) */
    function layout(){
      SW = stage.clientWidth; SH = stage.clientHeight;
      /* telefon: video je viši od ekrana (veći prednji deo), a spušten tako da grill i farovi
         pri kraju padnu u slobodnu zonu ispod teksta */
      coverH = Math.max(SH * (mobile ? 1.12 : 1), SW / VIDEO_AR); coverW = coverH * VIDEO_AR;
      vis = SW / coverW;
      video.style.width = coverW + 'px';
      video.style.height = coverH + 'px';
      lastTransform = '';
      applyTransform();
    }

    function applyTransform(){
      var p = st.p;
      var s = 1.02 + p * 0.035;
      var w = clamp((0.8 - vis) / 0.4, 0, 1);              /* koliko pratimo kamion (samo uski ekrani) */
      var c = 0.5 + (focusAt(st.srcT) - 0.5) * w;
      var pos = vis > 0.995 ? 0.5 : clamp((c - vis / 2) / (1 - vis), 0, 1);
      var offX = -(coverW - SW) * pos;
      var offY = mobile
        ? clamp((SH < 720 ? 0.87 : GRILL_Y) * SH - GRILL_AT * coverH, -(coverH - SH), SH * 0.02)
        : -(coverH - SH) / 2;
      var ax = 0.6 * SW, ay = 0.55 * SH;                    /* tačka oko koje se zumira */
      var shift = Math.min(p * SHIFT / 100 * SW, ax * (s - 1) * 0.9);   /* nikad ne otkriva ivicu */
      var tx = s * offX + ax * (1 - s) + shift;
      var ty = s * offY + ay * (1 - s) + st.par;            /* st.par: blagi parallax pri skrolu */
      var tr = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + s.toFixed(4) + ')';
      if(tr !== lastTransform){ video.style.transform = tr; lastTransform = tr; }
    }

    /* ruta, značka i kadar prate napredak videa */
    function render(p, srcT){
      st.p = p; st.srcT = srcT;
      var fs = [clamp(p / 0.5, 0, 1), clamp((p - 0.5) / 0.5, 0, 1)];
      segs.forEach(function(seg, i){
        if(Math.abs(fs[i] - lastF[i]) > 0.002 || fs[i] === 0 || fs[i] === 1){
          lastF[i] = fs[i];
          seg.firstElementChild.style.setProperty('--f', fs[i].toFixed(4));
        }
        seg.classList.toggle('is-live', fs[i] > 0.001 && fs[i] < 0.999);
      });
      var marks = [0.01, 0.5, 0.985];
      stops.forEach(function(s, i){ s.classList.toggle('is-passed', p >= marks[i]); });
      if(badge){ badge.classList.toggle('is-shown', p >= 0.9); }
      applyTransform();
    }

    function makeStatic(){
      finished = true;
      if(playRaf){ cancelAnimationFrame(playRaf); playRaf = 0; }
      hero.classList.add('is-static');
      render(1, 5);
    }

    layout();
    if(prefersReducedMotion || saveData){ makeStatic(); return; }

    /* ---------- reprodukcija pri učitavanju ---------- */
    function frame(){
      playRaf = 0;
      var d = video.duration || 0;
      if(d > 0){ render(clamp(video.currentTime / d, 0, 1), video.currentTime + OFFSET); }
      if(!video.ended && !finished){ playRaf = requestAnimationFrame(frame); }
    }
    function begin(){
      if(started) return;
      started = true;
      video.muted = true;
      var pr = video.play();
      if(pr && pr.catch){ pr.catch(makeStatic); }      /* npr. iOS "štednja baterije": prikaži završni kadar */
      if(!playRaf) playRaf = requestAnimationFrame(frame);
    }
    video.addEventListener('ended', function(){
      finished = true;
      if(playRaf){ cancelAnimationFrame(playRaf); playRaf = 0; }
      render(1, (video.duration || 0) + OFFSET);       /* završni kadar: kamion stoji, prednji deo u fokusu */
    });
    video.addEventListener('error', makeStatic);

    /* kreni kad je dovoljno učitano da ne zastaje; ako mreža kasni, kreni svejedno posle 3 s */
    if(video.readyState >= 4){ begin(); }
    else{
      video.addEventListener('canplaythrough', begin, {once:true});
      setTimeout(function(){ if(video.readyState >= 3) begin(); }, 3000);
    }

    /* ---------- skrol: tekst bledi i blago se diže, video ima mali parallax ---------- */
    var scrollRaf = 0;
    function onScrollHero(){
      scrollRaf = 0;
      var sy = window.scrollY, H = HERO.height || SH || 1;
      if(sy > H * 1.1 && stage._off){ return; }
      stage._off = sy > H * 1.1;
      var k = clamp(sy / (H * 0.35), 0, 1);
      stage.style.setProperty('--fade', (1 - k).toFixed(3));
      stage.style.setProperty('--rise', (-sy * 0.14).toFixed(1) + 'px');
      st.par = Math.min(sy, H) * 0.28;
      applyTransform();
    }
    window.addEventListener('scroll', function(){ if(!scrollRaf) scrollRaf = requestAnimationFrame(onScrollHero); }, {passive:true});

    function remeasure(){ measureHeroBox(); layout(); onScrollHero(); }
    window.addEventListener('resize', remeasure);
    window.addEventListener('orientationchange', remeasure);
    window.addEventListener('load', function(){ measureHeroBox(); onScrollHero(); });
    onScrollHero();
  })();

  /* ---------- Magnetni CTA dugmići u hero-u (samo miš) ---------- */
  if(window.matchMedia && window.matchMedia('(pointer:fine)').matches && !prefersReducedMotion){
    document.querySelectorAll('.hero-ctas .btn').forEach(function(btn){
      btn.addEventListener('pointermove', function(e){
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width/2)) * 0.2;
        var y = (e.clientY - (r.top + r.height/2)) * 0.32;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function(){ btn.style.transform = ''; });
    });
  }

  /* ---------- Reveal na scroll (ostatak sajta) ---------- */
  (function reveals(){
    if(!('IntersectionObserver' in window)) return;

    /* ikonice usluga: normalizuj dužinu linije da se mogu "iscrtati" */
    document.querySelectorAll('.service-icon').forEach(function(svg){
      svg.querySelectorAll('path,circle,rect,line').forEach(function(n){ n.setAttribute('pathLength','1'); });
    });

    var groups = [
      {sel:'.section-head',        cls:'rv-head', plain:true},
      {sel:'.service-card',        cls:'',        cols:4, step:90},
      {sel:'.coverage-item',       cls:'rv-left', step:90},
      {sel:'.coverage-map',        cls:'rv-scale'},
      {sel:'.step',                cls:'rv-left', step:0},
      {sel:'.calc',                cls:'rv-scale'},
      {sel:'.faq-item',            cls:'',        step:70},
      {sel:'.contact-card',        cls:'rv-left'},
      {sel:'.contact-hours',       cls:'rv-right'},
      {sel:'.footer-grid > *',     cls:'',        step:100}
    ];

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        el.classList.add('is-in');
        if(!el._plain){
          /* po završetku skini klase da hover prelazi na elementu rade normalno */
          setTimeout(function(){
            el.classList.remove('rv','rv-left','rv-right','rv-scale','is-in');
            el.style.removeProperty('--rv-d');
          }, 1500);
        }
      });
    }, {threshold:0.15, rootMargin:'0px 0px -6% 0px'});

    groups.forEach(function(g){
      document.querySelectorAll(g.sel).forEach(function(el, i){
        if(g.plain){ el.classList.add(g.cls); el._plain = true; }
        else{
          el.classList.add('rv'); if(g.cls) el.classList.add(g.cls);
          var idx = g.cols ? i % g.cols : i;
          if(g.step) el.style.setProperty('--rv-d', (idx * g.step) + 'ms');
        }
        io.observe(el);
      });
    });
  })();

  /* ---------- Marquee traka: ubrzava se brzinom skrola ---------- */
  (function marqueeVelocity(){
    var track = document.querySelector('.strip-track');
    if(!track || !track.getAnimations || prefersReducedMotion) return;
    var anim = null, lastY = window.scrollY, vel = 0, rate = 1, running = false, visible = false;
    var loop = function(){
      if(!anim){ anim = track.getAnimations()[0]; }
      var y = window.scrollY, dy = y - lastY; lastY = y;
      vel += (dy - vel) * 0.12;
      var goal = clampRate(1 + vel * 0.22);
      rate += (goal - rate) * 0.1;
      if(anim){ anim.updatePlaybackRate(Math.abs(rate) < 0.05 ? 0.05 : rate); }
      if(visible){ requestAnimationFrame(loop); } else { running = false; }
    };
    function clampRate(r){ return Math.max(-6, Math.min(9, r)); }
    new IntersectionObserver(function(en){
      visible = en[0].isIntersecting;
      if(visible && !running){ running = true; lastY = window.scrollY; requestAnimationFrame(loop); }
    }).observe(track.parentElement);
  })();

})();
