const BM=require('../build/bm.js'),ER=require('../build/engines_reg.js');const f=(x,d=1)=>x.toFixed(d);
const D=BM.makeCells(2026,1000,0),SP=BM.split(D,7),S=BM.stats(D,SP.tr),TR=BM.view(D,SP.tr,S),VA=BM.view(D,SP.va,S);
console.log('life mean',f(S.lm),'sd',f(S.ls));
for(const e of ER.LIST){const t0=Date.now(),M=e.fit(TR,Object.assign({},e.def),11),ms=Date.now()-t0;const v=ER.evalR(M,VA,S),t=ER.evalR(M,TR,S);console.log(e.id.padEnd(6),'ms',ms,'val MAE',f(v.mae),'R2',f(v.r2,3),'train MAE',f(t.mae),'size',M.size,M.info.slice(0,60));}
const pool=SP.tr.concat(SP.va);
function splitK(k){const ids=BM.shuffle(pool.slice(),BM.rng(1000+k)),tr=ids.slice(0,600),va=ids.slice(600),Sk=BM.stats(D,tr);return {tr:BM.view(D,tr,Sk),va:BM.view(D,va,Sk),S:Sk};}
const t0=Date.now();
for(const e of ER.LIST){const a=[];for(let k=0;k<5;k++){const s=splitK(k);a.push(ER.evalR(e.fit(s.tr,Object.assign({},e.def),11),s.va,s.S).mae);}const m=a.reduce((x,y)=>x+y)/5,sd=Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/4);console.log('rep',e.id.padEnd(6),f(m),'±',f(sd));}
console.log('rep ms',Date.now()-t0);
for(const [A,B] of [['lin','mlp'],['lin','boost'],['ridge','gp']]){const ea=ER.LIST.find(e=>e.id===A),eb=ER.LIST.find(e=>e.id===B),a=[],b=[];for(let k=0;k<10;k++){const s=splitK(k);a.push(ER.evalR(ea.fit(s.tr,ea.def,11),s.va,s.S).mae);b.push(ER.evalR(eb.fit(s.tr,eb.def,11),s.va,s.S).mae);}
 const m=x=>x.reduce((p,q)=>p+q)/x.length;console.log('duel',A,f(m(a)),B,f(m(b)),'B better',b.filter((v,i)=>v<a[i]).length,'/10');}
