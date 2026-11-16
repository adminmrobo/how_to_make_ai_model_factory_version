/* fac_events.js — 공장 이벤트(과부하·고열·불량 대량 등). 공장 페이지 안에서, 그 공장의 조건이 맞을 때만 알림이 뜬다.
   데이터: EVENTS(hub_events_data.js에서 이 페이지의 공장 것만 골라 넣음). 첫 페이지(FEV_FAC='hub')에서는 알림 없이 안내표와 미리보기만.
   페이지 쪽 사용법: FEV.cond(key, 조건참거짓, {text}) — 조건이 거짓→참으로 바뀌는 순간 한 번 뜬다(사용자가 조작한 뒤부터).
                     FEV.fire(key, {text, force}) — 실험 결과처럼 한 번 일어난 사건을 바로 알린다. */
var FEV=(function(){
'use strict';
var FAC=(typeof FEV_FAC!=='undefined')?FEV_FAC:'hub',PAGE=(location.pathname.split('/').pop()||'index.html');
var $=U.$,cssv=U.cssv,clamp=U.clamp;
var LV={r:{c:'#c9302c',soft:'#fdecea',name:'경고'},a:{c:'#a35c00',soft:'#fff3d6',name:'주의'}};
var FNAME={factory:'③ 배터리 생산 공장',solar:'④ 태양광 패널 셀 공장',blast:'⑤ 배터리 열폭주 실험 랩',testlab:'시제품 테스트 랩실',classifier:'① 배터리 불량품 판정기',regression:'② 배터리 수명 예측 장치',cement:'이웃 시멘트 공장'};
/* 이벤트가 뜨는 조건 — 첫 페이지 안내표와 공장 안 이벤트판에 같은 문장을 쓴다 */
var COND={
 overload:'라인 속도를 올려 7일 끝 재공품이 1,500셀을 넘을 때',
 heat:'최고 기계 온도가 60 °C를 넘을 때(24시간 가동·냉각 부족)',
 power:'운전 시간대·시간을 바꿔 하루 전기료가 기본 설정보다 10% 넘게 오를 때',
 defects:'고른 조건의 공정 시그마가 3.5σ 아래로 떨어질 때',
 supplier:'원재료 수입처를 C(신규)로 고를 때',
 handover:'3D 공장 시계가 교대 인계 시각을 지날 때(3교대 06·14·22시, 2교대 08·20시)',
 labgap:'3D 시험 라인이 158마리를 다 검수했는데 랩 점수보다 5%p 넘게 낮을 때',
 qcfail:'시운전한 엔진의 검증 F1이 기준 0.80에 못 미치거나, 정비 작업장 검사가 불합격일 때',
 runaway:'방폭 시험실에서 압착한 셀이 화염(열폭주) 단계로 갈 때',
 kiln:'이웃 시멘트 공장 사이트 안에서'
};
var IMG={},OVR={};EVENTS.forEach(function(e){e.cond=COND[e.key]||'';var im=new Image();im.src=e.spr;IMG[e.key]=im;
  var o=new Image();o.onload=function(){OVR[e.key]=o;};o.src='img/ev_'+e.key+'.webp';});
function byKey(k){for(var i=0;i<EVENTS.length;i++)if(EVENTS[i].key===k)return EVENTS[i];return null;}
function rnd(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function href(e){var l=e.link;if(l.indexOf(PAGE+'#')===0)return l.slice(PAGE.length);return l;}
/* ── 이벤트 그림: 캐릭터(공장 복장·동작 벡터) + 만화 효과 ── */
function art(cv,e,t){var R=U.setup(cv),g=R.g,w=R.w,h=R.h,L=LV[e.lv];
  if(OVR[e.key]){var o=OVR[e.key],s=Math.max(w/o.naturalWidth,h/o.naturalHeight);g.drawImage(o,(w-o.naturalWidth*s)/2,(h-o.naturalHeight*s)/2,o.naturalWidth*s,o.naturalHeight*s);return;}
  var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,L.soft);gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  /* 바닥과 경고 띠 */
  g.fillStyle='#eef1f5';g.fillRect(0,h*0.82,w,h*0.18);
  for(var k=0;k<w/18+2;k++){g.fillStyle=k%2?'#1d1a22':'#f2c230';g.beginPath();var x=k*18-((t*30)%36);g.moveTo(x,h);g.lineTo(x+9,h);g.lineTo(x+18,h*0.94);g.lineTo(x+9,h*0.94);g.closePath();g.fill();}
  var fx=e.fx,cx=w*0.36,by=h*0.86;
  /* 뒤 효과 */
  if(fx==='siren'||fx==='xlamp'||fx==='fire'){var on=Math.floor(t*4)%2;g.globalAlpha=0.18+0.12*on;g.fillStyle=L.c;g.beginPath();g.moveTo(w*0.78,h*0.12);g.lineTo(w*0.2+Math.sin(t*5)*w*0.3,h);g.lineTo(w*0.5+Math.sin(t*5)*w*0.3,h);g.closePath();g.fill();g.globalAlpha=1;}
  if(fx==='heat'){for(var j=0;j<5;j++){g.strokeStyle='rgba(230,90,40,.45)';g.lineWidth=3;g.beginPath();for(var y=h*0.85;y>h*0.1;y-=4){var xx=w*(0.55+j*0.08)+Math.sin(y*0.08+t*6+j)*6;y===h*0.85?g.moveTo(xx,y):g.lineTo(xx,y);}g.stroke();}}
  if(fx==='smoke'){for(var j2=0;j2<7;j2++){var p=((t*0.4+j2/7)%1),r=10+p*30;g.fillStyle='rgba(120,120,130,'+(0.35*(1-p))+')';g.beginPath();g.arc(w*0.72+Math.sin(j2)*14,h*0.7-p*h*0.65,r,0,7);g.fill();}
    g.fillStyle='#b8bec6';g.fillRect(w*0.66,h*0.55,w*0.24,h*0.3);g.fillStyle='#e0603a';g.fillRect(w*0.7,h*0.62,w*0.16,h*0.08);}
  if(fx==='clock'){var ccx=w*0.76,ccy=h*0.38,cr=h*0.22;g.fillStyle='#fff';g.strokeStyle='#1d1a22';g.lineWidth=3;g.beginPath();g.arc(ccx,ccy,cr,0,7);g.fill();g.stroke();
    var a1=t*1.2,a2=t*0.1;g.lineWidth=3;g.beginPath();g.moveTo(ccx,ccy);g.lineTo(ccx+Math.sin(a1)*cr*0.8,ccy-Math.cos(a1)*cr*0.8);g.moveTo(ccx,ccy);g.lineTo(ccx+Math.sin(a2)*cr*0.5,ccy-Math.cos(a2)*cr*0.5);g.stroke();}
  if(fx==='drop'){var x0=w*0.58,x1=w*0.95,y0=h*0.18,y1=h*0.62,pp=clamp((t%3)/1.5,0,1);g.strokeStyle='#d6dbe2';g.lineWidth=1;g.strokeRect(x0,y0-10,x1-x0,y1-y0+20);
    g.strokeStyle=L.c;g.lineWidth=4;g.beginPath();g.moveTo(x0+6,y0);g.lineTo(x0+(x1-x0)*0.5,y0+4);g.lineTo(x0+(x1-x0)*(0.5+0.45*pp),y0+(y1-y0)*pp);g.stroke();
    g.fillStyle=L.c;g.beginPath();var ax=x0+(x1-x0)*(0.5+0.45*pp),ay=y0+(y1-y0)*pp;g.moveTo(ax+8,ay+2);g.lineTo(ax-6,ay+6);g.lineTo(ax,ay-8);g.closePath();g.fill();}
  /* 캐릭터 */
  var im=IMG[e.key];if(im&&im.complete&&im.naturalWidth){var ch=h*0.76,bob=Math.sin(t*(fx==='siren'?14:5))*h*(fx==='siren'?0.012:0.008),cw=ch*im.naturalWidth/im.naturalHeight,sh=fx==='siren'||fx==='xlamp'?Math.sin(t*30)*1.5:0;
    g.fillStyle='rgba(22,33,43,.12)';g.beginPath();g.ellipse(cx,by,cw*0.42,6,0,0,7);g.fill();g.drawImage(im,cx-cw/2+sh,by-ch+bob,cw,ch);}
  /* 앞 효과 */
  if(fx==='siren'){var on2=Math.floor(t*4)%2;g.fillStyle=on2?'#ff3b30':'#8a1c17';g.beginPath();g.arc(w*0.78,h*0.14,13,Math.PI,0);g.fill();g.fillStyle='#555';g.fillRect(w*0.78-16,h*0.14,32,6);
    for(var s2=0;s2<6;s2++){var q=((t*0.6+s2/6)%1);g.fillStyle='rgba(90,90,100,'+(0.4*(1-q))+')';g.beginPath();g.arc(w*0.6+s2*9,h*0.6-q*h*0.4,6+q*14,0,7);g.fill();}
    for(var b=0;b<Math.min(14,Math.floor((t%4)*5));b++){g.fillStyle='#d8eef0';g.strokeStyle='#2a7d86';g.lineWidth=1.2;var bx=w*0.62+(b%5)*13,byy=h*0.8-Math.floor(b/5)*9;g.fillRect(bx,byy,11,7);g.strokeRect(bx,byy,11,7);}}
  if(fx==='fire'){g.fillStyle='rgba(200,215,230,.35)';g.fillRect(w*0.6,h*0.3,w*0.32,h*0.52);g.strokeStyle='#9fb3c6';g.lineWidth=2;g.strokeRect(w*0.6,h*0.3,w*0.32,h*0.52);
    for(var f2=0;f2<10;f2++){var fh=h*(0.12+0.14*rnd(f2))*(0.7+0.3*Math.sin(t*12+f2)),fx2=w*(0.66+0.2*rnd(f2+4));g.fillStyle=f2%3?'rgba(255,140,30,.9)':'rgba(255,215,60,.95)';g.beginPath();g.moveTo(fx2,h*0.78-fh);g.quadraticCurveTo(fx2+10,h*0.74,fx2,h*0.8);g.quadraticCurveTo(fx2-10,h*0.74,fx2,h*0.78-fh);g.fill();}
    for(var s3=0;s3<8;s3++){var q3=((t*0.5+s3/8)%1);g.fillStyle='rgba(30,26,28,'+(0.45*(1-q3))+')';g.beginPath();g.arc(w*0.76+Math.sin(s3)*12,h*0.5-q3*h*0.45,8+q3*16,0,7);g.fill();}
    g.fillStyle='#2f3a46';g.fillRect(w*0.7,h*0.3,w*0.12,h*0.08);}
  if(fx==='tags'){for(var k2=0;k2<14;k2++){var y2=((t*0.35+rnd(k2))%1)*h*1.1-20,x2=w*(0.5+rnd(k2+9)*0.48)+Math.sin(t*3+k2)*6,rot=Math.sin(t*2+k2)*0.6;g.save();g.translate(x2,y2);g.rotate(rot);g.fillStyle='#e0302a';g.fillRect(-7,-10,14,20);g.fillStyle='#fff';g.beginPath();g.arc(0,-6,2,0,7);g.fill();g.restore();}}
  if(fx==='question'){for(var k3=0;k3<4;k3++){var y3=h*(0.2+0.12*Math.sin(t*2+k3*1.7)),x3=w*(0.58+k3*0.1);g.font='800 '+(18+k3*4)+'px '+cssv('--font');g.fillStyle=k3%2?'#8e62b3':'#3567a8';g.fillText('?',x3,y3+20);}
    g.fillStyle='#8e62b3';g.fillRect(w*0.72,h*0.62,w*0.18,h*0.2);g.fillStyle='#1e2f4a';for(var c=0;c<3;c++)g.fillRect(w*0.735+c*w*0.055,h*0.58,w*0.045,h*0.05);}
  if(fx==='bolt'){var fl=Math.floor(t*3)%3===0;g.fillStyle=fl?'#ffd400':'#f2c230';g.strokeStyle='#1d1a22';g.lineWidth=2;g.beginPath();var bx2=w*0.74,by2=h*0.1;g.moveTo(bx2,by2);g.lineTo(bx2-22,by2+46);g.lineTo(bx2-4,by2+46);g.lineTo(bx2-16,by2+86);g.lineTo(bx2+20,by2+32);g.lineTo(bx2+2,by2+32);g.lineTo(bx2+12,by2);g.closePath();g.fill();g.stroke();
    if(fl){g.fillStyle='rgba(255,212,0,.15)';g.fillRect(0,0,w,h);}}
  if(fx==='xlamp'){for(var k4=0;k4<3;k4++){var lx=w*(0.62+k4*0.12),ly=h*0.3,onl=(Math.floor(t*3)+k4)%2;g.fillStyle=onl?'#ff3b30':'#f5c6c3';g.beginPath();g.arc(lx,ly,12,0,7);g.fill();g.strokeStyle='#1d1a22';g.lineWidth=2;g.stroke();
    g.strokeStyle='#fff';g.lineWidth=3;g.beginPath();g.moveTo(lx-5,ly-5);g.lineTo(lx+5,ly+5);g.moveTo(lx+5,ly-5);g.lineTo(lx-5,ly+5);g.stroke();}}
  /* 만화 말풍선 기호 */
  var pop=1+0.08*Math.sin(t*8);g.save();g.translate(cx+h*0.18,h*0.12);g.scale(pop,pop);g.fillStyle='#fff';g.strokeStyle=L.c;g.lineWidth=2.5;g.beginPath();g.arc(0,0,15,0,7);g.fill();g.stroke();
  g.fillStyle=L.c;g.font='900 20px '+cssv('--font');g.textAlign='center';g.textBaseline='middle';g.fillText(e.lv==='r'?'!!':'!',0,1);g.restore();g.textAlign='left';g.textBaseline='alphabetic';}

/* ── 스타일 ── */
var css='.evtoast{position:fixed;right:16px;bottom:16px;z-index:60;width:min(380px,calc(100vw - 32px));background:#fff;border:2px solid var(--ev,#c9302c);border-radius:14px;box-shadow:0 10px 30px rgba(22,33,43,.22);overflow:hidden}'+
 '.evtoast canvas{display:block;width:100%;height:190px;border-bottom:1px solid var(--rule)}.evtoast .evb{padding:10px 12px}.evtoast .evh{display:flex;align-items:center;gap:8px}'+
 '.evtoast .evlv{font-size:12px;font-weight:800;color:#fff;background:var(--ev);border-radius:6px;padding:1px 7px;flex:none}.evtoast .evt{font-size:15px;line-height:1.35;flex:1}'+
 '.evtoast .evx{border:0;background:none;font-size:22px;line-height:1;cursor:pointer;color:var(--muted);padding:0 2px}.evtoast .evp{margin:6px 0;font-size:13.5px;line-height:1.55}'+
 '.evtoast .evc{margin:0 0 6px;font-size:12px;color:var(--muted);line-height:1.5}.evtoast .evf{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:baseline}'+
 '.evtoast .evgo{font-size:13.5px;font-weight:700;color:var(--ev)}.evtoast .evwho{font-size:11.5px;color:var(--muted)}'+
 '.evtoast.in{animation:evin .45s cubic-bezier(.2,1.4,.4,1)}@keyframes evin{from{transform:translateY(30px) scale(.9);opacity:0}to{transform:none;opacity:1}}'+
 '@media (prefers-reduced-motion:reduce){.evtoast.in{animation:none}}@media(max-width:700px){.evtoast canvas{height:140px}}'+
 '.evdot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:0}'+
 '.evtb{width:100%;border-collapse:collapse;font-size:13.5px}.evtb th,.evtb td{border-bottom:1px solid var(--rule);padding:6px 8px;text-align:left;vertical-align:top}.evtb th{color:var(--muted);font-weight:500;font-size:12.5px}'+
 '.evtb .evst{white-space:nowrap}.evtb button{font:inherit;font-size:12.5px;border:1px solid var(--rule);background:#fff;border-radius:6px;padding:1px 8px;cursor:pointer;margin-left:4px}'+
 '.evwrap{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.4fr);gap:14px;align-items:start}.evwrap canvas{width:100%;height:200px;border-radius:12px;border:1px solid var(--rule);background:#fff}@media(max-width:760px){.evwrap{grid-template-columns:1fr}}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ── 알림 창 (공장 페이지 전용) ── */
var box=null,bc=null,cur=null,t0=0,hideT=0,LOGT={},Q=[],shownAt=0;
function mkBox(){box=document.createElement('div');box.className='evtoast';box.setAttribute('role','alert');box.hidden=true;
  box.innerHTML='<canvas aria-hidden="true"></canvas><div class="evb"><div class="evh"><span class="evlv"></span><b class="evt"></b><button type="button" class="evx" aria-label="알림 닫기">×</button></div><p class="evp"></p><p class="evc"></p><div class="evf"><a class="evgo"></a><span class="evwho"></span></div></div>';
  document.body.appendChild(box);bc=box.querySelector('canvas');box.querySelector('.evx').onclick=close;
  box.querySelector('.evgo').addEventListener('click',function(){setTimeout(close,300);});
  U.reg(bc,function(dt){if(!cur||box.hidden)return;t0+=dt||0;art(bc,cur,t0);});}
function show(e,text,title){if(!box)mkBox();if(!box.hidden&&Date.now()-shownAt<6000&&cur!==e){Q.push([e,text,title]);return;}shownAt=Date.now();cur=e;t0=0;var L=LV[e.lv];box.style.setProperty('--ev',L.c);box.style.setProperty('--evs',L.soft);
  box.querySelector('.evlv').textContent='⚠ '+L.name;box.querySelector('.evt').textContent=title||e.title;box.querySelector('.evp').textContent=text||e.text;
  box.querySelector('.evc').textContent='뜬 조건: '+e.cond;
  var a=box.querySelector('.evgo');a.textContent=e.go+' →';a.href=href(e);if(/^https?:/.test(e.link)){a.target='_blank';a.rel='noopener';}else{a.removeAttribute('target');}
  box.querySelector('.evwho').textContent='그림: 공장 복장·동작 벡터 '+e.who;box.hidden=false;box.classList.remove('in');void box.offsetWidth;box.classList.add('in');art(bc,e,0);
  clearTimeout(hideT);hideT=setTimeout(close,Q.length?8000:14000);}
function close(){if(box)box.hidden=true;if(Q.length){var n=Q.shift();setTimeout(function(){show(n[0],n[1],n[2]);},400);}}

/* ── 조건 검사 ── */
var armed=false,STATE={},LAST={},TEXT={};
['pointerdown','keydown','input','change'].forEach(function(ev){document.addEventListener(ev,function(){armed=true;},true);});
function stamp(){var d=new Date();return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2);}
function fire(key,opt){opt=opt||{};if(FAC==='hub')return false;var e=byKey(key);if(!e)return false;if(!armed&&!opt.force&&!opt.auto)return false;
  var now=Date.now();if(LAST[key]&&now-LAST[key]<(opt.cool==null?20000:opt.cool)&&!opt.force)return false;LAST[key]=now;
  TEXT[key]=[opt.text||e.text,opt.title||e.title];LOGT[key]=stamp();show(e,TEXT[key][0],TEXT[key][1]);board();return true;}
function cond(key,on,opt){var was=STATE[key];STATE[key]=!!on;if(on&&!was&&was!==undefined)return fire(key,opt);if(on&&was===undefined&&(armed||opt&&opt.auto))return fire(key,opt);return false;}

/* ── 이벤트판: 공장 페이지에서는 "이 공장의 이벤트", 첫 페이지에서는 전체 안내표 ── */
function rows(list,withFac){return list.map(function(e){var L=LV[e.lv],fired=LOGT[e.key];
  return '<tr><td><span class="evdot" style="background:'+L.c+'"></span><b>'+U.esc(e.title)+'</b></td>'+(withFac?'<td>'+U.esc(FNAME[e.fac]||e.fac)+'</td>':'')+'<td>'+U.esc(e.cond)+'</td>'+
    (withFac?'<td><a href="'+e.link+'"'+(/^https?:/.test(e.link)?' target="_blank" rel="noopener"':'')+'>'+U.esc(e.go)+'</a></td>':'<td class="evst">'+(fired?'<span class="lamp ng">발생 '+fired+'</span><button type="button" data-evre="'+e.key+'">다시 보기</button>':'<span class="lamp">대기</span>')+'</td>')+'</tr>';}).join('');}
function board(){var el=document.getElementById('fev-board');if(!el)return;
  if(FAC==='hub'){el.innerHTML='<table class="evtb"><thead><tr><th>이벤트</th><th>공장</th><th>뜨는 조건</th><th>들어가기</th></tr></thead><tbody>'+rows(EVENTS,true)+'</tbody></table>';return;}
  el.innerHTML='<table class="evtb"><thead><tr><th>이벤트</th><th>뜨는 조건</th><th>상태</th></tr></thead><tbody>'+rows(EVENTS,false)+'</tbody></table>';
  el.querySelectorAll('[data-evre]').forEach(function(b){b.onclick=function(){var e=byKey(b.dataset.evre),x=TEXT[e.key]||[];show(e,x[0],x[1]);};});}
function mount(){if(FAC==='hub'){board();var pv=document.getElementById('cvEvPrev');if(pv&&EVENTS.length){var pi=0,pt=0;U.reg(pv,function(dt){pt+=dt||0;if(pt>4){pt=0;pi=(pi+1)%EVENTS.length;}art(pv,EVENTS[pi],pt);});}return;}
  if(!EVENTS.length)return;var host=document.getElementById('sum')||document.querySelector('main section:last-of-type');if(!host)return;
  var sec=document.createElement('section');sec.className='sec';sec.id='events';sec.setAttribute('aria-labelledby','h-fev');
  sec.innerHTML='<div class="wrap"><h2 id="h-fev">이 공장의 이벤트</h2><p class="lead">아래 조건이 맞으면 화면 오른쪽 아래에 경고 알림이 뜹니다. 페이지를 조작해 조건을 만들어 보세요. 알림의 숫자는 이 페이지의 설명용 모형에서 나옵니다.</p>'+
    '<div class="evwrap"><canvas id="cvFevPrev" aria-hidden="true"></canvas><div id="fev-board"></div></div><p class="mnote">이벤트는 교육용 연출입니다. 실제 공장의 경보가 아닙니다.</p></div>';
  host.parentNode.insertBefore(sec,host);board();
  var pv=document.getElementById('cvFevPrev'),pi=0,pt=0;U.reg(pv,function(dt){pt+=dt||0;if(pt>4){pt=0;pi=(pi+1)%EVENTS.length;}art(pv,EVENTS[pi],pt);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
return {fire:fire,cond:cond,art:art,events:EVENTS,isArmed:function(){return armed;}};
})();
