(()=>{var Di={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Ni={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},su=0,ac=1,ru=2;var Qi=1,au=2,Fs=3,Ui=0,ke=1,Ne=2,ts=0,Bs=1,es=2,oc=3,lc=4,ou=5;var ns=100,lu=101,cu=102,hu=103,uu=104,du=200,fu=201,pu=202,mu=203,cc=204,hc=205,gu=206,_u=207,xu=208,yu=209,vu=210,bu=211,Su=212,Mu=213,wu=214,La=0,Da=1,Na=2,As=3,Ua=4,Oa=5,Fa=6,Ba=7,go=0,Eu=1,Tu=2,Jn=0,uc=1,dc=2,fc=3,Fr=4,pc=5,mc=6,gc=7;var _c=300,is=301,ks=302,_o=303,xo=304,Ei=1e3,xn=1001,ka=1002,De=1003,Au=1004;var Br=1005;var Ze=1006,yo=1007;var hi=1008;var tn=1009,xc=1010,yc=1011,zs=1012,vo=1013,Fn=1014,Mn=1015,Bn=1016,bo=1017,So=1018,ss=1020,vc=35902,bc=35899,Sc=1021,Mc=1022,kn=1023,ai=1026,ui=1027,Mo=1028,wo=1029,Oi=1030,Eo=1031;var To=1033,kr=33776,zr=33777,Hr=33778,Gr=33779,Ao=35840,Ro=35841,Co=35842,Po=35843,Io=36196,Lo=37492,Do=37496,No=37488,Uo=37489,Vr=37490,Oo=37491,Fo=37808,Bo=37809,ko=37810,zo=37811,Ho=37812,Go=37813,Vo=37814,Wo=37815,Xo=37816,$o=37817,qo=37818,Yo=37819,Zo=37820,Jo=37821,jo=36492,Ko=36494,Qo=36495,tl=36283,el=36284,Wr=36285,nl=36286;var cr=2300,za=2301,Pa=2302,Zl=2303,Jl=2400,jl=2401,Kl=2402;var Ru=3200;var Xr=0,Cu=1,di="",Fe="srgb",hr="srgb-linear",ur="linear",se="srgb";var Ia=7680;var Pu=519,Iu=512,Lu=513,Du=514,wc=515,Nu=516,Uu=517,Ec=518,Tc=519,Ou=35044;var Ac="300 es",yn=2e3,Rs=2001;function pf(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function mf(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function dr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Fu(){let i=dr("canvas");return i.style.display="block",i}var Mh={},Cs=null;function Rc(...i){let t="THREE."+i.shift();Cs?Cs("log",t,...i):console.log(t,...i)}function Bu(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function It(...i){i=Bu(i);let t="THREE."+i.shift();if(Cs)Cs("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Bt(...i){i=Bu(i);let t="THREE."+i.shift();if(Cs)Cs("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function Xi(...i){let t=i.join(" ");t in Mh||(Mh[t]=!0,It(...i))}function ku(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var zu={[La]:La,[Na]:Fa,[Ua]:Ua,[As]:Oa,[Da]:Da,[Fa]:Na,[Ba]:Ba,[Oa]:As},Dn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Ve=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],wh=1234567,rr=Math.PI/180,$i=180/Math.PI;function Hs(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ve[i&255]+Ve[i>>8&255]+Ve[i>>16&255]+Ve[i>>24&255]+"-"+Ve[t&255]+Ve[t>>8&255]+"-"+Ve[t>>16&15|64]+Ve[t>>24&255]+"-"+Ve[e&63|128]+Ve[e>>8&255]+"-"+Ve[e>>16&255]+Ve[e>>24&255]+Ve[n&255]+Ve[n>>8&255]+Ve[n>>16&255]+Ve[n>>24&255]).toLowerCase()}function Wt(i,t,e){return Math.max(t,Math.min(e,i))}function Cc(i,t){return(i%t+t)%t}function gf(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function _f(i,t,e){return i!==t?(e-i)/(t-i):0}function ar(i,t,e){return(1-e)*i+e*t}function xf(i,t,e,n){return ar(i,t,1-Math.exp(-e*n))}function yf(i,t=1){return t-Math.abs(Cc(i,t*2)-t)}function vf(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function bf(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Sf(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Mf(i,t){return i+Math.random()*(t-i)}function wf(i){return i*(.5-Math.random())}function Ef(i){i!==void 0&&(wh=i);let t=wh+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Tf(i){return i*rr}function Af(i){return i*$i}function Rf(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function Cf(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Pc(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Pf(i,t,e,n,s){let r=Math.cos,a=Math.sin,o=r(e/2),l=a(e/2),c=r((t+n)/2),h=a((t+n)/2),d=r((t-n)/2),f=a((t-n)/2),u=r((n-t)/2),m=a((n-t)/2);switch(s){case"XYX":i.set(o*h,l*d,l*f,o*c);break;case"YZY":i.set(l*f,o*h,l*d,o*c);break;case"ZXZ":i.set(l*d,l*f,o*h,o*c);break;case"XZX":i.set(o*h,l*m,l*u,o*c);break;case"YXY":i.set(l*u,o*h,l*m,o*c);break;case"ZYZ":i.set(l*m,l*u,o*h,o*c);break;default:It("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Ic(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Hu(i,t){if(t.constructor===Float32Array)return i;let e=Ic(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(i/e,-1)}function Gu(i,t){if(t.constructor===Float32Array)return i;let e=Ic(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(i*e)}var Lc={DEG2RAD:rr,RAD2DEG:$i,generateUUID:Hs,clamp:Wt,euclideanModulo:Cc,mapLinear:gf,inverseLerp:_f,lerp:ar,damp:xf,pingpong:yf,smoothstep:vf,smootherstep:bf,randInt:Sf,randFloat:Mf,randFloatSpread:wf,seededRandom:Ef,degToRad:Tf,radToDeg:Af,isPowerOfTwo:Rf,ceilPowerOfTwo:Cf,floorPowerOfTwo:Pc,setQuaternionFromProperEuler:Pf,normalize:Gu,denormalize:Hu},Bc=class Bc{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Wt(this.x,t.x,e.x),this.y=Wt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Wt(this.x,t,e),this.y=Wt(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Wt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Bc.prototype.isVector2=!0;var gt=Bc,Je=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],d=n[s+3],f=r[a+0],u=r[a+1],m=r[a+2],x=r[a+3];if(d!==x||l!==f||c!==u||h!==m){let g=l*f+c*u+h*m+d*x;g<0&&(f=-f,u=-u,m=-m,x=-x,g=-g);let p=1-o;if(g<.9995){let v=Math.acos(g),w=Math.sin(v);p=Math.sin(p*v)/w,o=Math.sin(o*v)/w,l=l*p+f*o,c=c*p+u*o,h=h*p+m*o,d=d*p+x*o}else{l=l*p+f*o,c=c*p+u*o,h=h*p+m*o,d=d*p+x*o;let v=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=v,c*=v,h*=v,d*=v}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],d=r[a],f=r[a+1],u=r[a+2],m=r[a+3];return t[e]=o*m+h*d+l*u-c*f,t[e+1]=l*m+h*f+c*d-o*u,t[e+2]=c*m+h*u+o*f-l*d,t[e+3]=h*m-o*d-l*f-c*u,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),d=o(r/2),f=l(n/2),u=l(s/2),m=l(r/2);switch(a){case"XYZ":this._x=f*h*d+c*u*m,this._y=c*u*d-f*h*m,this._z=c*h*m+f*u*d,this._w=c*h*d-f*u*m;break;case"YXZ":this._x=f*h*d+c*u*m,this._y=c*u*d-f*h*m,this._z=c*h*m-f*u*d,this._w=c*h*d+f*u*m;break;case"ZXY":this._x=f*h*d-c*u*m,this._y=c*u*d+f*h*m,this._z=c*h*m+f*u*d,this._w=c*h*d-f*u*m;break;case"ZYX":this._x=f*h*d-c*u*m,this._y=c*u*d+f*h*m,this._z=c*h*m-f*u*d,this._w=c*h*d+f*u*m;break;case"YZX":this._x=f*h*d+c*u*m,this._y=c*u*d+f*h*m,this._z=c*h*m-f*u*d,this._w=c*h*d-f*u*m;break;case"XZY":this._x=f*h*d-c*u*m,this._y=c*u*d-f*h*m,this._z=c*h*m+f*u*d,this._w=c*h*d+f*u*m;break;default:It("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],d=e[10],f=n+o+d;if(f>0){let u=.5/Math.sqrt(f+1);this._w=.25/u,this._x=(h-l)*u,this._y=(r-c)*u,this._z=(a-s)*u}else if(n>o&&n>d){let u=2*Math.sqrt(1+n-o-d);this._w=(h-l)/u,this._x=.25*u,this._y=(s+a)/u,this._z=(r+c)/u}else if(o>d){let u=2*Math.sqrt(1+o-n-d);this._w=(r-c)/u,this._x=(s+a)/u,this._y=.25*u,this._z=(l+h)/u}else{let u=2*Math.sqrt(1+d-n-o);this._w=(a-s)/u,this._x=(r+c)/u,this._y=(l+h)/u,this._z=.25*u}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Wt(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,e=Math.sin(e*c)/h,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},kc=class kc{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Eh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Eh.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),h=2*(o*e-r*s),d=2*(r*n-a*e);return this.x=e+l*c+a*d-o*h,this.y=n+l*h+o*c-r*d,this.z=s+l*d+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Wt(this.x,t.x,e.x),this.y=Wt(this.y,t.y,e.y),this.z=Wt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Wt(this.x,t,e),this.y=Wt(this.y,t,e),this.z=Wt(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return El.copy(this).projectOnVector(t),this.sub(El)}reflect(t){return this.sub(El.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Wt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};kc.prototype.isVector3=!0;var R=kc,El=new R,Eh=new Je,zc=class zc{constructor(t,e,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],d=n[7],f=n[2],u=n[5],m=n[8],x=s[0],g=s[3],p=s[6],v=s[1],w=s[4],S=s[7],T=s[2],E=s[5],_=s[8];return r[0]=a*x+o*v+l*T,r[3]=a*g+o*w+l*E,r[6]=a*p+o*S+l*_,r[1]=c*x+h*v+d*T,r[4]=c*g+h*w+d*E,r[7]=c*p+h*S+d*_,r[2]=f*x+u*v+m*T,r[5]=f*g+u*w+m*E,r[8]=f*p+u*S+m*_,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=h*a-o*c,f=o*l-h*r,u=c*r-a*l,m=e*d+n*f+s*u;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/m;return t[0]=d*x,t[1]=(s*c-h*n)*x,t[2]=(o*n-s*a)*x,t[3]=f*x,t[4]=(h*e-s*l)*x,t[5]=(s*r-o*e)*x,t[6]=u*x,t[7]=(n*l-c*e)*x,t[8]=(a*e-n*r)*x,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return Xi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Tl.makeScale(t,e)),this}rotate(t){return Xi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Tl.makeRotation(-t)),this}translate(t,e){return Xi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Tl.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};zc.prototype.isMatrix3=!0;var kt=zc,Tl=new kt,Th=new kt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ah=new kt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function If(){let i={enabled:!0,workingColorSpace:hr,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===se&&(s.r=ri(s.r),s.g=ri(s.g),s.b=ri(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===se&&(s.r=Ts(s.r),s.g=Ts(s.g),s.b=Ts(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===di?ur:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[hr]:{primaries:t,whitePoint:n,transfer:ur,toXYZ:Th,fromXYZ:Ah,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Fe},outputColorSpaceConfig:{drawingBufferColorSpace:Fe}},[Fe]:{primaries:t,whitePoint:n,transfer:se,toXYZ:Th,fromXYZ:Ah,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Fe}}}),i}var Qt=If();function ri(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ts(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var ds,Ha=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{ds===void 0&&(ds=dr("canvas")),ds.width=t.width,ds.height=t.height;let s=ds.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=ds}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=dr("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=ri(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(ri(e[n]/255)*255):e[n]=ri(e[n]);return{data:e,width:t.width,height:t.height}}else return It("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Lf=0,Ps=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Lf++}),this.uuid=Hs(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width||0,e.height||0,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Al(s[a].image)):r.push(Al(s[a]))}else r=Al(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function Al(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Ha.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(It("Texture: Unable to serialize Texture."),{})}var Df=0,Rl=new R,je=class i extends Dn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=xn,s=xn,r=Ze,a=hi,o=kn,l=tn,c=i.DEFAULT_ANISOTROPY,h=di){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Df++}),this.uuid=Hs(),this.name="",this.source=new Ps(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new gt(0,0),this.repeat=new gt(1,1),this.center=new gt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new kt,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Rl).x}get height(){return this.source.getSize(Rl).y}get depth(){return this.source.getSize(Rl).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){It(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){It(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==_c)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ei:t.x=t.x-Math.floor(t.x);break;case xn:t.x=t.x<0?0:1;break;case ka:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ei:t.y=t.y-Math.floor(t.y);break;case xn:t.y=t.y<0?0:1;break;case ka:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};je.DEFAULT_IMAGE=null;je.DEFAULT_MAPPING=_c;je.DEFAULT_ANISOTROPY=1;var Hc=class Hc{constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],d=l[8],f=l[1],u=l[5],m=l[9],x=l[2],g=l[6],p=l[10];if(Math.abs(h-f)<.01&&Math.abs(d-x)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+f)<.1&&Math.abs(d+x)<.1&&Math.abs(m+g)<.1&&Math.abs(c+u+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let w=(c+1)/2,S=(u+1)/2,T=(p+1)/2,E=(h+f)/4,_=(d+x)/4,M=(m+g)/4;return w>S&&w>T?w<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(w),s=E/n,r=_/n):S>T?S<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(S),n=E/s,r=M/s):T<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(T),n=_/r,s=M/r),this.set(n,s,r,e),this}let v=Math.sqrt((g-m)*(g-m)+(d-x)*(d-x)+(f-h)*(f-h));return Math.abs(v)<.001&&(v=1),this.x=(g-m)/v,this.y=(d-x)/v,this.z=(f-h)/v,this.w=Math.acos((c+u+p-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Wt(this.x,t.x,e.x),this.y=Wt(this.y,t.y,e.y),this.z=Wt(this.z,t.z,e.z),this.w=Wt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Wt(this.x,t,e),this.y=Wt(this.y,t,e),this.z=Wt(this.z,t,e),this.w=Wt(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Hc.prototype.isVector4=!0;var ge=Hc,Ga=class extends Dn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ze,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new ge(0,0,t,e),this.scissorTest=!1,this.viewport=new ge(0,0,t,e),this.textures=[];let s=n.count;for(let r=0;r<s;r++)this.textures[r]=new je({width:t,height:e,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:Ze,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(e.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new Ps(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},cn=class extends Ga{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},fr=class extends je{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=De,this.minFilter=De,this.wrapR=xn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Va=class extends je{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=De,this.minFilter=De,this.wrapR=xn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var mo=class mo{constructor(t,e,n,s,r,a,o,l,c,h,d,f,u,m,x,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,h,d,f,u,m,x,g)}set(t,e,n,s,r,a,o,l,c,h,d,f,u,m,x,g){let p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=d,p[14]=f,p[3]=u,p[7]=m,p[11]=x,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new mo().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/fs.setFromMatrixColumn(t,0).length(),r=1/fs.setFromMatrixColumn(t,1).length(),a=1/fs.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){let f=a*h,u=a*d,m=o*h,x=o*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=u+m*c,e[5]=f-x*c,e[9]=-o*l,e[2]=x-f*c,e[6]=m+u*c,e[10]=a*l}else if(t.order==="YXZ"){let f=l*h,u=l*d,m=c*h,x=c*d;e[0]=f+x*o,e[4]=m*o-u,e[8]=a*c,e[1]=a*d,e[5]=a*h,e[9]=-o,e[2]=u*o-m,e[6]=x+f*o,e[10]=a*l}else if(t.order==="ZXY"){let f=l*h,u=l*d,m=c*h,x=c*d;e[0]=f-x*o,e[4]=-a*d,e[8]=m+u*o,e[1]=u+m*o,e[5]=a*h,e[9]=x-f*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let f=a*h,u=a*d,m=o*h,x=o*d;e[0]=l*h,e[4]=m*c-u,e[8]=f*c+x,e[1]=l*d,e[5]=x*c+f,e[9]=u*c-m,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let f=a*l,u=a*c,m=o*l,x=o*c;e[0]=l*h,e[4]=x-f*d,e[8]=m*d+u,e[1]=d,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=u*d+m,e[10]=f-x*d}else if(t.order==="XZY"){let f=a*l,u=a*c,m=o*l,x=o*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=f*d+x,e[5]=a*h,e[9]=u*d-m,e[2]=m*d-u,e[6]=o*h,e[10]=x*d+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Nf,t,Uf)}lookAt(t,e,n){let s=this.elements;return an.subVectors(t,e),an.lengthSq()===0&&(an.z=1),an.normalize(),yi.crossVectors(n,an),yi.lengthSq()===0&&(Math.abs(n.z)===1?an.x+=1e-4:an.z+=1e-4,an.normalize(),yi.crossVectors(n,an)),yi.normalize(),oa.crossVectors(an,yi),s[0]=yi.x,s[4]=oa.x,s[8]=an.x,s[1]=yi.y,s[5]=oa.y,s[9]=an.y,s[2]=yi.z,s[6]=oa.z,s[10]=an.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],d=n[5],f=n[9],u=n[13],m=n[2],x=n[6],g=n[10],p=n[14],v=n[3],w=n[7],S=n[11],T=n[15],E=s[0],_=s[4],M=s[8],N=s[12],P=s[1],D=s[5],O=s[9],V=s[13],I=s[2],X=s[6],q=s[10],H=s[14],Q=s[3],G=s[7],nt=s[11],it=s[15];return r[0]=a*E+o*P+l*I+c*Q,r[4]=a*_+o*D+l*X+c*G,r[8]=a*M+o*O+l*q+c*nt,r[12]=a*N+o*V+l*H+c*it,r[1]=h*E+d*P+f*I+u*Q,r[5]=h*_+d*D+f*X+u*G,r[9]=h*M+d*O+f*q+u*nt,r[13]=h*N+d*V+f*H+u*it,r[2]=m*E+x*P+g*I+p*Q,r[6]=m*_+x*D+g*X+p*G,r[10]=m*M+x*O+g*q+p*nt,r[14]=m*N+x*V+g*H+p*it,r[3]=v*E+w*P+S*I+T*Q,r[7]=v*_+w*D+S*X+T*G,r[11]=v*M+w*O+S*q+T*nt,r[15]=v*N+w*V+S*H+T*it,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],d=t[6],f=t[10],u=t[14],m=t[3],x=t[7],g=t[11],p=t[15],v=l*u-c*f,w=o*u-c*d,S=o*f-l*d,T=a*u-c*h,E=a*f-l*h,_=a*d-o*h;return e*(x*v-g*w+p*S)-n*(m*v-g*T+p*E)+s*(m*w-x*T+p*_)-r*(m*S-x*E+g*_)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],l=t[2],c=t[6],h=t[10];return e*(a*h-o*c)-n*(r*h-o*l)+s*(r*c-a*l)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=t[9],f=t[10],u=t[11],m=t[12],x=t[13],g=t[14],p=t[15],v=e*o-n*a,w=e*l-s*a,S=e*c-r*a,T=n*l-s*o,E=n*c-r*o,_=s*c-r*l,M=h*x-d*m,N=h*g-f*m,P=h*p-u*m,D=d*g-f*x,O=d*p-u*x,V=f*p-u*g,I=v*V-w*O+S*D+T*P-E*N+_*M;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let X=1/I;return t[0]=(o*V-l*O+c*D)*X,t[1]=(s*O-n*V-r*D)*X,t[2]=(x*_-g*E+p*T)*X,t[3]=(f*E-d*_-u*T)*X,t[4]=(l*P-a*V-c*N)*X,t[5]=(e*V-s*P+r*N)*X,t[6]=(g*S-m*_-p*w)*X,t[7]=(h*_-f*S+u*w)*X,t[8]=(a*O-o*P+c*M)*X,t[9]=(n*P-e*O-r*M)*X,t[10]=(m*E-x*S+p*v)*X,t[11]=(d*S-h*E-u*v)*X,t[12]=(o*N-a*D-l*M)*X,t[13]=(e*D-n*N+s*M)*X,t[14]=(x*w-m*T-g*v)*X,t[15]=(h*T-d*w+f*v)*X,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,d=o+o,f=r*c,u=r*h,m=r*d,x=a*h,g=a*d,p=o*d,v=l*c,w=l*h,S=l*d,T=n.x,E=n.y,_=n.z;return s[0]=(1-(x+p))*T,s[1]=(u+S)*T,s[2]=(m-w)*T,s[3]=0,s[4]=(u-S)*E,s[5]=(1-(f+p))*E,s[6]=(g+v)*E,s[7]=0,s[8]=(m+w)*_,s[9]=(g-v)*_,s[10]=(1-(f+x))*_,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=fs.set(s[0],s[1],s[2]).length(),o=fs.set(s[4],s[5],s[6]).length(),l=fs.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Pn.copy(this);let c=1/a,h=1/o,d=1/l;return Pn.elements[0]*=c,Pn.elements[1]*=c,Pn.elements[2]*=c,Pn.elements[4]*=h,Pn.elements[5]*=h,Pn.elements[6]*=h,Pn.elements[8]*=d,Pn.elements[9]*=d,Pn.elements[10]*=d,e.setFromRotationMatrix(Pn),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,s,r,a,o=yn,l=!1){let c=this.elements,h=2*r/(e-t),d=2*r/(n-s),f=(e+t)/(e-t),u=(n+s)/(n-s),m,x;if(l)m=r/(a-r),x=a*r/(a-r);else if(o===yn)m=-(a+r)/(a-r),x=-2*a*r/(a-r);else if(o===Rs)m=-a/(a-r),x=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=d,c[9]=u,c[13]=0,c[2]=0,c[6]=0,c[10]=m,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=yn,l=!1){let c=this.elements,h=2/(e-t),d=2/(n-s),f=-(e+t)/(e-t),u=-(n+s)/(n-s),m,x;if(l)m=1/(a-r),x=a/(a-r);else if(o===yn)m=-2/(a-r),x=-(a+r)/(a-r);else if(o===Rs)m=-1/(a-r),x=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=d,c[9]=0,c[13]=u,c[2]=0,c[6]=0,c[10]=m,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};mo.prototype.isMatrix4=!0;var Zt=mo,fs=new R,Pn=new Zt,Nf=new R(0,0,0),Uf=new R(1,1,1),yi=new R,oa=new R,an=new R,Rh=new Zt,Ch=new Je,Xn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],d=s[2],f=s[6],u=s[10];switch(e){case"XYZ":this._y=Math.asin(Wt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,u),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Wt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,u),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Wt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-d,u),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Wt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(f,u),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Wt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,u));break;case"XZY":this._z=Math.asin(-Wt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,u),this._y=0);break;default:It("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Rh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Rh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Ch.setFromEuler(this),this.setFromQuaternion(Ch,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Xn.DEFAULT_ORDER="XYZ";var Is=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Of=0,Ph=new R,ps=new Je,ti=new Zt,la=new R,Ks=new R,Ff=new R,Bf=new Je,Ih=new R(1,0,0),Lh=new R(0,1,0),Dh=new R(0,0,1),Nh={type:"added"},kf={type:"removed"},ms={type:"childadded",child:null},Cl={type:"childremoved",child:null},ye=class i extends Dn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Of++}),this.uuid=Hs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new R,e=new Xn,n=new Je,s=new R(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Zt},normalMatrix:{value:new kt}}),this.matrix=new Zt,this.matrixWorld=new Zt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Is,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ps.setFromAxisAngle(t,e),this.quaternion.multiply(ps),this}rotateOnWorldAxis(t,e){return ps.setFromAxisAngle(t,e),this.quaternion.premultiply(ps),this}rotateX(t){return this.rotateOnAxis(Ih,t)}rotateY(t){return this.rotateOnAxis(Lh,t)}rotateZ(t){return this.rotateOnAxis(Dh,t)}translateOnAxis(t,e){return Ph.copy(t).applyQuaternion(this.quaternion),this.position.add(Ph.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ih,t)}translateY(t){return this.translateOnAxis(Lh,t)}translateZ(t){return this.translateOnAxis(Dh,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(ti.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?la.copy(t):la.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Ks.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ti.lookAt(Ks,la,this.up):ti.lookAt(la,Ks,this.up),this.quaternion.setFromRotationMatrix(ti),s&&(ti.extractRotation(s.matrixWorld),ps.setFromRotationMatrix(ti),this.quaternion.premultiply(ps.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Bt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Nh),ms.child=t,this.dispatchEvent(ms),ms.child=null):Bt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(kf),Cl.child=t,this.dispatchEvent(Cl),Cl.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),ti.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),ti.multiply(t.parent.matrixWorld)),t.applyMatrix4(ti),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Nh),ms.child=t,this.dispatchEvent(ms),ms.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ks,t,Ff),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ks,Bf,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];r(t.shapes,d)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),d=a(t.shapes),f=a(t.skeletons),u=a(t.animations),m=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),f.length>0&&(n.skeletons=f),u.length>0&&(n.animations=u),m.length>0&&(n.nodes=m)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};ye.DEFAULT_UP=new R(0,1,0);ye.DEFAULT_MATRIX_AUTO_UPDATE=!0;ye.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Nt=class extends ye{constructor(){super(),this.isGroup=!0,this.type="Group"}},zf={type:"move"},Ls=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Nt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Nt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Nt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let x of t.hand.values()){let g=e.getJointPose(x,n),p=this._getHandJoint(c,x);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.quaternion,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],f=h.position.distanceTo(d.position),u=.02,m=.005;c.inputState.pinching&&f>u+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=u-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(zf)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new Nt;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Vu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},vi={h:0,s:0,l:0},ca={h:0,s:0,l:0};function Pl(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Ut=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Fe){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Qt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=Qt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Qt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=Qt.workingColorSpace){if(t=Cc(t,1),e=Wt(e,0,1),n=Wt(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Pl(a,r,t+1/3),this.g=Pl(a,r,t),this.b=Pl(a,r,t-1/3)}return Qt.colorSpaceToWorking(this,s),this}setStyle(t,e=Fe){function n(r){r!==void 0&&parseFloat(r)<1&&It("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,e);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:It("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);It("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Fe){let n=Vu[t.toLowerCase()];return n!==void 0?this.setHex(n,e):It("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ri(t.r),this.g=ri(t.g),this.b=ri(t.b),this}copyLinearToSRGB(t){return this.r=Ts(t.r),this.g=Ts(t.g),this.b=Ts(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Fe){return Qt.workingToColorSpace(We.copy(this),t),Math.round(Wt(We.r*255,0,255))*65536+Math.round(Wt(We.g*255,0,255))*256+Math.round(Wt(We.b*255,0,255))}getHexString(t=Fe){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Qt.workingColorSpace){Qt.workingToColorSpace(We.copy(this),e);let n=We.r,s=We.g,r=We.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let d=a-o;switch(c=h<=.5?d/(a+o):d/(2-a-o),a){case n:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-n)/d+2;break;case r:l=(n-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Qt.workingColorSpace){return Qt.workingToColorSpace(We.copy(this),e),t.r=We.r,t.g=We.g,t.b=We.b,t}getStyle(t=Fe){Qt.workingToColorSpace(We.copy(this),t);let e=We.r,n=We.g,s=We.b;return t!==Fe?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(vi),this.setHSL(vi.h+t,vi.s+e,vi.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(vi),t.getHSL(ca);let n=ar(vi.h,ca.h,e),s=ar(vi.s,ca.s,e),r=ar(vi.l,ca.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},We=new Ut;Ut.NAMES=Vu;var pr=class i{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Ut(t),this.near=e,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},qi=class extends ye{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Xn,this.environmentIntensity=1,this.environmentRotation=new Xn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}},In=new R,ei=new R,Il=new R,ni=new R,gs=new R,_s=new R,Uh=new R,Ll=new R,Dl=new R,Nl=new R,Ul=new ge,Ol=new ge,Fl=new ge,wi=class i{constructor(t=new R,e=new R,n=new R){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),In.subVectors(t,e),s.cross(In);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){In.subVectors(s,e),ei.subVectors(n,e),Il.subVectors(t,e);let a=In.dot(In),o=In.dot(ei),l=In.dot(Il),c=ei.dot(ei),h=ei.dot(Il),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;let f=1/d,u=(c*l-o*h)*f,m=(a*h-o*l)*f;return r.set(1-u-m,m,u)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,ni)===null?!1:ni.x>=0&&ni.y>=0&&ni.x+ni.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,ni)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ni.x),l.addScaledVector(a,ni.y),l.addScaledVector(o,ni.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return Ul.setScalar(0),Ol.setScalar(0),Fl.setScalar(0),Ul.fromBufferAttribute(t,e),Ol.fromBufferAttribute(t,n),Fl.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(Ul,r.x),a.addScaledVector(Ol,r.y),a.addScaledVector(Fl,r.z),a}static isFrontFacing(t,e,n,s){return In.subVectors(n,e),ei.subVectors(t,e),In.cross(ei).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return In.subVectors(this.c,this.b),ei.subVectors(this.a,this.b),In.cross(ei).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;gs.subVectors(s,n),_s.subVectors(r,n),Ll.subVectors(t,n);let l=gs.dot(Ll),c=_s.dot(Ll);if(l<=0&&c<=0)return e.copy(n);Dl.subVectors(t,s);let h=gs.dot(Dl),d=_s.dot(Dl);if(h>=0&&d<=h)return e.copy(s);let f=l*d-h*c;if(f<=0&&l>=0&&h<=0&&l-h>0)return a=l/(l-h),e.copy(n).addScaledVector(gs,a);Nl.subVectors(t,r);let u=gs.dot(Nl),m=_s.dot(Nl);if(m>=0&&u<=m)return e.copy(r);let x=u*c-l*m;if(x<=0&&c>=0&&m<=0)return o=c/(c-m),e.copy(n).addScaledVector(_s,o);let g=h*m-u*d;if(g<=0&&d-h>=0&&u-m>=0)return Uh.subVectors(r,s),o=(d-h)/(d-h+(u-m)),e.copy(s).addScaledVector(Uh,o);let p=1/(g+x+f);return a=x*p,o=f*p,e.copy(n).addScaledVector(gs,a).addScaledVector(_s,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Ke=class{constructor(t=new R(1/0,1/0,1/0),e=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Ln.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Ln.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Ln.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Ln):Ln.fromBufferAttribute(r,a),Ln.applyMatrix4(t.matrixWorld),this.expandByPoint(Ln);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ha.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ha.copy(n.boundingBox)),ha.applyMatrix4(t.matrixWorld),this.union(ha)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Ln),Ln.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Qs),ua.subVectors(this.max,Qs),xs.subVectors(t.a,Qs),ys.subVectors(t.b,Qs),vs.subVectors(t.c,Qs),bi.subVectors(ys,xs),Si.subVectors(vs,ys),Hi.subVectors(xs,vs);let e=[0,-bi.z,bi.y,0,-Si.z,Si.y,0,-Hi.z,Hi.y,bi.z,0,-bi.x,Si.z,0,-Si.x,Hi.z,0,-Hi.x,-bi.y,bi.x,0,-Si.y,Si.x,0,-Hi.y,Hi.x,0];return!Bl(e,xs,ys,vs,ua)||(e=[1,0,0,0,1,0,0,0,1],!Bl(e,xs,ys,vs,ua))?!1:(da.crossVectors(bi,Si),e=[da.x,da.y,da.z],Bl(e,xs,ys,vs,ua))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Ln).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Ln).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(ii[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),ii[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),ii[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),ii[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),ii[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),ii[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),ii[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),ii[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(ii),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},ii=[new R,new R,new R,new R,new R,new R,new R,new R],Ln=new R,ha=new Ke,xs=new R,ys=new R,vs=new R,bi=new R,Si=new R,Hi=new R,Qs=new R,ua=new R,da=new R,Gi=new R;function Bl(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Gi.fromArray(i,r);let o=s.x*Math.abs(Gi.x)+s.y*Math.abs(Gi.y)+s.z*Math.abs(Gi.z),l=t.dot(Gi),c=e.dot(Gi),h=n.dot(Gi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Se=new R,fa=new gt,Hf=0,vn=class extends Dn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Hf++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Ou,this.updateRanges=[],this.gpuType=Mn,this.version=0,this._normalizationScale=t!==void 0?Ic(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)fa.fromBufferAttribute(this,e),fa.applyMatrix3(t),this.setXY(e,fa.x,fa.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix3(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix4(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyNormalMatrix(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.transformDirection(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=this._denormalize(n)),n}setComponent(t,e,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=this._denormalize(e)),e}setX(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=this._denormalize(e)),e}setY(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=this._denormalize(e)),e}setZ(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=this._denormalize(e)),e}setW(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s),r=this._normalize(r)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(t){let e=this._normalizationScale;return e!==void 0?Math.max(t/e,-1):Hu(t,this.array)}_normalize(t){let e=this._normalizationScale;return e!==void 0?Math.round(t*e):Gu(t,this.array)}};var mr=class extends vn{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var gr=class extends vn{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var ee=class extends vn{constructor(t,e,n){super(new Float32Array(t),e,n)}},Gf=new Ke,tr=new R,kl=new R,oi=class{constructor(t=new R,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Gf.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;tr.subVectors(t,this.center);let e=tr.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(tr,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(kl.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(tr.copy(t.center).add(kl)),this.expandByPoint(tr.copy(t.center).sub(kl))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Vf=0,_n=new Zt,zl=new ye,bs=new R,on=new Ke,er=new Ke,Le=new R,Xe=class i extends Dn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Vf++}),this.uuid=Hs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(pf(t)?gr:mr)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new kt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return _n.makeRotationFromQuaternion(t),this.applyMatrix4(_n),this}rotateX(t){return _n.makeRotationX(t),this.applyMatrix4(_n),this}rotateY(t){return _n.makeRotationY(t),this.applyMatrix4(_n),this}rotateZ(t){return _n.makeRotationZ(t),this.applyMatrix4(_n),this}translate(t,e,n){return _n.makeTranslation(t,e,n),this.applyMatrix4(_n),this}scale(t,e,n){return _n.makeScale(t,e,n),this.applyMatrix4(_n),this}lookAt(t){return zl.lookAt(t),zl.updateMatrix(),this.applyMatrix4(zl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(bs).negate(),this.translate(bs.x,bs.y,bs.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new ee(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&It("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ke);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Bt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];on.setFromBufferAttribute(r),this.morphTargetsRelative?(Le.addVectors(this.boundingBox.min,on.min),this.boundingBox.expandByPoint(Le),Le.addVectors(this.boundingBox.max,on.max),this.boundingBox.expandByPoint(Le)):(this.boundingBox.expandByPoint(on.min),this.boundingBox.expandByPoint(on.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Bt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Bt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(t){let n=this.boundingSphere.center;if(on.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];er.setFromBufferAttribute(o),this.morphTargetsRelative?(Le.addVectors(on.min,er.min),on.expandByPoint(Le),Le.addVectors(on.max,er.max),on.expandByPoint(Le)):(on.expandByPoint(er.min),on.expandByPoint(er.max))}on.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Le.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Le));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Le.fromBufferAttribute(o,c),l&&(bs.fromBufferAttribute(t,c),Le.add(bs)),s=Math.max(s,n.distanceToSquared(Le))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Bt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Bt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new vn(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[],c=new Uint8Array(n.count);for(let N=0;N<n.count;N++)o[N]=new R,l[N]=new R;let h=new R,d=new R,f=new R,u=new gt,m=new gt,x=new gt,g=new R,p=new R;function v(N,P,D){c[N]=c[P]=c[D]=1,h.fromBufferAttribute(n,N),d.fromBufferAttribute(n,P),f.fromBufferAttribute(n,D),u.fromBufferAttribute(r,N),m.fromBufferAttribute(r,P),x.fromBufferAttribute(r,D),d.sub(h),f.sub(h),m.sub(u),x.sub(u);let O=1/(m.x*x.y-x.x*m.y);isFinite(O)&&(g.copy(d).multiplyScalar(x.y).addScaledVector(f,-m.y).multiplyScalar(O),p.copy(f).multiplyScalar(m.x).addScaledVector(d,-x.x).multiplyScalar(O),o[N].add(g),o[P].add(g),o[D].add(g),l[N].add(p),l[P].add(p),l[D].add(p))}let w=this.groups;w.length===0&&(w=[{start:0,count:t.count}]);for(let N=0,P=w.length;N<P;++N){let D=w[N],O=D.start,V=D.count;for(let I=O,X=O+V;I<X;I+=3)v(t.getX(I+0),t.getX(I+1),t.getX(I+2))}let S=new R,T=new R,E=new R,_=new R;function M(N){E.fromBufferAttribute(s,N),_.copy(E);let P=o[N];S.copy(P),S.sub(E.multiplyScalar(E.dot(P))).normalize(),T.crossVectors(_,P);let O=T.dot(l[N])<0?-1:1;a.setXYZW(N,S.x,S.y,S.z,O)}for(let N=0,P=n.count;N<P;++N)c[N]&&M(N);this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new vn(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,u=n.count;f<u;f++)n.setXYZ(f,0,0,0);let s=new R,r=new R,a=new R,o=new R,l=new R,c=new R,h=new R,d=new R;if(t)for(let f=0,u=t.count;f<u;f+=3){let m=t.getX(f+0),x=t.getX(f+1),g=t.getX(f+2);s.fromBufferAttribute(e,m),r.fromBufferAttribute(e,x),a.fromBufferAttribute(e,g),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),o.fromBufferAttribute(n,m),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,g),o.add(h),l.add(h),c.add(h),n.setXYZ(m,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let f=0,u=e.count;f<u;f+=3)s.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),a.fromBufferAttribute(e,f+2),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Le.fromBufferAttribute(t,e),Le.normalize(),t.setXYZ(e,Le.x,Le.y,Le.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,d=o.normalized,f=new c.constructor(l.length*h),u=0,m=0;for(let x=0,g=l.length;x<g;x++){o.isInterleavedBufferAttribute?u=l[x]*o.data.stride+o.offset:u=l[x]*h;for(let p=0;p<h;p++)f[m++]=c[u++]}return new vn(f,h,d)}if(this.index===null)return It("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,d=c.length;h<d;h++){let f=c[h],u=t(f,n);l.push(u)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,f=c.length;d<f;d++){let u=c[d];h.push(u.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],d=r[c];for(let f=0,u=d.length;f<u;f++)h.push(d[f].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,h=a.length;c<h;c++){let d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Hl=new R,Wf=new R,Xf=new kt,ln=class{constructor(t=new R(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Hl.subVectors(n,e).cross(Wf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(Hl),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Xf.getNormalMatrix(t),s=this.coplanarPoint(Hl).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},$f=0,$n=class extends Dn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:$f++}),this.uuid=Hs(),this.name="",this.type="Material",this.blending=Bs,this.side=Ui,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=cc,this.blendDst=hc,this.blendEquation=ns,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ut(0,0,0),this.blendAlpha=0,this.depthFunc=As,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Pu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ia,this.stencilZFail=Ia,this.stencilZPass=Ia,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){It(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){It(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Ut().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new ln().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new gt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new gt().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=e[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var si=new R,Gl=new R,pa=new R,ma=new R,Ti=class{constructor(t=new R,e=new R(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,si)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=si.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(si.copy(this.origin).addScaledVector(this.direction,e),si.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Gl.copy(t).add(e).multiplyScalar(.5),pa.copy(e).sub(t).normalize(),ma.copy(this.origin).sub(Gl);let r=t.distanceTo(e)*.5,a=-this.direction.dot(pa),o=ma.dot(this.direction),l=-ma.dot(pa),c=ma.lengthSq(),h=Math.abs(1-a*a),d,f,u,m;if(h>0)if(d=a*l-o,f=a*o-l,m=r*h,d>=0)if(f>=-m)if(f<=m){let x=1/h;d*=x,f*=x,u=d*(d+a*f+2*o)+f*(a*d+f+2*l)+c}else f=r,d=Math.max(0,-(a*f+o)),u=-d*d+f*(f+2*l)+c;else f=-r,d=Math.max(0,-(a*f+o)),u=-d*d+f*(f+2*l)+c;else f<=-m?(d=Math.max(0,-(-a*r+o)),f=d>0?-r:Math.min(Math.max(-r,-l),r),u=-d*d+f*(f+2*l)+c):f<=m?(d=0,f=Math.min(Math.max(-r,-l),r),u=f*(f+2*l)+c):(d=Math.max(0,-(a*r+o)),f=d>0?r:Math.min(Math.max(-r,-l),r),u=-d*d+f*(f+2*l)+c);else f=a>0?-r:r,d=Math.max(0,-(a*f+o)),u=-d*d+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Gl).addScaledVector(pa,f),u}intersectSphere(t,e){if(t.radius<0)return null;si.subVectors(t.center,this.origin);let n=si.dot(this.direction),s=si.dot(si)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,f=this.origin;return c>=0?(n=(t.min.x-f.x)*c,s=(t.max.x-f.x)*c):(n=(t.max.x-f.x)*c,s=(t.min.x-f.x)*c),h>=0?(r=(t.min.y-f.y)*h,a=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,a=(t.min.y-f.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(t.min.z-f.z)*d,l=(t.max.z-f.z)*d):(o=(t.max.z-f.z)*d,l=(t.min.z-f.z)*d),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,si)!==null}intersectTriangle(t,e,n,s,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,d=t.x-a.x,f=t.y-a.y,u=t.z-a.z,m=e.x-a.x,x=e.y-a.y,g=e.z-a.z,p=n.x-a.x,v=n.y-a.y,w=n.z-a.z,S=Math.abs(l),T=Math.abs(c),E=Math.abs(h),_,M,N,P,D,O,V,I,X,q,H,Q;if(S>=T&&S>=E?(N=l,O=d,X=m,Q=p,l>=0?(_=c,M=h,P=f,D=u,V=x,I=g,q=v,H=w):(_=h,M=c,P=u,D=f,V=g,I=x,q=w,H=v)):T>=E?(N=c,O=f,X=x,Q=v,c>=0?(_=h,M=l,P=u,D=d,V=g,I=m,q=w,H=p):(_=l,M=h,P=d,D=u,V=m,I=g,q=p,H=w)):(N=h,O=u,X=g,Q=w,h>=0?(_=l,M=c,P=d,D=f,V=m,I=x,q=p,H=v):(_=c,M=l,P=f,D=d,V=x,I=m,q=v,H=p)),N===0)return null;let G=_/N,nt=M/N,it=1/N,At=P-G*O,Ht=D-nt*O,J=V-G*X,yt=I-nt*X,Mt=q-G*Q,Lt=H-nt*Q,vt=Mt*yt-Lt*J,Vt=At*Lt-Ht*Mt,ve=J*Ht-yt*At;if(s){if(vt<0||Vt<0||ve<0)return null}else if((vt<0||Vt<0||ve<0)&&(vt>0||Vt>0||ve>0))return null;let Ot=vt+Vt+ve;if(Ot===0)return null;let re=it*(vt*O+Vt*X+ve*Q);return(Ot>0?re<0:re>0)?null:this.at(re/Ot,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Nn=class extends $n{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ut(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xn,this.combine=go,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},Oh=new Zt,Vi=new Ti,ga=new oi,Fh=new R,_a=new R,xa=new R,ya=new R,Vl=new R,va=new R,Bh=new R,ba=new R,ue=class extends ye{constructor(t=new Xe,e=new Nn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){va.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],d=r[l];h!==0&&(Vl.fromBufferAttribute(d,t),a?va.addScaledVector(Vl,h):va.addScaledVector(Vl.sub(e),h))}e.add(va)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ga.copy(n.boundingSphere),ga.applyMatrix4(r),Vi.copy(t.ray).recast(t.near),!(ga.containsPoint(Vi.origin)===!1&&(Vi.intersectSphere(ga,Fh)===null||Vi.origin.distanceToSquared(Fh)>(t.far-t.near)**2))&&(Oh.copy(r).invert(),Vi.copy(t.ray).applyMatrix4(Oh),!(n.boundingBox!==null&&Vi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Vi)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,f=r.groups,u=r.drawRange;if(o!==null)if(Array.isArray(a))for(let m=0,x=f.length;m<x;m++){let g=f[m],p=a[g.materialIndex],v=Math.max(g.start,u.start),w=Math.min(o.count,Math.min(g.start+g.count,u.start+u.count));for(let S=v,T=w;S<T;S+=3){let E=o.getX(S),_=o.getX(S+1),M=o.getX(S+2);s=Sa(this,p,t,n,c,h,d,E,_,M),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let m=Math.max(0,u.start),x=Math.min(o.count,u.start+u.count);for(let g=m,p=x;g<p;g+=3){let v=o.getX(g),w=o.getX(g+1),S=o.getX(g+2);s=Sa(this,a,t,n,c,h,d,v,w,S),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let m=0,x=f.length;m<x;m++){let g=f[m],p=a[g.materialIndex],v=Math.max(g.start,u.start),w=Math.min(l.count,Math.min(g.start+g.count,u.start+u.count));for(let S=v,T=w;S<T;S+=3){let E=S,_=S+1,M=S+2;s=Sa(this,p,t,n,c,h,d,E,_,M),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let m=Math.max(0,u.start),x=Math.min(l.count,u.start+u.count);for(let g=m,p=x;g<p;g+=3){let v=g,w=g+1,S=g+2;s=Sa(this,a,t,n,c,h,d,v,w,S),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}}};function qf(i,t,e,n,s,r,a,o){let l;if(t.side===ke?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===Ui,o),l===null)return null;ba.copy(o),ba.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(ba);return c<e.near||c>e.far?null:{distance:c,point:ba.clone(),object:i}}function Sa(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,_a),i.getVertexPosition(l,xa),i.getVertexPosition(c,ya);let h=qf(i,t,e,n,_a,xa,ya,Bh);if(h){let d=new R;wi.getBarycoord(Bh,_a,xa,ya,d),s&&(h.uv=wi.getInterpolatedAttribute(s,o,l,c,d,new gt)),r&&(h.uv1=wi.getInterpolatedAttribute(r,o,l,c,d,new gt)),a&&(h.normal=wi.getInterpolatedAttribute(a,o,l,c,d,new R),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a:o,b:l,c,normal:new R,materialIndex:0};wi.getNormal(_a,xa,ya,f.normal),h.face=f,h.barycoord=d}return h}var _r=class extends je{constructor(t=null,e=1,n=1,s,r,a,o,l,c=De,h=De,d,f){super(null,a,o,l,c,h,s,r,d,f),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var xr=class extends vn{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},Ss=new Zt,kh=new Zt,Ma=[],zh=new Ke,Yf=new Zt,nr=new ue,ir=new oi,qn=class extends ue{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new xr(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Yf)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Ke),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ss),zh.copy(t.boundingBox).applyMatrix4(Ss),this.boundingBox.union(zh)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new oi),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ss),ir.copy(t.boundingSphere).applyMatrix4(Ss),this.boundingSphere.union(ir)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),this.morphTexture=t.morphTexture!==null?t.morphTexture.clone():null,this.instanceColor=t.instanceColor!==null?t.instanceColor.clone():null,this.count=t.count,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){let n=this.matrixWorld,s=this.count;if(nr.geometry=this.geometry,nr.material=this.material,nr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ir.copy(this.boundingSphere),ir.applyMatrix4(n),t.ray.intersectsSphere(ir)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Ss),kh.multiplyMatrices(n,Ss),nr.matrixWorld=kh,nr.raycast(t,Ma);for(let a=0,o=Ma.length;a<o;a++){let l=Ma[a];l.instanceId=r,l.object=this,e.push(l)}Ma.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new xr(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new _r(new Float32Array(s*this.count),s,this.count,Mo,Mn));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Wi=new oi,Zf=new gt(.5,.5),wa=new R,Ai=class{constructor(t=new ln,e=new ln,n=new ln,s=new ln,r=new ln,a=new ln){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=yn,n=!1){let s=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],d=r[5],f=r[6],u=r[7],m=r[8],x=r[9],g=r[10],p=r[11],v=r[12],w=r[13],S=r[14],T=r[15];if(s[0].setComponents(c-a,u-h,p-m,T-v).normalize(),s[1].setComponents(c+a,u+h,p+m,T+v).normalize(),s[2].setComponents(c+o,u+d,p+x,T+w).normalize(),s[3].setComponents(c-o,u-d,p-x,T-w).normalize(),n)s[4].setComponents(l,f,g,S).normalize(),s[5].setComponents(c-l,u-f,p-g,T-S).normalize();else if(s[4].setComponents(c-l,u-f,p-g,T-S).normalize(),e===yn)s[5].setComponents(c+l,u+f,p+g,T+S).normalize();else if(e===Rs)s[5].setComponents(l,f,g,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Wi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Wi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Wi)}intersectsSprite(t){Wi.center.set(0,0,0);let e=Zf.distanceTo(t.center);return Wi.radius=.7071067811865476+e,Wi.applyMatrix4(t.matrixWorld),this.intersectsSphere(Wi)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(wa.x=s.normal.x>0?t.max.x:t.min.x,wa.y=s.normal.y>0?t.max.y:t.min.y,wa.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(wa)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Hh=new Zt,Wa=class i{constructor(){this.coordinateSystem=yn,this._frustums=[],this._count=0}setFromArrayCamera(t){let e=t.cameras,n=this._frustums;for(let s=0;s<e.length;s++){let r=e[s];Hh.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[s]===void 0&&(n[s]=new Ai),n[s].setFromProjectionMatrix(Hh,r.coordinateSystem,r.reversedDepth)}return this._count=e.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsObject(t))return!0;return!1}intersectsSprite(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSprite(t))return!0;return!1}intersectsSphere(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSphere(t))return!0;return!1}intersectsBox(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsBox(t))return!0;return!1}containsPoint(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;let e=this._frustums,n=t._frustums;for(let s=0;s<t._count;s++)e[s]===void 0&&(e[s]=new Ai),e[s].copy(n[s]);return this._count=t._count,this}clone(){return new i().copy(this)}};var Ds=class extends $n{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ut(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},Xa=new R,$a=new R,Gh=new Zt,sr=new Ti,Ea=new oi,Wl=new R,Vh=new R,qa=class extends ye{constructor(t=new Xe,e=new Ds){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)Xa.fromBufferAttribute(e,s-1),$a.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=Xa.distanceTo($a);t.setAttribute("lineDistance",new ee(n,1))}else It("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ea.copy(n.boundingSphere),Ea.applyMatrix4(s),Ea.radius+=r,t.ray.intersectsSphere(Ea)===!1)return;Gh.copy(s).invert(),sr.copy(t.ray).applyMatrix4(Gh);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,f=n.attributes.position;if(h!==null){let u=Math.max(0,a.start),m=Math.min(h.count,a.start+a.count);for(let x=u,g=m-1;x<g;x+=c){let p=h.getX(x),v=h.getX(x+1),w=Ta(this,t,sr,l,p,v,x);w&&e.push(w)}if(this.isLineLoop){let x=h.getX(m-1),g=h.getX(u),p=Ta(this,t,sr,l,x,g,m-1);p&&e.push(p)}}else{let u=Math.max(0,a.start),m=Math.min(f.count,a.start+a.count);for(let x=u,g=m-1;x<g;x+=c){let p=Ta(this,t,sr,l,x,x+1,x);p&&e.push(p)}if(this.isLineLoop){let x=Ta(this,t,sr,l,m-1,u,m-1);x&&e.push(x)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Ta(i,t,e,n,s,r,a){let o=i.geometry.attributes.position;if(Xa.fromBufferAttribute(o,s),$a.fromBufferAttribute(o,r),e.distanceSqToSegment(Xa,$a,Wl,Vh)>n)return;Wl.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(Wl);if(!(c<t.near||c>t.far))return{distance:c,point:Vh.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}var Wh=new R,Xh=new R,yr=class extends qa{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)Wh.fromBufferAttribute(e,s),Xh.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Wh.distanceTo(Xh);t.setAttribute("lineDistance",new ee(n,1))}else It("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var vr=class extends je{constructor(t=[],e=is,n,s,r,a,o,l,c,h){super(t,e,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Yi=class extends je{constructor(t,e,n,s,r,a,o,l,c){super(t,e,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var li=class extends je{constructor(t,e,n=Fn,s,r,a,o=De,l=De,c,h=ai,d=1){if(h!==ai&&h!==ui)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:t,height:e,depth:d};super(f,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Ps(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}},br=class extends li{constructor(t,e=Fn,n=is,s,r,a=De,o=De,l,c=ai){let h={width:t,height:t,depth:1},d=[h,h,h,h,h,h];super(t,t,e,n,s,r,a,o,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},Sr=class extends je{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},bn=class i extends Xe{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],d=[],f=0,u=0;m("z","y","x",-1,-1,n,e,t,a,r,0),m("z","y","x",1,-1,n,e,-t,a,r,1),m("x","z","y",1,1,t,n,e,s,a,2),m("x","z","y",1,-1,t,n,-e,s,a,3),m("x","y","z",1,-1,t,e,n,s,r,4),m("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new ee(c,3)),this.setAttribute("normal",new ee(h,3)),this.setAttribute("uv",new ee(d,2));function m(x,g,p,v,w,S,T,E,_,M,N){let P=S/_,D=T/M,O=S/2,V=T/2,I=E/2,X=_+1,q=M+1,H=0,Q=0,G=new R;for(let nt=0;nt<q;nt++){let it=nt*D-V;for(let At=0;At<X;At++){let Ht=At*P-O;G[x]=Ht*v,G[g]=it*w,G[p]=I,c.push(G.x,G.y,G.z),G[x]=0,G[g]=0,G[p]=E>0?1:-1,h.push(G.x,G.y,G.z),d.push(At/_),d.push(1-nt/M),H+=1}}for(let nt=0;nt<M;nt++)for(let it=0;it<_;it++){let At=f+it+X*nt,Ht=f+it+X*(nt+1),J=f+(it+1)+X*(nt+1),yt=f+(it+1)+X*nt;l.push(At,Ht,yt),l.push(Ht,J,yt),Q+=6}o.addGroup(u,Q,N),u+=Q,f+=H}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var Ri=class i extends Xe{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],d=[],f=[],u=[],m=0,x=[],g=n/2,p=0;v(),a===!1&&(t>0&&w(!0),e>0&&w(!1)),this.setIndex(h),this.setAttribute("position",new ee(d,3)),this.setAttribute("normal",new ee(f,3)),this.setAttribute("uv",new ee(u,2));function v(){let S=new R,T=new R,E=0,_=(e-t)/n;for(let M=0;M<=r;M++){let N=[],P=M/r,D=P*(e-t)+t;for(let O=0;O<=s;O++){let V=O/s,I=V*l+o,X=Math.sin(I),q=Math.cos(I);T.x=D*X,T.y=-P*n+g,T.z=D*q,d.push(T.x,T.y,T.z),S.set(X,_,q).normalize(),f.push(S.x,S.y,S.z),u.push(V,1-P),N.push(m++)}x.push(N)}for(let M=0;M<s;M++)for(let N=0;N<r;N++){let P=x[N][M],D=x[N+1][M],O=x[N+1][M+1],V=x[N][M+1];(t>0||N!==0)&&(h.push(P,D,V),E+=3),(e>0||N!==r-1)&&(h.push(D,O,V),E+=3)}c.addGroup(p,E,0),p+=E}function w(S){let T=m,E=new gt,_=new R,M=0,N=S===!0?t:e,P=S===!0?1:-1;for(let O=1;O<=s;O++)d.push(0,g*P,0),f.push(0,P,0),u.push(.5,.5),m++;let D=m;for(let O=0;O<=s;O++){let I=O/s*l+o,X=Math.cos(I),q=Math.sin(I);_.x=N*q,_.y=g*P,_.z=N*X,d.push(_.x,_.y,_.z),f.push(0,P,0),E.x=X*.5+.5,E.y=q*.5*P+.5,u.push(E.x,E.y),m++}for(let O=0;O<s;O++){let V=T+O,I=D+O;S===!0?h.push(I,I+1,V):h.push(I+1,I,V),M+=3}c.addGroup(p,M,S===!0?1:2),p+=M}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}};var hn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){It("Curve: .getPoint() not implemented.")}getPointAt(t,e){let n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],n,s=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){let n=this.getLengths(),s=0,r=n.length,a;e?a=e:a=t*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=n[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===a)return s/(r-1);let h=n[s],f=n[s+1]-h,u=(a-h)/f;return(s+u)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),l=e||(a.isVector2?new gt:new R);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){let n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){let n=new R,s=[],r=[],a=[],o=new R,l=new Zt;for(let u=0;u<=t;u++){let m=u/t;s[u]=this.getTangentAt(m,new R)}r[0]=new R,a[0]=new R;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),d=Math.abs(s[0].y),f=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),d<=c&&(c=d,n.set(0,1,0)),f<=c&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let u=1;u<=t;u++){if(r[u]=r[u-1].clone(),a[u]=a[u-1].clone(),o.crossVectors(s[u-1],s[u]),o.length()>Number.EPSILON){o.normalize();let m=Math.acos(Wt(s[u-1].dot(s[u]),-1,1));r[u].applyMatrix4(l.makeRotationAxis(o,m))}a[u].crossVectors(s[u],r[u])}if(e===!0){let u=Math.acos(Wt(r[0].dot(r[t]),-1,1));u/=t,s[0].dot(o.crossVectors(r[0],r[t]))>0&&(u=-u);for(let m=1;m<=t;m++)r[m].applyMatrix4(l.makeRotationAxis(s[m],u*m)),a[m].crossVectors(s[m],r[m])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){let t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}},Mr=class extends hn{constructor(t=0,e=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new gt){let n=e,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+t*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),f=l-this.aX,u=c-this.aY;l=f*h-u*d+this.aX,c=f*d+u*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},Ya=class extends Mr{constructor(t,e,n,s,r,a){super(t,e,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function Dc(){let i=0,t=0,e=0,n=0;function s(r,a,o,l){i=r,t=o,e=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,d){let f=(a-r)/c-(o-r)/(c+h)+(o-a)/h,u=(o-a)/h-(l-a)/(h+d)+(l-o)/d;f*=h,u*=h,s(a,o,f,u)},calc:function(r){let a=r*r,o=a*r;return i+t*r+e*a+n*o}}}var $h=new R,qh=new R,Xl=new Dc,$l=new Dc,ql=new Dc,ci=class extends hn{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new R){let n=e,s=this.points,r=s.length,a=(r-(this.closed?0:1))*t,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(qh.subVectors(s[0],s[1]).add(s[0]),c=qh);let d=s[o%r],f=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:($h.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=$h),this.curveType==="centripetal"||this.curveType==="chordal"){let u=this.curveType==="chordal"?.5:.25,m=Math.pow(c.distanceToSquared(d),u),x=Math.pow(d.distanceToSquared(f),u),g=Math.pow(f.distanceToSquared(h),u);x<1e-4&&(x=1),m<1e-4&&(m=x),g<1e-4&&(g=x),Xl.initNonuniformCatmullRom(c.x,d.x,f.x,h.x,m,x,g),$l.initNonuniformCatmullRom(c.y,d.y,f.y,h.y,m,x,g),ql.initNonuniformCatmullRom(c.z,d.z,f.z,h.z,m,x,g)}else this.curveType==="catmullrom"&&(Xl.initCatmullRom(c.x,d.x,f.x,h.x,this.tension),$l.initCatmullRom(c.y,d.y,f.y,h.y,this.tension),ql.initCatmullRom(c.z,d.z,f.z,h.z,this.tension));return n.set(Xl.calc(l),$l.calc(l),ql.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new R().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function Yh(i,t,e,n,s){let r=(n-t)*.5,a=(s-e)*.5,o=i*i,l=i*o;return(2*e-2*n+r+a)*l+(-3*e+3*n-2*r-a)*o+r*i+e}function Jf(i,t){let e=1-i;return e*e*t}function jf(i,t){return 2*(1-i)*i*t}function Kf(i,t){return i*i*t}function or(i,t,e,n){return Jf(i,t)+jf(i,e)+Kf(i,n)}function Qf(i,t){let e=1-i;return e*e*e*t}function tp(i,t){let e=1-i;return 3*e*e*i*t}function ep(i,t){return 3*(1-i)*i*i*t}function np(i,t){return i*i*i*t}function lr(i,t,e,n,s){return Qf(i,t)+tp(i,e)+ep(i,n)+np(i,s)}var Za=class extends hn{constructor(t=new gt,e=new gt,n=new gt,s=new gt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new gt){let n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(lr(t,s.x,r.x,a.x,o.x),lr(t,s.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},Ja=class extends hn{constructor(t=new R,e=new R,n=new R,s=new R){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new R){let n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(lr(t,s.x,r.x,a.x,o.x),lr(t,s.y,r.y,a.y,o.y),lr(t,s.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},ja=class extends hn{constructor(t=new gt,e=new gt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new gt){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new gt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Yn=class extends hn{constructor(t=new R,e=new R){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new R){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new R){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Ka=class extends hn{constructor(t=new gt,e=new gt,n=new gt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new gt){let n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(or(t,s.x,r.x,a.x),or(t,s.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},wr=class extends hn{constructor(t=new R,e=new R,n=new R){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new R){let n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(or(t,s.x,r.x,a.x),or(t,s.y,r.y,a.y),or(t,s.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Qa=class extends hn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new gt){let n=e,s=this.points,r=(s.length-1)*t,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],d=s[a>s.length-3?s.length-1:a+2];return n.set(Yh(o,l.x,c.x,h.x,d.x),Yh(o,l.y,c.y,h.y,d.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new gt().fromArray(s))}return this}},Ql=Object.freeze({__proto__:null,ArcCurve:Ya,CatmullRomCurve3:ci,CubicBezierCurve:Za,CubicBezierCurve3:Ja,EllipseCurve:Mr,LineCurve:ja,LineCurve3:Yn,QuadraticBezierCurve:Ka,QuadraticBezierCurve3:wr,SplineCurve:Qa}),Zi=class extends hn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1,this.cacheLengths=null}add(t){this.curves.push(t)}closePath(){let t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){let n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ql[n](e,t))}return this}getPoint(t,e){let n=t*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let a=s[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,e)}r++}return null}getLength(){let t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let t=[],e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){let e=[],n;for(let s=0,r=this.curves;s<r.length;s++){let a=r[s],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this.cacheLengths=null,this}toJSON(){let t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){let s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let s=t.curves[e];this.curves.push(new Ql[s.type]().fromJSON(s))}return this.cacheLengths=null,this}};var Er=class i extends Xe{constructor(t=[new gt(0,-.5),new gt(.5,0),new gt(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=Wt(s,0,Math.PI*2);let r=[],a=[],o=[],l=[],c=[],h=1/e,d=new R,f=new gt,u=new R,m=new R,x=new R,g=0,p=0;for(let v=0;v<=t.length-1;v++)switch(v){case 0:g=t[v+1].x-t[v].x,p=t[v+1].y-t[v].y,u.x=p*1,u.y=-g,u.z=p*0,x.copy(u),u.normalize(),l.push(u.x,u.y,u.z);break;case t.length-1:x.normalize(),l.push(x.x,x.y,x.z);break;default:g=t[v+1].x-t[v].x,p=t[v+1].y-t[v].y,u.x=p*1,u.y=-g,u.z=p*0,m.copy(u),u.x+=x.x,u.y+=x.y,u.z+=x.z,u.normalize(),l.push(u.x,u.y,u.z),x.copy(m)}for(let v=0;v<=e;v++){let w=n+v*h*s,S=Math.sin(w),T=Math.cos(w);for(let E=0;E<=t.length-1;E++){d.x=t[E].x*S,d.y=t[E].y,d.z=t[E].x*T,a.push(d.x,d.y,d.z),f.x=v/e,f.y=E/(t.length-1),o.push(f.x,f.y);let _=l[3*E+0]*S,M=l[3*E+1],N=l[3*E+0]*T;c.push(_,M,N)}}for(let v=0;v<e;v++)for(let w=0;w<t.length-1;w++){let S=w+v*t.length,T=S,E=S+t.length,_=S+t.length+1,M=S+1;r.push(T,E,M),r.push(_,M,E)}this.setIndex(r),this.setAttribute("position",new ee(a,3)),this.setAttribute("uv",new ee(o,2)),this.setAttribute("normal",new ee(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.points,t.segments,t.phiStart,t.phiLength)}};var fe=class i extends Xe{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,d=t/o,f=e/l,u=[],m=[],x=[],g=[];for(let p=0;p<h;p++){let v=p*f-a;for(let w=0;w<c;w++){let S=w*d-r;m.push(S,-v,0),x.push(0,0,1),g.push(w/o),g.push(1-p/l)}}for(let p=0;p<l;p++)for(let v=0;v<o;v++){let w=v+c*p,S=v+c*(p+1),T=v+1+c*(p+1),E=v+1+c*p;u.push(w,S,E),u.push(S,T,E)}this.setIndex(u),this.setAttribute("position",new ee(m,3)),this.setAttribute("normal",new ee(x,3)),this.setAttribute("uv",new ee(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};var Un=class i extends Xe{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,h=[],d=new R,f=new R,u=[],m=[],x=[],g=[];for(let p=0;p<=n;p++){let v=[],w=p/n,S=a+w*o,T=t*Math.cos(S),E=Math.sqrt(t*t-T*T),_=0;p===0&&a===0?_=.5/e:p===n&&l===Math.PI&&(_=-.5/e);for(let M=0;M<=e;M++){let N=M/e,P=s+N*r;d.x=-E*Math.cos(P),d.y=T,d.z=E*Math.sin(P),m.push(d.x,d.y,d.z),f.copy(d).normalize(),x.push(f.x,f.y,f.z),g.push(N+_,1-w),v.push(c++)}h.push(v)}for(let p=0;p<n;p++)for(let v=0;v<e;v++){let w=h[p][v+1],S=h[p][v],T=h[p+1][v],E=h[p+1][v+1];(p!==0||a>0)&&u.push(w,S,E),(p!==n-1||l<Math.PI)&&u.push(S,T,E)}this.setIndex(u),this.setAttribute("position",new ee(m,3)),this.setAttribute("normal",new ee(x,3)),this.setAttribute("uv",new ee(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var Ci=class i extends Xe{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);let l=[],c=[],h=[],d=[],f=new R,u=new R,m=new R;for(let x=0;x<=n;x++){let g=a+x/n*o;for(let p=0;p<=s;p++){let v=p/s*r;u.x=(t+e*Math.cos(g))*Math.cos(v),u.y=(t+e*Math.cos(g))*Math.sin(v),u.z=e*Math.sin(g),c.push(u.x,u.y,u.z),f.x=t*Math.cos(v),f.y=t*Math.sin(v),m.subVectors(u,f).normalize(),h.push(m.x,m.y,m.z),d.push(p/s),d.push(x/n)}}for(let x=1;x<=n;x++)for(let g=1;g<=s;g++){let p=(s+1)*x+g-1,v=(s+1)*(x-1)+g-1,w=(s+1)*(x-1)+g,S=(s+1)*x+g;l.push(p,v,S),l.push(v,w,S)}this.setIndex(l),this.setAttribute("position",new ee(c,3)),this.setAttribute("normal",new ee(h,3)),this.setAttribute("uv",new ee(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};var Tr=class i extends Xe{constructor(t=new wr(new R(-1,-1,0),new R(-1,1,0),new R(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};let a=t.computeFrenetFrames(e,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new R,l=new R,c=new gt,h=new R,d=[],f=[],u=[],m=[];x(),this.setIndex(m),this.setAttribute("position",new ee(d,3)),this.setAttribute("normal",new ee(f,3)),this.setAttribute("uv",new ee(u,2));function x(){for(let w=0;w<e;w++)g(w);g(r===!1?e:0),v(),p()}function g(w){h=t.getPointAt(w/e,h);let S=a.normals[w],T=a.binormals[w];for(let E=0;E<=s;E++){let _=E/s*Math.PI*2,M=Math.sin(_),N=-Math.cos(_);l.x=N*S.x+M*T.x,l.y=N*S.y+M*T.y,l.z=N*S.z+M*T.z,l.normalize(),f.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,d.push(o.x,o.y,o.z)}}function p(){for(let w=1;w<=e;w++)for(let S=1;S<=s;S++){let T=(s+1)*(w-1)+(S-1),E=(s+1)*w+(S-1),_=(s+1)*w+S,M=(s+1)*(w-1)+S;m.push(T,E,M),m.push(E,_,M)}}function v(){for(let w=0;w<=e;w++)for(let S=0;S<=s;S++)c.x=w/e,c.y=S/s,u.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new i(new Ql[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}};function rs(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(Zh(s))s.isRenderTargetTexture?(It("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(Zh(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function $e(i){let t={};for(let e=0;e<i.length;e++){let n=rs(i[e]);for(let s in n)t[s]=n[s]}return t}function Zh(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function ip(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Nc(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Qt.workingColorSpace}var Wu={clone:rs,merge:$e},sp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,rp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Sn=class extends $n{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=sp,this.fragmentShader=rp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=rs(t.uniforms),this.uniformsGroups=ip(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new Ut().setHex(s.value);break;case"v2":this.uniforms[n].value=new gt().fromArray(s.value);break;case"v3":this.uniforms[n].value=new R().fromArray(s.value);break;case"v4":this.uniforms[n].value=new ge().fromArray(s.value);break;case"m3":this.uniforms[n].value=new kt().fromArray(s.value);break;case"m4":this.uniforms[n].value=new Zt().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},to=class extends Sn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},oe=class extends $n{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ut(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ut(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xr,this.normalScale=new gt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},Zn=class extends oe{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new gt(1,1),this.clearcoatNormalMap=null,this.diffuseRoughnessMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Wt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessMinimum=100,this.iridescenceThicknessMaximum=400,this.iridescenceThicknessMap=null,this.sheenColor=new Ut(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ut(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ut(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._diffuseRoughness=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get diffuseRoughness(){return this._diffuseRoughness}set diffuseRoughness(t){this._diffuseRoughness>0!=t>0&&this.version++,this._diffuseRoughness=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(t){this._retroreflectivity>0!=t>0&&this.version++,this._retroreflectivity=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}get iridescenceThicknessRange(){return Xi('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),[this.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum]}set iridescenceThicknessRange(t){Xi('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),this.iridescenceThicknessMinimum=t[0],this.iridescenceThicknessMaximum=t[1]}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.diffuseRoughness=t.diffuseRoughness,this.diffuseRoughnessMap=t.diffuseRoughnessMap,this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum,this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.retroreflectivity=t.retroreflectivity,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};var Ar=class extends $n{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Ut(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ut(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xr,this.normalScale=new gt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xn,this.combine=go,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},eo=class extends $n{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ru,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},no=class extends $n{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function Ms(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function Aa(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var Pi=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},io=class extends Pi{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Jl,endingEnd:Jl}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case jl:r=t,o=2*e-n;break;case Kl:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case jl:a=t,l=2*n-e;break;case Kl:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,d=this._offsetNext,f=this._weightPrev,u=this._weightNext,m=(n-e)/(s-e),x=m*m,g=x*m,p=-f*g+2*f*x-f*m,v=(1+f)*g+(-1.5-2*f)*x+(-.5+f)*m+1,w=(-1-u)*g+(1.5+u)*x+.5*m,S=u*g-u*x;for(let T=0;T!==o;++T)r[T]=p*a[h+T]+v*a[c+T]+w*a[l+T]+S*a[d+T];return r}},so=class extends Pi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(n-e)/(s-e),d=1-h;for(let f=0;f!==o;++f)r[f]=a[c+f]*d+a[l+f]*h;return r}},ro=class extends Pi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},ao=class extends Pi{interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this.inTangents,d=this.outTangents;if(!h||!d){let m=(n-e)/(s-e),x=1-m;for(let g=0;g!==o;++g)r[g]=a[c+g]*x+a[l+g]*m;return r}let f=o*2,u=t-1;for(let m=0;m!==o;++m){let x=a[c+m],g=a[l+m],p=u*f+m*2,v=d[p],w=d[p+1],S=t*f+m*2,T=h[S],E=h[S+1],_=op(n,e,v,T,s);r[m]=Xu(_,x,w,E,g)}return r}};function Xu(i,t,e,n,s){let r=1-i;return r*r*r*t+3*r*r*i*e+3*r*i*i*n+i*i*i*s}function ap(i,t,e,n,s){let r=1-i;return 3*r*r*(e-t)+6*r*i*(n-e)+3*i*i*(s-n)}function op(i,t,e,n,s){let r=(i-t)/(s-t);for(let a=0;a<8;a++){let o=Xu(r,t,e,n,s)-i;if(Math.abs(o)<1e-10)break;let l=ap(r,t,e,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var un=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Ms(e,this.TimeBufferType),this.values=Ms(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Ms(t.times,Array),values:Ms(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s),Aa(t.settings)&&(n.settings={inTangents:Ms(t.settings.inTangents,Array),outTangents:Ms(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new ro(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new so(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new io(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new ao(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case cr:e=this.InterpolantFactoryMethodDiscrete;break;case za:e=this.InterpolantFactoryMethodLinear;break;case Pa:e=this.InterpolantFactoryMethodSmooth;break;case Zl:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return It("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return cr;case this.InterpolantFactoryMethodLinear:return za;case this.InterpolantFactoryMethodSmooth:return Pa;case this.InterpolantFactoryMethodBezier:return Zl}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t;Aa(this.settings)&&(Jh(this.settings.inTangents,t),Jh(this.settings.outTangents,t))}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t;Aa(this.settings)&&(jh(this.settings.inTangents,t),jh(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Bt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Bt("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Bt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){Bt("KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&mf(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Bt("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Pa,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(s)l=!0;else{let d=o*n,f=d-n,u=d+n;for(let m=0;m!==n;++m){let x=e[d+m];if(x!==e[f+m]||x!==e[u+m]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let d=o*n,f=a*n;for(let u=0;u!==n;++u)e[f+u]=e[d+u]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,Aa(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function Jh(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]+=t}function jh(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]*=t}un.prototype.ValueTypeName="";un.prototype.TimeBufferType=Float32Array;un.prototype.ValueBufferType=Float32Array;un.prototype.DefaultInterpolation=za;var Ii=class extends un{constructor(t,e,n){super(t,e,n)}};Ii.prototype.ValueTypeName="bool";Ii.prototype.ValueBufferType=Array;Ii.prototype.DefaultInterpolation=cr;Ii.prototype.InterpolantFactoryMethodLinear=void 0;Ii.prototype.InterpolantFactoryMethodSmooth=void 0;var oo=class extends un{constructor(t,e,n,s){super(t,e,n,s)}};oo.prototype.ValueTypeName="color";var lo=class extends un{constructor(t,e,n,s){super(t,e,n,s)}};lo.prototype.ValueTypeName="number";var co=class extends Pi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),c=t*o;for(let h=c+o;c!==h;c+=4)Je.slerpFlat(r,0,a,c-o,a,c,l);return r}},Rr=class extends un{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new co(this.times,this.values,this.getValueSize(),t)}};Rr.prototype.ValueTypeName="quaternion";Rr.prototype.InterpolantFactoryMethodSmooth=void 0;var Li=class extends un{constructor(t,e,n){super(t,e,n)}};Li.prototype.ValueTypeName="string";Li.prototype.ValueBufferType=Array;Li.prototype.DefaultInterpolation=cr;Li.prototype.InterpolantFactoryMethodLinear=void 0;Li.prototype.InterpolantFactoryMethodSmooth=void 0;var ho=class extends un{constructor(t,e,n,s){super(t,e,n,s)}};ho.prototype.ValueTypeName="vector";var uo=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,f=c.length;d<f;d+=2){let u=c[d],m=c[d+1];if(u.global&&(u.lastIndex=0),u.test(h))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},$u=new uo,fo=class{constructor(t){this.manager=t!==void 0?t:$u,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}};fo.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ji=class extends ye{static registerNode(t){this.prototype._lightNode=t}constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Ut(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}},ji=class extends Ji{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ye.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ut(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){let e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}},Yl=new Zt,Kh=new R,Qh=new R,Ns=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new gt(512,512),this.mapType=tn,this.map=null,this.mapPass=null,this.matrix=new Zt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ai,this._frameExtents=new gt(1,1),this._viewportCount=1,this._viewports=[new ge(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera;Kh.setFromMatrixPosition(t.matrixWorld),e.position.copy(Kh),Qh.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Qh),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,s){Yl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(Yl,t.coordinateSystem,t.reversedDepth);let r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,l=s?s.x/r.x:0,c=s?s.y/r.y:0;t.coordinateSystem===Rs||t.reversedDepth?e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),e.multiply(Yl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.mapType=t.mapType,this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.mapType=this.mapType,t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Ra=new R,Ca=new Je,Wn=new R,Cr=class extends ye{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Zt,this.projectionMatrix=new Zt,this.projectionMatrixInverse=new Zt,this.coordinateSystem=yn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Ra,Ca,Wn),Wn.x===1&&Wn.y===1&&Wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ra,Ca,Wn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Ra,Ca,Wn),Wn.x===1&&Wn.y===1&&Wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ra,Ca,Wn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Mi=new R,tu=new gt,eu=new gt,Be=class extends Cr{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=$i*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(rr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return $i*2*Math.atan(Math.tan(rr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Mi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Mi.x,Mi.y).multiplyScalar(-t/Mi.z),Mi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Mi.x,Mi.y).multiplyScalar(-t/Mi.z)}getViewSize(t,e){return this.getViewBounds(t,tu,eu),e.subVectors(eu,tu)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(rr*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},tc=class extends Ns{constructor(){super(new Be(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(t){let e=this.camera,n=$i*2*t.angle*this.focus,s=this.mapSize.width/this.mapSize.height*this.aspect,r=t.distance||e.far;(n!==e.fov||s!==e.aspect||r!==e.far)&&(e.fov=n,e.aspect=s,e.far=r,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this.aspect=t.aspect,this}toJSON(){let t=super.toJSON();return t.focus=this.focus,t.aspect=this.aspect,t}},Pr=class extends Ji{constructor(t,e,n=0,s=Math.PI/3,r=0,a=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ye.DEFAULT_UP),this.updateMatrix(),this.target=new ye,this.distance=n,this.angle=s,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new tc}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.map=t.map,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.angle=this.angle,e.object.decay=this.decay,e.object.penumbra=this.penumbra,e.object.target=this.target.uuid,this.map&&this.map.isTexture&&(e.object.map=this.map.toJSON(t).uuid),e.object.shadow=this.shadow.toJSON(),e}},ec=class extends Ns{constructor(){super(new Be(90,1,.5,500)),this.isPointLightShadow=!0}},On=class extends Ji{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new ec}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}},Ir=class extends Cr{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},nc=class extends Ns{constructor(){super(new Ir(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ki=class extends Ji{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ye.DEFAULT_UP),this.updateMatrix(),this.target=new ye,this.shadow=new nc}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}};var ws=-90,Es=1,Us=class extends ye{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Be(ws,Es,t,e);s.layers=this.layers,this.add(s);let r=new Be(ws,Es,t,e);r.layers=this.layers,this.add(r);let a=new Be(ws,Es,t,e);a.layers=this.layers,this.add(a);let o=new Be(ws,Es,t,e);o.layers=this.layers,this.add(o);let l=new Be(ws,Es,t,e);l.layers=this.layers,this.add(l);let c=new Be(ws,Es,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===yn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Rs)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,d=t.getRenderTarget(),f=t.getActiveCubeFace(),u=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;let x=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.mipmapsAutoUpdate=x,t.setRenderTarget(n,5,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(d,f,u),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},po=class extends Be{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}},Lr=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(t){this._document=t,t.hidden!==void 0&&(this._pageVisibilityHandler=lp.bind(this),t.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(t){return this._timescale=t,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(t){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(t!==void 0?t:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function lp(){this._document.hidden===!1&&this.reset()}var Uc="\\[\\]\\.:\\/",cp=new RegExp("["+Uc+"]","g"),Oc="[^"+Uc+"]",hp="[^"+Uc.replace("\\.","")+"]",up=/((?:WC+[\/:])*)/.source.replace("WC",Oc),dp=/(WCOD+)?/.source.replace("WCOD",hp),fp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Oc),pp=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Oc),mp=new RegExp("^"+up+dp+fp+pp+"$"),gp=["material","materials","bones","map"],ic=class{constructor(t,e,n){let s=n||de.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},de=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(cp,"")}static parseTrackName(t){let e=mp.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);gp.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){It("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){Bt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Bt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Bt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Bt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Bt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Bt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){Bt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;Bt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Bt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Bt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};de.Composite=ic;de.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};de.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};de.prototype.GetterByBindingType=[de.prototype._getValue_direct,de.prototype._getValue_array,de.prototype._getValue_arrayElement,de.prototype._getValue_toArray];de.prototype.SetterByBindingTypeAndVersioning=[[de.prototype._setValue_direct,de.prototype._setValue_direct_setNeedsUpdate,de.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[de.prototype._setValue_array,de.prototype._setValue_array_setNeedsUpdate,de.prototype._setValue_array_setMatrixWorldNeedsUpdate],[de.prototype._setValue_arrayElement,de.prototype._setValue_arrayElement_setNeedsUpdate,de.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[de.prototype._setValue_fromArray,de.prototype._setValue_fromArray_setNeedsUpdate,de.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Zx=new Float32Array(1);var nu=new Zt,Dr=class{constructor(t,e,n=0,s=1/0){this.ray=new Ti(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new Is,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Bt("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return nu.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(nu),this}intersectObject(t,e=!0,n=[]){return sc(t,this,n,e),n.sort(iu),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)sc(t[s],this,n,e);return n.sort(iu),n}};function iu(i,t){return i.distance-t.distance}function sc(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let a=0,o=r.length;a<o;a++)sc(r[a],t,e,!0)}}var Os=class{constructor(t=1,e=0,n=0){this.radius=t,this.phi=e,this.theta=n}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Wt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(Wt(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Gc=class Gc{constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};Gc.prototype.isMatrix2=!0;var rc=Gc;var Nr=class extends yr{constructor(t=10,e=10,n=4473924,s=8947848){n=new Ut(n),s=new Ut(s);let r=e/2,a=t/e,o=t/2,l=[],c=[];for(let f=0,u=0,m=-o;f<=e;f++,m+=a){l.push(-o,0,m,o,0,m),l.push(m,0,-o,m,0,o);let x=f===r?n:s;x.toArray(c,u),u+=3,x.toArray(c,u),u+=3,x.toArray(c,u),u+=3,x.toArray(c,u),u+=3}let h=new Xe;h.setAttribute("position",new ee(l,3)),h.setAttribute("color",new ee(c,3));let d=new Ds({vertexColors:!0,toneMapped:!1});super(h,d),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Ur=class extends yr{constructor(t,e=16776960){let n=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),s=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],r=new Xe;r.setIndex(new vn(n,1)),r.setAttribute("position",new ee(s,3)),super(r,new Ds({color:e,toneMapped:!1})),this.box=t,this.type="Box3Helper",this.geometry.computeBoundingSphere()}updateMatrixWorld(t){let e=this.box;e.isEmpty()||(e.getCenter(this.position),e.getSize(this.scale),this.scale.multiplyScalar(.5),super.updateMatrixWorld(t))}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Or=class extends Dn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}};function Fc(i,t,e,n){let s=_p(n);switch(e){case Sc:return i*t;case Mo:return i*t/s.components*s.byteLength;case wo:return i*t/s.components*s.byteLength;case Oi:return i*t*2/s.components*s.byteLength;case Eo:return i*t*2/s.components*s.byteLength;case Mc:return i*t*3/s.components*s.byteLength;case kn:return i*t*4/s.components*s.byteLength;case To:return i*t*4/s.components*s.byteLength;case kr:case zr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Hr:case Gr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ro:case Po:return Math.max(i,16)*Math.max(t,8)/4;case Ao:case Co:return Math.max(i,8)*Math.max(t,8)/2;case Io:case Lo:case No:case Uo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Do:case Vr:case Oo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Fo:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Bo:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ko:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case zo:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Ho:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Go:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Vo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Wo:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Xo:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case $o:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case qo:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Yo:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Zo:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Jo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case jo:case Ko:case Qo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case tl:case el:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Wr:case nl:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function _p(i){switch(i){case tn:case xc:return{byteLength:1,components:1};case zs:case yc:case Bn:return{byteLength:2,components:1};case bo:case So:return{byteLength:2,components:4};case Fn:case vo:case Mn:return{byteLength:4,components:1};case vc:case bc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"187"}}));typeof window<"u"&&(window.__THREE__?It("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="187");function pd(){let i=null,t=!1,e=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),e(r,a)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function yp(i){let t=new WeakMap;function e(o,l){let c=o.array,h=o.usage,d=c.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,c,h),o.onUploadCallback();let u;if(c instanceof Float32Array)u=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)u=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?u=i.HALF_FLOAT:u=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)u=i.SHORT;else if(c instanceof Uint32Array)u=i.UNSIGNED_INT;else if(c instanceof Int32Array)u=i.INT;else if(c instanceof Int8Array)u=i.BYTE;else if(c instanceof Uint8Array)u=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)u=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:u,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){let h=l.array,d=l.updateRanges;if(i.bindBuffer(c,o),d.length===0)i.bufferSubData(c,0,h);else{d.sort((u,m)=>u.start-m.start);let f=0;for(let u=1;u<d.length;u++){let m=d[f],x=d[u];x.start<=m.start+m.count+1?m.count=Math.max(m.count,x.start+x.count-m.start):(++f,d[f]=x)}d.length=f+1;for(let u=0,m=d.length;u<m;u++){let x=d[u];i.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var vp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,bp=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Sp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Mp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,wp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Ep=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Tp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ap=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Rp=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Cp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Pp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Ip=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Lp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Dp=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Np=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Up=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Op=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Fp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Bp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,kp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,zp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Hp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Gp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Vp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Wp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Xp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,$p=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,qp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Yp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Zp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Jp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,jp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Kp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,Qp=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,tm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,em=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,nm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,im=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,sm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,rm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,am=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,om=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,cm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,hm=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,um=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,dm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,fm=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,pm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,mm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,gm=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,_m=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,xm=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,ym=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,vm=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,bm=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Sm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Mm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,wm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Em=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Tm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Am=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Rm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Cm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Pm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Im=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Lm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Dm=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Nm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Um=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Om=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Fm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Bm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,km=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,zm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Hm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Gm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Vm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Wm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Xm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,$m=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,qm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ym=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Zm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Jm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,jm=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Km=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Qm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,t0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,e0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,n0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,i0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,s0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,r0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,a0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,o0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,l0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,c0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,h0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,u0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,d0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,f0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,p0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,m0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,g0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,_0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,x0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,y0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,v0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,b0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,S0=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,M0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,w0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,E0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,T0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,A0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,R0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,C0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,P0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,I0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,L0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,D0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,N0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,U0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,O0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,F0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,B0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,k0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,z0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,H0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,G0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,V0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,W0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,X0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,q0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Y0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Z0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,J0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,j0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,K0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,qt={alphahash_fragment:vp,alphahash_pars_fragment:bp,alphamap_fragment:Sp,alphamap_pars_fragment:Mp,alphatest_fragment:wp,alphatest_pars_fragment:Ep,aomap_fragment:Tp,aomap_pars_fragment:Ap,batching_pars_vertex:Rp,batching_vertex:Cp,begin_vertex:Pp,beginnormal_vertex:Ip,bsdfs:Lp,iridescence_fragment:Dp,bumpmap_pars_fragment:Np,clipping_planes_fragment:Up,clipping_planes_pars_fragment:Op,clipping_planes_pars_vertex:Fp,clipping_planes_vertex:Bp,color_fragment:kp,color_pars_fragment:zp,color_pars_vertex:Hp,color_vertex:Gp,common:Vp,defaultnormal_vertex:Wp,displacementmap_pars_vertex:Xp,displacementmap_vertex:$p,emissivemap_fragment:qp,emissivemap_pars_fragment:Yp,colorspace_fragment:Zp,colorspace_pars_fragment:Jp,envmap_fragment:jp,envmap_common_pars_fragment:Kp,envmap_pars_fragment:Qp,envmap_pars_vertex:tm,envmap_physical_pars_fragment:um,envmap_vertex:em,fog_vertex:nm,fog_pars_vertex:im,fog_fragment:sm,fog_pars_fragment:rm,gradientmap_pars_fragment:am,lightmap_pars_fragment:om,lights_lambert_fragment:lm,lights_lambert_pars_fragment:cm,lights_pars_begin:hm,lights_toon_fragment:dm,lights_toon_pars_fragment:fm,lights_phong_fragment:pm,lights_phong_pars_fragment:mm,lights_physical_fragment:gm,lights_physical_pars_fragment:_m,lights_fragment_begin:xm,lights_fragment_maps:ym,lights_fragment_end:vm,lightprobes_pars_fragment:bm,logdepthbuf_fragment:Sm,logdepthbuf_pars_fragment:Mm,logdepthbuf_pars_vertex:wm,logdepthbuf_vertex:Em,map_fragment:Tm,map_pars_fragment:Am,map_particle_fragment:Rm,map_particle_pars_fragment:Cm,metalnessmap_fragment:Pm,metalnessmap_pars_fragment:Im,morphinstance_vertex:Lm,morphcolor_vertex:Dm,morphnormal_vertex:Nm,morphtarget_pars_vertex:Um,morphtarget_vertex:Om,normal_fragment_begin:Fm,normal_fragment_maps:Bm,normal_pars_fragment:km,normal_pars_vertex:zm,normal_vertex:Hm,normalmap_pars_fragment:Gm,clearcoat_normal_fragment_begin:Vm,clearcoat_normal_fragment_maps:Wm,clearcoat_pars_fragment:Xm,iridescence_pars_fragment:$m,opaque_fragment:qm,packing:Ym,premultiplied_alpha_fragment:Zm,project_vertex:Jm,dithering_fragment:jm,dithering_pars_fragment:Km,roughnessmap_fragment:Qm,roughnessmap_pars_fragment:t0,shadowmap_pars_fragment:e0,shadowmap_pars_vertex:n0,shadowmap_vertex:i0,shadowmask_pars_fragment:s0,skinbase_vertex:r0,skinning_pars_vertex:a0,skinning_vertex:o0,skinnormal_vertex:l0,specularmap_fragment:c0,specularmap_pars_fragment:h0,tonemapping_fragment:u0,tonemapping_pars_fragment:d0,transmission_fragment:f0,transmission_pars_fragment:p0,uv_pars_fragment:m0,uv_pars_vertex:g0,uv_vertex:_0,worldpos_vertex:x0,background_vert:y0,background_frag:v0,backgroundCube_vert:b0,backgroundCube_frag:S0,cube_vert:M0,cube_frag:w0,depth_vert:E0,depth_frag:T0,distance_vert:A0,distance_frag:R0,equirect_vert:C0,equirect_frag:P0,linedashed_vert:I0,linedashed_frag:L0,meshbasic_vert:D0,meshbasic_frag:N0,meshlambert_vert:U0,meshlambert_frag:O0,meshmatcap_vert:F0,meshmatcap_frag:B0,meshnormal_vert:k0,meshnormal_frag:z0,meshphong_vert:H0,meshphong_frag:G0,meshphysical_vert:V0,meshphysical_frag:W0,meshtoon_vert:X0,meshtoon_frag:$0,points_vert:q0,points_frag:Y0,shadow_vert:Z0,shadow_frag:J0,sprite_vert:j0,sprite_frag:K0},xt={common:{diffuse:{value:new Ut(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new kt}},envmap:{envMap:{value:null},envMapRotation:{value:new kt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new kt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new kt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new kt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new kt},normalScale:{value:new gt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new kt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new kt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new kt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new kt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ut(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Ut(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0},uvTransform:{value:new kt}},sprite:{diffuse:{value:new Ut(16777215)},opacity:{value:1},center:{value:new gt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}}},Kn={basic:{uniforms:$e([xt.common,xt.specularmap,xt.envmap,xt.aomap,xt.lightmap,xt.fog]),vertexShader:qt.meshbasic_vert,fragmentShader:qt.meshbasic_frag},lambert:{uniforms:$e([xt.common,xt.specularmap,xt.envmap,xt.aomap,xt.lightmap,xt.emissivemap,xt.bumpmap,xt.normalmap,xt.displacementmap,xt.fog,xt.lights,{emissive:{value:new Ut(0)},envMapIntensity:{value:1}}]),vertexShader:qt.meshlambert_vert,fragmentShader:qt.meshlambert_frag},phong:{uniforms:$e([xt.common,xt.specularmap,xt.envmap,xt.aomap,xt.lightmap,xt.emissivemap,xt.bumpmap,xt.normalmap,xt.displacementmap,xt.fog,xt.lights,{emissive:{value:new Ut(0)},specular:{value:new Ut(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:qt.meshphong_vert,fragmentShader:qt.meshphong_frag},standard:{uniforms:$e([xt.common,xt.envmap,xt.aomap,xt.lightmap,xt.emissivemap,xt.bumpmap,xt.normalmap,xt.displacementmap,xt.roughnessmap,xt.metalnessmap,xt.fog,xt.lights,{emissive:{value:new Ut(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:qt.meshphysical_vert,fragmentShader:qt.meshphysical_frag},toon:{uniforms:$e([xt.common,xt.aomap,xt.lightmap,xt.emissivemap,xt.bumpmap,xt.normalmap,xt.displacementmap,xt.gradientmap,xt.fog,xt.lights,{emissive:{value:new Ut(0)}}]),vertexShader:qt.meshtoon_vert,fragmentShader:qt.meshtoon_frag},matcap:{uniforms:$e([xt.common,xt.bumpmap,xt.normalmap,xt.displacementmap,xt.fog,{matcap:{value:null}}]),vertexShader:qt.meshmatcap_vert,fragmentShader:qt.meshmatcap_frag},points:{uniforms:$e([xt.points,xt.fog]),vertexShader:qt.points_vert,fragmentShader:qt.points_frag},dashed:{uniforms:$e([xt.common,xt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:qt.linedashed_vert,fragmentShader:qt.linedashed_frag},depth:{uniforms:$e([xt.common,xt.displacementmap]),vertexShader:qt.depth_vert,fragmentShader:qt.depth_frag},normal:{uniforms:$e([xt.common,xt.bumpmap,xt.normalmap,xt.displacementmap,{opacity:{value:1}}]),vertexShader:qt.meshnormal_vert,fragmentShader:qt.meshnormal_frag},sprite:{uniforms:$e([xt.sprite,xt.fog]),vertexShader:qt.sprite_vert,fragmentShader:qt.sprite_frag},background:{uniforms:{uvTransform:{value:new kt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:qt.background_vert,fragmentShader:qt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new kt}},vertexShader:qt.backgroundCube_vert,fragmentShader:qt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:qt.cube_vert,fragmentShader:qt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:qt.equirect_vert,fragmentShader:qt.equirect_frag},distance:{uniforms:$e([xt.common,xt.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:qt.distance_vert,fragmentShader:qt.distance_frag},shadow:{uniforms:$e([xt.lights,xt.fog,{color:{value:new Ut(0)},opacity:{value:1}}]),vertexShader:qt.shadow_vert,fragmentShader:qt.shadow_frag}};Kn.physical={uniforms:$e([Kn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new kt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new kt},clearcoatNormalScale:{value:new gt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new kt},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new kt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new kt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new kt},sheen:{value:0},sheenColor:{value:new Ut(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new kt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new kt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new kt},transmissionSamplerSize:{value:new gt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new kt},attenuationDistance:{value:0},attenuationColor:{value:new Ut(0)},specularColor:{value:new Ut(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new kt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new kt},anisotropyVector:{value:new gt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new kt}}]),vertexShader:qt.meshphysical_vert,fragmentShader:qt.meshphysical_frag};var il={r:0,b:0,g:0},Q0=new Zt,md=new kt;md.set(-1,0,0,0,1,0,0,0,1);function tg(i,t,e,n,s,r){let a=new Ut(0),o=s===!0?0:1,l,c,h=null,d=0,f=null;function u(v){let w=v.isScene===!0?v.background:null;if(w&&w.isTexture){let S=v.backgroundBlurriness>0;w=t.get(w,S)}return w}function m(v){let w=!1,S=u(v);S===null?g(a,o):S&&S.isColor&&(g(S,1),w=!0);let T=i.xr.getEnvironmentBlendMode();T==="additive"?e.buffers.color.setClear(0,0,0,1,r):T==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||w)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function x(v,w){let S=u(w);S&&S.isCubeTexture?(c===void 0&&(c=new ue(new bn(1,1,1),new Sn({name:"BackgroundCubeMaterial",uniforms:rs(Kn.backgroundCube.uniforms),vertexShader:Kn.backgroundCube.vertexShader,fragmentShader:Kn.backgroundCube.fragmentShader,side:ke,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,E,_){this.matrixWorld.copyPosition(_.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=S,c.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Q0.makeRotationFromEuler(w.backgroundRotation)).transpose(),S.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(md),c.material.toneMapped=Qt.getTransfer(S.colorSpace)!==se,(h!==S||d!==S.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,h=S,d=S.version,f=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):S&&S.isTexture&&(l===void 0&&(l=new ue(new fe(2,2),new Sn({name:"BackgroundMaterial",uniforms:rs(Kn.background.uniforms),vertexShader:Kn.background.vertexShader,fragmentShader:Kn.background.fragmentShader,side:Ui,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=S,l.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,l.material.toneMapped=Qt.getTransfer(S.colorSpace)!==se,S.matrixAutoUpdate===!0&&S.updateMatrix(),l.material.uniforms.uvTransform.value.copy(S.matrix),(h!==S||d!==S.version||f!==i.toneMapping)&&(l.material.needsUpdate=!0,h=S,d=S.version,f=i.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function g(v,w){v.getRGB(il,Nc(i)),e.buffers.color.setClear(il.r,il.g,il.b,w,r)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,w=1){a.set(v),o=w,g(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,g(a,o)},render:m,addToRenderList:x,dispose:p}}function eg(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,a=!1;function o(D,O,V,I,X){let q=!1,H=d(D,I,V,O);r!==H&&(r=H,c(r.object)),q=u(D,I,V,X),q&&m(D,I,V,X),X!==null&&t.update(X,i.ELEMENT_ARRAY_BUFFER),(q||a)&&(a=!1,S(D,O,V,I),X!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(X).buffer))}function l(){return i.createVertexArray()}function c(D){return i.bindVertexArray(D)}function h(D){return i.deleteVertexArray(D)}function d(D,O,V,I){let X=I.wireframe===!0,q=n[O.id];q===void 0&&(q={},n[O.id]=q);let H=D.isInstancedMesh===!0?D.id:0,Q=q[H];Q===void 0&&(Q={},q[H]=Q);let G=Q[V.id];G===void 0&&(G={},Q[V.id]=G);let nt=G[X];return nt===void 0&&(nt=f(l()),G[X]=nt),nt}function f(D){let O=[],V=[],I=[];for(let X=0;X<e;X++)O[X]=0,V[X]=0,I[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:V,attributeDivisors:I,object:D,attributes:{},index:null}}function u(D,O,V,I){let X=r.attributes,q=O.attributes,H=0,Q=V.getAttributes();for(let G in Q)if(Q[G].location>=0){let it=X[G],At=q[G];if(At===void 0&&(G==="instanceMatrix"&&D.instanceMatrix&&(At=D.instanceMatrix),G==="instanceColor"&&D.instanceColor&&(At=D.instanceColor)),it===void 0||it.attribute!==At||At&&it.data!==At.data)return!0;H++}return r.attributesNum!==H||r.index!==I}function m(D,O,V,I){let X={},q=O.attributes,H=0,Q=V.getAttributes();for(let G in Q)if(Q[G].location>=0){let it=q[G];it===void 0&&(G==="instanceMatrix"&&D.instanceMatrix&&(it=D.instanceMatrix),G==="instanceColor"&&D.instanceColor&&(it=D.instanceColor));let At={};At.attribute=it,it&&it.data&&(At.data=it.data),X[G]=At,H++}r.attributes=X,r.attributesNum=H,r.index=I}function x(){let D=r.newAttributes;for(let O=0,V=D.length;O<V;O++)D[O]=0}function g(D){p(D,0)}function p(D,O){let V=r.newAttributes,I=r.enabledAttributes,X=r.attributeDivisors;V[D]=1,I[D]===0&&(i.enableVertexAttribArray(D),I[D]=1),X[D]!==O&&(i.vertexAttribDivisor(D,O),X[D]=O)}function v(){let D=r.newAttributes,O=r.enabledAttributes;for(let V=0,I=O.length;V<I;V++)O[V]!==D[V]&&(i.disableVertexAttribArray(V),O[V]=0)}function w(D,O,V,I,X,q,H){H===!0?i.vertexAttribIPointer(D,O,V,X,q):i.vertexAttribPointer(D,O,V,I,X,q)}function S(D,O,V,I){x();let X=I.attributes,q=V.getAttributes(),H=O.defaultAttributeValues;for(let Q in q){let G=q[Q];if(G.location>=0){let nt=X[Q];if(nt===void 0&&(Q==="instanceMatrix"&&D.instanceMatrix&&(nt=D.instanceMatrix),Q==="instanceColor"&&D.instanceColor&&(nt=D.instanceColor)),nt!==void 0){let it=nt.normalized,At=nt.itemSize,Ht=t.get(nt);if(Ht===void 0)continue;let J=Ht.buffer,yt=Ht.type,Mt=Ht.bytesPerElement,Lt=yt===i.INT||yt===i.UNSIGNED_INT||nt.gpuType===vo;if(nt.isInterleavedBufferAttribute){let vt=nt.data,Vt=vt.isInterleavedBuffer===!0?vt.stride:vt.itemSize,ve=nt.offset;if(vt.isInstancedInterleavedBuffer||vt.isInstancedBufferAttribute){for(let Ot=0;Ot<G.locationSize;Ot++)p(G.location+Ot,vt.meshPerAttribute);D.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=vt.meshPerAttribute*vt.count)}else for(let Ot=0;Ot<G.locationSize;Ot++)g(G.location+Ot);i.bindBuffer(i.ARRAY_BUFFER,J);for(let Ot=0;Ot<G.locationSize;Ot++)w(G.location+Ot,At/G.locationSize,yt,it,Vt*Mt,(ve+At/G.locationSize*Ot)*Mt,Lt)}else{if(nt.isInstancedBufferAttribute){for(let vt=0;vt<G.locationSize;vt++)p(G.location+vt,nt.meshPerAttribute);D.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=nt.meshPerAttribute*nt.count)}else for(let vt=0;vt<G.locationSize;vt++)g(G.location+vt);i.bindBuffer(i.ARRAY_BUFFER,J);for(let vt=0;vt<G.locationSize;vt++)w(G.location+vt,At/G.locationSize,yt,it,At*Mt,At/G.locationSize*vt*Mt,Lt)}}else if(H!==void 0){let it=H[Q];if(it!==void 0)switch(it.length){case 2:i.vertexAttrib2fv(G.location,it);break;case 3:i.vertexAttrib3fv(G.location,it);break;case 4:i.vertexAttrib4fv(G.location,it);break;default:i.vertexAttrib1fv(G.location,it)}}}}v()}function T(){N();for(let D in n){let O=n[D];for(let V in O){let I=O[V];for(let X in I){let q=I[X];for(let H in q)h(q[H].object),delete q[H];delete I[X]}}delete n[D]}}function E(D){if(n[D.id]===void 0)return;let O=n[D.id];for(let V in O){let I=O[V];for(let X in I){let q=I[X];for(let H in q)h(q[H].object),delete q[H];delete I[X]}}delete n[D.id]}function _(D){for(let O in n){let V=n[O];for(let I in V){let X=V[I];if(X[D.id]===void 0)continue;let q=X[D.id];for(let H in q)h(q[H].object),delete q[H];delete X[D.id]}}}function M(D){for(let O in n){let V=n[O],I=D.isInstancedMesh===!0?D.id:0,X=V[I];if(X!==void 0){for(let q in X){let H=X[q];for(let Q in H)h(H[Q].object),delete H[Q];delete X[q]}delete V[I],Object.keys(V).length===0&&delete n[O]}}}function N(){P(),a=!0,r!==s&&(r=s,c(r.object))}function P(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:N,resetDefaultState:P,dispose:T,releaseStatesOfGeometry:E,releaseStatesOfObject:M,releaseStatesOfProgram:_,initAttributes:x,enableAttribute:g,disableUnusedAttributes:v}}function ng(i,t,e){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),e.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),e.update(c,n,h))}function o(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let f=0;for(let u=0;u<h;u++)f+=c[u];e.update(f,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function ig(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let _=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(_.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(_){return!(_!==kn&&n.convert(_)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(_){let M=_===Bn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(_!==tn&&_!==Mn&&!M&&n.convert(_)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(_){if(_==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";_="mediump"}return _==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(It("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),f=e.logarithmicDepthBuffer===!0&&d===!1;e.reversedDepthBuffer===!0&&d===!1&&It("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),e.logarithmicDepthBuffer===!0&&d===!0&&It("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),v=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),S=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),T=i.getParameter(i.MAX_SAMPLES),E=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:u,maxVertexTextures:m,maxTextureSize:x,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:v,maxVaryings:w,maxFragmentUniforms:S,maxSamples:T,samples:E}}function sg(i){let t=this,e=null,n=0,s=!1,r=!1,a=new ln,o=new kt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,f){let u=d.length!==0||f||n!==0||s;return s=f,n=d.length,u},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,f){e=h(d,f,0)},this.setState=function(d,f,u){let m=d.clippingPlanes,x=d.clipIntersection,g=d.clipShadows,p=i.get(d);if(!s||m===null||m.length===0||r&&!g)r?h(null):c();else{let v=r?0:n,w=v*4,S=p.clippingState||null;l.value=S,S=h(m,f,w,u);for(let T=0;T!==w;++T)S[T]=e[T];p.clippingState=S,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,f,u,m){let x=d!==null?d.length:0,g=null;if(x!==0){if(g=l.value,m!==!0||g===null){let p=u+x*4,v=f.matrixWorldInverse;o.getNormalMatrix(v),(g===null||g.length<p)&&(g=new Float32Array(p));for(let w=0,S=u;w!==x;++w,S+=4)a.copy(d[w]).applyMatrix4(v,o),a.normal.toArray(g,S),g[S+3]=a.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,g}}var Yr=class extends cn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new vr(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new bn(5,5,5),r=new Sn({name:"CubemapFromEquirect",uniforms:rs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:ke,blending:ts});r.uniforms.tEquirect.value=e;let a=new ue(s,r),o=e.minFilter;return e.minFilter===hi&&(e.minFilter=Ze),new Us(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}},qu=256,rg=3,ag=20,gd=256,_d=16,og=3,lg=new R,cg=new Ut,Vs=class i{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Us(1,10,null),this._boxMesh=new ue(new bn(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:a=256,position:o=lg}=r,l=this._renderer;this._setSize(a);let c=this._allocateTarget(),h=this._getSourceTarget(!0);e>0&&(h.texture.mipmapsAutoUpdate=!1);let d=l.autoClear,f=l.autoClearColor,u=l.autoClearDepth,m=l.autoClearStencil,x=t.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,x===null&&(t.background=l.getClearColor(cg));let g=new Us(n,s,h);return g.position.copy(o),g.update(l,t),l.autoClear=d,l.autoClearColor=f,l.autoClearDepth=u,l.autoClearStencil=m,t.background=x,e>0&&(h.texture.mipmapsAutoUpdate=!0,this._blur(c,e)),this._applyPMREM(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ju(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Zu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,e){return e>0?1-Math.sqrt(1-t/e):0}_setSize(t){this._cubeSize=Math.max(qu,Pc(t))}_fromTexture(t,e){t.mapping===is||t.mapping===ks?this._setSize(t.image.length===0?qu:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);let n=e||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(n),n}_allocateTarget(){let t=this._cubeSize,e=Yu(t,!1,!1),n=Math.log2(t)-rg;for(let s=0;s<=n;s++)e.texture.mipmaps.push({width:t>>s,height:t>>s});return e.texture.name="PMREM",e.texture.isPMREMTexture=!0,e}_getSourceTarget(t=!1){let e=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==e||t&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Yu(e,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,e,n){let s=this._boxMesh,r=this._cubeCamera;s.material=n,r.renderTarget=t,r.activeMipmapLevel=e;let a=t.width>>e;t.viewport.set(0,0,a,a),r.update(this._renderer,s),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let e;t.mapping===is||t.mapping===ks?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ju()),e=this._cubemapMaterial,e.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Zu()),e=this._equirectMaterial),e.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,e)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=hg(),this._integrationMaterial=ug());let e=this._cubeSize,n=t.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;let r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(e/_d);for(let a=0;a<=n;a++){let o=i.lodToRoughness(a,n);if(a>n-og)r.roughness.value=o,this._renderCube(t,a,this._integrationMaterial);else{let l=o>0?Math.log2(e)+.5*Math.log2(6/(gd*Math.pow(o,4)))+.5:0;s.roughness.value=o,s.lodBias.value=l,this._renderCube(t,a,this._ggxMaterial)}}}_blur(t,e){this._blurMaterial===null&&(this._blurMaterial=dg());let n=this._blurMaterial,s=n.uniforms,r=this._sourceTarget;s.sigma.value=Math.min(e,Math.PI)/Math.SQRT2,s.envMap.value=r.texture,this._renderCube(t,0,n),s.envMap.value=t.texture,this._renderCube(r,0,n)}};function Yu(i,t,e){return new Yr(i,{minFilter:hi,generateMipmaps:t,type:Bn,colorSpace:hr,depthBuffer:e})}function Zr(i,t,e){return new Sn({name:i,uniforms:t,vertexShader:qt.cube_vert,fragmentShader:e,side:ke,blending:ts,depthTest:!1,depthWrite:!1})}function hg(){return Zr("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${gd}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function ug(){return Zr("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:_d}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function dg(){return Zr("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${ag}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function Zu(){return Zr("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Ju(){return Zr("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function fg(i){let t=new WeakMap,e=new WeakMap,n=null;function s(f,u=!1){return f==null?null:u?a(f):r(f)}function r(f){if(f&&f.isTexture){let u=f.mapping;if(u===_o||u===xo)if(t.has(f)){let m=t.get(f).texture;return o(m,f.mapping)}else{let m=f.image;if(m&&m.height>0){let x=new Yr(m.height);return x.fromEquirectangularTexture(i,f),t.set(f,x),f.addEventListener("dispose",c),o(x.texture,f.mapping)}else return null}}return f}function a(f){if(f&&f.isTexture&&f.isPMREMTexture!==!0){let u=f.mapping,m=u===_o||u===xo,x=u===is||u===ks;if(m||x){let g=e.get(f),p=g!==void 0?g.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==p)return n===null&&(n=new Vs(i)),g=m?n.fromEquirectangular(f,g):n.fromCubemap(f,g),g.texture.pmremVersion=f.pmremVersion,e.set(f,g),g.texture;if(g!==void 0)return g.texture;{let v=f.image;return m&&v&&v.height>0||x&&v&&l(v)?(n===null&&(n=new Vs(i)),g=m?n.fromEquirectangular(f):n.fromCubemap(f),g.texture.pmremVersion=f.pmremVersion,e.set(f,g),f.addEventListener("dispose",h),g.texture):null}}}return f}function o(f,u){return u===_o?f.mapping=is:u===xo&&(f.mapping=ks),f}function l(f){let u=0,m=6;for(let x=0;x<m;x++)f[x]!==void 0&&u++;return u===m}function c(f){let u=f.target;u.removeEventListener("dispose",c);let m=t.get(u);m!==void 0&&(t.delete(u),m.dispose())}function h(f){let u=f.target;u.removeEventListener("dispose",h);let m=e.get(u);m!==void 0&&(e.delete(u),m.dispose())}function d(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function pg(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&Xi("WebGLRenderer: "+n+" extension not supported."),s}}}function mg(i,t,e,n){let s={},r=new WeakMap,a=new FinalizationRegistry(m=>delete s[m]);function o(m){l(m.target)}function l(m){m.index!==null&&t.remove(m.index);for(let g in m.attributes)t.remove(m.attributes[g]);m.removeEventListener("dispose",o),delete s[m.id],a.unregister(m);let x=r.get(m);x&&(t.remove(x),r.delete(m)),n.releaseStatesOfGeometry(m),m.isInstancedBufferGeometry===!0&&delete m._maxInstanceCount,e.memory.geometries--}function c(m,x){return s[x.id]!==void 0||(x.addEventListener("dispose",o),s[x.id]=new WeakRef(x),a.register(x,x.id,x),e.memory.geometries++),x}function h(m){let x=m.attributes;for(let g in x)t.update(x[g],i.ARRAY_BUFFER)}function d(m){let x=m.index,g=m.attributes.position,p=0;if(g===void 0)return;let v=x!==null?x.array.length:g.array.length/3-1,w=g.count>=65535?gr:mr,S=new w(Math.ceil(v/3)*6,1),T=S.array;if(x!==null){let _=x.array;p=x.version;for(let M=0,N=0;M<v;M+=3){let P=_[M+0],D=_[M+1],O=_[M+2];T[N++]=P,T[N++]=D,T[N++]=D,T[N++]=O,T[N++]=O,T[N++]=P}}else{p=g.version;for(let _=0,M=0;_<v;_+=3){let N=_+0,P=_+1,D=_+2;T[M++]=N,T[M++]=P,T[M++]=P,T[M++]=D,T[M++]=D,T[M++]=N}}S.version=p;let E=r.get(m);E&&t.remove(E),r.set(m,S)}function f(m){let x=r.get(m);if(x){let g=m.index;g!==null&&x.version<g.version&&d(m)}else d(m);return r.get(m)}function u(){for(let m in s){let x=s[m].deref();x!==void 0&&l(x)}}return{get:c,update:h,getWireframeAttribute:f,dispose:u}}function gg(i,t,e){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,f){i.drawElements(n,f,r,d*a),e.update(f,n,1)}function c(d,f,u){u!==0&&(i.drawElementsInstanced(n,f,r,d*a,u),e.update(f,n,u))}function h(d,f,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,u);let x=0;for(let g=0;g<u;g++)x+=f[g];e.update(x,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function _g(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:Bt("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function xg(i,t,e){let n=new WeakMap,s=new ge;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0,f=n.get(o);if(f===void 0||f.count!==d){let N=function(){_.dispose(),n.delete(o),o.removeEventListener("dispose",N)};f!==void 0&&f.texture.dispose();let u=o.morphAttributes.position!==void 0,m=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],w=0;u===!0&&(w=1),m===!0&&(w=2),x===!0&&(w=3);let S=o.attributes.position.count*w,T=1;S>t.maxTextureSize&&(T=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);let E=new Float32Array(S*T*4*d),_=new fr(E,S,T,d);_.type=Mn,_.needsUpdate=!0;let M=w*4;for(let P=0;P<d;P++){let D=g[P],O=p[P],V=v[P],I=S*T*4*P;for(let X=0;X<D.count;X++){let q=X*M;u===!0&&(s.fromBufferAttribute(D,X),E[I+q+0]=s.x,E[I+q+1]=s.y,E[I+q+2]=s.z,E[I+q+3]=0),m===!0&&(s.fromBufferAttribute(O,X),E[I+q+4]=s.x,E[I+q+5]=s.y,E[I+q+6]=s.z,E[I+q+7]=0),x===!0&&(s.fromBufferAttribute(V,X),E[I+q+8]=s.x,E[I+q+9]=s.y,E[I+q+10]=s.z,E[I+q+11]=V.itemSize===4?s.w:1)}}f={count:d,texture:_,size:new gt(S,T)},n.set(o,f),o.addEventListener("dispose",N)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let u=0;for(let x=0;x<c.length;x++)u+=c[x];let m=o.morphTargetsRelative?1:1-u;l.getUniforms().setValue(i,"morphTargetBaseInfluence",m),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function yg(i,t,e,n,s){let r=new WeakMap;function a(c){let h=s.render.frame,d=c.geometry,f=t.get(c,d);if(r.get(f)!==h&&(t.update(f),r.set(f,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let u=c.skeleton;r.get(u)!==h&&(u.update(),r.set(u,h))}return f}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:a,dispose:o}}var vg={[uc]:"LINEAR_TONE_MAPPING",[dc]:"REINHARD_TONE_MAPPING",[fc]:"CINEON_TONE_MAPPING",[Fr]:"ACES_FILMIC_TONE_MAPPING",[mc]:"AGX_TONE_MAPPING",[gc]:"NEUTRAL_TONE_MAPPING",[pc]:"CUSTOM_TONE_MAPPING"};function bg(i,t,e,n,s,r){let a=new cn(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=null,h=new Xe;h.setAttribute("position",new ee([-1,3,0,-1,-1,0,3,-1,0],3)),h.setAttribute("uv",new ee([0,2,0,0,2,0],2));let d=new to({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new ue(h,d),u=new Ir(-1,1,1,-1,0,1),m=null,x=null,g=!1,p,v=null,w=[],S=!1;this.setSize=function(T,E){a.setSize(T,E),o!==null&&o.setSize(T,E),l!==null&&l.setSize(T,E);for(let _=0;_<w.length;_++){let M=w[_];M.setSize&&M.setSize(T,E)}},this.setEffects=function(T){w=T,S=w.length>0&&w[0].isRenderPass===!0;let E=a.width,_=a.height;w.length>0&&o===null&&(o=new cn(E,_,{type:Bn,depthBuffer:!1,stencilBuffer:!1}),l=new cn(E,_,{type:Bn,depthBuffer:!1,stencilBuffer:!1}));let M=s===!0&&w.some(N=>N.needsDepthTexture===!0);M!==(a.depthTexture!==null)&&(M===!0&&c===null&&(c=new li(E,_),r===!0&&(c.format=ui,c.type=ss)),a.dispose(),a.depthTexture=M?c:null,a.resolveDepthBuffer=M,a.storeMultisampledDepthBuffer=M);for(let N=0;N<w.length;N++){let P=w[N];P.setSize&&P.setSize(E,_),M&&P.needsDepthTexture===!0&&P.setDepthTexture&&P.setDepthTexture(c)}},this.begin=function(T,E){if(g||T.toneMapping===Jn&&w.length===0)return!1;if(v=E,E!==null){let _=E.width,M=E.height;(a.width!==_||a.height!==M)&&this.setSize(_,M)}return S===!1&&T.setRenderTarget(a),p=T.toneMapping,T.toneMapping=Jn,!0},this.hasRenderPass=function(){return S},this.end=function(T,E){T.toneMapping=p,g=!0;let _=a,M=o;for(let N=0;N<w.length;N++){let P=w[N];P.enabled!==!1&&(P.render(T,M,_,E),P.needsSwap!==!1&&(_=M,M=M===o?l:o))}if(m!==T.outputColorSpace||x!==T.toneMapping){m=T.outputColorSpace,x=T.toneMapping,d.defines={},Qt.getTransfer(m)===se&&(d.defines.SRGB_TRANSFER="");let N=vg[x];N&&(d.defines[N]=""),d.needsUpdate=!0}d.uniforms.tDiffuse.value=_.texture,T.setRenderTarget(v),T.render(f,u),v=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),h.dispose(),d.dispose()}}var xd=new je,yd=new li(1,1),vd=new br(1),bd=new fr,Sd=new Va,Md=new vr,ju=[],Ku=[],Qu=new Float32Array(16),td=new Float32Array(9),ed=new Float32Array(4);function Ws(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=ju[s];if(r===void 0&&(r=new Float32Array(s),ju[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function Ee(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Te(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function al(i,t){let e=Ku[t];e===void 0&&(e=new Int32Array(t),Ku[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Sg(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Mg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2fv(this.addr,t),Te(e,t)}}function wg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ee(e,t))return;i.uniform3fv(this.addr,t),Te(e,t)}}function Eg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4fv(this.addr,t),Te(e,t)}}function Tg(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;ed.set(n),i.uniformMatrix2fv(this.addr,!1,ed),Te(e,n)}}function Ag(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;td.set(n),i.uniformMatrix3fv(this.addr,!1,td),Te(e,n)}}function Rg(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;Qu.set(n),i.uniformMatrix4fv(this.addr,!1,Qu),Te(e,n)}}function Cg(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Pg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2iv(this.addr,t),Te(e,t)}}function Ig(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3iv(this.addr,t),Te(e,t)}}function Lg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4iv(this.addr,t),Te(e,t)}}function Dg(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Ng(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2uiv(this.addr,t),Te(e,t)}}function Ug(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3uiv(this.addr,t),Te(e,t)}}function Og(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4uiv(this.addr,t),Te(e,t)}}function ol(i){return i.version===0&&(i.compareFunction=Tc,i.needsUpdate=!0),i}function Fg(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?r=ol(yd):r=xd,e.setTexture2D(t||r,s)}function Bg(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Sd,s)}function kg(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_CUBE_SHADOW?r=ol(vd):r=Md,e.setTextureCube(t||r,s)}function zg(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||bd,s)}function Hg(i){switch(i){case 5126:return Sg;case 35664:return Mg;case 35665:return wg;case 35666:return Eg;case 35674:return Tg;case 35675:return Ag;case 35676:return Rg;case 5124:case 35670:return Cg;case 35667:case 35671:return Pg;case 35668:case 35672:return Ig;case 35669:case 35673:return Lg;case 5125:return Dg;case 36294:return Ng;case 36295:return Ug;case 36296:return Og;case 35678:case 36198:case 36298:case 36306:case 35682:return Fg;case 35679:case 36299:case 36307:return Bg;case 35680:case 36300:case 36308:case 36293:return kg;case 36289:case 36303:case 36311:case 36292:return zg}}function Gg(i,t){i.uniform1fv(this.addr,t)}function Vg(i,t){let e=Ws(t,this.size,2);i.uniform2fv(this.addr,e)}function Wg(i,t){let e=Ws(t,this.size,3);i.uniform3fv(this.addr,e)}function Xg(i,t){let e=Ws(t,this.size,4);i.uniform4fv(this.addr,e)}function $g(i,t){let e=Ws(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function qg(i,t){let e=Ws(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Yg(i,t){let e=Ws(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Zg(i,t){i.uniform1iv(this.addr,t)}function Jg(i,t){i.uniform2iv(this.addr,t)}function jg(i,t){i.uniform3iv(this.addr,t)}function Kg(i,t){i.uniform4iv(this.addr,t)}function Qg(i,t){i.uniform1uiv(this.addr,t)}function t_(i,t){i.uniform2uiv(this.addr,t)}function e_(i,t){i.uniform3uiv(this.addr,t)}function n_(i,t){i.uniform4uiv(this.addr,t)}function i_(i,t,e){let n=this.cache,s=t.length,r=al(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=ol(yd):a=xd;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function s_(i,t,e){let n=this.cache,s=t.length,r=al(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Sd,r[a])}function r_(i,t,e){let n=this.cache,s=t.length,r=al(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));let a;this.type===i.SAMPLER_CUBE_SHADOW?a=ol(vd):a=Md;for(let o=0;o!==s;++o)e.setTextureCube(t[o]||a,r[o])}function a_(i,t,e){let n=this.cache,s=t.length,r=al(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||bd,r[a])}function o_(i){switch(i){case 5126:return Gg;case 35664:return Vg;case 35665:return Wg;case 35666:return Xg;case 35674:return $g;case 35675:return qg;case 35676:return Yg;case 5124:case 35670:return Zg;case 35667:case 35671:return Jg;case 35668:case 35672:return jg;case 35669:case 35673:return Kg;case 5125:return Qg;case 36294:return t_;case 36295:return e_;case 36296:return n_;case 35678:case 36198:case 36298:case 36306:case 35682:return i_;case 35679:case 36299:case 36307:return s_;case 35680:case 36300:case 36308:case 36293:return r_;case 36289:case 36303:case 36311:case 36292:return a_}}var Xc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Hg(e.type)}},$c=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=o_(e.type)}},qc=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},Vc=/(\w+)(\])?(\[|\.)?/g;function nd(i,t){i.seq.push(t),i.map[t.id]=t}function l_(i,t,e){let n=i.name,s=n.length;for(Vc.lastIndex=0;;){let r=Vc.exec(n),a=Vc.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){nd(e,c===void 0?new Xc(o,i,t):new $c(o,i,t));break}else{let d=e.map[o];d===void 0&&(d=new qc(o),nd(e,d)),e=d}}}var Gs=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);l_(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function id(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var c_=37297,h_=0;function u_(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var sd=new kt;function d_(i){Qt._getMatrix(sd,Qt.workingColorSpace,i);let t=`mat3( ${sd.elements.map(e=>e.toFixed(4))} )`;switch(Qt.getTransfer(i)){case ur:return[t,"LinearTransferOETF"];case se:return[t,"sRGBTransferOETF"];default:return It("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function rd(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+u_(i.getShaderSource(t),o)}else return r}function f_(i,t){let e=d_(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( ${e[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}var p_={[uc]:"Linear",[dc]:"Reinhard",[fc]:"Cineon",[Fr]:"ACESFilmic",[mc]:"AgX",[gc]:"Neutral",[pc]:"Custom"};function m_(i,t){let e=p_[t];return e===void 0?(It("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var sl=new R;function g_(){Qt.getLuminanceCoefficients(sl);let i=sl.x.toFixed(4),t=sl.y.toFixed(4),e=sl.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function __(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(qr).join(`
`)}function x_(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function y_(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function qr(i){return i!==""}function ad(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function od(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var v_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Yc(i){return i.replace(v_,b_)}function b_(i,t){let e=qt[t];if(e===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">");return Yc(e)}var S_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ld(i){return i.replace(S_,M_)}function M_(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function cd(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var w_={[Qi]:"SHADOWMAP_TYPE_PCF",[Fs]:"SHADOWMAP_TYPE_VSM"};function E_(i){return w_[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var T_={[ks]:"ENVMAP_MODE_REFRACTION"};function A_(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":T_[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var R_={[go]:"ENVMAP_BLENDING_MULTIPLY",[Eu]:"ENVMAP_BLENDING_MIX",[Tu]:"ENVMAP_BLENDING_ADD"};function C_(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":R_[i.combine]||"ENVMAP_BLENDING_NONE"}function P_(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=E_(e),c=e.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",h=A_(e),d=C_(e),f=__(e),u=x_(r),m=s.createProgram(),x,g,p=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(x=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,u].filter(qr).join(`
`),x.length>0&&(x+=`
`),g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,u].filter(qr).join(`
`),g.length>0&&(g+=`
`)):(x=[cd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,u,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+e.diffuseRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(qr).join(`
`),g=[cd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,u,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",e.envMapPMREM?"#define ENVMAP_MAX_LOD "+e.envMapMaxLod+".0":"",e.envMapPMREM?"#define ENVMAP_SIZE "+e.envMapSize+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Jn?"#define TONE_MAPPING":"",e.toneMapping!==Jn?qt.tonemapping_pars_fragment:"",e.toneMapping!==Jn?m_("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",qt.colorspace_pars_fragment,f_("linearToOutputTexel",e.outputColorSpace),g_(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(qr).join(`
`)),a=Yc(a),a=ad(a,e),a=od(a,e),o=Yc(o),o=ad(o,e),o=od(o,e),a=ld(a),o=ld(o),e.isRawShaderMaterial!==!0&&(p=`#version 300 es
`,x=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,g=["#define varying in",e.glslVersion===Ac?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Ac?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);let v=p+x+a,w=p+g+o,S=id(s,s.VERTEX_SHADER,v),T=id(s,s.FRAGMENT_SHADER,w);s.attachShader(m,S),s.attachShader(m,T),e.index0AttributeName!==void 0?s.bindAttribLocation(m,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(m,0,"position"),s.linkProgram(m);function E(P){if(i.debug.checkShaderErrors){let D=s.getProgramInfoLog(m)||"",O=s.getShaderInfoLog(S)||"",V=s.getShaderInfoLog(T)||"",I=D.trim(),X=O.trim(),q=V.trim(),H=!0,Q=!0;if(s.getProgramParameter(m,s.LINK_STATUS)===!1)if(H=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,m,S,T);else{let G=rd(s,S,"vertex"),nt=rd(s,T,"fragment");Bt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(m,s.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+I+`
`+G+`
`+nt)}else I!==""?It("WebGLProgram: Program Info Log:",I):(X===""||q==="")&&(Q=!1);Q&&(P.diagnostics={runnable:H,programLog:I,vertexShader:{log:X,prefix:x},fragmentShader:{log:q,prefix:g}})}s.deleteShader(S),s.deleteShader(T),_=new Gs(s,m),M=y_(s,m)}let _;this.getUniforms=function(){return _===void 0&&E(this),_};let M;this.getAttributes=function(){return M===void 0&&E(this),M};let N=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return N===!1&&(N=s.getProgramParameter(m,c_)),N},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(m),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=h_++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=S,this.fragmentShader=T,this}var I_=0,Zc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Jc(t),e.set(t,n)),n}},Jc=class{constructor(t){this.id=I_++,this.code=t,this.usedTimes=0}};function L_(i){return i===Oi||i===Vr||i===Wr}function D_(i,t,e,n,s,r){let a=new Is,o=new Zc,l=new Set,c=[],h=new Map,d=n.logarithmicDepthBuffer,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function u(_){return l.add(_),_===0?"uv":`uv${_}`}function m(_,M,N,P,D,O){let V=P.fog,I=D.geometry,X=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?P.environment:null,q=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,H=t.get(_.envMap||X,q),Q=f[_.type],G=n.precision;_.precision!==null&&(G=n.getMaxPrecision(_.precision),G!==_.precision&&It("WebGLProgram.getParameters:",_.precision,"not supported, using",G,"instead."));let nt=I.morphAttributes.position||I.morphAttributes.normal||I.morphAttributes.color,it=nt!==void 0?nt.length:0,At=0;I.morphAttributes.position!==void 0&&(At=1),I.morphAttributes.normal!==void 0&&(At=2),I.morphAttributes.color!==void 0&&(At=3);let Ht,J,yt,Mt;if(Q){let _t=Kn[Q];Ht=_t.vertexShader,J=_t.fragmentShader}else{Ht=_.vertexShader,J=_.fragmentShader;let _t=o.getVertexShaderStage(_),ae=o.getFragmentShaderStage(_);o.update(_,_t,ae),yt=_t.id,Mt=ae.id}let Lt=i.getRenderTarget(),vt=i.state.buffers.depth.getReversed(),Vt=D.isInstancedMesh===!0,ve=D.isBatchedMesh===!0,Ot=!!_.map,re=!!_.matcap,le=!!H,Jt=le&&H.isPMREMTexture===!0,Ue=!!_.aoMap,Me=!!_.lightMap,Qe=!!_.bumpMap&&_.wireframe===!1,_e=!!_.normalMap,Vn=!!_.displacementMap,Ce=!!_.emissiveMap,fn=!!_.metalnessMap,pn=!!_.roughnessMap,mn=_.anisotropy>0,U=_.clearcoat>0,gn=_.diffuseRoughness>0,pe=_.dispersion>0,me=_.retroreflectivity>0,mt=_.iridescence>0,we=_.sheen>0,Dt=_.transmission>0,zt=mn&&!!_.anisotropyMap,A=U&&!!_.clearcoatMap,y=U&&!!_.clearcoatNormalMap,B=U&&!!_.clearcoatRoughnessMap,st=gn&&!!_.diffuseRoughnessMap,tt=mt&&!!_.iridescenceMap,ot=mt&&!!_.iridescenceThicknessMap,dt=we&&!!_.sheenColorMap,Y=we&&!!_.sheenRoughnessMap,Z=!!_.specularMap,ct=!!_.specularColorMap,C=!!_.specularIntensityMap,j=Dt&&!!_.transmissionMap,$=Dt&&!!_.thicknessMap,ht=!!_.gradientMap,at=!!_.alphaMap,lt=_.alphaTest>0,Ct=!!_.alphaHash,$t=!!_.extensions,rt=Jn;_.toneMapped&&(Lt===null||Lt.isXRRenderTarget===!0)&&(rt=i.toneMapping);let Pt=Jt?H.isCompressedCubeTexture?H.image[0].mipmaps:H.mipmaps:null,Xt={shaderID:Q,shaderType:_.type,shaderName:_.name,vertexShader:Ht,fragmentShader:J,defines:_.defines,customVertexShaderID:yt,customFragmentShaderID:Mt,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:G,batching:ve,batchingColor:ve&&D._colorsTexture!==null,instancing:Vt,instancingColor:Vt&&D.instanceColor!==null,instancingMorph:Vt&&D.morphTexture!==null,outputColorSpace:Lt===null?i.outputColorSpace:Lt.isXRRenderTarget===!0?Lt.texture.colorSpace:Qt.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:Ot,matcap:re,envMap:le,envMapMode:le&&H.mapping,envMapPMREM:Jt,envMapMaxLod:Jt?Pt.length-1:null,envMapSize:Jt?Pt[0].width:null,aoMap:Ue,lightMap:Me,bumpMap:Qe,normalMap:_e,displacementMap:Vn,emissiveMap:Ce,normalMapObjectSpace:_e&&_.normalMapType===Cu,normalMapTangentSpace:_e&&_.normalMapType===Xr,packedNormalMap:_e&&_.normalMapType===Xr&&L_(_.normalMap.format),metalnessMap:fn,roughnessMap:pn,anisotropy:mn,anisotropyMap:zt,clearcoat:U,clearcoatMap:A,clearcoatNormalMap:y,clearcoatRoughnessMap:B,diffuseRoughness:gn,diffuseRoughnessMap:st,dispersion:pe,retroreflection:me,iridescence:mt,iridescenceMap:tt,iridescenceThicknessMap:ot,sheen:we,sheenColorMap:dt,sheenRoughnessMap:Y,specularMap:Z,specularColorMap:ct,specularIntensityMap:C,transmission:Dt,transmissionMap:j,thicknessMap:$,gradientMap:ht,opaque:_.transparent===!1&&_.blending===Bs&&_.alphaToCoverage===!1,alphaMap:at,alphaTest:lt,alphaHash:Ct,combine:_.combine,mapUv:Ot&&u(_.map.channel),aoMapUv:Ue&&u(_.aoMap.channel),lightMapUv:Me&&u(_.lightMap.channel),bumpMapUv:Qe&&u(_.bumpMap.channel),normalMapUv:_e&&u(_.normalMap.channel),displacementMapUv:Vn&&u(_.displacementMap.channel),emissiveMapUv:Ce&&u(_.emissiveMap.channel),metalnessMapUv:fn&&u(_.metalnessMap.channel),roughnessMapUv:pn&&u(_.roughnessMap.channel),anisotropyMapUv:zt&&u(_.anisotropyMap.channel),clearcoatMapUv:A&&u(_.clearcoatMap.channel),clearcoatNormalMapUv:y&&u(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:B&&u(_.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:st&&u(_.diffuseRoughnessMap.channel),iridescenceMapUv:tt&&u(_.iridescenceMap.channel),iridescenceThicknessMapUv:ot&&u(_.iridescenceThicknessMap.channel),sheenColorMapUv:dt&&u(_.sheenColorMap.channel),sheenRoughnessMapUv:Y&&u(_.sheenRoughnessMap.channel),specularMapUv:Z&&u(_.specularMap.channel),specularColorMapUv:ct&&u(_.specularColorMap.channel),specularIntensityMapUv:C&&u(_.specularIntensityMap.channel),transmissionMapUv:j&&u(_.transmissionMap.channel),thicknessMapUv:$&&u(_.thicknessMap.channel),alphaMapUv:at&&u(_.alphaMap.channel),vertexTangents:!!I.attributes.tangent&&(_e||mn),vertexNormals:!!I.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!I.attributes.color&&I.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!I.attributes.uv&&(Ot||at),fog:!!V,useFog:_.fog===!0,fogExp2:!!V&&V.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||I.attributes.normal===void 0&&_e===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:vt,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:I.attributes.position!==void 0,morphTargets:I.morphAttributes.position!==void 0,morphNormals:I.morphAttributes.normal!==void 0,morphColors:I.morphAttributes.color!==void 0,morphTargetsCount:it,morphTextureStride:At,numSunLights:M.sun.length,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numSunLightShadows:M.sunShadowMap.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numLightProbeGrids:O.filter(_t=>_t.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&N.length>0,shadowMapType:i.shadowMap.type,toneMapping:rt,decodeVideoTexture:Ot&&_.map.isVideoTexture===!0&&Qt.getTransfer(_.map.colorSpace)===se,decodeVideoTextureEmissive:Ce&&_.emissiveMap.isVideoTexture===!0&&Qt.getTransfer(_.emissiveMap.colorSpace)===se,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Ne,flipSided:_.side===ke,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:$t&&_.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:($t&&_.extensions.multiDraw===!0||ve)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Xt.vertexUv1s=l.has(1),Xt.vertexUv2s=l.has(2),Xt.vertexUv3s=l.has(3),l.clear(),Xt}function x(_){let M=[];if(_.shaderID?M.push(_.shaderID):(M.push(_.customVertexShaderID),M.push(_.customFragmentShaderID)),_.defines!==void 0)for(let N in _.defines)M.push(N),M.push(_.defines[N]);return _.isRawShaderMaterial===!1&&(g(M,_),p(M,_),M.push(i.outputColorSpace)),M.push(_.customProgramCacheKey),M.join()}function g(_,M){_.push(M.precision),_.push(M.outputColorSpace),_.push(M.envMapMode),_.push(M.envMapPMREM),_.push(M.envMapMaxLod),_.push(M.envMapSize),_.push(M.mapUv),_.push(M.alphaMapUv),_.push(M.lightMapUv),_.push(M.aoMapUv),_.push(M.bumpMapUv),_.push(M.normalMapUv),_.push(M.displacementMapUv),_.push(M.emissiveMapUv),_.push(M.metalnessMapUv),_.push(M.roughnessMapUv),_.push(M.anisotropyMapUv),_.push(M.clearcoatMapUv),_.push(M.clearcoatNormalMapUv),_.push(M.clearcoatRoughnessMapUv),_.push(M.diffuseRoughnessMapUv),_.push(M.iridescenceMapUv),_.push(M.iridescenceThicknessMapUv),_.push(M.sheenColorMapUv),_.push(M.sheenRoughnessMapUv),_.push(M.specularMapUv),_.push(M.specularColorMapUv),_.push(M.specularIntensityMapUv),_.push(M.transmissionMapUv),_.push(M.thicknessMapUv),_.push(M.combine),_.push(M.fogExp2),_.push(M.sizeAttenuation),_.push(M.morphTargetsCount),_.push(M.numSunLights),_.push(M.numDirLights),_.push(M.numPointLights),_.push(M.numSpotLights),_.push(M.numSpotLightMaps),_.push(M.numHemiLights),_.push(M.numRectAreaLights),_.push(M.numSunLightShadows),_.push(M.numDirLightShadows),_.push(M.numPointLightShadows),_.push(M.numSpotLightShadows),_.push(M.numSpotLightShadowsWithMaps),_.push(M.numLightProbes),_.push(M.numLightProbeGrids),_.push(M.shadowMapType),_.push(M.toneMapping),_.push(M.numClippingPlanes),_.push(M.numClipIntersection),_.push(M.depthPacking)}function p(_,M){a.disableAll(),M.instancing&&a.enable(0),M.instancingColor&&a.enable(1),M.instancingMorph&&a.enable(2),M.matcap&&a.enable(3),M.envMap&&a.enable(4),M.normalMapObjectSpace&&a.enable(5),M.normalMapTangentSpace&&a.enable(6),M.clearcoat&&a.enable(7),M.iridescence&&a.enable(8),M.alphaTest&&a.enable(9),M.vertexColors&&a.enable(10),M.vertexAlphas&&a.enable(11),M.vertexUv1s&&a.enable(12),M.vertexUv2s&&a.enable(13),M.vertexUv3s&&a.enable(14),M.vertexTangents&&a.enable(15),M.anisotropy&&a.enable(16),M.alphaHash&&a.enable(17),M.batching&&a.enable(18),M.dispersion&&a.enable(19),M.retroreflection&&a.enable(24),M.diffuseRoughness&&a.enable(25),M.batchingColor&&a.enable(20),M.gradientMap&&a.enable(21),M.packedNormalMap&&a.enable(22),M.vertexNormals&&a.enable(23),_.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reversedDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),M.numLightProbeGrids>0&&a.enable(22),M.hasPositionAttribute&&a.enable(23),_.push(a.mask)}function v(_){let M=f[_.type],N;if(M){let P=Kn[M];N=Wu.clone(P.uniforms)}else N=_.uniforms;return N}function w(_,M){let N=h.get(M);return N!==void 0?++N.usedTimes:(N=new P_(i,M,_,s),c.push(N),h.set(M,N)),N}function S(_){if(--_.usedTimes===0){let M=c.indexOf(_);c[M]=c[c.length-1],c.pop(),h.delete(_.cacheKey),_.destroy()}}function T(_){o.remove(_)}function E(){o.dispose()}return{getParameters:m,getProgramCacheKey:x,getUniforms:v,acquireProgram:w,releaseProgram:S,releaseShaderCache:T,programs:c,dispose:E}}function N_(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function U_(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function hd(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function ud(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(f){let u=0;return f.isInstancedMesh&&(u+=2),f.isSkinnedMesh&&(u+=1),u}function o(f,u,m,x,g,p){let v=i[t];return v===void 0?(v={id:f.id,object:f,geometry:u,material:m,materialVariant:a(f),groupOrder:x,renderOrder:f.renderOrder,z:g,group:p},i[t]=v):(v.id=f.id,v.object=f,v.geometry=u,v.material=m,v.materialVariant=a(f),v.groupOrder=x,v.renderOrder=f.renderOrder,v.z=g,v.group=p),t++,v}function l(f,u,m,x,g,p,v){v.reversedDepth===!0&&(g=-g);let w=o(f,u,m,x,g,p);m.transmission>0?n.push(w):m.transparent===!0?s.push(w):e.push(w)}function c(f,u,m,x,g,p){let v=o(f,u,m,x,g,p);m.transmission>0?n.unshift(v):m.transparent===!0?s.unshift(v):e.unshift(v)}function h(f,u){e.length>1&&e.sort(f||U_),n.length>1&&n.sort(u||hd),s.length>1&&s.sort(u||hd)}function d(){for(let f=t,u=i.length;f<u;f++){let m=i[f];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:d,sort:h}}function O_(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new ud,i.set(n,[a])):s>=r.length?(a=new ud,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function F_(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new R,color:new Ut};break;case"SpotLight":e={position:new R,direction:new R,color:new Ut,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new R,color:new Ut,distance:0,decay:0};break;case"HemisphereLight":e={direction:new R,skyColor:new Ut,groundColor:new Ut};break;case"RectAreaLight":e={color:new Ut,position:new R,halfWidth:new R,halfHeight:new R};break}return i[t.id]=e,e}}}function B_(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new gt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new gt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new gt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var k_=0;function z_(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function H_(i){let t=new F_,e=B_(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new R);let s=new R,r=new Zt,a=new Zt;function o(c){let h=0,d=0,f=0;for(let O=0;O<9;O++)n.probe[O].set(0,0,0);let u=0,m=0,x=0,g=0,p=0,v=0,w=0,S=0,T=0,E=0,_=0,M=0,N=0,P=0;c.sort(z_);for(let O=0,V=c.length;O<V;O++){let I=c[O],X=I.color,q=I.intensity,H=I.distance,Q=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===Oi?Q=I.shadow.map.texture:Q=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)h+=X.r*q,d+=X.g*q,f+=X.b*q;else if(I.isLightProbe){for(let G=0;G<9;G++)n.probe[G].addScaledVector(I.sh.coefficients[G],q);P++}else if(I.isSunLight){let G=t.get(I);if(G.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let nt=I.shadow,it=e.get(I);it.shadowIntensity=nt.intensity,it.shadowBias=nt.bias,it.shadowNormalBias=nt.normalBias,it.shadowRadius=nt.radius,it.shadowMapSize.copy(nt.mapSize).multiply(nt.getFrameExtents()),n.sunShadow[m]=it,n.sunShadowMap[m]=Q;let At=nt.getViewportCount();for(let Ht=0;Ht<At;Ht++)n.sunShadowMatrix[x+Ht]=nt.getMatrix(Ht),n.sunShadowCascade[x+Ht]=nt._cascadeData[Ht];x+=At,m++}n.sun[u]=G,u++}else if(I.isDirectionalLight){let G=t.get(I);if(G.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let nt=I.shadow,it=e.get(I);it.shadowIntensity=nt.intensity,it.shadowBias=nt.bias,it.shadowNormalBias=nt.normalBias,it.shadowRadius=nt.radius,it.shadowMapSize=nt.mapSize,n.directionalShadow[g]=it,n.directionalShadowMap[g]=Q,n.directionalShadowMatrix[g]=I.shadow.matrix,T++}n.directional[g]=G,g++}else if(I.isSpotLight){let G=t.get(I);G.position.setFromMatrixPosition(I.matrixWorld),G.color.copy(X).multiplyScalar(q),G.distance=H,G.coneCos=Math.cos(I.angle),G.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),G.decay=I.decay,n.spot[v]=G;let nt=I.shadow;if(I.map&&(n.spotLightMap[M]=I.map,M++,nt.updateMatrices(I),I.castShadow&&N++),n.spotLightMatrix[v]=nt.matrix,I.castShadow){let it=e.get(I);it.shadowIntensity=nt.intensity,it.shadowBias=nt.bias,it.shadowNormalBias=nt.normalBias,it.shadowRadius=nt.radius,it.shadowMapSize=nt.mapSize,n.spotShadow[v]=it,n.spotShadowMap[v]=Q,_++}v++}else if(I.isRectAreaLight){let G=t.get(I);G.color.copy(X).multiplyScalar(q),G.halfWidth.set(I.width*.5,0,0),G.halfHeight.set(0,I.height*.5,0),n.rectArea[w]=G,w++}else if(I.isPointLight){let G=t.get(I);if(G.color.copy(I.color).multiplyScalar(I.intensity),G.distance=I.distance,G.decay=I.decay,I.castShadow){let nt=I.shadow,it=e.get(I);it.shadowIntensity=nt.intensity,it.shadowBias=nt.bias,it.shadowNormalBias=nt.normalBias,it.shadowRadius=nt.radius,it.shadowMapSize=nt.mapSize,it.shadowCameraNear=nt.camera.near,it.shadowCameraFar=nt.camera.far,n.pointShadow[p]=it,n.pointShadowMap[p]=Q,n.pointShadowMatrix[p]=I.shadow.matrix,E++}n.point[p]=G,p++}else if(I.isHemisphereLight){let G=t.get(I);G.skyColor.copy(I.color).multiplyScalar(q),G.groundColor.copy(I.groundColor).multiplyScalar(q),n.hemi[S]=G,S++}}w>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=xt.LTC_FLOAT_1,n.rectAreaLTC2=xt.LTC_FLOAT_2):(n.rectAreaLTC1=xt.LTC_HALF_1,n.rectAreaLTC2=xt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=f;let D=n.hash;(D.sunLength!==u||D.directionalLength!==g||D.pointLength!==p||D.spotLength!==v||D.rectAreaLength!==w||D.hemiLength!==S||D.numSunShadows!==m||D.numDirectionalShadows!==T||D.numPointShadows!==E||D.numSpotShadows!==_||D.numSpotMaps!==M||D.numLightProbes!==P)&&(n.sun.length=u,n.directional.length=g,n.spot.length=v,n.rectArea.length=w,n.point.length=p,n.hemi.length=S,n.sunShadow.length=m,n.sunShadowMap.length=m,n.sunShadowMatrix.length=x,n.sunShadowCascade.length=x,n.directionalShadow.length=T,n.directionalShadowMap.length=T,n.directionalShadowMatrix.length=T,n.pointShadow.length=E,n.pointShadowMap.length=E,n.pointShadowMatrix.length=E,n.spotShadow.length=_,n.spotShadowMap.length=_,n.spotLightMatrix.length=_+M-N,n.spotLightMap.length=M,n.numSpotLightShadowsWithMaps=N,n.numLightProbes=P,D.sunLength=u,D.directionalLength=g,D.pointLength=p,D.spotLength=v,D.rectAreaLength=w,D.hemiLength=S,D.numSunShadows=m,D.numDirectionalShadows=T,D.numPointShadows=E,D.numSpotShadows=_,D.numSpotMaps=M,D.numLightProbes=P,n.version=k_++)}function l(c,h){let d=0,f=0,u=0,m=0,x=0,g=0,p=h.matrixWorldInverse;for(let v=0,w=c.length;v<w;v++){let S=c[v];if(S.isSunLight){let T=n.sun[d];T.direction.setFromMatrixPosition(S.matrixWorld),T.direction.transformDirection(p),d++}else if(S.isDirectionalLight){let T=n.directional[f];T.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(p),f++}else if(S.isSpotLight){let T=n.spot[m];T.position.setFromMatrixPosition(S.matrixWorld),T.position.applyMatrix4(p),T.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(p),m++}else if(S.isRectAreaLight){let T=n.rectArea[x];T.position.setFromMatrixPosition(S.matrixWorld),T.position.applyMatrix4(p),a.identity(),r.copy(S.matrixWorld),r.premultiply(p),a.extractRotation(r),T.halfWidth.set(S.width*.5,0,0),T.halfHeight.set(0,S.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),x++}else if(S.isPointLight){let T=n.point[u];T.position.setFromMatrixPosition(S.matrixWorld),T.position.applyMatrix4(p),u++}else if(S.isHemisphereLight){let T=n.hemi[g];T.direction.setFromMatrixPosition(S.matrixWorld),T.direction.transformDirection(p),g++}}}return{setup:o,setupView:l,state:n}}function dd(i){let t=new H_(i),e=[],n=[],s=[];function r(d){h.camera=d,e.length=0,n.length=0,s.length=0}function a(d){d.isLightProbeGrid?s.push(d):e.push(d)}function o(d){n.push(d)}function l(){t.setup(e),s.sort((d,f)=>d.priority-f.priority||d.id-f.id)}function c(d){t.setupView(e,d)}let h={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:h,setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function G_(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new dd(i),t.set(s,[o])):r>=a.length?(o=new dd(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var V_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,W_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,X_=[new R(1,0,0),new R(-1,0,0),new R(0,1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1)],$_=[new R(0,-1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1),new R(0,-1,0),new R(0,-1,0)],fd=new Zt,$r=new R,Wc=new R;function q_(i,t,e){let n=new Ai,s=new gt,r=new gt,a=new ge,o=new eo,l=new no,c={},h=e.maxTextureSize,d={[Ui]:ke,[ke]:Ui,[Ne]:Ne},f=new Sn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new gt},radius:{value:4}},vertexShader:V_,fragmentShader:W_}),u=f.clone();u.defines.HORIZONTAL_PASS=1;let m=new Xe;m.setAttribute("position",new vn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new ue(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Qi;let p=this.type;this.render=function(E,_,M){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||E.length===0)return;this.type===au&&(It("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Qi);let N=i.getRenderTarget(),P=i.getActiveCubeFace(),D=i.getActiveMipmapLevel(),O=i.state;O.setBlending(ts),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);let V=p!==this.type;V&&_.traverse(function(I){I.material&&(Array.isArray(I.material)?I.material.forEach(X=>X.needsUpdate=!0):I.material.needsUpdate=!0)});for(let I=0,X=E.length;I<X;I++){let q=E[I],H=q.shadow;if(H===void 0){It("WebGLShadowMap:",q,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;s.copy(H.mapSize);let Q=H.getFrameExtents();s.multiply(Q),r.copy(H.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/Q.x),s.x=r.x*Q.x,H.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/Q.y),s.y=r.y*Q.y,H.mapSize.y=r.y));let G=i.state.buffers.depth.getReversed();if(H.camera._reversedDepth=G,H.map===null||V===!0){if(H.map!==null&&(H.map.depthTexture!==null&&(H.map.depthTexture.dispose(),H.map.depthTexture=null),H.map.dispose()),this.type===Fs){if(q.isPointLight){It("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}H.map=new cn(s.x,s.y,{format:Oi,type:Bn,minFilter:Ze,magFilter:Ze,generateMipmaps:!1}),H.map.texture.name=q.name+".shadowMap",H.map.depthTexture=new li(s.x,s.y,Mn),H.map.depthTexture.name=q.name+".shadowMapDepth",H.map.depthTexture.format=ai,H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=De,H.map.depthTexture.magFilter=De}else q.isPointLight?(H.map=new Yr(s.x),H.map.depthTexture=new br(s.x,Fn)):(H.map=new cn(s.x,s.y),H.map.depthTexture=new li(s.x,s.y,Fn)),H.map.depthTexture.name=q.name+".shadowMap",H.map.depthTexture.format=ai,this.type===Qi?(H.map.depthTexture.compareFunction=G?Ec:wc,H.map.depthTexture.minFilter=Ze,H.map.depthTexture.magFilter=Ze):(H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=De,H.map.depthTexture.magFilter=De);H.camera.updateProjectionMatrix()}H.map.isWebGLCubeRenderTarget!==!0&&(H.map.width!==s.x||H.map.height!==s.y)&&H.map.setSize(s.x,s.y);let nt=H.map.isWebGLCubeRenderTarget?6:H.getViewportCount();q.isPointLight!==!0&&H.updateMatrices(q,M);let it=(H.camera.layers.mask&4294967294)!==0?H.camera.layers:M.layers;for(let At=0;At<nt;At++){let Ht=H.getCamera(At);if(q.isPointLight){let J=H.camera,yt=H.matrix,Mt=q.distance||J.far;Mt!==J.far&&(J.far=Mt,J.updateProjectionMatrix()),$r.setFromMatrixPosition(q.matrixWorld),J.position.copy($r),Wc.copy(J.position),Wc.add(X_[At]),J.up.copy($_[At]),J.lookAt(Wc),J.updateMatrixWorld(),yt.makeTranslation(-$r.x,-$r.y,-$r.z),fd.multiplyMatrices(J.projectionMatrix,J.matrixWorldInverse),H._frustum.setFromProjectionMatrix(fd,J.coordinateSystem,J.reversedDepth)}if(H.map.isWebGLCubeRenderTarget)i.setRenderTarget(H.map,At),i.clear();else{At===0&&(i.setRenderTarget(H.map),i.clear());let J=H.getViewport(At);a.set(r.x*J.x,r.y*J.y,r.x*J.z,r.y*J.w),O.viewport(a)}n=H.getFrustum(At),S(_,M,Ht,q,it,this.type)}H.isPointLightShadow!==!0&&this.type===Fs&&v(H,M),H.needsUpdate=!1}p=this.type,g.needsUpdate=!1,i.setRenderTarget(N,P,D)};function v(E,_){let M=t.update(x);f.defines.VSM_SAMPLES!==E.blurSamples&&(f.defines.VSM_SAMPLES=E.blurSamples,u.defines.VSM_SAMPLES=E.blurSamples,f.needsUpdate=!0,u.needsUpdate=!0),E.mapPass===null?E.mapPass=new cn(s.x,s.y,{format:Oi,type:Bn}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),f.uniforms.shadow_pass.value=E.map.depthTexture,f.uniforms.resolution.value.set(E.map.width,E.map.height),f.uniforms.radius.value=E.radius,i.setRenderTarget(E.mapPass),i.clear(),i.renderBufferDirect(_,null,M,f,x,null),u.uniforms.shadow_pass.value=E.mapPass.texture,u.uniforms.resolution.value.set(E.map.width,E.map.height),u.uniforms.radius.value=E.radius,i.setRenderTarget(E.map),i.clear(),i.renderBufferDirect(_,null,M,u,x,null)}function w(E,_,M,N){let P=null,D=M.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(D!==void 0)P=D;else if(P=M.isPointLight===!0?l:o,i.localClippingEnabled&&_.clipShadows===!0&&Array.isArray(_.clippingPlanes)&&_.clippingPlanes.length!==0||_.displacementMap&&_.displacementScale!==0||_.alphaMap&&_.alphaTest>0||_.map&&_.alphaTest>0||_.alphaToCoverage===!0){let O=P.uuid,V=_.uuid,I=c[O];I===void 0&&(I={},c[O]=I);let X=I[V];X===void 0&&(X=P.clone(),I[V]=X,_.addEventListener("dispose",T)),P=X}if(P.visible=_.visible,P.wireframe=_.wireframe,N===Fs?P.side=_.shadowSide!==null?_.shadowSide:_.side:P.side=_.shadowSide!==null?_.shadowSide:d[_.side],P.alphaMap=_.alphaMap,P.alphaTest=_.alphaToCoverage===!0?.5:_.alphaTest,P.map=_.map,P.clipShadows=_.clipShadows,P.clippingPlanes=_.clippingPlanes,P.clipIntersection=_.clipIntersection,P.displacementMap=_.displacementMap,P.displacementScale=_.displacementScale,P.displacementBias=_.displacementBias,P.wireframeLinewidth=_.wireframeLinewidth,P.linewidth=_.linewidth,M.isPointLight===!0&&P.isMeshDistanceMaterial===!0){let O=i.properties.get(P);O.light=M}return P}function S(E,_,M,N,P,D){if(E.visible===!1)return;if(E.layers.test(P)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&D===Fs)&&(!E.frustumCulled||E.intersectsFrustum(n))){E.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,E.matrixWorld);let I=t.update(E),X=E.material;if(Array.isArray(X)){let q=I.groups;for(let H=0,Q=q.length;H<Q;H++){let G=q[H],nt=X[G.materialIndex];if(nt&&nt.visible){let it=w(E,nt,N,D);E.onBeforeShadow(i,E,_,M,I,it,G),i.renderBufferDirect(M,null,I,it,E,G),E.onAfterShadow(i,E,_,M,I,it,G)}}}else if(X.visible){let q=w(E,X,N,D);E.onBeforeShadow(i,E,_,M,I,q,null),i.renderBufferDirect(M,null,I,q,E,null),E.onAfterShadow(i,E,_,M,I,q,null)}}let V=E.children;for(let I=0,X=V.length;I<X;I++)S(V[I],_,M,N,P,D)}function T(E){E.target.removeEventListener("dispose",T);for(let M in c){let N=c[M],P=E.target.uuid;P in N&&(N[P].dispose(),delete N[P])}}}function Y_(i,t){function e(){let C=!1,j=new ge,$=null,ht=new ge(0,0,0,0);return{setMask:function(at){$!==at&&!C&&(i.colorMask(at,at,at,at),$=at)},setLocked:function(at){C=at},setClear:function(at,lt,Ct,$t,rt){rt===!0&&(at*=$t,lt*=$t,Ct*=$t),j.set(at,lt,Ct,$t),ht.equals(j)===!1&&(i.clearColor(at,lt,Ct,$t),ht.copy(j))},reset:function(){C=!1,$=null,ht.set(-1,0,0,0)}}}function n(){let C=!1,j=!1,$=null,ht=null,at=null;return{setReversed:function(lt){if(j!==lt){let Ct=t.get("EXT_clip_control");lt?Ct.clipControlEXT(Ct.LOWER_LEFT_EXT,Ct.ZERO_TO_ONE_EXT):Ct.clipControlEXT(Ct.LOWER_LEFT_EXT,Ct.NEGATIVE_ONE_TO_ONE_EXT),j=lt;let $t=at;at=null,this.setClear($t)}},getReversed:function(){return j},setTest:function(lt){lt?vt(i.DEPTH_TEST):Vt(i.DEPTH_TEST)},setMask:function(lt){$!==lt&&!C&&(i.depthMask(lt),$=lt)},setFunc:function(lt){if(j&&(lt=zu[lt]),ht!==lt){switch(lt){case La:i.depthFunc(i.NEVER);break;case Da:i.depthFunc(i.ALWAYS);break;case Na:i.depthFunc(i.LESS);break;case As:i.depthFunc(i.LEQUAL);break;case Ua:i.depthFunc(i.EQUAL);break;case Oa:i.depthFunc(i.GEQUAL);break;case Fa:i.depthFunc(i.GREATER);break;case Ba:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ht=lt}},setLocked:function(lt){C=lt},setClear:function(lt){at!==lt&&(at=lt,j&&(lt=1-lt),i.clearDepth(lt))},reset:function(){C=!1,$=null,ht=null,at=null,j=!1}}}function s(){let C=!1,j=null,$=null,ht=null,at=null,lt=null,Ct=null,$t=null,rt=null;return{setTest:function(Pt){C||(Pt?vt(i.STENCIL_TEST):Vt(i.STENCIL_TEST))},setMask:function(Pt){j!==Pt&&!C&&(i.stencilMask(Pt),j=Pt)},setFunc:function(Pt,Xt,_t){($!==Pt||ht!==Xt||at!==_t)&&(i.stencilFunc(Pt,Xt,_t),$=Pt,ht=Xt,at=_t)},setOp:function(Pt,Xt,_t){(lt!==Pt||Ct!==Xt||$t!==_t)&&(i.stencilOp(Pt,Xt,_t),lt=Pt,Ct=Xt,$t=_t)},setLocked:function(Pt){C=Pt},setClear:function(Pt){rt!==Pt&&(i.clearStencil(Pt),rt=Pt)},reset:function(){C=!1,j=null,$=null,ht=null,at=null,lt=null,Ct=null,$t=null,rt=null}}}let r=new e,a=new n,o=new s,l={},c=new WeakMap,h={},d={},f={},u=new WeakMap,m=[],x=null,g=!1,p=null,v=null,w=null,S=null,T=null,E=null,_=null,M=new Ut(0,0,0),N=0,P=!1,D=null,O=null,V=null,I=null,X=null,q=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),H=!1,Q=0,G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec(G)[1]),H=Q>=1):G.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),H=Q>=2);let nt=null,it={},At=i.getParameter(i.SCISSOR_BOX),Ht=i.getParameter(i.VIEWPORT),J=new ge().fromArray(At),yt=new ge().fromArray(Ht);function Mt(C,j,$,ht){let at=new Uint8Array(4),lt=i.createTexture();i.bindTexture(C,lt),i.texParameteri(C,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(C,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ct=0;Ct<$;Ct++)C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY?i.texImage3D(j,0,i.RGBA,1,1,ht,0,i.RGBA,i.UNSIGNED_BYTE,at):i.texImage2D(j+Ct,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,at);return lt}let Lt={};Lt[i.TEXTURE_2D]=Mt(i.TEXTURE_2D,i.TEXTURE_2D,1),Lt[i.TEXTURE_CUBE_MAP]=Mt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Lt[i.TEXTURE_2D_ARRAY]=Mt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Lt[i.TEXTURE_3D]=Mt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),vt(i.DEPTH_TEST),a.setFunc(As),Qe(!1),_e(ac),vt(i.CULL_FACE),Ue(ts);function vt(C){h[C]!==!0&&(i.enable(C),h[C]=!0)}function Vt(C){h[C]!==!1&&(i.disable(C),h[C]=!1)}function ve(C,j){return f[C]!==j?(i.bindFramebuffer(C,j),f[C]=j,C===i.DRAW_FRAMEBUFFER&&(f[i.FRAMEBUFFER]=j),C===i.FRAMEBUFFER&&(f[i.DRAW_FRAMEBUFFER]=j),!0):!1}function Ot(C,j){let $=m,ht=!1;if(C){$=u.get(j),$===void 0&&($=[],u.set(j,$));let at=C.textures;if($.length!==at.length||$[0]!==i.COLOR_ATTACHMENT0){for(let lt=0,Ct=at.length;lt<Ct;lt++)$[lt]=i.COLOR_ATTACHMENT0+lt;$.length=at.length,ht=!0}}else $[0]!==i.BACK&&($[0]=i.BACK,ht=!0);ht&&i.drawBuffers($)}function re(C){return x!==C?(i.useProgram(C),x=C,!0):!1}let le={[ns]:i.FUNC_ADD,[lu]:i.FUNC_SUBTRACT,[cu]:i.FUNC_REVERSE_SUBTRACT};le[hu]=i.MIN,le[uu]=i.MAX;let Jt={[du]:i.ZERO,[fu]:i.ONE,[pu]:i.SRC_COLOR,[cc]:i.SRC_ALPHA,[vu]:i.SRC_ALPHA_SATURATE,[xu]:i.DST_COLOR,[gu]:i.DST_ALPHA,[mu]:i.ONE_MINUS_SRC_COLOR,[hc]:i.ONE_MINUS_SRC_ALPHA,[yu]:i.ONE_MINUS_DST_COLOR,[_u]:i.ONE_MINUS_DST_ALPHA,[bu]:i.CONSTANT_COLOR,[Su]:i.ONE_MINUS_CONSTANT_COLOR,[Mu]:i.CONSTANT_ALPHA,[wu]:i.ONE_MINUS_CONSTANT_ALPHA};function Ue(C,j,$,ht,at,lt,Ct,$t,rt,Pt){if(C===ts){g===!0&&(Vt(i.BLEND),g=!1);return}if(g===!1&&(vt(i.BLEND),g=!0),C!==ou){if(C!==p||Pt!==P){if((v!==ns||T!==ns)&&(i.blendEquation(i.FUNC_ADD),v=ns,T=ns),Pt)switch(C){case Bs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case es:i.blendFunc(i.ONE,i.ONE);break;case oc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case lc:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Bt("WebGLState: Invalid blending: ",C);break}else switch(C){case Bs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case es:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case oc:Bt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case lc:Bt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Bt("WebGLState: Invalid blending: ",C);break}w=null,S=null,E=null,_=null,M.set(0,0,0),N=0,p=C,P=Pt}return}at=at||j,lt=lt||$,Ct=Ct||ht,(j!==v||at!==T)&&(i.blendEquationSeparate(le[j],le[at]),v=j,T=at),($!==w||ht!==S||lt!==E||Ct!==_)&&(i.blendFuncSeparate(Jt[$],Jt[ht],Jt[lt],Jt[Ct]),w=$,S=ht,E=lt,_=Ct),($t.equals(M)===!1||rt!==N)&&(i.blendColor($t.r,$t.g,$t.b,rt),M.copy($t),N=rt),p=C,P=!1}function Me(C,j){C.side===Ne?Vt(i.CULL_FACE):vt(i.CULL_FACE);let $=C.side===ke;j&&($=!$),Qe($),C.blending===Bs&&C.transparent===!1?Ue(ts):Ue(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),a.setFunc(C.depthFunc),a.setTest(C.depthTest),a.setMask(C.depthWrite),r.setMask(C.colorWrite);let ht=C.stencilWrite;o.setTest(ht),ht&&(o.setMask(C.stencilWriteMask),o.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),o.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),Ce(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?vt(i.SAMPLE_ALPHA_TO_COVERAGE):Vt(i.SAMPLE_ALPHA_TO_COVERAGE)}function Qe(C){D!==C&&(C?i.frontFace(i.CW):i.frontFace(i.CCW),D=C)}function _e(C){C!==su?(vt(i.CULL_FACE),C!==O&&(C===ac?i.cullFace(i.BACK):C===ru?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Vt(i.CULL_FACE),O=C}function Vn(C){C!==V&&(H&&i.lineWidth(C),V=C)}function Ce(C,j,$){C?(vt(i.POLYGON_OFFSET_FILL),(I!==j||X!==$)&&(I=j,X=$,a.getReversed()&&(j=-j,$=-$),i.polygonOffset(j,$))):Vt(i.POLYGON_OFFSET_FILL)}function fn(C){C?vt(i.SCISSOR_TEST):Vt(i.SCISSOR_TEST)}function pn(C){C===void 0&&(C=i.TEXTURE0+q-1),nt!==C&&(i.activeTexture(C),nt=C)}function mn(C,j,$){$===void 0&&(nt===null?$=i.TEXTURE0+q-1:$=nt);let ht=it[$];ht===void 0&&(ht={type:void 0,texture:void 0},it[$]=ht),(ht.type!==C||ht.texture!==j)&&(nt!==$&&(i.activeTexture($),nt=$),i.bindTexture(C,j||Lt[C]),ht.type=C,ht.texture=j)}function U(){let C=it[nt];C!==void 0&&C.type!==void 0&&(i.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function gn(){try{i.compressedTexImage2D(...arguments)}catch(C){Bt("WebGLState:",C)}}function pe(){try{i.compressedTexImage3D(...arguments)}catch(C){Bt("WebGLState:",C)}}function me(){try{i.texSubImage2D(...arguments)}catch(C){Bt("WebGLState:",C)}}function mt(){try{i.texSubImage3D(...arguments)}catch(C){Bt("WebGLState:",C)}}function we(){try{i.compressedTexSubImage2D(...arguments)}catch(C){Bt("WebGLState:",C)}}function Dt(){try{i.compressedTexSubImage3D(...arguments)}catch(C){Bt("WebGLState:",C)}}function zt(){try{i.texStorage2D(...arguments)}catch(C){Bt("WebGLState:",C)}}function A(){try{i.texStorage3D(...arguments)}catch(C){Bt("WebGLState:",C)}}function y(){try{i.texImage2D(...arguments)}catch(C){Bt("WebGLState:",C)}}function B(){try{i.texImage3D(...arguments)}catch(C){Bt("WebGLState:",C)}}function st(C){return d[C]!==void 0?d[C]:i.getParameter(C)}function tt(C,j){d[C]!==j&&(i.pixelStorei(C,j),d[C]=j)}function ot(C){J.equals(C)===!1&&(i.scissor(C.x,C.y,C.z,C.w),J.copy(C))}function dt(C){yt.equals(C)===!1&&(i.viewport(C.x,C.y,C.z,C.w),yt.copy(C))}function Y(C,j){let $=c.get(j);$===void 0&&($=new WeakMap,c.set(j,$));let ht=$.get(C);ht===void 0&&(ht=i.getUniformBlockIndex(j,C.name),i.uniformBlockBinding(j,ht,ht),$.set(C,ht))}function Z(C,j,$){let at=c.get(j).get(C);l[at]!==$&&(i.bindBufferBase(i.UNIFORM_BUFFER,at,$),l[at]=$)}function ct(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},d={},nt=null,it={},f={},l={},u=new WeakMap,m=[],x=null,g=!1,p=null,v=null,w=null,S=null,T=null,E=null,_=null,M=new Ut(0,0,0),N=0,P=!1,D=null,O=null,V=null,I=null,X=null,J.set(0,0,i.canvas.width,i.canvas.height),yt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:vt,disable:Vt,bindFramebuffer:ve,drawBuffers:Ot,useProgram:re,setBlending:Ue,setMaterial:Me,setFlipSided:Qe,setCullFace:_e,setLineWidth:Vn,setPolygonOffset:Ce,setScissorTest:fn,activeTexture:pn,bindTexture:mn,unbindTexture:U,compressedTexImage2D:gn,compressedTexImage3D:pe,texImage2D:y,texImage3D:B,pixelStorei:tt,getParameter:st,updateUBOMapping:Y,uniformBlockBinding:Z,texStorage2D:zt,texStorage3D:A,texSubImage2D:me,texSubImage3D:mt,compressedTexSubImage2D:we,compressedTexSubImage3D:Dt,scissor:ot,viewport:dt,reset:ct}}function Z_(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new gt,h=new WeakMap,d=new Set,f,u=new WeakMap,m=new Set,x=new FinalizationRegistry(A=>m.delete(A)),g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function p(A,y){return g?new OffscreenCanvas(A,y):dr("canvas")}function v(A,y,B){let st=1,tt=zt(A);if((tt.width>B||tt.height>B)&&(st=B/Math.max(tt.width,tt.height)),st<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let ot=Math.floor(st*tt.width),dt=Math.floor(st*tt.height);f===void 0&&(f=p(ot,dt));let Y=y?p(ot,dt):f;return Y.width=ot,Y.height=dt,Y.getContext("2d").drawImage(A,0,0,ot,dt),It("WebGLRenderer: Texture has been resized from ("+tt.width+"x"+tt.height+") to ("+ot+"x"+dt+")."),Y}else return"data"in A&&It("WebGLRenderer: Image in DataTexture is too big ("+tt.width+"x"+tt.height+")."),A;return A}function w(A){return A.generateMipmaps}function S(A){i.generateMipmap(A)}function T(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function E(A,y,B,st,tt,ot=!1){if(A!==null){if(i[A]!==void 0)return i[A];It("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let dt;st&&(dt=t.get("EXT_texture_norm16"),dt||It("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Y=y;if(y===i.RED&&(B===i.FLOAT&&(Y=i.R32F),B===i.HALF_FLOAT&&(Y=i.R16F),B===i.UNSIGNED_BYTE&&(Y=i.R8),B===i.UNSIGNED_SHORT&&dt&&(Y=dt.R16_EXT),B===i.SHORT&&dt&&(Y=dt.R16_SNORM_EXT)),y===i.RED_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.R8UI),B===i.UNSIGNED_SHORT&&(Y=i.R16UI),B===i.UNSIGNED_INT&&(Y=i.R32UI),B===i.BYTE&&(Y=i.R8I),B===i.SHORT&&(Y=i.R16I),B===i.INT&&(Y=i.R32I)),y===i.RG&&(B===i.FLOAT&&(Y=i.RG32F),B===i.HALF_FLOAT&&(Y=i.RG16F),B===i.UNSIGNED_BYTE&&(Y=i.RG8),B===i.UNSIGNED_SHORT&&dt&&(Y=dt.RG16_EXT),B===i.SHORT&&dt&&(Y=dt.RG16_SNORM_EXT)),y===i.RG_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RG8UI),B===i.UNSIGNED_SHORT&&(Y=i.RG16UI),B===i.UNSIGNED_INT&&(Y=i.RG32UI),B===i.BYTE&&(Y=i.RG8I),B===i.SHORT&&(Y=i.RG16I),B===i.INT&&(Y=i.RG32I)),y===i.RGB_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),B===i.UNSIGNED_INT&&(Y=i.RGB32UI),B===i.BYTE&&(Y=i.RGB8I),B===i.SHORT&&(Y=i.RGB16I),B===i.INT&&(Y=i.RGB32I)),y===i.RGBA_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),B===i.UNSIGNED_INT&&(Y=i.RGBA32UI),B===i.BYTE&&(Y=i.RGBA8I),B===i.SHORT&&(Y=i.RGBA16I),B===i.INT&&(Y=i.RGBA32I)),y===i.RGB&&(B===i.UNSIGNED_SHORT&&dt&&(Y=dt.RGB16_EXT),B===i.SHORT&&dt&&(Y=dt.RGB16_SNORM_EXT),B===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),B===i.UNSIGNED_INT_10F_11F_11F_REV&&(Y=i.R11F_G11F_B10F)),y===i.RGBA){let Z=ot?ur:Qt.getTransfer(tt);B===i.FLOAT&&(Y=i.RGBA32F),B===i.HALF_FLOAT&&(Y=i.RGBA16F),B===i.UNSIGNED_BYTE&&(Y=Z===se?i.SRGB8_ALPHA8:i.RGBA8),B===i.UNSIGNED_SHORT&&dt&&(Y=dt.RGBA16_EXT),B===i.SHORT&&dt&&(Y=dt.RGBA16_SNORM_EXT),B===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),B===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&t.get("EXT_color_buffer_float"),Y}function _(A,y){let B;return A?y===null||y===Fn||y===ss?B=i.DEPTH24_STENCIL8:y===Mn?B=i.DEPTH32F_STENCIL8:y===zs&&(B=i.DEPTH24_STENCIL8,It("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Fn||y===ss?B=i.DEPTH_COMPONENT24:y===Mn?B=i.DEPTH_COMPONENT32F:y===zs&&(B=i.DEPTH_COMPONENT16),B}function M(A,y){return w(A)===!0||A.isFramebufferTexture&&A.minFilter!==De&&A.minFilter!==Ze?Math.log2(Math.max(y.width,y.height))+1:A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?y.mipmaps.length:1}function N(A){let y=new WeakRef(A);n.get(A).__ref=y,m.add(y),x.register(A,y,y)}function P(A){let y=n.get(A).__ref;y!==void 0&&(m.delete(y),x.unregister(y))}function D(A){V(A.target)}function O(A){I(A.target)}function V(A){A.removeEventListener("dispose",D),P(A),q(A),A.isVideoTexture&&h.delete(A),A.isHTMLTexture&&d.delete(A)}function I(A){A.removeEventListener("dispose",O),P(A),Q(A)}function X(){for(let A of m){let y=A.deref();y!==void 0&&(y.isRenderTarget===!0?I(y):V(y))}m.clear(),d.clear()}function q(A){let y=n.get(A);if(y.__webglInit===void 0)return;let B=A.source,st=u.get(B);if(st){let tt=st[y.__cacheKey];tt.usedTimes--,tt.usedTimes===0&&H(A),Object.keys(st).length===0&&u.delete(B)}n.remove(A)}function H(A){let y=n.get(A);i.deleteTexture(y.__webglTexture);let B=A.source,st=u.get(B);delete st[y.__cacheKey],a.memory.textures--}function Q(A){let y=n.get(A);y.__depthDisposeCallback&&y.__depthDisposeCallback();let B=A.depthTexture;if(B&&B.renderTarget===A&&V(B),A.isWebGLCubeRenderTarget)for(let tt=0;tt<6;tt++){if(Array.isArray(y.__webglFramebuffer[tt]))for(let ot=0;ot<y.__webglFramebuffer[tt].length;ot++)i.deleteFramebuffer(y.__webglFramebuffer[tt][ot]);else i.deleteFramebuffer(y.__webglFramebuffer[tt]);y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer[tt])}else{if(Array.isArray(y.__webglFramebuffer))for(let tt=0;tt<y.__webglFramebuffer.length;tt++)i.deleteFramebuffer(y.__webglFramebuffer[tt]);else i.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&i.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let tt=0;tt<y.__webglColorRenderbuffer.length;tt++)y.__webglColorRenderbuffer[tt]&&i.deleteRenderbuffer(y.__webglColorRenderbuffer[tt]);y.__webglDepthRenderbuffer&&i.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let st=A.textures;for(let tt=0,ot=st.length;tt<ot;tt++){let dt=n.get(st[tt]);dt.__webglTexture&&(i.deleteTexture(dt.__webglTexture),a.memory.textures--),n.remove(st[tt])}n.remove(A)}let G=0;function nt(){G=0}function it(){return G}function At(A){G=A}function Ht(){let A=G;return A>=s.maxTextures&&It("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+s.maxTextures),G+=1,A}function J(A){let y=[];return y.push(A.wrapS),y.push(A.wrapT),y.push(A.wrapR||0),y.push(A.magFilter),y.push(A.minFilter),y.push(A.anisotropy),y.push(A.internalFormat),y.push(A.format),y.push(A.type),y.push(A.generateMipmaps),y.push(A.mipmapsAutoUpdate),y.push(A.premultiplyAlpha),y.push(A.flipY),y.push(A.unpackAlignment),y.push(A.colorSpace),y.join()}function yt(A,y){let B=n.get(A);if(A.isVideoTexture&&we(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&B.__version!==A.version){let st=A.image;if(st===null)It("WebGLRenderer: Texture marked for update but no image data found.");else if(st.complete===!1)It("WebGLRenderer: Texture marked for update but image is incomplete");else{Me(B,A,y);return}}else A.isExternalTexture&&(B.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,B.__webglTexture,i.TEXTURE0+y)}function Mt(A,y){let B=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&B.__version!==A.version){Me(B,A,y);return}else A.isExternalTexture&&(B.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,B.__webglTexture,i.TEXTURE0+y)}function Lt(A,y){let B=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&B.__version!==A.version){Me(B,A,y);return}e.bindTexture(i.TEXTURE_3D,B.__webglTexture,i.TEXTURE0+y)}function vt(A,y){let B=n.get(A);if(A.version>0&&B.__version!==A.version){Qe(B,A,y);return}e.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+y)}let Vt={[Ei]:i.REPEAT,[xn]:i.CLAMP_TO_EDGE,[ka]:i.MIRRORED_REPEAT},ve={[De]:i.NEAREST,[Au]:i.NEAREST_MIPMAP_NEAREST,[Br]:i.NEAREST_MIPMAP_LINEAR,[Ze]:i.LINEAR,[yo]:i.LINEAR_MIPMAP_NEAREST,[hi]:i.LINEAR_MIPMAP_LINEAR},Ot={[Iu]:i.NEVER,[Tc]:i.ALWAYS,[Lu]:i.LESS,[wc]:i.LEQUAL,[Du]:i.EQUAL,[Ec]:i.GEQUAL,[Nu]:i.GREATER,[Uu]:i.NOTEQUAL};function re(A,y){if(y.type===Mn&&t.has("OES_texture_float_linear")===!1&&(y.magFilter===Ze||y.magFilter===yo||y.magFilter===Br||y.magFilter===hi||y.minFilter===Ze||y.minFilter===yo||y.minFilter===Br||y.minFilter===hi)&&It("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,Vt[y.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,Vt[y.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,Vt[y.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,ve[y.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,ve[y.minFilter]),y.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,Ot[y.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===De||y.minFilter!==Br&&y.minFilter!==hi||y.type===Mn&&t.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){let B=t.get("EXT_texture_filter_anisotropic");i.texParameterf(A,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function le(A,y){let B=!1;A.__webglInit===void 0&&(A.__webglInit=!0,y.addEventListener("dispose",D),N(y));let st=y.source,tt=u.get(st);tt===void 0&&(tt={},u.set(st,tt));let ot=J(y);if(ot!==A.__cacheKey){tt[ot]===void 0&&(tt[ot]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,B=!0),tt[ot].usedTimes++;let dt=tt[A.__cacheKey];dt!==void 0&&(tt[A.__cacheKey].usedTimes--,dt.usedTimes===0&&H(y)),A.__cacheKey=ot,A.__webglTexture=tt[ot].texture}return B}function Jt(A,y,B){return Math.floor(Math.floor(A/B)/y)}function Ue(A,y,B,st){let ot=A.updateRanges;if(ot.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,y.width,y.height,B,st,y.data);else{ot.sort((C,j)=>C.start-j.start);let dt=0;for(let C=1;C<ot.length;C++){let j=ot[dt],$=ot[C],ht=j.start+j.count,at=Jt($.start,y.width,4),lt=Jt(j.start,y.width,4);$.start<=ht+1&&at===lt&&Jt($.start+$.count-1,y.width,4)===at?j.count=Math.max(j.count,$.start+$.count-j.start):(++dt,ot[dt]=$)}ot.length=dt+1;let Y=e.getParameter(i.UNPACK_ROW_LENGTH),Z=e.getParameter(i.UNPACK_SKIP_PIXELS),ct=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,y.width);for(let C=0,j=ot.length;C<j;C++){let $=ot[C],ht=Math.floor($.start/4),at=Math.ceil($.count/4),lt=ht%y.width,Ct=Math.floor(ht/y.width),$t=at,rt=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,lt),e.pixelStorei(i.UNPACK_SKIP_ROWS,Ct),e.texSubImage2D(i.TEXTURE_2D,0,lt,Ct,$t,rt,B,st,y.data)}A.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,Y),e.pixelStorei(i.UNPACK_SKIP_PIXELS,Z),e.pixelStorei(i.UNPACK_SKIP_ROWS,ct)}}function Me(A,y,B){let st=i.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(st=i.TEXTURE_2D_ARRAY),y.isData3DTexture&&(st=i.TEXTURE_3D);let tt=le(A,y),ot=y.source;e.bindTexture(st,A.__webglTexture,i.TEXTURE0+B);let dt=n.get(ot);if(ot.version!==dt.__version||tt===!0){if(e.activeTexture(i.TEXTURE0+B),(typeof ImageBitmap<"u"&&y.image instanceof ImageBitmap)===!1){let rt=Qt.getPrimaries(Qt.workingColorSpace),Pt=y.colorSpace===di?null:Qt.getPrimaries(y.colorSpace),Xt=y.colorSpace===di||rt===Pt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Xt)}e.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment);let Z=v(y.image,!1,s.maxTextureSize);Z=Dt(y,Z);let ct=r.convert(y.format,y.colorSpace),C=r.convert(y.type),j=E(y.internalFormat,ct,C,y.normalized,y.colorSpace,y.isVideoTexture);re(st,y);let $,ht=y.mipmaps,at=y.isVideoTexture!==!0,lt=dt.__version===void 0||tt===!0,Ct=ot.dataReady,$t=M(y,Z);if(y.isDepthTexture)j=_(y.format===ui,y.type),lt&&(at?e.texStorage2D(i.TEXTURE_2D,1,j,Z.width,Z.height):e.texImage2D(i.TEXTURE_2D,0,j,Z.width,Z.height,0,ct,C,null));else if(y.isDataTexture)if(ht.length>0){at&&lt&&e.texStorage2D(i.TEXTURE_2D,$t,j,ht[0].width,ht[0].height);for(let rt=0,Pt=ht.length;rt<Pt;rt++)$=ht[rt],at?Ct&&e.texSubImage2D(i.TEXTURE_2D,rt,0,0,$.width,$.height,ct,C,$.data):e.texImage2D(i.TEXTURE_2D,rt,j,$.width,$.height,0,ct,C,$.data);y.generateMipmaps=!1}else at?(lt&&e.texStorage2D(i.TEXTURE_2D,$t,j,Z.width,Z.height),Ct&&Ue(y,Z,ct,C)):e.texImage2D(i.TEXTURE_2D,0,j,Z.width,Z.height,0,ct,C,Z.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){at&&lt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,$t,j,ht[0].width,ht[0].height,Z.depth);for(let rt=0,Pt=ht.length;rt<Pt;rt++)if($=ht[rt],y.format!==kn)if(ct!==null)if(at){if(Ct)if(y.layerUpdates.size>0){let Xt=Fc($.width,$.height,y.format,y.type);for(let _t of y.layerUpdates){let ae=$.data.subarray(_t*Xt/$.data.BYTES_PER_ELEMENT,(_t+1)*Xt/$.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,rt,0,0,_t,$.width,$.height,1,ct,ae)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,rt,0,0,0,$.width,$.height,Z.depth,ct,$.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,rt,j,$.width,$.height,Z.depth,0,$.data,0,0);else It("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else at?Ct&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,rt,0,0,0,$.width,$.height,Z.depth,ct,C,$.data):e.texImage3D(i.TEXTURE_2D_ARRAY,rt,j,$.width,$.height,Z.depth,0,ct,C,$.data);y.layerUpdates.size>0&&y.clearLayerUpdates()}else{at&&lt&&e.texStorage2D(i.TEXTURE_2D,$t,j,ht[0].width,ht[0].height);for(let rt=0,Pt=ht.length;rt<Pt;rt++)$=ht[rt],y.format!==kn?ct!==null?at?Ct&&e.compressedTexSubImage2D(i.TEXTURE_2D,rt,0,0,$.width,$.height,ct,$.data):e.compressedTexImage2D(i.TEXTURE_2D,rt,j,$.width,$.height,0,$.data):It("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):at?Ct&&e.texSubImage2D(i.TEXTURE_2D,rt,0,0,$.width,$.height,ct,C,$.data):e.texImage2D(i.TEXTURE_2D,rt,j,$.width,$.height,0,ct,C,$.data)}else if(y.isDataArrayTexture)if(at){if(lt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,$t,j,Z.width,Z.height,Z.depth),Ct)if(y.layerUpdates.size>0){let rt=Fc(Z.width,Z.height,y.format,y.type);for(let Pt of y.layerUpdates){let Xt=Z.data.subarray(Pt*rt/Z.data.BYTES_PER_ELEMENT,(Pt+1)*rt/Z.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Pt,Z.width,Z.height,1,ct,C,Xt)}y.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Z.width,Z.height,Z.depth,ct,C,Z.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,j,Z.width,Z.height,Z.depth,0,ct,C,Z.data);else if(y.isData3DTexture)at?(lt&&e.texStorage3D(i.TEXTURE_3D,$t,j,Z.width,Z.height,Z.depth),Ct&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Z.width,Z.height,Z.depth,ct,C,Z.data)):e.texImage3D(i.TEXTURE_3D,0,j,Z.width,Z.height,Z.depth,0,ct,C,Z.data);else if(y.isFramebufferTexture){if(lt)if(at)e.texStorage2D(i.TEXTURE_2D,$t,j,Z.width,Z.height);else{let rt=Z.width,Pt=Z.height;for(let Xt=0;Xt<$t;Xt++)e.texImage2D(i.TEXTURE_2D,Xt,j,rt,Pt,0,ct,C,null),rt>>=1,Pt>>=1}}else if(y.isHTMLTexture){if("texElementImage2D"in i){let rt=i.canvas;if(rt.hasAttribute("layoutsubtree")||rt.setAttribute("layoutsubtree","true"),Z.parentNode!==rt){rt.appendChild(Z),d.add(y),rt.onpaint=Pt=>{let Xt=Pt.changedElements;for(let _t of d)Xt.includes(_t.image)&&(_t.needsUpdate=!0)},rt.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,Z);else{let Xt=i.RGBA,_t=i.RGBA,ae=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Xt,_t,ae,Z)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(ht.length>0){if(at&&lt){let rt=zt(ht[0]);e.texStorage2D(i.TEXTURE_2D,$t,j,rt.width,rt.height)}for(let rt=0,Pt=ht.length;rt<Pt;rt++)$=ht[rt],at?Ct&&e.texSubImage2D(i.TEXTURE_2D,rt,0,0,ct,C,$):e.texImage2D(i.TEXTURE_2D,rt,j,ct,C,$);y.generateMipmaps=!1}else if(at){if(lt){let rt=zt(Z);e.texStorage2D(i.TEXTURE_2D,$t,j,rt.width,rt.height)}Ct&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ct,C,Z)}else e.texImage2D(i.TEXTURE_2D,0,j,ct,C,Z);w(y)&&y.mipmapsAutoUpdate===!0&&S(st),dt.__version=ot.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function Qe(A,y,B){if(y.image.length!==6)return;let st=le(A,y),tt=y.source;e.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+B);let ot=n.get(tt);if(tt.version!==ot.__version||st===!0){e.activeTexture(i.TEXTURE0+B);let dt=Qt.getPrimaries(Qt.workingColorSpace),Y=y.colorSpace===di?null:Qt.getPrimaries(y.colorSpace),Z=y.colorSpace===di||dt===Y?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Z);let ct=y.isCompressedTexture||y.image[0].isCompressedTexture,C=y.image[0]&&y.image[0].isDataTexture,j=[];for(let _t=0;_t<6;_t++)!ct&&!C?j[_t]=v(y.image[_t],!0,s.maxCubemapSize):j[_t]=C?y.image[_t].image:y.image[_t],j[_t]=Dt(y,j[_t]);let $=j[0],ht=r.convert(y.format,y.colorSpace),at=r.convert(y.type),lt=E(y.internalFormat,ht,at,y.normalized,y.colorSpace),Ct=y.isVideoTexture!==!0,$t=ot.__version===void 0||st===!0,rt=tt.dataReady,Pt=M(y,$);re(i.TEXTURE_CUBE_MAP,y);let Xt;if(y.isDepthTexture){if(lt=_(y.format===ui,y.type),$t)if(Ct)e.texStorage2D(i.TEXTURE_CUBE_MAP,1,lt,$.width,$.height);else for(let _t=0;_t<6;_t++)e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,0,lt,$.width,$.height,0,ht,at,null)}else if(ct){Ct&&$t&&e.texStorage2D(i.TEXTURE_CUBE_MAP,Pt,lt,$.width,$.height);for(let _t=0;_t<6;_t++){Xt=j[_t].mipmaps;for(let ae=0;ae<Xt.length;ae++){let Pe=Xt[ae];y.format!==kn?ht!==null?Ct?rt&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,ae,0,0,Pe.width,Pe.height,ht,Pe.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,ae,lt,Pe.width,Pe.height,0,Pe.data):It("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ct?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,ae,0,0,Pe.width,Pe.height,ht,at,Pe.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,ae,lt,Pe.width,Pe.height,0,ht,at,Pe.data)}}}else{if(Xt=y.mipmaps,Ct&&$t){Xt.length>0&&Pt++;let _t=zt(j[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,Pt,lt,_t.width,_t.height)}for(let _t=0;_t<6;_t++)if(C){Ct?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,0,0,0,j[_t].width,j[_t].height,ht,at,j[_t].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,0,lt,j[_t].width,j[_t].height,0,ht,at,j[_t].data);for(let ae=0;ae<Xt.length;ae++){let _i=Xt[ae].image[_t].image;Ct?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,ae+1,0,0,_i.width,_i.height,ht,at,_i.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,ae+1,lt,_i.width,_i.height,0,ht,at,_i.data)}}else{Ct?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,0,0,0,ht,at,j[_t]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,0,lt,ht,at,j[_t]);for(let ae=0;ae<Xt.length;ae++){let Pe=Xt[ae];Ct?rt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,ae+1,0,0,ht,at,Pe.image[_t]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_t,ae+1,lt,ht,at,Pe.image[_t])}}}w(y)&&y.mipmapsAutoUpdate===!0&&S(i.TEXTURE_CUBE_MAP),ot.__version=tt.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function _e(A,y,B,st,tt,ot){let dt=r.convert(B.format,B.colorSpace),Y=r.convert(B.type),Z=E(B.internalFormat,dt,Y,B.normalized,B.colorSpace),ct=n.get(y),C=n.get(B);if(C.__renderTarget=y,!ct.__hasExternalTextures){let j=Math.max(1,y.width>>ot),$=Math.max(1,y.height>>ot);tt===i.TEXTURE_3D||tt===i.TEXTURE_2D_ARRAY?e.texImage3D(tt,ot,Z,j,$,y.depth,0,dt,Y,null):e.texImage2D(tt,ot,Z,j,$,0,dt,Y,null)}e.bindFramebuffer(i.FRAMEBUFFER,A),mt(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,st,tt,C.__webglTexture,0,me(y)):(tt===i.TEXTURE_2D||tt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&tt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,st,tt,C.__webglTexture,ot),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Vn(A,y,B){if(i.bindRenderbuffer(i.RENDERBUFFER,A),y.depthBuffer){let st=y.depthTexture,tt=st&&st.isDepthTexture?st.type:null,ot=_(y.stencilBuffer,tt),dt=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;mt(y)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,me(y),ot,y.width,y.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,me(y),ot,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,ot,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,dt,i.RENDERBUFFER,A)}else{let st=y.textures;for(let tt=0;tt<st.length;tt++){let ot=st[tt],dt=r.convert(ot.format,ot.colorSpace),Y=r.convert(ot.type),Z=E(ot.internalFormat,dt,Y,ot.normalized,ot.colorSpace);mt(y)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,me(y),Z,y.width,y.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,me(y),Z,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,Z,y.width,y.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Ce(A,y,B){let st=y.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,A),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let tt=n.get(y.depthTexture);tt.__renderTarget=y;let ot=st?y.depthTexture.image[0]:y.depthTexture.image;(!tt.__webglTexture||ot.width!==y.width||ot.height!==y.height)&&(ot.width=y.width,ot.height=y.height,y.depthTexture.needsUpdate=!0),st?vt(y.depthTexture,0):yt(y.depthTexture,0);let dt=tt.__webglTexture,Y=me(y),Z=st?i.TEXTURE_CUBE_MAP_POSITIVE_X+B:i.TEXTURE_2D,ct=y.depthTexture.format===ui?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(y.depthTexture.format===ai)mt(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ct,Z,dt,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,ct,Z,dt,0);else if(y.depthTexture.format===ui)mt(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ct,Z,dt,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,ct,Z,dt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function fn(A){let y=n.get(A),B=A.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==A.depthTexture){let st=A.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),st){let tt=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,st.removeEventListener("dispose",tt)};st.addEventListener("dispose",tt),y.__depthDisposeCallback=tt}y.__boundDepthTexture=st}if(A.depthTexture&&!y.__autoAllocateDepthBuffer)if(B)for(let st=0;st<6;st++)Ce(y.__webglFramebuffer[st],A,st);else A.texture.mipmaps.length>0?Ce(y.__webglFramebuffer[0],A,0):Ce(y.__webglFramebuffer,A,0);else if(B){y.__webglDepthbuffer=[];for(let st=0;st<6;st++)if(e.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[st]),y.__webglDepthbuffer[st]===void 0)y.__webglDepthbuffer[st]=i.createRenderbuffer(),Vn(y.__webglDepthbuffer[st],A,!1);else{let tt=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ot=y.__webglDepthbuffer[st];i.bindRenderbuffer(i.RENDERBUFFER,ot),i.framebufferRenderbuffer(i.FRAMEBUFFER,tt,i.RENDERBUFFER,ot)}}else if(A.texture.mipmaps.length>0?e.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=i.createRenderbuffer(),Vn(y.__webglDepthbuffer,A,!1);else{let tt=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ot=y.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ot),i.framebufferRenderbuffer(i.FRAMEBUFFER,tt,i.RENDERBUFFER,ot)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function pn(A,y,B){let st=n.get(A);y!==void 0&&_e(st.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),B!==void 0&&fn(A)}function mn(A){let y=A.texture,B=n.get(A),st=n.get(y);A.addEventListener("dispose",O),N(A);let tt=A.textures,ot=A.isWebGLCubeRenderTarget===!0,dt=tt.length>1;if(dt||(st.__webglTexture===void 0&&(st.__webglTexture=i.createTexture()),st.__version=y.version,a.memory.textures++),ot){B.__webglFramebuffer=[];for(let Y=0;Y<6;Y++)if(y.mipmaps.length>0){B.__webglFramebuffer[Y]=[];for(let Z=0;Z<y.mipmaps.length;Z++)B.__webglFramebuffer[Y][Z]=i.createFramebuffer()}else B.__webglFramebuffer[Y]=i.createFramebuffer()}else{if(y.mipmaps.length>0){B.__webglFramebuffer=[];for(let Y=0;Y<y.mipmaps.length;Y++)B.__webglFramebuffer[Y]=i.createFramebuffer()}else B.__webglFramebuffer=i.createFramebuffer();if(dt)for(let Y=0,Z=tt.length;Y<Z;Y++){let ct=n.get(tt[Y]);ct.__webglTexture===void 0&&(ct.__webglTexture=i.createTexture(),a.memory.textures++)}if(A.samples>0&&mt(A)===!1){B.__webglMultisampledFramebuffer=i.createFramebuffer(),B.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let Y=0;Y<tt.length;Y++){let Z=tt[Y];B.__webglColorRenderbuffer[Y]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,B.__webglColorRenderbuffer[Y]);let ct=r.convert(Z.format,Z.colorSpace),C=r.convert(Z.type),j=E(Z.internalFormat,ct,C,Z.normalized,Z.colorSpace,A.isXRRenderTarget===!0),$=me(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,$,j,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Y,i.RENDERBUFFER,B.__webglColorRenderbuffer[Y])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(B.__webglDepthRenderbuffer=i.createRenderbuffer(),Vn(B.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(ot){e.bindTexture(i.TEXTURE_CUBE_MAP,st.__webglTexture),re(i.TEXTURE_CUBE_MAP,y);for(let Y=0;Y<6;Y++)if(y.mipmaps.length>0)for(let Z=0;Z<y.mipmaps.length;Z++)_e(B.__webglFramebuffer[Y][Z],A,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,Z);else _e(B.__webglFramebuffer[Y],A,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0);w(y)?S(i.TEXTURE_CUBE_MAP):y.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,y.mipmaps.length-1),e.unbindTexture()}else if(dt){for(let Y=0,Z=tt.length;Y<Z;Y++){let ct=tt[Y],C=n.get(ct),j=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(j=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(j,C.__webglTexture),re(j,ct),_e(B.__webglFramebuffer,A,ct,i.COLOR_ATTACHMENT0+Y,j,0),w(ct)&&S(j)}e.unbindTexture()}else{let Y=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(Y=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(Y,st.__webglTexture),re(Y,y),y.mipmaps.length>0)for(let Z=0;Z<y.mipmaps.length;Z++)_e(B.__webglFramebuffer[Z],A,y,i.COLOR_ATTACHMENT0,Y,Z);else _e(B.__webglFramebuffer,A,y,i.COLOR_ATTACHMENT0,Y,0);w(y)?S(Y):y.mipmaps.length>0&&i.texParameteri(Y,i.TEXTURE_MAX_LEVEL,y.mipmaps.length-1),e.unbindTexture()}A.depthBuffer&&fn(A)}function U(A){let y=A.textures;for(let B=0,st=y.length;B<st;B++){let tt=y[B];if(w(tt)&&tt.mipmapsAutoUpdate===!0){let ot=T(A),dt=n.get(tt).__webglTexture;e.bindTexture(ot,dt),S(ot),e.unbindTexture()}}}let gn=[];function pe(A){if(A.samples>0){if(mt(A)===!1){let y=A.textures,B=A.width,st=A.height,tt=i.COLOR_BUFFER_BIT,ot=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,dt=n.get(A),Y=y.length>1;if(Y)for(let ct=0;ct<y.length;ct++)e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,dt.__webglMultisampledFramebuffer),A.texture.mipmaps.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,dt.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,dt.__webglFramebuffer);for(let ct=0;ct<y.length;ct++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(tt|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(tt|=i.STENCIL_BUFFER_BIT)),Y){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,dt.__webglColorRenderbuffer[ct]);let C=n.get(y[ct]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,C,0)}i.blitFramebuffer(0,0,B,st,0,0,B,st,tt,i.NEAREST),l===!0&&(gn.length=0,gn.push(i.COLOR_ATTACHMENT0+ct),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&gn.push(ot),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,gn))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),Y)for(let ct=0;ct<y.length;ct++){e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.RENDERBUFFER,dt.__webglColorRenderbuffer[ct]);let C=n.get(y[ct]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.TEXTURE_2D,C,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,dt.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&l){let y=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[y])}}}function me(A){return Math.min(s.maxSamples,A.samples)}function mt(A){let y=n.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function we(A){let y=a.render.frame;h.get(A)!==y&&(h.set(A,y),A.update())}function Dt(A,y){let B=A.colorSpace,st=A.format,tt=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||B!==hr&&B!==di&&(Qt.getTransfer(B)===se?(st!==kn||tt!==tn)&&It("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Bt("WebGLTextures: Unsupported texture color space:",B)),y}function zt(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=Ht,this.resetTextureUnits=nt,this.getTextureUnits=it,this.setTextureUnits=At,this.setTexture2D=yt,this.setTexture2DArray=Mt,this.setTexture3D=Lt,this.setTextureCube=vt,this.rebindTextures=pn,this.setupRenderTarget=mn,this.updateRenderTargetMipmap=U,this.updateMultisampleRenderTarget=pe,this.setupDepthRenderbuffer=fn,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=mt,this.dispose=X}function J_(i,t){function e(n,s=di){let r,a=Qt.getTransfer(s);if(n===tn)return i.UNSIGNED_BYTE;if(n===bo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===So)return i.UNSIGNED_SHORT_5_5_5_1;if(n===vc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===bc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===xc)return i.BYTE;if(n===yc)return i.SHORT;if(n===zs)return i.UNSIGNED_SHORT;if(n===vo)return i.INT;if(n===Fn)return i.UNSIGNED_INT;if(n===Mn)return i.FLOAT;if(n===Bn)return i.HALF_FLOAT;if(n===Sc)return i.ALPHA;if(n===Mc)return i.RGB;if(n===kn)return i.RGBA;if(n===ai)return i.DEPTH_COMPONENT;if(n===ui)return i.DEPTH_STENCIL;if(n===Mo)return i.RED;if(n===wo)return i.RED_INTEGER;if(n===Oi)return i.RG;if(n===Eo)return i.RG_INTEGER;if(n===To)return i.RGBA_INTEGER;if(n===kr||n===zr||n===Hr||n===Gr)if(a===se)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===kr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===zr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Gr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===kr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===zr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Hr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Gr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ao||n===Ro||n===Co||n===Po)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Ao)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ro)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Co)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Po)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Io||n===Lo||n===Do||n===No||n===Uo||n===Vr||n===Oo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Io||n===Lo)return a===se?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Do)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===No)return r.COMPRESSED_R11_EAC;if(n===Uo)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Vr)return r.COMPRESSED_RG11_EAC;if(n===Oo)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Fo||n===Bo||n===ko||n===zo||n===Ho||n===Go||n===Vo||n===Wo||n===Xo||n===$o||n===qo||n===Yo||n===Zo||n===Jo)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Fo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Bo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ko)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===zo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ho)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Go)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Vo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Wo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Xo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===$o)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===qo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Yo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Zo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Jo)return a===se?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===jo||n===Ko||n===Qo)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===jo)return a===se?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ko)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Qo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===tl||n===el||n===Wr||n===nl)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===tl)return r.COMPRESSED_RED_RGTC1_EXT;if(n===el)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Wr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===nl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ss?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var j_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,K_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,jc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new Sr(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new Sn({vertexShader:j_,fragmentShader:K_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new ue(new fe(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Kc=class extends Dn{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,d=null,f=null,u=null,m=null,x=typeof XRWebGLBinding<"u",g=new jc,p={},v=e.getContextAttributes(),w=null,S=null,T=[],E=[],_=new gt,M=null,N=null,P=new Be;P.viewport=new ge;let D=new Be;D.viewport=new ge;let O=[P,D],V=new po,I=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let yt=T[J];return yt===void 0&&(yt=new Ls,T[J]=yt),yt.getTargetRaySpace()},this.getControllerGrip=function(J){let yt=T[J];return yt===void 0&&(yt=new Ls,T[J]=yt),yt.getGripSpace()},this.getHand=function(J){let yt=T[J];return yt===void 0&&(yt=new Ls,T[J]=yt),yt.getHandSpace()};function q(J){let yt=E.indexOf(J.inputSource);if(yt===-1)return;let Mt=T[yt];Mt!==void 0&&(Mt.update(J.inputSource,J.frame,c||a),Mt.dispatchEvent({type:J.type,data:J.inputSource}))}function H(){s.removeEventListener("select",q),s.removeEventListener("selectstart",q),s.removeEventListener("selectend",q),s.removeEventListener("squeeze",q),s.removeEventListener("squeezestart",q),s.removeEventListener("squeezeend",q),s.removeEventListener("end",H),s.removeEventListener("inputsourceschange",Q);for(let J=0;J<T.length;J++){let yt=E[J];yt!==null&&(E[J]=null,T[J].disconnect(yt))}I=null,X=null,g.reset();for(let J in p)delete p[J];if(t.setRenderTarget(w),u=null,f=null,d=null,s=null,S=null,Ht.stop(),n.isPresenting=!1,t.setPixelRatio(M),t.setSize(_.width,_.height,!1),N!==null){let J=N.camera;J.fov=N.fov,J.zoom=N.zoom,J.updateProjectionMatrix(),N=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){r=J,n.isPresenting===!0&&It("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){o=J,n.isPresenting===!0&&It("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(J){c=J},this.getBaseLayer=function(){return f!==null?f:u},this.getBinding=function(){return d===null&&x&&(d=new XRWebGLBinding(s,e)),d},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(J){if(s=J,s!==null){if(w=t.getRenderTarget(),s.addEventListener("select",q),s.addEventListener("selectstart",q),s.addEventListener("selectend",q),s.addEventListener("squeeze",q),s.addEventListener("squeezestart",q),s.addEventListener("squeezeend",q),s.addEventListener("end",H),s.addEventListener("inputsourceschange",Q),v.xrCompatible!==!0&&await e.makeXRCompatible(),M=t.getPixelRatio(),t.getSize(_),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let Mt=null,Lt=null,vt=null;v.depth&&(vt=v.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,Mt=v.stencil?ui:ai,Lt=v.stencil?ss:Fn);let Vt={colorFormat:e.RGBA8,depthFormat:vt,scaleFactor:r};d=this.getBinding(),f=d.createProjectionLayer(Vt),s.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),S=new cn(f.textureWidth,f.textureHeight,{format:kn,type:tn,depthTexture:new li(f.textureWidth,f.textureHeight,Lt,void 0,void 0,void 0,void 0,void 0,void 0,Mt),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{let Mt={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};u=new XRWebGLLayer(s,e,Mt),s.updateRenderState({baseLayer:u}),t.setPixelRatio(1),t.setSize(u.framebufferWidth,u.framebufferHeight,!1),S=new cn(u.framebufferWidth,u.framebufferHeight,{format:kn,type:tn,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Ht.setContext(s),Ht.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function Q(J){for(let yt=0;yt<J.removed.length;yt++){let Mt=J.removed[yt],Lt=E.indexOf(Mt);Lt>=0&&(E[Lt]=null,T[Lt].disconnect(Mt))}for(let yt=0;yt<J.added.length;yt++){let Mt=J.added[yt],Lt=E.indexOf(Mt);if(Lt===-1){for(let Vt=0;Vt<T.length;Vt++)if(Vt>=E.length){E.push(Mt),Lt=Vt;break}else if(E[Vt]===null){E[Vt]=Mt,Lt=Vt;break}if(Lt===-1)break}let vt=T[Lt];vt&&vt.connect(Mt)}}function G(J,yt){yt===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(yt.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(s===null)return;let yt=J.near,Mt=J.far;g.texture!==null&&(g.depthNear>0&&(yt=g.depthNear),g.depthFar>0&&(Mt=g.depthFar)),V.near=D.near=P.near=yt,V.far=D.far=P.far=Mt,(I!==V.near||X!==V.far)&&(s.updateRenderState({depthNear:V.near,depthFar:V.far}),I=V.near,X=V.far),V.layers.mask=J.layers.mask|6,P.layers.mask=V.layers.mask&-5,D.layers.mask=V.layers.mask&-3;let Lt=J.parent,vt=V.cameras;G(V,Lt);for(let Vt=0;Vt<vt.length;Vt++)G(vt[Vt],Lt);V.projectionMatrix.copy(P.projectionMatrix),V.projectionMatrixInverse.copy(P.projectionMatrixInverse),N===null&&J.isPerspectiveCamera&&(N={camera:J,fov:J.fov,zoom:J.zoom}),nt(J,V,Lt)};function nt(J,yt,Mt){Mt===null?J.matrix.copy(yt.matrixWorld):(J.matrix.copy(Mt.matrixWorld),J.matrix.invert(),J.matrix.multiply(yt.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(yt.projectionMatrix),J.projectionMatrixInverse.copy(yt.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=$i*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return V},this.getFoveation=function(){if(!(f===null&&u===null))return l},this.setFoveation=function(J){l=J,f!==null&&(f.fixedFoveation=J),u!==null&&u.fixedFoveation!==void 0&&(u.fixedFoveation=J)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(V)},this.getCameraTexture=function(J){return p[J]};let it=null;function At(J,yt){if(h=yt.getViewerPose(c||a),m=yt,h!==null){let Mt=h.views;u!==null&&(t.setRenderTargetFramebuffer(S,u.framebuffer),t.setRenderTarget(S));let Lt=!1;Mt.length!==V.cameras.length&&(V.cameras.length=0,Lt=!0);for(let Ot=0;Ot<Mt.length;Ot++){let re=Mt[Ot],le=null;if(u!==null)le=u.getViewport(re);else{let Ue=d.getViewSubImage(f,re);le=Ue.viewport,Ot===0&&(t.setRenderTargetTextures(S,Ue.colorTexture,Ue.depthStencilTexture),t.setRenderTarget(S))}let Jt=O[Ot];Jt===void 0&&(Jt=new Be,Jt.layers.enable(Ot),Jt.viewport=new ge,O[Ot]=Jt),Jt.matrix.fromArray(re.transform.matrix),Jt.matrix.decompose(Jt.position,Jt.quaternion,Jt.scale),Jt.projectionMatrix.fromArray(re.projectionMatrix),Jt.projectionMatrixInverse.copy(Jt.projectionMatrix).invert(),Jt.viewport.set(le.x,le.y,le.width,le.height),Ot===0&&(V.matrix.copy(Jt.matrix),V.matrix.decompose(V.position,V.quaternion,V.scale)),Lt===!0&&V.cameras.push(Jt)}let vt=s.enabledFeatures;if(vt&&vt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&x){d=n.getBinding();let Ot=d.getDepthInformation(Mt[0]);Ot&&Ot.isValid&&Ot.texture&&g.init(Ot,s.renderState)}if(vt&&vt.includes("camera-access")&&x){t.state.unbindTexture(),d=n.getBinding();for(let Ot=0;Ot<Mt.length;Ot++){let re=Mt[Ot].camera;if(re){let le=p[re];le||(le=new Sr,p[re]=le);let Jt=d.getCameraImage(re);le.sourceTexture=Jt}}}}for(let Mt=0;Mt<T.length;Mt++){let Lt=E[Mt],vt=T[Mt];Lt!==null&&vt!==void 0&&vt.update(Lt,yt,c||a)}it&&it(J,yt),yt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:yt}),m=null}let Ht=new pd;Ht.setAnimationLoop(At),this.setAnimationLoop=function(J){it=J},this.dispose=function(){}}},Q_=new Zt,wd=new kt;wd.set(-1,0,0,0,1,0,0,0,1);function tx(i,t){function e(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function n(g,p){p.color.getRGB(g.fogColor.value,Nc(i)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function s(g,p,v,w,S){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(g,p):p.isMeshLambertMaterial?(r(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(g,p),d(g,p)):p.isMeshPhongMaterial?(r(g,p),h(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(g,p),f(g,p),p.isMeshPhysicalMaterial&&u(g,p,S)):p.isMeshMatcapMaterial?(r(g,p),m(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),x(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(a(g,p),p.isLineDashedMaterial&&o(g,p)):p.isPointsMaterial?l(g,p,v,w):p.isSpriteMaterial?c(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,e(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===ke&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,e(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===ke&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,e(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,e(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let v=t.get(p),w=v.envMap,S=v.envMapRotation;w&&(g.envMap.value=w,g.envMapRotation.value.setFromMatrix4(Q_.makeRotationFromEuler(S)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(wd),g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,g.aoMapTransform))}function a(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform))}function o(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function l(g,p,v,w){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*v,g.scale.value=w*.5,p.map&&(g.map.value=p.map,e(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function c(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function h(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function d(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function f(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function u(g,p,v){g.ior.value=p.ior,p.diffuseRoughness>0&&(g.diffuseRoughness.value=p.diffuseRoughness,p.diffuseRoughnessMap&&(g.diffuseRoughnessMap.value=p.diffuseRoughnessMap,e(p.diffuseRoughnessMap,g.diffuseRoughnessMapTransform))),p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===ke&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.retroreflectivity>0&&(g.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessMinimum,g.iridescenceThicknessMaximum.value=p.iridescenceThicknessMaximum,p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=v.texture,g.transmissionSamplerSize.value.set(v.width,v.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,p){p.matcap&&(g.matcap.value=p.matcap)}function x(g,p){let v=t.get(p).light;g.referencePosition.value.setFromMatrixPosition(v.matrixWorld),g.nearDistance.value=v.shadow.camera.near,g.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function ex(i,t,e,n){let s={},r={};function a(v,w){let S=w.program;n.uniformBlockBinding(v,S,s[v.id])}function o(v,w){let S=s[v.id];S===void 0&&(m(v),S=l(v),s[v.id]=S,v.addEventListener("dispose",g));let T=w.program;n.updateUBOMapping(v,T);let E=t.render.frame;r[v.id]!==E&&(c(v),r[v.id]=E)}function l(v){let w=i.createBuffer(),S=v.__size,T=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,w),i.bufferData(i.UNIFORM_BUFFER,S,T),i.bindBuffer(i.UNIFORM_BUFFER,null),w}function c(v){let w=s[v.id],S=v.uniforms,T=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let E=0,_=S.length;E<_;E++){let M=S[E];if(Array.isArray(M))for(let N=0,P=M.length;N<P;N++)h(M[N],E,N,T);else h(M,E,0,T)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function h(v,w,S,T){if(f(v,w,S,T)===!0){let E=v.__offset,_=v.value;if(Array.isArray(_)){let M=0;for(let N=0;N<_.length;N++){let P=_[N],D=x(P,!0);d(P,v.__data,M),M+=D.storage/Float32Array.BYTES_PER_ELEMENT}}else d(_,v.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,E,v.__data)}}function d(v,w,S){typeof v=="number"||typeof v=="boolean"?w[S]=v:v.isMatrix3?(w[S]=v.elements[0],w[S+1]=v.elements[1],w[S+2]=v.elements[2],w[S+3]=0,w[S+4]=v.elements[3],w[S+5]=v.elements[4],w[S+6]=v.elements[5],w[S+7]=0,w[S+8]=v.elements[6],w[S+9]=v.elements[7],w[S+10]=v.elements[8],w[S+11]=0):ArrayBuffer.isView(v)?w.set(v.subarray(0,w.length-S),S):v.toArray(w,S)}function f(v,w,S,T){let E=v.value,_=w+"_"+S;if(Array.isArray(E)){T[_]===void 0&&(T[_]=[]);let M=T[_],N=!1;for(let P=0;P<E.length;P++)u(E[P],M,P)===!0&&(N=!0);return N}return u(E,T,_)}function u(v,w,S){if(w[S]===void 0)return typeof v=="number"||typeof v=="boolean"?w[S]=v:ArrayBuffer.isView(v)?w[S]=v.slice():w[S]=v.clone(),!0;{let T=w[S];if(typeof v=="number"||typeof v=="boolean"){if(T!==v)return w[S]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(T.equals(v)===!1)return T.copy(v),!0}}return!1}function m(v){let w=v.uniforms,S=0,T=16;for(let _=0,M=w.length;_<M;_++){let N=Array.isArray(w[_])?w[_]:[w[_]];for(let P=0,D=N.length;P<D;P++){let O=N[P],V=Array.isArray(O.value)?O.value:[O.value],I=Array.isArray(w[_])||Array.isArray(O.value),X=S;for(let H=0,Q=V.length;H<Q;H++){let G=V[H],nt=x(G,I),it=S%T,At=it%nt.boundary,Ht=it+At;S+=At,Ht!==0&&T-Ht<nt.storage&&(S+=T-Ht),H===0&&(X=S),S+=nt.storage}let q=O.type==="int"?Int32Array:O.type==="uint"?Uint32Array:Float32Array;O.__data=new q((S-X)/Float32Array.BYTES_PER_ELEMENT),O.__offset=X}}let E=S%T;return E>0&&(S+=T-E),v.__size=S,v.__cache={},this}function x(v,w){let S={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(S.boundary=4,S.storage=4):v.isVector2?(S.boundary=8,S.storage=8):v.isVector3||v.isColor?(S.boundary=16,S.storage=12):v.isVector4?(S.boundary=16,S.storage=16):v.isMatrix3?(S.boundary=16,S.storage=48):v.isMatrix4?(S.boundary=16,S.storage=64):v.isTexture?It("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(S.boundary=16,S.storage=v.byteLength):It("WebGLRenderer: Unsupported uniform value type.",v),w===!0&&(S.boundary=16,S.storage=Math.ceil(S.storage/16)*16),S}function g(v){let w=v.target;w.removeEventListener("dispose",g),i.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function p(){for(let v in s)i.deleteBuffer(s[v]);s={},r={}}return{bind:a,update:o,dispose:p}}var nx=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),jn=null;function ix(){return jn===null&&(jn=new _r(nx,16,16,Oi,Bn),jn.name="DFG_LUT",jn.minFilter=Ze,jn.magFilter=Ze,jn.wrapS=xn,jn.wrapT=xn,jn.generateMipmaps=!1,jn.needsUpdate=!0),jn}var rl=class{constructor(t={}){let{canvas:e=Fu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:f=!1,outputBufferType:u=tn}=t;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;let x=u,g=new Set([To,Eo,wo]),p=new Set([tn,Fn,zs,ss,bo,So]),v=new Uint32Array(4),w=new Int32Array(4),S={textures:[],min:[],max:[],resolution:[]},T=null,E=null,_=[],M=[],N=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Jn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,D=!1,O=null,V=null,I=null,X=null;this._outputColorSpace=Fe;let q=0,H=0,Q=null,G=-1,nt=null,it=new ge,At=new ge,Ht=null,J=new Ut(0),yt=0,Mt=e.width,Lt=e.height,vt=1,Vt=null,ve=null,Ot=new ge(0,0,Mt,Lt),re=new ge(0,0,Mt,Lt),le=!1,Jt=new Ai,Ue=new Wa,Me=!1,Qe=!1,_e=new Zt,Vn=new R,Ce=new ge,fn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},pn=!1;function mn(){return Q===null?vt:1}let U=n;function gn(b,L){return e.getContext(b,L)}let pe,me,mt,we,Dt,zt,A,y,B,st,tt,ot,dt,Y,Z,ct,C,j,$,ht,at,lt,Ct;try{let b={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"187"}`),e.addEventListener("webglcontextlost",Pt,!1),e.addEventListener("webglcontextrestored",Xt,!1),e.addEventListener("webglcontextcreationerror",_t,!1),U===null){let L="webgl2";if(U=gn(L,b),U===null)throw gn(L)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}$t()}catch(b){throw e.removeEventListener("webglcontextlost",Pt,!1),e.removeEventListener("webglcontextrestored",Xt,!1),e.removeEventListener("webglcontextcreationerror",_t,!1),Bt("WebGLRenderer: "+b.message),b}function $t(){pe=new pg(U),pe.init(),at=new J_(U,pe),me=new ig(U,pe,t,at),mt=new Y_(U,pe),me.reversedDepthBuffer&&f&&mt.buffers.depth.setReversed(!0),V=U.createFramebuffer(),I=U.createFramebuffer(),X=U.createFramebuffer(),we=new _g(U),Dt=new N_,zt=new Z_(U,pe,mt,Dt,me,at,we),A=new fg(P),y=new yp(U),lt=new eg(U,y),B=new mg(U,y,we,lt),st=new yg(U,B,y,lt,we),j=new xg(U,me,zt),Z=new sg(Dt),tt=new D_(P,A,pe,me,lt,Z),ot=new tx(P,Dt),dt=new O_,Y=new G_(pe),C=new tg(P,A,mt,st,m,l),ct=new q_(P,st,me),Ct=new ex(U,we,me,mt),$=new ng(U,pe,we),ht=new gg(U,pe,we),we.programs=tt.programs,P.capabilities=me,P.extensions=pe,P.properties=Dt,P.renderLists=dt,P.shadowMap=ct,P.state=mt,P.info=we}x!==tn&&(N=new bg(x,e.width,e.height,o,s,r));let rt=new Kc(P,U);this.xr=rt,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){let b=pe.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=pe.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return vt},this.setPixelRatio=function(b){b!==void 0&&(vt=b,this.setSize(Mt,Lt,!1))},this.getSize=function(b){return b.set(Mt,Lt)},this.setSize=function(b,L,W=!0){if(rt.isPresenting){It("WebGLRenderer: Can't change size while VR device is presenting.");return}Mt=b,Lt=L,e.width=Math.floor(b*vt),e.height=Math.floor(L*vt),W===!0&&(e.style.width=b+"px",e.style.height=L+"px"),N!==null&&N.setSize(e.width,e.height),this.setViewport(0,0,b,L)},this.getDrawingBufferSize=function(b){return b.set(Mt*vt,Lt*vt).floor()},this.setDrawingBufferSize=function(b,L,W){Mt=b,Lt=L,vt=W,e.width=Math.floor(b*W),e.height=Math.floor(L*W),this.setViewport(0,0,b,L)},this.setEffects=function(b){if(x===tn){Bt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let L=0;L<b.length;L++)if(b[L].isOutputPass===!0){It("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}N.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(it)},this.getViewport=function(b){return b.copy(Ot)},this.setViewport=function(b,L,W,F){b.isVector4?Ot.set(b.x,b.y,b.z,b.w):Ot.set(b,L,W,F),mt.viewport(it.copy(Ot).multiplyScalar(mn()).round())},this.getScissor=function(b){return b.copy(re)},this.setScissor=function(b,L,W,F){b.isVector4?re.set(b.x,b.y,b.z,b.w):re.set(b,L,W,F),mt.scissor(At.copy(re).multiplyScalar(mn()).round())},this.getScissorTest=function(){return le},this.setScissorTest=function(b){mt.setScissorTest(le=b)},this.setOpaqueSort=function(b){Vt=b},this.setTransparentSort=function(b){ve=b},this.getClearColor=function(b){return b.copy(C.getClearColor())},this.setClearColor=function(){C.setClearColor(...arguments)},this.getClearAlpha=function(){return C.getClearAlpha()},this.setClearAlpha=function(){C.setClearAlpha(...arguments)},this.clear=function(b=!0,L=!0,W=!0){let F=0;if(b){let k=!1;if(Q!==null){let ft=Q.texture.format;k=g.has(ft)}if(k){let ft=Q.texture.type,St=p.has(ft),ut=C.getClearColor(),bt=C.getClearAlpha(),Rt=ut.r,Gt=ut.g,jt=ut.b;St?(v[0]=Rt,v[1]=Gt,v[2]=jt,v[3]=bt,U.clearBufferuiv(U.COLOR,0,v)):(w[0]=Rt,w[1]=Gt,w[2]=jt,w[3]=bt,U.clearBufferiv(U.COLOR,0,w))}else F|=U.COLOR_BUFFER_BIT}L&&(F|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(F|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F!==0&&U.clear(F)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),O=b},this.dispose=function(){e.removeEventListener("webglcontextlost",Pt,!1),e.removeEventListener("webglcontextrestored",Xt,!1),e.removeEventListener("webglcontextcreationerror",_t,!1),C.dispose(),dt.dispose(),Y.dispose(),zt.dispose(),Dt.dispose(),A.dispose(),st.dispose(),B.dispose(),lt.dispose(),Ct.dispose(),tt.dispose(),rt.dispose(),rt.removeEventListener("sessionstart",fh),rt.removeEventListener("sessionend",ph),Bi.stop()};function Pt(b){b.preventDefault(),Rc("WebGLRenderer: Context Lost."),D=!0}function Xt(){Rc("WebGLRenderer: Context Restored."),D=!1;let b=we.autoReset,L=ct.enabled,W=ct.autoUpdate,F=ct.needsUpdate,k=ct.type;$t(),we.autoReset=b,ct.enabled=L,ct.autoUpdate=W,ct.needsUpdate=F,ct.type=k}function _t(b){Bt("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function ae(b){let L=b.target;L.removeEventListener("dispose",ae),Pe(L)}function Pe(b){_i(b),Dt.remove(b)}function _i(b){let L=Dt.get(b).programs;L!==void 0&&(L.forEach(function(W){tt.releaseProgram(W)}),b.isShaderMaterial&&tt.releaseShaderCache(b))}this.renderBufferDirect=function(b,L,W,F,k,ft){L===null&&(L=fn);let St=k.isMesh&&k.matrixWorld.determinantAffine()<0,ut=uf(b,L,W,F,k);mt.setMaterial(F,St);let bt=W.index,Rt=1;if(F.wireframe===!0){if(bt=B.getWireframeAttribute(W),bt===void 0)return;Rt=2}let Gt=W.drawRange,jt=W.attributes.position,wt=Gt.start*Rt,Kt=(Gt.start+Gt.count)*Rt;ft!==null&&(wt=Math.max(wt,ft.start*Rt),Kt=Math.min(Kt,(ft.start+ft.count)*Rt)),bt!==null?(wt=Math.max(wt,0),Kt=Math.min(Kt,bt.count)):jt!=null&&(wt=Math.max(wt,0),Kt=Math.min(Kt,jt.count));let be=Kt-wt;if(be<0||be===1/0)return;lt.setup(k,F,ut,W,bt);let he,ce=$;if(bt!==null&&(he=y.get(bt),ce=ht,ce.setIndex(he)),k.isMesh)F.wireframe===!0?(mt.setLineWidth(F.wireframeLinewidth*mn()),ce.setMode(U.LINES)):ce.setMode(U.TRIANGLES);else if(k.isLine){let He=F.linewidth;He===void 0&&(He=1),mt.setLineWidth(He*mn()),k.isLineSegments?ce.setMode(U.LINES):k.isLineLoop?ce.setMode(U.LINE_LOOP):ce.setMode(U.LINE_STRIP)}else k.isPoints?ce.setMode(U.POINTS):k.isSprite&&ce.setMode(U.TRIANGLES);if(k.isBatchedMesh)if(pe.get("WEBGL_multi_draw"))ce.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let He=k._multiDrawStarts,Et=k._multiDrawCounts,Ye=k._multiDrawCount,ne=bt?y.get(bt).bytesPerElement:1,ki=Dt.get(F).currentProgram.getUniforms();for(let Ge=0;Ge<Ye;Ge++)ki.setValue(U,"_gl_DrawID",Ge),ce.render(He[Ge]/ne,Et[Ge])}else if(k.isInstancedMesh)ce.renderInstances(wt,be,k.count);else if(W.isInstancedBufferGeometry){let He=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Et=Math.min(W.instanceCount,He);ce.renderInstances(wt,be,Et)}else ce.render(wt,be)};function dh(b,L,W,F){O!==null&&b.isNodeMaterial&&O.setObject(F,b),Me===!0&&Z.setState(b,W,!1),b.transparent===!0&&b.side===Ne&&b.forceSinglePass===!1?(b.side=ke,b.needsUpdate=!0,js(b,L,F),b.side=Ui,b.needsUpdate=!0,js(b,L,F),b.side=Ne):js(b,L,F)}this.compile=function(b,L,W=null){W===null&&(W=b),O!==null&&O.renderStart(b,L,W),E=Y.get(W),E.init(L),M.push(E),W.traverseVisible(function(k){k.isLight&&k.layers.test(L.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),b!==W&&b.traverseVisible(function(k){k.isLight&&k.layers.test(L.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),E.setupLights(),O!==null&&O.updateLights(E.state.lightsArray),Qe=this.localClippingEnabled,Me=Z.init(this.clippingPlanes,Qe),Me===!0&&Z.setGlobalState(this.clippingPlanes,L),O!==null&&ct.render(E.state.shadowsArray,W,L);let F=new Set;return b.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let ft=k.material;if(ft)if(Array.isArray(ft))for(let St=0;St<ft.length;St++){let ut=ft[St];dh(ut,W,L,k),F.add(ut)}else dh(ft,W,L,k),F.add(ft)}),E=M.pop(),O!==null&&O.renderEnd(),F},this.compileAsync=function(b,L,W=null){let F=this.compile(b,L,W);return new Promise(k=>{function ft(){if(F.forEach(function(St){let bt=Dt.get(St).currentProgram;(bt===void 0||bt.isReady())&&F.delete(St)}),F.size===0){k(b);return}setTimeout(ft,10)}pe.get("KHR_parallel_shader_compile")!==null?ft():setTimeout(ft,10)})};let Ml=null;function cf(b){Ml&&Ml(b)}function fh(){Bi.stop()}function ph(){Bi.start()}let Bi=new pd;Bi.setAnimationLoop(cf),typeof self<"u"&&Bi.setContext(self),this.setAnimationLoop=function(b){Ml=b,rt.setAnimationLoop(b),b===null?Bi.stop():Bi.start()},rt.addEventListener("sessionstart",fh),rt.addEventListener("sessionend",ph),this.render=function(b,L){if(L!==void 0&&L.isCamera!==!0){Bt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;O!==null&&O.renderStart(b,L);let W=rt.enabled===!0&&rt.isPresenting===!0,F=N!==null&&(Q===null||W)&&N.begin(P,Q);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),rt.enabled===!0&&rt.isPresenting===!0&&(N===null||N.isCompositing()===!1)&&(rt.cameraAutoUpdate===!0&&rt.updateCamera(L),L=rt.getCamera()),b.isScene===!0&&b.onBeforeRender(P,b,L,Q),E=Y.get(b,M.length),E.init(L),E.state.textureUnits=zt.getTextureUnits(),M.push(E),_e.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),L.isArrayCamera?Ue.setFromArrayCamera(L):Jt.setFromProjectionMatrix(_e,yn,L.reversedDepth),Qe=this.localClippingEnabled,Me=Z.init(this.clippingPlanes,Qe),T=dt.get(b,_.length),T.init(),_.push(T),this.info.render.frame++,rt.enabled===!0&&rt.isPresenting===!0){let St=P.xr.getDepthSensingMesh();St!==null&&wl(St,L,-1/0,P.sortObjects)}wl(b,L,0,P.sortObjects),T.finish(),O!==null&&O.updateLights(E.state.lightsArray),P.sortObjects===!0&&T.sort(Vt,ve),pn=rt.enabled===!1||rt.isPresenting===!1||rt.hasDepthSensing()===!1,pn&&C.addToRenderList(T,b),this.info.autoReset===!0&&this.info.reset(),Me===!0&&Z.beginShadows();let k=E.state.shadowsArray;if(ct.render(k,b,L),Me===!0&&Z.endShadows(),(F&&N.hasRenderPass())===!1){let St=T.opaque,ut=T.transmissive;if(E.setupLights(),L.isArrayCamera){let bt=L.cameras;if(ut.length>0)for(let Rt=0,Gt=bt.length;Rt<Gt;Rt++){let jt=bt[Rt];gh(St,ut,b,jt)}pn&&C.render(b);for(let Rt=0,Gt=bt.length;Rt<Gt;Rt++){let jt=bt[Rt];mh(T,b,jt,jt.viewport)}}else ut.length>0&&gh(St,ut,b,L),pn&&C.render(b),mh(T,b,L)}Q!==null&&H===0&&(zt.updateMultisampleRenderTarget(Q),zt.updateRenderTargetMipmap(Q)),F&&N.end(P),b.isScene===!0&&b.onAfterRender(P,b,L),lt.resetDefaultState(),G=-1,nt=null,M.pop(),M.length>0?(E=M[M.length-1],zt.setTextureUnits(E.state.textureUnits),Me===!0&&Z.setGlobalState(P.clippingPlanes,E.state.camera)):E=null,_.pop(),_.length>0?T=_[_.length-1]:T=null,O!==null&&O.renderEnd()};function wl(b,L,W,F){if(b.visible===!1)return;if(b.layers.test(L.layers)){if(b.isGroup)W=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(L);else if(b.isLight)E.pushLight(b),b.castShadow&&E.pushShadow(b);else if(b.isSprite){let St=L.isArrayCamera?Ue:Jt;if(!b.frustumCulled||b.intersectsFrustum(St)){F&&Ce.setFromMatrixPosition(b.matrixWorld).applyMatrix4(_e);let ut=st.update(b),bt=b.material;bt.visible&&T.push(b,ut,bt,W,Ce.z,null,L)}}else if(b.isMesh||b.isLine||b.isPoints){let St=L.isArrayCamera?Ue:Jt;if(!b.frustumCulled||b.intersectsFrustum(St)){let ut=st.update(b),bt=b.material;if(F&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Ce.copy(b.boundingSphere.center)):(ut.boundingSphere===null&&ut.computeBoundingSphere(),Ce.copy(ut.boundingSphere.center)),Ce.applyMatrix4(b.matrixWorld).applyMatrix4(_e)),Array.isArray(bt)){let Rt=ut.groups;for(let Gt=0,jt=Rt.length;Gt<jt;Gt++){let wt=Rt[Gt],Kt=bt[wt.materialIndex];Kt&&Kt.visible&&T.push(b,ut,Kt,W,Ce.z,wt,L)}}else bt.visible&&T.push(b,ut,bt,W,Ce.z,null,L)}}}let ft=b.children;for(let St=0,ut=ft.length;St<ut;St++)wl(ft[St],L,W,F)}function mh(b,L,W,F){let{opaque:k,transmissive:ft,transparent:St}=b;E.setupLightsView(W),Me===!0&&Z.setGlobalState(P.clippingPlanes,W),F&&mt.viewport(it.copy(F)),k.length>0&&ra(k,L,W),ft.length>0&&ra(ft,L,W),St.length>0&&ra(St,L,W),mt.buffers.depth.setTest(!0),mt.buffers.depth.setMask(!0),mt.buffers.color.setMask(!0),mt.setPolygonOffset(!1)}function gh(b,L,W,F){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[F.id]===void 0){let wt=pe.has("EXT_color_buffer_half_float")||pe.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[F.id]=new cn(1,1,{generateMipmaps:!0,type:wt?Bn:tn,minFilter:hi,samples:Math.max(4,me.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Qt.workingColorSpace})}let ft=E.state.transmissionRenderTarget[F.id],St=F.viewport||it;ft.setSize(St.z*P.transmissionResolutionScale,St.w*P.transmissionResolutionScale);let ut=P.getRenderTarget(),bt=P.getActiveCubeFace(),Rt=P.getActiveMipmapLevel();P.setRenderTarget(ft),P.getClearColor(J),yt=P.getClearAlpha(),yt<1&&P.setClearColor(16777215,.5),P.clear(),pn&&C.render(W);let Gt=P.toneMapping;P.toneMapping=Jn;let jt=F.viewport;if(F.viewport!==void 0&&(F.viewport=void 0),E.setupLightsView(F),Me===!0&&Z.setGlobalState(P.clippingPlanes,F),ra(b,W,F),zt.updateMultisampleRenderTarget(ft),zt.updateRenderTargetMipmap(ft),pe.has("WEBGL_multisampled_render_to_texture")===!1){let wt=!1;for(let Kt=0,be=L.length;Kt<be;Kt++){let he=L[Kt],{object:ce,geometry:He,material:Et,group:Ye}=he;if(Et.side===Ne&&ce.layers.test(F.layers)){let ne=Et.side;Et.side=ke,Et.needsUpdate=!0,_h(ce,W,F,He,Et,Ye),Et.side=ne,Et.needsUpdate=!0,wt=!0}}wt===!0&&(zt.updateMultisampleRenderTarget(ft),zt.updateRenderTargetMipmap(ft))}P.setRenderTarget(ut,bt,Rt),P.setClearColor(J,yt),jt!==void 0&&(F.viewport=jt),P.toneMapping=Gt}function ra(b,L,W){let F=L.isScene===!0?L.overrideMaterial:null;for(let k=0,ft=b.length;k<ft;k++){let St=b[k],{object:ut,geometry:bt,group:Rt}=St,Gt=St.material;Gt.allowOverride===!0&&F!==null&&(Gt=F),ut.layers.test(W.layers)&&_h(ut,L,W,bt,Gt,Rt)}}function _h(b,L,W,F,k,ft){O!==null&&k.isNodeMaterial&&O.setObject(b,k),b.onBeforeRender(P,L,W,F,k,ft),b.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),k.onBeforeRender(P,L,W,F,b,ft),k.transparent===!0&&k.side===Ne&&k.forceSinglePass===!1?(k.side=ke,k.needsUpdate=!0,P.renderBufferDirect(W,L,F,k,b,ft),k.side=Ui,k.needsUpdate=!0,P.renderBufferDirect(W,L,F,k,b,ft),k.side=Ne):P.renderBufferDirect(W,L,F,k,b,ft),b.onAfterRender(P,L,W,F,k,ft)}function xh(b){let L=0;for(let W of b)W.texture!==null&&L++;return L}function js(b,L,W){L.isScene!==!0&&(L=fn);let F=Dt.get(b),k=E.state.lights,ft=E.state.shadowsArray,St=k.state.version,ut=tt.getParameters(b,k.state,ft,L,W,E.state.lightProbeGridArray),bt=tt.getProgramCacheKey(ut),Rt=F.programs;F.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?L.environment:null,F.fog=L.fog;let Gt=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;F.envMap=A.get(b.envMap||F.environment,Gt),F.envMapRotation=F.environment!==null&&b.envMap===null?L.environmentRotation:b.envMapRotation,Rt===void 0&&(b.addEventListener("dispose",ae),Rt=new Map,F.programs=Rt,F.programVariants=new Map);let jt=Rt.get(bt);if(jt!==void 0){if(F.currentProgram===jt&&F.lightsStateVersion===St)return vh(b,ut),jt}else ut.uniforms=tt.getUniforms(b),O!==null&&b.isNodeMaterial&&O.build(b,W,ut),b.onBeforeCompile(ut,P),jt=tt.acquireProgram(ut,bt),Rt.set(bt,jt),F.uniforms=ut.uniforms;let wt=F.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(wt.clippingPlanes=Z.uniform),vh(b,ut),F.needsLights=ff(b),F.lightsStateVersion=St,F.needsLights&&(wt.ambientLightColor.value=k.state.ambient,wt.lightProbe.value=k.state.probe,wt.sunLights.value=k.state.sun,wt.sunLightShadows.value=k.state.sunShadow,wt.directionalLights.value=k.state.directional,wt.directionalLightShadows.value=k.state.directionalShadow,wt.spotLights.value=k.state.spot,wt.spotLightShadows.value=k.state.spotShadow,wt.rectAreaLights.value=k.state.rectArea,wt.ltc_1.value=k.state.rectAreaLTC1,wt.ltc_2.value=k.state.rectAreaLTC2,wt.pointLights.value=k.state.point,wt.pointLightShadows.value=k.state.pointShadow,wt.hemisphereLights.value=k.state.hemi,wt.sunShadowMatrix.value=k.state.sunShadowMatrix,wt.sunShadowCascade.value=k.state.sunShadowCascade,wt.directionalShadowMatrix.value=k.state.directionalShadowMatrix,wt.spotLightMatrix.value=k.state.spotLightMatrix,wt.spotLightMap.value=k.state.spotLightMap,wt.pointShadowMatrix.value=k.state.pointShadowMatrix),F.numLightProbeGrids=xh(E.state.lightProbeGridArray),F.currentProgram=jt,F.uniformsList=null,jt}function hf(b,L,W,F,k){let ft=Dt.get(b),St=ft.currentProgram.id+","+F+","+k,ut=ft.programVariants.get(St);return ut===void 0?(ut=js(b,L,W),ft.programVariants.set(St,ut)):(ft.currentProgram=ut,ft.uniformsList=null,ft.outputColorSpace=F,ft.toneMapping=k),ut}function yh(b){if(b.uniformsList===null){let L=b.currentProgram.getUniforms();b.uniformsList=Gs.seqWithValue(L.seq,b.uniforms)}return b.uniformsList}function vh(b,L){let W=Dt.get(b);W.outputColorSpace=L.outputColorSpace,W.batching=L.batching,W.batchingColor=L.batchingColor,W.instancing=L.instancing,W.instancingColor=L.instancingColor,W.instancingMorph=L.instancingMorph,W.skinning=L.skinning,W.morphTargets=L.morphTargets,W.morphNormals=L.morphNormals,W.morphColors=L.morphColors,W.morphTargetsCount=L.morphTargetsCount,W.numClippingPlanes=L.numClippingPlanes,W.numIntersection=L.numClipIntersection,W.vertexAlphas=L.vertexAlphas,W.vertexTangents=L.vertexTangents,W.toneMapping=L.toneMapping}function uf(b,L,W,F,k){L.isScene!==!0&&(L=fn),zt.resetTextureUnits();let ft=L.fog,St=F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial?L.environment:null,ut=Q===null?P.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Qt.workingColorSpace,bt=F.isMeshStandardMaterial||F.isMeshLambertMaterial&&!F.envMap||F.isMeshPhongMaterial&&!F.envMap,Rt=A.get(F.envMap||St,bt),Gt=F.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,jt=!!W.attributes.tangent&&(!!F.normalMap||F.anisotropy>0),wt=!!W.morphAttributes.position,Kt=!!W.morphAttributes.normal,be=!!W.morphAttributes.color,he=Jn;F.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(he=P.toneMapping);let ce=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,He=ce!==void 0?ce.length:0,Et=Dt.get(F),Ye=E.state.lights;if(Me===!0&&(Qe===!0||b!==nt)){let xe=b===nt&&F.id===G;Z.setState(F,b,xe)}let ne=!1,ki=!1;F.version===Et.__version?Et.needsLights&&Et.lightsStateVersion!==Ye.state.version||k.isBatchedMesh&&Et.batching===!1||!k.isBatchedMesh&&Et.batching===!0||k.isBatchedMesh&&Et.batchingColor===!0&&k._colorsTexture===null||k.isBatchedMesh&&Et.batchingColor===!1&&k._colorsTexture!==null||k.isInstancedMesh&&Et.instancing===!1||!k.isInstancedMesh&&Et.instancing===!0||k.isSkinnedMesh&&Et.skinning===!1||!k.isSkinnedMesh&&Et.skinning===!0||k.isInstancedMesh&&Et.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&Et.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&Et.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&Et.instancingMorph===!1&&k.morphTexture!==null||Et.envMap!==Rt||F.fog===!0&&Et.fog!==ft||Et.numClippingPlanes!==void 0&&(Et.numClippingPlanes!==Z.numPlanes||Et.numIntersection!==Z.numIntersection)||Et.vertexAlphas!==Gt||Et.vertexTangents!==jt||Et.morphTargets!==wt||Et.morphNormals!==Kt||Et.morphColors!==be||Et.morphTargetsCount!==He||Et.numLightProbeGrids!==xh(E.state.lightProbeGridArray)?ne=!0:(Et.outputColorSpace!==ut||Et.toneMapping!==he)&&(ki=!0):(ne=!0,Et.__version=F.version);let Ge=Et.currentProgram;(ne===!0||ki===!0)&&(Ge=ki===!0?hf(F,L,k,ut,he):js(F,L,k),O&&F.isNodeMaterial&&O.onUpdateProgram(F,Ge,Et));let aa=!1,xi=!1,zi=!1,te=Ge.getUniforms(),Oe=Et.uniforms;if(mt.useProgram(Ge.program)&&(aa=!0,xi=!0,zi=!0),F.id!==G&&(G=F.id,xi=!0),aa||nt!==b){mt.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),te.setValue(U,"projectionMatrix",b.projectionMatrix),te.setValue(U,"viewMatrix",b.matrixWorldInverse);let Ie=te.map.cameraPosition;Ie!==void 0&&Ie.setValue(U,Vn.setFromMatrixPosition(b.matrixWorld)),me.logarithmicDepthBuffer&&te.setValue(U,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(F.isMeshPhongMaterial||F.isMeshToonMaterial||F.isMeshLambertMaterial||F.isMeshBasicMaterial||F.isMeshStandardMaterial||F.isShaderMaterial)&&te.setValue(U,"isOrthographic",b.isOrthographicCamera===!0),nt!==b&&(nt=b,xi=!0,zi=!0)}if(Et.needsLights&&(Ye.state.sunShadowMap.length>0&&te.setValue(U,"sunShadowMap",Ye.state.sunShadowMap,zt),Ye.state.directionalShadowMap.length>0&&te.setValue(U,"directionalShadowMap",Ye.state.directionalShadowMap,zt),Ye.state.spotShadowMap.length>0&&te.setValue(U,"spotShadowMap",Ye.state.spotShadowMap,zt),Ye.state.pointShadowMap.length>0&&te.setValue(U,"pointShadowMap",Ye.state.pointShadowMap,zt)),k.isSkinnedMesh){te.setOptional(U,k,"bindMatrix"),te.setOptional(U,k,"bindMatrixInverse");let xe=k.skeleton;xe&&(xe.boneTexture===null&&xe.computeBoneTexture(),te.setValue(U,"boneTexture",xe.boneTexture,zt))}k.isBatchedMesh&&(te.setOptional(U,k,"batchingTexture"),te.setValue(U,"batchingTexture",k._matricesTexture,zt),te.setOptional(U,k,"batchingIdTexture"),te.setValue(U,"batchingIdTexture",k._indirectTexture,zt),te.setOptional(U,k,"batchingColorTexture"),k._colorsTexture!==null&&te.setValue(U,"batchingColorTexture",k._colorsTexture,zt));let Cn=W.morphAttributes;if((Cn.position!==void 0||Cn.normal!==void 0||Cn.color!==void 0)&&j.update(k,W,Ge),(xi||Et.receiveShadow!==k.receiveShadow)&&(Et.receiveShadow=k.receiveShadow,te.setValue(U,"receiveShadow",k.receiveShadow)),(F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial)&&F.envMap===null&&L.environment!==null&&(Oe.envMapIntensity.value=L.environmentIntensity),Oe.dfgLUT!==void 0&&(Oe.dfgLUT.value=ix()),xi){if(te.setValue(U,"toneMappingExposure",P.toneMappingExposure),Et.needsLights&&df(Oe,zi),ft&&F.fog===!0&&ot.refreshFogUniforms(Oe,ft),ot.refreshMaterialUniforms(Oe,F,vt,Lt,E.state.transmissionRenderTarget[b.id]),Et.needsLights&&Et.numLightProbeGrids>0){let xe=S,Ie=0;for(let Qn of E.state.lightProbeGridArray)Qn.texture!==null&&(xe.textures[Ie]=Qn.texture,xe.min[Ie]=Qn.boundingBox.min,xe.max[Ie]=Qn.boundingBox.max,xe.resolution[Ie]=Qn.resolution,Ie++);for(let Qn in xe)xe[Qn].length=Ie;Oe.probesSH.value=xe.textures,Oe.probesMin.value=xe.min,Oe.probesMax.value=xe.max,Oe.probesResolution.value=xe.resolution}Gs.upload(U,yh(Et),Oe,zt)}if(F.isShaderMaterial&&F.uniformsNeedUpdate===!0&&(Gs.upload(U,yh(Et),Oe,zt),F.uniformsNeedUpdate=!1),F.isSpriteMaterial&&te.setValue(U,"center",k.center),te.setValue(U,"modelViewMatrix",k.modelViewMatrix),te.setValue(U,"normalMatrix",k.normalMatrix),te.setValue(U,"modelMatrix",k.matrixWorld),F.uniformsGroups!==void 0){let xe=F.uniformsGroups;for(let Ie=0,Qn=xe.length;Ie<Qn;Ie++){let Sh=xe[Ie];Ct.update(Sh,Ge),Ct.bind(Sh,Ge)}}return Ge}function df(b,L){b.ambientLightColor.needsUpdate=L,b.lightProbe.needsUpdate=L,b.sunLights.needsUpdate=L,b.sunLightShadows.needsUpdate=L,b.directionalLights.needsUpdate=L,b.directionalLightShadows.needsUpdate=L,b.pointLights.needsUpdate=L,b.pointLightShadows.needsUpdate=L,b.spotLights.needsUpdate=L,b.spotLightShadows.needsUpdate=L,b.rectAreaLights.needsUpdate=L,b.hemisphereLights.needsUpdate=L}function ff(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return q},this.getActiveMipmapLevel=function(){return H},this.getRenderTarget=function(){return Q},this.setRenderTargetTextures=function(b,L,W){let F=Dt.get(b);F.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,F.__autoAllocateDepthBuffer===!1&&(F.__useRenderToTexture=!1),Dt.get(b.texture).__webglTexture=L,Dt.get(b.depthTexture).__webglTexture=F.__autoAllocateDepthBuffer?void 0:W,F.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,L){let W=Dt.get(b);W.__webglFramebuffer=L,W.__useDefaultFramebuffer=L===void 0},this.setRenderTarget=function(b,L=0,W=0){Q=b,q=L,H=W;let F=null,k=!1,ft=!1;if(b){let ut=Dt.get(b);if(ut.__useDefaultFramebuffer!==void 0){mt.bindFramebuffer(U.FRAMEBUFFER,ut.__webglFramebuffer),it.copy(b.viewport),At.copy(b.scissor),Ht=b.scissorTest,mt.viewport(it),mt.scissor(At),mt.setScissorTest(Ht),G=-1;return}else if(ut.__webglFramebuffer===void 0)zt.setupRenderTarget(b);else if(ut.__hasExternalTextures)zt.rebindTextures(b,Dt.get(b.texture).__webglTexture,Dt.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let Gt=b.depthTexture;if(ut.__boundDepthTexture!==Gt){if(Gt!==null&&Dt.has(Gt)&&(b.width!==Gt.image.width||b.height!==Gt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");zt.setupDepthRenderbuffer(b)}}let bt=b.texture;(bt.isData3DTexture||bt.isDataArrayTexture||bt.isCompressedArrayTexture)&&(ft=!0);let Rt=Dt.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Rt[L])?F=Rt[L][W]:F=Rt[L],k=!0):b.samples>0&&zt.useMultisampledRTT(b)===!1?F=Dt.get(b).__webglMultisampledFramebuffer:Array.isArray(Rt)?F=Rt[W]:F=Rt,it.copy(b.viewport),At.copy(b.scissor),Ht=b.scissorTest}else it.copy(Ot).multiplyScalar(vt).floor(),At.copy(re).multiplyScalar(vt).floor(),Ht=le;if(W!==0&&(F=V),mt.bindFramebuffer(U.FRAMEBUFFER,F)&&mt.drawBuffers(b,F),mt.viewport(it),mt.scissor(At),mt.setScissorTest(Ht),k){let ut=Dt.get(b.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+L,ut.__webglTexture,W)}else if(ft){let ut=L;for(let bt=0;bt<b.textures.length;bt++){let Rt=Dt.get(b.textures[bt]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+bt,Rt.__webglTexture,W,ut)}}else if(b!==null&&W!==0){let ut=Dt.get(b.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,ut.__webglTexture,W)}G=-1};function bh(b){let L=Dt.get(b);return(L.__readFormat!==b.format||L.__readType!==b.type)&&(L.__readFormat=b.format,L.__readType=b.type,L.__formatReadable=me.textureFormatReadable(b.format),L.__typeReadable=me.textureTypeReadable(b.type)),L}this.readRenderTargetPixels=function(b,L,W,F,k,ft,St,ut=0){if(!(b&&b.isWebGLRenderTarget)){Bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=Dt.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&St!==void 0&&(bt=bt[St],Array.isArray(bt)&&(bt=bt[0])),bt){mt.bindFramebuffer(U.FRAMEBUFFER,bt);try{let Rt=b.textures[ut],Gt=Rt.format,jt=Rt.type;b.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ut);let wt=bh(Rt);if(wt.__formatReadable===!1){Bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(wt.__typeReadable===!1){Bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=b.width-F&&W>=0&&W<=b.height-k&&U.readPixels(L,W,F,k,at.convert(Gt),at.convert(jt),ft)}finally{let Rt=Q!==null?Dt.get(Q).__webglFramebuffer:null;mt.bindFramebuffer(U.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(b,L,W,F,k,ft,St,ut=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=Dt.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&St!==void 0&&(bt=bt[St],Array.isArray(bt)&&(bt=bt[0])),bt)if(L>=0&&L<=b.width-F&&W>=0&&W<=b.height-k){mt.bindFramebuffer(U.FRAMEBUFFER,bt);let Rt=b.textures[ut],Gt=Rt.format,jt=Rt.type;b.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ut);let wt=bh(Rt);if(wt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(wt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Kt=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Kt),U.bufferData(U.PIXEL_PACK_BUFFER,ft.byteLength,U.STREAM_READ),U.readPixels(L,W,F,k,at.convert(Gt),at.convert(jt),0),U.bindBuffer(U.PIXEL_PACK_BUFFER,null);let be=Q!==null?Dt.get(Q).__webglFramebuffer:null;mt.bindFramebuffer(U.FRAMEBUFFER,be);let he=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await ku(U,he,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Kt),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,ft),U.bindBuffer(U.PIXEL_PACK_BUFFER,null),U.deleteBuffer(Kt),U.deleteSync(he),ft}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,L=null,W=0){let F=Math.pow(2,-W),k=Math.floor(b.image.width*F),ft=Math.floor(b.image.height*F),St=L!==null?L.x:0,ut=L!==null?L.y:0;zt.setTexture2D(b,0),U.copyTexSubImage2D(U.TEXTURE_2D,W,0,0,St,ut,k,ft),mt.unbindTexture()},this.copyTextureToTexture=function(b,L,W=null,F=null,k=0,ft=0){let St,ut,bt,Rt,Gt,jt,wt,Kt,be,he=b.isCompressedTexture?b.mipmaps[ft]:b.image;if(W!==null)St=W.max.x-W.min.x,ut=W.max.y-W.min.y,bt=W.isBox3?W.max.z-W.min.z:1,Rt=W.min.x,Gt=W.min.y,jt=W.isBox3?W.min.z:0;else{let te=Math.pow(2,-k);St=Math.floor(he.width*te),ut=Math.floor(he.height*te),b.isDataArrayTexture?bt=he.depth:b.isData3DTexture?bt=Math.floor(he.depth*te):bt=1,Rt=0,Gt=0,jt=0}F!==null?(wt=F.x,Kt=F.y,be=F.z):(wt=0,Kt=0,be=0);let ce=at.convert(L.format),He=at.convert(L.type),Et;L.isData3DTexture?(zt.setTexture3D(L,0),Et=U.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(zt.setTexture2DArray(L,0),Et=U.TEXTURE_2D_ARRAY):(zt.setTexture2D(L,0),Et=U.TEXTURE_2D),mt.activeTexture(U.TEXTURE0),mt.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,L.flipY),mt.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),mt.pixelStorei(U.UNPACK_ALIGNMENT,L.unpackAlignment);let Ye=mt.getParameter(U.UNPACK_ROW_LENGTH),ne=mt.getParameter(U.UNPACK_IMAGE_HEIGHT),ki=mt.getParameter(U.UNPACK_SKIP_PIXELS),Ge=mt.getParameter(U.UNPACK_SKIP_ROWS),aa=mt.getParameter(U.UNPACK_SKIP_IMAGES);mt.pixelStorei(U.UNPACK_ROW_LENGTH,he.width),mt.pixelStorei(U.UNPACK_IMAGE_HEIGHT,he.height),mt.pixelStorei(U.UNPACK_SKIP_PIXELS,Rt),mt.pixelStorei(U.UNPACK_SKIP_ROWS,Gt),mt.pixelStorei(U.UNPACK_SKIP_IMAGES,jt);let xi=b.isDataArrayTexture||b.isData3DTexture,zi=L.isDataArrayTexture||L.isData3DTexture;if(b.isDepthTexture){let te=Dt.get(b),Oe=Dt.get(L),Cn=Dt.get(te.__renderTarget),xe=Dt.get(Oe.__renderTarget);mt.bindFramebuffer(U.READ_FRAMEBUFFER,Cn.__webglFramebuffer),mt.bindFramebuffer(U.DRAW_FRAMEBUFFER,xe.__webglFramebuffer);for(let Ie=0;Ie<bt;Ie++)xi&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Dt.get(b).__webglTexture,k,jt+Ie),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Dt.get(L).__webglTexture,ft,be+Ie)),U.blitFramebuffer(Rt,Gt,Rt+St,Gt+ut,wt,Kt,wt+St,Kt+ut,U.DEPTH_BUFFER_BIT,U.NEAREST);mt.bindFramebuffer(U.READ_FRAMEBUFFER,null),mt.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(k!==0||b.isRenderTargetTexture||Dt.has(b)){let te=Dt.get(b),Oe=Dt.get(L);mt.bindFramebuffer(U.READ_FRAMEBUFFER,I),mt.bindFramebuffer(U.DRAW_FRAMEBUFFER,X);for(let Cn=0;Cn<bt;Cn++)xi?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,te.__webglTexture,k,jt+Cn):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,te.__webglTexture,k),zi?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Oe.__webglTexture,ft,be+Cn):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Oe.__webglTexture,ft),k!==0?U.blitFramebuffer(Rt,Gt,Rt+St,Gt+ut,wt,Kt,wt+St,Kt+ut,U.COLOR_BUFFER_BIT,U.NEAREST):zi?U.copyTexSubImage3D(Et,ft,wt,Kt,be+Cn,Rt,Gt,St,ut):U.copyTexSubImage2D(Et,ft,wt,Kt,Rt,Gt,St,ut);mt.bindFramebuffer(U.READ_FRAMEBUFFER,null),mt.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else zi?b.isDataTexture||b.isData3DTexture?U.texSubImage3D(Et,ft,wt,Kt,be,St,ut,bt,ce,He,he.data):L.isCompressedArrayTexture?U.compressedTexSubImage3D(Et,ft,wt,Kt,be,St,ut,bt,ce,he.data):U.texSubImage3D(Et,ft,wt,Kt,be,St,ut,bt,ce,He,he):b.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,ft,wt,Kt,St,ut,ce,He,he.data):b.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,ft,wt,Kt,he.width,he.height,ce,he.data):U.texSubImage2D(U.TEXTURE_2D,ft,wt,Kt,St,ut,ce,He,he);mt.pixelStorei(U.UNPACK_ROW_LENGTH,Ye),mt.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ne),mt.pixelStorei(U.UNPACK_SKIP_PIXELS,ki),mt.pixelStorei(U.UNPACK_SKIP_ROWS,Ge),mt.pixelStorei(U.UNPACK_SKIP_IMAGES,aa),ft===0&&L.generateMipmaps===!0&&L.mipmapsAutoUpdate===!0&&U.generateMipmap(Et),mt.unbindTexture()},this.initRenderTarget=function(b){Dt.get(b).__webglFramebuffer===void 0&&zt.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?zt.setTextureCube(b,0):b.isData3DTexture?zt.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?zt.setTexture2DArray(b,0):zt.setTexture2D(b,0),mt.unbindTexture()},this.resetState=function(){q=0,H=0,Q=null,mt.reset(),lt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return yn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=Qt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Qt._getUnpackColorSpace()}};var Fi=[128,64,32,16,8,4,2,1],Qc=32767,sx=1e3,th=["none","bad_crc","foreign_address","sensor_fault"],$s=3,rx=8;function Ed(i){let t=65535;for(let e of i){t^=e;for(let n=0;n<8;n++)t=t&1?t>>>1^40961:t>>>1}return t}var Xs=i=>{let t=Ed(i);return[...i,t&255,t>>>8]},Td=i=>i.length>=4&&Ed(i.slice(0,-2))===(i[i.length-2]|i[i.length-1]<<8),ll=i=>i?i.map(t=>t.toString(16).toUpperCase().padStart(2,"0")).join(" "):null,ax=i=>i?i.split(" ").map(t=>parseInt(t,16)):null;function Jr(i){if(i.length!==8||i.some(t=>t!==0&&t!==1))throw new Error("DIP state must be 8 values of 0 or 1.");return i.reduce((t,e,n)=>t+(e?Fi[n]:0),0)}var en=i=>Fi.map(t=>i&t?1:0);function Ad(i,t=0,e=2){if(i<1||i>247)throw new Error("Master polling address must be 1..247.");return Xs([i,$s,t>>8,t&255,e>>8,e&255])}var wn=class{constructor(t,e=23.4,n=57.8){this.dipBits=[...t],this.temperatureC=e,this.humidityRh=n,this.baud=9600,this.elementFault=!1}get address(){return Jr(this.dipBits)}registers(){let t=this.elementFault?Qc:Math.round(this.temperatureC*10)&65535,e=this.elementFault?Qc:Math.round(this.humidityRh*10);return[t,e,0,0,this.address,this.baud,1536,10]}transact(t){if(t.length<4||!Td(t))return null;let[e,n]=t;if(e===0||e!==this.address)return null;if(n!==$s)return Xs([e,n|128,1]);if(t.length!==8)return Xs([e,131,3]);let s=t[2]<<8|t[3],r=t[4]<<8|t[5];if(r<1||s+r>rx)return Xs([e,131,2]);let a=this.registers().slice(s,s+r).flatMap(o=>[o>>8&255,o&255]);return Xs([e,$s,a.length,...a])}};function ox(i,t,e=0,n=2){let s=[],r=(m,x,g)=>(s.push({check:m,ok:!!x,detail:g}),x),a={status:"invalid",valid:!1,checks:s,values:null,exception:null},o=m=>"0x"+m.toString(16).toUpperCase().padStart(2,"0");if(i===null)return r("response",!1,`No reply within ${sx} ms`),a.status="timeout",a;if(!r("length",i.length>=5,`${i.length} bytes`))return a;let l=Td(i);if(!r("crc",l,"CRC-16/MODBUS "+(l?"matches":"mismatch"))||!r("address",i[0]===t,`${o(i[0])} (expected ${o(t)})`))return a;if(i[1]===($s|128))return r("function",!1,`Exception ${o(i[2])}`),Object.assign(a,{status:"exception",exception:i[2]});if(!r("function",i[1]===$s,o(i[1])))return a;let c=2*n;if(!r("byte_count",i[2]===c&&i.length===5+c,`${i[2]} data bytes (expected ${c})`))return a;let h={};for(let m=0;m<n;m++)h[e+m]=i[3+2*m]<<8|i[4+2*m];let d=[0,1].filter(m=>h[m]===Qc);if(!r("sensor_marker",!d.length,d.length?"7FFF H on register "+d.join(", "):"no 7FFF H marker"))return a.status="sensor_abnormal",a;let f={},u=m=>Math.round(m)/10;return 0 in h&&(f.temperature_c=u(h[0]&32768?h[0]-65536:h[0])),1 in h&&(f.humidity_rh=u(h[1])),Object.assign(a,{status:"valid",valid:!0,values:f})}function En(i,t,e="none",n=0,s=2){if(!th.includes(e))throw new Error("Unknown injection.");let r=Ad(i,n,s),a=t.elementFault;e==="sensor_fault"&&(t.elementFault=!0);let o;try{o=t.transact(r)}finally{t.elementFault=a}return o&&e==="bad_crc"&&(o=[...o.slice(0,-1),o[o.length-1]^90]),o&&e==="foreign_address"&&(o=Xs([o[0]%247+1,...o.slice(1,-2)])),{source:"simulated",master_address:i,device_address:t.address,injection:e,request_hex:ll(r),response_hex:ll(o),decode:ox(o,i,n,s)}}function Rd(i,t){let e=ax(i);return e?e.map((n,s)=>{let r="data";return s===0?r="addr":s===1?r="fn":s>=e.length-2?r="crc":t==="response"&&s===2&&e[1]===$s&&(r="count"),{hex:n.toString(16).toUpperCase().padStart(2,"0"),role:r}}):[]}function Cd(i){let t=[],e=new wn(en(1),25,60),n=Ad(1,0,8);ll(n)!==i.manual_request&&t.push("manual request"),ll(e.transact(n))!==i.manual_response&&t.push("manual response");let s={incident:()=>En(1,new wn(en(2))),fixed:()=>En(1,new wn(en(1))),bad_crc:()=>En(1,new wn(en(1)),"bad_crc"),foreign_address:()=>En(1,new wn(en(1)),"foreign_address"),sensor_fault:()=>En(1,new wn(en(1)),"sensor_fault")};for(let[r,a]of Object.entries(s)){let o=a(),l=i[r];(!l||o.request_hex!==l.request_hex||o.response_hex!==l.response_hex||o.decode.status!==l.decode.status||JSON.stringify(o.decode.values)!==JSON.stringify(l.decode.values))&&t.push(r)}return{ok:t.length===0,cases:2+Object.keys(s).length,failures:t}}var Pd=()=>new Date().toISOString().replace(/\.\d+Z$/,"+00:00"),Id=i=>String(i).toUpperCase().replace(/-/g," ").split(/\s+/).filter(Boolean).join(" "),qe=class extends Error{},cl=class{constructor(t){this.b=t,this.n=0,this.events=[],this.identity=null,this.resetCase()}event(t,e,n){let s="EV-"+String(++this.n).padStart(4,"0");return this.events.push({event_id:s,at:Pd(),tool:t,summary:e,source:n}),s}pins(){let t=this.b;return{asset_id:this.identity?.asset_id??null,product_id:this.identity?.product_id??null,catalog_version:t.catalog_version,rules_version:{diagnosis:t.rules_versions.diagnosis,loop:t.rules_versions.loop},last_event_id:this.events.at(-1)?.event_id??null,source_status:Object.fromEntries(Object.entries(t.documents).map(([e,n])=>[e,n.validity]))}}resetCase(){let t=this.b.incident;this.master=t.master_address,this.model=new wn(en(t.device_address),t.temperature_c,t.humidity_rh)}busState(){return{source:"simulated",master_address:this.master,device_address:this.model.address,dip_bits:[...this.model.dipBits]}}requireIdentity(){if(!this.identity)throw new qe("No confirmed asset in this session. Run capture_frame and confirm_asset first.")}findProduct(t){let e=Id(t);return Object.values(this.b.products).find(n=>[n.model,...n.aliases].some(s=>Id(s)===e))||null}capture_frame({source:t="simulated"}={}){if(t==="uvc")throw new qe("UVC capture is not integrated in this build (planned: FieldScan camera adapter).");if(t!=="simulated")throw new qe("source must be 'simulated' or 'uvc'.");let e=this.b.assets["BOAT-ER-TH-02"],n=this.event("capture_frame","Simulated frame of the engine-room bulkhead","simulated");return{frame_id:"FRAME-"+n,source:"simulated",kind:"html_scene",captured_at:Pd(),plate_text:e.plate_lines,asset_hint:e.asset_id,event_id:n}}confirm_asset({model:t,variant:e=null,id_source:n="plate_simulated",confirmed:s=!1,asset_id:r="BOAT-ER-TH-02"}={}){let a=this.findProduct(t),o=this.b.assets[r];if(!o)throw new qe("Unknown asset_id.");if(!a){let h=this.event("confirm_asset",`Model '${t}' not in catalog`,"documented");return{status:"insufficient_evidence",missing:`Model '${t}' is not in catalog ${this.b.catalog_version}.`,event_id:h}}if(a.product_id!==o.expected_product){let h=this.event("confirm_asset","Model does not match the installed asset record","documented");return{status:"insufficient_evidence",missing:`${a.model} does not match the record for ${r}. Confirm the asset.`,event_id:h}}let l=a.variant_fields.filter(h=>!(e&&h==="Order variant"));this.identity={asset_id:r,product_id:a.product_id,model:a.model,variant:e,id_source:n,confirmed:!!s,status:s?"confirmed":"needs_confirmation",pending_fields:l};let c=this.event("confirm_asset",`${a.model} \xB7 ${this.identity.status}`,n==="uvc"?"observed":"simulated");return{...this.identity,event_id:c,pins:this.pins()}}get_document({product_id:t=null,doc_type:e="user_manual",catalog_version:n=null,section:s=null}={}){if(n&&n!==this.b.catalog_version){let c=this.event("get_document","Catalog version mismatch","documented");return{status:"insufficient_evidence",missing:`Catalog ${n} requested; this package holds ${this.b.catalog_version}.`,event_id:c}}t===null&&(this.requireIdentity(),t=this.identity.product_id);let r=this.b.products[t];if(!r)throw new qe("Unknown product_id.");let a=r.document_ids.map(c=>this.b.documents[c]).find(c=>c.type===e);if(!a){let c=this.event("get_document",`No ${e} for ${t}`,"documented");return{status:"insufficient_evidence",missing:`No ${e} in the package for ${r.model}.`,event_id:c}}if(s!==null&&!(s in a.sections))throw new qe(`Section ${s} is not in ${a.id}.`);let o=this.event("get_document",`${a.id} \xA7 ${s||"all"}`,"documented");return{status:"ok",source:"documented",document:Object.fromEntries(["id","title","edition","date","origin","url","validity","validity_note"].map(c=>[c,a[c]])),sections:s?{[s]:a.sections[s]}:a.sections,event_id:o}}get_asset_status({transport:t="simulated_rtu",injection:e="none"}={}){if(this.requireIdentity(),t==="rtu_bench")return{source:"no_evidence",reading:null,detail:"No bench RS-485 reader in this build.",event_id:this.event("get_asset_status","Bench reader not connected","observed")};if(t!=="simulated_rtu")throw new qe("transport must be 'simulated_rtu' or 'rtu_bench'.");if(!th.includes(e))throw new qe("Unknown injection.");let n=En(this.master,this.model,e),s=this.event("get_asset_status",`Poll addr ${this.master}: ${n.decode.status}`,"simulated");return{source:"simulated",reading:n.decode.values,transaction:n,event_id:s}}simulate_fault({scenario:t="address_mismatch",dip_bits:e=null}={}){this.requireIdentity();let n=En(this.master,this.model),s;if(t==="reset"||t==="address_mismatch")this.resetCase(),s=`Incident restored: master polls ${this.master}, DIP set to ${this.model.address}.`;else if(t==="dip_fix")this.model.dipBits=en(this.master),s=`DIP set to ${this.master} (switch 8 ON, others OFF) inside the simulation.`;else if(t==="set_dip"){let o;try{o=Jr(e||[])}catch(l){throw new qe(l.message)}this.model.dipBits=[...e],s=`DIP set to address ${o} inside the simulation.`}else if(["bad_crc","foreign_address","sensor_fault"].includes(t)){let o=En(this.master,this.model,t),l=this.event("simulate_fault",`Injected ${t}: ${o.decode.status}`,"simulated");return{source:"simulated",scenario:t,before:n,action:`One reply with ${t}.`,after:o,event_id:l}}else throw new qe("scenario must be address_mismatch, dip_fix, set_dip, bad_crc, foreign_address, sensor_fault or reset.");let r=En(this.master,this.model),a=this.event("simulate_fault",s,"simulated");return{source:"simulated",scenario:t,before:n,action:s,after:r,event_id:a}}check_replacement({candidate:t="eh-fmx11",voltage:e=24,revision:n="v1",scenario:s="nominal",rules_version:r=this.b.rules_versions.loop}={}){if(r!==this.b.rules_versions.loop){let h=this.event("check_replacement","Rules version mismatch","documented");return{status:"insufficient_evidence",missing:`Rules ${r} requested; the engine runs ${this.b.rules_versions.loop}.`,event_id:h}}if(t!=="eh-fmx11"){let h=this.event("check_replacement",`No profile for ${t}`,"documented");return{status:"insufficient_evidence",missing:`No evaluated profile for candidate ${t}.`,event_id:h}}let a=this.b.reports[`${e}:${n}:${s}`];if(!a)throw new qe("Combination not available in this file.");let o=a.load_check,l=[{criterion:"signal_type",status:"pass",detail:"Reference and candidate are 4\u201320 mA.",source_ids:["WIKA-LS10","EH-TI01524P"]},{criterion:"loop_load",status:o.status,margin_ohm:o.margin_ohm,detail:`${o.evaluated_ohm} \u03A9 evaluated vs ${o.available_ohm} \u03A9 available at ${e} V.`,source_ids:o.source_ids},{criterion:"range_and_scaling",status:"pending",detail:"Order codes, range and scaling not confirmed.",source_ids:[]},{criterion:"materials_mounting_approvals",status:"pending",detail:"Materials, mounting, cable and approvals not confirmed.",source_ids:[]}],c=this.event("check_replacement",`FMX11 at ${e} V/${n}: ${a.replacement_status}`,"documented");return{status:a.replacement_status,candidate:t,criteria:l,rules_version:this.b.rules_versions.loop,report:a,event_id:c}}};var Ld=document.getElementById("embedded-bundle"),os=Ld?JSON.parse(Ld.textContent):null,ls=os?"portable":"server",pi=os,fi=os?new cl(os):null,Nd={pins:null,events:[],identity:null,bus:null};async function Ud(){if(pi)return pi;let i=await fetch("/api/bundle");if(!i.ok)throw new Error("Could not load the data bundle from the local server.");return pi=await i.json(),pi}async function Od(){try{let i=await fetch("/api/session",{cache:"no-store"});i.ok&&(Nd=await i.json())}catch{}}async function Fd(){return fi||await Od(),jr()}async function Tn(i,t={}){if(fi){if(typeof fi[i]!="function")throw new qe(`Unknown tool ${i}.`);return fi[i](t)}let e=await fetch("/api/tools/"+i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}),n=await e.json();if(await Od(),!e.ok)throw new qe(n.error||`Tool ${i} failed.`);return n}function jr(){return fi?{pins:fi.pins(),events:fi.events,identity:fi.identity,bus:fi.busState()}:Nd}async function Bd({voltage:i,revision:t,scenario:e}){if(pi?.reports&&ls==="portable"){let r=pi.reports[`${i}:${t}:${e}`];if(!r)throw new Error("Combination not available in this file.");return r}let n=new URLSearchParams({voltage:i,revision:t,scenario:e}),s=await fetch("/api/check?"+n);if(!s.ok)throw new Error((await s.json()).error||"Local query failed.");return s.json()}async function eh(){if(os)return{ok:!0,portable:!0};try{return{ok:(await fetch("/health",{cache:"no-store"})).ok}}catch{return{ok:!1}}}async function kd(){if(os)return{configured:!1,model:null};try{let i=await fetch("/api/ai");return i.ok?i.json():{configured:!1}}catch{return{configured:!1}}}var Dd=[["24:v1:nominal","pass","nominal",12,13824,407.273],["12:v1:nominal","fail","outside_load_envelope",null,null,-138.182],["24:v1:empty","pass","empty_tank",4,0,407.273],["24:v1:open","pass","open_circuit",0,null,407.273],["24:v2:nominal","fail","outside_load_envelope",null,null,-37.727],["12:v1:open","fail","open_circuit",0,null,-138.182]];async function zd(){let i=pi?Cd(pi.golden):{ok:!1,cases:0,failures:["bundle not loaded"]};if(!os)try{let s=await(await fetch("/api/selftest")).json();return{ok:!!s.ok&&i.ok,total:(s.total||0)+i.cases,python:s,parity:i,error:s.error||(i.ok?void 0:"JS/Python Modbus mismatch: "+i.failures.join(", "))}}catch(n){return{ok:!1,total:0,parity:i,error:String(n)}}let e=[...Dd.filter(([n,s,r,a,o,l])=>{let c=pi.reports[n];return!c||c.load_check.status!==s||c.simulation.state!==r||c.simulation.loop_signal_ma!==a||c.simulation.plc_ideal_count!==o||c.load_check.margin_ohm!==l}).map(n=>n[0]),...i.failures];return{ok:e.length===0,total:Dd.length+i.cases,parity:i,error:e.length?"Mismatch: "+e.join(", "):void 0}}var Hd=i=>(Math.random()+Math.random()+Math.random()-1.5)*i,hl=class{constructor(t){this.onSample=t,this.report=null,this.current=0,this.level=.5,this.history=[],this.timer=null}setReport(t){this.report=t}start(){this.timer||(this.timer=setInterval(()=>this.tick(),250))}tick(){let t=this.report;if(!t)return;let e=t.simulation.state,n=t.inputs.supply_v,s=t.simulation.level_fraction??this.level;this.level+=(s-this.level)*.08;let r;e==="open_circuit"?r=0:e==="outside_load_envelope"?r=null:r=t.simulation.loop_signal_ma;let a=null;r!==null?(this.current+=(r-this.current)*.35,a=Math.max(0,this.current+(r===0?0:Hd(.012)))):this.current+=(0-this.current)*.35;let o=t.load_check.evaluated_ohm,l=n-(a??0)/1e3*.05+Hd(.02),c=n-.022*o,h=a!==null&&e!=="open_circuit"?Math.round(Math.max(0,(a-4)/16*27648)):null,d={t:Date.now(),state:e,ma:a,supply:l,terminalAtDesign:c,count:h,level:this.level,diag:e==="open_circuit"?"Wire break":e==="outside_load_envelope"?"Reading suppressed":"OK"};this.last=d,this.history.push(d),this.history.length>160&&this.history.shift(),this.onSample(d)}};function nh(i,t){let e=i.getContext("2d"),n=i.width,s=i.height;e.clearRect(0,0,n,s);let r={l:46,r:14,t:22,b:14},a=(s-r.t-r.b-28)/2,o=[{y0:r.t,title:"Loop current [mA]",min:0,max:24,key:"ma",color:"#5fd4d0",guides:[4,20]},{y0:r.t+a+28,title:"Supply [V]",min:0,max:28,key:"supply",color:"#ffc857",guides:[12,24]}];e.font="20px ui-monospace, Menlo, monospace";for(let l of o){let c=d=>l.y0+a-(d-l.min)/(l.max-l.min)*a;e.fillStyle="#8ea2a9",e.fillText(l.title,r.l,l.y0-4),e.strokeStyle="#1c2a31",e.lineWidth=1,e.strokeRect(r.l,l.y0,n-r.l-r.r,a);for(let d of l.guides)e.setLineDash([6,6]),e.beginPath(),e.moveTo(r.l,c(d)),e.lineTo(n-r.r,c(d)),e.stroke(),e.setLineDash([]),e.fillText(String(d),6,c(d)+6);e.strokeStyle=l.color,e.lineWidth=2.5,e.beginPath();let h=!1;t.forEach((d,f)=>{let u=r.l+f/159*(n-r.l-r.r),m=d[l.key];if(m==null){h=!1,e.fillStyle="rgba(255,138,92,.25)",e.fillRect(u-1,l.y0,3,a);return}h?e.lineTo(u,c(m)):e.moveTo(u,c(m)),h=!0}),e.stroke()}}var Gd={type:"change"},sh={type:"start"},Wd={type:"end"},ul=new Ti,Vd=new ln,lx=Math.cos(70*Lc.DEG2RAD),Ae=new R,nn=2*Math.PI,ie={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},ih=1e-6,dl=class extends Or{constructor(t,e=null){super(t,e),this.state=ie.NONE,this.target=new R,this.cursor=new R,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Di.ROTATE,MIDDLE:Di.DOLLY,RIGHT:Di.PAN},this.touches={ONE:Ni.ROTATE,TWO:Ni.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new R,this._lastQuaternion=new Je,this._lastTargetPosition=new R,this._quat=new Je().setFromUnitVectors(t.up,new R(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Os,this._sphericalDelta=new Os,this._scale=1,this._panOffset=new R,this._rotateStart=new gt,this._rotateEnd=new gt,this._rotateDelta=new gt,this._panStart=new gt,this._panEnd=new gt,this._panDelta=new gt,this._dollyStart=new gt,this._dollyEnd=new gt,this._dollyDelta=new gt,this._dollyDirection=new R,this._mouse=new gt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=hx.bind(this),this._onPointerDown=cx.bind(this),this._onPointerUp=ux.bind(this),this._onContextMenu=xx.bind(this),this._onMouseWheel=px.bind(this),this._onKeyDown=mx.bind(this),this._onTouchStart=gx.bind(this),this._onTouchMove=_x.bind(this),this._onMouseDown=dx.bind(this),this._onMouseMove=fx.bind(this),this._interceptControlDown=yx.bind(this),this._interceptControlUp=vx.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.ownerDocument.addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=ie.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.ownerDocument.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Gd),this.update(),this.state=ie.NONE}pan(t,e){this._pan(t,e),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){let e=this.object.position;Ae.copy(e).sub(this.target),Ae.applyQuaternion(this._quat),this._spherical.setFromVector3(Ae),this.autoRotate&&this.state===ie.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=nn:n>Math.PI&&(n-=nn),s<-Math.PI?s+=nn:s>Math.PI&&(s-=nn),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(Ae.setFromSpherical(this._spherical),Ae.applyQuaternion(this._quatInverse),e.copy(this.target).add(Ae),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=Ae.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let o=new R(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new R(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=Ae.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(ul.origin.copy(this.object.position),ul.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(ul.direction))<lx?this.object.lookAt(this.target):(Vd.setFromNormalAndCoplanarPoint(this.object.up,this.target),ul.intersectPlane(Vd,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>ih||8*(1-this._lastQuaternion.dot(this.object.quaternion))>ih||this._lastTargetPosition.distanceToSquared(this.target)>ih?(this.dispatchEvent(Gd),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?nn/60*this.autoRotateSpeed*t:nn/60/60*this.autoRotateSpeed}_getZoomScale(t){let e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Ae.setFromMatrixColumn(e,0),Ae.multiplyScalar(-t),this._panOffset.add(Ae)}_panUp(t,e){this.screenSpacePanning===!0?Ae.setFromMatrixColumn(e,1):(Ae.setFromMatrixColumn(e,0),Ae.crossVectors(this.object.up,Ae)),Ae.multiplyScalar(t),this._panOffset.add(Ae)}_pan(t,e){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Ae.copy(s).sub(this.target);let r=Ae.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientY),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(nn*this._rotateDelta.x/e.clientHeight),this._rotateUp(nn*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.zoomToCursor&&(this._performCursorZoom=!0,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(nn*this._rotateDelta.x/e.clientHeight),this._rotateUp(nn*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(t.pageX+e.x)*.5,o=(t.pageY+e.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new gt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){let e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function cx(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function hx(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function ux(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(Wd),this.state=ie.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function dx(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Di.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=ie.DOLLY;break;case Di.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ie.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ie.ROTATE}break;case Di.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ie.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ie.PAN}break;default:this.state=ie.NONE}this.state!==ie.NONE&&this.dispatchEvent(sh)}function fx(i){switch(this.state){case ie.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case ie.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case ie.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function px(i){this.enabled===!1||this.enableZoom===!1||this.state!==ie.NONE||(i.preventDefault(),this.dispatchEvent(sh),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(Wd))}function mx(i){this.enabled!==!1&&this._handleKeyDown(i)}function gx(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Ni.ROTATE:if(this.enableRotate===!1){this.state=ie.NONE;break}this._handleTouchStartRotate(i),this.state=ie.TOUCH_ROTATE;break;case Ni.PAN:if(this.enablePan===!1){this.state=ie.NONE;break}this._handleTouchStartPan(i),this.state=ie.TOUCH_PAN;break;default:this.state=ie.NONE}break;case 2:switch(this.touches.TWO){case Ni.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=ie.TOUCH_DOLLY_PAN;break;case Ni.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=ie.TOUCH_DOLLY_ROTATE;break;default:this.state=ie.NONE}break;default:this.state=ie.NONE}this.state!==ie.NONE&&this.dispatchEvent(sh)}function _x(i){switch(this._trackPointer(i),this.state){case ie.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case ie.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case ie.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case ie.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=ie.NONE}}function xx(i){this.enabled!==!1&&i.preventDefault()}function yx(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.ownerDocument.addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function vx(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var fl=class extends ye{constructor(t=document.createElement("div")){super(),this.isCSS2DObject=!0,this.element=t,this.element.style.position="absolute",this.element.style.userSelect="none",this.element.setAttribute("draggable",!1),this.center=new gt(.5,.5),this.rotation2D=0,this.addEventListener("removed",function(){this.traverse(function(e){e.element&&e.element instanceof e.element.ownerDocument.defaultView.Element&&e.element.parentNode!==null&&e.element.remove()})})}copy(t,e){return super.copy(t,e),this.element=t.element.cloneNode(!0),this.center=t.center,this.rotation2D=t.rotation2D,this}},qs=new R,Xd=new Zt,$d=new Zt,qd=new R,Yd=new R,pl=class{constructor(t={}){let e=this,n,s,r,a,o={objects:new WeakMap},l=t.element!==void 0?t.element:document.createElement("div");l.style.overflow="hidden",this.domElement=l,this.sortObjects=!0,this.getSize=function(){return{width:n,height:s}},this.render=function(m,x){m.matrixWorldAutoUpdate===!0&&m.updateMatrixWorld(),x.parent===null&&x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),Xd.copy(x.matrixWorldInverse),$d.multiplyMatrices(x.projectionMatrix,Xd),h(m,m,x),this.sortObjects&&u(m)},this.setSize=function(m,x){n=m,s=x,r=n/2,a=s/2,l.style.width=m+"px",l.style.height=x+"px"};function c(m){m.isCSS2DObject&&(m.element.style.display="none");for(let x=0,g=m.children.length;x<g;x++)c(m.children[x])}function h(m,x,g){if(m.visible===!1){c(m);return}if(m.isCSS2DObject){qs.setFromMatrixPosition(m.matrixWorld),qs.applyMatrix4($d);let p=qs.z>=-1&&qs.z<=1&&m.layers.test(g.layers)===!0,v=m.element;if(v.style.display=p===!0?"":"none",p===!0){m.onBeforeRender(e,x,g);let S=100*m.center.x,T=100*m.center.y;v.style.transformOrigin=`${S}% ${T}%`;let E=-m.rotation2D,_=qs.x*r+r,M=-qs.y*a+a;v.style.transform=`translate(${-S}%, ${-T}%) translate(${_}px, ${M}px) rotate(${E}rad)`,v.parentNode!==l&&l.appendChild(v),m.onAfterRender(e,x,g)}let w={distanceToCameraSquared:d(g,m)};o.objects.set(m,w)}for(let p=0,v=m.children.length;p<v;p++)h(m.children[p],x,g)}function d(m,x){return qd.setFromMatrixPosition(m.matrixWorld),Yd.setFromMatrixPosition(x.matrixWorld),qd.distanceToSquared(Yd)}function f(m){let x=[];return m.traverseVisible(function(g){g.isCSS2DObject&&x.push(g)}),x}function u(m){let x=f(m).sort(function(p,v){if(p.renderOrder!==v.renderOrder)return v.renderOrder-p.renderOrder;let w=o.objects.get(p).distanceToCameraSquared,S=o.objects.get(v).distanceToCameraSquared;return w-S}),g=x.length;for(let p=0,v=x.length;p<v;p++)x[p].element.style.zIndex=g-p}}};var ml=class extends qi{constructor(){super(),this.name="RoomEnvironment",this.position.y=-3.5;let t=new bn;t.deleteAttribute("uv");let e=new oe({side:ke}),n=new oe,s=new On(16777215,900,28,2);s.position.set(.418,16.199,.3),this.add(s);let r=new ue(t,e);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let a=new qn(t,n,6),o=new ye;o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),o.updateMatrix(),a.setMatrixAt(0,o.matrix),o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),o.updateMatrix(),a.setMatrixAt(1,o.matrix),o.position.set(6.167,.857,7.803),o.rotation.set(0,.561,0),o.scale.set(3.927,6.285,3.687),o.updateMatrix(),a.setMatrixAt(2,o.matrix),o.position.set(-2.017,.018,6.124),o.rotation.set(0,.333,0),o.scale.set(2.002,4.566,2.064),o.updateMatrix(),a.setMatrixAt(3,o.matrix),o.position.set(2.291,-.756,-2.621),o.rotation.set(0,-.286,0),o.scale.set(1.546,1.552,1.496),o.updateMatrix(),a.setMatrixAt(4,o.matrix),o.position.set(-2.193,-.369,-5.547),o.rotation.set(0,.516,0),o.scale.set(3.875,3.487,2.986),o.updateMatrix(),a.setMatrixAt(5,o.matrix),this.add(a);let l=new ue(t,Ys(50));l.position.set(-16.116,14.37,8.208),l.scale.set(.1,2.428,2.739),this.add(l);let c=new ue(t,Ys(50));c.position.set(-16.109,18.021,-8.207),c.scale.set(.1,2.425,2.751),this.add(c);let h=new ue(t,Ys(17));h.position.set(14.904,12.198,-1.832),h.scale.set(.15,4.265,6.331),this.add(h);let d=new ue(t,Ys(43));d.position.set(-.462,8.89,14.52),d.scale.set(4.38,5.441,.088),this.add(d);let f=new ue(t,Ys(20));f.position.set(3.235,11.486,-12.541),f.scale.set(2.5,2,.1),this.add(f);let u=new ue(t,Ys(100));u.position.set(0,20,0),u.scale.set(1,.1,1),this.add(u)}dispose(){let t=new Set;this.traverse(e=>{e.isMesh&&(t.add(e.geometry),t.add(e.material))});for(let e of t)e.dispose()}};function Ys(i){return new Ar({color:0,emissive:16777215,emissiveIntensity:i})}var bx={structure:["#4f7282",2.4,.015,.3],shell:["#5fd4d0",2,.025,.8],electronics:["#ffb347",1.6,.12,.85],signal:["#6fe3a1",1,.55,1],fluid:["#3aa0ff",1.3,.16,.75],internal:["#ffd166",1.1,.55,1]};function Sx([i,t,e,n]){return new Sn({uniforms:{color:{value:new Ut(i)},power:{value:t},base:{value:e},opacity:{value:n}},vertexShader:`
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 local = vec4(position, 1.0);
        vec3 n = normal;
        #ifdef USE_INSTANCING
          local = instanceMatrix * local;
          n = mat3(instanceMatrix) * n;
        #endif
        vec4 mv = modelViewMatrix * local;
        vN = normalize(normalMatrix * n);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,fragmentShader:`
      uniform vec3 color;
      uniform float power;
      uniform float base;
      uniform float opacity;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), power);
        float a = clamp((base + f) * opacity, 0.0, 1.0);
        gl_FragColor = vec4(color * (base + f * 1.25), a);
      }`,transparent:!0,depthWrite:!1,side:Ne,blending:es,toneMapped:!1})}var Zd=i=>i<.5?4*i*i*i:1-Math.pow(-2*i+2,3)/2,rh=i=>Math.max(0,Math.min(1,i));function Mx(i){for(let t=i;t;t=t.parent)if(!t.visible)return!1;return!0}var Zs=class{constructor(t,e,n={}){let{onSelect:s=()=>{},onHover:r=()=>{},presets:a={},initial:o="overview",background:l="#0d151a",fog:c=[8,18],minFocus:h=.35,focusScale:d=1.6,near:f=.02,far:u=60,minDistance:m=.2,maxDistance:x=9,exposure:g=1.05,envIntensity:p=.5}=n;this.container=t,this.onSelect=s,this.onHover=r,this.presets=a,this.minFocus=h,this.focusScale=d;let v=new rl({antialias:!0,powerPreference:"high-performance"});v.setPixelRatio(Math.min(window.devicePixelRatio,2)),v.shadowMap.enabled=!0,v.shadowMap.type=Qi,v.toneMapping=Fr,v.toneMappingExposure=g,t.appendChild(v.domElement),this.renderer=v;let w=new pl;Object.assign(w.domElement.style,{position:"absolute",inset:"0",pointerEvents:"none"}),t.appendChild(w.domElement),this.labelRenderer=w;let S=new qi;this.bg={normal:new Ut(l),xray:new Ut("#03080b")},S.background=this.bg.normal,S.fog=new pr(l,c[0],c[1]);let T=new Vs(v);S.environment=T.fromScene(new ml,.04).texture,S.environmentIntensity=p,this.scene=S;let E=a[o]||{pos:[2,2,3],target:[0,0,0]};this.camera=new Be(40,1,f,u),this.camera.position.set(...E.pos);let _=new dl(this.camera,v.domElement);_.target.set(...E.target),_.enableDamping=!0,_.dampingFactor=.08,_.maxPolarAngle=1.52,_.minDistance=m,_.maxDistance=x,_.autoRotateSpeed=.6,_.addEventListener("start",()=>{this.tween=null}),this.controls=_,this.model=e,S.add(e.root),this.grid=new Nr(10,50,2053472,993841),this.grid.visible=!1,S.add(this.grid),this.parts=e.parts;let M=new Je;for(let[P,D]of Object.entries(this.parts))D.id=P,D.base=D.object.position.clone(),D.baseQuat=D.object.quaternion.clone(),D.offset=new R(...D.explode),D.spin&&(D.spinAxis=new R(D.spin[0],D.spin[1],D.spin[2]).normalize()),D.object.userData.partId=P;this.q=M;let N=Object.fromEntries(Object.entries(bx).map(([P,D])=>[P,Sx(D)]));e.root.traverse(P=>{P.isMesh&&(P.userData.mat=P.material,P.userData.xmat=N[P.userData.cat]||N.structure,P.userData.shadow=P.castShadow)}),this.labels={};for(let[P,D]of Object.entries(e.anchors||{})){let O=document.createElement("div");O.className="label3d";let V=new fl(O);V.position.copy(D),this.parts[P].object.add(V),this.labels[P]=O}this.selectionBox=new Ur(new Ke,16762967),this.selectionBox.visible=!1,S.add(this.selectionBox),this.view="normal",this.explode=0,this.explodeTarget=0,this.selected=null,this.raycaster=new Dr,this.pointer=new gt,this.tmp=new Zt,this.box=new Ke,this.active=!0,this.bindPointer(),new ResizeObserver(()=>this.resize()).observe(t),this.resize(),this.clock=new Lr,this.clock.connect(document),v.setAnimationLoop(()=>this.frame())}setLabel(t,e,n,s=""){let r=this.labels[t];r&&(r.className="label3d "+s,r.innerHTML=`<b>${e}</b><span>${n}</span>`)}setActive(t){t!==this.active&&(this.active=t,this.renderer.setAnimationLoop(t?()=>this.frame():null),t&&(this.clock.reset?.(),this.resize()))}resize(){let t=this.container.clientWidth||1,e=this.container.clientHeight||1;this.renderer.setSize(t,e),this.labelRenderer.setSize(t,e),this.camera.aspect=t/e,this.camera.updateProjectionMatrix()}pickHit(t){let e=this.renderer.domElement.getBoundingClientRect();this.pointer.set((t.clientX-e.left)/e.width*2-1,-((t.clientY-e.top)/e.height)*2+1),this.raycaster.setFromCamera(this.pointer,this.camera);for(let n of this.raycaster.intersectObject(this.model.root,!0))if(Mx(n.object))return n;return null}pick(t){let e=this.pickHit(t);for(let n=e?.object;n;n=n.parent)if(n.userData.partId)return n.userData.partId;return null}onPickObject(){return!1}bindPointer(){let t=this.renderer.domElement,e=null,n=0;t.addEventListener("pointerdown",s=>{e=[s.clientX,s.clientY]}),t.addEventListener("pointerup",s=>{if(!e||Math.hypot(s.clientX-e[0],s.clientY-e[1])>4)return;let r=this.pickHit(s);if(r&&this.onPickObject(r.object))return;let a=this.pick(s);this.select(a),this.onSelect(a)}),t.addEventListener("pointermove",s=>{n||(n=requestAnimationFrame(()=>{n=0;let a=this.pickHit(s)?.object.userData.hint,o=this.pick(s);t.style.cursor=a||o?"pointer":"grab",this.onHover(a||(o?this.parts[o].name:null),s.clientX,s.clientY)}))}),t.addEventListener("pointerleave",()=>this.onHover(null))}select(t){this.selected=t&&this.parts[t]?this.parts[t]:null,this.selectionBox.visible=!!this.selected}focus(t){let e=this.parts[t];if(!e)return;if(Math.abs(this.explode-this.explodeTarget)>.01){this.pendingFocus=t;return}this.pendingFocus=null,this.box.setFromObject(e.object,!0);let n=this.box.getCenter(new R),s=this.box.getSize(new R).length(),r=this.camera.position.clone().sub(this.controls.target).normalize();r.y<.15&&(r.y=.25),r.normalize(),this.flyTo(n.clone().addScaledVector(r,Math.max(this.minFocus,s*this.focusScale)),n)}preset(t){let e=this.presets[t];e&&this.flyTo(new R(...e.pos),new R(...e.target))}flyTo(t,e,n=1100){this.tween={p0:this.camera.position.clone(),t0:this.controls.target.clone(),p1:t,t1:e,start:performance.now(),duration:n}}setView(t){this.view=t;let e=t==="xray";this.model.root.traverse(n=>{!n.isMesh||n.material?.userData?.keep||n.userData.mat?.userData?.keep||(n.material=e?n.userData.xmat:n.userData.mat,n.castShadow=!e&&n.userData.shadow)}),this.model.room&&(this.model.room.visible=!e&&!this.isolated),this.grid.visible=e,this.scene.background=e?this.bg.xray:this.bg.normal,this.scene.fog.color.copy(this.scene.background)}setExplode(t){this.explodeTarget=rh(t)}setLabels(t){this.container.classList.toggle("labels-off",!t)}setAutoRotate(t){this.controls.autoRotate=t}isolate(t){let e=this.parts[t];for(;e?.parent;)e=this.parts[e.parent];for(let n of Object.values(this.parts))n.parent?n.object.visible=!0:n.object.visible=n===e;this.isolated=!0,this.model.room&&(this.model.room.visible=!1),this.focus(t)}showAll(){for(let t of Object.values(this.parts))t.object.visible=!0;this.isolated=!1,this.model.room&&(this.model.room.visible=this.view!=="xray")}tick(){}frame(){this.clock.update();let t=Math.min(this.clock.getDelta(),.05),e=this.clock.getElapsed();this.explode+=(this.explodeTarget-this.explode)*Math.min(1,t*4),Math.abs(this.explodeTarget-this.explode)<5e-4&&(this.explode=this.explodeTarget);let n=rh(this.explode);this.pendingFocus&&Math.abs(this.explode-this.explodeTarget)<=.01&&this.focus(this.pendingFocus);for(let s of Object.values(this.parts)){let[r,a]=s.window||[0,1],o=Zd(rh((n-r)/(a-r)));s.object.position.copy(s.base).addScaledVector(s.offset,o),s.spinAxis&&(this.q.setFromAxisAngle(s.spinAxis,s.spin[3]*o),s.object.quaternion.copy(s.baseQuat).multiply(this.q))}if(this.tick(t,e),this.selected&&this.selectionBox.box.setFromObject(this.selected.object,!0),this.tween){let s=Math.min(1,(performance.now()-this.tween.start)/this.tween.duration),r=Zd(s);this.camera.position.lerpVectors(this.tween.p0,this.tween.p1,r),this.controls.target.lerpVectors(this.tween.t0,this.tween.t1,r),s>=1&&(this.tween=null)}this.controls.update(t),this.renderer.render(this.scene,this.camera),this.labelRenderer.render(this.scene,this.camera)}};var Kr=new R;function An(i,t,e,n,s,r){let a=2*Math.PI*s/4,o=Math.max(r-2*s,0),l=Math.PI/4;Kr.copy(t),Kr[n]=0,Kr.normalize();let c=.5*a/(a+o),h=1-Kr.angleTo(i)/l;return Math.sign(Kr[e])===1?h*c:o/(a+o)+c+c*(1-h)}var zn=class i extends bn{constructor(t=1,e=1,n=1,s=2,r=.1){let a=s*2+1;if(r=Math.min(t/2,e/2,n/2,r),super(1,1,1,a,a,a),this.type="RoundedBoxGeometry",this.parameters={width:t,height:e,depth:n,segments:s,radius:r},a===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let l=new R,c=new R,h=new R(t,e,n).divideScalar(2).subScalar(r),d=this.attributes.position.array,f=this.attributes.normal.array,u=this.attributes.uv.array,m=d.length/6,x=new R,g=.5/a;for(let p=0,v=0;p<d.length;p+=3,v+=2)switch(l.fromArray(d,p),c.copy(l),c.x-=Math.sign(c.x)*g,c.y-=Math.sign(c.y)*g,c.z-=Math.sign(c.z)*g,c.normalize(),d[p+0]=h.x*Math.sign(l.x)+c.x*r,d[p+1]=h.y*Math.sign(l.y)+c.y*r,d[p+2]=h.z*Math.sign(l.z)+c.z*r,f[p+0]=c.x,f[p+1]=c.y,f[p+2]=c.z,Math.floor(p/m)){case 0:x.set(1,0,0),u[v+0]=An(x,c,"z","y",r,n),u[v+1]=1-An(x,c,"y","z",r,e);break;case 1:x.set(-1,0,0),u[v+0]=1-An(x,c,"z","y",r,n),u[v+1]=1-An(x,c,"y","z",r,e);break;case 2:x.set(0,1,0),u[v+0]=1-An(x,c,"x","z",r,t),u[v+1]=An(x,c,"z","x",r,n);break;case 3:x.set(0,-1,0),u[v+0]=1-An(x,c,"x","z",r,t),u[v+1]=1-An(x,c,"z","x",r,n);break;case 4:x.set(0,0,1),u[v+0]=1-An(x,c,"x","y",r,t),u[v+1]=1-An(x,c,"y","x",r,e);break;case 5:x.set(0,0,-1),u[v+0]=An(x,c,"x","y",r,t),u[v+1]=1-An(x,c,"y","x",r,e);break}}static fromJSON(t){return new i(t.width,t.height,t.depth,t.segments,t.radius)}};function Qr(i,t){let e=document.createElement("canvas");return e.width=i,e.height=t,[e,e.getContext("2d")]}function ta(i,{repeat:t=[1,1],srgb:e=!0}={}){let n=new Yi(i);return n.wrapS=n.wrapT=Ei,n.repeat.set(t[0],t[1]),n.anisotropy=8,e&&(n.colorSpace=Fe),n}function gl(i=196){let[t,e]=Qr(512,512);e.fillStyle=`rgb(${i},${i},${i})`,e.fillRect(0,0,512,512);for(let n=0;n<2600;n++){let s=Math.random()*512,r=i+(Math.random()-.5)*34;e.strokeStyle=`rgba(${r},${r},${r},0.35)`,e.lineWidth=Math.random()*1.4,e.beginPath(),e.moveTo(Math.random()*-100,s),e.lineTo(512+Math.random()*100,s+(Math.random()-.5)*2),e.stroke()}return ta(t,{repeat:[2,2]})}function Jd(){let[i,t]=Qr(256,256);t.fillStyle="#5a5a5a",t.fillRect(0,0,256,256);let e=(n,s,r)=>{t.save(),t.translate(n,s),t.rotate(r);let a=t.createLinearGradient(-18,0,18,0);a.addColorStop(0,"#3c3c3c"),a.addColorStop(.5,"#a8a8a8"),a.addColorStop(1,"#3c3c3c"),t.fillStyle=a,t.beginPath(),t.ellipse(0,0,20,4.5,0,0,Math.PI*2),t.fill(),t.restore()};for(let n=0;n<4;n++)for(let s=0;s<4;s++)e(s*64+32,n*64+32,(s+n)%2?Math.PI/4:-Math.PI/4);return ta(i,{repeat:[14,10],srgb:!1})}function ah(i="#c8ccc6"){let[t,e]=Qr(256,256);e.fillStyle=i,e.fillRect(0,0,256,256);for(let n=0;n<1800;n++)e.fillStyle=`rgba(0,0,0,${Math.random()*.04})`,e.fillRect(Math.random()*256,Math.random()*256,2,2);return ta(t,{repeat:[4,2]})}function ze({w:i=512,h:t=256,bg:e="#2d3236",fg:n="#e6e9ea",accent:s=null,border:r=null}={}){let[a,o]=Qr(i,t),l=ta(a);return l.wrapS=l.wrapT=xn,{texture:l,draw:h=>{o.fillStyle=e,o.fillRect(0,0,i,t),s&&(o.fillStyle=s,o.fillRect(0,0,i,t*.18)),r&&(o.strokeStyle=r,o.lineWidth=6,o.strokeRect(6,6,i-12,t-12));for(let d of h)o.fillStyle=d.color||n,o.font=`${d.weight||600} ${d.size||34}px Helvetica, Arial, sans-serif`,o.textAlign=d.align||"left",o.fillText(d.text,d.align==="center"?i/2:d.x??24,d.y);l.needsUpdate=!0}}}function jd(){let[i,t]=Qr(256,64);t.fillStyle="#9ea3a5",t.fillRect(0,0,256,64),t.fillStyle="#2b2f31";for(let e=6;e<256;e+=16)t.fillRect(e,0,6,46);return ta(i,{repeat:[6,1]})}var Ft={x:-1.2,z:-.2,w:1.4,h:1.1,d:.9,y0:.12};Ft.top=Ft.y0+Ft.h;var Re={x:1.55,y:1.15,z:-1.22,w:.8,h:1,d:.3},sn={x:.25,y:2.07,z:-1.25},ea=-1.4,cs={y:2.05,z:-1.22},dn={x:Ft.x+.4,z:Ft.z+.15,bottom:Ft.y0+.05},_l=Ft.top+.06;function z(i,t,e={}){let n=new ue(i,t);return e.pos&&n.position.set(...e.pos),e.rot&&n.rotation.set(...e.rot),e.cat&&(n.userData.cat=e.cat),n.castShadow=e.cast??!0,n.receiveShadow=e.receive??!0,n}var pt=(i,t,e)=>new bn(i,t,e),Yt=(i,t,e=32,n=i)=>new Ri(i,n,t,e);function oh(){let i={brushed:gl(),checker:Jd(),bulkhead:ah("#d3d6d0"),cabinet:ah("#d4d7d3"),duct:jd()},t=(e,n,s,r={})=>new oe({color:e,roughness:n,metalness:s,...r});return{stainless:new Zn({color:14080990,metalness:.92,roughness:.28,map:i.brushed,clearcoat:.15}),stainlessDark:t(10134182,.38,.9),floor:t(8884116,.55,.75,{bumpMap:i.checker,bumpScale:1.6}),bulkhead:t(16777215,.78,.15,{map:i.bulkhead}),frame:t(12567485,.7,.25),primer:t(8270886,.8,.2),cabinet:t(16777215,.5,.25,{map:i.cabinet}),plate:t(12896716,.42,.8),din:t(15001578,.22,1),duct:t(16777215,.7,.05,{map:i.duct}),ductLid:t(10988718,.65,.05),siemens:t(2830388,.55,.1),siemensTerm:t(3949127,.6,.1),psu:t(14211803,.5,.15),white:t(15790318,.5,.05),black:t(1316376,.55,.05),termGrey:t(10199718,.6,.05),termBlue:t(3108277,.6,.05),termRed:t(11744812,.6,.05),termPE:t(5216828,.6,.05),cable:t(1776927,.55,.05),wireRed:t(11674146,.5,.05),wireBlue:t(2052008,.5,.05),jb:t(9344924,.55,.1),glass:new Zn({color:16777215,metalness:0,roughness:.04,transparent:!0,opacity:.22,depthWrite:!1}),water:new Zn({color:1928094,metalness:0,roughness:.08,transparent:!0,opacity:.62,depthWrite:!1}),waterSurface:new Zn({color:3839433,metalness:.1,roughness:.05,transparent:!0,opacity:.75,side:Ne}),ceramic:t(15855334,.35,.02),diaphragm:t(14271098,.3,.8),pcb:t(1533498,.55,.1),chip:t(1118481,.4,.2),gold:t(13938487,.3,1),capPlastic:t(3752778,.5,.05),red:t(12597547,.45,.1),crate:t(3362910,.6,.05),foam:t(2434341,.95,0),pipeBlue:t(2909096,.55,.3),pipeGreen:t(3963466,.55,.3),lamp:t(16777215,.3,0,{emissive:16773852,emissiveIntensity:2.2}),ledOff:()=>t(2105376,.4,0,{emissive:0})}}function Hn(i){let t=new oe({color:1118481,emissive:i,emissiveIntensity:0,roughness:.3});return t.userData.keep=!0,{material:t,on:(e=1)=>{t.emissiveIntensity=e*3}}}function mi(i,t,e,n={}){let s=new ci(i.map(a=>new R(...a)),!1,"catmullrom",n.tension??.2),r=z(new Tr(s,n.segments??200,t,10,!1),e,n);return r.userData.curve=s,r}function wx(i){let t=new Nt;t.add(z(new fe(9,7),i.floor,{rot:[-Math.PI/2,0,0],pos:[0,0,.6],cast:!1})),t.add(z(new fe(9,3.2),i.bulkhead,{pos:[0,1.6,ea],cast:!1}));let e=z(new fe(7,3.2),i.bulkhead,{pos:[-3.4,1.6,.6],rot:[0,Math.PI/2,0],cast:!1});t.add(e);for(let s=-4.2;s<=4.2;s+=.7)Math.abs(s-Re.x)<.55||Math.abs(s-sn.x)<.2||t.add(z(pt(.06,3.2,.14),i.frame,{pos:[s,1.6,ea+.07]}));for(let s=-.7;s<=3.5;s+=.7)t.add(z(pt(.14,3.2,.06),i.frame,{pos:[-3.33,1.6,s]}));for(let s of[-.9,.5]){t.add(z(pt(9,.2,.1),i.frame,{pos:[0,2.95,s]}));for(let r of[-1.6,1.2])t.add(z(pt(1.25,.05,.14),i.white,{pos:[r,2.82,s]})),t.add(z(pt(1.18,.012,.09),i.lamp,{pos:[r,2.794,s],cast:!1}))}let n=(s,r)=>{let a=z(Yt(.045,9,24),r,{pos:[0,s,ea+.2],rot:[0,0,Math.PI/2]});t.add(a);for(let o=-4;o<=4;o+=1.4)Math.abs(o-Re.x)<.5||t.add(z(pt(.04,.03,.2),i.stainlessDark,{pos:[o,s-.06,ea+.1]}))};return n(.42,i.pipeBlue),n(2.45,i.pipeGreen),t.traverse(s=>{s.isMesh&&(s.userData.cat="structure")}),t}function Ex(i){let t=new Nt;t.position.set(Ft.x,0,Ft.z);let e=Ft.y0+Ft.h/2;t.add(z(new zn(Ft.w,Ft.h,Ft.d,5,.045),i.stainless,{pos:[0,e,0],cat:"shell"}));for(let x of[-.48,.3])t.add(z(pt(.05,Ft.h-.12,.018),i.stainless,{pos:[x,e,Ft.d/2+.009],cat:"shell"}));t.add(z(pt(Ft.w+.004,.012,Ft.d+.004),i.stainlessDark,{pos:[0,e+.18,0],cat:"shell"}));for(let x of[-.45,.45])t.add(z(pt(.1,Ft.y0,Ft.d+.14),i.primer,{pos:[x,Ft.y0/2,0],cat:"structure"}));let n=ze({w:512,h:256,bg:"#e8ebec",fg:"#1b2226",border:"#1b2226"});n.draw([{text:"FRESH WATER",y:70,size:46,weight:700},{text:"TANK T-03 \xB7 1 200 L",y:122,size:34},{text:"LEVEL LOOP LT-301 \xB7 4\u201320 mA",y:168,size:28,weight:500},{text:"SYNTHETIC INSTALLATION DATA",y:222,size:22,weight:700,color:"#a5561e"}]),t.add(z(new fe(.42,.21),new oe({map:n.texture,roughness:.55,metalness:.2}),{pos:[-.09,.86,Ft.d/2+.002],cat:"shell",cast:!1}));let s=[dn.x-Ft.x,Ft.top,dn.z-Ft.z];t.add(z(Yt(.05,.04),i.stainless,{pos:[s[0],s[1]+.02,s[2]],cat:"shell"})),t.add(z(Yt(.032,.035,6),i.stainlessDark,{pos:[s[0],s[1]+.055,s[2]],cat:"shell"}));let r=-.55;t.add(mi([[r,Ft.top,-.3],[r,Ft.top+.3,-.3],[r,Ft.top+.42,-.22],[r,Ft.top+.36,-.12]],.024,i.stainlessDark,{cat:"shell",segments:40})),t.add(z(Yt(.04,2.95-Ft.top),i.pipeBlue,{pos:[.05,(2.95+Ft.top)/2,-.3],cat:"shell"})),t.add(z(Yt(.065,.02),i.stainlessDark,{pos:[.05,Ft.top+.01,-.3],cat:"shell"})),t.add(z(Yt(.034,.2),i.stainlessDark,{pos:[-.35,.3,Ft.d/2+.1],rot:[Math.PI/2,0,0],cat:"shell"})),t.add(z(new Un(.055,24,16),i.stainless,{pos:[-.35,.3,Ft.d/2+.17],cat:"shell"})),t.add(z(pt(.16,.018,.03),i.red,{pos:[-.29,.37,Ft.d/2+.17],cat:"shell"}));let a=.6,o=Ft.d/2+.06;for(let x of[.24,1.12])t.add(z(Yt(.016,.07),i.stainlessDark,{pos:[a,x,Ft.d/2+.03],rot:[Math.PI/2,0,0],cat:"shell"}));t.add(z(Yt(.02,.9),i.glass,{pos:[a,.68,o],cat:"shell",cast:!1}));for(let x of[-.03,.03])t.add(z(Yt(.004,.9),i.stainlessDark,{pos:[a+x,.68,o+.02],cat:"shell"}));let l=Yt(.014,1,16);l.translate(0,.5,0);let c=z(l,new oe({color:2983101,roughness:.1,transparent:!0,opacity:.85}),{pos:[a,.24,o],cat:"fluid",cast:!1});t.add(c);let h=Ft.w-.06,d=Ft.d-.06,f=pt(h,1,d);f.translate(0,.5,0);let u=z(f,i.water,{pos:[0,Ft.y0+.02,0],cat:"fluid",cast:!1,receive:!1});u.renderOrder=2;let m=z(new fe(h,d,28,18),i.waterSurface,{rot:[-Math.PI/2,0,0],cat:"fluid",cast:!1});return m.renderOrder=3,t.add(u,m),{group:t,water:u,surface:m,glassWater:c,innerHeight:Ft.h-.06,glassSpan:.88}}function Tx(i){let t=new Nt;t.position.set(Ft.x-.25,Ft.top,Ft.z),t.add(z(Yt(.25,.03,48),i.stainless,{pos:[0,.015,0]})),t.add(z(Yt(.23,.025,48),i.stainless,{pos:[0,.042,0]}));let e=new qn(Yt(.012,.022,6),i.stainlessDark,12),n=new Zt;for(let s=0;s<12;s++){let r=s/12*Math.PI*2;n.makeTranslation(Math.cos(r)*.205,.064,Math.sin(r)*.205),e.setMatrixAt(s,n)}return e.castShadow=!0,t.add(e),t.add(z(new Ci(.06,.009,10,24,Math.PI),i.stainlessDark,{pos:[0,.055,0]})),t}function Ax(i){let t=new Nt;t.position.set(dn.x,0,dn.z);let e=.028,n=dn.bottom,s=new Nt;s.add(z(Yt(e,.17),i.stainless,{pos:[0,n+.045+.085,0]})),s.add(z(Yt(.012,.035,24,e),i.stainless,{pos:[0,n+.215+.0175,0]}));for(let c of[n+.07,n+.19])s.add(z(new Ci(e,.0015,6,32),i.stainlessDark,{pos:[0,c,0],rot:[Math.PI/2,0,0]}));let r=_l-(n+.25);s.add(z(Yt(.0075,r,12),i.cable,{pos:[0,n+.25+r/2,0],cat:"signal"}));let a=new Nt;a.position.y=n+.02,a.add(z(Yt(e+.003,.04),i.capPlastic));for(let c=0;c<6;c++){let h=c/6*Math.PI*2;a.add(z(Yt(.006,.012,10),i.black,{pos:[Math.cos(h)*(e+.001),-.004,Math.sin(h)*(e+.001)],rot:[0,-h,Math.PI/2]}))}let o=new Nt;o.position.y=n+.055,o.add(z(Yt(.022,.014),i.ceramic,{cat:"internal"})),o.add(z(Yt(.019,.002),i.diaphragm,{pos:[0,-.008,0],cat:"internal"}));let l=new Nt;return l.position.y=n+.13,l.add(z(pt(.032,.11,.003),i.pcb,{cat:"internal"})),l.add(z(pt(.012,.012,.003),i.chip,{pos:[0,.02,.003],cat:"internal"})),l.add(z(pt(.008,.006,.003),i.chip,{pos:[-.006,-.02,.003],cat:"internal"})),l.add(z(pt(.004,.004,.004),i.gold,{pos:[.009,-.035,.003],cat:"internal"})),t.add(s,a,o,l),t.scale.setScalar(1),{group:t,housing:s,cap:a,cell:o,pcb:l}}function Rx(i){let t=new Nt;t.position.set(sn.x,sn.y,sn.z),t.add(z(pt(.2,.2,.1),i.jb,{pos:[0,0,-.01]})),t.add(z(pt(.04,.04,.15),i.stainlessDark,{pos:[0,0,-.09]}));for(let r of[-.105,.105])t.add(z(Yt(.016,.03,16),i.black,{pos:[r,0,.03],rot:[0,0,Math.PI/2]}));let e=new Nt;for(let r=0;r<4;r++)e.add(z(pt(.012,.04,.03),r===1?i.termBlue:i.termGrey,{pos:[-.02+r*.013,0,0],cat:"internal"}));t.add(e);let n=new Nt;n.position.z=.05,n.add(z(pt(.21,.21,.02),i.jb));for(let[r,a]of[[-.085,-.085],[.085,-.085],[-.085,.085],[.085,.085]])n.add(z(Yt(.007,.006,12),i.stainlessDark,{pos:[r,a,.012],rot:[Math.PI/2,0,0]}));let s=ze({w:256,h:96,bg:"#f3d23a",fg:"#111"});return s.draw([{text:"JB-03",y:60,size:46,weight:800,align:"center"}]),n.add(z(new fe(.09,.034),new oe({map:s.texture,roughness:.6}),{pos:[0,.05,.011],cast:!1})),t.add(n),{group:t,lid:n,strip:e}}function Cx(i){let t=new Nt,e=(n,s)=>{let r=s-n,a=(n+s)/2;t.add(z(pt(r,.006,.13),i.stainlessDark,{pos:[a,cs.y,cs.z]}));for(let o of[-.065,.065])t.add(z(pt(r,.04,.004),i.stainlessDark,{pos:[a,cs.y+.02,cs.z+o]}));for(let o=n+.2;o<s;o+=.6)t.add(z(pt(.03,.03,.2),i.stainlessDark,{pos:[o,cs.y-.02,ea+.1]}))};return e(-.95,sn.x-.13),e(sn.x+.13,Re.x-.15),t}function Px(i){let t=dn.x,e=dn.z,n=cs.y+.02,s=cs.z,r=Re.x-.25,a=Re.y+Re.h/2;return[[t,_l,e],[t,_l+.25,e],[t,1.82,e-.12],[t,1.98,e-.55],[t+.05,n,s+.12],[t+.25,n,s],[sn.x-.3,n,s],[sn.x-.11,n,s],[sn.x,n-.01,s],[sn.x+.11,n,s],[sn.x+.4,n,s],[r-.3,n,s],[r-.04,n-.02,s],[r,n-.12,s],[r,a+.12,Re.z],[r,a,Re.z],[r,a-.08,Re.z-.05],[r,Re.y+.12,Re.z-.06],[r,Re.y+.02,Re.z-.06],[i.x-.04,i.y+.1,Re.z-.07],[i.x,i.y+.035,Re.z-.08]]}function Ix(i){let t=new Nt;t.position.set(Re.x,Re.y,Re.z);let{w:e,h:n,d:s}=Re,r=.015,a=new Nt;a.add(z(pt(e,n,r),i.cabinet,{pos:[0,0,-s/2+r/2]}));for(let Q of[-1,1])a.add(z(pt(r,n,s),i.cabinet,{pos:[Q*(e/2-r/2),0,0]}));for(let Q of[-1,1])a.add(z(pt(e,r,s),i.cabinet,{pos:[0,Q*(n/2-r/2),0]}));a.add(z(pt(e-.06,n-.06,.004),i.plate,{pos:[0,0,-s/2+r+.01]}));let o=-s/2+r+.012,l={upper:.27,lower:-.2};for(let Q of Object.values(l))a.add(z(pt(e-.1,.035,.0075),i.din,{pos:[0,Q,o+.004]}));for(let Q of[.43,.05,-.38])a.add(z(pt(e-.08,.06,.055),i.duct,{pos:[0,Q,o+.028]})),a.add(z(pt(e-.08,.064,.006),i.ductLid,{pos:[0,Q,o+.058]}));a.add(z(Yt(.016,.03,16),i.black,{pos:[-.25,n/2+.012,0]})),t.add(a);let c=o+.0075,h={},d=-.33,f=Q=>{let G=d+Q/2;return d+=Q,G},u=new Nt;u.position.set(f(.036),l.upper,c+.035),u.add(z(pt(.036,.09,.07),i.white,{cat:"electronics"})),u.add(z(pt(.012,.022,.016),i.black,{pos:[0,.006,.042],cat:"electronics"})),h.breaker=u,d+=.012;let m=ze({w:128,h:320,bg:"#d8dadb",fg:"#20262a",accent:"#20262a"}),x=new Nt;x.position.set(f(.05),l.upper,c+.055);let g=new oe({map:m.texture,roughness:.5});x.add(z(pt(.05,.125,.11),[i.psu,i.psu,i.psu,i.psu,g,i.psu],{cat:"electronics"}));let p=Hn(3997550);x.add(z(pt(.006,.004,.004),p.material,{pos:[.012,.045,.056],cast:!1}));for(let Q of[.068,-.068])for(let G=0;G<3;G++)x.add(z(pt(.012,.012,.02),i.siemensTerm,{pos:[-.016+G*.016,Q,.03],cat:"electronics"}));h.psu=x,d+=.03;let v=ze({w:440,h:400,bg:"#2b3034",fg:"#e6e9ea"});v.draw([{text:"SIEMENS",y:52,size:40,weight:800,color:"#00a5a5"},{text:"SIMATIC S7-1200",y:104,size:32},{text:"CPU 1214C",y:170,size:46,weight:700},{text:"DC/DC/DC",y:214,size:28,weight:500},{text:"synthetic model",y:370,size:22,weight:500,color:"#c49a3a"}]);let w=new Nt;w.position.set(f(.11),l.upper,c+.0375);let S=new oe({map:v.texture,roughness:.5});w.add(z(pt(.11,.1,.075),[i.siemens,i.siemens,i.siemens,i.siemens,S,i.siemens],{cat:"electronics"}));for(let Q of[.044,-.044])w.add(z(pt(.104,.014,.012),i.siemensTerm,{pos:[0,Q,.035],cat:"electronics"}));let T=Hn(3997550),E=Hn(16726832),_=Hn(16756736);[T,E,_].forEach((Q,G)=>w.add(z(pt(.008,.004,.003),Q.material,{pos:[-.045,.018-G*.009,.038],cast:!1}))),h.cpu=w,d+=.002;let M=ze({w:180,h:400,bg:"#2b3034",fg:"#e6e9ea"});M.draw([{text:"SM 1231",y:60,size:34,weight:700},{text:"AI 4\xD713 bit",y:100,size:24,weight:500},{text:"6ES7231-",y:330,size:21,weight:500},{text:"4HD32-0XB0",y:358,size:21,weight:500}]);let N=new Nt;N.position.set(f(.045),l.upper,c+.0375);let P=new oe({map:M.texture,roughness:.5});N.add(z(pt(.045,.1,.075),[i.siemens,i.siemens,i.siemens,i.siemens,P,i.siemens],{cat:"electronics"}));for(let Q of[.044,-.044])N.add(z(pt(.04,.014,.012),i.siemensTerm,{pos:[0,Q,.035],cat:"electronics"}));let D=Hn(16726832),O=[0,1,2,3].map(()=>Hn(3997550));N.add(z(pt(.007,.004,.003),D.material,{pos:[-.012,.02,.038],cast:!1})),O.forEach((Q,G)=>N.add(z(pt(.005,.003,.003),Q.material,{pos:[.004+G%2*.009,.02-Math.floor(G/2)*.007,.038],cast:!1}))),h.sm1231=N;let V=new Nt;V.position.set(-.04,l.lower,c+.0225),[i.termGrey,i.termGrey,i.termBlue,i.termBlue,i.termRed,i.termGrey,i.termGrey,i.termGrey,i.termGrey,i.termPE].forEach((Q,G)=>{V.add(z(pt(.0078,.055,.045),Q,{pos:[G*.0082,0,0],cat:"electronics"})),V.add(z(Yt(.0022,.003,8),i.stainlessDark,{pos:[G*.0082,.018,.0235],rot:[Math.PI/2,0,0],cat:"electronics"}))}),V.add(z(pt(.012,.05,.04),i.termGrey,{pos:[-.01,0,0]})),h.terminals=V;let X=ze({w:384,h:128,bg:"#f2f2f0",fg:"#111"});X.draw([{text:"+A1  LEVEL MONITORING",y:56,size:30,weight:700},{text:"24 V DC \xB7 T-03 / LT-301",y:100,size:24,weight:500}]);let q=new Nt;q.position.set(-e/2,0,s/2);let H=new Nt;return H.position.x=e/2,H.add(z(pt(e,n,.018),i.cabinet,{pos:[0,0,.009]})),H.add(z(pt(.025,.1,.03),i.black,{pos:[e/2-.05,0,.033]})),H.add(z(new fe(.24,.08),new oe({map:X.texture,roughness:.6}),{pos:[0,.38,.019],cast:!1})),H.add(z(pt(.22,.3,.02),i.ductLid,{pos:[0,-.1,-.01]})),q.add(H),q.rotation.y=-1.92,h.door=q,Object.values(h).forEach(Q=>t.add(Q)),{group:t,parts:h,psuPlate:m,leds:{psuLed:p,cpuRun:T,cpuErr:E,cpuMaint:_,smDiag:D,smCh:O},terminalWorld:()=>V.localToWorld(new R(.0082,0,.02)),smWorld:()=>N.localToWorld(new R(0,-.05,.03)),psuWorld:()=>x.localToWorld(new R(0,-.062,.03))}}function Lx(i){let t=new Nt;t.position.set(-.05,0,.75),t.rotation.y=-.35,t.add(z(pt(.5,.012,.32),i.crate,{pos:[0,.006,0]}));for(let s of[-1,1])t.add(z(pt(.5,.11,.012),i.crate,{pos:[0,.055,s*.154]})),t.add(z(pt(.012,.11,.32),i.crate,{pos:[s*.244,.055,0]}));t.add(z(pt(.47,.04,.29),i.foam,{pos:[0,.032,0]}));let e=new Nt;e.position.set(-.06,.07,.02),e.add(z(Yt(.021,.17),i.stainless,{rot:[0,0,Math.PI/2]})),e.add(z(Yt(.023,.03),i.capPlastic,{pos:[-.1,0,0],rot:[0,0,Math.PI/2]})),e.add(z(new Ci(.065,.006,8,40),i.cable,{pos:[.14,-.012,0],rot:[Math.PI/2,0,0]})),e.add(z(new Ci(.055,.006,8,40),i.cable,{pos:[.14,-.002,0],rot:[Math.PI/2,0,0]}));let n=ze({w:384,h:128,bg:"#fafafa",fg:"#222",border:"#c0392b"});return n.draw([{text:"REFERENCE \xB7 REMOVED",y:52,size:28,weight:800,color:"#c0392b"},{text:"WIKA LS-10 \xB7 4\u201320 mA",y:98,size:26,weight:600}]),e.add(z(new fe(.15,.05),new oe({map:n.texture,roughness:.7}),{pos:[.02,.025,.06],rot:[-Math.PI/2,0,0],cast:!1})),t.add(e),{group:t,wika:e}}function Qd(){let i=oh(),t=wx(i),e=Ex(i),n=Tx(i),s=Ax(i),r=Rx(i),a=Cx(i),o=Ix(i),l=Lx(i),c=new Nt;c.add(t,e.group,n,s.group,r.group,a,o.group,l.group),c.updateMatrixWorld(!0);let h=o.terminalWorld(),d=mi(Px(h),.0085,i.cable,{cat:"signal",segments:500,tension:.1}),f=o.smWorld(),u=o.psuWorld(),m=mi([[h.x+.0082,h.y+.03,h.z],[h.x+.01,h.y+.12,h.z+.01],[f.x,f.y-.12,f.z+.012],[f.x,f.y,f.z]],.0025,i.wireRed,{cat:"signal",segments:60}),x=mi([[h.x+.0164,h.y+.03,h.z],[h.x+.02,h.y+.12,h.z+.012],[f.x+.008,f.y-.12,f.z+.014],[f.x+.008,f.y,f.z]],.0025,i.wireBlue,{cat:"signal",segments:60}),g=mi([[u.x,u.y,u.z],[u.x,u.y-.12,u.z+.01],[h.x-.01,h.y+.12,h.z+.012],[h.x+.008,h.y+.03,h.z]],.0025,i.wireRed,{cat:"signal",segments:60}),p=new Nt;p.add(d,m,x,g),c.add(p);let v=new Zi;v.add(new Yn(new R(dn.x,dn.bottom+.25,dn.z),new R(dn.x,_l,dn.z))),v.add(d.userData.curve),v.add(m.userData.curve);let w={tank:{object:e.group,name:"Freshwater tank T-03",role:"Stainless storage tank \xB7 1 200 L",cat:"shell",color:"#5fd4d0",explode:[-.45,0,.1],specs:[["Capacity","1 200 L","synthetic"],["Level loop","LT-301 \xB7 4\u201320 mA","synthetic"],["Material","To confirm","pending"]]},manhole:{object:n,parent:"tank",name:"Manhole cover",role:"Bolted inspection cover \xB7 12 \xD7 M12",cat:"shell",color:"#5fd4d0",explode:[0,.75,0],specs:[["Fasteners","12 bolts","synthetic"]]},probe:{object:s.group,name:"Waterpilot FMX11 (candidate)",role:"Endress+Hauser hydrostatic level probe \xB7 2-wire 4\u201320 mA",cat:"shell",color:"#ffd166",explode:[.35,.35,1.05],specs:[["Output","4\u201320 mA, 2-wire","oem","EH-TI01524P"],["Min. terminal voltage","8 V","oem","EH-TI01524P"],["Design current","22 mA","oem","EH-TI01524P"],["Max. load","(V \u2212 8 V) / 0.022 A","oem","EH-TI01524P"],["Order code / range","Not confirmed","pending"]]},"probe-cap":{object:s.cap,parent:"probe",name:"Protective cap",role:"Removable inlet cap",cat:"shell",color:"#ffd166",explode:[0,-.16,0],specs:[["Material","To confirm","pending"]]},"probe-cell":{object:s.cell,parent:"probe",name:"Ceramic measuring cell",role:"Hydrostatic pressure sensor + diaphragm",cat:"internal",color:"#ffd166",explode:[.08,-.08,0],specs:[["Principle","Hydrostatic pressure","oem","EH-TI01524P"],["Range","Not confirmed","pending"]]},"probe-pcb":{object:s.pcb,parent:"probe",name:"Signal electronics",role:"Converts pressure to a 4\u201320 mA loop current",cat:"internal",color:"#ffd166",explode:[-.09,.04,0],specs:[["Loop current","live","live"]]},jb:{object:r.group,name:"Junction box JB-03",role:"Field junction \xB7 terminal strip",cat:"electronics",color:"#ffb347",explode:[0,0,.3],specs:[["Additional series load","live","synthetic"]]},"jb-lid":{object:r.lid,parent:"jb",name:"JB-03 lid",role:"4-screw cover",cat:"electronics",color:"#ffb347",explode:[0,0,.22],specs:[]},tray:{object:a,name:"Cable tray",role:"Perforated tray along the bulkhead",cat:"structure",color:"#8ea2a9",explode:[0,.3,0],specs:[]},cabinet:{object:o.group,name:"Control cabinet +A1",role:"Level monitoring enclosure",cat:"shell",color:"#5fd4d0",explode:[.35,0,0],specs:[["Enclosure","800 \xD7 1000 \xD7 300 mm","synthetic"]]},door:{object:o.parts.door,parent:"cabinet",name:"Cabinet door",role:"Hinged door with drawing pocket",cat:"shell",color:"#5fd4d0",explode:[-.4,0,.35],specs:[]},breaker:{object:o.parts.breaker,parent:"cabinet",name:"Circuit breaker F1",role:"Loop supply protection",cat:"electronics",color:"#ffb347",explode:[-.05,.08,.3],specs:[["Rating","To confirm","pending"]]},psu:{object:o.parts.psu,parent:"cabinet",name:"Loop power supply G1",role:"DIN-rail DC supply for the 4\u201320 mA loop",cat:"electronics",color:"#ffb347",explode:[-.02,.1,.4],specs:[["Output","live","synthetic"]]},cpu:{object:o.parts.cpu,parent:"cabinet",name:"SIMATIC S7-1200 CPU",role:"PLC controller (model not in evidence)",cat:"electronics",color:"#ffb347",explode:[0,.12,.5],specs:[["Model","CPU 1214C (synthetic)","synthetic"]]},sm1231:{object:o.parts.sm1231,parent:"cabinet",name:"SM 1231 AI \xB7 6ES7231-4HD32-0XB0",role:"Analog input module \xB7 channel AI0 in 4\u201320 mA mode",cat:"electronics",color:"#ffb347",explode:[.1,.12,.62],specs:[["Mode","4\u201320 mA","oem","SIEMENS-SM1231"],["Input impedance","\u2265 270 \u03A9, < 290 \u03A9","oem","SIEMENS-SM1231"],["Evaluated bound","290 \u03A9","oem","SIEMENS-SM1231"],["Nominal range","0 \u2013 27 648","oem","SIEMENS-SM1231"],["Wire-break diagnostic","Qualitative","oem","SIEMENS-SM1231"]]},terminals:{object:o.parts.terminals,parent:"cabinet",name:"Terminal blocks X1",role:"Field-to-PLC marshalling",cat:"electronics",color:"#ffb347",explode:[0,-.12,.35],specs:[]},cabling:{object:p,name:"Loop cabling",role:"Shielded 2-core field cable + internal wiring",cat:"signal",color:"#6fe3a1",explode:[0,0,0],specs:[["Resistance","Included in synthetic load","synthetic"]]},wika:{object:l.group,name:"WIKA LS-10 (reference, removed)",role:"Original level transmitter being replaced",cat:"shell",color:"#c9d1d4",explode:[0,.45,.2],specs:[["Output","4\u201320 mA","oem","WIKA-LS10"],["Installed variant","Not confirmed","pending"]]}};for(let S of Object.values(w).reverse())S.object.traverse(T=>{T.isMesh&&!T.userData.cat&&(T.userData.cat=S.cat)});return{root:c,room:t,parts:w,loopPath:v,dynamic:{water:e.water,surface:e.surface,glassWater:e.glassWater,innerHeight:e.innerHeight,glassSpan:e.glassSpan,psuPlate:o.psuPlate,leds:o.leds,jbStrip:r.strip},anchors:{tank:new R(0,Ft.top+.12,0),probe:new R(0,dn.bottom+.3,0),jb:new R(0,.13,0),psu:new R(0,.08,.05),sm1231:new R(0,.07,.04),wika:new R(0,.14,0)},jbWorld:new R(sn.x,sn.y,sn.z+.02)}}var Dx={overview:{pos:[2.5,2.35,4.1],target:[.05,1,-.45]},probe:{pos:[-.25,1.15,1.25],target:[-.85,.55,-.1]},cabinet:{pos:[1.35,1.38,.15],target:[1.55,1.22,-1.3]}},lh={nominal:{color:"#59ffe0"},empty_tank:{color:"#8fd8ff"},outside_load_envelope:{color:"#ff5a36"},open_circuit:{color:"#ff5a36"}},xl=class extends Zs{constructor(t,e={}){super(t,Qd(),{...e,presets:Dx});let n=this.scene,s=this.model;this.plant=s,n.add(new ji(14674175,3091494,.45));let r=new Ki(16774116,2.1);r.position.set(2.6,4.6,3.2),r.castShadow=!0,r.shadow.mapSize.set(2048,2048),Object.assign(r.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.5,far:14}),r.shadow.bias=-4e-4,r.shadow.normalBias=.02,n.add(r);for(let[c,h]of[[-1.6,-.9],[1.2,-.9],[-1.6,.5],[1.2,.5]]){let d=new On(16773336,2.6,7,2);d.position.set(c,2.7,h),n.add(d)}this.N=110;let a=new Nn({color:lh.nominal.color,transparent:!0,opacity:.95,blending:es,depthWrite:!1,toneMapped:!1}),o=a.clone();o.opacity=.18,this.flowCore=new qn(new Un(.0105,10,8),a,this.N),this.flowHalo=new qn(new Un(.026,10,8),o,this.N),this.flowCore.frustumCulled=this.flowHalo.frustumCulled=!1,n.add(this.flowCore,this.flowHalo),this.flowOffset=0,this.flowSpeed=0,this.spark=new ue(new Un(.018,12,10),new Nn({color:16752704,toneMapped:!1})),this.spark.position.copy(s.jbWorld),this.sparkLight=new On(16742954,0,1.6,2),this.sparkLight.position.copy(s.jbWorld).add(new R(0,0,.12)),n.add(this.spark,this.sparkLight);let l=s.dynamic.surface.geometry.attributes.position;this.waveBase=Float32Array.from(l.array),this.level=.5,this.levelTarget=.5,this.state="nominal"}setPartVisible(t,e){this.parts[t]&&(this.parts[t].object.visible=e)}applyReport(t){let e=t.simulation,n=t.load_check.status==="pass";this.state=e.state,e.level_fraction!==null&&(this.levelTarget=e.level_fraction);let s=e.loop_signal_ma;this.flowSpeed=e.state==="open_circuit"?0:e.state==="outside_load_envelope"?.018:.012+s*.0048;let r=(lh[e.state]||lh.nominal).color;this.flowCore.material.color.set(r),this.flowHalo.material.color.set(r);let a=t.inputs.supply_v;this.model.dynamic.psuPlate.draw([{text:"POWER",y:80,size:22,weight:700,color:"#d8dadb"},{text:`${a} V`,y:150,size:40,weight:800},{text:"DC",y:186,size:24,weight:600},{text:"DC OK \u25CF",y:300,size:18,weight:600}]);let o=this.model.dynamic.leds;o.psuLed.on(1),o.cpuRun.on(1),o.cpuErr.on(!n||e.state==="open_circuit"?1:0),o.cpuMaint.on(0),o.smCh.forEach((h,d)=>h.on(d===0&&(e.state==="nominal"||e.state==="empty_tank")?1:0)),this.blinkDiag=e.state==="open_circuit"||e.state==="outside_load_envelope",this.blinkDiag||o.smDiag.on(0);let l=(...h)=>this.setLabel(...h),c=t.inputs.synthetic_additional_series_ohm;l("psu","G1 \xB7 Loop supply",`${a} V DC`,n?"ok":"fail"),l("jb","JB-03",e.state==="open_circuit"?"WIRE BREAK":`+${c} \u03A9 series (synthetic)`,e.state==="open_circuit"?"fail":""),l("wika","WIKA LS-10","Reference \xB7 removed"),this.report=t}updateLive(t){if(!this.report)return;let e=t.state,n=e==="open_circuit"||e==="outside_load_envelope",s=t.ma===null?"suppressed":`${t.ma.toFixed(2)} mA`,r=(...o)=>this.setLabel(...o);r("probe","FMX11 \xB7 LT-301",s,n?"fail":"ok"),r("tank","Tank T-03",`Level ${(t.level*100).toFixed(1)} % (physical)`);let a=e==="open_circuit"?"DIAG \xB7 wire break":t.count===null?"Reading suppressed":`AI0 = ${t.count}`;r("sm1231","SM 1231 \xB7 AI0",a,n?"fail":"ok")}tick(t,e){let n=this.model.dynamic;this.level+=(this.levelTarget-this.level)*Math.min(1,t*.8);let s=Math.max(.001,this.level*(Ft.h-.06));n.water.scale.y=s,n.water.visible=n.surface.visible=this.level>.004,n.surface.position.y=Ft.y0+.02+s;let r=n.surface.geometry.attributes.position;for(let c=0;c<r.count;c++){let h=this.waveBase[c*3],d=this.waveBase[c*3+1];r.array[c*3+2]=Math.sin(h*9+e*1.7)*.0035+Math.cos(d*12-e*1.3)*.0028}r.needsUpdate=!0,n.surface.geometry.computeVertexNormals();let a=Ft.y0+.02+s;n.glassWater.scale.y=Math.max(5e-4,Math.min(.88,a-.24));let o=this.flowSpeed>0&&this.explode<.02;if(this.flowCore.visible=this.flowHalo.visible=o,o){this.flowOffset=(this.flowOffset+t*this.flowSpeed)%1;let c=this.state==="outside_load_envelope",h=c?Math.random()>.5?1:.2:1;this.flowCore.material.opacity=.95*h,this.flowHalo.material.opacity=.18*h;for(let d=0;d<this.N;d++){let f=(d/this.N+this.flowOffset)%1,u=this.model.loopPath.getPointAt(f);c&&u.addScalar((Math.random()-.5)*.006),this.tmp.makeTranslation(u.x,u.y,u.z),this.flowCore.setMatrixAt(d,this.tmp),this.flowHalo.setMatrixAt(d,this.tmp)}this.flowCore.instanceMatrix.needsUpdate=!0,this.flowHalo.instanceMatrix.needsUpdate=!0}let l=this.state==="open_circuit"&&this.explode<.02;this.spark.visible=l&&Math.random()>.35,this.spark.scale.setScalar(.6+Math.random()*.9),this.sparkLight.intensity=l?Math.random()>.6?2+Math.random()*4:.3:0,this.blinkDiag&&this.model.dynamic.leds.smDiag.on(Math.sin(e*8)>0?1:.05)}};var K=i=>i/1e3,rn={x:-.03,y0:1.282,z:.031},hs={x:.3,y:1.66,z:0},us={x:.64,y:1.43,z:0};function Gn(i,t,e={}){let n=i.map(([s,r])=>new gt(K(s),K(r)));return z(new Er(n,e.segments??72),t,e)}function ch(i,t,e,{repeat:n=[1,1],srgb:s=!0}={}){let r=document.createElement("canvas");r.width=i,r.height=t,e(r.getContext("2d"),i,t);let a=new Yi(r);return a.wrapS=a.wrapT=Ei,a.repeat.set(...n),a.anisotropy=8,s&&(a.colorSpace=Fe),a}function Nx(){return ch(512,256,(i,t,e)=>{i.fillStyle="#fff",i.fillRect(0,0,t,e),i.fillStyle="#000";let n=16;for(let s=0;s<5;s++)for(let r=0;r<n;r++){let a=(r+s%2*.5)*(t/n)+6,o=22+s*46;i.beginPath(),i.roundRect(a,o,t/n-14,26,10),i.fill()}},{srgb:!1})}function tf(i){return ch(256,512,(t,e,n)=>{t.fillStyle="#1d6b3f",t.fillRect(0,0,e,n),t.strokeStyle="rgba(215,190,90,0.55)",t.lineWidth=5;for(let s=0;s<9;s++)t.beginPath(),t.moveTo(20+s*24,n),t.lineTo(20+s*24,n*.62-s*6),t.lineTo(e*.5,n*.4-s*12),t.stroke();t.fillStyle="#e8e2c8",t.font="600 26px Helvetica, Arial",t.fillText(i==="dip"?"THT-02 ADDR":"RS485 \xB7 LDO",20,40),t.fillText("SW1",30,120),t.fillStyle="#c9a646";for(let s=0;s<6;s++)t.fillRect(28+s*36,n-34,20,20)})}function Ux(){return ch(512,512,(i,t,e)=>{i.fillStyle="#c9cec6",i.fillRect(0,0,t,e);for(let n=0;n<2600;n++)i.fillStyle=`rgba(0,0,0,${Math.random()*.05})`,i.fillRect(Math.random()*t,Math.random()*e,2,2);i.strokeStyle="rgba(80,80,70,0.35)",i.lineWidth=3,i.beginPath(),i.moveTo(0,e*.33),i.lineTo(t,e*.33),i.stroke();for(let n=0;n<40;n++)i.fillStyle=`rgba(120,60,30,${Math.random()*.12})`,i.beginPath(),i.arc(Math.random()*t,e-Math.random()*60,3+Math.random()*10,0,Math.PI*2),i.fill()},{repeat:[3,2]})}function Ox(i,t){let e=new Nt;e.position.set(rn.x,rn.y0,rn.z);let n=new Nt,s=z(new Ri(K(8),K(8),K(28),72,1,!0),t.strainer,{pos:[0,K(16),0]}),r=Gn([[0,0],[6.8,0],[7.8,.6],[8,1.6],[8,2],[0,2]],i.stainless),a=Gn([[0,30],[8,30],[8,32],[0,32]],i.stainless),o=z(new Ri(K(6.6),K(6.6),K(27),48,1,!0),t.membrane,{pos:[0,K(16),0],cast:!1}),l=Gn([[7.6,32],[8.05,32.4],[8.25,35],[8.05,37.6],[7.6,38]],t.rubber),c=Gn([[0,37.8],[7.6,37.8],[8,38.4],[8,67.4],[8.4,68],[9,68.6],[9,77.6],[8.6,78],[7.4,78],[7.4,38.2],[0,38.2]],t.barrel);n.add(s,r,a,o,l,c);for(let T of[52,53])n.add(Gn([[8.01,T],[8.06,T+.2],[8.01,T+.4]],i.stainlessDark,{cast:!1}));let h=new Nt;h.add(z(pt(K(7),K(14),K(1)),t.pcbDip,{pos:[0,K(12),0],cat:"internal"})),h.add(z(pt(K(2.5),K(2.5),K(.9)),i.chip,{pos:[0,K(7),K(.9)],cat:"internal"})),h.add(z(pt(K(2.6),K(1),K(.2)),i.white,{pos:[0,K(7),K(1.4)],cat:"internal"})),n.add(h);let d=new Nt,f=Gn([[0,70],[7.2,70],[7.2,78.2],[0,78.2]],i.stainlessDark);d.add(f);for(let T=70.6;T<78;T+=.9)d.add(Gn([[7.15,T],[7.55,T+.35],[7.15,T+.7]],i.stainless,{cast:!1,segments:48}));d.add(Gn([[7.4,78],[8.6,78],[9,78.4],[9,87.4],[8.6,88],[8,88.4],[8,121.4],[7.6,122],[0,122],[0,78]],t.barrel)),d.add(Gn([[8.6,77.95],[9.02,78.1],[9.02,78.4],[8.6,78.2]],i.black,{cast:!1}));let u=z(new zn(K(42),K(20),K(2),2,K(1.2)),i.stainless,{pos:[0,K(80),K(-17)]});d.add(u,z(pt(K(8),K(14),K(9)),i.stainless,{pos:[0,K(80),K(-11.5)]}));for(let T of[-16,16]){d.add(z(Yt(K(3.6),K(2.2),24),i.stainlessDark,{pos:[K(T),K(80),K(-15.4)],rot:[Math.PI/2,0,0]}));let E=z(pt(K(4.4),K(.7),K(.6)),i.black,{pos:[K(T),K(80),K(-14.2)],rot:[0,0,T>0?.5:-.3],cast:!1});d.add(E)}d.add(z(pt(K(10),K(4),K(.05)),t.laser,{pos:[0,K(104),K(8.02)],cast:!1}));let m=new Nt;m.add(z(Yt(K(8.6),K(7),6),t.nickel,{pos:[0,K(126),0]})),m.add(Gn([[0,129.4],[7.75,129.4],[7.75,131],[6.6,135],[4.2,138.6],[3.2,140],[0,140]],t.rubber)),m.add(Gn([[2.7,139.5],[2.7,141],[0,141]],t.rubber,{cast:!1}));let x=new Nt,g=z(pt(K(11),K(36),K(1.2)),t.pcbDip,{pos:[0,K(56),0]});x.add(g);let p=z(pt(K(6),K(21.5),K(3)),t.dipBody,{pos:[0,K(55),K(2.1)]});x.add(p),x.add(z(pt(K(3),K(1.6),K(.1)),t.onMark,{pos:[K(-1.4),K(66.6),K(3.62)],cast:!1}));let v=[];for(let T=0;T<8;T++){let E=K(64-T*2.54-.4);x.add(z(pt(K(4.2),K(1.3),K(.2)),i.black,{pos:[0,E,K(3.62)],cast:!1}));let _=z(pt(K(1.6),K(1.15),K(1)),t.slider,{pos:[K(1.1),E,K(3.9)]});_.userData.dip=T,v.push(_),x.add(_)}x.add(z(pt(K(1.2),K(1.2),K(.2)),i.gold,{pos:[K(-4.2),K(40),K(.65)],cast:!1}));let w=new Nt;return w.add(z(pt(K(11),K(30),K(1.2)),t.pcbRs,{pos:[0,K(105),0]})),w.add(z(pt(K(4),K(5),K(1.5)),i.chip,{pos:[K(-1.5),K(108),K(1.3)]})),w.add(z(pt(K(3.5),K(4),K(1.6)),i.chip,{pos:[K(2),K(98),K(1.3)]})),w.add(z(pt(K(1.6),K(.9),K(.9)),i.ceramic,{pos:[K(2.5),K(110),K(1)]})),[t.wireRed,t.wireBlack,t.wireYellow,t.wireGreen].forEach((T,E)=>{let _=K(-3+E*2);w.add(mi([[_,K(118),K(.7)],[_*.6,K(124),K(.5)],[_*.3,K(136),0],[_*.2,K(146),0]],K(.55),T,{segments:24,cat:"signal"}))}),e.add(n,d,m,x,w),{group:e,head:n,body:d,gland:m,dip:x,rs:w,sht:h,sliders:v}}function Fx(i,t){let e=new Nt;e.add(z(new fe(4.2,2.6),t.bulkhead,{pos:[.2,1.4,0],cast:!1})),e.add(z(new fe(4.2,2.6),i.floor,{rot:[-Math.PI/2,0,0],pos:[.2,.1,1.3],cast:!1}));for(let a of[-.75,1.15])e.add(z(pt(.012,2.6,.14),t.frame,{pos:[a,1.4,.07]})),e.add(z(Yt(.016,2.6,16),t.frame,{pos:[a,1.4,.14]}));e.add(z(pt(4.2,.012,.16),t.frame,{pos:[.2,2.42,.08]}));let n=ze({w:256,h:128,bg:"#c9cec6",fg:"#3b3f3a"});n.draw([{text:"FR 42",y:88,size:72,weight:800,align:"center"}]),e.add(z(new fe(.2,.1),new oe({map:n.texture,roughness:.8}),{pos:[-.42,2.12,.002],cast:!1}));let s=ze({w:512,h:160,bg:"#f2c230",fg:"#111"});s.draw([{text:"SWITCHBOARD VENT \xB7 SENSOR ZONE",y:70,size:34,weight:800,align:"center"},{text:"Do not paint over sensors",y:125,size:28,weight:600,align:"center"}]),e.add(z(new fe(.26,.08),new oe({map:s.texture,roughness:.6}),{pos:[.3,2,.002],cast:!1}));let r=new Nt;r.add(z(pt(3.6,.006,.22),i.stainlessDark,{pos:[.2,1.9,.18]}));for(let a of[.07,.29])r.add(z(pt(3.6,.05,.006),i.stainlessDark,{pos:[.2,1.925,a]}));for(let a=-1.4;a<1.8;a+=.6)r.add(z(pt(.02,.1,.24),i.stainlessDark,{pos:[a,1.95,.18]}));[[.11,.012,i.cable],[.14,.009,t.greyCable],[.17,.014,i.cable],[.205,.008,t.orangeCable],[.24,.011,i.cable]].forEach(([a,o,l])=>r.add(z(Yt(o,3.6,16),l,{pos:[.2,1.906+o,a],rot:[0,0,Math.PI/2]}))),e.add(r);for(let[a,o]of[[.55,i.pipeBlue],[.75,t.pipeGrey]])e.add(z(Yt(.04,4.2,28),o,{pos:[.2,a,.16],rot:[0,0,Math.PI/2]}));return e.add(z(pt(1.2,.05,.14),i.white,{pos:[.2,2.55,.6]})),e.add(z(pt(1.12,.012,.09),i.lamp,{pos:[.2,2.524,.6],cast:!1})),e.traverse(a=>{a.isMesh&&(a.userData.cat="structure")}),e}function Bx(i,t){let e=new Nt;e.position.set(rn.x+.035,1.355,0),e.add(z(new zn(.17,.2,.006,2,.004),i.stainless,{pos:[0,0,.003]}));for(let[o,l]of[[-.075,.09],[.075,.09],[-.075,-.09],[.075,-.09]])e.add(z(Yt(.004,.004,16),i.stainlessDark,{pos:[o,l,.007],rot:[Math.PI/2,0,0]}));let n=ze({w:512,h:360,bg:"#e9ebe6",fg:"#1b1d1f",border:"#2b2f31"}),s=t.map((o,l)=>({text:o,y:60+l*52,size:l===0?44:l===t.length-1?22:26,weight:l===0?800:600,x:30,color:l===t.length-1?"#a3261b":void 0}));n.draw(s);let r=z(new fe(.075,.053),new oe({map:n.texture,roughness:.45,metalness:.3}),{pos:[.04,-.035,.0064],cast:!1});e.add(r);for(let[o,l]of[[.006,-.009],[.074,-.009],[.006,-.061],[.074,-.061]])e.add(z(Yt(.0015,.001,12),i.stainlessDark,{pos:[o,l,.0068],rot:[Math.PI/2,0,0],cast:!1}));let a=ze({w:512,h:96,bg:"#1d3e66",fg:"#ffffff"});return a.draw([{text:"BOAT-ER-TH-02",y:64,size:50,weight:800,align:"center"}]),e.add(z(new fe(.075,.014),new oe({map:a.texture,roughness:.5}),{pos:[.04,.03,.0064],cast:!1})),{group:e,faceWorld:new R(rn.x+.075,1.32,.03)}}function kx(i,t){let e=new Nt;e.position.set(hs.x,hs.y,hs.z);let n=z(new zn(.16,.12,.06,3,.006),t.polyGrey,{pos:[0,0,.03]});e.add(n);let s=new Nt;s.position.set(0,0,.061),s.add(z(new zn(.162,.122,.012,3,.005),t.polyGrey));for(let[l,c]of[[-.07,.05],[.07,.05],[-.07,-.05],[.07,-.05]])s.add(z(Yt(.004,.003,16),i.stainlessDark,{pos:[l,c,.007],rot:[Math.PI/2,0,0]}));let r=ze({w:512,h:128,bg:"#f4f4f0",fg:"#111"});r.draw([{text:"JB-ER-07",y:62,size:56,weight:800,align:"center"},{text:"RS-485 SEG B",y:110,size:30,weight:600,align:"center"}]),s.add(z(new fe(.08,.02),new oe({map:r.texture,roughness:.6}),{pos:[0,.025,.0062],cast:!1})),e.add(s);let a=new Nt;[i.termRed,i.black,t.termYellow,t.termGreen,i.termGrey,i.termGrey].forEach((l,c)=>a.add(z(pt(.0062,.04,.03),l,{pos:[-.018+c*.0068,0,.022]}))),a.add(z(pt(.11,.035,.0075),i.din,{pos:[0,0,.004]})),e.add(a);for(let l of[-.04,0,.04])e.add(z(Yt(.007,.016,6),t.polyDark,{pos:[l,-.067,.03]}));return e.add(z(Yt(.007,.016,6),t.polyDark,{pos:[.087,-.02,.03],rot:[0,0,Math.PI/2]})),{group:e,lid:s,cableIn:new R(hs.x-.04,hs.y-.075,.03),trunkOut:new R(hs.x+.095,hs.y-.02,.03)}}function zx(i,t){let e=new Nt;e.position.set(us.x,us.y,us.z),e.add(z(new zn(.2,.17,.012,2,.004),i.cabinet,{pos:[0,0,.006]})),e.add(z(pt(.18,.035,.0075),i.din,{pos:[0,-.01,.016]}));let n=z(new zn(.106,.09,.058,3,.004),t.polyLight,{pos:[0,-.01,.048]});e.add(n);let s=ze({w:512,h:256,bg:"#0b1e14",fg:"#7dffb0"}),r=z(new fe(.062,.031),new Nn({map:s.texture,toneMapped:!1}),{pos:[-.012,.004,.0775],cast:!1});r.material.userData.keep=!0,e.add(z(pt(.068,.037,.002),i.black,{pos:[-.012,.004,.0767],cast:!1}),r);let a=ze({w:512,h:80,bg:"#d9dcdf",fg:"#2a2e31"});a.draw([{text:"MODBUS MASTER \xB7 SYNTHETIC",y:54,size:36,weight:800,align:"center"}]),e.add(z(new fe(.09,.014),new oe({map:a.texture,roughness:.6}),{pos:[0,-.04,.0772],cast:!1}));let o={pwr:Hn(4063098),tx:Hn(4063098),rx:Hn(16756782),err:Hn(16724016)};Object.values(o).forEach((c,h)=>e.add(z(Yt(.0022,.002,16),c.material,{pos:[.033,.017-h*.009,.0775],rot:[Math.PI/2,0,0],cast:!1})));let l=ze({w:128,h:256,bg:"#d9dcdf",fg:"#2a2e31"});l.draw(["PWR","TX","RX","ERR"].map((c,h)=>({text:c,y:50+h*58,size:34,weight:700,x:10}))),e.add(z(new fe(.012,.038),new oe({map:l.texture}),{pos:[.044,.004,.0772],cast:!1}));for(let c=0;c<4;c++)e.add(z(pt(.008,.01,.012),t.termGreen,{pos:[-.04+c*.01,-.06,.05]}));return{group:e,lcd:s,leds:o,port:new R(us.x-.04,us.y-.066,.05)}}function ef(i){let t=oh(),e=(w,S,T,E={})=>new oe({color:w,roughness:S,metalness:T,...E}),n=gl(205),s={strainer:new oe({color:12109008,metalness:.9,roughness:.3,map:n,alphaMap:Nx(),alphaTest:.5,side:Ne}),membrane:e(15987694,.9,0,{side:Ne}),barrel:new Zn({color:13226198,metalness:.92,roughness:.24,map:n,clearcoat:.2}),nickel:e(12172476,.32,.95),rubber:e(1447962,.8,.02),laser:e(7172984,.6,.5),pcbDip:e(16777215,.55,.1,{map:tf("dip")}),pcbRs:e(16777215,.55,.1,{map:tf("rs")}),dipBody:e(12592685,.45,.05),onMark:e(16777215,.5,0),slider:e(16053487,.35,.02),wireRed:e(12593194,.5,.05),wireBlack:e(1315860,.5,.05),wireYellow:e(15254044,.5,.05),wireGreen:e(3119946,.5,.05),termYellow:e(14727198,.6,.05),termGreen:e(3115589,.6,.05),polyGrey:e(10397354,.5,.05),polyDark:e(3027767,.6,.05),polyLight:e(14672612,.45,.05),greyCable:e(9080722,.6,.05),orangeCable:e(13656094,.6,.05),pipeGrey:e(9146774,.5,.4),frame:e(12172982,.7,.25),bulkhead:e(16777215,.8,.12,{map:Ux()})};for(let w of[t.stainless,t.stainlessDark,t.black,s.barrel,s.rubber,s.nickel])w.side=Ne;let r=Fx(t,s),a=Ox(t,s),o=Bx(t,i),l=kx(t,s),c=zx(t,s),h=new Nt;h.add(r,o.group,a.group,l.group,c.group),h.updateMatrixWorld(!0);let d=new R(rn.x,rn.y0+K(141),rn.z),f=mi([[d.x,d.y,d.z],[d.x,d.y+.05,d.z+.004],[d.x+.06,d.y+.13,.03],[l.cableIn.x-.02,l.cableIn.y-.06,.03],[l.cableIn.x,l.cableIn.y-.012,.03],[l.cableIn.x,l.cableIn.y+.01,.03]],K(2.5),t.cable,{cat:"signal",segments:160,tension:.3}),u=mi([[l.trunkOut.x,l.trunkOut.y,.03],[l.trunkOut.x+.06,l.trunkOut.y-.01,.034],[c.port.x-.05,c.port.y-.05,.05],[c.port.x,c.port.y-.02,.05],[c.port.x,c.port.y+.004,.05]],K(3.2),s.greyCable,{cat:"signal",segments:140,tension:.3}),m=new Nt;m.add(f,u),h.add(m);for(let w of[f,u])for(let S=.12;S<.95;S+=.28){let T=w.userData.curve.getPointAt(S);Math.abs(T.z)>.012&&m.add(z(pt(.012,.004,Math.max(.004,T.z)),t.black,{pos:[T.x,T.y,T.z/2],cast:!1}))}let x=new Zi;x.add(new Yn(new R(us.x-.012,us.y+.004,.08),c.port.clone().setZ(.05)));let g=u.userData.curve.points.slice().reverse();x.add(new ci(g,!1,"catmullrom",.3)),x.add(new Yn(l.trunkOut.clone(),l.cableIn.clone()));let p=f.userData.curve.points.slice().reverse();x.add(new ci(p,!1,"catmullrom",.3)),x.add(new Yn(d.clone(),new R(rn.x,rn.y0+K(105),rn.z)));let v={tht:{object:a.group,name:"TZ THT-02 \xB7 BOAT-ER-TH-02",role:"RS-485 Modbus RTU temperature & humidity sensor",cat:"shell",color:"#b8c4d0",explode:[0,0,0],specs:[["Interface","RS-485 \xB7 Modbus RTU","oem","TZ-THT02-UM-V1.0"],["Line format","8N1 \xB7 default 9600 baud","oem","TZ-THT02-UM-V1.0"],["Address","DIP-8 (128\u20261)","oem","TZ-THT02-UM-V1.0"],["Body","\xD816 \xD7 140 mm","fieldscan"],["Serial","SYN-2411-0042","synthetic"],["Order variant","Not confirmed","pending"]]},"tht-gland":{object:a.gland,parent:"tht",name:"Waterproof gland",role:"Rear gland nut \xB7 step 1: unscrew",cat:"shell",color:"#b8c4d0",explode:[0,.05,0],spin:[0,1,0,Math.PI*6],window:[0,.35],specs:[["Zone","122\u2013140 mm \xB7 \xD815.5","fieldscan"],["Cable","\xD85 mm \xB7 4 cores \xB7 1 m","fieldscan"]]},"tht-head":{object:a.head,parent:"tht",name:"Sensor head + DIP barrel",role:"Step 2: unscrew at the middle seam",cat:"shell",color:"#b8c4d0",explode:[0,-.085,0],spin:[0,1,0,-Math.PI*5],window:[.3,.7],specs:[["Zones","Strainer 0\u201332 \xB7 seal 32\u201338 \xB7 barrel 38\u201368 mm","fieldscan"],["Strainer","Slotted stainless","fieldscan"]]},"tht-sht":{object:a.sht,parent:"tht-head",name:"Sensing element (SHT30)",role:"Temperature and humidity element behind the strainer",cat:"internal",color:"#ffd166",explode:[0,0,0],specs:[["Element","SHT30 (FieldScan reference)","fieldscan"],["Fault marker","7FFF H","oem","TZ-THT02-UM-V1.0"]]},"tht-dip":{object:a.dip,parent:"tht",name:"DIP-8 address switch",role:"Sets the Modbus slave address (\xA7 5)",cat:"internal",color:"#ffd166",explode:[0,-.004,.022],window:[.65,1],specs:[["Weights","1:128 2:64 3:32 4:16 5:8 6:4 7:2 8:1","oem","TZ-THT02-UM-V1.0"],["Current address","live","live"]]},"tht-rs485":{object:a.rs,parent:"tht",name:"RS-485 transceiver PCB",role:"Line driver + regulator \xB7 leads Red V+, Black GND, Yellow A+, Green B\u2212",cat:"internal",color:"#ffd166",explode:[0,0,.026],window:[.7,1],specs:[["Leads","Red V+ \xB7 Black GND \xB7 Yellow A+ \xB7 Green B\u2212","oem","TZ-THT02-UM-V1.0"],["Supply","DC 5\u201324 V (plate)","synthetic"]]},"tht-body":{object:a.body,parent:"tht",name:"Flange, bracket and RS-485 barrel",role:"Bracket 42 \xD7 20 mm \xB7 \xD84.2 holes at 32 mm",cat:"shell",color:"#b8c4d0",explode:[0,0,0],specs:[["Zones","Flange 68\u201388 \xB7 barrel 88\u2013122 mm","fieldscan"]]},plate:{object:o.group,name:"Mounting plate + nameplate",role:"Synthetic nameplate for the demo",cat:"structure",color:"#c9d1d4",explode:[0,0,0],specs:[["Plate text","Synthetic","synthetic"]]},jb:{object:l.group,name:"Junction box JB-ER-07",role:"RS-485 segment B marshalling",cat:"electronics",color:"#ffb347",explode:[0,0,0],specs:[["Segment","B \xB7 9600 8N1","synthetic"]]},"jb-lid":{object:l.lid,parent:"jb",name:"JB-ER-07 lid",role:"4-screw cover",cat:"electronics",color:"#ffb347",explode:[0,0,.09],window:[0,.5],specs:[]},gateway:{object:c.group,name:"Modbus master (synthetic)",role:"Polls address 1 \xB7 FC03 \xB7 registers 0\u20131",cat:"electronics",color:"#ffb347",explode:[0,0,0],specs:[["Master polls","Address 1","synthetic"],["Function","03 \xB7 2 registers from 0","synthetic"],["Timeout","1000 ms","synthetic"]]},cabling:{object:m,name:"RS-485 cabling",role:"Sensor lead + segment B trunk",cat:"signal",color:"#6fe3a1",explode:[0,0,0],specs:[]}};for(let w of Object.values(v).reverse())w.object.traverse(S=>{S.isMesh&&!S.userData.cat&&(S.userData.cat=w.cat)});return{root:h,room:r,parts:v,busPath:x,sliders:a.sliders,dynamic:{lcd:c.lcd,leds:c.leds},anchors:{tht:new R(-.03,K(60),.02),jb:new R(0,.085,.03),gateway:new R(0,.1,.05)},probeWorld:new R(rn.x,rn.y0+K(70),rn.z),plateWorld:o.faceWorld}}var Hx={overview:{pos:[.5,1.56,1.22],target:[.33,1.46,.02]},camera:{pos:[.08,1.4,.55],target:[.02,1.36,.02]},probe:{pos:[.12,1.4,.3],target:[-.03,1.36,.03]},plate:{pos:[.06,1.33,.2],target:[.045,1.325,.006]},dip:{pos:[.05,1.35,.14],target:[-.03,1.335,.04]},gateway:{pos:[.66,1.44,.32],target:[.64,1.43,.06]}},na={request:4647167,reply:16756782,error:16726832},hh=.0011,yl=class extends Zs{constructor(t,{plateLines:e,onDip:n=()=>{},...s}={}){super(t,ef(e),{...s,presets:Hx,initial:"overview",background:"#11181c",fog:[3,9],minFocus:.09,focusScale:2.2,near:.005,minDistance:.05,maxDistance:3,exposure:1.1}),this.onDip=n;let r=this.scene;r.add(new ji(15134719,3814442,.55));let a=new Ki(16773599,2.2);a.position.set(1.2,2.6,1.8),a.target.position.set(.2,1.4,0),a.castShadow=!0,a.shadow.mapSize.set(2048,2048),Object.assign(a.shadow.camera,{left:-1,right:1,top:1,bottom:-1,near:.5,far:5}),a.shadow.bias=-3e-4,a.shadow.normalBias=.01,r.add(a,a.target);let o=new On(16773336,1.6,3,2);o.position.set(.2,2.45,.6),r.add(o);let l=new Pr(16777215,0,1.6,.35,.6,1.5);l.position.set(.1,1.45,.6),l.target.position.copy(this.model.probeWorld),r.add(l,l.target),this.torch=l;for(let h of this.model.sliders)h.userData.hint="DIP";this.dipBits=[0,0,0,0,0,0,1,0],this.sliderX=this.model.sliders.map(()=>hh);let c=new Un(.0032,12,10);this.packets=[];for(let h=0;h<10;h++){let d=new ue(c,new Nn({color:na.request,transparent:!0,toneMapped:!1,depthTest:!1}));d.renderOrder=5,d.visible=!1,r.add(d),this.packets.push(d)}this.flash=new On(na.error,0,.35,2),this.flash.position.copy(this.model.probeWorld).add(new R(0,.04,.03)),r.add(this.flash),this.anim=null,this.lcdLines=null,this.drawLcd({status:"idle"}),this.model.dynamic.leds.pwr.on(1)}setDip(t){this.dipBits=[...t],this.model.sliders.forEach((n,s)=>{n.userData.hint=`DIP ${s+1} (${Fi[s]}) \xB7 ${t[s]?"ON":"OFF"} \u2014 click to toggle`});let e=t.reduce((n,s,r)=>n+(s?Fi[r]:0),0);this.setLabel("tht","THT-02 \xB7 DIP",`address ${e}`,"")}onPickObject(t){return t.userData.dip===void 0?!1:(this.onDip(t.userData.dip),!0)}setTorch(t){this.torch.intensity=t?6:0}drawLcd({status:t,tx:e=null,master:n=1}){let s=[{text:"SEG B \xB7 9600 8N1",y:46,size:30,weight:700},{text:`POLL ADDR ${n} \xB7 FC03 R0\xD72`,y:96,size:30,weight:600}];if(t==="valid")s.push({text:`${e.decode.values.temperature_c.toFixed(1)} \xB0C   ${e.decode.values.humidity_rh.toFixed(1)} %RH`,y:168,size:46,weight:800}),s.push({text:"OK \xB7 CRC MATCH",y:228,size:30,weight:700});else if(t==="idle")s.push({text:"WAITING\u2026",y:175,size:44,weight:800});else{let r={timeout:"NO REPLY \xB7 TIMEOUT",invalid:"FRAME REJECTED",sensor_abnormal:"SENSOR 7FFF H",exception:"EXCEPTION"}[t]||t.toUpperCase();s.push({text:r,y:168,size:42,weight:800,color:"#ff8f7a"});let a=e?.decode.checks.find(o=>!o.ok);s.push({text:a?`${a.check.toUpperCase()}: ${a.detail}`.slice(0,30):"",y:228,size:26,weight:600,color:"#ff8f7a"})}this.model.dynamic.lcd.draw(s),this.lcdStatus=t}setLiveLabels(t){let e=t.decode.status;this.setLabel("gateway","Master \xB7 addr 1",e==="valid"?`${t.decode.values.temperature_c.toFixed(1)} \xB0C \xB7 ${t.decode.values.humidity_rh.toFixed(1)} %RH`:e.replace("_"," "),e==="valid"?"ok":"fail"),this.setLabel("jb","JB-ER-07","Segment B \xB7 A+/B\u2212")}playTransaction(t,{quiet:e=!1}={}){this.anim={tx:t,start:performance.now(),quiet:e},this.model.dynamic.leds.tx.on(1),this.setLiveLabels(t)}tick(t,e){this.model.sliders.forEach((d,f)=>{let u=this.dipBits[f]?-hh:hh;this.sliderX[f]+=(u-this.sliderX[f])*Math.min(1,t*10),d.position.x=this.sliderX[f]});let n=this.model.dynamic.leds;if(!this.anim){for(let d of this.packets)d.visible=!1;this.flash.intensity*=.9,n.err.on(this.lcdStatus&&!["valid","idle"].includes(this.lcdStatus)?.4+.6*(Math.sin(e*6)>0):0);return}let{tx:s}=this.anim,r=(performance.now()-this.anim.start)/1e3,a=s.decode.status,o=.7,l=.7,c=this.model.busPath,h=(d,f)=>{this.packets.forEach((u,m)=>{let x=d-m*.018;u.visible=x>=0&&x<=1&&this.explode<.05,u.visible&&(u.position.copy(c.getPointAt(Math.min(1,x))),u.material.color.setHex(f),u.material.opacity=1-m*.085)})};if(r<o)h(r/o*1.15,na.request);else if(a==="timeout")h(-1,0),n.tx.on(0),this.flash.intensity=!this.anim.quiet&&r<o+.5?.6*(Math.sin(r*40)>0):0,r>o+1&&this.finish(s);else if(r<o+l){n.tx.on(0),n.rx.on(1);let d=a==="valid"?na.reply:na.error;h(1.15-(r-o)/l*1.15,d)}else this.finish(s)}finish(t){this.anim=null;let e=this.model.dynamic.leds;e.tx.on(0),e.rx.on(0),this.drawLcd({status:t.decode.status,tx:t,master:t.master_address})}};var Rn=new Intl.NumberFormat("en-US",{maximumFractionDigits:1}),rf=new Intl.NumberFormat("en-US"),nf=i=>new Promise(t=>setTimeout(t,i)),Gx=i=>i.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),vl=i=>(i>=0?"+":"")+Rn.format(i),Vx=[[/gland|cable entry/,"tht-gland"],[/dip|address switch|switch/,"tht-dip"],[/sht|sensing element|element|strainer|head/,"tht-sht"],[/rs-?485|transceiver|pcb|board/,"tht-rs485"],[/bracket|flange|body|barrel/,"tht-body"],[/plate|nameplate|label/,"plate"],[/junction|\bjb\b|lid/,"jb"],[/gateway|master|lcd|display/,"gateway"],[/cable|wiring/,"cabling"],[/probe|sensor|tht/,"tht"]],Wx={live:["Identify this sensor","Confirm the asset","Show the plate","Why does it fail?","Is everything OK?"],diag:["Why does it fail?","Show the manual","Simulate the DIP fix","Does it work now?","Inject a bad CRC","Disassemble the probe"],compat:["Is everything OK?","Switch to 12 V","Simulate an open wire","Explain the margin","Is the spare a valid replacement?","X-ray view"]},Xx=[[/probe|fmx|waterpilot|sensor|transmitter|candidate/,"probe"],[/sm ?1231|analog input|input module|\bai0?\b|\bplc\b/,"sm1231"],[/\bcpu\b|controller|s7-?1200/,"cpu"],[/power supply|\bpsu\b|\bg1\b/,"psu"],[/junction|\bjb\b/,"jb"],[/terminal/,"terminals"],[/breaker/,"breaker"],[/cabinet|enclosure|panel/,"cabinet"],[/wika|ls-?10|reference|old (sensor|probe)/,"wika"],[/tank/,"tank"],[/cable|wiring/,"cabling"]];function Js(i){let t=i.load_check,e=i.inputs.supply_v;return t.status==="pass"?`Loop load check PASSES at ${e} V: available ${Rn.format(t.available_ohm)} \u03A9 vs evaluated ${Rn.format(t.evaluated_ohm)} \u03A9, margin ${vl(t.margin_ohm)} \u03A9.`:`Loop load check FAILS at ${e} V: available ${Rn.format(t.available_ohm)} \u03A9 but the loop presents ${Rn.format(t.evaluated_ohm)} \u03A9, margin ${vl(t.margin_ohm)} \u03A9.`}function ia(i){let t=i.simulation;switch(t.state){case"nominal":return`Simulated signal ${Rn.format(t.loop_signal_ma)} mA \u2192 ideal PLC count ${rf.format(t.plc_ideal_count)} (level ${t.level_fraction*100} %).`;case"empty_tank":return"Empty tank: 4.0 mA live zero \u2192 ideal count 0. That is a valid reading, not a fault.";case"open_circuit":return"Open wire: idealized loop current 0 mA and the SM 1231 reports a wire-break diagnostic, which is distinct from an empty tank.";default:return"The simulated reading is suppressed because the loop is outside the validated load envelope."}}function sf(i){return i.replacement_status==="insufficient_evidence"?"Replacement equivalence: insufficient evidence. Still pending: "+i.pending.join(" "):"Replacement equivalence: incompatible with the evaluated profile."}var bl=class{constructor(t){this.app=t,this.history=[],this.speakOn=!1,this.busy=!1,this.list=document.getElementById("messages"),this.input=document.getElementById("chat-input"),this.queue=Promise.resolve(),this.bindUi()}setChips(t){document.getElementById("chips").replaceChildren(...Wx[t].map(n=>Object.assign(document.createElement("button"),{type:"button",textContent:n})))}action(t,...e){return this.queue=this.queue.then(async()=>{try{let n=await this.app[t](...e);n&&await this.post(n,{kind:/^\[fail\]/.test(n)?"alert":""})}catch(n){await this.post("[warn] "+n.message,{kind:"alert"})}}),this.queue}onWorkspace(t){let e={live:"Live view: FieldScan camera on the engine-room bulkhead. Capture a frame to identify the sensor, then confirm it.",diag:"THT-02 diagnosis: the master polls address "+(this.app.bus?.master_address??1)+". Ask \u201CWhy does it fail?\u201D, open the manual, or flip the DIP switches (3D or the mirror on the left).",compat:"Spare-part check: candidate E+H FMX11 replacing a WIKA LS-10 on loop LT-301. "+Js(this.app.report)}[t];this.post(e,{speak:!1})}bindUi(){document.getElementById("chat").addEventListener("submit",e=>{e.preventDefault();let n=this.input.value.trim();n&&(this.input.value="",this.ask(n))}),document.getElementById("chips").addEventListener("click",e=>{e.target.tagName==="BUTTON"&&this.ask(e.target.textContent)});let t=document.getElementById("speak");t.addEventListener("click",()=>{this.speakOn=!this.speakOn,t.setAttribute("aria-pressed",String(this.speakOn)),this.speakOn||window.speechSynthesis?.cancel()}),"speechSynthesis"in window||(t.disabled=!0),this.bindMic()}bindMic(){let t=document.getElementById("mic"),e=window.SpeechRecognition||window.webkitSpeechRecognition;if(!e){t.disabled=!0,t.title="Speech recognition is not supported in this browser (try Chrome or Edge).";return}let n=new e;n.lang="en-US",n.interimResults=!0,n.maxAlternatives=1;let s=!1;n.onresult=r=>{let a=r.results[r.results.length-1];if(this.input.value=a[0].transcript,a.isFinal){let o=this.input.value.trim();this.input.value="",o&&this.ask(o)}},n.onend=()=>{s=!1,t.classList.remove("listening")},n.onerror=r=>{r.error==="network"&&this.post("Voice input needs the browser speech service (online). Type your question instead; everything else keeps working offline.",{kind:"alert"})},t.addEventListener("click",()=>{if(s){n.stop();return}window.speechSynthesis?.cancel();try{n.start(),s=!0,t.classList.add("listening")}catch{}})}bubble(t,e=""){let n=document.createElement("div");n.className=`msg ${t} ${e}`.trim();let s=document.createElement("span");s.className="meta",s.textContent=(t==="user"?"You":"Platform")+" \xB7 "+new Date().toLocaleTimeString("en-US",{hour12:!1});let r=document.createElement("span");return n.append(s,r),this.list.append(n),this.list.scrollTop=this.list.scrollHeight,r}render(t){return Gx(t).replace(/^\[ok\]/gm,'<span class="ok">\u2713</span>').replace(/^\[fail\]/gm,'<span class="fail">\u2717</span>').replace(/^\[warn\]/gm,'<span class="warn">!</span>').replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")}async post(t,{kind:e="",speak:n=!0}={}){let s=this.bubble("bot",e);s.parentElement.classList.add("typing");for(let r=0;r<=t.length;r+=4)s.innerHTML=this.render(t.slice(0,r)),this.list.scrollTop=this.list.scrollHeight,await nf(8);return s.innerHTML=this.render(t),s.parentElement.classList.remove("typing"),this.list.scrollTop=this.list.scrollHeight,n&&this.say(t),this.history.push({role:"assistant",content:t}),s}say(t){if(!this.speakOn||!("speechSynthesis"in window))return;let e=t.replace(/\[(ok|fail|warn)\]/g,"").replace(/\*\*/g,"").replace(/Ω/g," ohms").replace(/→/g,", ").replace(/−/g,"minus "),n=new SpeechSynthesisUtterance(e);n.lang="en-US",n.rate=1.05,window.speechSynthesis.speak(n)}async greet(){let e=this.app.identity;await this.post(`Platform online. FieldScan camera CAM-01 is looking at the engine-room bulkhead (simulated source). Ticket: the ventilation controller shows no temperature from sensor BOAT-ER-TH-02 since the last maintenance.
`+(e?.confirmed?`[ok] Asset already confirmed in this session: ${e.model} at ${e.asset_id}.
`:`Start with \u201CIdentify this sensor\u201D, then confirm the asset.
`)+"Then ask \u201CWhy does it fail?\u201D, \u201Cshow the manual\u201D, \u201Csimulate the DIP fix\u201D or \u201Cdoes it work now?\u201D. The 4\u201320 mA spare check lives in workspace 3. You can also use the microphone.",{speak:!1})}async ask(t){if(!this.busy){this.busy=!0,this.bubble("user").textContent=t,this.history.push({role:"user",content:t});try{await this.handle(t)}catch(e){await this.post("Something went wrong locally: "+e.message,{kind:"alert"})}finally{this.busy=!1}}}async fieldscan(t){let e=this.app,n=[],s=!1;/workspace ?1|live view|camera view|go live/.test(t)?(e.setWorkspace("live"),s=!0):/workspace ?2|diagnosis (view|workspace)|open (the )?diagnosis/.test(t)&&(e.setWorkspace("diag"),s=!0),/identif|recogni|capture|take a (photo|picture|frame)|what (sensor|device) is (this|that)|\bscan\b/.test(t)&&n.push(["capture"]),/confirm/.test(t)&&n.push(["confirm"]),/plate|label/.test(t)&&/show|zoom|read|look/.test(t)&&n.push(["showPlate"]);let r=t.match(/(?:§|section)\s*(\d+(?:\.\d+)?)/)?.[1];/manual|§|section/.test(t)&&n.push(["showManual",r||"5"]),/(dip|address).{0,20}(fix|set|correct|change)|(fix|correct|repair).{0,20}(dip|address|it\b)|simulate (the )?(dip )?fix/.test(t)?n.push(["dipFix"]):/\bwhy\b.{0,30}(fail|timeout|no (reply|reading|response|temperature)|not work)|what('?s| is) wrong|no temperature|diagnose (it|the sensor)/.test(t)&&n.push(["whyFail"]),/(work|ok|fixed|answer|respond)\w* now|is it (fixed|working)|verify|poll (it|again|the sensor)/.test(t)&&n.push(["worksNow"]),/reset (the )?case|restore (the )?incident|start the case over/.test(t)&&n.push(["resetCase"]),/bad crc|corrupt|crc error/.test(t)&&n.push(["inject","bad_crc"]),/foreign|other slave|wrong address reply/.test(t)&&n.push(["inject","foreign_address"]),/7fff|sensor (fault|abnormal|broken)/.test(t)&&n.push(["inject","sensor_fault"]),/bench|real reader|usb.?rs-?485/.test(t)&&n.push(["bench"]),/session report|export (the )?(session|report|evidence)/.test(t)&&n.push(["exportReport"]);for(let[a,...o]of n)await this.action(a,...o);return s&&!n.length?!0:n.length>0}async handle(t){let e=t.toLowerCase(),n=this.app,s=[],r=!1,a=/spare|4.?20|fmx|wika|\bloop\b|tank|\b(12|24) ?v\b|config(uration)? ?v?[12]\b|open wire|margin|sm ?1231|replacement|equivalen|workspace ?3/.test(e);if(!a&&await this.fieldscan(e))return;a&&n.ws!=="compat"&&n.setWorkspace("compat",{quiet:!0});let o={};if(n.ws==="compat"&&/\breset\b|start over|defaults?\b/.test(e)&&Object.assign(o,{voltage:24,revision:"v1",scenario:"nominal"}),/\b12\s*v\b|\b12[- ]?volts?|twelve/.test(e)?o.voltage=12:/\b24\s*v\b|\b24[- ]?volts?|twenty[- ]?four/.test(e)&&(o.voltage=24),/\bv2\b|config(uration)?\s*v?2\b|revision\s*2|475/.test(e)?o.revision="v2":/\bv1\b|config(uration)?\s*v?1\b|revision\s*1/.test(e)&&(o.revision="v1"),n.ws!=="compat"||(/open[- ]?(wire|circuit|loop)|wire[- ]?break|broken (wire|cable)|cut (the )?(wire|cable)|disconnect/.test(e)?o.scenario="open":/\bempty\b|\bdrain/.test(e)?o.scenario="empty":/50 ?%|\bhalf\b|nominal|refill|fill (the |it )?(tank|up)|reconnect|repair|fix the (wire|cable)|restore/.test(e)&&(o.scenario="nominal")),Object.keys(o).length){let c=n.report;await n.setConfig(o,"assistant");let h=n.report,d=[o.voltage&&`${o.voltage} V DC supply`,o.revision&&`installation ${o.revision} (+${h.inputs.synthetic_additional_series_ohm} \u03A9 synthetic)`,o.scenario&&{nominal:"level 50 %",empty:"empty tank",open:"open wire"}[o.scenario]].filter(Boolean).join(", ");s.push(`Applied: ${d}.`),s.push((h.load_check.status==="pass"?"[ok] ":"[fail] ")+Js(h)),s.push(ia(h)),c.replacement_status!==h.replacement_status&&s.push(sf(h)),r=!0}let l=(n.ws==="compat"?Xx:Vx).find(([c])=>c.test(e))?.[1];if(/x-?ray|see inside|interior|transparent|look inside/.test(e)?(n.setView("xray"),s.push(n.ws==="compat"?"X-ray view on: shells are translucent so you can see the water column, the probe internals and the loop wiring. The glowing particles are the loop current.":"X-ray view on: the stainless barrel turns translucent so you can see the SHT30 element, the DIP-8 address switch and the RS-485 board. Bus packets are cyan (request) and amber (reply)."),r=!0):/realistic|normal view|solid view|photo/.test(e)&&(n.setView("normal"),s.push("Back to the realistic view."),r=!0),/re-?assembl|put (it )?back|collapse|close (it )?up/.test(e)?(n.setExplode(0),s.push("Reassembled. All parts are back in their installed positions."),r=!0):/explod|disassembl|take (it |the \w+ )?apart|tear ?down|dismantl|break (it )?down|pull (it )?out/.test(e)?(n.setExplode(1),l&&(n.focus(l),n.inspect(l,{reveal:!1})),s.push(`Disassembled${l?` and focused on the ${n.partName(l)}`:""}.${n.ws==="compat"?"":" Same order as the manual: rear gland first, then the barrel unscrews at the middle seam to expose the DIP switch."} Click any part to inspect its datasheet fields, or use \u201CIsolate\u201D in the Parts tab.`),r=!0):l&&/show|focus|zoom|look at|where|inspect|go to|open|view/.test(e)&&(n.focus(l),n.inspect(l,{reveal:!1}),s.push(`Focused on the ${n.partName(l)}. Its evidence-backed fields are in the Parts tab.`),r=!0),s.length&&await this.post(s.join(`
`)),/self[- ]?test|run (the )?tests?|golden/.test(e)&&(await this.selfTest(),r=!0),/(everything|all|it|system|platform|loop|things?).{0,25}\b(ok|okay|fine|working|running|good|healthy|alright)\b|\bstatus\b|\bhealth|diagnos|check ?up|sanity/.test(e)&&(await this.diagnostics(),r=!0),/\bwhy\b|explain|margin|formula|how .*(calc|comput|work)|\bload\b/.test(e)&&!Object.keys(o).length&&(await this.post(this.explain()),r=!0),/source|evidence|datasheet|document|\boem\b/.test(e)&&(await this.post(n.ws==="compat"?this.sources():this.fsSources()),r=!0),/equivalen|replace|substitut|\bswap|pending|compatib/.test(e)&&!Object.keys(o).length){let c=await n.refreshReplacement(),h=c?.criteria?`
`+c.criteria.map(d=>`${d.status==="pass"?"[ok]":d.status==="fail"?"[fail]":"[warn]"} ${d.criterion.replace(/_/g," ")}: ${d.detail}`).join(`
`)+`
(${c.event_id}, rules ${c.rules_version})`:"";await this.post(Js(n.report)+h+`
`+sf(n.report)),r=!0}/telemetry|live|reading|current|\bma\b|count|signal|level|temperature|humidity/.test(e)&&!r&&(await this.post(n.ws==="compat"?this.live():this.rtuLive()),r=!0),/export|download|\bjson\b/.test(e)&&n.ws!=="compat"?(await this.action("exportReport"),r=!0):/export|download|\bjson\b/.test(e)&&(n.exportJson(),await this.post("Exported the current report as boat-mvp-result.json. Paste it into your AI tool if you need a narrative; the JSON stays the source of truth."),r=!0),/\bhelp\b|what can you|commands|capabilit/.test(e)&&(await this.post(this.help()),r=!0),!r&&(n.ai.configured&&await this.streamLLM(t)||await this.post(`I'm answering from the local engine only (no LLM configured or reachable), so I stick to what I can verify.
`+(n.ws==="compat"?Js(n.report)+`
`+ia(n.report)+`
Try: \u201CIs everything OK?\u201D, \u201Cexplain the margin\u201D, \u201Cswitch to config v2\u201D, \u201Cshow the SM 1231\u201D, \u201Csources\u201D.`:this.rtuLive()+`
Try: \u201CWhy does it fail?\u201D, \u201Cshow the manual \xA7 6.4\u201D, \u201Csimulate the DIP fix\u201D, \u201Cinject a bad CRC\u201D, \u201Cx-ray view\u201D.`)))}async streamLLM(t){let e=this.app,n;try{let s=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:t,context:{workspace:e.ws,view:e.viewState(),pins:e.sessionPins(),bus:e.bus,last_transaction:e.transactions[0]||null,report:e.ws==="compat"?e.report:void 0,telemetry:e.ws==="compat"?e.telemetry.last:void 0},history:this.history.slice(-9,-1)})});if(!s.ok||!s.body)return!1;n=this.bubble("bot"),n.parentElement.classList.add("typing");let r=s.body.getReader(),a=new TextDecoder,o="",l="";for(;;){let{value:c,done:h}=await r.read();if(h)break;o+=a.decode(c,{stream:!0});let d;for(;(d=o.indexOf(`

`))>=0;){let f=o.slice(0,d).trim();if(o=o.slice(d+2),!f.startsWith("data:"))continue;let u=JSON.parse(f.slice(5));if(u.error)throw new Error(u.error);u.delta&&(l+=u.delta,n.innerHTML=this.render(l),this.list.scrollTop=this.list.scrollHeight)}}if(n.parentElement.classList.remove("typing"),!l)throw new Error("Empty response.");return this.history.push({role:"assistant",content:l}),this.say(l),!0}catch{return n&&n.parentElement.remove(),!1}}explain(){let t=this.app.report,e=t.load_check,n=t.inputs.supply_v,s=t.inputs.synthetic_additional_series_ohm,r=n-.022*e.evaluated_ohm;return["**How the margin is computed**",`1. The FMX11 needs at least 8 V at its terminals while drawing up to 22 mA (E+H TI01524P, p. 7). The loop may therefore drop (V \u2212 8 V) at 22 mA: (${n} \u2212 8) / 0.022 = ${Rn.format(e.available_ohm)} \u03A9 available.`,`2. The loop presents 290 \u03A9 (upper bound of the SM 1231 input impedance, Siemens) + ${s} \u03A9 synthetic cable and accessories = ${Rn.format(e.evaluated_ohm)} \u03A9.`,`3. Margin = ${Rn.format(e.available_ohm)} \u2212 ${Rn.format(e.evaluated_ohm)} = ${vl(e.margin_ohm)} \u03A9 \u2192 ${e.status==="pass"?"[PASS]":"[FAIL]"}.`,`At 22 mA the transmitter would see ${Rn.format(r)} V at its terminals (${r>=8?"\u2265":"<"} 8 V minimum).`,"Only the installation data (+"+s+" \u03A9, supply choice) is synthetic; the 8 V, 22 mA and 290 \u03A9 figures come from the OEM documents."].join(`
`)}sources(){return"Evidence used (snapshot "+this.app.report.evidence_version+`):
`+this.app.report.sources.map(t=>`\u2022 ${t.id}: ${t.title}. ${t.section}`).join(`
`)+`
The links are in the Evidence tab; opening them requires Internet.`}live(){let t=this.app.telemetry.last;return t?[`Live (simulated) at ${new Date(t.t).toLocaleTimeString("en-US",{hour12:!1})}:`,`\u2022 Loop current: ${t.ma===null?"suppressed (outside envelope)":t.ma.toFixed(2)+" mA"}`,`\u2022 Supply: ${t.supply.toFixed(2)} V \xB7 terminal voltage at 22 mA: ${t.terminalAtDesign.toFixed(2)} V`,`\u2022 AI0 raw count: ${t.count===null?"\u2014":rf.format(t.count)} \xB7 channel diagnostic: ${t.diag}`,`\u2022 Physical tank level: ${(t.level*100).toFixed(1)} %`].join(`
`):"Telemetry is starting\u2026"}fsSources(){let t=this.app.bundle.documents;return"Documents in this package (catalog "+this.app.bundle.catalog_version+`):
`+Object.values(t).map(e=>`\u2022 ${e.id}: ${e.title} \xB7 ${e.edition||""} \xB7 validity ${e.validity.replace("_"," ")}`).join(`
`)+`
Say \u201Cshow the manual \xA7 6.4\u201D to open a section. Opening the original links requires Internet.`}rtuLive(){let t=this.app,e=t.bus,n=t.transactions[0];return[`Bus (simulated): master polls address ${e.master_address} \xB7 sensor DIP ${e.dip_bits.join("")} \u2192 address ${e.device_address}.`,n?`Last recorded transaction ${n.event_id}: ${n.decode.status}${n.decode.values?` \xB7 ${n.decode.values.temperature_c.toFixed(1)} \xB0C, ${n.decode.values.humidity_rh.toFixed(1)} %RH`:""}.`:"No transaction recorded yet in this session."].join(`
`)}help(){return["I can operate the platform and answer from the evidence:","\u2022 FieldScan: \u201Cidentify this sensor\u201D, \u201Cconfirm the asset\u201D, \u201Cwhy does it fail?\u201D, \u201Cshow the manual \xA7 5\u201D, \u201Csimulate the DIP fix\u201D, \u201Cdoes it work now?\u201D, \u201Cinject a bad CRC\u201D, \u201Cbench reader\u201D, \u201Creset the case\u201D","\u2022 Health: \u201CIs everything OK?\u201D, \u201Crun self-test\u201D, \u201Clive readings\u201D","\u2022 Spare (workspace 3): \u201Cswitch to 12 V\u201D, \u201Cuse config v2\u201D, \u201Csimulate an open wire\u201D, \u201Cempty the tank\u201D, \u201Creset\u201D","\u2022 Twin: \u201Cx-ray view\u201D, \u201Cdisassemble the probe\u201D, \u201Cshow the SM 1231\u201D, \u201Creassemble\u201D","\u2022 Engineering: \u201Cexplain the margin\u201D, \u201Cis the spare a valid replacement?\u201D, \u201Csources\u201D, \u201Cexport JSON\u201D",this.app.ai.configured?`Free-form questions go to ${this.app.ai.model} via the local server.`:"Free-form questions need an LLM (set AI_BASE_URL, AI_MODEL, AI_API_KEY on the server)."].join(`
`)}async selfTest(){let t=await this.app.selfTest();t.ok?await this.post(`[ok] Self-test passed: ${t.total} checks${t.python?` (Python: loop ${t.python.loop.cases.length}, Modbus ${t.python.modbus.cases.length}, session ${t.python.session.cases.length})`:""} and the browser Modbus RTU matches the Python golden vectors (${t.parity.cases}/${t.parity.cases}).`,{kind:"good"}):await this.post("[fail] Engine self-test FAILED: "+(t.error||"unknown error"),{kind:"alert"})}async diagnostics(){let t=this.app,e=t.report,n=this.bubble("bot");n.parentElement.classList.add("typing");let s=["**Platform diagnostics**"],r=async v=>{s.push(v),n.innerHTML=this.render(s.join(`
`)),this.list.scrollTop=this.list.scrollHeight,await nf(260)};await r(`[ok] Local engine: rules ${e.rules_version}, evidence ${e.evidence_version}`);let a=await t.health();await r(a.portable?"[ok] Platform link: portable file, all 12 scenarios precomputed (no server needed)":a.ok?"[ok] Platform link: loopback server healthy, live recomputation":"[fail] Platform link: local server not responding");let o=await t.selfTest();await r(o.ok?`[ok] Engine self-test: ${o.total} checks, JS/Python Modbus parity ${o.parity.cases}/${o.parity.cases}`:"[fail] Engine self-test failed: "+(o.error||""));let l=t.identity;await r(l?.confirmed?`[ok] Asset: ${l.model} confirmed at ${l.asset_id}`:"[warn] Asset: not confirmed yet (capture + confirm in Live view)");let c=t.bus,h=t.lastStatus==="valid";await r(h?`[ok] THT-02 bus: address ${c.master_address} answering, CRC OK (simulated)`:`[fail] THT-02 bus: ${t.lastStatus==="timeout"?`no reply \u2014 master polls ${c.master_address}, DIP set to ${c.device_address}`:t.lastStatus.replace("_"," ")}`),await r(navigator.onLine?"[ok] Network: online (OEM links reachable)":"[warn] Network: offline. Calculations, evidence and export still work locally");let d=e.load_check.status==="pass";await r(`${d?"[ok]":"[fail]"} Loop load at ${e.inputs.supply_v} V / ${e.inputs.synthetic_installation_revision}: margin ${vl(e.load_check.margin_ohm)} \u03A9`);let f=t.telemetry.last,u=e.simulation.state;u==="open_circuit"?await r("[fail] Live signal: 0 mA, wire-break diagnostic on AI0 (check JB-03 and field cable)"):u==="outside_load_envelope"?await r("[fail] Live signal: suppressed, loop outside validated load envelope"):await r(`[ok] Live signal: ${f?.ma?.toFixed(2)??"\u2014"} mA on AI0 (expected ${Rn.format(e.simulation.loop_signal_ma)} mA)${u==="empty_tank"?", empty tank (valid live zero)":""}`),await r(e.replacement_status==="insufficient_evidence"?`[warn] Replacement equivalence: ${e.pending.length} evidence items pending`:"[fail] Replacement equivalence: incompatible with the evaluated profile"),await r(t.ai.configured?`[ok] Assistant: LLM ${t.ai.model} available via local server`:"[ok] Assistant: local grounded engine (no LLM needed)");let m=(a.ok||a.portable)&&o.ok,x=d&&u!=="open_circuit",g=h,p;m?g?x?p="**Verdict:** platform healthy, the THT-02 is answering and the loop is working. The spare passes the load check; equivalence still needs the pending evidence before you sign off the swap.":u==="open_circuit"?p="**Verdict:** platform healthy, but the loop is NOT OK. There is a wire break; the reading is 0 mA, not an empty tank.":p="**Verdict:** platform healthy, but the loop is NOT OK. The candidate cannot drive this loop at this configuration (negative margin).":p="**Verdict:** platform healthy, but sensor BOAT-ER-TH-02 is NOT answering. Ask \u201CWhy does it fail?\u201D for the evidence-backed diagnosis."+(x?" The 4\u201320 mA loop is fine.":""):p="**Verdict:** the platform itself has a problem; see the failed checks above.",await r(p),n.parentElement.classList.remove("typing"),n.parentElement.classList.add(m&&x&&g?"good":"alert"),this.history.push({role:"assistant",content:s.join(`
`)}),this.say(p)}async onReport(t,e,n){if(n==="assistant"||!e)return;let s=e.load_check.status==="pass"&&e.simulation.state!=="open_circuit",r=t.load_check.status==="pass"&&t.simulation.state!=="open_circuit";s&&!r?await this.post("**Alert.** "+Js(t)+`
`+ia(t),{kind:"alert"}):!s&&r?await this.post("**Recovered.** "+Js(t)+`
`+ia(t),{kind:"good"}):t.simulation.state!==e.simulation.state&&await this.post(ia(t),{speak:!1})}onNetwork(t){this.post(t?"Network restored. OEM document links are reachable again.":"Network lost. No problem: the engine, evidence and export run locally on board.",{kind:t?"good":"alert"})}};var et=i=>document.getElementById(i),sa=new Intl.NumberFormat("en-US",{maximumFractionDigits:1}),Tt=(i,t={},...e)=>{let n=Object.assign(document.createElement(i),t);return n.append(...e.filter(s=>s!=null&&s!==!1)),n},$x={nominal:"Nominal level",empty_tank:"Empty tank",open_circuit:"Open wire \xB7 loop diagnostic",outside_load_envelope:"Load outside limit"},af={oem:["OEM","oem"],synthetic:["Synthetic","synthetic"],pending:["Pending","pending"],live:["Live","oem"],fieldscan:["FieldScan","fieldscan"]},gi={valid:"Valid reply",timeout:"No reply \xB7 timeout",invalid:"Frame rejected",sensor_abnormal:"Sensor abnormal (7FFF H)",exception:"Modbus exception",idle:"Not polled yet"},of={live:"FieldScan live view \xB7 engine room \xB7 bulkhead FR 42 \xB7 asset BOAT-ER-TH-02",diag:"THT-02 diagnosis \xB7 RS-485 segment B \xB7 Modbus RTU 9600 8N1",compat:"4\u201320 mA spare \xB7 freshwater tank T-03 \xB7 loop LT-301 \xB7 FMX11 replacing WIKA LS-10"},qx={tht:[["overview","Overview"],["camera","Camera"],["plate","Plate"],["probe","Probe"],["dip","DIP"],["gateway","Master"]],loop:[["overview","Overview"],["probe","Probe"],["cabinet","Cabinet"]]},Yx={tht:["tht-sht","tht-dip","tht-rs485"],loop:["probe","probe-cap","probe-cell","probe-pcb"]},Sl=i=>i.slice(0,4).join("")+" "+i.slice(4).join(""),uh=class{constructor(){this.ws="live",this.config={voltage:24,revision:"v1",scenario:"nominal"},this.report=null,this.replacement=null,this.ai={configured:!1,model:null},this.requestId=0,this.transactions=[],this.bus=null,this.frame=null,this.lastStatus="idle",this.holdUntil=0,this.selfTest=zd,this.health=eh,this.mode=ls}async start(){et("pill-link").textContent=ls==="portable"?"Portable \xB7 offline-ready":"Local server",et("pill-link").className="pill ok",this.updateNetwork();let t=()=>{let s=new Date().toLocaleTimeString("en-US",{hour12:!1});et("clock").textContent=s+" local",et("hud-time").textContent=new Date().toISOString().slice(0,10)+" "+s};t(),setInterval(t,1e3);let e;try{e=await Ud()}catch(s){this.toast(s.message),et("pill-link").textContent="Server unreachable",et("pill-link").className="pill fail";return}this.bundle=e,et("pill-engine").textContent=`Catalog ${e.catalog_version.split("/")[1]} \xB7 ${e.rules_versions.diagnosis}`,et("pill-engine").title=`Catalog ${e.catalog_version} \xB7 rules ${e.rules_versions.diagnosis}, ${e.rules_versions.loop}`,et("pill-engine").className="pill ok";let n={onSelect:s=>this.inspect(s),onHover:(s,r,a)=>this.tooltip(s,r,a)};this.tht=new yl(et("viewport-tht"),{...n,plateLines:e.assets["BOAT-ER-TH-02"].plate_lines,onDip:s=>this.toggleDip(s)}),this.loop=new xl(et("viewport-loop"),n),this.loop.setActive(!1),this.telemetry=new hl(s=>this.onSample(s)),this.assistant=new bl(this),this.bindUi(),this.buildDip(),await this.refreshSession(),this.applyBus(this.bus||{master_address:e.incident.master_address,dip_bits:en(e.incident.device_address)}),this.renderDocuments(),this.identity&&this.renderIdentity(),this.ai=await kd(),et("pill-ai").textContent=this.ai.configured?`Assistant \xB7 ${this.ai.model}`:"Assistant \xB7 local engine",et("pill-ai").className="pill ok",await this.setConfig({},"init"),this.telemetry.start(),this.setWorkspace("live",{quiet:!0}),this.assistant.greet(),setInterval(()=>this.livePoll(),2500),requestAnimationFrame(()=>this.hudLoop()),ls==="server"&&setInterval(()=>this.checkLink(),5e3)}get stage(){return this.ws==="compat"?this.loop:this.tht}get twin(){return this.stage}get identity(){return jr().identity}sessionPins(){return jr().pins}setWorkspace(t,{quiet:e=!1}={}){if(!of[t])return;let n=t!==this.ws,s=this.stage;this.ws=t,et("app").dataset.ws=t;for(let l of document.querySelectorAll(".workspaces button"))l.setAttribute("aria-selected",String(l.dataset.ws===t));for(let l of["live","diag","compat"])et("ws-"+l).hidden=l!==t;let r=document.querySelector('.tabs button[aria-selected="true"]')?.dataset.tab;for(let l of document.querySelectorAll(".tabs [data-only]"))l.hidden=!l.dataset.only.split(" ").includes(t);document.querySelector(`.tabs button[data-tab="${r}"]`)?.hidden&&this.openTab("assistant"),et("subtitle").textContent=of[t];let o=t==="compat";et("viewport-loop").hidden=!o,et("viewport-tht").hidden=o,this.loop.setActive(o),this.tht.setActive(!o),(s!==this.stage||!this.assemblyBuilt)&&(this.buildCams(),this.buildAssembly(),this.inspect(null),this.syncDock(),this.assemblyBuilt=!0),t==="live"&&n&&this.tht.preset(this.frame?"camera":"overview"),t==="diag"&&n&&this.tht.preset("overview"),t==="compat"&&this.refreshReplacement(),this.assistant.setChips(t),n&&!e&&this.assistant.onWorkspace(t)}async refreshSession(){let t=await Fd();return t.bus&&(this.bus=t.bus),this.renderPins(t.pins),this.renderEvents(t.events),t}applyBus(t){this.bus={...t,device_address:Jr(t.dip_bits)},this.tht.setDip(this.bus.dip_bits),this.renderDip(),et("d-master").textContent=`Address ${this.bus.master_address} \xB7 FC03 \xB7 R0 \xD7 2`;let e=this.bus.device_address;et("d-addr").textContent=`${Sl(this.bus.dip_bits)} \u2192 address ${e}`+(e===this.bus.master_address?" \u2713":` \u2260 ${this.bus.master_address}`),et("d-addr").className=e===this.bus.master_address?"pos":"neg"}renderPins(t){if(!t)return;let e=[["Asset",t.asset_id||"not confirmed"],["Product",t.product_id||"\u2014"],["Catalog",t.catalog_version],["Rules",`${t.rules_version.diagnosis} \xB7 ${t.rules_version.loop}`],["Last event",t.last_event_id||"\u2014"],["Sources",Object.entries(t.source_status).map(([n,s])=>`${n}: ${s.replace("_"," ")}`).join(" \xB7 ")]];et("pins").replaceChildren(...e.flatMap(([n,s])=>[Tt("dt",{textContent:n}),Tt("dd",{textContent:s})]))}renderEvents(t=[]){et("events").replaceChildren(...[...t].reverse().slice(0,50).map(e=>Tt("li",{},Tt("code",{textContent:e.event_id}),Tt("span",{textContent:`${e.tool} \xB7 ${e.summary}`}),Tt("span",{className:"src",textContent:e.source}))))}renderDocuments(){et("documents").replaceChildren(...Object.values(this.bundle.documents).map(t=>{let e=Tt("li",{},Tt("code",{textContent:t.id})),n=Tt("a",{href:"#",textContent:t.title});return n.addEventListener("click",s=>{s.preventDefault(),this.assistant.action("showManual",null,t.id)}),e.append(n,` \xB7 ${t.edition||""} \xB7 validity: ${t.validity.replace("_"," ")}`),e})),et("versions").textContent=`Catalog ${this.bundle.catalog_version} \xB7 rules ${this.bundle.rules_versions.diagnosis} \xB7 ${this.bundle.rules_versions.loop} \xB7 mode ${ls}`}renderIdentity(){let t=this.identity;t&&(et("btn-confirm").disabled=t.confirmed,et("btn-confirm").textContent=t.confirmed?"Asset confirmed \u2713":"Confirm asset",et("btn-go-diag").disabled=!t.confirmed,this.frame||(et("recog-card").className="card found",et("recog-card").replaceChildren(Tt("div",{className:"match"},Tt("strong",{textContent:t.model}),Tt("span",{className:"tag oem",textContent:t.status.replace("_"," ")})),Tt("div",{className:"muted small",textContent:`Asset ${t.asset_id} \xB7 pending: ${t.pending_fields.join(", ")}`}))))}recordTx(t,e,n){t&&(this.transactions.unshift({...t,event_id:e,label:n}),this.transactions.length=Math.min(this.transactions.length,30),this.renderFrames(),this.showStatus(t,e),this.holdUntil=Date.now()+4e3,this.tht.playTransaction(t))}showStatus(t,e=null){let n=t.decode.status;this.lastStatus=n,et("d-status").textContent=gi[n]+(e?` \xB7 ${e}`:" \xB7 live simulation"),et("d-status").className=n==="valid"?"pos":"neg",et("d-reading").textContent=n==="valid"?`${t.decode.values.temperature_c.toFixed(1)} \xB0C \xB7 ${t.decode.values.humidity_rh.toFixed(1)} %RH (simulated)`:"No valid reading";let s=et("diag-verdict");s.className="verdict "+(n==="valid"?"ok":"fail"),s.textContent=n==="valid"?"Sensor answering \xB7 CRC OK":gi[n]}renderFrames(){let t=(e,n,s)=>e?Tt("span",{className:"bytes"},...Rd(e,n).map(r=>Tt("span",{className:`b ${r.role}${s&&r.role===s?" bad":""}`,textContent:r.hex}))):Tt("span",{className:"muted small",textContent:"\u2014 no reply within 1000 ms \u2014"});et("frames").replaceChildren(...this.transactions.map(e=>{let n=e.decode.status,s=e.decode.checks.find(a=>!a.ok),r=s&&{crc:"crc",address:"addr",function:"fn",byte_count:"count",sensor:"data"}[s.check];return Tt("li",{className:n==="valid"?"ok":"fail"},Tt("div",{className:"hdr"},Tt("span",{textContent:`${e.event_id||"live"} \xB7 ${e.label||"poll"}${e.injection!=="none"?" \xB7 inject "+e.injection:""}`}),Tt("strong",{textContent:gi[n]})),Tt("div",{className:"dir"},Tt("span",{textContent:"REQ"}),t(e.request_hex,"request")),Tt("div",{className:"dir"},Tt("span",{textContent:"RSP"}),t(e.response_hex,"response",r)),Tt("div",{className:"checks"},...e.decode.checks.map(a=>Tt("span",{className:a.ok?"ok":"no",textContent:`${a.ok?"\u2713":"\u2717"} ${a.check}`,title:a.detail}))))}))}livePoll(){if(this.ws==="compat"||!this.bus||this.tht.anim||Date.now()<this.holdUntil||document.hidden)return;let t=En(this.bus.master_address,new wn(this.bus.dip_bits,this.bundle.incident.temperature_c,this.bundle.incident.humidity_rh));this.tht.playTransaction(t,{quiet:!0}),this.showStatus(t)}async capture(){this.setWorkspace("live",{quiet:!0});let t=et("hud");t.classList.remove("flash"),t.offsetWidth,t.classList.add("flash");let e=await Tn("capture_frame",{source:"simulated"});return this.frame=e,this.tht.preset("camera"),et("recog-box").hidden=!1,et("recog-tag").textContent="TZ THT-02 \xB7 plate match (simulated)",et("recog-card").className="card found",et("recog-card").replaceChildren(Tt("div",{className:"match"},Tt("strong",{textContent:"TZ THT-02"}),Tt("span",{className:"tag synthetic",textContent:"needs confirmation"})),Tt("div",{className:"plate",textContent:e.plate_text.join(`
`)}),Tt("div",{className:"muted small",textContent:`${e.frame_id} \xB7 source ${e.source} \xB7 hint ${e.asset_hint} \xB7 ${e.event_id}`})),et("btn-confirm").disabled=!1,et("btn-confirm").textContent="Confirm asset",await this.refreshSession(),[`Frame captured (${e.event_id}, simulated source). The nameplate reads **${e.plate_text[0]}** \xB7 ${e.plate_text[2]} \xB7 ${e.plate_text[3]}.`,`It matches catalog product tzone-tht-02 and asset ${e.asset_hint} on bulkhead FR 42. This is only a candidate: the plate is synthetic and a technician must confirm it before any diagnosis.`].join(`
`)}async confirm(){!this.frame&&!this.identity&&await this.capture();let t=await Tn("confirm_asset",{model:"TZ THT-02",id_source:"plate_simulated",confirmed:!0,asset_id:"BOAT-ER-TH-02"});return await this.refreshSession(),t.status==="insufficient_evidence"?"[warn] "+t.missing:(this.renderIdentity(),et("recog-tag").textContent="TZ THT-02 \xB7 confirmed",[`[ok] Asset confirmed by the technician (${t.event_id}): **${t.model}** at ${t.asset_id}.`,`Session pinned to ${t.pins.catalog_version} and rules ${t.pins.rules_version.diagnosis}.`,`[warn] Not verified from the plate: ${t.pending_fields.join(", ")}.`,"Next: open the diagnosis and ask \u201CWhy does it fail?\u201D."].join(`
`))}async ensureIdentity(t){this.identity?.confirmed||t.push(await this.confirm())}showPlate(){return this.setWorkspace("live",{quiet:!0}),this.stage.view==="xray"&&this.setView("normal"),this.setExplode(0),this.tht.preset("plate"),`Zoomed on the nameplate: \u201C${this.bundle.assets["BOAT-ER-TH-02"].plate_lines.join(" / ")}\u201D. The plate is synthetic for this demo, so it identifies the model but not the order variant or factory address.`}async whyFail(){let t=[];await this.ensureIdentity(t),this.setWorkspace("diag",{quiet:!0});let e=await Tn("get_asset_status",{transport:"simulated_rtu"});await this.refreshSession(),this.recordTx(e.transaction,e.event_id,"diagnosis poll"),this.tht.preset("overview");let n=e.transaction,s=n.decode.status,r=this.bus.dip_bits;if(s==="valid")return t.push(`[ok] It does not fail right now (${e.event_id}): the master polls address ${n.master_address}, the sensor answers with a valid CRC: **${n.decode.values.temperature_c.toFixed(1)} \xB0C, ${n.decode.values.humidity_rh.toFixed(1)} %RH** (simulated).`),t.join(`
`);if(s==="timeout"&&n.device_address!==n.master_address)t.push(`**Diagnosis (${e.event_id}, rules ${this.bundle.rules_versions.diagnosis}):** the master sends \`${n.request_hex}\` to address **${n.master_address}** and gets no reply within 1000 ms.`,`The sensor DIP reads ${Sl(r)} \u2192 address **${n.device_address}** (manual \xA7 5: switches 1\u20138 weigh 128\u20261).`,`A Modbus slave only answers frames for its own address (\xA7 6.4), so the request for ${n.master_address} is silently ignored. That is a timeout, not a CRC or wiring fault.`,`Fix: set the DIP to address ${n.master_address} (only switch 8 ON), or change the master to poll ${n.device_address}. Source: TZ-THT02-UM-V1.0 \xA7 5, \xA7 6.4, \xA7 6.10 \u2014 validity *to confirm*.`);else{let a=n.decode.checks.find(o=>!o.ok);t.push(`[fail] Poll result (${e.event_id}): ${gi[s]}${a?` \u2014 ${a.check}: ${a.detail}`:""}.`)}return t.join(`
`)}async showManual(t="5",e="TZ-THT02-UM-V1.0"){let n=this.bundle.documents[e],s=n?.product_id||(e==="TZ-THT02-UM-V1.0"?"tzone-tht-02":null),r=s==="tzone-tht-02"?await Tn("get_document",{product_id:s,doc_type:"user_manual"}):{status:"ok",source:"documented",document:n,sections:n.sections,event_id:null};if(await this.refreshSession(),r.status!=="ok")return"[warn] "+r.missing;let a=r.document;et("manual-title").textContent=a.title,et("manual-meta").textContent=[a.id,a.edition,a.date,a.origin].filter(Boolean).join(" \xB7 "),et("manual-validity").textContent=`Validity: ${a.validity.replace("_"," ")}. ${a.validity_note||""}`,et("manual-sections").replaceChildren(...Object.entries(r.sections).map(([c,h])=>Tt("article",{className:c===t?"hl":"",id:"sec-"+c},Tt("h4",{textContent:`\xA7 ${c} \xB7 ${h.title}${h.page?` \xB7 p. ${h.page}`:""}`}),Tt("p",{textContent:h.excerpt||h.text||""})))),et("manual-event").textContent=r.event_id?`Retrieved as ${r.event_id}`:"Preloaded document",et("manual-link").href=a.url;let o=et("manual");o.open||o.showModal(),et("sec-"+t)?.scrollIntoView({block:"nearest"});let l=r.sections[t];return l?`Opened ${a.id} (${a.edition}, ${a.date}) at \xA7 ${t} \u201C${l.title}\u201D: ${l.excerpt}
Validity: ${a.validity.replace("_"," ")} \u2014 ${a.validity_note}`:`Opened ${a.id}. Validity: ${a.validity.replace("_"," ")}.`}async dipFix(){let t=[];await this.ensureIdentity(t),this.setWorkspace("diag",{quiet:!0});let e=await Tn("simulate_fault",{scenario:"dip_fix"});await this.refreshSession(),this.holdUntil=Date.now()+9e3,this.setView("normal"),this.setExplode(1),this.tht.preset("dip"),await new Promise(s=>setTimeout(s,1700)),this.applyBus({master_address:e.after.master_address,dip_bits:en(e.after.device_address)}),await new Promise(s=>setTimeout(s,1600)),this.setExplode(0),this.tht.preset("overview"),await new Promise(s=>setTimeout(s,1200)),this.recordTx(e.after,e.event_id,"after DIP fix");let n=e.after.decode.values;return t.push(`**Simulated fix (${e.event_id}):** opened the probe (rear gland, then the barrel at the middle seam) and set the DIP to ${Sl(en(e.after.device_address))} \u2192 address ${e.after.device_address}.`,`Before: ${gi[e.before.decode.status]}. After: ${gi[e.after.decode.status]}${n?` \u2014 **${n.temperature_c.toFixed(1)} \xB0C, ${n.humidity_rh.toFixed(1)} %RH**`:""}.`,"This is a simulation. On the real unit, power it down before changing the DIP, and confirm the address with a bench reader."),t.join(`
`)}async worksNow(){let t=[];await this.ensureIdentity(t),this.setWorkspace("diag",{quiet:!0});let e=await Tn("get_asset_status",{transport:"simulated_rtu"});await this.refreshSession(),this.recordTx(e.transaction,e.event_id,"verification poll");let n=e.transaction;return n.decode.status==="valid"?t.push(`[ok] Yes (${e.event_id}): address ${n.master_address} answers \`${n.response_hex}\`, CRC OK \u2192 **${n.decode.values.temperature_c.toFixed(1)} \xB0C, ${n.decode.values.humidity_rh.toFixed(1)} %RH**. Source: simulated RTU, not a field measurement.`):t.push(`[fail] Not yet (${e.event_id}): ${gi[n.decode.status]}. Ask \u201CWhy does it fail?\u201D or \u201Csimulate the DIP fix\u201D.`),t.join(`
`)}async resetCase(){let t=[];await this.ensureIdentity(t);let e=await Tn("simulate_fault",{scenario:"reset"});return await this.refreshSession(),this.applyBus({master_address:e.after.master_address,dip_bits:en(e.after.device_address)}),this.recordTx(e.after,e.event_id,"case reset"),t.push(`Case reset (${e.event_id}): ${e.action}`),t.join(`
`)}async inject(t){let e=[];await this.ensureIdentity(e),this.ws==="compat"&&this.setWorkspace("diag",{quiet:!0});let n=await Tn("simulate_fault",{scenario:t});await this.refreshSession(),this.recordTx(n.after,n.event_id,"injection");let s=n.after,r=s.decode.checks.find(o=>!o.ok),a={bad_crc:"The reply CRC does not match its bytes, so the master must discard it (\xA7 6.10). A real slave would not even answer a corrupted request.",foreign_address:"The reply comes from a different slave address than the one polled, so it is rejected.",sensor_fault:"The registers carry 7FFF H, which the manual defines as \u201Csensor abnormal\u201D (\xA7 6.7). The frame is valid; the reading is not."}[t];return s.device_address!==s.master_address?e.push(`Injected ${t} (${n.event_id}), but the sensor is still on address ${s.device_address}, so there was no reply to corrupt (timeout). Fix the DIP first to see the effect.`):e.push(`Injected **${t}** on one reply (${n.event_id}): ${gi[s.decode.status]}${r?` \u2014 ${r.check}: ${r.detail}`:""}.`,a),e.join(`
`)}async bench(){let t=[];await this.ensureIdentity(t);let e=await Tn("get_asset_status",{transport:"rtu_bench"});return await this.refreshSession(),t.push(`[warn] Bench RS-485 reader (${e.event_id}): source **${e.source}**. ${e.detail} Nothing is inferred without a reading.`),t.join(`
`)}async toggleDip(t){if(!this.identity?.confirmed){this.toast("Confirm the asset first (Live view \u2192 Capture \u2192 Confirm).");return}let e=[...this.bus.dip_bits];e[t]=e[t]?0:1;try{let n=await Tn("simulate_fault",{scenario:"set_dip",dip_bits:e});await this.refreshSession(),this.applyBus({master_address:n.after.master_address,dip_bits:e}),this.recordTx(n.after,n.event_id,`DIP ${t+1} ${e[t]?"ON":"OFF"}`),this.toast(`DIP ${t+1} ${e[t]?"ON":"OFF"} \u2192 address ${n.after.device_address} \xB7 ${gi[n.after.decode.status]}`)}catch(n){this.toast(n.message)}}buildDip(){et("dip").replaceChildren(...Fi.map((t,e)=>{let n=Tt("button",{type:"button",title:`Switch ${e+1} \xB7 weight ${t}`},Tt("span",{className:"slot"}),Tt("span",{textContent:String(e+1)}));return n.addEventListener("click",()=>this.toggleDip(e)),n}))}renderDip(){[...et("dip").children].forEach((t,e)=>{t.classList.toggle("on",!!this.bus.dip_bits[e]),t.setAttribute("aria-pressed",String(!!this.bus.dip_bits[e]))}),et("dip-sum").textContent="= "+this.bus.dip_bits.map((t,e)=>t?Fi[e]:0).filter(Boolean).join(" + ")+` = ${this.bus.device_address}`}exportReport(){let t=jr(),e={generated_at:new Date().toISOString(),source:"simulated",note:"Demo session. Readings come from a simulated Modbus RTU slave, not from field equipment.",mode:ls,pins:t.pins,identity:t.identity,bus:this.bus,events:t.events,transactions:this.transactions,documents:Object.values(this.bundle.documents).map(({sections:n,...s})=>s),replacement:this.replacement&&{status:this.replacement.status,criteria:this.replacement.criteria,config:this.config}};return this.download(e,"fieldscan-session-report.json"),`Exported fieldscan-session-report.json with ${t.events.length} events, ${this.transactions.length} RTU transactions and the session pins. Every value is tagged as simulated or documented.`}download(t,e){let n=URL.createObjectURL(new Blob([JSON.stringify(t,null,2)],{type:"application/json"}));Tt("a",{href:n,download:e}).click(),setTimeout(()=>URL.revokeObjectURL(n),1e3)}async setConfig(t,e="ui"){Object.assign(this.config,t);for(let[s,r]of Object.entries(this.config)){let a=document.querySelector(`input[name="${s}"][value="${r}"]`);a&&(a.checked=!0)}let n=++this.requestId;et("export").disabled=!0;try{let s=await Bd(this.config);if(n!==this.requestId)return;let r=this.report;this.report=s,this.render(s),this.loop.applyReport(s),this.telemetry.setReport(s),et("export").disabled=!1,this.ws==="compat"&&e!=="init"&&await this.refreshReplacement(),e!=="init"&&this.assistant.onReport(s,r,e)}catch(s){if(n!==this.requestId)return;et("verdict").className="verdict fail",et("verdict").textContent="Local result unavailable",et("replacement").textContent=s.message+" Reload or regenerate the file."}}async refreshReplacement(){let t=JSON.stringify(this.config);if(this.replacementKey===t)return this.replacement;try{let e=await Tn("check_replacement",{candidate:"eh-fmx11",...this.config});return this.replacement=e,this.replacementKey=t,await this.refreshSession(),et("criteria").replaceChildren(...(e.criteria||[]).map(n=>Tt("li",{title:n.detail},Tt("span",{textContent:n.criterion.replace(/_/g," ")+(n.margin_ohm!==void 0?` (${n.margin_ohm>=0?"+":""}${sa.format(n.margin_ohm)} \u03A9)`:"")}),Tt("span",{className:"st "+n.status,textContent:n.status})))),e}catch(e){return this.toast(e.message),null}}render(t){let e=t.load_check,n=t.simulation,s=e.status==="pass";et("verdict").className="verdict "+(s?"ok":"fail"),et("verdict").textContent=s?"Passes the load check":"Incompatible: load exceeded",et("m-limit").textContent=sa.format(e.available_ohm)+" \u03A9",et("m-load").textContent=sa.format(e.evaluated_ohm)+" \u03A9",et("m-margin").textContent=(e.margin_ohm>=0?"+":"")+sa.format(e.margin_ohm)+" \u03A9",et("m-margin").className=e.margin_ohm>=0?"pos":"neg",et("m-state").textContent=$x[n.state],et("m-signal").textContent=n.loop_signal_ma===null?"Indeterminate":sa.format(n.loop_signal_ma)+" mA",et("m-count").textContent=n.plc_ideal_count===null?"No valid reading":new Intl.NumberFormat("en-US").format(n.plc_ideal_count);let r=e.evaluated_ohm/e.available_ohm;et("gauge-fill").style.width=Math.min(100,r*100)+"%",et("gauge-fill").style.background=r<=1?"var(--ok)":"var(--fail)",et("replacement").className="replacement"+(s?"":" fail"),et("replacement").textContent=s?"Replacement equivalence: insufficient evidence.":"Replacement equivalence: incompatible with the evaluated profile.",et("pending").replaceChildren(...t.pending.map(a=>Tt("li",{textContent:a}))),et("sources").replaceChildren(...t.sources.map(a=>Tt("li",{},Tt("code",{textContent:a.id}),Tt("a",{href:a.url,textContent:a.title,target:"_blank",rel:"noopener noreferrer"})," \xB7 "+a.section))),this.inspected&&this.ws==="compat"&&this.inspect(this.inspected,{reveal:!1})}onSample(t){this.loop.updateLive(t),et("t-ma").textContent=t.ma===null?"suppressed":t.ma.toFixed(3)+" mA",et("t-v").textContent=t.supply.toFixed(2)+" V",et("t-term").textContent=t.terminalAtDesign.toFixed(2)+" V "+(t.terminalAtDesign>=8?"(\u2265 8 V)":"(< 8 V)"),et("t-term").className=t.terminalAtDesign>=8?"pos":"neg",et("t-count").textContent=t.count===null?"\u2014":String(t.count),et("t-level").textContent=(t.level*100).toFixed(1)+" %",et("t-diag").textContent=t.diag,et("t-diag").className=t.diag==="OK"?"pos":"neg",et("tab-telemetry").hidden||nh(et("chart"),this.telemetry.history)}exportJson(){this.report&&this.download({...this.report,replacement_check:this.replacement},"boat-mvp-result.json")}async checkLink(){let t=await eh();et("pill-link").textContent=t.ok?"Local server":"Server unreachable",et("pill-link").className="pill "+(t.ok?"ok":"fail")}updateNetwork(){et("pill-net").textContent=navigator.onLine?"Online":"Offline \xB7 local mode",et("pill-net").className="pill "+(navigator.onLine?"ok":"warn")}setView(t){this.stage.setView(t),this.syncDock()}setExplode(t){this.stage.setExplode(t),et("explode").value=t,this.syncDock()}preset(t){let e=this.stage===this.tht?"tht":"loop";(e==="loop"&&t==="probe"||e==="tht"&&t==="dip")&&this.stage.view==="normal"&&this.stage.explodeTarget<.5&&(this.setView("xray"),this.toast("Switched to X-ray to see inside")),this.stage.preset(t)}focus(t){let e=this.stage===this.tht?"tht":"loop";Yx[e].includes(t)&&this.stage.view==="normal"&&this.stage.explodeTarget<.5&&(this.setView("xray"),this.toast("Switched to X-ray to see inside")),this.stage.focus(t)}partName(t){return this.stage.parts[t]?.name||t}viewState(){return{workspace:this.ws,view:this.stage.view,explode:this.stage.explodeTarget,selected:this.inspected||null}}syncDock(){let t=this.stage.view,e=this.stage.explodeTarget;for(let n of document.querySelectorAll("#view-modes button")){let s=n.dataset.view==="normal"?t==="normal"&&e===0:n.dataset.view==="xray"?t==="xray":e>0;n.setAttribute("aria-pressed",String(s))}et("explode").value=e}buildCams(){let t=this.stage===this.tht?"tht":"loop";et("cams").replaceChildren(...qx[t].map(([e,n])=>{let s=Tt("button",{type:"button",textContent:n});return s.dataset.cam=e,s.addEventListener("click",()=>this.preset(e)),s}))}buildAssembly(){let t=this.stage;et("assembly").replaceChildren(...Object.entries(t.parts).map(([e,n])=>{let s=Tt("li");s.dataset.id=e,n.parent&&(s.style.paddingLeft=(t.parts[n.parent]?.parent?36:22)+"px");let r=Tt("input",{type:"checkbox",checked:!0,title:"Visible"});r.addEventListener("click",o=>o.stopPropagation()),r.addEventListener("change",()=>t.setPartVisible?t.setPartVisible(e,r.checked):n.object.visible=r.checked);let a=Tt("span",{className:"dot"});return a.style.background=n.color,s.append(r,a,Tt("span",{textContent:n.name})),s.addEventListener("click",()=>{this.inspect(e),this.focus(e)}),s}))}liveValue(t){if(this.stage===this.tht)return t==="Current address"?`${this.bus.device_address} (DIP ${Sl(this.bus.dip_bits)})`:"\u2014";let e=this.report,n=this.telemetry.last;return{"Loop current":n?.ma===null?"Suppressed":(n?.ma??e.simulation.loop_signal_ma)?.toFixed?.(2)+" mA","Additional series load":`+${e.inputs.synthetic_additional_series_ohm} \u03A9`,Output:`${e.inputs.supply_v} V DC`}[t]??"\u2014"}inspect(t,{reveal:e=!0}={}){let n=this.stage;this.inspected=t,n.select(t);for(let c of document.querySelectorAll("#assembly li"))c.classList.toggle("selected",c.dataset.id===t);let s=et("inspector");if(!t||!n.parts[t]){this.inspected=null,s.replaceChildren(Tt("p",{className:"muted",textContent:"Click any part in the 3D twin to inspect it."}));return}e&&this.openTab("inspector");let r=n.parts[t],a=Tt("table",{className:"spec"},...r.specs.map(([c,h,d,f])=>{let[u,m]=af[d]||af.pending;return Tt("tr",{},Tt("td",{textContent:c}),Tt("td",{},(h==="live"?this.liveValue(c):h)+" ",Tt("span",{className:"tag "+m,textContent:u,title:f||""})))})),o=Tt("div",{className:"actions"}),l=(c,h)=>{let d=Tt("button",{type:"button",textContent:c});d.addEventListener("click",h),o.append(d)};l("Focus",()=>this.focus(t)),l("Isolate",()=>n.isolate(t)),l("Show all",()=>{n.showAll();for(let c of document.querySelectorAll("#assembly input"))c.checked=!0}),l(n.explodeTarget>0?"Reassemble":"Disassemble",()=>{this.setExplode(n.explodeTarget>0?0:1),this.inspect(t)}),s.replaceChildren(Tt("h4",{textContent:r.name}),Tt("p",{className:"role",textContent:r.role}),r.specs.length?a:Tt("p",{className:"muted small",textContent:"No datasheet fields for this part."}),o)}hudLoop(){requestAnimationFrame(()=>this.hudLoop());let t=et("recog-box");if(this.ws!=="live"||t.hidden)return;let e=this.tht,n=e.parts.tht?.object;if(!n)return;this.hudBox||(this.hudBox=new Ke),this.hudBox.setFromObject(n,!0);let s=e.renderer.domElement.getBoundingClientRect(),r=1/0,a=1/0,o=-1/0,l=-1/0,c=new R,{min:h,max:d}=this.hudBox;for(let m=0;m<8;m++){c.set(m&1?d.x:h.x,m&2?d.y:h.y,m&4?d.z:h.z).project(e.camera);let x=s.left+(c.x+1)/2*s.width,g=s.top+(1-c.y)/2*s.height;r=Math.min(r,x),a=Math.min(a,g),o=Math.max(o,x),l=Math.max(l,g)}let f=et("hud").getBoundingClientRect(),u=10;Object.assign(t.style,{left:r-f.left-u+"px",top:a-f.top-u+"px",width:o-r+2*u+"px",height:l-a+2*u+"px"})}openTab(t){document.querySelector(`.tabs button[data-tab="${t}"]`)?.hidden&&(t="assistant");for(let e of document.querySelectorAll(".tabs button"))e.setAttribute("aria-selected",String(e.dataset.tab===t));for(let e of document.querySelectorAll(".tab"))e.hidden=e.id!=="tab-"+t;t==="telemetry"&&nh(et("chart"),this.telemetry.history)}tooltip(t,e,n){let s=et("tooltip");if(!t){s.hidden=!0;return}s.hidden=!1,s.textContent=t,s.style.left=e+14+"px",s.style.top=n+12+"px"}toast(t){let e=et("toast");e.textContent=t,e.hidden=!1,clearTimeout(this.toastTimer),this.toastTimer=setTimeout(()=>{e.hidden=!0},3200)}bindUi(){let t=(n,s,...r)=>et(n).addEventListener("click",()=>this.assistant.action(s,...r));for(let n of document.querySelectorAll(".workspaces button"))n.addEventListener("click",()=>this.setWorkspace(n.dataset.ws));t("btn-capture","capture"),t("btn-confirm","confirm"),t("btn-plate","showPlate"),t("btn-why","whyFail"),t("btn-manual","showManual","5"),t("btn-fix","dipFix"),t("btn-works","worksNow"),t("btn-reset","resetCase"),t("btn-report","exportReport"),t("btn-bench","bench"),et("btn-go-diag").addEventListener("click",()=>this.setWorkspace("diag")),et("btn-torch").addEventListener("click",n=>{let s=n.currentTarget.getAttribute("aria-pressed")!=="true";n.currentTarget.setAttribute("aria-pressed",String(s)),this.tht.setTorch(s)});for(let n of document.querySelectorAll("[data-inject]"))n.addEventListener("click",()=>this.assistant.action("inject",n.dataset.inject));et("manual-close").addEventListener("click",()=>et("manual").close()),et("manual").addEventListener("click",n=>{n.target===et("manual")&&et("manual").close()}),et("controls").addEventListener("submit",n=>n.preventDefault()),et("controls").addEventListener("change",n=>{let{name:s,value:r}=n.target;this.setConfig({[s]:s==="voltage"?Number(r):r},"ui")}),et("export").addEventListener("click",()=>this.exportJson());for(let n of document.querySelectorAll(".tabs button"))n.addEventListener("click",()=>this.openTab(n.dataset.tab));et("view-modes").addEventListener("click",n=>{let s=n.target.dataset?.view;if(s==="normal"&&(this.setView("normal"),this.setExplode(0)),s==="xray"&&this.setView(this.stage.view==="xray"?"normal":"xray"),s==="exploded"){let r=this.stage.explodeTarget===0;this.setExplode(r?1:0),r&&this.stage===this.tht&&this.tht.preset("probe")}}),et("explode").addEventListener("input",n=>this.setExplode(Number(n.target.value)));let e=(n,s)=>{let r=et(n);r.addEventListener("click",()=>{let a=r.getAttribute("aria-pressed")!=="true";r.setAttribute("aria-pressed",String(a)),s(a)})};e("labels-toggle",n=>{this.tht.setLabels(n),this.loop.setLabels(n)}),e("rotate-toggle",n=>{this.tht.setAutoRotate(n),this.loop.setAutoRotate(n)}),window.addEventListener("keydown",n=>{n.target.closest("input, textarea, dialog")||["1","2","3"].includes(n.key)&&this.setWorkspace({1:"live",2:"diag",3:"compat"}[n.key])}),window.addEventListener("online",()=>{this.updateNetwork(),this.assistant.onNetwork(!0)}),window.addEventListener("offline",()=>{this.updateNetwork(),this.assistant.onNetwork(!1)})}},lf=new uh;lf.start();window.__app=lf;})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
