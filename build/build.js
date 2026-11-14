// 페이지 조립: node build/build.js
// page.src.html + common.css + 캐릭터 그림 + bm.js + common.js + page.js → 단일 HTML (index.html)
// 그다음 꼬리표 조립기(ahnboat_lab_explainer/packs/task/onto-retrofit/tools/assembler.html)의 build()와 같은 방식으로
// 지식 색인(#kg)·온톨로지·서지 꾸러미(#export)와 데이터 블록 네 개를 붙인다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const B=__dirname,R=path.join(B,'..');
const rd=f=>fs.readFileSync(path.join(B,f),'utf8');
const css=rd('common.css'),sprites=rd('sprites96.js'),bm=rd('bm.js'),en=rd('engines.js'),pst=rd('page.style.html'),common=rd('common.js'),page=rd('page.js');
const kgx=rd('kgx.js');
const motion=rd('motion.js');  // 동작 팩 전신 서기 6장 (ahnboat_lab_explainer packs/character/motion_pack: --pick D1,A1,S1,M1,F1,R1 --size 128)  // ai-lab-explainer v1.14 판 (흰 배경 기본색)
const BB=JSON.parse(rd('backbone.json'));
// KGX.toJsonLd를 쓰려고 브라우저 없이 모듈을 띄운다
const ctx={document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},window:{},navigator:{},console};
vm.createContext(ctx);vm.runInContext(kgx+';this.KGX=KGX;',ctx);
const MK={head:['<!-- lab-kg:head -->','<!-- /lab-kg:head -->'],body:['<!-- lab-kg:body -->','<!-- /lab-kg:body -->'],script:['<!-- lab-kg:script -->','<!-- /lab-kg:script -->']};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const js=o=>JSON.stringify(o).replace(/<\//g,'<\\/');
const sec=(i,t,sub,m)=>'<section class="kgx kgx-sec" id="'+i+'"><div class="kgx-wrap">\n<h2>'+t+'</h2>\n<p class="kgx-sub">'+sub+'</p>\n<div id="'+m+'"></div>\n</div></section>\n';
function attach(H,kg,refs,meta){
  kg=JSON.parse(JSON.stringify(kg));kg.topicLabels={};BB.nodes.forEach(n=>{kg.topicLabels[n.id]=n.label.ko;});
  const ld=ctx.KGX.toJsonLd(kg,meta),t=meta.title||'';
  const head=['<meta name="citation_title" content="'+esc(t)+'">','<meta name="dc.title" content="'+esc(t)+'">','<meta name="dc.date" content="'+esc(meta.date||'')+'">','<meta name="dc.language" content="ko">','<meta name="dc.type" content="InteractiveResource">'];
  (meta.creator||[]).forEach(c=>{if(c.name)head.push('<meta name="citation_author" content="'+esc(c.name)+'">');});
  if(meta.series)head.push('<meta name="dcterms.isPartOf" content="'+esc(meta.series)+'">');
  refs.forEach(r=>{if(r.DOI)head.push('<meta name="dc.source" content="doi:'+esc(r.DOI)+'">');});
  const bh=MK.head[0]+'\n'+head.join('\n')+'\n'+MK.head[1]+'\n';
  const body=MK.body[0]+'\n'+sec('kg','지식 색인 — 이 페이지에서 찾아보기','이 페이지에 나온 개념, 방법, 주장, 비유, 열린 질문을 한곳에 모았다. 검색하고, 항목을 눌러 이웃 관계를 보고, "설명 보러 가기"로 본문에 돌아간다.','kg-mount')+
    sec('export','온톨로지·서지 꾸러미 — 이 페이지의 지식을 가져가기','지식 색인을 출처와 함께 파일로 내려받는다. Zotero(BibTeX·RIS), Protégé(Turtle), Neo4j·Gephi(CSV), 여러 페이지 합치기(kg.json)에 쓴다.','export-mount')+
    '<script type="application/json" id="kg-raw">'+js(kg)+'</'+'script>\n<script type="application/ld+json" id="kg-ld">'+js(ld)+'</'+'script>\n'+
    '<script type="application/json" id="refs-csl">'+js(refs)+'</'+'script>\n<script type="application/json" id="page-meta">'+js(meta)+'</'+'script>\n'+MK.body[1]+'\n';
  const sc=MK.script[0]+'\n<script>\n'+kgx+'\n</'+'script>\n'+MK.script[1]+'\n';
  H=H.replace('</head>',bh+'</head>');
  let i=H.lastIndexOf('<footer'),j=H.lastIndexOf('</body>'),p=(i>=0&&i<j)?i:j;H=H.slice(0,p)+body+H.slice(p);
  j=H.lastIndexOf('</body>');H=H.slice(0,j)+sc+H.slice(j);return H;}
let H=rd('page.src.html').replace('<!--@@CSS@@-->',()=>'<style>\n'+css+'\n</style>')
  .replace('/*@@SPRITES@@*/',()=>sprites+'\n'+motion).replace('<!--@@PSTYLE@@-->',()=>pst).replace('/*@@EN@@*/',()=>en.replace("if(typeof module!=='undefined')module.exports=EN;",'')).replace('/*@@BM@@*/',()=>bm.replace("if(typeof module!=='undefined')module.exports=BM;",'')).replace('/*@@COMMON@@*/',()=>common).replace('/*@@PAGE@@*/',()=>page);
if(fs.existsSync(path.join(B,'kg.json')))H=attach(H,JSON.parse(rd('kg.json')),JSON.parse(rd('refs.json')),JSON.parse(rd('meta.json')));
fs.writeFileSync(path.join(R,'classifier.html'),H);console.log('classifier.html',(Buffer.byteLength(H)/1024).toFixed(0)+' KB');
// 회귀 편: reg.src.html + engines_reg.js + reg.js → regression.html (kg_reg.json·refs_reg.json·meta_reg.json)
if(fs.existsSync(path.join(B,'reg.src.html'))){const er=rd('engines_reg.js'),rj=rd('reg.js');
  let H2=rd('reg.src.html').replace('<!--@@CSS@@-->',()=>'<style>\n'+css+'\n</style>')
    .replace('/*@@SPRITES@@*/',()=>sprites+'\n'+motion).replace('<!--@@PSTYLE@@-->',()=>pst).replace('/*@@ER@@*/',()=>er.replace("if(typeof module!=='undefined')module.exports=ER;",'').replace("(typeof BM!=='undefined')?BM:require('./bm.js')",'BM')).replace('/*@@BM@@*/',()=>bm.replace("if(typeof module!=='undefined')module.exports=BM;",'')).replace('/*@@COMMON@@*/',()=>common).replace('/*@@PAGE@@*/',()=>rj);
  if(fs.existsSync(path.join(B,'kg_reg.json')))H2=attach(H2,JSON.parse(rd('kg_reg.json')),JSON.parse(rd('refs_reg.json')),JSON.parse(rd('meta_reg.json')));
  fs.writeFileSync(path.join(R,'regression.html'),H2);console.log('regression.html',(Buffer.byteLength(H2)/1024).toFixed(0)+' KB');}

// 3편 배터리 생산 공장: factory.src.html + fsim.js + factory.js → factory.html (kg_fac.json·refs_fac.json·meta_fac.json)
if(fs.existsSync(path.join(B,'factory.src.html'))){const fsim=rd('fsim.js'),fj=rd('factory.js');
  let H3=rd('factory.src.html').replace('<!--@@CSS@@-->',()=>'<style>\n'+css+'\n</style>').replace('/*@@SPRITES@@*/',()=>sprites+'\n'+motion).replace('<!--@@PSTYLE@@-->',()=>pst)
    .replace('/*@@FS@@*/',()=>fsim.replace("if(typeof module!=='undefined')module.exports=FS;",'')).replace('/*@@COMMON@@*/',()=>common).replace('/*@@PAGE@@*/',()=>fj);
  if(fs.existsSync(path.join(B,'kg_fac.json')))H3=attach(H3,JSON.parse(rd('kg_fac.json')),JSON.parse(rd('refs_fac.json')),JSON.parse(rd('meta_fac.json')));
  fs.writeFileSync(path.join(R,'factory.html'),H3);console.log('factory.html',(Buffer.byteLength(H3)/1024).toFixed(0)+' KB');}
// 시제품 테스트 랩실: testlab.src.html + fish.json + testlab.js → testlab.html (kg_test.json·refs_test.json·meta_test.json)
if(fs.existsSync(path.join(B,'testlab.src.html'))){const fd=rd('fish.json'),tj=rd('testlab.js');
  let H4=rd('testlab.src.html').replace('<!--@@CSS@@-->',()=>'<style>\n'+css+'\n</style>').replace('/*@@SPRITES@@*/',()=>sprites+'\n'+motion).replace('<!--@@PSTYLE@@-->',()=>pst)
    .replace('/*@@FISH@@*/',()=>'var FD='+fd+';').replace('/*@@COMMON@@*/',()=>common).replace('/*@@PAGE@@*/',()=>tj);
  if(fs.existsSync(path.join(B,'kg_test.json')))H4=attach(H4,JSON.parse(rd('kg_test.json')),JSON.parse(rd('refs_test.json')),JSON.parse(rd('meta_test.json')));
  fs.writeFileSync(path.join(R,'testlab.html'),H4);console.log('testlab.html',(Buffer.byteLength(H4)/1024).toFixed(0)+' KB');}
// 공장 목록(허브): hub.src.html + common.css + 캐릭터 그림 → index.html
if(fs.existsSync(path.join(B,'hub.src.html'))){let H0=rd('hub.src.html').replace('<!--@@CSS@@-->',()=>'<style>\n'+css+'\n</style>').replace('<!--@@PSTYLE@@-->',()=>pst).replace('/*@@SPRITES@@*/',()=>sprites).replace('/*@@COMMON@@*/',()=>common);
  fs.writeFileSync(path.join(R,'index.html'),H0);console.log('index.html (hub)',(Buffer.byteLength(H0)/1024).toFixed(0)+' KB');}
