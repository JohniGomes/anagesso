/* ── FUNCIONÁRIOS (localStorage) ─────────────────────────────
   Usa CONFIG.funcionarios como lista padrão na primeira vez.
   Depois persiste em localStorage para permitir add/remove.
────────────────────────────────────────────────────────────── */
const Funcionarios = {
  KEY: 'anagesso_funcionarios',

  get() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) return JSON.parse(raw);
    // primeira vez: seed a partir de CONFIG
    this.set(CONFIG.funcionarios);
    return [...CONFIG.funcionarios];
  },

  set(lista) {
    localStorage.setItem(this.KEY, JSON.stringify(lista));
  },

  add(nome) {
    nome = nome.trim();
    if (!nome) return false;
    const lista = this.get();
    if (lista.some(f => f.toLowerCase() === nome.toLowerCase())) return false;
    lista.push(nome);
    this.set(lista);
    return true;
  },

  remove(nome) {
    const lista = this.get().filter(f => f !== nome);
    this.set(lista);
  },
};

/* ── MÃO DE OBRA ─────────────────────────────────────────── */
const MaoDeObra = {
  dados: [],
  dadosFiltrados: [],

  async render() {
    document.getElementById('pageTitle').textContent = 'Controle de Mão de Obra';
    const mesAtual = new Date().toISOString().slice(0, 7);
    this._renderHtml(mesAtual);
    this.atualizarDia();
    await this.buscar();
  },

  _renderHtml(mesAtual) {
    const funcs = Funcionarios.get();
    document.getElementById('content').innerHTML = `
      <!-- Filtros -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-3">
          <div class="row g-2 align-items-end">
            <div class="col-6 col-md-3">
              <label class="form-label mb-1 small fw-semibold">Funcionário</label>
              <select class="form-select form-select-sm" id="filtroFunc" onchange="MaoDeObra.aplicarFiltros()">
                <option value="">Todos</option>
                ${funcs.map(f => `<option value="${f}">${f}</option>`).join('')}
              </select>
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label mb-1 small fw-semibold">Mês</label>
              <input type="month" class="form-control form-control-sm" id="filtroMes" value="${mesAtual}"
                onchange="MaoDeObra.buscar()">
            </div>
            <div class="col-6 col-md-3">
              <label class="form-label mb-1 small fw-semibold">Semana</label>
              <select class="form-select form-select-sm" id="filtroSemana" onchange="MaoDeObra.aplicarFiltros()">
                <option value="">Todas as semanas</option>
              </select>
            </div>
            <div class="col-6 col-md-3 d-flex gap-2 flex-wrap">
              <button class="btn btn-primary btn-sm flex-fill" onclick="MaoDeObra.buscar()">
                <i class="bi bi-search me-1"></i>Buscar
              </button>
              <button class="btn btn-success btn-sm flex-fill" onclick="MaoDeObra.abrirModal()">
                <i class="bi bi-plus-lg me-1"></i>Novo
              </button>
              <button class="btn btn-outline-secondary btn-sm flex-fill" onclick="MaoDeObra.abrirModalFuncionarios()" title="Gerenciar Funcionários">
                <i class="bi bi-people-fill me-1"></i><span class="d-none d-md-inline">Funcionários</span><span class="d-md-none">Func.</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4" id="moKpis"></div>

      <div class="card shadow-sm">
        <div class="card-header fw-semibold d-flex justify-content-between align-items-center gap-2 flex-wrap">
          <span>Lançamentos</span>
          <div class="d-flex gap-2 align-items-center">
            <span class="badge bg-secondary" id="totalRegistros">0</span>
            <button class="btn btn-outline-danger btn-sm" id="btnReciboPdf" onclick="MaoDeObra.gerarReciboPdf()" style="display:none">
              <i class="bi bi-file-earmark-pdf-fill me-1"></i>Recibo PDF
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th>Data</th><th>Dia</th><th>Funcionário</th><th>Serviço</th>
                  <th class="text-end">Valor</th><th class="text-end">Vale</th>
                  <th class="text-end">Saldo Dia</th><th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody id="tbodyMO"><tr><td colspan="8" class="text-center py-4 text-muted">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Lançamento -->
      <div class="modal fade" id="modalMO" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header"><h5 class="modal-title">Lançamento de Mão de Obra</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
            <div class="modal-body">
              <form id="formMO">
                <input type="hidden" id="moId">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Funcionário *</label>
                    <select class="form-select" id="moFuncionario" required>
                      ${funcs.map(f => `<option value="${f}">${f}</option>`).join('')}
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Data *</label>
                    <input type="date" class="form-control" id="moData" required value="${Utils.today()}" onchange="MaoDeObra.atualizarDia()">
                  </div>
                  <div class="col-12">
                    <label class="form-label">Dia da Semana</label>
                    <input type="text" class="form-control" id="moDia" readonly>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Serviço Executado</label>
                    <input type="text" class="form-control" id="moServico" placeholder="Descreva o serviço...">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Valor (R$) *</label>
                    <input type="number" class="form-control" id="moValor" step="0.01" min="0" value="0" required oninput="MaoDeObra.calcTotal()">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Vale (R$)</label>
                    <input type="number" class="form-control" id="moVale" step="0.01" min="0" value="0" oninput="MaoDeObra.calcTotal()">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Total do Dia</label>
                    <input type="text" class="form-control fw-bold" id="moTotal" readonly>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="MaoDeObra.salvar()"><i class="bi bi-save me-1"></i>Salvar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Gerenciar Funcionários -->
      <div class="modal fade" id="modalFuncionarios" tabindex="-1">
        <div class="modal-dialog modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-people-fill me-2"></i>Funcionários</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-3">
              <ul class="list-group mb-3" id="listaFuncionarios"></ul>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" id="novoFuncionario" placeholder="Nome do funcionário"
                  onkeydown="if(event.key==='Enter') MaoDeObra.adicionarFuncionario()">
                <button class="btn btn-success" onclick="MaoDeObra.adicionarFuncionario()">
                  <i class="bi bi-plus-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  /* ── Gerenciar Funcionários ─────────────────────────── */
  abrirModalFuncionarios() {
    this._renderListaFuncionarios();
    new bootstrap.Modal(document.getElementById('modalFuncionarios')).show();
  },

  _renderListaFuncionarios() {
    const lista = Funcionarios.get();
    document.getElementById('listaFuncionarios').innerHTML = lista.map(f => `
      <li class="list-group-item d-flex justify-content-between align-items-center py-2 px-3">
        <span style="font-size:13px">${f}</span>
        <button class="btn btn-outline-danger btn-sm py-0 px-1" onclick="MaoDeObra.removerFuncionario('${f}')" title="Remover">
          <i class="bi bi-dash-lg"></i>
        </button>
      </li>`).join('') || '<li class="list-group-item text-muted text-center py-3">Nenhum funcionário</li>';
  },

  adicionarFuncionario() {
    const inp  = document.getElementById('novoFuncionario');
    const nome = inp.value.trim();
    if (!nome) return;
    if (!Funcionarios.add(nome)) {
      Utils.showToast('Funcionário já existe!', 'warning');
      return;
    }
    inp.value = '';
    this._renderListaFuncionarios();
    this._atualizarSelectsFuncionarios();
    Utils.showToast(`${nome} adicionado!`);
  },

  removerFuncionario(nome) {
    if (!Utils.confirm(`Remover "${nome}" da lista de funcionários?\n\nOs lançamentos existentes não serão afetados.`)) return;
    Funcionarios.remove(nome);
    this._renderListaFuncionarios();
    this._atualizarSelectsFuncionarios();
    Utils.showToast(`${nome} removido.`);
  },

  _atualizarSelectsFuncionarios() {
    const funcs = Funcionarios.get();
    const opts  = funcs.map(f => `<option value="${f}">${f}</option>`).join('');
    const filtro = document.getElementById('filtroFunc');
    const modal  = document.getElementById('moFuncionario');
    if (filtro) filtro.innerHTML = `<option value="">Todos</option>${opts}`;
    if (modal)  modal.innerHTML  = opts;
  },

  /* ── Filtros / semanas ──────────────────────────────── */
  calcularSemanas(mes) {
    if (!mes) return [];
    const [y, m] = mes.split('-').map(Number);
    const ultimo = new Date(y, m, 0);
    const semanas = [];
    let cur = new Date(y, m - 1, 1);
    while (cur <= ultimo) {
      const ini = new Date(cur);
      const fim = new Date(cur);
      fim.setDate(fim.getDate() + (6 - fim.getDay()));
      if (fim > ultimo) fim.setTime(ultimo.getTime());
      semanas.push({
        ini: ini.toISOString().slice(0, 10),
        fim: fim.toISOString().slice(0, 10),
        label: `${ini.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} – ${fim.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}`,
      });
      cur.setDate(fim.getDate() + 1);
    }
    return semanas;
  },

  atualizarSemanasSelect() {
    const mes = document.getElementById('filtroMes')?.value;
    const sel = document.getElementById('filtroSemana');
    if (!sel) return;
    const semanas = this.calcularSemanas(mes);
    const atual = sel.value;
    sel.innerHTML = '<option value="">Todas as semanas</option>' +
      semanas.map((s, i) => `<option value="${i}" ${atual == i ? 'selected' : ''}>${s.label}</option>`).join('');
  },

  aplicarFiltros() {
    this.atualizarSemanasSelect();
    const func   = document.getElementById('filtroFunc')?.value    || '';
    const mes    = document.getElementById('filtroMes')?.value     || '';
    const semIdx = document.getElementById('filtroSemana')?.value;
    let dados    = [...this.dados];

    if (func) dados = dados.filter(r => r.funcionario === func);

    if (semIdx !== '' && semIdx !== undefined) {
      const semanas = this.calcularSemanas(mes);
      const sem = semanas[parseInt(semIdx)];
      if (sem) dados = dados.filter(r => r.data >= sem.ini && r.data <= sem.fim);
    }

    this.dadosFiltrados = dados;
    this.renderTabela();
    this.renderKpis();

    // Mostra botão de recibo só quando há funcionário específico selecionado
    const btnRecibo = document.getElementById('btnReciboPdf');
    if (btnRecibo) btnRecibo.style.display = func ? 'inline-flex' : 'none';
  },

  atualizarDia() {
    const data = document.getElementById('moData')?.value;
    if (data) document.getElementById('moDia').value = Utils.diaSemana(data);
  },

  calcTotal() {
    const v    = parseFloat(document.getElementById('moValor')?.value) || 0;
    const vale = parseFloat(document.getElementById('moVale')?.value)  || 0;
    document.getElementById('moTotal').value = Utils.formatCurrency(v - vale);
  },

  /* ── Busca / CRUD ───────────────────────────────────── */
  async buscar() {
    const mes = document.getElementById('filtroMes')?.value || '';
    try {
      Utils.showLoading(true);
      this.dados = await Api.getMaoDeObra({ mes });
      this.atualizarSemanasSelect();
      this.aplicarFiltros();
    } catch (e) {
      Utils.showToast('Erro ao carregar dados: ' + e.message, 'error');
      document.getElementById('tbodyMO').innerHTML =
        `<tr><td colspan="8" class="text-center text-danger py-3">Erro ao carregar. Verifique a conexão com o backend.</td></tr>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  renderTabela() {
    const tbody = document.getElementById('tbodyMO');
    const dados = this.dadosFiltrados;
    document.getElementById('totalRegistros').textContent = dados.length;
    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum lançamento encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = [...dados]
      .sort((a, b) => a.data.localeCompare(b.data))
      .map(r => {
        const total = (parseFloat(r.valor) || 0) - (parseFloat(r.vale) || 0);
        return `<tr>
          <td>${Utils.formatDate(r.data)}</td>
          <td>${r.dia || ''}</td>
          <td><span class="badge bg-primary">${r.funcionario}</span></td>
          <td>${r.servico || '—'}</td>
          <td class="text-end">${Utils.formatCurrency(r.valor)}</td>
          <td class="text-end text-warning">${Utils.formatCurrency(r.vale)}</td>
          <td class="text-end fw-semibold ${total >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(total)}</td>
          <td class="text-center">
            <button class="btn btn-outline-primary btn-sm me-1" onclick="MaoDeObra.editar('${r.id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-outline-danger btn-sm" onclick="MaoDeObra.excluir('${r.id}')"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`;
      }).join('');
  },

  renderKpis() {
    const dados     = this.dadosFiltrados;
    const total     = dados.reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);
    const totalVale = dados.reduce((s, r) => s + (parseFloat(r.vale)  || 0), 0);
    const saldo     = total - totalVale;
    const porFunc   = Funcionarios.get().map(f => {
      const rows = dados.filter(r => r.funcionario === f);
      const s    = rows.reduce((acc, r) => acc + (parseFloat(r.valor) || 0) - (parseFloat(r.vale) || 0), 0);
      return { nome: f, saldo: s, temDados: rows.length > 0 };
    }).filter(f => f.temDados);

    document.getElementById('moKpis').innerHTML = `
      <div class="col-sm-4">
        <div class="card bg-primary text-white border-0"><div class="card-body">
          <div class="small">Total Produzido</div><div class="fs-5 fw-bold">${Utils.formatCurrency(total)}</div>
        </div></div>
      </div>
      <div class="col-sm-4">
        <div class="card bg-warning text-dark border-0"><div class="card-body">
          <div class="small">Total Vales</div><div class="fs-5 fw-bold">${Utils.formatCurrency(totalVale)}</div>
        </div></div>
      </div>
      <div class="col-sm-4">
        <div class="card bg-success text-white border-0"><div class="card-body">
          <div class="small">Saldo a Pagar</div><div class="fs-5 fw-bold">${Utils.formatCurrency(saldo)}</div>
        </div></div>
      </div>
      ${porFunc.map(f => `
        <div class="col-sm-4 col-md-2">
          <div class="card border-0 shadow-sm text-center">
            <div class="card-body py-2">
              <div class="small fw-semibold">${f.nome}</div>
              <div class="fw-bold ${f.saldo >= 0 ? 'text-success' : 'text-danger'} mo-valor">${Utils.formatCurrency(f.saldo)}</div>
            </div>
          </div>
        </div>`).join('')}`;
  },

  /* ── Modal Lançamento ───────────────────────────────── */
  abrirModal(dados = null) {
    document.getElementById('moId').value          = dados?.id          || '';
    document.getElementById('moFuncionario').value = dados?.funcionario || Funcionarios.get()[0] || '';
    document.getElementById('moData').value        = dados?.data        || Utils.today();
    document.getElementById('moServico').value     = dados?.servico     || '';
    document.getElementById('moValor').value       = dados?.valor       || 0;
    document.getElementById('moVale').value        = dados?.vale        || 0;
    this.atualizarDia();
    this.calcTotal();
    new bootstrap.Modal(document.getElementById('modalMO')).show();
  },

  editar(id) {
    const r = this.dados.find(x => x.id === id);
    if (r) this.abrirModal(r);
  },

  async salvar() {
    const form = document.getElementById('formMO');
    if (!form.reportValidity()) return;
    const payload = {
      id:          document.getElementById('moId').value,
      funcionario: document.getElementById('moFuncionario').value,
      data:        document.getElementById('moData').value,
      dia:         Utils.diaSemana(document.getElementById('moData').value),
      servico:     document.getElementById('moServico').value,
      valor:       document.getElementById('moValor').value,
      vale:        document.getElementById('moVale').value,
    };
    try {
      Utils.showLoading(true);
      await Api.saveMaoDeObra(payload);
      bootstrap.Modal.getInstance(document.getElementById('modalMO')).hide();
      Utils.showToast('Lançamento salvo com sucesso!');
      await this.buscar();
    } catch (e) {
      Utils.showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Deseja excluir este lançamento?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteMaoDeObra(id);
      Utils.showToast('Lançamento excluído.');
      await this.buscar();
    } catch (e) {
      Utils.showToast('Erro ao excluir: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  /* ── Recibo PDF ─────────────────────────────────────── */
  gerarReciboPdf() {
    const func = document.getElementById('filtroFunc')?.value;
    const mes  = document.getElementById('filtroMes')?.value || '';
    if (!func) {
      Utils.showToast('Selecione um funcionário para gerar o recibo.', 'warning');
      return;
    }

    const dados = [...this.dadosFiltrados].sort((a, b) => a.data.localeCompare(b.data));
    if (!dados.length) {
      Utils.showToast('Nenhum lançamento para exportar.', 'warning');
      return;
    }

    const totalBruto = dados.reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);
    const totalVale  = dados.reduce((s, r) => s + (parseFloat(r.vale)  || 0), 0);
    const saldo      = totalBruto - totalVale;

    // Formata período
    const mesLabel = mes
      ? new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : 'Período selecionado';

    const semIdx = document.getElementById('filtroSemana')?.value;
    let periodoLabel = mesLabel;
    if (semIdx !== '' && semIdx !== undefined) {
      const sems = this.calcularSemanas(mes);
      const sem  = sems[parseInt(semIdx)];
      if (sem) periodoLabel = `Semana ${sem.label} — ${mesLabel}`;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const W    = 210;
    const marg = 15;
    const cW   = W - marg * 2;
    let   y    = marg;

    // ── Cabeçalho ──────────────────────────────────────
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, W, 36, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ANAGESSO', marg, 14);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestão — Recibo de Mão de Obra', marg, 22);

    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    const emitido = `Emitido em: ${new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}`;
    doc.text(emitido, W - marg, 22, { align: 'right' });

    y = 44;

    // ── Dados do Funcionário ───────────────────────────
    doc.setFillColor(244, 246, 251);
    doc.roundedRect(marg, y, cW, 22, 3, 3, 'F');

    doc.setTextColor(26, 26, 46);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(func.toUpperCase(), marg + 5, y + 9);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${periodoLabel}`, marg + 5, y + 16);
    doc.text(`Total de dias: ${dados.length}`, W - marg - 5, y + 16, { align: 'right' });

    y += 28;

    // ── Tabela de lançamentos ──────────────────────────
    const colData    = marg;
    const colDia     = marg + 22;
    const colServico = marg + 42;
    const colValor   = W - marg - 44;
    const colVale    = W - marg - 22;
    const colSaldo   = W - marg;

    // Cabeçalho da tabela
    doc.setFillColor(26, 26, 46);
    doc.rect(marg, y, cW, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('DATA',    colData    + 1, y + 5);
    doc.text('DIA',     colDia     + 1, y + 5);
    doc.text('SERVIÇO', colServico + 1, y + 5);
    doc.text('VALOR',   colValor,       y + 5, { align: 'right' });
    doc.text('VALE',    colVale,        y + 5, { align: 'right' });
    doc.text('SALDO',   colSaldo,       y + 5, { align: 'right' });
    y += 7;

    // Linhas
    doc.setFont('helvetica', 'normal');
    dados.forEach((r, i) => {
      if (y > 265) { doc.addPage(); y = marg; }

      const bg     = i % 2 === 0 ? [255, 255, 255] : [248, 250, 253];
      const saldoR = (parseFloat(r.valor) || 0) - (parseFloat(r.vale) || 0);

      doc.setFillColor(...bg);
      doc.rect(marg, y, cW, 6.5, 'F');

      doc.setTextColor(50, 50, 50);
      doc.setFontSize(7.5);
      doc.text(Utils.formatDate(r.data), colData    + 1, y + 4.5);
      doc.text(r.dia || '',              colDia     + 1, y + 4.5);

      const srv = (r.servico || '—');
      doc.text(srv.length > 30 ? srv.slice(0, 28) + '…' : srv, colServico + 1, y + 4.5);

      doc.setTextColor(30, 80, 160);
      doc.text(Utils.formatCurrency(r.valor), colValor, y + 4.5, { align: 'right' });

      doc.setTextColor(180, 120, 0);
      doc.text(Utils.formatCurrency(r.vale),  colVale,  y + 4.5, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(saldoR >= 0 ? 22 : 180, saldoR >= 0 ? 120 : 30, saldoR >= 0 ? 60 : 30);
      doc.text(Utils.formatCurrency(saldoR), colSaldo, y + 4.5, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      doc.setDrawColor(230, 230, 230);
      doc.line(marg, y + 6.5, W - marg, y + 6.5);
      y += 6.5;
    });

    y += 6;

    // ── Totais ─────────────────────────────────────────
    if (y > 250) { doc.addPage(); y = marg; }

    doc.setDrawColor(26, 26, 46);
    doc.setLineWidth(0.5);
    doc.line(marg, y, W - marg, y);
    y += 2;

    const drawTotalLine = (label, valor, cor, bold = false) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(label, W - marg - 55, y + 5);
      doc.setTextColor(...cor);
      doc.text(Utils.formatCurrency(valor), W - marg, y + 5, { align: 'right' });
      y += 7;
    };

    drawTotalLine('Total Produzido:',     totalBruto, [30, 80, 160]);
    drawTotalLine('(-) Vales Adiantados:', totalVale,  [180, 120, 0]);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(W - marg - 60, y, W - marg, y);
    y += 2;

    drawTotalLine('SALDO A RECEBER:', saldo,
      saldo >= 0 ? [22, 120, 60] : [180, 30, 30], true);

    y += 10;

    // ── Assinatura ─────────────────────────────────────
    if (y > 250) { doc.addPage(); y = marg; }

    const assCentro = W / 2;
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.4);
    doc.line(assCentro - 40, y + 14, assCentro + 40, y + 14);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(func, assCentro, y + 19, { align: 'center' });
    doc.text('Assinatura do Funcionário', assCentro, y + 24, { align: 'center' });

    // ── Rodapé ─────────────────────────────────────────
    doc.setFillColor(244, 246, 251);
    doc.rect(0, 282, W, 15, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7.5);
    doc.text('Anagesso — Sistema de Gestão', marg, 290);
    doc.text(
      `Documento gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}`,
      W - marg, 290, { align: 'right' }
    );

    // ── Salva ──────────────────────────────────────────
    doc.save(`Recibo_${func}_${mes || 'periodo'}.pdf`);
    Utils.showToast(`Recibo de ${func} gerado com sucesso!`);
  },
};
