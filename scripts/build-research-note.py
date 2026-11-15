"""Typeset retained evidence only. Does not call a terrain, ephemeris or event solver.

Requires ReportLab, pypdf and a LaTeX installation with IEEEtran, times, booktabs, graphicx and hyperref. Run from the repository root. The editable Markdown
controls the prose and tables; the figure draws only the retained profile samples.
"""
from pathlib import Path
import hashlib
import html
import json
import re
import subprocess
import shutil
import zipfile
import os
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
        c.setFillColor(colors.HexColor('#8d3d1f'));c.drawString(xx(49)+8,yy(1531),'1.647339 m lower in P90')


# The PDF figure contains only the unchanged frozen samples, with print-space mapping.
from reportlab.pdfgen.canvas import Canvas
figure_name='RESOLVE_Technical_Research_Note_figure.pdf'
figure_path=ROOT/'docs'/figure_name
c=Canvas(str(figure_path),pagesize=(516,215),pageCompression=1,invariant=1)
FrozenFigure().drawOn(c,0,0)
c.save()

def tex(value):
    """Escape data before adding the small supported Markdown formatting subset."""
    links=[]
    def link(m):
        links.append((m.group(1),m.group(2)))
        return f'ZZLINK{len(links)-1}ZZ'
    value=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',link,value)
    mapping={'\\':r'\textbackslash{}','&':r'\&','%':r'\%','$':r'\$','#':r'\#','_':r'\_','{':r'\{','}':r'\}','~':r'\textasciitilde{}','^':r'\textasciicircum{}','−':r'$-$','°':r'\textdegree{}','×':r'$\times$','→':r'$\rightarrow$','–':'--','—':'---','“':'``','”':"''",'’':"'"}
    value=''.join(mapping.get(ch,ch) for ch in value)
    value=re.sub(r'\*\*(.+?)\*\*',lambda m:r'\textbf{'+m.group(1)+'}',value)
    for i,(label,url) in enumerate(links):
        escaped_url=url.replace('%',r'\%').replace('#',r'\#')
        value=value.replace(f'ZZLINK{i}ZZ',r'\href{'+escaped_url+'}{'+tex(label)+'}')
    return value

blocks=re.split(r'\n\s*\n',text.strip())
title=blocks[0][2:]
body=[];references=[];section='';caption=None;table_number=0
for block in blocks[1:]:
    if block.startswith('Technical Research Note') or block.startswith('Decision-Convergence Auditing') or block.startswith('RESOLVE project |'):continue
    if block=='<!-- PAGEBREAK -->':continue
    if block=='<!-- FROZEN_PROFILE_FIGURE -->':continue
    if block.startswith('## '):
        section=block[3:]
        if section=='Abstract':body.append(r'\begin{abstract}')
        elif section=='References':pass
        else:
            if section.startswith('8. '):body.append(r'\newpage')
            body.append(r'\section{'+tex(re.sub(r'^\d+\. ','',section))+'}')
        continue
    if section=='References':
        match=re.match(r'^\[(\d+)\]\s*(.*)',block,re.S)
        assert match
        references.append(r'\bibitem{ref'+match[1]+'} '+tex(match[2]))
        continue
    if section=='Abstract':
        body.extend([tex(block),r'\end{abstract}',r'\begin{IEEEkeywords}Lunar terrain, geometric visibility, model sensitivity, decision auditing, scientific provenance.\end{IEEEkeywords}'])
        continue
    if block.startswith('**Table '):
        caption=re.sub(r'^\*\*Table \d+\.\*\*\s*','',block)
        continue
    if block.startswith('**Figure '):
        caption_figure=re.sub(r'^\*\*Figure \d+\.\*\*\s*','',block)
        body.append(r'\begin{figure*}[!t]\centering'+'\n'+r'\includegraphics[width=0.95\textwidth]{'+figure_name+'}\n'+r'\caption{'+tex(caption_figure)+r'}\label{fig:profile}\end{figure*}')
        continue
    if block.startswith('| '):
        rows=[[v.strip() for v in line.strip().strip('|').split('|')] for line in block.splitlines()]
        rows=[row for row in rows if not all(re.match(r'^:?-+:?$',v) for v in row)]
        table_number+=1
        wide=len(rows[0])>2
        env='table*' if wide else 'table'
        spec='@{}lrrl@{}' if wide else '@{}lr@{}'
        head=['Representation','Range','Azimuth','Own event (UTC, 2026)'] if wide else ['Terrain representation',r'Complete window (d)']
        parts=[r'\begin{'+env+r'}[!t]\centering',r'\caption{'+tex(caption)+'}',r'\label{tab:result'+str(table_number)+'}',r'\small\setlength{\tabcolsep}{6pt}\renewcommand{\arraystretch}{1.12}',r'\begin{tabular}{'+spec+r'}\toprule', ' & '.join(r'\textit{'+tex(cell)+'}' for cell in head)+r'\\\midrule']
        parts += [' & '.join(tex(cell) for cell in row)+r'\\' for row in rows[1:]]
        parts.extend([r'\bottomrule\end{tabular}',r'\end{'+env+'}'])
        body.append('\n'.join(parts));caption=None
        continue
    # Scientific prose is retained verbatim; lead-ins become manuscript subsections.
    subsection=re.match(r'^\*\*(Sources and geometry|Matched observer and terrain|Intervals and refinement)\.\*\*\s*(.*)',block,re.S)
    if subsection:
        paragraph=tex(subsection[2])
        if subsection[1]=='Matched observer and terrain':
            paragraph=paragraph.replace('point (latitude ',r'point\newline (latitude ').replace(', east longitude ',r',\newline east longitude ')
        body.append(r'\subsection{'+tex(subsection[1])+'}\n'+paragraph)
    else:
        paragraph=tex(block.replace('\n',' '))
        body.append(paragraph)

preamble=r"""
\documentclass[conference,letterpaper]{IEEEtran}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{times}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage[hidelinks,breaklinks]{hyperref}
\hypersetup{pdftitle={Robustness Evaluation of South-Polar Observation and Lunar Visibility Estimates (RESOLVE)},pdfauthor={RESOLVE project},pdfsubject={Technical Research Note}}
\pagestyle{plain}
\setlength{\emergencystretch}{1em}
\begin{document}
"""
# Queue the wide mechanism figure before Results so it appears beside the
# scientific discussion, rather than after the references. Balance the last
# manuscript page follows the normal two-column text flow.
figure_block=next(b for b in body if b.startswith(r'\begin{figure*}'))
body.remove(figure_block)
body.insert(next(i for i,b in enumerate(body) if b==r'\section{Research progression}'),figure_block)
source=preamble+r'\title{'+tex(title)+'}\n'+r'\author{\IEEEauthorblockN{RESOLVE project}\IEEEauthorblockA{Decision-Convergence Auditing for Lunar South-Polar Visibility Models\\Technical Research Note --- NASA Space Apps Challenge 2026\\Version 2.1 \enspace | \enspace 15 November 2026}}'+'\n'+r'\maketitle'+'\n\n'+'\n\n'.join(body)+'\n\n'+r'\begin{thebibliography}{8}'+'\n'+ '\n'.join(references)+'\n'+r'\end{thebibliography}\end{document}'+'\n'
tex_path=ROOT/'docs/RESOLVE_Technical_Research_Note.tex'
tex_path.write_text(source,encoding='utf-8',newline='\n')
build=ROOT/'artifacts/manuscript-build';build.mkdir(parents=True,exist_ok=True)
engine=os.environ.get('RESOLVE_PDFLATEX') or shutil.which('pdflatex')
if not engine:raise RuntimeError('Install LaTeX with IEEEtran and the documented packages to build the manuscript.')
for run in range(2):
    flags=['--disable-installer'] if 'miktex' in engine.lower() else []
    result=subprocess.run([engine,*flags,'-interaction=nonstopmode','-halt-on-error','-file-line-error',f'-output-directory={build}',tex_path.name],cwd=ROOT/'docs',capture_output=True,text=True,encoding='utf-8',errors='replace')
    (build/f'compile-{run+1}.txt').write_text(result.stdout+'\n'+result.stderr,encoding='utf-8')
    if result.returncode:raise RuntimeError('LaTeX failed; inspect artifacts/manuscript-build/compile-'+str(run+1)+'.txt')
shutil.copyfile(build/PDF.name,PDF)
reader=PdfReader(PDF)
assert 3<=len(reader.pages)<=4,f'Expected 3-4 manuscript pages, got {len(reader.pages)}'
combined='\n'.join(page.extract_text() for page in reader.pages)
for required in expected+['1.647339','327.157','DE441']:
    assert required in combined,required
inputs=['src/data/audit.v1.json','src/data/science.v1.json','public/evidence/profiles/P78_5m.sections.v1.json','public/evidence/profiles/P90_80m.sections.v1.json','public/evidence/science/sources/a-finding.md','public/evidence/science/sources/b-protocol.md','public/evidence/science/sources/b-report.md','public/evidence/science/sources/c-protocol.md','public/evidence/science/sources/c-finding.md','public/evidence/science/sources/c-report.md','public/evidence/science/sources/c-numerical.json','public/evidence/science/sources/source-audit.md','public/evidence/science/sources/frame-audit.md','public/evidence/science/sources/literature-audit.md','public/evidence/science/sources/c-reproduce.md','public/evidence/frozen/terrain_cross_section.png','public/evidence/science/sources/response.csv']
bundle=ROOT/'docs/RESOLVE_Technical_Research_Note_source.zip'
with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED) as z:
    for path in [SOURCE,tex_path,figure_path]:z.write(path,path.name)
    z.write(Path(__file__),'build-research-note.py')
record=dict(schema='resolve.technical-note.v1',version='2.1',project_title='Robustness Evaluation of South-Polar Observation and Lunar Visibility Estimates (RESOLVE)',paper_subtitle='Decision-Convergence Auditing for Lunar South-Polar Visibility Models',date='2026-11-15',new_scientific_calculations=False,evidence_release='324d5b6a8d8b6cdd99a3d5ed314e5874268cb4de',pages=len(reader.pages),layout='Two-column conference manuscript, following the user-provided format reference; no publication or endorsement implied',pdf=ref('docs/'+PDF.name),editable_source=ref('docs/'+SOURCE.name),latex_source=ref('docs/'+tex_path.name),figure_file=ref('docs/'+figure_path.name),source_bundle=ref('docs/'+bundle.name),builder=ref('scripts/build-research-note.py'),figure='Vector redraw of exact frozen aligned profile samples; display coordinate mapping only',inputs=[ref(p) for p in inputs])
PROVENANCE.write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(dict(pages=len(reader.pages),pdf=record['pdf'],characters=len(combined))))
