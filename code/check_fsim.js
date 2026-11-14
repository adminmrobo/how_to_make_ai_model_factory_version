const FS=require('../build/fsim.js');const f=(x,d=0)=>Number(x).toLocaleString('ko-KR',{maximumFractionDigits:d,minimumFractionDigits:d});
function show(name,c){const o=FS.run(c);console.log(name.padEnd(26),'양품/일',f(o.perDay.good),'불량률',f(o.defectRate*100,2)+'%','유출',f(o.escRate*100,2)+'%','라벨오기',f(o.labelErr*100,2)+'%','병목',FS.ST[o.bottleneck].name,f(o.util[o.bottleneck]*100,0)+'%','최고온도',f(o.tmax,1),'전기/일',f(o.perDay.elec),'이익/일',f(o.perDay.profit));return o;}
const d=FS.defaults();
show('기본 16h s1.0 c1',d);
for(const s of [1.1,1.2,1.3]){const c=FS.clone(d);c.speed=s;show('속도 '+s,c);}
let c=FS.clone(d);c.speed=1.2;c.extra[8]=2;show('속도1.2 + 화성2',c);
c=FS.clone(d);c.speed=1.3;c.extra[8]=3;c.extra[5]=1;show('속도1.3 + 화성3 적층1',c);
for(const cool of [0,1,2,3]){c=FS.clone(d);c.hours=24;c.cool=cool;show('24h cool'+cool,c);}
c=FS.clone(d);c.hours=24;c.cool=1;c.speed=1.3;c.extra[8]=3;c.extra[5]=1;show('24h 1.3 화성3 적층1 c1',c);
c=FS.clone(d);c.hours=24;c.cool=3;c.speed=1.3;c.extra[8]=3;c.extra[5]=1;c.verify=1;show('24h 1.3 화성3 적층1 c3 v',c);
for(const st of [0,6,8,22]){c=FS.clone(d);c.start=st;show('16h start '+st,c);}
c=FS.clone(d);c.hours=8;c.start=8;show('8h start 8',c);c.start=23;show('8h start 23',c);
console.time('opt');const r=FS.optimizeSync();console.timeEnd('opt');console.log('grid',r.n);const b=r.best;console.log('BEST',JSON.stringify({s:b.cfg.speed,H:b.cfg.hours,st:b.cfg.start,c:b.cfg.cool,form:b.cfg.extra[8],stack:b.cfg.extra[5],v:b.cfg.verify}));show('최적',b.cfg);
