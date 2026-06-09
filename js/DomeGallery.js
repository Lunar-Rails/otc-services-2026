/* ============================================================
   DomeGallery — Vanilla JS port of React Bits DomeGallery
   Dependency-free: replaces @use-gesture/react with pointer events
   ============================================================ */

(function (global) {
  'use strict';

  var DEFAULT_IMAGES = [
    {
      src: 'https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?q=80&w=774&auto=format&fit=crop',
      alt: 'Abstract art'
    },
    {
      src: 'https://images.unsplash.com/photo-1755569309049-98410b94f66d?q=80&w=772&auto=format&fit=crop',
      alt: 'Modern sculpture'
    },
    {
      src: 'https://images.unsplash.com/photo-1755497595318-7e5e3523854f?q=80&w=774&auto=format&fit=crop',
      alt: 'Digital artwork'
    },
    {
      src: 'https://images.unsplash.com/photo-1755353985163-c2a0fe5ac3d8?q=80&w=774&auto=format&fit=crop',
      alt: 'Contemporary art'
    },
    {
      src: 'https://images.unsplash.com/photo-1745965976680-d00be7dc0377?q=80&w=774&auto=format&fit=crop',
      alt: 'Geometric pattern'
    },
    {
      src: 'https://images.unsplash.com/photo-1752588975228-21f44630bb3c?q=80&w=774&auto=format&fit=crop',
      alt: 'Textured surface'
    }
  ];

  /* ---- Utility ---- */

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  function normalizeAngle(d) { return ((d % 360) + 360) % 360; }

  function wrapAngleSigned(deg) {
    var a = (((deg + 180) % 360) + 360) % 360;
    return a - 180;
  }

  function getDataNumber(el, name, fallback) {
    var attr = el.dataset[name];
    var n = attr == null ? NaN : parseFloat(attr);
    return Number.isFinite(n) ? n : fallback;
  }

  /* ---- Item grid builder ---- */

  function buildItems(pool, seg) {
    var xCols = Array.from({ length: seg }, function (_, i) { return -37 + i * 2; });
    var evenYs = [-4, -2, 0, 2, 4];
    var oddYs  = [-3, -1, 1, 3, 5];

    var coords = xCols.reduce(function (acc, x, c) {
      var ys = c % 2 === 0 ? evenYs : oddYs;
      ys.forEach(function (y) { acc.push({ x: x, y: y, sizeX: 2, sizeY: 2 }); });
      return acc;
    }, []);

    var totalSlots = coords.length;

    if (pool.length === 0) {
      return coords.map(function (c) { return Object.assign({}, c, { src: '', alt: '' }); });
    }

    var normalizedImages = pool.map(function (image) {
      if (typeof image === 'string') return { src: image, alt: '' };
      return { src: image.src || '', alt: image.alt || '' };
    });

    var usedImages = Array.from({ length: totalSlots }, function (_, i) {
      return normalizedImages[i % normalizedImages.length];
    });

    for (var i = 1; i < usedImages.length; i++) {
      if (usedImages[i].src === usedImages[i - 1].src) {
        for (var j = i + 1; j < usedImages.length; j++) {
          if (usedImages[j].src !== usedImages[i].src) {
            var tmp = usedImages[i]; usedImages[i] = usedImages[j]; usedImages[j] = tmp;
            break;
          }
        }
      }
    }

    return coords.map(function (c, idx) {
      return Object.assign({}, c, { src: usedImages[idx].src, alt: usedImages[idx].alt });
    });
  }

  /* ---- Rotation math ---- */

  function computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
    var unit = 360 / segments / 2;
    return {
      rotateY: unit * (offsetX + (sizeX - 1) / 2),
      rotateX: unit * (offsetY - (sizeY - 1) / 2)
    };
  }

  /* ================================================================
     DomeGallery class
     ================================================================ */

  function DomeGallery(container, options) {
    options = options || {};

    this.container            = container;
    this.images               = options.images               || DEFAULT_IMAGES;
    this.fit                  = options.fit                  != null ? options.fit                  : 0.5;
    this.fitBasis             = options.fitBasis             || 'auto';
    this.minRadius            = options.minRadius            != null ? options.minRadius            : 600;
    this.maxRadius            = options.maxRadius            != null ? options.maxRadius            : Infinity;
    this.padFactor            = options.padFactor            != null ? options.padFactor            : 0.25;
    this.overlayBlurColor     = options.overlayBlurColor     || '#120F17';
    this.maxVerticalRotDeg    = options.maxVerticalRotationDeg != null ? options.maxVerticalRotationDeg : 5;
    this.dragSensitivity      = options.dragSensitivity      != null ? options.dragSensitivity      : 20;
    this.enlargeTransitionMs  = options.enlargeTransitionMs  != null ? options.enlargeTransitionMs  : 300;
    this.segments             = options.segments             != null ? options.segments             : 35;
    this.dragDampening        = options.dragDampening        != null ? options.dragDampening        : 2;
    this.openedImageWidth     = options.openedImageWidth     != null ? options.openedImageWidth     : '250px';
    this.openedImageHeight    = options.openedImageHeight    != null ? options.openedImageHeight    : '350px';
    this.imageBorderRadius    = options.imageBorderRadius    != null ? options.imageBorderRadius    : '30px';
    this.openedBorderRadius   = options.openedImageBorderRadius != null ? options.openedImageBorderRadius : '30px';
    this.grayscale            = options.grayscale            != null ? options.grayscale            : true;

    /* state */
    this.rotation          = { x: 0, y: 0 };
    this.startRot          = { x: 0, y: 0 };
    this.startPos          = null;
    this.dragging          = false;
    this.moved             = false;
    this.inertiaRAF        = null;
    this.opening           = false;
    this.openStartedAt     = 0;
    this.lastDragEndAt     = 0;
    this.focusedEl         = null;
    this.originalTilePos   = null;
    this.scrollLocked      = false;
    this.lockedRadius      = null;
    this.posHistory        = [];
    this.activePointerId   = null;
    this.autoSpin          = options.autoSpin !== false;
    this.autoSpinSpeed     = options.autoSpinSpeed != null ? options.autoSpinSpeed : 0.03;
    this.clickable         = options.clickable !== false;
    this.autoSpinRAF       = null;

    this._buildDOM();
    this._setupResizeObserver();
    this._setupDragEvents();
    this._setupScrimClose();
    this._applyTransform(0, 0);
    this._startAutoSpin();
  }

  /* ---- DOM construction ---- */

  DomeGallery.prototype._buildDOM = function () {
    var self  = this;
    var items = buildItems(this.images, this.segments);

    /* root */
    var root = document.createElement('div');
    root.className = 'sphere-root';
    root.style.setProperty('--segments-x',      this.segments);
    root.style.setProperty('--segments-y',      this.segments);
    root.style.setProperty('--overlay-blur-color', this.overlayBlurColor);
    root.style.setProperty('--tile-radius',     this.imageBorderRadius);
    root.style.setProperty('--enlarge-radius',  this.openedBorderRadius);
    root.style.setProperty('--image-filter',    this.grayscale ? 'grayscale(1)' : 'none');
    if (!this.clickable) root.setAttribute('data-no-click', '');
    this.root = root;

    /* main wrapper — using div to avoid nested <main> in the page */
    var main = document.createElement('div');
    main.className = 'sphere-main';
    this.mainEl = main;

    /* stage → sphere */
    var stage = document.createElement('div');
    stage.className = 'stage';

    var sphere = document.createElement('div');
    sphere.className = 'sphere';
    this.sphereEl = sphere;

    /* tiles */
    items.forEach(function (it, i) {
      var item = document.createElement('div');
      item.className = 'item';
      item.dataset.src     = it.src;
      item.dataset.offsetX = it.x;
      item.dataset.offsetY = it.y;
      item.dataset.sizeX   = it.sizeX;
      item.dataset.sizeY   = it.sizeY;
      item.style.setProperty('--offset-x',    it.x);
      item.style.setProperty('--offset-y',    it.y);
      item.style.setProperty('--item-size-x', it.sizeX);
      item.style.setProperty('--item-size-y', it.sizeY);

      var imgWrapper = document.createElement('div');
      imgWrapper.className = 'item__image';
      imgWrapper.setAttribute('role', 'button');
      imgWrapper.setAttribute('tabindex', '0');
      imgWrapper.setAttribute('aria-label', it.alt || 'Open image');

      var img = document.createElement('img');
      img.src       = it.src;
      img.alt       = it.alt;
      img.draggable = false;

      imgWrapper.appendChild(img);
      item.appendChild(imgWrapper);
      sphere.appendChild(item);

      imgWrapper.addEventListener('click',     function (e) { self._onTileClick(e); });
      imgWrapper.addEventListener('pointerup', function (e) { self._onTilePointerUp(e); });
    });

    stage.appendChild(sphere);
    main.appendChild(stage);

    /* overlay layers */
    var ov1 = document.createElement('div'); ov1.className = 'dg-overlay';
    var ov2 = document.createElement('div'); ov2.className = 'dg-overlay dg-overlay--blur';
    var efT = document.createElement('div'); efT.className = 'dg-edge-fade dg-edge-fade--top';
    var efB = document.createElement('div'); efB.className = 'dg-edge-fade dg-edge-fade--bottom';
    main.appendChild(ov1);
    main.appendChild(ov2);
    main.appendChild(efT);
    main.appendChild(efB);

    /* viewer */
    var viewer = document.createElement('div'); viewer.className = 'dg-viewer';
    var scrim  = document.createElement('div'); scrim.className  = 'dg-scrim';
    var frame  = document.createElement('div'); frame.className  = 'dg-frame';
    this.viewerEl = viewer;
    this.scrimEl  = scrim;
    this.frameEl  = frame;
    viewer.appendChild(scrim);
    viewer.appendChild(frame);
    main.appendChild(viewer);

    root.appendChild(main);
    this.container.appendChild(root);
  };

  /* ---- Transform ---- */

  DomeGallery.prototype._applyTransform = function (xDeg, yDeg) {
    if (this.sphereEl) {
      this.sphereEl.style.transform =
        'translateZ(calc(var(--radius) * -1)) rotateX(' + xDeg + 'deg) rotateY(' + yDeg + 'deg)';
    }
  };

  /* ---- Resize observer ---- */

  DomeGallery.prototype._setupResizeObserver = function () {
    var self = this;
    var ro = new ResizeObserver(function (entries) {
      var cr = entries[0].contentRect;
      var w  = Math.max(1, cr.width);
      var h  = Math.max(1, cr.height);
      var minDim = Math.min(w, h);
      var maxDim = Math.max(w, h);
      var aspect = w / h;

      var basis;
      switch (self.fitBasis) {
        case 'min':    basis = minDim; break;
        case 'max':    basis = maxDim; break;
        case 'width':  basis = w;      break;
        case 'height': basis = h;      break;
        default:       basis = aspect >= 1.3 ? w : minDim;
      }

      var radius = Math.min(basis * self.fit, h * 1.35);
      radius = clamp(radius, self.minRadius, self.maxRadius);
      self.lockedRadius = Math.round(radius);

      var viewerPad = Math.max(8, Math.round(minDim * self.padFactor));
      self.root.style.setProperty('--radius',             self.lockedRadius + 'px');
      self.root.style.setProperty('--viewer-pad',         viewerPad + 'px');
      self.root.style.setProperty('--overlay-blur-color', self.overlayBlurColor);
      self.root.style.setProperty('--tile-radius',        self.imageBorderRadius);
      self.root.style.setProperty('--enlarge-radius',     self.openedBorderRadius);
      self.root.style.setProperty('--image-filter',       self.grayscale ? 'grayscale(1)' : 'none');
      self._applyTransform(self.rotation.x, self.rotation.y);

      /* reposition enlarged overlay if open */
      var enlargedOverlay = self.viewerEl && self.viewerEl.querySelector('.enlarge');
      if (enlargedOverlay && self.frameEl && self.mainEl) {
        var frameR = self.frameEl.getBoundingClientRect();
        var mainR  = self.mainEl.getBoundingClientRect();
        if (self.openedImageWidth && self.openedImageHeight) {
          var tmp = document.createElement('div');
          tmp.style.cssText = 'position:absolute;width:' + self.openedImageWidth + ';height:' + self.openedImageHeight + ';visibility:hidden;';
          document.body.appendChild(tmp);
          var tmpR = tmp.getBoundingClientRect();
          document.body.removeChild(tmp);
          enlargedOverlay.style.left = (frameR.left - mainR.left + (frameR.width  - tmpR.width)  / 2) + 'px';
          enlargedOverlay.style.top  = (frameR.top  - mainR.top  + (frameR.height - tmpR.height) / 2) + 'px';
        } else {
          enlargedOverlay.style.left   = (frameR.left - mainR.left) + 'px';
          enlargedOverlay.style.top    = (frameR.top  - mainR.top)  + 'px';
          enlargedOverlay.style.width  = frameR.width  + 'px';
          enlargedOverlay.style.height = frameR.height + 'px';
        }
      }
    });
    ro.observe(this.root);
    this._ro = ro;
  };

  /* ---- Scroll lock ---- */

  DomeGallery.prototype._lockScroll = function () {
    if (this.scrollLocked) return;
    this.scrollLocked = true;
    document.body.classList.add('dg-scroll-lock');
  };

  DomeGallery.prototype._unlockScroll = function () {
    if (!this.scrollLocked) return;
    if (this.root && this.root.getAttribute('data-enlarging') === 'true') return;
    this.scrollLocked = false;
    document.body.classList.remove('dg-scroll-lock');
  };

  /* ---- Auto-spin ---- */

  DomeGallery.prototype._startAutoSpin = function () {
    if (!this.autoSpin) return;
    var self = this;
    if (self.autoSpinRAF) cancelAnimationFrame(self.autoSpinRAF);
    var step = function () {
      var nextY = wrapAngleSigned(self.rotation.y + self.autoSpinSpeed);
      self.rotation = { x: self.rotation.x, y: nextY };
      self._applyTransform(self.rotation.x, nextY);
      self.autoSpinRAF = requestAnimationFrame(step);
    };
    self.autoSpinRAF = requestAnimationFrame(step);
  };

  DomeGallery.prototype._stopAutoSpin = function () {
    if (this.autoSpinRAF) {
      cancelAnimationFrame(this.autoSpinRAF);
      this.autoSpinRAF = null;
    }
  };

  /* ---- Inertia ---- */

  DomeGallery.prototype._stopInertia = function () {
    if (this.inertiaRAF) {
      cancelAnimationFrame(this.inertiaRAF);
      this.inertiaRAF = null;
    }
  };

  DomeGallery.prototype._startInertia = function (vx, vy) {
    var self      = this;
    var MAX_V     = 1.4;
    var vX        = clamp(vx, -MAX_V, MAX_V) * 80;
    var vY        = clamp(vy, -MAX_V, MAX_V) * 80;
    var frames    = 0;
    var d         = clamp(this.dragDampening != null ? this.dragDampening : 0.6, 0, 1);
    var friction  = 0.94 + 0.055 * d;
    var stopThr   = 0.015 - 0.01 * d;
    var maxFrames = Math.round(90 + 270 * d);

    function step() {
      vX *= friction;
      vY *= friction;
      if ((Math.abs(vX) < stopThr && Math.abs(vY) < stopThr) || ++frames > maxFrames) {
        self.inertiaRAF = null;
        self._startAutoSpin();
        return;
      }
      var nextX = clamp(self.rotation.x - vY / 200, -self.maxVerticalRotDeg, self.maxVerticalRotDeg);
      var nextY = wrapAngleSigned(self.rotation.y + vX / 200);
      self.rotation = { x: nextX, y: nextY };
      self._applyTransform(nextX, nextY);
      self.inertiaRAF = requestAnimationFrame(step);
    }

    this._stopInertia();
    this.inertiaRAF = requestAnimationFrame(step);
  };

  /* ---- Drag events (replaces @use-gesture/react) ---- */

  DomeGallery.prototype._setupDragEvents = function () {
    var self = this;
    var main = this.mainEl;

    main.addEventListener('pointerdown', function (e) {
      if (self.activePointerId !== null) return;
      if (self.focusedEl) return;
      self.activePointerId = e.pointerId;
      self._stopAutoSpin();
      self._stopInertia();
      self.dragging  = true;
      self.moved     = false;
      self.startRot  = { x: self.rotation.x, y: self.rotation.y };
      self.startPos  = { x: e.clientX, y: e.clientY };
      self.posHistory = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    }, { passive: true });

    main.addEventListener('pointermove', function (e) {
      if (e.pointerId !== self.activePointerId) return;
      if (!self.dragging || !self.startPos) return;
      if (self.focusedEl) return;

      var now = performance.now();
      self.posHistory.push({ x: e.clientX, y: e.clientY, t: now });
      if (self.posHistory.length > 8) self.posHistory.shift();

      var dxTotal = e.clientX - self.startPos.x;
      var dyTotal = e.clientY - self.startPos.y;

      if (!self.moved && (dxTotal * dxTotal + dyTotal * dyTotal) > 16) {
        self.moved = true;
      }

      var nextX = clamp(self.startRot.x - dyTotal / self.dragSensitivity, -self.maxVerticalRotDeg, self.maxVerticalRotDeg);
      var nextY = wrapAngleSigned(self.startRot.y + dxTotal / self.dragSensitivity);

      if (self.rotation.x !== nextX || self.rotation.y !== nextY) {
        self.rotation = { x: nextX, y: nextY };
        self._applyTransform(nextX, nextY);
      }
    }, { passive: true });

    function endDrag(e) {
      if (e.pointerId !== self.activePointerId) return;
      self.activePointerId = null;
      if (!self.dragging) return;
      self.dragging = false;

      var vx = 0, vy = 0;
      var hist = self.posHistory;
      if (hist.length >= 2) {
        var lookback = Math.min(hist.length - 1, 3);
        var last  = hist[hist.length - 1];
        var first = hist[hist.length - 1 - lookback];
        var dt = last.t - first.t;
        if (dt > 0) {
          vx = (last.x - first.x) / dt;
          vy = (last.y - first.y) / dt;
        }
      }

      if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
        self._startInertia(vx, vy);
      } else {
        self._startAutoSpin();
      }

      if (self.moved) self.lastDragEndAt = performance.now();
      self.moved     = false;
      self.startPos  = null;
      self.posHistory = [];
    }

    main.addEventListener('pointerup',     endDrag, { passive: true });
    main.addEventListener('pointercancel', endDrag, { passive: true });
  };

  /* ---- Tile click / tap ---- */

  DomeGallery.prototype._onTileClick = function (e) {
    if (!this.clickable) return;
    if (this.dragging)  return;
    if (this.moved)     return;
    if (performance.now() - this.lastDragEndAt < 80) return;
    if (this.opening)   return;
    this._openItemFromElement(e.currentTarget);
  };

  DomeGallery.prototype._onTilePointerUp = function (e) {
    if (!this.clickable) return;
    if (e.pointerType !== 'touch') return;
    if (this.dragging)  return;
    if (this.moved)     return;
    if (performance.now() - this.lastDragEndAt < 80) return;
    if (this.opening)   return;
    this._openItemFromElement(e.currentTarget);
  };

  /* ---- Open enlarged image ---- */

  DomeGallery.prototype._openItemFromElement = function (el) {
    if (this.opening) return;
    this.opening      = true;
    this.openStartedAt = performance.now();
    this._lockScroll();

    var self   = this;
    var parent = el.parentElement;
    this.focusedEl = el;
    el.setAttribute('data-focused', 'true');

    var offsetX = getDataNumber(parent, 'offsetX', 0);
    var offsetY = getDataNumber(parent, 'offsetY', 0);
    var sizeX   = getDataNumber(parent, 'sizeX',   2);
    var sizeY   = getDataNumber(parent, 'sizeY',   2);

    var parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, this.segments);
    var parentY   = normalizeAngle(parentRot.rotateY);
    var globalY   = normalizeAngle(this.rotation.y);
    var rotY      = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;
    var rotX = -parentRot.rotateX - this.rotation.x;

    parent.style.setProperty('--rot-y-delta', rotY + 'deg');
    parent.style.setProperty('--rot-x-delta', rotX + 'deg');

    var refDiv = document.createElement('div');
    refDiv.className    = 'item__image item__image--reference';
    refDiv.style.opacity   = '0';
    refDiv.style.transform = 'rotateX(' + (-parentRot.rotateX) + 'deg) rotateY(' + (-parentRot.rotateY) + 'deg)';
    parent.appendChild(refDiv);

    void refDiv.offsetHeight;

    var tileR  = refDiv.getBoundingClientRect();
    var mainR  = this.mainEl  && this.mainEl.getBoundingClientRect();
    var frameR = this.frameEl && this.frameEl.getBoundingClientRect();

    if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
      this.opening  = false;
      this.focusedEl = null;
      parent.removeChild(refDiv);
      this._unlockScroll();
      return;
    }

    this.originalTilePos = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
    el.style.visibility = 'hidden';
    el.style.zIndex     = 0;

    var overlay = document.createElement('div');
    overlay.className = 'enlarge';
    overlay.style.position       = 'absolute';
    overlay.style.left           = (frameR.left - mainR.left) + 'px';
    overlay.style.top            = (frameR.top  - mainR.top)  + 'px';
    overlay.style.width          = frameR.width  + 'px';
    overlay.style.height         = frameR.height + 'px';
    overlay.style.opacity        = '0';
    overlay.style.zIndex         = '30';
    overlay.style.willChange     = 'transform, opacity';
    overlay.style.transformOrigin = 'top left';
    overlay.style.transition     = 'transform ' + this.enlargeTransitionMs + 'ms ease, opacity ' + this.enlargeTransitionMs + 'ms ease';

    var rawSrc = parent.dataset.src || (el.querySelector('img') && el.querySelector('img').src) || '';
    var img    = document.createElement('img');
    img.src    = rawSrc;
    overlay.appendChild(img);
    this.viewerEl.appendChild(overlay);

    var tx0    = tileR.left - frameR.left;
    var ty0    = tileR.top  - frameR.top;
    var sx0    = tileR.width  / frameR.width;
    var sy0    = tileR.height / frameR.height;
    var validSx = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
    var validSy = isFinite(sy0) && sy0 > 0 ? sy0 : 1;
    overlay.style.transform = 'translate(' + tx0 + 'px,' + ty0 + 'px) scale(' + validSx + ',' + validSy + ')';

    setTimeout(function () {
      if (!overlay.parentElement) return;
      overlay.style.opacity   = '1';
      overlay.style.transform = 'translate(0px,0px) scale(1,1)';
      self.root && self.root.setAttribute('data-enlarging', 'true');
    }, 16);

    if (this.openedImageWidth || this.openedImageHeight) {
      var onFirstEnd = function (ev) {
        if (ev.propertyName !== 'transform') return;
        overlay.removeEventListener('transitionend', onFirstEnd);

        var prevTransition = overlay.style.transition;
        overlay.style.transition = 'none';
        var tempW = self.openedImageWidth  || (frameR.width  + 'px');
        var tempH = self.openedImageHeight || (frameR.height + 'px');
        overlay.style.width  = tempW;
        overlay.style.height = tempH;
        var newRect = overlay.getBoundingClientRect();
        overlay.style.width  = frameR.width  + 'px';
        overlay.style.height = frameR.height + 'px';
        void overlay.offsetWidth;

        var ms = self.enlargeTransitionMs;
        overlay.style.transition = 'left ' + ms + 'ms ease,top ' + ms + 'ms ease,width ' + ms + 'ms ease,height ' + ms + 'ms ease';

        var cLeft = frameR.left - mainR.left + (frameR.width  - newRect.width)  / 2;
        var cTop  = frameR.top  - mainR.top  + (frameR.height - newRect.height) / 2;

        requestAnimationFrame(function () {
          overlay.style.left   = cLeft + 'px';
          overlay.style.top    = cTop  + 'px';
          overlay.style.width  = tempW;
          overlay.style.height = tempH;
        });

        var cleanupSecond = function () {
          overlay.removeEventListener('transitionend', cleanupSecond);
          overlay.style.transition = prevTransition;
        };
        overlay.addEventListener('transitionend', cleanupSecond, { once: true });
      };
      overlay.addEventListener('transitionend', onFirstEnd);
    }
  };

  /* ---- Scrim close ---- */

  DomeGallery.prototype._setupScrimClose = function () {
    var self = this;

    var close = function () {
      if (performance.now() - self.openStartedAt < 250) return;
      var el = self.focusedEl;
      if (!el) return;
      var parent  = el.parentElement;
      var overlay = self.viewerEl && self.viewerEl.querySelector('.enlarge');
      if (!overlay) return;
      var refDiv      = parent.querySelector('.item__image--reference');
      var originalPos = self.originalTilePos;

      if (!originalPos) {
        overlay.remove();
        if (refDiv) refDiv.remove();
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        el.style.visibility = '';
        el.style.zIndex     = 0;
        self.focusedEl      = null;
        self.root && self.root.removeAttribute('data-enlarging');
        self.opening        = false;
        self._unlockScroll();
        return;
      }

      var currentRect = overlay.getBoundingClientRect();
      var rootRect    = self.root.getBoundingClientRect();

      var oPosRel = {
        left:   originalPos.left - rootRect.left,
        top:    originalPos.top  - rootRect.top,
        width:  originalPos.width,
        height: originalPos.height
      };
      var ovRel = {
        left:   currentRect.left - rootRect.left,
        top:    currentRect.top  - rootRect.top,
        width:  currentRect.width,
        height: currentRect.height
      };

      var anim = document.createElement('div');
      anim.className  = 'enlarge-closing';
      anim.style.cssText =
        'position:absolute;left:' + ovRel.left + 'px;top:' + ovRel.top + 'px;' +
        'width:' + ovRel.width + 'px;height:' + ovRel.height + 'px;' +
        'z-index:9999;border-radius:var(--enlarge-radius,32px);overflow:hidden;' +
        'box-shadow:0 10px 30px rgba(0,0,0,.35);' +
        'transition:all ' + self.enlargeTransitionMs + 'ms ease-out;' +
        'pointer-events:none;margin:0;transform:none;';

      var origImg = overlay.querySelector('img');
      if (origImg) {
        var cloned = origImg.cloneNode(false);
        cloned.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        anim.appendChild(cloned);
      }

      overlay.remove();
      self.root.appendChild(anim);
      void anim.getBoundingClientRect();

      requestAnimationFrame(function () {
        anim.style.left    = oPosRel.left   + 'px';
        anim.style.top     = oPosRel.top    + 'px';
        anim.style.width   = oPosRel.width  + 'px';
        anim.style.height  = oPosRel.height + 'px';
        anim.style.opacity = '0';
      });

      var cleanup = function () {
        anim.remove();
        self.originalTilePos = null;
        if (refDiv) refDiv.remove();
        parent.style.transition = 'none';
        el.style.transition     = 'none';
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        requestAnimationFrame(function () {
          el.style.visibility = '';
          el.style.opacity    = '0';
          el.style.zIndex     = 0;
          self.focusedEl      = null;
          self.root && self.root.removeAttribute('data-enlarging');
          requestAnimationFrame(function () {
            parent.style.transition = '';
            el.style.transition     = 'opacity 300ms ease-out';
            requestAnimationFrame(function () {
              el.style.opacity = '1';
              setTimeout(function () {
                el.style.transition = '';
                el.style.opacity    = '';
                self.opening        = false;
                if (!self.dragging && self.root && self.root.getAttribute('data-enlarging') !== 'true') {
                  document.body.classList.remove('dg-scroll-lock');
                }
              }, 300);
            });
          });
        });
      };

      anim.addEventListener('transitionend', cleanup, { once: true });
    };

    this.scrimEl.addEventListener('click', close);

    var onKey = function (e) { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    this._keyHandler = onKey;
  };

  /* ---- Cleanup ---- */

  DomeGallery.prototype.destroy = function () {
    if (this._ro) this._ro.disconnect();
    this._stopAutoSpin();
    this._stopInertia();
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    document.body.classList.remove('dg-scroll-lock');
    if (this.root && this.root.parentNode) this.root.parentNode.removeChild(this.root);
  };

  /* ---- Expose ---- */
  global.DomeGallery = DomeGallery;

}(window));
