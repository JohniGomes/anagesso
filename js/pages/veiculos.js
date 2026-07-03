const Veiculos = {
  dados: [],

  async render() {
    document.getElementById('pageTitle').textContent = 'Controle de Veículos';
    document.getElementById('content').innerHTML = `
      <div class="d-flex flex-wrap gap-2 mb-4">
        <input type="text" class="form-control form-control-sm" id="buscaVeiculo" placeholder="Buscar placa ou motorista..." style="max-width:280px" oninput="Veiculos.filtrar()">
        <select class="form-select form-select-sm" id="filtroTipoV" style="max-width:150px" onchange="Veiculos.filtrar()">
          <option value="">Entrada e Saída</option>
          <option value="ENTRADA">Entrada</option>
          <option value="SAÍDA">Saída</option>
        </select>
        <input type="date" class="form-control form-control-sm" id="filtroDataV" style="max-width:160px" onchange="Veiculos.filtrar()">
        <button class="btn btn-success btn-sm ms-auto" onclick="Veiculos.abrirModal()">
          <i class="bi bi-plus-lg me-1"></i>Registrar
        </button>
      </div>

      <div class="row g-3 mb-4" id="veiculoKpis"></div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>Tipo</th><th>Placa</th><th>Modelo</th>
                  <th>Motorista</th><th>Data</th><th>Horário</th>
                  <th>Obs</th><th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody id="tbodyVeiculos"><tr><td colspan="8" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal -->
      <div class="modal fade" id="modalVeiculo" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title"><i class="bi bi-truck me-2"></i>Registrar Veículo</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formVeiculo">
                <input type="hidden" id="veiculoId">
                <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label">Tipo *</label>
                    <div class="d-flex gap-2">
                      <button type="button" class="btn btn-outline-success flex-fill" id="btnEntrada" onclick="Veiculos.setTipo('ENTRADA')">
                        <i class="bi bi-box-arrow-in-right me-1"></i>Entrada
                      </button>
                      <button type="button" class="btn btn-outline-danger flex-fill" id="btnSaida" onclick="Veiculos.setTipo('SAÍDA')">
                        <i class="bi bi-box-arrow-right me-1"></i>Saída
                      </button>
                    </div>
                    <input type="hidden" id="veiculoTipo" value="ENTRADA">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Placa *</label>
                    <input type="text" class="form-control text-uppercase" id="veiculoPlaca" required placeholder="ABC-1234" maxlength="8"
                      oninput="this.value=this.value.toUpperCase()">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Modelo</label>
                    <input type="text" class="form-control" id="veiculoModelo" placeholder="Ex: Fiat Strada">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Motorista *</label>
                    <input type="text" class="form-control" id="veiculoMotorista" required placeholder="Nome do motorista">
                  </div>
                  <div class="col-6">
                    <label class="form-label">Data *</label>
                    <input type="date" class="form-control" id="veiculoData" required>
                  </div>
                  <div class="col-6">
                    <label class="form-label">Horário *</label>
                    <input type="time" class="form-control" id="veiculoHorario" required>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Observação</label>
                    <input type="text" class="form-control" id="veiculoObs" placeholder="Destino, motivo...">
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="Veiculos.salvar()"><i class="bi bi-save me-1"></i>Salvar</button>
            </div>
          </div>
        </div>
      </div>`;

    await this.carregar();
  },

  setTipo(t) {
    document.getElementById('veiculoTipo').value = t;
    document.getElementById('btnEntrada').className = 'btn flex-fill ' + (t === 'ENTRADA' ? 'btn-success' : 'btn-outline-success');
    document.getElementById('btnSaida').className   = 'btn flex-fill ' + (t === 'SAÍDA'  ? 'btn-danger'  : 'btn-outline-danger');
  },

  async carregar() {
    try {
      Utils.showLoading(true);
      this.dados = await Api.getVeiculos();
      this.dados.sort((a, b) => (b.data + b.horario).localeCompare(a.data + a.horario));
      this.renderTabela(this.dados);
      this.renderKpis();
    } catch (e) {
      document.getElementById('tbodyVeiculos').innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">Erro ao carregar.</td></tr>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  filtrar() {
    const busca = document.getElementById('buscaVeiculo')?.value.toLowerCase() || '';
    const tipo  = document.getElementById('filtroTipoV')?.value || '';
    const data  = document.getElementById('filtroDataV')?.value || '';
    this.renderTabela(this.dados.filter(v =>
      (!busca || (v.placa + v.motorista).toLowerCase().includes(busca)) &&
      (!tipo  || v.tipo === tipo) &&
      (!data  || v.data === data)
    ));
  },

  renderTabela(dados) {
    const tbody = document.getElementById('tbodyVeiculos');
    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum registro encontrado.</td></tr>';
      return;
    }
    tbody.innerHTML = dados.map(v => `
      <tr>
        <td><span class="badge ${v.tipo === 'ENTRADA' ? 'bg-success' : 'bg-danger'}">${v.tipo === 'ENTRADA' ? '↓ Entrada' : '↑ Saída'}</span></td>
        <td class="fw-bold">${v.placa || '—'}</td>
        <td>${v.modelo || '—'}</td>
        <td>${v.motorista || '—'}</td>
        <td>${Utils.formatDate(v.data)}</td>
        <td>${v.horario || '—'}</td>
        <td class="small text-muted">${v.obs || '—'}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="Veiculos.editar('${v.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="Veiculos.excluir('${v.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  },

  renderKpis() {
    const hoje = new Date().toISOString().split('T')[0];
    const entradas = this.dados.filter(v => v.tipo === 'ENTRADA');
    const saidas   = this.dados.filter(v => v.tipo === 'SAÍDA');
    const hoje_reg = this.dados.filter(v => v.data === hoje);
    document.getElementById('veiculoKpis').innerHTML = `
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Total Entradas</div><div class="fw-bold text-success">${entradas.length}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Total Saídas</div><div class="fw-bold text-danger">${saidas.length}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Registros Hoje</div><div class="fw-bold text-primary">${hoje_reg.length}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Total Registros</div><div class="fw-bold">${this.dados.length}</div></div></div></div>`;
  },

  abrirModal(dados = null) {
    const agora = new Date();
    document.getElementById('veiculoId').value       = dados?.id        || '';
    document.getElementById('veiculoPlaca').value    = dados?.placa     || '';
    document.getElementById('veiculoModelo').value   = dados?.modelo    || '';
    document.getElementById('veiculoMotorista').value= dados?.motorista || '';
    document.getElementById('veiculoData').value     = dados?.data      || agora.toISOString().split('T')[0];
    document.getElementById('veiculoHorario').value  = dados?.horario   || agora.toTimeString().slice(0,5);
    document.getElementById('veiculoObs').value      = dados?.obs       || '';
    this.setTipo(dados?.tipo || 'ENTRADA');
    new bootstrap.Modal(document.getElementById('modalVeiculo')).show();
  },

  editar(id) {
    const v = this.dados.find(x => x.id === id);
    if (v) this.abrirModal(v);
  },

  async salvar() {
    const form = document.getElementById('formVeiculo');
    if (!form.reportValidity()) return;
    const payload = {
      id:        document.getElementById('veiculoId').value,
      placa:     document.getElementById('veiculoPlaca').value,
      modelo:    document.getElementById('veiculoModelo').value,
      motorista: document.getElementById('veiculoMotorista').value,
      data:      document.getElementById('veiculoData').value,
      horario:   document.getElementById('veiculoHorario').value,
      tipo:      document.getElementById('veiculoTipo').value,
      obs:       document.getElementById('veiculoObs').value,
    };
    try {
      Utils.showLoading(true);
      await Api.saveVeiculo(payload);
      bootstrap.Modal.getInstance(document.getElementById('modalVeiculo')).hide();
      Utils.showToast('Registro salvo!');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Excluir este registro?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteVeiculo(id);
      Utils.showToast('Registro excluído.');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },
};
