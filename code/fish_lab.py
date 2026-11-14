# 시제품 테스트 랩실 — 생선 통조림 분류 장비 계산 (python3 code/fish_lab.py → build/fish.json)
import json,numpy as np,pandas as pd,warnings;warnings.filterwarnings('ignore')
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.model_selection import StratifiedKFold,cross_val_score
from sklearn.metrics import log_loss
import pathlib;B=str(pathlib.Path(__file__).resolve().parent.parent/'build')+'/'
df=pd.read_csv(B+'fish_market_10x.csv')
SP=['Bream','Parkki','Perch','Pike','Roach','Smelt','Whitefish']
df['y']=df.Species.map(SP.index);df['HL']=df.Height/df.Length;df['WL']=df.Width/df.Length
F4=['Length','Diagonal','Height','Width'];F6=F4+['HL','WL']
tr=df[df.source=='augmented'].reset_index(drop=True);fe=df[df.source=='original'].reset_index(drop=True)
CFGS=[]
for fs,fn in [('4',F4),('6',F6)]:
  for C in [0.1,1,10,100]:CFGS.append(dict(eng='lr',p=C,fs=fs,fn=fn,m=lambda C=C:LogisticRegression(C=C,max_iter=5000)))
  for k in [1,3,5,9,15,31]:CFGS.append(dict(eng='knn',p=k,fs=fs,fn=fn,m=lambda k=k:KNeighborsClassifier(k)))
  for C in [0.1,1,10,100]:CFGS.append(dict(eng='svl',p=C,fs=fs,fn=fn,m=lambda C=C:SVC(kernel='linear',C=C,probability=True,random_state=42)))
  for C in [1,10,100]:CFGS.append(dict(eng='svr',p=C,fs=fs,fn=fn,m=lambda C=C:SVC(kernel='rbf',C=C,probability=True,random_state=42)))
cv=StratifiedKFold(5,shuffle=True,random_state=42)
out=[]
for c in CFGS:
  pipe=make_pipeline(StandardScaler(),c['m']())
  s=cross_val_score(pipe,tr[c['fn']],tr.y,cv=cv).mean()
  pipe.fit(tr[c['fn']],tr.y);pr=pipe.predict(fe[c['fn']]);P=pipe.predict_proba(fe[c['fn']])
  out.append(dict(eng=c['eng'],p=c['p'],fs=c['fs'],cv=round(s,4),fa=round((pr==fe.y).mean(),4),ll=round(log_loss(fe.y,np.clip(P,1e-6,1),labels=range(7)),3),pred=''.join(map(str,pr)),conf=[round(float(P[i].max()),2) for i in range(len(fe))]))
  print(c['eng'],c['p'],c['fs'],'cv',round(s,3),'field',round((pr==fe.y).mean(),3),out[-1]['ll'])
# 두 묶음 대결: 원본 158마리를 반으로 (1차 현장 시험 / 2차 출하 검수), 시드 0~19
fy=fe.y.values;rows=[]
for sd in range(20):
  r=np.random.RandomState(sd);idx=np.zeros(len(fe),bool)
  for k in range(7):
    ii=np.where(fy==k)[0];r.shuffle(ii);idx[ii[:len(ii)//2]]=True
  a=[np.mean(np.array(list(o['pred']),int)[idx]==fy[idx]) for o in out];b=[np.mean(np.array(list(o['pred']),int)[~idx]==fy[~idx]) for o in out]
  ri=int(np.argmax(a));fi=int(np.argmax([o['cv'] for o in out]))
  rows.append(dict(seed=sd,mask=''.join('1' if v else '0' for v in idx),robo=ri,fly=fi,ra=round(a[ri],4),rb=round(b[ri],4),fb=round(b[fi],4)))
  print(sd,'robo',out[ri]['eng'],out[ri]['p'],out[ri]['fs'],'peek',round(a[ri],3),'final',round(b[ri],3),'| fly',out[fi]['eng'],out[fi]['p'],out[fi]['fs'],round(b[fi],3))
# 3D 판정 지형: 길이·높이비(H/L) 두 입력 로지스틱
X2=tr[['Length','HL']].values;sc=StandardScaler().fit(X2);lr=LogisticRegression(C=10,max_iter=5000).fit(sc.transform(X2),tr.y)
p2=lr.predict(sc.transform(fe[['Length','HL']].values))
print('2D LR field',(p2==fe.y).mean())
J=dict(sp=SP,ko=['도미','파르키','농어','강꼬치고기','로치','빙어','흰송어'],field=[[float(r.Length),float(r.Diagonal),float(r.Height),float(r.Width),float(r.Weight),int(r.y)] for r in fe.itertuples()],
  ntr=len(tr),cnt_tr=[int((tr.y==k).sum()) for k in range(7)],cnt_fe=[int((fe.y==k).sum()) for k in range(7)],
  cfg=out,duel=rows,lr2=dict(mu=sc.mean_.tolist(),sd=sc.scale_.tolist(),W=lr.coef_.round(4).tolist(),b=lr.intercept_.round(4).tolist(),acc=round(float((p2==fe.y).mean()),4)))
for o in out:o.pop('conf',None) if False else None
json.dump(J,open(B+'fish.json','w'),ensure_ascii=False,separators=(',',':'))
