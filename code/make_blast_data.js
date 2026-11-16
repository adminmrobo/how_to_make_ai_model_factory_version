// 예시 데이터: node code/make_blast_data.js → data/blast_trials_300.csv · data/blast_news_4.csv
// 페이지의 "내 실험 기록 CSV"와 같은 열. 가정 모형(BS.TRUE)에서 시드 2026으로 300회를 뽑는다.
const fs=require('fs'),path=require('path');const BS=require('../build/blast_sim.js');
const H='trial_id,soc_pct,force_kg,shape,shape_code,ambient_c,result,result_label,onset_s,peak_c';
const row=(x,i)=>[i+1,x.soc,x.F,x.shape===1?'cylindrical':x.shape===-1?'prismatic':'both',x.shape,x.T,x.y,['none','smoke','fire'][x.y],x.y?x.onset.toFixed(1):'',Math.round(x.peak)].join(',');
const D=BS.design(300,2026,{}),R=path.join(__dirname,'..','data');
fs.writeFileSync(path.join(R,'blast_trials_300.csv'),H+'\n'+D.map(row).join('\n')+'\n');
const N=BS.NEWS.map(n=>({soc:n.soc,F:n.F,shape:0,T:n.T,y:n.y,onset:n.y===2?7:n.y===1?15:0,peak:n.y===2?772:n.y===1?150:30}));
fs.writeFileSync(path.join(R,'blast_news_4.csv'),H+'\n'+N.map(row).join('\n')+'\n');
const c=[0,0,0];D.forEach(x=>c[x.y]++);console.log('300 trials: none',c[0],'smoke',c[1],'fire',c[2]);
