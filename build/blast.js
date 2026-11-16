/* blast.js — 「⑤ 배터리 열폭주 실험 랩」 페이지 스크립트 (IIFE 하나). 계산은 blast_sim.js(BS) */
(function(){
'use strict';
var $=U.$,$$=U.$$,fmt=U.fmt,cssv=U.cssv,clamp=U.clamp;
var C={eye:cssv('--eye'),gfp:cssv('--gfp'),amber:cssv('--amber'),info:cssv('--info'),muted:cssv('--muted'),text:cssv('--text'),rule:cssv('--rule')};
function pct(x,d){return x<0.0005?'0.05% 미만':fmt(x*100,d==null?1:d)+'%';}
function mini(cls,label,val){return '<div class="mini '+(cls||'')+'"><span>'+label+'</span><b>'+val+'</b></div>';}
var YN=['변화 없음','연기','화염'],YC=['#2f8f5b','#8a8f98','#d4421e'],SH={'-1':'각형','1':'원통형','0':'평균'};
var cond={soc:100,F:1300,shape:1,T:25},DATA=BS.design(60,7,{}),LAST=null,tPress=-99,seedN=100;
var FIT=null;function refit(){FIT=DATA.length>=8?BS.fit(DATA,0.02,1500):null;}
refit();
$('#k-p80').textContent=pct(BS.probs(BS.TRUE,{soc:80,F:1300,shape:0,T:25}).fire,0);

/* ══ 뉴스 사례 표 ══ */
$('#tb-news').innerHTML='<thead><tr><th>충전율</th><th>압력</th><th>결과 단계</th><th>관찰 (요약)</th></tr></thead><tbody>'+BS.NEWS.map(function(n){return '<tr><td><b>'+n.soc+'%</b></td><td>1,300 kg</td><td><span class="sw" style="background:'+YC[n.y]+'"></span>'+YN[n.y]+'</td><td>'+n.note+'</td></tr>';}).join('')+'</tbody>';

/* ══ 조건 ══ */
function bindCond(){U.btns($('#g-F'),[[650,'650 kg'],[1300,'1,300 kg (뉴스)'],[2000,'2,000 kg']],cond.F,function(v){cond.F=v;labInfo();});
  U.btns($('#g-shape'),[[1,'원통형'],[-1,'각형']],cond.shape,function(v){cond.shape=v;labInfo();});
  U.btns($('#g-T'),[[25,'25 °C'],[40,'40 °C (한여름 창고)']],cond.T,function(v){cond.T=v;labInfo();});}
bindCond();
$('#r-soc').oninput=function(){cond.soc=+this.value;$('#v-soc').textContent=cond.soc+'%';labInfo();};
function rnd(){return BS.rng(seedN++);}
function press(n){var r=rnd();for(var i=0;i<n;i++){var tr=BS.trial({soc:cond.soc,F:cond.F,shape:cond.shape,T:cond.T},r);DATA.push(tr);LAST=tr;}tPress=Lab.t();Lab.go(LAST);refit();labInfo();drawTemp();upLogit();upPolicy();}
$('#b-press').onclick=function(){press(1);};$('#b-20').onclick=function(){press(20);};
$('#b-mix').onclick=function(){var d=BS.design(60,seedN++,{});DATA=DATA.concat(d);LAST=d[d.length-1];tPress=Lab.t();Lab.go(LAST);refit();labInfo();drawTemp();upLogit();upPolicy();};
$('#b-demo').onclick=function(){var r=BS.rng(seedN++);Lab.go({soc:100,F:2000,shape:cond.shape,T:25,y:2,onset:7,peak:772*(0.95+0.1*r())},true);document.getElementById('cvLab').scrollIntoView({behavior:U.reduce?'auto':'smooth',block:'center'});};
/* ══ CSV 내려받기 (Colab 분석용) ══ */
var CSVH='trial_id,soc_pct,force_kg,shape,shape_code,ambient_c,result,result_label,onset_s,peak_c';
function csvRows(d){return d.map(function(x,i){return [i+1,x.soc,x.F,x.shape===1?'cylindrical':x.shape===-1?'prismatic':'both',x.shape,x.T,x.y,['none','smoke','fire'][x.y],x.y?x.onset.toFixed(1):'',Math.round(x.peak)].join(',');}).join('\n');}
function dl(name,text){var b=new Blob(['\ufeff'+text],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}
$('#csv-mine').onclick=function(){if(!DATA.length){$('#csv-msg').textContent='기록이 없습니다. 먼저 압착을 해 보세요.';return;}dl('blast_trials_mine.csv',CSVH+'\n'+csvRows(DATA));$('#csv-msg').textContent='내 실험 기록 '+DATA.length+'회를 내려받았습니다.';};
$('#csv-news').onclick=function(){dl('blast_news_4.csv',CSVH+'\n'+csvRows(BS.NEWS.map(function(n){return {soc:n.soc,F:n.F,shape:0,T:n.T,y:n.y,onset:n.y===2?7:n.y===1?15:0,peak:n.y===2?772:n.y===1?150:30};})));};
$('#b-clear').onclick=function(){DATA=[];LAST=null;refit();labInfo();drawTemp();upLogit();upPolicy();};
function labInfo(){var q=BS.probs(BS.TRUE,cond),same=DATA.filter(function(x){return x.soc===cond.soc&&x.F===cond.F;}),cnt=[0,0,0];same.forEach(function(x){cnt[x.y]++;});
  $('#lab-minis').innerHTML=mini('r','화염 확률 (가정 모형)',pct(q.fire))+mini('a','연기만 날 확률',pct(q.smoke))+mini('g','변화 없음',pct(q.none))+
    mini('','이 충전율·압력 기록 '+same.length+'회','없음 '+cnt[0]+' · 연기 '+cnt[1]+' · 화염 '+cnt[2])+(LAST?mini(LAST.y===2?'r':LAST.y===1?'a':'g','방금 결과 (최고 '+Math.round(LAST.peak)+' °C)',YN[LAST.y]):'');
  $('#hud').textContent='실험 기록 '+DATA.length+'회';
  var it=[];if(LAST&&LAST.y===2)it.push(['r','화염! 누른 지 '+fmt(LAST.onset,0)+'초 만에 불꽃이 튀고 '+Math.round(LAST.peak)+' °C까지 올랐습니다. 뉴스 사례의 100% 배터리는 7초, 772 °C였습니다[1].']);
  else if(LAST&&LAST.y===1)it.push(['a','회색 연기만 조금 났습니다(최고 '+Math.round(LAST.peak)+' °C). 뉴스 사례의 70% 배터리와 같은 단계입니다.']);
  else if(LAST)it.push(['g','변화가 없었습니다. 그래도 같은 조건을 여러 번 하면 가끔 다른 결과가 나올 수 있습니다 — 확률이니까요.']);
  it.push(['m','이 조건의 화염 확률(가정)은 '+pct(q.fire)+'입니다. 충전율을 10%p씩 바꿔 보며 연기와 화염이 갈리는 구간을 찾아보세요.']);U.ins($('#i-lab'),it);}
function drawTemp(){var cv=$('#cvTemp');if(!LAST){U.plot(cv,{xr:[0,60],yr:[0,900],xt:[0,15,30,45,60],yt:[0,200,400,600,800],xl:'누른 뒤 시간 (초)',yl:'셀 표면 온도 (°C)',series:[],hlines:[{y:772,color:'rgba(201,48,44,.4)',label:'뉴스 사례 최고 772 °C'}],stamp:'설명용 모형'});return;}
  var pts=[];for(var t=0;t<=60;t+=0.5)pts.push([t,BS.temp(LAST,t)]);
  U.plot(cv,{xr:[0,60],yr:[0,900],xt:[0,15,30,45,60],yt:[0,200,400,600,800],xl:'누른 뒤 시간 (초)',yl:'셀 표면 온도 (°C)',series:[{pts:pts,color:YC[LAST.y],width:2.6}],hlines:[{y:772,color:'rgba(201,48,44,.4)',label:'뉴스 사례 최고 772 °C'}],vlines:LAST.y?[{x:LAST.onset,color:YC[LAST.y],label:(LAST.y===2?'불꽃 ':'연기 ')+fmt(LAST.onset,0)+'초'}]:[],stamp:'설명용 모형'});}
U.reg($('#cvTemp'),function(dt){if(!dt)drawTemp();});

/* ══ 3D 방폭 시험실 ══
   컨베이어처럼 줄 세운 칸이 아니라, 한 방(방폭 시험실) 안에서 진행하는 압착 시험.
   가운데 방폭 챔버 안 유압 프레스가 셀을 누르고, 관제실 방폭 유리 뒤에서 식구들이 지켜본다.
   화염 단계면: 압착 → 부풂·가스 분출(벤팅) → 폭발(섬광·불덩이·파편·충격파·유리 금) → 분출 화염 → 질식·냉각 소화 → 배기.
   Lab.go(trial, demo) 로 한 번의 시험을 재생한다. 그림 속 시간은 실제보다 빠르다. */
var Lab={};
(function(){var cv=$('#cvLab'),narrow=(cv.clientWidth||window.innerWidth)<600,yaw=narrow?-0.32:-0.62,pitch=narrow?0.95:0.74,zoom=narrow?1.7:1.15,sel=4,t=0,slow=1;
  Lab.t=function(){return t;};
  /* 장비 12개: 번호 · 이름 · 설명 · 위치(라벨 기준점) */
  var EQ=[['E1','방화 시료 보관함','충전율별 시료 셀을 방화 금고에 보관합니다. 보관 충전율이 낮을수록 안전합니다. 인턴 시아 담당.',-7.4,4.3,2.2],
    ['E2','충·방전 스테이션','시험할 충전율(0~100%)로 셀을 맞춥니다. 조수 하루가 충전율과 셀 번호를 기록해요.',-7.4,0.6,1.5],
    ['E3','시료 지그 · 앤빌','셀을 받침대(앤빌) 위에 고정합니다. 원통형·각형을 바꿔 끼울 수 있어요.',0,0,0.9],
    ['E4','유압 압착 프레스','650·1,300·2,000 kg으로 셀을 누릅니다. 뉴스 사례는 1,300 kg이었습니다.',0,0,4.3],
    ['E5','방폭 챔버','강철 틀과 두꺼운 강화 유리로 만든 시험 상자. 폭발·화염·파편이 밖으로 나오지 못하게 가둡니다.',0,-2.5,3.0],
    ['E6','열화상 카메라','챔버 관측창으로 셀 표면 온도를 1초마다 찍습니다. 인턴 모아가 관제실 화면으로 봐요.',-4.5,-2.3,2.1],
    ['E7','열전대 · 데이터 기록계','셀에 붙인 열전대 온도와 압력·변위를 기록합니다.',-4.5,2.5,1.7],
    ['E8','연기·가스 감지기','챔버 천장의 감지기가 연기 농도로 "연기" 단계를 판정합니다.',-1.4,-1.2,4.6],
    ['E9','배기 덕트 · 스크러버','유독 가스와 연기를 빨아내 걸러 밖으로 내보냅니다.',2.2,1.6,5.4],
    ['E10','소화 노즐 (질식·냉각)','화염 단계면 불활성 가스로 질식시키고 물안개로 식힙니다.',-1.6,1.4,4.6],
    ['E11','관제실 · 방폭 유리','시험 중에는 아무도 방에 들어가지 않습니다. 박사·하루·모아·초파리가 방폭 유리 뒤 콘솔에서 지켜봅니다.',7.0,0,2.6],
    ['E12','비상정지','버섯 모양 빨간 버튼. 주판봇이 지켜요. 누르면 프레스가 멈추고 소화가 바로 시작됩니다.',5.5,-3.9,1.6]];
  var CX=[-2.9,2.9],CY=[-2.4,2.4],CZ=[0.35,4.2];   /* 챔버 안쪽 */
  var cx,cy,sc;function P(x,y,z){var c=Math.cos(yaw),s=Math.sin(yaw),rx=x*c-y*s,ry=x*s+y*c,cp=Math.cos(pitch),sp=Math.sin(pitch);return [cx+rx*sc,cy+(-z*cp-ry*sp)*sc,ry*cp-z*sp];}
  function fwd(){var c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return [s*cp,c*cp,-sp];}
  function poly(g,pts,fill,stroke,lw){g.beginPath();pts.forEach(function(p,k){k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.lineWidth=lw||1;g.strokeStyle=stroke;g.stroke();}}
  function faces(x,y,z0,w,d,h){var x0=x-w/2,x1=x+w/2,y0=y-d/2,y1=y+d/2,z1=z0+h;
    return [[[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],0],[[0,0,-1],[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],0],[[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],1],[[0,1,0],[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],1],[[-1,0,0],[[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],2],[[1,0,0],[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],2]];}
  function box(g,x,y,z0,w,d,h,cols,hl,alpha){var F=fwd();if(alpha)g.globalAlpha=alpha;
    faces(x,y,z0,w,d,h).forEach(function(f){var n=f[0];if(n[0]*F[0]+n[1]*F[1]+n[2]*F[2]>=0)return;poly(g,f[1].map(function(p){return P(p[0],p[1],p[2]);}),cols[f[2]],hl||'rgba(22,33,43,.32)',hl?2.2:1);});g.globalAlpha=1;}
  function cyl(g,x,y,z0,r,h,cols,n){var F=fwd(),N=n||14,top=[],bot=[];for(var i=0;i<N;i++){var a=i/N*Math.PI*2;top.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z0+h]);bot.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z0]);}
    for(var k=0;k<N;k++){var a2=(k+0.5)/N*Math.PI*2,nx=Math.cos(a2),ny=Math.sin(a2);if(nx*F[0]+ny*F[1]>=0)continue;var j=(k+1)%N,sh=0.5+0.5*Math.max(0,-(nx*0.6+ny*0.8));
      poly(g,[P.apply(null,bot[k]),P.apply(null,bot[j]),P.apply(null,top[j]),P.apply(null,top[k])],sh>0.75?cols[1]:cols[2],null);}
    if(F[2]<0)poly(g,top.map(function(p){return P(p[0],p[1],p[2]);}),cols[0],'rgba(22,33,43,.3)');}
  function rr(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
  var STEEL=['#a7b0ba','#8d96a1','#737c87'],DARK=['#6b737d','#59616a','#4b525a'],YEL=['#f2c230','#d9ac22','#c49a1a'],RED=['#e0443a','#c0352c','#a32b23'];

  /* ── 한 번의 시험 재생 상태 ── */
  var RUN=null,PART=[],CRACK=[];
  function tl(tr){var onA=tr.y===2?clamp(tr.onset*0.12,0.6,1.8):clamp((tr.onset||14)*0.08,0.8,1.8),sV=2.1+onA;return {sV:sV,sX:sV+1.3};}
  Lab.go=function(tr,demo){RUN={tr:tr,s:0,demo:!!demo,T:tl(tr),boom:false,fired:false,smk:0,fl:0,spray:0,dust:false};PART=[];CRACK=[];};
  function spawn(o){if(PART.length<900)PART.push(o);}
  function emit(kind,x,y,z,n,o){o=o||{};for(var i=0;i<n;i++){var a=Math.random()*Math.PI*2,u=Math.random()*2-1,sp=(o.sp||1)*(0.4+Math.random()*0.8),r2=Math.sqrt(1-u*u);
      var vx=Math.cos(a)*r2*sp,vy=Math.sin(a)*r2*sp,vz=u*sp+(o.up||0);if(o.dir){vx=o.dir[0]*sp+vx*0.25;vy=o.dir[1]*sp+vy*0.25;vz=o.dir[2]*sp+vz*0.25;}
      spawn({k:kind,x:x,y:y,z:z,vx:vx,vy:vy,vz:vz,a:0,L:(o.L||1)*(0.7+Math.random()*0.6),r:o.r||0.2,c:o.c,rot:Math.random()*6,vr:(Math.random()-0.5)*14,sz:o.sz||0.12});}}
  function stepParts(dt){for(var i=PART.length-1;i>=0;i--){var p=PART[i];p.a+=dt;if(p.a>p.L){PART.splice(i,1);continue;}
      if(p.k==='smoke'||p.k==='bsmoke'){p.vz+=dt*0.9;p.vx*=1-dt*0.8;p.vy*=1-dt*0.8;p.vz*=1-dt*0.4;
        if(p.z>CZ[1]-0.5){var dx=2.2-p.x,dy=1.6-p.y,d=Math.hypot(dx,dy)+0.2;p.vx+=dx/d*dt*3;p.vy+=dy/d*dt*3;p.vz*=0.6;if(d<0.6)p.a=Math.max(p.a,p.L-0.2);}}
      else if(p.k==='flame'){p.vz+=dt*2.6;p.vx*=1-dt*2;p.vy*=1-dt*2;}
      else if(p.k==='spray'){p.vz-=dt*4;}
      else if(p.k==='fire'){p.vx*=1-dt*3;p.vy*=1-dt*3;p.vz=p.vz*(1-dt*3)+dt*1.5;}
      else {p.vz-=dt*9.8;p.rot+=p.vr*dt;}   /* spark·debris: 중력 */
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
      /* 챔버 벽에 부딪혀 튕김 — 폭발이 챔버 안에 갇힌다 */
      var e=p.k==='debris'?0.45:p.k==='spark'?0.6:0.1;
      if(p.x<CX[0]+0.05){p.x=CX[0]+0.05;p.vx=-p.vx*e;}if(p.x>CX[1]-0.05){p.x=CX[1]-0.05;p.vx=-p.vx*e;}
      if(p.y<CY[0]+0.05){p.y=CY[0]+0.05;p.vy=-p.vy*e;}if(p.y>CY[1]-0.05){p.y=CY[1]-0.05;p.vy=-p.vy*e;}
      if(p.z>CZ[1]-0.05){p.z=CZ[1]-0.05;p.vz=-Math.abs(p.vz)*e;}
      if(p.z<CZ[0]){p.z=CZ[0];if(p.k==='debris'||p.k==='spark'){p.vz=Math.abs(p.vz)*e;p.vx*=0.7;p.vy*=0.7;if(Math.abs(p.vz)<0.4){p.vz=0;p.vr*=0.8;if(p.k==='debris')p.L=Math.max(p.L,p.a+60);}}else p.vz=Math.max(0,p.vz);}}}
  function update(dt){if(!RUN)return;var s0=RUN.s;RUN.s+=dt*slow;var s=RUN.s,tr=RUN.tr,T=RUN.T,y=tr.y,bx=0,by=0,bz=1.15;dt*=slow;
    if(s0<1.6&&s>=1.6){emit('spark',bx,by,bz,y>=1?14:5,{sp:2.2,L:0.6,up:1});if(y===0)emit('smoke',bx,by,bz-0.2,6,{sp:0.4,L:1.6,r:0.18,c:'200,200,205'});}
    if(y>=1&&s>T.sV&&s<T.sV+(y===2?1.3:7)){RUN.smk+=dt*(y===2?46:20);while(RUN.smk>1){RUN.smk--;emit('smoke',bx+(Math.random()-0.5)*0.3,by,bz+0.1,1,{dir:[(Math.random()-0.5)*0.6,(Math.random()-0.5)*0.6,1.6],sp:y===2?2.2:1.1,L:y===2?2.2:3.6,r:0.22,c:y===2?'235,235,238':'165,168,175'});}}
    if(y===2&&!RUN.boom&&s>=T.sX){RUN.boom=true;
      emit('fire',bx,by,bz,70,{sp:5.5,L:0.9,r:0.38});emit('spark',bx,by,bz,90,{sp:9,L:1.6,up:2});emit('debris',bx,by,bz,34,{sp:7,L:30,up:2.5,sz:0.13});
      emit('bsmoke',bx,by,bz,40,{sp:2.8,L:4.5,r:0.35,c:'38,32,34'});
      var c0u=0.42+Math.random()*0.16,c0v=0.3+Math.random()*0.15;for(var k=0;k<11;k++){var a=k/11*Math.PI*2+Math.random()*0.3,L1=0.08+Math.random()*0.16,mu=c0u+Math.cos(a)*L1*0.5,mv=c0v+Math.sin(a)*L1*0.6;CRACK.push([c0u,c0v,mu,mv]);CRACK.push([mu,mv,mu+Math.cos(a+0.4)*L1*0.5,mv+Math.sin(a+0.4)*L1*0.6]);}
      for(var k2=0;k2<14;k2++){var a1=k2/14*Math.PI*2,r1=0.06+0.03*(k2%2),a2=a1+Math.PI*2/14;CRACK.push([c0u+Math.cos(a1)*r1,c0v+Math.sin(a1)*r1*1.2,c0u+Math.cos(a2)*r1,c0v+Math.sin(a2)*r1*1.2]);}
      if(!RUN.fired&&typeof FEV!=='undefined'){RUN.fired=true;var dm=RUN.demo;setTimeout(function(){FEV.fire('runaway',{force:true,title:'열폭주 경보 — 충전율 '+tr.soc+'% 셀 압착',text:'방폭 챔버에서 충전율 '+tr.soc+'% 셀을 '+tr.F.toLocaleString('ko-KR')+' kg으로 누르자 가스를 뿜다 폭발했습니다(최고 '+Math.round(tr.peak)+' °C). 주판봇이 비상정지! 파편과 불길은 챔버 안에 갇혔어요.'+(dm?' (시연 — 기록에는 넣지 않음)':'')});},2600);}}
    if(y===2&&RUN.boom&&s<T.sX+8.5){RUN.fl+=dt*(s<T.sX+5?60:25);while(RUN.fl>1){RUN.fl--;emit('flame',bx+(Math.random()-0.5)*0.5,by+(Math.random()-0.5)*0.4,bz+0.05,1,{dir:[(Math.random()-0.5)*0.4,(Math.random()-0.5)*0.4,1.8],sp:1.6,L:0.55,r:0.3});
        if(Math.random()<0.35)emit('bsmoke',bx,by,bz+0.6,1,{dir:[0,0,1.2],sp:1.2,L:4,r:0.32,c:'45,38,40'});if(Math.random()<0.12)emit('spark',bx,by,bz+0.2,1,{sp:3,L:1,up:2});}}
    if(y===2&&RUN.boom&&s>T.sX+5&&s<T.sX+10){RUN.spray+=dt*50;while(RUN.spray>1){RUN.spray--;var nx=[-1.6,1.6][Math.floor(Math.random()*2)];emit('spray',nx,(Math.random()-0.5)*1.6,CZ[1]-0.15,1,{dir:[(Math.random()-0.5)*0.8,(Math.random()-0.5)*0.8,-1.5],sp:2.2,L:1.1,r:0.08});}}
    stepParts(dt);}
  Lab.phase=function(){if(!RUN)return '대기';var s=RUN.s,T=RUN.T,y=RUN.tr.y;if(s<1.2)return '프레스 하강';if(s<2.1)return '압착';
    if(y===0)return '변화 없음';if(y===1)return s<T.sV?'압착 유지':s<T.sV+7?'연기 발생 · 배기':'배기 완료';
    if(s<T.sV)return '셀 부풂';if(s<T.sX)return '가스 분출(벤팅)';if(s<T.sX+0.6)return '폭발!';if(s<T.sX+5)return '분출 화염 · 열폭주';if(s<T.sX+10)return '질식·냉각 소화';return '배기 · 진화 완료';};
  function realT(){if(!RUN)return 0;var s=RUN.s,T=RUN.T,tr=RUN.tr;if(tr.y===2)return s<T.sX?tr.onset*s/T.sX:tr.onset+(s-T.sX)*3;return s*3;}
  function tempNow(){return RUN?BS.temp(RUN.tr,Math.min(60,realT())):25;}

  /* ── 그리기 ── */
  function draw(dt){if(dt){t+=dt;update(dt);}var Rr=U.setup(cv),g=Rr.g,w=Rr.w,h=Rr.h;sc=Math.min(w/25,h/16)*zoom;cx=w*(narrow?0.4:0.47);cy=h*0.6;
    var s=RUN?RUN.s:0,y=RUN?RUN.tr.y:-1,T=RUN?RUN.T:null,since=RUN&&RUN.boom?s-T.sX:99,shake=since<1.2?14*Math.exp(-since*3.5):0;
    if(shake){cx+=(Math.random()-0.5)*shake;cy+=(Math.random()-0.5)*shake;}
    g.fillStyle='#fbfcfd';g.fillRect(0,0,w,h);
    var F=fwd(),X0=-9.5,X1=9.5,Y0=-6.5,Y1=6.5,WH=5.6;
    /* 바닥 */
    poly(g,[P(X0,Y0,0),P(X1,Y0,0),P(X1,Y1,0),P(X0,Y1,0)],'#eef1f4','rgba(22,33,43,.25)');
    g.strokeStyle='rgba(22,33,43,.06)';g.lineWidth=1;for(var gx=X0;gx<=X1+0.01;gx+=1){var a=P(gx,Y0,0),b=P(gx,Y1,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
    for(var gy=Y0;gy<=Y1+0.01;gy+=1){a=P(X0,gy,0);b=P(X1,gy,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
    /* 관제실 바닥 */
    poly(g,[P(5,Y0,0.01),P(X1,Y0,0.01),P(X1,Y1,0.01),P(5,Y1,0.01)],'#e6ecf2',null);
    /* 안전선(노랑·검정 빗금) — 챔버 둘레 */
    (function(){var m=0.55,x0=CX[0]-0.25-m,x1=CX[1]+0.25+m,y0=CY[0]-0.25-m,y1=CY[1]+0.25+m,seg=[[x0,y0,x1,y0],[x1,y0,x1,y1],[x1,y1,x0,y1],[x0,y1,x0,y0]];
      seg.forEach(function(q){var L=Math.hypot(q[2]-q[0],q[3]-q[1]),n=Math.round(L/0.5);for(var i=0;i<n;i++){var u0=i/n,u1=(i+1)/n,ax=q[0]+(q[2]-q[0])*u0,ay=q[1]+(q[3]-q[1])*u0,bx2=q[0]+(q[2]-q[0])*u1,by2=q[1]+(q[3]-q[1])*u1,nx=-(q[3]-q[1])/L*0.22,ny=(q[2]-q[0])/L*0.22;
        poly(g,[P(ax,ay,0.02),P(bx2,by2,0.02),P(bx2+nx,by2+ny,0.02),P(ax+nx,ay+ny,0.02)],i%2?'#1d1a22':'#f2c230',null);}});})();
    /* 뒤쪽 벽 두 면 (앞쪽 벽은 잘라서 안이 보이게) */
    var walls=[[[0,1,0],[[X0,Y0,0],[X1,Y0,0],[X1,Y0,WH],[X0,Y0,WH]]],[[0,-1,0],[[X0,Y1,0],[X1,Y1,0],[X1,Y1,WH],[X0,Y1,WH]]],[[1,0,0],[[X0,Y0,0],[X0,Y1,0],[X0,Y1,WH],[X0,Y0,WH]]],[[-1,0,0],[[X1,Y0,0],[X1,Y1,0],[X1,Y1,WH],[X1,Y0,WH]]]];
    walls.forEach(function(wl){var n=wl[0];if(n[0]*F[0]+n[1]*F[1]+n[2]*F[2]>=0)return;var pts=wl[1].map(function(p){return P(p[0],p[1],p[2]);});poly(g,pts,'#f3f5f8','rgba(22,33,43,.22)');
      /* 벽 띠와 경고 표지 */
      var q=wl[1],mid=[(q[0][0]+q[1][0])/2,(q[0][1]+q[1][1])/2];poly(g,[P(q[0][0],q[0][1],0.9),P(q[1][0],q[1][1],0.9),P(q[1][0],q[1][1],1.05),P(q[0][0],q[0][1],1.05)],'#d6dde5',null);
      if(n[0]===0){var sx=mid[0]-4.5,sy=mid[1];var c1=P(sx-0.7,sy,3.2),c2=P(sx+0.7,sy,3.2),c3=P(sx,sy,4.4);poly(g,[c1,c2,c3],'#f2c230','#1d1a22',1.5);var cm=P(sx,sy,3.55);g.fillStyle='#1d1a22';g.font='900 '+Math.max(9,sc*0.55)+'px '+cssv('--font');g.textAlign='center';g.fillText('!',cm[0],cm[1]+sc*0.15);}});
    var items=[];function add(x,y,z,f){var q=P(x,y,z);items.push({d:q[2],f:f});}
    function hlOf(k){return sel===k?C.gfp:null;}
    /* E1 방화 보관함 */
    add(-7.4,4.3,1,function(){box(g,-7.4,4.3,0,1.8,1.2,2.2,RED,hlOf(0));[30,50,70,100].forEach(function(sv,j){var col=sv>=100?'#d4421e':sv>=70?'#e0a23a':'#2f8f5b';box(g,-8.0+j*0.4,3.6,2.2,0.28,0.28,0.2+sv/250,[col,col,col],false);});});
    /* E2 충·방전 스테이션 */
    add(-7.4,0.6,0.8,function(){box(g,-7.4,0.6,0,1.6,1.4,1.1,STEEL,hlOf(1));box(g,-7.4,0.6,1.1,1.2,0.8,0.5,['#2b3a4a','#22303d','#1b2631'],false);var q=P(-7.4,0.2,1.42);g.fillStyle='#7cf0a8';g.font='700 '+Math.max(8,sc*0.42)+'px '+cssv('--font');g.textAlign='center';g.fillText(cond.soc+'%',q[0],q[1]);});
    /* E6 열화상 카메라 (삼각대) */
    add(-4.5,-2.3,1,function(){var tp=P(-4.5,-2.3,1.8);[[-4.9,-2.6],[-4.1,-2.6],[-4.5,-1.9]].forEach(function(l){var a2=P(l[0],l[1],0);g.strokeStyle='#4b525a';g.lineWidth=2;g.beginPath();g.moveTo(a2[0],a2[1]);g.lineTo(tp[0],tp[1]);g.stroke();});
      box(g,-4.3,-2.2,1.8,0.9,0.5,0.45,['#3a4652','#2e3943','#252e36'],hlOf(5));var tv=tempNow(),q=P(-4.5,-2.3,2.7);g.fillStyle=tv>500?'#d4421e':tv>100?'#e0a23a':'#2f8f5b';g.font='700 '+Math.max(9,sc*0.45)+'px '+cssv('--font');g.textAlign='center';g.fillText(Math.round(tv)+' °C',q[0],q[1]);});
    /* E7 기록계 랙 */
    add(-4.5,2.5,0.8,function(){box(g,-4.5,2.5,0,1.2,0.9,1.7,DARK,hlOf(6));for(var i=0;i<4;i++){var q=P(-4.5,2.04,0.4+i*0.33);g.fillStyle=i%2?'#7cf0a8':'#e0a23a';g.fillRect(q[0]-sc*0.3,q[1]-2,sc*0.6*((Math.sin(t*3+i)+1.4)/2.4),3);}
      var c1=P(-3.9,2.5,0.7),c2=P(-2.9,0.6,1.1);g.strokeStyle='rgba(30,30,30,.55)';g.lineWidth=1.5;g.beginPath();g.moveTo(c1[0],c1[1]);g.quadraticCurveTo((c1[0]+c2[0])/2,Math.max(c1[1],c2[1])+10,c2[0],c2[1]);g.stroke();});
    /* E9 배기 덕트 (챔버 지붕 → 천장 → 뒷벽) */
    add(2.2,1.6,5,function(){box(g,2.2,1.6,CZ[1]+0.15,0.8,0.8,1.3,['#c5ccd4','#aab3bd','#949ea9'],hlOf(8));box(g,2.2,(1.6+Y1)/2+0.2,WH-0.7,0.8,Y1-1.6+0.4,0.7,['#c5ccd4','#aab3bd','#949ea9'],false);
      var on=RUN&&RUN.tr.y>=1&&s>(T?T.sV:0);if(on){var q=P(2.2,1.6,CZ[1]+1.6);g.fillStyle='rgba(120,120,130,.35)';for(var i=0;i<3;i++){g.beginPath();g.arc(q[0]+Math.sin(t*4+i)*4,q[1]-((t*30+i*12)%30),3+i,0,7);g.fill();}}});
    /* E12 비상정지 기둥 */
    add(5.5,-3.9,0.8,function(){box(g,5.5,-3.9,0,0.45,0.45,1.3,YEL,hlOf(11));cyl(g,5.5,-3.9,1.3,0.32,0.18,['#e0443a','#c0352c','#a32b23'],12);});
    /* E11 관제실: 방폭 유리 벽 + 콘솔 + 모니터 */
    add(7.0,0,1,function(){box(g,7.0,0,0,1.1,6.4,1.0,['#dfe5ec','#c7d0da','#b3bfcb'],hlOf(10));
      for(var m=0;m<3;m++){var my=-2+m*2;box(g,6.8,my,1.0,0.12,1.5,0.9,['#22303d','#1b2631','#141d26'],false);var q=P(6.72,my,1.48),tv=tempNow();g.fillStyle=m===0?(tv>500?'#ff6a3d':tv>100?'#ffc04a':'#7cf0a8'):'#7cf0a8';g.font='700 '+Math.max(8,sc*0.36)+'px '+cssv('--font');g.textAlign='center';
        g.fillText(m===0?Math.round(tv)+'°C':m===1?Lab.phase().slice(0,6):(DATA.length+'회'),q[0],q[1]);}});
    /* 캐릭터: 아무도 시험 방에 들어가지 않는다 — 관제실과 문 앞 */
    var WHO=[['doc',8.3,1.5,1.0],['asst',8.1,-0.6,0.9],['moa',7.9,3.0,0.86],['fly',8.4,-2.3,0.42],['robo',6.1,-3.9,0.74],['sia',8.7,4.3,0.88]];
    WHO.forEach(function(c){var fp=P(c[1],c[2],0);items.push({d:fp[2]-0.01,f:function(){var h2=sc*4.6*c[3],jx=since<1?(Math.random()-0.5)*6*(1-since):0;
      if(typeof FVdraw==='function'&&FVdraw(g,c[0],t,fp[0]+jx,fp[1],h2))return;if(typeof drawMotion==='function')drawMotion(g,{doc:'D1',asst:'A1',sia:'S1',moa:'M1',fly:'F1',robo:'R1'}[c[0]],'idle',t,fp[0]+jx,fp[1],h2,{fps:4});}});});
    /* 방폭 유리 칸막이 (x = 5) — 관제실과 시험실 사이 */
    add(5,0,2.4,function(){poly(g,[P(5,Y0,0),P(5,Y1,0),P(5,Y1,3.4),P(5,Y0,3.4)],'rgba(170,205,230,.22)','rgba(60,90,120,.55)',1.6);
      for(var k=0;k<=6;k++){var yy=Y0+(Y1-Y0)*k/6,a3=P(5,yy,0),b3=P(5,yy,3.4);g.strokeStyle='rgba(60,70,80,.55)';g.lineWidth=2;g.beginPath();g.moveTo(a3[0],a3[1]);g.lineTo(b3[0],b3[1]);g.stroke();}
      var sg=P(5,-1.5,3.0);U.label(g,sg[0],sg[1],'관제실 · 방폭 유리','#2b3a4a','center');});
    /* E5 방폭 챔버 + 안의 모든 것 */
    add(0,0,1.6,function(){drawChamber(g,s,y,T,since);});
    items.sort(function(a2,b2){return b2.d-a2.d;}).forEach(function(it){it.f();});
    /* 번호 표지 */
    var busy=RUN&&RUN.s<(RUN.tr.y===2?RUN.T.sX+12:RUN.tr.y===1?RUN.T.sV+8:3);
    EQ.forEach(function(e,k){if(busy&&[2,3,4,7,9].indexOf(k)>=0)return;var q=P(e[3],e[4],e[5]+0.35);g.beginPath();g.arc(q[0],q[1],10,0,7);g.fillStyle=sel===k?C.gfp:'#fff';g.fill();g.lineWidth=1.5;g.strokeStyle=sel===k?C.gfp:C.rule;g.stroke();
      g.fillStyle=sel===k?'#fff':C.text;g.font='700 9.5px '+cssv('--font');g.textAlign='center';g.textBaseline='middle';g.fillText(String(k+1),q[0],q[1]+0.5);g.textBaseline='alphabetic';
      if(sel===k){U.label(g,q[0],q[1]-20,e[1],C.gfp,'center');}});
    /* 섬광 · 열기 */
    if(since<1.4){var fa=0.9*Math.exp(-since*5);g.fillStyle='rgba(255,236,190,'+fa+')';g.fillRect(0,0,w,h);}
    if(RUN&&y===2&&RUN.boom&&since<8){g.fillStyle='rgba(255,90,30,'+(0.05+0.04*Math.sin(t*20))*(since<5?1:(8-since)/3)+')';g.fillRect(0,0,w,h);}
    /* 경광등 효과 */
    if(RUN&&y>=1&&s>T.sV&&s<(y===2?T.sX+11:T.sV+8)){var ang=t*6,bq=P(-2.4,-1.9,CZ[1]+0.6);g.save();var bgr=g.createRadialGradient(bq[0],bq[1],0,bq[0],bq[1],sc*5);bgr.addColorStop(0,'rgba(255,59,48,.35)');bgr.addColorStop(1,'rgba(255,59,48,0)');g.fillStyle=bgr;g.beginPath();g.moveTo(bq[0],bq[1]);g.arc(bq[0],bq[1],sc*5,ang,ang+0.5);g.closePath();g.fill();g.beginPath();g.moveTo(bq[0],bq[1]);g.arc(bq[0],bq[1],sc*5,ang+Math.PI,ang+Math.PI+0.5);g.closePath();g.fill();g.restore();}
    /* 상태판 */
    var bw=Math.min(w-16,350);g.fillStyle='rgba(255,255,255,.92)';g.fillRect(8,8,bw,46);g.strokeStyle=C.rule;g.lineWidth=1;g.strokeRect(8,8,bw,46);
    var res=RUN?(RUN.demo?'시연: ':'방금 결과: ')+YN[y]+(y===2?' (열폭주·폭발)':''):'조건을 고르고 "압착 1회"를 누르세요';
    g.fillStyle=RUN?YC[y]:C.text;g.font='700 12.5px '+cssv('--font');g.textAlign='left';g.fillText(res,16,26);
    g.font='12px '+cssv('--font');g.fillStyle=C.muted;g.fillText((RUN?'단계: '+Lab.phase()+' · ':'')+'조건 '+cond.soc+'% · '+cond.F.toLocaleString('ko-KR')+' kg · 기록 '+DATA.length+'회'+(slow<1?' · 느린 화면':''),16,45);
    U.stamp(g,w,'개략 모형 · 교육용');
    var e=EQ[sel];$('#pc-no').textContent=e[0]+' / 12';$('#pc-name').textContent=e[1];$('#pc-desc').textContent=e[2];}

  function drawChamber(g,s,y,T,since){var F=fwd(),x0=CX[0]-0.25,x1=CX[1]+0.25,y0=CY[0]-0.25,y1=CY[1]+0.25,z0=0,z1=CZ[1]+0.15,hl=sel===4?C.gfp:null;
    /* 받침(콘크리트 패드) */
    box(g,0,0,0,x1-x0+0.3,y1-y0+0.3,CZ[0],['#cfd5dc','#b9c1ca','#a7b0ba'],false);
    var fs=faces(0,0,CZ[0],x1-x0,y1-y0,z1-CZ[0]);
    /* 뒤쪽 면(안에서 보이는 면) 먼저 */
    fs.forEach(function(f){var n=f[0];if(n[0]*F[0]+n[1]*F[1]+n[2]*F[2]<0||n[2]===1)return;poly(g,f[1].map(function(p){return P(p[0],p[1],p[2]);}),n[2]===-1?'#dfe4ea':'rgba(205,220,232,.55)','rgba(60,70,80,.45)',1.2);});
    /* 안: 앤빌 · 기둥 · 크로스헤드 · 램 */
    var press=s<1.2?s/1.2:1,crush=s<1.2?0:clamp((s-1.2)/0.8,0,1),bh0=0.85,bh=bh0*(1-0.42*crush),swell=(y===2&&s>2.1&&!(RUN&&RUN.boom))?clamp((s-2.1)/1.2,0,1)*0.18:0;
    var cylS=RUN?RUN.tr.shape!==-1:cond.shape===1,bz=CZ[0]+0.55;
    var parts=[];
    function pz(x,yy,z,f){parts.push({d:P(x,yy,z)[2],f:f});}
    pz(0,0,0.6,function(){box(g,0,0,CZ[0],1.8,1.5,0.55,DARK,sel===2?C.gfp:null);});
    [-1.25,1.25].forEach(function(xx){pz(xx,0,2,function(){cyl(g,xx,0,CZ[0],0.16,CZ[1]-0.2-CZ[0],STEEL,10);});});
    var ramZ=bz+bh+(1-press)*1.6+0.02;
    pz(0,0,CZ[1]-0.3,function(){box(g,0,0,CZ[1]-0.45,3.0,0.7,0.4,STEEL,sel===3?C.gfp:null);cyl(g,0,0,ramZ+0.3,0.22,CZ[1]-0.45-(ramZ+0.3),['#d9dee4','#bfc6ce','#a9b1ba'],12);box(g,0,0,ramZ,1.3,1.0,0.3,['#9aa3ad','#7f8893','#6b737d'],false);});
    /* 셀 */
    var charred=RUN&&RUN.boom,glow=RUN&&y===2&&s>T.sV&&!RUN.boom?clamp((s-T.sV)/1.3,0,1):0,col=charred?['#3b2a24','#2a1d18','#1e1512']:glow?['rgb('+Math.round(47+200*glow)+','+Math.round(111-40*glow)+','+Math.round(176-150*glow)+')','#7a3b20','#5a2a16']:['#2f6fb0','#255a91','#1d4a78'];
    pz(0,0,bz+0.2,function(){if(!RUN||!charred||since<0.4){var sw=1+swell;if(cylS)cyl(g,0,0,bz,0.45*sw,bh*(1+swell*0.5),col,16);else box(g,0,0,bz,1.2*sw,0.62*sw,bh*(1+swell*0.5),col,false);}
      else{box(g,0,0,bz,cylS?0.6:0.95,cylS?0.5:0.45,bh*0.5,col,false);}
      if(glow>0.2){var q=P(0,0,bz+bh);var gr=g.createRadialGradient(q[0],q[1],0,q[0],q[1],sc*1.2);gr.addColorStop(0,'rgba(255,170,60,'+0.5*glow+')');gr.addColorStop(1,'rgba(255,120,40,0)');g.fillStyle=gr;g.beginPath();g.arc(q[0],q[1],sc*1.2,0,7);g.fill();}});
    /* 천장 장치: 연기 감지기(E8), 소화 노즐(E10) */
    pz(-1.4,-1.2,CZ[1],function(){cyl(g,-1.4,-1.2,CZ[1]-0.15,0.22,0.15,['#f4f6f8','#dfe4ea','#c9d0d8'],10);var on=RUN&&y>=1&&s>T.sV;var q=P(-1.4,-1.2,CZ[1]-0.2);g.fillStyle=on&&Math.floor(t*4)%2?'#ff3b30':'#9aa3ad';g.beginPath();g.arc(q[0],q[1],3,0,7);g.fill();if(sel===7){g.strokeStyle=C.gfp;g.lineWidth=2;g.beginPath();g.arc(q[0],q[1],sc*0.4,0,7);g.stroke();}});
    [-1.6,1.6].forEach(function(nx){pz(nx,1.4,CZ[1],function(){box(g,nx,1.4,CZ[1]-0.25,0.25,0.25,0.25,['#3567a8','#2a548a','#21436e'],sel===9?C.gfp:null);});});
    /* 입자: 연기·불꽃·파편·물안개 */
    var GLOW=[];PART.forEach(function(p){if(p.k==='flame'||p.k==='fire'||p.k==='spark'){GLOW.push(p);return;}parts.push({d:P(p.x,p.y,p.z)[2],f:function(){var q=P(p.x,p.y,p.z),u=p.a/p.L;
      if(p.k==='smoke'||p.k==='bsmoke'){var r=sc*(p.r+u*0.9);g.fillStyle='rgba('+p.c+','+(p.k==='bsmoke'?0.42:0.4)*(1-u)+')';g.beginPath();g.arc(q[0],q[1],r,0,7);g.fill();}
      else if(p.k==='flame'||p.k==='fire'){var r2=sc*p.r*(p.k==='fire'?1.4:1)*(1-u*0.6),gr=g.createRadialGradient(q[0],q[1],0,q[0],q[1],r2);gr.addColorStop(0,'rgba(255,250,210,'+(1-u)+')');gr.addColorStop(0.35,'rgba(255,190,60,'+0.9*(1-u)+')');gr.addColorStop(1,'rgba(230,70,20,0)');g.fillStyle=gr;g.beginPath();g.arc(q[0],q[1],r2,0,7);g.fill();}
      else if(p.k==='spark'){var tl2=P(p.x-p.vx*0.03,p.y-p.vy*0.03,p.z-p.vz*0.03);g.strokeStyle='rgba(255,'+Math.round(220-120*u)+',80,'+(1-u)+')';g.lineWidth=2;g.beginPath();g.moveTo(tl2[0],tl2[1]);g.lineTo(q[0],q[1]);g.stroke();}
      else if(p.k==='debris'){var sz=sc*p.sz;g.save();g.translate(q[0],q[1]);g.rotate(p.rot);g.fillStyle=p.vz===0?'#2a2422':'#3b3330';g.fillRect(-sz,-sz*0.6,sz*2,sz*1.2);g.fillStyle='rgba(255,140,60,'+Math.max(0,0.8-p.a*0.4)+')';g.fillRect(-sz*0.5,-sz*0.3,sz,sz*0.6);g.restore();}
      else if(p.k==='spray'){g.fillStyle='rgba(200,225,250,'+0.7*(1-u)+')';g.beginPath();g.arc(q[0],q[1],sc*0.06+1,0,7);g.fill();}}});});
    parts.sort(function(a2,b2){return b2.d-a2.d;}).forEach(function(it){it.f();});
    /* 빛나는 것(화염·불꽃·불티)은 연기 위에 더해 그린다 */
    g.save();g.globalCompositeOperation='lighter';GLOW.forEach(function(p){var q=P(p.x,p.y,p.z),u=p.a/p.L;
      if(p.k==='spark'){var tl2=P(p.x-p.vx*0.035,p.y-p.vy*0.035,p.z-p.vz*0.035);g.strokeStyle='rgba(255,'+Math.round(220-120*u)+',80,'+(1-u)+')';g.lineWidth=2;g.beginPath();g.moveTo(tl2[0],tl2[1]);g.lineTo(q[0],q[1]);g.stroke();return;}
      var r2=sc*p.r*(p.k==='fire'?1.6:1.25)*(1-u*0.5),gr=g.createRadialGradient(q[0],q[1],0,q[0],q[1],r2);gr.addColorStop(0,'rgba(255,245,200,'+0.95*(1-u)+')');gr.addColorStop(0.35,'rgba(255,170,50,'+0.8*(1-u)+')');gr.addColorStop(1,'rgba(220,60,10,0)');g.fillStyle=gr;g.beginPath();g.arc(q[0],q[1],r2,0,7);g.fill();});
    if(RUN&&RUN.boom&&since<1.3){var q0=P(0,0,bz+0.6),R0=sc*(0.5+3.2*Math.min(1,since/0.4))*(since<0.4?1:1-0.2*(since-0.4)),al=since<0.4?1:Math.max(0,1-(since-0.4)/0.9);
      var g0=g.createRadialGradient(q0[0],q0[1],0,q0[0],q0[1],R0);g0.addColorStop(0,'rgba(255,255,235,'+al+')');g0.addColorStop(0.3,'rgba(255,215,100,'+al+')');g0.addColorStop(0.7,'rgba(245,110,30,'+0.85*al+')');g0.addColorStop(1,'rgba(120,30,10,0)');g.fillStyle=g0;g.beginPath();g.arc(q0[0],q0[1],R0,0,7);g.fill();}
    if(RUN&&RUN.boom&&since<8.5){var q1=P(0,0,bz+0.3),fl=sc*(1.3+0.25*Math.sin(t*23))*(since<5?1:(8.5-since)/3.5),g1=g.createRadialGradient(q1[0],q1[1],0,q1[0],q1[1],fl);g1.addColorStop(0,'rgba(255,200,90,.55)');g1.addColorStop(1,'rgba(255,90,20,0)');g.fillStyle=g1;g.beginPath();g.arc(q1[0],q1[1],fl,0,7);g.fill();}
    g.restore();
    /* 충격파 고리 (챔버 바닥) */
    if(RUN&&RUN.boom&&since<0.9){var rad=Math.min(3.2,0.3+since*9),al2=1-since/0.9;g.strokeStyle='rgba(255,200,120,'+al2+')';g.lineWidth=3;g.beginPath();for(var k=0;k<=40;k++){var a=k/40*Math.PI*2,qx=clamp(Math.cos(a)*rad,CX[0],CX[1]),qy=clamp(Math.sin(a)*rad,CY[0],CY[1]),q=P(qx,qy,CZ[0]+0.02);k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);}g.stroke();}
    /* 앞쪽 유리 면 + 금 */
    fs.forEach(function(f){var n=f[0];if(n[0]*F[0]+n[1]*F[1]+n[2]*F[2]>=0||n[2]!==0)return;var pts=f[1].map(function(p){return P(p[0],p[1],p[2]);});poly(g,pts,'rgba(190,215,235,.16)','rgba(60,70,80,.6)',hl?2.4:1.4);
      if(hl){poly(g,pts,null,hl,2.4);}
      if(CRACK.length){var A=f[1][0],B=f[1][1],D=f[1][3];g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=1;CRACK.forEach(function(c){function L(u,v){return P(A[0]+(B[0]-A[0])*u+(D[0]-A[0])*v,A[1]+(B[1]-A[1])*u+(D[1]-A[1])*v,A[2]+(B[2]-A[2])*u+(D[2]-A[2])*v);}var p1=L(c[0],c[1]),p2=L(c[2],c[3]);g.beginPath();g.moveTo(p1[0],p1[1]);g.lineTo(p2[0],p2[1]);g.stroke();});}});
    /* 강철 틀(모서리 기둥·띠) */
    [[x0,y0],[x1,y0],[x1,y1],[x0,y1]].forEach(function(c){var a=P(c[0],c[1],CZ[0]),b=P(c[0],c[1],z1);g.strokeStyle='#4b525a';g.lineWidth=Math.max(2.5,sc*0.18);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();});
    [CZ[0],z1].forEach(function(zz){g.strokeStyle='#4b525a';g.lineWidth=Math.max(2,sc*0.14);g.beginPath();[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]].forEach(function(c,k){var q=P(c[0],c[1],zz);k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);});g.stroke();});
    /* 지붕(반투명) + 경광등 */
    if(F[2]<0){poly(g,fs[0][1].map(function(p){return P(p[0],p[1],p[2]);}),'rgba(160,172,186,.35)','rgba(60,70,80,.5)');}
    var on=RUN&&y>=1&&s>T.sV&&s<(y===2?T.sX+11:T.sV+8);cyl(g,-2.4,-1.9,z1,0.2,0.35,on?(Math.floor(t*6)%2?['#ff6a5c','#ff3b30','#c9302c']:['#c9302c','#a32b23','#80201a']):['#e8b9b4','#dc9f99','#c98b85'],10);}

  /* ── 조작 ── */
  $('#pchips').innerHTML=EQ.map(function(e){return '<button type="button">'+e[0]+' '+e[1]+'</button>';}).join('');
  function pick(i){sel=i;$$('#pchips button').forEach(function(x,j){x.classList.toggle('on',j===sel);});}
  $$('#pchips button').forEach(function(b,i){b.onclick=function(){pick(i);};});pick(4);
  var sb=$('#g-slow');if(sb)U.btns(sb,[[1,'보통'],[0.35,'느린 화면']],1,function(v){slow=v;});
  var drag=null;cv.style.touchAction='pan-y';cv.style.cursor='grab';
  cv.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,yaw:yaw,pitch:pitch,mv:false};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.mv=true;if(drag.mv){yaw=drag.yaw+dx*0.008;pitch=clamp(drag.pitch+dy*0.006,0.2,1.45);}});
  cv.addEventListener('pointerup',function(e){if(drag&&!drag.mv){var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,best=-1,bd=1600;EQ.forEach(function(q,k){[q[5]+0.35,q[5]*0.5].forEach(function(z){var p=P(q[3],q[4],z),d=(p[0]-mx)*(p[0]-mx)+(p[1]-my)*(p[1]-my);if(d<bd){bd=d;best=k;}});});if(best>=0)pick(best);}drag=null;});
  cv.addEventListener('pointercancel',function(){drag=null;});
  cv.addEventListener('wheel',function(e){if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();zoom=clamp(zoom*(e.deltaY<0?1.1:0.9),0.7,2.2);},{passive:false});
  cv.tabIndex=0;cv.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')yaw-=0.12;else if(e.key==='ArrowRight')yaw+=0.12;else if(e.key==='ArrowUp')pitch=clamp(pitch+0.1,0.2,1.45);else if(e.key==='ArrowDown')pitch=clamp(pitch-0.1,0.2,1.45);else if(e.key==='+')zoom=clamp(zoom*1.1,0.7,2.2);else if(e.key==='-')zoom=clamp(zoom*0.9,0.7,2.2);else return;e.preventDefault();});
  var vw=$('#g-view');if(vw)U.btns(vw,[['a','비스듬히'],['c','챔버 가까이'],['t','위에서'],['r','관제실에서']],'a',function(v){if(v==='a'){yaw=narrow?-0.32:-0.62;pitch=narrow?0.95:0.74;zoom=narrow?1.7:1.15;}else if(v==='c'){yaw=-0.35;pitch=0.55;zoom=1.9;}else if(v==='t'){yaw=0;pitch=1.4;zoom=1;}else{yaw=Math.PI/2-0.15;pitch=0.45;zoom=1.25;}});
  U.reg(cv,function(dt){draw(U.reduce?(RUN?dt:0):dt);});
})();

/* ══ 점 4개의 함정 ══ */
var lamSep=0;U.btns($('#g-lam'),[[0,'없음'],[0.01,'약하게 0.01'],[0.1,'0.1'],[1,'강하게 1']],0,function(v){lamSep=v;drawSep();});
function drawSep(){var r=BS.fit(BS.NEWS,lamSep,4000),H=r.hist,bm=Math.max(3,Math.max.apply(null,H.map(function(x){return x.b;}))*1.15);
  U.plot($('#cvSep1'),{xr:[0,4000],yr:[0,bm],xt:[0,1000,2000,3000,4000],yt:[0,Math.round(bm/2),Math.round(bm)],xl:'학습 반복 횟수',yl:'충전율 기울기 b',series:[{pts:H.map(function(x){return [x.it,x.b];}),color:lamSep?C.gfp:C.eye,width:2.4}],hlines:[{y:BS.TRUE.b,color:'rgba(22,33,43,.4)',label:'가정 모형 b = '+fmt(BS.TRUE.b,2)}],stamp:'실제 계산'});
  var o=U.plot($('#cvSep2'),{xr:[0,100],yr:[0,1],xt:[0,30,50,70,100],yt:[0,0.5,1],yf:function(v){return Math.round(v*100)+'%';},xl:'충전율 (%)',yl:'화염 확률',series:[{pts:sweep(r,1300,'pf'),color:lamSep?C.gfp:C.eye,width:2.6},{pts:sweep(BS.TRUE,1300,'pf'),color:'rgba(22,33,43,.35)',width:1.6,dash:[5,4]}],stamp:'실제 계산'});
  BS.NEWS.forEach(function(n){var g=o.g;g.fillStyle=YC[n.y];g.beginPath();g.arc(o.X(n.soc),o.Y(n.y===2?1:0),6,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();});
  var g=o.g;g.font='11.5px '+cssv('--font');g.textAlign='left';g.fillStyle=C.muted;g.fillText('● 뉴스 점 (화염=위, 아니면 아래) · 점선 = 가정 모형',o.X(2),o.Y(0.93));
  var p80=BS.probs(r,{soc:80,F:1300,shape:0,T:25}).fire,p90=BS.probs(r,{soc:90,F:1300,shape:0,T:25}).fire;
  U.ins($('#i-sep'),lamSep?[['g','규제 '+lamSep+': 기울기가 '+fmt(r.b,2)+'에서 멈춥니다. 80% 화염 확률 '+pct(p80)+', 90% '+pct(p90)+'. 규제 크기를 바꾸면 이 숫자도 바뀝니다 — 점 4개로는 규제가 답을 정하는 셈이에요.']]:
    [['r','규제 없이 4,000번 학습하면 기울기가 '+fmt(r.b,1)+'까지 커졌고, 더 돌리면 더 커집니다. 곡선이 70%와 100% 사이에서 계단처럼 꺾여 80% 화염 확률 '+pct(p80)+', 90% '+pct(p90)+'처럼 극단으로 갑니다.'],['m','점 4개가 완벽히 갈리면 "가장 그럴듯한 기울기"가 무한대라 정해지지 않습니다. 이것이 완전 분리입니다.']]);}
function sweep(p,F,k){var o=[];for(var s=0;s<=100;s+=2){o.push([s,BS.probs(p,{soc:s,F:F,shape:0,T:25})[k]]);}return o;}
U.reg($('#cvSep1'),function(dt){if(!dt)drawSep();});

/* ══ 로지스틱 모델 ══ */
var cF=1300,showTrue=1;U.btns($('#g-cF'),[[650,'650 kg'],[1300,'1,300 kg'],[2000,'2,000 kg']],1300,function(v){cF=v;upLogit();});U.btns($('#g-truth'),[[1,'보이기'],[0,'가리기']],1,function(v){showTrue=v;upLogit();});
var TEST=BS.design(300,99,{F:1300});
function upLogit(){var cv=$('#cvLogit');$('#lg-title').textContent='실험 기록 '+DATA.length+'회로 맞춘 모델 · 압력 '+cF.toLocaleString('ko-KR')+' kg · 형태 평균 · 25 °C';
  var ser=[];if(FIT){ser.push({pts:sweep(FIT,cF,'ps'),color:C.amber,width:2.6},{pts:sweep(FIT,cF,'pf'),color:C.eye,width:2.6});}
  if(showTrue)ser.push({pts:sweep(BS.TRUE,cF,'ps'),color:'rgba(163,92,0,.45)',width:1.4,dash:[5,4]},{pts:sweep(BS.TRUE,cF,'pf'),color:'rgba(201,48,44,.45)',width:1.4,dash:[5,4]});
  var o=U.plot(cv,{xr:[0,100],yr:[0,1],xt:[0,20,30,40,50,60,70,80,90,100],yt:[0,0.25,0.5,0.75,1],yf:function(v){return Math.round(v*100)+'%';},xl:'충전율 (%)',yl:'확률',series:ser,stamp:'실제 계산 · 데이터는 가정 모형에서 뽑음'});
  var g=o.g,grp={};DATA.filter(function(x){return x.F===cF;}).forEach(function(x){var k=x.soc;grp[k]=grp[k]||{n:0,s:0,f:0};grp[k].n++;if(x.y>=1)grp[k].s++;if(x.y===2)grp[k].f++;});
  Object.keys(grp).forEach(function(k){var q=grp[k],r=3+Math.min(7,Math.sqrt(q.n)*1.5);g.fillStyle='rgba(163,92,0,.75)';g.beginPath();g.arc(o.X(+k),o.Y(q.s/q.n),r,0,7);g.fill();g.fillStyle='rgba(201,48,44,.85)';g.beginPath();g.rect(o.X(+k)-r,o.Y(q.f/q.n)-r,2*r,2*r);g.fill();});
  g.font='11.5px '+cssv('--font');g.textAlign='left';g.fillStyle=C.amber;g.fillText('— 연기 이상 확률 (● 실험 비율)',o.X(2),o.Y(0.95));g.fillStyle=C.eye;g.fillText('— 화염 확률 (■ 실험 비율) · 점선 = 가정 모형',o.X(2),o.Y(0.87));
  var M=FIT||BS.TRUE,p=function(s){return BS.probs(M,{soc:s,F:1300,shape:0,T:25});};
  $('#lg-minis').innerHTML=FIT?mini('','실험 기록',DATA.length+'회')+mini('a','충전율 기울기 b (가정 '+fmt(BS.TRUE.b,2)+')',fmt(FIT.b,2))+mini('a','10%p 오를 때 오즈 배수',fmt(Math.exp(FIT.b),1)+'배')+mini('','압력 계수 c (가정 '+fmt(BS.TRUE.c,1)+')',fmt(FIT.c,2))+mini('r','80% 화염 확률',pct(p(80).fire))+mini('r','100% 화염 확률',pct(p(100).fire))+mini('g','새 실험 300회 로그 손실 (가정 모형 '+fmt(BS.logloss(BS.TRUE,TEST),3)+')',fmt(BS.logloss(FIT,TEST),3)):mini('r','실험 기록','8회 미만 — 모델을 맞추지 않음');
  var near=DATA.filter(function(x){return x.soc>=70&&x.soc<=90;}).length;
  U.ins($('#i-logit'),FIT?[['a','충전율이 10%p 오를 때마다 화염 오즈가 약 '+fmt(Math.exp(FIT.b),1)+'배가 됩니다. 1,300 kg에서 화염 확률: 70% '+pct(p(70).fire)+' → 80% '+pct(p(80).fire)+' → 90% '+pct(p(90).fire)+' → 100% '+pct(p(100).fire)+'.'],
    [near<30?'r':'g','결과가 갈리는 70~90% 구간의 실험은 '+near+'회입니다. '+(near<30?'이 구간 실험을 늘리면 곡선이 더 정확해집니다 — 위 랩에서 충전율 80%로 "20회 더"를 눌러 보세요.':'경계 구간 실험이 충분해 곡선이 가정 모형에 가까워졌습니다.')]]:[['m','위 랩에서 실험을 해 주세요. "여러 조건 섞어 60회"를 누르면 바로 모델이 맞춰집니다.']]);}
U.reg($('#cvLogit'),function(dt){if(!dt)upLogit();});

/* ══ 충전율 기준 ══ */
var hit=0.01,pF=650;U.btns($('#g-hit'),[[0.001,'0.1%'],[0.01,'1%'],[0.05,'5%']],0.01,function(v){hit=v;upPolicy();});U.btns($('#g-pF'),[[650,'650 kg급'],[1300,'1,300 kg급 (뉴스)']],650,function(v){pF=v;upPolicy();});
function upPolicy(){var M=FIT&&DATA.length>=40?FIT:BS.TRUE,N=100000,rows=[[30,'항공 화물 국제 기준 이하'],[50,'중간'],[80,'판매 관행 (80% 이상)'],[100,'완충']];
  $('#tb-policy').innerHTML='<thead><tr><th>보관·유통 충전율</th><th>의미 (뉴스 사례)</th><th>연기 이상 확률</th><th>화염 확률</th><th>하루 10만 개 중 예상 화염 (건)</th></tr></thead><tbody>'+rows.map(function(r){var q=BS.probs(M,{soc:r[0],F:pF,shape:0,T:25}),e=N*hit*q.pf;
    return '<tr class="'+(r[0]>=80?'bad':'')+'"><td><b>'+r[0]+'%</b></td><td>'+r[1]+'</td><td>'+pct(q.ps)+'</td><td>'+pct(q.pf)+'</td><td>'+(e<0.01?'0.01 미만':fmt(e,e<1?2:0))+'</td></tr>';}).join('')+'</tbody>';
  var a=BS.probs(M,{soc:80,F:pF,shape:0,T:25}).pf,b=BS.probs(M,{soc:30,F:pF,shape:0,T:25}).pf;
  U.ins($('#i-policy'),[['a','모델: '+(M===BS.TRUE?'가정 모형(실험 기록 40회 미만)':'실험 기록 '+DATA.length+'회로 맞춘 모델')+'. '+pF.toLocaleString('ko-KR')+' kg급 충격에서 80% 충전의 화염 확률은 '+pct(a)+', 30%는 '+pct(b)+'입니다.'],['m','같은 충격이라도 충전율을 낮추면 예상 화염 건수가 몇 자리씩 줄어듭니다. 다만 소비자는 바로 쓸 수 있는 충전 상태를 원합니다 — 기준은 안전과 편의의 균형입니다.']]);}
upPolicy();

/* ══ 대결 ══ */
(function(){var fi=$('#d-fly'),ri=$('#d-robo');
  U.Duel({el:'#duel',run:function(){var robo=BS.fit(BS.NEWS,0,5000),res=[];for(var s=0;s<10;s++){var lab=BS.design(60,200+s,{}),fl=BS.fit(lab,0.02,1500),te=BS.design(300,900+s,{F:1300});res.push({r:BS.logloss(robo,te),f:BS.logloss(fl,te),t:BS.logloss(BS.TRUE,te),ra:BS.acc(robo,te),fa:BS.acc(fl,te)});}
      var m=function(k){return res.reduce(function(a,x){return a+x[k];},0)/res.length;};return {res:res,r:m('r'),f:m('f'),t:m('t'),ra:m('ra'),fa:m('fa'),robo:robo,wins:res.filter(function(x){return x.f<x.r;}).length};},
    show:function(o,pred){var res=o.f<o.r*0.98?'F':o.r<o.f*0.98?'R':'D',Mo={F:['fly_arms','robo_sigh','doc_judge','asst_report'],R:['fly_coffee','robo_happy','doc_judge','asst_report'],D:['fly_magnify','robo_meh','doc_think','asst_report']}[res];U.setMood(fi,Mo[0]);U.setMood(ri,Mo[1]);
      var mx=Math.max(o.r,o.f)*1.1;function bar(n,v,col,sub){return '<div class="resbar"><span style="color:'+col+'">'+n+'</span><div class="bar"><i style="background:'+col+';width:'+Math.max(2,v/mx*100)+'%"></i></div><b>'+fmt(v,3)+'</b></div><p class="mnote" style="margin:0 0 6px">'+sub+'</p>';}
      $('#d-bars').innerHTML='<p class="muted" style="font-size:13.5px;margin:0">막대 = 새 실험 300회의 평균 로그 손실 (10번 반복 평균). 짧을수록 확률을 정직하게 맞혔다는 뜻입니다. 가정 모형(정답 확률)으로도 '+fmt(o.t,3)+'는 피할 수 없습니다.</p>'+
        bar('초파리 · 실험 60회 + 약한 규제',o.f,'var(--c-fly)','정답 단계 맞힘 '+pct(o.fa,0))+bar('주판봇 · 뉴스 4점, 규제 없음',o.r,'var(--c-robo)','정답 단계 맞힘 '+pct(o.ra,0)+' · 기울기 '+fmt(o.robo.b,1)+'로 커져 확률이 0% 또는 100%에 붙음');
      $('#d-say').innerHTML=U.say('asst',Mo[3],'10번 다시 해서 초파리가 '+o.wins+'번 이겼어요. 주판봇 모델은 정답 단계를 '+pct(o.ra,0)+' 맞혔지만, 틀릴 때 "100% 확실하다"고 틀려서 손실이 커요.')+U.say('doc',Mo[2],'맞힌 비율만 보면 차이가 작아 보여도, 확률이 필요한 일(보관 기준, 보험, 소방 대책)에는 "얼마나 자신 있게 틀렸나"가 중요하다. 점 4개가 완벽히 갈린다고 완벽한 모델이 아니다.',true);
      $('#d-score').textContent='판정: '+{F:'F 초파리 승',R:'R 주판봇 승',D:'D 무승부'}[res];$('#d-pred').textContent=pred?' · 내 예상: '+(pred==='fly'?'초파리':'주판봇')+(((pred==='fly'&&res==='F')||(pred==='robo'&&res==='R'))?' — 맞았어요':' — 빗나갔어요'):'';},
    reset:function(){U.setMood(fi,'fly_point');U.setMood(ri,'robo_calc');}});})();

/* ══ 대사 · 등장인물 ══ */
U.dialogues({
 hero:[["doc","doc_board","부지를 하나 더 늘려 방폭 실험 랩을 세웁니다. 뉴스에 나온 압착 실험을 랩에서 다시, 여러 번 해 봅니다."],["asst","asst_report","뉴스 사례는 네 번: 100%는 화염, 70%는 연기, 50%와 30%는 변화 없음이었어요."],["robo","robo_calc","충전율로 딱 갈리네! 85% 넘으면 불, 아니면 안전. 모델 끝."],["fly","fly_magnify","네 번 해 보고 '딱 갈린다'고? 80%를 열 번 누르면 몇 번 불이 날지는 아무도 몰라."]],
 news:[["doc","doc_front","충전율만 바꾸고 나머지는 같게 했다는 점이 이 실험의 장점입니다. 원인을 하나로 좁힐 수 있죠."]],
 lab:[["sia","sia_explain","E3 지그에 원통형과 각형을 바꿔 끼울 수 있어요. 끼운 다음에는 모두 관제실로 나와요. 시험 중엔 아무도 방에 없어요."],["moa","moa_report","E6 열화상 숫자가 빨갛게 되면 화염 단계예요. 연기 단계는 200 °C를 잘 안 넘어요."],["robo","robo_calc","폭발이 나도 파편은 챔버 유리 안에서 튕기기만 해. 그래도 내 손은 비상정지 버튼 위에!"]],
 sep:[["robo","robo_sigh","어… 학습을 더 돌릴수록 기울기가 계속 커져. 멈추질 않네."],["fly","fly_point","갈림길이 70%와 100% 사이 어딘지 점 4개는 말해 주지 않으니까."]],
 logit:[["asst","asst_report","곡선이 두 개예요. 주황은 연기 이상, 빨강은 화염. 기울기는 같이 쓰고 출발점만 달라요."]],
 policy:[["doc","doc_think","항공은 30% 이하로 묶는데 택배·창고는 기준이 없다는 게 사례의 지적입니다. 곡선은 그 차이를 숫자로 보여 줍니다."]],
 dfly:[["fly","fly_point","경계 근처까지 섞어서 60번 눌러 볼게. 규제는 살짝만."]],
 drobo:[["robo","robo_calc","뉴스 네 점이면 충분해. 완벽히 갈리는 데이터잖아."]],
 outro:[["doc","doc_magic","오늘의 세 줄입니다.<br>① 충전율이 높을수록 같은 충격에도 연기 → 화염으로 갈 확률이 커진다.<br>② 점 몇 개가 완벽히 갈리면 로지스틱의 기울기는 정해지지 않는다. 규제·보정보다 경계 근처 실험이 근본 해법이다.<br>③ 확률 곡선으로 보관·유통 충전율 기준을 숫자로 따질 수 있다."],["robo","robo_meh","완벽히 갈린다고 좋아했는데, 그게 함정이었네."],["fly","fly_coffee","그래도 뉴스 실험 덕분에 어디를 더 눌러 봐야 할지 알았지. 70~90%."],["asst","asst_report","다음엔 ③ 공장에서 출하할 때 충전율을 몇 %로 둘지 이 곡선으로 정해 볼게요."]]
});
var CAST=[["doc","doc_board","박사","랩 책임자. 안전 기준을 승인해요."],["asst","asst_report","조수 하루","실험 기록과 숫자 발표."],["fly","fly_magnify","초파리 연구원","의심하는 쪽. 경계 근처를 더 눌러 보자고 해요."],["robo","robo_calc","주판봇","확신하는 쪽. 비상정지 버튼 담당."],["sia","sia_explain","인턴 시아","형태 지그 담당."],["moa","moa_report","인턴 모아","열화상 카메라 담당."]];
$('#castgrid').innerHTML=CAST.map(function(c){return '<div class="castc" style="--cc:var(--c-'+c[0]+')"><img src="'+U.spr(c[1])+'" alt="" aria-hidden="true"><div><b>'+c[2]+'</b><p>'+c[3]+'</p></div></div>';}).join('');
$('#secretrow').innerHTML=['x1','x2','x3'].map(function(x,i){return U.say(x,x+'_hint',['(반짝)','(…끄덕)','(짝짝짝)'][i]);}).join('');
$('#secretbtn').onclick=function(){var r=$('#secretrow');r.hidden=!r.hidden;this.setAttribute('aria-expanded',String(!r.hidden));this.textContent=r.hidden?'방청석 보기 (미공개 식구)':'방청석 닫기';};
U.fillImgs();
(function(){var cv=$('#cvCover');if(!cv)return;U.reg(cv,function(dt){if(dt)return;var R0=U.setup(cv),g=R0.g,w=R0.w,h=R0.h,gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#fdf1ec');gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(212,66,30,.85)';g.lineWidth=3;g.beginPath();for(var k=0;k<=60;k++){var s=k/60*100,p=BS.probs(BS.TRUE,{soc:s,F:1300,shape:0,T:25}).pf,x=w*0.08+w*0.4*k/60,y=h*0.34-h*0.24*p;k?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();
  [[30,0],[50,0],[70,1],[100,2]].forEach(function(n){var x=w*0.08+w*0.4*n[0]/100,y=h*0.34-h*0.24*(n[1]===2?1:0);g.fillStyle=YC[n[1]];g.beginPath();g.arc(x,y,6,0,7);g.fill();});});})();

U.Gloss({'로지스틱 회귀':['로지스틱 회귀','모델','입력의 가중합을 0~1 확률로 바꾸는 모델. 확률 p의 오즈 p/(1−p)의 로그가 입력에 대해 직선이다.'],
 '열폭주':['열폭주','배터리','충격·과열로 셀 안 반응이 스스로 열을 내며 온도가 급격히 오르는 현상.'],
 '오즈':['오즈','통계','확률 p를 p/(1−p)로 바꾼 값. 로지스틱 기울기 b는 입력 1단위당 오즈를 e^b배로 만든다.'],
 '완전 분리':['완전 분리','통계','입력 하나(또는 조합)로 결과가 완벽히 갈려, 로지스틱의 최대우도 기울기가 무한대가 되는 상황.'],
 '비례 오즈':['비례 오즈 모형','통계','순서가 있는 결과(없음<연기<화염)에서 단계마다 출발점만 다르고 기울기는 같게 둔 로지스틱.'],
 '로그 손실':['로그 손실','평가','정답에 준 확률의 −log 평균. 자신 있게 틀리면 크게 커진다.']},['열폭주','오즈','완전 분리','비례 오즈','로그 손실']);
U.Study({quiz:{
 sep:[{q:'뉴스의 점 4개로 규제 없이 로지스틱을 맞추면 기울기가 계속 커지는 까닭은?',o:['충전율로 결과가 완벽히 갈려, 기울기를 키울수록 손실이 계속 줄기 때문','데이터가 틀려서','학습률이 작아서','충전율이 퍼센트라서'],a:0,why:'완전 분리에서는 계단에 가까운 곡선일수록 4점을 더 잘 설명하므로 최대우도 기울기가 무한대입니다.',hint:'점들이 어떻게 갈리나.'},
   {q:'완전 분리를 푸는 가장 근본적인 방법은?',o:['결과가 갈리는 경계 근처에서 실험을 더 한다','학습을 더 오래 돌린다','점을 지운다','충전율을 빼고 맞춘다'],a:0,why:'같은 조건에서 결과가 갈리는 사례가 생겨야 기울기가 유한하게 정해집니다. 규제·Firth 보정은 보조 수단입니다.',hint:'70~90%.'}],
 logit:[{q:'기울기 b = 2.0이면 충전율이 10%p 오를 때 화염 오즈는?',o:['약 7.4배','2배','20배','변하지 않는다'],a:0,why:'오즈 배수 = e^b = e^2 ≈ 7.4.',hint:'e^b.'},
   {q:'연기 곡선과 화염 곡선이 같은 기울기를 쓰는 모형은?',o:['비례 오즈(순서형 로지스틱)','다항 로지스틱','선형 회귀','KNN'],a:0,why:'순서가 있는 결과에서 단계마다 출발점만 다르게 두는 것이 비례 오즈 모형입니다.',hint:'없음 < 연기 < 화염.'}],
 policy:[{q:'뉴스 사례에서 항공 화물의 국제 기준 충전율은?',o:['30% 이하','50% 이하','80% 이상','제한 없음'],a:0,why:'사례에 따르면 항공 화물은 국제 기준으로 30% 이하이고, 국내 보관·유통은 제한이 없습니다.',hint:'충전율 기준 표.'},
   {q:'같은 충격에서 충전율을 80%에서 30%로 낮추면 화염 확률은?',o:['몇 자리 수(10배 단위 여러 번)로 줄어든다','조금 준다','같다','늘어난다'],a:0,why:'로지스틱 곡선에서 50%p 차이는 오즈를 e^(5b)배 바꿉니다. b≈2면 수만 배입니다.',hint:'오즈 배수를 다섯 번.'}],
 duel:[{q:'주판봇 모델이 정답 단계를 꽤 맞혔는데도 로그 손실이 큰 까닭은?',o:['틀릴 때 확률을 0%나 100%에 붙여 "자신 있게" 틀리기 때문','맞힌 비율이 0이라서','데이터가 많아서','규제가 너무 강해서'],a:0,why:'로그 손실은 정답에 준 확률의 −log입니다. 0에 가까운 확률로 틀리면 손실이 매우 커집니다.',hint:'−log(아주 작은 수).'},
   {q:'이 대결이 보여 주는 것은?',o:['점이 완벽히 갈린다고 좋은 확률 모델이 아니다 — 반복 실험이 필요하다','뉴스는 틀렸다','규제는 늘 나쁘다','로지스틱은 쓸모없다'],a:0,why:'뉴스 사례는 방향을 알려 주고, 확률은 반복 실험으로 세웁니다.',hint:'박사의 판정.'}]
}});
bindCond();labInfo();drawTemp();upLogit();
U.start();
})();
