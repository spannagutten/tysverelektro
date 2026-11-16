"""Forbered eksisterende innhold til Sanity uten nettverk eller endring av nettsiden."""
from html.parser import HTMLParser
from pathlib import Path
import json, re, hashlib, sys

class Node:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []
    def text(self):
        return re.sub(r'\s+', ' ', ''.join(c.text() if isinstance(c, Node) else c for c in self.children)).strip()
    def find(self, tag=None, cls=None):
        return next(iter(self.all(tag, cls)), None)
    def all(self, tag=None, cls=None):
        for c in self.children:
            if isinstance(c, Node):
                if (not tag or c.tag == tag) and (not cls or cls in c.attrs.get('class', '').split()): yield c
                yield from c.all(tag, cls)
class Parser(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True); self.root=Node(); self.current=self.root; self.feed(html)
    def handle_starttag(self, tag, attrs):
        n=Node(tag,attrs,self.current);self.current.children.append(n)
        if tag not in ('img','br','hr','input','meta','link','source','wbr','area','base','embed','param','col'):self.current=n
    def handle_endtag(self,tag):
        n=self.current
        while n.parent:
            if n.tag==tag:self.current=n.parent;return
            n=n.parent
    def handle_data(self,data):self.current.children.append(data)

def key(s):return hashlib.sha1(s.encode()).hexdigest()[:12]
def portable(node):
    blocks=[]
    for i,n in enumerate(node.all()):
        if n.tag not in ('p','h2','h3','li'):continue
        if any(a.tag in ('p','h2','h3','li') for a in ancestors(n,node)):continue
        if 'employee-back' in ''.join(a.attrs.get('class','') for a in n.all()):continue
        spans=[]; defs=[]
        def inline(x,marks=[]):
            if isinstance(x,str):
                text=re.sub(r'\s+',' ',x)
                if text:spans.append({'_type':'span','_key':key(str(i)+str(len(spans))), 'text':text,'marks':marks})
                return
            if x.tag=='br':spans.append({'_type':'span','_key':key(str(i)+str(len(spans))), 'text':'\n','marks':marks});return
            new=marks[:]
            if x.tag in ('b','strong'):new.append('strong')
            if x.tag in ('em','i'):new.append('em')
            if x.tag=='a' and x.attrs.get('href'):
                mk=key(str(i)+str(len(defs)));defs.append({'_type':'link','_key':mk,'href':x.attrs['href']});new.append(mk)
            for c in x.children:inline(c,new)
        inline(n)
        if not ''.join(s['text'] for s in spans).strip():continue
        block={'_type':'block','_key':key(str(i)+n.text()),'style':n.tag if n.tag in ('h2','h3') else 'normal','markDefs':defs,'children':spans}
        if n.tag=='li':block.update(listItem='number' if n.parent.tag=='ol' else 'bullet',level=1)
        blocks.append(block)
    return blocks

def ancestors(n,stop):
    n=n.parent
    while n and n is not stop:yield n;n=n.parent

def parse(file):return Parser(file.read_text(encoding='utf-8-sig')).root

def text(node,tag=None,cls=None):
    found=node.find(tag,cls);return found.text() if found else ''
def image(doc,node):
    img=node.find('img')
    if img:doc['_imageSource']={'src':img.attrs.get('src',''),'alt':img.attrs.get('alt','') or doc.get('title',doc.get('name','Bilde'))}

root=Path(sys.argv[1]);docs=[]
for kind,folder in [('guide','guider'),('service','tjenester'),('job','ledige-stillinger')]:
    for order,file in enumerate(sorted((root/folder).glob('*/index.html'))):
        page=parse(file); main=page.find('main'); slug=file.parent.name
        intro=main.find(cls={'guide':'guide-intro','service':'service-intro','job':'careers-intro'}[kind]); body_node=main
        if kind=='service':body_node=main.find(cls='service-detail-copy') or main
        blocks=portable(body_node)
        if intro:blocks=[b for b in blocks if ''.join(s['text'] for s in b['children']).strip()!=intro.text()]
        if kind=='guide':
            enquiry=main.find(cls='guide-enquiry')
            if enquiry:
                end=portable(enquiry)
                end_texts={''.join(s['text'] for s in b['children']) for b in end}
                blocks=[b for b in blocks if ''.join(s['text'] for s in b['children']) not in end_texts]
        doc={'_id':f'{kind}.{slug}','_type':kind,'title':text(main,'h1'),'slug':{'_type':'slug','current':slug},'intro':intro.text() if intro else '', 'body':blocks,'order':order}
        image(doc,main)
        if kind=='job':doc.update(applicationEmail='oystein@tysverelektro.no', contact={'_type':'reference','_ref':'employee.oystein.trovag'})
        docs.append(doc)
about=parse(root/'om-oss/index.html')
for order,card in enumerate(about.all(cls='team-card')):
    link=card.find(cls='team-name-link'); slug=link.attrs['href'].split('/')[-1]
    doc={'_id':f'employee.{slug}','_type':'employee','name':link.text(),'slug':{'_type':'slug','current':slug},'role':text(card,cls='team-role'),'order':order}
    for a in card.all('a'):
        href=a.attrs.get('href','')
        if href.startswith('mailto:'):doc['email']=href[7:]
        if href.startswith('tel:'):doc['phone']=a.text()
    image(doc,card);docs.append(doc)
main=parse(root/'index.html').find('main'); hero=main.find(cls='hero-content')
docs.append({'_id':'home','_type':'home','title':text(hero,'h2'),'intro':text(hero,'p'),'guidesHeading':text(main,cls='guide-carousel-heading'),'careersHeading':text(main.find(cls='home-promo-careers'),'h2'),'careersText':text(main.find(cls='home-promo-careers'),'p')})
docs.append({'_id':'siteSettings','_type':'siteSettings','companyName':'Tysvær Elektro AS','email':'post@tysverelektro.no','phone':'52 77 92 39','address':'Skjoldastraumsvegen 1065\n5567 Skjoldastraumen','facebook':'https://www.facebook.com/p/Tysv%C3%A6r-Elektro-61560527642679/?locale=nb_NO','instagram':'https://www.instagram.com/tysver_elektro_as/'})
output=Path(__file__).with_name('prepared-content.json');output.write_text(json.dumps(docs,ensure_ascii=False,indent=2),encoding='utf8')
assert len([d for d in docs if d['_type']=='employee'])==8
assert len([d for d in docs if d['_type']=='guide'])==6
assert len({d['_id'] for d in docs})==len(docs)
print(f'Klargjort {len(docs)} dokumenter lokalt. Ingen data sendt til Sanity.')
