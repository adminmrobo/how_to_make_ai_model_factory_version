/* engines.js — 도감 엔진 9종 (분류). 외부 라이브러리 없이 직접 구현, 시드 고정.
   입력 V = {x:[[4]], yc:[0/1], n}. fit(V, opt, seed) → {p(x): 불량 확률, size: 저장하는 값의 수, info}
   bm.js(BM)를 함께 쓴다. node로도 돌려 기대 수치를 확인한다. */
var EN=(function(){
'use strict';
var BMx=(typeof BM!=='undefined')?BM:require('./bm.js');
var rng=BMx.rng,gauss=BMx.gauss,sig=BMx.sig;

/* 1. 로지스틱 회귀 (머신러닝 도감 · 선형 모델) */
function logistic(V,o,seed){var w=[0,0,0,0],b=0,lr=0.1,l2=o.l2==null?0.001:o.l2;
  for(var it=0;it<600;it++){var gw=[0,0,0,0],gb=0;for(var i=0;i<V.n;i++){var x=V.x[i],e=sig(w[0]*x[0]+w[1]*x[1]+w[2]*x[2]+w[3]*x[3]+b)-V.yc[i];for(var k=0;k<4;k++)gw[k]+=e*x[k];gb+=e;}
    for(k=0;k<4;k++)w[k]-=lr*(gw[k]/V.n+l2*w[k]);b-=lr*gb/V.n;}
  return {p:function(x){return sig(w[0]*x[0]+w[1]*x[1]+w[2]*x[2]+w[3]*x[3]+b);},size:5,info:'w = ['+w.map(function(v){return v.toFixed(2);}).join(', ')+'], b = '+b.toFixed(2)};}

/* 2. 결정 트리 (CART, 지니) — 가중치 g로 회귀 트리도 만든다(부스팅용) */
function gini(a,b){var n=a+b;if(!n)return 0;var p=a/n;return 2*p*(1-p);}
function buildTree(X,y,ids,depth,o,r,feats){var n=ids.length,pos=0;ids.forEach(function(i){pos+=y[i];});
  var leaf={leaf:true,v:(pos+o.prior*0.5)/(n+o.prior),n:n};if(depth>=o.depth||n<2*o.minLeaf||pos===0||pos===n)return leaf;
  var best=null,fs=feats?feats(r):[0,1,2,3];
  fs.forEach(function(f){var s=ids.slice().sort(function(a,b){return X[a][f]-X[b][f];}),lp=0;
    for(var k=0;k<n-1;k++){lp+=y[s[k]];var nl=k+1;if(nl<o.minLeaf||n-nl<o.minLeaf)continue;if(X[s[k]][f]===X[s[k+1]][f])continue;
      var imp=(nl*gini(lp,nl-lp)+(n-nl)*gini(pos-lp,n-nl-pos+lp))/n;if(!best||imp<best.imp)best={imp:imp,f:f,t:(X[s[k]][f]+X[s[k+1]][f])/2};}});
  if(!best||best.imp>=gini(pos,n-pos)-1e-12)return leaf;
  var L=[],R=[];ids.forEach(function(i){(X[i][best.f]<=best.t?L:R).push(i);});
  return {f:best.f,t:best.t,l:buildTree(X,y,L,depth+1,o,r,feats),r:buildTree(X,y,R,depth+1,o,r,feats),n:n};}
function tpred(t,x){while(!t.leaf)t=x[t.f]<=t.t?t.l:t.r;return t.v;}
function tcount(t){return t.leaf?1:1+tcount(t.l)+tcount(t.r);}
function tree(V,o,seed){var T=buildTree(V.x,V.yc,V.x.map(function(_,i){return i;}),0,{depth:o.depth||4,minLeaf:o.minLeaf||5,prior:1},rng(seed));
  var nn=tcount(T);return {p:function(x){return tpred(T,x);},size:nn,info:'마디 '+nn+'개, 깊이 ≤ '+(o.depth||4),T:T};}

/* 3. 랜덤 포레스트: 부트스트랩 + 마디마다 특징 2개만 */
function forest(V,o,seed){var r=rng(seed),nt=o.trees||50,Ts=[],tot=0;
  var feats=function(rr){var a=[0,1,2,3];for(var i=3;i>0;i--){var j=Math.floor(rr()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a.slice(0,2);};
  for(var k=0;k<nt;k++){var ids=[];for(var i=0;i<V.n;i++)ids.push(Math.floor(r()*V.n));var T=buildTree(V.x,V.yc,ids,0,{depth:o.depth||6,minLeaf:o.minLeaf||3,prior:1},r,feats);Ts.push(T);tot+=tcount(T);}
  return {p:function(x){var s=0;for(var k=0;k<Ts.length;k++)s+=tpred(Ts[k],x);return s/Ts.length;},size:tot,info:'트리 '+nt+'그루, 마디 합계 '+tot};}

/* 4. 그래디언트 부스팅 (XGBoost·LightGBM·CatBoost 계열의 원형): 로지스틱 손실, 깊이 얕은 회귀 트리를 차례로 더함 */
function rtree(X,g,h,ids,depth,o){var G=0,Hs=0;ids.forEach(function(i){G+=g[i];Hs+=h[i];});var leaf={leaf:true,v:-G/(Hs+o.lam)};
  if(depth>=o.depth||ids.length<2*o.minLeaf)return leaf;var best=null,base=G*G/(Hs+o.lam);
  for(var f=0;f<4;f++){var s=ids.slice().sort(function(a,b){return X[a][f]-X[b][f];}),gl=0,hl=0;
    for(var k=0;k<s.length-1;k++){gl+=g[s[k]];hl+=h[s[k]];var nl=k+1;if(nl<o.minLeaf||s.length-nl<o.minLeaf||X[s[k]][f]===X[s[k+1]][f])continue;
      var gain=gl*gl/(hl+o.lam)+(G-gl)*(G-gl)/(Hs-hl+o.lam)-base;if(!best||gain>best.gain)best={gain:gain,f:f,t:(X[s[k]][f]+X[s[k+1]][f])/2};}}
  if(!best||best.gain<=1e-9)return leaf;var L=[],R=[];ids.forEach(function(i){(X[i][best.f]<=best.t?L:R).push(i);});
  return {f:best.f,t:best.t,l:rtree(X,g,h,L,depth+1,o),r:rtree(X,g,h,R,depth+1,o)};}
function boost(V,o,seed){var nt=o.trees||100,eta=o.lr||0.1,F=new Array(V.n).fill(0),Ts=[],tot=0,ids=V.x.map(function(_,i){return i;});
  var p0=V.yc.reduce(function(a,b){return a+b;},0)/V.n,f0=Math.log(p0/(1-p0));for(var i=0;i<V.n;i++)F[i]=f0;
  for(var k=0;k<nt;k++){var g=[],h=[];for(i=0;i<V.n;i++){var p=sig(F[i]);g.push(p-V.yc[i]);h.push(Math.max(1e-6,p*(1-p)));}
    var T=rtree(V.x,g,h,ids,0,{depth:o.depth||3,minLeaf:5,lam:1});Ts.push(T);tot+=tcount(T);for(i=0;i<V.n;i++)F[i]+=eta*tpred(T,V.x[i]);}
  return {p:function(x){var s=f0;for(var k=0;k<Ts.length;k++)s+=eta*tpred(Ts[k],x);return sig(s);},size:tot,info:'트리 '+nt+'그루 × 학습률 '+eta+', 마디 합계 '+tot};}

/* 5. SVM (RBF 커널, Pegasos 방식 확률적 하강) */
function svm(V,o,seed){var gam=o.gamma||0.5,lam=o.lam||0.001,r=rng(seed),n=V.n,a=new Float64Array(n),y=V.yc.map(function(v){return v?1:-1;}),K=[];
  for(var i=0;i<n;i++){var row=new Float64Array(n);for(var j=0;j<n;j++){var d=0;for(var k=0;k<4;k++){var e=V.x[i][k]-V.x[j][k];d+=e*e;}row[j]=Math.exp(-gam*d);}K.push(row);}
  var T=o.iters||20*n;for(var t=1;t<=T;t++){var ii=Math.floor(r()*n),s=0;for(j=0;j<n;j++)if(a[j])s+=a[j]*y[j]*K[ii][j];if(y[ii]*s/(lam*t)<1)a[ii]++;}
  var sv=[],c=[];for(j=0;j<n;j++)if(a[j]){sv.push(V.x[j]);c.push(a[j]*y[j]/(lam*T));}
  function score(x){var s=0;for(var j=0;j<sv.length;j++){var d=0;for(var k=0;k<4;k++){var e=x[k]-sv[j][k];d+=e*e;}s+=c[j]*Math.exp(-gam*d);}return s;}
  return {p:function(x){return sig(2*score(x));},size:sv.length*5,info:'서포트 벡터 '+sv.length+'개 (값 '+sv.length*5+'개), γ = '+gam};}

/* 6. 가우시안 나이브 베이즈 */
function nbayes(V,o,seed){var m=[[0,0,0,0],[0,0,0,0]],v=[[0,0,0,0],[0,0,0,0]],c=[0,0];
  for(var i=0;i<V.n;i++){var y=V.yc[i];c[y]++;for(var k=0;k<4;k++)m[y][k]+=V.x[i][k];}for(y=0;y<2;y++)for(k=0;k<4;k++)m[y][k]/=c[y];
  for(i=0;i<V.n;i++){y=V.yc[i];for(k=0;k<4;k++){var e=V.x[i][k]-m[y][k];v[y][k]+=e*e;}}for(y=0;y<2;y++)for(k=0;k<4;k++)v[y][k]=v[y][k]/c[y]+1e-6;
  var pr=[c[0]/V.n,c[1]/V.n];
  return {p:function(x){var l=[Math.log(pr[0]),Math.log(pr[1])];for(var y=0;y<2;y++)for(var k=0;k<4;k++){var e=x[k]-m[y][k];l[y]+=-0.5*Math.log(2*Math.PI*v[y][k])-e*e/(2*v[y][k]);}return sig(l[1]-l[0]);},size:18,info:'반별 평균·분산 4개씩 + 사전확률'};}

/* 7. k-최근접 이웃 */
function knn(V,o,seed){var k=o.k||15;
  return {p:function(x){var d=[];for(var i=0;i<V.n;i++){var s=0;for(var j=0;j<4;j++){var e=x[j]-V.x[i][j];s+=e*e;}d.push([s,V.yc[i]]);}d.sort(function(a,b){return a[0]-b[0];});var p=0;for(i=0;i<k;i++)p+=d[i][1];return p/k;},
    size:V.n*5,info:'훈련 셀 '+V.n+'개를 통째로 저장 (값 '+V.n*5+'개), k = '+k};}

/* 8. DFF / MLP (신경망 도감) — bm.js의 Net */
function innerSplit(V,seed){var r=rng(seed+101),ids=BMx.shuffle(V.x.map(function(_,i){return i;}),r),k=Math.round(V.n*0.8),pick=function(a){return {x:a.map(function(i){return V.x[i];}),yc:a.map(function(i){return V.yc[i];}),yr:V.yr?a.map(function(i){return V.yr[i];}):undefined,life:V.life?a.map(function(i){return V.life[i];}):undefined,n:a.length};};return {tr:pick(ids.slice(0,k)),va:pick(ids.slice(k))};}
function mlp(V,o,seed){var tr=V,va=V,stop=o.inner!==false&&!o.epochsOnly;if(stop){var sp=innerSplit(V,seed);tr=sp.tr;va=sp.va;}
  var J=BMx.job({kind:'cls',H:o.H||8,seed:seed,epochs:o.epochs||120,tr:tr,va:va,opt:'adam',lr:o.lr||0.01,batch:32}).run(o.epochs||120),P=stop?J.best.P:J.P;
  return {p:function(x){return sig(BMx.fwd(P,x).z);},size:BMx.nParams(P),info:'4 → '+(o.H||8)+' → 1, 파라미터 '+BMx.nParams(P)+'개'+(stop?', 훈련 셀 안에서 떼어 둔 20%로 멈춘 에포크 '+J.best.e:', '+(o.epochs||120)+' 에포크 끝까지'),P:P,J:J};}

/* 9. 오토인코더 (신경망 도감 · 이상 탐지): 양품만으로 4 → 2 → 4 복원을 배우고, 복원 오차가 큰 셀을 불량으로 */
function ae(V,o,seed){var H=o.H||2,r=rng(seed),W1=[],b1=[],W2=[],b2=[0,0,0,0],lr=0.01,good=[];for(var i=0;i<V.n;i++)if(!V.yc[i])good.push(i);
  for(var j=0;j<H;j++){W1.push([0,0,0,0].map(function(){return gauss(r)*0.5;}));b1.push(0);}for(var k=0;k<4;k++)W2.push(new Array(H).fill(0).map(function(){return gauss(r)*0.5;}));
  var O={};function adam(key,arr,g,t){var m=O[key+'m']||(O[key+'m']=new Array(arr.length).fill(0)),v=O[key+'v']||(O[key+'v']=new Array(arr.length).fill(0));for(var q=0;q<arr.length;q++){m[q]=0.9*m[q]+0.1*g[q];v[q]=0.999*v[q]+0.001*g[q]*g[q];arr[q]-=lr*(m[q]/(1-Math.pow(0.9,t)))/(Math.sqrt(v[q]/(1-Math.pow(0.999,t)))+1e-8);}}
  function fw(x){var h=[],out=[];for(var j=0;j<H;j++){var a=b1[j];for(var k=0;k<4;k++)a+=W1[j][k]*x[k];h.push(Math.tanh(a));}for(k=0;k<4;k++){var s=b2[k];for(j=0;j<H;j++)s+=W2[k][j]*h[j];out.push(s);}return {h:h,o:out};}
  var t=0;for(var ep=0;ep<150;ep++){BMx.shuffle(good,r);for(var s=0;s<good.length;s+=32){var bt=good.slice(s,s+32),gW1=W1.map(function(rw){return rw.map(function(){return 0;});}),gb1=new Array(H).fill(0),gW2=W2.map(function(rw){return rw.map(function(){return 0;});}),gb2=[0,0,0,0];
      bt.forEach(function(i){var x=V.x[i],f=fw(x),dh=new Array(H).fill(0);for(var k=0;k<4;k++){var e=2*(f.o[k]-x[k])/(4*bt.length);gb2[k]+=e;for(var j=0;j<H;j++){gW2[k][j]+=e*f.h[j];dh[j]+=e*W2[k][j];}}
        for(j=0;j<H;j++){var da=dh[j]*(1-f.h[j]*f.h[j]);gb1[j]+=da;for(k=0;k<4;k++)gW1[j][k]+=da*x[k];}});t++;
      W1.forEach(function(rw,j){adam('W1'+j,rw,gW1[j],t);});adam('b1',b1,gb1,t);W2.forEach(function(rw,k){adam('W2'+k,rw,gW2[k],t);});adam('b2',b2,gb2,t);}}
  function err(x){var f=fw(x),s=0;for(var k=0;k<4;k++){var e=f.o[k]-x[k];s+=e*e;}return s/4;}
  /* 문턱: 훈련 데이터에서 F1이 가장 큰 복원 오차 (라벨은 문턱 고르기에만 씀) */
  var es=V.x.map(function(x,i){return [err(x),V.yc[i]];}).sort(function(a,b){return b[0]-a[0];}),P=V.yc.reduce(function(a,b){return a+b;},0),tp=0,bestF=-1,thr=es[0][0];
  for(i=0;i<es.length;i++){tp+=es[i][1];var f1=2*tp/(i+1+P);if(f1>bestF){bestF=f1;thr=i+1<es.length?(es[i][0]+es[i+1][0])/2:es[i][0];}}
  var sc=Math.max(1e-3,thr*0.3);
  return {p:function(x){return sig((err(x)-thr)/sc);},size:H*4+H+4*H+4,info:'4 → '+H+' → 4, 양품 셀로만 학습, 복원 오차 문턱 '+thr.toFixed(3),err:err,thr:thr};}

var XPL={logit:'높음 (가중치 4개)',tree:'높음 (질문 경로)',rf:'중간 (특징 중요도)',boost:'중간 (특징 중요도)',svm:'낮음',nb:'높음 (반별 평균·분산)',knn:'중간 (비슷한 셀 보여 주기)',mlp:'낮음',ae:'중간 (복원 오차)'};
var LIST=[
 {id:'logit',book:'ml',name:'로지스틱 회귀',fam:'선형 모델',fit:logistic,knob:null,def:{},one:'측정값 4개의 가중합을 시그모이드로 확률로. 경계는 곧은 평면 하나.'},
 {id:'tree',book:'ml',name:'결정 트리',fam:'트리',fit:tree,knob:['depth','최대 깊이',1,10,1],def:{depth:4},one:'"저항이 기준보다 높은가?" 같은 질문을 이어 가는 스무고개. 경계가 계단 모양.'},
 {id:'rf',book:'ml',name:'랜덤 포레스트',fam:'앙상블',fit:forest,knob:['trees','트리 수',5,100,5],def:{trees:50},one:'조금씩 다른 데이터로 키운 트리 여러 그루의 투표. 한 그루보다 덜 흔들린다.'},
 {id:'boost',book:'ml',name:'그래디언트 부스팅',fam:'앙상블',fit:boost,knob:['trees','트리 수',10,300,10],def:{trees:100},one:'앞 트리가 틀린 만큼을 다음 트리가 고친다. XGBoost·LightGBM·CatBoost의 원리.'},
 {id:'svm',book:'ml',name:'SVM (RBF)',fam:'서포트 벡터 머신',fit:svm,knob:['gamma','γ (경계 굽힘)',0.05,3,0.05],def:{gamma:0.5},one:'두 반 사이의 여백을 가장 넓게. RBF 커널로 굽은 경계도 만든다.'},
 {id:'nb',book:'ml',name:'나이브 베이즈',fam:'확률 모델',fit:nbayes,knob:null,def:{},one:'특징끼리 서로 상관없다고 가정하고 확률을 곱한다. 빠르고 작다.'},
 {id:'knn',book:'ml',name:'k-최근접 이웃',fam:'이웃 기반',fit:knn,knob:['k','이웃 수 k',1,51,2],def:{k:15},one:'가장 비슷한 셀 k개의 다수결. 학습 대신 데이터를 통째로 들고 다닌다.'},
 {id:'mlp',book:'nn',name:'DFF (MLP)',fam:'심층 순전파망',fit:mlp,knob:['H','은닉 뉴런',2,32,1],def:{H:8,epochsOnly:true},one:'4 → 은닉 → 1 신경망. 파라미터를 역전파로 배운다. 벤치에서는 120 에포크를 끝까지 돈다. 정비 공정 ①~⑩의 주인공.'},
 {id:'ae',book:'nn',name:'오토인코더 (AE)',fam:'이상 탐지',fit:ae,knob:['H','병목 크기',1,3,1],def:{H:2},one:'양품만 보고 "양품다운 모양"을 복원하도록 배운다. 복원이 안 되는 셀이 불량 후보. (불량을 가르는 문턱만 훈련 라벨로 고른다)'}];
function evalP(M,V){var tp=0,fp=0,tn=0,fn=0;for(var i=0;i<V.n;i++){var h=M.p(V.x[i])>=0.5?1:0,y=V.yc[i];if(h&&y)tp++;else if(h)fp++;else if(y)fn++;else tn++;}
  var pr=tp+fp?tp/(tp+fp):0,rc=tp+fn?tp/(tp+fn):0;return {acc:(tp+tn)/V.n,prec:pr,rec:rc,f1:pr+rc?2*pr*rc/(pr+rc):0,tp:tp,fp:fp,tn:tn,fn:fn};}
return {XPL:XPL,LIST:LIST,evalP:evalP,innerSplit:innerSplit,logistic:logistic,tree:tree,forest:forest,boost:boost,svm:svm,nbayes:nbayes,knn:knn,mlp:mlp,ae:ae};
})();
if(typeof module!=='undefined')module.exports=EN;
