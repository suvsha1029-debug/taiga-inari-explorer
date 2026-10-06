import * as THREE from 'three';
import {Water} from './vendor/Water.js';
const surfaces=[];
export function createLake({W,heights,base,waterLevel,relief,scene,pond=null}){
 const dummy=new THREE.DataTexture(new Uint8Array([128,128,255,255]),1,1);dummy.needsUpdate=true;
 const elevation=pond?pond.elevation:waterLevel;
 const water=new Water(pond?new THREE.CircleGeometry(1,96):new THREE.PlaneGeometry(W,W),{textureWidth:1024,textureHeight:1024,waterNormals:dummy,sunDirection:new THREE.Vector3(-.7,.4,.3),sunColor:'#ffebca',waterColor:'#166c7b',distortionScale:.55,clipBias:.008,fog:true});
 water.rotation.x=-Math.PI/2;water.position.set(pond?pond.x:0,(elevation-base)*relief+.055,pond?pond.z:0);if(pond)water.scale.set(pond.rx*1.25,pond.rz*1.25,1);scene.add(water);surfaces.push(water);
 const renderReflection=water.onBeforeRender;
 water.onBeforeRender=function(renderer,scene,camera,...args){const others=surfaces.filter(x=>x!==water).map(x=>[x,x.visible]);for(const [x]of others)x.visible=false;try{renderReflection.call(water,renderer,scene,camera,...args)}finally{for(const [x,v]of others)x.visible=v}};
 const side=Math.round(Math.sqrt(heights.length)),encoded=new Uint8Array(side*side*4);for(let i=0;i<heights.length;i++){const h=Math.round(heights[i]*16);encoded[i*4]=Math.floor(h/256);encoded[i*4+1]=h%256;encoded[i*4+3]=255}
 const depth=new THREE.DataTexture(encoded,side,side);depth.magFilter=depth.minFilter=THREE.LinearFilter;depth.needsUpdate=true;
 const mat=water.material;Object.assign(mat.uniforms,{uTerrain:{value:depth},uWorldSize:{value:W},uLakeElevation:{value:elevation},uRelief:{value:relief}});
 mat.fragmentShader=mat.fragmentShader.replace('uniform sampler2D mirrorSampler;',`uniform sampler2D mirrorSampler;
 uniform sampler2D uTerrain;uniform float uWorldSize;uniform float uLakeElevation;uniform float uRelief;`)
 .replace('vec4 noise = getNoise( worldPosition.xz * size );',`vec2 wp=worldPosition.xz;float cameraDistance=length(eye-worldPosition.xyz);float smallFade=1.-smoothstep(90.,700.,cameraDistance);
 float nx=sin(wp.x*.040+wp.y*.027+time*.68)*.024+sin(wp.x*.135-wp.y*.11+time*.9)*.018*smallFade;
 float nz=cos(wp.y*.037-wp.x*.019+time*.51)*.025+cos(wp.y*.145+wp.x*.09+time*.8)*.016*smallFade;vec4 noise=vec4(nx,nz,1.,0.);`)
 .replace('noise.xzy * vec3( 1.5, 1.0, 1.5 )','noise.xzy')
 .replace('100.0, 2.0, 0.5','42.0, 0.55, 0.5')
 .replace('vec3 outgoingLight = albedo;',`vec2 terrainUv=clamp(worldPosition.xz/uWorldSize+.5,vec2(.001),vec2(.999));vec2 dem=texture2D(uTerrain,terrainUv).rg*255.;float bed=(dem.r*256.+dem.g)/16.;float depth=max(0.,(uLakeElevation-bed)*uRelief);
 float shallows=exp(-depth*.32);vec3 waterTint=mix(waterColor,vec3(.12,.47,.43),shallows*.68);
 vec3 outgoingLight=mix(waterTint,reflectionSample,clamp(.18+reflectance*.68,.18,.82))+specularLight*.40;
 float wave=sin(depth*2.3-time*.72+sin(wp.x*.05+wp.y*.04)*.3),aa=max(fwidth(depth*2.3)*1.5,.15);
 float foam=(1.-smoothstep(.15,1.5,depth))*smoothstep(.60-aa,.84+aa,wave)*.20;foam*=1.-smoothstep(350.,1000.,cameraDistance);outgoingLight=mix(outgoingLight,vec3(.72,.88,.84),foam);`);
 mat.uniforms.uTime=mat.uniforms.time;mat.uniforms.uSun=mat.uniforms.sunDirection;mat.uniforms.uColor=mat.uniforms.waterColor;mat.uniforms.uDensity={value:scene.fog.density};
 return{water,material:mat,tick(t){mat.uniforms.time.value=t},setRelief(v){mat.uniforms.uRelief.value=v;water.position.y=(elevation-base)*v+.055}};
}
