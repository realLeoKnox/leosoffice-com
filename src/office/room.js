import * as THREE from 'three';

// The low-poly office, modelled from primitives and local CanvasTextures (no external assets).
// Returns plain three.js objects; React Three Fiber mounts them with <primitive>.
export function buildRoom({ avatarUrl = '/assets/leo-avatar.jpg', onTexture } = {}){
 const world=new THREE.Group();const lights=new THREE.Group();
 lights.add(new THREE.HemisphereLight(0xfffcf0,0xa8b9b2,1.75));
 const sun=new THREE.DirectionalLight(0xfff0cf,2.8);sun.position.set(-3,7,5);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-6;sun.shadow.camera.right=6;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-6;sun.shadow.camera.near=.1;sun.shadow.camera.far=20;sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;sun.shadow.radius=3;lights.add(sun);
 const fill=new THREE.DirectionalLight(0xd2e6fa,1.0);fill.position.set(5,3,-3);lights.add(fill);
 const materials={
  floor:mat('#d4d9c9'),wall:mat('#b9cfdf'),side:mat('#d1deca'),wood:mat('#dfb98c'),woodEdge:mat('#bb946c'),cream:mat('#faf0d8'),dark:mat('#475856'),metal:mat('#7b8f85'),screen:mat('#314946'),green:mat('#8c9e6f'),leaf:mat('#72916c'),clay:mat('#cb8064'),pink:mat('#dbb4a3'),blue:mat('#83a9c6'),yellow:mat('#e4ba67'),paper:mat('#f9f0d8'),rug:mat('#e7c5ab'),white:mat('#f0eee2'),black:mat('#4a514c')
 };
 function mat(color){return new THREE.MeshStandardMaterial({color,roughness:.85,metalness:0});}
 function mesh(geo,material,x=0,y=0,z=0,parent=world){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,m,x=0,y=0,z=0,p=world){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);}
 function cyl(rt,rb,h,m,x=0,y=0,z=0,p=world,segments=32){return mesh(new THREE.CylinderGeometry(rt,rb,h,segments),m,x,y,z,p);}
 function sphere(r,m,x,y,z,p=world){return mesh(new THREE.SphereGeometry(r,20,12),m,x,y,z,p);}
 function rounded(w,h,d,r,m,x,y,z,p=world){
  const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const geo=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:8});geo.translate(0,0,-d/2);const verts=geo.getAttribute("position"),uv=geo.getAttribute("uv");for(let i=0;i<uv.count;i++)uv.setXY(i,(verts.getX(i)+w/2)/w,(verts.getY(i)+h/2)/h);return mesh(geo,m,x,y,z,p);
 }
 // An open, cut-away room. Everything is modelled locally from geometry.
 box(5.7,.18,4.4,materials.floor,0,-.13,0);
 box(5.7,3.7,.13,materials.wall,0,1.66,-2.16);
 box(.13,3.7,4.4,materials.side,-2.79,1.66,0);
 box(5.7,.08,.19,materials.cream,0,3.55,-2.16);
 box(.19,.08,4.4,materials.cream,-2.79,3.55,0);
 box(5.55,.13,.1,materials.cream,0,.05,-2.06);
 box(.1,.13,4.15,materials.cream,-2.69,.05,0);
 // Window, sill, and a small patch of sky.
 rounded(1.7,1.85,.09,.46,materials.cream,-1.13,2.18,-2.045);
 const skyCanvas=document.createElement('canvas');skyCanvas.width=256;skyCanvas.height=300;const sky=skyCanvas.getContext('2d');
 const gradient=sky.createLinearGradient(0,0,0,300);gradient.addColorStop(0,'#9cc4df');gradient.addColorStop(1,'#f2e8bd');sky.fillStyle=gradient;sky.fillRect(0,0,256,300);sky.fillStyle='#fdf3cd';sky.beginPath();sky.arc(180,85,32,0,Math.PI*2);sky.fill();
 const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;
 const skyMat=new THREE.MeshBasicMaterial({map:skyTexture});
 rounded(1.48,1.62,.02,.39,skyMat,-1.13,2.18,-1.98);
 box(.045,1.6,.03,materials.cream,-1.13,2.18,-1.95);box(1.48,.045,.03,materials.cream,-1.13,2.05,-1.95);
 box(1.95,.1,.32,materials.cream,-1.13,1.22,-1.92);
 // A shelf with books and a clock makes it feel inhabited.
 box(1.55,.08,.36,materials.wood,1.36,2.35,-1.99);
 for(let i=0;i<5;i++){const b=box(.12,.32+(i%2)*.07,.2,[materials.clay,materials.paper,materials.green,materials.blue,materials.yellow][i],.93+i*.135,2.56,-1.94);b.rotation.z=i===4?-.2:0;}
 const clock=cyl(.28,.28,.07,materials.cream,1.75,3,-2.025);clock.rotation.x=Math.PI/2;
 box(.018,.15,.03,materials.dark,1.75,3.055,-1.97);const hand=box(.14,.018,.03,materials.dark,1.805,3,-1.965);hand.rotation.z=.35;
 // Pinboard on the side wall.
 const board=rounded(1.5,1.1,.05,.04,materials.wood,-2.68,2.2,.28);board.rotation.y=Math.PI/2;
 for(let i=0;i<2;i++){const note=box(.025,.26,.27,[materials.paper,materials.blue][i],-2.635,2.22+(i===1?.2:-.12),-.22+i*.3);note.rotation.x=(i-1)*.15;sphere(.025,materials.clay,-2.61,note.position.y+.08,note.position.z);}
 // Leo's avatar as a polaroid pinned to the board: "Leo was here."
 const polaroidCanvas=document.createElement('canvas');polaroidCanvas.width=320;polaroidCanvas.height=400;const pc=polaroidCanvas.getContext('2d');
 const drawPolaroid=(img)=>{pc.fillStyle='#fbf9f1';pc.fillRect(0,0,320,400);pc.fillStyle='#ffffff';pc.fillRect(22,22,276,276);
  if(img){const s=Math.min(img.naturalWidth,img.naturalHeight);pc.drawImage(img,(img.naturalWidth-s)/2,(img.naturalHeight-s)/2,s,s,22,22,276,276);}
  pc.fillStyle='#66765f';pc.font='italic 34px Georgia, "Times New Roman", serif';pc.textAlign='center';pc.fillText('Leo was here.',160,354);};
 drawPolaroid(null);
 const polaroidTexture=new THREE.CanvasTexture(polaroidCanvas);polaroidTexture.colorSpace=THREE.SRGBColorSpace;polaroidTexture.anisotropy=4;
 const polaroid=new THREE.Group();polaroid.position.set(-2.622,2.2,.66);polaroid.rotation.y=Math.PI/2;world.add(polaroid);
 const photo=mesh(new THREE.PlaneGeometry(.5,.625),new THREE.MeshStandardMaterial({map:polaroidTexture,roughness:.92,metalness:0}),0,0,0,polaroid);photo.rotation.z=-.07;photo.castShadow=false;
 const tape=box(.19,.065,.006,new THREE.MeshStandardMaterial({color:'#c9d1b8',roughness:.9,transparent:true,opacity:.85}),-.01,.305,.004,polaroid);tape.rotation.z=-.12;tape.castShadow=false;
 const avatar=new Image();avatar.decoding='async';
 avatar.onload=()=>{drawPolaroid(avatar);polaroidTexture.needsUpdate=true;onTexture?.();};
 avatar.src=avatarUrl;
 // Rug and a solid wooden desk.
 const rug=rounded(3.95,2.6,.025,.3,materials.rug,.15,.005,.55);rug.rotation.x=-Math.PI/2;
 for(let i=0;i<7;i++)box(.015,.012,2.25,materials.paper,-1.4+i*.5,.025,.55);
 const desk=new THREE.Group();world.add(desk);
 box(3.5,.14,1.62,materials.wood,0,1.43,-.25,desk);
 box(3.5,.045,1.62,materials.woodEdge,0,1.35,-.25,desk);
 for(const x of [-1.48,1.48])for(const z of [-.85,.35])box(.11,1.28,.11,materials.cream,x,.69,z,desk);
 box(.1,.1,1.3,materials.cream,-1.48,.32,-.25,desk);box(.1,.1,1.3,materials.cream,1.48,.32,-.25,desk);
 box(1.03,.25,1.25,materials.cream,1.06,1.16,-.25,desk);box(.43,.035,.035,materials.woodEdge,1.06,1.17,.395,desk);
 // Interactive objects: computer, books, lamp, and little server.
 const interactives={},pickables=[];
 function item(key){const g=new THREE.Group();world.add(g);interactives[key]={group:g,base:0,hover:0};return g;}
 const computer=item('dev');computer.position.set(-.1,1.51,-.6);interactives.dev.base=1.51;
 rounded(1.27,.83,.075,.055,materials.dark,0,.57,0,computer);
 box(.095,.3,.1,materials.metal,0,.12,0,computer);box(.53,.035,.29,materials.metal,0,-.005,.04,computer);
 const screenCanvas=document.createElement('canvas');screenCanvas.width=640;screenCanvas.height=400;const ctx=screenCanvas.getContext('2d');ctx.fillStyle='#e7ece0';ctx.fillRect(0,0,640,400);
 ctx.fillStyle='#bacbb3';ctx.fillRect(0,0,640,42);ctx.fillStyle='#526857';ctx.font='20px sans-serif';ctx.fillText('Leo’s workspace',28,28);
 ctx.fillStyle='#aab8c4';ctx.fillRect(26,70,153,296);ctx.fillStyle='#f8f5e9';ctx.fillRect(199,70,416,296);
 ctx.fillStyle='#526857';ctx.font='bold 38px sans-serif';ctx.fillText('Hello, world.',225,145);ctx.font='19px sans-serif';ctx.fillText('A little idea, taking shape.',225,183);
 for(let i=0;i<4;i++){ctx.fillStyle=['#d9a88d','#c4cfac','#9db9cc','#d8ca9c'][i];ctx.fillRect(225+(i%2)*178,220+Math.floor(i/2)*62,152,43);}
 ctx.fillStyle='#e7ece0';for(let i=0;i<5;i++)ctx.fillRect(45,95+i*43,112-i*8,9);
 const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;
 rounded(1.14,.7,.008,.025,new THREE.MeshBasicMaterial({map:screenTexture}),0,.57,.043,computer);
 const keyboard=rounded(.8,.28,.025,.035,materials.cream,-.13,1.52,.02);keyboard.rotation.x=-Math.PI/2;
 for(let row=0;row<3;row++)for(let col=0;col<10;col++)box(.046,.01,.035,materials.metal,-.465+col*.07,1.54,-.064+row*.064);
 const mouse=sphere(.075,materials.cream,.54,1.55,.04);mouse.scale.set(.7,.35,1.15);
 const books=item('me');books.position.set(-1.13,1.53,-.02);interactives.me.base=1.53;
 for(let i=0;i<3;i++){const g=new THREE.Group();g.position.y=i*.082;g.rotation.y=[.12,-.12,.07][i];books.add(g);box(.61,.07,.4,[materials.blue,materials.paper,materials.clay][i],0,0,0,g);box(.55,.039,.38,materials.paper,.018,0,.014,g);}
 const notebook=box(.39,.03,.28,materials.green,-.01,.23,0,books);notebook.rotation.y=-.22;
 // Cup with a visible handle and coffee.
 cyl(.085,.065,.15,materials.clay,-.82,1.58,.24);cyl(.071,.071,.005,materials.dark,-.82,1.658,.24);
 const handle=mesh(new THREE.TorusGeometry(.055,.014,8,20),materials.clay,-.92,1.59,.24);handle.rotation.y=Math.PI/2;
 const lamp=item('aploa');lamp.position.set(1.1,1.52,-.62);interactives.aploa.base=1.52;
 cyl(.2,.21,.035,materials.green,0,0,0,lamp);cyl(.021,.021,.63,materials.green,0,.32,0,lamp);
 const shade=cyl(.08,.27,.23,materials.green,-.11,.72,0,lamp);shade.rotation.z=-.35;
 const bulb=sphere(.07,new THREE.MeshBasicMaterial({color:0xffe7ad}),-.15,.63,0,lamp);
 const glow=new THREE.PointLight(0xffd88d,.35,1.4);glow.position.set(-.15,.6,0);lamp.add(glow);
 // Chair: curved, soft blue, and slightly turned away from the desk.
 const chair=new THREE.Group();chair.position.set(-.1,0,1.13);chair.rotation.y=-.25;world.add(chair);
 const seat=rounded(.86,.79,.15,.17,materials.blue,0,.72,0,chair);seat.rotation.x=-Math.PI/2;
 rounded(.86,.78,.13,.18,materials.blue,0,1.13,.39,chair);
 for(const x of [-.29,.29])for(const z of [-.26,.26]){const leg=box(.055,.65,.055,materials.wood,x,.34,z,chair);leg.rotation.z=x>0?-.06:.06;}
 // Server on the floor, separate from the monitor.
 const server=item('agent');server.position.set(1.13,.22,1.2);interactives.agent.base=.22;
 rounded(.43,.42,.49,.06,materials.cream,0,.18,0,server);for(let i=0;i<3;i++)box(.29,.035,.02,materials.metal,0,.1+i*.08,.253,server);
 for(let i=0;i<3;i++)sphere(.016,new THREE.MeshBasicMaterial({color:i===2?0xd4ac68:0x91af75}),.145,.11+i*.08,.267,server);
 // A tall plant with individual leaves.
 cyl(.31,.23,.58,materials.clay,2.03,.29,-.81);cyl(.28,.28,.025,materials.dark,2.03,.59,-.81);
 for(let i=0;i<8;i++){
  const a=i*2.4,r=.13+(i%3)*.06,h=.63+(i%4)*.15;
  const stem=cyl(.014,.018,h,materials.leaf,2.03+Math.cos(a)*r*.4,.58+h/2,-.81+Math.sin(a)*r*.4);stem.rotation.z=Math.cos(a)*.16;
  const leaf=sphere(.22,[materials.leaf,materials.green][i%2],2.03+Math.cos(a)*r,.58+h,-.81+Math.sin(a)*r);leaf.scale.set(.45,1.45,.8);leaf.rotation.set(Math.sin(a)*.4,0,Math.cos(a)*.4);
 }
 // A small poster in the back wall with the user's own initial.
 const poster=rounded(.72,.9,.03,.015,materials.cream,.48,3,-2.045);const mark=box(.035,.38,.015,materials.clay,.36,3,-2.02);box(.27,.035,.015,materials.clay,.48,2.83,-2.02);
 for(const [key,obj] of Object.entries(interactives)){obj.group.traverse(child=>{if(child.isMesh){child.userData.officeKey=key;pickables.push(child);}});}
 const focusTargets={dev:new THREE.Vector3(-.1,1.7,-.4),me:new THREE.Vector3(-.9,1.5,0),aploa:new THREE.Vector3(.8,1.75,-.5),agent:new THREE.Vector3(.8,.7,.9)};
 // Label anchors sit just above each object, in world space.
 const anchors={dev:new THREE.Vector3(-.1,2.66,-.6),me:new THREE.Vector3(-1.13,1.9,-.02),aploa:new THREE.Vector3(.98,2.5,-.62),agent:new THREE.Vector3(1.13,.95,1.2)};
 return {world,lights,interactives,pickables,focusTargets,anchors};
}
