/* hub_events.js — 공장 목록(첫 페이지) 이벤트 알림: 과부하·불량품 대량 발생 등. 데이터는 hub_events_data.js(EVENTS) */
(function(){
'use strict';
var $=U.$,cssv=U.cssv,clamp=U.clamp;
var LV={r:{c:'#c9302c',soft:'#fdecea',name:'경고'},a:{c:'#a35c00',soft:'#fff3d6',name:'주의'}};
var IMG={},OVR={};EVENTS.forEach(function(e){var im=new Image();im.src=e.spr;IMG[e.key]=im;
  var o=new Image();o.onload=function(){OVR[e.key]=o;};o.src='img/ev_'+e.key+'.webp';});   /* 일러스트(img/ev_*.webp)가 있으면 그것을 씀 */
function rnd(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
/* ── 이벤트 그림: 캐릭터(공장 복장·동작 벡터) + 만화 효과 ── */
function art(cv,e,t){var R=U.setup(cv),g=R.g,w=R.w,h=R.h,L=LV[e.lv];
  if(OVR[e.key]){var o=OVR[e.key],s=Math.max(w/o.naturalWidth,h/o.naturalHeight);g.drawImage(o,(w-o.naturalWidth*s)/2,(h-o.naturalHeight*s)/2,o.naturalWidth*s,o.naturalHeight*s);return;}
  var gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,L.soft);gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  /* 바닥과 경고 띠 */
  g.fillStyle='#eef1f5';g.fillRect(0,h*0.82,w,h*0.18);
  for(var k=0;k<w/18+2;k++){g.fillStyle=k%2?'#1d1a22':'#f2c230';g.beginPath();var x=k*18-((t*30)%36);g.moveTo(x,h);g.lineTo(x+9,h);g.lineTo(x+18,h*0.94);g.lineTo(x+9,h*0.94);g.closePath();g.fill();}
  var fx=e.fx,cx=w*0.36,by=h*0.86;
  /* 뒤 효과 */
  if(fx==='siren'||fx==='xlamp'){var on=Math.floor(t*4)%2;g.globalAlpha=0.18+0.12*on;g.fillStyle=L.c;g.beginPath();g.moveTo(w*0.78,h*0.12);g.lineTo(w*0.2+Math.sin(t*5)*w*0.3,h);g.lineTo(w*0.5+Math.sin(t*5)*w*0.3,h);g.closePath();g.fill();g.globalAlpha=1;}
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

/* ── 알림 창 ── */
var box=document.createElement('div');box.className='evtoast';box.setAttribute('role','alert');box.hidden=true;
box.innerHTML='<canvas aria-hidden="true"></canvas><div class="evb"><div class="evh"><span class="evlv"></span><b class="evt"></b><button type="button" class="evx" aria-label="알림 닫기">×</button></div><p class="evp"></p><div class="evf"><a class="evgo"></a><span class="evwho"></span></div></div>';
document.body.appendChild(box);var bc=box.querySelector('canvas'),cur=null,t0=0,hideT=0;
U.reg(bc,function(dt){if(!cur||box.hidden)return;t0+=dt||0;art(bc,cur,t0);});
function lamp(e,on){var s=document.querySelector('[data-fac="'+e.fac+'"] .lamp');if(!s)return;if(on){if(!s.dataset.orig){s.dataset.orig=s.className+'|'+s.textContent;}s.className='lamp ng';s.textContent=LV[e.lv].name+' · '+e.title.split(' — ')[0].replace(/!$/,'');}
  else if(s.dataset.orig){var o=s.dataset.orig.split('|');s.className=o[0];s.textContent=o[1];delete s.dataset.orig;}}
var last=null;
function show(e){if(last)lamp(last,false);cur=e;last=e;t0=0;var L=LV[e.lv];box.style.setProperty('--ev',L.c);box.style.setProperty('--evs',L.soft);
  box.querySelector('.evlv').textContent='⚠ '+L.name;box.querySelector('.evt').textContent=e.title;box.querySelector('.evp').textContent=e.text;
  var a=box.querySelector('.evgo');a.textContent=e.go+' →';a.href=e.link;if(/^https?:/.test(e.link)){a.target='_blank';a.rel='noopener';}else{a.removeAttribute('target');}
  box.querySelector('.evwho').textContent='그림: 공장 복장·동작 벡터 '+e.who;box.hidden=false;box.classList.remove('in');void box.offsetWidth;box.classList.add('in');lamp(e,true);art(bc,e,0);
  logAdd(e);clearTimeout(hideT);hideT=setTimeout(function(){close();},11000);}
function close(){box.hidden=true;if(last)lamp(last,false);}
box.querySelector('.evx').onclick=close;
/* ── 상황판 ── */
var LOG=[];function logAdd(e){var d=new Date();LOG.unshift({e:e,tm:('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2)});LOG=LOG.slice(0,6);
  var el=$('#ev-log');if(el)el.innerHTML=LOG.map(function(x){return '<li><span class="evdot" style="background:'+LV[x.e.lv].c+'"></span><code>'+x.tm+'</code> <b>'+U.esc(x.e.title)+'</b> <a href="'+x.e.link+'">'+U.esc(x.e.go)+'</a></li>';}).join('');}
var chips=$('#ev-chips');if(chips){chips.innerHTML=EVENTS.map(function(e,i){return '<button type="button" class="bt" data-ev="'+i+'"><span class="evdot" style="background:'+LV[e.lv].c+'"></span>'+U.esc(e.title.split(' — ')[0])+'</button>';}).join('');
  chips.querySelectorAll('[data-ev]').forEach(function(b){b.onclick=function(){show(EVENTS[+b.dataset.ev]);};});}
var auto=!U.reduce,timer=0,order=EVENTS.map(function(_,i){return i;}).sort(function(a,b){return rnd(a+3)-rnd(b+3);}),oi=0;
try{var sv=localStorage.getItem('hub_ev_auto');if(sv!==null)auto=sv==='1';}catch(err){}
function sched(){clearTimeout(timer);if(!auto)return;timer=setTimeout(function(){if(document.visibilityState==='visible'&&box.hidden)show(EVENTS[order[oi++%order.length]]);sched();},oi===0?7000:22000);}
var ab=$('#ev-auto');function setAuto(v){auto=v;try{localStorage.setItem('hub_ev_auto',v?'1':'0');}catch(err){}if(ab){ab.textContent=v?'자동 이벤트 켜짐 (끄기)':'자동 이벤트 꺼짐 (켜기)';ab.setAttribute('aria-pressed',String(v));}sched();}
if(ab)ab.onclick=function(){setAuto(!auto);};var rb=$('#ev-rand');if(rb)rb.onclick=function(){show(EVENTS[Math.floor(Math.random()*EVENTS.length)]);};
setAuto(auto);
/* 상황판 미리보기 그림 */
var pv=$('#cvEvPrev');if(pv){var pi=0,pt=0;U.reg(pv,function(dt){pt+=dt||0;if(pt>4){pt=0;pi=(pi+1)%EVENTS.length;}art(pv,EVENTS[pi],pt);});}
})();
