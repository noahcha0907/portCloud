function initParticleCloud() {
  'use strict';
  var CONFIG = {
    instanceCount: 36000, pointSize: 0.1,
    noisePeriod: 0.62, noiseOctaves: 2, noiseAmplitude: 0.51, harmonicGain: 0.77,
    posSpeed: 0.14, exponentMin: 0.15, exponentMax: 4.0,
    harmonicSpreadMin: 1.5, harmonicSpreadMax: 10.0,
    instanceSpread: 0.025, cameraHFOV: 60, cameraNear: 0.1, cameraFar: 1000, cameraZ: 5,
    mouseLerp: 0.15, lightIntensity: 3.0,
    enableRGBDelay: true, rgbDelayFrames: { r: 10, g: 6, b: 2 }, historySize: 12,
    historyResScale: 0.5, radialBlurStrength: 0.15, radialBlurSamples: 16,
    feedbackOpacity: 0.43, feedbackLevelOpacity: 0.5, gamma: 1.0, rgbKeyThreshold: 0.03,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    transparentBackground: true, whiteBackground: true
  };
  var isMobile = navigator.maxTouchPoints > 0;
  if (isMobile) { CONFIG.enableRGBDelay = false; CONFIG.radialBlurSamples = 6; }

  var NOISE = [
    'vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}',
    'vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}',
    'vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}',
    'float snoise(vec3 v){',
    '  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);',
    '  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);',
    '  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;',
    '  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);',
    '  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;',
    '  i=mod289(i);',
    '  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));',
    '  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;',
    '  vec4 j=p-49.0*floor(p*ns.z*ns.z);',
    '  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);',
    '  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);',
    '  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);',
    '  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;',
    '  vec4 sh=-step(h,vec4(0.0));',
    '  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;',
    '  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);',
    '  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));',
    '  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;',
    '  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;',
    '  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));',
    '}',
    'float fbm(vec3 p,float spread,float exponent,int octaves,float gain,float amp){',
    '  float value=0.0;float amplitude=amp;float frequency=1.0;',
    '  for(int i=0;i<4;i++){if(i>=octaves)break;value+=amplitude*snoise(p*frequency);frequency*=spread;amplitude*=gain;}',
    '  return pow(abs(value),exponent)*sign(value);',
    '}'
  ].join('\n');

  var vertParticle = NOISE + '\n' + [
    'attribute float aInstanceIndex;',
    'uniform float uTime;uniform float uPosSpeed;uniform float uExponent;uniform float uHarmonicSpread;',
    'uniform float uNoisePeriod;uniform float uInstanceSpread;uniform float uGridSize;uniform float uPointSize;',
    'uniform float uNoiseAmplitude;uniform float uHarmonicGain;uniform int uNoiseOctaves;',
    'varying float vBrightness;',
    'vec2 hash2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453)-0.5;}',
    'void main(){',
    '  float idx=aInstanceIndex;float gx=mod(idx,uGridSize);float gy=floor(idx/uGridSize);',
    '  vec2 jitter=hash2(vec2(gx,gy))*0.8;',
    '  vec2 sampleBase=(vec2(gx,gy)+jitter)*uInstanceSpread/uNoisePeriod;',
    '  float posX=fbm(vec3(sampleBase,uTime*uPosSpeed),uHarmonicSpread,uExponent,uNoiseOctaves,uHarmonicGain,uNoiseAmplitude);',
    '  float posY=fbm(vec3(sampleBase+vec2(127.1,311.7),uTime*uPosSpeed),uHarmonicSpread,uExponent,uNoiseOctaves,uHarmonicGain,uNoiseAmplitude);',
    '  float posZ=fbm(vec3(sampleBase+vec2(269.5,183.3),uTime*uPosSpeed),uHarmonicSpread,uExponent,uNoiseOctaves,uHarmonicGain,uNoiseAmplitude);',
    '  vec3 pos=vec3(posX,posY,posZ);',
    '  float dist=length(pos);vBrightness=1.0/(1.0+0.3*dist*dist);',
    '  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);gl_PointSize=uPointSize;',
    '}'
  ].join('\n');

  var fragParticle = [
    'precision highp float;',
    'uniform float uLightIntensity;varying float vBrightness;',
    'void main(){float light=vBrightness*uLightIntensity;gl_FragColor=vec4(vec3(light),1.0);}'
  ].join('\n');

  var vertFS = [
    'varying vec2 vUv;',
    'void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}'
  ].join('\n');

  var fragRGBDelay = [
    'precision highp float;uniform sampler2D tRed;uniform sampler2D tGreen;uniform sampler2D tBlue;varying vec2 vUv;',
    'void main(){float r=texture2D(tRed,vUv).r;float g=texture2D(tGreen,vUv).g;float b=texture2D(tBlue,vUv).b;gl_FragColor=vec4(r,g,b,1.0);}'
  ].join('\n');

  var fragRadialBlur = [
    'precision highp float;uniform sampler2D tDiffuse;uniform vec2 uCenter;uniform float uStrength;uniform int uSamples;varying vec2 vUv;',
    'void main(){vec2 dir=vUv-uCenter;vec4 color=vec4(0.0);',
    'for(int i=0;i<24;i++){if(i>=uSamples)break;float t=float(i)/float(uSamples);color+=texture2D(tDiffuse,vUv-dir*t*uStrength);}',
    'gl_FragColor=color/float(uSamples);}'
  ].join('\n');

  var fragAddBlend = [
    'precision highp float;uniform sampler2D tInput1;uniform sampler2D tInput2;uniform float uBlendWeight;varying vec2 vUv;',
    'void main(){vec4 a=texture2D(tInput1,vUv);vec4 b=texture2D(tInput2,vUv);gl_FragColor=a+b*uBlendWeight;}'
  ].join('\n');

  var fragFeedback = [
    'precision highp float;uniform sampler2D tCurrent;uniform sampler2D tFeedback;uniform float uOpacity;varying vec2 vUv;',
    'void main(){vec4 current=texture2D(tCurrent,vUv);current.rgb=current.rgb/(1.0+current.rgb);',
    'vec4 prev=texture2D(tFeedback,vUv);gl_FragColor=mix(current,prev,uOpacity);}'
  ].join('\n');

  var fragLevel = [
    'precision highp float;uniform sampler2D tDiffuse;uniform float uOpacity;varying vec2 vUv;',
    'void main(){vec4 color=texture2D(tDiffuse,vUv);gl_FragColor=color*uOpacity;}'
  ].join('\n');

  var fragFinal = [
    'precision highp float;uniform sampler2D tDiffuse;uniform float uGamma;uniform float uRGBKeyThreshold;varying vec2 vUv;',
    'void main(){vec4 color=texture2D(tDiffuse,vUv);color.rgb=color.rgb/(1.0+color.rgb);',
    'color.rgb=pow(max(color.rgb,vec3(0.0)),vec3(1.0/uGamma));',
    'float brightness=dot(color.rgb,vec3(0.333));float alpha=smoothstep(0.0,uRGBKeyThreshold,brightness);',
    'gl_FragColor=vec4(color.rgb,alpha);}'
  ].join('\n');

  var container = document.getElementById('container');
  if (!container) { container = document.body; }
  container.style.width = container.style.width || '100%';
  container.style.height = container.style.height || '100vh';
  container.style.position = container.style.position || 'relative';
  var W = container.clientWidth || window.innerWidth;
  var H = container.clientHeight || window.innerHeight;
  if (W < 10) W = window.innerWidth;
  if (H < 10) H = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ alpha: CONFIG.transparentBackground, antialias: false, powerPreference: 'high-performance' });
  renderer.setSize(W, H); renderer.setPixelRatio(CONFIG.pixelRatio);
  renderer.setClearColor(0x000000, CONFIG.transparentBackground ? 0 : 1);
  renderer.autoClear = false; container.appendChild(renderer.domElement);
  if (CONFIG.whiteBackground) renderer.domElement.style.filter = 'invert(1)';
  var isLowEnd = !renderer.capabilities.floatFragmentTextures || renderer.capabilities.maxTextureSize < 4096;
  if (isLowEnd) { CONFIG.enableRGBDelay = false; CONFIG.radialBlurSamples = 6; }

  function hfovToVfov(hfov, aspect) { return 2 * Math.atan(Math.tan((hfov * Math.PI / 180) / 2) / aspect) * 180 / Math.PI; }
  var vFOV = hfovToVfov(CONFIG.cameraHFOV, W / H);
  var camera = new THREE.PerspectiveCamera(vFOV, W / H, CONFIG.cameraNear, CONFIG.cameraFar);
  camera.position.z = CONFIG.cameraZ;
  var scene = new THREE.Scene();

  var geo = new THREE.BufferGeometry();
  var pos = new Float32Array(CONFIG.instanceCount * 3);
  var idx = new Float32Array(CONFIG.instanceCount);
  for (var i = 0; i < CONFIG.instanceCount; i++) idx[i] = i;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aInstanceIndex', new THREE.BufferAttribute(idx, 1));
  var pU = {
    uTime:{value:0},uPosSpeed:{value:CONFIG.posSpeed},uExponent:{value:CONFIG.exponentMin},
    uHarmonicSpread:{value:CONFIG.harmonicSpreadMin},uNoisePeriod:{value:CONFIG.noisePeriod},
    uInstanceSpread:{value:CONFIG.instanceSpread},uGridSize:{value:Math.ceil(Math.sqrt(CONFIG.instanceCount))},
    uPointSize:{value:CONFIG.pointSize},uNoiseAmplitude:{value:CONFIG.noiseAmplitude},
    uHarmonicGain:{value:CONFIG.harmonicGain},uNoiseOctaves:{value:CONFIG.noiseOctaves},
    uLightIntensity:{value:CONFIG.lightIntensity}
  };
  scene.add(new THREE.Points(geo, new THREE.ShaderMaterial({uniforms:pU,vertexShader:vertParticle,fragmentShader:fragParticle,transparent:true,depthTest:false,depthWrite:false})));

  function cRT(w,h){return new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,format:THREE.RGBAFormat,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,stencilBuffer:false,depthBuffer:false});}
  var hW=Math.floor(W*CONFIG.historyResScale),hH=Math.floor(H*CONFIG.historyResScale),hT=[];
  if(CONFIG.enableRGBDelay){for(var i=0;i<CONFIG.historySize;i++)hT.push(cRT(hW,hH));}
  var rRT=cRT(W,H),bRT=cRT(W,H),a1RT=cRT(W,H),fA=cRT(W,H),fB=cRT(W,H),fR=fA,fW=fB,l1RT=cRT(W,H),a2RT=cRT(W,H);
  renderer.setRenderTarget(fA);renderer.clear();renderer.setRenderTarget(fB);renderer.clear();renderer.setRenderTarget(null);

  function cM(fs,u){return new THREE.ShaderMaterial({uniforms:u,vertexShader:vertFS,fragmentShader:fs,depthTest:false,depthWrite:false,blending:THREE.NoBlending});}
  var mRD=cM(fragRGBDelay,{tRed:{value:null},tGreen:{value:null},tBlue:{value:null}});
  var mRB=cM(fragRadialBlur,{tDiffuse:{value:null},uCenter:{value:new THREE.Vector2(0.5,0.5)},uStrength:{value:CONFIG.radialBlurStrength},uSamples:{value:CONFIG.radialBlurSamples}});
  var mA1=cM(fragAddBlend,{tInput1:{value:null},tInput2:{value:null},uBlendWeight:{value:0.5}});
  var mFB=cM(fragFeedback,{tCurrent:{value:null},tFeedback:{value:null},uOpacity:{value:CONFIG.feedbackOpacity}});
  var mL1=cM(fragLevel,{tDiffuse:{value:null},uOpacity:{value:CONFIG.feedbackLevelOpacity}});
  var mA2=cM(fragAddBlend,{tInput1:{value:null},tInput2:{value:null},uBlendWeight:{value:1.0}});
  var mFN=cM(fragFinal,{tDiffuse:{value:null},uGamma:{value:CONFIG.gamma},uRGBKeyThreshold:{value:CONFIG.rgbKeyThreshold}});
  if(CONFIG.transparentBackground){mFN.blending=THREE.NormalBlending;mFN.transparent=true;}

  var fC=new THREE.OrthographicCamera(-1,1,1,-1,0,1),fS=new THREE.Scene(),fM=new THREE.Mesh(new THREE.PlaneGeometry(2,2));fS.add(fM);
  function rQ(m,t){fM.material=m;renderer.setRenderTarget(t);renderer.render(fS,fC);}
  function remap(v,a,b,c,d){return c+((v-a)/(b-a))*(d-c);}
  var tE=CONFIG.exponentMin,tS=CONFIG.harmonicSpreadMin;
  function hP(cx,cy){var tx=(cx/W)*2-1,ty=-((cy/H)*2-1);tE=remap(Math.max(0,Math.min(1,tx)),0,1,CONFIG.exponentMin,CONFIG.exponentMax);tS=remap(Math.max(0,Math.min(1,ty)),0,1,CONFIG.harmonicSpreadMin,CONFIG.harmonicSpreadMax);}
  window.addEventListener('mousemove',function(e){hP(e.clientX,e.clientY);});
  if(isMobile){window.addEventListener('touchmove',function(e){if(e.touches.length>0)hP(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});}

  function onResize(w,h){W=w;H=h;renderer.setSize(W,H);renderer.setPixelRatio(CONFIG.pixelRatio);var nv=hfovToVfov(CONFIG.cameraHFOV,W/H);camera.fov=nv;camera.aspect=W/H;camera.updateProjectionMatrix();rRT.setSize(W,H);bRT.setSize(W,H);a1RT.setSize(W,H);fA.setSize(W,H);fB.setSize(W,H);l1RT.setSize(W,H);a2RT.setSize(W,H);if(CONFIG.enableRGBDelay){var hw=Math.floor(W*CONFIG.historyResScale),hh=Math.floor(H*CONFIG.historyResScale);hT.forEach(function(t){t.setSize(hw,hh);});}}
  var ro=new ResizeObserver(function(entries){for(var i=0;i<entries.length;i++){var r=entries[i].contentRect;if(r.width>0&&r.height>0)onResize(r.width,r.height);}});ro.observe(container);

  var clock=new THREE.Clock(),fi=0,running=true;
  function animate(){
    if(!running){requestAnimationFrame(animate);return;}
    requestAnimationFrame(animate);
    pU.uTime.value=clock.getElapsedTime();
    pU.uExponent.value+=(tE-pU.uExponent.value)*CONFIG.mouseLerp;
    pU.uHarmonicSpread.value+=(tS-pU.uHarmonicSpread.value)*CONFIG.mouseLerp;
    if(CONFIG.enableRGBDelay){
      var cs=fi%CONFIG.historySize;renderer.setRenderTarget(hT[cs]);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(scene,camera);
      var md=Math.min(fi,CONFIG.historySize-1),rD=Math.min(CONFIG.rgbDelayFrames.r,md),gD=Math.min(CONFIG.rgbDelayFrames.g,md),bD=Math.min(CONFIG.rgbDelayFrames.b,md);
      var rI=((fi-rD)%CONFIG.historySize+CONFIG.historySize)%CONFIG.historySize,gI=((fi-gD)%CONFIG.historySize+CONFIG.historySize)%CONFIG.historySize,bI=((fi-bD)%CONFIG.historySize+CONFIG.historySize)%CONFIG.historySize;
      mRD.uniforms.tRed.value=hT[rI].texture;mRD.uniforms.tGreen.value=hT[gI].texture;mRD.uniforms.tBlue.value=hT[bI].texture;rQ(mRD,rRT);
    }else{renderer.setRenderTarget(rRT);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(scene,camera);}
    mRB.uniforms.tDiffuse.value=rRT.texture;rQ(mRB,bRT);
    mA1.uniforms.tInput1.value=rRT.texture;mA1.uniforms.tInput2.value=bRT.texture;rQ(mA1,a1RT);
    mFB.uniforms.tCurrent.value=a1RT.texture;mFB.uniforms.tFeedback.value=fR.texture;rQ(mFB,fW);var tmp=fR;fR=fW;fW=tmp;
    mL1.uniforms.tDiffuse.value=fR.texture;rQ(mL1,l1RT);
    mA2.uniforms.tInput1.value=a1RT.texture;mA2.uniforms.tInput2.value=l1RT.texture;rQ(mA2,a2RT);
    mFN.uniforms.tDiffuse.value=a2RT.texture;rQ(mFN,null);fi++;
  }
  animate();
  document.addEventListener('visibilitychange',function(){if(document.hidden){running=false;clock.stop();}else{running=true;clock.start();}});
}
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(initParticleCloud, 100);
} else {
  window.addEventListener('load', initParticleCloud);
}
