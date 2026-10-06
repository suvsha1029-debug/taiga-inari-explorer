import fs from 'node:fs';
const threeUrl=new URL('../dist/vendor/three.module.js',import.meta.url);
const THREE=await import(threeUrl);
const code=fs.readFileSync(new URL('../dist/terrain.js',import.meta.url),'utf8').replace("'three'",JSON.stringify(threeUrl.href));
const {buildHeightfield}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const source=new Float32Array(65536);for(let i=0;i<source.length;i++)source[i]=145+Math.sin(i%256*.09)*7+Math.cos(Math.floor(i/256)*.06)*9;
const W=7057,field=buildHeightfield(source,W),geo=new THREE.PlaneGeometry(W,W,field.segments,field.segments);geo.rotateX(-Math.PI/2);for(let i=0;i<field.values.length;i++)geo.attributes.position.setY(i,field.values[i]);
const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();const ray=new THREE.Raycaster();let worst=0;
for(let i=0;i<32;i++){const x=Math.sin(i*2.71)*2800,z=Math.cos(i*1.53)*2800;ray.set(new THREE.Vector3(x,1000,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObject(mesh)[0];if(!hit)throw Error('No terrain hit');const error=Math.abs(hit.point.y-field.sample(x,z));worst=Math.max(worst,error);if(error>.002)throw Error('Placement/mesh mismatch: '+error)}
if(field.sample(field.pond.x,field.pond.z)>=field.pond.elevation)throw Error('Pond basin not submerged');
console.log(JSON.stringify({raycastSamples:32,maxPlacementErrorMeters:worst,pondBasinBelowWater:true}));

