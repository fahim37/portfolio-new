// Raw WebGL2 renderer for the projects gallery: every card is a tessellated plane that samples one
// shared wave, bends with scroll velocity, and can fly into (and back out of) the white project sheet.

const CAMERA_Z = 1000;
// Scales the rail's bend, depth and twist; 1 matches the reference, lower is calmer. Hover is unaffected.
const WAVE_STRENGTH = 0.6;

export type Rect = { left: number; top: number; width: number; height: number };

export type RendererCard = { id: string; title: string; aspect: number; image: HTMLImageElement };

export type RendererCallbacks = {
  onOpenReveal?: (id: string) => void;
  onOpenComplete?: (id: string) => void;
  onCloseComplete?: (id: string) => void;
  onContextLost?: () => void;
};

export type FrameInput = {
  time: number;
  width: number;
  height: number;
  velocity: number;
  pointerX: number;
  pointerY: number;
  hoveredId: string | null;
  cards: ReadonlyMap<string, Rect>;
  sheetRect: Rect | null;
  galleryVisible: boolean;
};

type Pose = Rect & {
  worldCenterX: number;
  rail: number;
  sheet: number;
  flatten: number;
  hover: number;
  title: number;
  affordance: number;
  velocity: number;
  corner: number;
};

type CardEntry = {
  id: string;
  image: HTMLImageElement;
  texture: WebGLTexture;
  titleTexture: WebGLTexture;
  affordanceTexture: WebGLTexture;
  pose: Pose;
  pointer: [number, number];
  opacity: number;
  inSheet: boolean;
  initialized: boolean;
};

type Flight = { id: string; mode: "open" | "close"; start: number; from: Pose; revealed: boolean };

const cardVertex = /* glsl */ `#version 300 es
precision highp float;
in vec2 aUv;
uniform mat4 uProjection;
uniform vec3 uOffset;
uniform vec2 uPlaneSize;
uniform vec2 uPointer;
uniform vec2 uViewport;
uniform float uWorldCenterX;
uniform float uVelocity;
uniform float uHover;
uniform float uFlatten;
out vec2 vUv;
out float vCurve;
out float vEdge;

const float PI = 3.141592653589793;
const float WAVE = ${WAVE_STRENGTH.toFixed(2)};

void main() {
  vUv = aUv;
  float flatten = smoothstep(0.0, 1.0, uFlatten);
  float galleryMix = 1.0 - flatten;
  float signedVelocity = clamp(uVelocity / 20.0, -1.55, 1.55);
  float speed = abs(signedVelocity);

  float nx = (aUv.x - 0.5) * 2.0;
  float ny = (aUv.y - 0.5) * 2.0;
  float flatX = nx * max(uPlaneSize.x * 0.5, 1.0);
  float flatY = ny * max(uPlaneSize.y * 0.5, 1.0);
  float viewportW = max(uViewport.x, 1.0);
  float viewportH = max(uViewport.y, 1.0);

  // One wave across the whole rail: neighbouring cards continue it instead of restarting.
  float globalX = uWorldCenterX + flatX;
  float phase = (globalX / viewportW + 0.18) * PI * 2.72 - signedVelocity * 0.16;
  float envelopeDistance = abs(globalX) / max(viewportW * 0.56, 1.0);
  float envelopeDepth = -pow(min(envelopeDistance, 1.65), 1.48) * min(viewportW * 0.115, 220.0);
  float depthAmplitude = min(viewportW * 0.055, 110.0) * (1.0 + speed * 0.14);
  float baseDepth = cos(phase) * depthAmplitude;
  float harmonicDepth = sin(phase * 0.5 - 0.34) * depthAmplitude * 0.075;
  float motionDepth = sin(phase * 1.7 + signedVelocity * 0.24) * speed * depthAmplitude * 0.18;
  float verticalAmplitude = min(viewportH * 0.012, 12.0);
  float globalY = sin(phase * 0.5 - 0.18) * verticalAmplitude
    + cos(phase * 1.05 + 0.25) * signedVelocity * verticalAmplitude * 0.24;
  float twist = sin(phase * 0.88 + 0.18) * ny * min(viewportW * 0.009, 17.0) * (1.0 + speed * 0.42);
  float membrane = sin(aUv.y * PI) * cos(phase * 1.12) * speed * min(viewportW * 0.0055, 10.0) * 0.812;

  vec3 waved = vec3(flatX, flatY + globalY * WAVE, (envelopeDepth + baseDepth + harmonicDepth + motionDepth + twist + membrane) * WAVE);

  // Hover presses a soft lens into the surface under the pointer.
  vec2 pd = aUv - uPointer;
  float pressure = exp(-dot(pd, pd) * 18.0) * uHover * galleryMix;
  float radial = 1.0 - clamp(length(pd) / 0.42, 0.0, 1.0);
  waved.z += pressure * uPlaneSize.x * 0.056;
  waved.x += pd.x * pressure * uPlaneSize.x * 0.016;
  waved.y += pd.y * pressure * uPlaneSize.y * 0.018;
  waved.z += radial * radial * uHover * uPlaneSize.x * 0.008 * galleryMix;

  vec3 p = mix(waved, vec3(flatX, flatY, 0.0), flatten);

  float slope = -sin(phase) * depthAmplitude * WAVE * (PI * 2.72 / viewportW);
  vCurve = mix(1.0 / sqrt(1.0 + slope * slope), 1.0, flatten);
  vEdge = abs(nx);
  gl_Position = uProjection * vec4(p + uOffset - vec3(0.0, 0.0, ${CAMERA_Z.toFixed(1)}), 1.0);
}`;

const cardFragment = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
in float vCurve;
in float vEdge;
uniform sampler2D uMap;
uniform sampler2D uTitleMap;
uniform sampler2D uAffordanceMap;
uniform vec2 uTextureSize;
uniform vec2 uPlaneSize;
uniform vec2 uPointer;
uniform float uVelocity;
uniform float uHover;
uniform float uSheet;
uniform float uOpacity;
uniform float uCorner;
uniform float uRail;
uniform float uTime;
uniform float uTitleOpacity;
uniform float uAffordanceOpacity;
out vec4 fragColor;

vec2 coverUv(vec2 uv, vec2 planeSize, vec2 texSize) {
  float planeAspect = planeSize.x / max(planeSize.y, 1.0);
  float texAspect = texSize.x / max(texSize.y, 1.0);
  vec2 outUv = uv;
  if (planeAspect > texAspect) outUv.y = (uv.y - 0.5) * (texAspect / planeAspect) + 0.5;
  else outUv.x = (uv.x - 0.5) * (planeAspect / texAspect) + 0.5;
  return outUv;
}

float roundedMask(vec2 uv, vec2 size, float radius) {
  vec2 p = abs((uv - 0.5) * size) - (size * 0.5 - vec2(radius));
  float d = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0) - radius;
  return 1.0 - smoothstep(-1.5, 0.0, d);
}

void main() {
  float velocity = clamp(uVelocity / 42.0, -1.4, 1.4);
  vec2 hoverDelta = vUv - uPointer;
  float hoverDistance = length(hoverDelta);
  float field = exp(-(hoverDistance * hoverDistance) / 0.0256) * uHover * (1.0 - uSheet);
  vec2 hoverUv = vUv - hoverDelta * field * 0.027;
  hoverUv += vec2(-hoverDelta.y, hoverDelta.x) * sin(hoverDistance * 22.0 - uTime * 2.0) * field * 0.000525;
  vec2 uv = coverUv(hoverUv, uPlaneSize, uTextureSize);

  // RGB channels split along the direction of travel as the rail speeds up.
  vec2 aberration = vec2(velocity * 0.0046, abs(velocity) * 0.00072);
  vec3 media = abs(velocity) < 0.012
    ? texture(uMap, uv).rgb
    : vec3(texture(uMap, uv + aberration).r, texture(uMap, uv).g, texture(uMap, uv - aberration).b);

  float away = 1.0 - uSheet;
  float side = min(abs(uRail), 1.7);
  float shade = (1.0 - side * 0.115 * away) * mix(0.7, 1.0, clamp(vCurve, 0.0, 1.0)) * (1.0 - vEdge * vEdge * 0.16 * away);
  float sheen = sin((vUv.x * 0.7 + vUv.y) * 7.0 + uTime * 0.45) * 0.01 * abs(velocity) * away;
  media = media * shade + sheen;

  // Overlay textures are premultiplied, so composite them with "over".
  vec4 titleLayer = texture(uTitleMap, vUv) * uTitleOpacity * away;
  media = media * (1.0 - titleLayer.a) + titleLayer.rgb;
  vec4 affordanceLayer = texture(uAffordanceMap, vUv) * uAffordanceOpacity * away;
  media = media * (1.0 - affordanceLayer.a) + affordanceLayer.rgb;

  vec3 color = mix(media, vec3(1.0), uSheet);
  float alpha = roundedMask(vUv, uPlaneSize, uCorner) * uOpacity;
  if (alpha < 0.002) discard;
  fragColor = vec4(color * alpha, alpha);
}`;

const gridVertex = /* glsl */ `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.999, 1.0);
}`;

const gridFragment = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform float uOpacity;
uniform float uScroll;
uniform vec2 uResolution;
out vec4 fragColor;

float line(float value, float width) {
  float d = abs(fract(value - 0.5) - 0.5) / max(fwidth(value), 0.00001);
  return 1.0 - smoothstep(0.0, width, d);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  // A receding floor grid below the horizon and faint stars above it.
  float horizon = 0.43;
  float floorDepth = horizon - vUv.y;
  float alpha = 0.0;
  if (floorDepth > 0.0) {
    float invDepth = 0.075 / max(floorDepth, 0.006);
    float gx = (vUv.x - 0.5) * invDepth * 16.0 * (uResolution.x / uResolution.y) / 1.6;
    float gz = invDepth * 2.4 + uScroll;
    float fade = smoothstep(0.012, 0.075, floorDepth) * (1.0 - smoothstep(0.36, 0.53, floorDepth));
    alpha += max(line(gx, 0.95), line(gz, 1.05)) * 0.2 * fade;
  } else {
    vec2 grid = vUv * vec2(210.0, 118.0);
    float star = step(0.9825, hash21(floor(grid))) * (1.0 - smoothstep(0.02, 0.1, length(fract(grid) - 0.5)));
    alpha += star * 0.17 * smoothstep(horizon + 0.015, horizon + 0.16, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));
  }
  alpha += exp(-pow((vUv.x - 0.5) * 3.1, 2.0) - pow((vUv.y - horizon) * 12.0, 2.0)) * 0.045;
  alpha *= uOpacity;
  fragColor = vec4(vec3(0.5) * alpha, alpha);
}`;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2);
const smoothRange = (value: number, start: number, end: number) => {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
const cardCorner = (rect: Rect) => Math.min(26, Math.max(14, Math.min(rect.width, rect.height) * 0.045));

function drawOverlay(title: string, aspect: number, layer: "title" | "affordance", fontFamily: string) {
  const canvas = document.createElement("canvas");
  const width = 1024;
  const height = Math.max(420, Math.round(width / Math.max(aspect, 0.8)));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const inset = height * 0.055;
  const fontSize = height * 0.048;
  const pillHeight = fontSize * 1.95;
  const centerY = height - inset - pillHeight / 2;

  if (layer === "title") {
    context.font = `500 ${fontSize}px ${fontFamily}`;
    context.textBaseline = "middle";
    const padX = fontSize * 0.68;
    context.beginPath();
    context.roundRect(inset, centerY - pillHeight / 2, context.measureText(title).width + padX * 2, pillHeight, pillHeight / 2);
    context.fillStyle = "rgba(12, 12, 12, 0.84)";
    context.fill();
    context.fillStyle = "#ffffff";
    context.fillText(title, inset + padX, centerY + fontSize * 0.05);
  } else {
    const radius = pillHeight * 0.62;
    const cx = width - inset - radius;
    const cy = height - inset - radius;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fillStyle = "#f55733";
    context.fill();
    const arm = radius * 0.42;
    context.strokeStyle = "#ffffff";
    context.lineWidth = Math.max(2, radius * 0.1);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(cx - arm, cy + arm);
    context.lineTo(cx + arm, cy - arm);
    context.moveTo(cx - arm * 0.15, cy - arm);
    context.lineTo(cx + arm, cy - arm);
    context.lineTo(cx + arm, cy + arm * 0.15);
    context.stroke();
  }
  return canvas;
}

function compile(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram();
  const shaders = [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const;
  for (const [type, source] of shaders) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      return null;
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

export class ShowcaseRenderer {
  private readonly entries: CardEntry[] = [];
  private readonly cardUniforms = new Map<string, WebGLUniformLocation | null>();
  private readonly gridUniforms = new Map<string, WebGLUniformLocation | null>();
  private readonly buffers: WebGLBuffer[] = [];
  private readonly abort = new AbortController();
  private readonly projection = new Float32Array(16);
  private flight: Flight | null = null;
  private lastTime = 0;
  private cssWidth = 0;
  private cssHeight = 0;
  private gridOpacity = 0;
  private gridScroll = 0;
  private indexCount = 0;
  private lost = false;

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly gl: WebGL2RenderingContext,
    private readonly cardProgram: WebGLProgram,
    private readonly gridProgram: WebGLProgram,
    private readonly planeVao: WebGLVertexArrayObject,
    private readonly gridVao: WebGLVertexArrayObject,
    private readonly sheetRadius: number,
    private readonly callbacks: RendererCallbacks,
  ) {
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.lost = true;
      this.callbacks.onContextLost?.();
    }, { signal: this.abort.signal });
  }

  static create(canvas: HTMLCanvasElement, cards: RendererCard[], options: { sheetRadius: number; fontFamily: string } & RendererCallbacks) {
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "high-performance" });
    if (!gl) return null;
    const cardProgram = compile(gl, cardVertex, cardFragment);
    const gridProgram = compile(gl, gridVertex, gridFragment);
    const planeVao = gl.createVertexArray();
    const gridVao = gl.createVertexArray();
    if (!cardProgram || !gridProgram) return null;

    const renderer = new ShowcaseRenderer(canvas, gl, cardProgram, gridProgram, planeVao, gridVao, options.sheetRadius, options);
    renderer.buildGeometry();
    for (const card of cards) renderer.addCard(card, options.fontFamily);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    return renderer;
  }

  private buildGeometry() {
    const { gl } = this;
    const columns = 80;
    const rows = 48;
    const uvs = new Float32Array((columns + 1) * (rows + 1) * 2);
    const indices = new Uint16Array(columns * rows * 6);
    let u = 0;
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= columns; x++) {
        uvs[u++] = x / columns;
        uvs[u++] = y / rows;
      }
    }
    let i = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const a = y * (columns + 1) + x;
        const b = a + columns + 1;
        indices.set([a, b, a + 1, b, b + 1, a + 1], i);
        i += 6;
      }
    }
    this.indexCount = indices.length;

    gl.bindVertexArray(this.planeVao);
    this.bindAttribute(this.cardProgram, "aUv", uvs);
    const indexBuffer = gl.createBuffer();
    this.buffers.push(indexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(this.gridVao);
    this.bindAttribute(this.gridProgram, "aPosition", new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
    gl.bindVertexArray(null);
  }

  private bindAttribute(program: WebGLProgram, name: string, data: Float32Array) {
    const { gl } = this;
    const buffer = gl.createBuffer();
    this.buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  }

  private createTexture(fill: [number, number, number, number]) {
    const { gl } = this;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(fill));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  private upload(texture: WebGLTexture, source: TexImageSource, premultiply: boolean) {
    const { gl } = this;
    if (this.lost) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  }

  private addCard(card: RendererCard, fontFamily: string) {
    const entry: CardEntry = {
      id: card.id,
      image: card.image,
      texture: this.createTexture([24, 24, 24, 255]),
      titleTexture: this.createTexture([0, 0, 0, 0]),
      affordanceTexture: this.createTexture([0, 0, 0, 0]),
      pose: { left: 0, top: 0, width: 1, height: 1, worldCenterX: 0, rail: 0, sheet: 0, flatten: 0, hover: 0, title: 1, affordance: 0, velocity: 0, corner: 20 },
      pointer: [0.5, 0.5],
      opacity: 0,
      inSheet: false,
      initialized: false,
    };
    this.entries.push(entry);

    // The DOM <img> picks its own responsive source; re-upload whenever it (re)loads.
    const uploadImage = () => {
      if (card.image.naturalWidth > 0) this.upload(entry.texture, card.image, false);
    };
    if (card.image.complete) uploadImage();
    card.image.addEventListener("load", uploadImage, { signal: this.abort.signal });

    const drawTitles = () => {
      if (this.abort.signal.aborted) return;
      this.upload(entry.titleTexture, drawOverlay(card.title, card.aspect, "title", fontFamily), true);
      this.upload(entry.affordanceTexture, drawOverlay(card.title, card.aspect, "affordance", fontFamily), true);
    };
    document.fonts.load(`500 32px ${fontFamily}`).then(drawTitles, drawTitles);
  }

  private resize(width: number, height: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, width > 1800 ? 1.5 : 1.75);
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    if (width !== this.cssWidth || height !== this.cssHeight) {
      this.cssWidth = width;
      this.cssHeight = height;
      // At z = 0 one world unit is one CSS pixel, so planes can mirror DOM rects exactly.
      const f = (2 * CAMERA_Z) / height;
      const near = 1;
      const far = 4000;
      const nf = 1 / (near - far);
      this.projection.set([f / (width / height), 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    }
    this.gl.viewport(0, 0, pixelWidth, pixelHeight);
  }

  open(id: string, time: number) {
    const entry = this.entries.find((item) => item.id === id);
    if (!entry) return;
    for (const other of this.entries) {
      if (other !== entry && other.inSheet) {
        other.inSheet = false;
        other.opacity = 0;
      }
    }
    if (!entry.initialized) {
      entry.inSheet = true;
      this.callbacks.onOpenReveal?.(id);
      this.callbacks.onOpenComplete?.(id);
      return;
    }
    this.flight = { id, mode: "open", start: time, from: { ...entry.pose }, revealed: false };
  }

  close(id: string, sheetRect: Rect, time: number) {
    const entry = this.entries.find((item) => item.id === id);
    for (const other of this.entries) {
      if (other.inSheet && other !== entry) other.opacity = 0;
      other.inSheet = false;
    }
    if (!entry) {
      this.callbacks.onCloseComplete?.(id);
      return;
    }
    Object.assign(entry.pose, sheetRect, { worldCenterX: 0, rail: 0, sheet: 1, flatten: 1, hover: 0, title: 0, affordance: 0, velocity: 0, corner: this.sheetRadius });
    entry.opacity = 1;
    entry.initialized = true;
    this.flight = { id, mode: "close", start: time, from: { ...entry.pose }, revealed: true };
  }

  render(input: FrameInput) {
    if (this.lost) return;
    const { gl } = this;
    const dt = Math.min(0.05, Math.max(0.008, (input.time - this.lastTime) / 1000));
    this.lastTime = input.time;
    this.resize(input.width, input.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.gridOpacity = damp(this.gridOpacity, input.galleryVisible ? 1 : 0, 6, dt);
    this.gridScroll += input.velocity * dt * 0.012;
    if (this.gridOpacity > 0.002) {
      gl.useProgram(this.gridProgram);
      gl.uniform1f(this.uniform(this.gridProgram, this.gridUniforms, "uOpacity"), this.gridOpacity);
      gl.uniform1f(this.uniform(this.gridProgram, this.gridUniforms, "uScroll"), this.gridScroll);
      gl.uniform2f(this.uniform(this.gridProgram, this.gridUniforms, "uResolution"), input.width, input.height);
      gl.bindVertexArray(this.gridVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    const flight = this.flight;
    const duration = flight?.mode === "open" ? 610 : 540;
    const raw = flight ? clamp01((input.time - flight.start) / duration) : 1;
    const draws: { entry: CardEntry; order: number }[] = [];

    for (const entry of this.entries) {
      const rect = input.cards.get(entry.id) ?? null;
      if (flight?.id === entry.id) {
        this.updateFlight(entry, flight, raw, rect, input);
        draws.push({ entry, order: Number.POSITIVE_INFINITY });
        continue;
      }
      if (entry.inSheet || !rect) continue;
      this.updateCard(entry, rect, input, dt);
      const visible = rect.left + rect.width > -300 && rect.left < input.width + 300 && entry.opacity > 0.004;
      if (visible) draws.push({ entry, order: -Math.abs(entry.pose.rail) });
    }

    draws.sort((a, b) => a.order - b.order);
    gl.useProgram(this.cardProgram);
    gl.bindVertexArray(this.planeVao);
    gl.uniformMatrix4fv(this.uniform(this.cardProgram, this.cardUniforms, "uProjection"), false, this.projection);
    gl.uniform2f(this.uniform(this.cardProgram, this.cardUniforms, "uViewport"), input.width, input.height);
    gl.uniform1f(this.uniform(this.cardProgram, this.cardUniforms, "uTime"), input.time / 1000);
    for (const { entry } of draws) this.drawCard(entry, input);
    gl.bindVertexArray(null);

    if (flight) {
      // Reveal the sheet copy once the plane is mostly flat, so text never sits on a curved edge.
      if (flight.mode === "open" && !flight.revealed && raw >= 0.58) {
        flight.revealed = true;
        this.callbacks.onOpenReveal?.(flight.id);
      }
      if (raw >= 1) {
        this.flight = null;
        const entry = this.entries.find((item) => item.id === flight.id);
        if (flight.mode === "open") {
          if (entry) entry.inSheet = true;
          this.callbacks.onOpenComplete?.(flight.id);
        } else {
          this.callbacks.onCloseComplete?.(flight.id);
        }
      }
    }
  }

  private updateCard(entry: CardEntry, rect: Rect, input: FrameInput, dt: number) {
    const { pose } = entry;
    const centerX = rect.left + rect.width / 2 - input.width / 2;
    const hovered = input.hoveredId === entry.id ? 1 : 0;
    Object.assign(pose, rect);
    pose.worldCenterX = centerX;
    pose.rail = Math.max(-2, Math.min(2, centerX / (input.width / 2)));
    pose.corner = cardCorner(rect);
    pose.sheet = damp(pose.sheet, 0, 10.5, dt);
    pose.flatten = damp(pose.flatten, 0, 9, dt);
    pose.hover = damp(pose.hover, hovered, 7, dt);
    pose.title = damp(pose.title, 1, 8, dt);
    pose.affordance = damp(pose.affordance, hovered, 10, dt);
    pose.velocity = damp(pose.velocity, input.velocity, 13, dt);
    if (!entry.initialized) {
      entry.initialized = true;
      entry.opacity = input.galleryVisible ? 1 : 0;
    }
    entry.opacity = damp(entry.opacity, input.galleryVisible ? 1 : 0, 9, dt);
    entry.pointer[0] = clamp01((input.pointerX - rect.left) / rect.width);
    entry.pointer[1] = 1 - clamp01((input.pointerY - rect.top) / rect.height);
  }

  private updateFlight(entry: CardEntry, flight: Flight, raw: number, rect: Rect | null, input: FrameInput) {
    const { pose } = entry;
    const { from } = flight;
    entry.opacity = 1;
    if (flight.mode === "open") {
      const to = input.sheetRect ?? from;
      const eased = easeOutExpo(raw);
      const railProgress = smoothRange(raw, 0.3, 0.9);
      pose.left = lerp(from.left, to.left, eased);
      pose.top = lerp(from.top, to.top, eased);
      pose.width = lerp(from.width, to.width, eased);
      pose.height = lerp(from.height, to.height, eased);
      pose.sheet = lerp(from.sheet, 1, smoothRange(raw, 0.12, 0.56));
      pose.flatten = lerp(from.flatten, 1, smoothRange(raw, 0.46, 0.96));
      pose.rail = lerp(from.rail, 0, railProgress);
      pose.worldCenterX = lerp(from.worldCenterX, 0, railProgress);
      pose.hover = lerp(from.hover, 0, smoothRange(raw, 0.06, 0.42));
      pose.title = lerp(from.title, 0, smoothRange(raw, 0.16, 0.5));
      pose.affordance = lerp(from.affordance, 0, smoothRange(raw, 0.04, 0.28));
      pose.velocity = lerp(from.velocity, 0, smoothRange(raw, 0.18, 0.7));
      pose.corner = lerp(from.corner, this.sheetRadius, eased);
      return;
    }

    const to = rect ?? from;
    const eased = easeInOutQuart(raw);
    const centerX = to.left + to.width / 2 - input.width / 2;
    const railProgress = smoothRange(raw, 0.12, 0.82);
    pose.left = lerp(from.left, to.left, eased);
    pose.top = lerp(from.top, to.top, eased);
    pose.width = lerp(from.width, to.width, eased);
    pose.height = lerp(from.height, to.height, eased);
    pose.sheet = lerp(1, 0, smoothRange(raw, 0.2, 0.68));
    pose.flatten = lerp(1, 0, smoothRange(raw, 0.18, 0.78));
    pose.rail = lerp(0, Math.max(-2, Math.min(2, centerX / (input.width / 2))), railProgress);
    pose.worldCenterX = lerp(0, centerX, railProgress);
    pose.hover = 0;
    pose.title = lerp(0, 1, smoothRange(raw, 0.52, 0.9));
    pose.affordance = 0;
    pose.velocity = lerp(0, input.velocity, smoothRange(raw, 0.58, 0.94));
    pose.corner = lerp(this.sheetRadius, cardCorner(to), eased);
  }

  private drawCard(entry: CardEntry, input: FrameInput) {
    const { gl, cardProgram: program, cardUniforms: cache } = this;
    const { pose, image } = entry;
    const set1 = (name: string, value: number) => gl.uniform1f(this.uniform(program, cache, name), value);
    const set2 = (name: string, x: number, y: number) => gl.uniform2f(this.uniform(program, cache, name), x, y);

    gl.uniform3f(
      this.uniform(program, cache, "uOffset"),
      pose.left + pose.width / 2 - input.width / 2,
      input.height / 2 - (pose.top + pose.height / 2),
      0,
    );
    set2("uPlaneSize", Math.max(pose.width, 1), Math.max(pose.height, 1));
    set2("uPointer", entry.pointer[0], entry.pointer[1]);
    set2("uTextureSize", image.naturalWidth || 16, image.naturalHeight || 9);
    set1("uWorldCenterX", pose.worldCenterX);
    set1("uVelocity", pose.velocity);
    set1("uHover", pose.hover);
    set1("uFlatten", pose.flatten);
    set1("uSheet", pose.sheet);
    set1("uRail", pose.rail);
    set1("uCorner", pose.corner);
    set1("uOpacity", entry.opacity);
    set1("uTitleOpacity", pose.title);
    set1("uAffordanceOpacity", pose.affordance);

    const textures = [entry.texture, entry.titleTexture, entry.affordanceTexture];
    ["uMap", "uTitleMap", "uAffordanceMap"].forEach((name, unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, textures[unit]);
      gl.uniform1i(this.uniform(program, cache, name), unit);
    });
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  private uniform(program: WebGLProgram, cache: Map<string, WebGLUniformLocation | null>, name: string) {
    if (!cache.has(name)) cache.set(name, this.gl.getUniformLocation(program, name));
    return cache.get(name) ?? null;
  }

  dispose() {
    const { gl } = this;
    this.abort.abort();
    if (this.lost) return;
    for (const entry of this.entries) {
      gl.deleteTexture(entry.texture);
      gl.deleteTexture(entry.titleTexture);
      gl.deleteTexture(entry.affordanceTexture);
    }
    for (const buffer of this.buffers) gl.deleteBuffer(buffer);
    gl.deleteVertexArray(this.planeVao);
    gl.deleteVertexArray(this.gridVao);
    gl.deleteProgram(this.cardProgram);
    gl.deleteProgram(this.gridProgram);
  }
}
