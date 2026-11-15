(()=>{var Di={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Ni={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},au=0,oc=1,ou=2;var Qi=1,lu=2,Fs=3,Ui=0,kt=1,Nt=2,es=0,Bs=1,ts=2,lc=3,cc=4,cu=5;var ns=100,hu=101,uu=102,du=103,fu=104,pu=200,mu=201,gu=202,_u=203,hc=204,uc=205,xu=206,yu=207,vu=208,bu=209,Su=210,Mu=211,wu=212,Eu=213,Tu=214,La=0,Da=1,Na=2,As=3,Ua=4,Oa=5,Fa=6,Ba=7,go=0,Au=1,Ru=2,jn=0,dc=1,fc=2,pc=3,Fr=4,mc=5,gc=6,_c=7;var xc=300,is=301,ks=302,_o=303,xo=304,Ei=1e3,vn=1001,ka=1002,Dt=1003,Cu=1004;var Br=1005;var Zt=1006,yo=1007;var hi=1008;var en=1009,yc=1010,vc=1011,zs=1012,vo=1013,Fn=1014,En=1015,Bn=1016,bo=1017,So=1018,ss=1020,bc=35902,Sc=35899,Mc=1021,wc=1022,kn=1023,ai=1026,ui=1027,Mo=1028,wo=1029,Oi=1030,Eo=1031;var To=1033,kr=33776,zr=33777,Hr=33778,Gr=33779,Ao=35840,Ro=35841,Co=35842,Po=35843,Io=36196,Lo=37492,Do=37496,No=37488,Uo=37489,Vr=37490,Oo=37491,Fo=37808,Bo=37809,ko=37810,zo=37811,Ho=37812,Go=37813,Vo=37814,Wo=37815,Xo=37816,$o=37817,qo=37818,Yo=37819,Zo=37820,jo=37821,Jo=36492,Ko=36494,Qo=36495,el=36283,tl=36284,Wr=36285,nl=36286;var cr=2300,za=2301,Pa=2302,jl=2303,Jl=2400,Kl=2401,Ql=2402;var Pu=3200;var Xr=0,Iu=1,di="",Ft="srgb",hr="srgb-linear",ur="linear",st="srgb";var Ia=7680;var Lu=519,Du=512,Nu=513,Uu=514,Ec=515,Ou=516,Fu=517,Tc=518,Ac=519,Bu=35044;var Rc="300 es",bn=2e3,Rs=2001;function _f(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function xf(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function dr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function ku(){let i=dr("canvas");return i.style.display="block",i}var Eh={},Cs=null;function Cc(...i){let e="THREE."+i.shift();Cs?Cs("log",e,...i):console.log(e,...i)}function zu(i){let e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ie(...i){i=zu(i);let e="THREE."+i.shift();if(Cs)Cs("warn",e,...i);else{let t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function Be(...i){i=zu(i);let e="THREE."+i.shift();if(Cs)Cs("error",e,...i);else{let t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Xi(...i){let e=i.join(" ");e in Eh||(Eh[e]=!0,Ie(...i))}function Hu(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}var Gu={[La]:La,[Na]:Fa,[Ua]:Ua,[As]:Oa,[Da]:Da,[Fa]:Na,[Ba]:Ba,[Oa]:As},Dn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let s=n[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}},Vt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Th=1234567,rr=Math.PI/180,$i=180/Math.PI;function Hs(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Vt[i&255]+Vt[i>>8&255]+Vt[i>>16&255]+Vt[i>>24&255]+"-"+Vt[e&255]+Vt[e>>8&255]+"-"+Vt[e>>16&15|64]+Vt[e>>24&255]+"-"+Vt[t&63|128]+Vt[t>>8&255]+"-"+Vt[t>>16&255]+Vt[t>>24&255]+Vt[n&255]+Vt[n>>8&255]+Vt[n>>16&255]+Vt[n>>24&255]).toLowerCase()}function We(i,e,t){return Math.max(e,Math.min(t,i))}function Pc(i,e){return(i%e+e)%e}function yf(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function vf(i,e,t){return i!==e?(t-i)/(e-i):0}function ar(i,e,t){return(1-t)*i+t*e}function bf(i,e,t,n){return ar(i,e,1-Math.exp(-t*n))}function Sf(i,e=1){return e-Math.abs(Pc(i,e*2)-e)}function Mf(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function wf(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function Ef(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Tf(i,e){return i+Math.random()*(e-i)}function Af(i){return i*(.5-Math.random())}function Rf(i){i!==void 0&&(Th=i);let e=Th+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Cf(i){return i*rr}function Pf(i){return i*$i}function If(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function Lf(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Ic(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Df(i,e,t,n,s){let r=Math.cos,a=Math.sin,o=r(t/2),l=a(t/2),c=r((e+n)/2),h=a((e+n)/2),d=r((e-n)/2),f=a((e-n)/2),u=r((n-e)/2),p=a((n-e)/2);switch(s){case"XYX":i.set(o*h,l*d,l*f,o*c);break;case"YZY":i.set(l*f,o*h,l*d,o*c);break;case"ZXZ":i.set(l*d,l*f,o*h,o*c);break;case"XZX":i.set(o*h,l*p,l*u,o*c);break;case"YXY":i.set(l*u,o*h,l*p,o*c);break;case"ZYZ":i.set(l*p,l*u,o*h,o*c);break;default:Ie("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Lc(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Vu(i,e){if(e.constructor===Float32Array)return i;let t=Lc(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(i/t,-1)}function Wu(i,e){if(e.constructor===Float32Array)return i;let t=Lc(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(i*t)}var Dc={DEG2RAD:rr,RAD2DEG:$i,generateUUID:Hs,clamp:We,euclideanModulo:Pc,mapLinear:yf,inverseLerp:vf,lerp:ar,damp:bf,pingpong:Sf,smoothstep:Mf,smootherstep:wf,randInt:Ef,randFloat:Tf,randFloatSpread:Af,seededRandom:Rf,degToRad:Cf,radToDeg:Pf,isPowerOfTwo:If,ceilPowerOfTwo:Lf,floorPowerOfTwo:Ic,setQuaternionFromProperEuler:Df,normalize:Wu,denormalize:Vu},kc=class kc{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};kc.prototype.isVector2=!0;var ge=kc,jt=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],d=n[s+3],f=r[a+0],u=r[a+1],p=r[a+2],x=r[a+3];if(d!==x||l!==f||c!==u||h!==p){let g=l*f+c*u+h*p+d*x;g<0&&(f=-f,u=-u,p=-p,x=-x,g=-g);let m=1-o;if(g<.9995){let v=Math.acos(g),w=Math.sin(v);m=Math.sin(m*v)/w,o=Math.sin(o*v)/w,l=l*m+f*o,c=c*m+u*o,h=h*m+p*o,d=d*m+x*o}else{l=l*m+f*o,c=c*m+u*o,h=h*m+p*o,d=d*m+x*o;let v=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=v,c*=v,h*=v,d*=v}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],d=r[a],f=r[a+1],u=r[a+2],p=r[a+3];return e[t]=o*p+h*d+l*u-c*f,e[t+1]=l*p+h*f+c*d-o*u,e[t+2]=c*p+h*u+o*f-l*d,e[t+3]=h*p-o*d-l*f-c*u,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),d=o(r/2),f=l(n/2),u=l(s/2),p=l(r/2);switch(a){case"XYZ":this._x=f*h*d+c*u*p,this._y=c*u*d-f*h*p,this._z=c*h*p+f*u*d,this._w=c*h*d-f*u*p;break;case"YXZ":this._x=f*h*d+c*u*p,this._y=c*u*d-f*h*p,this._z=c*h*p-f*u*d,this._w=c*h*d+f*u*p;break;case"ZXY":this._x=f*h*d-c*u*p,this._y=c*u*d+f*h*p,this._z=c*h*p+f*u*d,this._w=c*h*d-f*u*p;break;case"ZYX":this._x=f*h*d-c*u*p,this._y=c*u*d+f*h*p,this._z=c*h*p-f*u*d,this._w=c*h*d+f*u*p;break;case"YZX":this._x=f*h*d+c*u*p,this._y=c*u*d+f*h*p,this._z=c*h*p-f*u*d,this._w=c*h*d-f*u*p;break;case"XZY":this._x=f*h*d-c*u*p,this._y=c*u*d-f*h*p,this._z=c*h*p+f*u*d,this._w=c*h*d+f*u*p;break;default:Ie("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],d=t[10],f=n+o+d;if(f>0){let u=.5/Math.sqrt(f+1);this._w=.25/u,this._x=(h-l)*u,this._y=(r-c)*u,this._z=(a-s)*u}else if(n>o&&n>d){let u=2*Math.sqrt(1+n-o-d);this._w=(h-l)/u,this._x=.25*u,this._y=(s+a)/u,this._z=(r+c)/u}else if(o>d){let u=2*Math.sqrt(1+o-n-d);this._w=(r-c)/u,this._x=(s+a)/u,this._y=.25*u,this._z=(l+h)/u}else{let u=2*Math.sqrt(1+d-n-o);this._w=(a-s)/u,this._x=(r+c)/u,this._y=(l+h)/u,this._z=.25*u}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(We(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,s=e._y,r=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-t;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},zc=class zc{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Ah.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Ah.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*s-o*n),h=2*(o*t-r*s),d=2*(r*n-a*t);return this.x=t+l*c+a*d-o*h,this.y=n+l*h+o*c-r*d,this.z=s+l*d+r*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,l=t.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Tl.copy(this).projectOnVector(e),this.sub(Tl)}reflect(e){return this.sub(Tl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(We(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};zc.prototype.isVector3=!0;var R=zc,Tl=new R,Ah=new jt,Hc=class Hc{constructor(e,t,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c)}set(e,t,n,s,r,a,o,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=o,h[3]=t,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],d=n[7],f=n[2],u=n[5],p=n[8],x=s[0],g=s[3],m=s[6],v=s[1],w=s[4],S=s[7],T=s[2],E=s[5],_=s[8];return r[0]=a*x+o*v+l*T,r[3]=a*g+o*w+l*E,r[6]=a*m+o*S+l*_,r[1]=c*x+h*v+d*T,r[4]=c*g+h*w+d*E,r[7]=c*m+h*S+d*_,r[2]=f*x+u*v+p*T,r[5]=f*g+u*w+p*E,r[8]=f*m+u*S+p*_,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],d=h*a-o*c,f=o*l-h*r,u=c*r-a*l,p=t*d+n*f+s*u;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/p;return e[0]=d*x,e[1]=(s*c-h*n)*x,e[2]=(o*n-s*a)*x,e[3]=f*x,e[4]=(h*t-s*l)*x,e[5]=(s*r-o*t)*x,e[6]=u*x,e[7]=(n*l-c*t)*x,e[8]=(a*t-n*r)*x,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-s*c,s*l,-s*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Xi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Al.makeScale(e,t)),this}rotate(e){return Xi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Al.makeRotation(-e)),this}translate(e,t){return Xi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Al.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Hc.prototype.isMatrix3=!0;var ke=Hc,Al=new ke,Rh=new ke().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ch=new ke().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Nf(){let i={enabled:!0,workingColorSpace:hr,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===st&&(s.r=ri(s.r),s.g=ri(s.g),s.b=ri(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===st&&(s.r=Ts(s.r),s.g=Ts(s.g),s.b=Ts(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===di?ur:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[hr]:{primaries:e,whitePoint:n,transfer:ur,toXYZ:Rh,fromXYZ:Ch,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Ft},outputColorSpaceConfig:{drawingBufferColorSpace:Ft}},[Ft]:{primaries:e,whitePoint:n,transfer:st,toXYZ:Rh,fromXYZ:Ch,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Ft}}}),i}var Qe=Nf();function ri(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ts(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var ds,Ha=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{ds===void 0&&(ds=dr("canvas")),ds.width=e.width,ds.height=e.height;let s=ds.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=ds}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=dr("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=ri(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(ri(t[n]/255)*255):t[n]=ri(t[n]);return{data:t,width:e.width,height:e.height}}else return Ie("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},Uf=0,Ps=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Uf++}),this.uuid=Hs(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width||0,t.height||0,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Rl(s[a].image)):r.push(Rl(s[a]))}else r=Rl(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function Rl(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Ha.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ie("Texture: Unable to serialize Texture."),{})}var Of=0,Cl=new R,Jt=class i extends Dn{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=vn,s=vn,r=Zt,a=hi,o=kn,l=en,c=i.DEFAULT_ANISOTROPY,h=di){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Of++}),this.uuid=Hs(),this.name="",this.source=new Ps(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ge(0,0),this.repeat=new ge(1,1),this.center=new ge(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ke,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Cl).x}get height(){return this.source.getSize(Cl).y}get depth(){return this.source.getSize(Cl).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){Ie(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ie(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==xc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ei:e.x=e.x-Math.floor(e.x);break;case vn:e.x=e.x<0?0:1;break;case ka:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Ei:e.y=e.y-Math.floor(e.y);break;case vn:e.y=e.y<0?0:1;break;case ka:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Jt.DEFAULT_IMAGE=null;Jt.DEFAULT_MAPPING=xc;Jt.DEFAULT_ANISOTROPY=1;var Gc=class Gc{constructor(e=0,t=0,n=0,s=1){this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,l=e.elements,c=l[0],h=l[4],d=l[8],f=l[1],u=l[5],p=l[9],x=l[2],g=l[6],m=l[10];if(Math.abs(h-f)<.01&&Math.abs(d-x)<.01&&Math.abs(p-g)<.01){if(Math.abs(h+f)<.1&&Math.abs(d+x)<.1&&Math.abs(p+g)<.1&&Math.abs(c+u+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let w=(c+1)/2,S=(u+1)/2,T=(m+1)/2,E=(h+f)/4,_=(d+x)/4,M=(p+g)/4;return w>S&&w>T?w<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(w),s=E/n,r=_/n):S>T?S<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(S),n=E/s,r=M/s):T<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(T),n=_/r,s=M/r),this.set(n,s,r,t),this}let v=Math.sqrt((g-p)*(g-p)+(d-x)*(d-x)+(f-h)*(f-h));return Math.abs(v)<.001&&(v=1),this.x=(g-p)/v,this.y=(d-x)/v,this.z=(f-h)/v,this.w=Math.acos((c+u+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=We(this.x,e.x,t.x),this.y=We(this.y,e.y,t.y),this.z=We(this.z,e.z,t.z),this.w=We(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=We(this.x,e,t),this.y=We(this.y,e,t),this.z=We(this.z,e,t),this.w=We(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(We(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Gc.prototype.isVector4=!0;var gt=Gc,Ga=class extends Dn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Zt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new gt(0,0,e,t),this.scissorTest=!1,this.viewport=new gt(0,0,e,t),this.textures=[];let s=n.count;for(let r=0;r<s;r++)this.textures[r]=new Jt({width:e,height:t,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Zt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ps(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},cn=class extends Ga{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},fr=class extends Jt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=vn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Va=class extends Jt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=vn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var mo=class mo{constructor(e,t,n,s,r,a,o,l,c,h,d,f,u,p,x,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,l,c,h,d,f,u,p,x,g)}set(e,t,n,s,r,a,o,l,c,h,d,f,u,p,x,g){let m=this.elements;return m[0]=e,m[4]=t,m[8]=n,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=d,m[14]=f,m[3]=u,m[7]=p,m[11]=x,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new mo().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,s=1/fs.setFromMatrixColumn(e,0).length(),r=1/fs.setFromMatrixColumn(e,1).length(),a=1/fs.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let f=a*h,u=a*d,p=o*h,x=o*d;t[0]=l*h,t[4]=-l*d,t[8]=c,t[1]=u+p*c,t[5]=f-x*c,t[9]=-o*l,t[2]=x-f*c,t[6]=p+u*c,t[10]=a*l}else if(e.order==="YXZ"){let f=l*h,u=l*d,p=c*h,x=c*d;t[0]=f+x*o,t[4]=p*o-u,t[8]=a*c,t[1]=a*d,t[5]=a*h,t[9]=-o,t[2]=u*o-p,t[6]=x+f*o,t[10]=a*l}else if(e.order==="ZXY"){let f=l*h,u=l*d,p=c*h,x=c*d;t[0]=f-x*o,t[4]=-a*d,t[8]=p+u*o,t[1]=u+p*o,t[5]=a*h,t[9]=x-f*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){let f=a*h,u=a*d,p=o*h,x=o*d;t[0]=l*h,t[4]=p*c-u,t[8]=f*c+x,t[1]=l*d,t[5]=x*c+f,t[9]=u*c-p,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){let f=a*l,u=a*c,p=o*l,x=o*c;t[0]=l*h,t[4]=x-f*d,t[8]=p*d+u,t[1]=d,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=u*d+p,t[10]=f-x*d}else if(e.order==="XZY"){let f=a*l,u=a*c,p=o*l,x=o*c;t[0]=l*h,t[4]=-d,t[8]=c*h,t[1]=f*d+x,t[5]=a*h,t[9]=u*d-p,t[2]=p*d-u,t[6]=o*h,t[10]=x*d+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Ff,e,Bf)}lookAt(e,t,n){let s=this.elements;return an.subVectors(e,t),an.lengthSq()===0&&(an.z=1),an.normalize(),yi.crossVectors(n,an),yi.lengthSq()===0&&(Math.abs(n.z)===1?an.x+=1e-4:an.z+=1e-4,an.normalize(),yi.crossVectors(n,an)),yi.normalize(),oa.crossVectors(an,yi),s[0]=yi.x,s[4]=oa.x,s[8]=an.x,s[1]=yi.y,s[5]=oa.y,s[9]=an.y,s[2]=yi.z,s[6]=oa.z,s[10]=an.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],d=n[5],f=n[9],u=n[13],p=n[2],x=n[6],g=n[10],m=n[14],v=n[3],w=n[7],S=n[11],T=n[15],E=s[0],_=s[4],M=s[8],N=s[12],P=s[1],D=s[5],O=s[9],V=s[13],I=s[2],X=s[6],q=s[10],H=s[14],Q=s[3],G=s[7],ne=s[11],ie=s[15];return r[0]=a*E+o*P+l*I+c*Q,r[4]=a*_+o*D+l*X+c*G,r[8]=a*M+o*O+l*q+c*ne,r[12]=a*N+o*V+l*H+c*ie,r[1]=h*E+d*P+f*I+u*Q,r[5]=h*_+d*D+f*X+u*G,r[9]=h*M+d*O+f*q+u*ne,r[13]=h*N+d*V+f*H+u*ie,r[2]=p*E+x*P+g*I+m*Q,r[6]=p*_+x*D+g*X+m*G,r[10]=p*M+x*O+g*q+m*ne,r[14]=p*N+x*V+g*H+m*ie,r[3]=v*E+w*P+S*I+T*Q,r[7]=v*_+w*D+S*X+T*G,r[11]=v*M+w*O+S*q+T*ne,r[15]=v*N+w*V+S*H+T*ie,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],d=e[6],f=e[10],u=e[14],p=e[3],x=e[7],g=e[11],m=e[15],v=l*u-c*f,w=o*u-c*d,S=o*f-l*d,T=a*u-c*h,E=a*f-l*h,_=a*d-o*h;return t*(x*v-g*w+m*S)-n*(p*v-g*T+m*E)+s*(p*w-x*T+m*_)-r*(p*S-x*E+g*_)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-n*(r*h-o*l)+s*(r*c-a*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],d=e[9],f=e[10],u=e[11],p=e[12],x=e[13],g=e[14],m=e[15],v=t*o-n*a,w=t*l-s*a,S=t*c-r*a,T=n*l-s*o,E=n*c-r*o,_=s*c-r*l,M=h*x-d*p,N=h*g-f*p,P=h*m-u*p,D=d*g-f*x,O=d*m-u*x,V=f*m-u*g,I=v*V-w*O+S*D+T*P-E*N+_*M;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let X=1/I;return e[0]=(o*V-l*O+c*D)*X,e[1]=(s*O-n*V-r*D)*X,e[2]=(x*_-g*E+m*T)*X,e[3]=(f*E-d*_-u*T)*X,e[4]=(l*P-a*V-c*N)*X,e[5]=(t*V-s*P+r*N)*X,e[6]=(g*S-p*_-m*w)*X,e[7]=(h*_-f*S+u*w)*X,e[8]=(a*O-o*P+c*M)*X,e[9]=(n*P-t*O-r*M)*X,e[10]=(p*E-x*S+m*v)*X,e[11]=(d*S-h*E-u*v)*X,e[12]=(o*N-a*D-l*M)*X,e[13]=(t*D-n*N+s*M)*X,e[14]=(x*w-p*T-g*v)*X,e[15]=(h*T-d*w+f*v)*X,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,l=e.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,a=t._y,o=t._z,l=t._w,c=r+r,h=a+a,d=o+o,f=r*c,u=r*h,p=r*d,x=a*h,g=a*d,m=o*d,v=l*c,w=l*h,S=l*d,T=n.x,E=n.y,_=n.z;return s[0]=(1-(x+m))*T,s[1]=(u+S)*T,s[2]=(p-w)*T,s[3]=0,s[4]=(u-S)*E,s[5]=(1-(f+m))*E,s[6]=(g+v)*E,s[7]=0,s[8]=(p+w)*_,s[9]=(g-v)*_,s[10]=(1-(f+x))*_,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),t.identity(),this;let a=fs.set(s[0],s[1],s[2]).length(),o=fs.set(s[4],s[5],s[6]).length(),l=fs.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Pn.copy(this);let c=1/a,h=1/o,d=1/l;return Pn.elements[0]*=c,Pn.elements[1]*=c,Pn.elements[2]*=c,Pn.elements[4]*=h,Pn.elements[5]*=h,Pn.elements[6]*=h,Pn.elements[8]*=d,Pn.elements[9]*=d,Pn.elements[10]*=d,t.setFromRotationMatrix(Pn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,s,r,a,o=bn,l=!1){let c=this.elements,h=2*r/(t-e),d=2*r/(n-s),f=(t+e)/(t-e),u=(n+s)/(n-s),p,x;if(l)p=r/(a-r),x=a*r/(a-r);else if(o===bn)p=-(a+r)/(a-r),x=-2*a*r/(a-r);else if(o===Rs)p=-a/(a-r),x=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=d,c[9]=u,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=bn,l=!1){let c=this.elements,h=2/(t-e),d=2/(n-s),f=-(t+e)/(t-e),u=-(n+s)/(n-s),p,x;if(l)p=1/(a-r),x=a/(a-r);else if(o===bn)p=-2/(a-r),x=-(a+r)/(a-r);else if(o===Rs)p=-1/(a-r),x=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=d,c[9]=0,c[13]=u,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};mo.prototype.isMatrix4=!0;var Ze=mo,fs=new R,Pn=new Ze,Ff=new R(0,0,0),Bf=new R(1,1,1),yi=new R,oa=new R,an=new R,Ph=new Ze,Ih=new jt,Xn=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],d=s[2],f=s[6],u=s[10];switch(t){case"XYZ":this._y=Math.asin(We(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,u),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-We(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,u),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(We(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-d,u),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-We(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(f,u),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(We(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,u));break;case"XZY":this._z=Math.asin(-We(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,u),this._y=0);break;default:Ie("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ph.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ph,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ih.setFromEuler(this),this.setFromQuaternion(Ih,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Xn.DEFAULT_ORDER="XYZ";var Is=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},kf=0,Lh=new R,ps=new jt,ei=new Ze,la=new R,Ks=new R,zf=new R,Hf=new jt,Dh=new R(1,0,0),Nh=new R(0,1,0),Uh=new R(0,0,1),Oh={type:"added"},Gf={type:"removed"},ms={type:"childadded",child:null},Pl={type:"childremoved",child:null},yt=class i extends Dn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:kf++}),this.uuid=Hs(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new R,t=new Xn,n=new jt,s=new R(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Ze},normalMatrix:{value:new ke}}),this.matrix=new Ze,this.matrixWorld=new Ze,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Is,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ps.setFromAxisAngle(e,t),this.quaternion.multiply(ps),this}rotateOnWorldAxis(e,t){return ps.setFromAxisAngle(e,t),this.quaternion.premultiply(ps),this}rotateX(e){return this.rotateOnAxis(Dh,e)}rotateY(e){return this.rotateOnAxis(Nh,e)}rotateZ(e){return this.rotateOnAxis(Uh,e)}translateOnAxis(e,t){return Lh.copy(e).applyQuaternion(this.quaternion),this.position.add(Lh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Dh,e)}translateY(e){return this.translateOnAxis(Nh,e)}translateZ(e){return this.translateOnAxis(Uh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ei.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?la.copy(e):la.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Ks.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ei.lookAt(Ks,la,this.up):ei.lookAt(la,Ks,this.up),this.quaternion.setFromRotationMatrix(ei),s&&(ei.extractRotation(s.matrixWorld),ps.setFromRotationMatrix(ei),this.quaternion.premultiply(ps.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Be("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Oh),ms.child=e,this.dispatchEvent(ms),ms.child=null):Be("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Gf),Pl.child=e,this.dispatchEvent(Pl),Pl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ei.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ei.multiply(e.parent.matrixWorld)),e.applyMatrix4(ei),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Oh),ms.child=e,this.dispatchEvent(ms),ms.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ks,e,zf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ks,Hf,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*n-r[8]*s,r[13]+=n-r[1]*t-r[5]*n-r[9]*s,r[14]+=s-r[2]*t-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(e.materials,this.material[l]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(e.animations,l))}}if(t){let o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),d=a(e.shapes),f=a(e.skeletons),u=a(e.animations),p=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),f.length>0&&(n.skeletons=f),u.length>0&&(n.animations=u),p.length>0&&(n.nodes=p)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};yt.DEFAULT_UP=new R(0,1,0);yt.DEFAULT_MATRIX_AUTO_UPDATE=!0;yt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ne=class extends yt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Vf={type:"move"},Ls=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ne,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ne,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ne,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(let x of e.hand.values()){let g=t.getJointPose(x,n),m=this._getHandJoint(c,x);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.quaternion,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],f=h.position.distanceTo(d.position),u=.02,p=.005;c.inputState.pinching&&f>u+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=u-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Vf)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new Ne;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},Xu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},vi={h:0,s:0,l:0},ca={h:0,s:0,l:0};function Il(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var Ue=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ft){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Qe.colorSpaceToWorking(this,t),this}setRGB(e,t,n,s=Qe.workingColorSpace){return this.r=e,this.g=t,this.b=n,Qe.colorSpaceToWorking(this,s),this}setHSL(e,t,n,s=Qe.workingColorSpace){if(e=Pc(e,1),t=We(t,0,1),n=We(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Il(a,r,e+1/3),this.g=Il(a,r,e),this.b=Il(a,r,e-1/3)}return Qe.colorSpaceToWorking(this,s),this}setStyle(e,t=Ft){function n(r){r!==void 0&&parseFloat(r)<1&&Ie("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,t);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Ie("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);Ie("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ft){let n=Xu[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ie("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ri(e.r),this.g=ri(e.g),this.b=ri(e.b),this}copyLinearToSRGB(e){return this.r=Ts(e.r),this.g=Ts(e.g),this.b=Ts(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ft){return Qe.workingToColorSpace(Wt.copy(this),e),Math.round(We(Wt.r*255,0,255))*65536+Math.round(We(Wt.g*255,0,255))*256+Math.round(We(Wt.b*255,0,255))}getHexString(e=Ft){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Qe.workingColorSpace){Qe.workingToColorSpace(Wt.copy(this),t);let n=Wt.r,s=Wt.g,r=Wt.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let d=a-o;switch(c=h<=.5?d/(a+o):d/(2-a-o),a){case n:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-n)/d+2;break;case r:l=(n-s)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=Qe.workingColorSpace){return Qe.workingToColorSpace(Wt.copy(this),t),e.r=Wt.r,e.g=Wt.g,e.b=Wt.b,e}getStyle(e=Ft){Qe.workingToColorSpace(Wt.copy(this),e);let t=Wt.r,n=Wt.g,s=Wt.b;return e!==Ft?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(vi),this.setHSL(vi.h+e,vi.s+t,vi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(vi),e.getHSL(ca);let n=ar(vi.h,ca.h,t),s=ar(vi.s,ca.s,t),r=ar(vi.l,ca.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Wt=new Ue;Ue.NAMES=Xu;var pr=class i{constructor(e,t=1,n=1e3){this.isFog=!0,this.name="",this.color=new Ue(e),this.near=t,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},qi=class extends yt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Xn,this.environmentIntensity=1,this.environmentRotation=new Xn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background!==null?e.background.clone():null,this.environment=e.environment!==null?e.environment.clone():null,this.fog=e.fog!==null?e.fog.clone():null,this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial!==null?e.overrideMaterial.clone():null,this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},In=new R,ti=new R,Ll=new R,ni=new R,gs=new R,_s=new R,Fh=new R,Dl=new R,Nl=new R,Ul=new R,Ol=new gt,Fl=new gt,Bl=new gt,wi=class i{constructor(e=new R,t=new R,n=new R){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),In.subVectors(e,t),s.cross(In);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){In.subVectors(s,t),ti.subVectors(n,t),Ll.subVectors(e,t);let a=In.dot(In),o=In.dot(ti),l=In.dot(Ll),c=ti.dot(ti),h=ti.dot(Ll),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;let f=1/d,u=(c*l-o*h)*f,p=(a*h-o*l)*f;return r.set(1-u-p,p,u)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,ni)===null?!1:ni.x>=0&&ni.y>=0&&ni.x+ni.y<=1}static getInterpolation(e,t,n,s,r,a,o,l){return this.getBarycoord(e,t,n,s,ni)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ni.x),l.addScaledVector(a,ni.y),l.addScaledVector(o,ni.z),l)}static getInterpolatedAttribute(e,t,n,s,r,a){return Ol.setScalar(0),Fl.setScalar(0),Bl.setScalar(0),Ol.fromBufferAttribute(e,t),Fl.fromBufferAttribute(e,n),Bl.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(Ol,r.x),a.addScaledVector(Fl,r.y),a.addScaledVector(Bl,r.z),a}static isFrontFacing(e,t,n,s){return In.subVectors(n,t),ti.subVectors(e,t),In.cross(ti).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return In.subVectors(this.c,this.b),ti.subVectors(this.a,this.b),In.cross(ti).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,a,o;gs.subVectors(s,n),_s.subVectors(r,n),Dl.subVectors(e,n);let l=gs.dot(Dl),c=_s.dot(Dl);if(l<=0&&c<=0)return t.copy(n);Nl.subVectors(e,s);let h=gs.dot(Nl),d=_s.dot(Nl);if(h>=0&&d<=h)return t.copy(s);let f=l*d-h*c;if(f<=0&&l>=0&&h<=0&&l-h>0)return a=l/(l-h),t.copy(n).addScaledVector(gs,a);Ul.subVectors(e,r);let u=gs.dot(Ul),p=_s.dot(Ul);if(p>=0&&u<=p)return t.copy(r);let x=u*c-l*p;if(x<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(_s,o);let g=h*p-u*d;if(g<=0&&d-h>=0&&u-p>=0)return Fh.subVectors(r,s),o=(d-h)/(d-h+(u-p)),t.copy(s).addScaledVector(Fh,o);let m=1/(g+x+f);return a=x*m,o=f*m,t.copy(n).addScaledVector(gs,a).addScaledVector(_s,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Kt=class{constructor(e=new R(1/0,1/0,1/0),t=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Ln.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Ln.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Ln.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,Ln):Ln.fromBufferAttribute(r,a),Ln.applyMatrix4(e.matrixWorld),this.expandByPoint(Ln);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ha.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ha.copy(n.boundingBox)),ha.applyMatrix4(e.matrixWorld),this.union(ha)}let s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Ln),Ln.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Qs),ua.subVectors(this.max,Qs),xs.subVectors(e.a,Qs),ys.subVectors(e.b,Qs),vs.subVectors(e.c,Qs),bi.subVectors(ys,xs),Si.subVectors(vs,ys),Hi.subVectors(xs,vs);let t=[0,-bi.z,bi.y,0,-Si.z,Si.y,0,-Hi.z,Hi.y,bi.z,0,-bi.x,Si.z,0,-Si.x,Hi.z,0,-Hi.x,-bi.y,bi.x,0,-Si.y,Si.x,0,-Hi.y,Hi.x,0];return!kl(t,xs,ys,vs,ua)||(t=[1,0,0,0,1,0,0,0,1],!kl(t,xs,ys,vs,ua))?!1:(da.crossVectors(bi,Si),t=[da.x,da.y,da.z],kl(t,xs,ys,vs,ua))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Ln).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Ln).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ii[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ii[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ii[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ii[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ii[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ii[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ii[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ii[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ii),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},ii=[new R,new R,new R,new R,new R,new R,new R,new R],Ln=new R,ha=new Kt,xs=new R,ys=new R,vs=new R,bi=new R,Si=new R,Hi=new R,Qs=new R,ua=new R,da=new R,Gi=new R;function kl(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Gi.fromArray(i,r);let o=s.x*Math.abs(Gi.x)+s.y*Math.abs(Gi.y)+s.z*Math.abs(Gi.z),l=e.dot(Gi),c=t.dot(Gi),h=n.dot(Gi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var St=new R,fa=new ge,Wf=0,Sn=class extends Dn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Wf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Bu,this.updateRanges=[],this.gpuType=En,this.version=0,this._normalizationScale=e!==void 0?Lc(e):void 0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)fa.fromBufferAttribute(this,t),fa.applyMatrix3(e),this.setXY(t,fa.x,fa.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyMatrix3(e),this.setXYZ(t,St.x,St.y,St.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyMatrix4(e),this.setXYZ(t,St.x,St.y,St.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyNormalMatrix(e),this.setXYZ(t,St.x,St.y,St.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.transformDirection(e),this.setXYZ(t,St.x,St.y,St.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),s=this._normalize(s)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),s=this._normalize(s),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(e){let t=this._normalizationScale;return t!==void 0?Math.max(e/t,-1):Vu(e,this.array)}_normalize(e){let t=this._normalizationScale;return t!==void 0?Math.round(e*t):Wu(e,this.array)}};var mr=class extends Sn{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var gr=class extends Sn{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var tt=class extends Sn{constructor(e,t,n){super(new Float32Array(e),t,n)}},Xf=new Kt,er=new R,zl=new R,oi=class{constructor(e=new R,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):Xf.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;er.subVectors(e,this.center);let t=er.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(er,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(zl.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(er.copy(e.center).add(zl)),this.expandByPoint(er.copy(e.center).sub(zl))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},$f=0,yn=new Ze,Hl=new yt,bs=new R,on=new Kt,tr=new Kt,Lt=new R,Xt=class i extends Dn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:$f++}),this.uuid=Hs(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(_f(e)?gr:mr)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new ke().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return yn.makeRotationFromQuaternion(e),this.applyMatrix4(yn),this}rotateX(e){return yn.makeRotationX(e),this.applyMatrix4(yn),this}rotateY(e){return yn.makeRotationY(e),this.applyMatrix4(yn),this}rotateZ(e){return yn.makeRotationZ(e),this.applyMatrix4(yn),this}translate(e,t,n){return yn.makeTranslation(e,t,n),this.applyMatrix4(yn),this}scale(e,t,n){return yn.makeScale(e,t,n),this.applyMatrix4(yn),this}lookAt(e){return Hl.lookAt(e),Hl.updateMatrix(),this.applyMatrix4(Hl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(bs).negate(),this.translate(bs.x,bs.y,bs.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new tt(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Ie("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Kt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Be("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];on.setFromBufferAttribute(r),this.morphTargetsRelative?(Lt.addVectors(this.boundingBox.min,on.min),this.boundingBox.expandByPoint(Lt),Lt.addVectors(this.boundingBox.max,on.max),this.boundingBox.expandByPoint(Lt)):(this.boundingBox.expandByPoint(on.min),this.boundingBox.expandByPoint(on.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Be('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Be("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(e){let n=this.boundingSphere.center;if(on.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){let o=t[r];tr.setFromBufferAttribute(o),this.morphTargetsRelative?(Lt.addVectors(on.min,tr.min),on.expandByPoint(Lt),Lt.addVectors(on.max,tr.max),on.expandByPoint(Lt)):(on.expandByPoint(tr.min),on.expandByPoint(tr.max))}on.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)Lt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Lt));if(t)for(let r=0,a=t.length;r<a;r++){let o=t[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Lt.fromBufferAttribute(o,c),l&&(bs.fromBufferAttribute(e,c),Lt.add(bs)),s=Math.max(s,n.distanceToSquared(Lt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Be('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Be("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Sn(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[],c=new Uint8Array(n.count);for(let N=0;N<n.count;N++)o[N]=new R,l[N]=new R;let h=new R,d=new R,f=new R,u=new ge,p=new ge,x=new ge,g=new R,m=new R;function v(N,P,D){c[N]=c[P]=c[D]=1,h.fromBufferAttribute(n,N),d.fromBufferAttribute(n,P),f.fromBufferAttribute(n,D),u.fromBufferAttribute(r,N),p.fromBufferAttribute(r,P),x.fromBufferAttribute(r,D),d.sub(h),f.sub(h),p.sub(u),x.sub(u);let O=1/(p.x*x.y-x.x*p.y);isFinite(O)&&(g.copy(d).multiplyScalar(x.y).addScaledVector(f,-p.y).multiplyScalar(O),m.copy(f).multiplyScalar(p.x).addScaledVector(d,-x.x).multiplyScalar(O),o[N].add(g),o[P].add(g),o[D].add(g),l[N].add(m),l[P].add(m),l[D].add(m))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let N=0,P=w.length;N<P;++N){let D=w[N],O=D.start,V=D.count;for(let I=O,X=O+V;I<X;I+=3)v(e.getX(I+0),e.getX(I+1),e.getX(I+2))}let S=new R,T=new R,E=new R,_=new R;function M(N){E.fromBufferAttribute(s,N),_.copy(E);let P=o[N];S.copy(P),S.sub(E.multiplyScalar(E.dot(P))).normalize(),T.crossVectors(_,P);let O=T.dot(l[N])<0?-1:1;a.setXYZW(N,S.x,S.y,S.z,O)}for(let N=0,P=n.count;N<P;++N)c[N]&&M(N);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Sn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let f=0,u=n.count;f<u;f++)n.setXYZ(f,0,0,0);let s=new R,r=new R,a=new R,o=new R,l=new R,c=new R,h=new R,d=new R;if(e)for(let f=0,u=e.count;f<u;f+=3){let p=e.getX(f+0),x=e.getX(f+1),g=e.getX(f+2);s.fromBufferAttribute(t,p),r.fromBufferAttribute(t,x),a.fromBufferAttribute(t,g),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),o.fromBufferAttribute(n,p),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,g),o.add(h),l.add(h),c.add(h),n.setXYZ(p,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let f=0,u=t.count;f<u;f+=3)s.fromBufferAttribute(t,f+0),r.fromBufferAttribute(t,f+1),a.fromBufferAttribute(t,f+2),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Lt.fromBufferAttribute(e,t),Lt.normalize(),e.setXYZ(t,Lt.x,Lt.y,Lt.z)}toNonIndexed(){function e(o,l){let c=o.array,h=o.itemSize,d=o.normalized,f=new c.constructor(l.length*h),u=0,p=0;for(let x=0,g=l.length;x<g;x++){o.isInterleavedBufferAttribute?u=l[x]*o.data.stride+o.offset:u=l[x]*h;for(let m=0;m<h;m++)f[p++]=c[u++]}return new Sn(f,h,d)}if(this.index===null)return Ie("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=e(l,n);t.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,d=c.length;h<d;h++){let f=c[h],u=e(f,n);l.push(u)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let l in n){let c=n[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,f=c.length;d<f;d++){let u=c[d];h.push(u.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],d=r[c];for(let f=0,u=d.length;f<u;f++)h.push(d[f].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let c=0,h=a.length;c<h;c++){let d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Gl=new R,qf=new R,Yf=new ke,ln=class{constructor(e=new R(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=Gl.subVectors(n,t).cross(qf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let s=e.delta(Gl),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(s,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Yf.getNormalMatrix(e),s=this.coplanarPoint(Gl).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Zf=0,$n=class extends Dn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Zf++}),this.uuid=Hs(),this.name="",this.type="Material",this.blending=Bs,this.side=Ui,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=hc,this.blendDst=uc,this.blendEquation=ns,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ue(0,0,0),this.blendAlpha=0,this.depthFunc=As,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Lu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ia,this.stencilZFail=Ia,this.stencilZPass=Ia,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){Ie(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Ie(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(t){let r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Ue().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new ln().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ge().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ge().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var si=new R,Vl=new R,pa=new R,ma=new R,Ti=class{constructor(e=new R,t=new R(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,si)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=si.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(si.copy(this.origin).addScaledVector(this.direction,t),si.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){Vl.copy(e).add(t).multiplyScalar(.5),pa.copy(t).sub(e).normalize(),ma.copy(this.origin).sub(Vl);let r=e.distanceTo(t)*.5,a=-this.direction.dot(pa),o=ma.dot(this.direction),l=-ma.dot(pa),c=ma.lengthSq(),h=Math.abs(1-a*a),d,f,u,p;if(h>0)if(d=a*l-o,f=a*o-l,p=r*h,d>=0)if(f>=-p)if(f<=p){let x=1/h;d*=x,f*=x,u=d*(d+a*f+2*o)+f*(a*d+f+2*l)+c}else f=r,d=Math.max(0,-(a*f+o)),u=-d*d+f*(f+2*l)+c;else f=-r,d=Math.max(0,-(a*f+o)),u=-d*d+f*(f+2*l)+c;else f<=-p?(d=Math.max(0,-(-a*r+o)),f=d>0?-r:Math.min(Math.max(-r,-l),r),u=-d*d+f*(f+2*l)+c):f<=p?(d=0,f=Math.min(Math.max(-r,-l),r),u=f*(f+2*l)+c):(d=Math.max(0,-(a*r+o)),f=d>0?r:Math.min(Math.max(-r,-l),r),u=-d*d+f*(f+2*l)+c);else f=a>0?-r:r,d=Math.max(0,-(a*f+o)),u=-d*d+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Vl).addScaledVector(pa,f),u}intersectSphere(e,t){if(e.radius<0)return null;si.subVectors(e.center,this.origin);let n=si.dot(this.direction),s=si.dot(si)-n*n,r=e.radius*e.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,f=this.origin;return c>=0?(n=(e.min.x-f.x)*c,s=(e.max.x-f.x)*c):(n=(e.max.x-f.x)*c,s=(e.min.x-f.x)*c),h>=0?(r=(e.min.y-f.y)*h,a=(e.max.y-f.y)*h):(r=(e.max.y-f.y)*h,a=(e.min.y-f.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(e.min.z-f.z)*d,l=(e.max.z-f.z)*d):(o=(e.max.z-f.z)*d,l=(e.min.z-f.z)*d),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,si)!==null}intersectTriangle(e,t,n,s,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,d=e.x-a.x,f=e.y-a.y,u=e.z-a.z,p=t.x-a.x,x=t.y-a.y,g=t.z-a.z,m=n.x-a.x,v=n.y-a.y,w=n.z-a.z,S=Math.abs(l),T=Math.abs(c),E=Math.abs(h),_,M,N,P,D,O,V,I,X,q,H,Q;if(S>=T&&S>=E?(N=l,O=d,X=p,Q=m,l>=0?(_=c,M=h,P=f,D=u,V=x,I=g,q=v,H=w):(_=h,M=c,P=u,D=f,V=g,I=x,q=w,H=v)):T>=E?(N=c,O=f,X=x,Q=v,c>=0?(_=h,M=l,P=u,D=d,V=g,I=p,q=w,H=m):(_=l,M=h,P=d,D=u,V=p,I=g,q=m,H=w)):(N=h,O=u,X=g,Q=w,h>=0?(_=l,M=c,P=d,D=f,V=p,I=x,q=m,H=v):(_=c,M=l,P=f,D=d,V=x,I=p,q=v,H=m)),N===0)return null;let G=_/N,ne=M/N,ie=1/N,Ae=P-G*O,He=D-ne*O,j=V-G*X,ye=I-ne*X,Me=q-G*Q,Le=H-ne*Q,ve=Me*ye-Le*j,Ve=Ae*Le-He*Me,vt=j*He-ye*Ae;if(s){if(ve<0||Ve<0||vt<0)return null}else if((ve<0||Ve<0||vt<0)&&(ve>0||Ve>0||vt>0))return null;let Oe=ve+Ve+vt;if(Oe===0)return null;let rt=ie*(ve*O+Ve*X+vt*Q);return(Oe>0?rt<0:rt>0)?null:this.at(rt/Oe,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Nn=class extends $n{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ue(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xn,this.combine=go,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Bh=new Ze,Vi=new Ti,ga=new oi,kh=new R,_a=new R,xa=new R,ya=new R,Wl=new R,va=new R,zh=new R,ba=new R,ut=class extends yt{constructor(e=new Xt,t=new Nn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let o=this.morphTargetInfluences;if(r&&o){va.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],d=r[l];h!==0&&(Wl.fromBufferAttribute(d,e),a?va.addScaledVector(Wl,h):va.addScaledVector(Wl.sub(t),h))}t.add(va)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ga.copy(n.boundingSphere),ga.applyMatrix4(r),Vi.copy(e.ray).recast(e.near),!(ga.containsPoint(Vi.origin)===!1&&(Vi.intersectSphere(ga,kh)===null||Vi.origin.distanceToSquared(kh)>(e.far-e.near)**2))&&(Bh.copy(r).invert(),Vi.copy(e.ray).applyMatrix4(Bh),!(n.boundingBox!==null&&Vi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Vi)))}_computeIntersections(e,t,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,f=r.groups,u=r.drawRange;if(o!==null)if(Array.isArray(a))for(let p=0,x=f.length;p<x;p++){let g=f[p],m=a[g.materialIndex],v=Math.max(g.start,u.start),w=Math.min(o.count,Math.min(g.start+g.count,u.start+u.count));for(let S=v,T=w;S<T;S+=3){let E=o.getX(S),_=o.getX(S+1),M=o.getX(S+2);s=Sa(this,m,e,n,c,h,d,E,_,M),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let p=Math.max(0,u.start),x=Math.min(o.count,u.start+u.count);for(let g=p,m=x;g<m;g+=3){let v=o.getX(g),w=o.getX(g+1),S=o.getX(g+2);s=Sa(this,a,e,n,c,h,d,v,w,S),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let p=0,x=f.length;p<x;p++){let g=f[p],m=a[g.materialIndex],v=Math.max(g.start,u.start),w=Math.min(l.count,Math.min(g.start+g.count,u.start+u.count));for(let S=v,T=w;S<T;S+=3){let E=S,_=S+1,M=S+2;s=Sa(this,m,e,n,c,h,d,E,_,M),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{let p=Math.max(0,u.start),x=Math.min(l.count,u.start+u.count);for(let g=p,m=x;g<m;g+=3){let v=g,w=g+1,S=g+2;s=Sa(this,a,e,n,c,h,d,v,w,S),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}};function jf(i,e,t,n,s,r,a,o){let l;if(e.side===kt?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,e.side===Ui,o),l===null)return null;ba.copy(o),ba.applyMatrix4(i.matrixWorld);let c=t.ray.origin.distanceTo(ba);return c<t.near||c>t.far?null:{distance:c,point:ba.clone(),object:i}}function Sa(i,e,t,n,s,r,a,o,l,c){i.getVertexPosition(o,_a),i.getVertexPosition(l,xa),i.getVertexPosition(c,ya);let h=jf(i,e,t,n,_a,xa,ya,zh);if(h){let d=new R;wi.getBarycoord(zh,_a,xa,ya,d),s&&(h.uv=wi.getInterpolatedAttribute(s,o,l,c,d,new ge)),r&&(h.uv1=wi.getInterpolatedAttribute(r,o,l,c,d,new ge)),a&&(h.normal=wi.getInterpolatedAttribute(a,o,l,c,d,new R),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a:o,b:l,c,normal:new R,materialIndex:0};wi.getNormal(_a,xa,ya,f.normal),h.face=f,h.barycoord=d}return h}var _r=class extends Jt{constructor(e=null,t=1,n=1,s,r,a,o,l,c=Dt,h=Dt,d,f){super(null,a,o,l,c,h,s,r,d,f),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var xr=class extends Sn{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Ss=new Ze,Hh=new Ze,Ma=[],Gh=new Kt,Jf=new Ze,nr=new ut,ir=new oi,qn=class extends ut{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new xr(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Jf)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Kt),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Ss),Gh.copy(e.boundingBox).applyMatrix4(Ss),this.boundingBox.union(Gh)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new oi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Ss),ir.copy(e.boundingSphere).applyMatrix4(Ss),this.boundingSphere.union(ir)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture!==null?e.morphTexture.clone():null,this.instanceColor=e.instanceColor!==null?e.instanceColor.clone():null,this.count=e.count,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=e*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(nr.geometry=this.geometry,nr.material=this.material,nr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ir.copy(this.boundingSphere),ir.applyMatrix4(n),e.ray.intersectsSphere(ir)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Ss),Hh.multiplyMatrices(n,Ss),nr.matrixWorld=Hh,nr.raycast(e,Ma);for(let a=0,o=Ma.length;a<o;a++){let l=Ma[a];l.instanceId=r,l.object=this,t.push(l)}Ma.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new xr(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new _r(new Float32Array(s*this.count),s,this.count,Mo,En));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*e;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},Wi=new oi,Kf=new ge(.5,.5),wa=new R,Ai=class{constructor(e=new ln,t=new ln,n=new ln,s=new ln,r=new ln,a=new ln){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=bn,n=!1){let s=this.planes,r=e.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],d=r[5],f=r[6],u=r[7],p=r[8],x=r[9],g=r[10],m=r[11],v=r[12],w=r[13],S=r[14],T=r[15];if(s[0].setComponents(c-a,u-h,m-p,T-v).normalize(),s[1].setComponents(c+a,u+h,m+p,T+v).normalize(),s[2].setComponents(c+o,u+d,m+x,T+w).normalize(),s[3].setComponents(c-o,u-d,m-x,T-w).normalize(),n)s[4].setComponents(l,f,g,S).normalize(),s[5].setComponents(c-l,u-f,m-g,T-S).normalize();else if(s[4].setComponents(c-l,u-f,m-g,T-S).normalize(),t===bn)s[5].setComponents(c+l,u+f,m+g,T+S).normalize();else if(t===Rs)s[5].setComponents(l,f,g,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Wi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Wi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Wi)}intersectsSprite(e){Wi.center.set(0,0,0);let t=Kf.distanceTo(e.center);return Wi.radius=.7071067811865476+t,Wi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Wi)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(wa.x=s.normal.x>0?e.max.x:e.min.x,wa.y=s.normal.y>0?e.max.y:e.min.y,wa.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(wa)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Vh=new Ze,Wa=class i{constructor(){this.coordinateSystem=bn,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let s=0;s<t.length;s++){let r=t[s];Vh.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[s]===void 0&&(n[s]=new Ai),n[s].setFromProjectionMatrix(Vh,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let s=0;s<e._count;s++)t[s]===void 0&&(t[s]=new Ai),t[s].copy(n[s]);return this._count=e._count,this}clone(){return new i().copy(this)}};var Ds=class extends $n{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ue(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Xa=new R,$a=new R,Wh=new Ze,sr=new Ti,Ea=new oi,Xl=new R,Xh=new R,qa=class extends yt{constructor(e=new Xt,t=new Ds){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)Xa.fromBufferAttribute(t,s-1),$a.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=Xa.distanceTo($a);e.setAttribute("lineDistance",new tt(n,1))}else Ie("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ea.copy(n.boundingSphere),Ea.applyMatrix4(s),Ea.radius+=r,e.ray.intersectsSphere(Ea)===!1)return;Wh.copy(s).invert(),sr.copy(e.ray).applyMatrix4(Wh);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,f=n.attributes.position;if(h!==null){let u=Math.max(0,a.start),p=Math.min(h.count,a.start+a.count);for(let x=u,g=p-1;x<g;x+=c){let m=h.getX(x),v=h.getX(x+1),w=Ta(this,e,sr,l,m,v,x);w&&t.push(w)}if(this.isLineLoop){let x=h.getX(p-1),g=h.getX(u),m=Ta(this,e,sr,l,x,g,p-1);m&&t.push(m)}}else{let u=Math.max(0,a.start),p=Math.min(f.count,a.start+a.count);for(let x=u,g=p-1;x<g;x+=c){let m=Ta(this,e,sr,l,x,x+1,x);m&&t.push(m)}if(this.isLineLoop){let x=Ta(this,e,sr,l,p-1,u,p-1);x&&t.push(x)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Ta(i,e,t,n,s,r,a){let o=i.geometry.attributes.position;if(Xa.fromBufferAttribute(o,s),$a.fromBufferAttribute(o,r),t.distanceSqToSegment(Xa,$a,Xl,Xh)>n)return;Xl.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Xl);if(!(c<e.near||c>e.far))return{distance:c,point:Xh.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}var $h=new R,qh=new R,yr=class extends qa{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)$h.fromBufferAttribute(t,s),qh.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+$h.distanceTo(qh);e.setAttribute("lineDistance",new tt(n,1))}else Ie("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var vr=class extends Jt{constructor(e=[],t=is,n,s,r,a,o,l,c,h){super(e,t,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Yi=class extends Jt{constructor(e,t,n,s,r,a,o,l,c){super(e,t,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var li=class extends Jt{constructor(e,t,n=Fn,s,r,a,o=Dt,l=Dt,c,h=ai,d=1){if(h!==ai&&h!==ui)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:e,height:t,depth:d};super(f,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ps(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},br=class extends li{constructor(e,t=Fn,n=is,s,r,a=Dt,o=Dt,l,c=ai){let h={width:e,height:e,depth:1},d=[h,h,h,h,h,h];super(e,e,t,n,s,r,a,o,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Sr=class extends Jt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Mn=class i extends Xt{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],d=[],f=0,u=0;p("z","y","x",-1,-1,n,t,e,a,r,0),p("z","y","x",1,-1,n,t,-e,a,r,1),p("x","z","y",1,1,e,n,t,s,a,2),p("x","z","y",1,-1,e,n,-t,s,a,3),p("x","y","z",1,-1,e,t,n,s,r,4),p("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new tt(c,3)),this.setAttribute("normal",new tt(h,3)),this.setAttribute("uv",new tt(d,2));function p(x,g,m,v,w,S,T,E,_,M,N){let P=S/_,D=T/M,O=S/2,V=T/2,I=E/2,X=_+1,q=M+1,H=0,Q=0,G=new R;for(let ne=0;ne<q;ne++){let ie=ne*D-V;for(let Ae=0;Ae<X;Ae++){let He=Ae*P-O;G[x]=He*v,G[g]=ie*w,G[m]=I,c.push(G.x,G.y,G.z),G[x]=0,G[g]=0,G[m]=E>0?1:-1,h.push(G.x,G.y,G.z),d.push(Ae/_),d.push(1-ne/M),H+=1}}for(let ne=0;ne<M;ne++)for(let ie=0;ie<_;ie++){let Ae=f+ie+X*ne,He=f+ie+X*(ne+1),j=f+(ie+1)+X*(ne+1),ye=f+(ie+1)+X*ne;l.push(Ae,He,ye),l.push(He,j,ye),Q+=6}o.addGroup(u,Q,N),u+=Q,f+=H}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Ri=class i extends Xt{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],d=[],f=[],u=[],p=0,x=[],g=n/2,m=0;v(),a===!1&&(e>0&&w(!0),t>0&&w(!1)),this.setIndex(h),this.setAttribute("position",new tt(d,3)),this.setAttribute("normal",new tt(f,3)),this.setAttribute("uv",new tt(u,2));function v(){let S=new R,T=new R,E=0,_=(t-e)/n;for(let M=0;M<=r;M++){let N=[],P=M/r,D=P*(t-e)+e;for(let O=0;O<=s;O++){let V=O/s,I=V*l+o,X=Math.sin(I),q=Math.cos(I);T.x=D*X,T.y=-P*n+g,T.z=D*q,d.push(T.x,T.y,T.z),S.set(X,_,q).normalize(),f.push(S.x,S.y,S.z),u.push(V,1-P),N.push(p++)}x.push(N)}for(let M=0;M<s;M++)for(let N=0;N<r;N++){let P=x[N][M],D=x[N+1][M],O=x[N+1][M+1],V=x[N][M+1];(e>0||N!==0)&&(h.push(P,D,V),E+=3),(t>0||N!==r-1)&&(h.push(D,O,V),E+=3)}c.addGroup(m,E,0),m+=E}function w(S){let T=p,E=new ge,_=new R,M=0,N=S===!0?e:t,P=S===!0?1:-1;for(let O=1;O<=s;O++)d.push(0,g*P,0),f.push(0,P,0),u.push(.5,.5),p++;let D=p;for(let O=0;O<=s;O++){let I=O/s*l+o,X=Math.cos(I),q=Math.sin(I);_.x=N*q,_.y=g*P,_.z=N*X,d.push(_.x,_.y,_.z),f.push(0,P,0),E.x=X*.5+.5,E.y=q*.5*P+.5,u.push(E.x,E.y),p++}for(let O=0;O<s;O++){let V=T+O,I=D+O;S===!0?h.push(I,I+1,V):h.push(I+1,I,V),M+=3}c.addGroup(m,M,S===!0?1:2),m+=M}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}};var hn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ie("Curve: .getPoint() not implemented.")}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,s=this.getPoint(0),r=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),r+=n.distanceTo(s),t.push(r),s=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let n=this.getLengths(),s=0,r=n.length,a;t?a=t:a=e*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=n[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===a)return s/(r-1);let h=n[s],f=n[s+1]-h,u=(a-h)/f;return(s+u)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let a=this.getPoint(s),o=this.getPoint(r),l=t||(a.isVector2?new ge:new R);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){let n=new R,s=[],r=[],a=[],o=new R,l=new Ze;for(let u=0;u<=e;u++){let p=u/e;s[u]=this.getTangentAt(p,new R)}r[0]=new R,a[0]=new R;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),d=Math.abs(s[0].y),f=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),d<=c&&(c=d,n.set(0,1,0)),f<=c&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let u=1;u<=e;u++){if(r[u]=r[u-1].clone(),a[u]=a[u-1].clone(),o.crossVectors(s[u-1],s[u]),o.length()>Number.EPSILON){o.normalize();let p=Math.acos(We(s[u-1].dot(s[u]),-1,1));r[u].applyMatrix4(l.makeRotationAxis(o,p))}a[u].crossVectors(s[u],r[u])}if(t===!0){let u=Math.acos(We(r[0].dot(r[e]),-1,1));u/=e,s[0].dot(o.crossVectors(r[0],r[e]))>0&&(u=-u);for(let p=1;p<=e;p++)r[p].applyMatrix4(l.makeRotationAxis(s[p],u*p)),a[p].crossVectors(s[p],r[p])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this.cacheArcLengths=null,this}},Mr=class extends hn{constructor(e=0,t=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new ge){let n=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);let o=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),f=l-this.aX,u=c-this.aY;l=f*h-u*d+this.aX,c=f*d+u*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Ya=class extends Mr{constructor(e,t,n,s,r,a){super(e,t,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function Nc(){let i=0,e=0,t=0,n=0;function s(r,a,o,l){i=r,e=o,t=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,d){let f=(a-r)/c-(o-r)/(c+h)+(o-a)/h,u=(o-a)/h-(l-a)/(h+d)+(l-o)/d;f*=h,u*=h,s(a,o,f,u)},calc:function(r){let a=r*r,o=a*r;return i+e*r+t*a+n*o}}}var Yh=new R,Zh=new R,$l=new Nc,ql=new Nc,Yl=new Nc,ci=class extends hn{constructor(e=[],t=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=s}getPoint(e,t=new R){let n=t,s=this.points,r=s.length,a=(r-(this.closed?0:1))*e,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(Zh.subVectors(s[0],s[1]).add(s[0]),c=Zh);let d=s[o%r],f=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(Yh.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Yh),this.curveType==="centripetal"||this.curveType==="chordal"){let u=this.curveType==="chordal"?.5:.25,p=Math.pow(c.distanceToSquared(d),u),x=Math.pow(d.distanceToSquared(f),u),g=Math.pow(f.distanceToSquared(h),u);x<1e-4&&(x=1),p<1e-4&&(p=x),g<1e-4&&(g=x),$l.initNonuniformCatmullRom(c.x,d.x,f.x,h.x,p,x,g),ql.initNonuniformCatmullRom(c.y,d.y,f.y,h.y,p,x,g),Yl.initNonuniformCatmullRom(c.z,d.z,f.z,h.z,p,x,g)}else this.curveType==="catmullrom"&&($l.initCatmullRom(c.x,d.x,f.x,h.x,this.tension),ql.initCatmullRom(c.y,d.y,f.y,h.y,this.tension),Yl.initCatmullRom(c.z,d.z,f.z,h.z,this.tension));return n.set($l.calc(l),ql.calc(l),Yl.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new R().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function jh(i,e,t,n,s){let r=(n-e)*.5,a=(s-t)*.5,o=i*i,l=i*o;return(2*t-2*n+r+a)*l+(-3*t+3*n-2*r-a)*o+r*i+t}function Qf(i,e){let t=1-i;return t*t*e}function ep(i,e){return 2*(1-i)*i*e}function tp(i,e){return i*i*e}function or(i,e,t,n){return Qf(i,e)+ep(i,t)+tp(i,n)}function np(i,e){let t=1-i;return t*t*t*e}function ip(i,e){let t=1-i;return 3*t*t*i*e}function sp(i,e){return 3*(1-i)*i*i*e}function rp(i,e){return i*i*i*e}function lr(i,e,t,n,s){return np(i,e)+ip(i,t)+sp(i,n)+rp(i,s)}var Za=class extends hn{constructor(e=new ge,t=new ge,n=new ge,s=new ge){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new ge){let n=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(lr(e,s.x,r.x,a.x,o.x),lr(e,s.y,r.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ja=class extends hn{constructor(e=new R,t=new R,n=new R,s=new R){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=s}getPoint(e,t=new R){let n=t,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(lr(e,s.x,r.x,a.x,o.x),lr(e,s.y,r.y,a.y,o.y),lr(e,s.z,r.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ja=class extends hn{constructor(e=new ge,t=new ge){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ge){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ge){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Yn=class extends hn{constructor(e=new R,t=new R){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new R){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new R){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ka=class extends hn{constructor(e=new ge,t=new ge,n=new ge){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ge){let n=t,s=this.v0,r=this.v1,a=this.v2;return n.set(or(e,s.x,r.x,a.x),or(e,s.y,r.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},wr=class extends hn{constructor(e=new R,t=new R,n=new R){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new R){let n=t,s=this.v0,r=this.v1,a=this.v2;return n.set(or(e,s.x,r.x,a.x),or(e,s.y,r.y,a.y),or(e,s.z,r.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Qa=class extends hn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ge){let n=t,s=this.points,r=(s.length-1)*e,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],d=s[a>s.length-3?s.length-1:a+2];return n.set(jh(o,l.x,c.x,h.x,d.x),jh(o,l.y,c.y,h.y,d.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let s=e.points[t];this.points.push(new ge().fromArray(s))}return this}},ec=Object.freeze({__proto__:null,ArcCurve:Ya,CatmullRomCurve3:ci,CubicBezierCurve:Za,CubicBezierCurve3:ja,EllipseCurve:Mr,LineCurve:Ja,LineCurve3:Yn,QuadraticBezierCurve:Ka,QuadraticBezierCurve3:wr,SplineCurve:Qa}),Zi=class extends hn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1,this.cacheLengths=null}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new ec[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let a=s[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,s=this.curves.length;n<s;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let s=0,r=this.curves;s<r.length;s++){let a=r[s],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this.cacheLengths=null,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let s=e.curves[t];this.curves.push(new ec[s.type]().fromJSON(s))}return this.cacheLengths=null,this}};var Er=class i extends Xt{constructor(e=[new ge(0,-.5),new ge(.5,0),new ge(0,.5)],t=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:n,phiLength:s},t=Math.floor(t),s=We(s,0,Math.PI*2);let r=[],a=[],o=[],l=[],c=[],h=1/t,d=new R,f=new ge,u=new R,p=new R,x=new R,g=0,m=0;for(let v=0;v<=e.length-1;v++)switch(v){case 0:g=e[v+1].x-e[v].x,m=e[v+1].y-e[v].y,u.x=m*1,u.y=-g,u.z=m*0,x.copy(u),u.normalize(),l.push(u.x,u.y,u.z);break;case e.length-1:x.normalize(),l.push(x.x,x.y,x.z);break;default:g=e[v+1].x-e[v].x,m=e[v+1].y-e[v].y,u.x=m*1,u.y=-g,u.z=m*0,p.copy(u),u.x+=x.x,u.y+=x.y,u.z+=x.z,u.normalize(),l.push(u.x,u.y,u.z),x.copy(p)}for(let v=0;v<=t;v++){let w=n+v*h*s,S=Math.sin(w),T=Math.cos(w);for(let E=0;E<=e.length-1;E++){d.x=e[E].x*S,d.y=e[E].y,d.z=e[E].x*T,a.push(d.x,d.y,d.z),f.x=v/t,f.y=E/(e.length-1),o.push(f.x,f.y);let _=l[3*E+0]*S,M=l[3*E+1],N=l[3*E+0]*T;c.push(_,M,N)}}for(let v=0;v<t;v++)for(let w=0;w<e.length-1;w++){let S=w+v*e.length,T=S,E=S+e.length,_=S+e.length+1,M=S+1;r.push(T,E,M),r.push(_,M,E)}this.setIndex(r),this.setAttribute("position",new tt(a,3)),this.setAttribute("uv",new tt(o,2)),this.setAttribute("normal",new tt(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.points,e.segments,e.phiStart,e.phiLength)}};var ft=class i extends Xt{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,a=t/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,d=e/o,f=t/l,u=[],p=[],x=[],g=[];for(let m=0;m<h;m++){let v=m*f-a;for(let w=0;w<c;w++){let S=w*d-r;p.push(S,-v,0),x.push(0,0,1),g.push(w/o),g.push(1-m/l)}}for(let m=0;m<l;m++)for(let v=0;v<o;v++){let w=v+c*m,S=v+c*(m+1),T=v+1+c*(m+1),E=v+1+c*m;u.push(w,S,E),u.push(S,T,E)}this.setIndex(u),this.setAttribute("position",new tt(p,3)),this.setAttribute("normal",new tt(x,3)),this.setAttribute("uv",new tt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};var Un=class i extends Xt{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,h=[],d=new R,f=new R,u=[],p=[],x=[],g=[];for(let m=0;m<=n;m++){let v=[],w=m/n,S=a+w*o,T=e*Math.cos(S),E=Math.sqrt(e*e-T*T),_=0;m===0&&a===0?_=.5/t:m===n&&l===Math.PI&&(_=-.5/t);for(let M=0;M<=t;M++){let N=M/t,P=s+N*r;d.x=-E*Math.cos(P),d.y=T,d.z=E*Math.sin(P),p.push(d.x,d.y,d.z),f.copy(d).normalize(),x.push(f.x,f.y,f.z),g.push(N+_,1-w),v.push(c++)}h.push(v)}for(let m=0;m<n;m++)for(let v=0;v<t;v++){let w=h[m][v+1],S=h[m][v],T=h[m+1][v],E=h[m+1][v+1];(m!==0||a>0)&&u.push(w,S,E),(m!==n-1||l<Math.PI)&&u.push(S,T,E)}this.setIndex(u),this.setAttribute("position",new tt(p,3)),this.setAttribute("normal",new tt(x,3)),this.setAttribute("uv",new tt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Ci=class i extends Xt{constructor(e=1,t=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);let l=[],c=[],h=[],d=[],f=new R,u=new R,p=new R;for(let x=0;x<=n;x++){let g=a+x/n*o;for(let m=0;m<=s;m++){let v=m/s*r;u.x=(e+t*Math.cos(g))*Math.cos(v),u.y=(e+t*Math.cos(g))*Math.sin(v),u.z=t*Math.sin(g),c.push(u.x,u.y,u.z),f.x=e*Math.cos(v),f.y=e*Math.sin(v),p.subVectors(u,f).normalize(),h.push(p.x,p.y,p.z),d.push(m/s),d.push(x/n)}}for(let x=1;x<=n;x++)for(let g=1;g<=s;g++){let m=(s+1)*x+g-1,v=(s+1)*(x-1)+g-1,w=(s+1)*(x-1)+g,S=(s+1)*x+g;l.push(m,v,S),l.push(v,w,S)}this.setIndex(l),this.setAttribute("position",new tt(c,3)),this.setAttribute("normal",new tt(h,3)),this.setAttribute("uv",new tt(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};var Tr=class i extends Xt{constructor(e=new wr(new R(-1,-1,0),new R(-1,1,0),new R(1,1,0)),t=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:s,closed:r};let a=e.computeFrenetFrames(t,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new R,l=new R,c=new ge,h=new R,d=[],f=[],u=[],p=[];x(),this.setIndex(p),this.setAttribute("position",new tt(d,3)),this.setAttribute("normal",new tt(f,3)),this.setAttribute("uv",new tt(u,2));function x(){for(let w=0;w<t;w++)g(w);g(r===!1?t:0),v(),m()}function g(w){h=e.getPointAt(w/t,h);let S=a.normals[w],T=a.binormals[w];for(let E=0;E<=s;E++){let _=E/s*Math.PI*2,M=Math.sin(_),N=-Math.cos(_);l.x=N*S.x+M*T.x,l.y=N*S.y+M*T.y,l.z=N*S.z+M*T.z,l.normalize(),f.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,d.push(o.x,o.y,o.z)}}function m(){for(let w=1;w<=t;w++)for(let S=1;S<=s;S++){let T=(s+1)*(w-1)+(S-1),E=(s+1)*w+(S-1),_=(s+1)*w+S,M=(s+1)*(w-1)+S;p.push(T,E,M),p.push(E,_,M)}}function v(){for(let w=0;w<=t;w++)for(let S=0;S<=s;S++)c.x=w/t,c.y=S/s,u.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new i(new ec[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}};function rs(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];if(Jh(s))s.isRenderTargetTexture?(Ie("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone();else if(Array.isArray(s))if(Jh(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();e[t][n]=r}else e[t][n]=s.slice();else e[t][n]=s}}return e}function $t(i){let e={};for(let t=0;t<i.length;t++){let n=rs(i[t]);for(let s in n)e[s]=n[s]}return e}function Jh(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function ap(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Uc(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Qe.workingColorSpace}var $u={clone:rs,merge:$t},op=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,lp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,wn=class extends $n{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=op,this.fragmentShader=lp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=rs(e.uniforms),this.uniformsGroups=ap(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let s=e.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=t[s.value]||null;break;case"c":this.uniforms[n].value=new Ue().setHex(s.value);break;case"v2":this.uniforms[n].value=new ge().fromArray(s.value);break;case"v3":this.uniforms[n].value=new R().fromArray(s.value);break;case"v4":this.uniforms[n].value=new gt().fromArray(s.value);break;case"m3":this.uniforms[n].value=new ke().fromArray(s.value);break;case"m4":this.uniforms[n].value=new Ze().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},eo=class extends wn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},ot=class extends $n{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ue(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ue(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xr,this.normalScale=new ge(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Zn=class extends ot{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ge(1,1),this.clearcoatNormalMap=null,this.diffuseRoughnessMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return We(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessMinimum=100,this.iridescenceThicknessMaximum=400,this.iridescenceThicknessMap=null,this.sheenColor=new Ue(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ue(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ue(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._diffuseRoughness=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get diffuseRoughness(){return this._diffuseRoughness}set diffuseRoughness(e){this._diffuseRoughness>0!=e>0&&this.version++,this._diffuseRoughness=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}get iridescenceThicknessRange(){return Xi('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),[this.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum]}set iridescenceThicknessRange(e){Xi('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),this.iridescenceThicknessMinimum=e[0],this.iridescenceThicknessMaximum=e[1]}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.diffuseRoughness=e.diffuseRoughness,this.diffuseRoughnessMap=e.diffuseRoughnessMap,this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum,this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var Ar=class extends $n{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Ue(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ue(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Xr,this.normalScale=new ge(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xn,this.combine=go,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},to=class extends $n{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Pu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},no=class extends $n{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Ms(i,e){return!i||i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Aa(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var Pi=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let a;t:{i:if(!(e<s)){for(let o=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=t[++n],e<s)break e}a=t.length;break t}if(!(e>=r)){let o=t[1];e<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=t[--n-1],e>=r)break e}a=n,n=0;break t}break n}for(;n<a;){let o=n+a>>>1;e<t[o]?a=o:n=o+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let a=0;a!==s;++a)t[a]=n[r+a];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},io=class extends Pi{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Jl,endingEnd:Jl}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,a=e+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Kl:r=e,o=2*t-n;break;case Ql:r=s.length-2,o=t+s[r]-s[r+1];break;default:r=e,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Kl:a=e,l=2*n-t;break;case Ql:a=1,l=n+s[1]-s[0];break;default:a=e-1,l=t}let c=(n-t)*.5,h=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this._offsetPrev,d=this._offsetNext,f=this._weightPrev,u=this._weightNext,p=(n-t)/(s-t),x=p*p,g=x*p,m=-f*g+2*f*x-f*p,v=(1+f)*g+(-1.5-2*f)*x+(-.5+f)*p+1,w=(-1-u)*g+(1.5+u)*x+.5*p,S=u*g-u*x;for(let T=0;T!==o;++T)r[T]=m*a[h+T]+v*a[c+T]+w*a[l+T]+S*a[d+T];return r}},so=class extends Pi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=(n-t)/(s-t),d=1-h;for(let f=0;f!==o;++f)r[f]=a[c+f]*d+a[l+f]*h;return r}},ro=class extends Pi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},ao=class extends Pi{interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=e*o,c=l-o,h=this.inTangents,d=this.outTangents;if(!h||!d){let p=(n-t)/(s-t),x=1-p;for(let g=0;g!==o;++g)r[g]=a[c+g]*x+a[l+g]*p;return r}let f=o*2,u=e-1;for(let p=0;p!==o;++p){let x=a[c+p],g=a[l+p],m=u*f+p*2,v=d[m],w=d[m+1],S=e*f+p*2,T=h[S],E=h[S+1],_=hp(n,t,v,T,s);r[p]=qu(_,x,w,E,g)}return r}};function qu(i,e,t,n,s){let r=1-i;return r*r*r*e+3*r*r*i*t+3*r*i*i*n+i*i*i*s}function cp(i,e,t,n,s){let r=1-i;return 3*r*r*(t-e)+6*r*i*(n-t)+3*i*i*(s-n)}function hp(i,e,t,n,s){let r=(i-e)/(s-e);for(let a=0;a<8;a++){let o=qu(r,e,t,n,s)-i;if(Math.abs(o)<1e-10)break;let l=cp(r,e,t,n,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var un=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Ms(t,this.TimeBufferType),this.values=Ms(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Ms(e.times,Array),values:Ms(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s),Aa(e.settings)&&(n.settings={inTangents:Ms(e.settings.inTangents,Array),outTangents:Ms(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new ro(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new so(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new io(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new ao(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case cr:t=this.InterpolantFactoryMethodDiscrete;break;case za:t=this.InterpolantFactoryMethodLinear;break;case Pa:t=this.InterpolantFactoryMethodSmooth;break;case jl:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Ie("KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return cr;case this.InterpolantFactoryMethodLinear:return za;case this.InterpolantFactoryMethodSmooth:return Pa;case this.InterpolantFactoryMethodBezier:return jl}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e;Aa(this.settings)&&(Kh(this.settings.inTangents,e),Kh(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e;Aa(this.settings)&&(Qh(this.settings.inTangents,e),Qh(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<e;)++r;for(;a!==-1&&n[a]>t;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Be("KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Be("KeyframeTrack: Track is empty.",this),e=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Be("KeyframeTrack: Time is not a valid number.",this,o,l),e=!1;break}if(a!==null&&a>l){Be("KeyframeTrack: Out of order keys.",this,o,l,a),e=!1;break}a=l}if(s!==void 0&&xf(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Be("KeyframeTrack: Value is not a valid number.",this,o,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Pa,r=e.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=e[o],h=e[o+1];if(c!==h&&(o!==1||c!==e[0]))if(s)l=!0;else{let d=o*n,f=d-n,u=d+n;for(let p=0;p!==n;++p){let x=t[d+p];if(x!==t[f+p]||x!==t[u+p]){l=!0;break}}}if(l){if(o!==a){e[a]=e[o];let d=o*n,f=a*n;for(let u=0;u!==n;++u)t[f+u]=t[d+u]}++a}}if(r>0){e[a]=e[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)t[l+c]=t[o+c];++a}return a!==e.length?(this.times=e.slice(0,a),this.values=t.slice(0,a*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,Aa(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function Kh(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]+=e}function Qh(i,e){for(let t=0,n=i.length;t!==n;t+=2)i[t]*=e}un.prototype.ValueTypeName="";un.prototype.TimeBufferType=Float32Array;un.prototype.ValueBufferType=Float32Array;un.prototype.DefaultInterpolation=za;var Ii=class extends un{constructor(e,t,n){super(e,t,n)}};Ii.prototype.ValueTypeName="bool";Ii.prototype.ValueBufferType=Array;Ii.prototype.DefaultInterpolation=cr;Ii.prototype.InterpolantFactoryMethodLinear=void 0;Ii.prototype.InterpolantFactoryMethodSmooth=void 0;var oo=class extends un{constructor(e,t,n,s){super(e,t,n,s)}};oo.prototype.ValueTypeName="color";var lo=class extends un{constructor(e,t,n,s){super(e,t,n,s)}};lo.prototype.ValueTypeName="number";var co=class extends Pi{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-t)/(s-t),c=e*o;for(let h=c+o;c!==h;c+=4)jt.slerpFlat(r,0,a,c-o,a,c,l);return r}},Rr=class extends un{constructor(e,t,n,s){super(e,t,n,s)}InterpolantFactoryMethodLinear(e){return new co(this.times,this.values,this.getValueSize(),e)}};Rr.prototype.ValueTypeName="quaternion";Rr.prototype.InterpolantFactoryMethodSmooth=void 0;var Li=class extends un{constructor(e,t,n){super(e,t,n)}};Li.prototype.ValueTypeName="string";Li.prototype.ValueBufferType=Array;Li.prototype.DefaultInterpolation=cr;Li.prototype.InterpolantFactoryMethodLinear=void 0;Li.prototype.InterpolantFactoryMethodSmooth=void 0;var ho=class extends un{constructor(e,t,n,s){super(e,t,n,s)}};ho.prototype.ValueTypeName="vector";var uo=class{constructor(e,t,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,f=c.length;d<f;d+=2){let u=c[d],p=c[d+1];if(u.global&&(u.lastIndex=0),u.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Yu=new uo,fo=class{constructor(e){this.manager=e!==void 0?e:Yu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}setPriority(e){return this.priority=e,this}setCache(e){return this.cache=e,this}abort(){return this}};fo.DEFAULT_MATERIAL_NAME="__DEFAULT";var ji=class extends yt{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ue(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Ji=class extends ji{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ue(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Zl=new Ze,eu=new R,tu=new R,Ns=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ge(512,512),this.mapType=en,this.map=null,this.mapPass=null,this.matrix=new Ze,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ai,this._frameExtents=new ge(1,1),this._viewportCount=1,this._viewports=[new gt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;eu.setFromMatrixPosition(e.matrixWorld),t.position.copy(eu),tu.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(tu),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,s){Zl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(Zl,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,l=s?s.x/r.x:0,c=s?s.y/r.y:0;e.coordinateSystem===Rs||e.reversedDepth?t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(Zl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Ra=new R,Ca=new jt,Wn=new R,Cr=class extends yt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ze,this.projectionMatrix=new Ze,this.projectionMatrixInverse=new Ze,this.coordinateSystem=bn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Ra,Ca,Wn),Wn.x===1&&Wn.y===1&&Wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ra,Ca,Wn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Ra,Ca,Wn),Wn.x===1&&Wn.y===1&&Wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ra,Ca,Wn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Mi=new R,nu=new ge,iu=new ge,Bt=class extends Cr{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=$i*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(rr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return $i*2*Math.atan(Math.tan(rr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Mi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Mi.x,Mi.y).multiplyScalar(-e/Mi.z),Mi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Mi.x,Mi.y).multiplyScalar(-e/Mi.z)}getViewSize(e,t){return this.getViewBounds(e,nu,iu),t.subVectors(iu,nu)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(rr*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,t-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},tc=class extends Ns{constructor(){super(new Bt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){let t=this.camera,n=$i*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height*this.aspect,r=e.distance||t.far;(n!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this.aspect=e.aspect,this}toJSON(){let e=super.toJSON();return e.focus=this.focus,e.aspect=this.aspect,e}},Pr=class extends ji{constructor(e,t,n=0,s=Math.PI/3,r=0,a=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.target=new yt,this.distance=n,this.angle=s,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new tc}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}},nc=class extends Ns{constructor(){super(new Bt(90,1,.5,500)),this.isPointLightShadow=!0}},On=class extends ji{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new nc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Ir=class extends Cr{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,a=n+e,o=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},ic=class extends Ns{constructor(){super(new Ir(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ki=class extends ji{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(yt.DEFAULT_UP),this.updateMatrix(),this.target=new yt,this.shadow=new ic}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var ws=-90,Es=1,Us=class extends yt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Bt(ws,Es,e,t);s.layers=this.layers,this.add(s);let r=new Bt(ws,Es,e,t);r.layers=this.layers,this.add(r);let a=new Bt(ws,Es,e,t);a.layers=this.layers,this.add(a);let o=new Bt(ws,Es,e,t);o.layers=this.layers,this.add(o);let l=new Bt(ws,Es,e,t);l.layers=this.layers,this.add(l);let c=new Bt(ws,Es,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,l]=t;for(let c of t)this.remove(c);if(e===bn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Rs)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,d=e.getRenderTarget(),f=e.getActiveCubeFace(),u=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let x=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let g=!1;e.isWebGLRenderer===!0?g=e.state.buffers.depth.getReversed():g=e.reversedDepthBuffer,e.setRenderTarget(n,0,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(n,1,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=x,e.setRenderTarget(n,5,s),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(d,f,u),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},po=class extends Bt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}},Lr=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=up.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function up(){this._document.hidden===!1&&this.reset()}var Oc="\\[\\]\\.:\\/",dp=new RegExp("["+Oc+"]","g"),Fc="[^"+Oc+"]",fp="[^"+Oc.replace("\\.","")+"]",pp=/((?:WC+[\/:])*)/.source.replace("WC",Fc),mp=/(WCOD+)?/.source.replace("WCOD",fp),gp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Fc),_p=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Fc),xp=new RegExp("^"+pp+mp+gp+_p+"$"),yp=["material","materials","bones","map"],sc=class{constructor(e,t,n){let s=n||dt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},dt=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(dp,"")}static parseTrackName(e){let t=xp.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);yp.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===t||o.uuid===t)return o;let l=n(o.children);if(l)return l}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Ie("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=t.objectIndex;switch(n){case"materials":if(!e.material){Be("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Be("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Be("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Be("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Be("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){Be("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(c!==void 0){if(e[c]===void 0){Be("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let a=e[s];if(a===void 0){let c=t.nodeName;Be("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let o=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?o=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){Be("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Be("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};dt.Composite=sc;dt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};dt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};dt.prototype.GetterByBindingType=[dt.prototype._getValue_direct,dt.prototype._getValue_array,dt.prototype._getValue_arrayElement,dt.prototype._getValue_toArray];dt.prototype.SetterByBindingTypeAndVersioning=[[dt.prototype._setValue_direct,dt.prototype._setValue_direct_setNeedsUpdate,dt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_array,dt.prototype._setValue_array_setNeedsUpdate,dt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_arrayElement,dt.prototype._setValue_arrayElement_setNeedsUpdate,dt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[dt.prototype._setValue_fromArray,dt.prototype._setValue_fromArray_setNeedsUpdate,dt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var sy=new Float32Array(1);var su=new Ze,Dr=class{constructor(e,t,n=0,s=1/0){this.ray=new Ti(e,t),this.near=n,this.far=s,this.camera=null,this.layers=new Is,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):Be("Raycaster: Unsupported camera type: "+t.type)}setFromXRController(e){return su.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(su),this}intersectObject(e,t=!0,n=[]){return rc(e,this,n,t),n.sort(ru),n}intersectObjects(e,t=!0,n=[]){for(let s=0,r=e.length;s<r;s++)rc(e[s],this,n,t);return n.sort(ru),n}};function ru(i,e){return i.distance-e.distance}function rc(i,e,t,n){let s=!0;if(i.layers.test(e.layers)&&i.raycast(e,t)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let a=0,o=r.length;a<o;a++)rc(r[a],e,t,!0)}}var Os=class{constructor(e=1,t=0,n=0){this.radius=e,this.phi=t,this.theta=n}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=We(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(We(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Vc=class Vc{constructor(e,t,n,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=n,r[3]=s,this}};Vc.prototype.isMatrix2=!0;var ac=Vc;var Nr=class extends yr{constructor(e=10,t=10,n=4473924,s=8947848){n=new Ue(n),s=new Ue(s);let r=t/2,a=e/t,o=e/2,l=[],c=[];for(let f=0,u=0,p=-o;f<=t;f++,p+=a){l.push(-o,0,p,o,0,p),l.push(p,0,-o,p,0,o);let x=f===r?n:s;x.toArray(c,u),u+=3,x.toArray(c,u),u+=3,x.toArray(c,u),u+=3,x.toArray(c,u),u+=3}let h=new Xt;h.setAttribute("position",new tt(l,3)),h.setAttribute("color",new tt(c,3));let d=new Ds({vertexColors:!0,toneMapped:!1});super(h,d),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Ur=class extends yr{constructor(e,t=16776960){let n=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),s=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],r=new Xt;r.setIndex(new Sn(n,1)),r.setAttribute("position",new tt(s,3)),super(r,new Ds({color:t,toneMapped:!1})),this.box=e,this.type="Box3Helper",this.geometry.computeBoundingSphere()}updateMatrixWorld(e){let t=this.box;t.isEmpty()||(t.getCenter(this.position),t.getSize(this.scale),this.scale.multiplyScalar(.5),super.updateMatrixWorld(e))}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};var Or=class extends Dn{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(e){this.domElement!==null&&this.disconnect(),this.domElement=e}disconnect(){}dispose(){}update(){}};function Bc(i,e,t,n){let s=vp(n);switch(t){case Mc:return i*e;case Mo:return i*e/s.components*s.byteLength;case wo:return i*e/s.components*s.byteLength;case Oi:return i*e*2/s.components*s.byteLength;case Eo:return i*e*2/s.components*s.byteLength;case wc:return i*e*3/s.components*s.byteLength;case kn:return i*e*4/s.components*s.byteLength;case To:return i*e*4/s.components*s.byteLength;case kr:case zr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Hr:case Gr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ro:case Po:return Math.max(i,16)*Math.max(e,8)/4;case Ao:case Co:return Math.max(i,8)*Math.max(e,8)/2;case Io:case Lo:case No:case Uo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Do:case Vr:case Oo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Fo:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Bo:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case ko:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case zo:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Ho:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Go:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Vo:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Wo:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Xo:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case $o:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case qo:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Yo:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Zo:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case jo:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Jo:case Ko:case Qo:return Math.ceil(i/4)*Math.ceil(e/4)*16;case el:case tl:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Wr:case nl:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function vp(i){switch(i){case en:case yc:return{byteLength:1,components:1};case zs:case vc:case Bn:return{byteLength:2,components:1};case bo:case So:return{byteLength:2,components:4};case Fn:case vo:case En:return{byteLength:4,components:1};case bc:case Sc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"187"}}));typeof window<"u"&&(window.__THREE__?Ie("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="187");function gd(){let i=null,e=!1,t=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),t(r,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Sp(i){let e=new WeakMap;function t(o,l){let c=o.array,h=o.usage,d=c.byteLength,f=i.createBuffer();i.bindBuffer(l,f),i.bufferData(l,c,h),o.onUploadCallback();let u;if(c instanceof Float32Array)u=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)u=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?u=i.HALF_FLOAT:u=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)u=i.SHORT;else if(c instanceof Uint32Array)u=i.UNSIGNED_INT;else if(c instanceof Int32Array)u=i.INT;else if(c instanceof Int8Array)u=i.BYTE;else if(c instanceof Uint8Array)u=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)u=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:u,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){let h=l.array,d=l.updateRanges;if(i.bindBuffer(c,o),d.length===0)i.bufferSubData(c,0,h);else{d.sort((u,p)=>u.start-p.start);let f=0;for(let u=1;u<d.length;u++){let p=d[f],x=d[u];x.start<=p.start+p.count+1?p.count=Math.max(p.count,x.start+x.count-p.start):(++f,d[f]=x)}d.length=f+1;for(let u=0,p=d.length;u<p;u++){let x=d[u];i.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Mp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,wp=`#ifdef USE_ALPHAHASH
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
#endif`,Ep=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Tp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ap=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Rp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Cp=`#ifdef USE_AOMAP
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
#endif`,Pp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ip=`#ifdef USE_BATCHING
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
#endif`,Lp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Dp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Np=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Up=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Op=`#ifdef USE_IRIDESCENCE
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
#endif`,Fp=`#ifdef USE_BUMPMAP
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
#endif`,Bp=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,kp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,zp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Hp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Gp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Vp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Wp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Xp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,$p=`#define PI 3.141592653589793
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
} // validated`,qp=`vec3 transformedNormal = objectNormal;
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
#endif`,Yp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Zp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,jp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Jp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Kp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Qp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,em=`#ifdef USE_ENVMAP
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
#endif`,tm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,nm=`#ifdef USE_ENVMAP
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
#endif`,im=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,sm=`#ifdef USE_ENVMAP
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
#endif`,rm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,am=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,om=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,lm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,cm=`#ifdef USE_GRADIENTMAP
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
}`,hm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,um=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,dm=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,fm=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,pm=`#ifdef USE_ENVMAP
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
#endif`,mm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,gm=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,_m=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,xm=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ym=`PhysicalMaterial material;
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
#endif`,vm=`uniform sampler2D dfgLUT;
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
}`,bm=`
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
#endif`,Sm=`#if defined( RE_IndirectDiffuse )
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
#endif`,Mm=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,wm=`#if NUM_LIGHT_PROBE_GRIDS > 0
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
#endif`,Em=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Tm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Am=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Rm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Cm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Pm=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Im=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Lm=`#if defined( USE_POINTS_UV )
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
#endif`,Dm=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Nm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Um=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Om=`#if defined( USE_MORPHCOLORS )
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
#endif`,Fm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Bm=`#ifdef USE_MORPHTARGETS
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
#endif`,km=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,zm=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Hm=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Gm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Vm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Wm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Xm=`#ifdef USE_NORMALMAP
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
#endif`,$m=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,qm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Ym=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Zm=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,jm=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Jm=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Km=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Qm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,e0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,t0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,n0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,i0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,s0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,r0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,a0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,o0=`float getShadowMask() {
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
}`,l0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,c0=`#ifdef USE_SKINNING
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
#endif`,h0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,u0=`#ifdef USE_SKINNING
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
#endif`,d0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,f0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,p0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,m0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,g0=`#ifdef USE_TRANSMISSION
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
#endif`,_0=`#ifdef USE_TRANSMISSION
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
#endif`,x0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,y0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,v0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,b0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,S0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,M0=`uniform sampler2D t2D;
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
}`,w0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,E0=`uniform float backgroundBlurriness;
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
}`,T0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,A0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,R0=`#include <common>
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
}`,C0=`#if DEPTH_PACKING == 3200
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
}`,P0=`#define DISTANCE
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
}`,I0=`#define DISTANCE
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
}`,L0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,D0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,N0=`uniform float scale;
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
}`,U0=`uniform vec3 diffuse;
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
}`,O0=`#include <common>
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
}`,F0=`uniform vec3 diffuse;
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
}`,B0=`#define LAMBERT
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
}`,k0=`#define LAMBERT
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
}`,z0=`#define MATCAP
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
}`,H0=`#define MATCAP
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
}`,G0=`#define NORMAL
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
}`,V0=`#define NORMAL
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
}`,W0=`#define PHONG
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
}`,X0=`#define PHONG
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
}`,$0=`#define STANDARD
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
}`,q0=`#define STANDARD
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
}`,Y0=`#define TOON
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
}`,Z0=`#define TOON
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
}`,j0=`uniform float size;
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
}`,J0=`uniform vec3 diffuse;
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
}`,K0=`#include <common>
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
}`,Q0=`uniform vec3 color;
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
}`,eg=`uniform float rotation;
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
}`,tg=`uniform vec3 diffuse;
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
}`,qe={alphahash_fragment:Mp,alphahash_pars_fragment:wp,alphamap_fragment:Ep,alphamap_pars_fragment:Tp,alphatest_fragment:Ap,alphatest_pars_fragment:Rp,aomap_fragment:Cp,aomap_pars_fragment:Pp,batching_pars_vertex:Ip,batching_vertex:Lp,begin_vertex:Dp,beginnormal_vertex:Np,bsdfs:Up,iridescence_fragment:Op,bumpmap_pars_fragment:Fp,clipping_planes_fragment:Bp,clipping_planes_pars_fragment:kp,clipping_planes_pars_vertex:zp,clipping_planes_vertex:Hp,color_fragment:Gp,color_pars_fragment:Vp,color_pars_vertex:Wp,color_vertex:Xp,common:$p,defaultnormal_vertex:qp,displacementmap_pars_vertex:Yp,displacementmap_vertex:Zp,emissivemap_fragment:jp,emissivemap_pars_fragment:Jp,colorspace_fragment:Kp,colorspace_pars_fragment:Qp,envmap_fragment:em,envmap_common_pars_fragment:tm,envmap_pars_fragment:nm,envmap_pars_vertex:im,envmap_physical_pars_fragment:pm,envmap_vertex:sm,fog_vertex:rm,fog_pars_vertex:am,fog_fragment:om,fog_pars_fragment:lm,gradientmap_pars_fragment:cm,lightmap_pars_fragment:hm,lights_lambert_fragment:um,lights_lambert_pars_fragment:dm,lights_pars_begin:fm,lights_toon_fragment:mm,lights_toon_pars_fragment:gm,lights_phong_fragment:_m,lights_phong_pars_fragment:xm,lights_physical_fragment:ym,lights_physical_pars_fragment:vm,lights_fragment_begin:bm,lights_fragment_maps:Sm,lights_fragment_end:Mm,lightprobes_pars_fragment:wm,logdepthbuf_fragment:Em,logdepthbuf_pars_fragment:Tm,logdepthbuf_pars_vertex:Am,logdepthbuf_vertex:Rm,map_fragment:Cm,map_pars_fragment:Pm,map_particle_fragment:Im,map_particle_pars_fragment:Lm,metalnessmap_fragment:Dm,metalnessmap_pars_fragment:Nm,morphinstance_vertex:Um,morphcolor_vertex:Om,morphnormal_vertex:Fm,morphtarget_pars_vertex:Bm,morphtarget_vertex:km,normal_fragment_begin:zm,normal_fragment_maps:Hm,normal_pars_fragment:Gm,normal_pars_vertex:Vm,normal_vertex:Wm,normalmap_pars_fragment:Xm,clearcoat_normal_fragment_begin:$m,clearcoat_normal_fragment_maps:qm,clearcoat_pars_fragment:Ym,iridescence_pars_fragment:Zm,opaque_fragment:jm,packing:Jm,premultiplied_alpha_fragment:Km,project_vertex:Qm,dithering_fragment:e0,dithering_pars_fragment:t0,roughnessmap_fragment:n0,roughnessmap_pars_fragment:i0,shadowmap_pars_fragment:s0,shadowmap_pars_vertex:r0,shadowmap_vertex:a0,shadowmask_pars_fragment:o0,skinbase_vertex:l0,skinning_pars_vertex:c0,skinning_vertex:h0,skinnormal_vertex:u0,specularmap_fragment:d0,specularmap_pars_fragment:f0,tonemapping_fragment:p0,tonemapping_pars_fragment:m0,transmission_fragment:g0,transmission_pars_fragment:_0,uv_pars_fragment:x0,uv_pars_vertex:y0,uv_vertex:v0,worldpos_vertex:b0,background_vert:S0,background_frag:M0,backgroundCube_vert:w0,backgroundCube_frag:E0,cube_vert:T0,cube_frag:A0,depth_vert:R0,depth_frag:C0,distance_vert:P0,distance_frag:I0,equirect_vert:L0,equirect_frag:D0,linedashed_vert:N0,linedashed_frag:U0,meshbasic_vert:O0,meshbasic_frag:F0,meshlambert_vert:B0,meshlambert_frag:k0,meshmatcap_vert:z0,meshmatcap_frag:H0,meshnormal_vert:G0,meshnormal_frag:V0,meshphong_vert:W0,meshphong_frag:X0,meshphysical_vert:$0,meshphysical_frag:q0,meshtoon_vert:Y0,meshtoon_frag:Z0,points_vert:j0,points_frag:J0,shadow_vert:K0,shadow_frag:Q0,sprite_vert:eg,sprite_frag:tg},xe={common:{diffuse:{value:new Ue(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ke}},envmap:{envMap:{value:null},envMapRotation:{value:new ke},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ke}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ke}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ke},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ke},normalScale:{value:new ge(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ke},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ke}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ke}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ke}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ue(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Ue(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0},uvTransform:{value:new ke}},sprite:{diffuse:{value:new Ue(16777215)},opacity:{value:1},center:{value:new ge(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ke},alphaMap:{value:null},alphaMapTransform:{value:new ke},alphaTest:{value:0}}},Kn={basic:{uniforms:$t([xe.common,xe.specularmap,xe.envmap,xe.aomap,xe.lightmap,xe.fog]),vertexShader:qe.meshbasic_vert,fragmentShader:qe.meshbasic_frag},lambert:{uniforms:$t([xe.common,xe.specularmap,xe.envmap,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.fog,xe.lights,{emissive:{value:new Ue(0)},envMapIntensity:{value:1}}]),vertexShader:qe.meshlambert_vert,fragmentShader:qe.meshlambert_frag},phong:{uniforms:$t([xe.common,xe.specularmap,xe.envmap,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.fog,xe.lights,{emissive:{value:new Ue(0)},specular:{value:new Ue(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:qe.meshphong_vert,fragmentShader:qe.meshphong_frag},standard:{uniforms:$t([xe.common,xe.envmap,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.roughnessmap,xe.metalnessmap,xe.fog,xe.lights,{emissive:{value:new Ue(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:qe.meshphysical_vert,fragmentShader:qe.meshphysical_frag},toon:{uniforms:$t([xe.common,xe.aomap,xe.lightmap,xe.emissivemap,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.gradientmap,xe.fog,xe.lights,{emissive:{value:new Ue(0)}}]),vertexShader:qe.meshtoon_vert,fragmentShader:qe.meshtoon_frag},matcap:{uniforms:$t([xe.common,xe.bumpmap,xe.normalmap,xe.displacementmap,xe.fog,{matcap:{value:null}}]),vertexShader:qe.meshmatcap_vert,fragmentShader:qe.meshmatcap_frag},points:{uniforms:$t([xe.points,xe.fog]),vertexShader:qe.points_vert,fragmentShader:qe.points_frag},dashed:{uniforms:$t([xe.common,xe.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:qe.linedashed_vert,fragmentShader:qe.linedashed_frag},depth:{uniforms:$t([xe.common,xe.displacementmap]),vertexShader:qe.depth_vert,fragmentShader:qe.depth_frag},normal:{uniforms:$t([xe.common,xe.bumpmap,xe.normalmap,xe.displacementmap,{opacity:{value:1}}]),vertexShader:qe.meshnormal_vert,fragmentShader:qe.meshnormal_frag},sprite:{uniforms:$t([xe.sprite,xe.fog]),vertexShader:qe.sprite_vert,fragmentShader:qe.sprite_frag},background:{uniforms:{uvTransform:{value:new ke},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:qe.background_vert,fragmentShader:qe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ke}},vertexShader:qe.backgroundCube_vert,fragmentShader:qe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:qe.cube_vert,fragmentShader:qe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:qe.equirect_vert,fragmentShader:qe.equirect_frag},distance:{uniforms:$t([xe.common,xe.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:qe.distance_vert,fragmentShader:qe.distance_frag},shadow:{uniforms:$t([xe.lights,xe.fog,{color:{value:new Ue(0)},opacity:{value:1}}]),vertexShader:qe.shadow_vert,fragmentShader:qe.shadow_frag}};Kn.physical={uniforms:$t([Kn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ke},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ke},clearcoatNormalScale:{value:new ge(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ke},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new ke},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ke},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ke},sheen:{value:0},sheenColor:{value:new Ue(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ke},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ke},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ke},transmissionSamplerSize:{value:new ge},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ke},attenuationDistance:{value:0},attenuationColor:{value:new Ue(0)},specularColor:{value:new Ue(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ke},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ke},anisotropyVector:{value:new ge},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ke}}]),vertexShader:qe.meshphysical_vert,fragmentShader:qe.meshphysical_frag};var il={r:0,b:0,g:0},ng=new Ze,_d=new ke;_d.set(-1,0,0,0,1,0,0,0,1);function ig(i,e,t,n,s,r){let a=new Ue(0),o=s===!0?0:1,l,c,h=null,d=0,f=null;function u(v){let w=v.isScene===!0?v.background:null;if(w&&w.isTexture){let S=v.backgroundBlurriness>0;w=e.get(w,S)}return w}function p(v){let w=!1,S=u(v);S===null?g(a,o):S&&S.isColor&&(g(S,1),w=!0);let T=i.xr.getEnvironmentBlendMode();T==="additive"?t.buffers.color.setClear(0,0,0,1,r):T==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(i.autoClear||w)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function x(v,w){let S=u(w);S&&S.isCubeTexture?(c===void 0&&(c=new ut(new Mn(1,1,1),new wn({name:"BackgroundCubeMaterial",uniforms:rs(Kn.backgroundCube.uniforms),vertexShader:Kn.backgroundCube.vertexShader,fragmentShader:Kn.backgroundCube.fragmentShader,side:kt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,E,_){this.matrixWorld.copyPosition(_.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=S,c.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(ng.makeRotationFromEuler(w.backgroundRotation)).transpose(),S.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(_d),c.material.toneMapped=Qe.getTransfer(S.colorSpace)!==st,(h!==S||d!==S.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,h=S,d=S.version,f=i.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):S&&S.isTexture&&(l===void 0&&(l=new ut(new ft(2,2),new wn({name:"BackgroundMaterial",uniforms:rs(Kn.background.uniforms),vertexShader:Kn.background.vertexShader,fragmentShader:Kn.background.fragmentShader,side:Ui,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=S,l.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,l.material.toneMapped=Qe.getTransfer(S.colorSpace)!==st,S.matrixAutoUpdate===!0&&S.updateMatrix(),l.material.uniforms.uvTransform.value.copy(S.matrix),(h!==S||d!==S.version||f!==i.toneMapping)&&(l.material.needsUpdate=!0,h=S,d=S.version,f=i.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function g(v,w){v.getRGB(il,Uc(i)),t.buffers.color.setClear(il.r,il.g,il.b,w,r)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(v,w=1){a.set(v),o=w,g(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,g(a,o)},render:p,addToRenderList:x,dispose:m}}function sg(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=f(null),r=s,a=!1;function o(D,O,V,I,X){let q=!1,H=d(D,I,V,O);r!==H&&(r=H,c(r.object)),q=u(D,I,V,X),q&&p(D,I,V,X),X!==null&&e.update(X,i.ELEMENT_ARRAY_BUFFER),(q||a)&&(a=!1,S(D,O,V,I),X!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(X).buffer))}function l(){return i.createVertexArray()}function c(D){return i.bindVertexArray(D)}function h(D){return i.deleteVertexArray(D)}function d(D,O,V,I){let X=I.wireframe===!0,q=n[O.id];q===void 0&&(q={},n[O.id]=q);let H=D.isInstancedMesh===!0?D.id:0,Q=q[H];Q===void 0&&(Q={},q[H]=Q);let G=Q[V.id];G===void 0&&(G={},Q[V.id]=G);let ne=G[X];return ne===void 0&&(ne=f(l()),G[X]=ne),ne}function f(D){let O=[],V=[],I=[];for(let X=0;X<t;X++)O[X]=0,V[X]=0,I[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:V,attributeDivisors:I,object:D,attributes:{},index:null}}function u(D,O,V,I){let X=r.attributes,q=O.attributes,H=0,Q=V.getAttributes();for(let G in Q)if(Q[G].location>=0){let ie=X[G],Ae=q[G];if(Ae===void 0&&(G==="instanceMatrix"&&D.instanceMatrix&&(Ae=D.instanceMatrix),G==="instanceColor"&&D.instanceColor&&(Ae=D.instanceColor)),ie===void 0||ie.attribute!==Ae||Ae&&ie.data!==Ae.data)return!0;H++}return r.attributesNum!==H||r.index!==I}function p(D,O,V,I){let X={},q=O.attributes,H=0,Q=V.getAttributes();for(let G in Q)if(Q[G].location>=0){let ie=q[G];ie===void 0&&(G==="instanceMatrix"&&D.instanceMatrix&&(ie=D.instanceMatrix),G==="instanceColor"&&D.instanceColor&&(ie=D.instanceColor));let Ae={};Ae.attribute=ie,ie&&ie.data&&(Ae.data=ie.data),X[G]=Ae,H++}r.attributes=X,r.attributesNum=H,r.index=I}function x(){let D=r.newAttributes;for(let O=0,V=D.length;O<V;O++)D[O]=0}function g(D){m(D,0)}function m(D,O){let V=r.newAttributes,I=r.enabledAttributes,X=r.attributeDivisors;V[D]=1,I[D]===0&&(i.enableVertexAttribArray(D),I[D]=1),X[D]!==O&&(i.vertexAttribDivisor(D,O),X[D]=O)}function v(){let D=r.newAttributes,O=r.enabledAttributes;for(let V=0,I=O.length;V<I;V++)O[V]!==D[V]&&(i.disableVertexAttribArray(V),O[V]=0)}function w(D,O,V,I,X,q,H){H===!0?i.vertexAttribIPointer(D,O,V,X,q):i.vertexAttribPointer(D,O,V,I,X,q)}function S(D,O,V,I){x();let X=I.attributes,q=V.getAttributes(),H=O.defaultAttributeValues;for(let Q in q){let G=q[Q];if(G.location>=0){let ne=X[Q];if(ne===void 0&&(Q==="instanceMatrix"&&D.instanceMatrix&&(ne=D.instanceMatrix),Q==="instanceColor"&&D.instanceColor&&(ne=D.instanceColor)),ne!==void 0){let ie=ne.normalized,Ae=ne.itemSize,He=e.get(ne);if(He===void 0)continue;let j=He.buffer,ye=He.type,Me=He.bytesPerElement,Le=ye===i.INT||ye===i.UNSIGNED_INT||ne.gpuType===vo;if(ne.isInterleavedBufferAttribute){let ve=ne.data,Ve=ve.isInterleavedBuffer===!0?ve.stride:ve.itemSize,vt=ne.offset;if(ve.isInstancedInterleavedBuffer||ve.isInstancedBufferAttribute){for(let Oe=0;Oe<G.locationSize;Oe++)m(G.location+Oe,ve.meshPerAttribute);D.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=ve.meshPerAttribute*ve.count)}else for(let Oe=0;Oe<G.locationSize;Oe++)g(G.location+Oe);i.bindBuffer(i.ARRAY_BUFFER,j);for(let Oe=0;Oe<G.locationSize;Oe++)w(G.location+Oe,Ae/G.locationSize,ye,ie,Ve*Me,(vt+Ae/G.locationSize*Oe)*Me,Le)}else{if(ne.isInstancedBufferAttribute){for(let ve=0;ve<G.locationSize;ve++)m(G.location+ve,ne.meshPerAttribute);D.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=ne.meshPerAttribute*ne.count)}else for(let ve=0;ve<G.locationSize;ve++)g(G.location+ve);i.bindBuffer(i.ARRAY_BUFFER,j);for(let ve=0;ve<G.locationSize;ve++)w(G.location+ve,Ae/G.locationSize,ye,ie,Ae*Me,Ae/G.locationSize*ve*Me,Le)}}else if(H!==void 0){let ie=H[Q];if(ie!==void 0)switch(ie.length){case 2:i.vertexAttrib2fv(G.location,ie);break;case 3:i.vertexAttrib3fv(G.location,ie);break;case 4:i.vertexAttrib4fv(G.location,ie);break;default:i.vertexAttrib1fv(G.location,ie)}}}}v()}function T(){N();for(let D in n){let O=n[D];for(let V in O){let I=O[V];for(let X in I){let q=I[X];for(let H in q)h(q[H].object),delete q[H];delete I[X]}}delete n[D]}}function E(D){if(n[D.id]===void 0)return;let O=n[D.id];for(let V in O){let I=O[V];for(let X in I){let q=I[X];for(let H in q)h(q[H].object),delete q[H];delete I[X]}}delete n[D.id]}function _(D){for(let O in n){let V=n[O];for(let I in V){let X=V[I];if(X[D.id]===void 0)continue;let q=X[D.id];for(let H in q)h(q[H].object),delete q[H];delete X[D.id]}}}function M(D){for(let O in n){let V=n[O],I=D.isInstancedMesh===!0?D.id:0,X=V[I];if(X!==void 0){for(let q in X){let H=X[q];for(let Q in H)h(H[Q].object),delete H[Q];delete X[q]}delete V[I],Object.keys(V).length===0&&delete n[O]}}}function N(){P(),a=!0,r!==s&&(r=s,c(r.object))}function P(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:N,resetDefaultState:P,dispose:T,releaseStatesOfGeometry:E,releaseStatesOfObject:M,releaseStatesOfProgram:_,initAttributes:x,enableAttribute:g,disableUnusedAttributes:v}}function rg(i,e,t){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let f=0;for(let u=0;u<h;u++)f+=c[u];t.update(f,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function ag(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let _=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(_.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(_){return!(_!==kn&&n.convert(_)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(_){let M=_===Bn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(_!==en&&_!==En&&!M&&n.convert(_)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(_){if(_==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";_="mediump"}return _==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(Ie("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),f=t.logarithmicDepthBuffer===!0&&d===!1;t.reversedDepthBuffer===!0&&d===!1&&Ie("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),t.logarithmicDepthBuffer===!0&&d===!0&&Ie("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),p=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),v=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),S=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),T=i.getParameter(i.MAX_SAMPLES),E=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:u,maxVertexTextures:p,maxTextureSize:x,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:v,maxVaryings:w,maxFragmentUniforms:S,maxSamples:T,samples:E}}function og(i){let e=this,t=null,n=0,s=!1,r=!1,a=new ln,o=new ke,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,f){let u=d.length!==0||f||n!==0||s;return s=f,n=d.length,u},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,f){t=h(d,f,0)},this.setState=function(d,f,u){let p=d.clippingPlanes,x=d.clipIntersection,g=d.clipShadows,m=i.get(d);if(!s||p===null||p.length===0||r&&!g)r?h(null):c();else{let v=r?0:n,w=v*4,S=m.clippingState||null;l.value=S,S=h(p,f,w,u);for(let T=0;T!==w;++T)S[T]=t[T];m.clippingState=S,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(d,f,u,p){let x=d!==null?d.length:0,g=null;if(x!==0){if(g=l.value,p!==!0||g===null){let m=u+x*4,v=f.matrixWorldInverse;o.getNormalMatrix(v),(g===null||g.length<m)&&(g=new Float32Array(m));for(let w=0,S=u;w!==x;++w,S+=4)a.copy(d[w]).applyMatrix4(v,o),a.normal.toArray(g,S),g[S+3]=a.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,g}}var Yr=class extends cn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new vr(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Mn(5,5,5),r=new wn({name:"CubemapFromEquirect",uniforms:rs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:kt,blending:es});r.uniforms.tEquirect.value=t;let a=new ut(s,r),o=t.minFilter;return t.minFilter===hi&&(t.minFilter=Zt),new Us(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){let r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}},Zu=256,lg=3,cg=20,xd=256,yd=16,hg=3,ug=new R,dg=new Ue,Vs=class i{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Us(1,10,null),this._boxMesh=new ut(new Mn(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,s=100,r={}){let{size:a=256,position:o=ug}=r,l=this._renderer;this._setSize(a);let c=this._allocateTarget(),h=this._getSourceTarget(!0);t>0&&(h.texture.mipmapsAutoUpdate=!1);let d=l.autoClear,f=l.autoClearColor,u=l.autoClearDepth,p=l.autoClearStencil,x=e.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,x===null&&(e.background=l.getClearColor(dg));let g=new Us(n,s,h);return g.position.copy(o),g.update(l,e),l.autoClear=d,l.autoClearColor=f,l.autoClearDepth=u,l.autoClearStencil=p,e.background=x,t>0&&(h.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ku(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ju(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(Zu,Ic(e))}_fromTexture(e,t){e.mapping===is||e.mapping===ks?this._setSize(e.image.length===0?Zu:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=ju(e,!1,!1),n=Math.log2(e)-lg;for(let s=0;s<=n;s++)t.texture.mipmaps.push({width:e>>s,height:e>>s});return t.texture.name="PMREM",t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=ju(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let s=this._boxMesh,r=this._cubeCamera;s.material=n,r.renderTarget=e,r.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),r.update(this._renderer,s),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===is||e.mapping===ks?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ku()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Ju()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(e){this._ggxMaterial===null&&(this._ggxMaterial=fg(),this._integrationMaterial=pg());let t=this._cubeSize,n=e.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;let r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(t/yd);for(let a=0;a<=n;a++){let o=i.lodToRoughness(a,n);if(a>n-hg)r.roughness.value=o,this._renderCube(e,a,this._integrationMaterial);else{let l=o>0?Math.log2(t)+.5*Math.log2(6/(xd*Math.pow(o,4)))+.5:0;s.roughness.value=o,s.lodBias.value=l,this._renderCube(e,a,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=mg());let n=this._blurMaterial,s=n.uniforms,r=this._sourceTarget;s.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,s.envMap.value=r.texture,this._renderCube(e,0,n),s.envMap.value=e.texture,this._renderCube(r,0,n)}};function ju(i,e,t){return new Yr(i,{minFilter:hi,generateMipmaps:e,type:Bn,colorSpace:hr,depthBuffer:t})}function Zr(i,e,t){return new wn({name:i,uniforms:e,vertexShader:qe.cube_vert,fragmentShader:t,side:kt,blending:es,depthTest:!1,depthWrite:!1})}function fg(){return Zr("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${xd}u

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
	`)}function pg(){return Zr("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:yd}},`

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
	`)}function mg(){return Zr("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${cg}
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
	`)}function Ju(){return Zr("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

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
	`)}function Ku(){return Zr("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function gg(i){let e=new WeakMap,t=new WeakMap,n=null;function s(f,u=!1){return f==null?null:u?a(f):r(f)}function r(f){if(f&&f.isTexture){let u=f.mapping;if(u===_o||u===xo)if(e.has(f)){let p=e.get(f).texture;return o(p,f.mapping)}else{let p=f.image;if(p&&p.height>0){let x=new Yr(p.height);return x.fromEquirectangularTexture(i,f),e.set(f,x),f.addEventListener("dispose",c),o(x.texture,f.mapping)}else return null}}return f}function a(f){if(f&&f.isTexture&&f.isPMREMTexture!==!0){let u=f.mapping,p=u===_o||u===xo,x=u===is||u===ks;if(p||x){let g=t.get(f),m=g!==void 0?g.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==m)return n===null&&(n=new Vs(i)),g=p?n.fromEquirectangular(f,g):n.fromCubemap(f,g),g.texture.pmremVersion=f.pmremVersion,t.set(f,g),g.texture;if(g!==void 0)return g.texture;{let v=f.image;return p&&v&&v.height>0||x&&v&&l(v)?(n===null&&(n=new Vs(i)),g=p?n.fromEquirectangular(f):n.fromCubemap(f),g.texture.pmremVersion=f.pmremVersion,t.set(f,g),f.addEventListener("dispose",h),g.texture):null}}}return f}function o(f,u){return u===_o?f.mapping=is:u===xo&&(f.mapping=ks),f}function l(f){let u=0,p=6;for(let x=0;x<p;x++)f[x]!==void 0&&u++;return u===p}function c(f){let u=f.target;u.removeEventListener("dispose",c);let p=e.get(u);p!==void 0&&(e.delete(u),p.dispose())}function h(f){let u=f.target;u.removeEventListener("dispose",h);let p=t.get(u);p!==void 0&&(t.delete(u),p.dispose())}function d(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function _g(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s=i.getExtension(n);return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&Xi("WebGLRenderer: "+n+" extension not supported."),s}}}function xg(i,e,t,n){let s={},r=new WeakMap,a=new FinalizationRegistry(p=>delete s[p]);function o(p){l(p.target)}function l(p){p.index!==null&&e.remove(p.index);for(let g in p.attributes)e.remove(p.attributes[g]);p.removeEventListener("dispose",o),delete s[p.id],a.unregister(p);let x=r.get(p);x&&(e.remove(x),r.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,t.memory.geometries--}function c(p,x){return s[x.id]!==void 0||(x.addEventListener("dispose",o),s[x.id]=new WeakRef(x),a.register(x,x.id,x),t.memory.geometries++),x}function h(p){let x=p.attributes;for(let g in x)e.update(x[g],i.ARRAY_BUFFER)}function d(p){let x=p.index,g=p.attributes.position,m=0;if(g===void 0)return;let v=x!==null?x.array.length:g.array.length/3-1,w=g.count>=65535?gr:mr,S=new w(Math.ceil(v/3)*6,1),T=S.array;if(x!==null){let _=x.array;m=x.version;for(let M=0,N=0;M<v;M+=3){let P=_[M+0],D=_[M+1],O=_[M+2];T[N++]=P,T[N++]=D,T[N++]=D,T[N++]=O,T[N++]=O,T[N++]=P}}else{m=g.version;for(let _=0,M=0;_<v;_+=3){let N=_+0,P=_+1,D=_+2;T[M++]=N,T[M++]=P,T[M++]=P,T[M++]=D,T[M++]=D,T[M++]=N}}S.version=m;let E=r.get(p);E&&e.remove(E),r.set(p,S)}function f(p){let x=r.get(p);if(x){let g=p.index;g!==null&&x.version<g.version&&d(p)}else d(p);return r.get(p)}function u(){for(let p in s){let x=s[p].deref();x!==void 0&&l(x)}}return{get:c,update:h,getWireframeAttribute:f,dispose:u}}function yg(i,e,t){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,f){i.drawElements(n,f,r,d*a),t.update(f,n,1)}function c(d,f,u){u!==0&&(i.drawElementsInstanced(n,f,r,d*a,u),t.update(f,n,u))}function h(d,f,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,u);let x=0;for(let g=0;g<u;g++)x+=f[g];t.update(x,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function vg(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:Be("WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function bg(i,e,t){let n=new WeakMap,s=new gt;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0,f=n.get(o);if(f===void 0||f.count!==d){let N=function(){_.dispose(),n.delete(o),o.removeEventListener("dispose",N)};f!==void 0&&f.texture.dispose();let u=o.morphAttributes.position!==void 0,p=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],w=0;u===!0&&(w=1),p===!0&&(w=2),x===!0&&(w=3);let S=o.attributes.position.count*w,T=1;S>e.maxTextureSize&&(T=Math.ceil(S/e.maxTextureSize),S=e.maxTextureSize);let E=new Float32Array(S*T*4*d),_=new fr(E,S,T,d);_.type=En,_.needsUpdate=!0;let M=w*4;for(let P=0;P<d;P++){let D=g[P],O=m[P],V=v[P],I=S*T*4*P;for(let X=0;X<D.count;X++){let q=X*M;u===!0&&(s.fromBufferAttribute(D,X),E[I+q+0]=s.x,E[I+q+1]=s.y,E[I+q+2]=s.z,E[I+q+3]=0),p===!0&&(s.fromBufferAttribute(O,X),E[I+q+4]=s.x,E[I+q+5]=s.y,E[I+q+6]=s.z,E[I+q+7]=0),x===!0&&(s.fromBufferAttribute(V,X),E[I+q+8]=s.x,E[I+q+9]=s.y,E[I+q+10]=s.z,E[I+q+11]=V.itemSize===4?s.w:1)}}f={count:d,texture:_,size:new ge(S,T)},n.set(o,f),o.addEventListener("dispose",N)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let u=0;for(let x=0;x<c.length;x++)u+=c[x];let p=o.morphTargetsRelative?1:1-u;l.getUniforms().setValue(i,"morphTargetBaseInfluence",p),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",f.size)}return{update:r}}function Sg(i,e,t,n,s){let r=new WeakMap;function a(c){let h=s.render.frame,d=c.geometry,f=e.get(c,d);if(r.get(f)!==h&&(e.update(f),r.set(f,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let u=c.skeleton;r.get(u)!==h&&(u.update(),r.set(u,h))}return f}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}var Mg={[dc]:"LINEAR_TONE_MAPPING",[fc]:"REINHARD_TONE_MAPPING",[pc]:"CINEON_TONE_MAPPING",[Fr]:"ACES_FILMIC_TONE_MAPPING",[gc]:"AGX_TONE_MAPPING",[_c]:"NEUTRAL_TONE_MAPPING",[mc]:"CUSTOM_TONE_MAPPING"};function wg(i,e,t,n,s,r){let a=new cn(e,t,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=null,h=new Xt;h.setAttribute("position",new tt([-1,3,0,-1,-1,0,3,-1,0],3)),h.setAttribute("uv",new tt([0,2,0,0,2,0],2));let d=new eo({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new ut(h,d),u=new Ir(-1,1,1,-1,0,1),p=null,x=null,g=!1,m,v=null,w=[],S=!1;this.setSize=function(T,E){a.setSize(T,E),o!==null&&o.setSize(T,E),l!==null&&l.setSize(T,E);for(let _=0;_<w.length;_++){let M=w[_];M.setSize&&M.setSize(T,E)}},this.setEffects=function(T){w=T,S=w.length>0&&w[0].isRenderPass===!0;let E=a.width,_=a.height;w.length>0&&o===null&&(o=new cn(E,_,{type:Bn,depthBuffer:!1,stencilBuffer:!1}),l=new cn(E,_,{type:Bn,depthBuffer:!1,stencilBuffer:!1}));let M=s===!0&&w.some(N=>N.needsDepthTexture===!0);M!==(a.depthTexture!==null)&&(M===!0&&c===null&&(c=new li(E,_),r===!0&&(c.format=ui,c.type=ss)),a.dispose(),a.depthTexture=M?c:null,a.resolveDepthBuffer=M,a.storeMultisampledDepthBuffer=M);for(let N=0;N<w.length;N++){let P=w[N];P.setSize&&P.setSize(E,_),M&&P.needsDepthTexture===!0&&P.setDepthTexture&&P.setDepthTexture(c)}},this.begin=function(T,E){if(g||T.toneMapping===jn&&w.length===0)return!1;if(v=E,E!==null){let _=E.width,M=E.height;(a.width!==_||a.height!==M)&&this.setSize(_,M)}return S===!1&&T.setRenderTarget(a),m=T.toneMapping,T.toneMapping=jn,!0},this.hasRenderPass=function(){return S},this.end=function(T,E){T.toneMapping=m,g=!0;let _=a,M=o;for(let N=0;N<w.length;N++){let P=w[N];P.enabled!==!1&&(P.render(T,M,_,E),P.needsSwap!==!1&&(_=M,M=M===o?l:o))}if(p!==T.outputColorSpace||x!==T.toneMapping){p=T.outputColorSpace,x=T.toneMapping,d.defines={},Qe.getTransfer(p)===st&&(d.defines.SRGB_TRANSFER="");let N=Mg[x];N&&(d.defines[N]=""),d.needsUpdate=!0}d.uniforms.tDiffuse.value=_.texture,T.setRenderTarget(v),T.render(f,u),v=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),h.dispose(),d.dispose()}}var vd=new Jt,bd=new li(1,1),Sd=new br(1),Md=new fr,wd=new Va,Ed=new vr,Qu=[],ed=[],td=new Float32Array(16),nd=new Float32Array(9),id=new Float32Array(4);function Ws(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=Qu[s];if(r===void 0&&(r=new Float32Array(s),Qu[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function Et(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Tt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function al(i,e){let t=ed[e];t===void 0&&(t=new Int32Array(e),ed[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Eg(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Tg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Et(t,e))return;i.uniform2fv(this.addr,e),Tt(t,e)}}function Ag(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Et(t,e))return;i.uniform3fv(this.addr,e),Tt(t,e)}}function Rg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Et(t,e))return;i.uniform4fv(this.addr,e),Tt(t,e)}}function Cg(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Et(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Tt(t,e)}else{if(Et(t,n))return;id.set(n),i.uniformMatrix2fv(this.addr,!1,id),Tt(t,n)}}function Pg(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Et(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Tt(t,e)}else{if(Et(t,n))return;nd.set(n),i.uniformMatrix3fv(this.addr,!1,nd),Tt(t,n)}}function Ig(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(Et(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Tt(t,e)}else{if(Et(t,n))return;td.set(n),i.uniformMatrix4fv(this.addr,!1,td),Tt(t,n)}}function Lg(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Dg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Et(t,e))return;i.uniform2iv(this.addr,e),Tt(t,e)}}function Ng(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Et(t,e))return;i.uniform3iv(this.addr,e),Tt(t,e)}}function Ug(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Et(t,e))return;i.uniform4iv(this.addr,e),Tt(t,e)}}function Og(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Fg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Et(t,e))return;i.uniform2uiv(this.addr,e),Tt(t,e)}}function Bg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Et(t,e))return;i.uniform3uiv(this.addr,e),Tt(t,e)}}function kg(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Et(t,e))return;i.uniform4uiv(this.addr,e),Tt(t,e)}}function ol(i){return i.version===0&&(i.compareFunction=Ac,i.needsUpdate=!0),i}function zg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?r=ol(bd):r=vd,t.setTexture2D(e||r,s)}function Hg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||wd,s)}function Gg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_CUBE_SHADOW?r=ol(Sd):r=Ed,t.setTextureCube(e||r,s)}function Vg(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Md,s)}function Wg(i){switch(i){case 5126:return Eg;case 35664:return Tg;case 35665:return Ag;case 35666:return Rg;case 35674:return Cg;case 35675:return Pg;case 35676:return Ig;case 5124:case 35670:return Lg;case 35667:case 35671:return Dg;case 35668:case 35672:return Ng;case 35669:case 35673:return Ug;case 5125:return Og;case 36294:return Fg;case 36295:return Bg;case 36296:return kg;case 35678:case 36198:case 36298:case 36306:case 35682:return zg;case 35679:case 36299:case 36307:return Hg;case 35680:case 36300:case 36308:case 36293:return Gg;case 36289:case 36303:case 36311:case 36292:return Vg}}function Xg(i,e){i.uniform1fv(this.addr,e)}function $g(i,e){let t=Ws(e,this.size,2);i.uniform2fv(this.addr,t)}function qg(i,e){let t=Ws(e,this.size,3);i.uniform3fv(this.addr,t)}function Yg(i,e){let t=Ws(e,this.size,4);i.uniform4fv(this.addr,t)}function Zg(i,e){let t=Ws(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function jg(i,e){let t=Ws(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Jg(i,e){let t=Ws(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Kg(i,e){i.uniform1iv(this.addr,e)}function Qg(i,e){i.uniform2iv(this.addr,e)}function e_(i,e){i.uniform3iv(this.addr,e)}function t_(i,e){i.uniform4iv(this.addr,e)}function n_(i,e){i.uniform1uiv(this.addr,e)}function i_(i,e){i.uniform2uiv(this.addr,e)}function s_(i,e){i.uniform3uiv(this.addr,e)}function r_(i,e){i.uniform4uiv(this.addr,e)}function a_(i,e,t){let n=this.cache,s=e.length,r=al(t,s);Et(n,r)||(i.uniform1iv(this.addr,r),Tt(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=ol(bd):a=vd;for(let o=0;o!==s;++o)t.setTexture2D(e[o]||a,r[o])}function o_(i,e,t){let n=this.cache,s=e.length,r=al(t,s);Et(n,r)||(i.uniform1iv(this.addr,r),Tt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||wd,r[a])}function l_(i,e,t){let n=this.cache,s=e.length,r=al(t,s);Et(n,r)||(i.uniform1iv(this.addr,r),Tt(n,r));let a;this.type===i.SAMPLER_CUBE_SHADOW?a=ol(Sd):a=Ed;for(let o=0;o!==s;++o)t.setTextureCube(e[o]||a,r[o])}function c_(i,e,t){let n=this.cache,s=e.length,r=al(t,s);Et(n,r)||(i.uniform1iv(this.addr,r),Tt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||Md,r[a])}function h_(i){switch(i){case 5126:return Xg;case 35664:return $g;case 35665:return qg;case 35666:return Yg;case 35674:return Zg;case 35675:return jg;case 35676:return Jg;case 5124:case 35670:return Kg;case 35667:case 35671:return Qg;case 35668:case 35672:return e_;case 35669:case 35673:return t_;case 5125:return n_;case 36294:return i_;case 36295:return s_;case 36296:return r_;case 35678:case 36198:case 36298:case 36306:case 35682:return a_;case 35679:case 36299:case 36307:return o_;case 35680:case 36300:case 36308:case 36293:return l_;case 36289:case 36303:case 36311:case 36292:return c_}}var $c=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Wg(t.type)}},qc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=h_(t.type)}},Yc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(e,t[o.id],n)}}},Wc=/(\w+)(\])?(\[|\.)?/g;function sd(i,e){i.seq.push(e),i.map[e.id]=e}function u_(i,e,t){let n=i.name,s=n.length;for(Wc.lastIndex=0;;){let r=Wc.exec(n),a=Wc.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){sd(t,c===void 0?new $c(o,i,e):new qc(o,i,e));break}else{let d=t.map[o];d===void 0&&(d=new Yc(o),sd(t,d)),t=d}}}var Gs=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);u_(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){let o=t[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let a=e[s];a.id in t&&n.push(a)}return n}};function rd(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var d_=37297,f_=0;function p_(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}var ad=new ke;function m_(i){Qe._getMatrix(ad,Qe.workingColorSpace,i);let e=`mat3( ${ad.elements.map(t=>t.toFixed(4))} )`;switch(Qe.getTransfer(i)){case ur:return[e,"LinearTransferOETF"];case st:return[e,"sRGBTransferOETF"];default:return Ie("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function od(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),r=(i.getShaderInfoLog(e)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+p_(i.getShaderSource(e),o)}else return r}function g_(i,e){let t=m_(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( ${t[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}var __={[dc]:"Linear",[fc]:"Reinhard",[pc]:"Cineon",[Fr]:"ACESFilmic",[gc]:"AgX",[_c]:"Neutral",[mc]:"Custom"};function x_(i,e){let t=__[e];return t===void 0?(Ie("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var sl=new R;function y_(){Qe.getLuminanceCoefficients(sl);let i=sl.x.toFixed(4),e=sl.y.toFixed(4),t=sl.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function v_(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(qr).join(`
`)}function b_(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function S_(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function qr(i){return i!==""}function ld(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,e.numLightProbeGrids)}function cd(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var M_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Zc(i){return i.replace(M_,w_)}function w_(i,e){let t=qe[e];if(t===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">");return Zc(t)}var E_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function hd(i){return i.replace(E_,T_)}function T_(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function ud(i){let e=`precision ${i.precision} float;
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
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var A_={[Qi]:"SHADOWMAP_TYPE_PCF",[Fs]:"SHADOWMAP_TYPE_VSM"};function R_(i){return A_[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var C_={[ks]:"ENVMAP_MODE_REFRACTION"};function P_(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":C_[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var I_={[go]:"ENVMAP_BLENDING_MULTIPLY",[Au]:"ENVMAP_BLENDING_MIX",[Ru]:"ENVMAP_BLENDING_ADD"};function L_(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":I_[i.combine]||"ENVMAP_BLENDING_NONE"}function D_(i,e,t,n){let s=i.getContext(),r=t.defines,a=t.vertexShader,o=t.fragmentShader,l=R_(t),c=t.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",h=P_(t),d=L_(t),f=v_(t),u=b_(r),p=s.createProgram(),x,g,m=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(x=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,u].filter(qr).join(`
`),x.length>0&&(x+=`
`),g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,u].filter(qr).join(`
`),g.length>0&&(g+=`
`)):(x=[ud(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,u,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+t.diffuseRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(qr).join(`
`),g=[ud(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,u,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",t.envMapPMREM?"#define ENVMAP_MAX_LOD "+t.envMapMaxLod+".0":"",t.envMapPMREM?"#define ENVMAP_SIZE "+t.envMapSize+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==jn?"#define TONE_MAPPING":"",t.toneMapping!==jn?qe.tonemapping_pars_fragment:"",t.toneMapping!==jn?x_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",qe.colorspace_pars_fragment,g_("linearToOutputTexel",t.outputColorSpace),y_(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(qr).join(`
`)),a=Zc(a),a=ld(a,t),a=cd(a,t),o=Zc(o),o=ld(o,t),o=cd(o,t),a=hd(a),o=hd(o),t.isRawShaderMaterial!==!0&&(m=`#version 300 es
`,x=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,g=["#define varying in",t.glslVersion===Rc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Rc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+g);let v=m+x+a,w=m+g+o,S=rd(s,s.VERTEX_SHADER,v),T=rd(s,s.FRAGMENT_SHADER,w);s.attachShader(p,S),s.attachShader(p,T),t.index0AttributeName!==void 0?s.bindAttribLocation(p,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(p,0,"position"),s.linkProgram(p);function E(P){if(i.debug.checkShaderErrors){let D=s.getProgramInfoLog(p)||"",O=s.getShaderInfoLog(S)||"",V=s.getShaderInfoLog(T)||"",I=D.trim(),X=O.trim(),q=V.trim(),H=!0,Q=!0;if(s.getProgramParameter(p,s.LINK_STATUS)===!1)if(H=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,p,S,T);else{let G=od(s,S,"vertex"),ne=od(s,T,"fragment");Be("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(p,s.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+I+`
`+G+`
`+ne)}else I!==""?Ie("WebGLProgram: Program Info Log:",I):(X===""||q==="")&&(Q=!1);Q&&(P.diagnostics={runnable:H,programLog:I,vertexShader:{log:X,prefix:x},fragmentShader:{log:q,prefix:g}})}s.deleteShader(S),s.deleteShader(T),_=new Gs(s,p),M=S_(s,p)}let _;this.getUniforms=function(){return _===void 0&&E(this),_};let M;this.getAttributes=function(){return M===void 0&&E(this),M};let N=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return N===!1&&(N=s.getProgramParameter(p,d_)),N},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(p),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=f_++,this.cacheKey=e,this.usedTimes=1,this.program=p,this.vertexShader=S,this.fragmentShader=T,this}var N_=0,jc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Jc(e),t.set(e,n)),n}},Jc=class{constructor(e){this.id=N_++,this.code=e,this.usedTimes=0}};function U_(i){return i===Oi||i===Vr||i===Wr}function O_(i,e,t,n,s,r){let a=new Is,o=new jc,l=new Set,c=[],h=new Map,d=n.logarithmicDepthBuffer,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function u(_){return l.add(_),_===0?"uv":`uv${_}`}function p(_,M,N,P,D,O){let V=P.fog,I=D.geometry,X=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?P.environment:null,q=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,H=e.get(_.envMap||X,q),Q=f[_.type],G=n.precision;_.precision!==null&&(G=n.getMaxPrecision(_.precision),G!==_.precision&&Ie("WebGLProgram.getParameters:",_.precision,"not supported, using",G,"instead."));let ne=I.morphAttributes.position||I.morphAttributes.normal||I.morphAttributes.color,ie=ne!==void 0?ne.length:0,Ae=0;I.morphAttributes.position!==void 0&&(Ae=1),I.morphAttributes.normal!==void 0&&(Ae=2),I.morphAttributes.color!==void 0&&(Ae=3);let He,j,ye,Me;if(Q){let _e=Kn[Q];He=_e.vertexShader,j=_e.fragmentShader}else{He=_.vertexShader,j=_.fragmentShader;let _e=o.getVertexShaderStage(_),at=o.getFragmentShaderStage(_);o.update(_,_e,at),ye=_e.id,Me=at.id}let Le=i.getRenderTarget(),ve=i.state.buffers.depth.getReversed(),Ve=D.isInstancedMesh===!0,vt=D.isBatchedMesh===!0,Oe=!!_.map,rt=!!_.matcap,lt=!!H,je=lt&&H.isPMREMTexture===!0,Ut=!!_.aoMap,Mt=!!_.lightMap,Qt=!!_.bumpMap&&_.wireframe===!1,_t=!!_.normalMap,Vn=!!_.displacementMap,Ct=!!_.emissiveMap,mn=!!_.metalnessMap,gn=!!_.roughnessMap,_n=_.anisotropy>0,U=_.clearcoat>0,xn=_.diffuseRoughness>0,pt=_.dispersion>0,mt=_.retroreflectivity>0,me=_.iridescence>0,wt=_.sheen>0,De=_.transmission>0,ze=_n&&!!_.anisotropyMap,A=U&&!!_.clearcoatMap,y=U&&!!_.clearcoatNormalMap,B=U&&!!_.clearcoatRoughnessMap,se=xn&&!!_.diffuseRoughnessMap,ee=me&&!!_.iridescenceMap,oe=me&&!!_.iridescenceThicknessMap,de=wt&&!!_.sheenColorMap,Y=wt&&!!_.sheenRoughnessMap,Z=!!_.specularMap,ce=!!_.specularColorMap,C=!!_.specularIntensityMap,J=De&&!!_.transmissionMap,$=De&&!!_.thicknessMap,he=!!_.gradientMap,ae=!!_.alphaMap,le=_.alphaTest>0,Ce=!!_.alphaHash,$e=!!_.extensions,re=jn;_.toneMapped&&(Le===null||Le.isXRRenderTarget===!0)&&(re=i.toneMapping);let Pe=je?H.isCompressedCubeTexture?H.image[0].mipmaps:H.mipmaps:null,Xe={shaderID:Q,shaderType:_.type,shaderName:_.name,vertexShader:He,fragmentShader:j,defines:_.defines,customVertexShaderID:ye,customFragmentShaderID:Me,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:G,batching:vt,batchingColor:vt&&D._colorsTexture!==null,instancing:Ve,instancingColor:Ve&&D.instanceColor!==null,instancingMorph:Ve&&D.morphTexture!==null,outputColorSpace:Le===null?i.outputColorSpace:Le.isXRRenderTarget===!0?Le.texture.colorSpace:Qe.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:Oe,matcap:rt,envMap:lt,envMapMode:lt&&H.mapping,envMapPMREM:je,envMapMaxLod:je?Pe.length-1:null,envMapSize:je?Pe[0].width:null,aoMap:Ut,lightMap:Mt,bumpMap:Qt,normalMap:_t,displacementMap:Vn,emissiveMap:Ct,normalMapObjectSpace:_t&&_.normalMapType===Iu,normalMapTangentSpace:_t&&_.normalMapType===Xr,packedNormalMap:_t&&_.normalMapType===Xr&&U_(_.normalMap.format),metalnessMap:mn,roughnessMap:gn,anisotropy:_n,anisotropyMap:ze,clearcoat:U,clearcoatMap:A,clearcoatNormalMap:y,clearcoatRoughnessMap:B,diffuseRoughness:xn,diffuseRoughnessMap:se,dispersion:pt,retroreflection:mt,iridescence:me,iridescenceMap:ee,iridescenceThicknessMap:oe,sheen:wt,sheenColorMap:de,sheenRoughnessMap:Y,specularMap:Z,specularColorMap:ce,specularIntensityMap:C,transmission:De,transmissionMap:J,thicknessMap:$,gradientMap:he,opaque:_.transparent===!1&&_.blending===Bs&&_.alphaToCoverage===!1,alphaMap:ae,alphaTest:le,alphaHash:Ce,combine:_.combine,mapUv:Oe&&u(_.map.channel),aoMapUv:Ut&&u(_.aoMap.channel),lightMapUv:Mt&&u(_.lightMap.channel),bumpMapUv:Qt&&u(_.bumpMap.channel),normalMapUv:_t&&u(_.normalMap.channel),displacementMapUv:Vn&&u(_.displacementMap.channel),emissiveMapUv:Ct&&u(_.emissiveMap.channel),metalnessMapUv:mn&&u(_.metalnessMap.channel),roughnessMapUv:gn&&u(_.roughnessMap.channel),anisotropyMapUv:ze&&u(_.anisotropyMap.channel),clearcoatMapUv:A&&u(_.clearcoatMap.channel),clearcoatNormalMapUv:y&&u(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:B&&u(_.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:se&&u(_.diffuseRoughnessMap.channel),iridescenceMapUv:ee&&u(_.iridescenceMap.channel),iridescenceThicknessMapUv:oe&&u(_.iridescenceThicknessMap.channel),sheenColorMapUv:de&&u(_.sheenColorMap.channel),sheenRoughnessMapUv:Y&&u(_.sheenRoughnessMap.channel),specularMapUv:Z&&u(_.specularMap.channel),specularColorMapUv:ce&&u(_.specularColorMap.channel),specularIntensityMapUv:C&&u(_.specularIntensityMap.channel),transmissionMapUv:J&&u(_.transmissionMap.channel),thicknessMapUv:$&&u(_.thicknessMap.channel),alphaMapUv:ae&&u(_.alphaMap.channel),vertexTangents:!!I.attributes.tangent&&(_t||_n),vertexNormals:!!I.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!I.attributes.color&&I.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!I.attributes.uv&&(Oe||ae),fog:!!V,useFog:_.fog===!0,fogExp2:!!V&&V.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||I.attributes.normal===void 0&&_t===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ve,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:I.attributes.position!==void 0,morphTargets:I.morphAttributes.position!==void 0,morphNormals:I.morphAttributes.normal!==void 0,morphColors:I.morphAttributes.color!==void 0,morphTargetsCount:ie,morphTextureStride:Ae,numSunLights:M.sun.length,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numSunLightShadows:M.sunShadowMap.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numLightProbeGrids:O.filter(_e=>_e.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&N.length>0,shadowMapType:i.shadowMap.type,toneMapping:re,decodeVideoTexture:Oe&&_.map.isVideoTexture===!0&&Qe.getTransfer(_.map.colorSpace)===st,decodeVideoTextureEmissive:Ct&&_.emissiveMap.isVideoTexture===!0&&Qe.getTransfer(_.emissiveMap.colorSpace)===st,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Nt,flipSided:_.side===kt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:$e&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:($e&&_.extensions.multiDraw===!0||vt)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Xe.vertexUv1s=l.has(1),Xe.vertexUv2s=l.has(2),Xe.vertexUv3s=l.has(3),l.clear(),Xe}function x(_){let M=[];if(_.shaderID?M.push(_.shaderID):(M.push(_.customVertexShaderID),M.push(_.customFragmentShaderID)),_.defines!==void 0)for(let N in _.defines)M.push(N),M.push(_.defines[N]);return _.isRawShaderMaterial===!1&&(g(M,_),m(M,_),M.push(i.outputColorSpace)),M.push(_.customProgramCacheKey),M.join()}function g(_,M){_.push(M.precision),_.push(M.outputColorSpace),_.push(M.envMapMode),_.push(M.envMapPMREM),_.push(M.envMapMaxLod),_.push(M.envMapSize),_.push(M.mapUv),_.push(M.alphaMapUv),_.push(M.lightMapUv),_.push(M.aoMapUv),_.push(M.bumpMapUv),_.push(M.normalMapUv),_.push(M.displacementMapUv),_.push(M.emissiveMapUv),_.push(M.metalnessMapUv),_.push(M.roughnessMapUv),_.push(M.anisotropyMapUv),_.push(M.clearcoatMapUv),_.push(M.clearcoatNormalMapUv),_.push(M.clearcoatRoughnessMapUv),_.push(M.diffuseRoughnessMapUv),_.push(M.iridescenceMapUv),_.push(M.iridescenceThicknessMapUv),_.push(M.sheenColorMapUv),_.push(M.sheenRoughnessMapUv),_.push(M.specularMapUv),_.push(M.specularColorMapUv),_.push(M.specularIntensityMapUv),_.push(M.transmissionMapUv),_.push(M.thicknessMapUv),_.push(M.combine),_.push(M.fogExp2),_.push(M.sizeAttenuation),_.push(M.morphTargetsCount),_.push(M.numSunLights),_.push(M.numDirLights),_.push(M.numPointLights),_.push(M.numSpotLights),_.push(M.numSpotLightMaps),_.push(M.numHemiLights),_.push(M.numRectAreaLights),_.push(M.numSunLightShadows),_.push(M.numDirLightShadows),_.push(M.numPointLightShadows),_.push(M.numSpotLightShadows),_.push(M.numSpotLightShadowsWithMaps),_.push(M.numLightProbes),_.push(M.numLightProbeGrids),_.push(M.shadowMapType),_.push(M.toneMapping),_.push(M.numClippingPlanes),_.push(M.numClipIntersection),_.push(M.depthPacking)}function m(_,M){a.disableAll(),M.instancing&&a.enable(0),M.instancingColor&&a.enable(1),M.instancingMorph&&a.enable(2),M.matcap&&a.enable(3),M.envMap&&a.enable(4),M.normalMapObjectSpace&&a.enable(5),M.normalMapTangentSpace&&a.enable(6),M.clearcoat&&a.enable(7),M.iridescence&&a.enable(8),M.alphaTest&&a.enable(9),M.vertexColors&&a.enable(10),M.vertexAlphas&&a.enable(11),M.vertexUv1s&&a.enable(12),M.vertexUv2s&&a.enable(13),M.vertexUv3s&&a.enable(14),M.vertexTangents&&a.enable(15),M.anisotropy&&a.enable(16),M.alphaHash&&a.enable(17),M.batching&&a.enable(18),M.dispersion&&a.enable(19),M.retroreflection&&a.enable(24),M.diffuseRoughness&&a.enable(25),M.batchingColor&&a.enable(20),M.gradientMap&&a.enable(21),M.packedNormalMap&&a.enable(22),M.vertexNormals&&a.enable(23),_.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reversedDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),M.numLightProbeGrids>0&&a.enable(22),M.hasPositionAttribute&&a.enable(23),_.push(a.mask)}function v(_){let M=f[_.type],N;if(M){let P=Kn[M];N=$u.clone(P.uniforms)}else N=_.uniforms;return N}function w(_,M){let N=h.get(M);return N!==void 0?++N.usedTimes:(N=new D_(i,M,_,s),c.push(N),h.set(M,N)),N}function S(_){if(--_.usedTimes===0){let M=c.indexOf(_);c[M]=c[c.length-1],c.pop(),h.delete(_.cacheKey),_.destroy()}}function T(_){o.remove(_)}function E(){o.dispose()}return{getParameters:p,getProgramCacheKey:x,getUniforms:v,acquireProgram:w,releaseProgram:S,releaseShaderCache:T,programs:c,dispose:E}}function F_(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function B_(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function dd(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function fd(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(f){let u=0;return f.isInstancedMesh&&(u+=2),f.isSkinnedMesh&&(u+=1),u}function o(f,u,p,x,g,m){let v=i[e];return v===void 0?(v={id:f.id,object:f,geometry:u,material:p,materialVariant:a(f),groupOrder:x,renderOrder:f.renderOrder,z:g,group:m},i[e]=v):(v.id=f.id,v.object=f,v.geometry=u,v.material=p,v.materialVariant=a(f),v.groupOrder=x,v.renderOrder=f.renderOrder,v.z=g,v.group=m),e++,v}function l(f,u,p,x,g,m,v){v.reversedDepth===!0&&(g=-g);let w=o(f,u,p,x,g,m);p.transmission>0?n.push(w):p.transparent===!0?s.push(w):t.push(w)}function c(f,u,p,x,g,m){let v=o(f,u,p,x,g,m);p.transmission>0?n.unshift(v):p.transparent===!0?s.unshift(v):t.unshift(v)}function h(f,u){t.length>1&&t.sort(f||B_),n.length>1&&n.sort(u||dd),s.length>1&&s.sort(u||dd)}function d(){for(let f=e,u=i.length;f<u;f++){let p=i[f];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:d,sort:h}}function k_(){let i=new WeakMap;function e(n,s){let r=i.get(n),a;return r===void 0?(a=new fd,i.set(n,[a])):s>=r.length?(a=new fd,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function z_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new R,color:new Ue};break;case"SpotLight":t={position:new R,direction:new R,color:new Ue,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new R,color:new Ue,distance:0,decay:0};break;case"HemisphereLight":t={direction:new R,skyColor:new Ue,groundColor:new Ue};break;case"RectAreaLight":t={color:new Ue,position:new R,halfWidth:new R,halfHeight:new R};break}return i[e.id]=t,t}}}function H_(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ge};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ge};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ge,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var G_=0;function V_(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function W_(i){let e=new z_,t=H_(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new R);let s=new R,r=new Ze,a=new Ze;function o(c){let h=0,d=0,f=0;for(let O=0;O<9;O++)n.probe[O].set(0,0,0);let u=0,p=0,x=0,g=0,m=0,v=0,w=0,S=0,T=0,E=0,_=0,M=0,N=0,P=0;c.sort(V_);for(let O=0,V=c.length;O<V;O++){let I=c[O],X=I.color,q=I.intensity,H=I.distance,Q=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===Oi?Q=I.shadow.map.texture:Q=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)h+=X.r*q,d+=X.g*q,f+=X.b*q;else if(I.isLightProbe){for(let G=0;G<9;G++)n.probe[G].addScaledVector(I.sh.coefficients[G],q);P++}else if(I.isSunLight){let G=e.get(I);if(G.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let ne=I.shadow,ie=t.get(I);ie.shadowIntensity=ne.intensity,ie.shadowBias=ne.bias,ie.shadowNormalBias=ne.normalBias,ie.shadowRadius=ne.radius,ie.shadowMapSize.copy(ne.mapSize).multiply(ne.getFrameExtents()),n.sunShadow[p]=ie,n.sunShadowMap[p]=Q;let Ae=ne.getViewportCount();for(let He=0;He<Ae;He++)n.sunShadowMatrix[x+He]=ne.getMatrix(He),n.sunShadowCascade[x+He]=ne._cascadeData[He];x+=Ae,p++}n.sun[u]=G,u++}else if(I.isDirectionalLight){let G=e.get(I);if(G.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let ne=I.shadow,ie=t.get(I);ie.shadowIntensity=ne.intensity,ie.shadowBias=ne.bias,ie.shadowNormalBias=ne.normalBias,ie.shadowRadius=ne.radius,ie.shadowMapSize=ne.mapSize,n.directionalShadow[g]=ie,n.directionalShadowMap[g]=Q,n.directionalShadowMatrix[g]=I.shadow.matrix,T++}n.directional[g]=G,g++}else if(I.isSpotLight){let G=e.get(I);G.position.setFromMatrixPosition(I.matrixWorld),G.color.copy(X).multiplyScalar(q),G.distance=H,G.coneCos=Math.cos(I.angle),G.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),G.decay=I.decay,n.spot[v]=G;let ne=I.shadow;if(I.map&&(n.spotLightMap[M]=I.map,M++,ne.updateMatrices(I),I.castShadow&&N++),n.spotLightMatrix[v]=ne.matrix,I.castShadow){let ie=t.get(I);ie.shadowIntensity=ne.intensity,ie.shadowBias=ne.bias,ie.shadowNormalBias=ne.normalBias,ie.shadowRadius=ne.radius,ie.shadowMapSize=ne.mapSize,n.spotShadow[v]=ie,n.spotShadowMap[v]=Q,_++}v++}else if(I.isRectAreaLight){let G=e.get(I);G.color.copy(X).multiplyScalar(q),G.halfWidth.set(I.width*.5,0,0),G.halfHeight.set(0,I.height*.5,0),n.rectArea[w]=G,w++}else if(I.isPointLight){let G=e.get(I);if(G.color.copy(I.color).multiplyScalar(I.intensity),G.distance=I.distance,G.decay=I.decay,I.castShadow){let ne=I.shadow,ie=t.get(I);ie.shadowIntensity=ne.intensity,ie.shadowBias=ne.bias,ie.shadowNormalBias=ne.normalBias,ie.shadowRadius=ne.radius,ie.shadowMapSize=ne.mapSize,ie.shadowCameraNear=ne.camera.near,ie.shadowCameraFar=ne.camera.far,n.pointShadow[m]=ie,n.pointShadowMap[m]=Q,n.pointShadowMatrix[m]=I.shadow.matrix,E++}n.point[m]=G,m++}else if(I.isHemisphereLight){let G=e.get(I);G.skyColor.copy(I.color).multiplyScalar(q),G.groundColor.copy(I.groundColor).multiplyScalar(q),n.hemi[S]=G,S++}}w>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=xe.LTC_FLOAT_1,n.rectAreaLTC2=xe.LTC_FLOAT_2):(n.rectAreaLTC1=xe.LTC_HALF_1,n.rectAreaLTC2=xe.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=f;let D=n.hash;(D.sunLength!==u||D.directionalLength!==g||D.pointLength!==m||D.spotLength!==v||D.rectAreaLength!==w||D.hemiLength!==S||D.numSunShadows!==p||D.numDirectionalShadows!==T||D.numPointShadows!==E||D.numSpotShadows!==_||D.numSpotMaps!==M||D.numLightProbes!==P)&&(n.sun.length=u,n.directional.length=g,n.spot.length=v,n.rectArea.length=w,n.point.length=m,n.hemi.length=S,n.sunShadow.length=p,n.sunShadowMap.length=p,n.sunShadowMatrix.length=x,n.sunShadowCascade.length=x,n.directionalShadow.length=T,n.directionalShadowMap.length=T,n.directionalShadowMatrix.length=T,n.pointShadow.length=E,n.pointShadowMap.length=E,n.pointShadowMatrix.length=E,n.spotShadow.length=_,n.spotShadowMap.length=_,n.spotLightMatrix.length=_+M-N,n.spotLightMap.length=M,n.numSpotLightShadowsWithMaps=N,n.numLightProbes=P,D.sunLength=u,D.directionalLength=g,D.pointLength=m,D.spotLength=v,D.rectAreaLength=w,D.hemiLength=S,D.numSunShadows=p,D.numDirectionalShadows=T,D.numPointShadows=E,D.numSpotShadows=_,D.numSpotMaps=M,D.numLightProbes=P,n.version=G_++)}function l(c,h){let d=0,f=0,u=0,p=0,x=0,g=0,m=h.matrixWorldInverse;for(let v=0,w=c.length;v<w;v++){let S=c[v];if(S.isSunLight){let T=n.sun[d];T.direction.setFromMatrixPosition(S.matrixWorld),T.direction.transformDirection(m),d++}else if(S.isDirectionalLight){let T=n.directional[f];T.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(m),f++}else if(S.isSpotLight){let T=n.spot[p];T.position.setFromMatrixPosition(S.matrixWorld),T.position.applyMatrix4(m),T.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(m),p++}else if(S.isRectAreaLight){let T=n.rectArea[x];T.position.setFromMatrixPosition(S.matrixWorld),T.position.applyMatrix4(m),a.identity(),r.copy(S.matrixWorld),r.premultiply(m),a.extractRotation(r),T.halfWidth.set(S.width*.5,0,0),T.halfHeight.set(0,S.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),x++}else if(S.isPointLight){let T=n.point[u];T.position.setFromMatrixPosition(S.matrixWorld),T.position.applyMatrix4(m),u++}else if(S.isHemisphereLight){let T=n.hemi[g];T.direction.setFromMatrixPosition(S.matrixWorld),T.direction.transformDirection(m),g++}}}return{setup:o,setupView:l,state:n}}function pd(i){let e=new W_(i),t=[],n=[],s=[];function r(d){h.camera=d,t.length=0,n.length=0,s.length=0}function a(d){d.isLightProbeGrid?s.push(d):t.push(d)}function o(d){n.push(d)}function l(){e.setup(t),s.sort((d,f)=>d.priority-f.priority||d.id-f.id)}function c(d){e.setupView(t,d)}let h={lightsArray:t,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:h,setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function X_(i){let e=new WeakMap;function t(s,r=0){let a=e.get(s),o;return a===void 0?(o=new pd(i),e.set(s,[o])):r>=a.length?(o=new pd(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}var $_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,q_=`uniform sampler2D shadow_pass;
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
}`,Y_=[new R(1,0,0),new R(-1,0,0),new R(0,1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1)],Z_=[new R(0,-1,0),new R(0,-1,0),new R(0,0,1),new R(0,0,-1),new R(0,-1,0),new R(0,-1,0)],md=new Ze,$r=new R,Xc=new R;function j_(i,e,t){let n=new Ai,s=new ge,r=new ge,a=new gt,o=new to,l=new no,c={},h=t.maxTextureSize,d={[Ui]:kt,[kt]:Ui,[Nt]:Nt},f=new wn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ge},radius:{value:4}},vertexShader:$_,fragmentShader:q_}),u=f.clone();u.defines.HORIZONTAL_PASS=1;let p=new Xt;p.setAttribute("position",new Sn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new ut(p,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Qi;let m=this.type;this.render=function(E,_,M){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||E.length===0)return;this.type===lu&&(Ie("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Qi);let N=i.getRenderTarget(),P=i.getActiveCubeFace(),D=i.getActiveMipmapLevel(),O=i.state;O.setBlending(es),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);let V=m!==this.type;V&&_.traverse(function(I){I.material&&(Array.isArray(I.material)?I.material.forEach(X=>X.needsUpdate=!0):I.material.needsUpdate=!0)});for(let I=0,X=E.length;I<X;I++){let q=E[I],H=q.shadow;if(H===void 0){Ie("WebGLShadowMap:",q,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;s.copy(H.mapSize);let Q=H.getFrameExtents();s.multiply(Q),r.copy(H.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/Q.x),s.x=r.x*Q.x,H.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/Q.y),s.y=r.y*Q.y,H.mapSize.y=r.y));let G=i.state.buffers.depth.getReversed();if(H.camera._reversedDepth=G,H.map===null||V===!0){if(H.map!==null&&(H.map.depthTexture!==null&&(H.map.depthTexture.dispose(),H.map.depthTexture=null),H.map.dispose()),this.type===Fs){if(q.isPointLight){Ie("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}H.map=new cn(s.x,s.y,{format:Oi,type:Bn,minFilter:Zt,magFilter:Zt,generateMipmaps:!1}),H.map.texture.name=q.name+".shadowMap",H.map.depthTexture=new li(s.x,s.y,En),H.map.depthTexture.name=q.name+".shadowMapDepth",H.map.depthTexture.format=ai,H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=Dt,H.map.depthTexture.magFilter=Dt}else q.isPointLight?(H.map=new Yr(s.x),H.map.depthTexture=new br(s.x,Fn)):(H.map=new cn(s.x,s.y),H.map.depthTexture=new li(s.x,s.y,Fn)),H.map.depthTexture.name=q.name+".shadowMap",H.map.depthTexture.format=ai,this.type===Qi?(H.map.depthTexture.compareFunction=G?Tc:Ec,H.map.depthTexture.minFilter=Zt,H.map.depthTexture.magFilter=Zt):(H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=Dt,H.map.depthTexture.magFilter=Dt);H.camera.updateProjectionMatrix()}H.map.isWebGLCubeRenderTarget!==!0&&(H.map.width!==s.x||H.map.height!==s.y)&&H.map.setSize(s.x,s.y);let ne=H.map.isWebGLCubeRenderTarget?6:H.getViewportCount();q.isPointLight!==!0&&H.updateMatrices(q,M);let ie=(H.camera.layers.mask&4294967294)!==0?H.camera.layers:M.layers;for(let Ae=0;Ae<ne;Ae++){let He=H.getCamera(Ae);if(q.isPointLight){let j=H.camera,ye=H.matrix,Me=q.distance||j.far;Me!==j.far&&(j.far=Me,j.updateProjectionMatrix()),$r.setFromMatrixPosition(q.matrixWorld),j.position.copy($r),Xc.copy(j.position),Xc.add(Y_[Ae]),j.up.copy(Z_[Ae]),j.lookAt(Xc),j.updateMatrixWorld(),ye.makeTranslation(-$r.x,-$r.y,-$r.z),md.multiplyMatrices(j.projectionMatrix,j.matrixWorldInverse),H._frustum.setFromProjectionMatrix(md,j.coordinateSystem,j.reversedDepth)}if(H.map.isWebGLCubeRenderTarget)i.setRenderTarget(H.map,Ae),i.clear();else{Ae===0&&(i.setRenderTarget(H.map),i.clear());let j=H.getViewport(Ae);a.set(r.x*j.x,r.y*j.y,r.x*j.z,r.y*j.w),O.viewport(a)}n=H.getFrustum(Ae),S(_,M,He,q,ie,this.type)}H.isPointLightShadow!==!0&&this.type===Fs&&v(H,M),H.needsUpdate=!1}m=this.type,g.needsUpdate=!1,i.setRenderTarget(N,P,D)};function v(E,_){let M=e.update(x);f.defines.VSM_SAMPLES!==E.blurSamples&&(f.defines.VSM_SAMPLES=E.blurSamples,u.defines.VSM_SAMPLES=E.blurSamples,f.needsUpdate=!0,u.needsUpdate=!0),E.mapPass===null?E.mapPass=new cn(s.x,s.y,{format:Oi,type:Bn}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),f.uniforms.shadow_pass.value=E.map.depthTexture,f.uniforms.resolution.value.set(E.map.width,E.map.height),f.uniforms.radius.value=E.radius,i.setRenderTarget(E.mapPass),i.clear(),i.renderBufferDirect(_,null,M,f,x,null),u.uniforms.shadow_pass.value=E.mapPass.texture,u.uniforms.resolution.value.set(E.map.width,E.map.height),u.uniforms.radius.value=E.radius,i.setRenderTarget(E.map),i.clear(),i.renderBufferDirect(_,null,M,u,x,null)}function w(E,_,M,N){let P=null,D=M.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(D!==void 0)P=D;else if(P=M.isPointLight===!0?l:o,i.localClippingEnabled&&_.clipShadows===!0&&Array.isArray(_.clippingPlanes)&&_.clippingPlanes.length!==0||_.displacementMap&&_.displacementScale!==0||_.alphaMap&&_.alphaTest>0||_.map&&_.alphaTest>0||_.alphaToCoverage===!0){let O=P.uuid,V=_.uuid,I=c[O];I===void 0&&(I={},c[O]=I);let X=I[V];X===void 0&&(X=P.clone(),I[V]=X,_.addEventListener("dispose",T)),P=X}if(P.visible=_.visible,P.wireframe=_.wireframe,N===Fs?P.side=_.shadowSide!==null?_.shadowSide:_.side:P.side=_.shadowSide!==null?_.shadowSide:d[_.side],P.alphaMap=_.alphaMap,P.alphaTest=_.alphaToCoverage===!0?.5:_.alphaTest,P.map=_.map,P.clipShadows=_.clipShadows,P.clippingPlanes=_.clippingPlanes,P.clipIntersection=_.clipIntersection,P.displacementMap=_.displacementMap,P.displacementScale=_.displacementScale,P.displacementBias=_.displacementBias,P.wireframeLinewidth=_.wireframeLinewidth,P.linewidth=_.linewidth,M.isPointLight===!0&&P.isMeshDistanceMaterial===!0){let O=i.properties.get(P);O.light=M}return P}function S(E,_,M,N,P,D){if(E.visible===!1)return;if(E.layers.test(P)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&D===Fs)&&(!E.frustumCulled||E.intersectsFrustum(n))){E.modelViewMatrix.multiplyMatrices(M.matrixWorldInverse,E.matrixWorld);let I=e.update(E),X=E.material;if(Array.isArray(X)){let q=I.groups;for(let H=0,Q=q.length;H<Q;H++){let G=q[H],ne=X[G.materialIndex];if(ne&&ne.visible){let ie=w(E,ne,N,D);E.onBeforeShadow(i,E,_,M,I,ie,G),i.renderBufferDirect(M,null,I,ie,E,G),E.onAfterShadow(i,E,_,M,I,ie,G)}}}else if(X.visible){let q=w(E,X,N,D);E.onBeforeShadow(i,E,_,M,I,q,null),i.renderBufferDirect(M,null,I,q,E,null),E.onAfterShadow(i,E,_,M,I,q,null)}}let V=E.children;for(let I=0,X=V.length;I<X;I++)S(V[I],_,M,N,P,D)}function T(E){E.target.removeEventListener("dispose",T);for(let M in c){let N=c[M],P=E.target.uuid;P in N&&(N[P].dispose(),delete N[P])}}}function J_(i,e){function t(){let C=!1,J=new gt,$=null,he=new gt(0,0,0,0);return{setMask:function(ae){$!==ae&&!C&&(i.colorMask(ae,ae,ae,ae),$=ae)},setLocked:function(ae){C=ae},setClear:function(ae,le,Ce,$e,re){re===!0&&(ae*=$e,le*=$e,Ce*=$e),J.set(ae,le,Ce,$e),he.equals(J)===!1&&(i.clearColor(ae,le,Ce,$e),he.copy(J))},reset:function(){C=!1,$=null,he.set(-1,0,0,0)}}}function n(){let C=!1,J=!1,$=null,he=null,ae=null;return{setReversed:function(le){if(J!==le){let Ce=e.get("EXT_clip_control");le?Ce.clipControlEXT(Ce.LOWER_LEFT_EXT,Ce.ZERO_TO_ONE_EXT):Ce.clipControlEXT(Ce.LOWER_LEFT_EXT,Ce.NEGATIVE_ONE_TO_ONE_EXT),J=le;let $e=ae;ae=null,this.setClear($e)}},getReversed:function(){return J},setTest:function(le){le?ve(i.DEPTH_TEST):Ve(i.DEPTH_TEST)},setMask:function(le){$!==le&&!C&&(i.depthMask(le),$=le)},setFunc:function(le){if(J&&(le=Gu[le]),he!==le){switch(le){case La:i.depthFunc(i.NEVER);break;case Da:i.depthFunc(i.ALWAYS);break;case Na:i.depthFunc(i.LESS);break;case As:i.depthFunc(i.LEQUAL);break;case Ua:i.depthFunc(i.EQUAL);break;case Oa:i.depthFunc(i.GEQUAL);break;case Fa:i.depthFunc(i.GREATER);break;case Ba:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}he=le}},setLocked:function(le){C=le},setClear:function(le){ae!==le&&(ae=le,J&&(le=1-le),i.clearDepth(le))},reset:function(){C=!1,$=null,he=null,ae=null,J=!1}}}function s(){let C=!1,J=null,$=null,he=null,ae=null,le=null,Ce=null,$e=null,re=null;return{setTest:function(Pe){C||(Pe?ve(i.STENCIL_TEST):Ve(i.STENCIL_TEST))},setMask:function(Pe){J!==Pe&&!C&&(i.stencilMask(Pe),J=Pe)},setFunc:function(Pe,Xe,_e){($!==Pe||he!==Xe||ae!==_e)&&(i.stencilFunc(Pe,Xe,_e),$=Pe,he=Xe,ae=_e)},setOp:function(Pe,Xe,_e){(le!==Pe||Ce!==Xe||$e!==_e)&&(i.stencilOp(Pe,Xe,_e),le=Pe,Ce=Xe,$e=_e)},setLocked:function(Pe){C=Pe},setClear:function(Pe){re!==Pe&&(i.clearStencil(Pe),re=Pe)},reset:function(){C=!1,J=null,$=null,he=null,ae=null,le=null,Ce=null,$e=null,re=null}}}let r=new t,a=new n,o=new s,l={},c=new WeakMap,h={},d={},f={},u=new WeakMap,p=[],x=null,g=!1,m=null,v=null,w=null,S=null,T=null,E=null,_=null,M=new Ue(0,0,0),N=0,P=!1,D=null,O=null,V=null,I=null,X=null,q=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),H=!1,Q=0,G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec(G)[1]),H=Q>=1):G.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),H=Q>=2);let ne=null,ie={},Ae=i.getParameter(i.SCISSOR_BOX),He=i.getParameter(i.VIEWPORT),j=new gt().fromArray(Ae),ye=new gt().fromArray(He);function Me(C,J,$,he){let ae=new Uint8Array(4),le=i.createTexture();i.bindTexture(C,le),i.texParameteri(C,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(C,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ce=0;Ce<$;Ce++)C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY?i.texImage3D(J,0,i.RGBA,1,1,he,0,i.RGBA,i.UNSIGNED_BYTE,ae):i.texImage2D(J+Ce,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ae);return le}let Le={};Le[i.TEXTURE_2D]=Me(i.TEXTURE_2D,i.TEXTURE_2D,1),Le[i.TEXTURE_CUBE_MAP]=Me(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Le[i.TEXTURE_2D_ARRAY]=Me(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Le[i.TEXTURE_3D]=Me(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ve(i.DEPTH_TEST),a.setFunc(As),Qt(!1),_t(oc),ve(i.CULL_FACE),Ut(es);function ve(C){h[C]!==!0&&(i.enable(C),h[C]=!0)}function Ve(C){h[C]!==!1&&(i.disable(C),h[C]=!1)}function vt(C,J){return f[C]!==J?(i.bindFramebuffer(C,J),f[C]=J,C===i.DRAW_FRAMEBUFFER&&(f[i.FRAMEBUFFER]=J),C===i.FRAMEBUFFER&&(f[i.DRAW_FRAMEBUFFER]=J),!0):!1}function Oe(C,J){let $=p,he=!1;if(C){$=u.get(J),$===void 0&&($=[],u.set(J,$));let ae=C.textures;if($.length!==ae.length||$[0]!==i.COLOR_ATTACHMENT0){for(let le=0,Ce=ae.length;le<Ce;le++)$[le]=i.COLOR_ATTACHMENT0+le;$.length=ae.length,he=!0}}else $[0]!==i.BACK&&($[0]=i.BACK,he=!0);he&&i.drawBuffers($)}function rt(C){return x!==C?(i.useProgram(C),x=C,!0):!1}let lt={[ns]:i.FUNC_ADD,[hu]:i.FUNC_SUBTRACT,[uu]:i.FUNC_REVERSE_SUBTRACT};lt[du]=i.MIN,lt[fu]=i.MAX;let je={[pu]:i.ZERO,[mu]:i.ONE,[gu]:i.SRC_COLOR,[hc]:i.SRC_ALPHA,[Su]:i.SRC_ALPHA_SATURATE,[vu]:i.DST_COLOR,[xu]:i.DST_ALPHA,[_u]:i.ONE_MINUS_SRC_COLOR,[uc]:i.ONE_MINUS_SRC_ALPHA,[bu]:i.ONE_MINUS_DST_COLOR,[yu]:i.ONE_MINUS_DST_ALPHA,[Mu]:i.CONSTANT_COLOR,[wu]:i.ONE_MINUS_CONSTANT_COLOR,[Eu]:i.CONSTANT_ALPHA,[Tu]:i.ONE_MINUS_CONSTANT_ALPHA};function Ut(C,J,$,he,ae,le,Ce,$e,re,Pe){if(C===es){g===!0&&(Ve(i.BLEND),g=!1);return}if(g===!1&&(ve(i.BLEND),g=!0),C!==cu){if(C!==m||Pe!==P){if((v!==ns||T!==ns)&&(i.blendEquation(i.FUNC_ADD),v=ns,T=ns),Pe)switch(C){case Bs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ts:i.blendFunc(i.ONE,i.ONE);break;case lc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case cc:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Be("WebGLState: Invalid blending: ",C);break}else switch(C){case Bs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ts:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case lc:Be("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case cc:Be("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Be("WebGLState: Invalid blending: ",C);break}w=null,S=null,E=null,_=null,M.set(0,0,0),N=0,m=C,P=Pe}return}ae=ae||J,le=le||$,Ce=Ce||he,(J!==v||ae!==T)&&(i.blendEquationSeparate(lt[J],lt[ae]),v=J,T=ae),($!==w||he!==S||le!==E||Ce!==_)&&(i.blendFuncSeparate(je[$],je[he],je[le],je[Ce]),w=$,S=he,E=le,_=Ce),($e.equals(M)===!1||re!==N)&&(i.blendColor($e.r,$e.g,$e.b,re),M.copy($e),N=re),m=C,P=!1}function Mt(C,J){C.side===Nt?Ve(i.CULL_FACE):ve(i.CULL_FACE);let $=C.side===kt;J&&($=!$),Qt($),C.blending===Bs&&C.transparent===!1?Ut(es):Ut(C.blending,C.blendEquation,C.blendSrc,C.blendDst,C.blendEquationAlpha,C.blendSrcAlpha,C.blendDstAlpha,C.blendColor,C.blendAlpha,C.premultipliedAlpha),a.setFunc(C.depthFunc),a.setTest(C.depthTest),a.setMask(C.depthWrite),r.setMask(C.colorWrite);let he=C.stencilWrite;o.setTest(he),he&&(o.setMask(C.stencilWriteMask),o.setFunc(C.stencilFunc,C.stencilRef,C.stencilFuncMask),o.setOp(C.stencilFail,C.stencilZFail,C.stencilZPass)),Ct(C.polygonOffset,C.polygonOffsetFactor,C.polygonOffsetUnits),C.alphaToCoverage===!0?ve(i.SAMPLE_ALPHA_TO_COVERAGE):Ve(i.SAMPLE_ALPHA_TO_COVERAGE)}function Qt(C){D!==C&&(C?i.frontFace(i.CW):i.frontFace(i.CCW),D=C)}function _t(C){C!==au?(ve(i.CULL_FACE),C!==O&&(C===oc?i.cullFace(i.BACK):C===ou?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Ve(i.CULL_FACE),O=C}function Vn(C){C!==V&&(H&&i.lineWidth(C),V=C)}function Ct(C,J,$){C?(ve(i.POLYGON_OFFSET_FILL),(I!==J||X!==$)&&(I=J,X=$,a.getReversed()&&(J=-J,$=-$),i.polygonOffset(J,$))):Ve(i.POLYGON_OFFSET_FILL)}function mn(C){C?ve(i.SCISSOR_TEST):Ve(i.SCISSOR_TEST)}function gn(C){C===void 0&&(C=i.TEXTURE0+q-1),ne!==C&&(i.activeTexture(C),ne=C)}function _n(C,J,$){$===void 0&&(ne===null?$=i.TEXTURE0+q-1:$=ne);let he=ie[$];he===void 0&&(he={type:void 0,texture:void 0},ie[$]=he),(he.type!==C||he.texture!==J)&&(ne!==$&&(i.activeTexture($),ne=$),i.bindTexture(C,J||Le[C]),he.type=C,he.texture=J)}function U(){let C=ie[ne];C!==void 0&&C.type!==void 0&&(i.bindTexture(C.type,null),C.type=void 0,C.texture=void 0)}function xn(){try{i.compressedTexImage2D(...arguments)}catch(C){Be("WebGLState:",C)}}function pt(){try{i.compressedTexImage3D(...arguments)}catch(C){Be("WebGLState:",C)}}function mt(){try{i.texSubImage2D(...arguments)}catch(C){Be("WebGLState:",C)}}function me(){try{i.texSubImage3D(...arguments)}catch(C){Be("WebGLState:",C)}}function wt(){try{i.compressedTexSubImage2D(...arguments)}catch(C){Be("WebGLState:",C)}}function De(){try{i.compressedTexSubImage3D(...arguments)}catch(C){Be("WebGLState:",C)}}function ze(){try{i.texStorage2D(...arguments)}catch(C){Be("WebGLState:",C)}}function A(){try{i.texStorage3D(...arguments)}catch(C){Be("WebGLState:",C)}}function y(){try{i.texImage2D(...arguments)}catch(C){Be("WebGLState:",C)}}function B(){try{i.texImage3D(...arguments)}catch(C){Be("WebGLState:",C)}}function se(C){return d[C]!==void 0?d[C]:i.getParameter(C)}function ee(C,J){d[C]!==J&&(i.pixelStorei(C,J),d[C]=J)}function oe(C){j.equals(C)===!1&&(i.scissor(C.x,C.y,C.z,C.w),j.copy(C))}function de(C){ye.equals(C)===!1&&(i.viewport(C.x,C.y,C.z,C.w),ye.copy(C))}function Y(C,J){let $=c.get(J);$===void 0&&($=new WeakMap,c.set(J,$));let he=$.get(C);he===void 0&&(he=i.getUniformBlockIndex(J,C.name),i.uniformBlockBinding(J,he,he),$.set(C,he))}function Z(C,J,$){let ae=c.get(J).get(C);l[ae]!==$&&(i.bindBufferBase(i.UNIFORM_BUFFER,ae,$),l[ae]=$)}function ce(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},d={},ne=null,ie={},f={},l={},u=new WeakMap,p=[],x=null,g=!1,m=null,v=null,w=null,S=null,T=null,E=null,_=null,M=new Ue(0,0,0),N=0,P=!1,D=null,O=null,V=null,I=null,X=null,j.set(0,0,i.canvas.width,i.canvas.height),ye.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:ve,disable:Ve,bindFramebuffer:vt,drawBuffers:Oe,useProgram:rt,setBlending:Ut,setMaterial:Mt,setFlipSided:Qt,setCullFace:_t,setLineWidth:Vn,setPolygonOffset:Ct,setScissorTest:mn,activeTexture:gn,bindTexture:_n,unbindTexture:U,compressedTexImage2D:xn,compressedTexImage3D:pt,texImage2D:y,texImage3D:B,pixelStorei:ee,getParameter:se,updateUBOMapping:Y,uniformBlockBinding:Z,texStorage2D:ze,texStorage3D:A,texSubImage2D:mt,texSubImage3D:me,compressedTexSubImage2D:wt,compressedTexSubImage3D:De,scissor:oe,viewport:de,reset:ce}}function K_(i,e,t,n,s,r,a){let o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ge,h=new WeakMap,d=new Set,f,u=new WeakMap,p=new Set,x=new FinalizationRegistry(A=>p.delete(A)),g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(A,y){return g?new OffscreenCanvas(A,y):dr("canvas")}function v(A,y,B){let se=1,ee=ze(A);if((ee.width>B||ee.height>B)&&(se=B/Math.max(ee.width,ee.height)),se<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let oe=Math.floor(se*ee.width),de=Math.floor(se*ee.height);f===void 0&&(f=m(oe,de));let Y=y?m(oe,de):f;return Y.width=oe,Y.height=de,Y.getContext("2d").drawImage(A,0,0,oe,de),Ie("WebGLRenderer: Texture has been resized from ("+ee.width+"x"+ee.height+") to ("+oe+"x"+de+")."),Y}else return"data"in A&&Ie("WebGLRenderer: Image in DataTexture is too big ("+ee.width+"x"+ee.height+")."),A;return A}function w(A){return A.generateMipmaps}function S(A){i.generateMipmap(A)}function T(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function E(A,y,B,se,ee,oe=!1){if(A!==null){if(i[A]!==void 0)return i[A];Ie("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let de;se&&(de=e.get("EXT_texture_norm16"),de||Ie("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Y=y;if(y===i.RED&&(B===i.FLOAT&&(Y=i.R32F),B===i.HALF_FLOAT&&(Y=i.R16F),B===i.UNSIGNED_BYTE&&(Y=i.R8),B===i.UNSIGNED_SHORT&&de&&(Y=de.R16_EXT),B===i.SHORT&&de&&(Y=de.R16_SNORM_EXT)),y===i.RED_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.R8UI),B===i.UNSIGNED_SHORT&&(Y=i.R16UI),B===i.UNSIGNED_INT&&(Y=i.R32UI),B===i.BYTE&&(Y=i.R8I),B===i.SHORT&&(Y=i.R16I),B===i.INT&&(Y=i.R32I)),y===i.RG&&(B===i.FLOAT&&(Y=i.RG32F),B===i.HALF_FLOAT&&(Y=i.RG16F),B===i.UNSIGNED_BYTE&&(Y=i.RG8),B===i.UNSIGNED_SHORT&&de&&(Y=de.RG16_EXT),B===i.SHORT&&de&&(Y=de.RG16_SNORM_EXT)),y===i.RG_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RG8UI),B===i.UNSIGNED_SHORT&&(Y=i.RG16UI),B===i.UNSIGNED_INT&&(Y=i.RG32UI),B===i.BYTE&&(Y=i.RG8I),B===i.SHORT&&(Y=i.RG16I),B===i.INT&&(Y=i.RG32I)),y===i.RGB_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),B===i.UNSIGNED_INT&&(Y=i.RGB32UI),B===i.BYTE&&(Y=i.RGB8I),B===i.SHORT&&(Y=i.RGB16I),B===i.INT&&(Y=i.RGB32I)),y===i.RGBA_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),B===i.UNSIGNED_INT&&(Y=i.RGBA32UI),B===i.BYTE&&(Y=i.RGBA8I),B===i.SHORT&&(Y=i.RGBA16I),B===i.INT&&(Y=i.RGBA32I)),y===i.RGB&&(B===i.UNSIGNED_SHORT&&de&&(Y=de.RGB16_EXT),B===i.SHORT&&de&&(Y=de.RGB16_SNORM_EXT),B===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),B===i.UNSIGNED_INT_10F_11F_11F_REV&&(Y=i.R11F_G11F_B10F)),y===i.RGBA){let Z=oe?ur:Qe.getTransfer(ee);B===i.FLOAT&&(Y=i.RGBA32F),B===i.HALF_FLOAT&&(Y=i.RGBA16F),B===i.UNSIGNED_BYTE&&(Y=Z===st?i.SRGB8_ALPHA8:i.RGBA8),B===i.UNSIGNED_SHORT&&de&&(Y=de.RGBA16_EXT),B===i.SHORT&&de&&(Y=de.RGBA16_SNORM_EXT),B===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),B===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function _(A,y){let B;return A?y===null||y===Fn||y===ss?B=i.DEPTH24_STENCIL8:y===En?B=i.DEPTH32F_STENCIL8:y===zs&&(B=i.DEPTH24_STENCIL8,Ie("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Fn||y===ss?B=i.DEPTH_COMPONENT24:y===En?B=i.DEPTH_COMPONENT32F:y===zs&&(B=i.DEPTH_COMPONENT16),B}function M(A,y){return w(A)===!0||A.isFramebufferTexture&&A.minFilter!==Dt&&A.minFilter!==Zt?Math.log2(Math.max(y.width,y.height))+1:A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?y.mipmaps.length:1}function N(A){let y=new WeakRef(A);n.get(A).__ref=y,p.add(y),x.register(A,y,y)}function P(A){let y=n.get(A).__ref;y!==void 0&&(p.delete(y),x.unregister(y))}function D(A){V(A.target)}function O(A){I(A.target)}function V(A){A.removeEventListener("dispose",D),P(A),q(A),A.isVideoTexture&&h.delete(A),A.isHTMLTexture&&d.delete(A)}function I(A){A.removeEventListener("dispose",O),P(A),Q(A)}function X(){for(let A of p){let y=A.deref();y!==void 0&&(y.isRenderTarget===!0?I(y):V(y))}p.clear(),d.clear()}function q(A){let y=n.get(A);if(y.__webglInit===void 0)return;let B=A.source,se=u.get(B);if(se){let ee=se[y.__cacheKey];ee.usedTimes--,ee.usedTimes===0&&H(A),Object.keys(se).length===0&&u.delete(B)}n.remove(A)}function H(A){let y=n.get(A);i.deleteTexture(y.__webglTexture);let B=A.source,se=u.get(B);delete se[y.__cacheKey],a.memory.textures--}function Q(A){let y=n.get(A);y.__depthDisposeCallback&&y.__depthDisposeCallback();let B=A.depthTexture;if(B&&B.renderTarget===A&&V(B),A.isWebGLCubeRenderTarget)for(let ee=0;ee<6;ee++){if(Array.isArray(y.__webglFramebuffer[ee]))for(let oe=0;oe<y.__webglFramebuffer[ee].length;oe++)i.deleteFramebuffer(y.__webglFramebuffer[ee][oe]);else i.deleteFramebuffer(y.__webglFramebuffer[ee]);y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer[ee])}else{if(Array.isArray(y.__webglFramebuffer))for(let ee=0;ee<y.__webglFramebuffer.length;ee++)i.deleteFramebuffer(y.__webglFramebuffer[ee]);else i.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&i.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&i.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let ee=0;ee<y.__webglColorRenderbuffer.length;ee++)y.__webglColorRenderbuffer[ee]&&i.deleteRenderbuffer(y.__webglColorRenderbuffer[ee]);y.__webglDepthRenderbuffer&&i.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let se=A.textures;for(let ee=0,oe=se.length;ee<oe;ee++){let de=n.get(se[ee]);de.__webglTexture&&(i.deleteTexture(de.__webglTexture),a.memory.textures--),n.remove(se[ee])}n.remove(A)}let G=0;function ne(){G=0}function ie(){return G}function Ae(A){G=A}function He(){let A=G;return A>=s.maxTextures&&Ie("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+s.maxTextures),G+=1,A}function j(A){let y=[];return y.push(A.wrapS),y.push(A.wrapT),y.push(A.wrapR||0),y.push(A.magFilter),y.push(A.minFilter),y.push(A.anisotropy),y.push(A.internalFormat),y.push(A.format),y.push(A.type),y.push(A.generateMipmaps),y.push(A.mipmapsAutoUpdate),y.push(A.premultiplyAlpha),y.push(A.flipY),y.push(A.unpackAlignment),y.push(A.colorSpace),y.join()}function ye(A,y){let B=n.get(A);if(A.isVideoTexture&&wt(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&B.__version!==A.version){let se=A.image;if(se===null)Ie("WebGLRenderer: Texture marked for update but no image data found.");else if(se.complete===!1)Ie("WebGLRenderer: Texture marked for update but image is incomplete");else{Mt(B,A,y);return}}else A.isExternalTexture&&(B.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,B.__webglTexture,i.TEXTURE0+y)}function Me(A,y){let B=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&B.__version!==A.version){Mt(B,A,y);return}else A.isExternalTexture&&(B.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,B.__webglTexture,i.TEXTURE0+y)}function Le(A,y){let B=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&B.__version!==A.version){Mt(B,A,y);return}t.bindTexture(i.TEXTURE_3D,B.__webglTexture,i.TEXTURE0+y)}function ve(A,y){let B=n.get(A);if(A.version>0&&B.__version!==A.version){Qt(B,A,y);return}t.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+y)}let Ve={[Ei]:i.REPEAT,[vn]:i.CLAMP_TO_EDGE,[ka]:i.MIRRORED_REPEAT},vt={[Dt]:i.NEAREST,[Cu]:i.NEAREST_MIPMAP_NEAREST,[Br]:i.NEAREST_MIPMAP_LINEAR,[Zt]:i.LINEAR,[yo]:i.LINEAR_MIPMAP_NEAREST,[hi]:i.LINEAR_MIPMAP_LINEAR},Oe={[Du]:i.NEVER,[Ac]:i.ALWAYS,[Nu]:i.LESS,[Ec]:i.LEQUAL,[Uu]:i.EQUAL,[Tc]:i.GEQUAL,[Ou]:i.GREATER,[Fu]:i.NOTEQUAL};function rt(A,y){if(y.type===En&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===Zt||y.magFilter===yo||y.magFilter===Br||y.magFilter===hi||y.minFilter===Zt||y.minFilter===yo||y.minFilter===Br||y.minFilter===hi)&&Ie("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,Ve[y.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,Ve[y.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,Ve[y.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,vt[y.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,vt[y.minFilter]),y.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,Oe[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===Dt||y.minFilter!==Br&&y.minFilter!==hi||y.type===En&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||n.get(y).__currentAnisotropy){let B=e.get("EXT_texture_filter_anisotropic");i.texParameterf(A,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),n.get(y).__currentAnisotropy=y.anisotropy}}}function lt(A,y){let B=!1;A.__webglInit===void 0&&(A.__webglInit=!0,y.addEventListener("dispose",D),N(y));let se=y.source,ee=u.get(se);ee===void 0&&(ee={},u.set(se,ee));let oe=j(y);if(oe!==A.__cacheKey){ee[oe]===void 0&&(ee[oe]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,B=!0),ee[oe].usedTimes++;let de=ee[A.__cacheKey];de!==void 0&&(ee[A.__cacheKey].usedTimes--,de.usedTimes===0&&H(y)),A.__cacheKey=oe,A.__webglTexture=ee[oe].texture}return B}function je(A,y,B){return Math.floor(Math.floor(A/B)/y)}function Ut(A,y,B,se){let oe=A.updateRanges;if(oe.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,y.width,y.height,B,se,y.data);else{oe.sort((C,J)=>C.start-J.start);let de=0;for(let C=1;C<oe.length;C++){let J=oe[de],$=oe[C],he=J.start+J.count,ae=je($.start,y.width,4),le=je(J.start,y.width,4);$.start<=he+1&&ae===le&&je($.start+$.count-1,y.width,4)===ae?J.count=Math.max(J.count,$.start+$.count-J.start):(++de,oe[de]=$)}oe.length=de+1;let Y=t.getParameter(i.UNPACK_ROW_LENGTH),Z=t.getParameter(i.UNPACK_SKIP_PIXELS),ce=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,y.width);for(let C=0,J=oe.length;C<J;C++){let $=oe[C],he=Math.floor($.start/4),ae=Math.ceil($.count/4),le=he%y.width,Ce=Math.floor(he/y.width),$e=ae,re=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,le),t.pixelStorei(i.UNPACK_SKIP_ROWS,Ce),t.texSubImage2D(i.TEXTURE_2D,0,le,Ce,$e,re,B,se,y.data)}A.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,Y),t.pixelStorei(i.UNPACK_SKIP_PIXELS,Z),t.pixelStorei(i.UNPACK_SKIP_ROWS,ce)}}function Mt(A,y,B){let se=i.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(se=i.TEXTURE_2D_ARRAY),y.isData3DTexture&&(se=i.TEXTURE_3D);let ee=lt(A,y),oe=y.source;t.bindTexture(se,A.__webglTexture,i.TEXTURE0+B);let de=n.get(oe);if(oe.version!==de.__version||ee===!0){if(t.activeTexture(i.TEXTURE0+B),(typeof ImageBitmap<"u"&&y.image instanceof ImageBitmap)===!1){let re=Qe.getPrimaries(Qe.workingColorSpace),Pe=y.colorSpace===di?null:Qe.getPrimaries(y.colorSpace),Xe=y.colorSpace===di||re===Pe?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Xe)}t.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment);let Z=v(y.image,!1,s.maxTextureSize);Z=De(y,Z);let ce=r.convert(y.format,y.colorSpace),C=r.convert(y.type),J=E(y.internalFormat,ce,C,y.normalized,y.colorSpace,y.isVideoTexture);rt(se,y);let $,he=y.mipmaps,ae=y.isVideoTexture!==!0,le=de.__version===void 0||ee===!0,Ce=oe.dataReady,$e=M(y,Z);if(y.isDepthTexture)J=_(y.format===ui,y.type),le&&(ae?t.texStorage2D(i.TEXTURE_2D,1,J,Z.width,Z.height):t.texImage2D(i.TEXTURE_2D,0,J,Z.width,Z.height,0,ce,C,null));else if(y.isDataTexture)if(he.length>0){ae&&le&&t.texStorage2D(i.TEXTURE_2D,$e,J,he[0].width,he[0].height);for(let re=0,Pe=he.length;re<Pe;re++)$=he[re],ae?Ce&&t.texSubImage2D(i.TEXTURE_2D,re,0,0,$.width,$.height,ce,C,$.data):t.texImage2D(i.TEXTURE_2D,re,J,$.width,$.height,0,ce,C,$.data);y.generateMipmaps=!1}else ae?(le&&t.texStorage2D(i.TEXTURE_2D,$e,J,Z.width,Z.height),Ce&&Ut(y,Z,ce,C)):t.texImage2D(i.TEXTURE_2D,0,J,Z.width,Z.height,0,ce,C,Z.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){ae&&le&&t.texStorage3D(i.TEXTURE_2D_ARRAY,$e,J,he[0].width,he[0].height,Z.depth);for(let re=0,Pe=he.length;re<Pe;re++)if($=he[re],y.format!==kn)if(ce!==null)if(ae){if(Ce)if(y.layerUpdates.size>0){let Xe=Bc($.width,$.height,y.format,y.type);for(let _e of y.layerUpdates){let at=$.data.subarray(_e*Xe/$.data.BYTES_PER_ELEMENT,(_e+1)*Xe/$.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,re,0,0,_e,$.width,$.height,1,ce,at)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,re,0,0,0,$.width,$.height,Z.depth,ce,$.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,re,J,$.width,$.height,Z.depth,0,$.data,0,0);else Ie("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ae?Ce&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,re,0,0,0,$.width,$.height,Z.depth,ce,C,$.data):t.texImage3D(i.TEXTURE_2D_ARRAY,re,J,$.width,$.height,Z.depth,0,ce,C,$.data);y.layerUpdates.size>0&&y.clearLayerUpdates()}else{ae&&le&&t.texStorage2D(i.TEXTURE_2D,$e,J,he[0].width,he[0].height);for(let re=0,Pe=he.length;re<Pe;re++)$=he[re],y.format!==kn?ce!==null?ae?Ce&&t.compressedTexSubImage2D(i.TEXTURE_2D,re,0,0,$.width,$.height,ce,$.data):t.compressedTexImage2D(i.TEXTURE_2D,re,J,$.width,$.height,0,$.data):Ie("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ae?Ce&&t.texSubImage2D(i.TEXTURE_2D,re,0,0,$.width,$.height,ce,C,$.data):t.texImage2D(i.TEXTURE_2D,re,J,$.width,$.height,0,ce,C,$.data)}else if(y.isDataArrayTexture)if(ae){if(le&&t.texStorage3D(i.TEXTURE_2D_ARRAY,$e,J,Z.width,Z.height,Z.depth),Ce)if(y.layerUpdates.size>0){let re=Bc(Z.width,Z.height,y.format,y.type);for(let Pe of y.layerUpdates){let Xe=Z.data.subarray(Pe*re/Z.data.BYTES_PER_ELEMENT,(Pe+1)*re/Z.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Pe,Z.width,Z.height,1,ce,C,Xe)}y.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Z.width,Z.height,Z.depth,ce,C,Z.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,J,Z.width,Z.height,Z.depth,0,ce,C,Z.data);else if(y.isData3DTexture)ae?(le&&t.texStorage3D(i.TEXTURE_3D,$e,J,Z.width,Z.height,Z.depth),Ce&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Z.width,Z.height,Z.depth,ce,C,Z.data)):t.texImage3D(i.TEXTURE_3D,0,J,Z.width,Z.height,Z.depth,0,ce,C,Z.data);else if(y.isFramebufferTexture){if(le)if(ae)t.texStorage2D(i.TEXTURE_2D,$e,J,Z.width,Z.height);else{let re=Z.width,Pe=Z.height;for(let Xe=0;Xe<$e;Xe++)t.texImage2D(i.TEXTURE_2D,Xe,J,re,Pe,0,ce,C,null),re>>=1,Pe>>=1}}else if(y.isHTMLTexture){if("texElementImage2D"in i){let re=i.canvas;if(re.hasAttribute("layoutsubtree")||re.setAttribute("layoutsubtree","true"),Z.parentNode!==re){re.appendChild(Z),d.add(y),re.onpaint=Pe=>{let Xe=Pe.changedElements;for(let _e of d)Xe.includes(_e.image)&&(_e.needsUpdate=!0)},re.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,Z);else{let Xe=i.RGBA,_e=i.RGBA,at=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Xe,_e,at,Z)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(he.length>0){if(ae&&le){let re=ze(he[0]);t.texStorage2D(i.TEXTURE_2D,$e,J,re.width,re.height)}for(let re=0,Pe=he.length;re<Pe;re++)$=he[re],ae?Ce&&t.texSubImage2D(i.TEXTURE_2D,re,0,0,ce,C,$):t.texImage2D(i.TEXTURE_2D,re,J,ce,C,$);y.generateMipmaps=!1}else if(ae){if(le){let re=ze(Z);t.texStorage2D(i.TEXTURE_2D,$e,J,re.width,re.height)}Ce&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ce,C,Z)}else t.texImage2D(i.TEXTURE_2D,0,J,ce,C,Z);w(y)&&y.mipmapsAutoUpdate===!0&&S(se),de.__version=oe.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function Qt(A,y,B){if(y.image.length!==6)return;let se=lt(A,y),ee=y.source;t.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+B);let oe=n.get(ee);if(ee.version!==oe.__version||se===!0){t.activeTexture(i.TEXTURE0+B);let de=Qe.getPrimaries(Qe.workingColorSpace),Y=y.colorSpace===di?null:Qe.getPrimaries(y.colorSpace),Z=y.colorSpace===di||de===Y?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,y.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Z);let ce=y.isCompressedTexture||y.image[0].isCompressedTexture,C=y.image[0]&&y.image[0].isDataTexture,J=[];for(let _e=0;_e<6;_e++)!ce&&!C?J[_e]=v(y.image[_e],!0,s.maxCubemapSize):J[_e]=C?y.image[_e].image:y.image[_e],J[_e]=De(y,J[_e]);let $=J[0],he=r.convert(y.format,y.colorSpace),ae=r.convert(y.type),le=E(y.internalFormat,he,ae,y.normalized,y.colorSpace),Ce=y.isVideoTexture!==!0,$e=oe.__version===void 0||se===!0,re=ee.dataReady,Pe=M(y,$);rt(i.TEXTURE_CUBE_MAP,y);let Xe;if(y.isDepthTexture){if(le=_(y.format===ui,y.type),$e)if(Ce)t.texStorage2D(i.TEXTURE_CUBE_MAP,1,le,$.width,$.height);else for(let _e=0;_e<6;_e++)t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,0,le,$.width,$.height,0,he,ae,null)}else if(ce){Ce&&$e&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Pe,le,$.width,$.height);for(let _e=0;_e<6;_e++){Xe=J[_e].mipmaps;for(let at=0;at<Xe.length;at++){let Pt=Xe[at];y.format!==kn?he!==null?Ce?re&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,at,0,0,Pt.width,Pt.height,he,Pt.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,at,le,Pt.width,Pt.height,0,Pt.data):Ie("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ce?re&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,at,0,0,Pt.width,Pt.height,he,ae,Pt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,at,le,Pt.width,Pt.height,0,he,ae,Pt.data)}}}else{if(Xe=y.mipmaps,Ce&&$e){Xe.length>0&&Pe++;let _e=ze(J[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Pe,le,_e.width,_e.height)}for(let _e=0;_e<6;_e++)if(C){Ce?re&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,0,0,0,J[_e].width,J[_e].height,he,ae,J[_e].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,0,le,J[_e].width,J[_e].height,0,he,ae,J[_e].data);for(let at=0;at<Xe.length;at++){let _i=Xe[at].image[_e].image;Ce?re&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,at+1,0,0,_i.width,_i.height,he,ae,_i.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,at+1,le,_i.width,_i.height,0,he,ae,_i.data)}}else{Ce?re&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,0,0,0,he,ae,J[_e]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,0,le,he,ae,J[_e]);for(let at=0;at<Xe.length;at++){let Pt=Xe[at];Ce?re&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,at+1,0,0,he,ae,Pt.image[_e]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+_e,at+1,le,he,ae,Pt.image[_e])}}}w(y)&&y.mipmapsAutoUpdate===!0&&S(i.TEXTURE_CUBE_MAP),oe.__version=ee.version,y.onUpdate&&y.onUpdate(y)}A.__version=y.version}function _t(A,y,B,se,ee,oe){let de=r.convert(B.format,B.colorSpace),Y=r.convert(B.type),Z=E(B.internalFormat,de,Y,B.normalized,B.colorSpace),ce=n.get(y),C=n.get(B);if(C.__renderTarget=y,!ce.__hasExternalTextures){let J=Math.max(1,y.width>>oe),$=Math.max(1,y.height>>oe);ee===i.TEXTURE_3D||ee===i.TEXTURE_2D_ARRAY?t.texImage3D(ee,oe,Z,J,$,y.depth,0,de,Y,null):t.texImage2D(ee,oe,Z,J,$,0,de,Y,null)}t.bindFramebuffer(i.FRAMEBUFFER,A),me(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,se,ee,C.__webglTexture,0,mt(y)):(ee===i.TEXTURE_2D||ee>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&ee<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,se,ee,C.__webglTexture,oe),t.bindFramebuffer(i.FRAMEBUFFER,null)}function Vn(A,y,B){if(i.bindRenderbuffer(i.RENDERBUFFER,A),y.depthBuffer){let se=y.depthTexture,ee=se&&se.isDepthTexture?se.type:null,oe=_(y.stencilBuffer,ee),de=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;me(y)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,mt(y),oe,y.width,y.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,mt(y),oe,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,oe,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,de,i.RENDERBUFFER,A)}else{let se=y.textures;for(let ee=0;ee<se.length;ee++){let oe=se[ee],de=r.convert(oe.format,oe.colorSpace),Y=r.convert(oe.type),Z=E(oe.internalFormat,de,Y,oe.normalized,oe.colorSpace);me(y)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,mt(y),Z,y.width,y.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,mt(y),Z,y.width,y.height):i.renderbufferStorage(i.RENDERBUFFER,Z,y.width,y.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Ct(A,y,B){let se=y.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,A),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let ee=n.get(y.depthTexture);ee.__renderTarget=y;let oe=se?y.depthTexture.image[0]:y.depthTexture.image;(!ee.__webglTexture||oe.width!==y.width||oe.height!==y.height)&&(oe.width=y.width,oe.height=y.height,y.depthTexture.needsUpdate=!0),se?ve(y.depthTexture,0):ye(y.depthTexture,0);let de=ee.__webglTexture,Y=mt(y),Z=se?i.TEXTURE_CUBE_MAP_POSITIVE_X+B:i.TEXTURE_2D,ce=y.depthTexture.format===ui?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(y.depthTexture.format===ai)me(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ce,Z,de,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,ce,Z,de,0);else if(y.depthTexture.format===ui)me(y)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ce,Z,de,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,ce,Z,de,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function mn(A){let y=n.get(A),B=A.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==A.depthTexture){let se=A.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),se){let ee=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,se.removeEventListener("dispose",ee)};se.addEventListener("dispose",ee),y.__depthDisposeCallback=ee}y.__boundDepthTexture=se}if(A.depthTexture&&!y.__autoAllocateDepthBuffer)if(B)for(let se=0;se<6;se++)Ct(y.__webglFramebuffer[se],A,se);else A.texture.mipmaps.length>0?Ct(y.__webglFramebuffer[0],A,0):Ct(y.__webglFramebuffer,A,0);else if(B){y.__webglDepthbuffer=[];for(let se=0;se<6;se++)if(t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[se]),y.__webglDepthbuffer[se]===void 0)y.__webglDepthbuffer[se]=i.createRenderbuffer(),Vn(y.__webglDepthbuffer[se],A,!1);else{let ee=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,oe=y.__webglDepthbuffer[se];i.bindRenderbuffer(i.RENDERBUFFER,oe),i.framebufferRenderbuffer(i.FRAMEBUFFER,ee,i.RENDERBUFFER,oe)}}else if(A.texture.mipmaps.length>0?t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=i.createRenderbuffer(),Vn(y.__webglDepthbuffer,A,!1);else{let ee=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,oe=y.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,oe),i.framebufferRenderbuffer(i.FRAMEBUFFER,ee,i.RENDERBUFFER,oe)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function gn(A,y,B){let se=n.get(A);y!==void 0&&_t(se.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),B!==void 0&&mn(A)}function _n(A){let y=A.texture,B=n.get(A),se=n.get(y);A.addEventListener("dispose",O),N(A);let ee=A.textures,oe=A.isWebGLCubeRenderTarget===!0,de=ee.length>1;if(de||(se.__webglTexture===void 0&&(se.__webglTexture=i.createTexture()),se.__version=y.version,a.memory.textures++),oe){B.__webglFramebuffer=[];for(let Y=0;Y<6;Y++)if(y.mipmaps.length>0){B.__webglFramebuffer[Y]=[];for(let Z=0;Z<y.mipmaps.length;Z++)B.__webglFramebuffer[Y][Z]=i.createFramebuffer()}else B.__webglFramebuffer[Y]=i.createFramebuffer()}else{if(y.mipmaps.length>0){B.__webglFramebuffer=[];for(let Y=0;Y<y.mipmaps.length;Y++)B.__webglFramebuffer[Y]=i.createFramebuffer()}else B.__webglFramebuffer=i.createFramebuffer();if(de)for(let Y=0,Z=ee.length;Y<Z;Y++){let ce=n.get(ee[Y]);ce.__webglTexture===void 0&&(ce.__webglTexture=i.createTexture(),a.memory.textures++)}if(A.samples>0&&me(A)===!1){B.__webglMultisampledFramebuffer=i.createFramebuffer(),B.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let Y=0;Y<ee.length;Y++){let Z=ee[Y];B.__webglColorRenderbuffer[Y]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,B.__webglColorRenderbuffer[Y]);let ce=r.convert(Z.format,Z.colorSpace),C=r.convert(Z.type),J=E(Z.internalFormat,ce,C,Z.normalized,Z.colorSpace,A.isXRRenderTarget===!0),$=mt(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,$,J,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Y,i.RENDERBUFFER,B.__webglColorRenderbuffer[Y])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(B.__webglDepthRenderbuffer=i.createRenderbuffer(),Vn(B.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(oe){t.bindTexture(i.TEXTURE_CUBE_MAP,se.__webglTexture),rt(i.TEXTURE_CUBE_MAP,y);for(let Y=0;Y<6;Y++)if(y.mipmaps.length>0)for(let Z=0;Z<y.mipmaps.length;Z++)_t(B.__webglFramebuffer[Y][Z],A,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,Z);else _t(B.__webglFramebuffer[Y],A,y,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0);w(y)?S(i.TEXTURE_CUBE_MAP):y.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,y.mipmaps.length-1),t.unbindTexture()}else if(de){for(let Y=0,Z=ee.length;Y<Z;Y++){let ce=ee[Y],C=n.get(ce),J=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(J=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(J,C.__webglTexture),rt(J,ce),_t(B.__webglFramebuffer,A,ce,i.COLOR_ATTACHMENT0+Y,J,0),w(ce)&&S(J)}t.unbindTexture()}else{let Y=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(Y=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(Y,se.__webglTexture),rt(Y,y),y.mipmaps.length>0)for(let Z=0;Z<y.mipmaps.length;Z++)_t(B.__webglFramebuffer[Z],A,y,i.COLOR_ATTACHMENT0,Y,Z);else _t(B.__webglFramebuffer,A,y,i.COLOR_ATTACHMENT0,Y,0);w(y)?S(Y):y.mipmaps.length>0&&i.texParameteri(Y,i.TEXTURE_MAX_LEVEL,y.mipmaps.length-1),t.unbindTexture()}A.depthBuffer&&mn(A)}function U(A){let y=A.textures;for(let B=0,se=y.length;B<se;B++){let ee=y[B];if(w(ee)&&ee.mipmapsAutoUpdate===!0){let oe=T(A),de=n.get(ee).__webglTexture;t.bindTexture(oe,de),S(oe),t.unbindTexture()}}}let xn=[];function pt(A){if(A.samples>0){if(me(A)===!1){let y=A.textures,B=A.width,se=A.height,ee=i.COLOR_BUFFER_BIT,oe=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,de=n.get(A),Y=y.length>1;if(Y)for(let ce=0;ce<y.length;ce++)t.bindFramebuffer(i.FRAMEBUFFER,de.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ce,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,de.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ce,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,de.__webglMultisampledFramebuffer),A.texture.mipmaps.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,de.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,de.__webglFramebuffer);for(let ce=0;ce<y.length;ce++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(ee|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(ee|=i.STENCIL_BUFFER_BIT)),Y){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,de.__webglColorRenderbuffer[ce]);let C=n.get(y[ce]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,C,0)}i.blitFramebuffer(0,0,B,se,0,0,B,se,ee,i.NEAREST),l===!0&&(xn.length=0,xn.push(i.COLOR_ATTACHMENT0+ce),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&xn.push(oe),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,xn))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),Y)for(let ce=0;ce<y.length;ce++){t.bindFramebuffer(i.FRAMEBUFFER,de.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ce,i.RENDERBUFFER,de.__webglColorRenderbuffer[ce]);let C=n.get(y[ce]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,de.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ce,i.TEXTURE_2D,C,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,de.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&l){let y=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[y])}}}function mt(A){return Math.min(s.maxSamples,A.samples)}function me(A){let y=n.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function wt(A){let y=a.render.frame;h.get(A)!==y&&(h.set(A,y),A.update())}function De(A,y){let B=A.colorSpace,se=A.format,ee=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||B!==hr&&B!==di&&(Qe.getTransfer(B)===st?(se!==kn||ee!==en)&&Ie("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Be("WebGLTextures: Unsupported texture color space:",B)),y}function ze(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=He,this.resetTextureUnits=ne,this.getTextureUnits=ie,this.setTextureUnits=Ae,this.setTexture2D=ye,this.setTexture2DArray=Me,this.setTexture3D=Le,this.setTextureCube=ve,this.rebindTextures=gn,this.setupRenderTarget=_n,this.updateRenderTargetMipmap=U,this.updateMultisampleRenderTarget=pt,this.setupDepthRenderbuffer=mn,this.setupFrameBufferTexture=_t,this.useMultisampledRTT=me,this.dispose=X}function Q_(i,e){function t(n,s=di){let r,a=Qe.getTransfer(s);if(n===en)return i.UNSIGNED_BYTE;if(n===bo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===So)return i.UNSIGNED_SHORT_5_5_5_1;if(n===bc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Sc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===yc)return i.BYTE;if(n===vc)return i.SHORT;if(n===zs)return i.UNSIGNED_SHORT;if(n===vo)return i.INT;if(n===Fn)return i.UNSIGNED_INT;if(n===En)return i.FLOAT;if(n===Bn)return i.HALF_FLOAT;if(n===Mc)return i.ALPHA;if(n===wc)return i.RGB;if(n===kn)return i.RGBA;if(n===ai)return i.DEPTH_COMPONENT;if(n===ui)return i.DEPTH_STENCIL;if(n===Mo)return i.RED;if(n===wo)return i.RED_INTEGER;if(n===Oi)return i.RG;if(n===Eo)return i.RG_INTEGER;if(n===To)return i.RGBA_INTEGER;if(n===kr||n===zr||n===Hr||n===Gr)if(a===st)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===kr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===zr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Gr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===kr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===zr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Hr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Gr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ao||n===Ro||n===Co||n===Po)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Ao)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ro)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Co)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Po)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Io||n===Lo||n===Do||n===No||n===Uo||n===Vr||n===Oo)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Io||n===Lo)return a===st?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Do)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===No)return r.COMPRESSED_R11_EAC;if(n===Uo)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Vr)return r.COMPRESSED_RG11_EAC;if(n===Oo)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Fo||n===Bo||n===ko||n===zo||n===Ho||n===Go||n===Vo||n===Wo||n===Xo||n===$o||n===qo||n===Yo||n===Zo||n===jo)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Fo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Bo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ko)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===zo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ho)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Go)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Vo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Wo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Xo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===$o)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===qo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Yo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Zo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===jo)return a===st?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Jo||n===Ko||n===Qo)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Jo)return a===st?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ko)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Qo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===el||n===tl||n===Wr||n===nl)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===el)return r.COMPRESSED_RED_RGTC1_EXT;if(n===tl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Wr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===nl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ss?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var ex=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,tx=`
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

}`,Kc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Sr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new wn({vertexShader:ex,fragmentShader:tx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ut(new ft(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Qc=class extends Dn{constructor(e,t){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,d=null,f=null,u=null,p=null,x=typeof XRWebGLBinding<"u",g=new Kc,m={},v=t.getContextAttributes(),w=null,S=null,T=[],E=[],_=new ge,M=null,N=null,P=new Bt;P.viewport=new gt;let D=new Bt;D.viewport=new gt;let O=[P,D],V=new po,I=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let ye=T[j];return ye===void 0&&(ye=new Ls,T[j]=ye),ye.getTargetRaySpace()},this.getControllerGrip=function(j){let ye=T[j];return ye===void 0&&(ye=new Ls,T[j]=ye),ye.getGripSpace()},this.getHand=function(j){let ye=T[j];return ye===void 0&&(ye=new Ls,T[j]=ye),ye.getHandSpace()};function q(j){let ye=E.indexOf(j.inputSource);if(ye===-1)return;let Me=T[ye];Me!==void 0&&(Me.update(j.inputSource,j.frame,c||a),Me.dispatchEvent({type:j.type,data:j.inputSource}))}function H(){s.removeEventListener("select",q),s.removeEventListener("selectstart",q),s.removeEventListener("selectend",q),s.removeEventListener("squeeze",q),s.removeEventListener("squeezestart",q),s.removeEventListener("squeezeend",q),s.removeEventListener("end",H),s.removeEventListener("inputsourceschange",Q);for(let j=0;j<T.length;j++){let ye=E[j];ye!==null&&(E[j]=null,T[j].disconnect(ye))}I=null,X=null,g.reset();for(let j in m)delete m[j];if(e.setRenderTarget(w),u=null,f=null,d=null,s=null,S=null,He.stop(),n.isPresenting=!1,e.setPixelRatio(M),e.setSize(_.width,_.height,!1),N!==null){let j=N.camera;j.fov=N.fov,j.zoom=N.zoom,j.updateProjectionMatrix(),N=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){r=j,n.isPresenting===!0&&Ie("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){o=j,n.isPresenting===!0&&Ie("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(j){c=j},this.getBaseLayer=function(){return f!==null?f:u},this.getBinding=function(){return d===null&&x&&(d=new XRWebGLBinding(s,t)),d},this.getFrame=function(){return p},this.getSession=function(){return s},this.setSession=async function(j){if(s=j,s!==null){if(w=e.getRenderTarget(),s.addEventListener("select",q),s.addEventListener("selectstart",q),s.addEventListener("selectend",q),s.addEventListener("squeeze",q),s.addEventListener("squeezestart",q),s.addEventListener("squeezeend",q),s.addEventListener("end",H),s.addEventListener("inputsourceschange",Q),v.xrCompatible!==!0&&await t.makeXRCompatible(),M=e.getPixelRatio(),e.getSize(_),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let Me=null,Le=null,ve=null;v.depth&&(ve=v.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Me=v.stencil?ui:ai,Le=v.stencil?ss:Fn);let Ve={colorFormat:t.RGBA8,depthFormat:ve,scaleFactor:r};d=this.getBinding(),f=d.createProjectionLayer(Ve),s.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),S=new cn(f.textureWidth,f.textureHeight,{format:kn,type:en,depthTexture:new li(f.textureWidth,f.textureHeight,Le,void 0,void 0,void 0,void 0,void 0,void 0,Me),stencilBuffer:v.stencil,colorSpace:e.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{let Me={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:r};u=new XRWebGLLayer(s,t,Me),s.updateRenderState({baseLayer:u}),e.setPixelRatio(1),e.setSize(u.framebufferWidth,u.framebufferHeight,!1),S=new cn(u.framebufferWidth,u.framebufferHeight,{format:kn,type:en,colorSpace:e.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),He.setContext(s),He.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function Q(j){for(let ye=0;ye<j.removed.length;ye++){let Me=j.removed[ye],Le=E.indexOf(Me);Le>=0&&(E[Le]=null,T[Le].disconnect(Me))}for(let ye=0;ye<j.added.length;ye++){let Me=j.added[ye],Le=E.indexOf(Me);if(Le===-1){for(let Ve=0;Ve<T.length;Ve++)if(Ve>=E.length){E.push(Me),Le=Ve;break}else if(E[Ve]===null){E[Ve]=Me,Le=Ve;break}if(Le===-1)break}let ve=T[Le];ve&&ve.connect(Me)}}function G(j,ye){ye===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(ye.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(s===null)return;let ye=j.near,Me=j.far;g.texture!==null&&(g.depthNear>0&&(ye=g.depthNear),g.depthFar>0&&(Me=g.depthFar)),V.near=D.near=P.near=ye,V.far=D.far=P.far=Me,(I!==V.near||X!==V.far)&&(s.updateRenderState({depthNear:V.near,depthFar:V.far}),I=V.near,X=V.far),V.layers.mask=j.layers.mask|6,P.layers.mask=V.layers.mask&-5,D.layers.mask=V.layers.mask&-3;let Le=j.parent,ve=V.cameras;G(V,Le);for(let Ve=0;Ve<ve.length;Ve++)G(ve[Ve],Le);V.projectionMatrix.copy(P.projectionMatrix),V.projectionMatrixInverse.copy(P.projectionMatrixInverse),N===null&&j.isPerspectiveCamera&&(N={camera:j,fov:j.fov,zoom:j.zoom}),ne(j,V,Le)};function ne(j,ye,Me){Me===null?j.matrix.copy(ye.matrixWorld):(j.matrix.copy(Me.matrixWorld),j.matrix.invert(),j.matrix.multiply(ye.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(ye.projectionMatrix),j.projectionMatrixInverse.copy(ye.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=$i*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return V},this.getFoveation=function(){if(!(f===null&&u===null))return l},this.setFoveation=function(j){l=j,f!==null&&(f.fixedFoveation=j),u!==null&&u.fixedFoveation!==void 0&&(u.fixedFoveation=j)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(V)},this.getCameraTexture=function(j){return m[j]};let ie=null;function Ae(j,ye){if(h=ye.getViewerPose(c||a),p=ye,h!==null){let Me=h.views;u!==null&&(e.setRenderTargetFramebuffer(S,u.framebuffer),e.setRenderTarget(S));let Le=!1;Me.length!==V.cameras.length&&(V.cameras.length=0,Le=!0);for(let Oe=0;Oe<Me.length;Oe++){let rt=Me[Oe],lt=null;if(u!==null)lt=u.getViewport(rt);else{let Ut=d.getViewSubImage(f,rt);lt=Ut.viewport,Oe===0&&(e.setRenderTargetTextures(S,Ut.colorTexture,Ut.depthStencilTexture),e.setRenderTarget(S))}let je=O[Oe];je===void 0&&(je=new Bt,je.layers.enable(Oe),je.viewport=new gt,O[Oe]=je),je.matrix.fromArray(rt.transform.matrix),je.matrix.decompose(je.position,je.quaternion,je.scale),je.projectionMatrix.fromArray(rt.projectionMatrix),je.projectionMatrixInverse.copy(je.projectionMatrix).invert(),je.viewport.set(lt.x,lt.y,lt.width,lt.height),Oe===0&&(V.matrix.copy(je.matrix),V.matrix.decompose(V.position,V.quaternion,V.scale)),Le===!0&&V.cameras.push(je)}let ve=s.enabledFeatures;if(ve&&ve.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&x){d=n.getBinding();let Oe=d.getDepthInformation(Me[0]);Oe&&Oe.isValid&&Oe.texture&&g.init(Oe,s.renderState)}if(ve&&ve.includes("camera-access")&&x){e.state.unbindTexture(),d=n.getBinding();for(let Oe=0;Oe<Me.length;Oe++){let rt=Me[Oe].camera;if(rt){let lt=m[rt];lt||(lt=new Sr,m[rt]=lt);let je=d.getCameraImage(rt);lt.sourceTexture=je}}}}for(let Me=0;Me<T.length;Me++){let Le=E[Me],ve=T[Me];Le!==null&&ve!==void 0&&ve.update(Le,ye,c||a)}ie&&ie(j,ye),ye.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ye}),p=null}let He=new gd;He.setAnimationLoop(Ae),this.setAnimationLoop=function(j){ie=j},this.dispose=function(){}}},nx=new Ze,Td=new ke;Td.set(-1,0,0,0,1,0,0,0,1);function ix(i,e){function t(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function n(g,m){m.color.getRGB(g.fogColor.value,Uc(i)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function s(g,m,v,w,S){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(g,m):m.isMeshLambertMaterial?(r(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(g,m),d(g,m)):m.isMeshPhongMaterial?(r(g,m),h(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(g,m),f(g,m),m.isMeshPhysicalMaterial&&u(g,m,S)):m.isMeshMatcapMaterial?(r(g,m),p(g,m)):m.isMeshDepthMaterial?r(g,m):m.isMeshDistanceMaterial?(r(g,m),x(g,m)):m.isMeshNormalMaterial?r(g,m):m.isLineBasicMaterial?(a(g,m),m.isLineDashedMaterial&&o(g,m)):m.isPointsMaterial?l(g,m,v,w):m.isSpriteMaterial?c(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,t(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===kt&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,t(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===kt&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,t(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,t(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);let v=e.get(m),w=v.envMap,S=v.envMapRotation;w&&(g.envMap.value=w,g.envMapRotation.value.setFromMatrix4(nx.makeRotationFromEuler(S)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(Td),g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,g.aoMapTransform))}function a(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform))}function o(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function l(g,m,v,w){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*v,g.scale.value=w*.5,m.map&&(g.map.value=m.map,t(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function c(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function h(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function d(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function f(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function u(g,m,v){g.ior.value=m.ior,m.diffuseRoughness>0&&(g.diffuseRoughness.value=m.diffuseRoughness,m.diffuseRoughnessMap&&(g.diffuseRoughnessMap.value=m.diffuseRoughnessMap,t(m.diffuseRoughnessMap,g.diffuseRoughnessMapTransform))),m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===kt&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.retroreflectivity>0&&(g.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessMinimum,g.iridescenceThicknessMaximum.value=m.iridescenceThicknessMaximum,m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=v.texture,g.transmissionSamplerSize.value.set(v.width,v.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,g.specularIntensityMapTransform))}function p(g,m){m.matcap&&(g.matcap.value=m.matcap)}function x(g,m){let v=e.get(m).light;g.referencePosition.value.setFromMatrixPosition(v.matrixWorld),g.nearDistance.value=v.shadow.camera.near,g.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function sx(i,e,t,n){let s={},r={};function a(v,w){let S=w.program;n.uniformBlockBinding(v,S,s[v.id])}function o(v,w){let S=s[v.id];S===void 0&&(p(v),S=l(v),s[v.id]=S,v.addEventListener("dispose",g));let T=w.program;n.updateUBOMapping(v,T);let E=e.render.frame;r[v.id]!==E&&(c(v),r[v.id]=E)}function l(v){let w=i.createBuffer(),S=v.__size,T=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,w),i.bufferData(i.UNIFORM_BUFFER,S,T),i.bindBuffer(i.UNIFORM_BUFFER,null),w}function c(v){let w=s[v.id],S=v.uniforms,T=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let E=0,_=S.length;E<_;E++){let M=S[E];if(Array.isArray(M))for(let N=0,P=M.length;N<P;N++)h(M[N],E,N,T);else h(M,E,0,T)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function h(v,w,S,T){if(f(v,w,S,T)===!0){let E=v.__offset,_=v.value;if(Array.isArray(_)){let M=0;for(let N=0;N<_.length;N++){let P=_[N],D=x(P,!0);d(P,v.__data,M),M+=D.storage/Float32Array.BYTES_PER_ELEMENT}}else d(_,v.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,E,v.__data)}}function d(v,w,S){typeof v=="number"||typeof v=="boolean"?w[S]=v:v.isMatrix3?(w[S]=v.elements[0],w[S+1]=v.elements[1],w[S+2]=v.elements[2],w[S+3]=0,w[S+4]=v.elements[3],w[S+5]=v.elements[4],w[S+6]=v.elements[5],w[S+7]=0,w[S+8]=v.elements[6],w[S+9]=v.elements[7],w[S+10]=v.elements[8],w[S+11]=0):ArrayBuffer.isView(v)?w.set(v.subarray(0,w.length-S),S):v.toArray(w,S)}function f(v,w,S,T){let E=v.value,_=w+"_"+S;if(Array.isArray(E)){T[_]===void 0&&(T[_]=[]);let M=T[_],N=!1;for(let P=0;P<E.length;P++)u(E[P],M,P)===!0&&(N=!0);return N}return u(E,T,_)}function u(v,w,S){if(w[S]===void 0)return typeof v=="number"||typeof v=="boolean"?w[S]=v:ArrayBuffer.isView(v)?w[S]=v.slice():w[S]=v.clone(),!0;{let T=w[S];if(typeof v=="number"||typeof v=="boolean"){if(T!==v)return w[S]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(T.equals(v)===!1)return T.copy(v),!0}}return!1}function p(v){let w=v.uniforms,S=0,T=16;for(let _=0,M=w.length;_<M;_++){let N=Array.isArray(w[_])?w[_]:[w[_]];for(let P=0,D=N.length;P<D;P++){let O=N[P],V=Array.isArray(O.value)?O.value:[O.value],I=Array.isArray(w[_])||Array.isArray(O.value),X=S;for(let H=0,Q=V.length;H<Q;H++){let G=V[H],ne=x(G,I),ie=S%T,Ae=ie%ne.boundary,He=ie+Ae;S+=Ae,He!==0&&T-He<ne.storage&&(S+=T-He),H===0&&(X=S),S+=ne.storage}let q=O.type==="int"?Int32Array:O.type==="uint"?Uint32Array:Float32Array;O.__data=new q((S-X)/Float32Array.BYTES_PER_ELEMENT),O.__offset=X}}let E=S%T;return E>0&&(S+=T-E),v.__size=S,v.__cache={},this}function x(v,w){let S={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(S.boundary=4,S.storage=4):v.isVector2?(S.boundary=8,S.storage=8):v.isVector3||v.isColor?(S.boundary=16,S.storage=12):v.isVector4?(S.boundary=16,S.storage=16):v.isMatrix3?(S.boundary=16,S.storage=48):v.isMatrix4?(S.boundary=16,S.storage=64):v.isTexture?Ie("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(S.boundary=16,S.storage=v.byteLength):Ie("WebGLRenderer: Unsupported uniform value type.",v),w===!0&&(S.boundary=16,S.storage=Math.ceil(S.storage/16)*16),S}function g(v){let w=v.target;w.removeEventListener("dispose",g),i.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function m(){for(let v in s)i.deleteBuffer(s[v]);s={},r={}}return{bind:a,update:o,dispose:m}}var rx=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Jn=null;function ax(){return Jn===null&&(Jn=new _r(rx,16,16,Oi,Bn),Jn.name="DFG_LUT",Jn.minFilter=Zt,Jn.magFilter=Zt,Jn.wrapS=vn,Jn.wrapT=vn,Jn.generateMipmaps=!1,Jn.needsUpdate=!0),Jn}var rl=class{constructor(e={}){let{canvas:t=ku(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:f=!1,outputBufferType:u=en}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;let x=u,g=new Set([To,Eo,wo]),m=new Set([en,Fn,zs,ss,bo,So]),v=new Uint32Array(4),w=new Int32Array(4),S={textures:[],min:[],max:[],resolution:[]},T=null,E=null,_=[],M=[],N=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=jn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,D=!1,O=null,V=null,I=null,X=null;this._outputColorSpace=Ft;let q=0,H=0,Q=null,G=-1,ne=null,ie=new gt,Ae=new gt,He=null,j=new Ue(0),ye=0,Me=t.width,Le=t.height,ve=1,Ve=null,vt=null,Oe=new gt(0,0,Me,Le),rt=new gt(0,0,Me,Le),lt=!1,je=new Ai,Ut=new Wa,Mt=!1,Qt=!1,_t=new Ze,Vn=new R,Ct=new gt,mn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},gn=!1;function _n(){return Q===null?ve:1}let U=n;function xn(b,L){return t.getContext(b,L)}let pt,mt,me,wt,De,ze,A,y,B,se,ee,oe,de,Y,Z,ce,C,J,$,he,ae,le,Ce;try{let b={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"187"}`),t.addEventListener("webglcontextlost",Pe,!1),t.addEventListener("webglcontextrestored",Xe,!1),t.addEventListener("webglcontextcreationerror",_e,!1),U===null){let L="webgl2";if(U=xn(L,b),U===null)throw xn(L)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}$e()}catch(b){throw t.removeEventListener("webglcontextlost",Pe,!1),t.removeEventListener("webglcontextrestored",Xe,!1),t.removeEventListener("webglcontextcreationerror",_e,!1),Be("WebGLRenderer: "+b.message),b}function $e(){pt=new _g(U),pt.init(),ae=new Q_(U,pt),mt=new ag(U,pt,e,ae),me=new J_(U,pt),mt.reversedDepthBuffer&&f&&me.buffers.depth.setReversed(!0),V=U.createFramebuffer(),I=U.createFramebuffer(),X=U.createFramebuffer(),wt=new vg(U),De=new F_,ze=new K_(U,pt,me,De,mt,ae,wt),A=new gg(P),y=new Sp(U),le=new sg(U,y),B=new xg(U,y,wt,le),se=new Sg(U,B,y,le,wt),J=new bg(U,mt,ze),Z=new og(De),ee=new O_(P,A,pt,mt,le,Z),oe=new ix(P,De),de=new k_,Y=new X_(pt),C=new ig(P,A,me,se,p,l),ce=new j_(P,se,mt),Ce=new sx(U,wt,mt,me),$=new rg(U,pt,wt),he=new yg(U,pt,wt),wt.programs=ee.programs,P.capabilities=mt,P.extensions=pt,P.properties=De,P.renderLists=de,P.shadowMap=ce,P.state=me,P.info=wt}x!==en&&(N=new wg(x,t.width,t.height,o,s,r));let re=new Qc(P,U);this.xr=re,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){let b=pt.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=pt.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return ve},this.setPixelRatio=function(b){b!==void 0&&(ve=b,this.setSize(Me,Le,!1))},this.getSize=function(b){return b.set(Me,Le)},this.setSize=function(b,L,W=!0){if(re.isPresenting){Ie("WebGLRenderer: Can't change size while VR device is presenting.");return}Me=b,Le=L,t.width=Math.floor(b*ve),t.height=Math.floor(L*ve),W===!0&&(t.style.width=b+"px",t.style.height=L+"px"),N!==null&&N.setSize(t.width,t.height),this.setViewport(0,0,b,L)},this.getDrawingBufferSize=function(b){return b.set(Me*ve,Le*ve).floor()},this.setDrawingBufferSize=function(b,L,W){Me=b,Le=L,ve=W,t.width=Math.floor(b*W),t.height=Math.floor(L*W),this.setViewport(0,0,b,L)},this.setEffects=function(b){if(x===en){Be("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let L=0;L<b.length;L++)if(b[L].isOutputPass===!0){Ie("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}N.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(ie)},this.getViewport=function(b){return b.copy(Oe)},this.setViewport=function(b,L,W,F){b.isVector4?Oe.set(b.x,b.y,b.z,b.w):Oe.set(b,L,W,F),me.viewport(ie.copy(Oe).multiplyScalar(_n()).round())},this.getScissor=function(b){return b.copy(rt)},this.setScissor=function(b,L,W,F){b.isVector4?rt.set(b.x,b.y,b.z,b.w):rt.set(b,L,W,F),me.scissor(Ae.copy(rt).multiplyScalar(_n()).round())},this.getScissorTest=function(){return lt},this.setScissorTest=function(b){me.setScissorTest(lt=b)},this.setOpaqueSort=function(b){Ve=b},this.setTransparentSort=function(b){vt=b},this.getClearColor=function(b){return b.copy(C.getClearColor())},this.setClearColor=function(){C.setClearColor(...arguments)},this.getClearAlpha=function(){return C.getClearAlpha()},this.setClearAlpha=function(){C.setClearAlpha(...arguments)},this.clear=function(b=!0,L=!0,W=!0){let F=0;if(b){let k=!1;if(Q!==null){let fe=Q.texture.format;k=g.has(fe)}if(k){let fe=Q.texture.type,Se=m.has(fe),ue=C.getClearColor(),be=C.getClearAlpha(),Re=ue.r,Ge=ue.g,Je=ue.b;Se?(v[0]=Re,v[1]=Ge,v[2]=Je,v[3]=be,U.clearBufferuiv(U.COLOR,0,v)):(w[0]=Re,w[1]=Ge,w[2]=Je,w[3]=be,U.clearBufferiv(U.COLOR,0,w))}else F|=U.COLOR_BUFFER_BIT}L&&(F|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(F|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F!==0&&U.clear(F)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),O=b},this.dispose=function(){t.removeEventListener("webglcontextlost",Pe,!1),t.removeEventListener("webglcontextrestored",Xe,!1),t.removeEventListener("webglcontextcreationerror",_e,!1),C.dispose(),de.dispose(),Y.dispose(),ze.dispose(),De.dispose(),A.dispose(),se.dispose(),B.dispose(),le.dispose(),Ce.dispose(),ee.dispose(),re.dispose(),re.removeEventListener("sessionstart",mh),re.removeEventListener("sessionend",gh),Bi.stop()};function Pe(b){b.preventDefault(),Cc("WebGLRenderer: Context Lost."),D=!0}function Xe(){Cc("WebGLRenderer: Context Restored."),D=!1;let b=wt.autoReset,L=ce.enabled,W=ce.autoUpdate,F=ce.needsUpdate,k=ce.type;$e(),wt.autoReset=b,ce.enabled=L,ce.autoUpdate=W,ce.needsUpdate=F,ce.type=k}function _e(b){Be("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function at(b){let L=b.target;L.removeEventListener("dispose",at),Pt(L)}function Pt(b){_i(b),De.remove(b)}function _i(b){let L=De.get(b).programs;L!==void 0&&(L.forEach(function(W){ee.releaseProgram(W)}),b.isShaderMaterial&&ee.releaseShaderCache(b))}this.renderBufferDirect=function(b,L,W,F,k,fe){L===null&&(L=mn);let Se=k.isMesh&&k.matrixWorld.determinantAffine()<0,ue=pf(b,L,W,F,k);me.setMaterial(F,Se);let be=W.index,Re=1;if(F.wireframe===!0){if(be=B.getWireframeAttribute(W),be===void 0)return;Re=2}let Ge=W.drawRange,Je=W.attributes.position,we=Ge.start*Re,Ke=(Ge.start+Ge.count)*Re;fe!==null&&(we=Math.max(we,fe.start*Re),Ke=Math.min(Ke,(fe.start+fe.count)*Re)),be!==null?(we=Math.max(we,0),Ke=Math.min(Ke,be.count)):Je!=null&&(we=Math.max(we,0),Ke=Math.min(Ke,Je.count));let bt=Ke-we;if(bt<0||bt===1/0)return;le.setup(k,F,ue,W,be);let ht,ct=$;if(be!==null&&(ht=y.get(be),ct=he,ct.setIndex(ht)),k.isMesh)F.wireframe===!0?(me.setLineWidth(F.wireframeLinewidth*_n()),ct.setMode(U.LINES)):ct.setMode(U.TRIANGLES);else if(k.isLine){let Ht=F.linewidth;Ht===void 0&&(Ht=1),me.setLineWidth(Ht*_n()),k.isLineSegments?ct.setMode(U.LINES):k.isLineLoop?ct.setMode(U.LINE_LOOP):ct.setMode(U.LINE_STRIP)}else k.isPoints?ct.setMode(U.POINTS):k.isSprite&&ct.setMode(U.TRIANGLES);if(k.isBatchedMesh)if(pt.get("WEBGL_multi_draw"))ct.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let Ht=k._multiDrawStarts,Ee=k._multiDrawCounts,Yt=k._multiDrawCount,nt=be?y.get(be).bytesPerElement:1,ki=De.get(F).currentProgram.getUniforms();for(let Gt=0;Gt<Yt;Gt++)ki.setValue(U,"_gl_DrawID",Gt),ct.render(Ht[Gt]/nt,Ee[Gt])}else if(k.isInstancedMesh)ct.renderInstances(we,bt,k.count);else if(W.isInstancedBufferGeometry){let Ht=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Ee=Math.min(W.instanceCount,Ht);ct.renderInstances(we,bt,Ee)}else ct.render(we,bt)};function ph(b,L,W,F){O!==null&&b.isNodeMaterial&&O.setObject(F,b),Mt===!0&&Z.setState(b,W,!1),b.transparent===!0&&b.side===Nt&&b.forceSinglePass===!1?(b.side=kt,b.needsUpdate=!0,Js(b,L,F),b.side=Ui,b.needsUpdate=!0,Js(b,L,F),b.side=Nt):Js(b,L,F)}this.compile=function(b,L,W=null){W===null&&(W=b),O!==null&&O.renderStart(b,L,W),E=Y.get(W),E.init(L),M.push(E),W.traverseVisible(function(k){k.isLight&&k.layers.test(L.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),b!==W&&b.traverseVisible(function(k){k.isLight&&k.layers.test(L.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),E.setupLights(),O!==null&&O.updateLights(E.state.lightsArray),Qt=this.localClippingEnabled,Mt=Z.init(this.clippingPlanes,Qt),Mt===!0&&Z.setGlobalState(this.clippingPlanes,L),O!==null&&ce.render(E.state.shadowsArray,W,L);let F=new Set;return b.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let fe=k.material;if(fe)if(Array.isArray(fe))for(let Se=0;Se<fe.length;Se++){let ue=fe[Se];ph(ue,W,L,k),F.add(ue)}else ph(fe,W,L,k),F.add(fe)}),E=M.pop(),O!==null&&O.renderEnd(),F},this.compileAsync=function(b,L,W=null){let F=this.compile(b,L,W);return new Promise(k=>{function fe(){if(F.forEach(function(Se){let be=De.get(Se).currentProgram;(be===void 0||be.isReady())&&F.delete(Se)}),F.size===0){k(b);return}setTimeout(fe,10)}pt.get("KHR_parallel_shader_compile")!==null?fe():setTimeout(fe,10)})};let wl=null;function df(b){wl&&wl(b)}function mh(){Bi.stop()}function gh(){Bi.start()}let Bi=new gd;Bi.setAnimationLoop(df),typeof self<"u"&&Bi.setContext(self),this.setAnimationLoop=function(b){wl=b,re.setAnimationLoop(b),b===null?Bi.stop():Bi.start()},re.addEventListener("sessionstart",mh),re.addEventListener("sessionend",gh),this.render=function(b,L){if(L!==void 0&&L.isCamera!==!0){Be("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;O!==null&&O.renderStart(b,L);let W=re.enabled===!0&&re.isPresenting===!0,F=N!==null&&(Q===null||W)&&N.begin(P,Q);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),re.enabled===!0&&re.isPresenting===!0&&(N===null||N.isCompositing()===!1)&&(re.cameraAutoUpdate===!0&&re.updateCamera(L),L=re.getCamera()),b.isScene===!0&&b.onBeforeRender(P,b,L,Q),E=Y.get(b,M.length),E.init(L),E.state.textureUnits=ze.getTextureUnits(),M.push(E),_t.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),L.isArrayCamera?Ut.setFromArrayCamera(L):je.setFromProjectionMatrix(_t,bn,L.reversedDepth),Qt=this.localClippingEnabled,Mt=Z.init(this.clippingPlanes,Qt),T=de.get(b,_.length),T.init(),_.push(T),this.info.render.frame++,re.enabled===!0&&re.isPresenting===!0){let Se=P.xr.getDepthSensingMesh();Se!==null&&El(Se,L,-1/0,P.sortObjects)}El(b,L,0,P.sortObjects),T.finish(),O!==null&&O.updateLights(E.state.lightsArray),P.sortObjects===!0&&T.sort(Ve,vt),gn=re.enabled===!1||re.isPresenting===!1||re.hasDepthSensing()===!1,gn&&C.addToRenderList(T,b),this.info.autoReset===!0&&this.info.reset(),Mt===!0&&Z.beginShadows();let k=E.state.shadowsArray;if(ce.render(k,b,L),Mt===!0&&Z.endShadows(),(F&&N.hasRenderPass())===!1){let Se=T.opaque,ue=T.transmissive;if(E.setupLights(),L.isArrayCamera){let be=L.cameras;if(ue.length>0)for(let Re=0,Ge=be.length;Re<Ge;Re++){let Je=be[Re];xh(Se,ue,b,Je)}gn&&C.render(b);for(let Re=0,Ge=be.length;Re<Ge;Re++){let Je=be[Re];_h(T,b,Je,Je.viewport)}}else ue.length>0&&xh(Se,ue,b,L),gn&&C.render(b),_h(T,b,L)}Q!==null&&H===0&&(ze.updateMultisampleRenderTarget(Q),ze.updateRenderTargetMipmap(Q)),F&&N.end(P),b.isScene===!0&&b.onAfterRender(P,b,L),le.resetDefaultState(),G=-1,ne=null,M.pop(),M.length>0?(E=M[M.length-1],ze.setTextureUnits(E.state.textureUnits),Mt===!0&&Z.setGlobalState(P.clippingPlanes,E.state.camera)):E=null,_.pop(),_.length>0?T=_[_.length-1]:T=null,O!==null&&O.renderEnd()};function El(b,L,W,F){if(b.visible===!1)return;if(b.layers.test(L.layers)){if(b.isGroup)W=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(L);else if(b.isLight)E.pushLight(b),b.castShadow&&E.pushShadow(b);else if(b.isSprite){let Se=L.isArrayCamera?Ut:je;if(!b.frustumCulled||b.intersectsFrustum(Se)){F&&Ct.setFromMatrixPosition(b.matrixWorld).applyMatrix4(_t);let ue=se.update(b),be=b.material;be.visible&&T.push(b,ue,be,W,Ct.z,null,L)}}else if(b.isMesh||b.isLine||b.isPoints){let Se=L.isArrayCamera?Ut:je;if(!b.frustumCulled||b.intersectsFrustum(Se)){let ue=se.update(b),be=b.material;if(F&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Ct.copy(b.boundingSphere.center)):(ue.boundingSphere===null&&ue.computeBoundingSphere(),Ct.copy(ue.boundingSphere.center)),Ct.applyMatrix4(b.matrixWorld).applyMatrix4(_t)),Array.isArray(be)){let Re=ue.groups;for(let Ge=0,Je=Re.length;Ge<Je;Ge++){let we=Re[Ge],Ke=be[we.materialIndex];Ke&&Ke.visible&&T.push(b,ue,Ke,W,Ct.z,we,L)}}else be.visible&&T.push(b,ue,be,W,Ct.z,null,L)}}}let fe=b.children;for(let Se=0,ue=fe.length;Se<ue;Se++)El(fe[Se],L,W,F)}function _h(b,L,W,F){let{opaque:k,transmissive:fe,transparent:Se}=b;E.setupLightsView(W),Mt===!0&&Z.setGlobalState(P.clippingPlanes,W),F&&me.viewport(ie.copy(F)),k.length>0&&ra(k,L,W),fe.length>0&&ra(fe,L,W),Se.length>0&&ra(Se,L,W),me.buffers.depth.setTest(!0),me.buffers.depth.setMask(!0),me.buffers.color.setMask(!0),me.setPolygonOffset(!1)}function xh(b,L,W,F){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[F.id]===void 0){let we=pt.has("EXT_color_buffer_half_float")||pt.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[F.id]=new cn(1,1,{generateMipmaps:!0,type:we?Bn:en,minFilter:hi,samples:Math.max(4,mt.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Qe.workingColorSpace})}let fe=E.state.transmissionRenderTarget[F.id],Se=F.viewport||ie;fe.setSize(Se.z*P.transmissionResolutionScale,Se.w*P.transmissionResolutionScale);let ue=P.getRenderTarget(),be=P.getActiveCubeFace(),Re=P.getActiveMipmapLevel();P.setRenderTarget(fe),P.getClearColor(j),ye=P.getClearAlpha(),ye<1&&P.setClearColor(16777215,.5),P.clear(),gn&&C.render(W);let Ge=P.toneMapping;P.toneMapping=jn;let Je=F.viewport;if(F.viewport!==void 0&&(F.viewport=void 0),E.setupLightsView(F),Mt===!0&&Z.setGlobalState(P.clippingPlanes,F),ra(b,W,F),ze.updateMultisampleRenderTarget(fe),ze.updateRenderTargetMipmap(fe),pt.has("WEBGL_multisampled_render_to_texture")===!1){let we=!1;for(let Ke=0,bt=L.length;Ke<bt;Ke++){let ht=L[Ke],{object:ct,geometry:Ht,material:Ee,group:Yt}=ht;if(Ee.side===Nt&&ct.layers.test(F.layers)){let nt=Ee.side;Ee.side=kt,Ee.needsUpdate=!0,yh(ct,W,F,Ht,Ee,Yt),Ee.side=nt,Ee.needsUpdate=!0,we=!0}}we===!0&&(ze.updateMultisampleRenderTarget(fe),ze.updateRenderTargetMipmap(fe))}P.setRenderTarget(ue,be,Re),P.setClearColor(j,ye),Je!==void 0&&(F.viewport=Je),P.toneMapping=Ge}function ra(b,L,W){let F=L.isScene===!0?L.overrideMaterial:null;for(let k=0,fe=b.length;k<fe;k++){let Se=b[k],{object:ue,geometry:be,group:Re}=Se,Ge=Se.material;Ge.allowOverride===!0&&F!==null&&(Ge=F),ue.layers.test(W.layers)&&yh(ue,L,W,be,Ge,Re)}}function yh(b,L,W,F,k,fe){O!==null&&k.isNodeMaterial&&O.setObject(b,k),b.onBeforeRender(P,L,W,F,k,fe),b.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),k.onBeforeRender(P,L,W,F,b,fe),k.transparent===!0&&k.side===Nt&&k.forceSinglePass===!1?(k.side=kt,k.needsUpdate=!0,P.renderBufferDirect(W,L,F,k,b,fe),k.side=Ui,k.needsUpdate=!0,P.renderBufferDirect(W,L,F,k,b,fe),k.side=Nt):P.renderBufferDirect(W,L,F,k,b,fe),b.onAfterRender(P,L,W,F,k,fe)}function vh(b){let L=0;for(let W of b)W.texture!==null&&L++;return L}function Js(b,L,W){L.isScene!==!0&&(L=mn);let F=De.get(b),k=E.state.lights,fe=E.state.shadowsArray,Se=k.state.version,ue=ee.getParameters(b,k.state,fe,L,W,E.state.lightProbeGridArray),be=ee.getProgramCacheKey(ue),Re=F.programs;F.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?L.environment:null,F.fog=L.fog;let Ge=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;F.envMap=A.get(b.envMap||F.environment,Ge),F.envMapRotation=F.environment!==null&&b.envMap===null?L.environmentRotation:b.envMapRotation,Re===void 0&&(b.addEventListener("dispose",at),Re=new Map,F.programs=Re,F.programVariants=new Map);let Je=Re.get(be);if(Je!==void 0){if(F.currentProgram===Je&&F.lightsStateVersion===Se)return Sh(b,ue),Je}else ue.uniforms=ee.getUniforms(b),O!==null&&b.isNodeMaterial&&O.build(b,W,ue),b.onBeforeCompile(ue,P),Je=ee.acquireProgram(ue,be),Re.set(be,Je),F.uniforms=ue.uniforms;let we=F.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(we.clippingPlanes=Z.uniform),Sh(b,ue),F.needsLights=gf(b),F.lightsStateVersion=Se,F.needsLights&&(we.ambientLightColor.value=k.state.ambient,we.lightProbe.value=k.state.probe,we.sunLights.value=k.state.sun,we.sunLightShadows.value=k.state.sunShadow,we.directionalLights.value=k.state.directional,we.directionalLightShadows.value=k.state.directionalShadow,we.spotLights.value=k.state.spot,we.spotLightShadows.value=k.state.spotShadow,we.rectAreaLights.value=k.state.rectArea,we.ltc_1.value=k.state.rectAreaLTC1,we.ltc_2.value=k.state.rectAreaLTC2,we.pointLights.value=k.state.point,we.pointLightShadows.value=k.state.pointShadow,we.hemisphereLights.value=k.state.hemi,we.sunShadowMatrix.value=k.state.sunShadowMatrix,we.sunShadowCascade.value=k.state.sunShadowCascade,we.directionalShadowMatrix.value=k.state.directionalShadowMatrix,we.spotLightMatrix.value=k.state.spotLightMatrix,we.spotLightMap.value=k.state.spotLightMap,we.pointShadowMatrix.value=k.state.pointShadowMatrix),F.numLightProbeGrids=vh(E.state.lightProbeGridArray),F.currentProgram=Je,F.uniformsList=null,Je}function ff(b,L,W,F,k){let fe=De.get(b),Se=fe.currentProgram.id+","+F+","+k,ue=fe.programVariants.get(Se);return ue===void 0?(ue=Js(b,L,W),fe.programVariants.set(Se,ue)):(fe.currentProgram=ue,fe.uniformsList=null,fe.outputColorSpace=F,fe.toneMapping=k),ue}function bh(b){if(b.uniformsList===null){let L=b.currentProgram.getUniforms();b.uniformsList=Gs.seqWithValue(L.seq,b.uniforms)}return b.uniformsList}function Sh(b,L){let W=De.get(b);W.outputColorSpace=L.outputColorSpace,W.batching=L.batching,W.batchingColor=L.batchingColor,W.instancing=L.instancing,W.instancingColor=L.instancingColor,W.instancingMorph=L.instancingMorph,W.skinning=L.skinning,W.morphTargets=L.morphTargets,W.morphNormals=L.morphNormals,W.morphColors=L.morphColors,W.morphTargetsCount=L.morphTargetsCount,W.numClippingPlanes=L.numClippingPlanes,W.numIntersection=L.numClipIntersection,W.vertexAlphas=L.vertexAlphas,W.vertexTangents=L.vertexTangents,W.toneMapping=L.toneMapping}function pf(b,L,W,F,k){L.isScene!==!0&&(L=mn),ze.resetTextureUnits();let fe=L.fog,Se=F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial?L.environment:null,ue=Q===null?P.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:Qe.workingColorSpace,be=F.isMeshStandardMaterial||F.isMeshLambertMaterial&&!F.envMap||F.isMeshPhongMaterial&&!F.envMap,Re=A.get(F.envMap||Se,be),Ge=F.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Je=!!W.attributes.tangent&&(!!F.normalMap||F.anisotropy>0),we=!!W.morphAttributes.position,Ke=!!W.morphAttributes.normal,bt=!!W.morphAttributes.color,ht=jn;F.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(ht=P.toneMapping);let ct=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Ht=ct!==void 0?ct.length:0,Ee=De.get(F),Yt=E.state.lights;if(Mt===!0&&(Qt===!0||b!==ne)){let xt=b===ne&&F.id===G;Z.setState(F,b,xt)}let nt=!1,ki=!1;F.version===Ee.__version?Ee.needsLights&&Ee.lightsStateVersion!==Yt.state.version||k.isBatchedMesh&&Ee.batching===!1||!k.isBatchedMesh&&Ee.batching===!0||k.isBatchedMesh&&Ee.batchingColor===!0&&k._colorsTexture===null||k.isBatchedMesh&&Ee.batchingColor===!1&&k._colorsTexture!==null||k.isInstancedMesh&&Ee.instancing===!1||!k.isInstancedMesh&&Ee.instancing===!0||k.isSkinnedMesh&&Ee.skinning===!1||!k.isSkinnedMesh&&Ee.skinning===!0||k.isInstancedMesh&&Ee.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&Ee.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&Ee.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&Ee.instancingMorph===!1&&k.morphTexture!==null||Ee.envMap!==Re||F.fog===!0&&Ee.fog!==fe||Ee.numClippingPlanes!==void 0&&(Ee.numClippingPlanes!==Z.numPlanes||Ee.numIntersection!==Z.numIntersection)||Ee.vertexAlphas!==Ge||Ee.vertexTangents!==Je||Ee.morphTargets!==we||Ee.morphNormals!==Ke||Ee.morphColors!==bt||Ee.morphTargetsCount!==Ht||Ee.numLightProbeGrids!==vh(E.state.lightProbeGridArray)?nt=!0:(Ee.outputColorSpace!==ue||Ee.toneMapping!==ht)&&(ki=!0):(nt=!0,Ee.__version=F.version);let Gt=Ee.currentProgram;(nt===!0||ki===!0)&&(Gt=ki===!0?ff(F,L,k,ue,ht):Js(F,L,k),O&&F.isNodeMaterial&&O.onUpdateProgram(F,Gt,Ee));let aa=!1,xi=!1,zi=!1,et=Gt.getUniforms(),Ot=Ee.uniforms;if(me.useProgram(Gt.program)&&(aa=!0,xi=!0,zi=!0),F.id!==G&&(G=F.id,xi=!0),aa||ne!==b){me.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),et.setValue(U,"projectionMatrix",b.projectionMatrix),et.setValue(U,"viewMatrix",b.matrixWorldInverse);let It=et.map.cameraPosition;It!==void 0&&It.setValue(U,Vn.setFromMatrixPosition(b.matrixWorld)),mt.logarithmicDepthBuffer&&et.setValue(U,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(F.isMeshPhongMaterial||F.isMeshToonMaterial||F.isMeshLambertMaterial||F.isMeshBasicMaterial||F.isMeshStandardMaterial||F.isShaderMaterial)&&et.setValue(U,"isOrthographic",b.isOrthographicCamera===!0),ne!==b&&(ne=b,xi=!0,zi=!0)}if(Ee.needsLights&&(Yt.state.sunShadowMap.length>0&&et.setValue(U,"sunShadowMap",Yt.state.sunShadowMap,ze),Yt.state.directionalShadowMap.length>0&&et.setValue(U,"directionalShadowMap",Yt.state.directionalShadowMap,ze),Yt.state.spotShadowMap.length>0&&et.setValue(U,"spotShadowMap",Yt.state.spotShadowMap,ze),Yt.state.pointShadowMap.length>0&&et.setValue(U,"pointShadowMap",Yt.state.pointShadowMap,ze)),k.isSkinnedMesh){et.setOptional(U,k,"bindMatrix"),et.setOptional(U,k,"bindMatrixInverse");let xt=k.skeleton;xt&&(xt.boneTexture===null&&xt.computeBoneTexture(),et.setValue(U,"boneTexture",xt.boneTexture,ze))}k.isBatchedMesh&&(et.setOptional(U,k,"batchingTexture"),et.setValue(U,"batchingTexture",k._matricesTexture,ze),et.setOptional(U,k,"batchingIdTexture"),et.setValue(U,"batchingIdTexture",k._indirectTexture,ze),et.setOptional(U,k,"batchingColorTexture"),k._colorsTexture!==null&&et.setValue(U,"batchingColorTexture",k._colorsTexture,ze));let Cn=W.morphAttributes;if((Cn.position!==void 0||Cn.normal!==void 0||Cn.color!==void 0)&&J.update(k,W,Gt),(xi||Ee.receiveShadow!==k.receiveShadow)&&(Ee.receiveShadow=k.receiveShadow,et.setValue(U,"receiveShadow",k.receiveShadow)),(F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial)&&F.envMap===null&&L.environment!==null&&(Ot.envMapIntensity.value=L.environmentIntensity),Ot.dfgLUT!==void 0&&(Ot.dfgLUT.value=ax()),xi){if(et.setValue(U,"toneMappingExposure",P.toneMappingExposure),Ee.needsLights&&mf(Ot,zi),fe&&F.fog===!0&&oe.refreshFogUniforms(Ot,fe),oe.refreshMaterialUniforms(Ot,F,ve,Le,E.state.transmissionRenderTarget[b.id]),Ee.needsLights&&Ee.numLightProbeGrids>0){let xt=S,It=0;for(let Qn of E.state.lightProbeGridArray)Qn.texture!==null&&(xt.textures[It]=Qn.texture,xt.min[It]=Qn.boundingBox.min,xt.max[It]=Qn.boundingBox.max,xt.resolution[It]=Qn.resolution,It++);for(let Qn in xt)xt[Qn].length=It;Ot.probesSH.value=xt.textures,Ot.probesMin.value=xt.min,Ot.probesMax.value=xt.max,Ot.probesResolution.value=xt.resolution}Gs.upload(U,bh(Ee),Ot,ze)}if(F.isShaderMaterial&&F.uniformsNeedUpdate===!0&&(Gs.upload(U,bh(Ee),Ot,ze),F.uniformsNeedUpdate=!1),F.isSpriteMaterial&&et.setValue(U,"center",k.center),et.setValue(U,"modelViewMatrix",k.modelViewMatrix),et.setValue(U,"normalMatrix",k.normalMatrix),et.setValue(U,"modelMatrix",k.matrixWorld),F.uniformsGroups!==void 0){let xt=F.uniformsGroups;for(let It=0,Qn=xt.length;It<Qn;It++){let wh=xt[It];Ce.update(wh,Gt),Ce.bind(wh,Gt)}}return Gt}function mf(b,L){b.ambientLightColor.needsUpdate=L,b.lightProbe.needsUpdate=L,b.sunLights.needsUpdate=L,b.sunLightShadows.needsUpdate=L,b.directionalLights.needsUpdate=L,b.directionalLightShadows.needsUpdate=L,b.pointLights.needsUpdate=L,b.pointLightShadows.needsUpdate=L,b.spotLights.needsUpdate=L,b.spotLightShadows.needsUpdate=L,b.rectAreaLights.needsUpdate=L,b.hemisphereLights.needsUpdate=L}function gf(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return q},this.getActiveMipmapLevel=function(){return H},this.getRenderTarget=function(){return Q},this.setRenderTargetTextures=function(b,L,W){let F=De.get(b);F.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,F.__autoAllocateDepthBuffer===!1&&(F.__useRenderToTexture=!1),De.get(b.texture).__webglTexture=L,De.get(b.depthTexture).__webglTexture=F.__autoAllocateDepthBuffer?void 0:W,F.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,L){let W=De.get(b);W.__webglFramebuffer=L,W.__useDefaultFramebuffer=L===void 0},this.setRenderTarget=function(b,L=0,W=0){Q=b,q=L,H=W;let F=null,k=!1,fe=!1;if(b){let ue=De.get(b);if(ue.__useDefaultFramebuffer!==void 0){me.bindFramebuffer(U.FRAMEBUFFER,ue.__webglFramebuffer),ie.copy(b.viewport),Ae.copy(b.scissor),He=b.scissorTest,me.viewport(ie),me.scissor(Ae),me.setScissorTest(He),G=-1;return}else if(ue.__webglFramebuffer===void 0)ze.setupRenderTarget(b);else if(ue.__hasExternalTextures)ze.rebindTextures(b,De.get(b.texture).__webglTexture,De.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let Ge=b.depthTexture;if(ue.__boundDepthTexture!==Ge){if(Ge!==null&&De.has(Ge)&&(b.width!==Ge.image.width||b.height!==Ge.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");ze.setupDepthRenderbuffer(b)}}let be=b.texture;(be.isData3DTexture||be.isDataArrayTexture||be.isCompressedArrayTexture)&&(fe=!0);let Re=De.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Re[L])?F=Re[L][W]:F=Re[L],k=!0):b.samples>0&&ze.useMultisampledRTT(b)===!1?F=De.get(b).__webglMultisampledFramebuffer:Array.isArray(Re)?F=Re[W]:F=Re,ie.copy(b.viewport),Ae.copy(b.scissor),He=b.scissorTest}else ie.copy(Oe).multiplyScalar(ve).floor(),Ae.copy(rt).multiplyScalar(ve).floor(),He=lt;if(W!==0&&(F=V),me.bindFramebuffer(U.FRAMEBUFFER,F)&&me.drawBuffers(b,F),me.viewport(ie),me.scissor(Ae),me.setScissorTest(He),k){let ue=De.get(b.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+L,ue.__webglTexture,W)}else if(fe){let ue=L;for(let be=0;be<b.textures.length;be++){let Re=De.get(b.textures[be]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+be,Re.__webglTexture,W,ue)}}else if(b!==null&&W!==0){let ue=De.get(b.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,ue.__webglTexture,W)}G=-1};function Mh(b){let L=De.get(b);return(L.__readFormat!==b.format||L.__readType!==b.type)&&(L.__readFormat=b.format,L.__readType=b.type,L.__formatReadable=mt.textureFormatReadable(b.format),L.__typeReadable=mt.textureTypeReadable(b.type)),L}this.readRenderTargetPixels=function(b,L,W,F,k,fe,Se,ue=0){if(!(b&&b.isWebGLRenderTarget)){Be("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let be=De.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Se!==void 0&&(be=be[Se],Array.isArray(be)&&(be=be[0])),be){me.bindFramebuffer(U.FRAMEBUFFER,be);try{let Re=b.textures[ue],Ge=Re.format,Je=Re.type;b.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ue);let we=Mh(Re);if(we.__formatReadable===!1){Be("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(we.__typeReadable===!1){Be("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=b.width-F&&W>=0&&W<=b.height-k&&U.readPixels(L,W,F,k,ae.convert(Ge),ae.convert(Je),fe)}finally{let Re=Q!==null?De.get(Q).__webglFramebuffer:null;me.bindFramebuffer(U.FRAMEBUFFER,Re)}}},this.readRenderTargetPixelsAsync=async function(b,L,W,F,k,fe,Se,ue=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let be=De.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Se!==void 0&&(be=be[Se],Array.isArray(be)&&(be=be[0])),be)if(L>=0&&L<=b.width-F&&W>=0&&W<=b.height-k){me.bindFramebuffer(U.FRAMEBUFFER,be);let Re=b.textures[ue],Ge=Re.format,Je=Re.type;b.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ue);let we=Mh(Re);if(we.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(we.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Ke=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Ke),U.bufferData(U.PIXEL_PACK_BUFFER,fe.byteLength,U.STREAM_READ),U.readPixels(L,W,F,k,ae.convert(Ge),ae.convert(Je),0),U.bindBuffer(U.PIXEL_PACK_BUFFER,null);let bt=Q!==null?De.get(Q).__webglFramebuffer:null;me.bindFramebuffer(U.FRAMEBUFFER,bt);let ht=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await Hu(U,ht,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Ke),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,fe),U.bindBuffer(U.PIXEL_PACK_BUFFER,null),U.deleteBuffer(Ke),U.deleteSync(ht),fe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,L=null,W=0){let F=Math.pow(2,-W),k=Math.floor(b.image.width*F),fe=Math.floor(b.image.height*F),Se=L!==null?L.x:0,ue=L!==null?L.y:0;ze.setTexture2D(b,0),U.copyTexSubImage2D(U.TEXTURE_2D,W,0,0,Se,ue,k,fe),me.unbindTexture()},this.copyTextureToTexture=function(b,L,W=null,F=null,k=0,fe=0){let Se,ue,be,Re,Ge,Je,we,Ke,bt,ht=b.isCompressedTexture?b.mipmaps[fe]:b.image;if(W!==null)Se=W.max.x-W.min.x,ue=W.max.y-W.min.y,be=W.isBox3?W.max.z-W.min.z:1,Re=W.min.x,Ge=W.min.y,Je=W.isBox3?W.min.z:0;else{let et=Math.pow(2,-k);Se=Math.floor(ht.width*et),ue=Math.floor(ht.height*et),b.isDataArrayTexture?be=ht.depth:b.isData3DTexture?be=Math.floor(ht.depth*et):be=1,Re=0,Ge=0,Je=0}F!==null?(we=F.x,Ke=F.y,bt=F.z):(we=0,Ke=0,bt=0);let ct=ae.convert(L.format),Ht=ae.convert(L.type),Ee;L.isData3DTexture?(ze.setTexture3D(L,0),Ee=U.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(ze.setTexture2DArray(L,0),Ee=U.TEXTURE_2D_ARRAY):(ze.setTexture2D(L,0),Ee=U.TEXTURE_2D),me.activeTexture(U.TEXTURE0),me.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,L.flipY),me.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),me.pixelStorei(U.UNPACK_ALIGNMENT,L.unpackAlignment);let Yt=me.getParameter(U.UNPACK_ROW_LENGTH),nt=me.getParameter(U.UNPACK_IMAGE_HEIGHT),ki=me.getParameter(U.UNPACK_SKIP_PIXELS),Gt=me.getParameter(U.UNPACK_SKIP_ROWS),aa=me.getParameter(U.UNPACK_SKIP_IMAGES);me.pixelStorei(U.UNPACK_ROW_LENGTH,ht.width),me.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ht.height),me.pixelStorei(U.UNPACK_SKIP_PIXELS,Re),me.pixelStorei(U.UNPACK_SKIP_ROWS,Ge),me.pixelStorei(U.UNPACK_SKIP_IMAGES,Je);let xi=b.isDataArrayTexture||b.isData3DTexture,zi=L.isDataArrayTexture||L.isData3DTexture;if(b.isDepthTexture){let et=De.get(b),Ot=De.get(L),Cn=De.get(et.__renderTarget),xt=De.get(Ot.__renderTarget);me.bindFramebuffer(U.READ_FRAMEBUFFER,Cn.__webglFramebuffer),me.bindFramebuffer(U.DRAW_FRAMEBUFFER,xt.__webglFramebuffer);for(let It=0;It<be;It++)xi&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,De.get(b).__webglTexture,k,Je+It),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,De.get(L).__webglTexture,fe,bt+It)),U.blitFramebuffer(Re,Ge,Re+Se,Ge+ue,we,Ke,we+Se,Ke+ue,U.DEPTH_BUFFER_BIT,U.NEAREST);me.bindFramebuffer(U.READ_FRAMEBUFFER,null),me.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(k!==0||b.isRenderTargetTexture||De.has(b)){let et=De.get(b),Ot=De.get(L);me.bindFramebuffer(U.READ_FRAMEBUFFER,I),me.bindFramebuffer(U.DRAW_FRAMEBUFFER,X);for(let Cn=0;Cn<be;Cn++)xi?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,et.__webglTexture,k,Je+Cn):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,et.__webglTexture,k),zi?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Ot.__webglTexture,fe,bt+Cn):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Ot.__webglTexture,fe),k!==0?U.blitFramebuffer(Re,Ge,Re+Se,Ge+ue,we,Ke,we+Se,Ke+ue,U.COLOR_BUFFER_BIT,U.NEAREST):zi?U.copyTexSubImage3D(Ee,fe,we,Ke,bt+Cn,Re,Ge,Se,ue):U.copyTexSubImage2D(Ee,fe,we,Ke,Re,Ge,Se,ue);me.bindFramebuffer(U.READ_FRAMEBUFFER,null),me.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else zi?b.isDataTexture||b.isData3DTexture?U.texSubImage3D(Ee,fe,we,Ke,bt,Se,ue,be,ct,Ht,ht.data):L.isCompressedArrayTexture?U.compressedTexSubImage3D(Ee,fe,we,Ke,bt,Se,ue,be,ct,ht.data):U.texSubImage3D(Ee,fe,we,Ke,bt,Se,ue,be,ct,Ht,ht):b.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,fe,we,Ke,Se,ue,ct,Ht,ht.data):b.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,fe,we,Ke,ht.width,ht.height,ct,ht.data):U.texSubImage2D(U.TEXTURE_2D,fe,we,Ke,Se,ue,ct,Ht,ht);me.pixelStorei(U.UNPACK_ROW_LENGTH,Yt),me.pixelStorei(U.UNPACK_IMAGE_HEIGHT,nt),me.pixelStorei(U.UNPACK_SKIP_PIXELS,ki),me.pixelStorei(U.UNPACK_SKIP_ROWS,Gt),me.pixelStorei(U.UNPACK_SKIP_IMAGES,aa),fe===0&&L.generateMipmaps===!0&&L.mipmapsAutoUpdate===!0&&U.generateMipmap(Ee),me.unbindTexture()},this.initRenderTarget=function(b){De.get(b).__webglFramebuffer===void 0&&ze.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?ze.setTextureCube(b,0):b.isData3DTexture?ze.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?ze.setTexture2DArray(b,0):ze.setTexture2D(b,0),me.unbindTexture()},this.resetState=function(){q=0,H=0,Q=null,me.reset(),le.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Qe._getUnpackColorSpace()}};var Fi=[128,64,32,16,8,4,2,1],eh=32767,ox=1e3,th=["none","bad_crc","foreign_address","sensor_fault"],$s=3,lx=8;function Ad(i){let e=65535;for(let t of i){e^=t;for(let n=0;n<8;n++)e=e&1?e>>>1^40961:e>>>1}return e}var Xs=i=>{let e=Ad(i);return[...i,e&255,e>>>8]},Rd=i=>i.length>=4&&Ad(i.slice(0,-2))===(i[i.length-2]|i[i.length-1]<<8),ll=i=>i?i.map(e=>e.toString(16).toUpperCase().padStart(2,"0")).join(" "):null,cx=i=>i?i.split(" ").map(e=>parseInt(e,16)):null;function jr(i){if(i.length!==8||i.some(e=>e!==0&&e!==1))throw new Error("DIP state must be 8 values of 0 or 1.");return i.reduce((e,t,n)=>e+(t?Fi[n]:0),0)}var tn=i=>Fi.map(e=>i&e?1:0);function Cd(i,e=0,t=2){if(i<1||i>247)throw new Error("Master polling address must be 1..247.");return Xs([i,$s,e>>8,e&255,t>>8,t&255])}var dn=class{constructor(e,t=23.4,n=57.8){this.dipBits=[...e],this.temperatureC=t,this.humidityRh=n,this.baud=9600,this.elementFault=!1}get address(){return jr(this.dipBits)}registers(){let e=this.elementFault?eh:Math.round(this.temperatureC*10)&65535,t=this.elementFault?eh:Math.round(this.humidityRh*10);return[e,t,0,0,this.address,this.baud,1536,10]}transact(e){if(e.length<4||!Rd(e))return null;let[t,n]=e;if(t===0||t!==this.address)return null;if(n!==$s)return Xs([t,n|128,1]);if(e.length!==8)return Xs([t,131,3]);let s=e[2]<<8|e[3],r=e[4]<<8|e[5];if(r<1||s+r>lx)return Xs([t,131,2]);let a=this.registers().slice(s,s+r).flatMap(o=>[o>>8&255,o&255]);return Xs([t,$s,a.length,...a])}};function hx(i,e,t=0,n=2){let s=[],r=(p,x,g)=>(s.push({check:p,ok:!!x,detail:g}),x),a={status:"invalid",valid:!1,checks:s,values:null,exception:null},o=p=>"0x"+p.toString(16).toUpperCase().padStart(2,"0");if(i===null)return r("response",!1,`No reply within ${ox} ms`),a.status="timeout",a;if(!r("length",i.length>=5,`${i.length} bytes`))return a;let l=Rd(i);if(!r("crc",l,"CRC-16/MODBUS "+(l?"matches":"mismatch"))||!r("address",i[0]===e,`${o(i[0])} (expected ${o(e)})`))return a;if(i[1]===($s|128))return r("function",!1,`Exception ${o(i[2])}`),Object.assign(a,{status:"exception",exception:i[2]});if(!r("function",i[1]===$s,o(i[1])))return a;let c=2*n;if(!r("byte_count",i[2]===c&&i.length===5+c,`${i[2]} data bytes (expected ${c})`))return a;let h={};for(let p=0;p<n;p++)h[t+p]=i[3+2*p]<<8|i[4+2*p];let d=[0,1].filter(p=>h[p]===eh);if(!r("sensor_marker",!d.length,d.length?"7FFF H on register "+d.join(", "):"no 7FFF H marker"))return a.status="sensor_abnormal",a;let f={},u=p=>Math.round(p)/10;return 0 in h&&(f.temperature_c=u(h[0]&32768?h[0]-65536:h[0])),1 in h&&(f.humidity_rh=u(h[1])),Object.assign(a,{status:"valid",valid:!0,values:f})}function fn(i,e,t="none",n=0,s=2){if(!th.includes(t))throw new Error("Unknown injection.");let r=Cd(i,n,s),a=e.elementFault;t==="sensor_fault"&&(e.elementFault=!0);let o;try{o=e.transact(r)}finally{e.elementFault=a}return o&&t==="bad_crc"&&(o=[...o.slice(0,-1),o[o.length-1]^90]),o&&t==="foreign_address"&&(o=Xs([o[0]%247+1,...o.slice(1,-2)])),{source:"simulated",master_address:i,device_address:e.address,injection:t,request_hex:ll(r),response_hex:ll(o),decode:hx(o,i,n,s)}}function Pd(i,e){let t=cx(i);return t?t.map((n,s)=>{let r="data";return s===0?r="addr":s===1?r="fn":s>=t.length-2?r="crc":e==="response"&&s===2&&t[1]===$s&&(r="count"),{hex:n.toString(16).toUpperCase().padStart(2,"0"),role:r}}):[]}function Id(i){let e=[],t=new dn(tn(1),25,60),n=Cd(1,0,8);ll(n)!==i.manual_request&&e.push("manual request"),ll(t.transact(n))!==i.manual_response&&e.push("manual response");let s={incident:()=>fn(1,new dn(tn(2))),fixed:()=>fn(1,new dn(tn(1))),bad_crc:()=>fn(1,new dn(tn(1)),"bad_crc"),foreign_address:()=>fn(1,new dn(tn(1)),"foreign_address"),sensor_fault:()=>fn(1,new dn(tn(1)),"sensor_fault")};for(let[r,a]of Object.entries(s)){let o=a(),l=i[r];(!l||o.request_hex!==l.request_hex||o.response_hex!==l.response_hex||o.decode.status!==l.decode.status||JSON.stringify(o.decode.values)!==JSON.stringify(l.decode.values))&&e.push(r)}return{ok:e.length===0,cases:2+Object.keys(s).length,failures:e}}var Ld=()=>new Date().toISOString().replace(/\.\d+Z$/,"+00:00"),Dd=i=>String(i).toUpperCase().replace(/-/g," ").split(/\s+/).filter(Boolean).join(" "),qt=class extends Error{},cl=class{constructor(e){this.b=e,this.n=0,this.events=[],this.identity=null,this.resetCase()}event(e,t,n){let s="EV-"+String(++this.n).padStart(4,"0");return this.events.push({event_id:s,at:Ld(),tool:e,summary:t,source:n}),s}pins(){let e=this.b;return{asset_id:this.identity?.asset_id??null,product_id:this.identity?.product_id??null,catalog_version:e.catalog_version,rules_version:{diagnosis:e.rules_versions.diagnosis,loop:e.rules_versions.loop},last_event_id:this.events.at(-1)?.event_id??null,source_status:Object.fromEntries(Object.entries(e.documents).map(([t,n])=>[t,n.validity]))}}resetCase(){let e=this.b.incident;this.master=e.master_address,this.model=new dn(tn(e.device_address),e.temperature_c,e.humidity_rh)}busState(){return{source:"simulated",master_address:this.master,device_address:this.model.address,dip_bits:[...this.model.dipBits]}}requireIdentity(){if(!this.identity)throw new qt("No confirmed asset in this session. Run capture_frame and confirm_asset first.")}findProduct(e){let t=Dd(e);return Object.values(this.b.products).find(n=>[n.model,...n.aliases].some(s=>Dd(s)===t))||null}capture_frame({source:e="simulated"}={}){if(e==="uvc")throw new qt("UVC capture is not integrated in this build (planned: FieldScan camera adapter).");if(e!=="simulated")throw new qt("source must be 'simulated' or 'uvc'.");let t=this.b.assets["BOAT-ER-TH-02"],n=this.event("capture_frame","Simulated frame of the engine-room bulkhead","simulated");return{frame_id:"FRAME-"+n,source:"simulated",kind:"html_scene",captured_at:Ld(),plate_text:t.plate_lines,asset_hint:t.asset_id,event_id:n}}confirm_asset({model:e,variant:t=null,id_source:n="plate_simulated",confirmed:s=!1,asset_id:r="BOAT-ER-TH-02"}={}){let a=this.findProduct(e),o=this.b.assets[r];if(!o)throw new qt("Unknown asset_id.");if(!a){let h=this.event("confirm_asset",`Model '${e}' not in catalog`,"documented");return{status:"insufficient_evidence",missing:`Model '${e}' is not in catalog ${this.b.catalog_version}.`,event_id:h}}if(a.product_id!==o.expected_product){let h=this.event("confirm_asset","Model does not match the installed asset record","documented");return{status:"insufficient_evidence",missing:`${a.model} does not match the record for ${r}. Confirm the asset.`,event_id:h}}let l=a.variant_fields.filter(h=>!(t&&h==="Order variant"));this.identity={asset_id:r,product_id:a.product_id,model:a.model,variant:t,id_source:n,confirmed:!!s,status:s?"confirmed":"needs_confirmation",pending_fields:l};let c=this.event("confirm_asset",`${a.model} \xB7 ${this.identity.status}`,n==="uvc"?"observed":"simulated");return{...this.identity,event_id:c,pins:this.pins()}}get_document({product_id:e=null,doc_type:t="user_manual",catalog_version:n=null,section:s=null}={}){if(n&&n!==this.b.catalog_version){let c=this.event("get_document","Catalog version mismatch","documented");return{status:"insufficient_evidence",missing:`Catalog ${n} requested; this package holds ${this.b.catalog_version}.`,event_id:c}}e===null&&(this.requireIdentity(),e=this.identity.product_id);let r=this.b.products[e];if(!r)throw new qt("Unknown product_id.");let a=r.document_ids.map(c=>this.b.documents[c]).find(c=>c.type===t);if(!a){let c=this.event("get_document",`No ${t} for ${e}`,"documented");return{status:"insufficient_evidence",missing:`No ${t} in the package for ${r.model}.`,event_id:c}}if(s!==null&&!(s in a.sections))throw new qt(`Section ${s} is not in ${a.id}.`);let o=this.event("get_document",`${a.id} \xA7 ${s||"all"}`,"documented");return{status:"ok",source:"documented",document:Object.fromEntries(["id","title","edition","date","origin","url","validity","validity_note"].map(c=>[c,a[c]])),sections:s?{[s]:a.sections[s]}:a.sections,event_id:o}}get_asset_status({transport:e="simulated_rtu",injection:t="none"}={}){if(this.requireIdentity(),e==="rtu_bench")return{source:"no_evidence",reading:null,detail:"No bench RS-485 reader in this build.",event_id:this.event("get_asset_status","Bench reader not connected","observed")};if(e!=="simulated_rtu")throw new qt("transport must be 'simulated_rtu' or 'rtu_bench'.");if(!th.includes(t))throw new qt("Unknown injection.");let n=fn(this.master,this.model,t),s=this.event("get_asset_status",`Poll addr ${this.master}: ${n.decode.status}`,"simulated");return{source:"simulated",reading:n.decode.values,transaction:n,event_id:s}}simulate_fault({scenario:e="address_mismatch",dip_bits:t=null}={}){this.requireIdentity();let n=fn(this.master,this.model),s;if(e==="reset"||e==="address_mismatch")this.resetCase(),s=`Incident restored: master polls ${this.master}, DIP set to ${this.model.address}.`;else if(e==="dip_fix")this.model.dipBits=tn(this.master),s=`DIP set to ${this.master} (switch 8 ON, others OFF) inside the simulation.`;else if(e==="set_dip"){let o;try{o=jr(t||[])}catch(l){throw new qt(l.message)}this.model.dipBits=[...t],s=`DIP set to address ${o} inside the simulation.`}else if(["bad_crc","foreign_address","sensor_fault"].includes(e)){let o=fn(this.master,this.model,e),l=this.event("simulate_fault",`Injected ${e}: ${o.decode.status}`,"simulated");return{source:"simulated",scenario:e,before:n,action:`One reply with ${e}.`,after:o,event_id:l}}else throw new qt("scenario must be address_mismatch, dip_fix, set_dip, bad_crc, foreign_address, sensor_fault or reset.");let r=fn(this.master,this.model),a=this.event("simulate_fault",s,"simulated");return{source:"simulated",scenario:e,before:n,action:s,after:r,event_id:a}}check_replacement({candidate:e="eh-fmx11",voltage:t=24,revision:n="v1",scenario:s="nominal",rules_version:r=this.b.rules_versions.loop}={}){if(r!==this.b.rules_versions.loop){let h=this.event("check_replacement","Rules version mismatch","documented");return{status:"insufficient_evidence",missing:`Rules ${r} requested; the engine runs ${this.b.rules_versions.loop}.`,event_id:h}}if(e!=="eh-fmx11"){let h=this.event("check_replacement",`No profile for ${e}`,"documented");return{status:"insufficient_evidence",missing:`No evaluated profile for candidate ${e}.`,event_id:h}}let a=this.b.reports[`${t}:${n}:${s}`];if(!a)throw new qt("Combination not available in this file.");let o=a.load_check,l=[{criterion:"signal_type",status:"pass",detail:"Reference and candidate are 4\u201320 mA.",source_ids:["WIKA-LS10","EH-TI01524P"]},{criterion:"loop_load",status:o.status,margin_ohm:o.margin_ohm,detail:`${o.evaluated_ohm} \u03A9 evaluated vs ${o.available_ohm} \u03A9 available at ${t} V.`,source_ids:o.source_ids},{criterion:"range_and_scaling",status:"pending",detail:"Order codes, range and scaling not confirmed.",source_ids:[]},{criterion:"materials_mounting_approvals",status:"pending",detail:"Materials, mounting, cable and approvals not confirmed.",source_ids:[]}],c=this.event("check_replacement",`FMX11 at ${t} V/${n}: ${a.replacement_status}`,"documented");return{status:a.replacement_status,candidate:e,criteria:l,rules_version:this.b.rules_versions.loop,report:a,event_id:c}}};var Nd=document.getElementById("embedded-bundle"),os=Nd?JSON.parse(Nd.textContent):null,ls=os?"portable":"server",pi=os,fi=os?new cl(os):null,Od={pins:null,events:[],identity:null,bus:null};async function Fd(){if(pi)return pi;let i=await fetch("/api/bundle");if(!i.ok)throw new Error("Could not load the data bundle from the local server.");return pi=await i.json(),pi}async function Bd(){try{let i=await fetch("/api/session",{cache:"no-store"});i.ok&&(Od=await i.json())}catch{}}async function kd(){return fi||await Bd(),Jr()}async function Tn(i,e={}){if(fi){if(typeof fi[i]!="function")throw new qt(`Unknown tool ${i}.`);return fi[i](e)}let t=await fetch("/api/tools/"+i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),n=await t.json();if(await Bd(),!t.ok)throw new qt(n.error||`Tool ${i} failed.`);return n}function Jr(){return fi?{pins:fi.pins(),events:fi.events,identity:fi.identity,bus:fi.busState()}:Od}async function zd({voltage:i,revision:e,scenario:t}){if(pi?.reports&&ls==="portable"){let r=pi.reports[`${i}:${e}:${t}`];if(!r)throw new Error("Combination not available in this file.");return r}let n=new URLSearchParams({voltage:i,revision:e,scenario:t}),s=await fetch("/api/check?"+n);if(!s.ok)throw new Error((await s.json()).error||"Local query failed.");return s.json()}async function nh(){if(os)return{ok:!0,portable:!0};try{return{ok:(await fetch("/health",{cache:"no-store"})).ok}}catch{return{ok:!1}}}async function Hd(){if(os)return{configured:!1,model:null};try{let i=await fetch("/api/ai");return i.ok?i.json():{configured:!1}}catch{return{configured:!1}}}var Ud=[["24:v1:nominal","pass","nominal",12,13824,407.273],["12:v1:nominal","fail","outside_load_envelope",null,null,-138.182],["24:v1:empty","pass","empty_tank",4,0,407.273],["24:v1:open","pass","open_circuit",0,null,407.273],["24:v2:nominal","fail","outside_load_envelope",null,null,-37.727],["12:v1:open","fail","open_circuit",0,null,-138.182]];async function Gd(){let i=pi?Id(pi.golden):{ok:!1,cases:0,failures:["bundle not loaded"]};if(!os)try{let s=await(await fetch("/api/selftest")).json();return{ok:!!s.ok&&i.ok,total:(s.total||0)+i.cases,python:s,parity:i,error:s.error||(i.ok?void 0:"JS/Python Modbus mismatch: "+i.failures.join(", "))}}catch(n){return{ok:!1,total:0,parity:i,error:String(n)}}let t=[...Ud.filter(([n,s,r,a,o,l])=>{let c=pi.reports[n];return!c||c.load_check.status!==s||c.simulation.state!==r||c.simulation.loop_signal_ma!==a||c.simulation.plc_ideal_count!==o||c.load_check.margin_ohm!==l}).map(n=>n[0]),...i.failures];return{ok:t.length===0,total:Ud.length+i.cases,parity:i,error:t.length?"Mismatch: "+t.join(", "):void 0}}var Vd=i=>(Math.random()+Math.random()+Math.random()-1.5)*i,hl=class{constructor(e){this.onSample=e,this.report=null,this.current=0,this.level=.5,this.history=[],this.timer=null}setReport(e){this.report=e}start(){this.timer||(this.timer=setInterval(()=>this.tick(),250))}tick(){let e=this.report;if(!e)return;let t=e.simulation.state,n=e.inputs.supply_v,s=e.simulation.level_fraction??this.level;this.level+=(s-this.level)*.08;let r;t==="open_circuit"?r=0:t==="outside_load_envelope"?r=null:r=e.simulation.loop_signal_ma;let a=null;r!==null?(this.current+=(r-this.current)*.35,a=Math.max(0,this.current+(r===0?0:Vd(.012)))):this.current+=(0-this.current)*.35;let o=e.load_check.evaluated_ohm,l=n-(a??0)/1e3*.05+Vd(.02),c=n-.022*o,h=a!==null&&t!=="open_circuit"?Math.round(Math.max(0,(a-4)/16*27648)):null,d={t:Date.now(),state:t,ma:a,supply:l,terminalAtDesign:c,count:h,level:this.level,diag:t==="open_circuit"?"Wire break":t==="outside_load_envelope"?"Reading suppressed":"OK"};this.last=d,this.history.push(d),this.history.length>160&&this.history.shift(),this.onSample(d)}};function ih(i,e){let t=i.getContext("2d"),n=i.width,s=i.height;t.clearRect(0,0,n,s);let r={l:46,r:14,t:22,b:14},a=(s-r.t-r.b-28)/2,o=[{y0:r.t,title:"Loop current [mA]",min:0,max:24,key:"ma",color:"#5fd4d0",guides:[4,20]},{y0:r.t+a+28,title:"Supply [V]",min:0,max:28,key:"supply",color:"#ffc857",guides:[12,24]}];t.font="20px ui-monospace, Menlo, monospace";for(let l of o){let c=d=>l.y0+a-(d-l.min)/(l.max-l.min)*a;t.fillStyle="#8ea2a9",t.fillText(l.title,r.l,l.y0-4),t.strokeStyle="#1c2a31",t.lineWidth=1,t.strokeRect(r.l,l.y0,n-r.l-r.r,a);for(let d of l.guides)t.setLineDash([6,6]),t.beginPath(),t.moveTo(r.l,c(d)),t.lineTo(n-r.r,c(d)),t.stroke(),t.setLineDash([]),t.fillText(String(d),6,c(d)+6);t.strokeStyle=l.color,t.lineWidth=2.5,t.beginPath();let h=!1;e.forEach((d,f)=>{let u=r.l+f/159*(n-r.l-r.r),p=d[l.key];if(p==null){h=!1,t.fillStyle="rgba(255,138,92,.25)",t.fillRect(u-1,l.y0,3,a);return}h?t.lineTo(u,c(p)):t.moveTo(u,c(p)),h=!0}),t.stroke()}}var Wd={type:"change"},rh={type:"start"},$d={type:"end"},ul=new Ti,Xd=new ln,ux=Math.cos(70*Dc.DEG2RAD),At=new R,nn=2*Math.PI,it={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},sh=1e-6,dl=class extends Or{constructor(e,t=null){super(e,t),this.state=it.NONE,this.target=new R,this.cursor=new R,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Di.ROTATE,MIDDLE:Di.DOLLY,RIGHT:Di.PAN},this.touches={ONE:Ni.ROTATE,TWO:Ni.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new R,this._lastQuaternion=new jt,this._lastTargetPosition=new R,this._quat=new jt().setFromUnitVectors(e.up,new R(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Os,this._sphericalDelta=new Os,this._scale=1,this._panOffset=new R,this._rotateStart=new ge,this._rotateEnd=new ge,this._rotateDelta=new ge,this._panStart=new ge,this._panEnd=new ge,this._panDelta=new ge,this._dollyStart=new ge,this._dollyEnd=new ge,this._dollyDelta=new ge,this._dollyDirection=new R,this._mouse=new ge,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=fx.bind(this),this._onPointerDown=dx.bind(this),this._onPointerUp=px.bind(this),this._onContextMenu=bx.bind(this),this._onMouseWheel=_x.bind(this),this._onKeyDown=xx.bind(this),this._onTouchStart=yx.bind(this),this._onTouchMove=vx.bind(this),this._onMouseDown=mx.bind(this),this._onMouseMove=gx.bind(this),this._interceptControlDown=Sx.bind(this),this._interceptControlUp=Mx.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(e){this._cursorStyle=e,e==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(e){super.connect(e),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.ownerDocument.addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=it.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.ownerDocument.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(Wd),this.update(),this.state=it.NONE}pan(e,t){this._pan(e,t),this.update()}dollyIn(e){this._dollyIn(e),this.update()}dollyOut(e){this._dollyOut(e),this.update()}rotateLeft(e){this._rotateLeft(e),this.update()}rotateUp(e){this._rotateUp(e),this.update()}update(e=null){let t=this.object.position;At.copy(t).sub(this.target),At.applyQuaternion(this._quat),this._spherical.setFromVector3(At),this.autoRotate&&this.state===it.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=nn:n>Math.PI&&(n-=nn),s<-Math.PI?s+=nn:s>Math.PI&&(s-=nn),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(At.setFromSpherical(this._spherical),At.applyQuaternion(this._quatInverse),t.copy(this.target).add(At),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=At.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let o=new R(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new R(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=At.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(ul.origin.copy(this.object.position),ul.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(ul.direction))<ux?this.object.lookAt(this.target):(Xd.setFromNormalAndCoplanarPoint(this.object.up,this.target),ul.intersectPlane(Xd,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>sh||8*(1-this._lastQuaternion.dot(this.object.quaternion))>sh||this._lastTargetPosition.distanceToSquared(this.target)>sh?(this.dispatchEvent(Wd),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?nn/60*this.autoRotateSpeed*e:nn/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){At.setFromMatrixColumn(t,0),At.multiplyScalar(-e),this._panOffset.add(At)}_panUp(e,t){this.screenSpacePanning===!0?At.setFromMatrixColumn(t,1):(At.setFromMatrixColumn(t,0),At.crossVectors(this.object.up,At)),At.multiplyScalar(e),this._panOffset.add(At)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;At.copy(s).sub(this.target);let r=At.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=e-n.left,r=t-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientY),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(nn*this._rotateDelta.x/t.clientHeight),this._rotateUp(nn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.zoomToCursor&&(this._performCursorZoom=!0,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-nn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(n,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),s=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(nn*this._rotateDelta.x/t.clientHeight),this._rotateUp(nn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(e.pageX+t.x)*.5,o=(e.pageY+t.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new ge,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function dx(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function fx(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function px(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent($d),this.state=it.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function mx(i){let e;switch(i.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Di.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=it.DOLLY;break;case Di.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=it.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=it.ROTATE}break;case Di.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=it.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=it.PAN}break;default:this.state=it.NONE}this.state!==it.NONE&&this.dispatchEvent(rh)}function gx(i){switch(this.state){case it.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case it.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case it.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function _x(i){this.enabled===!1||this.enableZoom===!1||this.state!==it.NONE||(i.preventDefault(),this.dispatchEvent(rh),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent($d))}function xx(i){this.enabled!==!1&&this._handleKeyDown(i)}function yx(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Ni.ROTATE:if(this.enableRotate===!1){this.state=it.NONE;break}this._handleTouchStartRotate(i),this.state=it.TOUCH_ROTATE;break;case Ni.PAN:if(this.enablePan===!1){this.state=it.NONE;break}this._handleTouchStartPan(i),this.state=it.TOUCH_PAN;break;default:this.state=it.NONE}break;case 2:switch(this.touches.TWO){case Ni.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=it.TOUCH_DOLLY_PAN;break;case Ni.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=it.TOUCH_DOLLY_ROTATE;break;default:this.state=it.NONE}break;default:this.state=it.NONE}this.state!==it.NONE&&this.dispatchEvent(rh)}function vx(i){switch(this._trackPointer(i),this.state){case it.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case it.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case it.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case it.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=it.NONE}}function bx(i){this.enabled!==!1&&i.preventDefault()}function Sx(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.ownerDocument.addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Mx(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var fl=class extends yt{constructor(e=document.createElement("div")){super(),this.isCSS2DObject=!0,this.element=e,this.element.style.position="absolute",this.element.style.userSelect="none",this.element.setAttribute("draggable",!1),this.center=new ge(.5,.5),this.rotation2D=0,this.addEventListener("removed",function(){this.traverse(function(t){t.element&&t.element instanceof t.element.ownerDocument.defaultView.Element&&t.element.parentNode!==null&&t.element.remove()})})}copy(e,t){return super.copy(e,t),this.element=e.element.cloneNode(!0),this.center=e.center,this.rotation2D=e.rotation2D,this}},qs=new R,qd=new Ze,Yd=new Ze,Zd=new R,jd=new R,pl=class{constructor(e={}){let t=this,n,s,r,a,o={objects:new WeakMap},l=e.element!==void 0?e.element:document.createElement("div");l.style.overflow="hidden",this.domElement=l,this.sortObjects=!0,this.getSize=function(){return{width:n,height:s}},this.render=function(p,x){p.matrixWorldAutoUpdate===!0&&p.updateMatrixWorld(),x.parent===null&&x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),qd.copy(x.matrixWorldInverse),Yd.multiplyMatrices(x.projectionMatrix,qd),h(p,p,x),this.sortObjects&&u(p)},this.setSize=function(p,x){n=p,s=x,r=n/2,a=s/2,l.style.width=p+"px",l.style.height=x+"px"};function c(p){p.isCSS2DObject&&(p.element.style.display="none");for(let x=0,g=p.children.length;x<g;x++)c(p.children[x])}function h(p,x,g){if(p.visible===!1){c(p);return}if(p.isCSS2DObject){qs.setFromMatrixPosition(p.matrixWorld),qs.applyMatrix4(Yd);let m=qs.z>=-1&&qs.z<=1&&p.layers.test(g.layers)===!0,v=p.element;if(v.style.display=m===!0?"":"none",m===!0){p.onBeforeRender(t,x,g);let S=100*p.center.x,T=100*p.center.y;v.style.transformOrigin=`${S}% ${T}%`;let E=-p.rotation2D,_=qs.x*r+r,M=-qs.y*a+a;v.style.transform=`translate(${-S}%, ${-T}%) translate(${_}px, ${M}px) rotate(${E}rad)`,v.parentNode!==l&&l.appendChild(v),p.onAfterRender(t,x,g)}let w={distanceToCameraSquared:d(g,p)};o.objects.set(p,w)}for(let m=0,v=p.children.length;m<v;m++)h(p.children[m],x,g)}function d(p,x){return Zd.setFromMatrixPosition(p.matrixWorld),jd.setFromMatrixPosition(x.matrixWorld),Zd.distanceToSquared(jd)}function f(p){let x=[];return p.traverseVisible(function(g){g.isCSS2DObject&&x.push(g)}),x}function u(p){let x=f(p).sort(function(m,v){if(m.renderOrder!==v.renderOrder)return v.renderOrder-m.renderOrder;let w=o.objects.get(m).distanceToCameraSquared,S=o.objects.get(v).distanceToCameraSquared;return w-S}),g=x.length;for(let m=0,v=x.length;m<v;m++)x[m].element.style.zIndex=g-m}}};var ml=class extends qi{constructor(){super(),this.name="RoomEnvironment",this.position.y=-3.5;let e=new Mn;e.deleteAttribute("uv");let t=new ot({side:kt}),n=new ot,s=new On(16777215,900,28,2);s.position.set(.418,16.199,.3),this.add(s);let r=new ut(e,t);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let a=new qn(e,n,6),o=new yt;o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),o.updateMatrix(),a.setMatrixAt(0,o.matrix),o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),o.updateMatrix(),a.setMatrixAt(1,o.matrix),o.position.set(6.167,.857,7.803),o.rotation.set(0,.561,0),o.scale.set(3.927,6.285,3.687),o.updateMatrix(),a.setMatrixAt(2,o.matrix),o.position.set(-2.017,.018,6.124),o.rotation.set(0,.333,0),o.scale.set(2.002,4.566,2.064),o.updateMatrix(),a.setMatrixAt(3,o.matrix),o.position.set(2.291,-.756,-2.621),o.rotation.set(0,-.286,0),o.scale.set(1.546,1.552,1.496),o.updateMatrix(),a.setMatrixAt(4,o.matrix),o.position.set(-2.193,-.369,-5.547),o.rotation.set(0,.516,0),o.scale.set(3.875,3.487,2.986),o.updateMatrix(),a.setMatrixAt(5,o.matrix),this.add(a);let l=new ut(e,Ys(50));l.position.set(-16.116,14.37,8.208),l.scale.set(.1,2.428,2.739),this.add(l);let c=new ut(e,Ys(50));c.position.set(-16.109,18.021,-8.207),c.scale.set(.1,2.425,2.751),this.add(c);let h=new ut(e,Ys(17));h.position.set(14.904,12.198,-1.832),h.scale.set(.15,4.265,6.331),this.add(h);let d=new ut(e,Ys(43));d.position.set(-.462,8.89,14.52),d.scale.set(4.38,5.441,.088),this.add(d);let f=new ut(e,Ys(20));f.position.set(3.235,11.486,-12.541),f.scale.set(2.5,2,.1),this.add(f);let u=new ut(e,Ys(100));u.position.set(0,20,0),u.scale.set(1,.1,1),this.add(u)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function Ys(i){return new Ar({color:0,emissive:16777215,emissiveIntensity:i})}var wx={structure:["#4f7282",2.4,.015,.3],shell:["#5fd4d0",2,.025,.8],electronics:["#ffb347",1.6,.12,.85],signal:["#6fe3a1",1,.55,1],fluid:["#3aa0ff",1.3,.16,.75],internal:["#ffd166",1.1,.55,1]};function Ex([i,e,t,n]){return new wn({uniforms:{color:{value:new Ue(i)},power:{value:e},base:{value:t},opacity:{value:n}},vertexShader:`
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
      }`,transparent:!0,depthWrite:!1,side:Nt,blending:ts,toneMapped:!1})}var Jd=i=>i<.5?4*i*i*i:1-Math.pow(-2*i+2,3)/2,ah=i=>Math.max(0,Math.min(1,i));function Tx(i){for(let e=i;e;e=e.parent)if(!e.visible)return!1;return!0}var Zs=class{constructor(e,t,n={}){let{onSelect:s=()=>{},onHover:r=()=>{},presets:a={},initial:o="overview",background:l="#0d151a",fog:c=[8,18],minFocus:h=.35,focusScale:d=1.6,near:f=.02,far:u=60,minDistance:p=.2,maxDistance:x=9,exposure:g=1.05,envIntensity:m=.5}=n;this.container=e,this.onSelect=s,this.onHover=r,this.presets=a,this.minFocus=h,this.focusScale=d;let v=new rl({antialias:!0,powerPreference:"high-performance"});v.setPixelRatio(Math.min(window.devicePixelRatio,2)),v.shadowMap.enabled=!0,v.shadowMap.type=Qi,v.toneMapping=Fr,v.toneMappingExposure=g,e.appendChild(v.domElement),this.renderer=v;let w=new pl;Object.assign(w.domElement.style,{position:"absolute",inset:"0",pointerEvents:"none"}),e.appendChild(w.domElement),this.labelRenderer=w;let S=new qi;this.bg={normal:new Ue(l),xray:new Ue("#03080b")},S.background=this.bg.normal,S.fog=new pr(l,c[0],c[1]);let T=new Vs(v);S.environment=T.fromScene(new ml,.04).texture,S.environmentIntensity=m,this.scene=S;let E=a[o]||{pos:[2,2,3],target:[0,0,0]};this.camera=new Bt(40,1,f,u),this.camera.position.set(...E.pos);let _=new dl(this.camera,v.domElement);_.target.set(...E.target),_.enableDamping=!0,_.dampingFactor=.08,_.maxPolarAngle=1.52,_.minDistance=p,_.maxDistance=x,_.autoRotateSpeed=.6,_.addEventListener("start",()=>{this.tween=null}),this.controls=_,this.model=t,S.add(t.root),this.grid=new Nr(10,50,2053472,993841),this.grid.visible=!1,S.add(this.grid),this.parts=t.parts;let M=new jt;for(let[P,D]of Object.entries(this.parts))D.id=P,D.base=D.object.position.clone(),D.baseQuat=D.object.quaternion.clone(),D.offset=new R(...D.explode),D.spin&&(D.spinAxis=new R(D.spin[0],D.spin[1],D.spin[2]).normalize()),D.object.userData.partId=P;this.q=M;let N=Object.fromEntries(Object.entries(wx).map(([P,D])=>[P,Ex(D)]));t.root.traverse(P=>{P.isMesh&&(P.userData.mat=P.material,P.userData.xmat=N[P.userData.cat]||N.structure,P.userData.shadow=P.castShadow)}),this.labels={};for(let[P,D]of Object.entries(t.anchors||{})){let O=document.createElement("div");O.className="label3d";let V=new fl(O);V.position.copy(D),this.parts[P].object.add(V),this.labels[P]=O}this.selectionBox=new Ur(new Kt,16762967),this.selectionBox.visible=!1,S.add(this.selectionBox),this.view="normal",this.explode=0,this.explodeTarget=0,this.selected=null,this.raycaster=new Dr,this.pointer=new ge,this.tmp=new Ze,this.box=new Kt,this.active=!0,this.bindPointer(),new ResizeObserver(()=>this.resize()).observe(e),this.resize(),this.clock=new Lr,this.clock.connect(document),v.setAnimationLoop(()=>this.frame())}setLabel(e,t,n,s=""){let r=this.labels[e];r&&(r.className="label3d "+s,r.innerHTML=`<b>${t}</b><span>${n}</span>`)}setActive(e){e!==this.active&&(this.active=e,this.renderer.setAnimationLoop(e?()=>this.frame():null),e&&(this.clock.reset?.(),this.resize()))}resize(){let e=this.container.clientWidth||1,t=this.container.clientHeight||1;this.renderer.setSize(e,t),this.labelRenderer.setSize(e,t),this.camera.aspect=e/t,this.camera.updateProjectionMatrix()}pickHit(e){let t=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height)*2+1),this.raycaster.setFromCamera(this.pointer,this.camera);for(let n of this.raycaster.intersectObject(this.model.root,!0))if(Tx(n.object))return n;return null}pick(e){let t=this.pickHit(e);for(let n=t?.object;n;n=n.parent)if(n.userData.partId)return n.userData.partId;return null}onPickObject(){return!1}bindPointer(){let e=this.renderer.domElement,t=null,n=0;e.addEventListener("pointerdown",s=>{t=[s.clientX,s.clientY]}),e.addEventListener("pointerup",s=>{if(!t||Math.hypot(s.clientX-t[0],s.clientY-t[1])>4)return;let r=this.pickHit(s);if(r&&this.onPickObject(r.object))return;let a=this.pick(s);this.select(a),this.onSelect(a)}),e.addEventListener("pointermove",s=>{n||(n=requestAnimationFrame(()=>{n=0;let a=this.pickHit(s)?.object.userData.hint,o=this.pick(s);e.style.cursor=a||o?"pointer":"grab",this.onHover(a||(o?this.parts[o].name:null),s.clientX,s.clientY)}))}),e.addEventListener("pointerleave",()=>this.onHover(null))}select(e){this.selected=e&&this.parts[e]?this.parts[e]:null,this.selectionBox.visible=!!this.selected}focus(e){let t=this.parts[e];if(!t)return;if(Math.abs(this.explode-this.explodeTarget)>.01){this.pendingFocus=e;return}this.pendingFocus=null,this.box.setFromObject(t.object,!0);let n=this.box.getCenter(new R),s=this.box.getSize(new R).length(),r=this.camera.position.clone().sub(this.controls.target).normalize();r.y<.15&&(r.y=.25),r.normalize(),this.flyTo(n.clone().addScaledVector(r,Math.max(this.minFocus,s*this.focusScale)),n)}preset(e){let t=this.presets[e];t&&this.flyTo(new R(...t.pos),new R(...t.target))}flyTo(e,t,n=1100){this.tween={p0:this.camera.position.clone(),t0:this.controls.target.clone(),p1:e,t1:t,start:performance.now(),duration:n}}setView(e){this.view=e;let t=e==="xray";this.model.root.traverse(n=>{!n.isMesh||n.material?.userData?.keep||n.userData.mat?.userData?.keep||(n.material=t?n.userData.xmat:n.userData.mat,n.castShadow=!t&&n.userData.shadow)}),this.model.room&&(this.model.room.visible=!t&&!this.isolated),this.grid.visible=t,this.scene.background=t?this.bg.xray:this.bg.normal,this.scene.fog.color.copy(this.scene.background)}setExplode(e){this.explodeTarget=ah(e)}setLabels(e){this.container.classList.toggle("labels-off",!e)}setAutoRotate(e){this.controls.autoRotate=e}isolate(e){let t=this.parts[e];for(;t?.parent;)t=this.parts[t.parent];for(let n of Object.values(this.parts))n.parent?n.object.visible=!0:n.object.visible=n===t;this.isolated=!0,this.model.room&&(this.model.room.visible=!1),this.focus(e)}showAll(){for(let e of Object.values(this.parts))e.object.visible=!0;this.isolated=!1,this.model.room&&(this.model.room.visible=this.view!=="xray")}tick(){}frame(){this.clock.update();let e=Math.min(this.clock.getDelta(),.05),t=this.clock.getElapsed();this.explode+=(this.explodeTarget-this.explode)*Math.min(1,e*4),Math.abs(this.explodeTarget-this.explode)<5e-4&&(this.explode=this.explodeTarget);let n=ah(this.explode);this.pendingFocus&&Math.abs(this.explode-this.explodeTarget)<=.01&&this.focus(this.pendingFocus);for(let s of Object.values(this.parts)){let[r,a]=s.window||[0,1],o=Jd(ah((n-r)/(a-r)));s.object.position.copy(s.base).addScaledVector(s.offset,o),s.spinAxis&&(this.q.setFromAxisAngle(s.spinAxis,s.spin[3]*o),s.object.quaternion.copy(s.baseQuat).multiply(this.q))}if(this.tick(e,t),this.selected&&this.selectionBox.box.setFromObject(this.selected.object,!0),this.tween){let s=Math.min(1,(performance.now()-this.tween.start)/this.tween.duration),r=Jd(s);this.camera.position.lerpVectors(this.tween.p0,this.tween.p1,r),this.controls.target.lerpVectors(this.tween.t0,this.tween.t1,r),s>=1&&(this.tween=null)}this.controls.update(e),this.renderer.render(this.scene,this.camera),this.labelRenderer.render(this.scene,this.camera)}snapshot(e=768){this.renderer.render(this.scene,this.camera);let t=this.renderer.domElement,n=Math.min(1,e/t.width),s=document.createElement("canvas");return s.width=Math.round(t.width*n),s.height=Math.round(t.height*n),s.getContext("2d").drawImage(t,0,0,s.width,s.height),s.toDataURL("image/jpeg",.85)}};var Kr=new R;function An(i,e,t,n,s,r){let a=2*Math.PI*s/4,o=Math.max(r-2*s,0),l=Math.PI/4;Kr.copy(e),Kr[n]=0,Kr.normalize();let c=.5*a/(a+o),h=1-Kr.angleTo(i)/l;return Math.sign(Kr[t])===1?h*c:o/(a+o)+c+c*(1-h)}var zn=class i extends Mn{constructor(e=1,t=1,n=1,s=2,r=.1){let a=s*2+1;if(r=Math.min(e/2,t/2,n/2,r),super(1,1,1,a,a,a),this.type="RoundedBoxGeometry",this.parameters={width:e,height:t,depth:n,segments:s,radius:r},a===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let l=new R,c=new R,h=new R(e,t,n).divideScalar(2).subScalar(r),d=this.attributes.position.array,f=this.attributes.normal.array,u=this.attributes.uv.array,p=d.length/6,x=new R,g=.5/a;for(let m=0,v=0;m<d.length;m+=3,v+=2)switch(l.fromArray(d,m),c.copy(l),c.x-=Math.sign(c.x)*g,c.y-=Math.sign(c.y)*g,c.z-=Math.sign(c.z)*g,c.normalize(),d[m+0]=h.x*Math.sign(l.x)+c.x*r,d[m+1]=h.y*Math.sign(l.y)+c.y*r,d[m+2]=h.z*Math.sign(l.z)+c.z*r,f[m+0]=c.x,f[m+1]=c.y,f[m+2]=c.z,Math.floor(m/p)){case 0:x.set(1,0,0),u[v+0]=An(x,c,"z","y",r,n),u[v+1]=1-An(x,c,"y","z",r,t);break;case 1:x.set(-1,0,0),u[v+0]=1-An(x,c,"z","y",r,n),u[v+1]=1-An(x,c,"y","z",r,t);break;case 2:x.set(0,1,0),u[v+0]=1-An(x,c,"x","z",r,e),u[v+1]=An(x,c,"z","x",r,n);break;case 3:x.set(0,-1,0),u[v+0]=1-An(x,c,"x","z",r,e),u[v+1]=1-An(x,c,"z","x",r,n);break;case 4:x.set(0,0,1),u[v+0]=1-An(x,c,"x","y",r,e),u[v+1]=1-An(x,c,"y","x",r,t);break;case 5:x.set(0,0,-1),u[v+0]=An(x,c,"x","y",r,e),u[v+1]=1-An(x,c,"y","x",r,t);break}}static fromJSON(e){return new i(e.width,e.height,e.depth,e.segments,e.radius)}};function Qr(i,e){let t=document.createElement("canvas");return t.width=i,t.height=e,[t,t.getContext("2d")]}function ea(i,{repeat:e=[1,1],srgb:t=!0}={}){let n=new Yi(i);return n.wrapS=n.wrapT=Ei,n.repeat.set(e[0],e[1]),n.anisotropy=8,t&&(n.colorSpace=Ft),n}function gl(i=196){let[e,t]=Qr(512,512);t.fillStyle=`rgb(${i},${i},${i})`,t.fillRect(0,0,512,512);for(let n=0;n<2600;n++){let s=Math.random()*512,r=i+(Math.random()-.5)*34;t.strokeStyle=`rgba(${r},${r},${r},0.35)`,t.lineWidth=Math.random()*1.4,t.beginPath(),t.moveTo(Math.random()*-100,s),t.lineTo(512+Math.random()*100,s+(Math.random()-.5)*2),t.stroke()}return ea(e,{repeat:[2,2]})}function Kd(){let[i,e]=Qr(256,256);e.fillStyle="#5a5a5a",e.fillRect(0,0,256,256);let t=(n,s,r)=>{e.save(),e.translate(n,s),e.rotate(r);let a=e.createLinearGradient(-18,0,18,0);a.addColorStop(0,"#3c3c3c"),a.addColorStop(.5,"#a8a8a8"),a.addColorStop(1,"#3c3c3c"),e.fillStyle=a,e.beginPath(),e.ellipse(0,0,20,4.5,0,0,Math.PI*2),e.fill(),e.restore()};for(let n=0;n<4;n++)for(let s=0;s<4;s++)t(s*64+32,n*64+32,(s+n)%2?Math.PI/4:-Math.PI/4);return ea(i,{repeat:[14,10],srgb:!1})}function oh(i="#c8ccc6"){let[e,t]=Qr(256,256);t.fillStyle=i,t.fillRect(0,0,256,256);for(let n=0;n<1800;n++)t.fillStyle=`rgba(0,0,0,${Math.random()*.04})`,t.fillRect(Math.random()*256,Math.random()*256,2,2);return ea(e,{repeat:[4,2]})}function zt({w:i=512,h:e=256,bg:t="#2d3236",fg:n="#e6e9ea",accent:s=null,border:r=null}={}){let[a,o]=Qr(i,e),l=ea(a);return l.wrapS=l.wrapT=vn,{texture:l,draw:h=>{o.fillStyle=t,o.fillRect(0,0,i,e),s&&(o.fillStyle=s,o.fillRect(0,0,i,e*.18)),r&&(o.strokeStyle=r,o.lineWidth=6,o.strokeRect(6,6,i-12,e-12));for(let d of h)o.fillStyle=d.color||n,o.font=`${d.weight||600} ${d.size||34}px Helvetica, Arial, sans-serif`,o.textAlign=d.align||"left",o.fillText(d.text,d.align==="center"?i/2:d.x??24,d.y);l.needsUpdate=!0}}}function Qd(){let[i,e]=Qr(256,64);e.fillStyle="#9ea3a5",e.fillRect(0,0,256,64),e.fillStyle="#2b2f31";for(let t=6;t<256;t+=16)e.fillRect(t,0,6,46);return ea(i,{repeat:[6,1]})}var Fe={x:-1.2,z:-.2,w:1.4,h:1.1,d:.9,y0:.12};Fe.top=Fe.y0+Fe.h;var Rt={x:1.55,y:1.15,z:-1.22,w:.8,h:1,d:.3},sn={x:.25,y:2.07,z:-1.25},ta=-1.4,cs={y:2.05,z:-1.22},pn={x:Fe.x+.4,z:Fe.z+.15,bottom:Fe.y0+.05},_l=Fe.top+.06;function z(i,e,t={}){let n=new ut(i,e);return t.pos&&n.position.set(...t.pos),t.rot&&n.rotation.set(...t.rot),t.cat&&(n.userData.cat=t.cat),n.castShadow=t.cast??!0,n.receiveShadow=t.receive??!0,n}var pe=(i,e,t)=>new Mn(i,e,t),Ye=(i,e,t=32,n=i)=>new Ri(i,n,e,t);function lh(){let i={brushed:gl(),checker:Kd(),bulkhead:oh("#d3d6d0"),cabinet:oh("#d4d7d3"),duct:Qd()},e=(t,n,s,r={})=>new ot({color:t,roughness:n,metalness:s,...r});return{stainless:new Zn({color:14080990,metalness:.92,roughness:.28,map:i.brushed,clearcoat:.15}),stainlessDark:e(10134182,.38,.9),floor:e(8884116,.55,.75,{bumpMap:i.checker,bumpScale:1.6}),bulkhead:e(16777215,.78,.15,{map:i.bulkhead}),frame:e(12567485,.7,.25),primer:e(8270886,.8,.2),cabinet:e(16777215,.5,.25,{map:i.cabinet}),plate:e(12896716,.42,.8),din:e(15001578,.22,1),duct:e(16777215,.7,.05,{map:i.duct}),ductLid:e(10988718,.65,.05),siemens:e(2830388,.55,.1),siemensTerm:e(3949127,.6,.1),psu:e(14211803,.5,.15),white:e(15790318,.5,.05),black:e(1316376,.55,.05),termGrey:e(10199718,.6,.05),termBlue:e(3108277,.6,.05),termRed:e(11744812,.6,.05),termPE:e(5216828,.6,.05),cable:e(1776927,.55,.05),wireRed:e(11674146,.5,.05),wireBlue:e(2052008,.5,.05),jb:e(9344924,.55,.1),glass:new Zn({color:16777215,metalness:0,roughness:.04,transparent:!0,opacity:.22,depthWrite:!1}),water:new Zn({color:1928094,metalness:0,roughness:.08,transparent:!0,opacity:.62,depthWrite:!1}),waterSurface:new Zn({color:3839433,metalness:.1,roughness:.05,transparent:!0,opacity:.75,side:Nt}),ceramic:e(15855334,.35,.02),diaphragm:e(14271098,.3,.8),pcb:e(1533498,.55,.1),chip:e(1118481,.4,.2),gold:e(13938487,.3,1),capPlastic:e(3752778,.5,.05),red:e(12597547,.45,.1),crate:e(3362910,.6,.05),foam:e(2434341,.95,0),pipeBlue:e(2909096,.55,.3),pipeGreen:e(3963466,.55,.3),lamp:e(16777215,.3,0,{emissive:16773852,emissiveIntensity:2.2}),ledOff:()=>e(2105376,.4,0,{emissive:0})}}function Hn(i){let e=new ot({color:1118481,emissive:i,emissiveIntensity:0,roughness:.3});return e.userData.keep=!0,{material:e,on:(t=1)=>{e.emissiveIntensity=t*3}}}function mi(i,e,t,n={}){let s=new ci(i.map(a=>new R(...a)),!1,"catmullrom",n.tension??.2),r=z(new Tr(s,n.segments??200,e,10,!1),t,n);return r.userData.curve=s,r}function Ax(i){let e=new Ne;e.add(z(new ft(9,7),i.floor,{rot:[-Math.PI/2,0,0],pos:[0,0,.6],cast:!1})),e.add(z(new ft(9,3.2),i.bulkhead,{pos:[0,1.6,ta],cast:!1}));let t=z(new ft(7,3.2),i.bulkhead,{pos:[-3.4,1.6,.6],rot:[0,Math.PI/2,0],cast:!1});e.add(t);for(let s=-4.2;s<=4.2;s+=.7)Math.abs(s-Rt.x)<.55||Math.abs(s-sn.x)<.2||e.add(z(pe(.06,3.2,.14),i.frame,{pos:[s,1.6,ta+.07]}));for(let s=-.7;s<=3.5;s+=.7)e.add(z(pe(.14,3.2,.06),i.frame,{pos:[-3.33,1.6,s]}));for(let s of[-.9,.5]){e.add(z(pe(9,.2,.1),i.frame,{pos:[0,2.95,s]}));for(let r of[-1.6,1.2])e.add(z(pe(1.25,.05,.14),i.white,{pos:[r,2.82,s]})),e.add(z(pe(1.18,.012,.09),i.lamp,{pos:[r,2.794,s],cast:!1}))}let n=(s,r)=>{let a=z(Ye(.045,9,24),r,{pos:[0,s,ta+.2],rot:[0,0,Math.PI/2]});e.add(a);for(let o=-4;o<=4;o+=1.4)Math.abs(o-Rt.x)<.5||e.add(z(pe(.04,.03,.2),i.stainlessDark,{pos:[o,s-.06,ta+.1]}))};return n(.42,i.pipeBlue),n(2.45,i.pipeGreen),e.traverse(s=>{s.isMesh&&(s.userData.cat="structure")}),e}function Rx(i){let e=new Ne;e.position.set(Fe.x,0,Fe.z);let t=Fe.y0+Fe.h/2;e.add(z(new zn(Fe.w,Fe.h,Fe.d,5,.045),i.stainless,{pos:[0,t,0],cat:"shell"}));for(let x of[-.48,.3])e.add(z(pe(.05,Fe.h-.12,.018),i.stainless,{pos:[x,t,Fe.d/2+.009],cat:"shell"}));e.add(z(pe(Fe.w+.004,.012,Fe.d+.004),i.stainlessDark,{pos:[0,t+.18,0],cat:"shell"}));for(let x of[-.45,.45])e.add(z(pe(.1,Fe.y0,Fe.d+.14),i.primer,{pos:[x,Fe.y0/2,0],cat:"structure"}));let n=zt({w:512,h:256,bg:"#e8ebec",fg:"#1b2226",border:"#1b2226"});n.draw([{text:"FRESH WATER",y:70,size:46,weight:700},{text:"TANK T-03 \xB7 1 200 L",y:122,size:34},{text:"LEVEL LOOP LT-301 \xB7 4\u201320 mA",y:168,size:28,weight:500},{text:"SYNTHETIC INSTALLATION DATA",y:222,size:22,weight:700,color:"#a5561e"}]),e.add(z(new ft(.42,.21),new ot({map:n.texture,roughness:.55,metalness:.2}),{pos:[-.09,.86,Fe.d/2+.002],cat:"shell",cast:!1}));let s=[pn.x-Fe.x,Fe.top,pn.z-Fe.z];e.add(z(Ye(.05,.04),i.stainless,{pos:[s[0],s[1]+.02,s[2]],cat:"shell"})),e.add(z(Ye(.032,.035,6),i.stainlessDark,{pos:[s[0],s[1]+.055,s[2]],cat:"shell"}));let r=-.55;e.add(mi([[r,Fe.top,-.3],[r,Fe.top+.3,-.3],[r,Fe.top+.42,-.22],[r,Fe.top+.36,-.12]],.024,i.stainlessDark,{cat:"shell",segments:40})),e.add(z(Ye(.04,2.95-Fe.top),i.pipeBlue,{pos:[.05,(2.95+Fe.top)/2,-.3],cat:"shell"})),e.add(z(Ye(.065,.02),i.stainlessDark,{pos:[.05,Fe.top+.01,-.3],cat:"shell"})),e.add(z(Ye(.034,.2),i.stainlessDark,{pos:[-.35,.3,Fe.d/2+.1],rot:[Math.PI/2,0,0],cat:"shell"})),e.add(z(new Un(.055,24,16),i.stainless,{pos:[-.35,.3,Fe.d/2+.17],cat:"shell"})),e.add(z(pe(.16,.018,.03),i.red,{pos:[-.29,.37,Fe.d/2+.17],cat:"shell"}));let a=.6,o=Fe.d/2+.06;for(let x of[.24,1.12])e.add(z(Ye(.016,.07),i.stainlessDark,{pos:[a,x,Fe.d/2+.03],rot:[Math.PI/2,0,0],cat:"shell"}));e.add(z(Ye(.02,.9),i.glass,{pos:[a,.68,o],cat:"shell",cast:!1}));for(let x of[-.03,.03])e.add(z(Ye(.004,.9),i.stainlessDark,{pos:[a+x,.68,o+.02],cat:"shell"}));let l=Ye(.014,1,16);l.translate(0,.5,0);let c=z(l,new ot({color:2983101,roughness:.1,transparent:!0,opacity:.85}),{pos:[a,.24,o],cat:"fluid",cast:!1});e.add(c);let h=Fe.w-.06,d=Fe.d-.06,f=pe(h,1,d);f.translate(0,.5,0);let u=z(f,i.water,{pos:[0,Fe.y0+.02,0],cat:"fluid",cast:!1,receive:!1});u.renderOrder=2;let p=z(new ft(h,d,28,18),i.waterSurface,{rot:[-Math.PI/2,0,0],cat:"fluid",cast:!1});return p.renderOrder=3,e.add(u,p),{group:e,water:u,surface:p,glassWater:c,innerHeight:Fe.h-.06,glassSpan:.88}}function Cx(i){let e=new Ne;e.position.set(Fe.x-.25,Fe.top,Fe.z),e.add(z(Ye(.25,.03,48),i.stainless,{pos:[0,.015,0]})),e.add(z(Ye(.23,.025,48),i.stainless,{pos:[0,.042,0]}));let t=new qn(Ye(.012,.022,6),i.stainlessDark,12),n=new Ze;for(let s=0;s<12;s++){let r=s/12*Math.PI*2;n.makeTranslation(Math.cos(r)*.205,.064,Math.sin(r)*.205),t.setMatrixAt(s,n)}return t.castShadow=!0,e.add(t),e.add(z(new Ci(.06,.009,10,24,Math.PI),i.stainlessDark,{pos:[0,.055,0]})),e}function Px(i){let e=new Ne;e.position.set(pn.x,0,pn.z);let t=.028,n=pn.bottom,s=new Ne;s.add(z(Ye(t,.17),i.stainless,{pos:[0,n+.045+.085,0]})),s.add(z(Ye(.012,.035,24,t),i.stainless,{pos:[0,n+.215+.0175,0]}));for(let c of[n+.07,n+.19])s.add(z(new Ci(t,.0015,6,32),i.stainlessDark,{pos:[0,c,0],rot:[Math.PI/2,0,0]}));let r=_l-(n+.25);s.add(z(Ye(.0075,r,12),i.cable,{pos:[0,n+.25+r/2,0],cat:"signal"}));let a=new Ne;a.position.y=n+.02,a.add(z(Ye(t+.003,.04),i.capPlastic));for(let c=0;c<6;c++){let h=c/6*Math.PI*2;a.add(z(Ye(.006,.012,10),i.black,{pos:[Math.cos(h)*(t+.001),-.004,Math.sin(h)*(t+.001)],rot:[0,-h,Math.PI/2]}))}let o=new Ne;o.position.y=n+.055,o.add(z(Ye(.022,.014),i.ceramic,{cat:"internal"})),o.add(z(Ye(.019,.002),i.diaphragm,{pos:[0,-.008,0],cat:"internal"}));let l=new Ne;return l.position.y=n+.13,l.add(z(pe(.032,.11,.003),i.pcb,{cat:"internal"})),l.add(z(pe(.012,.012,.003),i.chip,{pos:[0,.02,.003],cat:"internal"})),l.add(z(pe(.008,.006,.003),i.chip,{pos:[-.006,-.02,.003],cat:"internal"})),l.add(z(pe(.004,.004,.004),i.gold,{pos:[.009,-.035,.003],cat:"internal"})),e.add(s,a,o,l),e.scale.setScalar(1),{group:e,housing:s,cap:a,cell:o,pcb:l}}function Ix(i){let e=new Ne;e.position.set(sn.x,sn.y,sn.z),e.add(z(pe(.2,.2,.1),i.jb,{pos:[0,0,-.01]})),e.add(z(pe(.04,.04,.15),i.stainlessDark,{pos:[0,0,-.09]}));for(let r of[-.105,.105])e.add(z(Ye(.016,.03,16),i.black,{pos:[r,0,.03],rot:[0,0,Math.PI/2]}));let t=new Ne;for(let r=0;r<4;r++)t.add(z(pe(.012,.04,.03),r===1?i.termBlue:i.termGrey,{pos:[-.02+r*.013,0,0],cat:"internal"}));e.add(t);let n=new Ne;n.position.z=.05,n.add(z(pe(.21,.21,.02),i.jb));for(let[r,a]of[[-.085,-.085],[.085,-.085],[-.085,.085],[.085,.085]])n.add(z(Ye(.007,.006,12),i.stainlessDark,{pos:[r,a,.012],rot:[Math.PI/2,0,0]}));let s=zt({w:256,h:96,bg:"#f3d23a",fg:"#111"});return s.draw([{text:"JB-03",y:60,size:46,weight:800,align:"center"}]),n.add(z(new ft(.09,.034),new ot({map:s.texture,roughness:.6}),{pos:[0,.05,.011],cast:!1})),e.add(n),{group:e,lid:n,strip:t}}function Lx(i){let e=new Ne,t=(n,s)=>{let r=s-n,a=(n+s)/2;e.add(z(pe(r,.006,.13),i.stainlessDark,{pos:[a,cs.y,cs.z]}));for(let o of[-.065,.065])e.add(z(pe(r,.04,.004),i.stainlessDark,{pos:[a,cs.y+.02,cs.z+o]}));for(let o=n+.2;o<s;o+=.6)e.add(z(pe(.03,.03,.2),i.stainlessDark,{pos:[o,cs.y-.02,ta+.1]}))};return t(-.95,sn.x-.13),t(sn.x+.13,Rt.x-.15),e}function Dx(i){let e=pn.x,t=pn.z,n=cs.y+.02,s=cs.z,r=Rt.x-.25,a=Rt.y+Rt.h/2;return[[e,_l,t],[e,_l+.25,t],[e,1.82,t-.12],[e,1.98,t-.55],[e+.05,n,s+.12],[e+.25,n,s],[sn.x-.3,n,s],[sn.x-.11,n,s],[sn.x,n-.01,s],[sn.x+.11,n,s],[sn.x+.4,n,s],[r-.3,n,s],[r-.04,n-.02,s],[r,n-.12,s],[r,a+.12,Rt.z],[r,a,Rt.z],[r,a-.08,Rt.z-.05],[r,Rt.y+.12,Rt.z-.06],[r,Rt.y+.02,Rt.z-.06],[i.x-.04,i.y+.1,Rt.z-.07],[i.x,i.y+.035,Rt.z-.08]]}function Nx(i){let e=new Ne;e.position.set(Rt.x,Rt.y,Rt.z);let{w:t,h:n,d:s}=Rt,r=.015,a=new Ne;a.add(z(pe(t,n,r),i.cabinet,{pos:[0,0,-s/2+r/2]}));for(let Q of[-1,1])a.add(z(pe(r,n,s),i.cabinet,{pos:[Q*(t/2-r/2),0,0]}));for(let Q of[-1,1])a.add(z(pe(t,r,s),i.cabinet,{pos:[0,Q*(n/2-r/2),0]}));a.add(z(pe(t-.06,n-.06,.004),i.plate,{pos:[0,0,-s/2+r+.01]}));let o=-s/2+r+.012,l={upper:.27,lower:-.2};for(let Q of Object.values(l))a.add(z(pe(t-.1,.035,.0075),i.din,{pos:[0,Q,o+.004]}));for(let Q of[.43,.05,-.38])a.add(z(pe(t-.08,.06,.055),i.duct,{pos:[0,Q,o+.028]})),a.add(z(pe(t-.08,.064,.006),i.ductLid,{pos:[0,Q,o+.058]}));a.add(z(Ye(.016,.03,16),i.black,{pos:[-.25,n/2+.012,0]})),e.add(a);let c=o+.0075,h={},d=-.33,f=Q=>{let G=d+Q/2;return d+=Q,G},u=new Ne;u.position.set(f(.036),l.upper,c+.035),u.add(z(pe(.036,.09,.07),i.white,{cat:"electronics"})),u.add(z(pe(.012,.022,.016),i.black,{pos:[0,.006,.042],cat:"electronics"})),h.breaker=u,d+=.012;let p=zt({w:128,h:320,bg:"#d8dadb",fg:"#20262a",accent:"#20262a"}),x=new Ne;x.position.set(f(.05),l.upper,c+.055);let g=new ot({map:p.texture,roughness:.5});x.add(z(pe(.05,.125,.11),[i.psu,i.psu,i.psu,i.psu,g,i.psu],{cat:"electronics"}));let m=Hn(3997550);x.add(z(pe(.006,.004,.004),m.material,{pos:[.012,.045,.056],cast:!1}));for(let Q of[.068,-.068])for(let G=0;G<3;G++)x.add(z(pe(.012,.012,.02),i.siemensTerm,{pos:[-.016+G*.016,Q,.03],cat:"electronics"}));h.psu=x,d+=.03;let v=zt({w:440,h:400,bg:"#2b3034",fg:"#e6e9ea"});v.draw([{text:"SIEMENS",y:52,size:40,weight:800,color:"#00a5a5"},{text:"SIMATIC S7-1200",y:104,size:32},{text:"CPU 1214C",y:170,size:46,weight:700},{text:"DC/DC/DC",y:214,size:28,weight:500},{text:"synthetic model",y:370,size:22,weight:500,color:"#c49a3a"}]);let w=new Ne;w.position.set(f(.11),l.upper,c+.0375);let S=new ot({map:v.texture,roughness:.5});w.add(z(pe(.11,.1,.075),[i.siemens,i.siemens,i.siemens,i.siemens,S,i.siemens],{cat:"electronics"}));for(let Q of[.044,-.044])w.add(z(pe(.104,.014,.012),i.siemensTerm,{pos:[0,Q,.035],cat:"electronics"}));let T=Hn(3997550),E=Hn(16726832),_=Hn(16756736);[T,E,_].forEach((Q,G)=>w.add(z(pe(.008,.004,.003),Q.material,{pos:[-.045,.018-G*.009,.038],cast:!1}))),h.cpu=w,d+=.002;let M=zt({w:180,h:400,bg:"#2b3034",fg:"#e6e9ea"});M.draw([{text:"SM 1231",y:60,size:34,weight:700},{text:"AI 4\xD713 bit",y:100,size:24,weight:500},{text:"6ES7231-",y:330,size:21,weight:500},{text:"4HD32-0XB0",y:358,size:21,weight:500}]);let N=new Ne;N.position.set(f(.045),l.upper,c+.0375);let P=new ot({map:M.texture,roughness:.5});N.add(z(pe(.045,.1,.075),[i.siemens,i.siemens,i.siemens,i.siemens,P,i.siemens],{cat:"electronics"}));for(let Q of[.044,-.044])N.add(z(pe(.04,.014,.012),i.siemensTerm,{pos:[0,Q,.035],cat:"electronics"}));let D=Hn(16726832),O=[0,1,2,3].map(()=>Hn(3997550));N.add(z(pe(.007,.004,.003),D.material,{pos:[-.012,.02,.038],cast:!1})),O.forEach((Q,G)=>N.add(z(pe(.005,.003,.003),Q.material,{pos:[.004+G%2*.009,.02-Math.floor(G/2)*.007,.038],cast:!1}))),h.sm1231=N;let V=new Ne;V.position.set(-.04,l.lower,c+.0225),[i.termGrey,i.termGrey,i.termBlue,i.termBlue,i.termRed,i.termGrey,i.termGrey,i.termGrey,i.termGrey,i.termPE].forEach((Q,G)=>{V.add(z(pe(.0078,.055,.045),Q,{pos:[G*.0082,0,0],cat:"electronics"})),V.add(z(Ye(.0022,.003,8),i.stainlessDark,{pos:[G*.0082,.018,.0235],rot:[Math.PI/2,0,0],cat:"electronics"}))}),V.add(z(pe(.012,.05,.04),i.termGrey,{pos:[-.01,0,0]})),h.terminals=V;let X=zt({w:384,h:128,bg:"#f2f2f0",fg:"#111"});X.draw([{text:"+A1  LEVEL MONITORING",y:56,size:30,weight:700},{text:"24 V DC \xB7 T-03 / LT-301",y:100,size:24,weight:500}]);let q=new Ne;q.position.set(-t/2,0,s/2);let H=new Ne;return H.position.x=t/2,H.add(z(pe(t,n,.018),i.cabinet,{pos:[0,0,.009]})),H.add(z(pe(.025,.1,.03),i.black,{pos:[t/2-.05,0,.033]})),H.add(z(new ft(.24,.08),new ot({map:X.texture,roughness:.6}),{pos:[0,.38,.019],cast:!1})),H.add(z(pe(.22,.3,.02),i.ductLid,{pos:[0,-.1,-.01]})),q.add(H),q.rotation.y=-1.92,h.door=q,Object.values(h).forEach(Q=>e.add(Q)),{group:e,parts:h,psuPlate:p,leds:{psuLed:m,cpuRun:T,cpuErr:E,cpuMaint:_,smDiag:D,smCh:O},terminalWorld:()=>V.localToWorld(new R(.0082,0,.02)),smWorld:()=>N.localToWorld(new R(0,-.05,.03)),psuWorld:()=>x.localToWorld(new R(0,-.062,.03))}}function Ux(i){let e=new Ne;e.position.set(-.05,0,.75),e.rotation.y=-.35,e.add(z(pe(.5,.012,.32),i.crate,{pos:[0,.006,0]}));for(let s of[-1,1])e.add(z(pe(.5,.11,.012),i.crate,{pos:[0,.055,s*.154]})),e.add(z(pe(.012,.11,.32),i.crate,{pos:[s*.244,.055,0]}));e.add(z(pe(.47,.04,.29),i.foam,{pos:[0,.032,0]}));let t=new Ne;t.position.set(-.06,.07,.02),t.add(z(Ye(.021,.17),i.stainless,{rot:[0,0,Math.PI/2]})),t.add(z(Ye(.023,.03),i.capPlastic,{pos:[-.1,0,0],rot:[0,0,Math.PI/2]})),t.add(z(new Ci(.065,.006,8,40),i.cable,{pos:[.14,-.012,0],rot:[Math.PI/2,0,0]})),t.add(z(new Ci(.055,.006,8,40),i.cable,{pos:[.14,-.002,0],rot:[Math.PI/2,0,0]}));let n=zt({w:384,h:128,bg:"#fafafa",fg:"#222",border:"#c0392b"});return n.draw([{text:"REFERENCE \xB7 REMOVED",y:52,size:28,weight:800,color:"#c0392b"},{text:"WIKA LS-10 \xB7 4\u201320 mA",y:98,size:26,weight:600}]),t.add(z(new ft(.15,.05),new ot({map:n.texture,roughness:.7}),{pos:[.02,.025,.06],rot:[-Math.PI/2,0,0],cast:!1})),e.add(t),{group:e,wika:t}}function tf(){let i=lh(),e=Ax(i),t=Rx(i),n=Cx(i),s=Px(i),r=Ix(i),a=Lx(i),o=Nx(i),l=Ux(i),c=new Ne;c.add(e,t.group,n,s.group,r.group,a,o.group,l.group),c.updateMatrixWorld(!0);let h=o.terminalWorld(),d=mi(Dx(h),.0085,i.cable,{cat:"signal",segments:500,tension:.1}),f=o.smWorld(),u=o.psuWorld(),p=mi([[h.x+.0082,h.y+.03,h.z],[h.x+.01,h.y+.12,h.z+.01],[f.x,f.y-.12,f.z+.012],[f.x,f.y,f.z]],.0025,i.wireRed,{cat:"signal",segments:60}),x=mi([[h.x+.0164,h.y+.03,h.z],[h.x+.02,h.y+.12,h.z+.012],[f.x+.008,f.y-.12,f.z+.014],[f.x+.008,f.y,f.z]],.0025,i.wireBlue,{cat:"signal",segments:60}),g=mi([[u.x,u.y,u.z],[u.x,u.y-.12,u.z+.01],[h.x-.01,h.y+.12,h.z+.012],[h.x+.008,h.y+.03,h.z]],.0025,i.wireRed,{cat:"signal",segments:60}),m=new Ne;m.add(d,p,x,g),c.add(m);let v=new Zi;v.add(new Yn(new R(pn.x,pn.bottom+.25,pn.z),new R(pn.x,_l,pn.z))),v.add(d.userData.curve),v.add(p.userData.curve);let w={tank:{object:t.group,name:"Freshwater tank T-03",role:"Stainless storage tank \xB7 1 200 L",cat:"shell",color:"#5fd4d0",explode:[-.45,0,.1],specs:[["Capacity","1 200 L","synthetic"],["Level loop","LT-301 \xB7 4\u201320 mA","synthetic"],["Material","To confirm","pending"]]},manhole:{object:n,parent:"tank",name:"Manhole cover",role:"Bolted inspection cover \xB7 12 \xD7 M12",cat:"shell",color:"#5fd4d0",explode:[0,.75,0],specs:[["Fasteners","12 bolts","synthetic"]]},probe:{object:s.group,name:"Waterpilot FMX11 (candidate)",role:"Endress+Hauser hydrostatic level probe \xB7 2-wire 4\u201320 mA",cat:"shell",color:"#ffd166",explode:[.35,.35,1.05],specs:[["Output","4\u201320 mA, 2-wire","oem","EH-TI01524P"],["Min. terminal voltage","8 V","oem","EH-TI01524P"],["Design current","22 mA","oem","EH-TI01524P"],["Max. load","(V \u2212 8 V) / 0.022 A","oem","EH-TI01524P"],["Order code / range","Not confirmed","pending"]]},"probe-cap":{object:s.cap,parent:"probe",name:"Protective cap",role:"Removable inlet cap",cat:"shell",color:"#ffd166",explode:[0,-.16,0],specs:[["Material","To confirm","pending"]]},"probe-cell":{object:s.cell,parent:"probe",name:"Ceramic measuring cell",role:"Hydrostatic pressure sensor + diaphragm",cat:"internal",color:"#ffd166",explode:[.08,-.08,0],specs:[["Principle","Hydrostatic pressure","oem","EH-TI01524P"],["Range","Not confirmed","pending"]]},"probe-pcb":{object:s.pcb,parent:"probe",name:"Signal electronics",role:"Converts pressure to a 4\u201320 mA loop current",cat:"internal",color:"#ffd166",explode:[-.09,.04,0],specs:[["Loop current","live","live"]]},jb:{object:r.group,name:"Junction box JB-03",role:"Field junction \xB7 terminal strip",cat:"electronics",color:"#ffb347",explode:[0,0,.3],specs:[["Additional series load","live","synthetic"]]},"jb-lid":{object:r.lid,parent:"jb",name:"JB-03 lid",role:"4-screw cover",cat:"electronics",color:"#ffb347",explode:[0,0,.22],specs:[]},tray:{object:a,name:"Cable tray",role:"Perforated tray along the bulkhead",cat:"structure",color:"#8ea2a9",explode:[0,.3,0],specs:[]},cabinet:{object:o.group,name:"Control cabinet +A1",role:"Level monitoring enclosure",cat:"shell",color:"#5fd4d0",explode:[.35,0,0],specs:[["Enclosure","800 \xD7 1000 \xD7 300 mm","synthetic"]]},door:{object:o.parts.door,parent:"cabinet",name:"Cabinet door",role:"Hinged door with drawing pocket",cat:"shell",color:"#5fd4d0",explode:[-.4,0,.35],specs:[]},breaker:{object:o.parts.breaker,parent:"cabinet",name:"Circuit breaker F1",role:"Loop supply protection",cat:"electronics",color:"#ffb347",explode:[-.05,.08,.3],specs:[["Rating","To confirm","pending"]]},psu:{object:o.parts.psu,parent:"cabinet",name:"Loop power supply G1",role:"DIN-rail DC supply for the 4\u201320 mA loop",cat:"electronics",color:"#ffb347",explode:[-.02,.1,.4],specs:[["Output","live","synthetic"]]},cpu:{object:o.parts.cpu,parent:"cabinet",name:"SIMATIC S7-1200 CPU",role:"PLC controller (model not in evidence)",cat:"electronics",color:"#ffb347",explode:[0,.12,.5],specs:[["Model","CPU 1214C (synthetic)","synthetic"]]},sm1231:{object:o.parts.sm1231,parent:"cabinet",name:"SM 1231 AI \xB7 6ES7231-4HD32-0XB0",role:"Analog input module \xB7 channel AI0 in 4\u201320 mA mode",cat:"electronics",color:"#ffb347",explode:[.1,.12,.62],specs:[["Mode","4\u201320 mA","oem","SIEMENS-SM1231"],["Input impedance","\u2265 270 \u03A9, < 290 \u03A9","oem","SIEMENS-SM1231"],["Evaluated bound","290 \u03A9","oem","SIEMENS-SM1231"],["Nominal range","0 \u2013 27 648","oem","SIEMENS-SM1231"],["Wire-break diagnostic","Qualitative","oem","SIEMENS-SM1231"]]},terminals:{object:o.parts.terminals,parent:"cabinet",name:"Terminal blocks X1",role:"Field-to-PLC marshalling",cat:"electronics",color:"#ffb347",explode:[0,-.12,.35],specs:[]},cabling:{object:m,name:"Loop cabling",role:"Shielded 2-core field cable + internal wiring",cat:"signal",color:"#6fe3a1",explode:[0,0,0],specs:[["Resistance","Included in synthetic load","synthetic"]]},wika:{object:l.group,name:"WIKA LS-10 (reference, removed)",role:"Original level transmitter being replaced",cat:"shell",color:"#c9d1d4",explode:[0,.45,.2],specs:[["Output","4\u201320 mA","oem","WIKA-LS10"],["Installed variant","Not confirmed","pending"]]}};for(let S of Object.values(w).reverse())S.object.traverse(T=>{T.isMesh&&!T.userData.cat&&(T.userData.cat=S.cat)});return{root:c,room:e,parts:w,loopPath:v,dynamic:{water:t.water,surface:t.surface,glassWater:t.glassWater,innerHeight:t.innerHeight,glassSpan:t.glassSpan,psuPlate:o.psuPlate,leds:o.leds,jbStrip:r.strip},anchors:{tank:new R(0,Fe.top+.12,0),probe:new R(0,pn.bottom+.3,0),jb:new R(0,.13,0),psu:new R(0,.08,.05),sm1231:new R(0,.07,.04),wika:new R(0,.14,0)},jbWorld:new R(sn.x,sn.y,sn.z+.02)}}var Ox={overview:{pos:[2.5,2.35,4.1],target:[.05,1,-.45]},probe:{pos:[-.25,1.15,1.25],target:[-.85,.55,-.1]},cabinet:{pos:[1.35,1.38,.15],target:[1.55,1.22,-1.3]}},ch={nominal:{color:"#59ffe0"},empty_tank:{color:"#8fd8ff"},outside_load_envelope:{color:"#ff5a36"},open_circuit:{color:"#ff5a36"}},xl=class extends Zs{constructor(e,t={}){super(e,tf(),{...t,presets:Ox});let n=this.scene,s=this.model;this.plant=s,n.add(new Ji(14674175,3091494,.45));let r=new Ki(16774116,2.1);r.position.set(2.6,4.6,3.2),r.castShadow=!0,r.shadow.mapSize.set(2048,2048),Object.assign(r.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.5,far:14}),r.shadow.bias=-4e-4,r.shadow.normalBias=.02,n.add(r);for(let[c,h]of[[-1.6,-.9],[1.2,-.9],[-1.6,.5],[1.2,.5]]){let d=new On(16773336,2.6,7,2);d.position.set(c,2.7,h),n.add(d)}this.N=110;let a=new Nn({color:ch.nominal.color,transparent:!0,opacity:.95,blending:ts,depthWrite:!1,toneMapped:!1}),o=a.clone();o.opacity=.18,this.flowCore=new qn(new Un(.0105,10,8),a,this.N),this.flowHalo=new qn(new Un(.026,10,8),o,this.N),this.flowCore.frustumCulled=this.flowHalo.frustumCulled=!1,n.add(this.flowCore,this.flowHalo),this.flowOffset=0,this.flowSpeed=0,this.spark=new ut(new Un(.018,12,10),new Nn({color:16752704,toneMapped:!1})),this.spark.position.copy(s.jbWorld),this.sparkLight=new On(16742954,0,1.6,2),this.sparkLight.position.copy(s.jbWorld).add(new R(0,0,.12)),n.add(this.spark,this.sparkLight);let l=s.dynamic.surface.geometry.attributes.position;this.waveBase=Float32Array.from(l.array),this.level=.5,this.levelTarget=.5,this.state="nominal"}setPartVisible(e,t){this.parts[e]&&(this.parts[e].object.visible=t)}applyReport(e){let t=e.simulation,n=e.load_check.status==="pass";this.state=t.state,t.level_fraction!==null&&(this.levelTarget=t.level_fraction);let s=t.loop_signal_ma;this.flowSpeed=t.state==="open_circuit"?0:t.state==="outside_load_envelope"?.018:.012+s*.0048;let r=(ch[t.state]||ch.nominal).color;this.flowCore.material.color.set(r),this.flowHalo.material.color.set(r);let a=e.inputs.supply_v;this.model.dynamic.psuPlate.draw([{text:"POWER",y:80,size:22,weight:700,color:"#d8dadb"},{text:`${a} V`,y:150,size:40,weight:800},{text:"DC",y:186,size:24,weight:600},{text:"DC OK \u25CF",y:300,size:18,weight:600}]);let o=this.model.dynamic.leds;o.psuLed.on(1),o.cpuRun.on(1),o.cpuErr.on(!n||t.state==="open_circuit"?1:0),o.cpuMaint.on(0),o.smCh.forEach((h,d)=>h.on(d===0&&(t.state==="nominal"||t.state==="empty_tank")?1:0)),this.blinkDiag=t.state==="open_circuit"||t.state==="outside_load_envelope",this.blinkDiag||o.smDiag.on(0);let l=(...h)=>this.setLabel(...h),c=e.inputs.synthetic_additional_series_ohm;l("psu","G1 \xB7 Loop supply",`${a} V DC`,n?"ok":"fail"),l("jb","JB-03",t.state==="open_circuit"?"WIRE BREAK":`+${c} \u03A9 series (synthetic)`,t.state==="open_circuit"?"fail":""),l("wika","WIKA LS-10","Reference \xB7 removed"),this.report=e}updateLive(e){if(!this.report)return;let t=e.state,n=t==="open_circuit"||t==="outside_load_envelope",s=e.ma===null?"suppressed":`${e.ma.toFixed(2)} mA`,r=(...o)=>this.setLabel(...o);r("probe","FMX11 \xB7 LT-301",s,n?"fail":"ok"),r("tank","Tank T-03",`Level ${(e.level*100).toFixed(1)} % (physical)`);let a=t==="open_circuit"?"DIAG \xB7 wire break":e.count===null?"Reading suppressed":`AI0 = ${e.count}`;r("sm1231","SM 1231 \xB7 AI0",a,n?"fail":"ok")}tick(e,t){let n=this.model.dynamic;this.level+=(this.levelTarget-this.level)*Math.min(1,e*.8);let s=Math.max(.001,this.level*(Fe.h-.06));n.water.scale.y=s,n.water.visible=n.surface.visible=this.level>.004,n.surface.position.y=Fe.y0+.02+s;let r=n.surface.geometry.attributes.position;for(let c=0;c<r.count;c++){let h=this.waveBase[c*3],d=this.waveBase[c*3+1];r.array[c*3+2]=Math.sin(h*9+t*1.7)*.0035+Math.cos(d*12-t*1.3)*.0028}r.needsUpdate=!0,n.surface.geometry.computeVertexNormals();let a=Fe.y0+.02+s;n.glassWater.scale.y=Math.max(5e-4,Math.min(.88,a-.24));let o=this.flowSpeed>0&&this.explode<.02;if(this.flowCore.visible=this.flowHalo.visible=o,o){this.flowOffset=(this.flowOffset+e*this.flowSpeed)%1;let c=this.state==="outside_load_envelope",h=c?Math.random()>.5?1:.2:1;this.flowCore.material.opacity=.95*h,this.flowHalo.material.opacity=.18*h;for(let d=0;d<this.N;d++){let f=(d/this.N+this.flowOffset)%1,u=this.model.loopPath.getPointAt(f);c&&u.addScalar((Math.random()-.5)*.006),this.tmp.makeTranslation(u.x,u.y,u.z),this.flowCore.setMatrixAt(d,this.tmp),this.flowHalo.setMatrixAt(d,this.tmp)}this.flowCore.instanceMatrix.needsUpdate=!0,this.flowHalo.instanceMatrix.needsUpdate=!0}let l=this.state==="open_circuit"&&this.explode<.02;this.spark.visible=l&&Math.random()>.35,this.spark.scale.setScalar(.6+Math.random()*.9),this.sparkLight.intensity=l?Math.random()>.6?2+Math.random()*4:.3:0,this.blinkDiag&&this.model.dynamic.leds.smDiag.on(Math.sin(t*8)>0?1:.05)}};var K=i=>i/1e3,rn={x:-.03,y0:1.282,z:.031},hs={x:.3,y:1.66,z:0},us={x:.64,y:1.43,z:0};function Gn(i,e,t={}){let n=i.map(([s,r])=>new ge(K(s),K(r)));return z(new Er(n,t.segments??72),e,t)}function hh(i,e,t,{repeat:n=[1,1],srgb:s=!0}={}){let r=document.createElement("canvas");r.width=i,r.height=e,t(r.getContext("2d"),i,e);let a=new Yi(r);return a.wrapS=a.wrapT=Ei,a.repeat.set(...n),a.anisotropy=8,s&&(a.colorSpace=Ft),a}function Fx(){return hh(512,256,(i,e,t)=>{i.fillStyle="#fff",i.fillRect(0,0,e,t),i.fillStyle="#000";let n=16;for(let s=0;s<5;s++)for(let r=0;r<n;r++){let a=(r+s%2*.5)*(e/n)+6,o=22+s*46;i.beginPath(),i.roundRect(a,o,e/n-14,26,10),i.fill()}},{srgb:!1})}function nf(i){return hh(256,512,(e,t,n)=>{e.fillStyle="#1d6b3f",e.fillRect(0,0,t,n),e.strokeStyle="rgba(215,190,90,0.55)",e.lineWidth=5;for(let s=0;s<9;s++)e.beginPath(),e.moveTo(20+s*24,n),e.lineTo(20+s*24,n*.62-s*6),e.lineTo(t*.5,n*.4-s*12),e.stroke();e.fillStyle="#e8e2c8",e.font="600 26px Helvetica, Arial",e.fillText(i==="dip"?"THT-02 ADDR":"RS485 \xB7 LDO",20,40),e.fillText("SW1",30,120),e.fillStyle="#c9a646";for(let s=0;s<6;s++)e.fillRect(28+s*36,n-34,20,20)})}function Bx(){return hh(512,512,(i,e,t)=>{i.fillStyle="#c9cec6",i.fillRect(0,0,e,t);for(let n=0;n<2600;n++)i.fillStyle=`rgba(0,0,0,${Math.random()*.05})`,i.fillRect(Math.random()*e,Math.random()*t,2,2);i.strokeStyle="rgba(80,80,70,0.35)",i.lineWidth=3,i.beginPath(),i.moveTo(0,t*.33),i.lineTo(e,t*.33),i.stroke();for(let n=0;n<40;n++)i.fillStyle=`rgba(120,60,30,${Math.random()*.12})`,i.beginPath(),i.arc(Math.random()*e,t-Math.random()*60,3+Math.random()*10,0,Math.PI*2),i.fill()},{repeat:[3,2]})}function kx(i,e){let t=new Ne;t.position.set(rn.x,rn.y0,rn.z);let n=new Ne,s=z(new Ri(K(8),K(8),K(28),72,1,!0),e.strainer,{pos:[0,K(16),0]}),r=Gn([[0,0],[6.8,0],[7.8,.6],[8,1.6],[8,2],[0,2]],i.stainless),a=Gn([[0,30],[8,30],[8,32],[0,32]],i.stainless),o=z(new Ri(K(6.6),K(6.6),K(27),48,1,!0),e.membrane,{pos:[0,K(16),0],cast:!1}),l=Gn([[7.6,32],[8.05,32.4],[8.25,35],[8.05,37.6],[7.6,38]],e.rubber),c=Gn([[0,37.8],[7.6,37.8],[8,38.4],[8,67.4],[8.4,68],[9,68.6],[9,77.6],[8.6,78],[7.4,78],[7.4,38.2],[0,38.2]],e.barrel);n.add(s,r,a,o,l,c);for(let T of[52,53])n.add(Gn([[8.01,T],[8.06,T+.2],[8.01,T+.4]],i.stainlessDark,{cast:!1}));let h=new Ne;h.add(z(pe(K(7),K(14),K(1)),e.pcbDip,{pos:[0,K(12),0],cat:"internal"})),h.add(z(pe(K(2.5),K(2.5),K(.9)),i.chip,{pos:[0,K(7),K(.9)],cat:"internal"})),h.add(z(pe(K(2.6),K(1),K(.2)),i.white,{pos:[0,K(7),K(1.4)],cat:"internal"})),n.add(h);let d=new Ne,f=Gn([[0,70],[7.2,70],[7.2,78.2],[0,78.2]],i.stainlessDark);d.add(f);for(let T=70.6;T<78;T+=.9)d.add(Gn([[7.15,T],[7.55,T+.35],[7.15,T+.7]],i.stainless,{cast:!1,segments:48}));d.add(Gn([[7.4,78],[8.6,78],[9,78.4],[9,87.4],[8.6,88],[8,88.4],[8,121.4],[7.6,122],[0,122],[0,78]],e.barrel)),d.add(Gn([[8.6,77.95],[9.02,78.1],[9.02,78.4],[8.6,78.2]],i.black,{cast:!1}));let u=z(new zn(K(42),K(20),K(2),2,K(1.2)),i.stainless,{pos:[0,K(80),K(-17)]});d.add(u,z(pe(K(8),K(14),K(9)),i.stainless,{pos:[0,K(80),K(-11.5)]}));for(let T of[-16,16]){d.add(z(Ye(K(3.6),K(2.2),24),i.stainlessDark,{pos:[K(T),K(80),K(-15.4)],rot:[Math.PI/2,0,0]}));let E=z(pe(K(4.4),K(.7),K(.6)),i.black,{pos:[K(T),K(80),K(-14.2)],rot:[0,0,T>0?.5:-.3],cast:!1});d.add(E)}d.add(z(pe(K(10),K(4),K(.05)),e.laser,{pos:[0,K(104),K(8.02)],cast:!1}));let p=new Ne;p.add(z(Ye(K(8.6),K(7),6),e.nickel,{pos:[0,K(126),0]})),p.add(Gn([[0,129.4],[7.75,129.4],[7.75,131],[6.6,135],[4.2,138.6],[3.2,140],[0,140]],e.rubber)),p.add(Gn([[2.7,139.5],[2.7,141],[0,141]],e.rubber,{cast:!1}));let x=new Ne,g=z(pe(K(11),K(36),K(1.2)),e.pcbDip,{pos:[0,K(56),0]});x.add(g);let m=z(pe(K(6),K(21.5),K(3)),e.dipBody,{pos:[0,K(55),K(2.1)]});x.add(m),x.add(z(pe(K(3),K(1.6),K(.1)),e.onMark,{pos:[K(-1.4),K(66.6),K(3.62)],cast:!1}));let v=[];for(let T=0;T<8;T++){let E=K(64-T*2.54-.4);x.add(z(pe(K(4.2),K(1.3),K(.2)),i.black,{pos:[0,E,K(3.62)],cast:!1}));let _=z(pe(K(1.6),K(1.15),K(1)),e.slider,{pos:[K(1.1),E,K(3.9)]});_.userData.dip=T,v.push(_),x.add(_)}x.add(z(pe(K(1.2),K(1.2),K(.2)),i.gold,{pos:[K(-4.2),K(40),K(.65)],cast:!1}));let w=new Ne;return w.add(z(pe(K(11),K(30),K(1.2)),e.pcbRs,{pos:[0,K(105),0]})),w.add(z(pe(K(4),K(5),K(1.5)),i.chip,{pos:[K(-1.5),K(108),K(1.3)]})),w.add(z(pe(K(3.5),K(4),K(1.6)),i.chip,{pos:[K(2),K(98),K(1.3)]})),w.add(z(pe(K(1.6),K(.9),K(.9)),i.ceramic,{pos:[K(2.5),K(110),K(1)]})),[e.wireRed,e.wireBlack,e.wireYellow,e.wireGreen].forEach((T,E)=>{let _=K(-3+E*2);w.add(mi([[_,K(118),K(.7)],[_*.6,K(124),K(.5)],[_*.3,K(136),0],[_*.2,K(146),0]],K(.55),T,{segments:24,cat:"signal"}))}),t.add(n,d,p,x,w),{group:t,head:n,body:d,gland:p,dip:x,rs:w,sht:h,sliders:v}}function zx(i,e){let t=new Ne;t.add(z(new ft(4.2,2.6),e.bulkhead,{pos:[.2,1.4,0],cast:!1})),t.add(z(new ft(4.2,2.6),i.floor,{rot:[-Math.PI/2,0,0],pos:[.2,.1,1.3],cast:!1}));for(let a of[-.75,1.15])t.add(z(pe(.012,2.6,.14),e.frame,{pos:[a,1.4,.07]})),t.add(z(Ye(.016,2.6,16),e.frame,{pos:[a,1.4,.14]}));t.add(z(pe(4.2,.012,.16),e.frame,{pos:[.2,2.42,.08]}));let n=zt({w:256,h:128,bg:"#c9cec6",fg:"#3b3f3a"});n.draw([{text:"FR 42",y:88,size:72,weight:800,align:"center"}]),t.add(z(new ft(.2,.1),new ot({map:n.texture,roughness:.8}),{pos:[-.42,2.12,.002],cast:!1}));let s=zt({w:512,h:160,bg:"#f2c230",fg:"#111"});s.draw([{text:"SWITCHBOARD VENT \xB7 SENSOR ZONE",y:70,size:34,weight:800,align:"center"},{text:"Do not paint over sensors",y:125,size:28,weight:600,align:"center"}]),t.add(z(new ft(.26,.08),new ot({map:s.texture,roughness:.6}),{pos:[.3,2,.002],cast:!1}));let r=new Ne;r.add(z(pe(3.6,.006,.22),i.stainlessDark,{pos:[.2,1.9,.18]}));for(let a of[.07,.29])r.add(z(pe(3.6,.05,.006),i.stainlessDark,{pos:[.2,1.925,a]}));for(let a=-1.4;a<1.8;a+=.6)r.add(z(pe(.02,.1,.24),i.stainlessDark,{pos:[a,1.95,.18]}));[[.11,.012,i.cable],[.14,.009,e.greyCable],[.17,.014,i.cable],[.205,.008,e.orangeCable],[.24,.011,i.cable]].forEach(([a,o,l])=>r.add(z(Ye(o,3.6,16),l,{pos:[.2,1.906+o,a],rot:[0,0,Math.PI/2]}))),t.add(r);for(let[a,o]of[[.55,i.pipeBlue],[.75,e.pipeGrey]])t.add(z(Ye(.04,4.2,28),o,{pos:[.2,a,.16],rot:[0,0,Math.PI/2]}));return t.add(z(pe(1.2,.05,.14),i.white,{pos:[.2,2.55,.6]})),t.add(z(pe(1.12,.012,.09),i.lamp,{pos:[.2,2.524,.6],cast:!1})),t.traverse(a=>{a.isMesh&&(a.userData.cat="structure")}),t}function Hx(i,e){let t=new Ne;t.position.set(rn.x+.035,1.355,0),t.add(z(new zn(.17,.2,.006,2,.004),i.stainless,{pos:[0,0,.003]}));for(let[o,l]of[[-.075,.09],[.075,.09],[-.075,-.09],[.075,-.09]])t.add(z(Ye(.004,.004,16),i.stainlessDark,{pos:[o,l,.007],rot:[Math.PI/2,0,0]}));let n=zt({w:512,h:360,bg:"#e9ebe6",fg:"#1b1d1f",border:"#2b2f31"}),s=e.map((o,l)=>({text:o,y:60+l*52,size:l===0?44:l===e.length-1?22:26,weight:l===0?800:600,x:30,color:l===e.length-1?"#a3261b":void 0}));n.draw(s);let r=z(new ft(.075,.053),new ot({map:n.texture,roughness:.45,metalness:.3}),{pos:[.04,-.035,.0064],cast:!1});t.add(r);for(let[o,l]of[[.006,-.009],[.074,-.009],[.006,-.061],[.074,-.061]])t.add(z(Ye(.0015,.001,12),i.stainlessDark,{pos:[o,l,.0068],rot:[Math.PI/2,0,0],cast:!1}));let a=zt({w:512,h:96,bg:"#1d3e66",fg:"#ffffff"});return a.draw([{text:"BOAT-ER-TH-02",y:64,size:50,weight:800,align:"center"}]),t.add(z(new ft(.075,.014),new ot({map:a.texture,roughness:.5}),{pos:[.04,.03,.0064],cast:!1})),{group:t,faceWorld:new R(rn.x+.075,1.32,.03)}}function Gx(i,e){let t=new Ne;t.position.set(hs.x,hs.y,hs.z);let n=z(new zn(.16,.12,.06,3,.006),e.polyGrey,{pos:[0,0,.03]});t.add(n);let s=new Ne;s.position.set(0,0,.061),s.add(z(new zn(.162,.122,.012,3,.005),e.polyGrey));for(let[l,c]of[[-.07,.05],[.07,.05],[-.07,-.05],[.07,-.05]])s.add(z(Ye(.004,.003,16),i.stainlessDark,{pos:[l,c,.007],rot:[Math.PI/2,0,0]}));let r=zt({w:512,h:128,bg:"#f4f4f0",fg:"#111"});r.draw([{text:"JB-ER-07",y:62,size:56,weight:800,align:"center"},{text:"RS-485 SEG B",y:110,size:30,weight:600,align:"center"}]),s.add(z(new ft(.08,.02),new ot({map:r.texture,roughness:.6}),{pos:[0,.025,.0062],cast:!1})),t.add(s);let a=new Ne;[i.termRed,i.black,e.termYellow,e.termGreen,i.termGrey,i.termGrey].forEach((l,c)=>a.add(z(pe(.0062,.04,.03),l,{pos:[-.018+c*.0068,0,.022]}))),a.add(z(pe(.11,.035,.0075),i.din,{pos:[0,0,.004]})),t.add(a);for(let l of[-.04,0,.04])t.add(z(Ye(.007,.016,6),e.polyDark,{pos:[l,-.067,.03]}));return t.add(z(Ye(.007,.016,6),e.polyDark,{pos:[.087,-.02,.03],rot:[0,0,Math.PI/2]})),{group:t,lid:s,cableIn:new R(hs.x-.04,hs.y-.075,.03),trunkOut:new R(hs.x+.095,hs.y-.02,.03)}}function Vx(i,e){let t=new Ne;t.position.set(us.x,us.y,us.z),t.add(z(new zn(.2,.17,.012,2,.004),i.cabinet,{pos:[0,0,.006]})),t.add(z(pe(.18,.035,.0075),i.din,{pos:[0,-.01,.016]}));let n=z(new zn(.106,.09,.058,3,.004),e.polyLight,{pos:[0,-.01,.048]});t.add(n);let s=zt({w:512,h:256,bg:"#0b1e14",fg:"#7dffb0"}),r=z(new ft(.062,.031),new Nn({map:s.texture,toneMapped:!1}),{pos:[-.012,.004,.0775],cast:!1});r.material.userData.keep=!0,t.add(z(pe(.068,.037,.002),i.black,{pos:[-.012,.004,.0767],cast:!1}),r);let a=zt({w:512,h:80,bg:"#d9dcdf",fg:"#2a2e31"});a.draw([{text:"MODBUS MASTER \xB7 SYNTHETIC",y:54,size:36,weight:800,align:"center"}]),t.add(z(new ft(.09,.014),new ot({map:a.texture,roughness:.6}),{pos:[0,-.04,.0772],cast:!1}));let o={pwr:Hn(4063098),tx:Hn(4063098),rx:Hn(16756782),err:Hn(16724016)};Object.values(o).forEach((c,h)=>t.add(z(Ye(.0022,.002,16),c.material,{pos:[.033,.017-h*.009,.0775],rot:[Math.PI/2,0,0],cast:!1})));let l=zt({w:128,h:256,bg:"#d9dcdf",fg:"#2a2e31"});l.draw(["PWR","TX","RX","ERR"].map((c,h)=>({text:c,y:50+h*58,size:34,weight:700,x:10}))),t.add(z(new ft(.012,.038),new ot({map:l.texture}),{pos:[.044,.004,.0772],cast:!1}));for(let c=0;c<4;c++)t.add(z(pe(.008,.01,.012),e.termGreen,{pos:[-.04+c*.01,-.06,.05]}));return{group:t,lcd:s,leds:o,port:new R(us.x-.04,us.y-.066,.05)}}function sf(i){let e=lh(),t=(w,S,T,E={})=>new ot({color:w,roughness:S,metalness:T,...E}),n=gl(205),s={strainer:new ot({color:12109008,metalness:.9,roughness:.3,map:n,alphaMap:Fx(),alphaTest:.5,side:Nt}),membrane:t(15987694,.9,0,{side:Nt}),barrel:new Zn({color:13226198,metalness:.92,roughness:.24,map:n,clearcoat:.2}),nickel:t(12172476,.32,.95),rubber:t(1447962,.8,.02),laser:t(7172984,.6,.5),pcbDip:t(16777215,.55,.1,{map:nf("dip")}),pcbRs:t(16777215,.55,.1,{map:nf("rs")}),dipBody:t(12592685,.45,.05),onMark:t(16777215,.5,0),slider:t(16053487,.35,.02),wireRed:t(12593194,.5,.05),wireBlack:t(1315860,.5,.05),wireYellow:t(15254044,.5,.05),wireGreen:t(3119946,.5,.05),termYellow:t(14727198,.6,.05),termGreen:t(3115589,.6,.05),polyGrey:t(10397354,.5,.05),polyDark:t(3027767,.6,.05),polyLight:t(14672612,.45,.05),greyCable:t(9080722,.6,.05),orangeCable:t(13656094,.6,.05),pipeGrey:t(9146774,.5,.4),frame:t(12172982,.7,.25),bulkhead:t(16777215,.8,.12,{map:Bx()})};for(let w of[e.stainless,e.stainlessDark,e.black,s.barrel,s.rubber,s.nickel])w.side=Nt;let r=zx(e,s),a=kx(e,s),o=Hx(e,i),l=Gx(e,s),c=Vx(e,s),h=new Ne;h.add(r,o.group,a.group,l.group,c.group),h.updateMatrixWorld(!0);let d=new R(rn.x,rn.y0+K(141),rn.z),f=mi([[d.x,d.y,d.z],[d.x,d.y+.05,d.z+.004],[d.x+.06,d.y+.13,.03],[l.cableIn.x-.02,l.cableIn.y-.06,.03],[l.cableIn.x,l.cableIn.y-.012,.03],[l.cableIn.x,l.cableIn.y+.01,.03]],K(2.5),e.cable,{cat:"signal",segments:160,tension:.3}),u=mi([[l.trunkOut.x,l.trunkOut.y,.03],[l.trunkOut.x+.06,l.trunkOut.y-.01,.034],[c.port.x-.05,c.port.y-.05,.05],[c.port.x,c.port.y-.02,.05],[c.port.x,c.port.y+.004,.05]],K(3.2),s.greyCable,{cat:"signal",segments:140,tension:.3}),p=new Ne;p.add(f,u),h.add(p);for(let w of[f,u])for(let S=.12;S<.95;S+=.28){let T=w.userData.curve.getPointAt(S);Math.abs(T.z)>.012&&p.add(z(pe(.012,.004,Math.max(.004,T.z)),e.black,{pos:[T.x,T.y,T.z/2],cast:!1}))}let x=new Zi;x.add(new Yn(new R(us.x-.012,us.y+.004,.08),c.port.clone().setZ(.05)));let g=u.userData.curve.points.slice().reverse();x.add(new ci(g,!1,"catmullrom",.3)),x.add(new Yn(l.trunkOut.clone(),l.cableIn.clone()));let m=f.userData.curve.points.slice().reverse();x.add(new ci(m,!1,"catmullrom",.3)),x.add(new Yn(d.clone(),new R(rn.x,rn.y0+K(105),rn.z)));let v={tht:{object:a.group,name:"TZ THT-02 \xB7 BOAT-ER-TH-02",role:"RS-485 Modbus RTU temperature & humidity sensor",cat:"shell",color:"#b8c4d0",explode:[0,0,0],specs:[["Interface","RS-485 \xB7 Modbus RTU","oem","TZ-THT02-UM-V1.0"],["Line format","8N1 \xB7 default 9600 baud","oem","TZ-THT02-UM-V1.0"],["Address","DIP-8 (128\u20261)","oem","TZ-THT02-UM-V1.0"],["Body","\xD816 \xD7 140 mm","fieldscan"],["Serial","SYN-2411-0042","synthetic"],["Order variant","Not confirmed","pending"]]},"tht-gland":{object:a.gland,parent:"tht",name:"Waterproof gland",role:"Rear gland nut \xB7 step 1: unscrew",cat:"shell",color:"#b8c4d0",explode:[0,.05,0],spin:[0,1,0,Math.PI*6],window:[0,.35],specs:[["Zone","122\u2013140 mm \xB7 \xD815.5","fieldscan"],["Cable","\xD85 mm \xB7 4 cores \xB7 1 m","fieldscan"]]},"tht-head":{object:a.head,parent:"tht",name:"Sensor head + DIP barrel",role:"Step 2: unscrew at the middle seam",cat:"shell",color:"#b8c4d0",explode:[0,-.085,0],spin:[0,1,0,-Math.PI*5],window:[.3,.7],specs:[["Zones","Strainer 0\u201332 \xB7 seal 32\u201338 \xB7 barrel 38\u201368 mm","fieldscan"],["Strainer","Slotted stainless","fieldscan"]]},"tht-sht":{object:a.sht,parent:"tht-head",name:"Sensing element (SHT30)",role:"Temperature and humidity element behind the strainer",cat:"internal",color:"#ffd166",explode:[0,0,0],specs:[["Element","SHT30 (FieldScan reference)","fieldscan"],["Fault marker","7FFF H","oem","TZ-THT02-UM-V1.0"]]},"tht-dip":{object:a.dip,parent:"tht",name:"DIP-8 address switch",role:"Sets the Modbus slave address (\xA7 5)",cat:"internal",color:"#ffd166",explode:[0,-.004,.022],window:[.65,1],specs:[["Weights","1:128 2:64 3:32 4:16 5:8 6:4 7:2 8:1","oem","TZ-THT02-UM-V1.0"],["Current address","live","live"]]},"tht-rs485":{object:a.rs,parent:"tht",name:"RS-485 transceiver PCB",role:"Line driver + regulator \xB7 leads Red V+, Black GND, Yellow A+, Green B\u2212",cat:"internal",color:"#ffd166",explode:[0,0,.026],window:[.7,1],specs:[["Leads","Red V+ \xB7 Black GND \xB7 Yellow A+ \xB7 Green B\u2212","oem","TZ-THT02-UM-V1.0"],["Supply","DC 5\u201324 V (plate)","synthetic"]]},"tht-body":{object:a.body,parent:"tht",name:"Flange, bracket and RS-485 barrel",role:"Bracket 42 \xD7 20 mm \xB7 \xD84.2 holes at 32 mm",cat:"shell",color:"#b8c4d0",explode:[0,0,0],specs:[["Zones","Flange 68\u201388 \xB7 barrel 88\u2013122 mm","fieldscan"]]},plate:{object:o.group,name:"Mounting plate + nameplate",role:"Synthetic nameplate for the demo",cat:"structure",color:"#c9d1d4",explode:[0,0,0],specs:[["Plate text","Synthetic","synthetic"]]},jb:{object:l.group,name:"Junction box JB-ER-07",role:"RS-485 segment B marshalling",cat:"electronics",color:"#ffb347",explode:[0,0,0],specs:[["Segment","B \xB7 9600 8N1","synthetic"]]},"jb-lid":{object:l.lid,parent:"jb",name:"JB-ER-07 lid",role:"4-screw cover",cat:"electronics",color:"#ffb347",explode:[0,0,.09],window:[0,.5],specs:[]},gateway:{object:c.group,name:"Modbus master (synthetic)",role:"Polls address 1 \xB7 FC03 \xB7 registers 0\u20131",cat:"electronics",color:"#ffb347",explode:[0,0,0],specs:[["Master polls","Address 1","synthetic"],["Function","03 \xB7 2 registers from 0","synthetic"],["Timeout","1000 ms","synthetic"]]},cabling:{object:p,name:"RS-485 cabling",role:"Sensor lead + segment B trunk",cat:"signal",color:"#6fe3a1",explode:[0,0,0],specs:[]}};for(let w of Object.values(v).reverse())w.object.traverse(S=>{S.isMesh&&!S.userData.cat&&(S.userData.cat=w.cat)});return{root:h,room:r,parts:v,busPath:x,sliders:a.sliders,dynamic:{lcd:c.lcd,leds:c.leds},anchors:{tht:new R(-.03,K(60),.02),jb:new R(0,.085,.03),gateway:new R(0,.1,.05)},probeWorld:new R(rn.x,rn.y0+K(70),rn.z),plateWorld:o.faceWorld}}var Wx={overview:{pos:[.5,1.56,1.22],target:[.33,1.46,.02]},camera:{pos:[.08,1.4,.55],target:[.02,1.36,.02]},probe:{pos:[.12,1.4,.3],target:[-.03,1.36,.03]},plate:{pos:[.06,1.33,.2],target:[.045,1.325,.006]},dip:{pos:[.05,1.35,.14],target:[-.03,1.335,.04]},gateway:{pos:[.66,1.44,.32],target:[.64,1.43,.06]}},na={request:4647167,reply:16756782,error:16726832},uh=.0011,yl=class extends Zs{constructor(e,{plateLines:t,onDip:n=()=>{},...s}={}){super(e,sf(t),{...s,presets:Wx,initial:"overview",background:"#11181c",fog:[3,9],minFocus:.09,focusScale:2.2,near:.005,minDistance:.05,maxDistance:3,exposure:1.1}),this.onDip=n;let r=this.scene;r.add(new Ji(15134719,3814442,.55));let a=new Ki(16773599,2.2);a.position.set(1.2,2.6,1.8),a.target.position.set(.2,1.4,0),a.castShadow=!0,a.shadow.mapSize.set(2048,2048),Object.assign(a.shadow.camera,{left:-1,right:1,top:1,bottom:-1,near:.5,far:5}),a.shadow.bias=-3e-4,a.shadow.normalBias=.01,r.add(a,a.target);let o=new On(16773336,1.6,3,2);o.position.set(.2,2.45,.6),r.add(o);let l=new Pr(16777215,0,1.6,.35,.6,1.5);l.position.set(.1,1.45,.6),l.target.position.copy(this.model.probeWorld),r.add(l,l.target),this.torch=l;for(let h of this.model.sliders)h.userData.hint="DIP";this.dipBits=[0,0,0,0,0,0,1,0],this.sliderX=this.model.sliders.map(()=>uh);let c=new Un(.0032,12,10);this.packets=[];for(let h=0;h<10;h++){let d=new ut(c,new Nn({color:na.request,transparent:!0,toneMapped:!1,depthTest:!1}));d.renderOrder=5,d.visible=!1,r.add(d),this.packets.push(d)}this.flash=new On(na.error,0,.35,2),this.flash.position.copy(this.model.probeWorld).add(new R(0,.04,.03)),r.add(this.flash),this.anim=null,this.lcdLines=null,this.drawLcd({status:"idle"}),this.model.dynamic.leds.pwr.on(1)}setDip(e){this.dipBits=[...e],this.model.sliders.forEach((n,s)=>{n.userData.hint=`DIP ${s+1} (${Fi[s]}) \xB7 ${e[s]?"ON":"OFF"} \u2014 click to toggle`});let t=e.reduce((n,s,r)=>n+(s?Fi[r]:0),0);this.setLabel("tht","THT-02 \xB7 DIP",`address ${t}`,"")}onPickObject(e){return e.userData.dip===void 0?!1:(this.onDip(e.userData.dip),!0)}setTorch(e){this.torch.intensity=e?6:0}drawLcd({status:e,tx:t=null,master:n=1}){let s=[{text:"SEG B \xB7 9600 8N1",y:46,size:30,weight:700},{text:`POLL ADDR ${n} \xB7 FC03 R0\xD72`,y:96,size:30,weight:600}];if(e==="valid")s.push({text:`${t.decode.values.temperature_c.toFixed(1)} \xB0C   ${t.decode.values.humidity_rh.toFixed(1)} %RH`,y:168,size:46,weight:800}),s.push({text:"OK \xB7 CRC MATCH",y:228,size:30,weight:700});else if(e==="idle")s.push({text:"WAITING\u2026",y:175,size:44,weight:800});else{let r={timeout:"NO REPLY \xB7 TIMEOUT",invalid:"FRAME REJECTED",sensor_abnormal:"SENSOR 7FFF H",exception:"EXCEPTION"}[e]||e.toUpperCase();s.push({text:r,y:168,size:42,weight:800,color:"#ff8f7a"});let a=t?.decode.checks.find(o=>!o.ok);s.push({text:a?`${a.check.toUpperCase()}: ${a.detail}`.slice(0,30):"",y:228,size:26,weight:600,color:"#ff8f7a"})}this.model.dynamic.lcd.draw(s),this.lcdStatus=e}setLiveLabels(e){let t=e.decode.status;this.setLabel("gateway","Master \xB7 addr 1",t==="valid"?`${e.decode.values.temperature_c.toFixed(1)} \xB0C \xB7 ${e.decode.values.humidity_rh.toFixed(1)} %RH`:t.replace("_"," "),t==="valid"?"ok":"fail"),this.setLabel("jb","JB-ER-07","Segment B \xB7 A+/B\u2212")}playTransaction(e,{quiet:t=!1}={}){this.anim={tx:e,start:performance.now(),quiet:t},this.model.dynamic.leds.tx.on(1),this.setLiveLabels(e)}tick(e,t){this.model.sliders.forEach((d,f)=>{let u=this.dipBits[f]?-uh:uh;this.sliderX[f]+=(u-this.sliderX[f])*Math.min(1,e*10),d.position.x=this.sliderX[f]});let n=this.model.dynamic.leds;if(!this.anim){for(let d of this.packets)d.visible=!1;this.flash.intensity*=.9,n.err.on(this.lcdStatus&&!["valid","idle"].includes(this.lcdStatus)?.4+.6*(Math.sin(t*6)>0):0);return}let{tx:s}=this.anim,r=(performance.now()-this.anim.start)/1e3,a=s.decode.status,o=.7,l=.7,c=this.model.busPath,h=(d,f)=>{this.packets.forEach((u,p)=>{let x=d-p*.018;u.visible=x>=0&&x<=1&&this.explode<.05,u.visible&&(u.position.copy(c.getPointAt(Math.min(1,x))),u.material.color.setHex(f),u.material.opacity=1-p*.085)})};if(r<o)h(r/o*1.15,na.request);else if(a==="timeout")h(-1,0),n.tx.on(0),this.flash.intensity=!this.anim.quiet&&r<o+.5?.6*(Math.sin(r*40)>0):0,r>o+1&&this.finish(s);else if(r<o+l){n.tx.on(0),n.rx.on(1);let d=a==="valid"?na.reply:na.error;h(1.15-(r-o)/l*1.15,d)}else this.finish(s)}finish(e){this.anim=null;let t=this.model.dynamic.leds;t.tx.on(0),t.rx.on(0),this.drawLcd({status:e.decode.status,tx:e,master:e.master_address})}};function Xx(i){let e=0;for(let t=0;t<i.length;t++)e+=i[t]*i[t];return Math.sqrt(e/i.length)}function $x(i){let e=new Float32Array(i.reduce((n,s)=>n+s.length,0)),t=0;for(let n of i)e.set(n,t),t+=n.length;return e}function qx(i,e){if(e===16e3)return i;let t=e/16e3,n=new Float32Array(Math.floor(i.length/t));for(let s=0;s<n.length;s++){let r=Math.floor(s*t),a=Math.min(i.length,Math.floor((s+1)*t)),o=0;for(let l=r;l<a;l++)o+=i[l];n[s]=o/Math.max(1,a-r)}return n}function Yx(i,e){let t=qx(i,e),n=new ArrayBuffer(44+t.length*2),s=new DataView(n),r=(l,c)=>{for(let h=0;h<c.length;h++)s.setUint8(l+h,c.charCodeAt(h))};r(0,"RIFF"),s.setUint32(4,36+t.length*2,!0),r(8,"WAVE"),r(12,"fmt "),s.setUint32(16,16,!0),s.setUint16(20,1,!0),s.setUint16(22,1,!0),s.setUint32(24,16e3,!0),s.setUint32(28,16e3*2,!0),s.setUint16(32,2,!0),s.setUint16(34,16,!0),r(36,"data"),s.setUint32(40,t.length*2,!0);for(let l=0;l<t.length;l++){let c=Math.max(-1,Math.min(1,t[l]));s.setInt16(44+l*2,c<0?c*32768:c*32767,!0)}let a=new Uint8Array(n),o="";for(let l=0;l<a.length;l+=32768)o+=String.fromCharCode(...a.subarray(l,l+32768));return btoa(o)}var ia=class{constructor(e){this.h=e,this.active=!1,this.paused=!1}async start(){this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0,channelCount:1}}),this.ctx=new AudioContext,this.rate=this.ctx.sampleRate;let e=this.ctx.createMediaStreamSource(this.stream);this.node=this.ctx.createScriptProcessor(2048,1,1),this.node.onaudioprocess=t=>this.onFrame(new Float32Array(t.inputBuffer.getChannelData(0))),e.connect(this.node),this.node.connect(this.ctx.destination),this.frameMs=2048/this.rate*1e3,this.floor=.006,this.preRoll=[],this.chunks=null,this.voiceMs=0,this.silenceMs=0,this.loudMs=0,this.active=!0}stop(){this.active=!1,this.node?.disconnect(),this.stream?.getTracks().forEach(e=>e.stop()),this.ctx?.close(),this.node=this.stream=this.ctx=null,this.chunks=null}onFrame(e){if(!this.active||this.paused)return;let t=Xx(e),n=this.h.isAssistantSpeaking?.(),s=Math.max(n?.05:.018,this.floor*(n?6:3)),r=t>s;if(!this.chunks&&!r&&(this.floor=this.floor*.97+t*.03),this.h.onLevel?.(Math.min(1,t/.12),!!this.chunks),this.paused)return;if(!this.chunks){for(this.preRoll.push(e);this.preRoll.length*this.frameMs>300;)this.preRoll.shift();this.loudMs=r?this.loudMs+this.frameMs:0,this.loudMs>=(n?220:90)&&(n&&this.h.onBargeIn?.(),this.chunks=[...this.preRoll],this.voiceMs=this.loudMs,this.silenceMs=0,this.h.onSpeechStart?.());return}this.chunks.push(e),r?(this.voiceMs+=this.frameMs,this.silenceMs=0):this.silenceMs+=this.frameMs;let a=this.chunks.length*this.frameMs;if(this.silenceMs>=750||a>=15e3){let o=this.chunks,l=this.voiceMs;this.chunks=null,this.preRoll=[],this.loudMs=0,l>=280?this.h.onUtterance?.(Yx($x(o),this.rate),a):this.h.onDiscard?.()}}};var Rn=new Intl.NumberFormat("en-US",{maximumFractionDigits:1}),lf=new Intl.NumberFormat("en-US"),rf=i=>new Promise(e=>setTimeout(e,i)),Zx=i=>i.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),bl=i=>(i>=0?"+":"")+Rn.format(i),jx=[[/gland|cable entry/,"tht-gland"],[/dip|address switch|switch/,"tht-dip"],[/sht|sensing element|element|strainer|head/,"tht-sht"],[/rs-?485|transceiver|pcb|board/,"tht-rs485"],[/bracket|flange|body|barrel/,"tht-body"],[/plate|nameplate|label/,"plate"],[/junction|\bjb\b|lid/,"jb"],[/gateway|master|lcd|display/,"gateway"],[/cable|wiring/,"cabling"],[/probe|sensor|tht/,"tht"]],Jx={live:["Identify this sensor","Confirm the asset","What do you see?","Show the plate","Why does it fail?","Is everything OK?"],diag:["Why does it fail?","What do you see?","Show the manual","Simulate the DIP fix","Does it work now?","Inject a bad CRC","Disassemble the probe"],compat:["Is everything OK?","Switch to 12 V","Simulate an open wire","Explain the margin","Is the spare a valid replacement?","X-ray view"]},dh=i=>i[Math.floor(Math.random()*i.length)],af=i=>i.slice(0,4).join("")+" "+i.slice(4).join(""),Kx=[[/modbus/,"Modbus RTU is a master/slave protocol: the master (here the ventilation controller) sends a request to one slave address, and only the slave with that address answers. Each frame is address \xB7 function \xB7 data \xB7 CRC-16. The THT-02 answers function 03 (read holding registers) at 9600 baud, 8N1 by default (\xA7 6.1, \xA7 6.4)."],[/rs-?485|two[- ]wire|a\+|b-/,"RS-485 is the differential two-wire bus that carries the Modbus frames. On the THT-02 the leads are Red V+, Black GND, Yellow A+ and Green B\u2212 (\xA7 4.6). Swapping A/B or a missing ground usually gives garbled frames (CRC errors), not a clean timeout."],[/\bcrc\b|checksum/,"The CRC-16/MODBUS is a 2-byte checksum at the end of every frame. If it does not match, the receiver silently discards the frame (\xA7 6.10), so a bad CRC looks like noise, while a wrong address looks like total silence (timeout)."],[/\bdip\b|address switch|dip switch/,"The THT-02 slave address is set by an 8-way DIP switch. Switches 1\u20138 weigh 128, 64, 32, 16, 8, 4, 2, 1 (\xA7 5). Right now the sensor reads {dip} \u2192 address {addr}; the master polls {master}."],[/timeout|no reply|silent|no response/,"A timeout means no frame came back within 1000 ms. With Modbus that usually means nobody owns the polled address: wrong DIP address, wrong baud rate, or the sensor is unpowered. A corrupted reply would show as a CRC error instead."],[/7fff|abnormal/,"7FFF H in register 0 or 1 is the manual's \u201Csensor abnormal\u201D marker (\xA7 6.4/\xA7 6.7): the frame is valid, but the reading must not be trusted."],[/register/,"THT-02 registers (\xA7 6.4): 0 = temperature \xD70.1 \xB0C (signed), 1 = relative humidity \xD70.1 %, 4 = address code from the DIP, 5 = baud rate, 6/7 = hardware/software version. 7FFF H means sensor abnormal."],[/tht-?02|\bsensor\b.*(is|model)|what (is|are) (the )?(sensor|probe)/,"The TZ THT-02 is a stainless temperature/humidity probe with an SHT30-class element, an RS-485 Modbus RTU interface and an internal DIP-8 address switch. It is asset BOAT-ER-TH-02 on the engine-room bulkhead. Its manual (TZ-THT02-UM-V1.0) is marked \u201Cto confirm\u201D: the edition is not verified against the manufacturer."],[/4.?20|current loop|\bloop\b/,"A 4\u201320 mA loop carries the level as a current: 4 mA = 0 %, 20 mA = 100 %. The transmitter needs a minimum voltage at its terminals, so the supply minus the drop across every load in the loop must stay above it. Workspace 3 checks that for the FMX11 replacing the WIKA LS-10."],[/digital twin|\btwin\b|3d/,"The digital twin is a Three.js model of the installation driven by the same session state as the tools: the DIP, bus packets, LCD and loop current you see come from the simulation core. Try \u201Cx-ray view\u201D or \u201Cdisassemble the probe\u201D."],[/fieldscan/,"FieldScan is the live inspection layer: the camera recognizes the asset, the technician confirms it, and every later answer is pinned to that identity, catalog version and rules version, with an event id for each tool call."],[/evidence|event id|\bpins?\b|provenance/,"Every tool call writes an event (EV-xxxx) and the session pins asset, product, catalog version and rules version. Each fact is labelled observed, simulated or documented, so a simulated reading is never presented as a field measurement."],[/baud|8n1|serial setting/,"The THT-02 supports 4800, 9600 and 19200 baud; the default is 9600, 8 data bits, no parity, 1 stop bit (8N1) (\xA7 6.1, register 5 in \xA7 6.4)."]],Qx=/\bwhat('?s| is| are| does)\b|\bexplain\b|\btell me about\b|\bhow does\b|\bmeaning\b|\bqu[eé] es\b|\bdefine\b/,ey=[[/probe|fmx|waterpilot|sensor|transmitter|candidate/,"probe"],[/sm ?1231|analog input|input module|\bai0?\b|\bplc\b/,"sm1231"],[/\bcpu\b|controller|s7-?1200/,"cpu"],[/power supply|\bpsu\b|\bg1\b/,"psu"],[/junction|\bjb\b/,"jb"],[/terminal/,"terminals"],[/breaker/,"breaker"],[/cabinet|enclosure|panel/,"cabinet"],[/wika|ls-?10|reference|old (sensor|probe)/,"wika"],[/tank/,"tank"],[/cable|wiring/,"cabling"]];function js(i){let e=i.load_check,t=i.inputs.supply_v;return e.status==="pass"?`Loop load check PASSES at ${t} V: available ${Rn.format(e.available_ohm)} \u03A9 vs evaluated ${Rn.format(e.evaluated_ohm)} \u03A9, margin ${bl(e.margin_ohm)} \u03A9.`:`Loop load check FAILS at ${t} V: available ${Rn.format(e.available_ohm)} \u03A9 but the loop presents ${Rn.format(e.evaluated_ohm)} \u03A9, margin ${bl(e.margin_ohm)} \u03A9.`}function vl(i){let e=i.simulation;switch(e.state){case"nominal":return`Simulated signal ${Rn.format(e.loop_signal_ma)} mA \u2192 ideal PLC count ${lf.format(e.plc_ideal_count)} (level ${e.level_fraction*100} %).`;case"empty_tank":return"Empty tank: 4.0 mA live zero \u2192 ideal count 0. That is a valid reading, not a fault.";case"open_circuit":return"Open wire: idealized loop current 0 mA and the SM 1231 reports a wire-break diagnostic, which is distinct from an empty tank.";default:return"The simulated reading is suppressed because the loop is outside the validated load envelope."}}function of(i){return i.replacement_status==="insufficient_evidence"?"Replacement equivalence: insufficient evidence. Still pending: "+i.pending.join(" "):"Replacement equivalence: incompatible with the evaluated profile."}var Sl=class{constructor(e){this.app=e,this.history=[],this.speakOn=!1,this.busy=!1,this.link=localStorage.getItem("boat-link")==="online"?"online":"offline",this.liveOn=!1,this.voice=null,this.list=document.getElementById("messages"),this.input=document.getElementById("chat-input"),this.queue=Promise.resolve(),this.bindUi()}setChips(e){document.getElementById("chips").replaceChildren(...Jx[e].map(n=>Object.assign(document.createElement("button"),{type:"button",textContent:n})))}action(e,...t){return this.queue=this.queue.then(async()=>{try{let n=await this.app[e](...t);n&&await this.post(n,{kind:/^\[fail\]/.test(n)?"alert":""})}catch(n){await this.post("[warn] "+n.message,{kind:"alert"})}}),this.queue}onWorkspace(e){let t={live:"Live view: FieldScan camera on the engine-room bulkhead. Capture a frame to identify the sensor, then confirm it.",diag:"THT-02 diagnosis: the master polls address "+(this.app.bus?.master_address??1)+". Ask \u201CWhy does it fail?\u201D, open the manual, or flip the DIP switches (3D or the mirror on the left).",compat:"Spare-part check: candidate E+H FMX11 replacing a WIKA LS-10 on loop LT-301. "+js(this.app.report)}[e];this.post(t,{speak:!1})}bindUi(){document.getElementById("chat").addEventListener("submit",t=>{t.preventDefault();let n=this.input.value.trim();n&&(this.input.value="",this.ask(n))}),document.getElementById("chips").addEventListener("click",t=>{t.target.tagName==="BUTTON"&&this.ask(t.target.textContent)});let e=document.getElementById("speak");e.addEventListener("click",()=>{this.speakOn=!this.speakOn,e.setAttribute("aria-pressed",String(this.speakOn)),this.speakOn||window.speechSynthesis?.cancel()}),"speechSynthesis"in window||(e.disabled=!0),this.bindMic(),document.getElementById("link-toggle").addEventListener("click",()=>this.setLink(this.link==="online"?"offline":"online")),document.getElementById("live-toggle").addEventListener("click",()=>this.liveOn?this.stopLive():this.startLive()),document.getElementById("live-end").addEventListener("click",()=>this.stopLive()),this.updateLinkUi()}responder(){let e=this.app.ai||{};return this.link==="online"&&e.cloud?.configured?{where:"cloud",model:e.cloud.model}:e.on_device?.configured?{where:"on-device",model:e.on_device.model,fallback:this.link==="online"}:{where:"rules",model:null,fallback:this.link==="online"}}updateLinkUi(){let e=document.getElementById("link-toggle"),t=this.link==="online",n=this.responder();e.classList.toggle("online",t),e.classList.toggle("offline",!t),e.setAttribute("aria-checked",String(t)),document.getElementById("link-title").textContent=t?"Boat ONLINE \xB7 Internet link up":"Boat OFFLINE \xB7 no Internet",document.getElementById("link-who").textContent="Answering: "+(n.where==="cloud"?`cloud AI \xB7 ${n.model}`:n.where==="on-device"?`on-device Liquid AI \xB7 ${n.model}${n.fallback?" (no cloud model set)":""}`:"local rule engine only");let s=document.getElementById("pill-ai");s.textContent="Assistant \xB7 "+(n.where==="cloud"?`${n.model} \xB7 cloud`:n.where==="on-device"?`${n.model} \xB7 on-device`:"local engine")}setLink(e){if(e===this.link)return;this.link=e,localStorage.setItem("boat-link",e),this.updateLinkUi();let t=this.responder();this.post(e==="online"?`Internet link is up. ${t.where==="cloud"?`Free-form questions now go to the cloud model ${t.model}.`:"No cloud model is configured on the server (AI_BASE_URL, AI_MODEL, AI_API_KEY), so the on-device model keeps answering."} Platform commands and diagnoses always run locally.`:`Internet link is down. ${t.where==="on-device"?`Everything stays on this machine: ${t.model} answers free-form questions${this.app.ai.omni?.configured?", and LFM3-Omni handles voice and vision":""}.`:"Only the local rule engine is available."} Nothing leaves the boat.`,{speak:!1,who:"rules"})}liveUi(e,t){let n=document.getElementById("live");n.dataset.state=e,document.getElementById("live-state").textContent={listening:"Listening\u2026",hearing:"Hearing you\u2026",thinking:"Thinking\u2026",speaking:"Speaking \u2014 talk to interrupt"}[e],t!==void 0&&(document.getElementById("live-sub").textContent=t)}async startLive(){if(!navigator.mediaDevices?.getUserMedia){await this.post("[warn] This browser cannot open the microphone here. Use Chrome on http://127.0.0.1:8765.",{kind:"alert",who:"rules"});return}if(!this.app.ai.omni?.configured){await this.post("[warn] Live voice needs LFM3-Omni running on this machine (port 8081) for offline speech recognition. Start it with scripts/start_local_ai.sh omni.",{kind:"alert",who:"rules"});return}this.voice=new ia({isAssistantSpeaking:()=>window.speechSynthesis?.speaking,onBargeIn:()=>{window.speechSynthesis?.cancel(),this.stopStream=!0},onLevel:(n,s)=>{document.getElementById("live-orb").style.setProperty("--lvl",n.toFixed(2));let r=document.getElementById("live");s&&r.dataset.state==="listening"&&this.liveUi("hearing"),!s&&r.dataset.state==="speaking"&&!window.speechSynthesis?.speaking&&this.liveUi("listening","Talk naturally. Interrupt any time.")},onSpeechStart:()=>this.liveUi("hearing"),onDiscard:()=>this.liveUi("listening"),onUtterance:n=>this.liveTurn(n)});try{await this.voice.start()}catch(n){this.voice=null,await this.post("[warn] Microphone unavailable: "+n.message,{kind:"alert",who:"rules"});return}this.liveOn=!0,this.speakOn=!0,document.getElementById("speak").setAttribute("aria-pressed","true"),document.getElementById("live").hidden=!1;let t=document.getElementById("live-toggle");t.setAttribute("aria-pressed","true"),t.lastChild.textContent="Live",this.liveUi("listening",`Speech: ${this.app.ai.omni.model} on-device \xB7 Answers: ${this.responder().model||"rule engine"}`)}stopLive(){this.voice?.stop(),this.voice=null,this.liveOn=!1,window.speechSynthesis?.cancel(),document.getElementById("live").hidden=!0;let e=document.getElementById("live-toggle");e.setAttribute("aria-pressed","false"),e.lastChild.textContent="Go Live"}async transcribe(e){let t=await fetch("/api/asr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({audio:e})}),n=await t.json();if(!t.ok)throw new Error(n.error||"Speech recognition failed.");return(n.text||"").trim()}async liveTurn(e){if(this.voice){this.voice.paused=!0,this.liveUi("thinking","Transcribing on-device\u2026");try{let t=(await this.transcribe(e)).replace(/^["'\s]+|["'\s]+$/g,"");t&&/[a-z0-9]/i.test(t)&&(this.liveUi("thinking","\u201C"+t+"\u201D"),this.voice.paused=!1,await this.ask(t))}catch(t){await this.post("[warn] "+t.message,{kind:"alert",who:"rules",speak:!1})}finally{this.voice&&(this.voice.paused=!1,this.liveUi(window.speechSynthesis?.speaking?"speaking":"listening"))}}}async vision(e){let t=this.app;if(!t.ai.omni?.configured){await this.post(`Vision needs LFM3-Omni running on this machine (port 8081). Here is what the platform knows instead:
`+this.stateBrief(),{who:"rules"});return}let n=t.stage.snapshot(),s=this.bubble("bot","",{where:"on-device",model:t.ai.omni.model});s.parentElement.classList.add("typing");let r=Object.assign(document.createElement("img"),{className:"snap",src:n,alt:"Frame sent to the vision model"});s.before(r),s.textContent="Looking at the current frame\u2026";try{let a=await fetch("/api/vision",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:n,question:e})}),o=await a.json();if(!a.ok)throw new Error(o.error);let l=o.text+`
(AI description of the simulated camera frame \u2014 not evidence. Diagnoses come from the rule engine.)`;s.innerHTML=this.render(l),this.history.push({role:"assistant",content:o.text}),this.say(o.text)}catch(a){s.innerHTML=this.render("[warn] Vision failed: "+a.message)}finally{s.parentElement.classList.remove("typing"),this.list.scrollTop=this.list.scrollHeight}}bindMic(){let e=document.getElementById("mic"),t=null;e.addEventListener("click",async a=>{if(!(!this.app.ai.omni?.configured||this.liveOn)){if(a.stopImmediatePropagation(),t){t.stop(),t=null,e.classList.remove("listening");return}t=new ia({isAssistantSpeaking:()=>!1,onUtterance:async o=>{t?.stop(),t=null,e.classList.remove("listening");try{let l=await this.transcribe(o);l&&this.ask(l)}catch(l){this.post("[warn] "+l.message,{kind:"alert",who:"rules"})}}});try{window.speechSynthesis?.cancel(),await t.start(),e.classList.add("listening")}catch(o){t=null,this.post("[warn] Microphone unavailable: "+o.message,{kind:"alert",who:"rules"})}}},{capture:!0});let n=window.SpeechRecognition||window.webkitSpeechRecognition;if(!n){e.disabled=!0,e.title="Speech recognition is not supported in this browser (try Chrome or Edge).";return}let s=new n;s.lang="en-US",s.interimResults=!0,s.maxAlternatives=1;let r=!1;s.onresult=a=>{let o=a.results[a.results.length-1];if(this.input.value=o[0].transcript,o.isFinal){let l=this.input.value.trim();this.input.value="",l&&this.ask(l)}},s.onend=()=>{r=!1,e.classList.remove("listening")},s.onerror=a=>{a.error==="network"&&this.post("Voice input needs the browser speech service (online). Type your question instead; everything else keeps working offline.",{kind:"alert"})},e.addEventListener("click",()=>{if(r){s.stop();return}window.speechSynthesis?.cancel();try{s.start(),r=!0,e.classList.add("listening")}catch{}})}bubble(e,t="",n=null){let s=document.createElement("div");s.className=`msg ${e} ${t}`.trim();let r=document.createElement("span");if(r.className="meta",r.textContent=(e==="user"?"You":"Platform")+" \xB7 "+new Date().toLocaleTimeString("en-US",{hour12:!1}),e==="bot"){let o=n==="rules"||!n?{where:"rules"}:n;r.append(Object.assign(document.createElement("span"),{className:"who "+({cloud:"cloud","on-device":"device"}[o.where]||"rules"),textContent:o.where==="rules"?"rule engine":`${o.model} \xB7 ${o.where}`}))}let a=document.createElement("span");return s.append(r,a),this.list.append(s),this.list.scrollTop=this.list.scrollHeight,a}render(e){return Zx(e).replace(/^\[ok\]/gm,'<span class="ok">\u2713</span>').replace(/^\[fail\]/gm,'<span class="fail">\u2717</span>').replace(/^\[warn\]/gm,'<span class="warn">!</span>').replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")}async post(e,{kind:t="",speak:n=!0,who:s="rules"}={}){let r=this.bubble("bot",t,s);r.parentElement.classList.add("typing");for(let a=0;a<=e.length;a+=4)r.innerHTML=this.render(e.slice(0,a)),this.list.scrollTop=this.list.scrollHeight,await rf(8);return r.innerHTML=this.render(e),r.parentElement.classList.remove("typing"),this.list.scrollTop=this.list.scrollHeight,n&&this.say(e),this.history.push({role:"assistant",content:e}),r}say(e){if(!this.speakOn||!("speechSynthesis"in window))return;let t=e.replace(/\[(ok|fail|warn)\]/g,"").replace(/\*\*/g,"").replace(/`/g,"").replace(/Ω/g," ohms").replace(/→/g,", ").replace(/−/g,"minus ").replace(/§\s*/g,"section ").replace(/[\u{1F300}-\u{1FAFF}]/gu,"");if(!t.trim())return;let n=window.speechSynthesis.getVoices().filter(a=>a.lang?.startsWith("en")),s=n.find(a=>a.localService&&/Samantha|Daniel|Karen|Moira|Alex/.test(a.name))||n.find(a=>a.localService)||n[0],r=new SpeechSynthesisUtterance(t);s&&(r.voice=s),r.lang="en-US",r.rate=1.07,r.onstart=()=>{this.liveOn&&this.liveUi("speaking")},window.speechSynthesis.speak(r)}async greet(){let t=this.app.identity;await this.post(`Platform online. FieldScan camera CAM-01 is looking at the engine-room bulkhead (simulated source). Ticket: the ventilation controller shows no temperature from sensor BOAT-ER-TH-02 since the last maintenance.
`+(t?.confirmed?`[ok] Asset already confirmed in this session: ${t.model} at ${t.asset_id}.
`:`Start with \u201CIdentify this sensor\u201D, then confirm the asset.
`)+"Then ask \u201CWhy does it fail?\u201D, \u201Cshow the manual\u201D, \u201Csimulate the DIP fix\u201D or \u201Cdoes it work now?\u201D. The 4\u201320 mA spare check lives in workspace 3. You can also use the microphone.",{speak:!1})}async ask(e){if(!this.busy){this.busy=!0,this.bubble("user").textContent=e,this.history.push({role:"user",content:e});try{await this.handle(e)}catch(t){await this.post("Something went wrong locally: "+t.message,{kind:"alert"})}finally{this.busy=!1}}}async fieldscan(e){let t=this.app,n=[],s=!1;/workspace ?1|live view|camera view|go live/.test(e)?(t.setWorkspace("live"),s=!0):/workspace ?2|diagnosis (view|workspace)|open (the )?diagnosis/.test(e)&&(t.setWorkspace("diag"),s=!0),/identif|recogni|capture|take a (photo|picture|frame)|what (sensor|device) is (this|that)|\bscan\b/.test(e)&&n.push(["capture"]),/confirm/.test(e)&&n.push(["confirm"]),/plate|label/.test(e)&&/show|zoom|read|look/.test(e)&&n.push(["showPlate"]);let r=e.match(/(?:§|section)\s*(\d+(?:\.\d+)?)/)?.[1];/manual|§|section/.test(e)&&n.push(["showManual",r||"5"]),/(dip|address).{0,20}(fix|set|correct|change)|(fix|correct|repair).{0,20}(dip|address|it\b)|simulate (the )?(dip )?fix/.test(e)?n.push(["dipFix"]):/\bwhy\b.{0,30}(fail|timeout|no (reply|reading|response|temperature)|not work)|what('?s| is) wrong|no temperature|diagnose (it|the sensor)/.test(e)&&n.push(["whyFail"]),/(work|ok|fixed|answer|respond)\w* now|is it (fixed|working)|verify|poll (it|again|the sensor)/.test(e)&&n.push(["worksNow"]),/reset (the )?case|restore (the )?incident|start the case over/.test(e)&&n.push(["resetCase"]),/bad crc|corrupt|crc error/.test(e)&&n.push(["inject","bad_crc"]),/foreign|other slave|wrong address reply/.test(e)&&n.push(["inject","foreign_address"]),/7fff|sensor (fault|abnormal|broken)/.test(e)&&n.push(["inject","sensor_fault"]),/bench|real reader|usb.?rs-?485/.test(e)&&n.push(["bench"]),/session report|export (the )?(session|report|evidence)/.test(e)&&n.push(["exportReport"]);for(let[a,...o]of n)await this.action(a,...o);return s&&!n.length?!0:n.length>0}liveNow(){let e=this.app;if(e.ws==="compat")return this.live();let t=e.liveSnapshot();if(!t)return this.rtuLive();let n=t.decode.values;return(n?`Right now (simulated bus, display-only): ${n.temperature_c.toFixed(1)} \xB0C and ${n.humidity_rh.toFixed(1)} %RH from address ${e.bus.device_address}, CRC OK.`:`Right now (simulated bus, display-only): the master polls address ${e.bus.master_address} and gets ${t.decode.status==="timeout"?"no reply (timeout)":t.decode.status} \u2014 so there is no valid temperature to show.`)+`
`+this.rtuLive().split(`
`)[1]+`
Live polls are not evidence; say \u201Cdoes it work now?\u201D to record a pinned reading.`}nextStep(){let e=this.app,t=e.identity,n=e.bus;return e.ws==="compat"?e.report.load_check.status==="pass"?"The loop load passes. Ask \u201Cis the spare a valid replacement?\u201D to see what is still pending, or try \u201Cswitch to 12 V\u201D to see it fail.":"The loop load fails here. Say \u201Cswitch to 24 V\u201D or \u201Cuse config v1\u201D, or ask \u201Cexplain the margin\u201D.":!e.frame&&!t?"Next: say \u201CIdentify this sensor\u201D so the camera captures the asset.":t?.confirmed?n&&n.master_address!==n.device_address?`Next: ask \u201CWhy does it fail?\u201D \u2014 the DIP is at address ${n.device_address} but the master polls ${n.master_address}. Then \u201Csimulate the DIP fix\u201D.`:"The sensor answers. Next: \u201Cdoes it work now?\u201D to record proof, \u201Cinject a bad CRC\u201D to test the diagnosis, or switch to workspace 3 for the 4\u201320 mA spare.":"Next: say \u201CConfirm the asset\u201D to pin THT-02 / BOAT-ER-TH-02 to this session."}stateBrief(){let e=this.app,t=e.identity,s=[`You are in **${{live:"Live view",diag:"THT-02 diagnosis",compat:"4\u201320 mA spare"}[e.ws]}**.`];if(e.ws==="compat")s.push(js(e.report));else{s.push(t?`Asset: ${t.model} at ${t.asset_id} (${t.confirmed?"confirmed":"needs confirmation"}).`:"No asset identified yet in this session.");let r=e.liveSnapshot();r&&s.push(r.decode.values?`Bus: sensor answering at address ${e.bus.device_address} \xB7 ${r.decode.values.temperature_c.toFixed(1)} \xB0C, ${r.decode.values.humidity_rh.toFixed(1)} %RH (simulated).`:`Bus: master polls ${e.bus.master_address}, DIP is ${af(e.bus.dip_bits)} \u2192 address ${e.bus.device_address} \u2192 timeout, no temperature reaching the controller.`)}return s.push(this.nextStep()),s.join(`
`)}concept(e){let t=Kx.find(([s])=>s.test(e));if(!t)return null;let n=this.app.bus||{dip_bits:[0,0,0,0,0,0,1,0],device_address:2,master_address:1};return t[1].replace("{dip}",af(n.dip_bits)).replace("{addr}",n.device_address).replace("{master}",n.master_address)}smalltalk(e){let t=e.trim().replace(/[!.?¡¿,]+/g," ").replace(/\s+/g," ").trim();if(/^(hi|hello|hey|hiya|yo|hola|buenas( tardes| noches)?|buenos d[ií]as|good (morning|afternoon|evening)|greetings|what'?s up|sup|qu[eé] tal)( there| platform| team| everyone| assistant)?$/.test(t))return dh(["Hello!","Hi there!","Hey!"])+` I'm the platform assistant, connected to the live session.
`+this.stateBrief();if(/^(thanks|thank you|thx|ty|gracias|cheers|great|perfect|nice|cool|awesome|ok|okay|got it|perfecto|genial|vale)( a lot| so much| very much)?$/.test(t))return dh(["You're welcome.","Glad to help.","Any time."])+" "+this.nextStep();if(/^(bye|goodbye|see you|adi[oó]s|chao)/.test(t))return"See you. The session and its evidence stay here; export the report if you need to hand it over.";if(/how are you|how'?s it going|c[oó]mo est[aá]s/.test(t)){let n=this.app.ws!=="compat"&&this.app.liveSnapshot();return"All platform services are up"+(navigator.onLine?"":" (offline mode)")+". "+(n&&!n.decode.values?"The THT-02, on the other hand, is not answering its master \u2014 that's the open ticket.":"The simulated bus is healthy.")+`
`+this.nextStep()}return/who are you|what are you|your name|qui[eé]n eres|are you (an? )?(ai|bot|human)/.test(t)?"I'm the onboard assistant of Industrial Datasheet + FieldScan. I drive the same tools as the UI (capture, confirm, documents, bus status, fault simulation, replacement check) and answer only from the session evidence and the manuals in this package."+(this.app.ai.configured?` Free-form questions are answered by ${this.app.ai.model}.`:" I run fully locally \u2014 no LLM is connected, so open-ended chat is limited."):/what('?s| is) (going on|happening)|where are we|what do (you|i) see|summary|status of (the )?(case|session|ticket)|qu[eé] (pasa|ves)|recap/.test(t)?this.stateBrief():/what (should|do) i do|next step|what now|now what|what'?s next|siguiente|qu[eé] hago/.test(t)?this.nextStep():/what time|current time|qu[eé] hora/.test(t)?`It is ${new Date().toLocaleTimeString("en-US",{hour12:!1})} local time.`:/ticket|problem|issue|complaint/.test(t)&&!/inject|simulate/.test(t)?`Open ticket: the ventilation controller shows no temperature from BOAT-ER-TH-02 since the last maintenance.
`+this.stateBrief():null}async handle(e){let t=e.toLowerCase(),n=this.app,s=[],r=!1;if(/what (do|can) you see|describe (the |this )?(view|frame|scene|image|picture|camera)|look at (this|the camera|the screen)|what('?s| is) (in|on) (the |this )?(camera|screen|frame|view|picture)/.test(t)){await this.vision(e);return}let a=this.smalltalk(t);if(a&&!(n.ai.configured&&await this.streamLLM(e))){await this.post(a);return}if(a)return;let o=Qx.test(t)?this.concept(t):null;if(o&&!/\b(fail|wrong|fix|now|inject|simulate|show|open)\b/.test(t)){await this.post(o);return}let l=/spare|4.?20|fmx|wika|\bloop\b|tank|\b(12|24) ?v\b|config(uration)? ?v?[12]\b|open wire|margin|sm ?1231|replacement|equivalen|workspace ?3/.test(t);if(!l&&await this.fieldscan(t))return;l&&n.ws!=="compat"&&n.setWorkspace("compat",{quiet:!0});let c={};if(n.ws==="compat"&&/\breset\b|start over|defaults?\b/.test(t)&&Object.assign(c,{voltage:24,revision:"v1",scenario:"nominal"}),/\b12\s*v\b|\b12[- ]?volts?|twelve/.test(t)?c.voltage=12:/\b24\s*v\b|\b24[- ]?volts?|twenty[- ]?four/.test(t)&&(c.voltage=24),/\bv2\b|config(uration)?\s*v?2\b|revision\s*2|475/.test(t)?c.revision="v2":/\bv1\b|config(uration)?\s*v?1\b|revision\s*1/.test(t)&&(c.revision="v1"),n.ws!=="compat"||(/open[- ]?(wire|circuit|loop)|wire[- ]?break|broken (wire|cable)|cut (the )?(wire|cable)|disconnect/.test(t)?c.scenario="open":/\bempty\b|\bdrain/.test(t)?c.scenario="empty":/50 ?%|\bhalf\b|nominal|refill|fill (the |it )?(tank|up)|reconnect|repair|fix the (wire|cable)|restore/.test(t)&&(c.scenario="nominal")),Object.keys(c).length){let f=n.report;await n.setConfig(c,"assistant");let u=n.report,p=[c.voltage&&`${c.voltage} V DC supply`,c.revision&&`installation ${c.revision} (+${u.inputs.synthetic_additional_series_ohm} \u03A9 synthetic)`,c.scenario&&{nominal:"level 50 %",empty:"empty tank",open:"open wire"}[c.scenario]].filter(Boolean).join(", ");s.push(`Applied: ${p}.`),s.push((u.load_check.status==="pass"?"[ok] ":"[fail] ")+js(u)),s.push(vl(u)),f.replacement_status!==u.replacement_status&&s.push(of(u)),r=!0}let h=(n.ws==="compat"?ey:jx).find(([f])=>f.test(t))?.[1];if(/x-?ray|see inside|interior|transparent|look inside/.test(t)?(n.setView("xray"),s.push(n.ws==="compat"?"X-ray view on: shells are translucent so you can see the water column, the probe internals and the loop wiring. The glowing particles are the loop current.":"X-ray view on: the stainless barrel turns translucent so you can see the SHT30 element, the DIP-8 address switch and the RS-485 board. Bus packets are cyan (request) and amber (reply)."),r=!0):/realistic|normal view|solid view|photo/.test(t)&&(n.setView("normal"),s.push("Back to the realistic view."),r=!0),/re-?assembl|put (it )?back|collapse|close (it )?up/.test(t)?(n.setExplode(0),s.push("Reassembled. All parts are back in their installed positions."),r=!0):/explod|disassembl|take (it |the \w+ )?apart|tear ?down|dismantl|break (it )?down|pull (it )?out/.test(t)?(n.setExplode(1),h&&(n.focus(h),n.inspect(h,{reveal:!1})),s.push(`Disassembled${h?` and focused on the ${n.partName(h)}`:""}.${n.ws==="compat"?"":" Same order as the manual: rear gland first, then the barrel unscrews at the middle seam to expose the DIP switch."} Click any part to inspect its datasheet fields, or use \u201CIsolate\u201D in the Parts tab.`),r=!0):h&&/show|focus|zoom|look at|where|inspect|go to|open|view/.test(t)&&(n.focus(h),n.inspect(h,{reveal:!1}),s.push(`Focused on the ${n.partName(h)}. Its evidence-backed fields are in the Parts tab.`),r=!0),s.length&&await this.post(s.join(`
`)),/self[- ]?test|run (the )?tests?|golden/.test(t)&&(await this.selfTest(),r=!0),/(everything|all|it|system|platform|loop|things?).{0,25}\b(ok|okay|fine|working|running|good|healthy|alright)\b|\bstatus\b|\bhealth|diagnos|check ?up|sanity/.test(t)&&(await this.diagnostics(),r=!0),/\bwhy\b|explain|margin|formula|how .*(calc|comput|work)|\bload\b/.test(t)&&!Object.keys(c).length&&(await this.post(this.explain()),r=!0),/source|evidence|datasheet|document|\boem\b/.test(t)&&(await this.post(n.ws==="compat"?this.sources():this.fsSources()),r=!0),/equivalen|replace|substitut|\bswap|pending|compatib/.test(t)&&!Object.keys(c).length){let f=await n.refreshReplacement(),u=f?.criteria?`
`+f.criteria.map(p=>`${p.status==="pass"?"[ok]":p.status==="fail"?"[fail]":"[warn]"} ${p.criterion.replace(/_/g," ")}: ${p.detail}`).join(`
`)+`
(${f.event_id}, rules ${f.rules_version})`:"";await this.post(js(n.report)+u+`
`+of(n.report)),r=!0}if(/telemetry|live|reading|current|\bma\b|count|signal|level|temperature|humidity|right now|\bnow\b/.test(t)&&!r&&(await this.post(this.liveNow()),r=!0),/export|download|\bjson\b/.test(t)&&n.ws!=="compat"?(await this.action("exportReport"),r=!0):/export|download|\bjson\b/.test(t)&&(n.exportJson(),await this.post("Exported the current report as boat-mvp-result.json. Paste it into your AI tool if you need a narrative; the JSON stays the source of truth."),r=!0),/\bhelp\b|what can you|commands|capabilit/.test(t)&&(await this.post(this.help()),r=!0),r||n.ai.configured&&await this.streamLLM(e))return;let d=this.concept(t);if(d){await this.post(d);return}n.ai.configured||await n.refreshAi?.(),!(n.ai.configured&&await this.streamLLM(e))&&await this.post(dh(["I'm not sure I follow that one.","I can't answer that from the evidence I have.","That's outside what I can verify here."])+` I run locally without an LLM, so I answer about this platform: the THT-02 case, the 4\u201320 mA spare, the manuals and the 3D twin.
`+this.stateBrief()+`
You can also ask \u201Cwhat is Modbus?\u201D, \u201Cwhat is going on?\u201D, \u201Ctemperature now?\u201D or \u201Chelp\u201D.`)}async streamLLM(e){let t=this.app,n;try{let s=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:e,link:this.link,context:{workspace:t.ws,view:t.viewState(),pins:t.sessionPins(),bus:t.bus,situation:this.stateBrief(),live_now:t.ws==="compat"?void 0:t.liveSnapshot()?.decode,last_transaction:t.transactions[0]||null,report:t.ws==="compat"?t.report:void 0,telemetry:t.ws==="compat"?t.telemetry.last:void 0},history:this.history.slice(-9,-1)})});if(!s.ok||!s.body)return!1;n=this.bubble("bot","",this.responder()),n.parentElement.classList.add("typing");let r=s.body.getReader(),a=new TextDecoder,o="",l="",c=0;for(this.stopStream=!1;;){let{value:h,done:d}=await r.read();if(d)break;o+=a.decode(h,{stream:!0});let f;for(;(f=o.indexOf(`

`))>=0;){let u=o.slice(0,f).trim();if(o=o.slice(f+2),!u.startsWith("data:"))continue;let p=JSON.parse(u.slice(5));if(p.error)throw new Error(p.error);if(p.responder){let x=n.parentElement.querySelector(".who");x.className="who "+(p.responder.where==="cloud"?"cloud":"device"),x.textContent=`${p.responder.model} \xB7 ${p.responder.where}`}if(p.delta){l+=p.delta,n.innerHTML=this.render(l),this.list.scrollTop=this.list.scrollHeight;let x=l.slice(c).match(/^[\s\S]*?[.!?](?=\s)|^[\s\S]*?\n/);x&&!this.stopStream&&(this.say(x[0]),c+=x[0].length)}}}if(n.parentElement.classList.remove("typing"),!l)throw new Error("Empty response.");return this.history.push({role:"assistant",content:l}),this.stopStream||this.say(l.slice(c)),!0}catch{return n&&n.parentElement.remove(),!1}}explain(){let e=this.app.report,t=e.load_check,n=e.inputs.supply_v,s=e.inputs.synthetic_additional_series_ohm,r=n-.022*t.evaluated_ohm;return["**How the margin is computed**",`1. The FMX11 needs at least 8 V at its terminals while drawing up to 22 mA (E+H TI01524P, p. 7). The loop may therefore drop (V \u2212 8 V) at 22 mA: (${n} \u2212 8) / 0.022 = ${Rn.format(t.available_ohm)} \u03A9 available.`,`2. The loop presents 290 \u03A9 (upper bound of the SM 1231 input impedance, Siemens) + ${s} \u03A9 synthetic cable and accessories = ${Rn.format(t.evaluated_ohm)} \u03A9.`,`3. Margin = ${Rn.format(t.available_ohm)} \u2212 ${Rn.format(t.evaluated_ohm)} = ${bl(t.margin_ohm)} \u03A9 \u2192 ${t.status==="pass"?"[PASS]":"[FAIL]"}.`,`At 22 mA the transmitter would see ${Rn.format(r)} V at its terminals (${r>=8?"\u2265":"<"} 8 V minimum).`,"Only the installation data (+"+s+" \u03A9, supply choice) is synthetic; the 8 V, 22 mA and 290 \u03A9 figures come from the OEM documents."].join(`
`)}sources(){return"Evidence used (snapshot "+this.app.report.evidence_version+`):
`+this.app.report.sources.map(e=>`\u2022 ${e.id}: ${e.title}. ${e.section}`).join(`
`)+`
The links are in the Evidence tab; opening them requires Internet.`}live(){let e=this.app.telemetry.last;return e?[`Live (simulated) at ${new Date(e.t).toLocaleTimeString("en-US",{hour12:!1})}:`,`\u2022 Loop current: ${e.ma===null?"suppressed (outside envelope)":e.ma.toFixed(2)+" mA"}`,`\u2022 Supply: ${e.supply.toFixed(2)} V \xB7 terminal voltage at 22 mA: ${e.terminalAtDesign.toFixed(2)} V`,`\u2022 AI0 raw count: ${e.count===null?"\u2014":lf.format(e.count)} \xB7 channel diagnostic: ${e.diag}`,`\u2022 Physical tank level: ${(e.level*100).toFixed(1)} %`].join(`
`):"Telemetry is starting\u2026"}fsSources(){let e=this.app.bundle.documents;return"Documents in this package (catalog "+this.app.bundle.catalog_version+`):
`+Object.values(e).map(t=>`\u2022 ${t.id}: ${t.title} \xB7 ${t.edition||""} \xB7 validity ${t.validity.replace("_"," ")}`).join(`
`)+`
Say \u201Cshow the manual \xA7 6.4\u201D to open a section. Opening the original links requires Internet.`}rtuLive(){let e=this.app,t=e.bus,n=e.transactions[0];return[`Bus (simulated): master polls address ${t.master_address} \xB7 sensor DIP ${t.dip_bits.join("")} \u2192 address ${t.device_address}.`,n?`Last recorded transaction ${n.event_id}: ${n.decode.status}${n.decode.values?` \xB7 ${n.decode.values.temperature_c.toFixed(1)} \xB0C, ${n.decode.values.humidity_rh.toFixed(1)} %RH`:""}.`:"No transaction recorded yet in this session."].join(`
`)}help(){return["I can operate the platform and answer from the evidence:","\u2022 FieldScan: \u201Cidentify this sensor\u201D, \u201Cconfirm the asset\u201D, \u201Cwhy does it fail?\u201D, \u201Cshow the manual \xA7 5\u201D, \u201Csimulate the DIP fix\u201D, \u201Cdoes it work now?\u201D, \u201Cinject a bad CRC\u201D, \u201Cbench reader\u201D, \u201Creset the case\u201D","\u2022 Health: \u201CIs everything OK?\u201D, \u201Crun self-test\u201D, \u201Clive readings\u201D","\u2022 Spare (workspace 3): \u201Cswitch to 12 V\u201D, \u201Cuse config v2\u201D, \u201Csimulate an open wire\u201D, \u201Cempty the tank\u201D, \u201Creset\u201D","\u2022 Twin: \u201Cx-ray view\u201D, \u201Cdisassemble the probe\u201D, \u201Cshow the SM 1231\u201D, \u201Creassemble\u201D","\u2022 Engineering: \u201Cexplain the margin\u201D, \u201Cis the spare a valid replacement?\u201D, \u201Csources\u201D, \u201Cexport JSON\u201D",this.app.ai.configured?`Free-form questions go to ${this.app.ai.model}${this.app.ai.local?", running on this machine (works offline)":""}.`:"Free-form questions need an LLM: start a local Liquid AI model (llama-server on port 8080) or set AI_BASE_URL, AI_MODEL, AI_API_KEY."].join(`
`)}async selfTest(){let e=await this.app.selfTest();e.ok?await this.post(`[ok] Self-test passed: ${e.total} checks${e.python?` (Python: loop ${e.python.loop.cases.length}, Modbus ${e.python.modbus.cases.length}, session ${e.python.session.cases.length})`:""} and the browser Modbus RTU matches the Python golden vectors (${e.parity.cases}/${e.parity.cases}).`,{kind:"good"}):await this.post("[fail] Engine self-test FAILED: "+(e.error||"unknown error"),{kind:"alert"})}async diagnostics(){let e=this.app,t=e.report,n=this.bubble("bot");n.parentElement.classList.add("typing");let s=["**Platform diagnostics**"],r=async v=>{s.push(v),n.innerHTML=this.render(s.join(`
`)),this.list.scrollTop=this.list.scrollHeight,await rf(260)};await r(`[ok] Local engine: rules ${t.rules_version}, evidence ${t.evidence_version}`);let a=await e.health();await r(a.portable?"[ok] Platform link: portable file, all 12 scenarios precomputed (no server needed)":a.ok?"[ok] Platform link: loopback server healthy, live recomputation":"[fail] Platform link: local server not responding");let o=await e.selfTest();await r(o.ok?`[ok] Engine self-test: ${o.total} checks, JS/Python Modbus parity ${o.parity.cases}/${o.parity.cases}`:"[fail] Engine self-test failed: "+(o.error||""));let l=e.identity;await r(l?.confirmed?`[ok] Asset: ${l.model} confirmed at ${l.asset_id}`:"[warn] Asset: not confirmed yet (capture + confirm in Live view)");let c=e.bus,h=e.lastStatus==="valid";await r(h?`[ok] THT-02 bus: address ${c.master_address} answering, CRC OK (simulated)`:`[fail] THT-02 bus: ${e.lastStatus==="timeout"?`no reply \u2014 master polls ${c.master_address}, DIP set to ${c.device_address}`:e.lastStatus.replace("_"," ")}`),await r(navigator.onLine?"[ok] Network: online (OEM links reachable)":"[warn] Network: offline. Calculations, evidence and export still work locally");let d=t.load_check.status==="pass";await r(`${d?"[ok]":"[fail]"} Loop load at ${t.inputs.supply_v} V / ${t.inputs.synthetic_installation_revision}: margin ${bl(t.load_check.margin_ohm)} \u03A9`);let f=e.telemetry.last,u=t.simulation.state;u==="open_circuit"?await r("[fail] Live signal: 0 mA, wire-break diagnostic on AI0 (check JB-03 and field cable)"):u==="outside_load_envelope"?await r("[fail] Live signal: suppressed, loop outside validated load envelope"):await r(`[ok] Live signal: ${f?.ma?.toFixed(2)??"\u2014"} mA on AI0 (expected ${Rn.format(t.simulation.loop_signal_ma)} mA)${u==="empty_tank"?", empty tank (valid live zero)":""}`),await r(t.replacement_status==="insufficient_evidence"?`[warn] Replacement equivalence: ${t.pending.length} evidence items pending`:"[fail] Replacement equivalence: incompatible with the evaluated profile"),await r(e.ai.configured?`[ok] Assistant: LLM ${e.ai.model} available via local server`:"[ok] Assistant: local grounded engine (no LLM needed)");let p=(a.ok||a.portable)&&o.ok,x=d&&u!=="open_circuit",g=h,m;p?g?x?m="**Verdict:** platform healthy, the THT-02 is answering and the loop is working. The spare passes the load check; equivalence still needs the pending evidence before you sign off the swap.":u==="open_circuit"?m="**Verdict:** platform healthy, but the loop is NOT OK. There is a wire break; the reading is 0 mA, not an empty tank.":m="**Verdict:** platform healthy, but the loop is NOT OK. The candidate cannot drive this loop at this configuration (negative margin).":m="**Verdict:** platform healthy, but sensor BOAT-ER-TH-02 is NOT answering. Ask \u201CWhy does it fail?\u201D for the evidence-backed diagnosis."+(x?" The 4\u201320 mA loop is fine.":""):m="**Verdict:** the platform itself has a problem; see the failed checks above.",await r(m),n.parentElement.classList.remove("typing"),n.parentElement.classList.add(p&&x&&g?"good":"alert"),this.history.push({role:"assistant",content:s.join(`
`)}),this.say(m)}async onReport(e,t,n){if(n==="assistant"||!t)return;let s=t.load_check.status==="pass"&&t.simulation.state!=="open_circuit",r=e.load_check.status==="pass"&&e.simulation.state!=="open_circuit";s&&!r?await this.post("**Alert.** "+js(e)+`
`+vl(e),{kind:"alert"}):!s&&r?await this.post("**Recovered.** "+js(e)+`
`+vl(e),{kind:"good"}):e.simulation.state!==t.simulation.state&&await this.post(vl(e),{speak:!1})}onNetwork(e){this.post(e?"Network restored. OEM document links are reachable again.":"Network lost. No problem: the engine, evidence and export run locally on board.",{kind:e?"good":"alert"})}};var te=i=>document.getElementById(i),sa=new Intl.NumberFormat("en-US",{maximumFractionDigits:1}),Te=(i,e={},...t)=>{let n=Object.assign(document.createElement(i),e);return n.append(...t.filter(s=>s!=null&&s!==!1)),n},ty={nominal:"Nominal level",empty_tank:"Empty tank",open_circuit:"Open wire \xB7 loop diagnostic",outside_load_envelope:"Load outside limit"},cf={oem:["OEM","oem"],synthetic:["Synthetic","synthetic"],pending:["Pending","pending"],live:["Live","oem"],fieldscan:["FieldScan","fieldscan"]},gi={valid:"Valid reply",timeout:"No reply \xB7 timeout",invalid:"Frame rejected",sensor_abnormal:"Sensor abnormal (7FFF H)",exception:"Modbus exception",idle:"Not polled yet"},hf={live:"FieldScan live view \xB7 engine room \xB7 bulkhead FR 42 \xB7 asset BOAT-ER-TH-02",diag:"THT-02 diagnosis \xB7 RS-485 segment B \xB7 Modbus RTU 9600 8N1",compat:"4\u201320 mA spare \xB7 freshwater tank T-03 \xB7 loop LT-301 \xB7 FMX11 replacing WIKA LS-10"},ny={tht:[["overview","Overview"],["camera","Camera"],["plate","Plate"],["probe","Probe"],["dip","DIP"],["gateway","Master"]],loop:[["overview","Overview"],["probe","Probe"],["cabinet","Cabinet"]]},iy={tht:["tht-sht","tht-dip","tht-rs485"],loop:["probe","probe-cap","probe-cell","probe-pcb"]},Ml=i=>i.slice(0,4).join("")+" "+i.slice(4).join(""),fh=class{constructor(){this.ws="live",this.config={voltage:24,revision:"v1",scenario:"nominal"},this.report=null,this.replacement=null,this.ai={configured:!1,model:null},this.requestId=0,this.transactions=[],this.bus=null,this.frame=null,this.lastStatus="idle",this.holdUntil=0,this.selfTest=Gd,this.health=nh,this.mode=ls}async start(){te("pill-link").textContent=ls==="portable"?"Portable \xB7 offline-ready":"Local server",te("pill-link").className="pill ok",this.updateNetwork();let e=()=>{let s=new Date().toLocaleTimeString("en-US",{hour12:!1});te("clock").textContent=s+" local",te("hud-time").textContent=new Date().toISOString().slice(0,10)+" "+s};e(),setInterval(e,1e3);let t;try{t=await Fd()}catch(s){this.toast(s.message),te("pill-link").textContent="Server unreachable",te("pill-link").className="pill fail";return}this.bundle=t,te("pill-engine").textContent=`Catalog ${t.catalog_version.split("/")[1]} \xB7 ${t.rules_versions.diagnosis}`,te("pill-engine").title=`Catalog ${t.catalog_version} \xB7 rules ${t.rules_versions.diagnosis}, ${t.rules_versions.loop}`,te("pill-engine").className="pill ok";let n={onSelect:s=>this.inspect(s),onHover:(s,r,a)=>this.tooltip(s,r,a)};this.tht=new yl(te("viewport-tht"),{...n,plateLines:t.assets["BOAT-ER-TH-02"].plate_lines,onDip:s=>this.toggleDip(s)}),this.loop=new xl(te("viewport-loop"),n),this.loop.setActive(!1),this.telemetry=new hl(s=>this.onSample(s)),this.assistant=new Sl(this),this.bindUi(),this.buildDip(),await this.refreshSession(),this.applyBus(this.bus||{master_address:t.incident.master_address,dip_bits:tn(t.incident.device_address)}),this.renderDocuments(),this.identity&&this.renderIdentity(),await this.refreshAi(),await this.setConfig({},"init"),this.telemetry.start(),this.setWorkspace("live",{quiet:!0}),this.assistant.greet(),setInterval(()=>this.livePoll(),2500),requestAnimationFrame(()=>this.hudLoop()),ls==="server"&&(setInterval(()=>this.checkLink(),5e3),setInterval(()=>this.refreshAi(),2e4))}async refreshAi(){this.ai=await Hd();let e=te("pill-ai");e.title=[`Cloud: ${this.ai.cloud?.configured?this.ai.cloud.model:"not configured"}`,`On-device chat: ${this.ai.on_device?.configured?this.ai.on_device.model:"not running"}`,`On-device voice + vision: ${this.ai.omni?.configured?this.ai.omni.model:"not running"}`].join(`
`),e.className="pill ok",this.assistant.updateLinkUi()}get stage(){return this.ws==="compat"?this.loop:this.tht}get twin(){return this.stage}get identity(){return Jr().identity}sessionPins(){return Jr().pins}setWorkspace(e,{quiet:t=!1}={}){if(!hf[e])return;let n=e!==this.ws,s=this.stage;this.ws=e,te("app").dataset.ws=e;for(let l of document.querySelectorAll(".workspaces button"))l.setAttribute("aria-selected",String(l.dataset.ws===e));for(let l of["live","diag","compat"])te("ws-"+l).hidden=l!==e;let r=document.querySelector('.tabs button[aria-selected="true"]')?.dataset.tab;for(let l of document.querySelectorAll(".tabs [data-only]"))l.hidden=!l.dataset.only.split(" ").includes(e);document.querySelector(`.tabs button[data-tab="${r}"]`)?.hidden&&this.openTab("assistant"),te("subtitle").textContent=hf[e];let o=e==="compat";te("viewport-loop").hidden=!o,te("viewport-tht").hidden=o,this.loop.setActive(o),this.tht.setActive(!o),(s!==this.stage||!this.assemblyBuilt)&&(this.buildCams(),this.buildAssembly(),this.inspect(null),this.syncDock(),this.assemblyBuilt=!0),e==="live"&&n&&this.tht.preset(this.frame?"camera":"overview"),e==="diag"&&n&&this.tht.preset("overview"),e==="compat"&&this.refreshReplacement(),this.assistant.setChips(e),n&&!t&&this.assistant.onWorkspace(e)}async refreshSession(){let e=await kd();return e.bus&&(this.bus=e.bus),this.renderPins(e.pins),this.renderEvents(e.events),e}applyBus(e){this.bus={...e,device_address:jr(e.dip_bits)},this.tht.setDip(this.bus.dip_bits),this.renderDip(),te("d-master").textContent=`Address ${this.bus.master_address} \xB7 FC03 \xB7 R0 \xD7 2`;let t=this.bus.device_address;te("d-addr").textContent=`${Ml(this.bus.dip_bits)} \u2192 address ${t}`+(t===this.bus.master_address?" \u2713":` \u2260 ${this.bus.master_address}`),te("d-addr").className=t===this.bus.master_address?"pos":"neg"}renderPins(e){if(!e)return;let t=[["Asset",e.asset_id||"not confirmed"],["Product",e.product_id||"\u2014"],["Catalog",e.catalog_version],["Rules",`${e.rules_version.diagnosis} \xB7 ${e.rules_version.loop}`],["Last event",e.last_event_id||"\u2014"],["Sources",Object.entries(e.source_status).map(([n,s])=>`${n}: ${s.replace("_"," ")}`).join(" \xB7 ")]];te("pins").replaceChildren(...t.flatMap(([n,s])=>[Te("dt",{textContent:n}),Te("dd",{textContent:s})]))}renderEvents(e=[]){te("events").replaceChildren(...[...e].reverse().slice(0,50).map(t=>Te("li",{},Te("code",{textContent:t.event_id}),Te("span",{textContent:`${t.tool} \xB7 ${t.summary}`}),Te("span",{className:"src",textContent:t.source}))))}renderDocuments(){te("documents").replaceChildren(...Object.values(this.bundle.documents).map(e=>{let t=Te("li",{},Te("code",{textContent:e.id})),n=Te("a",{href:"#",textContent:e.title});return n.addEventListener("click",s=>{s.preventDefault(),this.assistant.action("showManual",null,e.id)}),t.append(n,` \xB7 ${e.edition||""} \xB7 validity: ${e.validity.replace("_"," ")}`),t})),te("versions").textContent=`Catalog ${this.bundle.catalog_version} \xB7 rules ${this.bundle.rules_versions.diagnosis} \xB7 ${this.bundle.rules_versions.loop} \xB7 mode ${ls}`}renderIdentity(){let e=this.identity;e&&(te("btn-confirm").disabled=e.confirmed,te("btn-confirm").textContent=e.confirmed?"Asset confirmed \u2713":"Confirm asset",te("btn-go-diag").disabled=!e.confirmed,this.frame||(te("recog-card").className="card found",te("recog-card").replaceChildren(Te("div",{className:"match"},Te("strong",{textContent:e.model}),Te("span",{className:"tag oem",textContent:e.status.replace("_"," ")})),Te("div",{className:"muted small",textContent:`Asset ${e.asset_id} \xB7 pending: ${e.pending_fields.join(", ")}`}))))}recordTx(e,t,n){e&&(this.transactions.unshift({...e,event_id:t,label:n}),this.transactions.length=Math.min(this.transactions.length,30),this.renderFrames(),this.showStatus(e,t),this.holdUntil=Date.now()+4e3,this.tht.playTransaction(e))}showStatus(e,t=null){let n=e.decode.status;this.lastStatus=n,te("d-status").textContent=gi[n]+(t?` \xB7 ${t}`:" \xB7 live simulation"),te("d-status").className=n==="valid"?"pos":"neg",te("d-reading").textContent=n==="valid"?`${e.decode.values.temperature_c.toFixed(1)} \xB0C \xB7 ${e.decode.values.humidity_rh.toFixed(1)} %RH (simulated)`:"No valid reading";let s=te("diag-verdict");s.className="verdict "+(n==="valid"?"ok":"fail"),s.textContent=n==="valid"?"Sensor answering \xB7 CRC OK":gi[n]}renderFrames(){let e=(t,n,s)=>t?Te("span",{className:"bytes"},...Pd(t,n).map(r=>Te("span",{className:`b ${r.role}${s&&r.role===s?" bad":""}`,textContent:r.hex}))):Te("span",{className:"muted small",textContent:"\u2014 no reply within 1000 ms \u2014"});te("frames").replaceChildren(...this.transactions.map(t=>{let n=t.decode.status,s=t.decode.checks.find(a=>!a.ok),r=s&&{crc:"crc",address:"addr",function:"fn",byte_count:"count",sensor:"data"}[s.check];return Te("li",{className:n==="valid"?"ok":"fail"},Te("div",{className:"hdr"},Te("span",{textContent:`${t.event_id||"live"} \xB7 ${t.label||"poll"}${t.injection!=="none"?" \xB7 inject "+t.injection:""}`}),Te("strong",{textContent:gi[n]})),Te("div",{className:"dir"},Te("span",{textContent:"REQ"}),e(t.request_hex,"request")),Te("div",{className:"dir"},Te("span",{textContent:"RSP"}),e(t.response_hex,"response",r)),Te("div",{className:"checks"},...t.decode.checks.map(a=>Te("span",{className:a.ok?"ok":"no",textContent:`${a.ok?"\u2713":"\u2717"} ${a.check}`,title:a.detail}))))}))}liveSnapshot(){return this.bus?fn(this.bus.master_address,new dn(this.bus.dip_bits,this.bundle.incident.temperature_c,this.bundle.incident.humidity_rh)):null}livePoll(){if(this.ws==="compat"||!this.bus||this.tht.anim||Date.now()<this.holdUntil||document.hidden)return;let e=fn(this.bus.master_address,new dn(this.bus.dip_bits,this.bundle.incident.temperature_c,this.bundle.incident.humidity_rh));this.tht.playTransaction(e,{quiet:!0}),this.showStatus(e)}async capture(){this.setWorkspace("live",{quiet:!0});let e=te("hud");e.classList.remove("flash"),e.offsetWidth,e.classList.add("flash");let t=await Tn("capture_frame",{source:"simulated"});return this.frame=t,this.tht.preset("camera"),te("recog-box").hidden=!1,te("recog-tag").textContent="TZ THT-02 \xB7 plate match (simulated)",te("recog-card").className="card found",te("recog-card").replaceChildren(Te("div",{className:"match"},Te("strong",{textContent:"TZ THT-02"}),Te("span",{className:"tag synthetic",textContent:"needs confirmation"})),Te("div",{className:"plate",textContent:t.plate_text.join(`
`)}),Te("div",{className:"muted small",textContent:`${t.frame_id} \xB7 source ${t.source} \xB7 hint ${t.asset_hint} \xB7 ${t.event_id}`})),te("btn-confirm").disabled=!1,te("btn-confirm").textContent="Confirm asset",await this.refreshSession(),[`Frame captured (${t.event_id}, simulated source). The nameplate reads **${t.plate_text[0]}** \xB7 ${t.plate_text[2]} \xB7 ${t.plate_text[3]}.`,`It matches catalog product tzone-tht-02 and asset ${t.asset_hint} on bulkhead FR 42. This is only a candidate: the plate is synthetic and a technician must confirm it before any diagnosis.`].join(`
`)}async confirm(){!this.frame&&!this.identity&&await this.capture();let e=await Tn("confirm_asset",{model:"TZ THT-02",id_source:"plate_simulated",confirmed:!0,asset_id:"BOAT-ER-TH-02"});return await this.refreshSession(),e.status==="insufficient_evidence"?"[warn] "+e.missing:(this.renderIdentity(),te("recog-tag").textContent="TZ THT-02 \xB7 confirmed",[`[ok] Asset confirmed by the technician (${e.event_id}): **${e.model}** at ${e.asset_id}.`,`Session pinned to ${e.pins.catalog_version} and rules ${e.pins.rules_version.diagnosis}.`,`[warn] Not verified from the plate: ${e.pending_fields.join(", ")}.`,"Next: open the diagnosis and ask \u201CWhy does it fail?\u201D."].join(`
`))}async ensureIdentity(e){this.identity?.confirmed||e.push(await this.confirm())}showPlate(){return this.setWorkspace("live",{quiet:!0}),this.stage.view==="xray"&&this.setView("normal"),this.setExplode(0),this.tht.preset("plate"),`Zoomed on the nameplate: \u201C${this.bundle.assets["BOAT-ER-TH-02"].plate_lines.join(" / ")}\u201D. The plate is synthetic for this demo, so it identifies the model but not the order variant or factory address.`}async whyFail(){let e=[];await this.ensureIdentity(e),this.setWorkspace("diag",{quiet:!0});let t=await Tn("get_asset_status",{transport:"simulated_rtu"});await this.refreshSession(),this.recordTx(t.transaction,t.event_id,"diagnosis poll"),this.tht.preset("overview");let n=t.transaction,s=n.decode.status,r=this.bus.dip_bits;if(s==="valid")return e.push(`[ok] It does not fail right now (${t.event_id}): the master polls address ${n.master_address}, the sensor answers with a valid CRC: **${n.decode.values.temperature_c.toFixed(1)} \xB0C, ${n.decode.values.humidity_rh.toFixed(1)} %RH** (simulated).`),e.join(`
`);if(s==="timeout"&&n.device_address!==n.master_address)e.push(`**Diagnosis (${t.event_id}, rules ${this.bundle.rules_versions.diagnosis}):** the master sends \`${n.request_hex}\` to address **${n.master_address}** and gets no reply within 1000 ms.`,`The sensor DIP reads ${Ml(r)} \u2192 address **${n.device_address}** (manual \xA7 5: switches 1\u20138 weigh 128\u20261).`,`A Modbus slave only answers frames for its own address (\xA7 6.4), so the request for ${n.master_address} is silently ignored. That is a timeout, not a CRC or wiring fault.`,`Fix: set the DIP to address ${n.master_address} (only switch 8 ON), or change the master to poll ${n.device_address}. Source: TZ-THT02-UM-V1.0 \xA7 5, \xA7 6.4, \xA7 6.10 \u2014 validity *to confirm*.`);else{let a=n.decode.checks.find(o=>!o.ok);e.push(`[fail] Poll result (${t.event_id}): ${gi[s]}${a?` \u2014 ${a.check}: ${a.detail}`:""}.`)}return e.join(`
`)}async showManual(e="5",t="TZ-THT02-UM-V1.0"){let n=this.bundle.documents[t],s=n?.product_id||(t==="TZ-THT02-UM-V1.0"?"tzone-tht-02":null),r=s==="tzone-tht-02"?await Tn("get_document",{product_id:s,doc_type:"user_manual"}):{status:"ok",source:"documented",document:n,sections:n.sections,event_id:null};if(await this.refreshSession(),r.status!=="ok")return"[warn] "+r.missing;let a=r.document;te("manual-title").textContent=a.title,te("manual-meta").textContent=[a.id,a.edition,a.date,a.origin].filter(Boolean).join(" \xB7 "),te("manual-validity").textContent=`Validity: ${a.validity.replace("_"," ")}. ${a.validity_note||""}`,te("manual-sections").replaceChildren(...Object.entries(r.sections).map(([c,h])=>Te("article",{className:c===e?"hl":"",id:"sec-"+c},Te("h4",{textContent:`\xA7 ${c} \xB7 ${h.title}${h.page?` \xB7 p. ${h.page}`:""}`}),Te("p",{textContent:h.excerpt||h.text||""})))),te("manual-event").textContent=r.event_id?`Retrieved as ${r.event_id}`:"Preloaded document",te("manual-link").href=a.url;let o=te("manual");o.open||o.showModal(),te("sec-"+e)?.scrollIntoView({block:"nearest"});let l=r.sections[e];return l?`Opened ${a.id} (${a.edition}, ${a.date}) at \xA7 ${e} \u201C${l.title}\u201D: ${l.excerpt}
Validity: ${a.validity.replace("_"," ")} \u2014 ${a.validity_note}`:`Opened ${a.id}. Validity: ${a.validity.replace("_"," ")}.`}async dipFix(){let e=[];await this.ensureIdentity(e),this.setWorkspace("diag",{quiet:!0});let t=await Tn("simulate_fault",{scenario:"dip_fix"});await this.refreshSession(),this.holdUntil=Date.now()+9e3,this.setView("normal"),this.setExplode(1),this.tht.preset("dip"),await new Promise(s=>setTimeout(s,1700)),this.applyBus({master_address:t.after.master_address,dip_bits:tn(t.after.device_address)}),await new Promise(s=>setTimeout(s,1600)),this.setExplode(0),this.tht.preset("overview"),await new Promise(s=>setTimeout(s,1200)),this.recordTx(t.after,t.event_id,"after DIP fix");let n=t.after.decode.values;return e.push(`**Simulated fix (${t.event_id}):** opened the probe (rear gland, then the barrel at the middle seam) and set the DIP to ${Ml(tn(t.after.device_address))} \u2192 address ${t.after.device_address}.`,`Before: ${gi[t.before.decode.status]}. After: ${gi[t.after.decode.status]}${n?` \u2014 **${n.temperature_c.toFixed(1)} \xB0C, ${n.humidity_rh.toFixed(1)} %RH**`:""}.`,"This is a simulation. On the real unit, power it down before changing the DIP, and confirm the address with a bench reader."),e.join(`
`)}async worksNow(){let e=[];await this.ensureIdentity(e),this.setWorkspace("diag",{quiet:!0});let t=await Tn("get_asset_status",{transport:"simulated_rtu"});await this.refreshSession(),this.recordTx(t.transaction,t.event_id,"verification poll");let n=t.transaction;return n.decode.status==="valid"?e.push(`[ok] Yes (${t.event_id}): address ${n.master_address} answers \`${n.response_hex}\`, CRC OK \u2192 **${n.decode.values.temperature_c.toFixed(1)} \xB0C, ${n.decode.values.humidity_rh.toFixed(1)} %RH**. Source: simulated RTU, not a field measurement.`):e.push(`[fail] Not yet (${t.event_id}): ${gi[n.decode.status]}. Ask \u201CWhy does it fail?\u201D or \u201Csimulate the DIP fix\u201D.`),e.join(`
`)}async resetCase(){let e=[];await this.ensureIdentity(e);let t=await Tn("simulate_fault",{scenario:"reset"});return await this.refreshSession(),this.applyBus({master_address:t.after.master_address,dip_bits:tn(t.after.device_address)}),this.recordTx(t.after,t.event_id,"case reset"),e.push(`Case reset (${t.event_id}): ${t.action}`),e.join(`
`)}async inject(e){let t=[];await this.ensureIdentity(t),this.ws==="compat"&&this.setWorkspace("diag",{quiet:!0});let n=await Tn("simulate_fault",{scenario:e});await this.refreshSession(),this.recordTx(n.after,n.event_id,"injection");let s=n.after,r=s.decode.checks.find(o=>!o.ok),a={bad_crc:"The reply CRC does not match its bytes, so the master must discard it (\xA7 6.10). A real slave would not even answer a corrupted request.",foreign_address:"The reply comes from a different slave address than the one polled, so it is rejected.",sensor_fault:"The registers carry 7FFF H, which the manual defines as \u201Csensor abnormal\u201D (\xA7 6.7). The frame is valid; the reading is not."}[e];return s.device_address!==s.master_address?t.push(`Injected ${e} (${n.event_id}), but the sensor is still on address ${s.device_address}, so there was no reply to corrupt (timeout). Fix the DIP first to see the effect.`):t.push(`Injected **${e}** on one reply (${n.event_id}): ${gi[s.decode.status]}${r?` \u2014 ${r.check}: ${r.detail}`:""}.`,a),t.join(`
`)}async bench(){let e=[];await this.ensureIdentity(e);let t=await Tn("get_asset_status",{transport:"rtu_bench"});return await this.refreshSession(),e.push(`[warn] Bench RS-485 reader (${t.event_id}): source **${t.source}**. ${t.detail} Nothing is inferred without a reading.`),e.join(`
`)}async toggleDip(e){if(!this.identity?.confirmed){this.toast("Confirm the asset first (Live view \u2192 Capture \u2192 Confirm).");return}let t=[...this.bus.dip_bits];t[e]=t[e]?0:1;try{let n=await Tn("simulate_fault",{scenario:"set_dip",dip_bits:t});await this.refreshSession(),this.applyBus({master_address:n.after.master_address,dip_bits:t}),this.recordTx(n.after,n.event_id,`DIP ${e+1} ${t[e]?"ON":"OFF"}`),this.toast(`DIP ${e+1} ${t[e]?"ON":"OFF"} \u2192 address ${n.after.device_address} \xB7 ${gi[n.after.decode.status]}`)}catch(n){this.toast(n.message)}}buildDip(){te("dip").replaceChildren(...Fi.map((e,t)=>{let n=Te("button",{type:"button",title:`Switch ${t+1} \xB7 weight ${e}`},Te("span",{className:"slot"}),Te("span",{textContent:String(t+1)}));return n.addEventListener("click",()=>this.toggleDip(t)),n}))}renderDip(){[...te("dip").children].forEach((e,t)=>{e.classList.toggle("on",!!this.bus.dip_bits[t]),e.setAttribute("aria-pressed",String(!!this.bus.dip_bits[t]))}),te("dip-sum").textContent="= "+this.bus.dip_bits.map((e,t)=>e?Fi[t]:0).filter(Boolean).join(" + ")+` = ${this.bus.device_address}`}exportReport(){let e=Jr(),t={generated_at:new Date().toISOString(),source:"simulated",note:"Demo session. Readings come from a simulated Modbus RTU slave, not from field equipment.",mode:ls,pins:e.pins,identity:e.identity,bus:this.bus,events:e.events,transactions:this.transactions,documents:Object.values(this.bundle.documents).map(({sections:n,...s})=>s),replacement:this.replacement&&{status:this.replacement.status,criteria:this.replacement.criteria,config:this.config}};return this.download(t,"fieldscan-session-report.json"),`Exported fieldscan-session-report.json with ${e.events.length} events, ${this.transactions.length} RTU transactions and the session pins. Every value is tagged as simulated or documented.`}download(e,t){let n=URL.createObjectURL(new Blob([JSON.stringify(e,null,2)],{type:"application/json"}));Te("a",{href:n,download:t}).click(),setTimeout(()=>URL.revokeObjectURL(n),1e3)}async setConfig(e,t="ui"){Object.assign(this.config,e);for(let[s,r]of Object.entries(this.config)){let a=document.querySelector(`input[name="${s}"][value="${r}"]`);a&&(a.checked=!0)}let n=++this.requestId;te("export").disabled=!0;try{let s=await zd(this.config);if(n!==this.requestId)return;let r=this.report;this.report=s,this.render(s),this.loop.applyReport(s),this.telemetry.setReport(s),te("export").disabled=!1,this.ws==="compat"&&t!=="init"&&await this.refreshReplacement(),t!=="init"&&this.assistant.onReport(s,r,t)}catch(s){if(n!==this.requestId)return;te("verdict").className="verdict fail",te("verdict").textContent="Local result unavailable",te("replacement").textContent=s.message+" Reload or regenerate the file."}}async refreshReplacement(){let e=JSON.stringify(this.config);if(this.replacementKey===e)return this.replacement;try{let t=await Tn("check_replacement",{candidate:"eh-fmx11",...this.config});return this.replacement=t,this.replacementKey=e,await this.refreshSession(),te("criteria").replaceChildren(...(t.criteria||[]).map(n=>Te("li",{title:n.detail},Te("span",{textContent:n.criterion.replace(/_/g," ")+(n.margin_ohm!==void 0?` (${n.margin_ohm>=0?"+":""}${sa.format(n.margin_ohm)} \u03A9)`:"")}),Te("span",{className:"st "+n.status,textContent:n.status})))),t}catch(t){return this.toast(t.message),null}}render(e){let t=e.load_check,n=e.simulation,s=t.status==="pass";te("verdict").className="verdict "+(s?"ok":"fail"),te("verdict").textContent=s?"Passes the load check":"Incompatible: load exceeded",te("m-limit").textContent=sa.format(t.available_ohm)+" \u03A9",te("m-load").textContent=sa.format(t.evaluated_ohm)+" \u03A9",te("m-margin").textContent=(t.margin_ohm>=0?"+":"")+sa.format(t.margin_ohm)+" \u03A9",te("m-margin").className=t.margin_ohm>=0?"pos":"neg",te("m-state").textContent=ty[n.state],te("m-signal").textContent=n.loop_signal_ma===null?"Indeterminate":sa.format(n.loop_signal_ma)+" mA",te("m-count").textContent=n.plc_ideal_count===null?"No valid reading":new Intl.NumberFormat("en-US").format(n.plc_ideal_count);let r=t.evaluated_ohm/t.available_ohm;te("gauge-fill").style.width=Math.min(100,r*100)+"%",te("gauge-fill").style.background=r<=1?"var(--ok)":"var(--fail)",te("replacement").className="replacement"+(s?"":" fail"),te("replacement").textContent=s?"Replacement equivalence: insufficient evidence.":"Replacement equivalence: incompatible with the evaluated profile.",te("pending").replaceChildren(...e.pending.map(a=>Te("li",{textContent:a}))),te("sources").replaceChildren(...e.sources.map(a=>Te("li",{},Te("code",{textContent:a.id}),Te("a",{href:a.url,textContent:a.title,target:"_blank",rel:"noopener noreferrer"})," \xB7 "+a.section))),this.inspected&&this.ws==="compat"&&this.inspect(this.inspected,{reveal:!1})}onSample(e){this.loop.updateLive(e),te("t-ma").textContent=e.ma===null?"suppressed":e.ma.toFixed(3)+" mA",te("t-v").textContent=e.supply.toFixed(2)+" V",te("t-term").textContent=e.terminalAtDesign.toFixed(2)+" V "+(e.terminalAtDesign>=8?"(\u2265 8 V)":"(< 8 V)"),te("t-term").className=e.terminalAtDesign>=8?"pos":"neg",te("t-count").textContent=e.count===null?"\u2014":String(e.count),te("t-level").textContent=(e.level*100).toFixed(1)+" %",te("t-diag").textContent=e.diag,te("t-diag").className=e.diag==="OK"?"pos":"neg",te("tab-telemetry").hidden||ih(te("chart"),this.telemetry.history)}exportJson(){this.report&&this.download({...this.report,replacement_check:this.replacement},"boat-mvp-result.json")}async checkLink(){let e=await nh();te("pill-link").textContent=e.ok?"Local server":"Server unreachable",te("pill-link").className="pill "+(e.ok?"ok":"fail")}updateNetwork(){te("pill-net").textContent=navigator.onLine?"Online":"Offline \xB7 local mode",te("pill-net").className="pill "+(navigator.onLine?"ok":"warn")}setView(e){this.stage.setView(e),this.syncDock()}setExplode(e){this.stage.setExplode(e),te("explode").value=e,this.syncDock()}preset(e){let t=this.stage===this.tht?"tht":"loop";(t==="loop"&&e==="probe"||t==="tht"&&e==="dip")&&this.stage.view==="normal"&&this.stage.explodeTarget<.5&&(this.setView("xray"),this.toast("Switched to X-ray to see inside")),this.stage.preset(e)}focus(e){let t=this.stage===this.tht?"tht":"loop";iy[t].includes(e)&&this.stage.view==="normal"&&this.stage.explodeTarget<.5&&(this.setView("xray"),this.toast("Switched to X-ray to see inside")),this.stage.focus(e)}partName(e){return this.stage.parts[e]?.name||e}viewState(){return{workspace:this.ws,view:this.stage.view,explode:this.stage.explodeTarget,selected:this.inspected||null}}syncDock(){let e=this.stage.view,t=this.stage.explodeTarget;for(let n of document.querySelectorAll("#view-modes button")){let s=n.dataset.view==="normal"?e==="normal"&&t===0:n.dataset.view==="xray"?e==="xray":t>0;n.setAttribute("aria-pressed",String(s))}te("explode").value=t}buildCams(){let e=this.stage===this.tht?"tht":"loop";te("cams").replaceChildren(...ny[e].map(([t,n])=>{let s=Te("button",{type:"button",textContent:n});return s.dataset.cam=t,s.addEventListener("click",()=>this.preset(t)),s}))}buildAssembly(){let e=this.stage;te("assembly").replaceChildren(...Object.entries(e.parts).map(([t,n])=>{let s=Te("li");s.dataset.id=t,n.parent&&(s.style.paddingLeft=(e.parts[n.parent]?.parent?36:22)+"px");let r=Te("input",{type:"checkbox",checked:!0,title:"Visible"});r.addEventListener("click",o=>o.stopPropagation()),r.addEventListener("change",()=>e.setPartVisible?e.setPartVisible(t,r.checked):n.object.visible=r.checked);let a=Te("span",{className:"dot"});return a.style.background=n.color,s.append(r,a,Te("span",{textContent:n.name})),s.addEventListener("click",()=>{this.inspect(t),this.focus(t)}),s}))}liveValue(e){if(this.stage===this.tht)return e==="Current address"?`${this.bus.device_address} (DIP ${Ml(this.bus.dip_bits)})`:"\u2014";let t=this.report,n=this.telemetry.last;return{"Loop current":n?.ma===null?"Suppressed":(n?.ma??t.simulation.loop_signal_ma)?.toFixed?.(2)+" mA","Additional series load":`+${t.inputs.synthetic_additional_series_ohm} \u03A9`,Output:`${t.inputs.supply_v} V DC`}[e]??"\u2014"}inspect(e,{reveal:t=!0}={}){let n=this.stage;this.inspected=e,n.select(e);for(let c of document.querySelectorAll("#assembly li"))c.classList.toggle("selected",c.dataset.id===e);let s=te("inspector");if(!e||!n.parts[e]){this.inspected=null,s.replaceChildren(Te("p",{className:"muted",textContent:"Click any part in the 3D twin to inspect it."}));return}t&&this.openTab("inspector");let r=n.parts[e],a=Te("table",{className:"spec"},...r.specs.map(([c,h,d,f])=>{let[u,p]=cf[d]||cf.pending;return Te("tr",{},Te("td",{textContent:c}),Te("td",{},(h==="live"?this.liveValue(c):h)+" ",Te("span",{className:"tag "+p,textContent:u,title:f||""})))})),o=Te("div",{className:"actions"}),l=(c,h)=>{let d=Te("button",{type:"button",textContent:c});d.addEventListener("click",h),o.append(d)};l("Focus",()=>this.focus(e)),l("Isolate",()=>n.isolate(e)),l("Show all",()=>{n.showAll();for(let c of document.querySelectorAll("#assembly input"))c.checked=!0}),l(n.explodeTarget>0?"Reassemble":"Disassemble",()=>{this.setExplode(n.explodeTarget>0?0:1),this.inspect(e)}),s.replaceChildren(Te("h4",{textContent:r.name}),Te("p",{className:"role",textContent:r.role}),r.specs.length?a:Te("p",{className:"muted small",textContent:"No datasheet fields for this part."}),o)}hudLoop(){requestAnimationFrame(()=>this.hudLoop());let e=te("recog-box");if(this.ws!=="live"||e.hidden)return;let t=this.tht,n=t.parts.tht?.object;if(!n)return;this.hudBox||(this.hudBox=new Kt),this.hudBox.setFromObject(n,!0);let s=t.renderer.domElement.getBoundingClientRect(),r=1/0,a=1/0,o=-1/0,l=-1/0,c=new R,{min:h,max:d}=this.hudBox;for(let p=0;p<8;p++){c.set(p&1?d.x:h.x,p&2?d.y:h.y,p&4?d.z:h.z).project(t.camera);let x=s.left+(c.x+1)/2*s.width,g=s.top+(1-c.y)/2*s.height;r=Math.min(r,x),a=Math.min(a,g),o=Math.max(o,x),l=Math.max(l,g)}let f=te("hud").getBoundingClientRect(),u=10;Object.assign(e.style,{left:r-f.left-u+"px",top:a-f.top-u+"px",width:o-r+2*u+"px",height:l-a+2*u+"px"})}openTab(e){document.querySelector(`.tabs button[data-tab="${e}"]`)?.hidden&&(e="assistant");for(let t of document.querySelectorAll(".tabs button"))t.setAttribute("aria-selected",String(t.dataset.tab===e));for(let t of document.querySelectorAll(".tab"))t.hidden=t.id!=="tab-"+e;e==="telemetry"&&ih(te("chart"),this.telemetry.history)}tooltip(e,t,n){let s=te("tooltip");if(!e){s.hidden=!0;return}s.hidden=!1,s.textContent=e,s.style.left=t+14+"px",s.style.top=n+12+"px"}toast(e){let t=te("toast");t.textContent=e,t.hidden=!1,clearTimeout(this.toastTimer),this.toastTimer=setTimeout(()=>{t.hidden=!0},3200)}bindUi(){let e=(n,s,...r)=>te(n).addEventListener("click",()=>this.assistant.action(s,...r));for(let n of document.querySelectorAll(".workspaces button"))n.addEventListener("click",()=>this.setWorkspace(n.dataset.ws));e("btn-capture","capture"),e("btn-confirm","confirm"),e("btn-plate","showPlate"),e("btn-why","whyFail"),e("btn-manual","showManual","5"),e("btn-fix","dipFix"),e("btn-works","worksNow"),e("btn-reset","resetCase"),e("btn-report","exportReport"),e("btn-bench","bench"),te("btn-go-diag").addEventListener("click",()=>this.setWorkspace("diag")),te("btn-torch").addEventListener("click",n=>{let s=n.currentTarget.getAttribute("aria-pressed")!=="true";n.currentTarget.setAttribute("aria-pressed",String(s)),this.tht.setTorch(s)});for(let n of document.querySelectorAll("[data-inject]"))n.addEventListener("click",()=>this.assistant.action("inject",n.dataset.inject));te("manual-close").addEventListener("click",()=>te("manual").close()),te("manual").addEventListener("click",n=>{n.target===te("manual")&&te("manual").close()}),te("controls").addEventListener("submit",n=>n.preventDefault()),te("controls").addEventListener("change",n=>{let{name:s,value:r}=n.target;this.setConfig({[s]:s==="voltage"?Number(r):r},"ui")}),te("export").addEventListener("click",()=>this.exportJson());for(let n of document.querySelectorAll(".tabs button"))n.addEventListener("click",()=>this.openTab(n.dataset.tab));te("view-modes").addEventListener("click",n=>{let s=n.target.dataset?.view;if(s==="normal"&&(this.setView("normal"),this.setExplode(0)),s==="xray"&&this.setView(this.stage.view==="xray"?"normal":"xray"),s==="exploded"){let r=this.stage.explodeTarget===0;this.setExplode(r?1:0),r&&this.stage===this.tht&&this.tht.preset("probe")}}),te("explode").addEventListener("input",n=>this.setExplode(Number(n.target.value)));let t=(n,s)=>{let r=te(n);r.addEventListener("click",()=>{let a=r.getAttribute("aria-pressed")!=="true";r.setAttribute("aria-pressed",String(a)),s(a)})};t("labels-toggle",n=>{this.tht.setLabels(n),this.loop.setLabels(n)}),t("rotate-toggle",n=>{this.tht.setAutoRotate(n),this.loop.setAutoRotate(n)}),window.addEventListener("keydown",n=>{n.target.closest("input, textarea, dialog")||["1","2","3"].includes(n.key)&&this.setWorkspace({1:"live",2:"diag",3:"compat"}[n.key])}),window.addEventListener("online",()=>{this.updateNetwork(),this.assistant.onNetwork(!0)}),window.addEventListener("offline",()=>{this.updateNetwork(),this.assistant.onNetwork(!1)})}},uf=new fh;uf.start();window.__app=uf;})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
