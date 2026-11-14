const BM=require('../build/bm.js'),EN=require('../build/engines.js');const f=x=>x.toFixed(3);
const D=BM.makeCells(2026,1000,0),SP=BM.split(D,7),S=BM.stats(D,SP.tr),TR=BM.view(D,SP.tr,S),VA=BM.view(D,SP.va,S);
const M=EN.mlp(TR,{H:8},11);console.log('DFF inner-stop val F1',f(EN.evalP(M,VA).f1),M.info);
const pool=SP.tr.concat(SP.va);
function splitK(k){const ids=BM.shuffle(pool.slice(),BM.rng(1000+k)),tr=ids.slice(0,600),va=ids.slice(600),Sk=BM.stats(D,tr);return {tr:BM.view(D,tr,Sk),va:BM.view(D,va,Sk)};}
const K=5,res={};const t0=Date.now();
for(const e of EN.LIST){const a=[];for(let k=0;k<K;k++){const s=splitK(k);a.push(EN.evalP(e.fit(s.tr,Object.assign({},e.def),11),s.va).f1);}const m=a.reduce((x,y)=>x+y)/K,sd=Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/(K-1));res[e.id]=[m,sd];console.log(e.id.padEnd(6),f(m),'±',f(sd),a.map(f).join(' '));}
console.log('ms',Date.now()-t0);
// duel over 10 splits
const dl=[],dm=[];for(let k=0;k<10;k++){const s=splitK(k);dl.push(EN.evalP(EN.logistic(s.tr,{},11),s.va).f1);dm.push(EN.evalP(EN.mlp(s.tr,{H:8,epochs:120,epochsOnly:true},11),s.va).f1);}
const mean=a=>a.reduce((x,y)=>x+y)/a.length;console.log('duel logit',f(mean(dl)),'dff',f(mean(dm)),'wins dff',dm.filter((v,i)=>v>dl[i]).length,'/10',dl.map(f).join(' '),'|',dm.map(f).join(' '));
