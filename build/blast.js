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
function press(n){var r=rnd();for(var i=0;i<n;i++){var tr=BS.trial({soc:cond.soc,F:cond.F,shape:cond.shape,T:cond.T},r);DATA.push(tr);LAST=tr;}tPress=Lab.t();refit();labInfo();drawTemp();upLogit();upPolicy();}
$('#b-press').onclick=function(){press(1);};$('#b-20').onclick=function(){press(20);};
$('#b-mix').onclick=function(){var d=BS.design(60,seedN++,{});DATA=DATA.concat(d);LAST=d[d.length-1];tPress=Lab.t();refit();labInfo();drawTemp();upLogit();upPolicy();};
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

/* ══ 3D 실험 랩 ══ */
var Lab={};
(function(){var cv=$('#cvLab'),narrow=(cv.clientWidth||window.innerWidth)<600,yaw=narrow?-0.15:-0.5,pitch=narrow?1.2:0.82,sel=5,t=0;Lab.t=function(){return t;};
  var PR=[['P1','시료 보관','충전율별 배터리를 방화 보관함에 둡니다. 보관 충전율이 낮을수록 안전합니다.','f'],['P2','충전 스테이션','시험할 충전율로 맞춥니다. 조수 하루가 기록을 맡아요.','e'],['P3','형태 지그','원통형·각형 배터리를 프레스에 맞게 고정합니다. 인턴 시아 담당.','e'],['P4','열화상 카메라','셀 표면 온도를 1초마다 찍습니다. 인턴 모아 담당.','v'],['P5','압착 프레스','650·1,300·2,000 kg으로 누릅니다. 뉴스 사례는 1,300 kg이었습니다.','e'],['P6','방폭 챔버','두꺼운 유리 챔버 안에서 누릅니다. 연기·화염이 나도 밖으로 새지 않게 배기합니다. 주판봇이 비상정지를 지켜요.','x'],
    ['P7','온도 기록계','열화상과 열전대 온도를 모읍니다.','v'],['P8','연기 감지기','연기 농도로 "연기" 단계를 판정합니다. 초파리 연구원이 적외선 온도계로 확인해요.','v'],['P9','소화 설비','화염 단계면 질식 소화와 냉각을 합니다.','x'],['P10','실험 기록','결과 단계(없음·연기·화염)와 조건을 기록해 로지스틱 모델로 보냅니다.','v'],['P11','판정실','박사가 확률 곡선과 안전 기준을 검토합니다.','v'],['P12','폐기','시험한 배터리는 안전하게 방전·폐기합니다.','f']];
  var WHO={1:['asst',0.9],2:['sia',0.88],3:['moa',0.86],5:['robo',0.72],7:['fly',0.41],10:['doc',1.0]},SHEET={doc:'D1',asst:'A1',sia:'S1',moa:'M1',fly:'F1',robo:'R1'};
  var XS=[-10,-6,-2,2,6,10],P12=PR.map(function(p,i){var row=i<6?0:1;return {id:p[0],name:p[1],desc:p[2],cat:p[3],x:row?XS[5-(i-6)]:XS[i],y:row?4.6:-4.6,h:[1.4,1.6,1.4,1.8,2.8,2.4,1.6,1.8,1.6,1.4,2.0,1.2][i]};});
  var CAT={f:['#fbecd3','#ecc98f','#dfb46e'],e:['#e3eef9','#bcd3ee','#a3c2e6'],v:['#efe0f6','#d6b7e6','#c39bd9'],x:['#f6dedb','#e8b9b4','#dc9f99']};
  var cx,cy,sc;function P(x,y,z){var c=Math.cos(yaw),s=Math.sin(yaw),rx=x*c-y*s,ry=x*s+y*c,cp=Math.cos(pitch),sp=Math.sin(pitch);return [cx+rx*sc,cy+(-z*cp-ry*sp)*sc,ry*cp-z*sp];}
  function fwd(){var c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return [s*cp,c*cp,-sp];}
  function poly(g,pts,fill,stroke){g.beginPath();pts.forEach(function(p,k){k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.stroke();}}
  function box(g,x,y,z0,w,d,h,cols,hl,alpha){var F=fwd(),x0=x-w/2,x1=x+w/2,y0=y-d/2,y1=y+d/2,z1=z0+h;
    var faces=[[[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],0],[[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],1],[[0,1,0],[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],1],[[-1,0,0],[[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],2],[[1,0,0],[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],2]];
    g.lineWidth=hl?2.4:1;if(alpha)g.globalAlpha=alpha;faces.forEach(function(f){var n=f[0];if(n[0]*F[0]+n[1]*F[1]+n[2]*F[2]>=0)return;poly(g,f[1].map(function(p){return P(p[0],p[1],p[2]);}),cols[f[2]],hl?hl:'rgba(22,33,43,.35)');});g.globalAlpha=1;}
  var PATH=[[-13.5,-2.4],[12.6,-2.4],[13.6,-1.2],[13.6,1.2],[12.6,2.4],[-13.5,2.4]];
  function rr(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
  function draw(dt){if(dt)t+=dt;var Rr=U.setup(cv),g=Rr.g,w=Rr.w,h=Rr.h;cx=w/2;cy=h*0.56;sc=Math.min(w/31,h/19);
    var since=t-tPress,y=LAST?LAST.y:-1,onA=LAST?Math.min(LAST.onset*0.35,4):0;   /* 그림에서는 시간을 빠르게 */
    g.fillStyle='#fbfcfd';g.fillRect(0,0,w,h);
    if(LAST&&y===2&&since>1.4+onA&&since<12){var fl=0.05+0.05*Math.sin(t*20);g.fillStyle='rgba(255,90,30,'+fl+')';g.fillRect(0,0,w,h);}
    g.strokeStyle='rgba(22,33,43,.07)';g.lineWidth=1;for(var x=-15;x<=15;x+=1.5){var a=P(x,-7.5,0),b=P(x,7.5,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}for(var yy=-7.5;yy<=7.5;yy+=1.5){a=P(-15,yy,0);b=P(15,yy,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
    for(var k=1;k<PATH.length;k++){var x0=PATH[k-1][0],y0=PATH[k-1][1],x1=PATH[k][0],y1=PATH[k][1],dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),nx=-dy/L*0.55,ny=dx/L*0.55;poly(g,[P(x0+nx,y0+ny,0.3),P(x1+nx,y1+ny,0.3),P(x1-nx,y1-ny,0.3),P(x0-nx,y0-ny,0.3)],'#d9dee5','rgba(22,33,43,.25)');}
    var items=[];
    P12.forEach(function(p,k){var cp=P(p.x,p.y,p.h/2);items.push({d:cp[2],f:function(){var hl=sel===k?C.gfp:null;
        if(k===5){/* 방폭 챔버: 바닥 + 유리 + 배터리 + 효과 */
          box(g,p.x,p.y,0,3.0,2.4,0.5,CAT.x,hl);var sq=LAST?clamp((since)/1.2,0,1):0,bh=LAST?0.6*(1-0.45*sq):0.6,bc=LAST?(y===2&&since>1.4+onA?['#3b2a24','#2a1d18','#1e1512']:['#2f6fb0','#255a91','#1d4a78']):['#2f6fb0','#255a91','#1d4a78'];
          if(cond.shape===1||!LAST)box(g,p.x,p.y,0.5,0.7,0.7,bh,bc,false);else box(g,p.x,p.y,0.5,1.1,0.5,bh,bc,false);
          var pz=LAST?(since<0.8?2.5-1.4*since/0.8:since<3?1.4-0.3*clamp((since-0.8)/0.4,0,1):1.1+Math.min(1.4,(since-3)*0.5)):2.5;box(g,p.x,p.y,0.5+pz*0.6+0.2,1.4,1.2,0.35,['#8d96a1','#6f7883','#5b636d'],false);
          if(LAST&&since>0.9+onA&&since<16&&y>=1){var N=y===2?26:12;for(var i=0;i<N;i++){var ph=((since-0.9-onA)*0.35+rr(i))%1,sx=p.x+(rr(i+3)-0.5)*1.2+Math.sin(t*2+i)*0.2,sz=0.9+ph*3.4,q=P(sx,p.y+(rr(i+7)-0.5)*0.8,sz);
            g.fillStyle=y===2?'rgba(30,26,28,'+(0.55*(1-ph))+')':'rgba(150,152,158,'+(0.45*(1-ph))+')';g.beginPath();g.arc(q[0],q[1],sc*(0.2+ph*0.55),0,7);g.fill();}}
          if(LAST&&y===2&&since>1.4+onA&&since<12){for(var j=0;j<14;j++){var fz=0.9+rr(j)*1.6*(0.6+0.4*Math.sin(t*14+j)),q2=P(p.x+(rr(j+5)-0.5)*0.9,p.y+(rr(j+9)-0.5)*0.6,fz);g.fillStyle=j%3?'rgba(255,140,30,.85)':'rgba(255,220,80,.9)';g.beginPath();g.moveTo(q2[0],q2[1]-sc*0.35);g.quadraticCurveTo(q2[0]+sc*0.22,q2[1],q2[0],q2[1]+sc*0.15);g.quadraticCurveTo(q2[0]-sc*0.22,q2[1],q2[0],q2[1]-sc*0.35);g.fill();}
            for(var s2=0;s2<8;s2++){var sp=P(p.x+(rr(s2+20)-0.5)*2.4*((t*3+s2)%1),p.y,1+((t*3+s2)%1)*1.5);g.fillStyle='#ffd400';g.fillRect(sp[0],sp[1],3,3);}}
          box(g,p.x,p.y,0.5,3.0,2.4,p.h,['rgba(200,225,240,.18)','rgba(170,205,230,.22)','rgba(150,190,220,.25)'],hl);
        }else if(k===4){box(g,p.x,p.y,0,2.4,2.0,0.6,CAT.e,hl);box(g,p.x-0.9,p.y,0.6,0.3,0.3,p.h-0.6,['#8d96a1','#6f7883','#5b636d'],false);box(g,p.x+0.9,p.y,0.6,0.3,0.3,p.h-0.6,['#8d96a1','#6f7883','#5b636d'],false);box(g,p.x,p.y,p.h,2.4,0.6,0.35,['#9aa3ad','#7f8893','#6b737d'],false);}
        else box(g,p.x,p.y,0,2.6,2.0,p.h,CAT[p.cat],hl);
        if(k===0){[30,50,70,100].forEach(function(s,j){var col=s>=100?'#d4421e':s>=70?'#e0a23a':'#2f8f5b';box(g,p.x-0.9+j*0.6,p.y,p.h,0.4,0.4,0.25+s/200,[col,col,col],false);});}
        if(k===6||k===3){var tp2=P(p.x,p.y,p.h+0.15),tv=LAST?BS.temp(LAST,Math.min(60,since*(60/12))):25;g.fillStyle=tv>500?'#d4421e':tv>100?'#e0a23a':'#2f8f5b';g.font='700 11px '+cssv('--font');g.textAlign='center';g.fillText(Math.round(tv)+' °C',tp2[0],tp2[1]-16);}
        var tp=P(p.x,p.y,p.h+0.5);g.beginPath();g.arc(tp[0],tp[1],11,0,7);g.fillStyle=sel===k?C.gfp:'#fff';g.fill();g.lineWidth=1.5;g.strokeStyle=sel===k?C.gfp:C.rule;g.stroke();
        g.fillStyle=sel===k?'#fff':C.text;g.font='700 10.5px '+cssv('--font');g.textAlign='center';g.textBaseline='middle';g.fillText(String(k+1),tp[0],tp[1]+0.5);g.textBaseline='alphabetic';
        if(sel===k||w>700){g.font=(sel===k?'700 ':'')+'11px '+cssv('--font');var lb=P(p.x,p.y,p.h+1.15);U.label(g,lb[0],lb[1],p.name,sel===k?C.gfp:C.muted,'center');}}});
      if(WHO[k]){var fp=P(p.x+1.75,p.y,0),wh=WHO[k];items.push({d:fp[2]-0.01,f:function(){var h2=sc*(w<600?6.0:5.0)*wh[1];if(typeof FVdraw==='function'&&FVdraw(g,wh[0],t,fp[0],fp[1],h2))return;if(typeof drawMotion==='function')drawMotion(g,SHEET[wh[0]],'idle',t,fp[0],fp[1],h2,{fps:4});}});}});
    items.sort(function(a,b){return b.d-a.d;}).forEach(function(it){it.f();});
    var bw=Math.min(w-16,330);g.fillStyle='rgba(255,255,255,.9)';g.fillRect(8,8,bw,44);g.strokeStyle=C.rule;g.strokeRect(8,8,bw,44);
    g.fillStyle=LAST?YC[y]:C.text;g.font='700 12.5px '+cssv('--font');g.textAlign='left';g.fillText(LAST?'방금 결과: '+YN[y]+(y===2?' (열폭주)':''):'압착 버튼을 눌러 보세요',16,26);
    g.font='12px '+cssv('--font');g.fillStyle=C.muted;g.fillText('조건 '+cond.soc+'% · '+cond.F.toLocaleString('ko-KR')+' kg · 기록 '+DATA.length+'회',16,44);
    U.stamp(g,w,'개략 모형 · 교육용');
    var p=P12[sel];$('#pc-no').textContent=p.id+' / 12';$('#pc-name').textContent=p.name;$('#pc-desc').textContent=p.desc;}
  $('#pchips').innerHTML=P12.map(function(p){return '<button type="button">'+p.id+' '+p.name+'</button>';}).join('');
  function pick(i){sel=i;$$('#pchips button').forEach(function(x,j){x.classList.toggle('on',j===sel);});}
  $$('#pchips button').forEach(function(b,i){b.onclick=function(){pick(i);};});pick(5);
  var drag=null;cv.style.touchAction='pan-y';cv.style.cursor='grab';
  cv.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,yaw:yaw,pitch:pitch,mv:false};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.mv=true;if(drag.mv){yaw=drag.yaw+dx*0.008;pitch=clamp(drag.pitch+dy*0.006,0.15,1.5);}});
  cv.addEventListener('pointerup',function(e){if(drag&&!drag.mv){var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,best=-1,bd=900;P12.forEach(function(p,k){[p.h+0.5,p.h*0.5].forEach(function(z){var q=P(p.x,p.y,z),d=(q[0]-mx)*(q[0]-mx)+(q[1]-my)*(q[1]-my);if(d<bd){bd=d;best=k;}});});if(best>=0)pick(best);}drag=null;});
  cv.addEventListener('pointercancel',function(){drag=null;});
  cv.tabIndex=0;cv.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')yaw-=0.12;else if(e.key==='ArrowRight')yaw+=0.12;else if(e.key==='ArrowUp')pitch=clamp(pitch+0.1,0.15,1.5);else if(e.key==='ArrowDown')pitch=clamp(pitch-0.1,0.15,1.5);else return;e.preventDefault();});
  U.reg(cv,function(dt){draw(U.reduce?0:dt);});
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
 lab:[["sia","sia_explain","P3 지그에 원통형과 각형을 바꿔 끼울 수 있어요. 형태도 결과에 조금 영향을 줘요."],["moa","moa_report","P4 열화상 숫자가 빨갛게 되면 화염 단계예요. 연기 단계는 200 °C를 잘 안 넘어요."]],
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
