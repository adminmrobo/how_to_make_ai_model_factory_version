/* solar.js — 「태양광 패널 셀 생산 공장 ④」 페이지 스크립트 (IIFE 하나). 계산은 solar_sim.js(SS) */
(function(){
'use strict';
var $=U.$,$$=U.$$,fmt=U.fmt,cssv=U.cssv,clamp=U.clamp;
var C={eye:cssv('--eye'),gfp:cssv('--gfp'),amber:cssv('--amber'),info:cssv('--info'),muted:cssv('--muted'),text:cssv('--text'),rule:cssv('--rule')};
function n0(x){return Math.round(x).toLocaleString('ko-KR');}
function pct(x,d){return fmt(x*100,d==null?1:d)+'%';}
function dp(x){return x>=100?n0(x):x>=10?fmt(x,0):fmt(x,1);}
function won(x){return x>=1e8?fmt(x/1e8,1)+'억 원':n0(x/1e4)+'만 원';}
function mini(cls,label,val){return '<div class="mini '+(cls||'')+'"><span>'+label+'</span><b>'+val+'</b></div>';}
var K=SS.K,SUPC={A:'#3567a8',B:'#d9822b',C:'#8e62b3'},SEAS=['spring','summer','autumn','winter'],LOADS=[70,85,100];
var V1=SS.trainV1(500);
function cond(o){return {sup:o.sup,plant:o.plant,shift:o.shift,season:o.season,load:o.load};}
var CFG=cond(K.base);
function key(c){return c.sup+c.plant+c.shift+c.season+c.load;}
var T2={};function v2t(c){var k=key(c);if(T2[k]==null)T2[k]=SS.v2T(c,500);return T2[k];}
function cname(c){return SS.SUP[c.sup].name.split(' (')[0]+' · '+c.plant+'공장 · '+c.shift+'교대 · '+SS.SEASON[c.season].name+' · 가동률 '+c.load+'%';}

/* ══ 기준·최악 KPI ══ */
var RAW={},ESC1={};SS.ALL.forEach(function(c){RAW[key(c)]=SS.stats(c,null);ESC1[key(c)]=SS.stats(c,V1.t);});
(function(){var b=RAW[key(K.base)],w=SS.ALL.reduce(function(a,c){return RAW[key(c)].sigma<RAW[key(a)].sigma?c:a;}),we=SS.ALL.reduce(function(a,c){return ESC1[key(c)].escDpmo>ESC1[key(a)].escDpmo?c:a;});
  $('#k-base').textContent=fmt(b.sigma,2)+'σ';$('#k-worst').textContent=fmt(RAW[key(w)].sigma,2)+'σ';$('#k-esc').textContent=n0(ESC1[key(we)].escDpmo);
  $('#j-n').textContent=V1.n;$('#p-zero').textContent='기준 조건 광열화 시험 '+V1.n+'개 중 불량 '+V1.pos+'개';})();

/* ══ 조종실 ══ */
function bindAll(){U.btns($('#g-sup'),[['A','A 국내'],['B','B 동남아'],['C','C 신규']],CFG.sup,function(v){CFG.sup=v;upd();});
  U.btns($('#g-plant'),[[1,'1공장 (구라인)'],[2,'2공장 (신라인)']],CFG.plant,function(v){CFG.plant=v;upd();});
  U.btns($('#g-shift'),[[2,'2교대 (12시간)'],[3,'3교대 (8시간)']],CFG.shift,function(v){CFG.shift=v;upd();});
  U.btns($('#g-season'),SEAS.map(function(s){return [s,SS.SEASON[s].name];}),CFG.season,function(v){CFG.season=v;upd();});
  U.btns($('#g-load'),LOADS.map(function(l){return [l,l+'%'];}),CFG.load,function(v){CFG.load=v;upd();});}
$('#c-reset').onclick=function(){CFG=cond(K.base);bindAll();upd();};
function setCfg(c){CFG=cond(c);bindAll();upd();}
function dens(c,which,x){var P=SS.params(c),s=0;P.forEach(function(p){var m=which==='m'?p.mu:p.mu-p.lid,sd=which==='m'?Math.sqrt(p.sd*p.sd+K.sm*K.sm):Math.sqrt(p.sd*p.sd+p.lsd*p.lsd);s+=SS.phi((x-m)/sd)/sd/24;});return s;}
function drawDist(){var c=CFG,xs=[],xr=[22.0,23.8];for(var x=xr[0];x<=xr[1]+1e-9;x+=0.01)xs.push(x);var ym=0,A=xs.map(function(x){var a=dens(c,'m',x),b=dens(c,'f',x);ym=Math.max(ym,a,b);return [x,a,b];});
  var t2=v2t(c),o=U.plot($('#cvDist'),{xr:xr,yr:[0,ym*1.12],xt:[22.0,22.4,22.8,23.2,23.6],yt:[],xl:'셀 효율 (%)',yl:'',series:[{pts:A.map(function(r){return [r[0],r[1]];}),color:'rgba(22,33,43,.4)',width:2},{pts:A.map(function(r){return [r[0],r[2]];}),color:SUPC[c.sup],width:2.6}],
    vlines:[{x:K.LSL,color:C.eye,label:'규격 하한 '+fmt(K.LSL,2),dash:[2,0]},{x:V1.t,color:C.amber,label:'v1 문턱 '+fmt(V1.t,2),dy:18},{x:t2,color:C.gfp,label:'v2 문턱 '+fmt(t2,2),dy:36}],stamp:'설명용 모형'});
  var g=o.g;g.fillStyle='rgba(201,48,44,.18)';g.beginPath();g.moveTo(o.X(xr[0]),o.Y(0));A.forEach(function(r){if(r[0]<=K.LSL)g.lineTo(o.X(r[0]),o.Y(r[2]));});g.lineTo(o.X(K.LSL),o.Y(0));g.closePath();g.fill();
  g.font='11.5px '+cssv('--font');g.textAlign='left';g.fillStyle='rgba(22,33,43,.6)';g.fillText('— 출하 때 측정',o.X(xr[0])+6,30);g.fillStyle=SUPC[c.sup];g.fillText('— 광열화 뒤 (빨간 면적 = 불량)',o.X(xr[0])+6,46);}
function upd(){var c=CFG,r=RAW[key(c)],s1=ESC1[key(c)],s2=SS.stats(c,v2t(c));drawDist();
  $('#c-minis').innerHTML=mini(r.sigma>=5.5?'g':r.sigma<4?'r':'a','공정 시그마 수준 (판정 전)',fmt(r.sigma,2)+'σ · '+dp(r.dpmo)+' DPMO')+mini('','불량 내역 (DPMO)','효율 '+dp(r.pd*1e6)+' + 크랙 '+dp(r.crack*1e6))+mini(r.cpk>=1.5?'g':r.cpk<1?'r':'a','Ppk (장기 공정 성능, 광열화 뒤)',fmt(r.cpk,2))+mini('','평균 · 표준편차 (광열화 뒤)',fmt(r.mu,2)+'% · '+fmt(r.sdf,3)+'%p')+
    mini(s1.escDpmo>100?'r':'g','v1 판정 뒤 출하 품질',dp(s1.escDpmo)+' DPMO · '+fmt(s1.sigmaOut,2)+'σ')+mini('','v1 과잉 폐기',pct(s1.frRate,2))+mini(s2.escDpmo>100?'a':'g','v2 판정 뒤 출하 품질',dp(s2.escDpmo)+' DPMO · '+fmt(s2.sigmaOut,2)+'σ')+mini('','v2 과잉 폐기',pct(s2.frRate,2));
  var it=[];if(key(c)===key(K.base))it.push(['g','기준 조건입니다. 공정만으로 '+fmt(r.sigma,2)+'σ — 거의 6시그마예요. v1 판정기는 이 조건에서 학습했으니 여기서는 잘 맞습니다.']);
  else{it.push([s1.escDpmo>s2.escDpmo*2?'r':'a','이 조건('+cname(c)+')의 공정 시그마는 '+fmt(r.sigma,2)+'σ. 기준 조건 판정기(v1, 문턱 '+fmt(V1.t,2)+'%)를 그대로 쓰면 출하 불량 '+dp(s1.escDpmo)+' DPMO, 이 조건에 맞춘 문턱('+fmt(v2t(c),2)+'%)이면 '+dp(s2.escDpmo)+' DPMO입니다.']);
    if(s2.frRate>0.02)it.push(['a','대신 v2는 멀쩡한 셀의 '+pct(s2.frRate,1)+'를 버립니다. 판정기로는 6시그마를 살 수 없어요 — 이 조건은 공정을 고쳐야 합니다.']);}
  if(r.crack*1e6>r.pd*1e6*0.3)it.push(['m','이 조건 불량 '+dp(r.dpmo)+' DPMO 가운데 크랙이 '+dp(r.crack*1e6)+'입니다. 효율만 보면 Ppk가 1.5를 넘어도, 크랙을 더한 전체 불량으로 계산한 시그마 수준은 6에 못 미칠 수 있어요.']);
  U.ins($('#i-control'),it);drawShift();hm();Plant.redraw&&Plant.redraw();labUpd();
  /* 공장 이벤트: 조건이 거짓→참으로 바뀔 때 한 번 (fac_events.js) */
  if(typeof FEV!=='undefined'){FEV.cond('defects',r.sigma<3.5,{text:'지금 조건('+cname(c)+')에서 공정이 '+fmt(r.sigma,2)+'σ까지 떨어졌습니다. 기준 조건 판정기 v1을 그대로 쓰면 약 '+n0(s1.escDpmo)+' DPMO가 샙니다.'});
    FEV.cond('supplier',c.sup==='C',{text:'공급사 C의 광열화 시험 라벨이 아직 하나도 없습니다. 판정기가 C를 A처럼 보고 있어요(v1 판정 뒤 유출 '+n0(s1.escDpmo)+' DPMO). 첫 주가 제일 위험합니다.'});}}

/* ══ 분포 사전 ══ */
(function(){var D='https://adminmrobo.github.io/probability_distribution_dictionary/dictionary.html#';
  $('#distcards').innerHTML=[['normal','정규분포','셀 효율','효율은 수많은 작은 원인이 더해져 종 모양으로 퍼집니다. 시간대마다 평균·표준편차가 다른 정규분포 24개를 섞었습니다.'],
    ['poisson','포아송 분포','셀당 미세 크랙 수','드물게, 서로 독립으로 생기는 사건의 개수. 셀당 평균 '+fmt(K.lam*1e6,0)+'개/백만, 가동률 100%면 1.6배.'],
    ['binomial','이항 분포','로트 표본의 불량 수','셀 n개를 뽑았을 때 불량 개수. 6시그마 공장에서 500개를 시험하면 불량 0개가 거의 확실합니다.'],
    ['t','t 분포','라벨이 적을 때의 평균','신규 공급사 C의 광열화를 라벨 10~20개로 추정할 때, 평균의 불확실성은 정규보다 꼬리가 두꺼운 t로 봅니다.'],
    ['weibull','와이블 분포','현장 수명 (다음 단계)','모듈이 현장에서 고장 나는 시점. 이 페이지에서는 다루지 않지만 유출 비용의 근거가 됩니다.']]
   .map(function(d){return '<a href="'+D+d[0]+'"><b>'+d[1]+'</b><span>'+d[2]+'</span><p>'+d[3]+'</p></a>';}).join('');})();

/* ══ 교대 방식 ══ */
function drawShift(){var c=CFG,ser=[2,3].map(function(sh){var cc=cond(c);cc.shift=sh;var P=SS.params(cc);return {pts:P.map(function(p,h){return [h,1e6*SS.Phi((K.LSL-(p.mu-p.lid))/Math.sqrt(p.sd*p.sd+p.lsd*p.lsd))];}),P:P};});
  var ym=Math.max.apply(null,ser[0].pts.concat(ser[1].pts).map(function(p){return p[1];}))*1.15;
  var o=U.plot($('#cvShift'),{xr:[0,23],yr:[0,ym],xt:[0,6,8,14,20,22],yt:[0,Math.round(ym/2),Math.round(ym)],xl:'시각',yl:'불량 DPMO (판정 전)',series:[{pts:ser[0].pts,color:C.amber,width:2.4},{pts:ser[1].pts,color:C.info,width:2.4}],stamp:'설명용 모형'});
  var g=o.g;g.font='11.5px '+cssv('--font');g.textAlign='left';g.fillStyle=C.amber;g.fillText('— 2교대 (08·20시 인계, 근무 막바지 3시간)',o.X(0)+6,30);g.fillStyle=C.info;g.fillText('— 3교대 (06·14·22시 인계)',o.X(0)+6,46);
  var cc2=cond(c);cc2.shift=2;var cc3=cond(c);cc3.shift=3;var a=SS.stats(cc2,null),b=SS.stats(cc3,null);
  U.ins($('#i-shift'),[['a','이 조건에서 하루 평균 불량: 2교대 '+dp(a.dpmo)+' DPMO, 3교대 '+dp(b.dpmo)+' DPMO. 2교대는 근무 막바지 3시간에, 3교대는 인계 직후 1시간에 꼬리가 두꺼워집니다.'],['m','같은 공장이라도 교대 방식이 바뀌면 시간대별 분포가 달라집니다. 판정 문턱을 시간대마다 바꿀지는 라벨 수와 운영 부담을 보고 정합니다.']]);}

/* ══ 3D 공장 ══ */
var Plant={};
(function(){var cv=$('#cvPlant'),narrow=(cv.clientWidth||window.innerWidth)<600,yaw=narrow?-0.15:-0.5,pitch=narrow?1.2:0.82,play=!U.reduce,hr=6,spd=1.5,sel=-1,t=0,evH=-1;
  var PR=[['P1','웨이퍼 입고','원재료 수입처별 웨이퍼가 들어옵니다. 컨베이어 위 셀 색이 수입처입니다.','f'],['P2','세척·텍스처링','표면을 거칠게 만들어 빛을 덜 반사하게 합니다. 조수 하루가 시간대별 기록을 맡아요.','e'],['P3','확산 (PN 접합)','인을 확산시켜 접합을 만듭니다. 인턴 시아 담당.','e'],['P4','에칭·세정','가장자리 접합과 산화막을 걷어 냅니다. 인턴 모아 담당.','e'],['P5','반사방지막','질화규소 막을 입힙니다. 여름 습도에 민감합니다.','e'],['P6','전극 인쇄','은 페이스트를 인쇄합니다. 주판봇이 생산량을 챙겨요.','e'],['P7','소성','전극을 구워 붙입니다. 가동률을 올리면 온도 편차가 커집니다.','e'],
    ['P8','레이저 처리','후면 접촉을 엽니다. 초파리 연구원이 크랙을 의심해요.','e'],['P9','효율 측정 (IV)','빛을 비춰 출하 효율을 잽니다. 측정 잡음 0.03%p.','v'],['P10','EL 크랙 검사','미세 크랙을 97% 찾아냅니다(포아송으로 생긴 크랙).','v'],['P11','판정·등급 분류','간이 판정기가 문턱으로 합격·불합격을 정합니다. 박사가 기준을 승인합니다.','v'],['P12','출하','합격 셀을 모듈 공장으로 보냅니다. 광열화는 고객의 지붕 위에서 일어납니다.','f']];
  var WHO={1:['asst',0.9],2:['sia',0.88],3:['moa',0.86],5:['robo',0.72],7:['fly',0.41],10:['doc',1.0]},SHEET={doc:'D1',asst:'A1',sia:'S1',moa:'M1',fly:'F1',robo:'R1'};
  var XS=[-10,-6,-2,2,6,10],P12=PR.map(function(p,i){var row=i<6?0:1;return {id:p[0],name:p[1],desc:p[2],cat:p[3],x:row?XS[5-(i-6)]:XS[i],y:row?4.6:-4.6,h:[1.3,1.6,2.0,1.6,2.2,1.6,2.0,1.5,1.8,1.8,2.0,1.3][i]};});
  var CAT={f:['#fbecd3','#ecc98f','#dfb46e'],e:['#e3eef9','#bcd3ee','#a3c2e6'],v:['#efe0f6','#d6b7e6','#c39bd9']},CREW=['#2f8f5b','#3567a8','#8e62b3'],CN=['가','나','다'];
  var cx,cy,sc;function P(x,y,z){var c=Math.cos(yaw),s=Math.sin(yaw),rx=x*c-y*s,ry=x*s+y*c,cp=Math.cos(pitch),sp=Math.sin(pitch);return [cx+rx*sc,cy+(-z*cp-ry*sp)*sc,ry*cp-z*sp];}
  function fwd(){var c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return [s*cp,c*cp,-sp];}
  function poly(g,pts,fill,stroke){g.beginPath();pts.forEach(function(p,k){k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.stroke();}}
  function box(g,x,y,z0,w,d,h,cols,hl){var F=fwd(),x0=x-w/2,x1=x+w/2,y0=y-d/2,y1=y+d/2,z1=z0+h;
    var faces=[[[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],0],[[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],1],[[0,1,0],[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],1],[[-1,0,0],[[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],2],[[1,0,0],[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],2]];
    g.lineWidth=hl?2.4:1;faces.forEach(function(f){var n=f[0];if(n[0]*F[0]+n[1]*F[1]+n[2]*F[2]>=0)return;poly(g,f[1].map(function(p){return P(p[0],p[1],p[2]);}),cols[f[2]],hl?hl:'rgba(22,33,43,.35)');});}
  var PATH=[[-13.5,-2.4],[12.6,-2.4],[13.6,-1.2],[13.6,1.2],[12.6,2.4],[-13.5,2.4]],SEG=[],TL=0;for(var i=1;i<PATH.length;i++){var l=Math.hypot(PATH[i][0]-PATH[i-1][0],PATH[i][1]-PATH[i-1][1]);SEG.push(l);TL+=l;}
  function along(u){u=((u%1)+1)%1;var d=u*TL;for(var i=0;i<SEG.length;i++){if(d<=SEG[i]){var f=d/SEG[i];return [PATH[i][0]+(PATH[i+1][0]-PATH[i][0])*f,PATH[i][1]+(PATH[i+1][1]-PATH[i][1])*f];}d-=SEG[i];}return PATH[PATH.length-1];}
  var U11=0.85;
  function cell(g,x,y,s,col,bad){g.save();g.fillStyle=bad?'#f3c9c7':'#1e2f4a';g.strokeStyle=bad?C.eye:col;g.lineWidth=2;g.beginPath();g.rect(x-s,y-s*0.6,s*2,s*1.2);g.fill();g.stroke();g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=0.8;for(var k=1;k<3;k++){g.beginPath();g.moveTo(x-s+s*2*k/3,y-s*0.6);g.lineTo(x-s+s*2*k/3,y+s*0.6);g.stroke();}g.restore();}
  function hourInfo(h){var c=CFG,p=SS.params(c)[h],prof=SS.PROF[c.shift][h],acc=0;var N=40;for(var k=0;k<N;k++){var z=-4+8*(k+0.5)/N,w=SS.phi(z)*8/N,e=p.mu+p.sd*z;acc+=w*(1-SS.Phi((V1.t-e)/K.sm));}
    return {p:p,tag:prof.tag,crew:SS.crew(c.shift,h),rej:1-acc,pd:SS.Phi((K.LSL-(p.mu-p.lid))/Math.sqrt(p.sd*p.sd+p.lsd*p.lsd))};}
  function draw(dt){if(play&&dt){t+=dt;hr+=dt*spd;if(hr>=24)hr=0;$('#r-time').value=Math.floor(hr);}else if(dt)t+=dt;
    var hI=Math.floor(hr);if(hI!==evH){var was=evH;evH=hI;if(was>=0&&play&&typeof FEV!=='undefined'&&(CFG.shift===3?[6,14,22]:[8,20]).indexOf(hI)>=0)FEV.fire('handover',{cool:60000,text:'방금 '+hI+'시 교대 인계('+CFG.shift+'교대). 인계 직후 한 시간은 효율 분포의 꼬리가 두꺼워집니다. 인계 체크리스트를 다시 확인하세요.'});}
    var h=Math.floor(hr),I=hourInfo(h),Rr=U.setup(cv),g=Rr.g,w=Rr.w,hh=Rr.h;cx=w/2;cy=hh*0.56;sc=Math.min(w/31,hh/19);
    g.fillStyle=(h>=20||h<6)?'#f1f3f8':'#fbfcfd';g.fillRect(0,0,w,hh);
    g.strokeStyle='rgba(22,33,43,.07)';g.lineWidth=1;for(var x=-15;x<=15;x+=1.5){var a=P(x,-7.5,0),b=P(x,7.5,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}for(var y=-7.5;y<=7.5;y+=1.5){a=P(-15,y,0);b=P(15,y,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
    for(var k=1;k<PATH.length;k++){var x0=PATH[k-1][0],y0=PATH[k-1][1],x1=PATH[k][0],y1=PATH[k][1],dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),nx=-dy/L*0.55,ny=dx/L*0.55;poly(g,[P(x0+nx,y0+ny,0.3),P(x1+nx,y1+ny,0.3),P(x1-nx,y1-ny,0.3),P(x0-nx,y0-ny,0.3)],'#d9dee5','rgba(22,33,43,.25)');}
    var items=[],sdr=I.p.sd/K.sd;
    P12.forEach(function(p,k){var cp=P(p.x,p.y,p.h/2);items.push({d:cp[2],f:function(){var hl=sel===k?C.gfp:I.tag&&k>=1&&k<=7?C.amber:null;box(g,p.x,p.y,0,2.6,2.0,p.h,CAT[p.cat],hl);
        if(k>=1&&k<=7){var bh=clamp((sdr-0.85)*3,0.1,1.8),col=sdr>1.25?C.eye:sdr>1.1?C.amber:C.gfp;box(g,p.x+1.05,p.y+0.75,p.h,0.22,0.22,bh,[col,col,col],false);}
        if(k===0){for(var j=0;j<3;j++)box(g,p.x-1.6,p.y+(j-1)*0.6,0,0.5,0.5,0.4+j*0.1,[SUPC[CFG.sup],SUPC[CFG.sup],SUPC[CFG.sup]],false);}
        var tp=P(p.x,p.y,p.h+0.5);g.beginPath();g.arc(tp[0],tp[1],11,0,7);g.fillStyle=sel===k?C.gfp:'#fff';g.fill();g.lineWidth=1.5;g.strokeStyle=sel===k?C.gfp:C.rule;g.stroke();
        g.fillStyle=sel===k?'#fff':C.text;g.font='700 10.5px '+cssv('--font');g.textAlign='center';g.textBaseline='middle';g.fillText(String(k+1),tp[0],tp[1]+0.5);g.textBaseline='alphabetic';
        if(sel===k||w>700){g.font=(sel===k?'700 ':'')+'11px '+cssv('--font');var lb=P(p.x,p.y,p.h+1.15);U.label(g,lb[0],lb[1],p.name,sel===k?C.gfp:C.muted,'center');}}});
      if(WHO[k]){var fp=P(p.x+1.75,p.y,0),wh=WHO[k];items.push({d:fp[2]-0.01,f:function(){var h2=sc*(w<600?6.0:5.0)*wh[1];if(typeof FVdraw==='function'&&FVdraw(g,wh[0],t,fp[0],fp[1],h2))return;if(typeof drawMotion==='function')drawMotion(g,SHEET[wh[0]],'idle',t,fp[0],fp[1],h2,{fps:4});}});}});
    /* 걸러 낸 셀은 실제 비율이 너무 작아(만 분의 1 수준) 보이도록 25배 키워 그린다 — 패널에 표기 */
    var n=16;for(var c=0;c<n;c++){var u=(c/n+t*0.04)%1,pos=along(u),pp=P(pos[0],pos[1],0.55),bad=u>U11&&((c*7919+Math.floor(t*0.04+c/n))%100)/100<I.rej*25;(function(pp,bad){items.push({d:pp[2]-0.02,f:function(){cell(g,pp[0],pp[1],sc*0.36,SUPC[CFG.sup],bad);}});})(pp,bad);}
    items.sort(function(a,b){return b.d-a.d;}).forEach(function(it){it.f();});
    var bw=Math.min(w-16,360);g.fillStyle='rgba(255,255,255,.9)';g.fillRect(8,8,bw,48);g.strokeStyle=C.rule;g.strokeRect(8,8,bw,48);
    g.fillStyle=CREW[I.crew];g.fillRect(8,8,6,48);g.fillStyle=C.text;g.font='700 12.5px '+cssv('--font');g.textAlign='left';g.fillText(h+'시 · '+CN[I.crew]+'조 근무 ('+CFG.shift+'교대)'+(I.tag?' · '+I.tag:''),20,26);
    g.font='12px '+cssv('--font');g.fillStyle=I.tag?C.eye:C.muted;g.fillText('효율 퍼짐 ×'+fmt(sdr,2)+' · 이 시간 불량 '+dp(I.pd*1e6)+' DPMO · 걸러 냄 '+pct(I.rej,2),20,44);
    U.stamp(g,w,'개략 모형 · 실제 공장 아님');
    $('#p-hud').textContent=h+'시 · '+CN[I.crew]+'조'+(I.tag?' · '+I.tag:'')+' · '+cname(CFG);card(I,h);}
  var lastKey='';
  function card(I,h){var k2=sel+'|'+h+'|'+key(CFG);if(k2===lastKey)return;lastKey=k2;
    var head=sel<0?{id:'공장 전체',name:'태양광 셀 라인 · '+cname(CFG),desc:'공정을 누르면 그 공정의 설명이 보입니다. 기계 위 막대가 노랑·빨강이면 그 시간 효율이 평소보다 넓게 퍼집니다.'}:P12[sel];
    $('#pc-no').textContent=sel<0?head.id:head.id+' / 12';$('#pc-name').textContent=head.name;$('#pc-desc').textContent=head.desc;$('#pc-metric').textContent='걸린 판정기: v1 (기준 조건 학습, 문턱 '+fmt(V1.t,2)+'%)';
    $('#plant-minis').innerHTML=mini('','이 시간 평균 (광열화 뒤)',fmt(I.p.mu-I.p.lid,2)+'%')+mini(I.p.sd/K.sd>1.2?'r':'','효율 표준편차',fmt(I.p.sd,3)+'%p')+mini(I.pd*1e6>100?'r':'g','이 시간 불량 (판정 전)',dp(I.pd*1e6)+' DPMO')+mini('a','판정기가 걸러 냄',pct(I.rej,2));}
  Plant.redraw=function(){lastKey='';if(!play)draw(0);};
  $('#pchips').innerHTML=P12.map(function(p){return '<button type="button">'+p.id+' '+p.name+'</button>';}).join('');
  $$('#pchips button').forEach(function(b,i){b.onclick=function(){sel=sel===i?-1:i;$$('#pchips button').forEach(function(x,j){x.classList.toggle('on',j===sel);});lastKey='';draw(0);};});
  var pb=$('#p-play');function setPlay(v){play=v;pb.textContent=v?'⏸ 멈춤':'▶ 재생';}setPlay(play);pb.onclick=function(){setPlay(!play);};
  $('#r-time').oninput=function(){hr=+this.value;setPlay(false);lastKey='';draw(0);};
  U.btns($('#g-pspd'),[[0.5,'느리게'],[1.5,'보통'],[4,'빠르게']],1.5,function(v){spd=v;});
  U.btns($('#g-pview'),[['a','비스듬히'],['t','위에서'],['l','낮게'],['L','⟲'],['R','⟳']],'a',function(v){if(v==='a'){yaw=-0.5;pitch=0.82;}else if(v==='t'){yaw=0;pitch=1.45;}else if(v==='l'){yaw=-0.75;pitch=0.32;}else if(v==='L')yaw-=0.35;else yaw+=0.35;draw(0);});
  var drag=null;cv.style.touchAction='pan-y';cv.style.cursor='grab';
  cv.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,yaw:yaw,pitch:pitch,mv:false};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.mv=true;if(drag.mv){yaw=drag.yaw+dx*0.008;pitch=clamp(drag.pitch+dy*0.006,0.15,1.5);if(!play)draw(0);}});
  cv.addEventListener('pointerup',function(e){if(drag&&!drag.mv){var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,best=-1,bd=900;P12.forEach(function(p,k){[p.h+0.5,p.h*0.5].forEach(function(z){var q=P(p.x,p.y,z),d=(q[0]-mx)*(q[0]-mx)+(q[1]-my)*(q[1]-my);if(d<bd){bd=d;best=k;}});});
      if(best>=0){sel=best;$$('#pchips button').forEach(function(x,j){x.classList.toggle('on',j===sel);});lastKey='';draw(0);}}drag=null;});
  cv.addEventListener('pointercancel',function(){drag=null;});
  cv.tabIndex=0;cv.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')yaw-=0.12;else if(e.key==='ArrowRight')yaw+=0.12;else if(e.key==='ArrowUp')pitch=clamp(pitch+0.1,0.15,1.5);else if(e.key==='ArrowDown')pitch=clamp(pitch-0.1,0.15,1.5);else return;e.preventDefault();draw(0);});
  U.reg(cv,function(dt){if(dt===0||play)draw(dt);});
})();

/* ══ 간이 판정기 ══ */
(function(){var pstar=K.cfr/(K.cfr+K.cesc),J=cond(K.base),truth=null;
  function opts(el,list,cur){el.innerHTML=list.map(function(o){return '<option value="'+o[0]+'"'+(String(o[0])===String(cur)?' selected':'')+'>'+o[1]+'</option>';}).join('');}
  opts($('#j-sup'),[['A',SS.SUP.A.name],['B',SS.SUP.B.name],['C',SS.SUP.C.name]],J.sup);opts($('#j-plant'),[[1,'1공장 (구라인)'],[2,'2공장 (신라인)']],J.plant);opts($('#j-shift'),[[2,'2교대'],[3,'3교대']],J.shift);
  opts($('#j-season'),SEAS.map(function(s){return [s,SS.SEASON[s].name];}),J.season);opts($('#j-load'),LOADS.map(function(l){return [l,l+'%'];}),J.load);
  $('#j-model').textContent='v1: 광열화 뒤 효율 ≈ '+fmt(V1.a,3)+' + '+fmt(V1.b,3)+' × 출하 효율 (오차 '+fmt(V1.s,3)+'%p) · 문턱 '+fmt(V1.t,3)+'%';
  function read(){J={sup:$('#j-sup').value,plant:+$('#j-plant').value,shift:+$('#j-shift').value,season:$('#j-season').value,load:+$('#j-load').value};}
  function p2(c,em){var P=SS.params(c),s=0;P.forEach(function(p){var v=1/(1/(p.sd*p.sd)+1/(K.sm*K.sm)),m=v*(p.mu/(p.sd*p.sd)+em/(K.sm*K.sm));s+=SS.Phi((K.LSL-(m-p.lid))/Math.sqrt(v+p.lsd*p.lsd))/24;});return s;}
  function verdict(name,p,em,t,cr,sub){var cls,v;if(cr>0){cls='ng';v='불합격 (크랙)';}else if(Math.abs(em-t)<K.sm){cls='hold';v='보류 · 재측정';}else if(em<t){cls='ng';v='불합격';}else{cls='ok';v='합격';}
    return '<div class="verdict '+cls+'"><div class="vt">'+name+'</div><div class="vv">'+v+'</div><div class="pb"><i style="width:'+clamp(p/0.2*100,1,100)+'%;background:'+(p>pstar?C.eye:C.gfp)+'"></i></div><div class="mnote">광열화 뒤 규격 미달 확률 '+(p<0.0001?'0.01% 미만':pct(p,2))+' (기준 '+pct(pstar,1)+') · 문턱 '+fmt(t,2)+'%'+(sub?'<br>'+sub:'')+'</div></div>';}
  function run(){read();var em=+$('#j-eta').value,cr=+$('#j-cr').value,t2=v2t(J);
    var h=verdict('v1 · 기준 조건에서 학습한 판정기',V1.prob(em),em,V1.t,cr,'이 판정기는 수입처·공장·교대를 입력으로 받지 않습니다')+verdict('v2 · 조건을 아는 판정기',p2(J,em),em,t2,cr,'광열화 추정 '+fmt(SS.SUP[J.sup].lid+SS.SEASON[J.season].dl,2)+'%p ('+SS.SUP[J.sup].name.split(' (')[0]+' · '+SS.SEASON[J.season].name+')');
    if(truth)h+='<div class="verdict '+(truth.bad?'ng':'ok')+'"><div class="vt">정답 · 광열화 시험을 했다면</div><div class="vv">'+(truth.bad?'불량':'양품')+'</div><div class="mnote">광열화 뒤 효율 '+fmt(truth.ef,2)+'% (손실 '+fmt(truth.lid,2)+'%p)'+(truth.cr?' · 실제 크랙 '+truth.cr+'개':'')+'</div></div>';
    $('#j-out').innerHTML=h;var d=Math.abs(t2-V1.t)>=0.03&&em>=Math.min(t2,V1.t)&&em<Math.max(t2,V1.t);
    U.ins($('#i-judge'),[[d?'r':'m',d?'같은 셀, 다른 판정: v1은 '+(em>=V1.t?'합격':'불합격')+', v2는 '+(em>=t2?'합격':'불합격')+'. 이 조건에서는 문턱이 '+fmt(V1.t,2)+'% → '+fmt(t2,2)+'%로 달라져야 합니다.':'두 판정기의 문턱: v1 '+fmt(V1.t,2)+'%, v2 '+fmt(t2,2)+'%. 공급사 C를 고르고 출하 효율을 두 문턱 사이(예: '+fmt((V1.t+v2t({sup:'C',plant:J.plant,shift:J.shift,season:J.season,load:J.load}))/2,2)+'%)에 넣어 보세요.']]);}
  ['j-sup','j-plant','j-shift','j-season','j-load','j-eta','j-cr'].forEach(function(id){$('#'+id).addEventListener(id==='j-eta'||id==='j-cr'?'input':'change',function(){if(id!=='j-eta'&&id!=='j-cr'||true)truth=null;run();});});
  var seed=1;$('#j-rand').onclick=function(){read();var cs=SS.cells(J,24,(seed++)*7919),c=cs[Math.floor(Math.random()*24)];truth={bad:c.bad,ef:c.ef,lid:c.lid,cr:c.cr};$('#j-eta').value=c.em.toFixed(2);$('#j-cr').value=c.crSeen?c.cr:0;run();};
  run();})();

/* ══ 조건 지도 ══ */
var hmMode='raw',V2S={};
U.btns($('#g-hm'),[['raw','공정 시그마 (판정 전)'],['v1','v1 판정 뒤 유출 DPMO'],['fr','v1 과잉 폐기 %'],['v2','v2 판정 뒤 유출 DPMO']],'raw',function(v){hmMode=v;hm();});
function hcol(v,mode){var u;if(mode==='raw')u=clamp((6-v)/3,0,1);else if(mode==='fr')u=clamp(v/0.05,0,1);else u=clamp(Math.log10(Math.max(v,1))/4.5,0,1);return 'rgb('+Math.round(230-20*u+25*u)+','+Math.round(245-190*u)+','+Math.round(236-200*u)+')';}
function hm(){var rows=[];['A','B','C'].forEach(function(s){[1,2].forEach(function(pl){[2,3].forEach(function(sh){rows.push([s,pl,sh]);});});});
  var h='<thead><tr><th rowspan="2">수입처 · 공장 · 교대</th>'+SEAS.map(function(se){return '<th colspan="3">'+SS.SEASON[se].name+'</th>';}).join('')+'</tr><tr>'+SEAS.map(function(){return LOADS.map(function(l){return '<th>'+l+'%</th>';}).join('');}).join('')+'</tr></thead><tbody>';
  var bad=0;rows.forEach(function(r){h+='<tr><th style="text-align:left;white-space:nowrap"><span class="tag2" style="border-color:'+SUPC[r[0]]+';color:'+SUPC[r[0]]+'">'+r[0]+'</span> '+r[1]+'공장 · '+r[2]+'교대</th>';
    SEAS.forEach(function(se){LOADS.forEach(function(l){var c={sup:r[0],plant:r[1],shift:r[2],season:se,load:l},k=key(c),v,txt;
      if(hmMode==='raw'){v=RAW[k].sigma;txt=fmt(v,1);}else if(hmMode==='v1'){v=ESC1[k].escDpmo;txt=dp(v);if(v>100)bad++;}else if(hmMode==='fr'){v=ESC1[k].frRate;txt=fmt(v*100,1);}else{if(!V2S[k])V2S[k]=SS.stats(c,v2t(c));v=V2S[k].escDpmo;txt=dp(v);if(v>100)bad++;}
      h+='<td data-k="'+[r[0],r[1],r[2],se,l].join('|')+'" class="'+(k===key(CFG)?'me':'')+'" style="background:'+hcol(v,hmMode)+'">'+txt+'</td>';});});h+='</tr>';});
  $('#tb-hm').innerHTML=h+'</tbody>';
  $$('#tb-hm td[data-k]').forEach(function(td){td.onclick=function(){var a=td.dataset.k.split('|');setCfg({sup:a[0],plant:+a[1],shift:+a[2],season:a[3],load:+a[4]});document.getElementById('control').scrollIntoView({behavior:U.reduce?'auto':'smooth'});};});
  var n6=SS.ALL.filter(function(c){return RAW[key(c)].sigma>=5.5;}).length;
  var it=[['m','144칸 중 공정만으로 5.5σ 이상인 조건은 '+n6+'칸입니다. 공급사 C, 여름, 가동률 100%, 1공장이 겹칠수록 시그마가 떨어집니다.']];
  if(hmMode==='v1')it.push(['r','기준 조건 판정기(v1)를 144칸에 그대로 쓰면 유출이 100 DPMO를 넘는 칸이 '+bad+'개입니다.']);
  if(hmMode==='v2')it.push(['a','조건에 맞춘 문턱(v2)을 써도 100 DPMO를 넘는 칸이 '+bad+'개 남습니다. 공정 시그마가 낮은 칸은 판정이 아니라 공정 개선이 답입니다.']);
  if(hmMode==='fr')it.push(['a','v1의 과잉 폐기는 어느 칸이나 작습니다 — 문제는 버리는 쪽이 아니라 새는 쪽이에요.']);
  U.ins($('#i-grid'),it);}

/* ══ 관리도 ══ */
(function(){var A0={sup:'A',plant:2,shift:3,season:'spring',load:85},C0={sup:'C',plant:2,shift:3,season:'spring',load:85},day=[],wk=[];
  for(var d=0;d<91;d++){var c=d<42?A0:C0,cs=SS.cells(c,240,1000+d),m=cs.reduce(function(a,x){return a+x.em;},0)/cs.length;day.push([d/7+1,m]);}
  for(var w=0;w<13;w++){var c2=w<6?A0:C0,cs2=SS.cells(c2,10,5000+w),l=cs2.reduce(function(a,x){return a+x.lid;},0)/10,bd=cs2.filter(function(x){return x.ef<K.LSL;}).length;wk.push([w+1,l,bd]);}
  function lim(arr,n){var v=arr.slice(0,n).map(function(x){return x[1];}),m=v.reduce(function(a,b){return a+b;},0)/v.length,s=Math.sqrt(v.reduce(function(a,b){return a+(b-m)*(b-m);},0)/(v.length-1));return [m,m-3*s,m+3*s];}
  var L1=lim(day,42),L2=lim(wk,6);
  function d1(){var o=U.plot($('#cvSpc'),{xr:[1,14],yr:[L1[1]-0.05,Math.max(L1[2],Math.max.apply(null,day.map(function(x){return x[1];})))+0.03],xt:[1,4,7,10,13],yt:[],xl:'주',yl:'출하 효율 하루 평균 (%)',series:[{pts:day,color:C.info,width:1.6}],hlines:[{y:L1[0],color:'rgba(22,33,43,.45)',label:'중심선 '+fmt(L1[0],3)},{y:L1[2],color:C.eye,label:'관리 상한'},{y:L1[1],color:C.eye,label:'관리 하한'}],vlines:[{x:7,color:SUPC.C,label:'7주차 공급사 C로 변경'}],stamp:'설명용 모형'});}
  function d2(){U.plot($('#cvSpc2'),{xr:[1,13],yr:[0.15,0.8],xt:[1,4,7,10,13],yt:[0.2,0.4,0.6,0.8],xl:'주',yl:'광열화 손실, 주간 10개 평균 (%p)',series:[{pts:wk,color:SUPC.C,width:2.2,dots:3}],hlines:[{y:L2[2],color:C.eye,label:'관리 상한 '+fmt(L2[2],2)}],vlines:[{x:7,color:SUPC.C,label:'7주차'}],stamp:'설명용 모형'});}
  U.reg($('#cvSpc'),function(dt){if(!dt)d1();});U.reg($('#cvSpc2'),function(dt){if(!dt)d2();});
  var up=day.slice(42).filter(function(x){return x[1]>L1[2];}).length,lo=day.slice(42).filter(function(x){return x[1]<L1[1];}).length,bads=wk.slice(6).reduce(function(a,x){return a+x[2];},0);
  U.ins($('#i-spc'),[['a','위 관리도: 7주차 뒤 하루 평균이 관리 상한을 넘은 날이 '+up+'일 — <b>위쪽</b>으로 벗어났습니다. 출하 효율만 보면 C의 셀이 더 좋아 보입니다(하한 아래로 간 날 '+lo+'일).'],
    ['r','아래 관리도: 주 10개뿐인 광열화 시험은 7주차부터 상한('+fmt(L2[2],2)+'%p)을 넘습니다. 7~13주 시험 셀 70개 중 규격 미달은 '+bads+'개'+(bads?'':'라 불량으로는 아직 안 보이지만, 손실 평균이 먼저 움직였어요')+'. 진짜 문제는 재지 못하는 쪽에서 먼저 보입니다.']]);})();

/* ══ 신규 공급사 라벨 ══ */
var LABC=null;
function labCurve(){var c=cond(CFG);c.sup='C';var k=key(c);if(LABC&&LABC.k===k)return LABC;var pts=[],tt=[];for(var n=0;n<=1000;n+=50){var t=SS.v2T(c,n);tt.push([n,t]);pts.push([n,SS.stats(c,t).escDpmo]);}
  var or=SS.bestT(c);LABC={k:k,c:c,pts:pts,tt:tt,v1:SS.stats(c,V1.t).escDpmo,or:SS.stats(c,or).escDpmo,ort:or};return LABC;}
function labUpd(){var L=labCurve(),n=+$('#r-lab').value;$('#v-lab').textContent=n+'개';var t=SS.v2T(L.c,n),s=SS.stats(L.c,t);
  var ym=Math.max(L.v1,L.pts[0][1])*1.15;U.plot($('#cvLab'),{xr:[0,1000],yr:[0,ym],xt:[0,200,400,600,800,1000],yt:[0,Math.round(ym/2),Math.round(ym)],xl:'공급사 C의 광열화 시험 라벨 수',yl:'유출 DPMO',series:[{pts:L.pts,color:C.gfp,width:2.4}],hlines:[{y:L.v1,color:C.amber,label:'v1 그대로 '+dp(L.v1)},{y:L.or,color:'rgba(22,33,43,.5)',label:'C를 다 안다면 '+dp(L.or)}],vlines:[{x:n,color:C.info,label:n+'개',dy:22}],stamp:'설명용 모형'});
  $('#lab-minis').innerHTML=mini('','조건',cname(L.c))+mini('a','v2 문턱',fmt(t,2)+'% (C를 다 알면 '+fmt(L.ort,2)+'%)')+mini(s.escDpmo>L.or*1.5?'r':'g','v2 유출',dp(s.escDpmo)+' DPMO')+mini('','v2 과잉 폐기',pct(s.frRate,2));
  U.ins($('#i-lab'),[[n<100?'r':'g',n===0?'라벨 0개: v2도 C를 기존 공급사처럼 봅니다. 신규 수입처의 첫 주는 v1과 똑같이 샙니다.':'라벨 '+n+'개: 유출 '+dp(s.escDpmo)+' DPMO. '+(n<100?'아직 기존 평균 쪽으로 많이 당겨져 있어요.':'C 자신의 광열화에 거의 다가갔습니다.')]]);}
$('#r-lab').oninput=labUpd;U.reg($('#cvLab'),function(dt){if(!dt)labUpd();});

/* ══ 대결 ══ */
(function(){var fi=$('#d-fly'),ri=$('#d-robo'),SH={A:.5,B:.35,C:.15},LD={70:.2,85:.5,100:.3},PL={1:2,2:3},Q=[],N=2e7;
  Object.keys(SH).forEach(function(s){[1,2].forEach(function(pl){Object.keys(LD).forEach(function(l){Q.push({c:{sup:s,plant:pl,shift:PL[pl],season:'summer',load:+l},w:SH[s]*0.5*LD[l]});});});});
  function total(tf){return Q.reduce(function(a,q,i){return a+q.w*N*SS.stats(q.c,tf(q,i)).cost;},0);}
  function run(L){var cs=[];Q.forEach(function(q,i){cs=cs.concat(SS.cells(q.c,Math.max(1,Math.round(L*q.w)),300+i));});var j=SS.fitJudge(cs);
    return {L:L,tr:j.t,robo:total(function(){return j.t;}),fly:total(function(q,i){return SS.fitJudge(SS.cells(q.c,Math.max(3,Math.round(L*q.w)),100+i)).t;}),v2:total(function(q){return SS.v2T(q.c,Math.round(L*SH.C));}),v1:total(function(){return V1.t;})};}
  function judge(r){var d=r.fly-r.robo;return Math.abs(d)<0.02*Math.max(r.fly,r.robo)?'D':d<0?'F':'R';}
  U.Duel({el:'#duel',run:function(){var A=run(60),B=run(600);A.res=judge(A);B.res=judge(B);return {A:A,B:B};},
    show:function(o,pred){var A=o.A,B=o.B,res=A.res===B.res?A.res:'C',w={F:'초파리',R:'주판봇',D:'무승부'};
      var Mo={F:['fly_arms','robo_sigh','doc_judge','asst_report'],R:['fly_coffee','robo_happy','doc_judge','asst_report'],D:['fly_magnify','robo_meh','doc_think','asst_report'],C:['fly_arms','robo_meh','doc_board','asst_report']}[res];U.setMood(fi,Mo[0]);U.setMood(ri,Mo[1]);
      function grp(t,x){var mx=Math.max(x.fly,x.robo,x.v2,x.v1)*1.05;function bar(nm,v,col){return '<div class="resbar"><span style="color:'+col+'">'+nm+'</span><div class="bar"><i style="background:'+col+';width:'+Math.max(2,v/mx*100)+'%"></i></div><b>'+won(v)+'</b></div>';}
        return '<h4 style="margin:10px 0 4px;font-size:14px">'+t+' → '+w[x.res]+'</h4>'+bar('초파리 · 18칸 따로',x.fly,'var(--c-fly)')+bar('주판봇 · 합쳐서 문턱 하나 ('+fmt(x.tr,2)+'%)',x.robo,'var(--c-robo)')+bar('참고 · v2 부분 풀링',x.v2,C.gfp)+bar('참고 · v1 기준 조건 그대로',x.v1,C.amber);}
      $('#d-bars').innerHTML='<p class="muted" style="font-size:13.5px;margin:0">막대 = 여름 분기 품질 비용 (과잉 폐기 1,500원/셀 + 유출 40,000원/셀, 예시값). 짧을수록 좋습니다.</p>'+grp('가정 A — 광열화 라벨 60개/분기',A)+grp('가정 B — 광열화 라벨 600개/분기',B);
      $('#d-say').innerHTML=U.say('asst',Mo[3],'라벨 60개면 18칸 중 가장 작은 칸은 라벨이 1~3개뿐이에요. 분기 비용: 초파리 '+won(A.fly)+', 주판봇 '+won(A.robo)+', 부분 풀링 '+won(A.v2)+'. 라벨 600개면 초파리 '+won(B.fly)+', 주판봇 '+won(B.robo)+'.')+
        U.say('doc',Mo[2],(res==='C'?'조건부 판정이다. 라벨이 적으면 '+w[A.res]+', 많으면 '+w[B.res]+'. ':res==='D'?'두 가정 모두 비슷하다. ':'두 가정 모두 '+w[res]+' 쪽이다. ')+'라벨이 적을 때는 부분 풀링('+won(A.v2)+')이 둘보다 낫다. 라벨이 적으면 묶고, 많으면 나눈다. 기준 조건 판정기를 그대로 쓰는 것('+won(A.v1)+')은 어느 쪽보다도 비싸다.',true);
      $('#d-score').textContent='판정: '+{F:'F 초파리 승',R:'R 주판봇 승',D:'D 무승부',C:'C 조건부 (라벨 60개: '+w[A.res]+' · 600개: '+w[B.res]+')'}[res];
      $('#d-pred').textContent=pred?' · 내 예상: '+(pred==='fly'?'초파리':'주판봇')+(res==='C'?' — 라벨 수에 따라 갈려요':((pred==='fly'&&res==='F')||(pred==='robo'&&res==='R')?' — 맞았어요':' — 빗나갔어요')):'';},
    reset:function(){U.setMood(fi,'fly_point');U.setMood(ri,'robo_coin');}});
})();

/* ══ 대사 · 등장인물 ══ */
var DLG={
 hero:[["doc","doc_board","부지 ④에 태양광 셀 공장을 세웁니다. 목표는 6시그마, 출하 셀 100만 개 중 불량 3.4개 이하."],
       ["asst","asst_report","효율 분포를 시간대마다 계산하고, 판정기 두 개의 결과를 읽어 드릴게요."],
       ["robo","robo_coin","판정기 하나 잘 만들어서 모든 라인에 걸면 되지. 기준이 여러 개면 현장이 헷갈려."],
       ["fly","fly_magnify","웨이퍼를 어디서 샀는지, 여름인지에 따라 분포가 달라. 같은 문턱이면 어딘가는 샐 거야."]],
 plant:[["sia","sia_explain","P3 확산로예요. 교대 인계 직후 한 시간은 온도 프로파일이 조금 흔들려요."],["moa","moa_report","P4 기록을 보면 2교대 근무 막바지 세 시간에 퍼짐이 커져요."]],
 control:[["asst","asst_report","공급사 C를 골라 보세요. 출하 효율 곡선은 오른쪽으로 갔는데, 광열화 뒤 곡선은 왼쪽으로 와요."]],
 dist:[["doc","doc_front","효율은 정규, 크랙 수는 포아송, 표본 속 불량 개수는 이항. 분포를 고르는 것이 판정 기준을 세우는 첫걸음입니다."]],
 shift:[["robo","robo_calc","3교대가 인계는 더 많은데, 하루 합치면 2교대보다 조금 나은 경우가 많네."]],
 judge:[["fly","fly_point","v1은 수입처를 묻지도 않아. C의 셀을 넣어도 A처럼 판정하지."],["asst","asst_report","\"보류\"는 문턱에서 측정 잡음 한 칸(0.03%p) 안쪽이에요. 다시 재면 판정이 바뀔 수 있어요."]],
 grid:[["moa","moa_report","칸을 누르면 조종실이 그 조건으로 바뀌어요. 빨간 칸부터 눌러 보세요."]],
 spc:[["fly","fly_magnify","관리도가 위로 튀었는데 다들 좋아했어. 효율이 올랐다고. 광열화 시험이 주 10개뿐이라 늦게 알았지."]],
 pain:[["doc","doc_think","기준을 조건마다 바꾸는 건 계산보다 운영이 어렵습니다. 라벨 예산, 신규 수입처, 현장 설명, 기록."]],
 dfly:[["fly","fly_point","18칸마다 분포가 다르니 문턱도 18개. 칸마다 그 칸의 라벨로 배워."]],
 drobo:[["robo","robo_coin","라벨이 몇 개나 된다고 18칸으로 쪼개. 다 합쳐서 하나를 제대로 배우자."]],
 outro:[["doc","doc_magic","오늘의 세 줄입니다.<br>① 6시그마는 공정이 만든다. 판정기는 출하 품질을 지킬 뿐, 그 대가로 멀쩡한 셀을 버린다.<br>② 분포가 조건마다 다르면 판정 문턱도 다르다. 한 조건의 판정기를 다른 조건에 쓰면 샌다.<br>③ 라벨이 적으면 묶고, 많으면 나눈다. 재지 못하는 품질(광열화)은 따로 꾸준히 시험한다."],
        ["robo","robo_meh","라벨 60개일 땐 내가 거의 비겼는데, 600개면 쪼개는 게 낫구나."],
        ["fly","fly_coffee","그래도 신규 수입처가 들어오는 첫 주가 제일 무서워. 라벨이 0개니까."],
        ["asst","asst_report","이 판정기도 시제품 테스트 랩실에 올려서, 다른 공장·다른 계절 셀로 시험해 볼게요."]]
};
U.dialogues(DLG);
var CAST=[["doc","doc_board","박사","공장장. 판정 기준을 승인하고, 판정은 늘 계산한 숫자대로."],["asst","asst_report","조수 하루","시간대별 분포와 판정기 결과를 발표해요."],["fly","fly_magnify","초파리 연구원","의심하는 쪽. 수입처·계절·교대를 따져요."],["robo","robo_coin","주판봇","확신하는 쪽. 기준은 단순하게, 생산량은 많이."],["sia","sia_explain","인턴 시아","확산 공정 담당."],["moa","moa_report","인턴 모아","에칭 공정·교대 기록 담당."]];
$('#castgrid').innerHTML=CAST.map(function(c){return '<div class="castc" style="--cc:var(--c-'+c[0]+')"><img src="'+U.spr(c[1])+'" alt="" aria-hidden="true"><div><b>'+c[2]+'</b><p>'+c[3]+'</p></div></div>';}).join('');
$('#secretrow').innerHTML=['x1','x2','x3'].map(function(x,i){return U.say(x,x+'_hint',['(반짝)','(…끄덕)','(짝짝짝)'][i]);}).join('');
$('#secretbtn').onclick=function(){var r=$('#secretrow');r.hidden=!r.hidden;this.setAttribute('aria-expanded',String(!r.hidden));this.textContent=r.hidden?'방청석 보기 (미공개 식구)':'방청석 닫기';};
U.fillImgs();

/* ══ 표지 대체 그림 ══ */
(function(){var cv=$('#cvCover');if(!cv)return;U.reg(cv,function(dt){if(dt)return;var R0=U.setup(cv),g=R0.g,w=R0.w,h=R0.h;var gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#eef4f8');gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(var i=0;i<6;i++)for(var j=0;j<3;j++){var x=w*(0.5+i*0.07),y=h*(0.08+j*0.09);g.fillStyle='#1e2f4a';g.fillRect(x,y,w*0.06,h*0.08);g.strokeStyle='rgba(255,255,255,.5)';g.strokeRect(x,y,w*0.06,h*0.08);}
  g.strokeStyle=C.eye;g.lineWidth=2;g.beginPath();var x0=w*0.06,y0=h*0.32;for(var k=0;k<=60;k++){var z=-3+6*k/60,x=x0+w*0.36*k/60,y=y0-h*0.2*Math.exp(-z*z/2);k?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();});})();

/* ══ 용어 · 퀴즈 ══ */
U.Gloss({
 '6시그마':['6시그마','품질','출하 100만 개당 불량 3.4개 이하를 목표로 하는 품질 수준. 정규분포 4.5σ 꼬리 + 관례적 1.5σ 이동.'],
 '광열화':['광열화 (LID)','셀','햇빛을 처음 받는 몇 시간~며칠 동안 셀 효율이 떨어지는 현상. 웨이퍼 재료에 따라 크기가 다르다.'],
 '규격 하한':['규격 하한 (LSL)','품질','고객이 정한 최소 품질. 이 페이지는 광열화 뒤 효율 22.40%.'],
 '회귀 모델':['회귀 모델','AI','출하 효율로 광열화 뒤 효율(숫자)을 맞히는 모델. 간이 판정기 v1의 속.'],
 '관리도':['관리도 (SPC)','품질','공정 값을 시간 순으로 찍고 중심선 ±3σ 한계를 넘는지 보는 그림.'],
 'Ppk':['Ppk (장기 공정 성능 지수)','품질','(평균 − 규격 하한) ÷ (3 × 장기 표준편차). 시간대·로트 사이 흔들림까지 넣은 표준편차로 계산한다. 단기(군 안) 표준편차로 계산하면 Cpk.'],
 'DPMO':['DPMO','품질','100만 개당 불량 수 (Defects Per Million Opportunities).'],
 '부분 풀링':['부분 풀링','통계','칸마다 따로 추정한 값을 전체 평균 쪽으로 당겨 쓰는 방법. 라벨이 적은 칸일수록 많이 당긴다.']
},['6시그마','광열화','규격 하한','관리도','Ppk','DPMO','부분 풀링']);
U.Study({quiz:{
 control:[{q:'공급사 C의 셀은 출하 효율이 A보다 높은데 불량이 더 많습니다. 까닭은?',o:['광열화가 커서 고객 지붕 위에서 효율이 더 많이 떨어지기 때문','측정기가 고장 나서','C의 셀이 더 작아서','규격 하한이 C만 다르기 때문'],a:0,why:'고객이 보는 품질은 광열화 뒤 효율입니다. 출하 효율이 높아도 광열화(0.56%p)가 A(0.30%p)보다 커서 규격 미달이 늘어납니다.',hint:'두 곡선 중 색 곡선.'},
   {q:'공정 시그마가 3.5σ인 조건에서 판정 문턱을 올리면?',o:['출하 불량은 줄지만 멀쩡한 셀도 많이 버린다 — 공정 시그마는 그대로','공정이 6시그마가 된다','아무것도 바뀌지 않는다','불량이 늘어난다'],a:0,why:'판정은 만들어진 분포에서 덜어 낼 뿐입니다. 분포 자체(공정 시그마)를 바꾸려면 공정을 고쳐야 합니다.',hint:'판정 전·후 미니 칸.'}],
 dist:[{q:'셀당 미세 크랙 개수에 알맞은 분포는?',o:['포아송 분포','정규분포','균등분포','t 분포'],a:0,why:'드물게 독립적으로 생기는 사건의 개수는 포아송으로 봅니다.',hint:'개수, 드묾.'},
   {q:'멀쩡한 셀을 불량으로 버리는 것은 검정의 어느 오류일까요?',o:['1종 오류','2종 오류','표본 오류','측정 오류가 아니다'],a:0,why:'"양품이다"가 참인데 기각했으니 1종 오류입니다. 불량을 내보내는 것이 2종 오류(유출)입니다.',hint:'분포표 연구실 4장.'}],
 judge:[{q:'기준 조건 광열화 시험 500개에 불량이 0개였는데도 v1이 문턱을 정할 수 있었던 까닭은?',o:['불량을 직접 배운 것이 아니라 회귀선과 오차 분포로 꼬리를 추정했기 때문','불량이 숨어 있어서','문턱을 아무렇게나 정해서','라벨이 필요 없어서'],a:0,why:'광열화 뒤 효율 ≈ a + b × 출하 효율과 오차 표준편차를 배우면, 정규분포로 규격 미달 확률을 계산할 수 있습니다.',hint:'v1의 식.'}],
 spc:[{q:'출하 효율 관리도가 7주차부터 위로 벗어났습니다. 바르게 읽은 것은?',o:['공정이 바뀐 신호 — 좋아 보여도 원인(수입처 변경)과 재지 못하는 품질을 확인한다','효율이 올랐으니 문제없다','관리도가 고장 났다','관리 한계를 넓힌다'],a:0,why:'관리도는 "좋은 쪽"으로 벗어나도 공정이 바뀌었다는 신호입니다. 이 경우 광열화가 커져 실제 품질은 나빠졌습니다.',hint:'아래 관리도.'}],
 pain:[{q:'신규 공급사 C의 라벨이 0개일 때 v2가 v1처럼 새는 까닭은?',o:['C의 광열화를 기존 평균으로 가정하기 때문','v2가 꺼져서','C가 불량이 없어서','라벨이 0개면 판정을 안 해서'],a:0,why:'부분 풀링은 라벨이 없으면 전체(기존) 평균을 씁니다. 신규 수입처 초기에는 광열화 시험을 늘려야 합니다.',hint:'추정 = (라벨 합 + 40 × 기존 평균) ÷ (라벨 수 + 40).'}],
 duel:[{q:'이 대결이 말해 주는 것은?',o:['라벨이 적으면 묶고, 많으면 나눈다 — 기준 조건 판정기를 그대로 쓰는 것은 가장 비싸다','언제나 조건별로 나눠야 한다','언제나 하나로 통일해야 한다','라벨은 필요 없다'],a:0,why:'라벨 60개에서는 칸별 학습이 흔들려 하나로 묶은 것과 비슷하고, 부분 풀링이 가장 낫습니다. 600개면 칸별 학습이 이깁니다.',hint:'두 가정의 막대.'}]
}});

/* ══ 처음 화면 ══ */
bindAll();upd();
U.reg($("#cvDist"),function(dt){if(!dt)drawDist();});U.reg($("#cvShift"),function(dt){if(!dt)drawShift();});
U.start();
})();
