"""Create source-native illustrated social cards (optional Pillow dependency)."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import math,json
ROOT=Path(__file__).resolve().parents[1]
font_dir=Path('/System/Library/Fonts/Supplemental')
serif=ImageFont.truetype(str(font_dir/'Georgia.ttf'),76)
italic=ImageFont.truetype(str(font_dir/'Georgia Italic.ttf'),76)
latin=ImageFont.truetype(str(font_dir/'Arial.ttf'),19)
cjk_path='/System/Library/Fonts/PingFang.ttc'
if not Path(cjk_path).exists():cjk_path='/System/Library/Fonts/STHeiti Light.ttc'
cjk=ImageFont.truetype(cjk_path,23)
for lang in ['en','zh-Hant','zh-Hans']:
 im=Image.new('RGB',(1200,630),'#f4f1e8');d=ImageDraw.Draw(im)
 d.text((64,52),'A SMALL OFFICE / AN OPEN DOOR',font=latin,fill='#76856c')
 d.text((64,210),'Leo’s',font=serif,fill='#343b3c');d.text((61,296),'Office.',font=italic,fill='#bc6647')
 text={'en':['Curiosity. A few ideas.','A little place of my own.'],'zh-Hans':['从好奇出发，连接无限可能。','保持独立，认真创造。'],'zh-Hant':['從好奇出發，連接無限可能。','保持獨立，認真創造。']}[lang]
 for i,line in enumerate(text):d.text((68,428+i*35),line,font=latin if lang=='en' else cjk,fill='#6f7a6c')
 d.text((68,563),'www.leosoffice.com',font=latin,fill='#343b3c')
 def p(x,y,z):return (int(870+(x-z)*57),int(422+(x+z)*29-y*62))
 def box(x,y,z,w,h,dep,colors):
  x0,x1=x-w/2,x+w/2;z0,z1=z-dep/2,z+dep/2;y0,y1=y,y+h
  d.polygon([p(x0,y0,z1),p(x1,y0,z1),p(x1,y1,z1),p(x0,y1,z1)],fill=colors[1])
  d.polygon([p(x1,y0,z0),p(x1,y0,z1),p(x1,y1,z1),p(x1,y1,z0)],fill=colors[2])
  d.polygon([p(x0,y1,z0),p(x1,y1,z0),p(x1,y1,z1),p(x0,y1,z1)],fill=colors[0])
 box(0,-.13,0,5.5,.15,4.3,['#d4d9c9','#bfc7b8','#aebba8'])
 box(0,0,-2.1,5.5,3.4,.12,['#d8e1dc','#b9cfdf','#a9c1d1'])
 box(-2.7,0,0,.12,3.4,4.3,['#d8e1d4','#c6d5c0','#b4c6b0'])
 # A window in the back wall.
 d.polygon([p(-1.9,1.6,-2.01),p(-.4,1.6,-2.01),p(-.4,3.1,-2.01),p(-1.9,3.1,-2.01)],fill='#edf0db')
 d.polygon([p(-1.77,1.72,-1.99),p(-.53,1.72,-1.99),p(-.53,2.97,-1.99),p(-1.77,2.97,-1.99)],fill='#aecedf')
 for x in [-1.4,1.4]:
  for z in [-.8,.35]:box(x,0,z,.13,1.4,.13,['#f8edd8','#ede1ca','#d8c9ae'])
 box(0,1.4,-.2,3.5,.16,1.6,['#dfb98c','#c7a178','#b48a60'])
 box(0,1.56,-.65,.12,.3,.13,['#7b8f85']*3)
 box(0,1.8,-.7,1.3,.85,.09,['#475856']*3)
 d.polygon([p(-.56,1.89,-.64),p(.56,1.89,-.64),p(.56,2.55,-.64),p(-.56,2.55,-.64)],fill='#dce5d7')
 for i,col in enumerate(['#83a9c6','#faf0d8','#cb8064']):box(-1,1.56+i*.09,-.1,.62,.08,.42,[col,'#f8edd8',col])
 box(.9,1.56,-.65,.05,.68,.05,['#8c9e6f']*3)
 d.ellipse([p(.9,2.3,-.65)[0]-17,p(.9,2.3,-.65)[1]-10,p(.9,2.3,-.65)[0]+17,p(.9,2.3,-.65)[1]+10],fill='#8c9e6f')
 box(0,.7,1.25,.8,.13,.7,['#9dbace','#83a9c6','#7397af']);box(0,.8,1.56,.8,.68,.1,['#9dbace','#83a9c6','#7397af'])
 box(1.8,0,.3,.5,.55,.5,['#d69c7d','#cb8064','#bb745b'])
 for off in [-.13,0,.15]:
  base=p(1.8+off,.5,.3);tip=p(1.8+off,1.5+abs(off),.3);d.line([base,tip],fill='#72916c',width=5);d.ellipse([tip[0]-11,tip[1]-30,tip[0]+11,tip[1]+8],fill='#829a70')
 im.save(ROOT/'assets'/f'og-{lang}.png',optimize=True)
print('Created 3 illustrated 1200×630 social cards.')
