"""Typeset retained evidence only. Does not call a terrain, ephemeris or event solver.

Requires reportlab and pypdf. Run from the repository root. The editable Markdown
controls the prose and tables; the figure draws only the retained profile samples.
"""
from pathlib import Path
import hashlib
import html
import json
import re
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Flowable
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/RESOLVE_Technical_Research_Note.md'
PDF = ROOT / 'docs/RESOLVE_Technical_Research_Note.pdf'
PROVENANCE = ROOT / 'docs/RESOLVE_Technical_Research_Note.provenance.json'
FONT_ROOT = Path('C:/Windows/Fonts')
for name, filename in [('NoteSerif','times.ttf'),('NoteSerifBold','timesbd.ttf'),('NoteSerifItalic','timesi.ttf'),('NoteSans','calibri.ttf'),('NoteSansBold','calibrib.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT_ROOT/filename)))
pdfmetrics.registerFontFamily('NoteSerif',normal='NoteSerif',bold='NoteSerifBold',italic='NoteSerifItalic',boldItalic='NoteSerifBold')
pdfmetrics.registerFontFamily('NoteSans',normal='NoteSans',bold='NoteSansBold')

def read_json(name): return json.loads((ROOT/name).read_text(encoding='utf-8'))
def ref(name):
    raw=(ROOT/name).read_bytes()
    return dict(path=name,bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest())

audit=read_json('src/data/audit.v1.json')
assert ref('src/data/audit.v1.json')['sha256']=='a8a06dd4a5447acd1ee68a56779376d0b01ad081fde95c1d4b762434a521c48d'
ids=['P78_5m','P90_20m','P90_40m','P90_60m','P90_80m','P90_240m','P104_5m']
expected=['7.397830','8.358389','9.676205','11.461184','12.923283','13.293702','2.987840']
text=SOURCE.read_text(encoding='utf-8')
for model,value in zip(ids,expected):
    stored=audit['cases'][model+':fixed_absolute:uncensored_intersecting_registered']['simultaneous']['days']['original']
    assert f'{float(stored):.6f}'==value and value in text
sections=[read_json(f'public/evidence/profiles/{model}.sections.v1.json') for model in ['P78_5m','P90_80m']]
samples=[next(s for s in record['sections'] if s['direction']=='nominal_5m_critical')['samples'] for record in sections]

class FrozenFigure(Flowable):
    """Vector plot of unchanged frozen 0-200 m samples; arithmetic is page mapping only."""
    def __init__(self):
        super().__init__()
        self.width=516
        self.height=215
    def draw(self):
        c=self.canv; left=47; bottom=33; plot_w=453; plot_h=145
        xx=lambda x:left+x/200*plot_w
        yy=lambda y:bottom+(y-1520)/20*plot_h
        c.setFont('NoteSansBold',9);c.setFillColor(colors.HexColor('#24394d'))
        c.drawString(left,197,'Radial height above reference sphere (m)')
        c.setFont('NoteSans',8.5)
        for y in [1520,1525,1530,1535,1540]:
            c.setStrokeColor(colors.HexColor('#d4dde5'));c.setLineWidth(.45)
            c.line(left,yy(y),left+plot_w,yy(y));c.drawRightString(left-8,yy(y)-3,str(y))
        for x in [0,50,100,150,200]:
            c.drawCentredString(xx(x),bottom-13,str(x))
        c.drawCentredString(left+plot_w/2,4,'Surface range along aligned ray (m)')
        for i,(record,color) in enumerate(zip(samples,['#285b89','#a14b27'])):
            c.setStrokeColor(colors.HexColor(color));c.setLineWidth(1.25)
            c.setDash([4,3] if i==0 else [])
            path=c.beginPath()
            for j,(r,h,*_) in enumerate(record):
                if j==0:path.moveTo(xx(r),yy(h))
                else:path.lineTo(xx(r),yy(h))
            c.drawPath(path)
            x=270+i*123;c.line(x,200,x+20,200);c.setFillColor(colors.HexColor(color));c.drawString(x+25,197,['P78 SL2 5 m','P90 native 80 m'][i])
        c.setDash([1,3]);c.setStrokeColor(colors.HexColor('#7c8e9e'));c.setLineWidth(.6)
        c.line(xx(49),bottom,xx(49),bottom+plot_h)
        c.setDash([]);c.setFillColor(colors.HexColor('#24394d'));c.drawString(xx(49)+5,bottom+plot_h+3,'49 m aligned location')
        heights=[next(h for r,h,*_ in record if r==49) for record in samples]
        c.setStrokeColor(colors.HexColor('#a14b27'));c.setLineWidth(1)
        c.line(xx(49),yy(heights[0]),xx(49),yy(heights[1]))
        for h in heights:
            c.setFillColor(colors.white);c.circle(xx(49),yy(h),2.3,fill=1,stroke=1)
        c.setFillColor(colors.HexColor('#8d3d1f'));c.drawString(xx(49)+8,yy(heights[1])-12,'1.647339 m lower in P90')

styles={
    'title':ParagraphStyle('Title',fontName='NoteSerifBold',fontSize=21,leading=23.5,spaceAfter=8,textColor=colors.black),
    'subtitle':ParagraphStyle('Subtitle',fontName='NoteSans',fontSize=11,leading=14,spaceAfter=5),
    'meta':ParagraphStyle('Meta',fontName='NoteSans',fontSize=8.8,leading=11,spaceAfter=7,textColor=colors.HexColor('#45515c')),
    'body':ParagraphStyle('Body',fontName='NoteSerif',fontSize=10.5,leading=13.15,spaceAfter=7),
    'heading':ParagraphStyle('Heading',fontName='NoteSansBold',fontSize=11.5,leading=14,spaceBefore=10,spaceAfter=6,keepWithNext=True),
    'caption':ParagraphStyle('Caption',fontName='NoteSerif',fontSize=9,leading=11.2,spaceAfter=7),
    'reference':ParagraphStyle('Reference',fontName='NoteSerif',fontSize=8.5,leading=10.3,spaceAfter=4),
    'cell':ParagraphStyle('Cell',fontName='NoteSans',fontSize=9.5,leading=12),
    'headercell':ParagraphStyle('HeaderCell',fontName='NoteSansBold',fontSize=9,leading=11,textColor=colors.white),
}
def rich(value):
    value=html.escape(value)
    value=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',r'<link href="\2" color="#184f7e">\1</link>',value)
    return re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',value)

def footer(c,doc):
    c.saveState();c.setStrokeColor(colors.HexColor('#bcc8d2'));c.setLineWidth(.5);c.line(48,755,564,755)
    c.setFont('NoteSans',8);c.setFillColor(colors.HexColor('#53616e'))
    c.drawString(48,765,'RESOLVE  /  TECHNICAL RESEARCH NOTE')
    c.drawRightString(564,765,'15 NOVEMBER 2026  ·  VERSION 1.0')
    c.line(48,35,564,35);c.drawString(48,23,'Not peer reviewed  |  Frozen R-01A/B/C evidence')
    c.drawRightString(564,23,f'{doc.page}');c.restoreState()

story=[];blocks=re.split(r'\n\s*\n',text.strip());intro_line=0
for block in blocks:
    if block=='<!-- PAGEBREAK -->':story.append(PageBreak());continue
    if block=='<!-- FROZEN_PROFILE_FIGURE -->':story.append(FrozenFigure());continue
    if block.startswith('# '):story.append(Paragraph(rich(block[2:]),styles['title']));continue
    if block.startswith('## '):story.append(Paragraph(rich(block[3:]),styles['heading']));continue
    if block.startswith('| '):
        rows=[[v.strip() for v in line.strip().strip('|').split('|')] for line in block.splitlines()]
        rows=[row for row in rows if not all(re.match(r'^:?-+:?$',v) for v in row)]
        widths=[318,198] if len(rows[0])==2 else [132,85,92,207]
        cells=[[Paragraph(rich(v),styles['headercell' if i==0 else 'cell']) for v in row] for i,row in enumerate(rows)]
        t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
        commands=[('BACKGROUND',(0,0),(-1,0),colors.HexColor('#24394d')),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#d2dbe3')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]
        for i in range(2,len(rows),2):commands.append(('BACKGROUND',(0,i),(-1,i),colors.HexColor('#f1f5f8')))
        if len(rows[0])==2:
            for row in cells[1:]:row[1].style=ParagraphStyle('Number',parent=styles['cell'],alignment=2)
        t.setStyle(TableStyle(commands));story.extend([t,Spacer(1,10)]);continue
    if block.startswith('Technical Research Note'):kind='subtitle'
    elif block.startswith('RESOLVE project |'):kind='meta'
    elif block.startswith('**Table ') or block.startswith('**Figure '):kind='caption'
    elif re.match(r'^\[\d+\]',block):kind='reference'
    else:kind='body'
    story.append(Paragraph(rich(block.replace('\n',' ')),styles[kind]))

doc=SimpleDocTemplate(str(PDF),pagesize=(612,792),rightMargin=48,leftMargin=48,topMargin=48,bottomMargin=46,title='RESOLVE: Auditing Model Sensitivity in Lunar South-Polar Visibility Predictions',author='RESOLVE project',subject='Technical Research Note - not peer reviewed',pageCompression=1)
doc.build(story,onFirstPage=footer,onLaterPages=footer)
reader=PdfReader(PDF)
assert len(reader.pages)==4, f'Expected 4 pages, produced {len(reader.pages)}'
combined='\n'.join(page.extract_text() for page in reader.pages)
for required in expected+['This technical research note has not been peer reviewed.','1.647339','327.157','DE441']:
    assert required in combined,required
inputs=['src/data/audit.v1.json','src/data/science.v1.json','public/evidence/profiles/P78_5m.sections.v1.json','public/evidence/profiles/P90_80m.sections.v1.json','public/evidence/science/sources/a-finding.md','public/evidence/science/sources/b-protocol.md','public/evidence/science/sources/b-report.md','public/evidence/science/sources/c-protocol.md','public/evidence/science/sources/c-finding.md','public/evidence/science/sources/c-report.md','public/evidence/science/sources/c-numerical.json','public/evidence/science/sources/source-audit.md','public/evidence/science/sources/frame-audit.md','public/evidence/science/sources/literature-audit.md','public/evidence/science/sources/c-reproduce.md','public/evidence/frozen/terrain_cross_section.png','public/evidence/science/sources/response.csv']
record=dict(schema='resolve.technical-note.v1',version='1.0',date='2026-11-15',peer_reviewed=False,new_scientific_calculations=False,evidence_release='324d5b6a8d8b6cdd99a3d5ed314e5874268cb4de',pages=4,pdf=ref('docs/'+PDF.name),editable_source=ref('docs/'+SOURCE.name),builder=ref('scripts/build-research-note.py'),figure='Vector redraw of exact frozen aligned profile samples; display coordinate mapping only',inputs=[ref(p) for p in inputs])
PROVENANCE.write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(dict(pages=4,pdf=record['pdf'],characters=len(combined))))
