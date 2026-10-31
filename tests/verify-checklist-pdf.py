"""QA opcional: executar após node --test tests/checklist-pdf.test.mjs, com pypdf/pdfplumber."""
from pathlib import Path
import re
import pdfplumber
from pypdf import PdfReader

root=Path('tmp/pdfs')
files=['checklist-validacao','checklist-contato-validacao','checklist-longo-validacao','checklist-sem-envio-validacao']
texts={}
for name in files:
 reader=PdfReader(root/f'{name}.pdf')
 text='\n'.join(page.extract_text() or '' for page in reader.pages)
 texts[name]=text
 assert text.count('Assinatura / Visto do Entregador (Motorista)')==1,name
 assert text.count('Data do recebimento:')==1,name
 for page in reader.pages:
  assert abs(float(page.mediabox.width)-595.28)<1 and abs(float(page.mediabox.height)-841.89)<1
  assert 'ROMANEIO DE EXPEDIÇÃO DE MATERIAIS' in (page.extract_text() or '')
 with pdfplumber.open(root/f'{name}.pdf') as pdf:
  for number,page in enumerate(pdf.pages,1):
   for word in page.extract_words():
    assert 35<=word['x0']<=word['x1']<=561,(name,number,word)
    assert 24<=word['top']<word['bottom']<=page.height-22,(name,number,word)
 print(f'{name}: {len(reader.pages)} página(s), A4, cabeçalho, assinaturas e margens OK')
assert len(PdfReader(root/'checklist-validacao.pdf').pages)==1
assert len(PdfReader(root/'checklist-contato-validacao.pdf').pages)==1
assert '9.007.199.254.740.993,123456789' in re.sub(r'\s+','',texts['checklist-validacao'])
for value in ['Rua de validação','Galpão de validação','Bairro de validação','Cidade de validação','(00) 00000-0000','Operador de validação','Pendente']:
 assert value in texts['checklist-contato-validacao'],value
assert '26/10/2026, 12:30:00' in texts['checklist-validacao']
assert 'Nome não cadastrado' in texts['checklist-validacao']
assert 'ENVIO ESTORNADO' in texts['checklist-longo-validacao']
assert 'SEM NOVO ENVIO' in texts['checklist-sem-envio-validacao']
for number in range(1,29):
 assert f'Item de validação {number} - tecido, zíper e alça' in re.sub(r'\s+',' ',texts['checklist-longo-validacao']),number
print('Conteúdo, precisão, fuso, contato, pendências e avisos OK')

