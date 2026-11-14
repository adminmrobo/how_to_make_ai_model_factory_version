/* solar_sim.js — 「태양광 패널 셀 생산 공장 ④」 계산 모듈 (SS). 설명용 모형, 시드 고정.
   품질 특성: 광열화(LID) 뒤 안정화 효율 η_f = η_i − LID.  출하 검사는 η_i(측정 잡음 포함)와 EL 크랙만 본다.
   η_i ~ 정규(시간대마다 다른 평균·표준편차의 24개 혼합), LID ~ 정규, 크랙 수 ~ 포아송. 고객 규격 LSL: η_f ≥ 22.40 % */
var SS=(function(){
'use strict';
var K={mu:23.30,sd:0.11,sm:0.03,LSL:22.40,lam:0.000003,el:0.97,cfr:1500,cesc:40000,base:{sup:'A',plant:2,shift:3,season:'spring',load:85}};
var SUP={A:{name:'공급사 A (국내 가공)',dm:0,sx:1,lid:0.30,lsd:0.05,lx:1},B:{name:'공급사 B (동남아 수입)',dm:-0.02,sx:1.12,lid:0.38,lsd:0.06,lx:1.5},C:{name:'공급사 C (신규 수입처)',dm:0.10,sx:1.04,lid:0.56,lsd:0.09,lx:1.2}};
var PLANT={1:{name:'1공장 (구라인)',dm:-0.03,sx:1.06},2:{name:'2공장 (신라인)',dm:0,sx:1}};
var SEASON={spring:{name:'봄',dm:0,sx:1,dl:0},summer:{name:'여름',dm:-0.03,sx:1.05,dl:0.04},autumn:{name:'가을',dm:0,sx:1,dl:0},winter:{name:'겨울',dm:0.01,sx:1.02,dl:-0.02}};
var LOAD={70:{dm:0.01,sx:0.95,lx:0.8},85:{dm:0,sx:1,lx:1},100:{dm:-0.03,sx:1.12,lx:1.6}};
/* 교대 방식: 시간대(0~23시)마다 평균 이동과 표준편차 배율 */
function shiftProfile(s){var P=[];for(var h=0;h<24;h++){var dm=0,sx=1,tag='';
  if(s===3){var night=h>=22||h<6;if(night){sx*=1.04;dm-=0.01;}if(h===6||h===14||h===22){dm-=0.03;sx*=1.08;tag='교대 인계';}}
  else{var night2=h>=20||h<8;if(night2)sx*=1.05;if(h===8||h===20){dm-=0.03;sx*=1.08;tag='교대 인계';}if((h>=17&&h<20)||(h>=5&&h<8)){dm-=0.02;sx*=1.10;tag=tag||'근무 막바지 피로';}}
  P.push({h:h,dm:dm,sx:sx,tag:tag});}return P;}
var PROF={2:shiftProfile(2),3:shiftProfile(3)};
function crew(s,h){if(s===3)return h>=6&&h<14?0:h>=14&&h<22?1:2;return h>=8&&h<20?0:1;}
/* 조건 → 시간대별 분포 모수 */
function params(c){var S=SUP[c.sup],Pl=PLANT[c.plant],Se=SEASON[c.season],L=LOAD[c.load];
  return PROF[c.shift].map(function(p){return {mu:K.mu+S.dm+Pl.dm+Se.dm+L.dm+p.dm,sd:K.sd*S.sx*Pl.sx*Se.sx*L.sx*p.sx,lid:S.lid+Se.dl,lsd:S.lsd,tag:p.tag};});}
function lam(c){return K.lam*SUP[c.sup].lx*LOAD[c.load].lx;}
/* 표준정규 */
function phi(z){return Math.exp(-0.5*z*z)/2.5066282746310002;}
function Phi(z){var t=1/(1+0.2316419*Math.abs(z)),d=0.3989422804014327*Math.exp(-z*z/2),p=d*t*(0.31938153+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return z>0?1-p:p;}
function Pinv(p){/* Acklam */var a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.3577518672690,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-0.007784894002430293,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[0.007784695709041462,0.3224671290700398,2.445134137142996,3.754408661907416];
  p=Math.min(Math.max(p,1e-15),1-1e-15);var q,r;if(p<0.02425){q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  if(p>1-0.02425){q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);}
  q=p-0.5;r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);}
/* 한 시간대(정규)에서 문턱 t로 판정할 때의 확률들: 진짜 불량 D = η_f<LSL, 합격 A = η_meas ≥ t.  η_i로 적분 */
function hourStats(p,t,lidShift){var N=160,mu=p.mu,sd=p.sd,lm=p.lid+(lidShift||0),out={pd:0,acc:0,esc:0,fr:0};
  for(var k=0;k<N;k++){var z=-6+12*(k+0.5)/N,w=phi(z)*12/N,e=mu+sd*z,pD=Phi((K.LSL-(e-lm))/p.lsd),pA=t==null?1:1-Phi((t-e)/K.sm);
    out.pd+=w*pD;out.acc+=w*pA;out.esc+=w*pD*pA;out.fr+=w*(1-pD)*(1-pA);}return out;}
/* 조건 전체(24시간 혼합). t는 숫자 또는 함수(h)→문턱 */
function stats(c,t){var P=params(c),s={pd:0,acc:0,esc:0,fr:0,mu:0,m2:0},n=P.length;
  P.forEach(function(p,h){var tt=typeof t==='function'?t(h):t,o=hourStats(p,tt);s.pd+=o.pd/n;s.acc+=o.acc/n;s.esc+=o.esc/n;s.fr+=o.fr/n;var mf=p.mu-p.lid,vf=p.sd*p.sd+p.lsd*p.lsd;s.mu+=mf/n;s.m2+=(vf+mf*mf)/n;});
  var sdf=Math.sqrt(s.m2-s.mu*s.mu),pc=1-Math.exp(-lam(c));
  s.sdf=sdf;s.cpk=(s.mu-K.LSL)/(3*sdf);s.crack=pc;s.crackEsc=pc*(1-K.el);
  s.dpmo=(s.pd+pc)*1e6;s.escDpmo=(s.esc+s.crackEsc)*1e6;s.frRate=s.fr;s.sigma=sigmaLevel(s.dpmo);s.sigmaOut=sigmaLevel(s.escDpmo);
  s.cost=s.fr*K.cfr+(s.esc+s.crackEsc)*K.cesc+(t==null?0:0);return s;}
function sigmaLevel(dpmo){return Pinv(1-Math.max(dpmo,0.001)/1e6)+1.5;}
/* 난수 */
function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){var u=Math.max(r(),1e-12),v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(6.283185307179586*v);}
function pois(r,l){var L=Math.exp(-l),k=0,p=1;do{k++;p*=r();}while(p>L);return k-1;}
/* 셀 표본 만들기 */
function cells(c,n,seed){var r=rng(seed),P=params(c),lm=lam(c),out=[];for(var i=0;i<n;i++){var h=i%24,p=P[h],ei=p.mu+p.sd*gauss(r),ld=p.lid+p.lsd*gauss(r),cr=pois(r,lm);
  out.push({h:h,ei:ei,em:ei+K.sm*gauss(r),lid:ld,ef:ei-ld,cr:cr,crSeen:cr>0&&r()<K.el,bad:(ei-ld<K.LSL)||cr>0});}return out;}
/* AI 간이 판정기 v1: 기준 조건 셀 n개를 광열화 시험(라벨)에 보내 η_f ≈ a + b·η_meas 회귀를 학습하고,
   P(η_f < LSL) = Φ((LSL − 예측)/s) 가 비용 비율 p* = cfr/(cfr+cesc)보다 작으면 합격 → 문턱 t로 정리 */
function fitJudge(cs){var n=cs.length,mx=0,my=0;cs.forEach(function(x){mx+=x.em;my+=x.ef;});mx/=n;my/=n;var sxx=0,sxy=0;cs.forEach(function(x){sxx+=(x.em-mx)*(x.em-mx);sxy+=(x.em-mx)*(x.ef-my);});
  var b=sxy/sxx,a=my-b*mx,ss=0;cs.forEach(function(x){var r=x.ef-(a+b*x.em);ss+=r*r;});var s=Math.sqrt(ss/(n-2)),pstar=K.cfr/(K.cfr+K.cesc),zs=Pinv(pstar),t=(K.LSL-zs*s-a)/b;
  return {a:a,b:b,s:s,t:t,n:n,pos:cs.filter(function(x){return x.ef<K.LSL;}).length,lidHat:mx-my,
    prob:function(em){return Phi((K.LSL-(a+b*em))/s);},pred:function(em){return a+b*em;}};}
function trainV1(n,seed){return fitJudge(cells(K.base,n,seed||11));}
/* 조건을 아는 최적 문턱 (LID 평균을 lidHat로 알고 있을 때) — 1D 탐색 */
function bestT(c,lidShift){var lo=22.4,hi=23.6,best=null;for(var t=lo;t<=hi+1e-9;t+=0.01){var P=params(c),cost=0;P.forEach(function(p){var o=hourStats(p,t,lidShift);cost+=(o.fr*K.cfr+o.esc*K.cesc)/24;});if(!best||cost<best.cost)best={t:+t.toFixed(2),cost:cost};}return best.t;}
/* v2: 공급사·계절만 반영 (부분 풀링). 공급사 LID를 라벨 nLab개로 추정하고 전체 평균 쪽으로 당김(k=40) */
function lidHat(sup,nLab,seed){var S=SUP[sup],r=rng(seed||5),m=0;for(var i=0;i<nLab;i++)m+=S.lid+S.lsd*gauss(r);var prior=SUP.A.lid,k=40;return nLab?(m+k*prior)/(nLab+k):prior;}
/* v2: 인라인 측정(라벨 없이 매일 쌓임)으로 조건별 효율 분포는 알고, 광열화(LID)만 공급사별 라벨로 추정 — 신규 공급사 C는 라벨 nLabC개, 전체 평균 쪽으로 당김 */
function v2T(c,nLabC){var est=c.sup==='C'?lidHat('C',nLabC==null?500:nLabC):SUP[c.sup].lid;return bestT(c,est-SUP[c.sup].lid);}
var ALL=[];['A','B','C'].forEach(function(s){[1,2].forEach(function(pl){[2,3].forEach(function(sh){['spring','summer','autumn','winter'].forEach(function(se){[70,85,100].forEach(function(ld){ALL.push({sup:s,plant:pl,shift:sh,season:se,load:ld});});});});});});
return {K:K,SUP:SUP,PLANT:PLANT,SEASON:SEASON,LOAD:LOAD,PROF:PROF,crew:crew,params:params,lam:lam,Phi:Phi,phi:phi,Pinv:Pinv,stats:stats,sigmaLevel:sigmaLevel,rng:rng,gauss:gauss,pois:pois,cells:cells,fitJudge:fitJudge,trainV1:trainV1,bestT:bestT,lidHat:lidHat,v2T:v2T,ALL:ALL};
})();
if(typeof module!=='undefined')module.exports=SS;
