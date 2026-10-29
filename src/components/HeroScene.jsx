import { useEffect, useRef, useState } from 'react';
import { createAnimationLoop } from '../lib/animationLoop.mjs';

export default function HeroScene() {
  const host = useRef(null);
  const pausedRef = useRef(false);
  const syncRef = useRef(() => {});
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    const element = host.current;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let destroyed = false, renderer, scene, observer, resize, cleanupPointer, loop;
    let syncScene = () => {};
    let visible = false, started = false;
    const dispose = () => {
      loop?.dispose();
      cleanupPointer?.();
      resize?.disconnect();
      if (scene) {
        const geometries = new Set(), materials = new Set();
        scene.traverse(object => {
          if (object.geometry) geometries.add(object.geometry);
          if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
        });
        geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      }
      renderer?.dispose(); renderer?.domElement.remove();
    };
    async function start() {
      started = true;
      try {
        const { ACESFilmicToneMapping, BoxGeometry, CylinderGeometry, DirectionalLight, Group, HemisphereLight, Mesh, MeshStandardMaterial, MeshBasicMaterial, PerspectiveCamera, SRGBColorSpace, Scene, SphereGeometry, Vector3, WebGLRenderer } = await import('three');
        if (destroyed) return;
        renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = SRGBColorSpace;
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.domElement.setAttribute('aria-hidden', 'true');
        element.appendChild(renderer.domElement);
        scene = new Scene();
        const camera = new PerspectiveCamera(36, 1, 0.1, 30);
        camera.position.set(0, 0.4, 9.8); camera.lookAt(0, 0, 0);
        scene.add(new HemisphereLight(0xffffff, 0x232f3e, 3));
        const key = new DirectionalLight(0xfff1df, 4); key.position.set(-3, 5, 5); scene.add(key);
        const rim = new DirectionalLight(0x88b4dc, 3); rim.position.set(4, -1, 2); scene.add(rim);
        const group = new Group(); scene.add(group);
        const orange = new MeshStandardMaterial({color:0xff9900,emissive:0xff7700,emissiveIntensity:.25,roughness:.24,metalness:.35});
        const barMaterial = new MeshStandardMaterial({color:0x40566b,roughness:.35,metalness:.28,transparent:true,opacity:.9});
        const gridMaterial = new MeshBasicMaterial({color:0x52687a,transparent:true,opacity:.28});
        const barGeometry = new BoxGeometry(.32,1,.35);
        const bars=[];
        for(let i=0;i<12;i++){const bar=new Mesh(barGeometry,barMaterial.clone());group.add(bar);bars.push(bar);}
        const beamGeometry=new CylinderGeometry(.035,.035,1,8);
        const beams=[];
        for(let i=0;i<64;i++){const beam=new Mesh(beamGeometry,orange);group.add(beam);beams.push(beam);}
        for(let i=0;i<7;i++){const line=new Mesh(new BoxGeometry(5.7,.008,.008),gridMaterial);line.position.set(0,-1.5+i*.5,-.32);group.add(line);}
        for(let i=0;i<12;i++){const line=new Mesh(new BoxGeometry(.008,3.2,.008),gridMaterial);line.position.set(-2.75+i*.5,.05,-.32);group.add(line);}
        const head=new Mesh(new SphereGeometry(.09,20,16),orange);group.add(head);
        const glow=new Mesh(new SphereGeometry(.19,20,16),new MeshBasicMaterial({color:0xff9900,transparent:true,opacity:.14}));group.add(glow);
        const particles=[];
        for(let i=0;i<5;i++){const dot=new Mesh(new SphereGeometry(.035,10,8),orange);group.add(dot);particles.push(dot);}
        const from=new Vector3(),to=new Vector3(),direction=new Vector3(),up=new Vector3(0,1,0);
        const chartY=(x,t)=> -.95+(x+2.65)*.43+Math.sin(x*2.7+t*.65)*.10+Math.sin(x*5.4+t*1.3)*.035;
        let targetX = 0, targetY = 0, time = 0, contextLost = false;
        const canRun = () => !destroyed && !contextLost && visible && !document.hidden && !motion.matches && !pausedRef.current;
        const renderFrame = delta => {
          time += delta;
          const phase=time*.22;
          bars.forEach((bar,i)=>{
            const x=-2.7+((i*.49-phase)%5.88+5.88)%5.88;
            const height=Math.max(.15,chartY(x,time)+1.5);
            bar.position.set(x,-1.5+height/2,-.14);bar.scale.y=height;
            bar.material.opacity=Math.min(1,(x+2.7)*2,(2.95-x)*2)*.7;
          });
          beams.forEach((beam,i)=>{
            const x=-2.65+i*5.3/64,next=x+5.3/64;
            from.set(x,chartY(x,time),.2);to.set(next,chartY(next,time),.2);
            direction.subVectors(to,from);beam.position.copy(from).add(to).multiplyScalar(.5);
            beam.scale.y=direction.length();beam.quaternion.setFromUnitVectors(up,direction.normalize());
          });
          head.position.set(2.65,chartY(2.65,time),.2);glow.position.copy(head.position);
          glow.scale.setScalar(1+Math.sin(time*2)*.15);
          particles.forEach((dot,i)=>{const x=-2.65+((time*.7+i*1.06)%5.3);dot.position.set(x,chartY(x,time),.22);});
          if (canRun()) { group.rotation.x+=(targetX-group.rotation.x)*.035; group.rotation.y+=(targetY-group.rotation.y)*.035; }
          renderer.render(scene,camera);
        };
        loop = createAnimationLoop({canRun,render:renderFrame});
        syncScene = () => {
          if (destroyed || contextLost) return;
          loop.sync();
          if (!canRun() && visible && !document.hidden) renderFrame(0);
        };
        syncRef.current = syncScene;
        const pointer = event => { if (!canRun() || event.pointerType === 'touch') return; const r = element.getBoundingClientRect(); targetY = ((event.clientX-r.left)/r.width-.5)*.35; targetX = ((event.clientY-r.top)/r.height-.5)*.22; };
        const leave = () => { targetX=0; targetY=0; };
        const lost = event => { event.preventDefault(); contextLost=true; loop.dispose(); setReady(false); setSupported(false); };
        element.addEventListener('pointermove', pointer); element.addEventListener('pointerleave', leave);
        document.addEventListener('visibilitychange',syncScene);
        motion.addEventListener('change',syncScene);
        renderer.domElement.addEventListener('webglcontextlost',lost);
        cleanupPointer = () => { element.removeEventListener('pointermove',pointer); element.removeEventListener('pointerleave',leave); document.removeEventListener('visibilitychange',syncScene); motion.removeEventListener('change',syncScene); renderer.domElement.removeEventListener('webglcontextlost',lost); syncRef.current=()=>{}; };
        const fit = () => { if (!element.clientWidth || contextLost) return; renderer.setSize(element.clientWidth,element.clientHeight); camera.aspect=element.clientWidth/element.clientHeight; camera.updateProjectionMatrix(); if (visible && !document.hidden) renderFrame(0); };
        resize = new ResizeObserver(fit); resize.observe(element); fit();
        syncScene();
        setReady(true);
      } catch { dispose(); if (!destroyed) {setReady(false);setSupported(false);} }
    }
    observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&!started)start();else syncScene();},{threshold:.05});
    observer.observe(element);
    return () => {destroyed=true;observer.disconnect();dispose();};
  }, []);
  return <div className="hero-3d"><div className="scene-footer">{supported&&ready&&<button className="scene-toggle" type="button" aria-label={paused ? 'Play animation' : 'Pause animation'} title={paused ? 'Play animation' : 'Pause animation'} aria-pressed={paused} onClick={()=>{pausedRef.current=!paused;setPaused(!paused);syncRef.current();}}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">{paused ? <path d="M8 5a1 1 0 0 1 1.5-.87l10 7a1 1 0 0 1 0 1.74l-10 7A1 1 0 0 1 8 19V5Z"/> : <><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></>}</svg></button>}</div><div className="scene-stage" ref={host} role="img" aria-label="Illustrative three-dimensional sales chart with an upward orange line and scrolling charcoal bars. Not actual client data."><svg className={ready?'scene-fallback hidden':'scene-fallback'} viewBox="0 0 400 360" aria-hidden="true"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ff9900" stopOpacity=".3"/><stop offset="1" stopColor="#ff9900" stopOpacity="0"/></linearGradient></defs><g stroke="#536b80" strokeWidth="1" opacity=".35"><path d="M35 70H365M35 130H365M35 190H365M35 250H365M35 310H365"/><path d="M55 55V310M115 55V310M175 55V310M235 55V310M295 55V310M355 55V310"/></g><g fill="#40566b"><rect x="55" y="240" width="23" height="70" rx="3"/><rect x="105" y="215" width="23" height="95" rx="3"/><rect x="155" y="180" width="23" height="130" rx="3"/><rect x="205" y="150" width="23" height="160" rx="3"/><rect x="255" y="115" width="23" height="195" rx="3"/><rect x="305" y="75" width="23" height="235" rx="3"/></g><path d="M40 260L95 230L145 200L200 165L250 130L300 100L355 60V310H40Z" fill="url(#chart-fill)"/><path d="M40 260L95 230L145 200L200 165L250 130L300 100L355 60" stroke="#ff9900" strokeWidth="5" fill="none" strokeLinecap="round"/><circle cx="355" cy="60" r="7" fill="#ff9900"/></svg></div></div>;
}