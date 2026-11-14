/* reg.js — 「배터리 수명 예측 장치 ① 엔진부 제작」 페이지 스크립트 (IIFE 하나). page.js에서 reg_js_make.py로 만든다 */
(function(){
'use strict';
var $=U.$,$$=U.$$,fmt=U.fmt,cssv=U.cssv,clamp=U.clamp;
var C={eye:cssv('--eye'),gfp:cssv('--gfp'),stain:cssv('--stain'),amber:cssv('--amber'),info:cssv('--info'),muted:cssv('--muted'),text:cssv('--text'),rule:cssv('--rule'),terrain:cssv('--terrain')};
function n0(x){return Math.round(x).toLocaleString('ko-KR');}
function mini(cls,label,val){return '<div class="mini '+(cls||'')+'"><span>'+label+'</span><b>'+val+'</b></div>';}

/* ══ 데이터세트: 공장 A 셀 1,000개 · 공장 B 셀 400개 (판정기 편과 같은 셀, 같은 나누기) ══ */
var D=BM.makeCells(2026,1000,0),SP=BM.split(D,7),S=BM.stats(D,SP.tr);
var TR=BM.view(D,SP.tr,S),VA=BM.view(D,SP.va,S),TE=BM.view(D,SP.te,S);
var DB=BM.makeCells(3031,400,1),SPB=BM.split(DB,9,[0.15,0.35]);
var TRB=BM.view(DB,SPB.tr,S),VAB=BM.view(DB,SPB.va,S);
var H0=8,EP=120,TGT={mae:30,mem:8192,gc:1e-5};
var PRODUCT={key:'gauge',name:'배터리 수명 예측 장치'};  /* 이 공장의 제품 (분류 편: 불량품 판정기) */
function LF(z){return z*S.ls+S.lm;}  /* 표준화 수명 → 회 */
var FLOOR=30*Math.sqrt(2/Math.PI);  /* 수명 공식의 잡음(표준편차 30회)이 만드는 평균 오차 바닥 ≈ 23.9회 */
var ECOL={lin:'#5b6874',ridge:'#1e55c8',lasso:'#9b3fb5',tree:'#8f5a2e',rf:'#1f7a52',boost:'#a35c00',knn:'#0b7a86',gp:'#c9302c',mlp:'#c42a6e'};
/* 수명 색: 짧음(빨강) → 중간(노랑) → 김(파랑) */
function lifeCol(L,a){var u=clamp((L-(S.lm-2.2*S.ls))/(4.4*S.ls),0,1),c=u<0.5?[[201,48,44],[227,178,60]]:[[227,178,60],[30,85,200]],v=u<0.5?u*2:(u-0.5)*2;
  return 'rgba('+c[0].map(function(x,i){return Math.round(x+(c[1][i]-x)*v);}).join(',')+','+(a==null?1:a)+')';}
var LQ=TR.life.slice().sort(function(a,b){return a-b;})[Math.floor(TR.n*0.2)];  /* 훈련 셀 수명 하위 20% 경계 */

/* ══ 현황판: 정비 작업장 10곳 ══ */
var WS=[
 {n:1,name:'부품 창고',card:'01',m:'출력 검사 4칸',crit:'셀 A·B의 y₁·y₂ 부호 4칸 모두 맞음',proc:'P9'},
 {n:2,name:'뉴런 조립대',card:'02',m:'수명 점수 검사 2셀',crit:'단수명 셀 z < 0, 장수명 셀 z > 0',proc:'P9'},
 {n:3,name:'설계도실',card:'03',m:'파라미터·활성값 변화',crit:'셀 2개 이상: 파라미터 변화 0, 활성값 변화 > 0',proc:'P3·P9'},
 {n:4,name:'계량실',card:'04',m:'가중치 메모리',crit:'BMS 예산 8 KB 이하 (예시값)',proc:'P9'},
 {n:5,name:'첫 시동',card:'05',m:'초기 손실',crit:'초기 손실 ≤ 평균만 말하기 기준선의 2배',proc:'P8'},
 {n:6,name:'원인 추적실',card:'06',m:'기울기 검사',crit:'최대 상대 오차 < 0.00001',proc:'P9'},
 {n:7,name:'조정대',card:'07',m:'걸음 뒤 손실',crit:'손실이 줄고 발산하지 않음',proc:'P9'},
 {n:8,name:'길들이기 라인',card:'08',m:'검증 평균 오차',crit:'평균 오차 ≤ 30회 (예시 기준)',proc:'P8~P10'},
 {n:9,name:'개조 공정',card:'09',m:'공장 B 검증 평균 오차',crit:'어댑터 오차 < 그대로 쓰기, 학습 값 < 49',proc:'P9'},
 {n:10,name:'출고 검사실',card:'10',m:'용량 실험 · 가중치 지문',crit:'용량 실험 완료, 추론 전후 지문 같음',proc:'P11'}];
var QS={};
var LAMP={wait:['','대기'],run:['run','검사 중'],ok:['ok','합격'],ng:['ng','불합격']};
function lamp(st){var l=LAMP[st]||LAMP.wait;return '<span class="lamp '+l[0]+'">'+l[1]+'</span>';}
$('#boardgrid').innerHTML=WS.map(function(w){return '<a class="wst" href="#w'+w.n+'" id="bt'+w.n+'"><span class="no">작업장 '+w.n+' · 카드 '+w.card+'</span><b>'+w.name+'</b><span class="mv" id="bv'+w.n+'">'+w.m+'</span><span id="bl'+w.n+'">'+lamp('wait')+'</span></a>';}).join('');
$('#sum-tb').innerHTML=WS.map(function(w){return '<tr id="sum-row'+w.n+'"><td>'+w.card+'</td><td><a href="#w'+w.n+'">'+w.n+' '+w.name+'</a></td><td>'+w.proc+'</td><td>'+w.m+' — '+w.crit+'</td><td>'+lamp('wait')+'</td></tr>';}).join('');
function QC(n,st,val,note){QS[n]=st;var w=WS[n-1];$('#bl'+n).innerHTML=lamp(st);$('#bv'+n).textContent=w.m+(val?' · '+val:'');
  var q=$('#qc'+n);if(q)q.innerHTML='<span class="qn">검사 지표 · '+w.m+'</span><span class="qv">'+(val||'—')+'</span>'+lamp(st)+'<span class="qr">기준: '+w.crit+(note?' · '+note:'')+'</span>';
  var ok=0;WS.forEach(function(x){if(QS[x.n]==='ok')ok++;});$('#shipbar').style.width=(ok*10)+'%';$('#shiptxt').textContent='합격 '+ok+' / 10';$('#shipban').classList.toggle('on',ok===10);
  var r=$('#sum-row'+n);if(r)r.lastElementChild.innerHTML=lamp(st);}

/* ══ 정비 중인 DFF 회귀 엔진 (⑧이 만든다) ══ */
var M={P:null,hc:null,mh:null,ec:0,steps:0};
var W8={batch:32,opt:'adam',lr:0.01,running:false,jc:null};
function job8(){return BM.job({kind:'reg',H:H0,seed:11,epochs:EP,tr:TR,va:VA,S:S,opt:W8.opt,lr:W8.lr,batch:W8.batch,track:1});}
function adopt(J){M.P=J.best.P;M.ec=J.best.e;M.hc=J.hist;M.mh=J.f1;M.steps=J.steps;M.vr=BM.evalReg(M.P,VA,S);}
var DEF=job8().run(EP);adopt(DEF);var REGA=DEF.best.P;

/* ══ 회귀 엔진 9종 · 벤치 ══ */
var BENCH={},SEL='mlp',KN={};ER.LIST.forEach(function(e){KN[e.id]=Object.assign({},e.def);});
function fitEngine(id){var e=ER.LIST.filter(function(x){return x.id===id;})[0],o=Object.assign({},KN[id]);
  var t0=performance.now(),Mo=e.fit(TR,o,11),ms=performance.now()-t0,v=ER.evalR(Mo,VA,S),tr=ER.evalR(Mo,TR,S);
  var t1=performance.now(),pv=[];for(var i=0;i<VA.n;i++)pv.push(LF(Mo.p(VA.x[i])));var us=(performance.now()-t1)*1000/VA.n;
  var psd=Mo.sd?VA.x.map(function(x){return Mo.sd(x)*S.ls;}):null;
  BENCH[id]={e:e,M:Mo,v:v,tr:tr,pv:pv,psd:psd,ms:ms,us:us,size:Mo.size,knob:JSON.stringify(KN[id])};return BENCH[id];}
/* 5번 나눠 다시 재기: 훈련·검증 800개를 섞어 600 · 200으로 (시험 200은 그대로 봉인) */
var REP={},POOL=SP.tr.concat(SP.va);
function splitK(k,N){var ids=BM.shuffle(POOL.slice(),BM.rng(1000+k)),tr=ids.slice(0,N||600),va=ids.slice(600),Sk=BM.stats(D,tr);return {tr:BM.view(D,tr,Sk),va:BM.view(D,va,Sk),S:Sk};}
var SPLITS=null;function splits(){if(!SPLITS){SPLITS=[];for(var k=0;k<10;k++)SPLITS.push(splitK(k));}return SPLITS;}
function runRep(done){var jobs=[];ER.LIST.forEach(function(e){if(REP[e.id]&&REP[e.id].a.length===5)return;REP[e.id]={a:[]};for(var k=0;k<5;k++)jobs.push([e,k]);});var i=0;
  (function step(){if(i>=jobs.length){$('#b-rprog').textContent='완료 · 9종 × 5번';benchTable();done&&done();return;}var j=jobs[i++],sp=splits()[j[1]];REP[j[0].id].a.push(ER.evalR(j[0].fit(sp.tr,Object.assign({},j[0].def),11),sp.va,sp.S).mae);
    var a=REP[j[0].id].a;if(a.length===5){var m=a.reduce(function(x,y){return x+y;},0)/5;REP[j[0].id].m=m;REP[j[0].id].sd=Math.sqrt(a.reduce(function(x,y){return x+(y-m)*(y-m);},0)/4);benchTable();}
    $('#b-rprog').textContent=j[0].name+' '+(j[1]+1)+'번째 · '+i+' / '+jobs.length;setTimeout(step,20);})();}
function repDone(){return ER.LIST.every(function(e){return REP[e.id]&&REP[e.id].m!=null;});}
function engName(id){return ER.LIST.filter(function(x){return x.id===id;})[0].name;}
function shelf(){['ml','nn'].forEach(function(bk){var h=$('#shelf-'+bk),html=ER.LIST.filter(function(e){return e.book===bk;}).map(function(e){var b=BENCH[e.id];
    return '<button type="button" class="eng" data-id="'+e.id+'" aria-pressed="'+(e.id===SEL)+'"><span class="sc">'+(b?fmt(b.v.mae,1)+'회':'')+'</span><b><span class="chip" style="background:'+ECOL[e.id]+'"></span>'+e.name+'</b><small>'+e.fam+'</small><p>'+e.one+'</p></button>';}).join('');
    var off=bk==='nn'?[['LSTM · GRU','시계열 엔진','충·방전 곡선이 들어오면 꺼낸다. 수명 예측 연구에서 자주 쓴다.'],['오토인코더','이상 탐지 엔진','불량품 판정기 편에서 썼다. 수명 숫자를 맞히는 데는 안 쓴다.']]:[['로지스틱 회귀 · 나이브 베이즈','분류 엔진','불량품 판정기 편 담당. 확률을 내는 엔진이라 이번엔 보관.']];
    html+=off.map(function(x){return '<div class="eng off" aria-disabled="true"><b><span class="chip" style="background:#c9cfd6"></span>'+x[0]+'</b><small>'+x[1]+' · 이번엔 창고 보관</small><p>'+x[2]+'</p></div>';}).join('');
    h.innerHTML=html;});
  $$('.eng[data-id]').forEach(function(b){b.onclick=function(){SEL=b.dataset.id;mount();shelf();Fac.refresh&&Fac.refresh();document.getElementById('mount').scrollIntoView({behavior:U.reduce?'auto':'smooth'});};});}
var TOL=30,OK=3;
function costAt(b,m){var c=0;for(var i=0;i<VA.n;i++){var e=b.pv[i]-m-VA.life[i];c+=e>0?OK*e:-e;}return c/VA.n;}
function tolStat(b){var ok=0,ov=0,un=0,mo=0;for(var i=0;i<VA.n;i++){var e=b.pv[i]-VA.life[i];if(Math.abs(e)<=TOL)ok++;else if(e>0){ov++;mo=Math.max(mo,e);}else un++;}return {ok:ok,ov:ov,un:un,mo:mo};}
function tolUI(){var b=BENCH[SEL];if(!b)return;var t=tolStat(b),bias=b.pv.reduce(function(s,p,i){return s+p-VA.life[i];},0)/VA.n;
  $('#m-cost').innerHTML=mini('g','허용 오차 안 (±'+TOL+'회)',t.ok+' / '+VA.n+'개')+mini('r','과대예측 (실제보다 '+TOL+'회 넘게 길게)',t.ov+'개')+mini('','과소예측 (짧게)',t.un+'개')+mini(t.mo>100?'r':'','가장 큰 과대예측 · 평균 치우침',(t.ov?'+'+n0(t.mo)+'회':'—')+' · '+(bias>=0?'+':'')+fmt(bias,1)+'회');
  var c0=costAt(b,0),best={m:0,c:c0};for(var m=5;m<=100;m+=5){var cm=costAt(b,m);if(cm<best.c-1e-9)best={m:m,c:cm};}var t2=tolStat({pv:b.pv.map(function(p){return p-best.m;})});
  $('#m-cost').innerHTML+=mini('a','셀당 비용 (과대 1회 = 과소 '+OK+'회)',fmt(c0,1))+mini('g','가장 싼 여유분: 예측 − '+best.m+'회','비용 '+fmt(best.c,1)+' · 과대 '+t.ov+' → '+t2.ov+'개');
  if(b.psd){var cov=0;for(var i=0;i<VA.n;i++)if(Math.abs(b.pv[i]-VA.life[i])<=1.96*b.psd[i])cov++;var ms=b.psd.reduce(function(a,x){return a+x;},0)/VA.n;
    $('#m-cost').innerHTML+=mini('m','95% 예측 구간 안에 든 셀',cov+' / '+VA.n+' ('+fmt(cov/VA.n*100,0)+'%)')+mini('','구간 반폭 평균','± '+n0(1.96*ms)+'회');}
  drawPvA();}
$('#r-tol').oninput=function(){TOL=+this.value;$('#v-tol').textContent=TOL+'회';tolUI();};
$('#r-ok').oninput=function(){OK=+this.value;$('#v-ok').textContent=OK+'회';tolUI();};
var mapCv=$('#cvMap'),pvCv=$('#cvPvA');
function mount(){var e=ER.LIST.filter(function(x){return x.id===SEL;})[0],b=BENCH[SEL];if(!b||b.knob!==JSON.stringify(KN[SEL]))b=fitEngine(SEL);
  $('#m-title').textContent='장착한 엔진 — '+e.name+' ('+(e.book==='ml'?'머신러닝 도감':'신경망 도감')+' · '+e.fam+')';
  var kh=$('#m-knob');if(e.knob){var k=e.knob,v=KN[SEL][k[0]];kh.innerHTML='<label class="glabel" for="r-knob">'+k[1]+'</label><input type="range" id="r-knob" min="'+k[2]+'" max="'+k[3]+'" step="'+k[4]+'" value="'+v+'"><span class="val" id="v-knob">'+v+'</span>';
    $('#r-knob').oninput=function(){KN[SEL][k[0]]=+this.value;$('#v-knob').textContent=this.value;};}else kh.innerHTML='<span class="glabel">이 엔진은 돌릴 손잡이가 없습니다 (기본 설정)</span>';
  $('#m-info').textContent='엔진 속: '+b.M.info;
  var gap=b.v.mae-b.tr.mae;
  $('#m-minis').innerHTML=mini(b.v.mae<=TGT.mae?'g':'','검증 평균 오차',fmt(b.v.mae,1)+'회')+mini('','R² · RMSE',fmt(b.v.r2,3)+' · '+fmt(b.v.rmse,1)+'회')+mini(gap>8?'r':'','훈련 오차 (차이)',fmt(b.tr.mae,1)+'회 ('+(gap>=0?'+':'')+fmt(gap,1)+')')+mini('m','저장 값 · 학습 시간',n0(b.size)+'개 · '+fmt(b.ms,0)+' ms');
  U.ins($('#i-mount'),[[b.v.mae<=TGT.mae?'g':'a',e.name+' 엔진: 검증 셀의 수명을 평균 '+fmt(b.v.mae,1)+'회 틀립니다(수명 평균 '+n0(S.lm)+'회, 표준편차 '+n0(S.ls)+'회, 잡음 바닥 약 '+fmt(FLOOR,0)+'회). R² '+fmt(b.v.r2,3)+'.'],[gap>8?'r':'g',gap>8?'검증 오차가 훈련 오차보다 '+fmt(gap,1)+'회 큽니다. 훈련 셀을 외우는 경향이 있어요. 손잡이를 줄여 보세요(트리 깊이·수, k를 키우기, 길이 척도 키우기 등).':'훈련과 검증의 오차 차이가 크지 않습니다. 외우기보다 일반화에 가깝습니다.']]);
  tolUI();drawMap();prod();board();}
$('#m-run').onclick=function(){fitEngine(SEL);mount();shelf();benchTable();};
function drawMap(){var b=BENCH[SEL];if(!b)return;var R=U.setup(mapCv),g=R.g,w=R.w,h=R.h,L=40,T=12,Bm=28,W=w-L-8,Hh=h-T-Bm,n=46,xr=[-3,3],yr=[-3,3];
  for(var i=0;i<n;i++)for(var j=0;j<n;j++){var x=xr[0]+(xr[1]-xr[0])*(i+0.5)/n,y=yr[0]+(yr[1]-yr[0])*(j+0.5)/n;
    g.fillStyle=lifeCol(LF(b.M.p([x,0,y,0])),0.42);g.fillRect(L+i*W/n,T+Hh-(j+1)*Hh/n,W/n+0.6,Hh/n+0.6);}
  for(i=0;i<VA.n;i++){var px=L+(VA.x[i][0]-xr[0])/(xr[1]-xr[0])*W,py=T+Hh-(VA.x[i][2]-yr[0])/(yr[1]-yr[0])*Hh;if(px<L||px>L+W||py<T||py>T+Hh)continue;g.beginPath();g.arc(px,py,2.8,0,7);g.fillStyle=lifeCol(VA.life[i]);g.fill();g.strokeStyle='#fff';g.lineWidth=0.8;g.stroke();}
  g.strokeStyle=C.rule;g.strokeRect(L,T,W,Hh);g.fillStyle=C.muted;g.font='11.5px '+cssv('--font');g.textAlign='center';[-2,0,2].forEach(function(t){g.fillText((t>0?'+':'')+t+'σ',L+(t-xr[0])/(xr[1]-xr[0])*W,T+Hh+15);});
  g.textAlign='right';[-2,0,2].forEach(function(t){g.fillText((t>0?'+':'')+t+'σ',L-4,T+Hh-(t-yr[0])/(yr[1]-yr[0])*Hh+4);});g.fillText('내부저항 →',L+W,h-2);g.save();g.translate(11,T+Hh/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText('온도 상승 →',0,0);g.restore();
  U.label(g,L+8,T+12,engName(SEL),ECOL[SEL],'left');U.stamp(g,w,'단면 · 색 = 예측 수명');mapCv.setAttribute('aria-label',engName(SEL)+' 엔진의 예측 수명 지형');}
function pva(cv,pv,tol,name,col,psd){var R=U.setup(cv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var L=48,T=16,Bm=30,W=w-L-12,Hh=h-T-Bm,r=[800,1350];
  var X=function(v){return L+(clamp(v,r[0],r[1])-r[0])/(r[1]-r[0])*W;},Y=function(v){return T+Hh-(clamp(v,r[0],r[1])-r[0])/(r[1]-r[0])*Hh;};
  if(tol){g.fillStyle='rgba(19,115,58,.10)';g.beginPath();g.moveTo(X(r[0]),Y(r[0]+tol));g.lineTo(X(r[1]-tol),Y(r[1]));g.lineTo(X(r[1]),Y(r[1]));g.lineTo(X(r[1]),Y(r[1]-tol));g.lineTo(X(r[0]+tol),Y(r[0]));g.lineTo(X(r[0]),Y(r[0]));g.closePath();g.fill();}
  g.strokeStyle=C.muted;g.setLineDash([4,4]);g.beginPath();g.moveTo(X(r[0]),Y(r[0]));g.lineTo(X(r[1]),Y(r[1]));g.stroke();g.setLineDash([]);
  if(psd){g.strokeStyle='rgba(201,48,44,.22)';g.lineWidth=1;for(var j=0;j<VA.n;j++){var hw=1.96*psd[j];g.beginPath();g.moveTo(X(VA.life[j]),Y(pv[j]-hw));g.lineTo(X(VA.life[j]),Y(pv[j]+hw));g.stroke();}}
  for(var i=0;i<VA.n;i++){var e=pv[i]-VA.life[i],over=tol&&e>tol;g.beginPath();g.arc(X(VA.life[i]),Y(pv[i]),over?3.4:2.6,0,7);g.fillStyle=over?C.eye:tol&&e<-tol?'rgba(91,104,116,.7)':(col||C.info);g.globalAlpha=over?1:0.7;g.fill();g.globalAlpha=1;}
  g.strokeStyle=C.rule;g.beginPath();g.moveTo(L,T);g.lineTo(L,T+Hh);g.lineTo(L+W,T+Hh);g.stroke();g.fillStyle=C.muted;g.font='11.5px '+cssv('--font');g.textAlign='center';[900,1000,1100,1200,1300].forEach(function(t){g.fillText(n0(t),X(t),T+Hh+15);});
  g.textAlign='right';[900,1000,1100,1200,1300].forEach(function(t){g.fillText(n0(t),L-5,Y(t)+4);});g.fillText('실제 수명 (회) →',L+W,h-2);g.textAlign='left';g.fillText('예측 수명 (회)',4,11);
  if(tol){U.label(g,X(r[0])+6,Y(r[1])+10,'빨강 = 과대예측 (±'+tol+'회 밖, 길게)',C.eye,'left');U.label(g,X(r[1])-6,Y(r[0])-12,'초록 띠 = 허용 오차 안',C.gfp,'right');}
  else U.label(g,X(r[0])+6,Y(r[1])+10,'점선 위 = 길게 말함 · 아래 = 짧게 말함',C.muted,'left');
  if(name)U.label(g,X(r[0])+6,Y(r[1])+(tol?28:28),name,col||C.info,'left');U.stamp(g,w,'검증 셀 200개');}
function drawPvA(){var b=BENCH[SEL];if(b)pva(pvCv,b.pv,TOL,engName(SEL)+(b.psd?' · 막대 = 95% 구간':''),ECOL[SEL],b.psd);}
U.reg(mapCv,function(dt){if(!dt)drawMap();});U.reg(pvCv,function(dt){if(!dt)drawPvA();});
function score(b){return repDone()?REP[b.e.id].m:b.v.mae;}
function ranked(){return Object.keys(BENCH).map(function(k){return BENCH[k];}).sort(function(a,b){return score(a)-score(b);});}
function benchTable(){var r=ranked();if(!r.length)return;var rd=repDone();
  $('#b-tb').innerHTML='<thead><tr><th>#</th><th>엔진</th><th>도감</th><th>검증 오차 (한 번)</th><th>5번 평균 ± 편차</th><th>R²</th><th>훈련 오차</th><th>저장 값</th><th>추론 µs/셀</th><th>설명 가능성</th></tr></thead><tbody>'+r.map(function(b,i){var q=REP[b.e.id];return '<tr class="'+(b.e.id===SEL?'me':'')+'"><td>'+(i+1)+'</td><td><span class="bar" style="background:'+ECOL[b.e.id]+';width:'+Math.max(6,score(r[0])/score(b)*60)+'px"></span>'+b.e.name+'</td><td>'+(b.e.book==='ml'?'머신러닝':'신경망')+'</td><td>'+fmt(b.v.mae,1)+'회</td><td><b>'+(q&&q.m!=null?fmt(q.m,1)+' ± '+fmt(q.sd,1):'…')+'</b></td><td>'+fmt(b.v.r2,3)+'</td><td>'+fmt(b.tr.mae,1)+'</td><td>'+n0(b.size)+'</td><td>'+fmt(b.us,0)+'</td><td>'+ER.XPL[b.e.id]+'</td></tr>';}).join('')+'</tbody>';
  drawBench();var top=r[0];$('#k-best').textContent=top.e.name+' · '+fmt(score(top),1)+'회';
  if(r.length===9){
    if(rd){var t3=r.slice(0,3),g12=REP[t3[1].e.id].m-REP[t3[0].e.id].m,sd=Math.max(REP[t3[0].e.id].sd,REP[t3[1].e.id].sd),lin=REP.lin.m,tr=REP.tree.m;
      U.ins($('#i-bench'),[['g','5번 평균으로는 '+t3.map(function(b){return b.e.name+' '+fmt(REP[b.e.id].m,1)+'회';}).join(', ')+' 순입니다. 굽은 관계를 담는 엔진들이 위에 모였고, 모두 잡음 바닥(약 '+fmt(FLOOR,0)+'회)에서 '+fmt(REP[t3[0].e.id].m-FLOOR,0)+'~'+fmt(REP[t3[2].e.id].m-FLOOR,0)+'회 위에 있습니다. 엔진을 바꿔 더 줄일 여지는 몇 회뿐입니다.'],[g12<sd?'a':'g',g12<sd?'1위와 2위의 평균 차이('+fmt(g12,1)+'회)가 나눌 때마다 흔들리는 폭(편차 약 '+fmt(sd,1)+'회)보다 작습니다. 둘의 순위는 믿을 수 없고, "비슷하게 좋다"가 정직한 결론입니다. 그다음은 무게·속도·설명 가능성으로 고릅니다.':'1위와 2위의 차이가 흔들림보다 큽니다.'],['a','직선 엔진(선형 회귀·릿지·라쏘)은 '+fmt(lin,1)+'회 근처에서 멈춥니다. "저항과 온도가 함께 높을 때 더 짧아지는" 굽은 관계를 평면 하나로는 못 담기 때문입니다. 회귀 트리 한 그루('+fmt(tr,1)+'회)는 훈련 오차와 검증 오차의 차이가 커서 외우는 경향이 보입니다.']]);}
    else U.ins($('#i-bench'),[['a','한 번 나눈 검증 오차로는 '+top.e.name+'('+fmt(top.v.mae,1)+'회)이 1위입니다. 하지만 이 숫자에는 운이 섞입니다. "5번 나눠 다시 재기"가 끝나면 평균으로 순위를 다시 매깁니다.']]);}
  board();shipUI();W4eng();}
var bcv=$('#cvBench');
function drawBench(){var r=ranked();var R=U.setup(bcv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var L=46,T=18,Bm=34,W=w-L-20,Hh=h-T-Bm,xr=[0,4],yr=[15,55];
  var X=function(s){return L+(Math.log10(Math.max(1,s))-xr[0])/(xr[1]-xr[0])*W;},Y=function(f){return T+(clamp(f,yr[0],yr[1])-yr[0])/(yr[1]-yr[0])*Hh;};
  g.strokeStyle=C.rule;g.beginPath();g.moveTo(L,T);g.lineTo(L,T+Hh);g.lineTo(L+W,T+Hh);g.stroke();g.fillStyle=C.muted;g.font='11.5px '+cssv('--font');g.textAlign='center';[1,10,100,1000,10000].forEach(function(t){g.fillText(n0(t),X(t),T+Hh+15);});
  g.textAlign='right';[20,30,40,50].forEach(function(t){g.fillText(t,L-6,Y(t)+4);});g.fillText('저장 값 수 (로그 눈금) →',L+W,h-3);g.textAlign='left';g.fillText('검증 평균 오차 (회) · 위로 갈수록 좋음',4,12);
  g.strokeStyle=C.amber;g.setLineDash([5,4]);g.beginPath();g.moveTo(L,Y(TGT.mae));g.lineTo(L+W,Y(TGT.mae));g.stroke();g.setLineDash([]);U.label(g,L+6,Y(TGT.mae)-10,'기준 30회 (예시)',C.amber,'left');
  g.strokeStyle=C.muted;g.setLineDash([2,4]);g.beginPath();g.moveTo(L,Y(FLOOR));g.lineTo(L+W,Y(FLOOR));g.stroke();g.setLineDash([]);U.label(g,L+6,Y(FLOOR)-10,'잡음 바닥 ≈ '+fmt(FLOOR,0)+'회',C.muted,'left');
  r.forEach(function(b){var q=REP[b.e.id];if(q&&q.m!=null){var xx=X(b.size)+0.5;g.strokeStyle=ECOL[b.e.id];g.lineWidth=3;g.globalAlpha=0.35;g.beginPath();g.moveTo(xx,Y(q.m-q.sd));g.lineTo(xx,Y(q.m+q.sd));g.stroke();g.globalAlpha=1;g.lineWidth=1;}
    var x=X(b.size),y=Y(score(b)),y2=Y(b.tr.mae);g.strokeStyle='rgba(91,104,116,.35)';g.setLineDash([2,3]);g.beginPath();g.moveTo(x,y);g.lineTo(x,y2);g.stroke();g.setLineDash([]);
    g.beginPath();g.arc(x,y2,3,0,7);g.strokeStyle=ECOL[b.e.id];g.lineWidth=1.5;g.stroke();g.beginPath();g.arc(x,y,b.e.id===SEL?8:6,0,7);g.fillStyle=ECOL[b.e.id];g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
    var rt=x>L+W-110;U.label(g,rt?x-9:x+9,y+(b.e.id==='ridge'?12:b.e.id==='lasso'?-28:b.e.id==='rf'?12:-8),b.e.name,ECOL[b.e.id],rt?'right':'left');});
  g.fillStyle=C.muted;g.textAlign='left';g.fillText(repDone()?'● 5번 평균 검증 오차 (옅은 막대 = ± 편차) · ○ 훈련 오차':'● 검증 오차 (한 번) · ○ 훈련 오차 (점선 길이 = 외운 정도)',L+8,T+Hh-8);U.stamp(g,w,'설명용 모형');}
U.reg(bcv,function(dt){if(!dt)drawBench();});
$('#b-rep').onclick=function(){REP={};runRep(function(){shelf();shipUI();});};
$('#b-all').onclick=function(){var ids=ER.LIST.map(function(e){return e.id;}),i=0,btn=this;btn.disabled=true;
  (function step(){if(i>=ids.length){btn.disabled=false;$('#b-prog').textContent='완료 · 9종';benchTable();shelf();return;}fitEngine(ids[i]);$('#b-prog').textContent=engName(ids[i])+' 시운전 · '+(i+1)+' / 9';i++;benchTable();setTimeout(step,30);})();};
function prod(){var b=BENCH[SEL];if(!b)return;$('#prod-cls').innerHTML='<span><b style="color:'+ECOL[SEL]+'">'+engName(SEL)+'</b></span><span>검증 오차 <b>'+fmt(b.v.mae,1)+'회</b></span><span>R² <b>'+fmt(b.v.r2,3)+'</b></span><span>저장 값 <b>'+n0(b.size)+'</b></span>';}
function board(){var r=ranked();$('#prod-lb').innerHTML=r.slice(0,3).map(function(b,i){return '<span>'+(i+1)+'. '+b.e.name+' <b>'+fmt(score(b),1)+'회</b></span>';}).join('')+'<span class="muted">'+(r.length<9?'('+r.length+' / 9종 시운전)':repDone()?'(5번 평균)':'(한 번 나눈 값 · 5번 평균 계산 중)')+'</span>';}

/* ══ 대사 ══ */
var DLG={
 hero:[["doc","doc_front","오늘은 배터리 수명 예측 장치의 엔진부를 만듭니다. 불량품 판정기 편과 같은 셀인데, 이번엔 '몇 회 버티나'라는 숫자를 맞힙니다."],
       ["asst","asst_smile","회귀 엔진 9종을 같은 셀 600개로 배우고 같은 검증 셀 200개로 재요. 성적은 평균 몇 회 틀렸는지예요. 낮을수록 좋아요."],
       ["fly","fly_point","수명 시험은 셀 하나에 몇 달 걸린다며. 정답 붙은 셀이 늘 600개씩 있을 거라고 믿지 마."],
       ["robo","robo_coin","수명엔 굽은 관계가 있다니까 트리 100그루짜리 부스팅이면 끝이지."]],
 factory:[["sia","sia_explain","P3에서는 수명도 표준화해요. 엔진은 표준화한 수명으로 배우고, 성적은 다시 '회'로 되돌려서 재요."]],
 board:[["moa","moa_report","정비 검사 기록은 판정기 편과 같은 칸이에요. 다만 ①·②·⑤·⑧·⑨의 기준이 회귀용으로 바뀌었어요."]],
 atlas:[["robo","robo_chart","가우시안 프로세스는 훈련 셀 600개를 통째로 들고 다니네. 저장 값 3,000개. 무거운 만큼 잘 맞히겠지?"]],
 mount:[["fly","fly_magnify","실제–예측 그림에서 점선 위로 튀는 빨간 점을 봐. 수명을 길게 말한 셀이야. 보증 기간 정할 땐 그게 제일 비싸."]],
 bench:[["asst","asst_report","9종 모두 같은 훈련 셀, 같은 검증 셀, 같은 시드예요. 한 번 나눈 점수엔 운이 섞여서, 다섯 번 다시 나눠 평균도 냈어요."]],
 w1:[["fly","fly_point","카드 01의 숫자 그대로 넣어 봤어? 뜨겁고 저항 큰 셀 A를 '오래 간다'고 하잖아."]],
 w2:[["asst","asst_report","카드 02 그대로면 z = −1.8이에요. 수명 점수가 음수, 곧 '짧다'. 판정기 편에선 틀렸던 숫자가 여기선 맞아요."]],
 w3:[["doc","doc_board","셀을 바꿔 넣어도 W₁은 한 칸도 안 바뀝니다. 바뀌는 건 엔진을 지나가는 연료, 활성값이에요."]],
 w4:[["robo","robo_calc","칩 예산 안에 들어가면 남는 장사지. …훈련 셀을 통째로 들고 다니는 엔진은 예산부터 넘는군."]],
 w5:[["asst","asst_report","초깃값을 크게 했더니 첫 손실이 16을 넘었어요. 처음부터 엉뚱하게 큰 수명을 말하는 거예요."]],
 w6:[["fly","fly_magnify","출력이 바뀌어도 검사법은 같아. 막대랑 점이 겹치는지부터 봐."]],
 w7:[["robo","robo_wow","학습률을 1.1로 올렸더니 공이 튀어 나갔어. 크게 걸면 크게 잃는다더니."]],
 w8:[["asst","asst_report","손실은 표준화한 단위라 감이 안 와요. 그래서 오른쪽에 평균 오차를 '회'로 같이 그렸어요."]],
 w9:[["doc","doc_magic","그대로 쓰면 공장 B 셀의 수명을 크게 길게 말합니다. 셀 60개로 작은 보정 장치만 얹어도 바로잡히죠."]],
 w10:[["fly","fly_point","훈련 오차는 은닉 32개에서 제일 낮지. 그런데 검증 오차는? 셀 80개를 외운 거야."]],
 dfly:[["fly","fly_point","숫자 5개짜리 평면이면 충분해. 정답 셀이 적을 땐 단순한 쪽이 덜 흔들려."]],
 drobo:[["robo","robo_coin","수명엔 굽은 관계가 있잖아. 트리 100그루가 계단으로 다 따라가지."]],
 outro:[["doc","doc_magic","오늘의 세 줄입니다.<br>① 회귀 엔진은 숫자를 낸다. 성적은 평균 오차(회)로, 같은 조건에서 여러 번 나눠 견준다.<br>② 신경망 엔진의 정비 고리는 분류와 같다. 바뀌는 것은 출력(시그모이드 없음)과 손실(제곱 오차)뿐이다.<br>③ 알맞은 엔진은 정답 셀 수가 정한다. 셀이 적으면 단순한 엔진, 많으면 굽은 엔진. 수명을 길게 틀리는 쪽을 특히 조심한다."],
        ["robo","robo_happy","셀 600개에선 열 번 다 이겼다. 굽은 관계엔 굽은 엔진이지."],
        ["fly","fly_arms","셀 40개에선 내가 열 번 다 이겼지. 수명 시험실이 그렇게 빨리 셀을 내주지 않는다고."],
        ["asst","asst_smile","출고 전표는 써 뒀어요. 2편 검증장에서 판정기와 예측 장치를 이어 붙여 돌려 봐요."]]
};
U.dialogues(DLG);
var CAST=[["doc","doc_front","박사","해설과 판정. 판정은 늘 계산한 숫자대로."],["asst","asst_smile","조수 하루","벤치를 돌리고 숫자를 회 단위로 발표해요."],["fly","fly_point","초파리 연구원","의심하는 쪽. 작고 단순한 엔진과 검증을 고르고, 함정을 짚어요."],["robo","robo_coin","주판봇","확신하는 쪽. 크고 복잡한 엔진에 걸어요."],["sia","sia_explain","인턴 시아","P3 정제·표준화 담당. 순서를 정리해요."],["moa","moa_report","인턴 모아","벤치·검사 기록을 모아요."]];
$('#castgrid').innerHTML=CAST.map(function(c){return '<div class="castc" style="--cc:var(--c-'+c[0]+')"><img src="'+U.spr(c[1])+'" alt="" aria-hidden="true"><div><b>'+c[2]+'</b><p>'+c[3]+'</p></div></div>';}).join('');
$('#secretrow').innerHTML=['x1','x2','x3'].map(function(x,i){return U.say(x,x+'_hint',['(반짝)','(…끄덕)','(짝짝짝)'][i]);}).join('');
$('#secretbtn').onclick=function(){var r=$('#secretrow');r.hidden=!r.hidden;this.setAttribute('aria-expanded',String(!r.hidden));this.textContent=r.hidden?'방청석 보기 (미공개 식구)':'방청석 닫기';};
U.fillImgs();

/* ══ 표지 대체 그림 ══ */
(function(){var cv=$('#cvCover');U.reg(cv,function(dt){if(dt)return;var R=U.setup(cv),g=R.g,w=R.w,h=R.h;var gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#eef4f8');gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(15,127,134,.10)';g.lineWidth=1;var s=Math.max(14,w/40);for(var y=0;y<h+s;y+=s*1.5)for(var x=0;x<w+s;x+=s*1.732){var ox=((y/(s*1.5))%2)?s*.866:0;hexP(g,x+ox,y,s*.95);}
  for(var i=0;i<9;i++){var bx=w*(0.08+i*0.105),by=h*0.18+Math.sin(i)*h*0.04;batt(g,bx,by,w*0.035,false);}});
  function hexP(g,x,y,r){g.beginPath();for(var k=0;k<6;k++){var a=Math.PI/3*k+Math.PI/6;g.lineTo(x+r*Math.cos(a)*.6,y+r*Math.sin(a)*.6);}g.closePath();g.stroke();}
})();
/* 자율주행차 대용량 배터리 모듈(납작한 상자 + 셀 칸 + 단자 둘) */
function batt(g,x,y,s,bad){g.save();var w=s*1.8,h=s*1.1,x0=x-w/2,y0=y-h/2;g.fillStyle=bad?'#f3c9c7':'#d8eef0';g.strokeStyle=bad?C.eye:C.terrain;g.lineWidth=1.5;g.beginPath();g.roundRect?g.roundRect(x0,y0,w,h,s*.12):g.rect(x0,y0,w,h);g.fill();g.stroke();
  g.lineWidth=1;g.globalAlpha=0.55;for(var k=1;k<5;k++){g.beginPath();g.moveTo(x0+w*k/5,y0+h*0.15);g.lineTo(x0+w*k/5,y0+h*0.85);g.stroke();}g.globalAlpha=1;g.fillStyle=bad?C.eye:C.terrain;g.fillRect(x0+w*0.15,y0-s*0.18,s*0.28,s*0.18);g.fillRect(x0+w*0.85-s*0.28,y0-s*0.18,s*0.28,s*0.18);g.restore();}



/* ══ 데이터세트 그림 ══ */
(function(){var c1=$('#cvData1'),c2=$('#cvData2');
  U.reg(c1,function(dt){if(dt)return;var R=U.setup(c1),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var L=44,B=30,T=14,W=w-L-10,Hh=h-T-B;
    var xr=[0.6,1.8],yr=[1,15],X=function(v){return L+(v-xr[0])/(xr[1]-xr[0])*W;},Y=function(v){return T+Hh-(v-yr[0])/(yr[1]-yr[0])*Hh;};
    g.strokeStyle=C.rule;g.beginPath();g.moveTo(L,T);g.lineTo(L,T+Hh);g.lineTo(L+W,T+Hh);g.stroke();g.fillStyle=C.muted;g.font='11.5px '+cssv('--font');g.textAlign='center';
    [0.8,1.0,1.2,1.4,1.6].forEach(function(t){g.fillText(t.toFixed(1),X(t),T+Hh+15);});g.textAlign='right';[3,6,9,12].forEach(function(t){g.fillText(t,L-5,Y(t)+4);});g.textAlign='left';g.fillText('온도 상승 °C',4,11);g.textAlign='right';g.fillText('내부저항 mΩ',L+W,h-3);
    var ord=D.yr.map(function(_,i){return i;}).sort(function(a,b){return D.yr[b]-D.yr[a];});
    ord.forEach(function(i){g.beginPath();g.arc(X(D.X[i][0]),Y(D.X[i][2]),2.4,0,7);g.fillStyle=lifeCol(D.yr[i],0.8);g.fill();});
    U.stamp(g,w,'설명용 모형 · 실제 데이터 아님');});
  U.reg(c2,function(dt){if(dt)return;var R=U.setup(c2),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var L=40,T=18,Bm=32,W=w-L-12,Hh=h-T-Bm,lo=750,hi=1350,nb=24,hs=new Array(nb).fill(0);
    for(var i=0;i<D.n;i++)hs[clamp(Math.floor((D.yr[i]-lo)/(hi-lo)*nb),0,nb-1)]++;var mx=Math.max.apply(null,hs);
    hs.forEach(function(v,q){var x=L+q*W/nb,bh=v/mx*Hh;g.fillStyle=lifeCol(lo+(q+0.5)*(hi-lo)/nb,0.85);g.fillRect(x+1,T+Hh-bh,W/nb-2,bh);});
    var X=function(v){return L+(v-lo)/(hi-lo)*W;};g.strokeStyle=C.text;g.setLineDash([4,3]);g.beginPath();g.moveTo(X(S.lm),T);g.lineTo(X(S.lm),T+Hh);g.stroke();g.setLineDash([]);U.label(g,X(S.lm)+4,T+10,'훈련 평균 '+n0(S.lm)+'회',C.text,'left');
    g.strokeStyle=C.rule;g.beginPath();g.moveTo(L,T+Hh);g.lineTo(L+W,T+Hh);g.stroke();g.fillStyle=C.muted;g.font='11.5px '+cssv('--font');g.textAlign='center';[800,900,1000,1100,1200,1300].forEach(function(t){g.fillText(n0(t),X(t),T+Hh+15);});
    g.textAlign='right';g.fillText('수명 (충·방전 횟수) →',L+W,h-3);g.textAlign='left';g.fillText('셀 수',4,12);U.stamp(g,w,'설명용 모형');});
  var mn=Math.min.apply(null,D.yr),mx=Math.max.apply(null,D.yr);
  $('#data-minis').innerHTML=mini('','셀 수 · 측정값',D.n+' · 4개')+mini('a','훈련 · 검증 · 시험',TR.n+' · '+VA.n+' · '+TE.n)+mini('g','수명 평균 · 표준편차 (훈련)',n0(S.lm)+' · '+n0(S.ls)+'회')+mini('','가장 짧은 · 가장 긴 셀',n0(mn)+' · '+n0(mx)+'회')+mini('r','잡음 바닥 (어떤 엔진도 못 넘는 평균 오차)','≈ '+fmt(FLOOR,1)+'회');
})();

/* ══ ① 부품 창고 (회귀: 출력은 Σ 그대로) ══ */
(function(){var CARD={w11:0.8,w12:-0.4,w21:1.2,w22:0.6,b1:0.3,b2:-0.7},V=Object.assign({},CARD);
  var CELLS=[{k:'A',x:[1.5,1.2],long:0},{k:'B',x:[-1.0,-0.8],long:1}];
  var host=$('#w1-sl'),cv=$('#cvW1');
  var NM={w11:'w₁₁ (x₁→y₁)',w12:'w₁₂ (x₂→y₁)',w21:'w₂₁ (x₁→y₂)',w22:'w₂₂ (x₂→y₂)',b1:'b₁',b2:'b₂'};
  host.innerHTML=Object.keys(V).map(function(k){return '<div class="group"><label class="glabel" for="r1-'+k+'" style="min-width:104px">'+NM[k]+'</label><input type="range" id="r1-'+k+'" min="-2" max="2" step="0.1" value="'+V[k]+'"><span class="val" id="v1-'+k+'">'+V[k].toFixed(1)+'</span></div>';}).join('');
  Object.keys(V).forEach(function(k){$('#r1-'+k).oninput=function(){V[k]=+this.value;$('#v1-'+k).textContent=V[k].toFixed(1);upd();};});
  $('#w1-reset').onclick=function(){Object.keys(CARD).forEach(function(k){V[k]=CARD[k];$('#r1-'+k).value=V[k];$('#v1-'+k).textContent=V[k].toFixed(1);});upd();};
  function out(x){return [V.w11*x[0]+V.w12*x[1]+V.b1,V.w21*x[0]+V.w22*x[1]+V.b2];}
  function J(v){return v>0?'오래 감':'짧음';}
  function upd(){var ok=0,rows='<thead><tr><th>셀</th><th>y₁ 수명 점수</th><th>판정 (실제)</th><th>y₂ 용량 유지 점수</th><th>판정 (실제)</th></tr></thead><tbody>';
    CELLS.forEach(function(c){var y=out(c.x),a=c.long?'오래 감':'짧음',j1=(y[0]>0?1:0)===c.long,j2=(y[1]>0?1:0)===c.long;ok+=j1+j2;
      rows+='<tr><td>셀 '+c.k+'</td><td class="n">'+(y[0]>=0?'+':'')+fmt(y[0],2)+'</td><td>'+J(y[0])+' ('+a+') '+(j1?'✓':'✗')+'</td><td class="n">'+(y[1]>=0?'+':'')+fmt(y[1],2)+'</td><td>'+J(y[1])+' ('+a+') '+(j2?'✓':'✗')+'</td></tr>';});
    $('#w1-tb').innerHTML=rows+'</tbody>';QC(1,ok===4?'ok':'ng',ok+' / 4칸 맞음');
    U.ins($('#i-w1'),ok===4?[['g','네 칸 모두 맞았습니다. "저항·온도가 클수록 수명이 짧다"를 파라미터 6개(가중치 4 + 편향 2)에 손으로 끼워 넣은 셈이에요.']]:[['r',(4-ok)+'칸이 틀렸습니다. '+(out(CELLS[0].x)[0]>0?'뜨겁고 저항 큰 셀 A의 수명 점수가 양수입니다. 네 가중치를 음수 쪽으로 돌려 보세요.':'틀린 칸의 가중치 부호와 편향을 살펴보세요.')]]);draw();}
  function draw(){var R=U.setup(cv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var xs=[w*0.16,w*0.78],ys=[h*0.3,h*0.7],r=Math.min(30,w*0.06);
    [['w11',0,0],['w12',1,0],['w21',0,1],['w22',1,1]].forEach(function(e){var v=V[e[0]],x0=xs[0]+r,y0=ys[e[1]],x1=xs[1]-r,y1=ys[e[2]];g.strokeStyle=v>=0?'rgba(30,85,200,.75)':'rgba(201,48,44,.75)';g.lineWidth=1+Math.abs(v)*4;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();
      var mx=x0+(x1-x0)*(e[1]===e[2]?0.5:0.32),my=y0+(y1-y0)*(e[1]===e[2]?0.5:0.32);U.label(g,mx,my-12,e[0]+' '+v.toFixed(1),v>=0?C.info:C.eye,'center');});
    ['x₁ 내부저항','x₂ 온도 상승'].forEach(function(t,i){circ(g,xs[0],ys[i],r,'#fcebea',C.eye);U.label(g,xs[0],ys[i]+r+14,t,C.eye,'center');});
    ['y₁ 수명','y₂ 용량 유지'].forEach(function(t,i){circ(g,xs[1],ys[i],r,'#e6eefb',C.info);g.fillStyle=C.info;g.font='700 16px '+cssv('--font');g.textAlign='center';g.fillText('Σ',xs[1],ys[i]+6);U.label(g,xs[1],ys[i]+r+14,t,C.info,'center');
      g.strokeStyle=C.amber;g.lineWidth=1.5;g.beginPath();g.moveTo(xs[1],ys[i]-r-18);g.lineTo(xs[1],ys[i]-r);g.stroke();U.label(g,xs[1],ys[i]-r-24,'b'+(i+1)+' '+V['b'+(i+1)].toFixed(1),C.amber,'center');});
    U.stamp(g,w,'예시값 · 출력에 시그모이드 없음');}
  function circ(g,x,y,r,f,s){g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=f;g.fill();g.lineWidth=2;g.strokeStyle=s;g.stroke();}
  U.reg(cv,function(dt){if(!dt)draw();});upd();
})();

/* ══ ② 뉴런 조립대 ══ */
(function(){var CARD={w1:0.5,w2:-1.0,b:0.2},V=Object.assign({},CARD),f='id';
  var CELLS=[{t:'카드 02 셀 (2, 3) · 실제 단수명',x:[2,3],d:0},{t:'장수명 셀 (−1, −0.5)',x:[-1,-0.5],d:1}],cur=0;
  var host=$('#w2-sl'),cv=$('#cvW2');
  host.innerHTML='<div class="group"><span class="glabel">넣을 셀</span><span id="g-w2c"></span></div>'+['w1','w2','b'].map(function(k){return '<div class="group"><label class="glabel" for="r2-'+k+'" style="min-width:40px">'+{w1:'w₁',w2:'w₂',b:'b'}[k]+'</label><input type="range" id="r2-'+k+'" min="-2" max="2" step="0.1" value="'+V[k]+'"><span class="val" id="v2-'+k+'">'+V[k].toFixed(1)+'</span></div>';}).join('');
  U.btns($('#g-w2c'),[[0,'카드 02 셀'],[1,'장수명 셀']],0,function(v){cur=v;upd();});
  U.btns($('#g-w2f'),[['id','없음 (항등) · 회귀 출력'],['sig','σ 시그모이드'],['relu','ReLU'],['tanh','tanh']],'id',function(v){f=v;upd();});
  ['w1','w2','b'].forEach(function(k){$('#r2-'+k).oninput=function(){V[k]=+this.value;$('#v2-'+k).textContent=V[k].toFixed(1);upd();};});
  $('#w2-reset').onclick=function(){Object.keys(CARD).forEach(function(k){V[k]=CARD[k];$('#r2-'+k).value=V[k];$('#v2-'+k).textContent=V[k].toFixed(1);});upd();};
  function F(z){return f==='sig'?BM.sig(z):f==='relu'?Math.max(0,z):f==='tanh'?Math.tanh(z):z;}
  function z(x){return V.w1*x[0]+V.w2*x[1]+V.b;}
  function upd(){var c=CELLS[cur],zz=z(c.x);
    $('#eq-w2').innerHTML='z = w₁x₁ + w₂x₂ + b = '+V.w1.toFixed(1)+'×'+c.x[0]+' + ('+V.w2.toFixed(1)+')×'+c.x[1]+' + '+V.b.toFixed(1)+' = <b>'+fmt(zz,2)+'</b> · f(z) = <em>'+fmt(F(zz),3)+'</em> · 파라미터 <i>3개</i> (w₁, w₂, b) · '+(zz<0?'수명 점수 음수 = 짧다':'수명 점수 양수 = 오래 간다');
    var j=CELLS.map(function(cc){var v=z(cc.x);return (v>0?1:0)===cc.d;}),ok=j[0]&&j[1];
    QC(2,ok?'ok':'ng',(j[0]?'✓':'✗')+' 단수명 셀 z = '+fmt(z(CELLS[0].x),2)+' · '+(j[1]?'✓':'✗')+' 장수명 셀 z = '+fmt(z(CELLS[1].x),2));
    U.ins($('#i-w2'),ok?[['g','두 셀 모두 부호가 맞습니다. 온도에 붙은 w₂ = '+V.w2.toFixed(1)+'(음수)가 "뜨거울수록 수명이 짧다"를 담고 있어요. 판정기 편에서는 같은 값이 틀린 판정이었습니다.'],['a',f==='id'?'회귀 출력은 활성화 없이(항등) z를 그대로 냅니다. 다른 활성화를 눌러 보면 시그모이드는 0~1, tanh는 −1~1에 갇혀 "몇 회"를 낼 수 없습니다.':'회귀 출력에 '+(f==='sig'?'시그모이드':f==='tanh'?'tanh':'ReLU')+'를 걸면 '+(f==='relu'?'음수(짧은 수명 점수)가 0으로 잘립니다.':'출력이 좁은 범위에 갇힙니다.')+' 회귀 엔진의 출력층은 보통 항등입니다.']]:[['r',!j[0]?'뜨거운 셀의 수명 점수가 0 이상이라 "오래 간다"고 합니다. 온도에 붙은 w₂의 부호를 보세요.':'장수명 셀까지 "짧다"(z < 0)고 합니다. b를 올려 보세요.']]);draw();}
  function draw(){var R=U.setup(cv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var c=CELLS[cur],zz=z(c.x);
    var nx=w*0.30,ny=h*0.48,r=Math.min(38,w*0.07);
    [[c.x[0],'x₁',V.w1,h*0.26],[c.x[1],'x₂',V.w2,h*0.70]].forEach(function(a){var bx=w*0.04;g.fillStyle='#fcebea';g.strokeStyle=C.eye;g.lineWidth=1.5;g.fillRect(bx,a[3]-16,w*0.11,32);g.strokeRect(bx,a[3]-16,w*0.11,32);
      g.fillStyle=C.eye;g.font='700 13px '+cssv('--font');g.textAlign='center';g.fillText(a[1]+' = '+a[0],bx+w*0.055,a[3]+5);
      g.strokeStyle=a[2]>=0?'rgba(30,85,200,.8)':'rgba(201,48,44,.8)';g.lineWidth=1+Math.abs(a[2])*3;g.beginPath();g.moveTo(bx+w*0.11,a[3]);g.lineTo(nx-r,ny);g.stroke();U.label(g,(bx+w*0.11+nx-r)/2,(a[3]+ny)/2-10,'w '+a[2].toFixed(1),a[2]>=0?C.info:C.eye,'center');});
    g.beginPath();g.arc(nx,ny,r,0,7);g.fillStyle='#e6eefb';g.fill();g.lineWidth=2;g.strokeStyle=C.info;g.stroke();g.fillStyle=C.info;g.font='700 22px '+cssv('--font');g.textAlign='center';g.fillText('Σ',nx,ny+8);
    g.strokeStyle=C.amber;g.lineWidth=1.5;g.beginPath();g.moveTo(nx,ny-r-22);g.lineTo(nx,ny-r);g.stroke();U.label(g,nx,ny-r-28,'b = '+V.b.toFixed(1),C.amber,'center');
    U.arrow2(g,nx+r,ny,w*0.5,ny,C.text,1.6);U.label(g,(nx+r+w*0.5)/2,ny-12,'z = '+fmt(zz,2),C.info,'center');
    /* 활성화 곡선 */
    var L=w*0.53,W=w*0.44,T=h*0.12,Hh=h*0.7,zr=[-5,5],yr=f==='id'||f==='relu'?[-5,5]:f==='tanh'?[-1.1,1.1]:[-0.05,1.05];
    var X=function(v){return L+(v-zr[0])/(zr[1]-zr[0])*W;},Y=function(v){return T+Hh-(clamp(v,yr[0],yr[1])-yr[0])/(yr[1]-yr[0])*Hh;};
    g.strokeStyle=C.rule;g.lineWidth=1;g.strokeRect(L,T,W,Hh);g.beginPath();g.moveTo(X(0),T);g.lineTo(X(0),T+Hh);g.stroke();
    if(f==='sig'){g.setLineDash([4,4]);g.beginPath();g.moveTo(L,Y(0.5));g.lineTo(L+W,Y(0.5));g.stroke();g.setLineDash([]);U.label(g,L+W-4,Y(0.5)-10,'0.5 문턱',C.muted,'right');}
    g.strokeStyle=C.stain;g.lineWidth=2.4;g.beginPath();for(var i=0;i<=120;i++){var zz2=zr[0]+(zr[1]-zr[0])*i/120;i?g.lineTo(X(zz2),Y(F(zz2))):g.moveTo(X(zz2),Y(F(zz2)));}g.stroke();
    g.beginPath();g.arc(X(clamp(zz,zr[0],zr[1])),Y(F(zz)),6,0,7);g.fillStyle=C.gfp;g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
    U.label(g,L+6,T+12,'f(z) = '+{sig:'σ(z)',relu:'ReLU(z)',tanh:'tanh(z)',id:'z'}[f],C.stain,'left');U.stamp(g,w,'예시값');}
  U.reg(cv,function(dt){if(!dt)draw();});upd();
})();


/* ══ ③ 설계도실 ══ */
var W3={};
(function(){var cv=$('#cvW3'),seen={},last=null,prev=null,ck0=null;
  var pick=[];for(var i=0;i<VA.n&&pick.length<5;i++){var want=[0,1,0,1,0][pick.length];if((VA.life[i]>=S.lm?1:0)===want)pick.push(i);}
  var cur=pick[0];
  U.btns($('#w3-cells'),pick.map(function(i,k){var raw=D.X[VA.idx[i]];return [i,'셀 '+(k+1)+' · '+fmt(raw[0],2)+'mΩ · '+fmt(raw[2],1)+'°C'];}),cur,function(v){cur=v;feed();});
  function feed(){var P=M.P,ck=BM.checksum(P);if(ck0==null)ck0=ck;var f=BM.fwd(P,VA.x[cur]);prev=last;last=f.h;seen[cur]=1;
    var dAct=prev?prev.reduce(function(s,v,j){return s+Math.abs(v-last[j]);},0):0,dPar=ck===ck0?0:1,ns=Object.keys(seen).length;
    $('#w3-minis').innerHTML=mini('','넣어 본 셀',ns+'개')+mini('m','활성값 변화 (직전 셀과)',prev?fmt(dAct,3):'—')+mini('g','파라미터 변화',dPar?'바뀜':'0')+mini('r','예측 · 실제 수명',n0(LF(f.z))+' · '+n0(VA.life[cur])+'회');
    QC(3,ns>=2?(dPar===0&&dAct>0?'ok':'ng'):'run',ns>=2?'파라미터 '+(dPar?'바뀜':'변화 0')+' · 활성값 변화 '+fmt(dAct,3):'셀 '+ns+'개 넣음 — 하나 더');
    U.ins($('#i-w3'),[[ns>=2?'g':'a',(W3.re&&ns<2?'⑧에서 모델을 다시 학습해 설계도가 바뀌었어요. ':'')+(ns>=2?'다른 셀을 넣자 은닉층 막대(활성값)는 바뀌었지만, 왼쪽 행렬 색(파라미터)은 그대로입니다. 지문 '+ck+'.':'다른 셀을 하나 더 넣어 보세요. 행렬 색과 막대 중 무엇이 바뀌는지 봅니다.')]]);draw();}
  W3.refresh=function(){W3.re=1;ck0=null;seen={};prev=null;last=null;feed();};
  function draw(){var P=M.P,R=U.setup(cv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var x=VA.x[cur],f=BM.fwd(P,x);
    var cs=Math.max(12,Math.min(22,(h-90)/8)),top=40,left=20;
    function col(v){var a=clamp(Math.abs(v)/1.5,0,1);return v>=0?'rgba(30,85,200,'+(0.12+0.85*a)+')':'rgba(201,48,44,'+(0.12+0.85*a)+')';}
    function hdr(t,x0,y0,c){g.fillStyle=c||C.text;g.font='700 12.5px '+cssv('--font');g.textAlign='left';g.fillText(t,x0,y0);}
    /* 입력 */
    hdr('입력 x (4)',left,top-12,C.eye);for(var k=0;k<4;k++){g.fillStyle=col(x[k]);g.fillRect(left,top+k*cs*1.6,cs,cs);g.fillStyle=C.muted;g.font='11px '+cssv('--font');g.fillText(['R','C','T','V'][k]+' '+fmt(x[k],2),left+cs+4,top+k*cs*1.6+cs*0.7);}
    var wx=left+90;hdr('W₁ (8×4) 파라미터',wx,top-12,C.stain);for(var j=0;j<8;j++)for(k=0;k<4;k++){g.fillStyle=col(P.W1[j][k]);g.fillRect(wx+k*(cs+2),top+j*(cs+2),cs,cs);}
    var bx=wx+4*(cs+2)+12;hdr('b₁',bx,top-12,C.stain);for(j=0;j<8;j++){g.fillStyle=col(P.b1[j]);g.fillRect(bx,top+j*(cs+2),cs,cs);}
    var hx=bx+cs+30,hw=Math.max(60,w*0.16);hdr('은닉 활성값 h (8)',hx,top-12,C.gfp);
    for(j=0;j<8;j++){var v=f.h[j],y0=top+j*(cs+2);g.fillStyle='#eef2f6';g.fillRect(hx,y0,hw,cs);g.fillStyle=v>=0?'rgba(19,115,58,.8)':'rgba(201,48,44,.7)';var mid=hx+hw/2;g.fillRect(v>=0?mid:mid+v*hw/2,y0,Math.abs(v)*hw/2,cs);g.fillStyle=C.rule;g.fillRect(mid,y0,1,cs);}
    var ox=hx+hw+26;hdr('W₂ (1×8) · b₂',ox,top-12,C.stain);for(j=0;j<8;j++){g.fillStyle=col(P.W2[j]);g.fillRect(ox,top+j*(cs+2),cs,cs);}g.fillStyle=col(P.b2);g.fillRect(ox+cs+8,top+3.5*(cs+2),cs,cs);
    var px=ox+cs*2+30;if(px+90<w){hdr('출력',px,top-12,C.info);g.fillStyle='#e6eefb';g.fillRect(px,top+2*(cs+2),86,cs*2.4);g.fillStyle=C.info;g.font='700 15px '+cssv('--font');g.fillText('예측 수명',px+6,top+2*(cs+2)+cs*1.0);g.fillText(n0(LF(f.z))+'회',px+6,top+2*(cs+2)+cs*2.1);}
    g.fillStyle=C.muted;g.font='12px '+cssv('--font');g.textAlign='left';g.fillText('파랑 = 양수, 빨강 = 음수, 진할수록 큼 · 파라미터 49개, 지문 '+BM.checksum(P),left,h-12);
    U.stamp(g,w,'설명용 모형');}
  U.reg(cv,function(dt){if(!dt)draw();});feed();
  var LLM=[['E','토큰 임베딩 E: 단어 조각(토큰)마다 숫자 벡터 한 줄. 어휘 수 × 차원 수의 행렬이라 그 자체로 아주 큽니다[7].'],['W_Q·W_K·W_V·W_O','어텐션 가중치: 토큰끼리 서로 얼마나 참고할지 계산하고 섞는 네 행렬. 블록마다 따로 있습니다[7].'],['W₁·W₂ (FFN)','피드포워드 가중치: 토큰 하나하나를 넓혔다 좁히며 바꾸는 두 행렬. 블록 안 파라미터의 큰 몫입니다[7].'],['γ·β 정규화','정규화의 크기·이동 값. LayerNorm은 γ·β 둘[5], RMSNorm은 γ만[6]. 개수는 작지만 학습되는 파라미터입니다.'],['W_out','출력 투영: 마지막 벡터를 어휘 전체의 점수로 바꿉니다. 임베딩 E와 같은 행렬을 함께 쓰는 모델도 있습니다.'],['활성값 (토큰 흐름)','초록 상자들. 입력 문장마다 새로 계산되는 값이고, 저장된 파라미터가 아닙니다. 배터리 모델의 h와 같은 자리입니다.']];
  U.btns($('#w3-llm'),LLM.map(function(v,i){return [i,v[0]];}),-1,function(i){$('#w3-llmtxt').textContent=LLM[i][1];});
})();


/* ══ ④ 계량실 ══ */
(function(){var V={nin:4,L:1,H:8,nout:1},prec=4,cv=$('#cvW4');
  var NM={nin:['입력 수',1,16],L:['은닉층 수',0,3],H:['층당 은닉 뉴런',1,64],nout:['출력 수',1,4]};
  $('#w4-sl').innerHTML=Object.keys(V).map(function(k){return '<div class="group"><label class="glabel" for="r4-'+k+'" style="min-width:104px">'+NM[k][0]+'</label><input type="range" id="r4-'+k+'" min="'+NM[k][1]+'" max="'+NM[k][2]+'" step="1" value="'+V[k]+'"><span class="val" id="v4-'+k+'">'+V[k]+'</span></div>';}).join('');
  Object.keys(V).forEach(function(k){$('#r4-'+k).oninput=function(){V[k]=+this.value;$('#v4-'+k).textContent=V[k];upd();};});
  U.btns($('#g-w4p'),[[4,'FP32 · 4바이트'],[2,'FP16 · 2바이트'],[1,'INT8 · 1바이트']],4,function(v){prec=v;upd();});
  function set(o){Object.keys(o).forEach(function(k){V[k]=o[k];$('#r4-'+k).value=o[k];$('#v4-'+k).textContent=o[k];});upd();}
  $('#w4-card').onclick=function(){set({nin:4,L:0,H:8,nout:3});};$('#w4-ours').onclick=function(){set({nin:4,L:1,H:8,nout:1});};
  function layers(){var sz=[V.nin];for(var i=0;i<V.L;i++)sz.push(V.H);sz.push(V.nout);var out=[];for(i=0;i<sz.length-1;i++)out.push({a:sz[i],b:sz[i+1],w:sz[i]*sz[i+1],bias:sz[i+1]});return out;}
  function upd(){var Ls=layers(),tot=Ls.reduce(function(s,l){return s+l.w+l.bias;},0),mem=tot*prec;
    $('#eq-w4').innerHTML=Ls.map(function(l){return '('+l.a+'×'+l.b+' + '+l.b+')';}).join(' + ')+' = <b>'+n0(tot)+'개</b> · × '+prec+'바이트 = <em>'+n0(mem)+' 바이트</em> ('+fmt(mem/1024,2)+' KB)';
    $('#w4-tb').innerHTML='<thead><tr><th>층</th><th>가중치 (입력×출력)</th><th>편향</th><th>합</th></tr></thead><tbody>'+Ls.map(function(l,i){return '<tr><td>'+(i+1)+'층 '+l.a+' → '+l.b+'</td><td class="n">'+n0(l.w)+'</td><td class="n">'+n0(l.bias)+'</td><td class="n">'+n0(l.w+l.bias)+'</td></tr>';}).join('')+
      '<tr><td>참고: 언어 모델 10억 개</td><td colspan="3">가중치만 × 2바이트 ≈ 2 GB · 혼합 정밀도 Adam 학습 ≈ 파라미터당 16바이트 ≈ 16 GB (활성값 메모리 별도)[8]</td></tr></tbody>';
    var ok=mem<=TGT.mem;QC(4,ok?'ok':'ng',n0(tot)+'개 · '+fmt(mem/1024,2)+' KB');
    U.ins($('#i-w4'),[[ok?'g':'r',ok?'BMS 칩 예산 8 KB(예시값) 안에 들어갑니다. 아래 표에서 다른 엔진의 무게와도 견줘 보세요.':'예산을 넘었습니다. 은닉 뉴런·층을 줄이거나, 숫자 하나를 2바이트·1바이트로 줄여(양자화) 보세요. 다만 줄인 정밀도만큼 예측이 조금 달라질 수 있습니다.']]);draw(Ls,tot,mem);}
  function draw(Ls,tot,mem){if(!Ls){Ls=layers();tot=Ls.reduce(function(s,l){return s+l.w+l.bias;},0);mem=tot*prec;}
    var R=U.setup(cv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var L=50,T=26,B=40,W=w-L-16,Hh=h-T-B,mx=Math.max(tot,TGT.mem/prec)*1.08;
    var bw=Math.min(70,W/(Ls.length+2)/1.4);var y=function(v){return T+Hh-v/mx*Hh;};
    var acc=0;Ls.forEach(function(l,i){var x=L+i*bw*1.4+10;g.fillStyle='rgba(155,63,181,.6)';g.fillRect(x,y(l.w),bw,Hh-(y(l.w)-T));g.fillStyle='rgba(163,92,0,.75)';g.fillRect(x,y(l.w+l.bias),bw,y(l.w)-y(l.w+l.bias));
      g.fillStyle=C.muted;g.font='11.5px '+cssv('--font');g.textAlign='center';g.fillText((i+1)+'층',x+bw/2,T+Hh+14);g.fillText(n0(l.w+l.bias),x+bw/2,y(l.w+l.bias)-4);acc+=l.w+l.bias;});
    var x2=L+Ls.length*bw*1.4+24;g.fillStyle=mem<=TGT.mem?'rgba(19,115,58,.75)':'rgba(201,48,44,.75)';g.fillRect(x2,y(tot),bw,T+Hh-y(tot));g.fillStyle=C.text;g.textAlign='center';g.fillText('합 '+n0(tot),x2+bw/2,Math.max(T+10,y(tot)-4));g.fillStyle=C.muted;g.fillText('전체',x2+bw/2,T+Hh+14);
    var by=y(TGT.mem/prec);g.strokeStyle=C.amber;g.setLineDash([5,4]);g.beginPath();g.moveTo(L,by);g.lineTo(L+W,by);g.stroke();g.setLineDash([]);U.label(g,L+W-4,by-10,'BMS 예산 8 KB = '+n0(TGT.mem/prec)+'개 ('+prec+'바이트)',C.amber,'right');
    g.strokeStyle=C.rule;g.beginPath();g.moveTo(L,T);g.lineTo(L,T+Hh);g.lineTo(L+W,T+Hh);g.stroke();g.fillStyle=C.muted;g.textAlign='left';g.fillText('파라미터 수 (보라 = 가중치, 갈색 = 편향)',6,14);U.stamp(g,w,'예산은 예시값');}
  U.reg(cv,function(dt){if(!dt)draw();});upd();
})();


var W4eng=function(){var r=ER.LIST.map(function(e){return BENCH[e.id];}).filter(Boolean).sort(function(a,b){return a.size-b.size;});
  $('#w4-eng').innerHTML='<thead><tr><th>엔진</th><th>저장 값</th><th>FP32 메모리</th><th>BMS 8 KB 예산</th></tr></thead><tbody>'+r.map(function(b){var kb=b.size*4/1024;return '<tr class="'+(b.e.id===SEL?'me':'')+'"><td><span class="bar" style="background:'+ECOL[b.e.id]+';width:10px"></span>'+b.e.name+'</td><td>'+n0(b.size)+'</td><td>'+fmt(kb,2)+' KB</td><td>'+(kb<=8?'<span class="lamp ok">안에 듦</span>':'<span class="lamp ng">넘음</span>')+'</td></tr>';}).join('')+'</tbody>';};

/* ══ ⑤ 첫 시동 (제곱 손실) ══ */
(function(){var ca=$('#cvW5a'),e0=120,sc=1;
  $('#r-w5e').oninput=function(){e0=+this.value;$('#v-w5e').textContent=e0+'회';upd();};
  U.btns($('#g-w5i'),[[0.1,'작게 (×0.1)'],[1,'보통 (×1)'],[5,'크게 (×5)']],1,function(v){sc=v;init();});
  var BASE=VA.yr.reduce(function(s,y){return s+y*y;},0)/VA.n;
  function init(){var a=[];for(var sd=11;sd<21;sd++)a.push(BM.loss(BM.Net(H0,sd,sc),'reg',VA));var lc=a[0],mn=a.reduce(function(x,y){return x+y;},0)/a.length,lo=Math.min.apply(null,a),hi=Math.max.apply(null,a),ok=mn<=2*BASE;
    $('#w5-minis').innerHTML=mini(ok?'g':'r','초기 손실 · 시드 10개 평균',fmt(mn,3))+mini('','범위 (가장 낮은 ~ 높은 시드)',fmt(lo,2)+' ~ '+fmt(hi,2))+mini('','시드 11 (⑧이 쓰는 초깃값)',fmt(lc,3))+mini('a','기준선 · 기준 (2배)',fmt(BASE,3)+' · ≤ '+fmt(2*BASE,3))+mini('g','길들인 뒤 (⑧ 검증 최저)',fmt(M.hc[M.ec][2],3));
    QC(5,ok?'ok':'ng','초기 손실 평균 '+fmt(mn,3)+' (시드 10개, 기준선 '+fmt(BASE,3)+')');
    U.ins($('#i-w5'),[[ok?'g':'r',ok?'시드 10개의 첫 손실 평균이 "늘 평균만 말하기" 기준선 근처입니다. 아직 아무것도 모르는 엔진이 엉뚱하게 큰 숫자를 내지는 않아요.':'첫 손실이 기준선보다 훨씬 큽니다. 초깃값이 커서 엔진이 처음부터 터무니없는 수명을 말합니다. 제곱 손실이라 이런 셀 하나가 기울기를 크게 흔들어 학습이 불안정해질 수 있어요.'],
      ['a',lc<BASE?'시드 11의 첫 손실('+fmt(lc,3)+')은 기준선보다 낮습니다. 배우기 전인데 더 잘 맞히는 것처럼 보이지만, 무작위 초깃값이 우연히 수명과 비슷한 방향을 가리킨 운입니다. 그래서 시드 하나가 아니라 여러 시드로 판정합니다.':'초기 손실은 시드마다 '+fmt(lo,2)+'~'+fmt(hi,2)+'로 흔들립니다. 한 시드만 보고 판정하지 않습니다.']]);}
  function upd(){var z=e0/S.ls,L=z*z;$('#eq-w5').innerHTML='손실 = (예측 − 정답)² = ('+e0+'회)² = '+n0(e0*e0)+'회² · 표준화하면 ('+e0+' ÷ '+n0(S.ls)+')² = <b>'+fmt(L,2)+'</b> · 두 배 틀리면 <em>네 배</em>';
    var pts=[];for(var i=0;i<=120;i++){var x=-300+i*5;pts.push([x,(x/S.ls)*(x/S.ls)]);}
    U.plot(ca,{xr:[-300,300],yr:[0,11],xt:[-300,-200,-100,0,100,200,300],yt:[0,2,4,6,8,10],xl:'예측 − 정답 (회)',yl:'손실 (표준화)',series:[{pts:pts,color:C.stain,width:2.4}],
      vlines:[{x:e0,color:C.gfp,label:(e0>0?'길게 ':e0<0?'짧게 ':'')+Math.abs(e0)+'회 → '+fmt(L,2)}],hlines:[{y:1,color:C.muted,label:'1 = 표준편차만큼 틀림',left:true}],stamp:'예시값'});}
  U.reg(ca,function(dt){if(!dt)upd();});init();upd();
})();

/* ══ ⑥ 원인 추적실 ══ */
(function(){var cv=$('#cvW6'),kind='reg',bug=false,off=0,res=null;
  
  U.btns($('#g-w6b'),[[0,'정상'],[1,'버그 넣기 (tanh 미분 빠뜨림)']],0,function(v){bug=!!v;run();});
  $('#w6-batch').onclick=function(){off=(off+32)%(TR.n-32);run();};
  function run(){var P=BM.Net(H0,11,1),ids=[];for(var i=0;i<32;i++)ids.push(off+i);res=BM.gradCheck(P,kind,TR,ids,bug);
    var ok=res.maxRel<TGT.gc,big=0,bi=0;res.bp.forEach(function(v,i){if(Math.abs(v)>big){big=Math.abs(v);bi=i;}});
    /* 셀 하나로 연쇄 법칙 */
    var x=TR.x[off],y=kind==='cls'?TR.yc[off]:TR.yr[off],f=BM.fwd(P,x),dz=kind==='cls'?BM.sig(f.z)-y:2*(f.z-y),an=dz*f.h[0];
    var Q=BM.clone(P),h=1e-5;Q.W2[0]+=h;var la=BM.lossOne(kind,BM.fwd(Q,x).z,y);Q.W2[0]-=2*h;var lb=BM.lossOne(kind,BM.fwd(Q,x).z,y),nd=(la-lb)/(2*h);
    $('#eq-w6').innerHTML='셀 하나, 출력층 가중치 W₂[1]: ∂L/∂W₂[1] = ∂L/∂z · ∂z/∂W₂[1] = '+fmt(dz,4)+' × '+fmt(f.h[0],4)+' = <b>'+fmt(an,5)+'</b> · 직접 흔들어 잰 값 <em>'+fmt(nd,5)+'</em>';
    QC(6,ok?'ok':'ng','최대 상대 오차 '+res.maxRel.toExponential(1));
    U.ins($('#i-w6'),[[ok?'g':'r',ok?'역전파 값과 직접 잰 값이 49개 모두 맞습니다. 이 역전파 코드는 믿고 써도 됩니다.':'은닉층 파라미터(W₁, b₁)에서 막대와 점이 어긋납니다. 출력층(W₂, b₂)은 맞는데 은닉층만 틀리니, 은닉층을 거꾸로 지나는 미분(tanh)을 의심합니다.']]);
    draw();}
  function draw(){if(!res)return;var R=U.setup(cv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var n=res.bp.length,L=46,T=26,B=36,W=w-L-12,Hh=h-T-B,mx=0;
    res.bp.concat(res.fd).forEach(function(v){mx=Math.max(mx,Math.abs(v));});mx=mx*1.1||1;var y0=T+Hh/2,bw=W/n;
    var grp=[[0,32,'W₁ (32)',C.stain],[32,40,'b₁ (8)',C.amber],[40,48,'W₂ (8)',C.info],[48,49,'b₂',C.gfp]];
    grp.forEach(function(G){g.fillStyle='rgba(22,33,43,.03)';g.fillRect(L+G[0]*bw,T,(G[1]-G[0])*bw,Hh);g.fillStyle=G[3];g.font='11.5px '+cssv('--font');g.textAlign='center';g.fillText(G[2],L+(G[0]+G[1])/2*bw,T+Hh+14);
      for(var i=G[0];i<G[1];i++){var v=res.bp[i];g.fillStyle=G[3];g.globalAlpha=0.55;g.fillRect(L+i*bw+1,v>=0?y0-v/mx*Hh/2:y0,bw-2,Math.abs(v)/mx*Hh/2);g.globalAlpha=1;
        g.beginPath();g.arc(L+i*bw+bw/2,y0-res.fd[i]/mx*Hh/2,2.6,0,7);g.fillStyle=C.text;g.fill();}});
    g.strokeStyle=C.rule;g.beginPath();g.moveTo(L,y0);g.lineTo(L+W,y0);g.stroke();g.fillStyle=C.muted;g.textAlign='left';g.fillText('막대 = 역전파 · 점 = 직접 흔들어 잰 값 (미니배치 32셀 평균)',6,14);U.stamp(g,w,'설명용 모형');}
  U.reg(cv,function(dt){if(!dt)draw();});run();
})();


/* ══ ⑦ 조정대 ══ */
(function(){var ca=$('#cvW7a'),cb=$('#cvW7b'),lr=0.10,opt='sgd',w=0.5,path=[0.5],ad={m:0,v:0,t:0};
  function Lf(x){return (x-0.4)*(x-0.4)+0.05;}function G(x){return 2*(x-0.4);}
  $('#r-w7').oninput=function(){lr=+this.value;$('#v-w7').textContent=lr.toFixed(2);};
  U.btns($('#g-w7o'),[['sgd','경사하강 (SGD)'],['adam','Adam']],'sgd',function(v){opt=v;reset();});
  function step(){var g=G(w),old=w;if(opt==='adam'){ad.t++;ad.m=0.9*ad.m+0.1*g;ad.v=0.999*ad.v+0.001*g*g;var mh=ad.m/(1-Math.pow(0.9,ad.t)),vh=ad.v/(1-Math.pow(0.999,ad.t));w=w-lr*mh/(Math.sqrt(vh)+1e-8);}else w=w-lr*g;
    if(!isFinite(w)||Math.abs(w)>1e6)w=old>0?1e6:-1e6;path.push(w);
    $('#eq-w7').innerHTML=opt==='sgd'?'w ← w − η · ∂L/∂w = '+fmt(old,3)+' − '+lr.toFixed(2)+' × '+fmt(g,3)+' = <b>'+fmt(w,4)+'</b> · 손실 '+fmt(Lf(old),4)+' → <em>'+fmt(Lf(w),4)+'</em>':'Adam: 평균 기울기 m̂ = '+fmt(mh,3)+', 크기 √v̂ = '+fmt(Math.sqrt(vh),3)+' → w = '+fmt(old,3)+' − '+lr.toFixed(2)+' × m̂/√v̂ = <b>'+fmt(w,4)+'</b> · 손실 <em>'+fmt(Lf(w),4)+'</em>';
    judge();draw();}
  function judge(){var n=path.length-1,L0=Lf(path[0]),Ln=Lf(path[n]),last=Lf(path[n])<Lf(path[n-1]),div=Math.abs(path[n]-0.4)>Math.abs(path[0]-0.4)*1.5||!isFinite(Ln);
    var ok=Ln<L0&&!div;QC(7,ok?'ok':'ng',n+'걸음 · 손실 '+fmt(L0,4)+' → '+fmt(Ln,4));
    U.ins($('#i-w7'),[[ok?'g':'r',ok?(n+'걸음 뒤 손실이 줄었습니다. '+(last?'마지막 걸음도 내리막이에요.':'바닥 근처를 오가고 있어요.')):(lr>=1&&opt==='sgd'?'학습률이 1 이상이라 걸음마다 바닥을 더 크게 지나칩니다(발산). 1보다 작게 낮춰 보세요.':'손실이 줄지 않았습니다. 학습률이나 옵티마이저를 바꿔 보세요.')]]);}
  function reset(){w=0.5;path=[0.5];ad={m:0,v:0,t:0};QC(7,'wait','');$('#eq-w7').innerHTML='출발: w = 0.50, 기울기 ∂L/∂w = 2(0.50 − 0.40) = <b>+0.20</b>, 손실 0.0600';U.ins($('#i-w7'),[['a','"한 걸음"을 눌러 보세요. 카드 07의 계산이 그대로 나옵니다.']]);draw();}
  $('#w7-step').onclick=step;$('#w7-ten').onclick=function(){for(var i=0;i<10;i++)step();};$('#w7-reset').onclick=reset;
  function draw(){var pts=[];for(var i=0;i<=100;i++){var x=-0.2+i*0.012;pts.push([x,Lf(x)]);}
    var o=U.plot(ca,{xr:[-0.2,1.0],yr:[0,0.45],xt:[-0.2,0,0.2,0.4,0.6,0.8,1.0],yt:[0,0.1,0.2,0.3,0.4],xl:'w',yl:'L(w)',series:[{pts:pts,color:C.info,width:2.4}],stamp:'예시값'});
    var g=o.g;path.forEach(function(x,i){if(i===0)return;var a=path[i-1];if(Math.abs(a)>5||Math.abs(x)>5)return;U.arrow2(g,o.X(clamp(a,-0.2,1)),o.Y(Lf(a)),o.X(clamp(x,-0.2,1)),o.Y(Lf(x)),C.amber,1.6);});
    var c=path[path.length-1];if(Math.abs(c)<5){g.beginPath();g.arc(o.X(clamp(c,-0.2,1)),o.Y(Math.min(Lf(c),0.45)),6,0,7);g.fillStyle=C.gfp;g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();U.label(g,o.X(clamp(c,-0.2,1)),o.Y(Math.min(Lf(c),0.45))-16,'w = '+fmt(c,3),C.gfp,'center');}
    var lp=path.map(function(x,i){return [i,Math.min(Lf(x),1)];});U.plot(cb,{xr:[0,Math.max(10,path.length-1)],yr:[0,0.2],xt:[0,5,10,15,20,25,30].filter(function(t){return t<=Math.max(10,path.length-1);}),yt:[0,0.05,0.1,0.15,0.2],xl:'걸음',yl:'손실',series:[{pts:lp,color:C.amber,width:2,dots:3}],hlines:[{y:0.05,color:C.gfp,label:'바닥 0.05',left:true}],stamp:'예시값'});}
  U.reg(ca,function(dt){if(!dt)draw();});reset();
})();



/* ══ ⑧ 길들이기 라인 ══ */
(function(){var ca=$('#cvW8a'),cb=$('#cvW8b'),cc=$('#cvW8c'),cards=$('#cards8'),hi=[],raf=0;
  cards.innerHTML=TR.life.map(function(L){return '<i'+(L<LQ?' class="d"':'')+'></i>';}).join('');var ci=$$('i',cards);
  U.btns($('#g-w8b'),[[8,'8'],[32,'32'],[128,'128'],[600,'600 (전체)']],32,function(v){W8.batch=v;});
  U.btns($('#g-w8o'),[['sgd|0.1','SGD 0.1'],['sgd|0.01','SGD 0.01'],['adam|0.01','Adam 0.01'],['adam|0.001','Adam 0.001']],'adam|0.01',function(v){var a=v.split('|');W8.opt=a[0];W8.lr=+a[1];});
  function show(J){var h=J?J.hist:M.hc,f=J?J.f1:M.mh,be=J?J.best.e:M.ec,mx=0;h.forEach(function(r){mx=Math.max(mx,Math.min(r[1],3),Math.min(r[2],3));});
    U.plot(ca,{xr:[0,EP],yr:[0,Math.max(0.2,mx*1.05)],xt:[0,30,60,90,120],yt:[0,mx/2,mx].map(function(v){return +v.toFixed(2);}),xl:'에포크',yl:'손실 (평균제곱오차, 표준화)',
      series:[{pts:h.map(function(r){return [r[0],r[1]];}),color:C.info,width:2,name:'훈련',ndy:14},{pts:h.map(function(r){return [r[0],r[2]];}),color:C.eye,width:2,name:'검증',ndy:-12}],vlines:be?[{x:be,color:C.gfp,label:'검증 최저 '+be}]:[],stamp:'설명용 모형'});
    U.plot(cb,{xr:[0,EP],yr:[0,120],xt:[0,30,60,90,120],yt:[0,30,60,90,120],xl:'에포크',yl:'검증 평균 오차 (회)',series:[{pts:f.map(function(p){return [p[0],Math.min(p[1],120)];}),color:C.gfp,width:2}],hlines:[{y:TGT.mae,color:C.amber,label:'기준 30회',left:true}],vlines:be?[{x:be,color:C.gfp}]:[],stamp:'설명용 모형'});}
  function scat(P){var pv=VA.x.map(function(x){return LF(BM.fwd(P,x).z);});pva(cc,pv,0,'DFF 회귀 엔진',ECOL.mlp);}
  function report(){var v=M.vr;
    $('#w8-minis').innerHTML=mini('a','에포크 · 스텝',EP+' · '+n0(M.steps))+mini('','고른 에포크 (검증 최저)',M.ec)+mini('','R² · RMSE',fmt(v.r2,3)+' · '+fmt(v.rmse,1)+'회')+mini(v.mae<=TGT.mae?'g':'r','검증 평균 오차',fmt(v.mae,1)+'회');
    var ok=v.mae<=TGT.mae;QC(8,ok?'ok':'ng','평균 오차 '+fmt(v.mae,1)+'회');scat(M.P);
    U.ins($('#i-w8'),[[ok?'g':'r',ok?'검사 기준을 넘었습니다. 검증 손실이 가장 낮던 에포크 '+M.ec+'의 파라미터를 엔진에 남겨 두었어요. 아래 그림에서 점이 점선(예측 = 실제)에 모일수록 좋은 엔진입니다.':'기준에 못 미쳤습니다. '+(W8.opt==='sgd'&&W8.lr<0.05?'SGD 0.01은 120 에포크 안에 덜 내려옵니다. ':'')+(W8.batch===600?'전체 배치는 에포크마다 한 걸음뿐이라 느립니다. ':'')+'설정을 바꿔 다시 길들여 보세요.'],
      ['a','검증 데이터로 멈출 때를 골랐으니, 검증 점수는 조금 낙관적일 수 있습니다. 그래서 최종 점수는 2편에서 봉인한 시험 셀로 잽니다[10].']]);}
  function frame(){var J=W8.jc;if(!J)return;J.run(1);
    var bs=W8.batch,ns=Math.ceil(TR.n/bs),k=(J.e*7)%ns,ids=J.lastIds.slice(k*bs,Math.min(TR.n,(k+1)*bs));hi.forEach(function(i){ci[i]&&ci[i].classList.remove('on');});hi=ids;hi.forEach(function(i){ci[i]&&ci[i].classList.add('on');});
    show(J);$('#w8-minis').innerHTML=mini('a','에포크 · 스텝',J.e+' · '+n0(J.steps))+mini('','훈련 · 검증 손실',fmt(J.hist[J.e][1],3)+' · '+fmt(J.hist[J.e][2],3))+mini('g','검증 평균 오차',fmt(J.f1[J.e][1],1)+'회')+mini('','배치 · 1 에포크 스텝',bs+' · '+ns);
    if(J.e%5===0)scat(J.P);
    if(J.done){W8.running=false;hi.forEach(function(i){ci[i]&&ci[i].classList.remove('on');});adopt(J);W8.jc=null;$('#w8-run').textContent='▶ 길들이기 시작';after8();return;}
    raf=requestAnimationFrame(frame);}
  $('#w8-run').onclick=function(){if(W8.running){W8.running=false;cancelAnimationFrame(raf);W8.jc=null;this.textContent='▶ 길들이기 시작';show();report();return;}
    W8.running=true;W8.jc=job8();QC(8,'run','길들이는 중');this.textContent='■ 멈추기';if(U.reduce)W8.jc.run(EP);raf=requestAnimationFrame(frame);};
  $('#w8-reset').onclick=function(){if(W8.running)return;adopt(DEF);after8();};
  function after8(){show();report();W3.refresh&&W3.refresh();}
  U.reg(ca,function(dt){if(!dt&&!W8.running){show();report();}});
})();

/* ══ ⑨ 개조 공정 ══ */
(function(){var ca=$('#cvW9a'),cb=$('#cvW9b'),sel='adapter',R=null;
  var MT=[['asis','그대로 쓰기'],['scratch','처음부터 B로만'],['full','전체 미세조정'],['adapter','어댑터만']];
  U.btns($('#g-w9'),MT,sel,function(v){sel=v;drawA();drawB();});
  function run(){var E=function(P){return BM.evalReg(P,VAB,S);},o={kind:'reg',tr:TRB,va:VAB,opt:'adam',batch:16,epochs:80,seed:5};
    var full=BM.train(Object.assign({},o,{P:BM.clone(REGA),lr:0.005}));
    var Pa=BM.clone(REGA),r=BM.rng(99);Pa.A=[];for(var j=0;j<H0;j++)Pa.A.push(BM.gauss(r)*0.1);Pa.B=[0,0,0,0];
    var ad=BM.train(Object.assign({},o,{P:Pa,lr:0.01,mask:{W1:0,b1:0,W2:1,b2:1,A:1,B:1}}));
    var scr=BM.train(Object.assign({},o,{H:H0,lr:0.01}));
    R={asis:{e:E(REGA),n:0},scratch:{e:E(scr.P),n:49},full:{e:E(full.P),n:49},adapter:{e:E(ad.P),n:21}};
    R.asis.bias=VAB.x.reduce(function(s,x,i){return s+LF(BM.fwd(REGA,x).z)-VAB.life[i];},0)/VAB.n;
    $('#w9-tb').innerHTML='<thead><tr><th>방법</th><th>학습하는 값</th><th>공장 B 검증 평균 오차</th><th>R²</th><th>손실</th></tr></thead><tbody>'+MT.map(function(m){var x=R[m[0]];return '<tr><td>'+m[1]+'</td><td class="n">'+x.n+'개</td><td class="n">'+fmt(x.e.mae,1)+'회</td><td class="n">'+fmt(x.e.r2,3)+'</td><td class="n">'+fmt(x.e.loss,3)+'</td></tr>';}).join('')+'</tbody>';
    var ok=R.adapter.e.mae<R.asis.e.mae&&R.adapter.n<49;QC(9,ok?'ok':'ng','어댑터 '+fmt(R.adapter.e.mae,1)+'회 (그대로 '+fmt(R.asis.e.mae,1)+'회) · 학습 값 21개');
    var best=MT.slice().sort(function(a,b){return R[a[0]].e.mae-R[b[0]].e.mae;})[0];
    U.ins($('#i-w9'),[['g','그대로 쓰면 공장 B 셀의 수명을 평균 '+fmt(R.asis.e.mae,1)+'회 틀리고, 평균 '+fmt(R.asis.bias,0)+'회 길게 말합니다(과대예측). 미세조정하면 '+fmt(R.full.e.mae,1)+'회(전체), '+fmt(R.adapter.e.mae,1)+'회(어댑터), 셀 60개로 처음부터 배우면 '+fmt(R.scratch.e.mae,1)+'회입니다. 가장 작은 것은 "'+best[1]+'"입니다.'],['a','어댑터는 학습하는 값이 21개로 전체(49개)의 절반 아래입니다. 이 작은 엔진에선 절약이 작지만, 수십억 개짜리 모델에서는 이 비율이 수천 분의 1까지 내려갑니다[4].']]);
    drawA();drawB();}
  $('#w9-run').onclick=run;
  function drawA(){var Rr=U.setup(ca),g=Rr.g,w=Rr.w,h=Rr.h;U.grid24(g,w,h);var cs=Math.min(22,(h-110)/8),x0=24,y0=46;
    var fr={asis:{W1:0,b1:0,W2:0,b2:0,AB:0},scratch:{W1:2,b1:2,W2:2,b2:2,AB:0},full:{W1:1,b1:1,W2:1,b2:1,AB:0},adapter:{W1:0,b1:0,W2:1,b2:1,AB:1}}[sel];
    function cell(x,y,st){g.fillStyle=st===0?'#dfe4ea':st===2?'rgba(30,85,200,.55)':'rgba(163,92,0,.75)';g.fillRect(x,y,cs,cs);if(st===0){g.strokeStyle='#a9b3be';g.strokeRect(x+.5,y+.5,cs-1,cs-1);}}
    function hdr(t,x,y){g.fillStyle=C.text;g.font='700 12.5px '+cssv('--font');g.textAlign='left';g.fillText(t,x,y);}
    hdr('W₁ 8×4',x0,y0-10);for(var j=0;j<8;j++)for(var k=0;k<4;k++)cell(x0+k*(cs+2),y0+j*(cs+2),fr.W1);
    var bx=x0+4*(cs+2)+10;hdr('b₁',bx,y0-10);for(j=0;j<8;j++)cell(bx,y0+j*(cs+2),fr.b1);
    var wx=bx+cs+24;hdr('W₂ · b₂',wx,y0-10);for(j=0;j<8;j++)cell(wx,y0+j*(cs+2),fr.W2);cell(wx+cs+6,y0+3.5*(cs+2),fr.b2);
    if(fr.AB){var ax=wx+cs*2+34;hdr('어댑터 A (8×1) · Bᵀ (1×4)',ax,y0-10);for(j=0;j<8;j++)cell(ax,y0+j*(cs+2),1);for(k=0;k<4;k++)cell(ax+cs+10+k*(cs+2),y0,1);
      g.fillStyle=C.muted;g.font='12px '+cssv('--font');g.fillText('W₁ 실효값 = W₁ + A·Bᵀ',ax,y0+8*(cs+2)+16);}
    var ly=h-20;[['#dfe4ea','잠금 (사전학습 값 그대로)'],['rgba(163,92,0,.75)','공장 B로 고침'],['rgba(30,85,200,.55)','새로 처음부터']].forEach(function(l,i){g.fillStyle=l[0];g.fillRect(x0+i*(w/3.1),ly-10,12,12);g.fillStyle=C.muted;g.font='12px '+cssv('--font');g.textAlign='left';g.fillText(l[1],x0+i*(w/3.1)+16,ly);});
    U.stamp(g,w,'설명용 모형');}
  function drawB(){if(!R)return;var Rr=U.setup(cb),g=Rr.g,w=Rr.w,h=Rr.h;U.grid24(g,w,h);var L=110,T=20,bh=Math.min(34,(h-60)/4.6);
    var vm=Math.max.apply(null,MT.map(function(m){return R[m[0]].e.mae;}));MT.forEach(function(m,i){var v=R[m[0]].e.mae,y=T+i*bh*1.45,bw=(w-L-110)*v/vm;g.fillStyle=m[0]===sel?C.amber:'rgba(91,104,116,.45)';g.fillRect(L,y,bw,bh);g.fillStyle=C.text;g.font=(m[0]===sel?'700 ':'')+'13px '+cssv('--font');g.textAlign='right';g.fillText(m[1],L-8,y+bh*0.65);
      g.textAlign='left';g.fillText(fmt(v,1)+'회 · '+R[m[0]].n+'개',L+bw+6,y+bh*0.65);});
    g.fillStyle=C.muted;g.font='12px '+cssv('--font');g.textAlign='left';g.fillText('공장 B 검증 평균 오차 (짧을수록 좋음) · 학습하는 값 개수',8,h-8);U.stamp(g,w,'설명용 모형');}
  U.reg(ca,function(dt){if(!dt){drawA();drawB();}});run();
})();

/* ══ ⑩ 출고 검사실 (용량 실험: 시드 3개 평균) ══ */
(function(){var ca=$('#cvW10a'),cb=$('#cvW10b'),HS=[1,2,4,8,16,32],SDS=[21,22,23],res=[],busy=false,ck=null,done=false;
  var small=SP.tr.slice(0,80),S80=BM.stats(D,small),TR80=BM.view(D,small,S80),VA80=BM.view(D,SP.va,S80);
  function avg(a){return a.reduce(function(x,y){return x+y;},0)/a.length;}
  $('#w10-sweep').onclick=function(){if(busy)return;busy=true;res=[];var i=0,k=0,J=null,cur=null;this.disabled=true;
    (function tick(){var t0=performance.now();while(performance.now()-t0<12){if(!J){if(i>=HS.length){busy=false;done=true;$('#w10-sweep').disabled=false;$('#w10-prog').textContent='완료 · 6개 크기 × 시드 3개';note();judge();draw();return;}
          if(k===0)cur={H:HS[i],trs:[],vas:[]};J=BM.job({kind:'reg',H:HS[i],seed:SDS[k],epochs:400,tr:TR80,va:VA80,opt:'adam',lr:0.01,batch:80});}
        J.run(10);if(J.done){cur.trs.push(BM.evalReg(J.P,TR80,S80).mae);cur.vas.push(BM.evalReg(J.P,VA80,S80).mae);cur.np=BM.nParams(J.P);J=null;k++;
          if(k===SDS.length){cur.tr=avg(cur.trs);cur.va=avg(cur.vas);cur.lo=Math.min.apply(null,cur.vas);cur.hi=Math.max.apply(null,cur.vas);res.push(cur);k=0;i++;}}}
      $('#w10-prog').textContent='은닉 '+HS[Math.min(i,HS.length-1)]+' · 시드 '+(k+1)+' 길들이는 중 · '+res.length+' / 6';draw();requestAnimationFrame(tick);})();};
  function note(){var out=[];if(done){var s=res.slice().sort(function(a,c){return a.va-c.va;}),b=s[0],b2=s[1],L=res[res.length-1];
      out.push(['g','시드 3개 평균으로 검증 오차가 가장 작은 크기는 은닉 '+b.H+'개(파라미터 '+b.np+'개, '+fmt(b.va,1)+'회)이고, 다음은 은닉 '+b2.H+'개('+fmt(b2.va,1)+'회)입니다. 은닉 '+L.H+'개는 훈련 오차가 '+fmt(L.tr,1)+'회까지 내려갔지만 검증 오차는 '+fmt(L.va,1)+'회입니다.'],
        [b2.va-b.va<Math.max(b.hi-b.lo,b2.hi-b2.lo)?'a':'g',b2.va-b.va<Math.max(b.hi-b.lo,b2.hi-b2.lo)?'1·2위 크기의 차이('+fmt(b2.va-b.va,1)+'회)가 시드에 따른 흔들림보다 작습니다. "은닉 '+b.H+'개가 최적"이라기보다 "셀 80개에는 작은 쪽이 낫고, 큰 쪽은 분명히 나빠진다"로 읽습니다.':'작은 크기가 시드 흔들림보다 뚜렷하게 낫습니다.'],
        ['a','셀 80개는 이 문제에 적은 양입니다. 정답 셀이 적을 때 단순한 엔진이 나은지, 아래 대결에서 엔진 종류를 바꿔 확인합니다.']);}
    if(ck)out.push([ck[0]===ck[1]?'g':'r','추론 1,000번 전후의 가중치 지문: '+(ck[0]===ck[1]?'같음 ('+ck[0]+') — 배포 후 추론은 가중치를 바꾸지 않았습니다.':'다름!')]);
    if(!out.length)out.push(['a','"크기별로 길들여 보기"로 용량 실험을, "추론 1,000번"으로 출고 검사를 합니다. 봉인한 시험 셀은 열지 않습니다.']);U.ins($('#i-w10'),out);}
  function judge(){var ok=done&&ck&&ck[0]===ck[1];QC(10,ok?'ok':(done||ck)?(ck&&ck[0]!==ck[1]?'ng':'run'):'wait',(done?'용량 실험 완료':'용량 실험 전')+' · 지문 '+(ck?(ck[0]===ck[1]?'같음':'다름'):'비교 전'));
    $('#w10-minis').innerHTML=mini(done?'g':'','용량 실험',done?'6 크기 × 시드 3':'—')+mini('','평균이 가장 나은 은닉 수',done?res.slice().sort(function(a,c){return a.va-c.va;})[0].H+'개':'—')+mini(ck?(ck[0]===ck[1]?'g':'r'):'','가중치 지문 전 → 후',ck?ck[0]+' → '+ck[1]:'—')+mini('','시험 셀 200개','🔒 2편');}
  $('#w10-infer').onclick=function(){var a=BM.checksum(M.P);for(var i=0;i<1000;i++)BM.predict(M.P,'reg',TE.x[i%TE.n]);ck=[a,BM.checksum(M.P)];judge();note();};
  function draw(){var mx=40;res.forEach(function(r){mx=Math.max(mx,r.hi*1.1,r.tr*1.1);});
    var o=U.plot(ca,{xr:[1,32],logx:true,yr:[0,mx],xt:HS,yt:[0,Math.round(mx/2),Math.round(mx)],xl:'은닉 뉴런 수 (로그 눈금)',yl:'평균 오차 (회) · 시드 3개 평균',series:res.length?[{pts:res.map(function(r){return [r.H,r.tr];}),color:C.info,width:2.2,dots:3.5,name:'훈련',ndy:14},{pts:res.map(function(r){return [r.H,r.va];}),color:C.eye,width:2.2,dots:3.5,name:'검증',ndy:-12}]:[],stamp:'설명용 모형'});
    if(o&&o.g){var g=o.g;g.strokeStyle='rgba(201,48,44,.35)';g.lineWidth=5;res.forEach(function(r){g.beginPath();g.moveTo(o.X(r.H),o.Y(r.lo));g.lineTo(o.X(r.H),o.Y(r.hi));g.stroke();});g.lineWidth=1;}
    var np=HS.map(function(H){return [H,4*H+H+H+1];});U.plot(cb,{xr:[1,32],logx:true,yr:[0,200],xt:HS,yt:[0,50,100,150,200],xl:'은닉 뉴런 수',yl:'파라미터 수',series:[{pts:np,color:C.stain,width:2.2,dots:3.5}],hlines:[{y:80,color:C.amber,label:'훈련 셀 80개',left:true}],stamp:'계산값'});}
  U.reg(ca,function(dt){if(!dt)draw();});judge();note();
})();

/* ══ 대결: 릿지 vs 그래디언트 부스팅 — 정답 셀 40개 · 600개, 10번 나눠 평균·이긴 횟수 ══ */
(function(){var fi=$('#d-fly'),ri=$('#d-robo'),out=null,pend=null,busy=false;
  var eR=ER.LIST.filter(function(e){return e.id==='ridge';})[0],eB=ER.LIST.filter(function(e){return e.id==='boost';})[0];
  function m(x){return x.reduce(function(p,q){return p+q;},0)/x.length;}
  function compute(cb){if(out){cb(out);return;}if(busy){pend=cb;return;}busy=true;pend=cb;var jobs=[],k=0,res={40:{a:[],b:[]},600:{a:[],b:[]}};[40,600].forEach(function(N){for(var j=0;j<10;j++)jobs.push([N,j]);});var smallB=[];
    (function step(){if(k>=jobs.length){out={};[40,600].forEach(function(N){var r=res[N],d=m(r.a)-m(r.b),w=r.b.filter(function(v,i){return v<r.a[i];}).length;out[N]={a:r.a,b:r.b,fly:m(r.a),robo:m(r.b),wins:w,res:(d>1&&w>=8)?'R':(d<-1&&w<=2)?'F':'D'};});out.small={m:m(smallB),wins:smallB.filter(function(v,i){return v<res[40].a[i];}).length};busy=false;pend&&pend(out);return;}
      var jb=jobs[k++],sp=splitK(jb[1],jb[0]);res[jb[0]].a.push(ER.evalR(eR.fit(sp.tr,eR.def,11),sp.va,sp.S).mae);res[jb[0]].b.push(ER.evalR(eB.fit(sp.tr,eB.def,11),sp.va,sp.S).mae);if(jb[0]===40)smallB.push(ER.evalR(eB.fit(sp.tr,{trees:20},11),sp.va,sp.S).mae);
      $('#d-bars').innerHTML='<p class="muted">계산 중… '+k+' / 20 (가정 A 10번 · 가정 B 10번)</p>';setTimeout(step,15);})();}
  var lastPred=null;
  U.Duel({el:'#duel',run:function(){return null;},show:function(o,pred){lastPred=pred;$('#d-say').innerHTML='';$('#d-score').textContent='';$('#d-pred').textContent='';compute(function(r){reveal(r,lastPred);});},
    reset:function(){U.setMood(fi,'fly_point');U.setMood(ri,'robo_coin');}});
  function grp(t,o){var mx=Math.max(o.fly,o.robo)*1.1;return '<h4 style="margin:10px 0 4px;font-size:14px">'+t+'</h4><div class="resbars"><div class="resbar"><span style="color:var(--c-fly)">초파리 · 릿지 (5개)</span><div class="bar"><i style="background:var(--c-fly);width:'+(o.fly/mx*100)+'%"></i></div><b>'+fmt(o.fly,1)+'회</b></div>'+
      '<div class="resbar"><span style="color:var(--c-robo)">주판봇 · 부스팅 (100그루)</span><div class="bar"><i style="background:var(--c-robo);width:'+(o.robo/mx*100)+'%"></i></div><b>'+fmt(o.robo,1)+'회</b></div></div>'+
      '<div class="dots" aria-label="10번 나눈 각 결과">'+o.a.map(function(v,i){return '<span class="'+(o.b[i]<v?'w':'')+'">'+(i+1)+'번 '+fmt(v,1)+' : '+fmt(o.b[i],1)+'</span>';}).join('')+'</div>';}
  function reveal(o,pred){var A=o[40],Bq=o[600],res=A.res===Bq.res?A.res:(A.res!=='D'&&Bq.res!=='D')?'C':A.res==='D'?Bq.res:A.res;
    var Mo={F:['fly_arms','robo_sigh','doc_judge','asst_spark'],R:['fly_coffee','robo_happy','doc_judge','asst_spark'],D:['fly_coffee','robo_meh','doc_think','asst_smile'],C:['fly_arms','robo_happy','doc_judge','asst_spark']}[res];
    U.setMood(fi,Mo[0]);U.setMood(ri,Mo[1]);
    $('#d-bars').innerHTML=grp('가정 A — 수명 시험을 마친 셀 40개',A)+'<p class="muted" style="font-size:13.5px;margin:6px 0 0">손잡이 확인: 셀 40개에 맞춰 부스팅을 20그루로 줄여도 평균 '+fmt(o.small.m,1)+'회, 릿지를 10번 중 '+o.small.wins+'번 이겼습니다. 가정 A의 결과는 손잡이 탓이 아닙니다.</p>'+grp('가정 B — 셀 600개',Bq);
    var w={F:'초파리',R:'주판봇',D:'무승부'};
    $('#d-say').innerHTML=U.say('asst',Mo[3],'셀 40개일 때 평균 오차는 릿지 '+fmt(A.fly,1)+'회, 부스팅 '+fmt(A.robo,1)+'회로 부스팅이 10번 중 '+A.wins+'번 이겼어요. 셀 600개일 때는 '+fmt(Bq.fly,1)+'회 대 '+fmt(Bq.robo,1)+'회, 부스팅이 '+Bq.wins+'번 이겼어요.')+
      U.say('doc',Mo[2],res==='C'?'조건부 판정이다. 정답 셀이 40개면 '+w[A.res]+', 600개면 '+w[Bq.res]+'. 트리 100그루는 셀이 적을 때 잡음까지 따라가고, 평면 하나는 셀이 많을 때 굽은 관계를 못 따라간다. 엔진은 정답 셀 수를 보고 고른다.':res==='D'?'두 가정 모두 차이가 흔들림 안에 있다. 이번 판은 나눠 갖는다.':'두 가정 모두 '+w[res]+' 쪽이다. '+w[res]+' 승.',true);
    $('#d-score').textContent='판정: '+{F:'F 초파리 승',R:'R 주판봇 승',D:'D 무승부',C:'C 조건부 (A: '+w[A.res]+' · B: '+w[Bq.res]+')'}[res];
    $('#d-pred').textContent=pred?' · 내 예상: '+(pred==='fly'?'초파리':'주판봇')+(res==='C'?' — 반만 맞았어요 (가정에 따라 갈려요)':((pred==='fly'&&res==='F')||(pred==='robo'&&res==='R')?' — 맞았어요':' — 빗나갔어요')):'';}
})();

/* ══ 정비 작업장 접기 ══ */
(function(){var b=$('#t-fold');for(var n=1;n<=10;n++){var sec=$('#w'+n),p=document.createElement('p');p.className='foldnote';p.textContent='접혀 있음 — 위 정비 공정에서 "펼치기"를 누르면 보입니다.';sec.querySelector('.wrap').appendChild(p);}
  b.onclick=function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));b.textContent=on?'작업장 ①~⑩ 펼치기':'작업장 ①~⑩ 접기 (45분 경로)';for(var n=1;n<=10;n++)$('#w'+n).classList.toggle('folded',on);if(!on)setTimeout(U.drawAll,30);};})();

/* ══ 출고 ══ */
var shipSel=null;
function shipUI(){var r=ranked();if(!r.length)return;if(!shipSel||!BENCH[shipSel])shipSel=r[0].e.id;
  U.btns($('#g-ship'),r.map(function(b){return [b.e.id,b.e.name];}),shipSel,function(v){shipSel=v;shipInfo();});shipInfo();}
function shipInfo(){var b=BENCH[shipSel];if(!b)return;var kb=b.size*4/1024,q=REP[shipSel],ov=b.pv.filter(function(p,i){return p-VA.life[i]>30;}).length;
  $('#ship-minis').innerHTML=mini('g','출고 엔진',b.e.name)+mini(b.v.mae<=TGT.mae?'g':'r','검증 오차 (한 번 · 5번 평균)',fmt(b.v.mae,1)+' · '+(q&&q.m!=null?fmt(q.m,1):'…')+'회')+mini(kb<=8?'':'r','무게 (FP32)',fmt(kb,2)+' KB')+mini('','시험 셀 200개','🔒 2편에서 개봉');
  U.ins($('#i-ship'),[[b.v.mae<=TGT.mae?'g':'a','"'+b.e.name+'" 엔진을 출고 전표에 적었습니다. 검증 평균 오차 '+fmt(b.v.mae,1)+'회, 30회 넘게 길게 말한 셀 '+ov+'개, 무게 '+fmt(kb,2)+' KB'+(kb>8?' — BMS 칩 예산(8 KB)을 넘으니 서버에서 돌려야 합니다.':'.')],['a',(repDone()?'1·2위의 5번 평균 차이가 흔들림보다 작다면 무게·속도·설명 가능성으로 고르는 것도 정당합니다. ':'')+'정답 셀이 적은 새 라인에 보낼 때는 대결에서 본 것처럼 단순한 엔진이 나을 수 있습니다. 2편에서 봉인한 시험 셀을 열면 숫자가 내려갈 수도 있습니다.']]);}

/* ══ 엔진(모델) 조립 공장 3D 그림 ══ */
var Fac={};
(function(){var cv=$('#cvFac'),narrow=(cv.clientWidth||window.innerWidth)<600,yaw=narrow?-0.15:-0.5,pitch=narrow?1.2:0.82,spd=1,play=!U.reduce,t=0,sel=-1;
  var PR=[
   {id:'P1',name:'데이터 입고',cat:'d',href:'#data',desc:'셀 1,000개의 측정값 4가지(내부저항·초기 용량·온도 상승·전압 편차)가 들어옵니다.',met:'셀 1,000개 · 측정값 4개'},
   {id:'P2',name:'정답 붙이기',cat:'d',href:'#data',desc:'수명 시험실에서 셀마다 용량이 80%로 떨어질 때까지의 충·방전 횟수를 셉니다. 이 횟수가 예측 장치가 배울 정답입니다.',met:'수명 평균 '+n0(S.lm)+'회',who:['asst','asst_report',0.9]},
   {id:'P3',name:'정제 · 표준화',cat:'d',href:'#data',desc:'측정 오류를 걸러내고, 훈련 셀의 평균·표준편차로 네 측정값과 수명의 눈금을 맞춥니다.',met:'측정값·수명 모두 평균 0 · 표준편차 1',who:['sia','sia_guide',0.88]},
   {id:'P4',name:'나누기 · 봉인',cat:'d',href:'#data',desc:'훈련 600 · 검증 200 · 시험 200. 시험 셀은 금고에 넣어 2편 검증장까지 봉인합니다.',met:'600 · 200 · 200 (시험 봉인)',who:['moa','moa_report',0.84],vault:true},
   {id:'P5',name:'머신러닝 도감관',cat:'a',href:'#atlas',desc:'머신러닝 도감에서 회귀 엔진 8종(선형 회귀, 릿지, 라쏘, 회귀 트리, 랜덤 포레스트, 부스팅, k-최근접 이웃, 가우시안 프로세스)을 꺼냅니다.',met:'회귀 엔진 8종',shelf:['lin','ridge','lasso','tree','rf','boost','knn','gp']},
   {id:'P6',name:'신경망 도감관',cat:'a',href:'#atlas',desc:'신경망 도감에서 DFF 1종을 꺼냅니다. 출력에 시그모이드를 떼고 수명을 그대로 냅니다. LSTM·오토인코더는 창고에 둡니다.',met:'엔진 1종 (+ 보관 2종)',shelf:['mlp'],who:['robo','robo_chart',0.72]},
   {id:'P7',name:'엔진 장착대',cat:'m',href:'#mount',desc:'예측 장치 차체에 엔진을 답니다. 엔진 창고에서 고른 엔진의 색이 차체 위 상자에 나타납니다.',met:'장착 엔진: —'},
   {id:'P8',name:'시운전 벤치',cat:'v',href:'#bench',desc:'훈련 셀 600개로 배우고 검증 셀 200개로 잽니다. 모든 엔진이 같은 조건입니다.',met:'검증 셀 200개',loop:true,who:['fly','fly_magnify',0.5]},
   {id:'P9',name:'정비 공정 ①~⑩',cat:'m',href:'#tune',desc:'신경망 엔진을 분해 정비합니다. 미니배치마다 예측 → 손실 → 역전파 → 옵티마이저 한 걸음.',met:'정비 작업장 10곳',loop:true,mini:true},
   {id:'P10',name:'엔진 비교 · 선정',cat:'v',href:'#bench',desc:'에포크가 끝날 때마다 검증 손실을 보고, 엔진끼리 검증 평균 오차(회)로 견줍니다.',met:'120 에포크 · 9종 비교',loop:true},
   {id:'P11',name:'출고',cat:'f',href:'#ship',desc:'고른 엔진을 '+PRODUCT.name+'에 싣고, 가중치를 고정해 내보냅니다.',met:PRODUCT.name+' · 가중치 고정',who:['doc','doc_judge',1.0]},
   {id:'P12',name:'2편 시뮬레이션 검증장',cat:'x',href:'#ship',desc:'공사 중. 자율주행차 배터리 팩에 불량품 판정기와 수명 예측 장치를 달고, 봉인한 시험 셀과 주행 시뮬레이션으로 검증하는 곳입니다(2편).',met:'2편 준비 중 · 자율주행차 시험대',future:true}];
  var XS=[-10,-6,-2,2,6,10];PR.forEach(function(p,i){var row=i<6?0:1;p.x=row?XS[5-(i-6)]:XS[i];p.y=row?4.6:-4.6;p.by=row?2.4:-2.4;p.h=[1.3,1.3,1.6,1.9,2.4,2.4,1.6,1.7,2.0,1.6,1.8,2.2][i];});
  var CAT={d:['#f9dcda','#e8b1ad','#d79591'],a:['#dcf2e8','#a9dcc4','#8fcfb1'],m:['#efe0f6','#d6b7e6','#c39bd9'],v:['#dfeafb','#b4cdf2','#9ab9ea'],f:['#fbecd3','#ecc98f','#dfb46e'],x:['#f1f3f5','#e1e5ea','#d3d9e0']};
  /* 캐릭터는 동작 팩(CHAR_lab4 C8)의 전신 서기 프레임. 키 비율은 C3(박사 1.00 · 조수 0.90 · 주판봇 0.72 · 초파리 0.41), 인턴 둘은 조수에 맞춤 */
  var WHO_SHEET={doc:'D1',asst:'A1',sia:'S1',moa:'M1',fly:'F1',robo:'R1'},WHO_H={doc:1.0,asst:0.9,sia:0.88,moa:0.86,fly:0.41,robo:0.72};
  var IM={};PR.forEach(function(p){if(p.who){var im=new Image();im.src=U.spr(p.who[1]);IM[p.id]=im;}});
  var WP=[],EPL=6;function add(x,y,z,dur,st,ep){WP.push({x:x,y:y,z:z||0.45,d:dur,st:st==null?-1:st,ep:ep||0});}
  function belt(i){return [PR[i].x,PR[i].by];}
  add(-13.5,-2.4,0.45,0,-1,0);for(var i=0;i<6;i++){var b=belt(i);add(b[0],b[1],0.45,null,-1,0);add(b[0],b[1],0.45,1.1,i,0);}
  add(12.6,-2.4,0.45,null,-1,0);add(13.6,-1.2,0.45,null,-1,0);add(13.6,1.2,0.45,null,-1,0);add(12.6,2.4,0.45,null,-1,0);
  b=belt(6);add(b[0],b[1],0.45,null,-1,0);add(b[0],b[1],0.45,1.3,6,0);
  for(var e=1;e<=EPL;e++){for(i=7;i<10;i++){b=belt(i);add(b[0],b[1],0.45,null,-1,e-1);add(b[0],b[1],0.45,i===9?0.9:0.6,i,i===9?e:e-1);}
    if(e<EPL){add(-2,2.4,2.6,null,-1,e);add(6,2.4,2.6,null,-1,e);add(6,2.4,0.45,null,-1,e);}}
  for(i=10;i<12;i++){b=belt(i);add(b[0],b[1],0.45,null,-1,EPL);add(b[0],b[1],0.45,1.3,i,EPL);}add(-13.5,2.4,0.45,null,-1,EPL);add(-13.5,2.4,0.45,1.2,-2,EPL);
  var T=[0];for(i=1;i<WP.length;i++){var a=WP[i-1],q=WP[i];var dist=Math.hypot(q.x-a.x,q.y-a.y,q.z-a.z);q.dur=q.d!=null?q.d:dist/5.5;T.push(T[i-1]+q.dur);}var TT=T[T.length-1];
  function at(tt){tt=((tt%TT)+TT)%TT;for(var i=1;i<WP.length;i++){if(tt<=T[i]){var a=WP[i-1],q=WP[i],u=q.dur?(tt-T[i-1])/q.dur:1;return {x:a.x+(q.x-a.x)*u,y:a.y+(q.y-a.y)*u,z:a.z+(q.z-a.z)*u,st:q.d!=null?q.st:-1,i:i,ep:q.ep,dwell:q.d!=null&&q.st>=0};}}return {x:WP[0].x,y:WP[0].y,z:.45,st:-1,i:0,ep:0};}
  function lastStation(tt){tt=((tt%TT)+TT)%TT;var s=0;for(var i=1;i<WP.length;i++){if(T[i-1]>tt)break;if(WP[i].d!=null&&WP[i].st>=0)s=WP[i].st;}return s;}
  function firstDwell(k,after){for(var i=1;i<WP.length;i++)if(WP[i].d!=null&&WP[i].st===k&&T[i-1]>=(after||0)-1e-6)return T[i-1]+0.01;for(i=1;i<WP.length;i++)if(WP[i].d!=null&&WP[i].st===k)return T[i-1]+0.01;return 0;}
  var cx,cy,sc;function P(x,y,z){var c=Math.cos(yaw),s=Math.sin(yaw),rx=x*c-y*s,ry=x*s+y*c,cp=Math.cos(pitch),sp=Math.sin(pitch);return [cx+rx*sc,cy+(-z*cp-ry*sp)*sc,ry*cp-z*sp];}
  function fwd(){var c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return [s*cp,c*cp,-sp];}
  function poly(g,pts,fill,stroke,dash){g.beginPath();pts.forEach(function(p,k){k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){if(dash)g.setLineDash(dash);g.strokeStyle=stroke;g.stroke();g.setLineDash([]);}}
  function box(g,x,y,z0,w,d,h,cols,hl,dash){var F=fwd(),x0=x-w/2,x1=x+w/2,y0=y-d/2,y1=y+d/2,z1=z0+h;
    var faces=[[[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],0],[[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],1],[[0,1,0],[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],1],[[-1,0,0],[[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],2],[[1,0,0],[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],2]];
    g.lineWidth=hl?2.2:1;faces.forEach(function(f){var n=f[0];if(n[0]*F[0]+n[1]*F[1]+n[2]*F[2]>=0)return;poly(g,f[1].map(function(p){return P(p[0],p[1],p[2]);}),cols[f[2]],hl?C.gfp:'rgba(22,33,43,.35)',dash);});}
  function shade(hex,k){var n=parseInt(hex.slice(1),16),r=(n>>16)&255,g2=(n>>8)&255,b2=n&255;return 'rgb('+Math.round(r*k)+','+Math.round(g2*k)+','+Math.round(b2*k)+')';}
  function draw(dt){if(play&&dt)t+=dt*spd;var R=U.setup(cv),g=R.g,w=R.w,h=R.h;cx=w/2;cy=h*0.56;sc=Math.min(w/31,h/19);
    g.fillStyle='#fbfcfd';g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(22,33,43,.07)';g.lineWidth=1;for(var x=-15;x<=15;x+=1.5){var a=P(x,-7.5,0),b=P(x,7.5,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}for(var y=-7.5;y<=7.5;y+=1.5){a=P(-15,y,0);b=P(15,y,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
    function beltSeg(x0,y0,x1,y1){var dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),nx=-dy/L*0.55,ny=dx/L*0.55;poly(g,[P(x0+nx,y0+ny,0.3),P(x1+nx,y1+ny,0.3),P(x1-nx,y1-ny,0.3),P(x0-nx,y0-ny,0.3)],'#d9dee5','rgba(22,33,43,.25)');
      var off=(t*1.8)%1;g.strokeStyle='rgba(22,33,43,.18)';for(var s=off;s<L;s+=1){var px=x0+dx*s/L,py=y0+dy*s/L,p1=P(px+nx,py+ny,0.31),p2=P(px-nx,py-ny,0.31);g.beginPath();g.moveTo(p1[0],p1[1]);g.lineTo(p2[0],p2[1]);g.stroke();}}
    beltSeg(-13.5,-2.4,12.6,-2.4);beltSeg(12.6,-2.4,13.6,-1.2);beltSeg(13.6,-1.2,13.6,1.2);beltSeg(13.6,1.2,12.6,2.4);beltSeg(12.6,2.4,-13.5,2.4);
    var ar=[[-2,2.4,0.4],[-2,2.4,2.6],[6,2.4,2.6],[6,2.4,0.4]].map(function(p){return P(p[0],p[1],p[2]);});g.strokeStyle='rgba(19,115,58,.55)';g.lineWidth=4;g.setLineDash([10,6]);g.lineDashOffset=-t*20;g.beginPath();ar.forEach(function(p,k){k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.stroke();g.setLineDash([]);
    U.arrow2(g,ar[2][0],ar[2][1],ar[3][0],ar[3][1]+(ar[2][1]-ar[3][1])*0.3,'rgba(19,115,58,.8)',3);
    var pos=at(t),cur=lastStation(t),items=[],mounted=pos.i>0&&cur>=6&&!(cur===6&&pos.dwell&&false);
    PR.forEach(function(p,k){var cp=P(p.x,p.y,p.h/2);items.push({d:cp[2],f:function(){var on=pos.dwell&&pos.st===k,hl=sel===k||on;box(g,p.x,p.y,0,2.6,2.0,p.h,CAT[p.cat],hl,p.future?[5,4]:null);
      if(p.vault)box(g,p.x+1.0,p.y+(p.y<0?-0.2:0.2),p.h,0.7,0.7,0.6,['#eef2f6','#cfd6de','#b9c2cc'],false);
      if(p.shelf){var n=p.shelf.length;p.shelf.forEach(function(id,j){var col=ECOL[id];box(g,p.x-1.0+(j%4)*0.66,p.y-0.5+Math.floor(j/4)*0.7,p.h,0.46,0.46,0.42,[col,shade(col,0.8),shade(col,0.65)],id===SEL);});}
      if(p.future){var gr=['#e8edf2','#cdd5de','#b9c3ce'],dk=['#5b6874','#4a5560','#3d4650'];box(g,p.x,p.y,p.h,2.4,1.25,0.5,gr,false);box(g,p.x-0.15,p.y,p.h+0.5,1.3,1.05,0.42,['#f4f7fa','#dfe5eb','#cbd3dc'],false);
        [[-0.8,-0.66],[0.8,-0.66],[-0.8,0.66],[0.8,0.66]].forEach(function(o){box(g,p.x+o[0],p.y+o[1],p.h-0.05,0.48,0.14,0.36,dk,false);});box(g,p.x-0.15,p.y,p.h+0.92,0.3,0.3,0.2,['#13a0aa','#0b7a86','#0a6670'],false);}
      if(p.mini){for(var j=0;j<10;j++){var on2=on&&Math.floor(t*6)%10===j;box(g,p.x-1.05+(j%5)*0.52,p.y-0.45+Math.floor(j/5)*0.6,p.h,0.38,0.38,0.22,on2?['#13733a','#0f5c2e','#0c4a25']:['#fff','#e7d3f0','#d6b7e6'],false);}}
      if(on){var top=P(p.x,p.y,p.h),bt=P(p.x,p.by,0.45);g.strokeStyle='rgba(163,92,0,.55)';g.lineWidth=3;g.setLineDash([4,4]);g.beginPath();g.moveTo(top[0],top[1]);g.lineTo(bt[0],bt[1]);g.stroke();g.setLineDash([]);}
      var tp=P(p.x,p.y,p.h+(p.future?1.5:p.shelf||p.mini?0.9:0.5)),done=k<=cur;g.beginPath();g.arc(tp[0],tp[1],11,0,7);g.fillStyle=hl?C.gfp:done?'#e7f5ec':'#fff';g.fill();g.lineWidth=1.5;g.strokeStyle=hl?C.gfp:C.rule;g.stroke();
      g.fillStyle=hl?'#fff':C.text;g.font='700 10.5px '+cssv('--font');g.textAlign='center';g.textBaseline='middle';g.fillText(String(k+1),tp[0],tp[1]+0.5);g.textBaseline='alphabetic';
      if(hl||w>700||(w<600&&k===cur)){g.font=(hl?'700 ':'')+'11px '+cssv('--font');var lb=P(p.x,p.y,p.h+(p.future?2.1:p.shelf||p.mini?1.55:1.15));U.label(g,lb[0],lb[1],p.name,hl?C.gfp:p.future?'#8a95a1':C.muted,'center');}}});
      if(p.who){var fp=P(p.x+1.75,p.y,0);items.push({d:fp[2]-0.01,f:function(){var mk=WHO_SHEET[p.who[0]],hh=sc*(w<600?6.0:5.0)*WHO_H[p.who[0]];
        if(typeof drawMotion==='function'&&mk&&drawMotion(g,mk,'idle',t,fp[0],fp[1],hh,{fps:4}))return;  /* 전신 동작 팩(서기) — 없으면 표정 그림 */
        var im=IM[p.id];if(!im||!im.complete||!im.naturalWidth)return;var sz=sc*(w<600?4.2:3.4)*Math.max(0.6,p.who[2]);g.drawImage(im,fp[0]-sz/2,fp[1]-sz,sz,sz);}});}});
    var pp=P(pos.x,pos.y,pos.z),hasEng=cur>=6&&pos.i>WP.findIndex(function(q){return q.st===6&&q.d!=null;});
    items.push({d:pp[2]-0.02,f:function(){var s=sc*0.8,prog=Math.min(1,pos.ep/EPL);
      g.fillStyle='#fff';g.strokeStyle=C.text;g.lineWidth=1.5;g.beginPath();g.roundRect?g.roundRect(pp[0]-s,pp[1]-s*1.3,s*2,s*1.1,4):g.rect(pp[0]-s,pp[1]-s*1.3,s*2,s*1.1);g.fill();g.stroke();
      batt(g,pp[0]-s*0.5,pp[1]-s*0.75,s*0.32,false);
      if(hasEng){g.fillStyle=ECOL[SEL];g.fillRect(pp[0]+s*0.05,pp[1]-s*1.1,s*0.8,s*0.7);g.strokeStyle='#fff';g.lineWidth=1.2;g.strokeRect(pp[0]+s*0.05,pp[1]-s*1.1,s*0.8,s*0.7);
        g.fillStyle='rgba(19,115,58,'+(0.25+0.75*prog)+')';g.fillRect(pp[0]-s,pp[1]-s*0.22,s*2*prog,s*0.12);
        var fx=pp[0],fy=pp[1]-s*1.3-s*0.28;g.fillStyle='#fff';g.strokeStyle=C.text;g.lineWidth=1.2;g.beginPath();g.roundRect?g.roundRect(fx-s*0.5,fy-s*0.26,s,s*0.4,3):g.rect(fx-s*0.5,fy-s*0.26,s,s*0.4);g.fill();g.stroke();
        if(PRODUCT.key==='judge'){[['#13733a',-0.2],['#c9302c',0.2]].forEach(function(l,k){g.beginPath();g.arc(fx+s*l[1],fy-s*0.06,s*0.11,0,7);g.fillStyle=l[0];g.globalAlpha=(Math.floor(t*1.5)%2===k)?1:0.3;g.fill();g.globalAlpha=1;});}
        else{g.strokeStyle=C.info;g.lineWidth=1.5;g.beginPath();g.arc(fx,fy+s*0.08,s*0.26,Math.PI,2*Math.PI);g.stroke();var an=Math.PI*(1.15+0.7*prog);g.strokeStyle=C.eye;g.lineWidth=1.8;g.beginPath();g.moveTo(fx,fy+s*0.08);g.lineTo(fx+Math.cos(an)*s*0.24,fy+s*0.08+Math.sin(an)*s*0.24);g.stroke();}
        if(cur>=10){g.font='700 11px '+cssv('--font');U.label(g,pp[0],pp[1]+s*0.45,PRODUCT.name,C.amber,'center');}}
      else{g.strokeStyle='rgba(91,104,116,.6)';g.setLineDash([3,2]);g.strokeRect(pp[0]+s*0.05,pp[1]-s*1.1,s*0.8,s*0.7);g.setLineDash([]);}}});
    items.sort(function(a,b){return b.d-a.d;}).forEach(function(it){it.f();});
    var mid=P(2,2.4,2.9);U.label(g,mid[0],mid[1]-8,'시운전·정비 고리 · 에포크 '+Math.min(EP,Math.round(pos.ep*EP/EPL))+' / '+EP,C.gfp,'center');
    var st0=P(-14.2,-2.4,0.6),en=P(-14.2,2.4,0.6);U.label(g,st0[0],st0[1]-12,'셀 입고 →',C.eye,'center');U.label(g,en[0],en[1]-12,'← 출고',C.amber,'center');
    U.stamp(g,w,'개략 모형 · 실제 공장 아님');
    card(sel>=0?sel:cur,pos);}
  var lastCard='';
  function card(k,pos){var p=PR[k],ep=Math.min(EP,Math.round(pos.ep*EP/EPL)),hc=M.hc,key=k+'|'+ep+'|'+(sel>=0)+'|'+SEL;if(key===lastCard)return;lastCard=key;
    $('#pc-no').textContent=p.id+' / 12'+(p.loop?' · 시운전·정비 고리':'')+(sel>=0?' · 고른 공정':'');$('#pc-name').textContent=p.name;$('#pc-desc').textContent=p.desc;
    $('#pc-metric').textContent='이 공정의 숫자: '+(k===6?'장착 엔진: '+engName(SEL):p.met);
    $('#pc-link').innerHTML='<a href="'+p.href+'">'+(p.future?'출고·2편 예고로 가기 →':'해당 섹션으로 가기 →')+'</a>'+(k===8?' '+lamp(Object.keys(QS).filter(function(q){return QS[q]==='ok';}).length===10?'ok':'run'):'');
    var e2=k>=7?ep:0,fin=k>=10,b=BENCH[SEL];
    $('#fac-minis').innerHTML=mini('a','공정',(k+1)+' / 12')+mini('','DFF 정비 에포크',(fin?EP:e2)+' / '+EP)+mini('','DFF 훈련 · 검증 손실',fmt(hc[fin?EP:e2][1],3)+' · '+fmt(hc[fin?EP:e2][2],3))+mini('g','장착 엔진 · 검증 오차',b?engName(SEL)+' · '+fmt(b.v.mae,1)+'회':'—');
    $$('#pchips button').forEach(function(bb,i){bb.classList.toggle('on',i===k);bb.classList.toggle('done',i<k);});}
  Fac.refresh=function(){lastCard='';if(!play)draw(0);};
  $('#pchips').innerHTML=PR.map(function(p){return '<button type="button">'+p.id+' '+p.name+'</button>';}).join('');
  $$('#pchips button').forEach(function(b,i){b.onclick=function(){sel=-1;t=firstDwell(i);lastCard='';draw(0);};});
  var pb=$('#f-play');function setPlay(v){play=v;pb.textContent=v?'⏸ 멈춤':'▶ 재생';}setPlay(play);
  pb.onclick=function(){sel=-1;setPlay(!play);};
  $('#f-step').onclick=function(){sel=-1;setPlay(false);var k=(lastStation(t)+1)%12;t=firstDwell(k,t);lastCard='';draw(0);};
  $('#f-reset').onclick=function(){sel=-1;t=0;lastCard='';draw(0);};
  U.btns($('#g-fspd'),[[0.5,'0.5×'],[1,'1×'],[2,'2×'],[4,'4×']],1,function(v){spd=v;});
  U.btns($('#g-fview'),[['a','비스듬히'],['t','위에서'],['l','낮게'],['L','⟲'],['R','⟳']],'a',function(v){if(v==='a'){yaw=-0.5;pitch=0.82;}else if(v==='t'){yaw=0;pitch=1.45;}else if(v==='l'){yaw=-0.75;pitch=0.32;}else if(v==='L')yaw-=0.35;else yaw+=0.35;draw(0);});
  var drag=null;cv.style.touchAction='pan-y';cv.style.cursor='grab';
  cv.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,yaw:yaw,pitch:pitch,mv:false};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.mv=true;if(drag.mv){yaw=drag.yaw+dx*0.008;pitch=clamp(drag.pitch+dy*0.006,0.15,1.5);if(!play)draw(0);}});
  cv.addEventListener('pointerup',function(e){if(drag&&!drag.mv){var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,best=-1,bd=900;PR.forEach(function(p,k){[p.h+0.5,p.h*0.5].forEach(function(z){var q=P(p.x,p.y,z),d=(q[0]-mx)*(q[0]-mx)+(q[1]-my)*(q[1]-my);if(d<bd){bd=d;best=k;}});});
      if(best>=0){sel=best;lastCard='';draw(0);}}drag=null;});
  cv.addEventListener('pointercancel',function(){drag=null;});
  cv.tabIndex=0;cv.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')yaw-=0.12;else if(e.key==='ArrowRight')yaw+=0.12;else if(e.key==='ArrowUp')pitch=clamp(pitch+0.1,0.15,1.5);else if(e.key==='ArrowDown')pitch=clamp(pitch-0.1,0.15,1.5);else return;e.preventDefault();draw(0);});
  U.reg(cv,function(dt){if(dt===0||play)draw(dt);});
})();


/* ══ 용어 ══ */
U.Gloss({
 '파라미터':['파라미터','학습','모델 안에서 데이터로부터 배우는 숫자. 가중치와 편향. 이 페이지의 DFF 엔진은 49개.'],
 '가중치':['가중치 (weight)','학습','입력 신호를 몇 배로 키울지(부호 포함) 정하는 숫자. w로 적는다.'],
 '편향':['편향 (bias)','학습','가중합에 더해 출력을 밀어 올리거나 내리는 숫자. b로 적는다.'],
 '하이퍼파라미터':['하이퍼파라미터','설정','학습 전에 사람이 정하는 숫자. 학습률, 배치 크기, 에포크, 은닉 뉴런 수, λ 등.'],
 '활성값':['활성값 (activation)','계산','입력이 들어올 때마다 층을 지나며 새로 계산되는 값. 저장된 파라미터가 아니다.'],
 '손실':['손실 (loss)','학습','예측이 정답에서 얼마나 벗어났는지 재는 벌점. 학습은 이것을 줄이는 일.'],
 '평균제곱오차':['평균제곱오차 (MSE)','손실','회귀의 손실. (예측 − 정답)²의 평균. 크게 틀린 셀에 벌점이 제곱으로 커진다.'],
 '평균 절대 오차':['평균 절대 오차 (MAE)','지표','예측이 실제에서 평균 몇 회 벗어났는지. 낮을수록 좋다.'],
 'R²':['R² (결정계수)','지표','수명의 흩어짐 가운데 엔진이 설명한 몫. 1이면 완벽, 0이면 평균만 말하는 것과 같고, 음수면 그보다 못하다.'],
 'RMSE':['RMSE','지표','제곱 오차 평균의 제곱근(회). 크게 틀린 셀을 MAE보다 무겁게 친다.'],
 '잡음 바닥':['잡음 바닥','개념','측정값으로 설명할 수 없는 잡음 때문에 어떤 엔진도 내려갈 수 없는 오차 수준. 이 모형에서는 평균 오차 약 24회.'],
 '보상 모델':['보상 모델','생성 AI','언어 모델의 답마다 점수 하나를 매기는 회귀 모델. 사람 선호에 맞추는 학습에 쓴다.'],
 '회귀':['회귀','과제','확률이나 반 대신 숫자(여기서는 수명, 회)를 맞히는 과제.'],
 '과대예측':['과대예측','개념','실제보다 크게(여기서는 수명을 길게) 말한 예측. 보증·교체 판단에서 더 비쌀 수 있다.'],
 '역전파':['역전파 (backpropagation)','학습','손실에서 거꾸로 층을 지나며 연쇄 법칙으로 모든 파라미터의 기울기를 구하는 방법.'],
 '기울기':['기울기 (gradient)','학습','파라미터를 아주 조금 바꿀 때 손실이 변하는 비율 ∂L/∂w. 손실이 커지는 방향을 가리킨다.'],
 '기울기 검사':['기울기 검사','점검','역전파로 구한 기울기와, 값을 직접 조금 흔들어 잰 기울기를 비교해 코드를 확인하는 일.'],
 '학습률':['학습률 η','설정','한 걸음에 기울기의 몇 배만큼 움직일지. 크면 튀고 작으면 느리다.'],
 '경사하강법':['경사하강법','최적화','기울기의 반대 방향으로 조금씩 움직여 손실을 줄이는 방법.'],
 'Adam':['Adam','최적화','기울기의 평균(m)과 크기(v)를 기억해 파라미터마다 보폭을 맞추는 옵티마이저.'],
 '미니배치':['미니배치','학습','한 스텝에 쓰는 데이터 묶음. 기울기는 묶음 안의 평균.'],
 '에포크':['에포크','학습','훈련 데이터를 한 바퀴 다 도는 일.'],
 '검증 데이터':['검증 데이터','평가','학습에 쓰지 않고, 설정을 고르고 멈출 때를 정하는 데 쓰는 데이터.'],
 '시험 데이터':['시험 데이터','평가','마지막 점수를 한 번만 재기 위해 봉인해 두는 데이터.'],
 '과적합':['과적합','평가','훈련 데이터를 외워서, 처음 보는 데이터에서 오히려 틀리는 상태.'],
 '미세조정':['미세조정 (fine-tuning)','학습','이미 배운 모델에서 출발해 새 데이터로 조금 더 고치는 일.'],
 '사전학습':['사전학습','학습','큰 데이터로 먼저 배워 두는 단계. 미세조정의 출발점.'],
 'LoRA':['LoRA','미세조정','원래 가중치는 잠그고, 낮은 순위의 작은 보정 행렬만 배우는 미세조정 방법.'],
 '표준화':['표준화','전처리','평균을 빼고 표준편차로 나눠 눈금을 맞추는 일. 훈련 데이터의 통계로만 한다. 회귀에서는 정답(수명)도 표준화한다.'],
 '시그모이드':['시그모이드 σ','함수','σ(z) = 1/(1+e^(−z)). 어떤 수든 0~1로 바꾼다. 회귀 출력에는 걸지 않는다.'],
 'tanh':['tanh','함수','−1~1로 눌러 주는 S자 함수. 이 페이지의 은닉층 활성화.'],
 '데이터세트':['데이터세트','데이터','모델이 배우고 평가받는 표. 여기서는 셀 1,000개 × 측정값 4개 + 수명.'],
 '선형 회귀':['선형 회귀','엔진','측정값의 가중합 하나로 숫자를 맞히는 엔진. 오차 제곱합이 가장 작은 평면.'],
 '릿지':['릿지 회귀','엔진','선형 회귀에 기울기 크기의 제곱 벌점(L2)을 더해, 데이터가 적을 때 덜 흔들리게 한 엔진.'],
 '라쏘':['라쏘 회귀','엔진','기울기 절댓값 벌점(L1)으로 쓸모없는 특징의 기울기를 0으로 만드는 엔진.'],
 '회귀 트리':['회귀 트리','엔진','질문으로 데이터를 나누고 칸마다 평균을 답하는 엔진. 예측 지형이 계단 모양.'],
 '랜덤 포레스트':['랜덤 포레스트','엔진','조금씩 다른 데이터로 키운 트리 여러 그루의 평균.'],
 '부스팅':['그래디언트 부스팅','엔진','앞 트리가 남긴 잔차를 다음 트리가 맞히며 차례로 더하는 앙상블.'],
 '가우시안 프로세스':['가우시안 프로세스','엔진','"비슷한 입력은 비슷한 출력"을 커널로 표현하는 확률 모델. 예측과 불확실성을 함께 낸다.'],
 '예측 지형':['예측 지형','개념','입력 공간 곳곳에서 엔진이 내는 예측값을 색으로 칠한 지도.'],
 'σ':['σ','기호','시그모이드 함수. 문맥에 따라 표준편차를 뜻하기도 한다(이 페이지의 "+1.5σ").'],
 'η':['η (에타)','기호','학습률.'],
 '∂':['∂','기호','편미분. 다른 값은 그대로 두고 하나만 바꿀 때의 변화율.']
},['파라미터','가중치','편향','하이퍼파라미터','활성값','손실','평균제곱오차','역전파','기울기','학습률','미니배치','에포크','과적합']);

U.Study({quiz:{
 bench:[{q:'1위와 2위 엔진의 평균 오차 차이가 약 1회이고, 나눌 때마다 흔들리는 폭이 1.8회라면?',o:['순위를 믿기 어렵다 — 비슷하다고 본다','1위가 확실히 낫다','편차는 무시해도 된다','검증 셀을 줄이면 해결된다'],a:0,why:'차이가 흔들림보다 작으면 다시 나눌 때 순위가 뒤집힐 수 있습니다.',hint:'1과 1.8을 견줘 보세요.'},
        {q:'회귀 엔진의 성적표에서 "R² = 0"의 뜻은?',o:['늘 평균 수명만 말하는 엔진과 같은 수준','완벽하게 맞힌다','오차가 0회','엔진이 고장 났다'],a:0,why:'R²는 평균만 말하기에 비해 흩어짐을 얼마나 줄였는지입니다. 0이면 줄인 것이 없습니다.',hint:'R²의 기준선이 무엇인지 떠올려 보세요.'}],
 w1:[{q:'회귀 출력층이 분류 출력층과 다른 점은?',o:['시그모이드 없이 가중합을 그대로 낸다','가중치가 없다','편향이 없다','입력을 받지 않는다'],a:0,why:'수명처럼 범위가 정해지지 않은 숫자를 내야 하므로, 0~1로 누르는 시그모이드를 걸지 않습니다.',hint:'"몇 회"를 0~1로 낼 수 있을까요?'}],
 w2:[{q:'w₁ = 0.5, w₂ = −1.0, b = 0.2, 입력 (2, 3)이면 수명 점수 z는?',o:['−1.8 (짧다)','1.8 (오래 간다)','−2.0','4.2'],a:0,why:'0.5×2 − 1.0×3 + 0.2 = −1.8. 음수이므로 "수명이 짧다"이고, 아주 뜨거운 이 셀에는 맞는 답입니다.',hint:'곱해서 모두 더한 뒤 b를 더해요.'}],
 w3:[{q:'길들인 엔진에 다른 셀을 넣으면 바뀌는 것은?',o:['은닉층 활성값','W₁의 값','b₂의 값','파라미터 개수'],a:0,why:'파라미터는 고정이고, 입력에 따라 활성값만 새로 계산됩니다.',hint:'엔진의 부품과 지나가는 연료 중 무엇이 바뀔까요?'}],
 w4:[{q:'입력 4 → 은닉 8 → 출력 1 엔진의 파라미터 수는?',o:['49','44','40','41'],a:0,why:'(4×8 + 8) + (8×1 + 1) = 40 + 9 = 49. 분류든 회귀든 같습니다.',hint:'층마다 입력×출력 + 출력(편향).'}],
 w5:[{q:'수명을 100회 틀리던 예측이 200회 틀리면 제곱 손실은 몇 배?',o:['4배','2배','같다','8배'],a:0,why:'(200)² ÷ (100)² = 4. 제곱 손실은 크게 틀린 셀을 훨씬 무겁게 벌줍니다.',hint:'두 배를 제곱해 보세요.'}],
 w6:[{q:'기울기 검사에서 역전파 값과 직접 잰 값이 크게 다르면?',o:['역전파 코드의 버그를 의심한다','학습률을 키운다','데이터를 늘린다','에포크를 늘린다'],a:0,why:'기울기 검사는 미분 코드가 맞는지 보는 검사입니다. 어긋나면 코드부터 봅니다.',hint:'이 검사가 무엇을 확인하는지 떠올려 보세요.'}],
 w8:[{q:'훈련 셀 600개, 배치 32면 1 에포크는 몇 스텝일까요?',o:['19','18','32','600'],a:0,why:'600 ÷ 32 = 18.75이므로 마지막 작은 배치까지 19스텝.',hint:'나누고 올림해요.'}],
 w9:[{q:'공장 A로 배운 엔진을 공장 B 셀에 그대로 쓰면 어떤 실수를 주로 할까요?',o:['수명을 실제보다 길게 말한다 (과대예측)','늘 정확하다','수명을 0으로 말한다','파라미터가 바뀐다'],a:0,why:'공장 B 셀은 뜨거워지기 쉬워 수명이 짧은데, 엔진은 공장 A의 습관대로 말하므로 길게 틀립니다.',hint:'⑨ 표의 "그대로 쓰기" 줄을 보세요.'}],
 w10:[{q:'훈련 오차는 계속 줄고 검증 오차가 다시 오르기 시작하면?',o:['과적합 — 검증 기준으로 멈추거나 엔진을 줄인다','학습률을 키운다','시험 데이터로 설정을 다시 고른다','정상이니 끝까지 돈다'],a:0,why:'처음 보는 데이터에서 나빠지는 것은 외우기 시작했다는 신호입니다.',hint:'시험 데이터는 2편에서 한 번만.'},
      {q:'배포한 뒤 셀을 넣어 수명을 예측하면 가중치는?',o:['그대로 고정','예측마다 조금씩 바뀐다','셀 수만큼 늘어난다','매일 자동으로 학습된다'],a:0,why:'일반적인 추론은 가중치를 읽기만 합니다. 바뀌는 것은 활성값입니다.',hint:'⑩의 지문 비교를 떠올려 보세요.'}],
 duel:[{q:'다음 중 회귀 문제는?',o:['셀이 몇 번 충·방전을 견딜지 맞히기','셀이 불량인지 양품인지 가리기','셀 사진에서 흠집이 있는지 가리기','셀을 세 등급(A·B·C) 중 하나로 나누기'],a:0,why:'정해진 반 가운데 하나를 고르면 분류, 숫자 자체를 맞히면 회귀입니다. 등급 나누기는 숫자처럼 보여도 반을 고르는 분류입니다.',hint:'답이 "반"인지 "숫자"인지 보세요.'},
       {q:'이 대결이 말해 주는 것은?',o:['정답 셀이 적으면 단순한 엔진, 많으면 굽은 관계를 담는 엔진이 유리했다','큰 엔진이 늘 낫다','작은 엔진은 쓸모없다','부스팅은 데이터 양과 상관없이 이긴다'],a:0,why:'셀 40개에서는 릿지가, 600개에서는 부스팅이 10번 모두 이겼습니다. 엔진 선택은 데이터 양에 달려 있습니다.',hint:'두 가정의 결과를 나란히 보세요.'}]
}});

/* 처음 화면: 장착 엔진(신경망) 시운전 + 나머지는 조금씩 */
fitEngine('mlp');shelf();mount();benchTable();
(function(){var rest=ER.LIST.map(function(e){return e.id;}).filter(function(id){return id!=='mlp';}),i=0;
  function next(){if(i>=rest.length){$('#b-prog').textContent='완료 · 9종';shelf();benchTable();setTimeout(function(){runRep(function(){shelf();shipUI();});},400);return;}fitEngine(rest[i++]);$('#b-prog').textContent='자동 시운전 '+(i+1)+' / 9';if(i%3===0){shelf();benchTable();}setTimeout(next,60);}
  setTimeout(next,300);})();
U.start();
})();
