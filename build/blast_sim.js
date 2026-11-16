/* blast_sim.js — 「⑤ 배터리 열폭주 실험 랩」 계산 모듈 (BS). 설명용 모형, 시드 고정.
   결과 3단계(0 변화 없음 · 1 연기 · 2 화염)를 비례 오즈 로지스틱으로 둔다:
   P(결과 ≥ 연기) = σ(a_s + η),  P(결과 = 화염) = σ(a_f + η),  η = b·(SOC−70)/10 + c·ln(F/1300) + d·형태 + e·(T−25)/10
   '참 모형'의 숫자는 뉴스 사례(1,300 kg 압착: 100% 화염 7초·772 °C, 70% 회색 연기, 50·30% 변화 없음)에 맞춘 가정값이다. */
var BS=(function(){
'use strict';
var TRUE={as:1.735,af:-3.178,b:2.04,c:1.5,d:0.3,e:0.5};
var NEWS=[{soc:100,F:1300,shape:0,T:25,y:2,note:'7초 만에 불꽃, 검은 연기, 772 °C, 완전히 녹음'},{soc:70,F:1300,shape:0,T:25,y:1,note:'원통형·각형 모두 회색 연기 조금, 불꽃 없음'},{soc:50,F:1300,shape:0,T:25,y:0,note:'오래 지나도 변화 없음'},{soc:30,F:1300,shape:0,T:25,y:0,note:'오래 지나도 변화 없음'}];
function sig(z){return 1/(1+Math.exp(-z));}
function eta(p,x){return p.b*(x.soc-70)/10+p.c*Math.log(x.F/1300)+p.d*x.shape+p.e*(x.T-25)/10;}
function probs(p,x){var n=eta(p,x),ps=sig(p.as+n),pf=sig(p.af+n);return {none:1-ps,smoke:ps-pf,fire:pf,ps:ps,pf:pf};}
function rng(seed){var a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
/* 실험 한 번: 참 모형에서 결과를 뽑고, 온도 곡선 모수를 만든다 */
function trial(x,r){var p=probs(TRUE,x),u=r(),y=u<p.pf?2:u<p.ps?1:0;
  var onset=y===2?7+(100-x.soc)*0.25+r()*3:y===1?12+r()*10:0,peak=y===2?772*(0.55+0.45*x.soc/100)*(0.92+0.16*r()):y===1?110+70*r()+x.soc*0.4:28+x.soc*0.12+r()*4;
  return {soc:x.soc,F:x.F,shape:x.shape,T:x.T,y:y,onset:onset,peak:peak};}
function temp(tr,t){/* 시간 t(초)의 셀 표면 온도 */var base=tr.T+2;if(tr.y===0)return base+(tr.peak-base)*(1-Math.exp(-t/25));
  if(t<tr.onset)return base+(tr.y===2?40:20)*t/tr.onset;var k=tr.y===2?1.6:0.12,up=base+(tr.y===2?40:20)+(tr.peak-base)*(1-Math.exp(-(t-tr.onset)*k));
  return tr.y===2&&t>tr.onset+25?up-(t-tr.onset-25)*4:up;}
function design(n,seed,opt){opt=opt||{};var r=rng(seed),out=[],S=opt.socs||[30,40,50,60,70,80,90,100],Fs=opt.Fs||[650,1300,2000];
  for(var i=0;i<n;i++){var x={soc:S[Math.floor(r()*S.length)],F:Fs[Math.floor(r()*Fs.length)],shape:r()<0.5?-1:1,T:r()<0.75?25:40};if(opt.F)x.F=opt.F;if(opt.T)x.T=opt.T;out.push(trial(x,r));}return out;}
/* 비례 오즈 로지스틱 맞추기 (경사하강, L2 규제 lam). 반환: 모수와 손실 기록 */
function fit(data,lam,iters,init){var p=init?JSON.parse(JSON.stringify(init)):{as:0,af:-1,b:0,c:0,d:0,e:0},K=['as','af','b','c','d','e'],lr=0.5,hist=[];
  for(var it=0;it<iters;it++){var g={as:0,af:0,b:0,c:0,d:0,e:0},L=0,n=data.length;
    data.forEach(function(x){var X={b:(x.soc-70)/10,c:Math.log(x.F/1300),d:x.shape,e:(x.T-25)/10},n2=p.b*X.b+p.c*X.c+p.d*X.d+p.e*X.e,ps=sig(p.as+n2),pf=sig(p.af+n2);
      /* 두 개의 이진 로지스틱(≥연기, =화염)의 합 — 비례 오즈의 간단한 근사 */
      var ys=x.y>=1?1:0,yf=x.y===2?1:0,rs=ps-ys,rf=pf-yf;L+=-(ys*Math.log(Math.max(ps,1e-12))+(1-ys)*Math.log(Math.max(1-ps,1e-12)))-(yf*Math.log(Math.max(pf,1e-12))+(1-yf)*Math.log(Math.max(1-pf,1e-12)));
      g.as+=rs;g.af+=rf;['b','c','d','e'].forEach(function(k){g[k]+=(rs+rf)*X[k];});});
    K.forEach(function(k){var reg=(k==='as'||k==='af')?0:lam*p[k];p[k]-=lr*(g[k]/n+reg);});
    if(p.af>p.as)p.af=p.as-0.01;if(it%10===0||it===iters-1)hist.push({it:it,b:p.b,L:L/n});}
  p.hist=hist;return p;}
function logloss(p,data){var L=0;data.forEach(function(x){var q=probs(p,x),pr=x.y===2?q.fire:x.y===1?q.smoke:q.none;L+=-Math.log(Math.max(pr,1e-6));});return L/data.length;}
function acc(p,data){var ok=0;data.forEach(function(x){var q=probs(p,x),m=q.fire>q.smoke&&q.fire>q.none?2:q.smoke>q.none?1:0;if(m===x.y)ok++;});return ok/data.length;}
return {TRUE:TRUE,NEWS:NEWS,sig:sig,probs:probs,rng:rng,trial:trial,temp:temp,design:design,fit:fit,logloss:logloss,acc:acc};
})();
if(typeof module!=='undefined')module.exports=BS;
