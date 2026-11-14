/* testlab.js — 「시제품 테스트 랩실」 페이지 스크립트 (IIFE 하나). 데이터는 FD (fish.json, code/fish_lab.py가 만듦) */
(function(){
'use strict';
var $=U.$,$$=U.$$,fmt=U.fmt,cssv=U.cssv,clamp=U.clamp;
var C={eye:cssv('--eye'),gfp:cssv('--gfp'),amber:cssv('--amber'),info:cssv('--info'),muted:cssv('--muted'),text:cssv('--text'),rule:cssv('--rule')};
function pct(x,d){return fmt(x*100,d==null?1:d)+'%';}
function mini(cls,label,val){return '<div class="mini '+(cls||'')+'"><span>'+label+'</span><b>'+val+'</b></div>';}
var SP=FD.sp,KO=FD.ko,NF=FD.field.length,TRUE=FD.field.map(function(r){return r[5];});
var SC=['#8a6a2e','#d9822b','#2f8f5b','#3567a8','#c0453a','#7f93a8','#8e62b3'];
var ENG={lr:'로지스틱 회귀',knn:'KNN',svl:'SVC 직선(linear)',svr:'SVC 곡선(rbf)'},PN={lr:'C',knn:'k',svl:'C',svr:'C'};
var CF=FD.cfg.map(function(c,i){c.i=i;c.pr=c.pred.split('').map(Number);return c;});
function name(c){return ENG[c.eng]+' · '+PN[c.eng]+'='+c.p+' · 입력 '+c.fs+'개';}
function find(e,p,f){for(var i=0;i<CF.length;i++){var c=CF[i];if(c.eng===e&&c.p===p&&c.fs===f)return c;}return null;}
var BEST=CF.reduce(function(a,b){return b.cv>a.cv?b:a;});   /* 시제품 v1 = 랩 점수 1등 */
var DEV=BEST;
$('#k-cv').textContent=pct(BEST.cv);$('#k-field').textContent=pct(BEST.fa);

/* ══ 장비 고르기 ══ */
var sel={e:DEV.eng,p:DEV.p,f:DEV.fs};
function parList(e){var o=[];CF.forEach(function(c){if(c.eng===e&&o.indexOf(c.p)<0)o.push(c.p);});return o;}
function bindDev(){U.btns($('#g-eng'),Object.keys(ENG).map(function(k){return [k,ENG[k]];}),sel.e,function(v){sel.e=v;var ps=parList(v);if(ps.indexOf(sel.p)<0)sel.p=ps[ps.length-1];bindPar();apply();});
  bindPar();U.btns($('#g-fs'),[['4','4개 (재는 값)'],['6','6개 (+ 몸매 비율)']],sel.f,function(v){sel.f=v;apply();});}
function bindPar(){$('#l-par').textContent='설정값 '+PN[sel.e];U.btns($('#g-par'),parList(sel.e).map(function(p){return [p,String(p)];}),sel.p,function(v){sel.p=v;apply();});}
function setDev(c){sel={e:c.eng,p:c.p,f:c.fs};bindDev();apply();}
function apply(){DEV=find(sel.e,sel.p,sel.f)||BEST;Line.restart();buildTable();testPanel();}

/* ══ 시료 표 ══ */
(function(){var mx=Math.max.apply(null,FD.cnt_tr);
  $('#tb-sample').innerHTML='<thead><tr><th>어종</th><th>개발용 (늘린 시료)</th><th>실제 테스트 (어시장 원본)</th><th>입력 평균 (길이 · 높이 · 두께, cm)</th></tr></thead><tbody>'+SP.map(function(s,k){
    var f=FD.field.filter(function(r){return r[5]===k;}),m=function(j){return fmt(f.reduce(function(a,r){return a+r[j];},0)/f.length,1);};
    return '<tr><td><span class="sw" style="background:'+SC[k]+'"></span>'+KO[k]+' <span class="muted">'+s+'</span></td><td><span class="bar" style="width:'+Math.round(FD.cnt_tr[k]/mx*120)+'px;background:'+SC[k]+'"></span>'+FD.cnt_tr[k]+'</td><td>'+FD.cnt_fe[k]+'</td><td>'+m(0)+' · '+m(2)+' · '+m(3)+'</td></tr>';}).join('')+
    '<tr><td><b>합계</b></td><td><b>'+FD.ntr.toLocaleString('ko-KR')+'</b></td><td><b>'+NF+'</b></td><td class="muted">흰송어는 원본 6마리뿐</td></tr></tbody>';
  $('#fishlegend').innerHTML=SP.map(function(s,k){return '<span style="--lc:'+SC[k]+'">'+KO[k]+'</span>';}).join('')+'<span style="--lc:'+C.eye+'">오답 고리</span>';})();

/* ══ 장비 34대 표 ══ */
var reveal=false,sortKey='cv';
U.btns($('#g-reveal'),[[0,'가리기'],[1,'보이기']],0,function(v){reveal=!!v;buildTable();});
function buildTable(){var rows=CF.slice().sort(function(a,b){return sortKey==='name'?(a.i-b.i):(b[sortKey]-a[sortKey]);});
  var th=function(k,t){return '<th><button class="bt" type="button" data-sort="'+k+'" style="padding:1px 6px">'+t+(sortKey===k?' ▾':'')+'</button></th>';};
  $('#tb-build').innerHTML='<thead><tr>'+th('name','장비 (엔진 · 설정값 · 입력)')+th('cv','랩 점수 (교차검증)')+(reveal?th('fa','실제 테스트')+'<th>차이</th>'+th('ll','로그 손실'):'<th class="muted">실제 테스트 (가림)</th>')+'</tr></thead><tbody>'+
    rows.map(function(c){var me=c===DEV;return '<tr data-i="'+c.i+'" class="'+(me?'me':'')+'" style="cursor:pointer"><td>'+name(c)+(c===BEST?'<span class="tag2 best">시제품 v1</span>':'')+'</td><td><span class="bar" style="width:'+Math.max(2,(c.cv-0.7)/0.3*120)+'px;background:var(--info)"></span>'+pct(c.cv)+'</td>'+
      (reveal?'<td><span class="bar" style="width:'+Math.max(2,(c.fa-0.7)/0.3*120)+'px;background:var(--gfp)"></span>'+pct(c.fa)+'</td><td>'+(c.fa-c.cv>=0?'+':'−')+fmt(Math.abs(c.fa-c.cv)*100,1)+'%p</td><td>'+fmt(c.ll,3)+'</td>':'<td class="muted">—</td>')+'</tr>';}).join('')+'</tbody>';
  $$('#tb-build [data-sort]').forEach(function(b){b.onclick=function(e){e.stopPropagation();sortKey=b.dataset.sort;buildTable();};});
  $$('#tb-build tr[data-i]').forEach(function(tr){tr.onclick=function(){setDev(CF[+tr.dataset.i]);};});
  var top5=CF.slice().sort(function(a,b){return b.cv-a.cv;}).slice(0,5),bf=CF.reduce(function(a,b){return b.fa>a.fa?b:a;});
  var it=[['m','랩 점수 1등은 <b>'+name(BEST)+'</b>('+pct(BEST.cv)+')입니다. 랩 점수 상위 5대가 모두 '+pct(top5[4].cv)+' 이상이에요.']];
  if(reveal)it.push(['a','실제 테스트에서는 상위 5대가 '+pct(Math.min.apply(null,top5.map(function(c){return c.fa;})))+' ~ '+pct(Math.max.apply(null,top5.map(function(c){return c.fa;})))+'입니다. 실제 테스트 1등은 '+name(bf)+'('+pct(bf.fa)+')인데, 이것을 보고 고르면 그 점수도 부풉니다 — 대결에서 확인합니다.']);
  else it.push(['g','먼저 랩 점수만 보고 어느 장비를 출하할지 정해 보세요. 그다음 "실제 테스트 점수 → 보이기"를 누릅니다.']);
  U.ins($('#i-build'),it);}

/* ══ 혼동 행렬 ══ */
function confusion(pr,mask){var M=[];for(var a=0;a<7;a++){M.push([0,0,0,0,0,0,0]);}for(var i=0;i<NF;i++)if(!mask||mask[i])M[TRUE[i]][pr[i]]++;return M;}
function testPanel(){var M=confusion(DEV.pr),n=0,ok=0;$('#cm-title').textContent='지금 3D 라인에 낀 장비: '+name(DEV);
  var h='<thead><tr><th>실제 \\ 판정</th>'+SP.map(function(s,k){return '<th title="'+s+'"><span class="sw" style="background:'+SC[k]+'"></span>'+KO[k]+'</th>';}).join('')+'</tr></thead><tbody>';
  for(var a=0;a<7;a++){h+='<tr><th style="text-align:left"><span class="sw" style="background:'+SC[a]+'"></span>'+KO[a]+'</th>';var tot=FD.cnt_fe[a];
    for(var b=0;b<7;b++){var v=M[a][b];n+=v;if(a===b)ok+=v;var al=tot?v/tot:0;h+='<td class="'+(a===b?'d':'')+'" style="background:'+(v?(a===b?'rgba(29,107,53,'+(0.1+al*0.45)+')':'rgba(201,48,44,'+(0.15+al*0.9)+')'):'#fff')+'">'+(v||'·')+'</td>';}h+='</tr>';}
  $('#tb-cm').innerHTML=h+'</tbody>';
  var worst=[];for(a=0;a<7;a++)for(b=0;b<7;b++)if(a!==b&&M[a][b])worst.push([M[a][b],a,b]);worst.sort(function(x,y){return y[0]-x[0];});
  $('#tb-recall').innerHTML='<thead><tr><th>어종</th><th>맞힌 비율 (재현율)</th></tr></thead><tbody>'+SP.map(function(s,k){var r=M[k][k]/FD.cnt_fe[k];return '<tr class="'+(r<0.8?'bad':'')+'"><td><span class="sw" style="background:'+SC[k]+'"></span>'+KO[k]+'</td><td><span class="bar" style="width:'+Math.round(r*110)+'px;background:'+SC[k]+'"></span>'+M[k][k]+' / '+FD.cnt_fe[k]+' · '+pct(r,0)+'</td></tr>';}).join('')+'</tbody>';
  $('#test-minis').innerHTML=mini('g','실제 테스트 정확도',pct(ok/n)+' ('+ok+' / '+n+')')+mini('a','랩 점수 (교차검증)',pct(DEV.cv))+mini(DEV.cv-ok/n>0.05?'r':'','부푼 정도',fmt((DEV.cv-ok/n)*100,1)+'%p')+mini('','로그 손실 (작을수록 좋음)',fmt(DEV.ll,3))+mini('r','다른 통조림으로 간 물고기',(n-ok)+'마리');
  var it=[];if(worst.length)it.push(['r','가장 많이 섞인 곳: <b>'+KO[worst[0][1]]+' → '+KO[worst[0][2]]+'</b> '+worst[0][0]+'마리'+(worst[1]?', '+KO[worst[1][1]]+' → '+KO[worst[1][2]]+' '+worst[1][0]+'마리':'')+'. 몸매가 닮은 어종끼리 섞입니다.']);
  it.push(['a','흰송어는 원본이 '+FD.cnt_fe[6]+'마리뿐이라 1마리 틀릴 때마다 재현율이 '+pct(1/FD.cnt_fe[6],0)+'씩 떨어집니다. 작은 어종의 점수는 크게 흔들려요.']);
  U.ins($('#i-test'),it);}

/* ══ 3D 시험 라인 ══ */
var Line={};
(function(){var cv=$('#cvLine'),narrow=(cv.clientWidth||window.innerWidth)<600,yaw=narrow?-0.15:-0.5,pitch=narrow?1.2:0.82,play=!U.reduce,T=0,spd=6,selK=-1,t=0;
  var PR=[['P1','시료 입고','어시장 원본 물고기가 들어옵니다. 개발에 한 번도 쓰지 않은 봉인 시료 158마리입니다.','f'],
    ['P2','세척·정렬','물고기를 머리 방향으로 눕혀 계측대에 올립니다. 조수 하루가 시험 기록을 맡아요.','f'],
    ['P3','길이 게이지','입력 1 — 길이(Length, cm). 인턴 시아가 게이지를 맞춰요.','m'],
    ['P4','대각선 게이지','입력 2 — 대각선(Diagonal, cm). 인턴 모아 담당.','m'],
    ['P5','높이 게이지','입력 3 — 높이(Height, cm). 몸매 비율 높이 ÷ 길이도 여기서 계산합니다.','m'],
    ['P6','두께 게이지','입력 4 — 두께(Width, cm). 주판봇이 숫자를 모아 판정 엔진으로 넘겨요.','m'],
    ['P7','판정 엔진','끼운 장비가 표준화한 입력으로 7어종 확률을 내고, 가장 높은 어종을 고릅니다.','e'],
    ['P8','분류 게이트','판정한 어종의 통조림 라인으로 밀어 보냅니다. 초파리 연구원이 게이트를 지켜봐요.','e'],
    ['P9','검수대 (정답 대조)','어시장 기록(정답)과 맞춰 봅니다. 틀린 물고기에는 빨간 고리가 붙습니다.','v'],
    ['P10','통조림 라인 7개','어종별 통. 막대 높이 = 그 어종으로 판정된 물고기 수, 빨간 띠 = 그 가운데 오답.','v'],
    ['P11','판정실','박사가 시험 성적표를 확인합니다. 실제 테스트 점수는 여기서 한 번만 보고합니다.','v'],
    ['P12','출하 보고','시험을 마친 장비의 성적표를 통조림 공장에 보냅니다.','f']];
  var WHO={1:['asst',0.9],2:['sia',0.88],3:['moa',0.86],5:['robo',0.72],7:['fly',0.41],10:['doc',1.0]},SHEET={doc:'D1',asst:'A1',sia:'S1',moa:'M1',fly:'F1',robo:'R1'};
  var XS=[-10,-6,-2,2,6,10],P12=PR.map(function(p,i){var row=i<6?0:1;return {id:p[0],name:p[1],desc:p[2],cat:p[3],x:row?XS[5-(i-6)]:XS[i],y:row?4.6:-4.6,h:[1.2,1.4,1.9,1.9,1.9,1.9,2.4,1.8,1.6,1.0,1.9,1.3][i]};});
  var CAT={f:['#fbecd3','#ecc98f','#dfb46e'],m:['#e3f1e6','#b9dcc2','#9ccaa9'],e:['#efe0f6','#d6b7e6','#c39bd9'],v:['#dfeafb','#b4cdf2','#9ab9ea']};
  var cx,cy,sc;function P(x,y,z){var c=Math.cos(yaw),s=Math.sin(yaw),rx=x*c-y*s,ry=x*s+y*c,cp=Math.cos(pitch),sp=Math.sin(pitch);return [cx+rx*sc,cy+(-z*cp-ry*sp)*sc,ry*cp-z*sp];}
  function fwd(){var c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return [s*cp,c*cp,-sp];}
  function poly(g,pts,fill,stroke,dash){g.beginPath();pts.forEach(function(p,k){k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){if(dash)g.setLineDash(dash);g.strokeStyle=stroke;g.stroke();g.setLineDash([]);}}
  function box(g,x,y,z0,w,d,h,cols,hl){var F=fwd(),x0=x-w/2,x1=x+w/2,y0=y-d/2,y1=y+d/2,z1=z0+h;
    var faces=[[[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],0],[[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],1],[[0,1,0],[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],1],[[-1,0,0],[[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],2],[[1,0,0],[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],2]];
    g.lineWidth=hl?2.4:1;faces.forEach(function(f){var n=f[0];if(n[0]*F[0]+n[1]*F[1]+n[2]*F[2]>=0)return;poly(g,f[1].map(function(p){return P(p[0],p[1],p[2]);}),cols[f[2]],hl?hl:'rgba(22,33,43,.35)');});}
  var PATH=[[-13.5,-2.4],[12.6,-2.4],[13.6,-1.2],[13.6,1.2],[12.6,2.4],[-13.5,2.4]],SEG=[],TL=0;for(var i=1;i<PATH.length;i++){var l=Math.hypot(PATH[i][0]-PATH[i-1][0],PATH[i][1]-PATH[i-1][1]);SEG.push(l);TL+=l;}
  function along(u){var d=clamp(u,0,1)*TL;for(var i=0;i<SEG.length;i++){if(d<=SEG[i]){var f=d/SEG[i];return [PATH[i][0]+(PATH[i+1][0]-PATH[i][0])*f,PATH[i][1]+(PATH[i+1][1]-PATH[i][1])*f];}d-=SEG[i];}return PATH[PATH.length-1];}
  function uAt(st){var p=P12[st],best=0,bd=1e9;for(var k=0;k<=400;k++){var q=along(k/400),d=Math.hypot(q[0]-p.x,q[1]-(p.y<0?-2.4:2.4));if(d<bd){bd=d;best=k/400;}}return best;}
  var U_ENG=uAt(6),U_CHK=uAt(8),GAP=0.018,TRAVEL=1.0;   /* 물고기 i는 시각 T에 u=(T−i·GAP)/TRAVEL 자리 */
  function state(){var judged=0,checked=0,ok=0,bins=[0,0,0,0,0,0,0],wr=[0,0,0,0,0,0,0];for(var i=0;i<NF;i++){var u=(T-i*GAP)/TRAVEL;if(u>=U_ENG)judged++;if(u>=U_CHK){checked++;var pr=DEV.pr[i];bins[pr]++;if(pr===TRUE[i])ok++;else wr[pr]++;}}return {judged:judged,checked:checked,ok:ok,bins:bins,wr:wr};}
  function fish(g,x,y,s,col,ang,wrong,ghost){g.save();g.translate(x,y);g.rotate(ang);g.globalAlpha=ghost?0.55:1;g.fillStyle=col;g.strokeStyle='rgba(22,33,43,.45)';g.lineWidth=1;
    g.beginPath();g.ellipse(0,0,s,s*0.42,0,0,7);g.fill();g.stroke();g.beginPath();g.moveTo(-s*0.9,0);g.lineTo(-s*1.45,-s*0.4);g.lineTo(-s*1.45,s*0.4);g.closePath();g.fill();g.stroke();
    g.fillStyle='#fff';g.beginPath();g.arc(s*0.55,-s*0.08,s*0.11,0,7);g.fill();g.restore();
    if(wrong){g.beginPath();g.arc(x,y,s*1.25,0,7);g.strokeStyle=C.eye;g.lineWidth=2.2;g.stroke();}}
  function draw(dt){if(play&&dt){t+=dt;T+=dt*spd*0.016;var endT=(NF-1)*GAP+TRAVEL+0.02;if(T>endT){T=endT;setPlay(false);}}else if(dt)t+=dt;
    var S=state(),Rr=U.setup(cv),g=Rr.g,w=Rr.w,h=Rr.h;cx=w/2;cy=h*0.56;sc=Math.min(w/31,h/19);
    g.fillStyle='#fbfcfd';g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(22,33,43,.07)';g.lineWidth=1;for(var x=-15;x<=15;x+=1.5){var a=P(x,-7.5,0),b=P(x,7.5,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}for(var y=-7.5;y<=7.5;y+=1.5){a=P(-15,y,0);b=P(15,y,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
    for(var k=1;k<PATH.length;k++){var x0=PATH[k-1][0],y0=PATH[k-1][1],x1=PATH[k][0],y1=PATH[k][1],dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),nx=-dy/L*0.55,ny=dx/L*0.55;poly(g,[P(x0+nx,y0+ny,0.3),P(x1+nx,y1+ny,0.3),P(x1-nx,y1-ny,0.3),P(x0-nx,y0-ny,0.3)],'#d9dee5','rgba(22,33,43,.25)');}
    var items=[];
    P12.forEach(function(p,k){var cp=P(p.x,p.y,p.h/2);items.push({d:cp[2],f:function(){var hl=selK===k?C.gfp:null;
        if(k===9){box(g,p.x,p.y,0,3.2,2.2,0.5,CAT.v,hl);var mx=Math.max(8,Math.max.apply(null,S.bins));for(var j=0;j<7;j++){var bx=p.x-1.35+j*0.45,hh=0.15+S.bins[j]/mx*2.6,wh=S.wr[j]/mx*2.6;box(g,bx,p.y,0.5,0.36,0.36,hh-wh,[SC[j],SC[j],SC[j]],false);if(wh>0)box(g,bx,p.y,0.5+hh-wh,0.36,0.36,wh,[C.eye,C.eye,C.eye],false);}}
        else box(g,p.x,p.y,0,2.6,2.0,p.h,CAT[p.cat],hl);
        if(k>=2&&k<=5){var a1=P(p.x,p.y<0?-2.4:2.4,p.h*0.9),a2=P(p.x,p.y<0?-2.4:2.4,0.9);g.strokeStyle='rgba(30,85,200,.55)';g.lineWidth=2;g.setLineDash([3,3]);g.beginPath();g.moveTo(a1[0],a1[1]);g.lineTo(a2[0],a2[1]);g.stroke();g.setLineDash([]);}
        if(k===6){var lp=P(p.x-0.9,p.y-0.7,p.h+0.05);g.beginPath();g.arc(lp[0],lp[1],4.5,0,7);g.fillStyle=Math.floor(t*3)%2?C.info:C.gfp;g.fill();}
        var tp=P(p.x,p.y,(k===9?3.4:p.h)+0.5);g.beginPath();g.arc(tp[0],tp[1],11,0,7);g.fillStyle=selK===k?C.gfp:'#fff';g.fill();g.lineWidth=1.5;g.strokeStyle=selK===k?C.gfp:C.rule;g.stroke();
        g.fillStyle=selK===k?'#fff':C.text;g.font='700 10.5px '+cssv('--font');g.textAlign='center';g.textBaseline='middle';g.fillText(String(k+1),tp[0],tp[1]+0.5);g.textBaseline='alphabetic';
        if(selK===k||w>700){g.font=(selK===k?'700 ':'')+'11px '+cssv('--font');var lb=P(p.x,p.y,(k===9?3.4:p.h)+1.15);U.label(g,lb[0],lb[1],p.name,selK===k?C.gfp:C.muted,'center');}}});
      if(WHO[k]){var fp=P(p.x+1.75,p.y,0),wh=WHO[k];items.push({d:fp[2]-0.01,f:function(){var hh=sc*(w<600?6.0:5.0)*wh[1];if(typeof FVdraw==='function'&&FVdraw(g,wh[0],t,fp[0],fp[1],hh))return;if(typeof drawMotion==='function')drawMotion(g,SHEET[wh[0]],'idle',t,fp[0],fp[1],hh,{fps:4});}});}});
    for(var i=0;i<NF;i++){var u=(T-i*GAP)/TRAVEL;if(u<0||u>1)continue;(function(i,u){var pos=along(u),pp=P(pos[0],pos[1],0.6),q=P(pos[0]+(u<0.45?1:-1)*0.5,pos[1],0.6),ang=Math.atan2(q[1]-pp[1],q[0]-pp[0]),judged=u>=U_ENG,chk=u>=U_CHK,pr=DEV.pr[i];
      items.push({d:pp[2]-0.02,f:function(){fish(g,pp[0],pp[1],sc*0.48,judged?SC[pr]:'#c9d1da',ang,chk&&pr!==TRUE[i],!judged);}});})(i,u);}
    items.sort(function(a,b){return b.d-a.d;}).forEach(function(it){it.f();});
    g.fillStyle='rgba(255,255,255,.88)';g.fillRect(8,8,Math.min(w-16,330),46);g.strokeStyle=C.rule;g.strokeRect(8,8,Math.min(w-16,330),46);
    g.fillStyle=C.text;g.font='700 12.5px '+cssv('--font');g.textAlign='left';g.fillText('실제 테스트 · 검수 '+S.checked+' / '+NF+'마리',16,26);
    g.font='12px '+cssv('--font');g.fillStyle=C.gfp;g.fillText('맞음 '+S.ok+' · ',16,44);var ww=g.measureText('맞음 '+S.ok+' · ').width;g.fillStyle=C.eye;g.fillText('틀림 '+(S.checked-S.ok)+(S.checked?' · 정확도 '+pct(S.ok/S.checked):''),16+ww,44);
    U.stamp(g,w,'라인 그림은 개략 · 판정은 실제 계산');
    $('#t-hud').textContent='판정 '+S.judged+' · 검수 '+S.checked+' / '+NF+' · 정확도 '+(S.checked?pct(S.ok/S.checked):'—');
    card(S);}
  var lastKey='';
  function card(S){var key=selK+'|'+S.checked+'|'+DEV.i;if(key===lastKey)return;lastKey=key;
    var head=selK<0?{id:'시험 라인 전체',name:name(DEV),desc:'칸을 누르면 그 칸이 하는 일이 보입니다. 물고기 색은 판정 엔진(P7)을 지난 뒤 판정한 어종의 색이 됩니다.'}:P12[selK];
    $('#pc-no').textContent=selK<0?head.id:head.id+' / 12';$('#pc-name').textContent=head.name;$('#pc-desc').textContent=head.desc;
    $('#pc-metric').textContent='끼운 장비: '+name(DEV)+' · 랩 점수 '+pct(DEV.cv);
    var m=mini('','검수한 물고기',S.checked+' / '+NF)+mini('g','맞음',S.ok+'마리')+mini('r','다른 통조림으로',(S.checked-S.ok)+'마리')+mini(S.checked&&DEV.cv-S.ok/S.checked>0.05?'r':'a','지금까지 정확도 (랩 점수 '+pct(DEV.cv,0)+')',S.checked?pct(S.ok/S.checked):'—');
    if(selK===9)m=SP.map(function(s,j){return mini(S.wr[j]?'r':'',KO[j]+' 통',S.bins[j]+'캔'+(S.wr[j]?' (오답 '+S.wr[j]+')':''));}).join('');
    $('#line-minis').innerHTML=m;
    if(S.checked===NF){U.ins($('#i-line'),[[DEV.cv-S.ok/NF>0.05?'r':'a','시험 끝: 랩 점수 '+pct(DEV.cv)+'였던 장비가 진짜 물고기 앞에서 '+pct(S.ok/NF)+'을 받았습니다('+(NF-S.ok)+'마리 오답). 왜 차이가 나는지는 "랩 점수의 함정"에서 봅니다.']]);}
    else U.ins($('#i-line'),[['m','시험 중… 랩 점수 '+pct(DEV.cv)+'인 장비입니다. 끝까지 흘려 실제 점수를 확인하세요. 위에서 엔진·설정값·입력 변수를 바꾸면 처음부터 다시 시험합니다.']]);}
  Line.restart=function(){T=0;lastKey='';setPlay(!U.reduce);if(U.reduce)T=(NF-1)*GAP+TRAVEL+0.02;draw(0);};
  Line.end=function(){T=(NF-1)*GAP+TRAVEL+0.02;lastKey='';draw(0);};
  $('#pchips').innerHTML=P12.map(function(p){return '<button type="button">'+p.id+' '+p.name+'</button>';}).join('');
  $$('#pchips button').forEach(function(b,i){b.onclick=function(){selK=selK===i?-1:i;$$('#pchips button').forEach(function(x,j){x.classList.toggle('on',j===selK);});lastKey='';draw(0);};});
  var pb=$('#t-play');function setPlay(v){play=v;pb.textContent=v?'⏸ 멈춤':'▶ 재생';}setPlay(play);
  pb.onclick=function(){if(!play&&T>=(NF-1)*GAP+TRAVEL)T=0;setPlay(!play);};
  $('#t-restart').onclick=function(){T=0;lastKey='';setPlay(true);};$('#t-end').onclick=function(){setPlay(false);Line.end();};
  U.btns($('#g-tspd'),[[3,'천천히'],[6,'보통'],[18,'빠르게']],6,function(v){spd=v;});
  U.btns($('#g-view'),[['a','비스듬히'],['t','위에서'],['l','낮게'],['L','⟲'],['R','⟳']],'a',function(v){if(v==='a'){yaw=-0.5;pitch=0.82;}else if(v==='t'){yaw=0;pitch=1.45;}else if(v==='l'){yaw=-0.75;pitch=0.32;}else if(v==='L')yaw-=0.35;else yaw+=0.35;draw(0);});
  var drag=null;cv.style.touchAction='pan-y';cv.style.cursor='grab';
  cv.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,yaw:yaw,pitch:pitch,mv:false};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.mv=true;if(drag.mv){yaw=drag.yaw+dx*0.008;pitch=clamp(drag.pitch+dy*0.006,0.15,1.5);if(!play)draw(0);}});
  cv.addEventListener('pointerup',function(e){if(drag&&!drag.mv){var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,best=-1,bd=900;P12.forEach(function(p,k){[p.h+0.5,p.h*0.5].forEach(function(z){var q=P(p.x,p.y,z),d=(q[0]-mx)*(q[0]-mx)+(q[1]-my)*(q[1]-my);if(d<bd){bd=d;best=k;}});});
      if(best>=0){selK=best;$$('#pchips button').forEach(function(x,j){x.classList.toggle('on',j===selK);});lastKey='';draw(0);}}drag=null;});
  cv.addEventListener('pointercancel',function(){drag=null;});
  cv.tabIndex=0;cv.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')yaw-=0.12;else if(e.key==='ArrowRight')yaw+=0.12;else if(e.key==='ArrowUp')pitch=clamp(pitch+0.1,0.15,1.5);else if(e.key==='ArrowDown')pitch=clamp(pitch-0.1,0.15,1.5);else return;e.preventDefault();draw(0);});
  U.reg(cv,function(dt){if(dt===0||play)draw(dt);});
  if(U.reduce)T=(NF-1)*GAP+TRAVEL+0.02;
})();

/* ══ 판정 지형 3D (Surf3D — optimization_3d_map) ══ */
var L2=FD.lr2;function prob2(len,hl){var z=[(len-L2.mu[0])/L2.sd[0],(hl-L2.mu[1])/L2.sd[1]],s=L2.W.map(function(w,k){return w[0]*z[0]+w[1]*z[1]+L2.b[k];}),m=Math.max.apply(null,s),e=s.map(function(v){return Math.exp(v-m);}),t=e.reduce(function(a,b){return a+b;});return e.map(function(v){return v/t;});}
function conf2(len,hl){return Math.max.apply(null,prob2(len,hl));}
function arg2(len,hl){var p=prob2(len,hl),b=0;for(var k=1;k<7;k++)if(p[k]>p[b])b=k;return b;}
var FP=FD.field.map(function(r,i){var hl=r[2]/r[0],pr=arg2(r[0],hl);return {i:i,len:r[0],hl:hl,z:conf2(r[0],hl),pr:pr,tr:r[5]};});
var acc2=FP.filter(function(f){return f.pr===f.tr;}).length/NF;$('#t-lr2').textContent=pct(acc2)+' ('+Math.round(acc2*NF)+' / '+NF+')';
var terPts='all',terSel=null;
var ST=new U.Surf3D($('#cvTer'),{f:conf2,xr:[6,68],yr:[0.12,0.46],n:40,alpha:0.78,zr:[0.25,1],zs:0.9,axes:['길이 (cm)','높이 ÷ 길이','확신도'],stamp:'두 입력 장비 · 실제 계산',
  onPick:function(p){var best=null,bd=1e9;FP.forEach(function(f){if(terPts==='wrong'&&f.pr===f.tr)return;var q=ST.P(f.len,f.hl,f.z);if(!p)return;var d=Math.hypot(q[0]-p.sx,q[1]-p.sy);if(d<bd){bd=d;best=f;}});if(best&&bd<30){terSel=best;terInfo();ST.dirty=true;}}});
ST.pick=function(sx,sy){return {sx:sx,sy:sy};};
ST.ov.push(function(g,S){FP.forEach(function(f){var bad=f.pr!==f.tr;if(terPts==='wrong'&&!bad)return;if(bad)S.dot3(g,f.len,f.hl,f.z,C.eye,7.5,false);S.dot3(g,f.len,f.hl,f.z,SC[f.tr],bad?4.5:3.6,!bad);});
  if(terSel){var q=S.dot3(g,terSel.len,terSel.hl,terSel.z,'rgba(0,0,0,0)',11,false);g.strokeStyle=C.text;g.lineWidth=2;g.beginPath();g.arc(q[0],q[1],11,0,7);g.stroke();}});
U.btns($('#g-terpts'),[['all','158마리 모두'],['wrong','오답만']],'all',function(v){terPts=v;ST.dirty=true;});
function terInfo(){var f=terSel,r=FD.field[f.i],p=prob2(f.len,f.hl),ord=[0,1,2,3,4,5,6].sort(function(a,b){return p[b]-p[a];});
  $('#ter-minis').innerHTML=mini('','고른 물고기 (실제)',KO[f.tr])+mini(f.pr===f.tr?'g':'r','두 입력 장비의 판정',KO[f.pr])+mini('','길이 · 높이 · 높이÷길이',fmt(r[0],1)+' cm · '+fmt(r[2],1)+' cm · '+fmt(f.hl,3))+mini('a','확률 상위 2',KO[ord[0]]+' '+pct(p[ord[0]],0)+' · '+KO[ord[1]]+' '+pct(p[ord[1]],0));}
(function(){var wr=FP.filter(function(f){return f.pr!==f.tr;}),lowW=wr.filter(function(f){return f.z<0.7;}).length,okz=FP.filter(function(f){return f.pr===f.tr;}).reduce(function(a,f){return a+f.z;},0)/(NF-wr.length),wz=wr.reduce(function(a,f){return a+f.z;},0)/Math.max(1,wr.length);
  $('#ter-minis').innerHTML=mini('','맞힌 물고기의 평균 확신도',pct(okz,0))+mini('r','틀린 물고기의 평균 확신도',pct(wz,0))+mini('a','오답 중 확신도 70% 미만',lowW+' / '+wr.length+'마리');
  U.ins($('#i-ter'),[['a','오답 '+wr.length+'마리의 평균 확신도는 '+pct(wz,0)+'로, 맞힌 물고기('+pct(okz,0)+')보다 낮습니다. 골짜기에 있는 물고기는 사람 검수로 넘기는 규칙(예: 확신도 70% 미만은 보류)을 세울 수 있어요.'],['m','점을 누르면 그 물고기의 확률 상위 2개가 보입니다. 로치와 농어가 섞인 골짜기를 찾아보세요.']]);})();

/* ══ 랩 점수 vs 실제 테스트 ══ */
function drawGap(){var o=U.plot($('#cvGap'),{xr:[0.7,1.0],yr:[0.7,1.0],xt:[0.7,0.8,0.9,1.0],yt:[0.7,0.8,0.9,1.0],xf:function(v){return Math.round(v*100)+'%';},yf:function(v){return Math.round(v*100)+'%';},xl:'랩 점수 (5겹 교차검증)',yl:'실제 테스트 (진짜 물고기 158마리)',series:[{pts:[[0.7,0.7],[1,1]],color:'rgba(22,33,43,.3)',width:1.2,dash:[5,4]}],stamp:'실제 계산'});
  var g=o.g,EC={lr:C.info,knn:C.amber,svl:C.gfp,svr:'#8e62b3'};
  CF.forEach(function(c){var x=o.X(c.cv),y=o.Y(c.fa);g.beginPath();if(c.fs==='6')g.rect(x-4,y-4,8,8);else g.arc(x,y,4.5,0,7);g.fillStyle=EC[c.eng];g.globalAlpha=0.85;g.fill();g.globalAlpha=1;if(c===DEV){g.lineWidth=2;g.strokeStyle=C.text;g.stroke();}});
  g.font='11.5px '+cssv('--font');var lx=60,ly=34;Object.keys(EC).forEach(function(k,j){g.fillStyle=EC[k];g.beginPath();g.arc(lx+j*118,ly,4.5,0,7);g.fill();g.fillStyle=C.muted;g.textAlign='left';g.fillText(ENG[k],lx+8+j*118,ly+4);});
  g.fillText('● 입력 4개  ■ 입력 6개  · 점선 = 랩 점수가 정직한 선',lx,ly+18);
  var hi=CF.filter(function(c){return c.cv>=0.97;}),m=hi.reduce(function(a,c){return a+c.fa;},0)/hi.length,mc=hi.reduce(function(a,c){return a+c.cv;},0)/hi.length,s6=CF.filter(function(c){return c.fs==='6';}),s4=CF.filter(function(c){return c.fs==='4';}),av=function(a,k){return a.reduce(function(s,c){return s+c[k];},0)/a.length;};
  U.ins($('#i-gap'),[['r','랩 점수 97% 이상인 장비 '+hi.length+'대: 랩 점수 평균 '+pct(mc)+', 실제 테스트 평균 '+pct(m)+'. 평균 '+fmt((mc-m)*100,1)+'%p 부풀었습니다.'],
    ['a','몸매 비율을 더한 입력 6개는 랩 점수 평균 '+pct(av(s6,'cv'))+'(4개는 '+pct(av(s4,'cv'))+')로 높았지만, 실제 테스트는 '+pct(av(s6,'fa'))+'(4개는 '+pct(av(s4,'fa'))+')로 오히려 낮았습니다. 랩에서 좋아진 변화가 현장에서는 손해일 수 있어요.']]);}
U.reg($('#cvGap'),function(dt){if(!dt)drawGap();});

/* ══ 대결: 1차 시험 엿보고 고르기 vs 랩 점수로 고르기 ══ */
(function(){var fi=$('#d-fly'),ri=$('#d-robo'),seed=0,D=FD.duel;
  U.btns($('#g-seed'),[0,1,2,3,4,5,6,7,8,9].map(function(s){return [s,String(s)];}),0,function(v){seed=v;});
  function judge(d){var df=d.fb-d.rb;return Math.abs(df)<0.0065?'D':df>0?'F':'R';}  /* 79마리 중 1마리 = 1.27%p, 반 마리 미만 차이는 무승부 */
  var DO=null,cvD=$('#cvDuel');U.reg(cvD,function(dt){if(dt||!DO)return;var o=DO,cv=cvD;var p=U.plot(cv,{xr:[-0.5,19.5],yr:[0.80,1.0],xt:[0,5,10,15,19],yt:[0.8,0.85,0.9,0.95,1.0],yf:function(v){return Math.round(v*100)+'%';},xl:'반 나누기 시드',yl:'정확도',
          series:[{pts:D.map(function(x){return [x.seed,x.ra];}),color:'rgba(201,48,44,.45)',width:1.4,dash:[4,3]},{pts:D.map(function(x){return [x.seed,x.rb];}),color:cssv('--c-robo'),width:2.2},{pts:D.map(function(x){return [x.seed,x.fb];}),color:cssv('--c-fly'),width:2.2}],
          hlines:[{y:o.fCv,color:'rgba(29,107,53,.55)',label:'초파리가 보고한 랩 점수 '+pct(o.fCv),left:true}],stamp:'실제 계산'});
        var g=p.g;g.font='11.5px '+cssv('--font');g.textAlign='left';[['주판봇 보고 (1차 시험 1등 점수)','rgba(201,48,44,.7)'],['주판봇 2차 검수',cssv('--c-robo')],['초파리 2차 검수',cssv('--c-fly')]].forEach(function(x,j){g.fillStyle=x[1];var nw=cv.clientWidth<600,lx=nw?60:60+j*190,ly=nw?p.Y(0.815)-(2-j)*14:p.Y(0.815);g.fillRect(lx,ly-4,14,3);g.fillStyle=C.muted;g.fillText(x[0],lx+18,ly);});});
  U.Duel({el:'#duel',run:function(){var all=D.map(function(d){return {d:d,res:judge(d)};}),mean=function(k){return D.reduce(function(a,d){return a+d[k];},0)/D.length;};
      var fly=CF[D[0].fly],w={F:0,R:0,D:0};all.forEach(function(x){w[x.res]++;});
      return {one:all[seed],w:w,rPeek:mean('ra'),rFin:mean('rb'),fFin:mean('fb'),fCv:fly.cv,fly:fly};},
    show:function(o,pred){var d=o.one.d,rc=CF[d.robo],fc=CF[d.fly],res=o.w.F>o.w.R+2?'F':o.w.R>o.w.F+2?'R':'D',nm={F:'초파리',R:'주판봇',D:'무승부'};
      var Mo={F:['fly_arms','robo_sigh','doc_judge','asst_report'],R:['fly_coffee','robo_happy','doc_judge','asst_report'],D:['fly_magnify','robo_meh','doc_think','asst_report']}[res];U.setMood(fi,Mo[0]);U.setMood(ri,Mo[1]);
      function bar(nmx,rep,fin,cls){return '<div><div class="resbar"><span style="color:var(--c-'+cls+')">'+nmx+'</span><div class="bar"><i style="background:var(--c-'+cls+');width:'+Math.max(2,(fin-0.7)/0.3*100)+'%"></i></div><b>'+pct(fin)+'</b></div><p class="mnote" style="margin:0 0 6px 0">보고한 점수 '+pct(rep)+' → 2차 출하 검수 '+pct(fin)+' (부풀림 '+fmt((rep-fin)*100,1)+'%p)</p></div>';}
      $('#d-bars').innerHTML='<h4 style="margin:6px 0 4px;font-size:14px">시드 '+d.seed+' — 2차 출하 검수(79마리) 정확도 → '+nm[o.one.res]+'</h4><div class="resbars">'+bar('초파리 · '+name(fc),fc.cv,d.fb,'fly')+bar('주판봇 · '+name(rc),d.ra,d.rb,'robo')+'</div>'+
        '<p class="muted" style="font-size:13.5px;margin:8px 0 2px">반 나누기를 20번 바꿔 다시 하면 (아래 그림): 초파리 승 '+o.w.F+' · 주판봇 승 '+o.w.R+' · 무승부 '+o.w.D+'. 2차 정확도 평균 초파리 '+pct(o.fFin)+', 주판봇 '+pct(o.rFin)+'.</p>';
      DO=o;U.drawAll();
      $('#d-say').innerHTML=U.say('asst',Mo[3],'20번 평균: 주판봇은 1차 시험 1등 점수 '+pct(o.rPeek)+'을 보고했지만 2차에서는 '+pct(o.rFin)+'였어요. 초파리는 랩 점수 '+pct(o.fCv)+'를 보고했고 2차에서는 '+pct(o.fFin)+'였어요.')+
        U.say('doc',Mo[2],(res==='D'?'정확도로는 무승부다. ':nm[res]+' 쪽이 조금 낫다. ')+'그런데 둘 다 보고한 숫자가 틀렸다. 주판봇은 시험지를 엿봐서 '+fmt((o.rPeek-o.rFin)*100,1)+'%p, 초파리는 닮은 시료로 잰 랩 점수라 '+fmt((o.fCv-o.fFin)*100,1)+'%p 부풀었다. 출하 보고서에 쓸 숫자는 고르는 데 쓰지 않은 2차 검수 점수 하나뿐이다.',true);
      $('#d-score').textContent='판정: '+{F:'F 초파리 승',R:'R 주판봇 승',D:'D 무승부 (정확도) — 보고 점수는 둘 다 부풂'}[res];
      $('#d-pred').textContent=pred?' · 내 예상: '+(pred==='fly'?'초파리':'주판봇')+(res==='D'?' — 승부는 비겼어요. 진 쪽은 "보고한 숫자"예요':((pred==='fly'&&res==='F')||(pred==='robo'&&res==='R')?' — 맞았어요':' — 빗나갔어요')):'';},
    reset:function(){U.setMood(fi,'fly_point');U.setMood(ri,'robo_calc');}});
})();

/* ══ 대사 · 등장인물 ══ */
var DLG={
 hero:[["doc","doc_front","오늘은 공장 옆 시제품 테스트 랩실입니다. 이웃 통조림 공장이 맡긴 어종 분류 장비를 만들고, 진짜 물고기로 시험해요."],
       ["asst","asst_report","개발용 시료는 1,580마리, 봉인한 시험 시료는 158마리예요. 점수는 제가 계산해서 읽어 드릴게요."],
       ["robo","robo_calc","랩 점수 99%면 끝난 거 아냐? 바로 출하하자."],
       ["fly","fly_magnify","1,580마리 중 1,422마리가 복사해서 늘린 거라며. 형제끼리 시험 본 점수를 믿어?"]],
 line:[["sia","sia_explain","P3 길이 게이지예요. 입력 네 개가 다 재져야 P7 엔진이 판정할 수 있어요."],["moa","moa_report","P10 통 위의 빨간 띠가 다른 어종이 섞인 캔이에요. 통조림 라벨이 틀린 제품이죠."]],
 sample:[["asst","asst_report","흰송어는 원본이 6마리라 실제 테스트에 6마리만 나와요. 한 마리만 틀려도 17%p가 흔들려요."]],
 build:[["robo","robo_chart","34대 중 1등만 고르면 되지. 표를 랩 점수로 정렬하면 바로 나와."],["fly","fly_point","1등의 점수에는 운도 섞여 있어. 34번 뽑기 중 제일 좋은 걸 고른 거니까."]],
 test:[["asst","asst_report","로치와 농어, 흰송어와 농어가 자주 섞여요. 교안에서도 오답이 몰리던 어종이에요."]],
 terrain:[["doc","doc_board","확신도가 꺼지는 골짜기가 어종 경계입니다. 오답은 거의 그 근처에 있어요. 2편의 오차 지형과 같은 3D 지도 코드예요."]],
 gap:[["fly","fly_magnify","닮게 늘린 형제 물고기가 훈련과 검증에 나뉘어 들어가면, 검증은 이미 본 문제를 푸는 셈이야."]],
 dfly:[["fly","fly_point","1차 시험 결과는 안 봐. 랩 점수 1등을 고르고, 그 점수를 보고할게."]],
 drobo:[["robo","robo_calc","실전 점수가 제일 정직하잖아. 1차 현장 시험에서 1등 한 장비를 고를게."]],
 next:[["robo","robo_coin","배터리 판정기도 랩 점수 말고 다른 날 만든 셀로 시험해야겠네. 같은 날 셀끼리는 형제니까."],["fly","fly_coffee","라벨이 잘못 적힌 셀까지 섞이면 더 부풀 거야. ③ 공장 라벨부터 봐야 해."]],
 outro:[["doc","doc_magic","오늘의 세 줄입니다.<br>① 시료를 훈련·검증·봉인 시험으로 나누고, 봉인 시험은 맨 마지막에 한 번만 연다.<br>② 닮게 늘린 시료로 잰 랩 점수는 부푼다. 이 랩실에서는 99%가 90% 안팎이 됐다.<br>③ 시험지를 보고 고르면 그 점수도 부푼다. 보고서에는 고르는 데 쓰지 않은 점수를 쓴다."],
        ["robo","robo_meh","1차 시험 1등 점수를 보고했으면 출하하고 망신당할 뻔했네."],
        ["fly","fly_coffee","내 랩 점수도 부풀었어. 시료가 형제라는 걸 알았으면서도."],
        ["asst","asst_report","다음 시제품은 ① 배터리 불량품 판정기예요. 같은 시험대, 같은 절차로 올려 볼게요."]]
};
U.dialogues(DLG);
var CAST=[["doc","doc_front","박사","랩실 책임자. 판정은 늘 계산한 숫자대로."],["asst","asst_report","조수 하루","시험 기록과 숫자 발표."],["fly","fly_magnify","초파리 연구원","의심하는 쪽. 시료와 시험 절차를 따져요."],["robo","robo_calc","주판봇","확신하는 쪽. 높은 점수에 걸어요."],["sia","sia_explain","인턴 시아","길이 게이지 담당."],["moa","moa_report","인턴 모아","대각선 게이지·통조림 라인 기록 담당."]];
$('#castgrid').innerHTML=CAST.map(function(c){return '<div class="castc" style="--cc:var(--c-'+c[0]+')"><img src="'+U.spr(c[1])+'" alt="" aria-hidden="true"><div><b>'+c[2]+'</b><p>'+c[3]+'</p></div></div>';}).join('');
$('#secretrow').innerHTML=['x1','x2','x3'].map(function(x,i){return U.say(x,x+'_hint',['(반짝)','(…끄덕)','(짝짝짝)'][i]);}).join('');
$('#secretbtn').onclick=function(){var r=$('#secretrow');r.hidden=!r.hidden;this.setAttribute('aria-expanded',String(!r.hidden));this.textContent=r.hidden?'방청석 보기 (미공개 식구)':'방청석 닫기';};
U.fillImgs();

/* ══ 표지 대체 그림 ══ */
(function(){var cv=$('#cvCover');if(!cv)return;U.reg(cv,function(dt){if(dt)return;var R0=U.setup(cv),g=R0.g,w=R0.w,h=R0.h;var gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#eef4f8');gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(22,33,43,.14)';g.lineWidth=3;g.beginPath();g.moveTo(w*0.04,h*0.32);g.lineTo(w*0.96,h*0.32);g.stroke();
  for(var i=0;i<12;i++){var x=w*(0.07+i*0.075),k=i%7,s=w*0.016;g.save();g.translate(x,h*0.32-s*0.2);g.fillStyle=i<6?'#c9d1da':SC[k];g.beginPath();g.ellipse(0,0,s,s*0.42,0,0,7);g.fill();g.beginPath();g.moveTo(-s*0.9,0);g.lineTo(-s*1.45,-s*0.4);g.lineTo(-s*1.45,s*0.4);g.closePath();g.fill();g.restore();if(i===9){g.beginPath();g.arc(x,h*0.32,s*1.3,0,7);g.strokeStyle=C.eye;g.lineWidth=2;g.stroke();}}
  for(var j=0;j<7;j++){g.fillStyle=SC[j];g.fillRect(w*(0.5+j*0.06),h*0.12,w*0.035,h*0.12);}});})();

/* ══ 용어 · 퀴즈 ══ */
U.Gloss({
 'Fish Market':['Fish Market 데이터','데이터','핀란드 어시장 물고기 159마리의 어종·무게·길이·높이·두께. 머신러닝 입문 실습에 널리 쓴다.'],
 '다중 분류':['다중 분류','문제','보기가 셋 이상인 분류. 이 페이지는 7어종.'],
 '로지스틱 회귀':['로지스틱 회귀','엔진','입력의 가중합을 어종별 확률로 바꾸는 분류 모델. C가 클수록 규제가 약하다.'],
 'KNN':['KNN (k-최근접 이웃)','엔진','가장 가까운 시료 k개의 다수결로 고른다. 가중치가 없다.'],
 '교차검증':['교차검증','평가','개발 시료를 k조각으로 나눠 한 조각씩 돌아가며 검증하는 방법. 시험 시료를 쓰지 않고 설정을 고른다.'],
 '로그 손실':['로그 손실 (크로스 엔트로피)','평가','정답에 준 확률의 −log 평균. 자신 있게 틀리면 크게 커진다.'],
 '데이터 누수':['데이터 누수','평가','검증·시험에 쓰면 안 되는 정보가 학습에 새어 들어가 점수가 부푸는 일.'],
 '선택 편향':['선택 편향 (모델 선택)','평가','여러 후보 중 점수가 가장 높은 것을 고르면, 그 점수에 운이 섞여 실제보다 높게 나오는 일.'],
 '혼동 행렬':['혼동 행렬','평가','실제 정답(줄)과 판정(칸)을 교차해 센 표. 어디서 틀리는지 보인다.'],
 '증강':['데이터 증강','데이터','원본을 조금씩 바꿔 시료 수를 늘리는 것. 늘린 시료는 원본과 닮았다.'],
 '봉인 시료':['봉인 시료 (테스트 세트)','평가','고르는 일이 다 끝날 때까지 열지 않는 시험용 시료.']
},['교차검증','데이터 누수','선택 편향','혼동 행렬','증강','봉인 시료']);
U.Study({quiz:{
 sample:[{q:'이 랩실에서 봉인 시료(실제 테스트)로 원본 158마리를 쓴 까닭은?',o:['늘린 시료는 원본을 닮게 만든 것이라, 진짜 물고기에 대한 실력을 보려면 원본이 필요해서','원본이 더 많아서','늘린 시료가 틀려서','원본은 무게가 없어서'],a:0,why:'장비가 만날 것은 진짜 물고기입니다. 늘린 시료끼리의 점수로는 그 실력을 알 수 없습니다.',hint:'장비가 현장에서 만날 시료를 생각해 보세요.'},
   {q:'흰송어 실제 테스트 시료가 6마리라는 것이 뜻하는 것은?',o:['한 마리만 틀려도 흰송어 재현율이 약 17%p 바뀐다','흰송어는 시험할 필요가 없다','흰송어는 늘 맞힌다','정확도가 6%다'],a:0,why:'1/6 ≈ 16.7%. 시료가 적은 어종의 점수는 크게 흔들립니다.',hint:'1 ÷ 6.'}],
 build:[{q:'장비 34대 중 랩 점수 1등을 고르는 일은 교안의 어느 층위일까요?',o:['② 하이퍼파라미터 · ③ 모형 구조 고르기','① 가중치 학습','0층위 문제 정의','시험'],a:0,why:'엔진·설정값·입력 변수를 고르는 일은 검증(교차검증) 성적으로 판정하는 ②③층위입니다.',hint:'무엇을 정하고, 무엇으로 판정하나.'}],
 test:[{q:'혼동 행렬에서 "로치 줄, 농어 칸"의 숫자 5는?',o:['실제 로치 5마리가 농어 통조림으로 갔다','농어 5마리가 로치로 갔다','로치를 5마리 맞혔다','농어가 5마리 있다'],a:0,why:'줄이 실제 어종, 칸이 판정한 어종입니다.',hint:'줄 = 실제, 칸 = 판정.'},
   {q:'정확도가 같은 두 장비 중 로그 손실이 더 작은 장비는?',o:['틀릴 때 덜 자신 있게 틀린다 — 애매한 물고기를 보류하기 좋다','더 많이 맞힌다','더 빠르다','입력이 적다'],a:0,why:'로그 손실은 정답에 준 확률로 계산하므로, 같은 정확도라도 확률을 더 정직하게 낸 장비가 작습니다.',hint:'−log(정답 확률).'}],
 terrain:[{q:'판정 지형의 골짜기(확신도가 낮은 곳)는 무엇일까요?',o:['두 어종의 확률이 비슷한 경계 — 오답이 몰리는 곳','물고기가 없는 곳','장비가 꺼진 곳','무게가 가벼운 곳'],a:0,why:'가장 높은 어종 확률이 낮다는 것은 다른 어종과 비슷하다는 뜻입니다. 경계 근처입니다.',hint:'확신도 = 가장 높은 확률.'}],
 gap:[{q:'늘린 시료로 교차검증하면 점수가 부푸는 까닭은?',o:['같은 원본에서 나온 닮은 시료가 훈련과 검증에 나뉘어 들어가서','교차검증은 늘 틀려서','시료가 많아서 계산이 틀려서','표준화를 해서'],a:0,why:'검증 시료와 거의 같은 형제가 훈련에 있으니, 처음 보는 문제를 푸는 시험이 아니게 됩니다(데이터 누수).',hint:'형제 물고기.'},
   {q:'랩에서 좋아진 변경(입력 6개)이 실제 테스트에서 나빠졌다면?',o:['랩 점수가 실제를 대표하지 못한다는 신호 — 봉인 시료로 확인해야 한다','실제 테스트가 틀렸다','입력은 많을수록 좋다','랩 점수만 믿으면 된다'],a:0,why:'랩 점수와 실제 점수의 방향이 다르면 랩의 시료나 절차에 문제가 있습니다.',hint:'두 점수의 방향.'}],
 duel:[{q:'주판봇이 1차 현장 시험 1등 점수를 보고하면 생기는 일은?',o:['고르는 데 쓴 점수라 실제(2차)보다 높게 나온다','정확한 점수다','더 낮게 나온다','시료가 늘어난다'],a:0,why:'34대 중 1차 점수가 가장 높은 것을 고르면 운이 좋았던 장비가 뽑히기 쉽습니다(선택 편향). 2차에서는 내려갑니다.',hint:'고르는 데 쓴 시료.'},
   {q:'출하 보고서에 적을 점수로 가장 알맞은 것은?',o:['고르는 일이 끝난 뒤 처음 연 2차 출하 검수 점수','랩 점수 최고값','1차 시험 최고값','두 점수의 최댓값'],a:0,why:'고르는 데 쓰지 않은 시료로 한 번 잰 점수만 정직한 추정입니다.',hint:'봉인 시료.'}]
}});

/* ══ 처음 화면 ══ */
bindDev();buildTable();testPanel();
U.start();
})();
