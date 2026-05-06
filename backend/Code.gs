// ============================================================
// ERP ANAGESSO — Google Apps Script Backend
// Publicar como Web App: Execute as "Me", Access "Anyone"
// ============================================================

const SHEET_ID = '1OCSym2u661RToOwn795zvIFWDLSXi2pbVDmdhF80CBs'; // Cole o ID da planilha aqui

const SHEETS = {
  CLIENTES:   'Clientes',
  ITENS:      'Base_Itens',
  OBRAS:      'Obras',
  MAO_OBRA:   'Controle_MO',
  ORCAMENTOS: 'Orcamentos',
};

// ─── CORS / Entry Points ────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  const params = e.parameter;
  try {
    const result = dispatch(action, params, null);
    return jsonResponse({ data: result });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (_) {}
  const action = body.action;
  try {
    const result = dispatch(action, {}, body);
    return jsonResponse({ data: result });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function jsonResponse(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function dispatch(action, params, body) {
  switch (action) {
    // Clientes
    case 'getClientes':   return getAll(SHEETS.CLIENTES);
    case 'saveCliente':   return save(SHEETS.CLIENTES, body, clienteSchema());
    case 'deleteCliente': return remove(SHEETS.CLIENTES, body.id);

    // Itens
    case 'getItens':   return getAll(SHEETS.ITENS);
    case 'saveItem':   return save(SHEETS.ITENS, body, itemSchema());
    case 'deleteItem': return remove(SHEETS.ITENS, body.id);

    // Obras
    case 'getObras':   return getAll(SHEETS.OBRAS);
    case 'saveObra':   return save(SHEETS.OBRAS, body, obraSchema());
    case 'deleteObra': return remove(SHEETS.OBRAS, body.id);

    // Mão de Obra
    case 'getMaoDeObra': return getMaoDeObra(params);
    case 'saveMaoDeObra': return save(SHEETS.MAO_OBRA, body, maoObraSchema());
    case 'deleteMaoDeObra': return remove(SHEETS.MAO_OBRA, body.id);

    // Orçamentos
    case 'getOrcamentos':   return getAll(SHEETS.ORCAMENTOS);
    case 'saveOrcamento':   return save(SHEETS.ORCAMENTOS, body, orcamentoSchema());
    case 'deleteOrcamento': return remove(SHEETS.ORCAMENTOS, body.id);

    // Dashboard
    case 'getDashboard': return getDashboard();

    default: throw new Error('Ação desconhecida: ' + action);
  }
}

// ─── Helpers ────────────────────────────────────────────────

function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sheetToObjects(sheet, keys) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(row => {
    const obj = {};
    keys.forEach((k, i) => { obj[k] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  }).filter(r => r.id);
}

function getAll(sheetName) {
  const schema = getSchema(sheetName);
  const sheet = getOrCreateSheet(sheetName, schema.headers);
  return sheetToObjects(sheet, schema.keys);
}

function save(sheetName, data, schema) {
  const sheet = getOrCreateSheet(sheetName, schema.headers);
  const keys = schema.keys;

  if (data.id) {
    // Update
    const all = sheet.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(data.id)) {
        const row = keys.map(k => data[k] !== undefined ? data[k] : '');
        sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        return { id: data.id, updated: true };
      }
    }
  }

  // Insert
  const id = Utilities.getUuid();
  data.id = id;
  if (!data.dataCadastro && keys.includes('dataCadastro')) {
    data.dataCadastro = new Date().toISOString().split('T')[0];
  }
  const row = keys.map(k => data[k] !== undefined ? data[k] : '');
  sheet.appendRow(row);
  return { id, created: true };
}

function remove(sheetName, id) {
  const schema = getSchema(sheetName);
  const sheet = getOrCreateSheet(sheetName, schema.headers);
  const all = sheet.getDataRange().getValues();
  for (let i = 1; i < all.length; i++) {
    if (String(all[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  throw new Error('Registro não encontrado: ' + id);
}

// ─── Mão de Obra com filtro ──────────────────────────────────

function getMaoDeObra(params) {
  const sheet = getOrCreateSheet(SHEETS.MAO_OBRA, maoObraSchema().headers);
  const keys = maoObraSchema().keys;
  const all = sheetToObjects(sheet, keys);

  return all.filter(r => {
    if (params.funcionario && r.funcionario !== params.funcionario) return false;
    if (params.mes) {
      const rowMes = String(r.data).slice(0, 7);
      if (rowMes !== params.mes) return false;
    }
    return true;
  });
}

// ─── Dashboard ───────────────────────────────────────────────

function getDashboard() {
  const obras = getAll(SHEETS.OBRAS);
  const obrasAndamento = obras.filter(o => o.fase === 'ANDAMENTO').length;
  const totalPago = obras.reduce((s, o) => s + (parseFloat(o.valorPago) || 0), 0);
  const totalReceber = obras.reduce((s, o) => s + (parseFloat(o.valorReceber) || 0), 0);
  const lucroTotal = obras.reduce((s, o) => s + (parseFloat(o.lucro) || 0), 0);

  const obrasPorFase = obras.reduce((acc, o) => {
    const f = o.fase || 'Sem fase';
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {});

  return {
    totalObras: obras.length,
    obrasAndamento,
    totalPago,
    totalReceber,
    lucroTotal,
    obras: obras.slice(-10).reverse(),
    obrasPorFase,
  };
}

// ─── Schemas ────────────────────────────────────────────────

function getSchema(sheetName) {
  switch (sheetName) {
    case SHEETS.CLIENTES:   return clienteSchema();
    case SHEETS.ITENS:      return itemSchema();
    case SHEETS.OBRAS:      return obraSchema();
    case SHEETS.MAO_OBRA:   return maoObraSchema();
    case SHEETS.ORCAMENTOS: return orcamentoSchema();
    default: throw new Error('Schema não encontrado para: ' + sheetName);
  }
}

function clienteSchema() {
  return {
    headers: ['id', 'nome', 'telefone', 'email', 'dataCadastro'],
    keys:    ['id', 'nome', 'telefone', 'email', 'dataCadastro'],
  };
}

function itemSchema() {
  return {
    headers: ['id', 'produto', 'preco'],
    keys:    ['id', 'produto', 'preco'],
  };
}

function obraSchema() {
  return {
    headers: ['id', 'nome', 'dtInicio', 'dtEntrega', 'fase', 'valorOrcamento', 'valorFechado', 'valorPago', 'valorReceber', 'variaveis', 'material', 'maoDeObra', 'custoObra', 'lucro'],
    keys:    ['id', 'nome', 'dtInicio', 'dtEntrega', 'fase', 'valorOrcamento', 'valorFechado', 'valorPago', 'valorReceber', 'variaveis', 'material', 'maoDeObra', 'custoObra', 'lucro'],
  };
}

function maoObraSchema() {
  return {
    headers: ['id', 'funcionario', 'data', 'dia', 'servico', 'valor', 'vale'],
    keys:    ['id', 'funcionario', 'data', 'dia', 'servico', 'valor', 'vale'],
  };
}

function orcamentoSchema() {
  return {
    headers: ['id', 'cliente', 'telefone', 'email', 'data', 'status', 'obs', 'itens', 'valorTotal'],
    keys:    ['id', 'cliente', 'telefone', 'email', 'data', 'status', 'obs', 'itens', 'valorTotal'],
  };
}

// ─── Seed: importar Base de Itens inicial ───────────────────

function seedBaseItens() {
  const itens = [
    'ALÇAPÃO 20x20cm,35','ALÇAPÃO 30x30cm,50','ALÇAPÃO 50x50cm,75',
    'ARAME N 10 GALVANIZADO,21','ARAME N 20 GALVANIZADO,15','BASECOAT,75',
    'BOISERIE (m),2.50','BROCA SDS 5mm,16','BROCA SDS 6mm,16','BUCHA 6mm,0.10',
    'CANTONEIRAS,8.50','FILETE 3cm,1.00','FILETE 5cm,1.20','FITA DUPLA FASE,37',
    'FITA TELADA 90m,26','FITA TELADA GLASSROC,80','GESSO,24','GESSO COLA 20KG,30',
    'GESSO COLA 5KG,12','GUIA 48,15.50','GUIA 70,19','GUIA 70 STEEL,70',
    'GUIA 90,20','GUIA 90 STEEL,70','KIT PORTA 100cm,750','KIT PORTA 70/80/90,480',
    'LÃ DE VIDRO,145','MASSA KNAUF 28Kg,70','MASSA PLACA ACUSTICA,70',
    'MOLDURA 2 DEGRAUS (8cm),2.40','MONTANTE 48,18.90','MONTANTE 70,22',
    'MONTANTE 70 - STEEL,70','MONTANTE 90,25','MONTANTE 90 - STEEL,70',
    'PARAFUSO 25,50','PARAFUSO 35,60','PARAFUSO 4,2X13mm BROCA,47',
    'PARAFUSO 6mm,0.20','PARAFUSO GLASROC X,100','PERFIL CANALETA F530,13.99',
    'PLACA ACÚSTICA,350','PLACA CIMENTÍCIA,95','PLACA GESSO 60x60cm,5',
    'PLACA GLASSROC 1,20x2,40,220','PLACA RF 1,20x1,80,55','PLACA RF 1,20x2,40,75',
    'PLACA RU 1,20x1,80,47.90','PLACA RU 1,20x2,40,64','PLACA ST 1,20x1,80,35.90',
    'PLACA ST 1,20x2,40,50','PREGO AÇO,7.70','REBITE PCT C/ 500UND,80',
    'REGULADOR F530 ANÃO,1.30','REGULADOR F530 NORMAL,1.30','SACO DE LIXO,0.50',
    'SINZAL 1Kg,5','TABICA GESSO 5cm,2.50','TABICA GESSO 7cm,3.25',
    'TABICA METÁLICA BRANCA,16.50','PAINEL WALL,350','EMENDA F530,1.00',
    'ELEMENTO MULTIFUNÇÃO,1.00','ALÇAPÃO CLIK 40X40,100','ALÇAPÃO CLIK 60X60,180',
    'ESPUMA EXPANSIVA,20',
  ];

  const sheet = getOrCreateSheet(SHEETS.ITENS, itemSchema().headers);
  const existing = sheet.getDataRange().getValues();
  if (existing.length > 1) {
    Logger.log('Base de itens já populada. Seed ignorado.');
    return;
  }

  itens.forEach(linha => {
    const partes = linha.split(',');
    const preco = partes.pop();
    const produto = partes.join(',');
    sheet.appendRow([Utilities.getUuid(), produto.trim(), parseFloat(preco)]);
  });
  Logger.log('Seed da Base de Itens concluído!');
}
