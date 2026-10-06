import * as THREE from 'three';
import {Water} from './vendor/Water.js';
export function createLake({W,heights,base,waterLevel,relief,scene}){
  const n=128,data=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n*Math.PI*2,v=y/n*Math.PI*2;const dx=.25*Math.cos(u*4+v*3)+.12*Math.cos(u*9-v*5),dy=.25*Math.cos(u*3-v*4)+.1*Math.sin(v*11+u*5);const norm=new THREE.Vector3(-dx,-dy,1).normalize(),i=(y*n+x)*4;data[i]=(norm.x*.5+.5)*255;data[i+1]=(norm.y*.5+.5)*255;data[i+2]=(norm.z*.5+.5)*255;data[i+3]=255}
  const normals=new THREE.DataTexture(data,n,n);normals.wrapS=normals.wrapT=THREE.RepeatWrapping;normals.magFilter=THREE.LinearFilter;normals.minFilter=THREE.LinearMipmapLinearFilter;normals.generateMipmaps=true;normals.needsUpdate=true;
  const water=new Water(new THREE.PlaneGeometry(W,W),{textureWidth:768,textureHeight:768,waterNormals:normals,sunDirection:new THREE.Vector3(-.7,.4,.3),sunColor:'#ffe3b5',waterColor:'#245d65',distortionScale:2.8,fog:true});water.rotation.x=-Math.PI/2;water.position.y=(waterLevel-base)*relief;water.material.uniforms.size.value=1.1;water.receiveShadow=true;scene.add(water);
  const depth=new THREE.DataTexture(heights,256,256,THREE.RedFormat,THREE.FloatType);depth.magFilter=depth.minFilter=THREE.LinearFilter;depth.needsUpdate=true;
  const mat=water.material;Object.assign(mat.uniforms,{uTerrain:{value:depth},uWorldSize:{value:W},uLakeElevation:{value:waterLevel},uRelief:{value:relief},uWaveSpeed:{value:1}});
  mat.fragmentShader=mat.fragmentShader.replace('uniform sampler2D mirrorSampler;',`uniform sampler2D mirrorSampler;
    uniform sampler2D uTerrain; uniform float uWorldSize; uniform float uLakeElevation; uniform float uRelief;`)
    .replace('vec3 outgoingLight = albedo;',`vec2 terrainUv=clamp(worldPosition.xz/uWorldSize+.5,vec2(.002),vec2(.998));
      float bed=texture2D(uTerrain,terrainUv).r;
      float depth=max(0.,(uLakeElevation-bed)*uRelief);
      float shallow=exp(-depth*.4);
      vec3 waterTint=mix(waterColor,vec3(.12,.30,.27),shallow*.55);
      albedo=mix(albedo,waterTint,.18*(1.-reflectance));
      float shore=1.-smoothstep(.1,1.5,depth);
      float ripple=sin(depth*7.-time*1.7+noise.x*2.);
      float foam=shore*smoothstep(.55,.96,ripple)*.38;
      vec3 outgoingLight=mix(albedo,vec3(.76,.86,.80),foam);`);
  // Compatibility aliases for the existing light, mist, and season controls.
  mat.uniforms.uTime=mat.uniforms.time;mat.uniforms.uSun=mat.uniforms.sunDirection;mat.uniforms.uColor=mat.uniforms.waterColor;mat.uniforms.uDensity={value:scene.fog.density};
  return{water,material:mat,tick(t){mat.uniforms.time.value=t*.28},setRelief(v){mat.uniforms.uRelief.value=v}};
}
