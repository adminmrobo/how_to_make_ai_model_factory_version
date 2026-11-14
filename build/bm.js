/* bm.js — 「배터리 모델 공장」 계산 모듈 (battery math).
   페이지 안에 그대로 들어가고(build.js), node로도 돌려 기대 수치를 확인한다(code/check_numbers.js).
   난수는 시드 고정 mulberry32 + 박스-뮬러. Math.random()은 쓰지 않는다.
   데이터는 모두 설명용 모형이다(실제 배터리 측정값 아님). */
var BM=(function(){
'use strict';
function rng(seed){var a=seed>>>0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){var u=0,v=0;while(u<1e-12)u=r();v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function sig(z){return z>=0?1/(1+Math.exp(-z)):Math.exp(z)/(1+Math.exp(z));}
function shuffle(a,r){for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}

/* ── 배터리 셀 데이터 ──
   특징 4개(원래 단위): 내부저항 R(mΩ), 초기 용량 C(Ah), 충전 중 온도 상승 T(°C), 셀 전압 편차 V(mV)
   정답 2개: 불량 여부(0/1), 수명(충·방전 횟수, 용량이 처음의 80%로 떨어질 때까지라고 가정)
   공장 B(shift=1)는 새 양극재를 쓴다고 가정: 온도 영향이 커지고 수명이 짧아진다. */
/* 자율주행 전기차 팩에 들어가는 대용량(수십 Ah급) 셀을 흉내 낸 설명용 값. 모델은 표준화한 값만 쓰므로 단위·크기를 바꿔도 결과는 같다 */
var FEAT=[['R','내부저항','mΩ',1.2,0.15],['C','초기 용량','Ah',60,1.5],['T','온도 상승','°C',8,2],['V','전압 편차','mV',10,4]];
function makeCells(seed,n,shift){var r=rng(seed),X=[],Z=[],yc=[],yr=[];shift=shift||0;
  for(var i=0;i<n;i++){var z=[gauss(r),gauss(r),gauss(r),gauss(r)];
    var raw=FEAT.map(function(f,k){return f[3]+f[4]*z[k];});
    var zR=z[0],zC=z[1],zT=z[2],zV=z[3];
    var life=1100-45*zR+35*zC-(40+35*shift)*zT-25*zV-30*zR*zT-20*zT*zT-160*shift+30*gauss(r);
    var s=2*(1.5*zR+(1.1+0.6*shift)*zT+0.9*zV-(0.6+1.6*shift)*zC+0.8*zR*zT+0.5*zV*zV-2.6-0.3*shift);
    var d=r()<sig(s)?1:0;
    X.push(raw);Z.push(z);yc.push(d);yr.push(Math.round(life));}
  return {X:X,Z:Z,yc:yc,yr:yr,n:n};}
/* 표준화: 훈련 데이터의 평균·표준편차로만 (검증·시험 정보가 새지 않게) */
function stats(D,idx){var m=[0,0,0,0],s=[0,0,0,0],n=idx.length;idx.forEach(function(i){for(var k=0;k<4;k++)m[k]+=D.X[i][k];});m=m.map(function(v){return v/n;});
  idx.forEach(function(i){for(var k=0;k<4;k++){var e=D.X[i][k]-m[k];s[k]+=e*e;}});s=s.map(function(v){return Math.sqrt(v/n);});
  var lm=0,ls=0;idx.forEach(function(i){lm+=D.yr[i];});lm/=n;idx.forEach(function(i){var e=D.yr[i]-lm;ls+=e*e;});ls=Math.sqrt(ls/n);
  return {m:m,s:s,lm:lm,ls:ls};}
function view(D,idx,S){return {x:idx.map(function(i){return D.X[i].map(function(v,k){return (v-S.m[k])/S.s[k];});}),
  yc:idx.map(function(i){return D.yc[i];}),yr:idx.map(function(i){return (D.yr[i]-S.lm)/S.ls;}),life:idx.map(function(i){return D.yr[i];}),idx:idx,n:idx.length};}
/* 분할: 훈련 60% · 검증 20% · 시험 20%(봉인) */
function split(D,seed,fr){fr=fr||[0.6,0.2];var idx=shuffle(D.X.map(function(_,i){return i;}),rng(seed));
  var a=Math.round(D.n*fr[0]),b=a+Math.round(D.n*fr[1]);return {tr:idx.slice(0,a),va:idx.slice(a,b),te:idx.slice(b)};}

/* ── 다층 퍼셉트론: 입력 4 → 은닉 H(tanh) → 출력 1 ──
   kind 'cls': 출력에 시그모이드, 손실 = 교차 엔트로피 −ln P(정답)
   kind 'reg': 출력 그대로(표준화한 수명), 손실 = 평균제곱오차 */
function Net(H,seed,scale,nin){nin=nin||4;var r=rng(seed),sc=scale==null?1:scale,P={H:H,nin:nin,W1:[],b1:[],W2:[],b2:0};
  for(var j=0;j<H;j++){var row=[];for(var k=0;k<nin;k++)row.push(gauss(r)*sc/Math.sqrt(nin));P.W1.push(row);P.b1.push(0);P.W2.push(gauss(r)*sc/Math.sqrt(H));}
  return P;}
function nParams(P){return P.H*P.nin+P.H+P.H+1;}
function clone(P){return {H:P.H,nin:P.nin,W1:P.W1.map(function(r){return r.slice();}),b1:P.b1.slice(),W2:P.W2.slice(),b2:P.b2,A:P.A?P.A.slice():undefined,B:P.B?P.B.slice():undefined};}
/* 평평한 벡터로 (기울기 검사·저장용) */
function flat(P){var v=[];P.W1.forEach(function(r){v.push.apply(v,r);});v.push.apply(v,P.b1);v.push.apply(v,P.W2);v.push(P.b2);return v;}
function unflat(P,v){var i=0;P.W1.forEach(function(r){for(var k=0;k<r.length;k++)r[k]=v[i++];});for(var j=0;j<P.H;j++)P.b1[j]=v[i++];for(j=0;j<P.H;j++)P.W2[j]=v[i++];P.b2=v[i++];return P;}
/* 어댑터(LoRA 비슷한 낮은 순위 보정): W1의 실효값 = W1(동결) + A·Bᵀ (A: H×1, B: nin×1) */
function w1eff(P,j,k){var w=P.W1[j][k];if(P.A)w+=P.A[j]*P.B[k];return w;}
function fwd(P,x){var h=new Array(P.H),z=P.b2;for(var j=0;j<P.H;j++){var a=P.b1[j];for(var k=0;k<P.nin;k++)a+=w1eff(P,j,k)*x[k];h[j]=Math.tanh(a);z+=P.W2[j]*h[j];}return {h:h,z:z};}
function predict(P,kind,x){var f=fwd(P,x);return kind==='cls'?sig(f.z):f.z;}
function lossOne(kind,out,y){if(kind==='cls'){var p=sig(out);return -(y?Math.log(Math.max(p,1e-12)):Math.log(Math.max(1-p,1e-12)));}var e=out-y;return e*e;}
function loss(P,kind,V,ids){var s=0,n=ids?ids.length:V.n;for(var t=0;t<n;t++){var i=ids?ids[t]:t;s+=lossOne(kind,fwd(P,V.x[i]).z,kind==='cls'?V.yc[i]:V.yr[i]);}return s/n;}
/* 역전파: 묶음 평균 손실의 기울기. bug=true면 tanh 미분을 빠뜨린 틀린 기울기(기울기 검사 시연용) */
function grad(P,kind,V,ids,bug){var H=P.H,nin=P.nin,G={W1:[],b1:new Array(H).fill(0),W2:new Array(H).fill(0),b2:0},n=ids.length;
  for(var j=0;j<H;j++)G.W1.push(new Array(nin).fill(0));if(P.A){G.A=new Array(H).fill(0);G.B=new Array(nin).fill(0);}
  ids.forEach(function(i){var x=V.x[i],f=fwd(P,x),y=kind==='cls'?V.yc[i]:V.yr[i];
    var dz=kind==='cls'?(sig(f.z)-y):2*(f.z-y);dz/=n;G.b2+=dz;
    for(var j=0;j<H;j++){G.W2[j]+=dz*f.h[j];var da=dz*P.W2[j]*(bug?1:(1-f.h[j]*f.h[j]));G.b1[j]+=da;
      for(var k=0;k<nin;k++){G.W1[j][k]+=da*x[k];if(P.A){G.A[j]+=da*P.B[k]*x[k];G.B[k]+=da*P.A[j]*x[k];}}}});
  return G;}
function gflat(G){var v=[];G.W1.forEach(function(r){v.push.apply(v,r);});v.push.apply(v,G.b1);v.push.apply(v,G.W2);v.push(G.b2);return v;}
/* 기울기 검사: 역전파 값과 중심 차분 (L(θ+h) − L(θ−h)) / 2h 의 최대 상대 오차 */
function gradCheck(P,kind,V,ids,bug){var g=gflat(grad(P,kind,V,ids,bug)),th=flat(P),h=1e-5,worst=0,num=[];
  for(var i=0;i<th.length;i++){var a=th.slice(),b=th.slice();a[i]+=h;b[i]-=h;var la=loss(unflat(clone(P),a),kind,V,ids),lb=loss(unflat(clone(P),b),kind,V,ids);var nd=(la-lb)/(2*h);num.push(nd);
    var rel=Math.abs(nd-g[i])/Math.max(1e-8,Math.abs(nd)+Math.abs(g[i]));if(rel>worst)worst=rel;}
  return {bp:g,fd:num,maxRel:worst};}

/* ── 옵티마이저: SGD 또는 Adam. mask로 학습할 부분만 고른다(미세조정) ── */
function Opt(kind,lr){return {kind:kind,lr:lr,t:0,m:{},v:{}};}
function stepOpt(O,P,G,mask){mask=mask||{W1:1,b1:1,W2:1,b2:1,A:1,B:1};O.t++;var b1=0.9,b2=0.999,eps=1e-8;
  function upd(key,arr,garr){if(!mask[key]||!arr)return;var m=O.m[key]||(O.m[key]=new Array(garr.length).fill(0)),v=O.v[key]||(O.v[key]=new Array(garr.length).fill(0));
    for(var i=0;i<garr.length;i++){var g=garr[i];if(O.kind==='adam'){m[i]=b1*m[i]+(1-b1)*g;v[i]=b2*v[i]+(1-b2)*g*g;var mh=m[i]/(1-Math.pow(b1,O.t)),vh=v[i]/(1-Math.pow(b2,O.t));arr[i]-=O.lr*mh/(Math.sqrt(vh)+eps);}else arr[i]-=O.lr*g;}}
  var w=[];P.W1.forEach(function(r){w.push.apply(w,r);});var gw=[];G.W1.forEach(function(r){gw.push.apply(gw,r);});
  upd('W1',w,gw);var c=0;P.W1.forEach(function(r){for(var k=0;k<r.length;k++)r[k]=w[c++];});
  upd('b1',P.b1,G.b1);upd('W2',P.W2,G.W2);var bb=[P.b2];upd('b2',bb,[G.b2]);P.b2=bb[0];
  if(P.A){upd('A',P.A,G.A);upd('B',P.B,G.B);}}
/* 한 에포크: 훈련 데이터를 섞어 batch개씩 */
function epoch(P,kind,V,O,batch,r,mask){var ids=shuffle(V.x.map(function(_,i){return i;}),r),steps=0;
  for(var s=0;s<ids.length;s+=batch){var b=ids.slice(s,Math.min(ids.length,s+batch));stepOpt(O,P,grad(P,kind,V,b),mask);steps++;}return steps;}
/* 평가 */
function evalCls(P,V,thr){thr=thr==null?0.5:thr;var tp=0,fp=0,tn=0,fn=0,L=0;for(var i=0;i<V.n;i++){var p=sig(fwd(P,V.x[i]).z),y=V.yc[i];L+=lossOne('cls',fwd(P,V.x[i]).z,y);var h=p>=thr?1:0;
    if(h&&y)tp++;else if(h&&!y)fp++;else if(!h&&y)fn++;else tn++;}
  var pr=tp+fp?tp/(tp+fp):0,rc=tp+fn?tp/(tp+fn):0;return {acc:(tp+tn)/V.n,prec:pr,rec:rc,f1:pr+rc?2*pr*rc/(pr+rc):0,tp:tp,fp:fp,tn:tn,fn:fn,loss:L/V.n};}
function evalReg(P,V,S){var ae=0,se=0,L=0,ym=0;for(var i=0;i<V.n;i++)ym+=V.life[i];ym/=V.n;var st=0;
  for(i=0;i<V.n;i++){var z=fwd(P,V.x[i]).z,yh=z*S.ls+S.lm,e=yh-V.life[i];ae+=Math.abs(e);se+=e*e;L+=lossOne('reg',z,V.yr[i]);st+=(V.life[i]-ym)*(V.life[i]-ym);}
  return {mae:ae/V.n,rmse:Math.sqrt(se/V.n),r2:1-se/st,loss:L/V.n};}
/* 학습 기록: 에포크마다 훈련·검증 손실 */
/* 조금씩 돌리는 학습(브라우저에서 화면을 멈추지 않게). run(n): n 에포크 더. node 확인과 같은 순서로 난수를 쓴다 */
function job(o){var J={o:o,P:o.P||Net(o.H,o.seed,o.scale),O:Opt(o.opt||'adam',o.lr),r:rng(o.seed+7),hist:[],steps:0,e:0,done:false,lastIds:null};
  J.f1=o.track?[[0,o.kind==='cls'?evalCls(J.P,o.va).f1:evalReg(J.P,o.va,o.S).mae]]:null;J.best={l:Infinity,e:0,P:clone(J.P)};J.hist.push([0,loss(J.P,o.kind,o.tr),loss(J.P,o.kind,o.va)]);if(J.hist[0][2]<J.best.l)J.best={l:J.hist[0][2],e:0,P:clone(J.P)};
  J.run=function(n){for(var k=0;k<n&&!J.done;k++){var bs=o.batch||o.tr.n,ids=shuffle(o.tr.x.map(function(_,i){return i;}),J.r);J.lastIds=ids;
      for(var s=0;s<ids.length;s+=bs){stepOpt(J.O,J.P,grad(J.P,o.kind,o.tr,ids.slice(s,Math.min(ids.length,s+bs))),o.mask);J.steps++;}
      J.e++;var lt=loss(J.P,o.kind,o.tr),lv=loss(J.P,o.kind,o.va);J.hist.push([J.e,lt,lv]);if(o.track)J.f1.push([J.e,o.kind==='cls'?evalCls(J.P,o.va).f1:evalReg(J.P,o.va,o.S).mae]);if(lv<J.best.l-1e-9)J.best={l:lv,e:J.e,P:clone(J.P)};
      if(J.e>=o.epochs)J.done=true;}return J;};
  return J;}
function train(o){var J=job(o).run(o.epochs);return {P:J.P,hist:J.hist,best:J.best,steps:J.steps};}
/* 매개변수 지문(추론 전후 비교): 값들을 정해진 순서로 섞은 정수 */
function checksum(P){var v=flat(P),h=2166136261;for(var i=0;i<v.length;i++){var s=v[i].toFixed(12);for(var k=0;k<s.length;k++){h^=s.charCodeAt(k);h=Math.imul(h,16777619)>>>0;}}return ('00000000'+h.toString(16)).slice(-8);}

return {rng:rng,gauss:gauss,sig:sig,shuffle:shuffle,FEAT:FEAT,makeCells:makeCells,stats:stats,view:view,split:split,Net:Net,nParams:nParams,clone:clone,flat:flat,unflat:unflat,
  fwd:fwd,predict:predict,lossOne:lossOne,loss:loss,grad:grad,gflat:gflat,gradCheck:gradCheck,Opt:Opt,stepOpt:stepOpt,epoch:epoch,evalCls:evalCls,evalReg:evalReg,train:train,job:job,checksum:checksum};
})();
if(typeof module!=='undefined')module.exports=BM;
