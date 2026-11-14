/* page.js — 「배터리 불량품 판정기 ① 엔진부 제작」 페이지 스크립트 (IIFE 하나) */
(function(){
'use strict';
var $=U.$,$$=U.$$,fmt=U.fmt,cssv=U.cssv,clamp=U.clamp;
var C={eye:cssv('--eye'),gfp:cssv('--gfp'),stain:cssv('--stain'),amber:cssv('--amber'),info:cssv('--info'),muted:cssv('--muted'),text:cssv('--text'),rule:cssv('--rule'),terrain:cssv('--terrain')};
function n0(x){return Math.round(x).toLocaleString('ko-KR');}
function mini(cls,label,val){return '<div class="mini '+(cls||'')+'"><span>'+label+'</span><b>'+val+'</b></div>';}

/* ══ 데이터세트: 공장 A 셀 1,000개 · 공장 B 셀 400개 ══ */
var D=BM.makeCells(2026,1000,0),SP=BM.split(D,7),S=BM.stats(D,SP.tr);
var TR=BM.view(D,SP.tr,S),VA=BM.view(D,SP.va,S),TE=BM.view(D,SP.te,S);
var DB=BM.makeCells(3031,400,1),SPB=BM.split(DB,9,[0.075,0.35]);
var TRB=BM.view(DB,SPB.tr,S),VAB=BM.view(DB,SPB.va,S);
var H0=8,EP=120,TGT={f1:0.80,mem:8192,l0:0.25,gc:1e-5};
var defRate=D.yc.reduce(function(a,b){return a+b;},0)/D.n;
var PRODUCT={key:'judge',name:'배터리 불량품 판정기'};  /* 이 공장의 제품 (회귀 편: 수명 예측 장치) */
var ECOL={logit:'#5b6874',tree:'#8f5a2e',rf:'#1f7a52',boost:'#a35c00',svm:'#1e55c8',nb:'#9b3fb5',knn:'#0b7a86',mlp:'#c42a6e',ae:'#c9302c'};

/* ══ 현황판: 정비 작업장 10곳 ══ */
var WS=[
 {n:1,name:'부품 창고',card:'01',m:'출력 검사 4칸',crit:'셀 A·B의 y₁·y₂ 판정 4칸 모두 맞음',proc:'P9'},
 {n:2,name:'뉴런 조립대',card:'02',m:'판정 검사 2셀',crit:'불량 셀 z > 0, 양품 셀 z < 0',proc:'P9'},
 {n:3,name:'설계도실',card:'03',m:'파라미터·활성값 변화',crit:'셀 2개 이상: 파라미터 변화 0, 활성값 변화 > 0',proc:'P3·P9'},
 {n:4,name:'계량실',card:'04',m:'가중치 메모리',crit:'BMS 예산 8 KB 이하 (예시값)',proc:'P9'},
 {n:5,name:'첫 시동',card:'05',m:'초기 손실',crit:'초기 손실이 ln 2 ± 0.25',proc:'P8'},
 {n:6,name:'원인 추적실',card:'06',m:'기울기 검사',crit:'최대 상대 오차 < 0.00001',proc:'P9'},
 {n:7,name:'조정대',card:'07',m:'걸음 뒤 손실',crit:'손실이 줄고 발산하지 않음',proc:'P9'},
 {n:8,name:'길들이기 라인',card:'08',m:'검증 F1',crit:'F1 ≥ 0.80 (예시 기준)',proc:'P8~P10'},
 {n:9,name:'개조 공정',card:'09',m:'공장 B 검증 F1',crit:'어댑터 F1 > 그대로 쓰기, 학습 값 < 49',proc:'P9'},
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

/* ══ 정비 중인 DFF 엔진 (⑧이 만든다) ══ */
var M={cls:null,hc:null,f1h:null,ec:0,steps:0};
var W8={batch:32,opt:'adam',lr:0.01,running:false,jc:null};
function job8(){return BM.job({kind:'cls',H:H0,seed:11,epochs:EP,tr:TR,va:VA,opt:W8.opt,lr:W8.lr,batch:W8.batch,track:1});}
function adopt(J){M.cls=J.best.P;M.ec=J.best.e;M.hc=J.hist;M.f1h=J.f1;M.steps=J.steps;M.vc=BM.evalCls(M.cls,VA);}
var DEF=job8().run(EP);adopt(DEF);var CLSA=DEF.best.P;

/* ══ 엔진 9종 · 벤치 ══ */
var BENCH={},SEL='mlp',KN={};EN.LIST.forEach(function(e){KN[e.id]=Object.assign({},e.def);});
function fitEngine(id){var e=EN.LIST.filter(function(x){return x.id===id;})[0],o=Object.assign({},KN[id]);
  var t0=performance.now(),Mo=e.fit(TR,o,11),ms=performance.now()-t0,v=EN.evalP(Mo,VA),tr=EN.evalP(Mo,TR);
  var t1=performance.now();for(var i=0;i<VA.n;i++)Mo.p(VA.x[i]);var us=(performance.now()-t1)*1000/VA.n;
  BENCH[id]={e:e,M:Mo,v:v,tr:tr,ms:ms,us:us,size:Mo.size,knob:JSON.stringify(KN[id])};return BENCH[id];}
/* 5번 나눠 다시 재기: 훈련·검증 800개를 섞어 600 · 200으로 (시험 200은 그대로 봉인) */
var REP={},POOL=SP.tr.concat(SP.va);
function splitK(k){var ids=BM.shuffle(POOL.slice(),BM.rng(1000+k)),tr=ids.slice(0,600),va=ids.slice(600),Sk=BM.stats(D,tr);return {tr:BM.view(D,tr,Sk),va:BM.view(D,va,Sk)};}
var SPLITS=null;function splits(){if(!SPLITS){SPLITS=[];for(var k=0;k<10;k++)SPLITS.push(splitK(k));}return SPLITS;}
function runRep(done){var jobs=[];EN.LIST.forEach(function(e){if(REP[e.id]&&REP[e.id].a.length===5)return;REP[e.id]={a:[]};for(var k=0;k<5;k++)jobs.push([e,k]);});var i=0;
  (function step(){if(i>=jobs.length){$('#b-rprog').textContent='완료 · 9종 × 5번';benchTable();done&&done();return;}var j=jobs[i++],sp=splits()[j[1]];REP[j[0].id].a.push(EN.evalP(j[0].fit(sp.tr,Object.assign({},j[0].def),11),sp.va).f1);
    var a=REP[j[0].id].a;if(a.length===5){var m=a.reduce(function(x,y){return x+y;},0)/5;REP[j[0].id].m=m;REP[j[0].id].sd=Math.sqrt(a.reduce(function(x,y){return x+(y-m)*(y-m);},0)/4);benchTable();}
    $('#b-rprog').textContent=j[0].name+' '+(j[1]+1)+'번째 · '+i+' / '+jobs.length;setTimeout(step,20);})();}
function repDone(){return EN.LIST.every(function(e){return REP[e.id]&&REP[e.id].m!=null;});}
function engName(id){return EN.LIST.filter(function(x){return x.id===id;})[0].name;}
function shelf(){['ml','nn'].forEach(function(bk){var h=$('#shelf-'+bk),html=EN.LIST.filter(function(e){return e.book===bk;}).map(function(e){var b=BENCH[e.id];
    return '<button type="button" class="eng" data-id="'+e.id+'" aria-pressed="'+(e.id===SEL)+'"><span class="sc">'+(b?'F1 '+fmt(b.v.f1,3):'')+'</span><b><span class="chip" style="background:'+ECOL[e.id]+'"></span>'+e.name+'</b><small>'+e.fam+'</small><p>'+e.one+'</p></button>';}).join('');
    if(bk==='nn')html+=[['CNN (DCN)','이미지 엔진','셀 외관 사진이 들어오면 꺼낸다.'],['LSTM · GRU','시계열 엔진','충·방전 곡선이 들어오면 꺼낸다.']].map(function(x){return '<div class="eng off" aria-disabled="true"><b><span class="chip" style="background:#c9cfd6"></span>'+x[0]+'</b><small>'+x[1]+' · 이번엔 창고 보관</small><p>'+x[2]+'</p></div>';}).join('');
    h.innerHTML=html;});
  $$('.eng[data-id]').forEach(function(b){b.onclick=function(){SEL=b.dataset.id;mount();shelf();Fac.refresh&&Fac.refresh();document.getElementById('mount').scrollIntoView({behavior:U.reduce?'auto':'smooth'});};});}
var THR=0.5,COST=10;
function evalT(Mo,V,t){var tp=0,fp=0,tn=0,fn=0;for(var i=0;i<V.n;i++){var hh=Mo.p(V.x[i])>=t?1:0,y=V.yc[i];if(hh&&y)tp++;else if(hh)fp++;else if(y)fn++;else tn++;}var pr=tp+fp?tp/(tp+fp):0,rc=tp+fn?tp/(tp+fn):0;return {acc:(tp+tn)/V.n,prec:pr,rec:rc,f1:pr+rc?2*pr*rc/(pr+rc):0,tp:tp,fp:fp,tn:tn,fn:fn};}
function costUI(){var b=BENCH[SEL];if(!b)return;var v=evalT(b.M,VA,THR),c=v.fn*COST+v.fp,best=null;for(var t=0.05;t<0.951;t+=0.05){var w=evalT(b.M,VA,t),cc=w.fn*COST+w.fp;if(!best||cc<best.c)best={t:t,c:cc};}
  cm($('#m-cm'),v);$('#m-cost').innerHTML=mini('','문턱 '+fmt(THR,2)+' · 놓침 · 헛경보',v.fn+' · '+v.fp)+mini('','재현율 · 정밀도',fmt(v.rec,3)+' · '+fmt(v.prec,3))+mini('r','총비용 (놓침×'+COST+' + 헛경보)',n0(c))+mini('g','이 비용에서 가장 싼 문턱',fmt(best.t,2)+' (비용 '+n0(best.c)+')');drawMap();}
$('#r-thr').oninput=function(){THR=+this.value;$('#v-thr').textContent=THR.toFixed(2);costUI();};
$('#r-cost').oninput=function(){COST=+this.value;$('#v-cost').textContent=COST+'배';costUI();};
function cm(el,v){el.innerHTML='<div class="h"></div><div class="h">실제 불량</div><div class="h">실제 양품</div><div class="h">불량이라 함</div><div class="g">'+v.tp+' 잡음</div><div class="r">'+v.fp+' 헛경보</div><div class="h">양품이라 함</div><div class="r">'+v.fn+' 놓침</div><div class="g">'+v.tn+' 맞음</div>';}
var mapCv=$('#cvMap');
function mount(){var e=EN.LIST.filter(function(x){return x.id===SEL;})[0],b=BENCH[SEL];if(!b||b.knob!==JSON.stringify(KN[SEL]))b=fitEngine(SEL);
  $('#m-title').textContent='장착한 엔진 — '+e.name+' ('+(e.book==='ml'?'머신러닝 도감':'신경망 도감')+' · '+e.fam+')';
  var kh=$('#m-knob');if(e.knob){var k=e.knob,v=KN[SEL][k[0]];kh.innerHTML='<label class="glabel" for="r-knob">'+k[1]+'</label><input type="range" id="r-knob" min="'+k[2]+'" max="'+k[3]+'" step="'+k[4]+'" value="'+v+'"><span class="val" id="v-knob">'+v+'</span>';
    $('#r-knob').oninput=function(){KN[SEL][k[0]]=+this.value;$('#v-knob').textContent=this.value;};}else kh.innerHTML='<span class="glabel">이 엔진은 돌릴 손잡이가 없습니다 (기본 설정)</span>';
  $('#m-info').textContent='엔진 속: '+b.M.info;
  $('#m-minis').innerHTML=mini(b.v.f1>=TGT.f1?'g':'','검증 F1',fmt(b.v.f1,3))+mini('','정확도 · 재현율',fmt(b.v.acc,3)+' · '+fmt(b.v.rec,3))+mini(b.tr.f1-b.v.f1>0.1?'r':'','훈련 F1 (차이)',fmt(b.tr.f1,3)+' ('+(b.tr.f1-b.v.f1>=0?'+':'')+fmt(b.tr.f1-b.v.f1,3)+')')+mini('m','저장 값 · 학습 시간',n0(b.size)+'개 · '+fmt(b.ms,0)+' ms');
  var gap=b.tr.f1-b.v.f1;U.ins($('#i-mount'),[[b.v.f1>=TGT.f1?'g':'a',e.name+' 엔진: 검증 F1 '+fmt(b.v.f1,3)+', 놓친 불량 '+b.v.fn+'개 · 헛경보 '+b.v.fp+'개.'],[gap>0.1?'r':'g',gap>0.1?'훈련 F1이 검증보다 '+fmt(gap,2)+' 높습니다. 훈련 셀을 외우는 경향이 있어요. 손잡이를 줄여 보세요(트리 깊이·수, k를 키우기, γ 낮추기 등).':'훈련과 검증의 차이가 크지 않습니다. 외우기보다 일반화에 가깝습니다.']]);
  costUI();prod();board();}
$('#m-run').onclick=function(){fitEngine(SEL);mount();shelf();benchTable();};
function drawMap(){var b=BENCH[SEL];if(!b)return;var R=U.setup(mapCv),g=R.g,w=R.w,h=R.h,L=40,T=12,Bm=28,W=w-L-8,Hh=h-T-Bm,n=46,xr=[-3,3],yr=[-3,3];
  for(var i=0;i<n;i++)for(var j=0;j<n;j++){var x=xr[0]+(xr[1]-xr[0])*(i+0.5)/n,y=yr[0]+(yr[1]-yr[0])*(j+0.5)/n,p=b.M.p([x,0,y,0]);
    g.fillStyle=p>=THR?'rgba(201,48,44,'+(0.15+0.3*Math.min(1,(p-THR)*2))+')':'rgba(143,163,184,'+(0.08+0.25*Math.min(1,(THR-p)*2))+')';g.fillRect(L+i*W/n,T+Hh-(j+1)*Hh/n,W/n+0.6,Hh/n+0.6);}
  for(i=0;i<VA.n;i++){var px=L+(VA.x[i][0]-xr[0])/(xr[1]-xr[0])*W,py=T+Hh-(VA.x[i][2]-yr[0])/(yr[1]-yr[0])*Hh;if(px<L||px>L+W||py<T||py>T+Hh)continue;g.beginPath();g.arc(px,py,VA.yc[i]?3.2:2.4,0,7);g.fillStyle=VA.yc[i]?C.eye:'rgba(91,104,116,.55)';g.fill();if(VA.yc[i]){g.strokeStyle='#fff';g.lineWidth=1;g.stroke();}}
  g.strokeStyle=C.rule;g.strokeRect(L,T,W,Hh);g.fillStyle=C.muted;g.font='11.5px '+cssv('--font');g.textAlign='center';[-2,0,2].forEach(function(t){g.fillText((t>0?'+':'')+t+'σ',L+(t-xr[0])/(xr[1]-xr[0])*W,T+Hh+15);});
  g.textAlign='right';[-2,0,2].forEach(function(t){g.fillText((t>0?'+':'')+t+'σ',L-4,T+Hh-(t-yr[0])/(yr[1]-yr[0])*Hh+4);});g.fillText('내부저항 →',L+W,h-2);g.save();g.translate(11,T+Hh/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText('온도 상승 →',0,0);g.restore();
  U.label(g,L+8,T+12,engName(SEL),ECOL[SEL],'left');U.stamp(g,w,'단면 · 문턱 '+THR.toFixed(2));mapCv.setAttribute('aria-label',engName(SEL)+' 엔진의 판정 경계 지도');}
U.reg(mapCv,function(dt){if(!dt)drawMap();});
function score(b){return repDone()?REP[b.e.id].m:b.v.f1;}
function ranked(){return Object.keys(BENCH).map(function(k){return BENCH[k];}).sort(function(a,b){return score(b)-score(a);});}
function benchTable(){var r=ranked();if(!r.length)return;var mx=r[0].v.f1;
  var rd=repDone();
  $('#b-tb').innerHTML='<thead><tr><th>#</th><th>엔진</th><th>도감</th><th>검증 F1 (한 번)</th><th>5번 평균 ± 편차</th><th>재현율</th><th>훈련 F1</th><th>저장 값</th><th>추론 µs/셀</th><th>설명 가능성</th></tr></thead><tbody>'+r.map(function(b,i){var q=REP[b.e.id];return '<tr class="'+(b.e.id===SEL?'me':'')+'"><td>'+(i+1)+'</td><td><span class="bar" style="background:'+ECOL[b.e.id]+';width:'+Math.max(6,score(b)/score(r[0])*60)+'px"></span>'+b.e.name+'</td><td>'+(b.e.book==='ml'?'머신러닝':'신경망')+'</td><td>'+fmt(b.v.f1,3)+'</td><td><b>'+(q&&q.m!=null?fmt(q.m,3)+' ± '+fmt(q.sd,3):'…')+'</b></td><td>'+fmt(b.v.rec,3)+'</td><td>'+fmt(b.tr.f1,3)+'</td><td>'+n0(b.size)+'</td><td>'+fmt(b.us,0)+'</td><td>'+EN.XPL[b.e.id]+'</td></tr>';}).join('')+'</tbody>';
  drawBench();var top=r[0];$('#k-best').textContent=top.e.name+' · '+fmt(score(top),3);
  if(r.length===9){var lo=r.filter(function(b){return b.e.id==='logit';})[0];
    if(rd){var t3=r.slice(0,3),gap=REP[t3[0].e.id].m-REP[t3[2].e.id].m,sd=Math.max(REP[t3[0].e.id].sd,REP[t3[2].e.id].sd);
      U.ins($('#i-bench'),[['g','5번 평균으로는 '+t3.map(function(b){return b.e.name+' '+fmt(REP[b.e.id].m,3);}).join(', ')+' 순입니다.'],[gap<sd?'a':'g',gap<sd?'상위 3종의 평균 차이('+fmt(gap,3)+')가 한 번 나눌 때마다 흔들리는 폭(편차 약 '+fmt(sd,3)+')보다 작습니다. 이 셋의 순위는 믿을 수 없고, "비슷하게 좋다"가 정직한 결론입니다. 그다음은 무게·속도·설명 가능성으로 고릅니다.':'상위 엔진의 차이가 흔들림보다 큽니다.'],['a','한 번만 나눈 점수(왼쪽 열)와 순위가 다르다면, 그것이 바로 운입니다. 트리 계열은 훈련 F1이 검증보다 훨씬 높아 외우는 경향이 보입니다.']]);}
    else U.ins($('#i-bench'),[['a','한 번 나눈 검증 F1로는 '+top.e.name+'('+fmt(top.v.f1,3)+')이 1위입니다. 하지만 이 숫자에는 운이 섞입니다. "5번 나눠 다시 재기"가 끝나면 평균으로 순위를 다시 매깁니다.']]);}
  board();shipUI();W4eng();}
var bcv=$('#cvBench');
function drawBench(){var r=ranked();var R=U.setup(bcv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var L=46,T=18,Bm=34,W=w-L-20,Hh=h-T-Bm,xr=[0,4],yr=[0.5,1];
  var X=function(s){return L+(Math.log10(Math.max(1,s))-xr[0])/(xr[1]-xr[0])*W;},Y=function(f){return T+Hh-(clamp(f,yr[0],yr[1])-yr[0])/(yr[1]-yr[0])*Hh;};
  g.strokeStyle=C.rule;g.beginPath();g.moveTo(L,T);g.lineTo(L,T+Hh);g.lineTo(L+W,T+Hh);g.stroke();g.fillStyle=C.muted;g.font='11.5px '+cssv('--font');g.textAlign='center';[1,10,100,1000,10000].forEach(function(t){g.fillText(n0(t),X(t),T+Hh+15);});
  g.textAlign='right';[0.5,0.6,0.7,0.8,0.9,1].forEach(function(t){g.fillText(t.toFixed(1),L-6,Y(t)+4);});g.fillText('저장 값 수 (로그 눈금) →',L+W,h-3);g.textAlign='left';g.fillText('검증 F1',4,12);
  g.strokeStyle=C.amber;g.setLineDash([5,4]);g.beginPath();g.moveTo(L,Y(TGT.f1));g.lineTo(L+W,Y(TGT.f1));g.stroke();g.setLineDash([]);U.label(g,L+6,Y(TGT.f1)-10,'기준 0.80 (예시)',C.amber,'left');
  r.forEach(function(b){var q=REP[b.e.id];if(q&&q.m!=null){var xx=X(b.size)+0.5;g.strokeStyle=ECOL[b.e.id];g.lineWidth=3;g.globalAlpha=0.35;g.beginPath();g.moveTo(xx,Y(q.m-q.sd));g.lineTo(xx,Y(q.m+q.sd));g.stroke();g.globalAlpha=1;g.lineWidth=1;}
    var x=X(b.size),y=Y(score(b)),y2=Y(b.tr.f1);g.strokeStyle='rgba(91,104,116,.35)';g.setLineDash([2,3]);g.beginPath();g.moveTo(x,y);g.lineTo(x,y2);g.stroke();g.setLineDash([]);
    g.beginPath();g.arc(x,y2,3,0,7);g.strokeStyle=ECOL[b.e.id];g.lineWidth=1.5;g.stroke();g.beginPath();g.arc(x,y,b.e.id===SEL?8:6,0,7);g.fillStyle=ECOL[b.e.id];g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
    U.label(g,x+9,y-8,b.e.name,ECOL[b.e.id],'left');});
  g.fillStyle=C.muted;g.textAlign='left';g.fillText(repDone()?'● 5번 평균 검증 F1 (옅은 막대 = ± 편차) · ○ 훈련 F1':'● 검증 F1 (한 번) · ○ 훈련 F1 (점선 길이 = 외운 정도)',L+8,T+Hh-8);U.stamp(g,w,'설명용 모형');}
U.reg(bcv,function(dt){if(!dt)drawBench();});
$('#b-rep').onclick=function(){REP={};runRep(function(){shelf();shipUI();});};
$('#b-all').onclick=function(){var ids=EN.LIST.map(function(e){return e.id;}),i=0,btn=this;btn.disabled=true;
  (function step(){if(i>=ids.length){btn.disabled=false;$('#b-prog').textContent='완료 · 9종';benchTable();shelf();return;}fitEngine(ids[i]);$('#b-prog').textContent=engName(ids[i])+' 시운전 · '+(i+1)+' / 9';i++;benchTable();setTimeout(step,30);})();};
function prod(){var b=BENCH[SEL];if(!b)return;$('#prod-cls').innerHTML='<span><b style="color:'+ECOL[SEL]+'">'+engName(SEL)+'</b></span><span>검증 F1 <b>'+fmt(b.v.f1,3)+'</b></span><span>재현율 <b>'+fmt(b.v.rec,3)+'</b></span><span>저장 값 <b>'+n0(b.size)+'</b></span>';}
function board(){var r=ranked();$('#prod-lb').innerHTML=r.slice(0,3).map(function(b,i){return '<span>'+(i+1)+'. '+b.e.name+' <b>'+fmt(score(b),3)+'</b></span>';}).join('')+'<span class="muted">'+(r.length<9?'('+r.length+' / 9종 시운전)':repDone()?'(5번 평균)':'(한 번 나눈 값 · 5번 평균 계산 중)')+'</span>';}

/* ══ 대사 ══ */
var DLG={
 hero:[["doc","doc_front","오늘은 배터리 불량품 판정기의 엔진부를 만듭니다. 도감에서 엔진을 꺼내 달아 보고, 신경망 엔진은 분해 정비까지 해 보죠."],
       ["asst","asst_smile","엔진이 9종이에요. 같은 셀 600개로 배우고 같은 검증 셀 200개로 재야 공정한 비교가 돼요. 숫자는 제가 읽어 드릴게요."],
       ["fly","fly_point","시운전 점수 좋다고 다 믿을 거야? 진짜 시험은 2편까지 봉인이라며. 외운 엔진부터 골라내자."],
       ["robo","robo_coin","엔진은 크고 복잡할수록 힘이 좋지. 트리 300그루, 신경망, 다 달아 보자고."]],
 factory:[["sia","sia_explain","P3 정제·표준화는 제 담당이에요. 이번 데이터세트는 모형이라 빈칸이 없어서, 걸레질 없이 눈금만 맞췄어요."]],
 board:[["moa","moa_report","벤치 기록과 정비 검사 기록은 제가 모아 둘게요. 처음엔 빨간불도 있어요. 아래 작업장에서 직접 고쳐 보세요."]],
 atlas:[["robo","robo_chart","카탈로그를 보니 저장 값 3,000개짜리 엔진도 있네. 무거운 게 좋은 거 아니야?"]],
 mount:[["fly","fly_magnify","경계 지도를 봐. 계단이 셀 하나하나를 따라 꺾이면, 그건 규칙이 아니라 암기야."]],
 bench:[["asst","asst_report","9종 모두 같은 훈련 셀, 같은 검증 셀, 같은 시드예요. 한 번 나눈 점수엔 운이 섞여서, 다섯 번 다시 나눠 평균도 냈어요."]],
 w1:[["fly","fly_point","카드 01의 숫자 그대로 넣어 봤어? 뜨거운 셀 A를 '양품일 확률이 높다'고 하잖아."]],
 w2:[["asst","asst_report","카드 02 그대로면 z = −1.8, 불량 확률 0.142예요. 아주 뜨거운 셀인데 양품이라고 말하는 셈이에요."]],
 w3:[["doc","doc_board","셀을 바꿔 넣어도 W₁은 한 칸도 안 바뀝니다. 바뀌는 건 엔진을 지나가는 연료, 활성값이에요."]],
 w4:[["robo","robo_calc","칩 예산 안에 들어가면 남는 장사지. …훈련 셀을 통째로 들고 다니는 엔진은 예산부터 넘는군."]],
 w5:[["asst","asst_report","초깃값을 크게 했더니 첫 손실이 3을 넘었어요. 확신에 차서 틀리면 벌점이 커져요."]],
 w6:[["fly","fly_magnify","막대랑 점이 겹치는지부터 봐. 안 겹치면 학습률을 만질 게 아니라 코드를 고쳐야 해."]],
 w7:[["robo","robo_wow","학습률을 1.1로 올렸더니 공이 튀어 나갔어. 크게 걸면 크게 잃는다더니."]],
 w8:[["asst","asst_report","정확도만 보면 늘 높아 보여요. 불량이 20%뿐이라서요. 그래서 재현율과 F1을 같이 읽어요."]],
 w9:[["doc","doc_magic","잠근 49개 위에 작은 보정 장치만 얹어도 새 공장에 꽤 맞습니다. 셀이 30개뿐일 때 특히 그렇죠."]],
 w10:[["fly","fly_point","훈련 손실 0.01? 그건 80개를 외운 거야. 검증 곡선이 어디서 다시 오르는지 봐."]],
 dfly:[["fly","fly_point","숫자 5개짜리 곧은 경계면 충분해. 작고 가볍고 설명하기도 쉽잖아."]],
 drobo:[["robo","robo_coin","저항이랑 온도가 같이 높을 때가 진짜 위험이라며. 그런 굽은 관계는 신경망이 잡지."]],
 outro:[["doc","doc_magic","오늘의 세 줄입니다.<br>① 같은 데이터세트에서도 엔진마다 경계를 긋는 방식과 무게가 다르다. 같은 조건으로, 여러 번 나눠 견주고, 차이가 흔들림보다 작으면 순위를 믿지 않는다.<br>② 신경망 엔진의 속은 파라미터이고, 정비는 예측 → 손실 → 역전파 → 한 걸음의 되풀이다.<br>③ 엔진 크기의 정답은 데이터 양이 정한다. 진짜 성적은 2편에서 봉인 시험으로 잰다."],
        ["robo","robo_happy","열 번 나눠 열 번 다 이겼다. 굽은 관계에는 굽은 경계가 맞는 투자였지."],
        ["fly","fly_coffee","…곡선이었네. 인정. 그래도 셀이 80개뿐이면 DFF도 은닉을 작게 잡아야 해. ⑩에서 봤잖아."],
        ["asst","asst_smile","출고 전표는 써 뒀어요. 2편 검증장에서 봉인을 열 때 다시 만나요."]]
};
U.dialogues(DLG);
var CAST=[["doc","doc_front","박사","해설과 판정. 판정은 늘 계산한 숫자대로."],["asst","asst_smile","조수 하루","벤치를 돌리고 숫자를 발표해요."],["fly","fly_point","초파리 연구원","의심하는 쪽. 작고 단순한 엔진과 검증을 고르고, 함정을 짚어요."],["robo","robo_coin","주판봇","확신하는 쪽. 크고 복잡한 엔진에 걸어요."],["sia","sia_explain","인턴 시아","P3 정제·표준화 담당. 순서를 정리해요."],["moa","moa_report","인턴 모아","벤치·검사 기록을 모아요."]];
$('#castgrid').innerHTML=CAST.map(function(c){return '<div class="castc" style="--cc:var(--c-'+c[0]+')"><img src="'+U.spr(c[1])+'" alt="" aria-hidden="true"><div><b>'+c[2]+'</b><p>'+c[3]+'</p></div></div>';}).join('');
$('#secretrow').innerHTML=['x1','x2','x3'].map(function(x,i){return U.say(x,x+'_hint',['(반짝)','(…끄덕)','(짝짝짝)'][i]);}).join('');
$('#secretbtn').onclick=function(){var r=$('#secretrow');r.hidden=!r.hidden;this.setAttribute('aria-expanded',String(!r.hidden));this.textContent=r.hidden?'방청석 보기 (미공개 식구)':'방청석 닫기';};
U.fillImgs();

/* ══ 표지 대체 그림 ══ */
(function(){var cv=$('#cvCover');if(!cv)return;U.reg(cv,function(dt){if(dt)return;var R=U.setup(cv),g=R.g,w=R.w,h=R.h;var gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#eef4f8');gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(15,127,134,.10)';g.lineWidth=1;var s=Math.max(14,w/40);for(var y=0;y<h+s;y+=s*1.5)for(var x=0;x<w+s;x+=s*1.732){var ox=((y/(s*1.5))%2)?s*.866:0;hexP(g,x+ox,y,s*.95);}
  for(var i=0;i<9;i++){var bx=w*(0.08+i*0.105),by=h*0.18+Math.sin(i)*h*0.04;batt(g,bx,by,w*0.035,i%4===2);}});
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
    for(var pass=0;pass<2;pass++)for(var i=0;i<D.n;i++){if(D.yc[i]!==pass)continue;g.beginPath();g.arc(X(D.X[i][0]),Y(D.X[i][2]),pass?2.6:2.2,0,7);g.fillStyle=pass?'rgba(201,48,44,.75)':'rgba(143,163,184,.55)';g.fill();}
    U.stamp(g,w,'설명용 모형 · 실제 데이터 아님');});
  U.reg(c2,function(dt){if(dt)return;var R=U.setup(c2),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var F=BM.FEAT,rowH=(h-30)/4;
    F.forEach(function(f,k){var y0=14+k*rowH,mn=f[3]-3*f[4],mx=f[3]+3*f[4],L=92,W=w-L-12,nb=24,hs=[new Array(nb).fill(0),new Array(nb).fill(0)],cnt=[0,0];
      for(var i=0;i<D.n;i++){var b=clamp(Math.floor((D.X[i][k]-mn)/(mx-mn)*nb),0,nb-1);hs[D.yc[i]][b]++;cnt[D.yc[i]]++;}
      var top=0;for(var q=0;q<nb;q++)top=Math.max(top,hs[0][q]/cnt[0],hs[1][q]/cnt[1]);
      g.fillStyle=C.text;g.font='600 12px '+cssv('--font');g.textAlign='left';g.fillText(f[1],6,y0+rowH*0.45);g.fillStyle=C.muted;g.font='11px '+cssv('--font');g.fillText(f[2],6,y0+rowH*0.45+14);
      [0,1].forEach(function(c){g.beginPath();for(var q=0;q<=nb;q++){var v=q<nb?hs[c][q]/cnt[c]:0,x=L+q*W/nb,y=y0+rowH*0.85-v/top*rowH*0.75;q?g.lineTo(x,y):g.moveTo(x,y);}g.strokeStyle=c?C.eye:'#8fa3b8';g.lineWidth=2;g.stroke();});
      g.strokeStyle=C.rule;g.lineWidth=1;g.beginPath();g.moveTo(L,y0+rowH*0.85);g.lineTo(L+W,y0+rowH*0.85);g.stroke();});
    g.fillStyle=C.muted;g.textAlign='right';g.fillText('각 줄: 양품(회색)·불량(빨강) 셀의 분포 · 왼쪽 낮음 → 오른쪽 높음',w-8,h-6);U.stamp(g,w,'설명용 모형');});
  $('#data-minis').innerHTML=mini('r','불량 셀 비율',fmt(defRate*100,1)+'%')+mini('','셀 수 · 측정값',D.n+' · 4개')+mini('a','훈련 · 검증 · 시험',TR.n+' · '+VA.n+' · '+TE.n)+mini('','검증 묶음 불량',VA.yc.reduce(function(a,b){return a+b;},0)+'개');
})();

/* ══ ① 부품 창고 ══ */
(function(){var CARD={w11:0.8,w12:-0.4,w21:1.2,w22:0.6,b1:0.3,b2:-0.7},V=Object.assign({},CARD);
  var CELLS=[{k:'A',x:[1.5,1.2],d:1,l:0},{k:'B',x:[-1.0,-0.8],d:0,l:1}];
  var host=$('#w1-sl'),cv=$('#cvW1');
  var NM={w11:'w₁₁ (x₁→y₁)',w12:'w₁₂ (x₂→y₁)',w21:'w₂₁ (x₁→y₂)',w22:'w₂₂ (x₂→y₂)',b1:'b₁',b2:'b₂'};
  host.innerHTML=Object.keys(V).map(function(k){return '<div class="group"><label class="glabel" for="r1-'+k+'" style="min-width:104px">'+NM[k]+'</label><input type="range" id="r1-'+k+'" min="-2" max="2" step="0.1" value="'+V[k]+'"><span class="val" id="v1-'+k+'">'+V[k].toFixed(1)+'</span></div>';}).join('');
  Object.keys(V).forEach(function(k){$('#r1-'+k).oninput=function(){V[k]=+this.value;$('#v1-'+k).textContent=V[k].toFixed(1);upd();};});
  $('#w1-reset').onclick=function(){Object.keys(CARD).forEach(function(k){V[k]=CARD[k];$('#r1-'+k).value=V[k];$('#v1-'+k).textContent=V[k].toFixed(1);});upd();};
  function out(x){return [BM.sig(V.w11*x[0]+V.w12*x[1]+V.b1),BM.sig(V.w21*x[0]+V.w22*x[1]+V.b2)];}
  function upd(){var ok=0,rows='<thead><tr><th>셀</th><th>y₁ 불량 확률</th><th>판정 (실제)</th><th>y₂ 양품 확률</th><th>판정 (실제)</th></tr></thead><tbody>';
    CELLS.forEach(function(c){var y=out(c.x),j1=(y[0]>=0.5?1:0)===c.d,j2=(y[1]>=0.5?1:0)===c.l;ok+=j1+j2;
      rows+='<tr><td>셀 '+c.k+'</td><td class="n">'+fmt(y[0],3)+'</td><td>'+(y[0]>=0.5?'불량':'양품')+' ('+(c.d?'불량':'양품')+') '+(j1?'✓':'✗')+'</td><td class="n">'+fmt(y[1],3)+'</td><td>'+(y[1]>=0.5?'양품':'불량')+' ('+(c.l?'양품':'불량')+') '+(j2?'✓':'✗')+'</td></tr>';});
    $('#w1-tb').innerHTML=rows+'</tbody>';QC(1,ok===4?'ok':'ng',ok+' / 4칸 맞음');
    U.ins($('#i-w1'),ok===4?[['g','네 칸 모두 맞았습니다. 파라미터 6개(가중치 4 + 편향 2)를 손으로 맞춘 셈이에요.']]:[['r',(4-ok)+'칸이 틀렸습니다. '+(out(CELLS[0].x)[1]>=0.5?'y₂가 뜨거운 불량 셀 A를 양품이라고 합니다. w₂₁·w₂₂를 음수 쪽으로 돌려 보세요.':'틀린 칸의 가중치 부호를 생각해 보세요.')]]);draw(0);}
  function draw(){var R=U.setup(cv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var xs=[w*0.16,w*0.78],ys=[h*0.3,h*0.7],r=Math.min(30,w*0.06);
    var E=[['w11',0,0],['w12',1,0],['w21',0,1],['w22',1,1]];
    E.forEach(function(e){var v=V[e[0]],x0=xs[0]+r,y0=ys[e[1]],x1=xs[1]-r,y1=ys[e[2]];g.strokeStyle=v>=0?'rgba(30,85,200,.75)':'rgba(201,48,44,.75)';g.lineWidth=1+Math.abs(v)*4;g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();
      var mx=x0+(x1-x0)*(e[1]===e[2]?0.5:0.32),my=y0+(y1-y0)*(e[1]===e[2]?0.5:0.32);U.label(g,mx,my-12,e[0].replace('w','w')+' '+v.toFixed(1),v>=0?C.info:C.eye,'center');});
    ['x₁ 내부저항','x₂ 온도 상승'].forEach(function(t,i){circ(g,xs[0],ys[i],r,'#fcebea',C.eye);U.label(g,xs[0],ys[i]+r+14,t,C.eye,'center');});
    var A=out(CELLS[0].x);['y₁ 불량','y₂ 양품'].forEach(function(t,i){circ(g,xs[1],ys[i],r,'#f6ecfa',C.stain);g.fillStyle=C.stain;g.font='700 13px '+cssv('--font');g.textAlign='center';g.fillText('Σ→σ',xs[1],ys[i]+5);U.label(g,xs[1],ys[i]+r+14,t,C.stain,'center');
      g.strokeStyle=C.amber;g.lineWidth=1.5;g.beginPath();g.moveTo(xs[1],ys[i]-r-18);g.lineTo(xs[1],ys[i]-r);g.stroke();U.label(g,xs[1],ys[i]-r-24,'b'+(i+1)+' '+V['b'+(i+1)].toFixed(1),C.amber,'center');});
    U.stamp(g,w,'예시값');}
  function circ(g,x,y,r,f,s){g.beginPath();g.arc(x,y,r,0,7);g.fillStyle=f;g.fill();g.lineWidth=2;g.strokeStyle=s;g.stroke();}
  U.reg(cv,function(dt){if(!dt)draw();});upd();
})();


/* ══ ② 뉴런 조립대 ══ */
(function(){var CARD={w1:0.5,w2:-1.0,b:0.2},V=Object.assign({},CARD),f='sig';
  var CELLS=[{t:'카드 02 셀 (2, 3) · 실제 불량',x:[2,3],d:1},{t:'양품 셀 (−1, −0.5)',x:[-1,-0.5],d:0}],cur=0;
  var host=$('#w2-sl'),cv=$('#cvW2');
  host.innerHTML='<div class="group"><span class="glabel">넣을 셀</span><span id="g-w2c"></span></div>'+['w1','w2','b'].map(function(k){return '<div class="group"><label class="glabel" for="r2-'+k+'" style="min-width:40px">'+{w1:'w₁',w2:'w₂',b:'b'}[k]+'</label><input type="range" id="r2-'+k+'" min="-2" max="2" step="0.1" value="'+V[k]+'"><span class="val" id="v2-'+k+'">'+V[k].toFixed(1)+'</span></div>';}).join('');
  U.btns($('#g-w2c'),[[0,'카드 02 셀'],[1,'양품 셀']],0,function(v){cur=v;upd();});
  U.btns($('#g-w2f'),[['sig','σ 시그모이드'],['relu','ReLU'],['tanh','tanh'],['id','없음 (항등)']],'sig',function(v){f=v;upd();});
  ['w1','w2','b'].forEach(function(k){$('#r2-'+k).oninput=function(){V[k]=+this.value;$('#v2-'+k).textContent=V[k].toFixed(1);upd();};});
  $('#w2-reset').onclick=function(){Object.keys(CARD).forEach(function(k){V[k]=CARD[k];$('#r2-'+k).value=V[k];$('#v2-'+k).textContent=V[k].toFixed(1);});upd();};
  function F(z){return f==='sig'?BM.sig(z):f==='relu'?Math.max(0,z):f==='tanh'?Math.tanh(z):z;}
  function z(x){return V.w1*x[0]+V.w2*x[1]+V.b;}
  function upd(){var c=CELLS[cur],zz=z(c.x);
    $('#eq-w2').innerHTML='z = w₁x₁ + w₂x₂ + b = '+V.w1.toFixed(1)+'×'+c.x[0]+' + ('+V.w2.toFixed(1)+')×'+c.x[1]+' + '+V.b.toFixed(1)+' = <b>'+fmt(zz,2)+'</b> · f(z) = <em>'+fmt(F(zz),3)+'</em> · 파라미터 <i>3개</i> (w₁, w₂, b)';
    var j=CELLS.map(function(cc){var v=z(cc.x);return (v>0?1:0)===cc.d;}),ok=j[0]&&j[1];
    QC(2,ok?'ok':'ng',(j[0]?'✓':'✗')+' 불량 셀 z = '+fmt(z(CELLS[0].x),2)+' · '+(j[1]?'✓':'✗')+' 양품 셀 z = '+fmt(z(CELLS[1].x),2));
    U.ins($('#i-w2'),ok?[['g','두 셀 모두 맞게 판정합니다. 온도 쪽 가중치가 양수가 되어 "뜨거울수록 불량"을 담았어요.']]:[['r',!j[0]?'뜨거운 불량 셀의 z가 0 이하라 양품으로 판정됩니다. 온도에 붙은 w₂의 부호를 보세요.':'양품 셀까지 불량(z > 0)이라고 합니다. b를 낮춰 기준을 올려 보세요.']]);draw();}
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
  var pick=[];for(var i=0;i<VA.n&&pick.length<5;i++){var want=[1,0,1,0,0][pick.length];if(VA.yc[i]===want)pick.push(i);}
  var cur=pick[0];
  U.btns($('#w3-cells'),pick.map(function(i,k){var raw=D.X[VA.idx[i]];return [i,'셀 '+(k+1)+' · '+fmt(raw[0],2)+'mΩ · '+fmt(raw[2],1)+'°C'];}),cur,function(v){cur=v;feed();});
  function feed(){var P=M.cls,ck=BM.checksum(P);if(ck0==null)ck0=ck;var f=BM.fwd(P,VA.x[cur]);prev=last;last=f.h;seen[cur]=1;
    var dAct=prev?prev.reduce(function(s,v,j){return s+Math.abs(v-last[j]);},0):0,dPar=ck===ck0?0:1,ns=Object.keys(seen).length;
    $('#w3-minis').innerHTML=mini('','넣어 본 셀',ns+'개')+mini('m','활성값 변화 (직전 셀과)',prev?fmt(dAct,3):'—')+mini('g','파라미터 변화',dPar?'바뀜':'0')+mini('r','P(불량) · 실제',fmt(BM.sig(f.z),3)+' · '+(VA.yc[cur]?'불량':'양품'));
    QC(3,ns>=2?(dPar===0&&dAct>0?'ok':'ng'):'run',ns>=2?'파라미터 '+(dPar?'바뀜':'변화 0')+' · 활성값 변화 '+fmt(dAct,3):'셀 '+ns+'개 넣음 — 하나 더');
    U.ins($('#i-w3'),[[ns>=2?'g':'a',(W3.re&&ns<2?'⑧에서 모델을 다시 학습해 설계도가 바뀌었어요. ':'')+(ns>=2?'다른 셀을 넣자 은닉층 막대(활성값)는 바뀌었지만, 왼쪽 행렬 색(파라미터)은 그대로입니다. 지문 '+ck+'.':'다른 셀을 하나 더 넣어 보세요. 행렬 색과 막대 중 무엇이 바뀌는지 봅니다.')]]);draw();}
  W3.refresh=function(){W3.re=1;ck0=null;seen={};prev=null;last=null;feed();};
  function draw(){var P=M.cls,R=U.setup(cv),g=R.g,w=R.w,h=R.h;U.grid24(g,w,h);var x=VA.x[cur],f=BM.fwd(P,x);
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
    var px=ox+cs*2+30;if(px+90<w){hdr('출력',px,top-12,C.info);var p=BM.sig(f.z);g.fillStyle='#e6eefb';g.fillRect(px,top+2*(cs+2),80,cs*2.4);g.fillStyle=C.info;g.font='700 15px '+cssv('--font');g.fillText('P(불량)',px+6,top+2*(cs+2)+cs*1.0);g.fillText(fmt(p,3),px+6,top+2*(cs+2)+cs*2.1);}
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


var W4eng=function(){var r=EN.LIST.map(function(e){return BENCH[e.id];}).filter(Boolean).sort(function(a,b){return a.size-b.size;});
  $('#w4-eng').innerHTML='<thead><tr><th>엔진</th><th>저장 값</th><th>FP32 메모리</th><th>BMS 8 KB 예산</th></tr></thead><tbody>'+r.map(function(b){var kb=b.size*4/1024;return '<tr class="'+(b.e.id===SEL?'me':'')+'"><td><span class="bar" style="background:'+ECOL[b.e.id]+';width:10px"></span>'+b.e.name+'</td><td>'+n0(b.size)+'</td><td>'+fmt(kb,2)+' KB</td><td>'+(kb<=8?'<span class="lamp ok">안에 듦</span>':'<span class="lamp ng">넘음</span>')+'</td></tr>';}).join('')+'</tbody>';};

/* ══ ⑤ 첫 시동 ══ */
(function(){var ca=$('#cvW5a'),p=0.10,sc=1;
  $('#r-w5p').oninput=function(){p=+this.value;$('#v-w5p').textContent=p.toFixed(2);upd();};
  U.btns($('#g-w5i'),[[0.1,'작게 (×0.1)'],[1,'보통 (×1)'],[5,'크게 (×5)']],1,function(v){sc=v;init();});
  var pr=defRate,BASE=-(pr*Math.log(pr)+(1-pr)*Math.log(1-pr));
  function init(){var P=BM.Net(H0,11,sc),lc=BM.loss(P,'cls',VA),ok=Math.abs(lc-Math.LN2)<=TGT.l0;
    $('#w5-minis').innerHTML=mini(ok?'g':'r','DFF 엔진 초기 손실',fmt(lc,3))+mini('','기준 ln 2 (늘 반반)','0.693')+mini('','늘 불량 비율만 말하기',fmt(BASE,3))+mini('g','길들인 뒤 (⑧ 검증 최저)',fmt(M.hc[M.ec][2],3));
    QC(5,ok?'ok':'ng','초기 손실 '+fmt(lc,3)+' (ln 2와 차이 '+fmt(Math.abs(lc-Math.LN2),3)+')');
    U.ins($('#i-w5'),[[ok?'g':'r',ok?'첫 손실이 ln 2 근처입니다. 아직 아무것도 모르는 엔진답게 "반반"에 가깝게 말하고 있어요.':'첫 손실이 ln 2에서 멀리 떨어졌습니다. 초깃값이 커서 엔진이 처음부터 확신에 차 틀립니다. 이 상태로 길들이면 출발이 늦거나 불안정해질 수 있어요.']]);}
  function upd(){var L=-Math.log(p);$('#eq-w5').innerHTML='손실 = −ln P(정답) = −ln '+p.toFixed(2)+' = <b>'+fmt(L,2)+'</b> · P = 0.5면 <em>0.693</em> · P = 0.9면 <i>0.105</i>';
    U.plot(ca,{xr:[0,1],yr:[0,5],xt:[0,0.25,0.5,0.75,1],yt:[0,1,2,3,4,5],xl:'P(정답)',yl:'손실',series:[{pts:Array.from({length:99},function(_,i){var q=(i+1)/100;return [q,-Math.log(q)];}),color:C.stain,width:2.4}],
      vlines:[{x:p,color:C.gfp,label:'P = '+p.toFixed(2)+' → '+fmt(L,2)}],hlines:[{y:Math.LN2,color:C.muted,label:'ln 2 = 0.693',left:true}],stamp:'예시값'});}
  U.reg(ca,function(dt){if(!dt)upd();});init();upd();
})();

/* ══ ⑥ 원인 추적실 ══ */
(function(){var cv=$('#cvW6'),kind='cls',bug=false,off=0,res=null;
  
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
(function(){var ca=$('#cvW8a'),cb=$('#cvW8b'),cards=$('#cards8'),hi=[],raf=0;
  cards.innerHTML=TR.yc.map(function(y){return '<i'+(y?' class="d"':'')+'></i>';}).join('');var ci=$$('i',cards);
  U.btns($('#g-w8b'),[[8,'8'],[32,'32'],[128,'128'],[600,'600 (전체)']],32,function(v){W8.batch=v;});
  U.btns($('#g-w8o'),[['sgd|0.1','SGD 0.1'],['sgd|0.01','SGD 0.01'],['adam|0.01','Adam 0.01'],['adam|0.001','Adam 0.001']],'adam|0.01',function(v){var a=v.split('|');W8.opt=a[0];W8.lr=+a[1];});
  function show(J){var h=J?J.hist:M.hc,f=J?J.f1:M.f1h,be=J?J.best.e:M.ec,mx=0;h.forEach(function(r){mx=Math.max(mx,Math.min(r[1],3),Math.min(r[2],3));});
    U.plot(ca,{xr:[0,EP],yr:[0,Math.max(0.2,mx*1.05)],xt:[0,30,60,90,120],yt:[0,mx/2,mx].map(function(v){return +v.toFixed(2);}),xl:'에포크',yl:'손실 (교차 엔트로피)',
      series:[{pts:h.map(function(r){return [r[0],r[1]];}),color:C.info,width:2,name:'훈련',ndy:14},{pts:h.map(function(r){return [r[0],r[2]];}),color:C.eye,width:2,name:'검증',ndy:-12}],vlines:be?[{x:be,color:C.gfp,label:'검증 최저 '+be}]:[],stamp:'설명용 모형'});
    U.plot(cb,{xr:[0,EP],yr:[0,1],xt:[0,30,60,90,120],yt:[0,0.2,0.4,0.6,0.8,1],xl:'에포크',yl:'검증 F1',series:[{pts:f,color:C.gfp,width:2}],hlines:[{y:TGT.f1,color:C.amber,label:'기준 0.80',left:true}],vlines:be?[{x:be,color:C.gfp}]:[],stamp:'설명용 모형'});}
  function report(){var vc=M.vc;
    $('#w8-minis').innerHTML=mini('a','에포크 · 스텝',EP+' · '+n0(M.steps))+mini('','고른 에포크 (검증 최저)',M.ec)+mini('','정확도 · 정밀도',fmt(vc.acc,3)+' · '+fmt(vc.prec,3))+mini(vc.f1>=TGT.f1?'g':'r','재현율 · F1',fmt(vc.rec,3)+' · '+fmt(vc.f1,3));
    cm($('#w8-cm'),vc);var ok=vc.f1>=TGT.f1;QC(8,ok?'ok':'ng','F1 '+fmt(vc.f1,3));
    U.ins($('#i-w8'),[[ok?'g':'r',ok?'검사 기준을 넘었습니다. 검증 손실이 가장 낮던 에포크 '+M.ec+'의 파라미터를 엔진에 남겨 두었어요.':'기준에 못 미쳤습니다. '+(W8.opt==='sgd'&&W8.lr<0.05?'SGD 0.01은 120 에포크 안에 덜 내려옵니다. ':'')+(W8.batch===600?'전체 배치는 에포크마다 한 걸음뿐이라 느립니다. ':'')+'설정을 바꿔 다시 길들여 보세요.'],
      ['a','검증 데이터로 멈출 때를 골랐으니, 검증 점수는 조금 낙관적일 수 있습니다. 그래서 최종 점수는 2편에서 봉인한 시험 셀로 잽니다[10].']]);}
  function frame(){var J=W8.jc;if(!J)return;J.run(1);
    var bs=W8.batch,ns=Math.ceil(TR.n/bs),k=(J.e*7)%ns,ids=J.lastIds.slice(k*bs,Math.min(TR.n,(k+1)*bs));hi.forEach(function(i){ci[i]&&ci[i].classList.remove('on');});hi=ids;hi.forEach(function(i){ci[i]&&ci[i].classList.add('on');});
    show(J);$('#w8-minis').innerHTML=mini('a','에포크 · 스텝',J.e+' · '+n0(J.steps))+mini('','훈련 · 검증 손실',fmt(J.hist[J.e][1],3)+' · '+fmt(J.hist[J.e][2],3))+mini('g','검증 F1',fmt(J.f1[J.e][1],3))+mini('','배치 · 1 에포크 스텝',bs+' · '+ns);
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
  function run(){var E=function(P){return BM.evalCls(P,VAB);},o={kind:'cls',tr:TRB,va:VAB,opt:'adam',batch:16,epochs:40,seed:6};
    var full=BM.train(Object.assign({},o,{P:BM.clone(CLSA),lr:0.005}));
    var Pa=BM.clone(CLSA),r=BM.rng(99);Pa.A=[];for(var j=0;j<H0;j++)Pa.A.push(BM.gauss(r)*0.1);Pa.B=[0,0,0,0];
    var ad=BM.train(Object.assign({},o,{P:Pa,lr:0.01,mask:{W1:0,b1:0,W2:1,b2:1,A:1,B:1}}));
    var scr=BM.train(Object.assign({},o,{H:H0,lr:0.01}));
    R={asis:{e:E(CLSA),n:0},scratch:{e:E(scr.P),n:49},full:{e:E(full.P),n:49},adapter:{e:E(ad.P),n:21}};
    $('#w9-tb').innerHTML='<thead><tr><th>방법</th><th>학습하는 값</th><th>공장 B 검증 F1</th><th>재현율</th><th>손실</th></tr></thead><tbody>'+MT.map(function(m){var x=R[m[0]];return '<tr><td>'+m[1]+'</td><td class="n">'+x.n+'개</td><td class="n">'+fmt(x.e.f1,3)+'</td><td class="n">'+fmt(x.e.rec,3)+'</td><td class="n">'+fmt(x.e.loss,3)+'</td></tr>';}).join('')+'</tbody>';
    var ok=R.adapter.e.f1>R.asis.e.f1&&R.adapter.n<49;QC(9,ok?'ok':'ng','어댑터 F1 '+fmt(R.adapter.e.f1,3)+' (그대로 '+fmt(R.asis.e.f1,3)+') · 학습 값 21개');
    var best=MT.slice().sort(function(a,b){return R[b[0]].e.f1-R[a[0]].e.f1;})[0];
    U.ins($('#i-w9'),[['g','그대로 쓰면 공장 B의 불량 중 '+fmt(R.asis.e.rec*100,0)+'%만 잡습니다(F1 '+fmt(R.asis.e.f1,3)+'). 미세조정하면 '+fmt(R.full.e.f1,3)+'(전체), '+fmt(R.adapter.e.f1,3)+'(어댑터), 셀 30개로 처음부터 배우면 '+fmt(R.scratch.e.f1,3)+'입니다. 가장 높은 것은 "'+best[1]+'"입니다.'],['a','어댑터는 학습하는 값이 21개로 전체(49개)의 절반 아래입니다. 이 작은 엔진에선 절약이 작지만, 수십억 개짜리 모델에서는 이 비율이 수천 분의 1까지 내려갑니다[4].']]);
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
    MT.forEach(function(m,i){var v=R[m[0]].e.f1,y=T+i*bh*1.45,bw=(w-L-80)*v;g.fillStyle=m[0]===sel?C.amber:'rgba(91,104,116,.45)';g.fillRect(L,y,bw,bh);g.fillStyle=C.text;g.font=(m[0]===sel?'700 ':'')+'13px '+cssv('--font');g.textAlign='right';g.fillText(m[1],L-8,y+bh*0.65);
      g.textAlign='left';g.fillText(fmt(v,3)+' · '+R[m[0]].n+'개',L+bw+6,y+bh*0.65);});
    g.fillStyle=C.muted;g.font='12px '+cssv('--font');g.textAlign='left';g.fillText('공장 B 검증 F1 (길수록 좋음) · 학습하는 값 개수',8,h-8);U.stamp(g,w,'설명용 모형');}
  U.reg(ca,function(dt){if(!dt){drawA();drawB();}});run();
})();

/* ══ ⑩ 출고 검사실 ══ */
(function(){var ca=$('#cvW10a'),cb=$('#cvW10b'),HS=[1,2,4,8,16,32],res=[],busy=false,ck=null,done=false;
  var small=SP.tr.slice(0,80),S80=BM.stats(D,small),TR80=BM.view(D,small,S80),VA80=BM.view(D,SP.va,S80);
  $('#w10-sweep').onclick=function(){if(busy)return;busy=true;res=[];var i=0,J=null;this.disabled=true;
    (function tick(){var t0=performance.now();while(performance.now()-t0<12){if(!J){if(i>=HS.length){busy=false;done=true;$('#w10-sweep').disabled=false;$('#w10-prog').textContent='완료 · 6개 크기';note();judge();draw();return;}J=BM.job({kind:'cls',H:HS[i],seed:21,epochs:400,tr:TR80,va:VA80,opt:'adam',lr:0.01,batch:80});}
        J.run(10);if(J.done){var a=BM.evalCls(J.P,TR80),b=BM.evalCls(J.P,VA80);res.push({H:HS[i],tr:a.loss,va:b.loss,f1:b.f1,np:BM.nParams(J.P)});J=null;i++;}}
      $('#w10-prog').textContent='은닉 '+HS[Math.min(i,HS.length-1)]+' 길들이는 중 · '+res.length+' / 6';draw();requestAnimationFrame(tick);})();};
  function note(){var out=[];if(done){var b=res.slice().sort(function(a,c){return a.va-c.va;})[0],L=res[res.length-1];
      out.push(['g','검증 손실이 가장 낮은 크기는 은닉 '+b.H+'개(파라미터 '+b.np+'개, 손실 '+fmt(b.va,3)+')입니다. 은닉 '+L.H+'개는 훈련 손실 '+fmt(L.tr,3)+'까지 내려갔지만 검증 손실은 '+fmt(L.va,3)+'입니다.'],['a','셀 80개는 이 문제에 적은 양입니다. 셀이 600개면 결과가 달라질까요? 아래 대결에서 확인합니다.']);}
    if(ck)out.push([ck[0]===ck[1]?'g':'r','추론 1,000번 전후의 가중치 지문: '+(ck[0]===ck[1]?'같음 ('+ck[0]+') — 배포 후 추론은 가중치를 바꾸지 않았습니다.':'다름!')]);
    if(!out.length)out.push(['a','"크기별로 길들여 보기"로 용량 실험을, "추론 1,000번"으로 출고 검사를 합니다. 봉인한 시험 셀은 열지 않습니다.']);U.ins($('#i-w10'),out);}
  function judge(){var ok=done&&ck&&ck[0]===ck[1];QC(10,ok?'ok':(done||ck)?(ck&&ck[0]!==ck[1]?'ng':'run'):'wait',(done?'용량 실험 완료':'용량 실험 전')+' · 지문 '+(ck?(ck[0]===ck[1]?'같음':'다름'):'비교 전'));
    $('#w10-minis').innerHTML=mini(done?'g':'','용량 실험',done?'6 / 6':'—')+mini('','가장 나은 은닉 수',done?res.slice().sort(function(a,c){return a.va-c.va;})[0].H+'개':'—')+mini(ck?(ck[0]===ck[1]?'g':'r'):'','가중치 지문 전 → 후',ck?ck[0]+' → '+ck[1]:'—')+mini('','시험 셀 200개','🔒 2편');}
  $('#w10-infer').onclick=function(){var a=BM.checksum(M.cls);for(var i=0;i<1000;i++)BM.predict(M.cls,'cls',TE.x[i%TE.n]);ck=[a,BM.checksum(M.cls)];judge();note();};
  function draw(){var mx=0.3;res.forEach(function(r){mx=Math.max(mx,r.va*1.1,r.tr*1.1);});
    U.plot(ca,{xr:[1,32],logx:true,yr:[0,mx],xt:HS,yt:[0,mx/2,mx].map(function(v){return +v.toFixed(2);}),xl:'은닉 뉴런 수 (로그 눈금)',yl:'손실 (교차 엔트로피)',series:res.length?[{pts:res.map(function(r){return [r.H,r.tr];}),color:C.info,width:2.2,dots:3.5,name:'훈련',ndy:14},{pts:res.map(function(r){return [r.H,r.va];}),color:C.eye,width:2.2,dots:3.5,name:'검증',ndy:-12}]:[],stamp:'설명용 모형'});
    var np=HS.map(function(H){return [H,4*H+H+H+1];});U.plot(cb,{xr:[1,32],logx:true,yr:[0,200],xt:HS,yt:[0,50,100,150,200],xl:'은닉 뉴런 수',yl:'파라미터 수',series:[{pts:np,color:C.stain,width:2.2,dots:3.5}],hlines:[{y:80,color:C.amber,label:'훈련 셀 80개',left:true}],stamp:'계산값'});}
  U.reg(ca,function(dt){if(!dt)draw();});judge();note();
})();

/* ══ 대결: 로지스틱 회귀 vs DFF — 10번 나눠 평균·이긴 횟수 ══ */
(function(){var fi=$('#d-fly'),ri=$('#d-robo'),out=null,pend=null,busy=false;
  function compute(cb){if(out){cb(out);return;}if(busy){pend=cb;return;}busy=true;pend=cb;var k=0,a=[],b=[];
    (function step(){if(k>=10){var m=function(x){return x.reduce(function(p,q){return p+q;},0)/x.length;};out={a:a,b:b,fly:m(a),robo:m(b),wins:b.filter(function(v,i){return v>a[i];}).length};busy=false;pend&&pend(out);return;}
      var sp=splits()[k];a.push(EN.evalP(EN.logistic(sp.tr,{},11),sp.va).f1);b.push(EN.evalP(EN.mlp(sp.tr,{H:8,epochs:120,epochsOnly:true},11),sp.va).f1);k++;
      $('#d-bars').innerHTML='<p class="muted">계산 중… '+k+' / 10번째 나누기</p>';setTimeout(step,15);})();}
  var lastPred=null;
  U.Duel({el:'#duel',run:function(){return null;},show:function(o,pred){lastPred=pred;$('#d-say').innerHTML='';$('#d-score').textContent='';$('#d-pred').textContent='';compute(function(r){reveal(r,lastPred);});},
    reset:function(){U.setMood(fi,'fly_point');U.setMood(ri,'robo_coin');}});
  function reveal(o,pred){var d=o.robo-o.fly,res=(d>0.01&&o.wins>=8)?'R':(d<-0.01&&o.wins<=2)?'F':'D',big=Math.abs(d)>=0.10;
    var Mo={F:['fly_arms','robo_sigh','doc_judge','asst_spark'],R:[big?'fly_cry':'fly_coffee','robo_happy','doc_judge','asst_spark'],D:['fly_coffee','robo_meh','doc_think','asst_smile']}[res];
    U.setMood(fi,Mo[0]);U.setMood(ri,Mo[1]);
    $('#d-bars').innerHTML='<div class="resbars"><div class="resbar"><span style="color:var(--c-fly)">초파리 · 로지스틱 회귀 (5개)</span><div class="bar"><i style="background:var(--c-fly);width:'+(o.fly*100)+'%"></i></div><b>'+fmt(o.fly,3)+'</b></div>'+
      '<div class="resbar"><span style="color:var(--c-robo)">주판봇 · DFF (49개)</span><div class="bar"><i style="background:var(--c-robo);width:'+(o.robo*100)+'%"></i></div><b>'+fmt(o.robo,3)+'</b></div></div>'+
      '<div class="dots" aria-label="10번 나눈 각 결과">'+o.a.map(function(v,i){return '<span class="'+(o.b[i]>v?'w':'')+'">'+(i+1)+'번 '+fmt(v,3)+' : '+fmt(o.b[i],3)+'</span>';}).join('')+'</div>';
    var lesson='저항과 온도가 함께 높을 때 위험해지는 굽은 관계에는 굽은 경계가 맞다';
    $('#d-say').innerHTML=U.say('asst',Mo[3],'10번 나눈 평균 검증 F1은 초파리 쪽 '+fmt(o.fly,3)+', 주판봇 쪽 '+fmt(o.robo,3)+'이에요. 10번 중 주판봇이 '+o.wins+'번 높았어요.')+U.say('doc',Mo[2],(res==='D'?'차이가 흔들림 안에 있다. 이번 판은 나눠 갖는다.':lesson+'. '+{F:'초파리 승.',R:'주판봇 승.'}[res]),true);
    $('#d-score').textContent='판정: '+{F:'F 초파리 승',R:'R 주판봇 승',D:'D 무승부'}[res]+' (평균 차이 '+fmt(Math.abs(d),3)+', '+o.wins+' / 10)';
    $('#d-pred').textContent=pred?' · 내 예상: '+(pred==='fly'?'초파리':'주판봇')+((pred==='fly'&&res==='F')||(pred==='robo'&&res==='R')?' — 맞았어요':' — 빗나갔어요'):'';}
})();

/* ══ 정비 작업장 접기 ══ */
(function(){var b=$('#t-fold');for(var n=1;n<=10;n++){var sec=$('#w'+n),p=document.createElement('p');p.className='foldnote';p.textContent='접혀 있음 — 위 정비 공정에서 "펼치기"를 누르면 보입니다.';sec.querySelector('.wrap').appendChild(p);}
  b.onclick=function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));b.textContent=on?'작업장 ①~⑩ 펼치기':'작업장 ①~⑩ 접기 (45분 경로)';for(var n=1;n<=10;n++)$('#w'+n).classList.toggle('folded',on);if(!on)setTimeout(U.drawAll,30);};})();

/* ══ 출고 ══ */
var shipSel=null;
function shipUI(){var r=ranked();if(!r.length)return;if(!shipSel||!BENCH[shipSel])shipSel=r[0].e.id;
  U.btns($('#g-ship'),r.map(function(b){return [b.e.id,b.e.name];}),shipSel,function(v){shipSel=v;shipInfo();});shipInfo();}
function shipInfo(){var b=BENCH[shipSel];if(!b)return;var kb=b.size*4/1024,q=REP[shipSel];
  $('#ship-minis').innerHTML=mini('g','출고 엔진',b.e.name)+mini(b.v.f1>=TGT.f1?'g':'r','검증 F1 (한 번 · 5번 평균)',fmt(b.v.f1,3)+' · '+(q&&q.m!=null?fmt(q.m,3):'…'))+mini(kb<=8?'':'r','무게 (FP32)',fmt(kb,2)+' KB')+mini('','시험 셀 200개','🔒 2편에서 개봉');
  U.ins($('#i-ship'),[[b.v.f1>=TGT.f1?'g':'a','"'+b.e.name+'" 엔진을 출고 전표에 적었습니다. 검증 F1 '+fmt(b.v.f1,3)+', 무게 '+fmt(kb,2)+' KB'+(kb>8?' — BMS 칩 예산(8 KB)을 넘으니 서버에서 돌려야 합니다.':'.')],['a',(repDone()?'벤치 상위 엔진들은 5번 평균의 차이가 흔들림보다 작습니다. 그럴 때는 무게·속도·설명 가능성으로 고르는 것도 정당합니다. ':'')+'2편 검증장에서 봉인한 시험 셀을 열면 숫자가 내려갈 수도 있습니다. 검증 셀로 엔진과 손잡이를 골랐기 때문입니다.']]);}

/* ══ 엔진(모델) 조립 공장 3D 그림 ══ */
var Fac={};
(function(){var cv=$('#cvFac'),narrow=(cv.clientWidth||window.innerWidth)<600,yaw=narrow?-0.15:-0.5,pitch=narrow?1.2:0.82,spd=1,play=!U.reduce,t=0,sel=-1;
  var PR=[
   {id:'P1',name:'데이터 입고',cat:'d',href:'#data',desc:'셀 1,000개의 측정값 4가지(내부저항·초기 용량·온도 상승·전압 편차)가 들어옵니다.',met:'셀 1,000개 · 측정값 4개'},
   {id:'P2',name:'정답 붙이기',cat:'d',href:'#data',desc:'검사원이 셀마다 불량 여부를 판정합니다. 이 판정이 판정기가 배울 정답(라벨)입니다.',met:'불량 비율 '+fmt(defRate*100,1)+'%',who:['asst','asst_report',0.9]},
   {id:'P3',name:'정제 · 표준화',cat:'d',href:'#data',desc:'측정 오류를 걸러내고, 훈련 셀의 평균·표준편차로 네 측정값의 눈금을 맞춥니다.',met:'빈칸 0 · 평균 0 · 표준편차 1',who:['sia','sia_guide',0.88]},
   {id:'P4',name:'나누기 · 봉인',cat:'d',href:'#data',desc:'훈련 600 · 검증 200 · 시험 200. 시험 셀은 금고에 넣어 2편 검증장까지 봉인합니다.',met:'600 · 200 · 200 (시험 봉인)',who:['moa','moa_report',0.84],vault:true},
   {id:'P5',name:'머신러닝 도감관',cat:'a',href:'#atlas',desc:'머신러닝 도감에서 엔진 7종(로지스틱 회귀, 결정 트리, 랜덤 포레스트, 부스팅, SVM, 나이브 베이즈, k-최근접 이웃)을 꺼냅니다.',met:'엔진 7종',shelf:['logit','tree','rf','boost','svm','nb','knn']},
   {id:'P6',name:'신경망 도감관',cat:'a',href:'#atlas',desc:'신경망 도감에서 표 데이터용 엔진 2종(DFF, 오토인코더)을 꺼냅니다. CNN·LSTM은 창고에 둡니다.',met:'엔진 2종 (+ 보관 2종)',shelf:['mlp','ae'],who:['robo','robo_chart',0.72]},
   {id:'P7',name:'엔진 장착대',cat:'m',href:'#mount',desc:'판정기 차체에 엔진을 답니다. 엔진 창고에서 고른 엔진의 색이 차체 위 상자에 나타납니다.',met:'장착 엔진: —'},
   {id:'P8',name:'시운전 벤치',cat:'v',href:'#bench',desc:'훈련 셀 600개로 배우고 검증 셀 200개로 잽니다. 모든 엔진이 같은 조건입니다.',met:'검증 셀 200개',loop:true,who:['fly','fly_magnify',0.5]},
   {id:'P9',name:'정비 공정 ①~⑩',cat:'m',href:'#tune',desc:'신경망 엔진을 분해 정비합니다. 미니배치마다 예측 → 손실 → 역전파 → 옵티마이저 한 걸음.',met:'정비 작업장 10곳',loop:true,mini:true},
   {id:'P10',name:'엔진 비교 · 선정',cat:'v',href:'#bench',desc:'에포크가 끝날 때마다 검증 손실을 보고, 엔진끼리 검증 F1로 견줍니다.',met:'120 에포크 · 9종 비교',loop:true},
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
        if(typeof FVdraw==='function'&&FVdraw(g,p.who[0],t,fp[0],fp[1],hh))return;if(typeof drawMotion==='function'&&mk&&drawMotion(g,mk,'idle',t,fp[0],fp[1],hh,{fps:4}))return;  /* 전신 동작 팩(서기) — 없으면 표정 그림 */
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
    $('#fac-minis').innerHTML=mini('a','공정',(k+1)+' / 12')+mini('','DFF 정비 에포크',(fin?EP:e2)+' / '+EP)+mini('','DFF 훈련 · 검증 손실',fmt(hc[fin?EP:e2][1],3)+' · '+fmt(hc[fin?EP:e2][2],3))+mini('g','장착 엔진 · 검증 F1',b?engName(SEL)+' · '+fmt(b.v.f1,3):'—');
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
 '하이퍼파라미터':['하이퍼파라미터','설정','학습 전에 사람이 정하는 숫자. 학습률, 배치 크기, 에포크, 은닉 뉴런 수 등.'],
 '활성값':['활성값 (activation)','계산','입력이 들어올 때마다 층을 지나며 새로 계산되는 값. 저장된 파라미터가 아니다.'],
 '손실':['손실 (loss)','학습','예측이 정답에서 얼마나 벗어났는지 재는 벌점. 학습은 이것을 줄이는 일.'],
 '교차 엔트로피':['교차 엔트로피','손실','분류의 손실. 정답에 준 확률 P의 −ln P를 평균한다.'],
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
 '표준화':['표준화','전처리','평균을 빼고 표준편차로 나눠 눈금을 맞추는 일. 훈련 데이터의 통계로만 한다.'],
 '시그모이드':['시그모이드 σ','함수','σ(z) = 1/(1+e^(−z)). 어떤 수든 0~1의 확률처럼 바꾼다.'],
 'tanh':['tanh','함수','−1~1로 눌러 주는 S자 함수. 이 페이지의 은닉층 활성화.'],
 '데이터세트':['데이터세트','데이터','모델이 배우고 평가받는 표. 여기서는 셀 1,000개 × 측정값 4개 + 불량 라벨.'],
 '로지스틱 회귀':['로지스틱 회귀','엔진','가중합을 시그모이드로 확률로 바꾸는 선형 판정기. 뉴런 하나와 같다.'],
 '결정 트리':['결정 트리','엔진','질문을 이어 가며 나누는 판정기. 경계가 계단 모양.'],
 '랜덤 포레스트':['랜덤 포레스트','엔진','조금씩 다른 데이터로 키운 트리 여러 그루의 투표.'],
 '부스팅':['그래디언트 부스팅','엔진','앞 트리가 틀린 만큼을 다음 트리가 고치며 차례로 더하는 앙상블.'],
 'SVM':['SVM','엔진','두 반 사이의 여백을 가장 넓게 하는 경계. 커널로 굽은 경계도 만든다.'],
 '나이브 베이즈':['나이브 베이즈','엔진','특징끼리 독립이라 가정하고 확률을 곱하는 판정기.'],
 '오토인코더':['오토인코더','엔진','입력을 좁은 병목으로 줄였다가 다시 복원하도록 배우는 신경망. 복원이 안 되면 이상으로 본다.'],
 '판정 경계':['판정 경계','개념','엔진이 불량과 양품을 가르는 선(면).'],
 'F1':['F1','지표','정밀도와 재현율의 조화 평균. 불량처럼 드문 쪽을 잡는 성능을 함께 본다.'],
 '재현율':['재현율','지표','실제 불량 가운데 모델이 불량이라고 잡아낸 비율.'],
 '정밀도':['정밀도','지표','모델이 불량이라고 한 것 가운데 진짜 불량의 비율.'],
 'σ':['σ','기호','시그모이드 함수. 문맥에 따라 표준편차를 뜻하기도 한다(이 페이지의 "+1.5σ").'],
 'η':['η (에타)','기호','학습률.'],
 '∂':['∂','기호','편미분. 다른 값은 그대로 두고 하나만 바꿀 때의 변화율.']
},['파라미터','가중치','편향','하이퍼파라미터','활성값','손실','역전파','기울기','학습률','미니배치','에포크','과적합']);


U.Study({quiz:{
 bench:[{q:'두 엔진의 평균 F1 차이가 0.005이고, 나눌 때마다 흔들리는 폭(편차)이 0.05라면?',o:['순위를 믿기 어렵다 — 비슷하다고 본다','앞선 엔진이 확실히 낫다','편차는 무시해도 된다','검증 셀을 줄이면 해결된다'],a:0,why:'차이가 흔들림보다 훨씬 작으면 다시 나눌 때 순위가 뒤집힐 수 있습니다.',hint:'0.005와 0.05를 견줘 보세요.'},
        {q:'불량이 20%인 데이터에서 "모두 양품"이라고만 하는 엔진의 정확도는?',o:['80% (재현율은 0)','20%','50%','100%'],a:0,why:'양품 80%를 다 맞히니 정확도 80%, 불량은 하나도 못 잡아 재현율 0. 그래서 F1로 견줍니다.',hint:'양품이 몇 %인지 보세요.'}],
 w1:[{q:'카드 01의 표기에서 w₁₂는 어느 선일까요?',o:['x₂에서 y₁로','x₁에서 y₂로','x₁에서 y₁로','y₁의 편향'],a:0,why:'첫째 첨자는 받는 뉴런(y₁), 둘째 첨자는 보내는 입력(x₂)입니다.',hint:'첨자 순서는 "받는 쪽, 보내는 쪽"이에요.'}],
 w2:[{q:'w₁ = 0.5, w₂ = −1.0, b = 0.2, 입력 (2, 3)이면 z는?',o:['−1.8','1.8','−2.0','4.2'],a:0,why:'0.5×2 − 1.0×3 + 0.2 = 1 − 3 + 0.2 = −1.8.',hint:'곱해서 모두 더한 뒤 b를 더해요.'}],
 w3:[{q:'길들인 엔진에 다른 셀을 넣으면 바뀌는 것은?',o:['은닉층 활성값','W₁의 값','b₂의 값','파라미터 개수'],a:0,why:'파라미터는 고정이고, 입력에 따라 활성값만 새로 계산됩니다.',hint:'엔진의 부품과 지나가는 연료 중 무엇이 바뀔까요?'}],
 w4:[{q:'입력 4 → 은닉 8 → 출력 1 엔진의 파라미터 수는?',o:['49','44','40','41'],a:0,why:'(4×8 + 8) + (8×1 + 1) = 40 + 9 = 49.',hint:'층마다 입력×출력 + 출력(편향).'}],
 w5:[{q:'아무것도 모르는 엔진이 늘 0.5라고 말하면 손실은?',o:['ln 2 ≈ 0.693','0','−ln 0.1 ≈ 2.30','1.0'],a:0,why:'정답에 0.5를 주므로 −ln 0.5 = ln 2 ≈ 0.693.',hint:'−ln P(정답)에 P = 0.5를 넣어요.'}],
 w6:[{q:'기울기 검사에서 역전파 값과 직접 잰 값이 크게 다르면?',o:['역전파 코드의 버그를 의심한다','학습률을 키운다','데이터를 늘린다','에포크를 늘린다'],a:0,why:'기울기 검사는 미분 코드가 맞는지 보는 검사입니다. 어긋나면 코드부터 봅니다.',hint:'이 검사가 무엇을 확인하는지 떠올려 보세요.'}],
 w7:[{q:'w = 0.50, 기울기 +0.20, η = 0.10이면 한 걸음 뒤 w는?',o:['0.48','0.52','0.30','0.70'],a:0,why:'0.50 − 0.10 × 0.20 = 0.48. 기울기의 반대쪽으로 움직입니다.',hint:'w ← w − η × 기울기.'}],
 w8:[{q:'훈련 셀 600개, 배치 32면 1 에포크는 몇 스텝일까요?',o:['19','18','32','600'],a:0,why:'600 ÷ 32 = 18.75이므로 마지막 작은 배치까지 19스텝.',hint:'나누고 올림해요.'}],
 w9:[{q:'이 페이지의 어댑터 방식에서 학습하는 값은?',o:['보정 A·B와 출력층, 21개','49개 전부','아무것도 없음','W₁만'],a:0,why:'W₁·b₁은 잠그고 A(8)·B(4)와 W₂(8)·b₂(1)만 배웁니다.',hint:'잠근 것과 고친 것을 나눠 보세요.'}],
 w10:[{q:'훈련 손실은 계속 줄고 검증 손실이 다시 오르기 시작하면?',o:['과적합 — 검증 기준으로 멈추거나 엔진을 줄인다','학습률을 키운다','시험 데이터로 설정을 다시 고른다','정상이니 끝까지 돈다'],a:0,why:'처음 보는 데이터에서 나빠지는 것은 외우기 시작했다는 신호입니다.',hint:'시험 데이터는 2편에서 한 번만.'},
      {q:'배포한 뒤 셀을 넣어 판정하면 가중치는?',o:['그대로 고정','판정마다 조금씩 바뀐다','셀 수만큼 늘어난다','매일 자동으로 학습된다'],a:0,why:'일반적인 추론은 가중치를 읽기만 합니다. 바뀌는 것은 활성값입니다.',hint:'⑩의 지문 비교를 떠올려 보세요.'}],
 duel:[{q:'이 대결이 말해 주는 것은?',o:['굽은 관계가 있는 데이터에서는 굽은 경계를 긋는 엔진이 유리했다','큰 엔진이 늘 낫다','작은 엔진은 쓸모없다','신경망은 데이터 양과 상관없이 이긴다'],a:0,why:'셀 600개에서는 DFF가 이겼지만, ⑩에서 셀 80개일 때는 작은 크기가 검증 손실이 가장 낮았습니다.',hint:'⑩의 결과와 함께 생각해 보세요.'}]
}});

/* 처음 화면: 장착 엔진(신경망) 시운전 + 나머지는 조금씩 */
fitEngine('mlp');shelf();mount();benchTable();
(function(){var rest=EN.LIST.map(function(e){return e.id;}).filter(function(id){return id!=='mlp';}),i=0;
  function next(){if(i>=rest.length){$('#b-prog').textContent='완료 · 9종';shelf();benchTable();setTimeout(function(){runRep(function(){shelf();shipUI();});},400);return;}fitEngine(rest[i++]);$('#b-prog').textContent='자동 시운전 '+(i+1)+' / 9';if(i%3===0){shelf();benchTable();}setTimeout(next,60);}
  setTimeout(next,300);})();
U.start();
})();
