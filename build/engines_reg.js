/* engines_reg.js — 도감 회귀 엔진 9종 (배터리 수명). 외부 라이브러리 없이 직접 구현, 시드 고정.
   입력 V = {x:[[4]], yr:[표준화 수명], n}. fit(V, opt, seed) → {p(x): 표준화 수명 예측, size, info} */
var ER=(function(){
'use strict';
var BMx=(typeof BM!=='undefined')?BM:require('./bm.js');
var rng=BMx.rng,gauss=BMx.gauss;
function design(x){return [1,x[0],x[1],x[2],x[3]];}
function solve(A,b){var n=b.length,M=A.map(function(r,i){return r.concat([b[i]]);});
  for(var c=0;c<n;c++){var p=c;for(var r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;var t=M[c];M[c]=M[p];M[p]=t;
    for(r=0;r<n;r++){if(r===c)continue;var f=M[r][c]/M[c][c];for(var k=c;k<=n;k++)M[r][k]-=f*M[c][k];}}
  return M.map(function(r,i){return r[n]/r[i];});}
/* 1·2. 선형 회귀 / 릿지: (XᵀX + λI)w = Xᵀy (절편은 벌점 없음) */
function ridgeFit(V,lam){var A=[],b=[0,0,0,0,0];for(var i=0;i<5;i++)A.push([0,0,0,0,0]);
  for(var n=0;n<V.n;n++){var d=design(V.x[n]);for(i=0;i<5;i++){b[i]+=d[i]*V.yr[n];for(var j=0;j<5;j++)A[i][j]+=d[i]*d[j];}}
  for(i=1;i<5;i++)A[i][i]+=lam*V.n;var w=solve(A,b);return w;}
function lin(w){return function(x){var d=design(x),s=0;for(var i=0;i<5;i++)s+=w[i]*d[i];return s;};}
function linear(V,o,seed){var w=ridgeFit(V,0);return {p:lin(w),size:5,info:'절편 '+w[0].toFixed(2)+', 기울기 ['+w.slice(1).map(function(v){return v.toFixed(2);}).join(', ')+']',w:w};}
function ridge(V,o,seed){var lam=o.lam==null?0.05:o.lam,w=ridgeFit(V,lam);return {p:lin(w),size:5,info:'λ = '+lam+', 기울기 ['+w.slice(1).map(function(v){return v.toFixed(2);}).join(', ')+']',w:w};}
/* 3. 라쏘: 좌표 하강, 소프트 문턱 */
function lasso(V,o,seed){var a=o.alpha==null?0.05:o.alpha,w=[0,0,0,0],b=0,n=V.n,my=0;for(var i=0;i<n;i++)my+=V.yr[i];my/=n;b=my;
  var ss=[0,0,0,0];for(i=0;i<n;i++)for(var k=0;k<4;k++)ss[k]+=V.x[i][k]*V.x[i][k]/n;
  for(var it=0;it<300;it++){for(k=0;k<4;k++){var rho=0;for(i=0;i<n;i++){var pr=b;for(var j=0;j<4;j++)if(j!==k)pr+=w[j]*V.x[i][j];rho+=V.x[i][k]*(V.yr[i]-pr);}rho/=n;
      w[k]=(rho>a?rho-a:rho<-a?rho+a:0)/ss[k];}var r=0;for(i=0;i<n;i++){var p=0;for(j=0;j<4;j++)p+=w[j]*V.x[i][j];r+=V.yr[i]-p;}b=r/n;}
  var nz=w.filter(function(v){return v!==0;}).length;
  return {p:function(x){return b+w[0]*x[0]+w[1]*x[1]+w[2]*x[2]+w[3]*x[3];},size:1+nz,info:'α = '+a+', 0이 아닌 기울기 '+nz+'개 ['+w.map(function(v){return v.toFixed(2);}).join(', ')+']',w:[b].concat(w)};}
/* 4. 회귀 트리 (분산 줄이기) */
function rtree(X,y,ids,depth,o,r,feats){var n=ids.length,s=0,s2=0;ids.forEach(function(i){s+=y[i];s2+=y[i]*y[i];});var leaf={leaf:true,v:s/n};
  if(depth>=o.depth||n<2*o.minLeaf)return leaf;var best=null,base=s2-s*s/n,fs=feats?feats(r):[0,1,2,3];
  fs.forEach(function(f){var so=ids.slice().sort(function(a,b){return X[a][f]-X[b][f];}),ls=0,ls2=0;
    for(var k=0;k<n-1;k++){var v=y[so[k]];ls+=v;ls2+=v*v;var nl=k+1;if(nl<o.minLeaf||n-nl<o.minLeaf||X[so[k]][f]===X[so[k+1]][f])continue;
      var sse=(ls2-ls*ls/nl)+((s2-ls2)-(s-ls)*(s-ls)/(n-nl));if(!best||sse<best.sse)best={sse:sse,f:f,t:(X[so[k]][f]+X[so[k+1]][f])/2};}});
  if(!best||best.sse>=base-1e-12)return leaf;var L=[],R=[];ids.forEach(function(i){(X[i][best.f]<=best.t?L:R).push(i);});
  return {f:best.f,t:best.t,l:rtree(X,y,L,depth+1,o,r,feats),r:rtree(X,y,R,depth+1,o,r,feats)};}
function tp(t,x){while(!t.leaf)t=x[t.f]<=t.t?t.l:t.r;return t.v;}
function tc(t){return t.leaf?1:1+tc(t.l)+tc(t.r);}
function tree(V,o,seed){var T=rtree(V.x,V.yr,V.x.map(function(_,i){return i;}),0,{depth:o.depth||5,minLeaf:5},rng(seed));var nn=tc(T);return {p:function(x){return tp(T,x);},size:nn,info:'마디 '+nn+'개, 깊이 ≤ '+(o.depth||5)};}
function forest(V,o,seed){var r=rng(seed),nt=o.trees||50,Ts=[],tot=0,feats=function(rr){var a=[0,1,2,3];for(var i=3;i>0;i--){var j=Math.floor(rr()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a.slice(0,2);};
  for(var k=0;k<nt;k++){var ids=[];for(var i=0;i<V.n;i++)ids.push(Math.floor(r()*V.n));var T=rtree(V.x,V.yr,ids,0,{depth:o.depth||8,minLeaf:3},r,feats);Ts.push(T);tot+=tc(T);}
  return {p:function(x){var s=0;for(var k=0;k<Ts.length;k++)s+=tp(Ts[k],x);return s/Ts.length;},size:tot,info:'트리 '+nt+'그루, 마디 합계 '+tot};}
/* 6. 그래디언트 부스팅 (제곱 손실 → 잔차에 트리) */
function boost(V,o,seed){var nt=o.trees||100,eta=o.lr||0.1,F=[],Ts=[],tot=0,ids=V.x.map(function(_,i){return i;}),f0=V.yr.reduce(function(a,b){return a+b;},0)/V.n;for(var i=0;i<V.n;i++)F.push(f0);
  for(var k=0;k<nt;k++){var res=V.yr.map(function(y,i){return y-F[i];}),T=rtree(V.x,res,ids,0,{depth:o.depth||3,minLeaf:5},null);Ts.push(T);tot+=tc(T);for(i=0;i<V.n;i++)F[i]+=eta*tp(T,V.x[i]);}
  return {p:function(x){var s=f0;for(var k=0;k<Ts.length;k++)s+=eta*tp(Ts[k],x);return s;},size:tot,info:'트리 '+nt+'그루 × 학습률 '+eta+', 마디 합계 '+tot};}
/* 7. k-최근접 이웃 회귀 */
function knn(V,o,seed){var k=o.k||15;return {p:function(x){var d=[];for(var i=0;i<V.n;i++){var s=0;for(var j=0;j<4;j++){var e=x[j]-V.x[i][j];s+=e*e;}d.push([s,V.yr[i]]);}d.sort(function(a,b){return a[0]-b[0];});var p=0;for(i=0;i<k;i++)p+=d[i][1];return p/k;},size:V.n*5,info:'훈련 셀 '+V.n+'개를 통째로 저장, k = '+k};}
/* 8. 가우시안 프로세스 (RBF 커널, 잡음 분산 고정) — 촐레스키 */
function gp(V,o,seed){var ls=o.ls||1.5,noise=o.noise||0.1,n=V.n,K=[];
  function kf(a,b){var d=0;for(var k=0;k<4;k++){var e=a[k]-b[k];d+=e*e;}return Math.exp(-d/(2*ls*ls));}
  for(var i=0;i<n;i++){var row=new Float64Array(n);for(var j=0;j<=i;j++){row[j]=kf(V.x[i],V.x[j])+(i===j?noise:0);}K.push(row);}
  var Lm=K;for(j=0;j<n;j++){var s=Lm[j][j];for(var k=0;k<j;k++)s-=Lm[j][k]*Lm[j][k];Lm[j][j]=Math.sqrt(Math.max(s,1e-12));for(i=j+1;i<n;i++){var t=Lm[i][j];for(k=0;k<j;k++)t-=Lm[i][k]*Lm[j][k];Lm[i][j]=t/Lm[j][j];}}
  var my=V.yr.reduce(function(a,b){return a+b;},0)/n,z=new Float64Array(n),al=new Float64Array(n);for(i=0;i<n;i++){var u=V.yr[i]-my;for(k=0;k<i;k++)u-=Lm[i][k]*z[k];z[i]=u/Lm[i][i];}
  for(i=n-1;i>=0;i--){u=z[i];for(k=i+1;k<n;k++)u-=Lm[k][i]*al[k];al[i]=u/Lm[i][i];}
  /* 예측 표준편차(표준화 단위, 잡음 포함): √(1 + noise − vᵀv), v = L⁻¹k* */
  function sd(x){var v=new Float64Array(n),q=0;for(var i=0;i<n;i++){var u=kf(x,V.x[i]);for(var k=0;k<i;k++)u-=Lm[i][k]*v[k];v[i]=u/Lm[i][i];q+=v[i]*v[i];}return Math.sqrt(Math.max(1e-9,1+noise-q));}
  return {p:function(x){var s=my;for(var i=0;i<n;i++)s+=al[i]*kf(x,V.x[i]);return s;},sd:sd,size:n*5,info:'훈련 셀 '+n+'개와 가중치 α를 저장, 길이 척도 '+ls+', 예측 구간도 냄'};}
/* 9. DFF (MLP) — bm.js의 Net, 회귀 출력 */
function mlp(V,o,seed){var J=BMx.job({kind:'reg',H:o.H||8,seed:seed,epochs:o.epochs||120,tr:V,va:V,opt:'adam',lr:o.lr||0.01,batch:32}).run(o.epochs||120),P=J.P;
  return {p:function(x){return BMx.fwd(P,x).z;},size:BMx.nParams(P),info:'4 → '+(o.H||8)+' → 1, 파라미터 '+BMx.nParams(P)+'개, '+(o.epochs||120)+' 에포크 끝까지',P:P};}

var XPL={lin:'높음 (기울기 4개)',ridge:'높음 (기울기 4개)',lasso:'높음 (쓰는 특징만 남김)',tree:'높음 (질문 경로)',rf:'중간 (특징 중요도)',boost:'중간 (특징 중요도)',knn:'중간 (비슷한 셀 보여 주기)',gp:'중간 (불확실성도 냄)',mlp:'낮음'};
var LIST=[
 {id:'lin',book:'ml',name:'선형 회귀',fam:'선형 모델',fit:linear,knob:null,def:{},one:'측정값 4개의 가중합으로 수명을 맞힌다. 오차 제곱합이 가장 작은 평면 하나.'},
 {id:'ridge',book:'ml',name:'릿지',fam:'선형 모델',fit:ridge,knob:['lam','λ (벌점 세기)',0,1,0.01],def:{lam:0.05},one:'선형 회귀에 "기울기를 너무 키우지 마" 벌점(L2)을 더한다.'},
 {id:'lasso',book:'ml',name:'라쏘',fam:'선형 모델',fit:lasso,knob:['alpha','α (벌점 세기)',0,0.5,0.01],def:{alpha:0.05},one:'L1 벌점으로 쓸모없는 기울기를 아예 0으로 만든다. 특징 고르기.'},
 {id:'tree',book:'ml',name:'회귀 트리',fam:'트리',fit:tree,knob:['depth','최대 깊이',1,10,1],def:{depth:5},one:'질문으로 셀을 나누고, 나뉜 칸마다 평균 수명을 답한다. 계단 모양.'},
 {id:'rf',book:'ml',name:'랜덤 포레스트',fam:'앙상블',fit:forest,knob:['trees','트리 수',5,100,5],def:{trees:50},one:'조금씩 다른 데이터로 키운 회귀 트리 여러 그루의 평균.'},
 {id:'boost',book:'ml',name:'그래디언트 부스팅',fam:'앙상블',fit:boost,knob:['trees','트리 수',10,300,10],def:{trees:100},one:'앞 트리가 남긴 잔차를 다음 트리가 맞힌다. XGBoost·LightGBM·CatBoost의 원리.'},
 {id:'knn',book:'ml',name:'k-최근접 이웃',fam:'이웃 기반',fit:knn,knob:['k','이웃 수 k',1,51,2],def:{k:15},one:'가장 비슷한 셀 k개의 평균 수명. 데이터를 통째로 들고 다닌다.'},
 {id:'gp',book:'ml',name:'가우시안 프로세스',fam:'확률 모델',fit:gp,knob:['ls','길이 척도',0.3,4,0.1],def:{ls:1.5},one:'비슷한 셀은 비슷한 수명이라는 가정을 커널로. 예측과 함께 불확실성도 낸다.'},
 {id:'mlp',book:'nn',name:'DFF (MLP)',fam:'심층 순전파망',fit:mlp,knob:['H','은닉 뉴런',2,32,1],def:{H:8},one:'4 → 은닉 → 1 신경망, 출력에 시그모이드 없이 수명을 그대로. 120 에포크 끝까지. 정비 ①~⑩의 주인공.'}];
function evalR(M,V,S){var ae=0,se=0,st=0,ym=0,over=0;for(var i=0;i<V.n;i++)ym+=V.life[i];ym/=V.n;
  for(i=0;i<V.n;i++){var yh=M.p(V.x[i])*S.ls+S.lm,e=yh-V.life[i];ae+=Math.abs(e);se+=e*e;st+=(V.life[i]-ym)*(V.life[i]-ym);}
  return {mae:ae/V.n,rmse:Math.sqrt(se/V.n),r2:1-se/st};}
return {XPL:XPL,LIST:LIST,evalR:evalR,linear:linear,ridge:ridge,lasso:lasso,tree:tree,forest:forest,boost:boost,knn:knn,gp:gp,mlp:mlp};
})();
if(typeof module!=='undefined')module.exports=ER;
