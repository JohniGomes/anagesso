const MaoDeObra = {
  dados: [],       // todos os dados do backend (mês filtrado)
  dadosFiltrados: [],

  async render() {
    document.getElementById('pageTitle').textContent = 'Controle de Mão de Obra';
    const mesAtual = new Date().toISOString().slice(0, 7);
    document.getElementById('content').innerHTML = `
      <!-- Filtros -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-3">
          <div class="row g-2 align-items-end">
            <div class="col-6 col-md-3">
              <label class="form-label mb-1 small fw-semibold">Funcionário</label>
              <select class="form-select form-select-sm" id="filtroFunc" onchange="MaoDeObra.aplicarFiltros()">
                <option value="">Todos</option>
                ${CONFIG.funcionarios.map(f => `<option value="${f}">${f}</option>`).join('')}
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
            <div class="col-6 col-md-3 d-flex gap-2">
              <button class="btn btn-primary btn-sm flex-fill" onclick="MaoDeObra.buscar()">
                <i class="bi bi-search me-1"></i>Buscar
              </button>
              <button class="btn btn-success btn-sm flex-fill" onclick="MaoDeObra.abrirModal()">
                <i class="bi bi-plus-lg me-1"></i>Novo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4" id="moKpis"></div>

      <div class="card shadow-sm">
        <div class="card-header fw-semibold d-flex justify-content-between align-items-center">
          <span>Lançamentos</span>
          <span class="badge bg-secondary" id="totalRegistros">0</span>
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

      <!-- Modal -->
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
                      ${CONFIG.funcionarios.map(f => `<option value="${f}">${f}</option>`).join('')}
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
      </div>`;

    this.atualizarDia();
    await this.buscar();
  },

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
  },

  atualizarDia() {
    const data = document.getElementById('moData')?.value;
    if (data) document.getElementById('moDia').value = Utils.diaSemana(data);
  },

  calcTotal() {
    const v = parseFloat(document.getElementById('moValor')?.value) || 0;
    const vale = parseFloat(document.getElementById('moVale')?.value) || 0;
    const total = v - vale;
    document.getElementById('moTotal').value = Utils.formatCurrency(total);
  },

  async buscar() {
    const mes = document.getElementById('filtroMes')?.value || '';
    try {
      Utils.showLoading(true);
      // Busca só por mês no backend; filtros de funcionário/semana são client-side
      this.dados = await Api.getMaoDeObra({ mes });
      this.atualizarSemanasSelect();
      this.aplicarFiltros();
    } catch (e) {
      Utils.showToast('Erro ao carregar dados: ' + e.message, 'error');
      document.getElementById('tbodyMO').innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">Erro ao carregar. Verifique a conexão com o backend.</td></tr>`;
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
    const dados = this.dadosFiltrados;
    const total = dados.reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);
    const totalVale = dados.reduce((s, r) => s + (parseFloat(r.vale) || 0), 0);
    const saldo = total - totalVale;
    const porFunc = CONFIG.funcionarios.map(f => {
      const rows = dados.filter(r => r.funcionario === f);
      const s = rows.reduce((acc, r) => acc + (parseFloat(r.valor) || 0) - (parseFloat(r.vale) || 0), 0);
      return { nome: f, saldo: s, temDados: rows.length > 0 };
    }).filter(f => f.temDados);
    document.getElementById('moKpis').innerHTML = `
      <div class="col-sm-4">
        <div class="card bg-primary text-white border-0"><div class="card-body"><div class="small">Total Produzido</div><div class="fs-5 fw-bold">${Utils.formatCurrency(total)}</div></div></div>
      </div>
      <div class="col-sm-4">
        <div class="card bg-warning text-dark border-0"><div class="card-body"><div class="small">Total Vales</div><div class="fs-5 fw-bold">${Utils.formatCurrency(totalVale)}</div></div></div>
      </div>
      <div class="col-sm-4">
        <div class="card bg-success text-white border-0"><div class="card-body"><div class="small">Saldo a Pagar</div><div class="fs-5 fw-bold">${Utils.formatCurrency(saldo)}</div></div></div>
      </div>
      ${porFunc.map(f => `
        <div class="col-sm-4 col-md-2">
          <div class="card border-0 shadow-sm text-center">
            <div class="card-body py-2">
              <div class="small fw-semibold">${f.nome}</div>
              <div class="fw-bold ${f.saldo >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(f.saldo)}</div>
            </div>
          </div>
        </div>`).join('')}`;
  },

  abrirModal(dados = null) {
    document.getElementById('moId').value = dados?.id || '';
    document.getElementById('moFuncionario').value = dados?.funcionario || CONFIG.funcionarios[0];
    document.getElementById('moData').value = dados?.data || Utils.today();
    document.getElementById('moServico').value = dados?.servico || '';
    document.getElementById('moValor').value = dados?.valor || 0;
    document.getElementById('moVale').value = dados?.vale || 0;
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
      id: document.getElementById('moId').value,
      funcionario: document.getElementById('moFuncionario').value,
      data: document.getElementById('moData').value,
      dia: Utils.diaSemana(document.getElementById('moData').value),
      servico: document.getElementById('moServico').value,
      valor: document.getElementById('moValor').value,
      vale: document.getElementById('moVale').value,
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
};
