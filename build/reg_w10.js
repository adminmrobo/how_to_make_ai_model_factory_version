/* ══ ⑩ 출고 검사실 (용량 실험: 시드 3개 평균) ══ */
(function(){var ca=$('#cvW10a'),cb=$('#cvW10b'),HS=[1,2,4,8,16,32],SDS=[21,22,23],res=[],busy=false,ck=null,done=false;
  var small=SP.tr.slice(0,80),S80=BM.stats(D,small),TR80=BM.view(D,small,S80),VA80=BM.view(D,SP.va,S80);
  function avg(a){return a.reduce(function(x,y){return x+y;},0)/a.length;}
  $('#w10-sweep').onclick=function(){if(busy)return;busy=true;res=[];var i=0,k=0,J=null,cur=null;this.disabled=true;
    (function tick(){var t0=performance.now();while(performance.now()-t0<12){if(!J){if(i>=HS.length){busy=false;done=true;$('#w10-sweep').disabled=false;$('#w10-prog').textContent='완료 · 6개 크기 × 시드 3개';note();judge();draw();return;}
          if(k===0)cur={H:HS[i],trs:[],vas:[]};J=BM.job({kind:'reg',H:HS[i],seed:SDS[k],epochs:400,tr:TR80,va:VA80,opt:'adam',lr:0.01,batch:80});}
        J.run(10);if(J.done){cur.trs.push(BM.evalReg(J.P,TR80,S80).mae);cur.vas.push(BM.evalReg(J.P,VA80,S80).mae);cur.np=BM.nParams(J.P);J=null;k++;
          if(k===SDS.length){cur.tr=avg(cur.trs);cur.va=avg(cur.vas);cur.lo=Math.min.apply(null,cur.vas);cur.hi=Math.max.apply(null,cur.vas);res.push(cur);k=0;i++;}}}
      $('#w10-prog').textContent='은닉 '+HS[Math.min(i,HS.length-1)]+' · 시드 '+(k+1)+' 길들이는 중 · '+res.length+' / 6';draw();requestAnimationFrame(tick);})();};
  function note(){var out=[];if(done){var s=res.slice().sort(function(a,c){return a.va-c.va;}),b=s[0],b2=s[1],L=res[res.length-1];
      out.push(['g','시드 3개 평균으로 검증 오차가 가장 작은 크기는 은닉 '+b.H+'개(파라미터 '+b.np+'개, '+fmt(b.va,1)+'회)이고, 다음은 은닉 '+b2.H+'개('+fmt(b2.va,1)+'회)입니다. 은닉 '+L.H+'개는 훈련 오차가 '+fmt(L.tr,1)+'회까지 내려갔지만 검증 오차는 '+fmt(L.va,1)+'회입니다.'],
        [b2.va-b.va<Math.max(b.hi-b.lo,b2.hi-b2.lo)?'a':'g',b2.va-b.va<Math.max(b.hi-b.lo,b2.hi-b2.lo)?'1·2위 크기의 차이('+fmt(b2.va-b.va,1)+'회)가 시드에 따른 흔들림보다 작습니다. "은닉 '+b.H+'개가 최적"이라기보다 "셀 80개에는 작은 쪽이 낫고, 큰 쪽은 분명히 나빠진다"로 읽습니다.':'작은 크기가 시드 흔들림보다 뚜렷하게 낫습니다.'],
        ['a','셀 80개는 이 문제에 적은 양입니다. 정답 셀이 적을 때 단순한 엔진이 나은지, 아래 대결에서 엔진 종류를 바꿔 확인합니다.']);}
    if(ck)out.push([ck[0]===ck[1]?'g':'r','추론 1,000번 전후의 가중치 지문: '+(ck[0]===ck[1]?'같음 ('+ck[0]+') — 배포 후 추론은 가중치를 바꾸지 않았습니다.':'다름!')]);
    if(!out.length)out.push(['a','"크기별로 길들여 보기"로 용량 실험을, "추론 1,000번"으로 출고 검사를 합니다. 봉인한 시험 셀은 열지 않습니다.']);U.ins($('#i-w10'),out);}
  function judge(){var ok=done&&ck&&ck[0]===ck[1];QC(10,ok?'ok':(done||ck)?(ck&&ck[0]!==ck[1]?'ng':'run'):'wait',(done?'용량 실험 완료':'용량 실험 전')+' · 지문 '+(ck?(ck[0]===ck[1]?'같음':'다름'):'비교 전'));
    $('#w10-minis').innerHTML=mini(done?'g':'','용량 실험',done?'6 크기 × 시드 3':'—')+mini('','평균이 가장 나은 은닉 수',done?res.slice().sort(function(a,c){return a.va-c.va;})[0].H+'개':'—')+mini(ck?(ck[0]===ck[1]?'g':'r'):'','가중치 지문 전 → 후',ck?ck[0]+' → '+ck[1]:'—')+mini('','시험 셀 200개','🔒 2편');}
  $('#w10-infer').onclick=function(){var a=BM.checksum(M.P);for(var i=0;i<1000;i++)BM.predict(M.P,'reg',TE.x[i%TE.n]);ck=[a,BM.checksum(M.P)];judge();note();};
  function draw(){var mx=40;res.forEach(function(r){mx=Math.max(mx,r.hi*1.1,r.tr*1.1);});
    var o=U.plot(ca,{xr:[1,32],logx:true,yr:[0,mx],xt:HS,yt:[0,Math.round(mx/2),Math.round(mx)],xl:'은닉 뉴런 수 (로그 눈금)',yl:'평균 오차 (회) · 시드 3개 평균',series:res.length?[{pts:res.map(function(r){return [r.H,r.tr];}),color:C.info,width:2.2,dots:3.5,name:'훈련',ndy:14},{pts:res.map(function(r){return [r.H,r.va];}),color:C.eye,width:2.2,dots:3.5,name:'검증',ndy:-12}]:[],stamp:'설명용 모형'});
    if(o&&o.g){var g=o.g;g.strokeStyle='rgba(201,48,44,.35)';g.lineWidth=5;res.forEach(function(r){g.beginPath();g.moveTo(o.X(r.H),o.Y(r.lo));g.lineTo(o.X(r.H),o.Y(r.hi));g.stroke();});g.lineWidth=1;}
    var np=HS.map(function(H){return [H,4*H+H+H+1];});U.plot(cb,{xr:[1,32],logx:true,yr:[0,200],xt:HS,yt:[0,50,100,150,200],xl:'은닉 뉴런 수',yl:'파라미터 수',series:[{pts:np,color:C.stain,width:2.2,dots:3.5}],hlines:[{y:80,color:C.amber,label:'훈련 셀 80개',left:true}],stamp:'계산값'});}
  U.reg(ca,function(dt){if(!dt)draw();});judge();note();
})();

