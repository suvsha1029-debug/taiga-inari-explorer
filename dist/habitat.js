import * as THREE from 'three';

// Layer snow onto upward-facing surfaces, preserving existing bark/wind shaders.
export function snowMaterial(material,uniform){
  const previous=material.onBeforeCompile;
  material.onBeforeCompile=function(s,r){previous.call(this,s,r);s.uniforms.uSnowCover=uniform;
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying float vSnowUp; varying vec3 vSnowPos;').replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 snowNormal=normal; vec4 snowP=vec4(position,1.);
      #ifdef USE_INSTANCING
      snowNormal=mat3(instanceMatrix)*snowNormal; snowP=instanceMatrix*snowP;
      #endif
      vSnowUp=normalize(mat3(modelMatrix)*snowNormal).y; vSnowPos=(modelMatrix*snowP).xyz;`);
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uSnowCover; varying float vSnowUp; varying vec3 vSnowPos;').replace('#include <color_fragment>',`#include <color_fragment>
      float snowMask=smoothstep(.08,.65,vSnowUp)*(.88+.12*sin(vSnowPos.x*2.1+vSnowPos.z*1.7));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.93,.98),snowMask*uSnowCover);`);
  };material.customProgramCacheKey=()=> 'habitat-snow-v1-'+previous.toString();material.needsUpdate=true;
}

export function createHabitat({scene,placements,sample,ground,base,waterLevel,W,rand,nature,snow}){
  const plants=new THREE.Group(),stones=new THREE.Group();scene.add(plants,stones);
  const materials=new Set(),batches=[],d=new THREE.Object3D();let relief=2,current='autumn';
  const bark=new THREE.MeshStandardMaterial({color:'#625044',roughness:1});
  const oakMat=new THREE.MeshStandardMaterial({color:'#b37e32',roughness:.9,side:THREE.DoubleSide});
  const willowMat=new THREE.MeshStandardMaterial({color:'#c7b34d',roughness:.88,side:THREE.DoubleSide});
  const shrubMat=new THREE.MeshStandardMaterial({color:'#aa4c32',roughness:1,side:THREE.DoubleSide});
  const berryMat=new THREE.MeshStandardMaterial({color:'#405da8',roughness:.55});
  const rockMat=new THREE.MeshStandardMaterial({color:'#707975',roughness:1,flatShading:true});
  const sandMat=new THREE.MeshStandardMaterial({color:'#c0ac7c',roughness:1});
  for(const m of [bark,oakMat,willowMat,shrubMat,berryMat,rockMat,sandMat]){snowMaterial(m,snow);materials.add(m)}
  function batch(geometry,material,records,parent=plants){const mesh=new THREE.InstancedMesh(geometry,material,records.length);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);batches.push({mesh,records});return mesh}
  const rec=(x,z,y,sx,sy,sz,rx=0,ry=0,rz=0)=>({x,z,h:sample(x,z)-base,y,sx,sy,sz,rx,ry,rz});
  const logs=[],oakLeaves=[],willowLeaves=[],bushes=[],berries=[],rocks=[];
  const trunkGeo=new THREE.CylinderGeometry(.45,.75,1,7),roundGeo=new THREE.IcosahedronGeometry(1,1);
  const grove=nature.anchor;
  // Pick a real shoreline, with an open stretch of water in front of it.
  let shore=null,best=Infinity;
  for(const p of placements){if(p.h+base>132)continue;const gx=sample(p.x+35,p.z)-sample(p.x-35,p.z),gz=sample(p.x,p.z+35)-sample(p.x,p.z-35);const len=Math.hypot(gx,gz);if(len<.8)continue;const nx=gx/len,nz=gz/len;if(sample(p.x-nx*140,p.z-nz*140)>waterLevel+.5)continue;const score=Math.hypot(p.x-grove.x,p.z-grove.z);if(score<best){best=score;shore={x:p.x,z:p.z,nx,nz}}}
  if(!shore)shore={x:grove.x,z:grove.z,nx:0,nz:1};
  const local=(t,n)=>({x:shore.x+shore.nz*t+shore.nx*n,z:shore.z-shore.nx*t+shore.nz*n});
  // Set the beach edge at the actual elevation contour.
  for(let i=0;i<35&&sample(shore.x,shore.z)>waterLevel+.8;i++){shore.x-=shore.nx*3;shore.z-=shore.nz*3}
  const oakPoints=[];
  for(let i=0;i<95;i++){const a=rand()*6.28,r=48+rand()*170,x=grove.x+Math.cos(a)*r,z=grove.z+Math.sin(a)*r;if(sample(x,z)>125)oakPoints.push({x,z,s:13+rand()*10,a})}
  for(const p of oakPoints){logs.push(rec(p.x,p.z,p.s*.34,1.7,p.s*.68,1.7,0,p.a));for(let j=0;j<6;j++){const a=p.a+j*2.4,x=p.x+Math.cos(a)*p.s*.17,z=p.z+Math.sin(a)*p.s*.17;const branch=rec(x,z,p.s*.55,.5,p.s*.42,.5,Math.sin(a)*.7,a,Math.cos(a)*.7);branch.h=sample(p.x,p.z)-base;logs.push(branch);const leaf=rec(x,z,p.s*(.70+(j%2)*.13),p.s*.31,p.s*.24,p.s*.31,0,a);leaf.h=branch.h;oakLeaves.push(leaf)}}
  const willowPoints=[];
  for(let i=0;i<55;i++){const p=local(-210+rand()*420,15+rand()*75);if(sample(p.x,p.z)>waterLevel+1)willowPoints.push({...p,s:8+rand()*7,a:rand()*6.28})}
  for(const p of willowPoints){logs.push(rec(p.x,p.z,p.s*.4,.8,p.s*.8,.8,.04,p.a,.09));for(let j=0;j<10;j++){const a=p.a+j*6.28/10,x=p.x+Math.cos(a)*p.s*.3,z=p.z+Math.sin(a)*p.s*.3;const b=rec(x,z,p.s*.60,.24,p.s*.40,.24,Math.sin(a)*.9,a,Math.cos(a)*.9);b.h=sample(p.x,p.z)-base;logs.push(b);const l=rec(x,z,p.s*.64,p.s*.13,p.s*.42,p.s*.13,0,a,.12);l.h=b.h;willowLeaves.push(l)}}
  // Low blueberry shrubs are intentionally clustered along the close-up grove.
  const berryAnchor={x:grove.x+10,z:grove.z+5};
  for(let i=0;i<550;i++){const a=rand()*6.28,r=Math.sqrt(rand())*85,x=grove.x+Math.cos(a)*r,z=grove.z+Math.sin(a)*r;if(sample(x,z)<waterLevel+3)continue;const size=.5+rand()*.8;bushes.push(rec(x,z,size*.65,size,size*.65,size,0,a));logs.push(rec(x,z,size*.45,.055,size,.055));for(let j=0;j<7;j++){const a=rand()*6.28,x2=x+Math.cos(a)*size*.78,z2=z+Math.sin(a)*size*.78;const b=rec(x2,z2,size*(.55+rand()*.55),.095,.095,.095);b.h=sample(x,z)-base;berries.push(b)}}
  // Rounded glacial boulders in the woods, with a denser beach scatter.
  for(let i=0;i<placements.length;i+=100){const p=placements[i],size=1+rand()*5;rocks.push(rec(p.x+5,p.z+2,size*.4,size,size*.65,size*.85,rand(),rand()*6,rand()))}
  for(let i=0;i<160;i++){const p=local((rand()-.5)*380,-8+rand()*85),size=.4+Math.pow(rand(),3)*7;rocks.push(rec(p.x,p.z,size*.35,size,size*.6,size*.9,rand(),rand()*6,rand()))}
  const oakMesh=batch(nature.leafGeometry,oakMat,oakLeaves),willowMesh=batch(nature.leafGeometry,willowMat,willowLeaves),shrubs=batch(nature.leafGeometry,shrubMat,bushes),fruit=batch(new THREE.IcosahedronGeometry(1,1),berryMat,berries);batch(trunkGeo,bark,logs);batch(roundGeo,rockMat,rocks,stones);
  const cliff=local(-100,28);const cliffRecords=[];
  for(let i=0;i<17;i++){const p=local(-145+i*5.5,29+Math.sin(i)*4),height=28+Math.sin(i*.6)*8;cliffRecords.push(rec(p.x,p.z,height*.42,8+rand()*3,height*.6,13+rand()*8,.08,rand()*.4,.1))}
  const cliffGeo=new THREE.IcosahedronGeometry(1,1);const cp=cliffGeo.attributes.position;for(let i=0;i<cp.count;i++){cp.setY(i,Math.round(cp.getY(i)*6)/6);cp.setX(i,cp.getX(i)*(1+.11*Math.sin(cp.getY(i)*27)))}cliffGeo.computeVertexNormals();batch(cliffGeo,rockMat,cliffRecords,stones);
  // A locally modelled sandy shelf, following the sampled ground on its inland side.
  const beachGeo=new THREE.PlaneGeometry(320,65,64,16);beachGeo.rotateX(-Math.PI/2);const bp=beachGeo.attributes.position;const beachBase=[];
  for(let i=0;i<bp.count;i++){const t=bp.getX(i),n=bp.getZ(i)+8+Math.sin(t*.025)*8+Math.cos(t*.061)*3,p=local(t,n);const bed=sample(p.x,p.z)-base;const blend=1-Math.pow(Math.abs(t)/160,6);const h=THREE.MathUtils.lerp(bed,Math.max(bed,waterLevel-base+n*.035),blend);bp.setXYZ(i,p.x,h*relief+.17,p.z);beachBase.push(h)}beachGeo.computeVertexNormals();const beach=new THREE.Mesh(beachGeo,sandMat);beach.receiveShadow=true;stones.add(beach);
  const snowflakes=new Float32Array(800*3);for(let i=0;i<800;i++){snowflakes[i*3]=(rand()-.5)*160;snowflakes[i*3+1]=rand()*70;snowflakes[i*3+2]=(rand()-.5)*160}const snowStart=snowflakes.slice();const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowflakes,3));const snowfall=new THREE.Points(snowGeo,new THREE.PointsMaterial({color:'#fff',size:.17,transparent:true,opacity:.8,depthWrite:false}));scene.add(snowfall);snowfall.visible=false;
  function matrices(scale){relief=scale;for(const {mesh,records} of batches){records.forEach((p,i)=>{d.position.set(p.x,p.h*scale+p.y,p.z);d.rotation.set(p.rx,p.ry,p.rz);d.scale.set(p.sx,p.sy,p.sz);d.updateMatrix();mesh.setMatrixAt(i,d.matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere()}for(let i=0;i<bp.count;i++)bp.setY(i,beachBase[i]*scale+.17);bp.needsUpdate=true;beachGeo.computeVertexNormals();beachGeo.computeBoundingSphere()}
  function season(s){current=s;const winter=s==='winter';oakMesh.visible=willowMesh.visible=shrubs.visible=!winter;fruit.visible=!winter;berryMat.color.set(s==='spring'?'#ffe1dc':s==='summer'?'#3457a4':'#273c75');berryMat.roughness=s==='spring'?.9:.5;oakMat.color.set(s==='spring'?'#91ad48':s==='summer'?'#4f772e':'#b77a28');willowMat.color.set(s==='spring'?'#a9bb68':s==='summer'?'#819d5c':'#c5ad4b');shrubMat.color.set(s==='spring'?'#8fa948':s==='summer'?'#427644':'#a33d2b');snowfall.visible=winter;}
  matrices(relief);season(current);
  return{shore,cliff,berryAnchor,local,matrices,season,setVisible(v){plants.visible=v},tick(t,camera){if(snowfall.visible){snowfall.position.set(camera.position.x,camera.position.y-10,camera.position.z);const p=snowGeo.attributes.position;for(let i=0;i<p.count;i++){p.setY(i,((snowStart[i*3+1]-t*2)%70+70)%70)}p.needsUpdate=true}},getViews(){const p=local(100,-60);return[{p:[p.x,Math.max(ground(p.x,p.z),((waterLevel-base)*relief))+25,p.z],t:[cliff.x,ground(cliff.x,cliff.z)+20,cliff.z]},{p:[berryAnchor.x,ground(berryAnchor.x,berryAnchor.z)+2.5,berryAnchor.z],t:[grove.x,ground(grove.x,grove.z)+1,grove.z]}]}};
}


