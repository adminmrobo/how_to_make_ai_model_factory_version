// 페이지가 보여 주는 기대 수치를 node로 다시 계산한다: node code/check_numbers.js
const BM=require('../build/bm.js'),EN=require('../build/engines.js');const f=(x,d=3)=>x.toFixed(d);
const D=BM.makeCells(2026,1000,0),SP=BM.split(D,7),S=BM.stats(D,SP.tr),TR=BM.view(D,SP.tr,S),VA=BM.view(D,SP.va,S);
console.log('불량 비율',f(D.yc.reduce((a,b)=>a+b)/D.n));
console.log('— 엔진 벤치 (검증 F1 · 훈련 F1 · 저장 값)');
for(const e of EN.LIST){const o=Object.assign({},e.def,e.id==='mlp'?{va:VA}:{}),M=e.fit(TR,o,11);console.log(' ',e.name.padEnd(12),f(EN.evalP(M,VA).f1),f(EN.evalP(M,TR).f1),M.size);}
const J=BM.job({kind:'cls',H:8,seed:11,epochs:120,tr:TR,va:VA,opt:'adam',lr:0.01,batch:32}).run(120);console.log('⑧ 고른 에포크',J.best.e,'검증 F1',f(BM.evalCls(J.best.P,VA).f1));
for(const sc of [0.1,1,5])console.log('⑤ 초깃값 ×'+sc,'첫 손실',f(BM.loss(BM.Net(8,11,sc),'cls',VA)));
const L=EN.logistic(TR,{},11),Mm=EN.mlp(TR,{H:8,epochs:120},11);console.log('대결 로지스틱',f(EN.evalP(L,VA).f1),'DFF',f(EN.evalP(Mm,VA).f1));
const DB=BM.makeCells(3031,400,1),sp=BM.split(DB,9,[0.075,0.35]),trB=BM.view(DB,sp.tr,S),vaB=BM.view(DB,sp.va,S),o={kind:'cls',tr:trB,va:vaB,opt:'adam',batch:16,epochs:40,seed:6},A=J.best.P;
const full=BM.train(Object.assign({},o,{P:BM.clone(A),lr:0.005})),Pa=BM.clone(A),r=BM.rng(99);Pa.A=[];for(let j=0;j<8;j++)Pa.A.push(BM.gauss(r)*0.1);Pa.B=[0,0,0,0];
const ad=BM.train(Object.assign({},o,{P:Pa,lr:0.01,mask:{W1:0,b1:0,W2:1,b2:1,A:1,B:1}})),scr=BM.train(Object.assign({},o,{H:8,lr:0.01}));
console.log('⑨ 공장 B F1 그대로',f(BM.evalCls(A,vaB).f1),'전체',f(BM.evalCls(full.P,vaB).f1),'어댑터',f(BM.evalCls(ad.P,vaB).f1),'처음부터',f(BM.evalCls(scr.P,vaB).f1));
