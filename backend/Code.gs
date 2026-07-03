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
  FINANCEIRO: 'Financeiro',
  VEICULOS:   'Veiculos',
  COBRANCA:   'Cobranca',
  COMPRAS:    'Compras',
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

    // Financeiro
    case 'getFinanceiro':    return getFinanceiro(params);
    case 'saveFinanceiro':   return save(SHEETS.FINANCEIRO, body, financeiroSchema());
    case 'deleteFinanceiro': return remove(SHEETS.FINANCEIRO, body.id);

    // Veículos
    case 'getVeiculos':    return getAll(SHEETS.VEICULOS);
    case 'saveVeiculo':    return save(SHEETS.VEICULOS, body, veiculoSchema());
    case 'deleteVeiculo':  return remove(SHEETS.VEICULOS, body.id);

    // Cobranças
    case 'getCobranca':    return getAll(SHEETS.COBRANCA);
    case 'saveCobranca':   return save(SHEETS.COBRANCA, body, cobrancaSchema());
    case 'deleteCobranca': return remove(SHEETS.COBRANCA, body.id);

    // Compras de Material
    case 'getCompras':     return getCompras(params);
    case 'saveCompra':     return saveCompra(body);
    case 'deleteCompra':   return remove(SHEETS.COMPRAS, body.id);

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
    keys.forEach((k, i) => {
      let val = row[i] !== undefined ? row[i] : '';
      // Converte objetos Date do Sheets para string ISO yyyy-MM-dd
      if (val instanceof Date && !isNaN(val.getTime())) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        val = y + '-' + m + '-' + d;
      }
      obj[k] = val;
    });
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

// ─── Financeiro com filtro ───────────────────────────────────

function getFinanceiro(params) {
  const sheet = getOrCreateSheet(SHEETS.FINANCEIRO, financeiroSchema().headers);
  let dados   = sheetToObjects(sheet, financeiroSchema().keys);

  // Filtros opcionais (usados pelo front quando quiser pré-filtrar no servidor)
  if (params.tipo)   dados = dados.filter(r => r.tipo   === params.tipo);
  if (params.cat)    dados = dados.filter(r => r.cat    === params.cat);
  if (params.status) dados = dados.filter(r => r.status === params.status);

  return dados;
}

// ─── Mão de Obra com filtro ──────────────────────────────────

function getMaoDeObra(params) {
  const sheet = getOrCreateSheet(SHEETS.MAO_OBRA, maoObraSchema().headers);
  const keys = maoObraSchema().keys;
  const all = sheetToObjects(sheet, keys);

  return all.filter(r => {
    if (params.funcionario && r.funcionario !== params.funcionario) return false;
    if (params.mes) {
      // r.data agora é sempre string ISO "yyyy-MM-dd" após sheetToObjects
      const rowMes = String(r.data).substring(0, 7);
      if (rowMes !== params.mes) return false;
    }
    return true;
  });
}

// ─── Dashboard ───────────────────────────────────────────────

function getDashboard() {
  const obras       = getAll(SHEETS.OBRAS);
  const moAll       = getAll(SHEETS.MAO_OBRA);
  const orcamentos  = getAll(SHEETS.ORCAMENTOS);

  // Obras
  const obrasAndamento = obras.filter(o => o.fase === 'ANDAMENTO').length;
  const totalPago      = obras.reduce((s, o) => s + (parseFloat(o.valorPago)    || 0), 0);
  const totalReceber   = obras.reduce((s, o) => s + (parseFloat(o.valorReceber) || 0), 0);
  const lucroTotal     = obras.reduce((s, o) => s + (parseFloat(o.lucro)        || 0), 0);
  const obrasPorFase   = obras.reduce((acc, o) => {
    const f = o.fase || 'Sem fase';
    acc[f] = (acc[f] || 0) + 1;
    return acc;
  }, {});

  // Mão de Obra — mês corrente
  const mesAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
  const moMes    = moAll.filter(r => String(r.data).substring(0, 7) === mesAtual);
  const moTotalValor  = moMes.reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);
  const moTotalVale   = moMes.reduce((s, r) => s + (parseFloat(r.vale)  || 0), 0);
  const moSaldo       = moTotalValor - moTotalVale;
  const moPorFunc     = {};
  moMes.forEach(r => {
    if (!moPorFunc[r.funcionario]) moPorFunc[r.funcionario] = { valor: 0, vale: 0 };
    moPorFunc[r.funcionario].valor += parseFloat(r.valor) || 0;
    moPorFunc[r.funcionario].vale  += parseFloat(r.vale)  || 0;
  });

  // Orçamentos
  const orcTotal     = orcamentos.length;
  const orcAprovados = orcamentos.filter(o => o.status === 'APROVADO').length;
  const orcAguardando= orcamentos.filter(o => o.status === 'AGUARDANDO').length;
  const orcValorTotal= orcamentos.reduce((s, o) => s + (parseFloat(o.valorTotal) || 0), 0);

  return {
    totalObras: obras.length,
    obrasAndamento,
    totalPago,
    totalReceber,
    lucroTotal,
    obras: obras.slice(-10).reverse(),
    obrasPorFase,
    mo: { mesAtual, totalValor: moTotalValor, totalVale: moTotalVale, saldo: moSaldo, porFunc: moPorFunc },
    orc: { total: orcTotal, aprovados: orcAprovados, aguardando: orcAguardando, valorTotal: orcValorTotal },
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
    case SHEETS.FINANCEIRO: return financeiroSchema();
    case SHEETS.VEICULOS:   return veiculoSchema();
    case SHEETS.COBRANCA:   return cobrancaSchema();
    case SHEETS.COMPRAS:    return compraSchema();
    default: throw new Error('Schema não encontrado para: ' + sheetName);
  }
}

function veiculoSchema() {
  return {
    headers: ['id', 'placa', 'modelo', 'motorista', 'data', 'horario', 'tipo', 'obs'],
    keys:    ['id', 'placa', 'modelo', 'motorista', 'data', 'horario', 'tipo', 'obs'],
  };
}

function cobrancaSchema() {
  return {
    headers: ['id', 'cliente', 'telefone', 'valorTotal', 'parcelas', 'diaVenc', 'obs', 'status', 'dataCadastro'],
    keys:    ['id', 'cliente', 'telefone', 'valorTotal', 'parcelas', 'diaVenc', 'obs', 'status', 'dataCadastro'],
  };
}

function compraSchema() {
  return {
    headers: ['id', 'obraId', 'obraNome', 'data', 'operador', 'itens', 'valorTotal', 'temNota', 'obs', 'dataCadastro'],
    keys:    ['id', 'obraId', 'obraNome', 'data', 'operador', 'itens', 'valorTotal', 'temNota', 'obs', 'dataCadastro'],
  };
}

function getCompras(params) {
  const sheet = getOrCreateSheet(SHEETS.COMPRAS, compraSchema().headers);
  let dados = sheetToObjects(sheet, compraSchema().keys);
  if (params.obraId) dados = dados.filter(r => r.obraId === params.obraId);
  return dados;
}

function saveCompra(body) {
  const result = save(SHEETS.COMPRAS, body, compraSchema());

  // Atualiza custo de material da obra vinculada
  if (body.obraId && body.valorTotal) {
    const sheet = getOrCreateSheet(SHEETS.OBRAS, obraSchema().headers);
    const all   = sheet.getDataRange().getValues();
    const keys  = obraSchema().keys;
    const matIdx = keys.indexOf('material') + 1;
    const custoIdx = keys.indexOf('custoObra') + 1;
    const lucroIdx = keys.indexOf('lucro') + 1;
    const moIdx = keys.indexOf('maoDeObra');
    const varIdx = keys.indexOf('variaveis');
    const orcIdx = keys.indexOf('valorOrcamento');

    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(body.obraId)) {
        const newMat = (parseFloat(all[i][matIdx - 1]) || 0) + parseFloat(body.valorTotal);
        const mo  = parseFloat(all[i][moIdx])  || 0;
        const vr  = parseFloat(all[i][varIdx]) || 0;
        const orc = parseFloat(all[i][orcIdx]) || 0;
        sheet.getRange(i + 1, matIdx).setValue(newMat);
        sheet.getRange(i + 1, custoIdx).setValue(mo + newMat + vr);
        sheet.getRange(i + 1, lucroIdx).setValue(orc - mo - newMat - vr);
        break;
      }
    }
  }

  return result;
}

function clienteSchema() {
  return {
    headers: ['id', 'nome', 'telefone', 'email', 'dataCadastro'],
    keys:    ['id', 'nome', 'telefone', 'email', 'dataCadastro'],
  };
}

function itemSchema() {
  return {
    headers: ['id', 'produto', 'preco', 'unidade'],
    keys:    ['id', 'produto', 'preco', 'unidade'],
  };
}

function obraSchema() {
  return {
    headers: ['id', 'nome', 'dtInicio', 'dtEntrega', 'fase', 'valorOrcamento', 'valorFechado', 'valorPago', 'valorReceber', 'variaveis', 'material', 'maoDeObra', 'custoObra', 'lucro', 'itens', 'pagamentos'],
    keys:    ['id', 'nome', 'dtInicio', 'dtEntrega', 'fase', 'valorOrcamento', 'valorFechado', 'valorPago', 'valorReceber', 'variaveis', 'material', 'maoDeObra', 'custoObra', 'lucro', 'itens', 'pagamentos'],
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

function financeiroSchema() {
  return {
    headers: ['id', 'tipo', 'cat', 'sub', 'tipod', 'desc', 'parceiro', 'valor', 'status', 'obs', 'emissao', 'venc', 'pag', 'parcela'],
    keys:    ['id', 'tipo', 'cat', 'sub', 'tipod', 'desc', 'parceiro', 'valor', 'status', 'obs', 'emissao', 'venc', 'pag', 'parcela'],
  };
}

// ─── Seed: dados de teste completos ─────────────────────────

/**
 * Roda UMA VEZ para popular todas as abas com dados fictícios.
 * Execute via: Apps Script → selecionar seedTestData → ▶ Executar
 * Para limpar tudo e recomeçar, execute clearAllData() primeiro.
 */
function seedTestData() {
  seedBaseItens();
  seedClientes();
  seedObras();
  seedMaoDeObra();
  seedOrcamentos();
  Logger.log('✅ Seed completo! Todas as abas foram populadas.');
}

function clearAllData() {
  Object.values(SHEETS).forEach(name => {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      const last = sheet.getLastRow();
      if (last > 1) sheet.deleteRows(2, last - 1);
    }
  });
  Logger.log('🗑️ Todos os dados foram apagados (cabeçalhos mantidos).');
}

function seedClientes() {
  const sheet = getOrCreateSheet(SHEETS.CLIENTES, clienteSchema().headers);
  if (sheet.getLastRow() > 1) { Logger.log('Clientes já populados.'); return; }

  const clientes = [
    ['João Marcos Ferreira',   '(62) 99821-4455', 'joaomarcos@gmail.com',     '2025-08-10'],
    ['Padre Máximo Silva',     '(62) 98745-3321', 'padremaximo@diocese.org',  '2025-09-15'],
    ['Dinamar Construções',    '(62) 99632-1187', 'dinamar@construtora.com',  '2025-10-02'],
    ['Iuri Pet Shop',          '(62) 98811-5599', 'iuri@petshop.com.br',      '2025-11-20'],
    ['Ezequiel Pirenópolis',   '(64) 99134-7762', 'ezequiel@email.com',       '2026-01-08'],
    ['Erik Borges',            '(62) 99207-8843', 'erikborges@gmail.com',     '2026-02-14'],
    ['BRG Fábrica',            '(62) 3201-4400',  'contato@brg.ind.br',       '2026-02-28'],
    ['Igreja Nerópolis',       '(62) 98900-1122', 'igrejaneropolis@gmail.com','2026-03-05'],
    ['Renato Cavalcante',      '(62) 99455-8876', 'renato.c@gmail.com',       '2026-03-18'],
    ['Ana Beatriz Souza',      '(62) 99022-6631', 'anabeatriz@hotmail.com',   '2026-04-01'],
  ];

  clientes.forEach(([nome, telefone, email, dataCadastro]) => {
    sheet.appendRow([Utilities.getUuid(), nome, telefone, email, dataCadastro]);
  });
  Logger.log('Clientes: ' + clientes.length + ' registros inseridos.');
}

function seedObras() {
  const sheet = getOrCreateSheet(SHEETS.OBRAS, obraSchema().headers);
  if (sheet.getLastRow() > 1) { Logger.log('Obras já populadas.'); return; }

  // itens de exemplo para popular
  const itensIgreja = JSON.stringify([
    {produto:'PLACA RF 1,20x2,40', qtd:60, precoUnit:75, total:4500},
    {produto:'MONTANTE 70 - STEEL', qtd:80, precoUnit:70, total:5600},
    {produto:'GUIA 70 STEEL', qtd:40, precoUnit:70, total:2800},
    {produto:'LÃ DE VIDRO', qtd:8, precoUnit:145, total:1160},
    {produto:'PARAFUSO 25', qtd:8, precoUnit:50, total:400},
    {produto:'BASECOAT', qtd:6, precoUnit:75, total:450},
  ]);
  const itensDimar = JSON.stringify([
    {produto:'PLACA ST 1,20x2,40', qtd:30, precoUnit:50, total:1500},
    {produto:'MONTANTE 48', qtd:40, precoUnit:18.90, total:756},
    {produto:'GUIA 48', qtd:30, precoUnit:15.50, total:465},
    {produto:'GESSO COLA 20KG', qtd:8, precoUnit:30, total:240},
    {produto:'FITA TELADA 90m', qtd:4, precoUnit:26, total:104},
  ]);
  const itensPetShop = JSON.stringify([
    {produto:'PLACA ST 1,20x2,40', qtd:80, precoUnit:50, total:4000},
    {produto:'MONTANTE 70', qtd:100, precoUnit:22, total:2200},
    {produto:'GUIA 70', qtd:60, precoUnit:19, total:1140},
    {produto:'KIT PORTA 70/80/90', qtd:3, precoUnit:480, total:1440},
    {produto:'MASSA KNAUF 28Kg', qtd:10, precoUnit:70, total:700},
  ]);
  const itensPirenopolis = JSON.stringify([
    {produto:'PLACA ST 1,20x1,80', qtd:40, precoUnit:35.90, total:1436},
    {produto:'MONTANTE 70', qtd:50, precoUnit:22, total:1100},
    {produto:'GUIA 70', qtd:30, precoUnit:19, total:570},
    {produto:'BASECOAT', qtd:8, precoUnit:75, total:600},
    {produto:'FITA TELADA 90m', qtd:6, precoUnit:26, total:156},
  ]);
  const itensDeck = JSON.stringify([
    {produto:'PAINEL WALL', qtd:8, precoUnit:350, total:2800},
    {produto:'MONTANTE 70 - STEEL', qtd:10, precoUnit:70, total:700},
    {produto:'GUIA 70 STEEL', qtd:8, precoUnit:70, total:560},
    {produto:'PARAFUSO 4,2X13mm BROCA', qtd:2, precoUnit:47, total:94},
  ]);
  const itensAnaBeatriz = JSON.stringify([
    {produto:'GESSO COLA 20KG', qtd:10, precoUnit:30, total:300},
    {produto:'MONTANTE 70', qtd:40, precoUnit:22, total:880},
    {produto:'GUIA 70', qtd:30, precoUnit:19, total:570},
    {produto:'PLACA ST 1,20x2,40', qtd:50, precoUnit:50, total:2500},
    {produto:'BASECOAT', qtd:8, precoUnit:75, total:600},
  ]);

  // [nome, dtInicio, dtEntrega, fase, valorOrcamento, valorFechado, valorPago, valorReceber, variaveis, material, maoDeObra, custoObra, lucro, itens]
  const obras = [
    ['OBRA IGREJA PE MAX',              '2026-04-07','',           'EXECUTADO', 43940, 43940, 43940, 0,    7000,12550,10000,29550,14390, itensIgreja   ],
    ['OBRA DINAMAR ALVORADA',           '2026-03-15','2026-04-20','EXECUTADO', 10000, 10000, 10000, 0,    0,   4900, 3200, 8100, 1900, itensDimar    ],
    ['OBRA IURI PET SHOP',              '2026-03-20','',           'ANDAMENTO',21950, 21950, 21950, 0,    0,   9843, 4660,14503, 7447, itensPetShop  ],
    ['OBRA JM FORRO PVC',               '2026-04-10','',           'ANDAMENTO', 8500,  8500,  4250, 4250, 0,   2800, 1800, 4600, 3900, ''            ],
    ['OBRA JM EQUATORIAL BRASÍLIA',     '2026-04-01','2026-04-08','EXECUTADO',  4000,  4000,  4000, 0,    0,      0,    0,    0, 4000, ''            ],
    ['OBRA EZEQUIEL PIRENÓPOLIS',       '2026-03-10','2026-04-05','EXECUTADO', 16400, 15103, 15103, 0,  600,   5300, 3800, 9700, 5403, itensPirenopolis],
    ['OBRA ERICK CONSULTÓRIO',          '2026-04-13','',           'EXECUTADO',  7300,  7300,     0, 7300, 0,      0,    0,    0, 7300, ''            ],
    ['OBRA IGREJA NERÓPOLIS PE EDISON', '2026-02-20','2026-03-30','EXECUTADO',  7500,  7500,  7500, 0,    0,      0,    0,    0, 7500, ''            ],
    ['OBRA BRG PAREDE E FORRO FÁBRICA', '2026-04-14','',           'EXECUTADO',  2900,  2900,     0, 2900, 0,      0,    0,    0, 2900, ''            ],
    ['OBRA ERIK BORGES DECK',           '2026-04-20','',           'ANDAMENTO',  5490,  5490,     0, 5490, 0,      0,    0,    0, 5490, itensDeck     ],
    ['OBRA RENATO CAVALCANTE PAREDE',   '2026-04-22','',           'ANDAMENTO',  3800,  3800,  1900, 1900, 0,   1200,  900, 2100, 1700, ''            ],
    ['OBRA ANA BEATRIZ GESSO',          '2026-05-02','',           'ORÇAMENTO', 12000, 12000,     0,12000, 0,      0,    0,    0,    0, itensAnaBeatriz],
  ];

  obras.forEach(([nome, dtInicio, dtEntrega, fase, valorOrcamento, valorFechado, valorPago, valorReceber, variaveis, material, maoDeObra, custoObra, lucro, itens]) => {
    sheet.appendRow([Utilities.getUuid(), nome, dtInicio, dtEntrega, fase, valorOrcamento, valorFechado, valorPago, valorReceber, variaveis, material, maoDeObra, custoObra, lucro, itens]);
  });
  Logger.log('Obras: ' + obras.length + ' registros inseridos.');
}

function seedMaoDeObra() {
  const sheet = getOrCreateSheet(SHEETS.MAO_OBRA, maoObraSchema().headers);
  if (sheet.getLastRow() > 1) { Logger.log('MO já populada.'); return; }

  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  function diaSemana(dateStr) {
    const [y,m,d] = dateStr.split('-');
    return dias[new Date(y, m-1, d).getDay()];
  }

  // [funcionario, data, servico, valor, vale]
  const lancamentos = [
    // ── MARÇO ──
    ['Thadeu',  '2026-03-03','Saldo Alfa',              1200, 100 ],
    ['Thadeu',  '2026-03-04','Reparos Alfa',             300,  50  ],
    ['Thadeu',  '2026-03-06','Candeeiro',                150, 200  ],
    ['Thadeu',  '2026-03-10','Leopoldo Escola',          200, 245  ],
    ['Thadeu',  '2026-03-11','Gran Lef',                 300, 892  ],
    ['Thadeu',  '2026-03-17','Candeeiro',                400,   0  ],
    ['Thadeu',  '2026-03-18','Candeeiro',                400,   0  ],
    ['Thadeu',  '2026-03-24','Igreja Ouro Verde',       1200,   0  ],
    ['Thadeu',  '2026-03-25','Igreja Ouro Verde',        800, 200  ],
    ['Thadeu',  '2026-03-31','Tamboleco',                100, 200  ],
    ['Vitor',   '2026-03-02','Doce Paladar',               0,   0  ],
    ['Vitor',   '2026-03-09','Doce Paladar',               0, 188  ],
    ['Vitor',   '2026-03-10','Doce Paladar',               0,   0  ],
    ['Vitor',   '2026-03-13','Doce Paladar',               0, 1300 ],
    ['Vitor',   '2026-03-17','Gran Lef',                 500,   0  ],
    ['Vitor',   '2026-03-18','Demolição Marco',          540,   0  ],
    ['Vitor',   '2026-03-24','Forro BRG',                200,   0  ],
    ['Vitor',   '2026-03-25','Forro BRG',                350,   0  ],
    ['Gabriel', '2026-03-02','Saldo Alfa',               605,   0  ],
    ['Gabriel', '2026-03-03','Reparos Alfa',             200,   0  ],
    ['Gabriel', '2026-03-10','Candeeiro',               1250, 188  ],
    ['Gabriel', '2026-03-11','Gran Lef',                 400,   0  ],
    ['Gabriel', '2026-03-17','Leopoldo Escola',          390, 745  ],
    ['Gabriel', '2026-03-18','Demolição Marco',          540,   0  ],
    ['Gabriel', '2026-03-24','Forro BRG',                200,   0  ],
    ['Gabriel', '2026-03-31','Leopoldo de Bulhões',      650,   0  ],
    ['Dim',     '2026-03-02','Saldo Alfa',               655,   0  ],
    ['Dim',     '2026-03-03','Reparos Alfa',             200,   0  ],
    ['Dim',     '2026-03-10','Candeeiro',               1250, 188  ],
    ['Dim',     '2026-03-11','Gran Lef',                 400,   0  ],
    ['Dim',     '2026-03-17','Leopoldo Escola',          390, 645  ],
    ['Dim',     '2026-03-25','Gran Laif',                100,   0  ],
    ['Dim',     '2026-03-31','Leopoldo de Bulhões',      650,   0  ],
    ['Edir',    '2026-03-06','Obra Joelson',            2400, 1500 ],
    ['Edir',    '2026-03-17','Obra Pet Shop',           4660,   0  ],
    ['Edir',    '2026-03-24','Obra Erick',              1400, 188  ],
    ['Leandro', '2026-03-03','Candeeiro',                200,   0  ],
    ['Leandro', '2026-03-04','Lavagem S10',               70,   0  ],
    ['Leandro', '2026-03-06','Semana',                   600,   0  ],
    ['Leandro', '2026-03-11','Remoção Forro Marcos',     180, 111  ],
    ['Leandro', '2026-03-12','Demolição Coxinha',        350,   0  ],
    ['Leandro', '2026-03-13','Semana',                   600,   0  ],
    // ── ABRIL ──
    ['Thadeu',  '2026-04-01','Igreja Ouro Verde',       1700, 100  ],
    ['Thadeu',  '2026-04-03','Semana Passada',          1200, 1400 ],
    ['Thadeu',  '2026-04-06','Equatorial Brasília',      800,   0  ],
    ['Thadeu',  '2026-04-10','CMM',                      250, 400  ],
    ['Thadeu',  '2026-04-15','Equatorial PVC',           300, 300  ],
    ['Thadeu',  '2026-04-17','Igreja',                  5000, 200  ],
    ['Vitor',   '2026-04-06','Igreja',                     0, 200  ],
    ['Vitor',   '2026-04-11','CMM',                      250, 250  ],
    ['Vitor',   '2026-04-13','Igreja',                     0, 1700 ],
    ['Vitor',   '2026-04-17','Igreja',                  5000,   0  ],
    ['Vitor',   '2026-04-20','Doce Paladar',            1450,   0  ],
    ['Vitor',   '2026-04-22','Renato Parede Reparos',    260,   0  ],
    ['Vitor',   '2026-04-23','BRG Parede e Forro',       350,   0  ],
    ['Gabriel', '2026-04-06','Gran Life',                150,   0  ],
    ['Gabriel', '2026-04-07','Reparos',                  150,   0  ],
    ['Gabriel', '2026-04-10','Dinamar',                 1600, 150  ],
    ['Gabriel', '2026-04-17','Obra Pirenópolis',        2000, 188  ],
    ['Gabriel', '2026-04-20','Igreja',                     0, 1700 ],
    ['Dim',     '2026-04-06','Gran Life',                150,   0  ],
    ['Dim',     '2026-04-07','Reparos',                  150,   0  ],
    ['Dim',     '2026-04-10','Dinamar',                 1600,   0  ],
    ['Dim',     '2026-04-17','Obra Pirenópolis',        2000, 188  ],
    ['Dim',     '2026-04-20','Pirenópolis',                0,   0  ],
    ['Edir',    '2026-04-13','Obra Pet Shop',           4660,   0  ],
    ['Edir',    '2026-04-16','Obra Erick',                 0,   0  ],
    ['Edir',    '2026-04-17','Obra Erick',              1400, 188  ],
    ['Edir',    '2026-04-20','Saldo Semana',            1872,   0  ],
    ['Edir',    '2026-04-22','Obra Hangar',                0,   0  ],
    ['Edir',    '2026-04-23','Obra Erick',               250,   0  ],
    ['Edir',    '2026-04-24','Leonel Reparos',           400, 1000 ],
    ['Leandro', '2026-04-06','Obra Igreja',                0,   0  ],
    ['Leandro', '2026-04-09','Ajuda Dim',                700,   0  ],
    ['Leandro', '2026-04-10','Diária',                   155,   0  ],
    ['Leandro', '2026-04-13','Obra Igreja',                0,   0  ],
    // ── MAIO ──
    ['Thadeu',  '2026-05-02','Obra Ana Beatriz',         600,   0  ],
    ['Thadeu',  '2026-05-05','Obra Renato',              800, 300  ],
    ['Gabriel', '2026-05-02','Obra Ana Beatriz',         600,   0  ],
    ['Gabriel', '2026-05-05','Obra BRG Reparo',          400,   0  ],
    ['Dim',     '2026-05-02','Obra Ana Beatriz',         600,   0  ],
    ['Dim',     '2026-05-05','Ajuda Gabriel',            350,   0  ],
    ['Vitor',   '2026-05-03','Acabamento Dinamar',       500, 200  ],
    ['Edir',    '2026-05-02','Obra Erik Deck',           900,   0  ],
    ['Edir',    '2026-05-05','Obra Erik Deck',           600, 188  ],
    ['Leandro', '2026-05-03','Transporte Materiais',     200,   0  ],
  ];

  lancamentos.forEach(([funcionario, data, servico, valor, vale]) => {
    sheet.appendRow([Utilities.getUuid(), funcionario, data, diaSemana(data), servico, valor, vale]);
  });
  Logger.log('Mão de Obra: ' + lancamentos.length + ' registros inseridos.');
}

function seedOrcamentos() {
  const sheet = getOrCreateSheet(SHEETS.ORCAMENTOS, orcamentoSchema().headers);
  if (sheet.getLastRow() > 1) { Logger.log('Orçamentos já populados.'); return; }

  const orcamentos = [
    {
      cliente: 'Ana Beatriz Souza', telefone: '(62) 99022-6631', email: 'anabeatriz@hotmail.com',
      data: '2026-04-28', status: 'APROVADO', obs: 'Forro de gesso sala + quarto. Entrega em 15 dias.',
      valorTotal: 12000,
      itens: JSON.stringify([
        { produto: 'GESSO COLA 20KG',    qtd: 10, precoUnit: 30,   total: 300  },
        { produto: 'MONTANTE 70',         qtd: 40, precoUnit: 22,   total: 880  },
        { produto: 'GUIA 70',             qtd: 30, precoUnit: 19,   total: 570  },
        { produto: 'PLACA ST 1,20x2,40', qtd: 50, precoUnit: 50,   total: 2500 },
        { produto: 'PARAFUSO 25',         qtd: 5,  precoUnit: 50,   total: 250  },
        { produto: 'FITA TELADA 90m',     qtd: 6,  precoUnit: 26,   total: 156  },
        { produto: 'BASECOAT',            qtd: 8,  precoUnit: 75,   total: 600  },
      ])
    },
    {
      cliente: 'Renato Cavalcante', telefone: '(62) 99455-8876', email: 'renato.c@gmail.com',
      data: '2026-04-15', status: 'APROVADO', obs: 'Divisória parede escritório.',
      valorTotal: 3800,
      itens: JSON.stringify([
        { produto: 'MONTANTE 48',   qtd: 20, precoUnit: 18.90, total: 378  },
        { produto: 'GUIA 48',       qtd: 15, precoUnit: 15.50, total: 232.5},
        { produto: 'PLACA ST 1,20x1,80', qtd: 20, precoUnit: 35.90, total: 718},
        { produto: 'PARAFUSO 25',   qtd: 3,  precoUnit: 50,    total: 150  },
        { produto: 'MASSA KNAUF 28Kg', qtd: 4, precoUnit: 70,  total: 280  },
      ])
    },
    {
      cliente: 'João Marcos Ferreira', telefone: '(62) 99821-4455', email: 'joaomarcos@gmail.com',
      data: '2026-03-10', status: 'APROVADO', obs: 'Forro PVC banheiro e lavabo.',
      valorTotal: 8500,
      itens: JSON.stringify([
        { produto: 'PLACA CIMENTÍCIA',   qtd: 15, precoUnit: 95,  total: 1425 },
        { produto: 'MONTANTE 70',         qtd: 25, precoUnit: 22,  total: 550  },
        { produto: 'GUIA 70',             qtd: 20, precoUnit: 19,  total: 380  },
        { produto: 'BASECOAT',            qtd: 5,  precoUnit: 75,  total: 375  },
        { produto: 'FITA TELADA GLASSROC',qtd: 3,  precoUnit: 80,  total: 240  },
      ])
    },
    {
      cliente: 'Iuri Pet Shop', telefone: '(62) 98811-5599', email: 'iuri@petshop.com.br',
      data: '2026-03-18', status: 'APROVADO', obs: 'Drywall completo loja nova. Inclui divisórias e forro.',
      valorTotal: 21950,
      itens: JSON.stringify([
        { produto: 'PLACA ST 1,20x2,40', qtd: 80,  precoUnit: 50,   total: 4000 },
        { produto: 'MONTANTE 70',         qtd: 100, precoUnit: 22,   total: 2200 },
        { produto: 'GUIA 70',             qtd: 60,  precoUnit: 19,   total: 1140 },
        { produto: 'KIT PORTA 70/80/90',  qtd: 3,   precoUnit: 480,  total: 1440 },
        { produto: 'PARAFUSO 25',         qtd: 8,   precoUnit: 50,   total: 400  },
        { produto: 'MASSA KNAUF 28Kg',    qtd: 10,  precoUnit: 70,   total: 700  },
        { produto: 'BASECOAT',            qtd: 12,  precoUnit: 75,   total: 900  },
      ])
    },
    {
      cliente: 'Erik Borges', telefone: '(62) 99207-8843', email: 'erikborges@gmail.com',
      data: '2026-04-18', status: 'AGUARDANDO', obs: 'Deck externo + painel wall varanda.',
      valorTotal: 5490,
      itens: JSON.stringify([
        { produto: 'PAINEL WALL',         qtd: 8,  precoUnit: 350, total: 2800 },
        { produto: 'MONTANTE 70 - STEEL', qtd: 10, precoUnit: 70,  total: 700  },
        { produto: 'GUIA 70 STEEL',       qtd: 8,  precoUnit: 70,  total: 560  },
        { produto: 'PARAFUSO 4,2X13mm BROCA', qtd: 2, precoUnit: 47, total: 94 },
      ])
    },
    {
      cliente: 'BRG Fábrica', telefone: '(62) 3201-4400', email: 'contato@brg.ind.br',
      data: '2026-02-25', status: 'RECUSADO', obs: 'Cliente optou por outro fornecedor.',
      valorTotal: 6200,
      itens: JSON.stringify([
        { produto: 'PLACA RF 1,20x2,40', qtd: 20, precoUnit: 75,  total: 1500 },
        { produto: 'MONTANTE 90',         qtd: 30, precoUnit: 25,  total: 750  },
        { produto: 'GUIA 90',             qtd: 20, precoUnit: 20,  total: 400  },
        { produto: 'LÃ DE VIDRO',         qtd: 5,  precoUnit: 145, total: 725  },
      ])
    },
  ];

  orcamentos.forEach(o => {
    sheet.appendRow([Utilities.getUuid(), o.cliente, o.telefone, o.email, o.data, o.status, o.obs, o.itens, o.valorTotal]);
  });
  Logger.log('Orçamentos: ' + orcamentos.length + ' registros inseridos.');
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
