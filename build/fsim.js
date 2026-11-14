/* fsim.js — 「배터리 생산 공장」 시뮬레이션 모듈 (factory simulation).
   완전 자동화된 대용량 배터리 셀 라인을 1시간 단위로 돌린다. 페이지 안에 그대로 들어가고, node로도 돌려 수치를 확인한다(code/check_fsim.js).
   모든 값은 설명용 모형이다. 실제 공장·설비·전기 요금표가 아니다. 난수는 시드 고정. */
var FS=(function(){
'use strict';
function rng(seed){var a=seed>>>0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss(r){var u=0,v=0;while(u<1e-12)u=r();v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

/* ── 공정 10곳 ──
   r: 설비 1대의 기준 처리량(셀/시간), m: 기본 설비 대수, smax: 설비가 낼 수 있는 최대 속도 배율,
   kw/idle: 가동·대기 전력(kW/대), p: 기준 불량률, h: 발열 계수, insp: 공정 안 비전 검사가 불량을 걸러 내는 비율,
   capex: 설비 1대를 더할 때 하루 비용(감가상각 예시, 원), sens: 라벨에 기록되는 센서 [이름, 단위, 평균, 표준편차, 소수 자리] */
var ST=[
 {id:'MIX',name:'믹싱',r:400,m:1,smax:1.4,kw:60,idle:10,p:0.002,h:0.6,insp:0,capex:400000,sens:[['점도','Pa·s',4.0,0.15,2],['슬러리 온도','°C',25,0.8,1]]},
 {id:'COAT',name:'코팅',r:380,m:1,smax:1.4,kw:80,idle:15,p:0.004,h:0.8,insp:0.5,capex:900000,sens:[['코팅 두께','µm',120,1.5,1],['라인 속도','m/min',30,0.6,1]]},
 {id:'DRY',name:'건조',r:380,m:1,smax:1.4,kw:150,idle:40,p:0.003,h:1.2,insp:0,capex:800000,sens:[['오븐 온도','°C',130,1.5,1],['잔류 수분','ppm',200,15,0]]},
 {id:'PRESS',name:'압연',r:420,m:1,smax:1.4,kw:90,idle:15,p:0.003,h:0.7,insp:0.5,capex:700000,sens:[['압연 압력','t',80,1.5,1],['전극 두께','µm',95,1.2,1]]},
 {id:'SLIT',name:'슬리팅',r:450,m:1,smax:1.4,kw:40,idle:8,p:0.002,h:0.5,insp:0,capex:300000,sens:[['버 높이','µm',5,0.6,1]]},
 {id:'STACK',name:'적층',r:160,m:2,smax:1.2,kw:30,idle:6,p:0.004,h:0.6,insp:0,capex:500000,sens:[['정렬 오차','µm',150,25,0]]},
 {id:'SEAL',name:'조립·실링',r:340,m:1,smax:1.4,kw:50,idle:10,p:0.003,h:0.7,insp:0.5,capex:500000,sens:[['실링 온도','°C',180,1.5,1]]},
 {id:'FILL',name:'전해액 주입',r:360,m:1,smax:1.4,kw:35,idle:8,p:0.002,h:0.5,insp:0,capex:400000,sens:[['주입량','g',150,0.8,1],['드라이룸 습도','%RH',1.0,0.15,2]]},
 {id:'FORM',name:'화성',r:30,m:10,smax:1.05,kw:25,idle:3,p:0.003,h:1.0,insp:0,capex:150000,sens:[['충전 전압','V',4.2,0.008,3],['셀 온도','°C',35,1.2,1]]},
 {id:'EOL',name:'에이징·검사·라벨',r:400,m:1,smax:1.4,kw:20,idle:5,p:0,h:0.4,insp:0,capex:300000,sens:[['OCV','V',3.65,0.008,3],['내부저항','mΩ',1.2,0.15,2],['용량','Ah',60,1.5,1]]}];
var NS=ST.length;

/* ── 공장 공통 상수 (예시값) ── */
var K={base:300,ambient:25,tSafe:55,tSens:60,buf:600,baseKW:150,coolKW:45,verifyKW:20,verifyCapex:600000,
  price:25000,material:22000,escapeCost:150000,eolDetect:0.97,eolDetectBadLabel:0.4};
/* 시간대별 요금(원/kWh) — 경부하·중간부하·최대부하 3단계를 흉내 낸 예시값 */
function tariff(h){h=((h%24)+24)%24;if(h>=23||h<8)return 95;if((h>=11&&h<12)||(h>=13&&h<18))return 210;return 140;}
function band(h){var t=tariff(h);return t===95?'경부하':t===210?'최대부하':'중간부하';}

/* 기본 설정 */
function defaults(){return {speed:1.0,hours:16,start:6,cool:1,verify:0,extra:new Array(NS).fill(0),days:7,seed:7};}
function clone(o){return JSON.parse(JSON.stringify(o));}
function onAt(cfg,h){if(cfg.hours>=24)return true;var d=((h-cfg.start)%24+24)%24;return d<cfg.hours;}

/* 한 설정을 days일 동안 돌린다. labels: 라벨 표본을 몇 개마다 하나씩 남길지(0이면 남기지 않음) */
function run(cfg,opt){opt=opt||{};var r=rng(cfg.seed||7),H=24*(cfg.days||7),s=cfg.speed,kc=0.08+0.06*cfg.cool;
  var T=new Array(NS).fill(K.ambient),G=new Array(NS+1).fill(0),Bd=new Array(NS+1).fill(0);  /* 각 공정 앞 대기열의 양품·불량 */
  var hours=[],tot={mat:0,start:0,good:0,scrap:0,escaped:0,badMade:0,kwh:0,elec:0,labels:0,labelErr:0,labelErrSlip:0,busy:new Array(NS).fill(0),qmax:new Array(NS).fill(0),tmax:0,onH:0};
  var lab=[],every=opt.labels||0,cnt=0,id=0;
  for(var h=0;h<H;h++){var on=onAt(cfg,h),hr=h%24,rec={h:h,on:on,price:tariff(hr),T:[],util:[],q:[],e:[],p:[],kw:0,ship:0,scrap:0,esc:0,start:0};
    var kw=K.baseKW+(on?K.coolKW*cfg.cool:0)+(cfg.verify?K.verifyKW:0);
    if(on){var rel=K.base*s;if(G[0]+Bd[0]<K.buf){G[0]+=rel;tot.start+=rel;rec.start=rel;}tot.onH++;}  /* 원료 대기열이 차면 투입을 멈춘다 */
    for(var i=0;i<NS;i++){var st=ST[i],m=st.m+(cfg.extra[i]||0),se=Math.min(s,st.smax),cap=on?m*st.r*se:0;
      var inq=G[i]+Bd[i],room=i<NS-1?Math.max(0,K.buf-(G[i+1]+Bd[i+1])):Infinity,proc=Math.min(inq,cap,room+ (i<NS-1?cap*0:0));
      var u=cap>0?proc/cap:0;
      /* 열: 가동 중에는 속도²·가동률만큼 오르고 냉각으로 내려감, 쉬는 시간에는 빠르게 식음 */
      if(on)T[i]+=6*st.h*u*Math.pow(se,1.5)-(T[i]-K.ambient)*kc;else T[i]-=(T[i]-K.ambient)*0.35;
      var heat=Math.max(0,T[i]-K.tSafe),p=st.p*Math.exp(2*Math.max(0,se-1))+0.004*heat/5;
      var e=0.001+0.02*Math.max(0,T[i]-K.tSens)/5;  /* 센서 한 개가 잘못 기재될 확률 */
      var fg=inq>0?G[i]/inq:0,pg=proc*fg,pb=proc-pg;G[i]-=pg;Bd[i]-=pb;if(i===0)tot.mat+=proc;  /* 재료비는 믹싱에 들어갈 때 쓴다 */
      var nb=pg*p;tot.badMade+=nb;var good=pg-nb,bad=pb+nb;
      if(st.insp){var caught=bad*st.insp;bad-=caught;tot.scrap+=caught;rec.scrap+=caught;}
      if(i<NS-1){G[i+1]+=good;Bd[i+1]+=bad;}
      else{/* 에이징·검사·라벨: 라벨이 잘못 기재되면 불량을 놓치기 쉽다 */
        var L=1;for(var k=0;k<NS;k++){var ek=rec.e[k]!=null?rec.e[k]:e;L*=Math.pow(1-ek,ST[k].sens.length);}L=1-L;var Lslip=cfg.verify?L*0.2:L;
        var det=K.eolDetect*(1-Lslip)+K.eolDetectBadLabel*Lslip,esc=bad*(1-det),caught2=bad*det;
        tot.good+=good;tot.escaped+=esc;tot.scrap+=caught2;rec.ship=good+esc;rec.esc=esc;rec.scrap+=caught2;
        tot.labels+=good+esc;tot.labelErr+=(good+esc)*L;tot.labelErrSlip+=(good+esc)*Lslip;rec.L=L;rec.Lslip=Lslip;}
      var pw=on?m*(st.idle+(st.kw-st.idle)*u*Math.pow(se,1.5)):0;kw+=pw;
      rec.T.push(T[i]);rec.util.push(u);rec.q.push(G[i]+Bd[i]);rec.e.push(e);rec.p.push(p);
      tot.busy[i]+=on?u:0;tot.qmax[i]=Math.max(tot.qmax[i],G[i]+Bd[i]);tot.tmax=Math.max(tot.tmax,T[i]);}
    rec.kw=kw;tot.kwh+=kw;tot.elec+=kw*rec.price;hours.push(rec);
    /* 라벨 표본: 이 시간에 나온 셀 중 몇 개를 실제 셀처럼 만들어 기록 */
    if(every&&rec.ship>0){cnt+=rec.ship;while(cnt>=every){cnt-=every;id++;lab.push(makeLabel(r,id,h,rec,cfg));}}}
  var capex=0;for(i=0;i<NS;i++)capex+=(cfg.extra[i]||0)*ST[i].capex*(cfg.days||7);capex+=cfg.verify?K.verifyCapex*(cfg.days||7):0;
  var rev=tot.good*K.price+tot.escaped*K.price,mat=tot.mat*K.material,escC=tot.escaped*K.escapeCost,profit=rev-mat-escC-tot.elec-capex;
  var util=tot.busy.map(function(b){return tot.onH?b/tot.onH:0;}),bn=0;for(i=1;i<NS;i++)if(util[i]>util[bn]+1e-9||(Math.abs(util[i]-util[bn])<1e-9&&tot.qmax[i-1]>tot.qmax[bn-1||0]))bn=i;
  /* 병목: 가동률이 가장 높은 공정. 같으면 앞 대기열이 긴 쪽 */
  bn=0;var best=-1;for(i=0;i<NS;i++){var sc=util[i]+ (i>0?Math.min(0.05,tot.qmax[i]/1e5):0);if(sc>best){best=sc;bn=i;}}
  var wip=0;for(i=0;i<=NS;i++)wip+=G[i]+Bd[i];
  var D=cfg.days||7,out={wip:wip,cfg:cfg,hours:hours,labels:lab,
    perDay:{good:tot.good/D,start:tot.start/D,scrap:tot.scrap/D,escaped:tot.escaped/D,kwh:tot.kwh/D,elec:tot.elec/D,capex:capex/D,profit:profit/D},
    defectRate:tot.mat?tot.badMade/tot.mat:0,yield:tot.mat?tot.good/tot.mat:0,escRate:(tot.good+tot.escaped)?tot.escaped/(tot.good+tot.escaped):0,
    labelErr:tot.labels?tot.labelErr/tot.labels:0,labelErrSlip:tot.labels?tot.labelErrSlip/tot.labels:0,
    util:util,qmax:tot.qmax,bottleneck:bn,tmax:tot.tmax,costPerGood:tot.good?(mat+escC+tot.elec+capex)/tot.good:0,elecPerGood:tot.good?tot.elec/tot.good:0,profit:profit};
  return out;}

/* 라벨 한 장: 센서마다 실제 값과 기록된 값. 잘못 기재되면 기록값이 어긋난다(치우침·멈춤·자리 바뀜) */
function makeLabel(r,id,h,rec,cfg){var L={id:'C'+String(id).padStart(6,'0'),day:Math.floor(h/24)+1,hour:h%24,vals:[],err:false,errSens:[]};
  for(var i=0;i<NS;i++){var st=ST[i],T=rec.T[i];st.sens.forEach(function(sn,k){var tv=sn[2]+sn[3]*gauss(r);
      if(sn[0]==='셀 온도'||sn[0]==='슬러리 온도')tv+=(T-K.ambient)*0.15;
      var bad=r()<rec.e[i],rv=tv,kind='';
      if(bad){var u=r();if(u<0.5){rv=tv+sn[3]*(4+4*r())*(r()<0.5?-1:1);kind='치우침';}else if(u<0.8){rv=sn[2];kind='멈춤';}else{rv=tv*10;kind='자리 바뀜';}
        L.err=true;L.errSens.push(st.name+' · '+sn[0]+' ('+kind+')');}
      L.vals.push({st:i,name:sn[0],unit:sn[1],dp:sn[4],t:tv,v:rv,bad:bad,kind:kind});});}
  L.verified=!!cfg.verify;L.caught=L.err&&cfg.verify&&r()<0.8;return L;}

/* 자동 최적화: 격자를 훑어 하루 이익이 가장 큰 설정을 찾는다. step(i,n)로 진행 상황을 알린다 */
function grid(){var g=[],sp=[0.85,0.9,0.95,1.0,1.05,1.1,1.15,1.2,1.25,1.3,1.35],HS=[8,12,16,20,24],ss=[0,6,22],cs=[0,1,2,3],fm=[0,1,2,3,4],sk=[0,1],vf=[0,1];
  sp.forEach(function(s){HS.forEach(function(Hh){(Hh>=24?[0]:ss).forEach(function(st){cs.forEach(function(c){fm.forEach(function(f){sk.forEach(function(k){vf.forEach(function(v){var c2=defaults();c2.speed=s;c2.hours=Hh;c2.start=st;c2.cool=c;c2.extra[8]=f;c2.extra[5]=k;c2.verify=v;g.push(c2);});});});});});});});return g;}
/* 제약: 라벨 오기율 ≤ LMAX. 결과는 이익 순 상위 top개 (hours·labels 없이 가볍게) */
var LMAX=0.03;
function slim(o){return {cfg:o.cfg,perDay:o.perDay,labelErr:o.labelErr,defectRate:o.defectRate,escRate:o.escRate,bottleneck:o.bottleneck,tmax:o.tmax,elecPerGood:o.elecPerGood};}
function keep(top,o,n){if(o.labelErr>LMAX)return;top.push(slim(o));top.sort(function(a,b){return b.perDay.profit-a.perDay.profit;});if(top.length>n)top.length=n;}
function optimize(done,step,chunk){var g=grid(),i=0,top=[];chunk=chunk||150;
  function go(){var e=Math.min(g.length,i+chunk);for(;i<e;i++)keep(top,run(g[i]),10);step&&step(i,g.length);if(i<g.length)setTimeout(go,0);else done({best:top[0],top:top,n:g.length});}
  go();}
function optimizeSync(){var g=grid(),top=[];for(var i=0;i<g.length;i++)keep(top,run(g[i]),10);return {best:top[0],top:top,n:g.length};}

return {LMAX:LMAX,ST:ST,NS:NS,K:K,tariff:tariff,band:band,defaults:defaults,clone:clone,onAt:onAt,run:run,grid:grid,optimize:optimize,optimizeSync:optimizeSync,rng:rng};
})();
if(typeof module!=='undefined')module.exports=FS;
