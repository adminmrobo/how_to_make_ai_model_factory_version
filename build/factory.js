/* factory.js — 「배터리 생산 공장 ③」 페이지 스크립트 (IIFE 하나). 계산은 fsim.js(FS) */
(function(){
'use strict';
var $=U.$,$$=U.$$,fmt=U.fmt,cssv=U.cssv,clamp=U.clamp;
var C={eye:cssv('--eye'),gfp:cssv('--gfp'),stain:cssv('--stain'),amber:cssv('--amber'),info:cssv('--info'),muted:cssv('--muted'),text:cssv('--text'),rule:cssv('--rule'),terrain:cssv('--terrain')};
function n0(x){return Math.round(x).toLocaleString('ko-KR');}
function won(x){var a=Math.abs(x),s=x<0?'−':'';return a>=1e8?s+fmt(a/1e8,2)+'억 원':a>=1e4?s+n0(a/1e4)+'만 원':s+n0(a)+'원';}
function pct(x,d){return fmt(x*100,d==null?1:d)+'%';}
function mini(cls,label,val){return '<div class="mini '+(cls||'')+'"><span>'+label+'</span><b>'+val+'</b></div>';}
var ST=FS.ST,NS=FS.NS,K=FS.K,FORM=8,STACK=5;

/* ══ 상태와 계산 ══ */
var CFG=FS.defaults(),R=null,BASE=FS.run(FS.defaults()),OPT=null,K1PICK=-1,LOG=[];
function rerun(){R=FS.run(CFG,{labels:25});LI=0;all();}
var timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(rerun,60);}

/* ══ 조종실 ══ */
function bindRange(id,key,fmtv,conv){var el=$('#r-'+id);el.oninput=function(){CFG[key]=conv?conv(+this.value):+this.value;$('#v-'+id).textContent=fmtv(CFG[key]);schedule();};}
bindRange('speed','speed',function(v){return fmt(v,2)+'×';});
bindRange('hours','hours',function(v){return v+'시간';});
bindRange('start','start',function(v){return v+'시';});
bindRange('cool','cool',function(v){return v+'단';});
U.btns($('#g-verify'),[[0,'끔'],[1,'켬']],0,function(v){CFG.verify=v;schedule();});
$$('[data-mach]').forEach(function(b){b.onclick=function(){var i=+b.dataset.mach;CFG.extra[i]=clamp((CFG.extra[i]||0)+(+b.dataset.d),0,i===FORM?6:3);$('#v-m'+i).textContent='+'+CFG.extra[i]+'대';schedule();};});
function syncUI(){[['speed',function(v){return fmt(v,2)+'×';}],['hours',function(v){return v+'시간';}],['start',function(v){return v+'시';}],['cool',function(v){return v+'단';}]].forEach(function(x){$('#r-'+x[0]).value=CFG[x[0]];$('#v-'+x[0]).textContent=x[1](CFG[x[0]]);});
  [FORM,STACK].forEach(function(i){$('#v-m'+i).textContent='+'+(CFG.extra[i]||0)+'대';});U.btns($('#g-verify'),[[0,'끔'],[1,'켬']],CFG.verify,function(v){CFG.verify=v;schedule();});}
function setCfg(o){CFG=FS.clone(o);CFG.seed=7;CFG.days=7;syncUI();rerun();}
$('#c-reset').onclick=function(){setCfg(FS.defaults());};
function cfgText(c){return '속도 '+fmt(c.speed,2)+'× · '+c.hours+'시간'+(c.hours<24?' ('+c.start+'시 시작)':'')+' · 냉각 '+c.cool+'단 · 화성 +'+(c.extra[FORM]||0)+' · 적층 +'+(c.extra[STACK]||0)+(c.verify?' · 이중 검증':'');}
function control(){var o=R,d=o.perDay,bn=o.bottleneck;
  $('#c-minis').innerHTML=mini('g','하루 양품 셀',n0(d.good))+mini(o.defectRate>0.04?'r':'','공정 불량률',pct(o.defectRate,2))+mini(o.escRate>0.002?'r':'','출하 유출률',pct(o.escRate,2))+mini(o.labelErr>FS.LMAX?'r':'g','라벨 오기율',pct(o.labelErr,2))+
    mini('a','병목 공정 · 가동률',ST[bn].name+' · '+pct(o.util[bn],0))+mini(o.tmax>60?'r':'','최고 기계 온도',fmt(o.tmax,1)+' °C')+mini('','하루 전기료 · 셀당',won(d.elec)+' · '+n0(o.elecPerGood)+'원')+mini(o.wip>1500?'r':'','라인 위 재공품 (7일 끝)',n0(o.wip)+'셀')+
    mini('m','하루 설비비',won(d.capex))+mini(d.profit>=0?'g':'r','하루 이익',won(d.profit));
  $('#k-good').textContent=n0(d.good);$('#k-profit').textContent=won(d.profit);
  var msgs=[[d.profit>=BASE.perDay.profit?'g':'a','지금 설정('+cfgText(CFG)+')의 하루 이익은 '+won(d.profit)+'입니다. '+(Math.abs(d.profit-BASE.perDay.profit)<1?'기본 설정과 같습니다.':'기본 설정('+won(BASE.perDay.profit)+')보다 '+won(Math.abs(d.profit-BASE.perDay.profit))+' '+(d.profit>BASE.perDay.profit?'많습니다.':'적습니다.'))]];
  if(o.wip>1500)msgs.push(['r','병목('+ST[bn].name+') 앞에 셀이 '+n0(o.wip)+'개 쌓였습니다. 재료비 '+won(o.wip*K.material)+'가 라인 위에 묶여 있어요. 투입 속도를 병목에 맞추거나 병목 설비를 늘리세요.']);
  if(o.labelErr>FS.LMAX)msgs.push(['r','라벨 오기율이 '+pct(o.labelErr,1)+'로 기준(3%)을 넘었습니다. 기계가 '+fmt(o.tmax,0)+' °C까지 올라 센서가 틀리게 적습니다. 냉각을 올리거나 가동 시간·속도를 줄이세요.']);
  else if(o.tmax>K.tSafe)msgs.push(['a','최고 온도 '+fmt(o.tmax,1)+' °C — 55 °C를 넘는 동안 불량이 늘고 있습니다.']);
  U.ins($('#i-control'),msgs);}

/* ══ 공정 표 ══ */
function lineTable(){var o=R;$('#line-tb').innerHTML='<thead><tr><th>#</th><th>공정</th><th>설비 × 1대 처리량</th><th>최대 속도</th><th>처리량 (셀/시)</th><th>전력 (kW/대)</th><th>라벨 센서</th><th>가동률</th><th>최고 온도</th><th>불량률</th></tr></thead><tbody>'+
  ST.map(function(st,i){var m=st.m+(CFG.extra[i]||0),cap=m*st.r*Math.min(CFG.speed,st.smax),Tm=0,pm=0;o.hours.forEach(function(h){Tm=Math.max(Tm,h.T[i]);pm=Math.max(pm,h.on?h.p[i]:0);});
    return '<tr class="'+(i===o.bottleneck?'me':'')+'"><td>P'+(i+2)+'</td><td>'+st.name+(i===o.bottleneck?'<span class="tag2 bn">병목</span>':'')+(Tm>K.tSens?'<span class="tag2 hot">과열</span>':'')+'</td><td>'+m+'대 × '+st.r+'</td><td>'+fmt(st.smax,2)+'×</td><td>'+n0(cap)+'</td><td>'+st.kw+'</td><td>'+st.sens.map(function(s){return s[0];}).join(', ')+'</td><td>'+pct(o.util[i],0)+'</td><td>'+fmt(Tm,1)+' °C</td><td>'+pct(pm,2)+'</td></tr>';}).join('')+'</tbody>';}

/* ══ 라벨 ══ */
var LI=0;
function labelCard(){var L=R.labels;$('#l-count').textContent='표본 '+n0(L.length)+'장';if(!L.length){$('#labelcard').innerHTML='<p class="mnote">출하한 셀이 없습니다.</p>';return;}
  LI=clamp(LI,0,L.length-1);var l=L[LI],bad=L.filter(function(x){return x.err;}).length;
  var rows=l.vals.map(function(v){var tv=fmt(v.t,v.dp),rv=fmt(v.v,v.dp);return '<tr class="'+(v.bad?'wrong':'')+'"><td>'+ST[v.st].name+'</td><td>'+v.name+'</td><td class="v">'+rv+' '+v.unit+(v.bad?' <span class="muted">('+tv+', '+v.kind+')</span>':'')+'</td></tr>';}).join('');
  var st=l.err?(l.caught?'<span class="stamp2" style="color:var(--amber)">이중 검증이 잡음</span>':'<span class="stamp2" style="color:var(--eye)">오기 있음</span>'):'<span class="stamp2" style="color:var(--gfp)">정상 기록</span>';
  $('#labelcard').innerHTML='<div class="labelcard"><div class="lh"><b>'+l.id+'</b><span>'+l.day+'일차 '+l.hour+'시 출하 · 대용량 셀 60 Ah급</span>'+st+'</div><div class="bc" aria-hidden="true"></div><table>'+rows+'</table></div>';
  $('#l-minis').innerHTML=mini('','표본 라벨',(LI+1)+' / '+L.length)+mini(bad/L.length>FS.LMAX?'r':'g','오기 있는 라벨 (표본)',bad+'장 · '+pct(bad/L.length,1))+mini('','라벨 오기율 (7일 전체)',pct(R.labelErr,2))+mini('a','이중 검증 뒤 남는 오기',pct(R.labelErrSlip,2));
  U.ins($('#i-label'),[[R.labelErr>FS.LMAX?'r':'g',R.labelErr>FS.LMAX?'라벨 '+pct(R.labelErr,1)+'에 잘못 적힌 센서 값이 있습니다. 이 라벨로 판정기를 학습하면 그만큼 틀린 입력으로 배웁니다. 오기는 주로 기계가 60 °C를 넘는 시간대에 몰립니다.':'라벨 오기율 '+pct(R.labelErr,2)+' — 센서 18개가 각각 0.1%씩 틀릴 수 있어서 열이 없어도 약 1.8%는 남습니다.']]);}
$('#l-prev').onclick=function(){LI=Math.max(0,LI-1);labelCard();};$('#l-next').onclick=function(){LI=Math.min(R.labels.length-1,LI+1);labelCard();};
$('#l-bad').onclick=function(){var L=R.labels;for(var k=1;k<=L.length;k++){var j=(LI+k)%L.length;if(L[j].err){LI=j;break;}}labelCard();};
function download(name,text){try{var b=new Blob(['﻿'+text],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);}catch(e){alertBox(text);}}
function alertBox(t){var w=window.open('','_blank');if(w){w.document.write('<pre>'+U.esc(t)+'</pre>');}}
$('#l-csv').onclick=function(){var L=R.labels;if(!L.length)return;var hd=['cell_id','day','hour'].concat(L[0].vals.map(function(v){return ST[v.st].id+'_'+v.name+'('+v.unit+')';})).concat(['label_error','error_sensors']);
  var rows=L.map(function(l){return [l.id,l.day,l.hour].concat(l.vals.map(function(v){return v.v.toFixed(v.dp);})).concat([l.err?1:0,'"'+l.errSens.join('; ')+'"']).join(',');});download('battery_labels.csv',hd.join(',')+'\n'+rows.join('\n'));};

/* ══ 병목 ══ */
var SWEEP=null,SWK='';
function sweep(){var key=JSON.stringify([CFG.hours,CFG.start,CFG.cool,CFG.extra,CFG.verify]);if(SWK===key)return SWEEP;SWK=key;SWEEP=[];
  for(var s=0.8;s<1.401;s+=0.05){var c=FS.clone(CFG);c.speed=+s.toFixed(2);var o=FS.run(c);SWEEP.push({s:c.speed,good:o.perDay.good,uF:o.util[FORM],uS:o.util[STACK],def:o.defectRate,esc:o.escRate,profit:o.perDay.profit,lab:o.labelErr});}return SWEEP;}
function drawBn(){var cv=$('#cvBn'),Rr=U.setup(cv),g=Rr.g,w=Rr.w,h=Rr.h;U.grid24(g,w,h);var o=R,L=40,T=20,B=40,W=w-L-12,Hh=h-T-B,bw=W/NS;
  var qm=Math.max(100,Math.max.apply(null,o.qmax));
  for(var i=0;i<NS;i++){var x=L+i*bw+bw*0.15,u=o.util[i],bh=u*Hh;g.fillStyle=i===o.bottleneck?C.amber:'rgba(30,85,200,.45)';g.fillRect(x,T+Hh-bh,bw*0.7,bh);
    g.fillStyle=C.text;g.font='11px '+cssv('--font');g.textAlign='center';g.fillText(pct(u,0),x+bw*0.35,T+Hh-bh-4);g.fillStyle=C.muted;g.fillText(ST[i].name.slice(0,5),x+bw*0.35,T+Hh+14);
    var qy=T+Hh-o.qmax[i]/qm*Hh;g.beginPath();g.arc(x+bw*0.35,qy,4,0,7);g.fillStyle=C.eye;g.fill();}
  g.strokeStyle=C.rule;g.beginPath();g.moveTo(L,T);g.lineTo(L,T+Hh);g.lineTo(L+W,T+Hh);g.stroke();g.fillStyle=C.muted;g.textAlign='left';g.font='11.5px '+cssv('--font');g.fillText('막대 = 가동률 (가동 시간 평균) · 빨간 점 = 앞 대기열 최대 (최고 '+n0(qm)+'셀)',L+4,12);
  g.textAlign='right';[0,50,100].forEach(function(t){g.fillText(t+'%',L-4,T+Hh-t/100*Hh+4);});U.stamp(g,w,'설명용 모형');}
function drawBn2(){var sw=sweep(),cv=$('#cvBn2'),gm=Math.max.apply(null,sw.map(function(x){return x.good;}))*1.1;
  var o=U.plot(cv,{xr:[0.8,1.4],yr:[0,gm],xt:[0.8,0.9,1.0,1.1,1.2,1.3,1.4],yt:[0,Math.round(gm/2/100)*100,Math.round(gm/100)*100],xl:'라인 속도 배율',yl:'하루 양품 셀',series:[{pts:sw.map(function(x){return [x.s,x.good];}),color:C.gfp,width:2.4,dots:3,name:'하루 양품',ndy:-12},{pts:sw.map(function(x){return [x.s,x.uF*gm];}),color:C.amber,width:2,name:'화성 가동률 (꼭대기 = 100%)',ndy:14}],vlines:[{x:CFG.speed,color:C.info,label:'지금 '+fmt(CFG.speed,2)+'×'}],stamp:'설명용 모형'});
  var sF=sw.filter(function(x){return x.uF>0.995;})[0];
  U.ins($('#i-bn'),[['a','지금 병목은 <b>'+ST[R.bottleneck].name+'</b>(가동률 '+pct(R.util[R.bottleneck],0)+')입니다.'+(sF?' 속도를 '+fmt(sF.s,2)+'× 넘게 올리면 화성 가동률이 100%에 붙어, 양품이 거의 늘지 않습니다.':'')],
    ['g','양품을 늘리려면 병목(화성) 설비를 먼저 늘려야 합니다. 화성을 충분히 늘리면 다음 병목은 적층(최대 속도 1.2×)입니다. 지금 적층 가동률 '+pct(R.util[STACK],0)+'.']]);}

/* ══ 불량 ══ */
function drawDef(){var sw=sweep();var dm=Math.max(0.08,Math.max.apply(null,sw.map(function(x){return x.def;}))*1.15);
  U.plot($('#cvDef'),{xr:[0.8,1.4],yr:[0,dm*100],xt:[0.8,1.0,1.2,1.4],yt:[0,Math.round(dm*50),Math.round(dm*100)],xl:'라인 속도 배율',yl:'%',series:[{pts:sw.map(function(x){return [x.s,x.def*100];}),color:C.eye,width:2.4,dots:3,name:'공정 불량률',ndy:-12},{pts:sw.map(function(x){return [x.s,x.esc*100*10];}),color:C.stain,width:2,name:'유출률 ×10',ndy:14}],vlines:[{x:CFG.speed,color:C.info}],stamp:'설명용 모형'});
  var pm=Math.max.apply(null,sw.map(function(x){return Math.abs(x.profit);}))*1.1/1e6;
  U.plot($('#cvDef2'),{xr:[0.8,1.4],yr:[-pm,pm],xt:[0.8,1.0,1.2,1.4],yt:[-Math.round(pm),0,Math.round(pm)],xl:'라인 속도 배율',yl:'하루 이익 (백만 원)',series:[{pts:sw.map(function(x){return [x.s,x.profit/1e6];}),color:C.gfp,width:2.4,dots:3}],hlines:[{y:0,color:C.muted}],vlines:[{x:CFG.speed,color:C.info}],stamp:'설명용 모형'});
  var best=sw.slice().sort(function(a,b){return b.profit-a.profit;})[0];
  $('#def-minis').innerHTML=mini('','지금 공정 불량률',pct(R.defectRate,2))+mini('','지금 출하 유출률',pct(R.escRate,2))+mini('g','이 조건에서 이익이 가장 큰 속도',fmt(best.s,2)+'× ('+won(best.profit)+')');
  U.ins($('#i-def'),[['a','속도를 올리면 처리량은 병목까지만 늘고, 불량은 모든 공정에서 함께 늡니다. 이 조건에서 이익은 '+fmt(best.s,2)+'×에서 가장 크고, 그보다 빠르면 불량·열·재공품 때문에 줄어듭니다.']]);}

/* ══ 열 ══ */
function drawHeat(){var o=R,H=o.hours.length,mx=[];for(var i=0;i<NS;i++){var m=0;o.hours.forEach(function(h){m=Math.max(m,h.T[i]);});mx.push([m,i]);}mx.sort(function(a,b){return b[0]-a[0];});
  var cols=[C.eye,C.amber,C.stain],ser=mx.slice(0,3).map(function(x,k){return {pts:o.hours.map(function(h){return [h.h/24,h.T[x[1]]];}),color:cols[k],width:1.8,name:ST[x[1]].name,ndy:-12+k*12};});
  var ym=Math.max(80,mx[0][0]+5);
  U.plot($('#cvHeat'),{xr:[0,7],yr:[20,ym],xt:[0,1,2,3,4,5,6,7],yt:[20,40,60,80].filter(function(t){return t<=ym;}),xl:'일',yl:'기계 온도 °C',series:ser,hlines:[{y:K.tSafe,color:C.amber,label:'55 °C 불량 증가',left:true},{y:K.tSens,color:C.eye,label:'60 °C 센서 오기 시작',left:true}],stamp:'설명용 모형'});
  var Lpts=o.hours.filter(function(h){return h.L!=null&&h.ship>0;}).map(function(h){return [h.h/24,h.L*100];}),lm=Math.max(5,Math.max.apply(null,Lpts.map(function(p){return p[1];}).concat([0]))*1.15);
  U.plot($('#cvHeat2'),{xr:[0,7],yr:[0,lm],xt:[0,1,2,3,4,5,6,7],yt:[0,Math.round(lm/2),Math.round(lm)],xl:'일',yl:'라벨 오기율 %',series:[{pts:Lpts,color:C.stain,width:1.8}],hlines:[{y:3,color:C.amber,label:'기준 3%',left:true}],stamp:'설명용 모형'});
  U.ins($('#i-heat'),[[o.labelErr>FS.LMAX?'r':'g','가장 뜨거운 공정은 '+ST[mx[0][1]].name+'('+fmt(mx[0][0],1)+' °C)입니다. '+(CFG.hours>=24?'24시간 가동이라 식을 틈이 없습니다. ':'쉬는 '+(24-CFG.hours)+'시간 동안 식습니다. ')+'7일 라벨 오기율 '+pct(o.labelErr,2)+'.']]);}
function cmpHeat(h,c){var o=FS.clone(CFG);o.hours=h;o.cool=c;setCfg(o);document.getElementById('heat').scrollIntoView({behavior:U.reduce?'auto':'smooth'});}
$('#h-16').onclick=function(){cmpHeat(16,1);};$('#h-24').onclick=function(){cmpHeat(24,1);};$('#h-24c').onclick=function(){cmpHeat(24,2);};

/* ══ 전기료 ══ */
function drawPow(){var o=R,hs=o.hours.slice(0,48),cv=$('#cvPow'),Rr=U.setup(cv),g=Rr.g,w=Rr.w,h=Rr.h;U.grid24(g,w,h);var L=46,T=20,B=34,W=w-L-46,Hh=h-T-B,km=Math.max.apply(null,hs.map(function(x){return x.kw;}))*1.1,bw=W/48;
  hs.forEach(function(x,i){var bh=x.kw/km*Hh,c=x.price===210?'rgba(201,48,44,.55)':x.price===140?'rgba(163,92,0,.45)':'rgba(30,85,200,.4)';g.fillStyle=c;g.fillRect(L+i*bw+0.5,T+Hh-bh,bw-1,bh);});
  g.strokeStyle=C.text;g.lineWidth=1.6;g.beginPath();hs.forEach(function(x,i){var y=T+Hh-(x.price/250)*Hh;i?g.lineTo(L+i*bw+bw/2,y):g.moveTo(L+i*bw+bw/2,y);});g.stroke();
  g.strokeStyle=C.rule;g.lineWidth=1;g.beginPath();g.moveTo(L,T);g.lineTo(L,T+Hh);g.lineTo(L+W,T+Hh);g.stroke();g.fillStyle=C.muted;g.font='11px '+cssv('--font');g.textAlign='center';[0,6,12,18,24,30,36,42,48].forEach(function(t){g.fillText((t%24)+'시',L+t*bw,T+Hh+14);});
  g.textAlign='right';[0,0.5,1].forEach(function(f){g.fillText(n0(km*f),L-4,T+Hh-f*Hh+4);});g.textAlign='left';[95,140,210].forEach(function(p){g.fillText(p+'원',L+W+4,T+Hh-(p/250)*Hh+4);});
  g.fillText('막대 = 전력 kW (파랑 경부하 · 갈색 중간 · 빨강 최대부하) · 선 = 요금 원/kWh',L+4,12);U.stamp(g,w,'예시 요금표');
  var pts=[];for(var s=0;s<24;s++){var c=FS.clone(CFG);c.start=s;var oo=FS.run(c);pts.push([s,oo.perDay.elec/1e4]);}
  var pm=Math.max.apply(null,pts.map(function(p){return p[1];}))*1.1,lo=pts.slice().sort(function(a,b){return a[1]-b[1];})[0];
  U.plot($('#cvPow2'),{xr:[0,23],yr:[0,pm],xt:[0,4,8,12,16,20,23],yt:[0,Math.round(pm/2),Math.round(pm)],xl:'가동 시작 시각 (시)',yl:'하루 전기료 (만 원)',series:[{pts:pts,color:C.amber,width:2.2,dots:3}],vlines:[{x:CFG.start,color:C.info,label:'지금 '+CFG.start+'시'}],stamp:'예시 요금표'});
  var d=o.perDay,base=K.baseKW*24;
  $('#pow-minis').innerHTML=mini('','하루 전력량',n0(d.kwh)+' kWh')+mini('','그중 기본 부하 (24시간)',n0(base)+' kWh')+mini('a','하루 전기료',won(d.elec))+mini('g','가장 싼 시작 시각',CFG.hours>=24?'24시간이라 없음':lo[0]+'시 ('+won(lo[1]*1e4)+')');
  U.ins($('#i-pow'),[[CFG.hours>=24?'a':'g',CFG.hours>=24?'24시간 가동이라 시작 시각을 바꿔도 전기료가 같습니다. 셀당 전기료 '+n0(o.elecPerGood)+'원.':'같은 '+CFG.hours+'시간이라도 '+lo[0]+'시에 시작하면 하루 전기료가 '+won(lo[1]*1e4)+'로, 지금('+CFG.start+'시)보다 '+won(d.elec-lo[1]*1e4)+' 적습니다. 최대부하 시간대(11~12시, 13~18시)를 피하는 것이 핵심입니다.']]);}

/* ══ 자동 최적화 ══ */
function optTables(){if(!OPT)return;var b=OPT.best,me=R;
  function row(name,o,c){return '<tr><td>'+name+'</td><td>'+cfgText(c)+'</td><td>'+n0(o.perDay.good)+'</td><td>'+pct(o.defectRate,2)+'</td><td>'+pct(o.labelErr,2)+'</td><td>'+won(o.perDay.elec)+'</td><td><b>'+won(o.perDay.profit)+'</b></td></tr>';}
  $('#o-tb').innerHTML='<thead><tr><th></th><th>설정</th><th>양품/일</th><th>불량률</th><th>라벨 오기율</th><th>전기료/일</th><th>이익/일</th></tr></thead><tbody>'+row('자동 최적',b,b.cfg)+row('지금 내 설정',me,CFG)+row('기본 설정',BASE,FS.defaults())+'</tbody>';
  $('#o-top').innerHTML='<thead><tr><th>#</th><th>설정</th><th>이익/일</th><th>최적 대비</th></tr></thead><tbody>'+OPT.top.map(function(o,i){return '<tr class="'+(i===0?'me':'')+'"><td>'+(i+1)+'</td><td>'+cfgText(o.cfg)+'</td><td>'+won(o.perDay.profit)+'</td><td>'+pct(o.perDay.profit/b.perDay.profit,1)+'</td></tr>';}).join('')+'</tbody>';
  var last=OPT.top[OPT.top.length-1],gap=(b.perDay.profit-last.perDay.profit)/b.perDay.profit;
  U.ins($('#i-opt'),[['g',OPT.n.toLocaleString('ko-KR')+'가지 가운데 라벨 오기율 3% 이하에서 하루 이익이 가장 큰 설정은 "'+cfgText(b.cfg)+'"로 '+won(b.perDay.profit)+'입니다. 지금 내 설정은 그 '+pct(me.perDay.profit/b.perDay.profit,0)+'입니다.'],
    ['a','상위 10개의 이익 차이는 '+pct(gap,1)+' 안입니다. 꼭대기가 평평해서 비슷하게 좋은 운전이 여럿 있습니다. 이럴 때는 설비 투자가 적고, 열 여유가 큰 쪽을 고르는 것이 안전합니다.']]);kit();}
$('#o-run').onclick=function(){var btn=this;btn.disabled=true;$('#o-prog').textContent='0%';FS.optimize(function(res){OPT=res;btn.disabled=false;$('#o-apply').disabled=false;$('#o-prog').textContent='완료 · '+n0(res.n)+'가지';optTables();},function(i,n){$('#o-prog').textContent=Math.round(i/n*100)+'% · '+n0(i)+' / '+n0(n);});};
$('#o-apply').onclick=function(){if(OPT)setCfg(OPT.best.cfg);};

/* ══ 실습 키트 ══ */
var KITS=[
 {k:'K1',t:'병목 찾기',g:'속도를 1.2× 이상으로 올리고, 아래에서 병목 공정을 고르세요.',h:'공정 표의 가동률과 병목 그래프의 대기열을 보세요.'},
 {k:'K2',t:'병목 풀어 증산하기',g:'속도 1.2× 이상에서 화성 가동률을 95% 밑으로 내리고, 하루 양품을 기본보다 10% 이상 늘리세요.',h:'화성 설비를 늘립니다. 병목이 어디로 옮겨 가는지도 보세요.'},
 {k:'K3',t:'24시간 열 관리',g:'24시간 가동에서 라벨 오기율 3% 이하, 공정 불량률 4% 이하를 만드세요.',h:'냉각 단계와 속도를 함께 봅니다.'},
 {k:'K4',t:'전기료 줄이기',g:'24시간이 아닌 가동에서, 하루 양품을 기본과 ±2% 안으로 유지하며 셀당 전기료를 기본보다 15% 이상 줄이세요.',h:'가동 시간은 그대로 두고 시작 시각을 옮겨 보세요.'},
 {k:'K5',t:'종합 최적화',g:'라벨 오기율 3% 이하에서 하루 이익을 자동 최적값의 97% 이상으로 만드세요.',h:'자동 최적화를 먼저 돌려 목표값을 확인하세요. 답은 하나가 아닙니다.'}];
function kitState(){var o=R,b=BASE,res=[];
  res.push(CFG.speed<1.195?['run','속도를 1.2× 이상으로 올리세요']:K1PICK<0?['run','병목 공정을 고르세요']:K1PICK===o.bottleneck?['ok','정답: '+ST[o.bottleneck].name]:['ng','다시: '+ST[K1PICK].name+'은 가동률 '+pct(o.util[K1PICK],0)]);
  var g2=o.perDay.good/b.perDay.good-1;res.push(CFG.speed<1.195?['run','속도 1.2× 이상에서']:(o.util[FORM]<0.95&&g2>=0.1)?['ok','화성 '+pct(o.util[FORM],0)+' · 양품 +'+pct(g2,0)]:['ng','화성 '+pct(o.util[FORM],0)+' · 양품 '+(g2>=0?'+':'')+pct(g2,0)]);
  res.push(CFG.hours<24?['run','24시간 가동으로 바꾸세요']:(o.labelErr<=0.03&&o.defectRate<=0.04)?['ok','오기 '+pct(o.labelErr,1)+' · 불량 '+pct(o.defectRate,1)]:['ng','오기 '+pct(o.labelErr,1)+' · 불량 '+pct(o.defectRate,1)]);
  var dg=Math.abs(o.perDay.good/b.perDay.good-1),de=o.elecPerGood/b.elecPerGood-1;res.push(CFG.hours>=24?['run','24시간이 아닌 가동에서']:(dg<=0.02&&de<=-0.15)?['ok','셀당 전기료 '+pct(de,0)]:['ng','양품 차이 '+pct(dg,1)+' · 셀당 전기료 '+(de>=0?'+':'')+pct(de,0)]);
  res.push(!OPT?['run','자동 최적화를 먼저 돌리세요']:(o.labelErr<=0.03&&o.perDay.profit>=0.97*OPT.best.perDay.profit)?['ok','최적의 '+pct(o.perDay.profit/OPT.best.perDay.profit,1)]:['ng','최적의 '+pct(o.perDay.profit/OPT.best.perDay.profit,1)+(o.labelErr>0.03?' · 오기 초과':'')]);
  return res;}
var KDONE={};
var LAMP={wait:['','대기'],run:['run','진행 중'],ok:['ok','합격'],ng:['ng','아직']};
function lamp(st){var l=LAMP[st]||LAMP.wait;return '<span class="lamp '+l[0]+'">'+l[1]+'</span>';}
function kit(){var s=kitState();s.forEach(function(x,i){if(x[0]==='ok')KDONE[i]=1;});
  $('#kitgrid').innerHTML=KITS.map(function(k,i){var x=s[i],done=KDONE[i];return '<div class="kitc"><h4>'+k.k+' '+k.t+' '+lamp(x[0]==='ok'?'ok':done?'ok':x[0])+'</h4><p class="goal">'+k.g+'</p><p>힌트: '+k.h+'</p><p class="st">지금: '+x[1]+(done&&x[0]!=='ok'?' (한 번 합격함)':'')+'</p></div>';}).join('');
  var n=Object.keys(KDONE).length;$('#kitbar').style.width=(n*20)+'%';$('#kittxt').textContent='완료 '+n+' / 5';}
U.btns($('#g-k1'),ST.map(function(st,i){return [i,st.name];}),-1,function(v){K1PICK=v;kit();});
function logTable(){$('#k-n').textContent=LOG.length+'개 기록';$('#k-tb').innerHTML='<thead><tr><th>#</th><th>설정</th><th>양품/일</th><th>불량률</th><th>라벨 오기율</th><th>병목</th><th>전기료/일</th><th>이익/일</th></tr></thead><tbody>'+
  LOG.map(function(x,i){return '<tr><td>'+(i+1)+'</td><td>'+x.c+'</td><td>'+n0(x.good)+'</td><td>'+pct(x.def,2)+'</td><td>'+pct(x.lab,2)+'</td><td>'+x.bn+'</td><td>'+won(x.elec)+'</td><td>'+won(x.profit)+'</td></tr>';}).join('')+'</tbody>';}
$('#c-log').onclick=function(){LOG.push({c:cfgText(CFG),cfg:FS.clone(CFG),good:R.perDay.good,def:R.defectRate,lab:R.labelErr,bn:ST[R.bottleneck].name,elec:R.perDay.elec,profit:R.perDay.profit});logTable();this.textContent='기록함 ('+LOG.length+')';};
$('#k-clear').onclick=function(){LOG=[];logTable();$('#c-log').textContent='기록지에 남기기';};
$('#k-csv').onclick=function(){if(!LOG.length)return;var hd='no,speed,hours,start,cool,form_extra,stack_extra,verify,good_per_day,defect_rate,label_error_rate,bottleneck,elec_per_day,profit_per_day';
  download('factory_log.csv',hd+'\n'+LOG.map(function(x,i){var c=x.cfg;return [i+1,c.speed,c.hours,c.start,c.cool,c.extra[FORM]||0,c.extra[STACK]||0,c.verify,Math.round(x.good),x.def.toFixed(4),x.lab.toFixed(4),x.bn,Math.round(x.elec),Math.round(x.profit)].join(',');}).join('\n'));};

/* ══ 대사 ══ */
var DLG={
 hero:[["doc","doc_front","오늘은 판정기·예측 장치가 배울 데이터를 만드는 곳, 배터리 생산 공장을 돌려 봅니다. 사람은 없고 기계 10대가 셀을 만들어요."],
       ["asst","asst_smile","셀마다 센서 값 18개가 라벨에 적혀요. 7일을 한 시간 단위로 계산하고, 숫자는 제가 읽어 드릴게요."],
       ["robo","robo_coin","기계는 쉬면 손해지. 속도 올리고 24시간 돌리면 끝 아니야?"],
       ["fly","fly_point","뜨거워진 기계가 적은 숫자를 믿을 거야? 라벨이 틀리면 판정기도 틀려."]],
 plant:[["sia","sia_explain","P3 코팅에서 두께를 재요. 기계가 뜨거우면 제 센서도 흔들려요. 막대가 빨개지면 봐 주세요."],["moa","moa_report","P4 건조 오븐은 전기를 많이 먹어요. 쉬는 시간에도 드라이룸은 계속 켜져 있고요."]],
 control:[["asst","asst_report","하루 이익에는 재료비·유출 비용·전기료·설비비가 다 들어가요. 양품 개수만 보면 안 돼요."]],
 label:[["fly","fly_magnify","주황 줄 보여? 실제로는 4.20 V인데 라벨엔 42.0이야. 자리 바뀜. 이런 줄로 판정기를 가르치면 어떻게 될까."]],
 bottleneck:[["robo","robo_calc","속도 1.3배면 하루 1.3배 생산… 어? 양품이 거의 안 늘었잖아. 화성 앞에 셀만 쌓였어."]],
 defect:[["asst","asst_report","속도를 1.3배로 올리면 열이 없어도 공정 불량이 약 1.8배예요. 검사가 다 잡지 못한 셀은 유출 비용이 15만 원씩이에요."]],
 heat:[["fly","fly_point","24시간 돌리면 기계가 식을 틈이 없어. 60도를 넘으면 센서가 거짓말을 시작해."]],
 power:[["moa","moa_report","같은 16시간인데 밤 10시에 시작하면 전기료가 확 줄어요. 최대부하 시간대를 피하니까요."]],
 optimize:[["doc","doc_board","무엇을 최대로 할지, 무엇은 넘지 말지를 먼저 정합니다. 목표 함수와 제약. 1·2편의 손실 함수와 같은 생각이에요."]],
 kit:[["asst","asst_smile","미션마다 램프가 있어요. 시도할 때마다 기록지에 남겨 두면, 나중에 무엇을 바꿨을 때 무엇이 변했는지 보여요."]],
 dfly:[["fly","fly_point","밤에 싼 전기로 16시간. 낮에는 식히고. 라벨이 깨끗해야 데이터로 쓰지."]],
 drobo:[["robo","robo_coin","설비는 24시간 일해야 본전이야. 화성 한 대 더 사고 속도 1.1배."]],
 outro:[["doc","doc_magic","오늘의 세 줄입니다.<br>① 생산량은 병목이 정한다. 병목을 먼저 찾고, 병목을 풀면 다음 병목을 찾는다.<br>② 빠르게, 오래 돌리면 열이 쌓여 불량과 라벨 오기가 는다. 라벨 오기는 AI 학습 데이터의 오염이다.<br>③ 최적 운전은 목표 함수(이익)와 제약(데이터 품질)을 정한 뒤 찾는다. 꼭대기가 평평하면 안전한 쪽을 고른다."],
        ["robo","robo_happy","냉각을 2단으로 올리니 24시간이 맞는 투자였지."],
        ["fly","fly_coffee","냉각이 1단뿐이면 내가 이겼잖아. 조건이 답을 바꾼 거야."],
        ["asst","asst_smile","라벨 CSV는 판정기 페이지로 가져가 보세요. 오염된 줄이 섞이면 어떻게 되는지는 2편에서 같이 봐요."]]
};
U.dialogues(DLG);
var CAST=[["doc","doc_front","박사","해설과 판정. 판정은 늘 계산한 숫자대로."],["asst","asst_smile","조수 하루","시뮬레이션을 돌리고 숫자를 발표해요."],["fly","fly_point","초파리 연구원","의심하는 쪽. 열·데이터 품질·안전 운전을 챙겨요."],["robo","robo_coin","주판봇","확신하는 쪽. 생산량과 가동률에 걸어요."],["sia","sia_explain","인턴 시아","코팅 공정 담당. 센서를 챙겨요."],["moa","moa_report","인턴 모아","건조 공정·전력 기록 담당."]];
$('#castgrid').innerHTML=CAST.map(function(c){return '<div class="castc" style="--cc:var(--c-'+c[0]+')"><img src="'+U.spr(c[1])+'" alt="" aria-hidden="true"><div><b>'+c[2]+'</b><p>'+c[3]+'</p></div></div>';}).join('');
$('#secretrow').innerHTML=['x1','x2','x3'].map(function(x,i){return U.say(x,x+'_hint',['(반짝)','(…끄덕)','(짝짝짝)'][i]);}).join('');
$('#secretbtn').onclick=function(){var r=$('#secretrow');r.hidden=!r.hidden;this.setAttribute('aria-expanded',String(!r.hidden));this.textContent=r.hidden?'방청석 보기 (미공개 식구)':'방청석 닫기';};
U.fillImgs();

/* ══ 표지 대체 그림 ══ */
function batt(g,x,y,s,bad){g.save();var w=s*1.8,h=s*1.1,x0=x-w/2,y0=y-h/2;g.fillStyle=bad?'#f3c9c7':'#d8eef0';g.strokeStyle=bad?C.eye:C.terrain;g.lineWidth=1.5;g.beginPath();g.roundRect?g.roundRect(x0,y0,w,h,s*.12):g.rect(x0,y0,w,h);g.fill();g.stroke();
  g.lineWidth=1;g.globalAlpha=0.55;for(var k=1;k<5;k++){g.beginPath();g.moveTo(x0+w*k/5,y0+h*0.15);g.lineTo(x0+w*k/5,y0+h*0.85);g.stroke();}g.globalAlpha=1;g.fillStyle=bad?C.eye:C.terrain;g.fillRect(x0+w*0.15,y0-s*0.18,s*0.28,s*0.18);g.fillRect(x0+w*0.85-s*0.28,y0-s*0.18,s*0.28,s*0.18);g.restore();}
(function(){var cv=$('#cvCover');if(!cv)return;U.reg(cv,function(dt){if(dt)return;var R0=U.setup(cv),g=R0.g,w=R0.w,h=R0.h;var gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#eef4f8');gr.addColorStop(1,'#ffffff');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.strokeStyle='rgba(22,33,43,.12)';g.lineWidth=2;g.beginPath();g.moveTo(w*0.04,h*0.3);g.lineTo(w*0.96,h*0.3);g.stroke();
  for(var i=0;i<10;i++){var bx=w*(0.06+i*0.098);g.fillStyle=['#f3c9c7','#f3c9c7','#f3c9c7','#f3c9c7','#f3c9c7','#e7d3f0','#e7d3f0','#e7d3f0','#cfe0f8','#cfe0f8'][i];g.fillRect(bx-w*0.03,h*0.12,w*0.06,h*0.14);batt(g,bx+w*0.045,h*0.3,w*0.012,i===6);}});})();

/* ══ 3D 배터리 생산 공장 ══ */
var Plant={};
(function(){var cv=$('#cvPlant'),narrow=(cv.clientWidth||window.innerWidth)<600,yaw=narrow?-0.15:-0.5,pitch=narrow?1.2:0.82,play=!U.reduce,hr=CFG.start+3,spd=4,sel=-1,t=0;
  var PR=[{id:'P1',name:'원료 입고',cat:'f',desc:'양극·음극 활물질, 분리막, 전해액, 파우치가 들어옵니다. 원료 대기열이 차면 투입을 멈춥니다.'}];
  ST.forEach(function(st,i){PR.push({id:'P'+(i+2),name:st.name,cat:i<5?'e':i<8?'a':'v',st:i,desc:st.name+' 공정. 라벨에 적히는 센서: '+st.sens.map(function(s){return s[0]+'('+s[1]+')';}).join(', ')+'.'});});
  PR.push({id:'P12',name:'출하',cat:'f',desc:'검사를 통과한 셀이 라벨과 함께 팩 공장으로 나갑니다. 라벨 데이터는 ① 판정기·② 예측 장치의 학습 데이터가 됩니다.',ship:true});
  var WHO={1:['asst',0.9],2:['sia',0.88],3:['moa',0.86],5:['robo',0.72],7:['fly',0.41],10:['doc',1.0]},SHEET={doc:'D1',asst:'A1',sia:'S1',moa:'M1',fly:'F1',robo:'R1'},MOOD={doc:'doc_judge',asst:'asst_report',sia:'sia_guide',moa:'moa_report',fly:'fly_magnify',robo:'robo_chart'};
  var IM={};Object.keys(WHO).forEach(function(k){var im=new Image();im.src=U.spr(MOOD[WHO[k][0]]);IM[k]=im;});
  var XS=[-10,-6,-2,2,6,10];PR.forEach(function(p,i){var row=i<6?0:1;p.x=row?XS[5-(i-6)]:XS[i];p.y=row?4.6:-4.6;p.by=row?2.4:-2.4;p.h=[1.4,1.6,1.8,2.2,1.8,1.4,1.7,1.8,1.6,2.4,1.9,1.4][i];});
  var CAT={f:['#fbecd3','#ecc98f','#dfb46e'],e:['#f9dcda','#e8b1ad','#d79591'],a:['#efe0f6','#d6b7e6','#c39bd9'],v:['#dfeafb','#b4cdf2','#9ab9ea']};
  var cx,cy,sc;function P(x,y,z){var c=Math.cos(yaw),s=Math.sin(yaw),rx=x*c-y*s,ry=x*s+y*c,cp=Math.cos(pitch),sp=Math.sin(pitch);return [cx+rx*sc,cy+(-z*cp-ry*sp)*sc,ry*cp-z*sp];}
  function fwd(){var c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return [s*cp,c*cp,-sp];}
  function poly(g,pts,fill,stroke,dash){g.beginPath();pts.forEach(function(p,k){k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){if(dash)g.setLineDash(dash);g.strokeStyle=stroke;g.stroke();g.setLineDash([]);}}
  function box(g,x,y,z0,w,d,h,cols,hl,dash){var F=fwd(),x0=x-w/2,x1=x+w/2,y0=y-d/2,y1=y+d/2,z1=z0+h;
    var faces=[[[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],0],[[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],1],[[0,1,0],[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],1],[[-1,0,0],[[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],2],[[1,0,0],[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],2]];
    g.lineWidth=hl?2.4:1;faces.forEach(function(f){var n=f[0];if(n[0]*F[0]+n[1]*F[1]+n[2]*F[2]>=0)return;poly(g,f[1].map(function(p){return P(p[0],p[1],p[2]);}),cols[f[2]],hl?hl:'rgba(22,33,43,.35)',dash);});}
  var PATH=[[-13.5,-2.4],[12.6,-2.4],[13.6,-1.2],[13.6,1.2],[12.6,2.4],[-13.5,2.4]],SEG=[],TL=0;for(var i=1;i<PATH.length;i++){var l=Math.hypot(PATH[i][0]-PATH[i-1][0],PATH[i][1]-PATH[i-1][1]);SEG.push(l);TL+=l;}
  function along(u){u=((u%1)+1)%1;var d=u*TL;for(var i=0;i<SEG.length;i++){if(d<=SEG[i]){var f=d/SEG[i];return [PATH[i][0]+(PATH[i+1][0]-PATH[i][0])*f,PATH[i][1]+(PATH[i+1][1]-PATH[i][1])*f];}d-=SEG[i];}return PATH[PATH.length-1];}
  function heatCol(T){var u=clamp((T-25)/50,0,1);return 'rgb('+Math.round(30+200*u)+','+Math.round(110-60*u)+','+Math.round(200-160*u)+')';}
  function draw(dt){if(!R)return;if(play&&dt){t+=dt;hr+=dt*spd;if(hr>=R.hours.length)hr=0;$('#r-time').value=Math.floor(hr);}else if(dt)t+=dt;
    var H=R.hours[Math.min(R.hours.length-1,Math.floor(hr))],Rr=U.setup(cv),g=Rr.g,w=Rr.w,h=Rr.h;cx=w/2;cy=h*0.56;sc=Math.min(w/31,h/19);
    g.fillStyle=H.on?'#fbfcfd':'#eef1f6';g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(22,33,43,.07)';g.lineWidth=1;for(var x=-15;x<=15;x+=1.5){var a=P(x,-7.5,0),b=P(x,7.5,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}for(var y=-7.5;y<=7.5;y+=1.5){a=P(-15,y,0);b=P(15,y,0);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();}
    function beltSeg(x0,y0,x1,y1){var dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),nx=-dy/L*0.55,ny=dx/L*0.55;poly(g,[P(x0+nx,y0+ny,0.3),P(x1+nx,y1+ny,0.3),P(x1-nx,y1-ny,0.3),P(x0-nx,y0-ny,0.3)],'#d9dee5','rgba(22,33,43,.25)');}
    for(i=1;i<PATH.length;i++)beltSeg(PATH[i-1][0],PATH[i-1][1],PATH[i][0],PATH[i][1]);
    var items=[];
    PR.forEach(function(p,k){var cp=P(p.x,p.y,p.h/2);items.push({d:cp[2],f:function(){var si=p.st,isBn=si===R.bottleneck,hl=sel===k?C.gfp:isBn&&H.on?C.amber:null;
        box(g,p.x,p.y,0,2.6,2.0,p.h,CAT[p.cat],hl,isBn&&sel!==k?[6,4]:null);
        if(si!=null){var T=H.T[si],tb=clamp((T-25)/55,0.03,1)*1.6;box(g,p.x+1.05,p.y+0.75,p.h,0.22,0.22,tb,[heatCol(T),heatCol(T),heatCol(T)],false);
          var q=Math.max(0,H.q[si]),nq=Math.min(8,Math.ceil(q/75));for(var j=0;j<nq;j++)box(g,p.x-1.6,p.by+(p.y<0?-0.9:0.9),0.3+j*0.28,0.45,0.45,0.26,['#f6e2bf','#e2c08a','#cfa86a'],false);
          var e=H.e[si],lp=P(p.x-0.95,p.y-0.7,p.h+0.05),blink=e>0.02?(Math.floor(t*4)%2?1:0.35):1;g.beginPath();g.arc(lp[0],lp[1],4.5,0,7);g.fillStyle=e>0.02?C.eye:e>0.005?C.amber:C.gfp;g.globalAlpha=blink;g.fill();g.globalAlpha=1;}
        if(p.ship){var tp2=P(p.x,p.y,p.h);for(var m=0;m<3;m++)batt(g,tp2[0]-12+m*12,tp2[1]-6-m*2,sc*0.22,false);}
        var tp=P(p.x,p.y,p.h+0.5);g.beginPath();g.arc(tp[0],tp[1],11,0,7);g.fillStyle=sel===k?C.gfp:'#fff';g.fill();g.lineWidth=1.5;g.strokeStyle=sel===k?C.gfp:C.rule;g.stroke();
        g.fillStyle=sel===k?'#fff':C.text;g.font='700 10.5px '+cssv('--font');g.textAlign='center';g.textBaseline='middle';g.fillText(String(k+1),tp[0],tp[1]+0.5);g.textBaseline='alphabetic';
        if(sel===k||w>700||isBn){g.font=(sel===k||isBn?'700 ':'')+'11px '+cssv('--font');var lb=P(p.x,p.y,p.h+1.15);U.label(g,lb[0],lb[1],p.name+(isBn&&H.on?' · 병목':''),isBn?C.amber:sel===k?C.gfp:C.muted,'center');}}});
      if(WHO[k]){var fp=P(p.x+1.75,p.y,0),wh=WHO[k];items.push({d:fp[2]-0.01,f:function(){var hh=sc*(w<600?6.0:5.0)*wh[1];if(typeof drawMotion==='function'&&drawMotion(g,SHEET[wh[0]],'idle',t,fp[0],fp[1],hh,{fps:4}))return;var im=IM[k];if(im&&im.complete&&im.naturalWidth){var sz=sc*3.4*Math.max(0.6,wh[1]);g.drawImage(im,fp[0]-sz/2,fp[1]-sz,sz,sz);}}});}});
    /* 컨베이어 위 셀: 이 시간 출하량에 비례한 개수, 불량률만큼 빨강 */
    var n=H.on?clamp(Math.round(H.ship/25),2,18):0,defr=H.ship>0?(H.scrap+H.esc)/(H.ship+H.scrap):0;
    for(var c=0;c<n;c++){var u=(c/n+t*0.03)%1,pos=along(u),pp=P(pos[0],pos[1],0.55),bad=((c*7919)%100)/100<defr*3;(function(pp,bad){items.push({d:pp[2]-0.02,f:function(){batt(g,pp[0],pp[1]-sc*0.15,sc*0.2,bad);}});})(pp,bad);}
    items.sort(function(a,b){return b.d-a.d;}).forEach(function(it){it.f();});
    var day=Math.floor(H.h/24)+1,hh=H.h%24;
    g.fillStyle='rgba(255,255,255,.85)';g.fillRect(8,8,Math.min(w-16,300),46);g.strokeStyle=C.rule;g.strokeRect(8,8,Math.min(w-16,300),46);
    g.fillStyle=C.text;g.font='700 12.5px '+cssv('--font');g.textAlign='left';g.fillText(day+'일차 '+hh+'시 · '+(H.on?'라인 가동':'라인 멈춤 (식히는 중)'),16,26);
    g.font='12px '+cssv('--font');g.fillStyle=H.price===210?C.eye:H.price===140?C.amber:C.info;g.fillText(FS.band(hh)+' '+H.price+'원/kWh · '+n0(H.kw)+' kW · 출하 '+n0(H.ship)+'셀/시',16,44);
    U.stamp(g,w,'개략 모형 · 실제 공장 아님');
    $('#p-hud').textContent=day+'일차 '+hh+'시 · '+(H.on?'가동':'멈춤')+' · 라벨 오기율 '+(H.L!=null?pct(H.L,1):'—');
    card(sel>=0?sel:-1,H);}
  var lastKey='';
  function card(k,H){var key=k+'|'+H.h;if(key===lastKey)return;lastKey=key;
    if(k<0){$('#pc-no').textContent='공장 전체 · '+(Math.floor(H.h/24)+1)+'일차 '+(H.h%24)+'시';$('#pc-name').textContent='배터리 셀 자동화 라인';$('#pc-desc').textContent='공정을 누르면 그 기계의 센서와 상태가 보입니다. 노란 점선 상자가 병목입니다.';$('#pc-metric').textContent='지금 설정: '+cfgText(CFG);$('#pc-link').innerHTML='<a href="#control">조종실로 가기 →</a>';
      $('#plant-minis').innerHTML=mini('g','이 시간 출하',n0(H.ship)+'셀')+mini('','전력',n0(H.kw)+' kW')+mini(H.L>FS.LMAX?'r':'','라벨 오기율',H.L!=null?pct(H.L,1):'—')+mini('a','병목',ST[R.bottleneck].name);return;}
    var p=PR[k];$('#pc-no').textContent=p.id+' / 12';$('#pc-name').textContent=p.name;$('#pc-desc').textContent=p.desc;$('#pc-link').innerHTML='<a href="#line">공정 표로 가기 →</a>';
    if(p.st==null){$('#pc-metric').textContent=p.ship?'7일 출하 '+n0(R.perDay.good*7)+'셀, 라벨 표본 '+R.labels.length+'장':'투입 속도 '+n0(K.base*CFG.speed)+'셀/시';$('#plant-minis').innerHTML='';return;}
    var i=p.st,st=ST[i];$('#pc-metric').textContent='설비 '+(st.m+(CFG.extra[i]||0))+'대 × '+st.r+'셀/시 · 최대 속도 '+fmt(st.smax,2)+'×';
    $('#plant-minis').innerHTML=mini(i===R.bottleneck?'a':'','가동률 (이 시간)',pct(H.util[i],0))+mini(H.T[i]>K.tSens?'r':H.T[i]>K.tSafe?'a':'','기계 온도',fmt(H.T[i],1)+' °C')+mini('','앞 대기열',n0(Math.max(0,H.q[i]))+'셀')+mini(H.e[i]>0.02?'r':'','센서 오기 확률',pct(H.e[i],2))+mini('','공정 불량률',pct(H.p[i],2));}
  Plant.redraw=function(){lastKey='';if(!play)draw(0);};
  $('#pchips').innerHTML=PR.map(function(p){return '<button type="button">'+p.id+' '+p.name+'</button>';}).join('');
  $$('#pchips button').forEach(function(b,i){b.onclick=function(){sel=sel===i?-1:i;$$('#pchips button').forEach(function(x,j){x.classList.toggle('on',j===sel);});lastKey='';draw(0);};});
  var pb=$('#p-play');function setPlay(v){play=v;pb.textContent=v?'⏸ 멈춤':'▶ 재생';}setPlay(play);pb.onclick=function(){setPlay(!play);};
  $('#r-time').oninput=function(){hr=+this.value;setPlay(false);lastKey='';draw(0);};
  U.btns($('#g-pspd'),[[1,'1시간/초'],[4,'4시간/초'],[12,'12시간/초']],4,function(v){spd=v;});
  U.btns($('#g-pview'),[['a','비스듬히'],['t','위에서'],['l','낮게'],['L','⟲'],['R','⟳']],'a',function(v){if(v==='a'){yaw=-0.5;pitch=0.82;}else if(v==='t'){yaw=0;pitch=1.45;}else if(v==='l'){yaw=-0.75;pitch=0.32;}else if(v==='L')yaw-=0.35;else yaw+=0.35;draw(0);});
  var drag=null;cv.style.touchAction='pan-y';cv.style.cursor='grab';
  cv.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,yaw:yaw,pitch:pitch,mv:false};cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.mv=true;if(drag.mv){yaw=drag.yaw+dx*0.008;pitch=clamp(drag.pitch+dy*0.006,0.15,1.5);if(!play)draw(0);}});
  cv.addEventListener('pointerup',function(e){if(drag&&!drag.mv){var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,best=-1,bd=900;PR.forEach(function(p,k){[p.h+0.5,p.h*0.5].forEach(function(z){var q=P(p.x,p.y,z),d=(q[0]-mx)*(q[0]-mx)+(q[1]-my)*(q[1]-my);if(d<bd){bd=d;best=k;}});});
      if(best>=0){sel=best;$$('#pchips button').forEach(function(x,j){x.classList.toggle('on',j===sel);});lastKey='';draw(0);}}drag=null;});
  cv.addEventListener('pointercancel',function(){drag=null;});
  cv.tabIndex=0;cv.addEventListener('keydown',function(e){if(e.key==='ArrowLeft')yaw-=0.12;else if(e.key==='ArrowRight')yaw+=0.12;else if(e.key==='ArrowUp')pitch=clamp(pitch+0.1,0.15,1.5);else if(e.key==='ArrowDown')pitch=clamp(pitch-0.1,0.15,1.5);else return;e.preventDefault();draw(0);});
  U.reg(cv,function(dt){if(dt===0||play)draw(dt);});
})();

/* ══ 대결: 밤 16시간 vs 24시간 — 냉각 1단 · 2단 ══ */
(function(){var fi=$('#d-fly'),ri=$('#d-robo');
  function cfgF(c){var o=FS.defaults();o.hours=16;o.start=22;o.cool=c;return o;}
  function cfgR(c){var o=FS.defaults();o.hours=24;o.speed=1.1;o.extra[FORM]=1;o.cool=c;return o;}
  function judge(a,b){var fa=a.labelErr>FS.LMAX,fb=b.labelErr>FS.LMAX;if(fa&&fb)return 'D';if(fb)return 'F';if(fa)return 'R';var d=b.perDay.profit-a.perDay.profit;return Math.abs(d)<0.02*Math.max(a.perDay.profit,b.perDay.profit)?'D':d>0?'R':'F';}
  var lastPred=null;
  U.Duel({el:'#duel',run:function(){var out={};[1,2].forEach(function(c){var a=FS.run(cfgF(c)),b=FS.run(cfgR(c));out[c]={a:a,b:b,res:judge(a,b)};});return out;},
    show:function(o,pred){var A=o[1],B=o[2],res=A.res===B.res?A.res:'C',w={F:'초파리',R:'주판봇',D:'무승부'};
      var Mo={F:['fly_arms','robo_sigh','doc_judge','asst_spark'],R:['fly_coffee','robo_happy','doc_judge','asst_spark'],D:['fly_coffee','robo_meh','doc_think','asst_smile'],C:['fly_arms','robo_happy','doc_judge','asst_spark']}[res];
      U.setMood(fi,Mo[0]);U.setMood(ri,Mo[1]);
      function grp(t,x){var mx=Math.max(Math.abs(x.a.perDay.profit),Math.abs(x.b.perDay.profit))*1.1;function bar(nm,r,cls){var v=r.perDay.profit;return '<div class="resbar"><span style="color:var(--c-'+cls+')">'+nm+'</span><div class="bar"><i style="background:var(--c-'+cls+');width:'+Math.max(2,v/mx*100)+'%"></i></div><b>'+won(v)+'</b></div>';}
        function note(nm,r){return '<li>'+nm+': 양품 '+n0(r.perDay.good)+'셀/일 · 라벨 오기율 '+pct(r.labelErr,1)+(r.labelErr>FS.LMAX?' <b style="color:var(--eye)">실격(3% 초과)</b>':'')+' · 최고 '+fmt(r.tmax,0)+' °C</li>';}
        return '<h4 style="margin:10px 0 4px;font-size:14px">'+t+' → '+w[x.res]+'</h4><div class="resbars">'+bar('초파리 · 밤 16시간',x.a,'fly')+bar('주판봇 · 24시간',x.b,'robo')+'</div><ul class="mnote" style="margin:4px 0 8px;padding-left:18px">'+note('초파리',x.a)+note('주판봇',x.b)+'</ul>';}
      $('#d-bars').innerHTML='<p class="muted" style="font-size:13.5px;margin:0">막대 = 하루 이익(7일 평균). 라벨 오기율 3%를 넘으면 이익과 상관없이 실격입니다.</p>'+grp('가정 A — 냉각 설비 1단',A)+grp('가정 B — 냉각 설비 2단',B);
      $('#d-say').innerHTML=U.say('asst',Mo[3],'냉각 1단에서 주판봇의 라벨 오기율은 '+pct(A.b.labelErr,1)+', 초파리는 '+pct(A.a.labelErr,1)+'예요. 냉각 2단에서는 둘 다 '+pct(B.b.labelErr,1)+'이고, 하루 이익은 초파리 '+won(B.a.perDay.profit)+', 주판봇 '+won(B.b.perDay.profit)+'예요.')+
        U.say('doc',Mo[2],res==='C'?'조건부 판정이다. 냉각이 1단이면 '+w[A.res]+', 2단이면 '+w[B.res]+'. 24시간 가동은 열을 감당할 냉각이 있을 때만 이익이 된다. 데이터 품질 제약이 승부를 가른다.':res==='D'?'두 가정 모두 차이가 작다. 무승부.':'두 가정 모두 '+w[res]+' 쪽이다.',true);
      $('#d-score').textContent='판정: '+{F:'F 초파리 승',R:'R 주판봇 승',D:'D 무승부',C:'C 조건부 (A: '+w[A.res]+' · B: '+w[B.res]+')'}[res];
      $('#d-pred').textContent=pred?' · 내 예상: '+(pred==='fly'?'초파리':'주판봇')+(res==='C'?' — 반만 맞았어요 (냉각에 따라 갈려요)':((pred==='fly'&&res==='F')||(pred==='robo'&&res==='R')?' — 맞았어요':' — 빗나갔어요')):'';},
    reset:function(){U.setMood(fi,'fly_point');U.setMood(ri,'robo_coin');}});
})();

/* ══ 용어 · 퀴즈 ══ */
U.Gloss({
 '병목':['병목','공정','라인에서 가장 느린 공정. 라인 전체의 생산량을 정한다.'],
 '재공품':['재공품 (WIP)','공정','라인 위에서 아직 완성되지 않은 제품. 재료비는 이미 썼다.'],
 '가동률':['가동률','지표','설비가 처리할 수 있는 양 가운데 실제로 처리한 비율.'],
 '대기열':['대기열','공정','공정 앞에서 처리를 기다리는 셀들.'],
 '화성':['화성 (formation)','공정','조립한 셀을 처음으로 충·방전해 쓸 수 있는 상태로 만드는 공정. 오래 걸린다.'],
 '에이징':['에이징','공정','화성 뒤 셀을 묵혀 전압 변화로 숨은 불량을 찾는 공정.'],
 '드라이룸':['드라이룸','설비','습기를 아주 낮게 유지하는 방. 조립·주입 공정에 쓰며 전력을 많이 쓴다.'],
 '라벨':['셀 라벨 (이력 기록)','데이터','셀 번호에 묶여 공정마다의 센서 값을 기록한 것. AI 학습 데이터의 한 줄이 된다.'],
 '라벨 오기율':['라벨 오기율','지표','센서 값이 하나라도 잘못 적힌 라벨의 비율.'],
 '유출':['유출','품질','불량 셀이 검사를 통과해 출하되는 것.'],
 '시간대별 요금':['시간대별 요금','전력','시간대(경부하·중간·최대부하)에 따라 kWh 단가가 다른 요금제. 이 페이지 값은 예시.'],
 '목표 함수':['목표 함수','최적화','최대(또는 최소)로 만들 값. 이 페이지에서는 하루 이익.'],
 '제약':['제약','최적화','넘으면 안 되는 조건. 이 페이지에서는 라벨 오기율 3% 이하.'],
 '격자 탐색':['격자 탐색','최적화','후보 값을 칸처럼 나눠 모든 조합을 다 계산해 보는 방법.'],
 '차원의 저주':['차원의 저주','최적화','손잡이가 하나 늘 때마다 조합 수가 곱으로 늘어 다 훑기 어려워지는 현상.'],
 '리틀의 법칙':['리틀의 법칙','공정','평균 대기 수 = 도착률 × 평균 머무는 시간 (L = λW).']
},['병목','재공품','가동률','라벨','라벨 오기율','유출','목표 함수','제약']);
U.Study({quiz:{
 bottleneck:[{q:'화성 처리량이 시간당 315셀이고 투입이 360셀이면 라인의 출하량은?',o:['약 315셀/시 — 화성 앞에 셀이 쌓인다','360셀/시','675셀/시','0셀/시'],a:0,why:'가장 느린 공정이 라인 전체를 정합니다. 남는 45셀은 화성 앞 대기열(재공품)이 됩니다.',hint:'가장 약한 고리를 보세요.'},
   {q:'병목이 아닌 코팅 설비를 한 대 더 사면?',o:['생산량은 그대로, 설비비만 는다','생산량이 크게 는다','불량이 0이 된다','병목이 사라진다'],a:0,why:'라인 생산량은 병목이 정하므로, 병목이 아닌 곳을 늘려도 출하량은 변하지 않습니다.',hint:'K2와 비교해 보세요.'}],
 defect:[{q:'라벨이 잘못 적힌 셀이 검사를 더 잘 빠져나가는 까닭은?',o:['검사가 라벨의 측정값을 보고 판정하기 때문','라벨이 셀을 보호해서','잘못 적힌 셀은 불량이 아니라서','검사기가 꺼져서'],a:0,why:'측정값이 틀리면 검사 기준과 견주는 값 자체가 틀려, 불량을 양품으로 볼 수 있습니다.',hint:'검사는 무엇을 보고 판단할까요?'}],
 heat:[{q:'24시간 가동에서 라벨 오기율이 크게 오르는 직접 원인은?',o:['기계가 식을 틈이 없어 60 °C를 넘기 때문','전기료가 비싸서','셀이 너무 많아서','라벨 종이가 모자라서'],a:0,why:'이 모형에서 센서 오기 확률은 기계 온도가 60 °C를 넘으면 오릅니다. 쉬는 시간이 없으면 열이 쌓입니다.',hint:'온도 그래프의 60 °C 선.'}],
 optimize:[{q:'이 페이지의 최적화에서 "라벨 오기율 3% 이하"는 무엇일까요?',o:['제약','목표 함수','하이퍼파라미터','병목'],a:0,why:'최대로 만드는 것은 하루 이익(목표 함수)이고, 넘으면 안 되는 조건이 제약입니다.',hint:'최대로 만드는 값과 지켜야 하는 조건을 나눠 보세요.'},
   {q:'상위 10개 설정의 이익 차이가 2% 안이라면?',o:['비슷하게 좋은 답이 여럿 — 위험이 적은 쪽을 고를 수 있다','1등만 정답이다','최적화가 틀렸다','이익을 무시해도 된다'],a:0,why:'꼭대기가 평평하면 작은 이익 차이보다 설비 투자·열 여유 같은 다른 기준이 중요해집니다.',hint:'최적화 표의 "최적 대비" 열.'}],
 label:[{q:'라벨의 센서 값 18개 가운데 하나만 틀려도 그 라벨을 "오기"로 셉니다. 센서 하나가 0.1%씩 틀린다면 라벨 오기율은 대략?',o:['약 1.8%','0.1%','18%','0%'],a:0,why:'1 − (1 − 0.001)¹⁸ ≈ 0.018. 센서가 많을수록 작은 오류도 라벨 단위로는 커집니다.',hint:'18개 중 하나라도 틀릴 확률.'},
   {q:'오기율 10%인 라벨로 판정기를 학습하면?',o:['학습 셀 10개 중 1개꼴로 틀린 입력을 배운다','판정기가 더 정확해진다','라벨과 학습은 상관없다','판정기가 학습을 거부한다'],a:0,why:'라벨 한 장이 데이터 한 줄입니다. 잘못 적힌 값은 그대로 모델의 입력이 됩니다.',hint:'라벨 = 데이터세트의 한 줄.'}],
 power:[{q:'16시간 가동에서 하루 전기료를 가장 쉽게 줄이는 방법은?',o:['최대부하 시간대를 피하도록 시작 시각을 옮긴다','냉각을 0단으로 끈다','속도를 1.4배로 올린다','드라이룸을 끈다'],a:0,why:'생산량은 그대로 두고 비싼 시간대의 전력만 피할 수 있습니다. 냉각을 끄면 열 때문에 불량·오기가 늘고, 드라이룸은 꺼서는 안 되는 기본 부하입니다.',hint:'전기료 그래프의 시작 시각 곡선.'}],
 duel:[{q:'이 대결이 말해 주는 것은?',o:['24시간 가동은 열을 감당할 냉각이 있을 때만 이익이다','24시간이 늘 이긴다','밤 운전이 늘 이긴다','전기료만 보면 된다'],a:0,why:'냉각 1단에서는 24시간 쪽이 라벨 오기율 기준을 넘어 실격, 2단에서는 24시간 쪽 이익이 더 큽니다.',hint:'두 가정의 라벨 오기율을 보세요.'}]
}});

/* ══ 처음 화면 ══ */
function all(){control();lineTable();labelCard();drawBn();drawBn2();drawDef();drawHeat();drawPow();optTables();kit();Plant.redraw&&Plant.redraw();}
U.reg($('#cvBn'),function(dt){if(!dt&&R)drawBn();});U.reg($('#cvBn2'),function(dt){if(!dt&&R)drawBn2();});U.reg($('#cvDef'),function(dt){if(!dt&&R)drawDef();});U.reg($('#cvHeat'),function(dt){if(!dt&&R)drawHeat();});U.reg($('#cvPow'),function(dt){if(!dt&&R)drawPow();});
rerun();logTable();
U.start();
})();
