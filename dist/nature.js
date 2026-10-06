import * as THREE from 'three';
export function createNature({scene,placements,sample,base,ground,rand}){
  const group=new THREE.Group();scene.add(group);
  const anchor=placements.reduce((best,p)=>Math.hypot(p.x+700,p.z-800)<Math.hypot(best.x+700,best.z-800)?p:best,placements[0]);
  placements.forEach(p=>{p.groveClear=Math.hypot(p.x-anchor.x,p.z-anchor.z)<45});
  const birches=placements.filter((p,i)=>i%4===0&&!p.groveClear);birches.forEach(p=>p.birch=true);
  // A small ground-level grove makes the understorey and bark visible at human scale.
  for(let i=0;i<110;i++){const a=rand()*Math.PI*2,r=25+Math.sqrt(rand())*105,x=anchor.x+Math.cos(a)*r,z=anchor.z+Math.sin(a)*r,h=sample(x,z);if(h>123)birches.push({x,z,h:h-base,size:12+rand()*12,r:rand()*6.28,c:rand()})}
  const bark=new THREE.MeshStandardMaterial({color:'#ede7d4',roughness:.95});
  bark.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vBark;').replace('#include <begin_vertex>','#include <begin_vertex>\nvBark=position;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vBark;').replace('#include <color_fragment>','#include <color_fragment>\nfloat scar=step(.76,sin(vBark.y*120.+sin(vBark.x*29.)*2.))*step(.05,sin(vBark.z*31.+vBark.y*25.));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.16,.19,.17),scar*.88);');};
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.20,.42,1,6),bark,birches.length);
  const branches=new THREE.InstancedMesh(new THREE.CylinderGeometry(.07,.17,1,5),bark,birches.length*3);
  const time={value:0};const windChunk='transformed.x+=sin(instanceMatrix[3].x*.13+uWind*.8+position.y*2.)*.13*position.y; transformed.z+=cos(instanceMatrix[3].z*.12+uWind*.6)*.08*position.y;';
  function wind(mat){mat.onBeforeCompile=s=>{s.uniforms.uWind=time;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float uWind;').replace('#include <begin_vertex>','#include <begin_vertex>\n'+windChunk)};return mat}
  const leafMat=wind(new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.85,flatShading:true,side:THREE.DoubleSide}));
  const leafVertices=[];for(let i=0;i<65;i++){const a=rand()*6.28,y=rand()*2-1,r=Math.sqrt(1-y*y)*Math.cbrt(rand()),center=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);const rot=new THREE.Quaternion().setFromEuler(new THREE.Euler(rand()*3,rand()*6,rand()*3));const v=[[0,.25,0],[-.14,0,0],[0,-.25,0],[.14,0,0]].map(p=>new THREE.Vector3(...p).applyQuaternion(rot).add(center));for(const k of [0,1,2,0,2,3])leafVertices.push(...v[k].toArray())}const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute(leafVertices,3));leafGeo.computeVertexNormals();
  const leaves=new THREE.InstancedMesh(leafGeo,leafMat,birches.length*5);
  leaves.customDepthMaterial=wind(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}));
  const verts=[],norms=[];function tri(a,b,c){verts.push(...a,...b,...c);const n=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c),new THREE.Vector3(...a))).normalize();for(let k=0;k<3;k++)norms.push(n.x,n.y,n.z)}
  // Seven arching fronds, each with paired leaflets, form one reusable fern mesh.
  for(let f=0;f<7;f++){const angle=f*Math.PI*2/7;const point=(r,y,side)=>[Math.cos(angle)*r-Math.sin(angle)*side,y,Math.sin(angle)*r+Math.cos(angle)*side];for(let j=1;j<=9;j++){const t=j/10,r=t*1.15,y=Math.sin(t*Math.PI*.88)*.8;const len=.32*(1-t)+.045;for(const side of [-1,1]){tri(point(r-.07,y-.05,0),point(r+.06,y+.025,0),point(r-.1,y+.015,side*len));tri(point(r+.06,y+.025,0),point(r+.025,y+.07,side*len*.7),point(r-.1,y+.015,side*len));}}}
  const fernGeo=new THREE.BufferGeometry();fernGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));fernGeo.setAttribute('normal',new THREE.Float32BufferAttribute(norms,3));
  const fernPoints=[];for(let i=0;i<2200;i++){const a=rand()*6.28,r=Math.sqrt(rand())*150,x=anchor.x+Math.cos(a)*r,z=anchor.z+Math.sin(a)*r,h=sample(x,z);if(h>123)fernPoints.push({x,z,h:h-base,s:.65+rand()*1.4,r:rand()*6.28})}
  // Wider patches remain visible during low flight through the forest.
  for(let i=0;i<placements.length;i+=8){const p=placements[i];fernPoints.push({x:p.x+3,z:p.z+3,h:sample(p.x+3,p.z+3)-base,s:1.2+rand(),r:rand()*6.28})}
  const ferns=new THREE.InstancedMesh(fernGeo,wind(new THREE.MeshStandardMaterial({color:'#8a9a36',side:THREE.DoubleSide,roughness:.95})),fernPoints.length);ferns.customDepthMaterial=wind(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide}));
  for(const m of [trunks,branches,leaves,ferns]){m.castShadow=true;m.receiveShadow=true;group.add(m)}
  const d=new THREE.Object3D(),color=new THREE.Color();let current='autumn',relief=2,enabled=true;
  function matrices(scale){relief=scale;birches.forEach((p,i)=>{const y=p.h*scale;d.rotation.set(0,p.r,.03*Math.sin(p.r));d.position.set(p.x,y+p.size*.45,p.z);d.scale.set(1,p.size*.9,1);d.updateMatrix();trunks.setMatrixAt(i,d.matrix);for(let j=0;j<3;j++){const a=p.r+j*2.1;d.position.set(p.x+Math.cos(a)*p.size*.08,y+p.size*(.48+j*.12),p.z+Math.sin(a)*p.size*.08);d.rotation.set(Math.sin(a)*.65,a,Math.cos(a)*.65);d.scale.set(1,p.size*.34,1);d.updateMatrix();branches.setMatrixAt(i*3+j,d.matrix)}for(let j=0;j<5;j++){const a=p.r+j*2.4;d.position.set(p.x+Math.cos(a)*p.size*.13,y+p.size*(.62+j*.075),p.z+Math.sin(a)*p.size*.13);d.rotation.set(.2,p.r+j,.2);d.scale.set(p.size*.19,p.size*.22,p.size*.17);d.updateMatrix();leaves.setMatrixAt(i*5+j,d.matrix)}});fernPoints.forEach((p,i)=>{d.position.set(p.x,p.h*scale+.08,p.z);d.rotation.set(0,p.r,0);d.scale.setScalar(p.s);d.updateMatrix();ferns.setMatrixAt(i,d.matrix)});for(const m of [trunks,branches,leaves,ferns]){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere()}}
  function season(s){current=s;birches.forEach((p,i)=>{for(let j=0;j<5;j++){if(s==='autumn')color.setHSL(.085+p.c*.055,.72,.40+p.c*.15);else if(s==='spring')color.setHSL(.20+p.c*.055,.53,.37+p.c*.12);else color.setHSL(.25+p.c*.05,.43,.25+p.c*.12);leaves.setColorAt(i*5+j,color)}});leaves.instanceColor.needsUpdate=true;leaves.visible=s!=='winter';ferns.visible=s!=='winter';ferns.material.color.set(s==='autumn'?'#b49a40':s==='spring'?'#87b648':'#537e34');}
  matrices(relief);season(current);
  return{anchor,birches,leafGeometry:leafGeo,group,matrices,season,setVisible(v){enabled=v;group.visible=v},tick(t){time.value=t},get seasonName(){return current}};
}
