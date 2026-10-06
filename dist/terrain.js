import * as THREE from 'three';
// One triangulated field drives terrain rendering AND vegetation placement.
export function buildHeightfield(source,W){
 const N=512,stride=N+1;
 function original(x,z){const u=THREE.MathUtils.clamp((x/W+.5)*255,0,254.999),v=THREE.MathUtils.clamp((z/W+.5)*255,0,254.999),ix=Math.floor(u),iz=Math.floor(v),a=u-ix,b=v-iz;return THREE.MathUtils.lerp(THREE.MathUtils.lerp(source[iz*256+ix],source[iz*256+ix+1],a),THREE.MathUtils.lerp(source[(iz+1)*256+ix],source[(iz+1)*256+ix+1],a),b)}
 const pond={x:-505,z:650,rx:103,rz:83,elevation:original(-505,650)-5.5};const values=new Float32Array(stride*stride);
 for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=(i/N-.5)*W,z=(j/N-.5)*W;let h=original(x,z);h=THREE.MathUtils.lerp(Math.min(h,118),h,THREE.MathUtils.smoothstep(h,120,122));const r=Math.hypot((x-pond.x)/pond.rx,(z-pond.z)/pond.rz);h+=(Math.sin(x*.024+Math.sin(z*.017))*1.5+Math.sin(z*.032-x*.011)*.9)*Math.exp(-((x+600)**2+(z-700)**2)/350000)*THREE.MathUtils.smoothstep(h,122,130);const blend=1-THREE.MathUtils.smoothstep(r,.60,1.32),basin=pond.elevation-3.5+Math.pow(Math.min(r,1.5),2)*4.3;values[j*stride+i]=THREE.MathUtils.lerp(h,basin,blend)}
 function sample(x,z){const u=THREE.MathUtils.clamp((x/W+.5)*N,0,N-.0001),v=THREE.MathUtils.clamp((z/W+.5)*N,0,N-.0001),ix=Math.floor(u),iz=Math.floor(v),a=u-ix,b=v-iz,k=iz*stride+ix,h00=values[k],h10=values[k+1],h01=values[k+stride],h11=values[k+stride+1];return a+b<=1?h00+(h10-h00)*a+(h01-h00)*b:h11+(h01-h11)*(1-a)+(h10-h11)*(1-b)}
 return{values,segments:N,sample,pond};
}
export function groundShader(material,contours,shore,season){material.onBeforeCompile=s=>{s.uniforms.uContours=contours;s.uniforms.uGroundWinter=season;s.uniforms.uBeach={value:new THREE.Vector4(shore.x,shore.z,shore.nx,shore.nz)};
 s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGround;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=position;');
 s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
 uniform float uContours;uniform float uGroundWinter;uniform vec4 uBeach;varying vec3 vGround;
 float gh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float gn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gh(i),gh(i+vec2(1,0)),f.x),mix(gh(i+vec2(0,1)),gh(i+vec2(1)),f.x),f.y);}
 `).replace('#include <color_fragment>',`#include <color_fragment>
 float broad=gn(vGround.xz*.014),detail=gn(vGround.xz*.09);float patches=smoothstep(.30,.73,broad+.10*detail);
 vec3 moss=diffuseColor.rgb*vec3(.93,1.06,.88),earth=diffuseColor.rgb*vec3(1.13,.94,.79);
 diffuseColor.rgb=mix(moss,earth,patches*.48)*(.94+.08*detail);
 vec2 q=vGround.xz-uBeach.xy;float along=dot(q,vec2(uBeach.w,-uBeach.z)),inland=dot(q,uBeach.zw);
 float beach=(1.-smoothstep(130.,175.,abs(along)))*(1.-smoothstep(32.,57.,inland+gn(q*.025)*12.))*smoothstep(-40.,-8.,inland);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.53,.44,.28),beach*(1.-uGroundWinter));
 float line=abs(fract((vGround.y+118.)/20.-.5)-.5)/max(fwidth(vGround.y/20.),.003);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.90,.61),uContours*(1.-smoothstep(0.,1.2,line))*.8);
 `)};}

