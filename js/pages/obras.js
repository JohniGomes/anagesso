/* ── Categorias de Custos Extras (localStorage) ───────────── */
const CustosExtrasCats = {
  KEY: 'anagesso_custos_extras_cats',
  _padrao: ['RT Arquiteta', 'Nota Fiscal', 'Aluguel Equipamento', 'Transporte', 'Outros'],

  get() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) return JSON.parse(raw);
    this.set([...this._padrao]);
    return [...this._padrao];
  },
  set(l) { localStorage.setItem(this.KEY, JSON.stringify(l)); },
  add(nome) {
    nome = nome.trim();
    if (!nome) return false;
    const l = this.get();
    if (l.some(c => c.toLowerCase() === nome.toLowerCase())) return false;
    l.push(nome); this.set(l); return true;
  },
  remove(nome) { this.set(this.get().filter(c => c !== nome)); },
};

const Obras = {
  dados: [],
  itensBase: [],
  itensSelecionados: [],
  pagamentos: [],      // histórico de pagamentos da obra em edição
  custosExtras: [],    // custos extras (RT, NF, etc.)
  editandoPagIdx: -1,
  editandoCustoIdx: -1,

  async render() {
    document.getElementById('pageTitle').textContent = 'Fechamento de Obras';
    document.getElementById('content').innerHTML = `
      <div class="d-flex flex-wrap gap-2 mb-4">
        <input type="text" class="form-control form-control-sm" id="buscaObra" placeholder="Buscar obra..." style="max-width:220px" oninput="Obras.filtrar()">
        <select class="form-select form-select-sm" id="filtroFase" style="max-width:150px" onchange="Obras.filtrar()">
          <option value="">Todas as fases</option>
          <option>ANDAMENTO</option><option>EXECUTADO</option><option>ORÇAMENTO</option>
        </select>
        <input type="month" class="form-control form-control-sm" id="filtroMesObra" style="max-width:160px" onchange="Obras.filtrar()" title="Filtrar por mês de início">
        <button class="btn btn-outline-secondary btn-sm" onclick="document.getElementById('filtroMesObra').value='';Obras.filtrar();" title="Limpar filtro de mês"><i class="bi bi-x-lg"></i></button>
        <button class="btn btn-success btn-sm ms-auto" onclick="Obras.abrirModal()"><i class="bi bi-plus-lg me-1"></i>Nova Obra</button>
      </div>

      <div class="row g-3 mb-4" id="obrasKpis"></div>

      <div class="card shadow-sm">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr>
                  <th>Obra</th><th>Início</th><th>Fase</th>
                  <th class="text-end">Orçamento</th><th class="text-end">Pago</th>
                  <th class="text-end">A Receber</th><th class="text-end">Custo</th>
                  <th class="text-end">Lucro</th><th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody id="tbodyObras"><tr><td colspan="9" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Obra -->
      <div class="modal fade" id="modalObra" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title"><i class="bi bi-building me-2"></i>Obra</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form id="formObra">
                <input type="hidden" id="obraId">

                <!-- Identificação -->
                <h6 class="fw-semibold text-primary mb-3"><i class="bi bi-info-circle me-1"></i>Identificação</h6>
                <div class="row g-3 mb-4">
                  <div class="col-12">
                    <label class="form-label">Nome da Obra *</label>
                    <input type="text" class="form-control" id="obraNome" required placeholder="Ex: OBRA CLIENTE BAIRRO">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Data de Início</label>
                    <input type="date" class="form-control" id="obraInicio">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Previsão de Entrega</label>
                    <input type="date" class="form-control" id="obraEntrega">
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Fase *</label>
                    <select class="form-select" id="obraFase" required>
                      <option value="ORÇAMENTO">ORÇAMENTO</option>
                      <option value="ANDAMENTO">ANDAMENTO</option>
                      <option value="EXECUTADO">EXECUTADO</option>
                    </select>
                  </div>
                </div>

                <!-- Valores do Contrato -->
                <h6 class="fw-semibold text-primary mb-3"><i class="bi bi-cash-stack me-1"></i>Valores do Contrato</h6>
                <div class="row g-3 mb-4">
                  <div class="col-md-4">
                    <label class="form-label">Valor Orçamento</label>
                    <div class="input-group">
                      <span class="input-group-text">R$</span>
                      <input type="number" class="form-control" id="obraOrcamento" step="0.01" min="0" value="0" oninput="Obras.recalcular()">
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Valor Fechado</label>
                    <div class="input-group">
                      <span class="input-group-text">R$</span>
                      <input type="number" class="form-control" id="obraFechado" step="0.01" min="0" value="0" oninput="Obras.recalcular()">
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-muted">Total Pago (auto)</label>
                    <div class="input-group">
                      <span class="input-group-text">R$</span>
                      <input type="text" class="form-control bg-light fw-semibold text-success" id="obraPagoDisplay" readonly value="0,00">
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-muted">A Receber (auto)</label>
                    <input type="text" class="form-control bg-light fw-semibold text-warning" id="obraReceber" readonly>
                  </div>
                </div>

                <!-- Pagamentos Recebidos -->
                <h6 class="fw-semibold text-primary mb-2"><i class="bi bi-cash-coin me-1"></i>Pagamentos Recebidos</h6>
                <div class="card border mb-4">
                  <div class="card-body p-3">
                    <!-- Formulário inline de pagamento -->
                    <div class="row g-2 align-items-end mb-3" id="rowFormPag">
                      <div class="col-md-3">
                        <label class="form-label small mb-1">Data</label>
                        <input type="date" class="form-control form-control-sm" id="pagData">
                      </div>
                      <div class="col-md-3">
                        <label class="form-label small mb-1">Valor (R$)</label>
                        <input type="number" class="form-control form-control-sm" id="pagValor" step="0.01" min="0" placeholder="0,00">
                      </div>
                      <div class="col-md-4">
                        <label class="form-label small mb-1">Observação</label>
                        <input type="text" class="form-control form-control-sm" id="pagObs" placeholder="Ex: Entrada, Parcela 1...">
                      </div>
                      <div class="col-md-2 d-flex gap-1">
                        <button type="button" class="btn btn-success btn-sm flex-fill" onclick="Obras.adicionarPagamento()">
                          <i class="bi bi-check-lg"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" id="btnCancelarPag" style="display:none" onclick="Obras.cancelarEdicaoPag()">
                          <i class="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </div>
                    <!-- Tabela de pagamentos -->
                    <div class="table-responsive">
                      <table class="table table-sm align-middle mb-0">
                        <thead class="table-light">
                          <tr><th>Data</th><th class="text-end">Valor</th><th>Observação</th><th class="text-center" style="width:80px">Ações</th></tr>
                        </thead>
                        <tbody id="tbodyPagamentos">
                          <tr><td colspan="4" class="text-muted text-center py-2 small">Nenhum pagamento registrado.</td></tr>
                        </tbody>
                        <tfoot>
                          <tr class="fw-bold table-secondary">
                            <td>Total Recebido</td>
                            <td class="text-end text-success" id="totalPagoFoot">R$ 0,00</td>
                            <td colspan="2"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Custos Extras -->
                <h6 class="fw-semibold text-primary mb-2 d-flex align-items-center gap-2">
                  <i class="bi bi-receipt me-1"></i>Custos Extras
                  <button type="button" class="btn btn-link btn-sm p-0 ms-1 text-secondary" onclick="Obras.abrirGerenciarCats()" title="Gerenciar categorias">
                    <i class="bi bi-tags-fill"></i>
                  </button>
                </h6>
                <div class="card border mb-4">
                  <div class="card-body p-3">
                    <div class="row g-2 align-items-end mb-3">
                      <div class="col-md-3">
                        <label class="form-label small mb-1">Categoria</label>
                        <select class="form-select form-select-sm" id="custoCategoria">
                          ${CustosExtrasCats.get().map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label small mb-1">Descrição</label>
                        <input type="text" class="form-control form-control-sm" id="custoDesc" placeholder="Ex: RT Arq. Maria...">
                      </div>
                      <div class="col-md-2">
                        <label class="form-label small mb-1">Valor (R$)</label>
                        <input type="number" class="form-control form-control-sm" id="custoValor" step="0.01" min="0" placeholder="0,00">
                      </div>
                      <div class="col-md-4 d-flex gap-1">
                        <button type="button" class="btn btn-success btn-sm flex-fill" onclick="Obras.adicionarCusto()">
                          <i class="bi bi-check-lg"></i> Adicionar
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm" id="btnCancelarCusto" style="display:none" onclick="Obras.cancelarEdicaoCusto()">
                          <i class="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </div>
                    <div class="table-responsive">
                      <table class="table table-sm align-middle mb-0">
                        <thead class="table-light">
                          <tr><th>Categoria</th><th>Descrição</th><th class="text-end">Valor</th><th class="text-center" style="width:80px">Ações</th></tr>
                        </thead>
                        <tbody id="tbodyCustos">
                          <tr><td colspan="4" class="text-muted text-center py-2 small">Nenhum custo extra registrado.</td></tr>
                        </tbody>
                        <tfoot>
                          <tr class="fw-bold table-secondary">
                            <td colspan="2">Total Custos Extras</td>
                            <td class="text-end text-danger" id="totalCustosFoot">R$ 0,00</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                <!-- Modal Gerenciar Categorias -->
                <div class="modal fade" id="modalCustoCats" tabindex="-1">
                  <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                      <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-tags-fill me-2"></i>Categorias de Custo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div class="modal-body p-3">
                        <ul class="list-group mb-3" id="listaCustoCats"></ul>
                        <div class="input-group input-group-sm">
                          <input type="text" class="form-control" id="novaCustoCat" placeholder="Ex: Licença, Projeto..."
                            onkeydown="if(event.key==='Enter') Obras.adicionarCat()">
                          <button class="btn btn-success" onclick="Obras.adicionarCat()"><i class="bi bi-plus-lg"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Itens / Material -->
                <h6 class="fw-semibold text-primary mb-3"><i class="bi bi-box-seam me-1"></i>Itens de Material</h6>
                <div class="row g-2 mb-3 align-items-end">
                  <div class="col-md-5">
                    <label class="form-label small">Produto</label>
                    <select class="form-select form-select-sm" id="obraSelectItem">
                      <option value="">Selecione um item...</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <label class="form-label small">Qtd</label>
                    <input type="number" class="form-control form-control-sm" id="obraItemQtd" value="1" min="0.01" step="0.01">
                  </div>
                  <div class="col-md-2">
                    <label class="form-label small">Preço Unit.</label>
                    <input type="number" class="form-control form-control-sm" id="obraItemPreco" step="0.01" min="0">
                  </div>
                  <div class="col-md-3">
                    <button type="button" class="btn btn-outline-primary btn-sm w-100" onclick="Obras.adicionarItem()">
                      <i class="bi bi-plus-circle me-1"></i>Adicionar
                    </button>
                  </div>
                </div>
                <div class="table-responsive mb-1">
                  <table class="table table-sm align-middle border rounded">
                    <thead class="table-light">
                      <tr><th>Produto</th><th class="text-end">Qtd</th><th class="text-end">Unit.</th><th class="text-end">Total</th><th></th></tr>
                    </thead>
                    <tbody id="tbodyObraItens">
                      <tr><td colspan="5" class="text-muted text-center py-2 small">Nenhum item adicionado.</td></tr>
                    </tbody>
                    <tfoot>
                      <tr class="fw-bold table-secondary">
                        <td colspan="3" class="text-end">Total Material:</td>
                        <td class="text-end text-primary" id="obraTotalMaterial">R$ 0,00</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <!-- Custos -->
                <h6 class="fw-semibold text-primary mb-3 mt-3"><i class="bi bi-receipt me-1"></i>Custos da Obra</h6>
                <div class="row g-3 mb-3">
                  <div class="col-md-4">
                    <label class="form-label">Mão de Obra (R$)</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-people"></i></span>
                      <input type="number" class="form-control" id="obraMO" step="0.01" min="0" value="0" oninput="Obras.recalcular()">
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Material (R$) <span class="badge bg-secondary ms-1 small">calculado</span></label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-box-seam"></i></span>
                      <input type="number" class="form-control bg-light" id="obraMaterial" step="0.01" min="0" value="0" oninput="Obras.recalcular()">
                    </div>
                    <div class="form-text">Preenchido automaticamente pelos itens acima.</div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Variáveis (R$)</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-sliders"></i></span>
                      <input type="number" class="form-control" id="obraVariaveis" step="0.01" min="0" value="0" oninput="Obras.recalcular()">
                    </div>
                  </div>
                </div>

                <!-- Resultado -->
                <div class="card border-0 bg-light rounded-3 p-3">
                  <div class="row g-3 text-center">
                    <div class="col-4">
                      <div class="text-muted small">Custo Total</div>
                      <div class="fw-bold fs-6" id="obraCusto">R$ 0,00</div>
                    </div>
                    <div class="col-4">
                      <div class="text-muted small">Orçamento</div>
                      <div class="fw-bold fs-6 text-primary" id="obraOrcDisplay">R$ 0,00</div>
                    </div>
                    <div class="col-4">
                      <div class="text-muted small fw-semibold">Lucro Anagesso</div>
                      <div class="fw-bold fs-5" id="obraLucro">R$ 0,00</div>
                    </div>
                  </div>
                  <div class="mt-2 small text-muted text-center">
                    Lucro = Orçamento − Mão de Obra − Material − Variáveis
                  </div>
                </div>

              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="Obras.salvar()"><i class="bi bi-save me-1"></i>Salvar Obra</button>
            </div>
          </div>
        </div>
      </div>`;

    await this.carregar();
  },

  async carregar() {
    try {
      Utils.showLoading(true);
      [this.dados, this.itensBase] = await Promise.all([Api.getObras(), Api.getItens()]);
      this.renderTabela(this.dados);
      this.renderKpis();
    } catch (e) {
      document.getElementById('tbodyObras').innerHTML = `<tr><td colspan="9" class="text-center text-danger py-3">Erro ao carregar obras. Configure o backend.</td></tr>`;
    } finally {
      Utils.showLoading(false);
    }
  },

  filtrar() {
    const busca = document.getElementById('buscaObra')?.value.toLowerCase() || '';
    const fase  = document.getElementById('filtroFase')?.value || '';
    const mes   = document.getElementById('filtroMesObra')?.value || '';
    this.renderTabela(this.dados.filter(o =>
      (!busca || (o.nome || '').toLowerCase().includes(busca)) &&
      (!fase  || o.fase === fase) &&
      (!mes   || String(o.dtInicio).substring(0, 7) === mes)
    ));
    this.renderKpis(mes, fase, busca);
  },

  renderTabela(dados) {
    const tbody = document.getElementById('tbodyObras');
    if (!dados.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">Nenhuma obra encontrada.</td></tr>';
      return;
    }
    tbody.innerHTML = dados.map(o => {
      const lucro = parseFloat(o.lucro) || 0;
      return `<tr>
        <td class="fw-semibold">${o.nome}</td>
        <td class="small">${Utils.formatDate(o.dtInicio)}</td>
        <td><span class="badge ${o.fase === 'EXECUTADO' ? 'bg-success' : o.fase === 'ANDAMENTO' ? 'bg-warning text-dark' : 'bg-info'}">${o.fase || '—'}</span></td>
        <td class="text-end">${Utils.formatCurrency(o.valorOrcamento)}</td>
        <td class="text-end text-success">${Utils.formatCurrency(o.valorPago)}</td>
        <td class="text-end text-warning">${Utils.formatCurrency(o.valorReceber)}</td>
        <td class="text-end text-muted">${Utils.formatCurrency(o.custoObra)}</td>
        <td class="text-end fw-bold ${lucro >= 0 ? 'text-success' : 'text-danger'}">${Utils.formatCurrency(lucro)}</td>
        <td class="text-center">
          <button class="btn btn-outline-primary btn-sm me-1" onclick="Obras.editar('${o.id}')"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-outline-danger btn-sm" onclick="Obras.excluir('${o.id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  },

  renderKpis(mes, fase, busca) {
    const src = (mes || fase || busca)
      ? this.dados.filter(o =>
          (!busca || (o.nome || '').toLowerCase().includes(busca)) &&
          (!fase  || o.fase === fase) &&
          (!mes   || String(o.dtInicio).substring(0, 7) === mes))
      : this.dados;
    const totalOrcamento = src.reduce((s, o) => s + (parseFloat(o.valorOrcamento) || 0), 0);
    const totalPago      = src.reduce((s, o) => s + (parseFloat(o.valorPago)      || 0), 0);
    const totalReceber   = src.reduce((s, o) => s + (parseFloat(o.valorReceber)   || 0), 0);
    const totalLucro     = src.reduce((s, o) => s + (parseFloat(o.lucro)          || 0), 0);
    document.getElementById('obrasKpis').innerHTML = `
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Total Orçado</div><div class="fw-bold">${Utils.formatCurrency(totalOrcamento)}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Recebido</div><div class="fw-bold text-success">${Utils.formatCurrency(totalPago)}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">A Receber</div><div class="fw-bold text-warning">${Utils.formatCurrency(totalReceber)}</div></div></div></div>
      <div class="col-6 col-md-3"><div class="card border-0 shadow-sm"><div class="card-body"><div class="text-muted small">Lucro Total</div><div class="fw-bold text-primary">${Utils.formatCurrency(totalLucro)}</div></div></div></div>`;
  },

  preencherSelectItens() {
    const sel = document.getElementById('obraSelectItem');
    sel.innerHTML = '<option value="">Selecione um item...</option>' +
      this.itensBase.map(i => `<option value="${i.id}" data-preco="${i.preco}" data-produto="${i.produto}">${i.produto} — ${Utils.formatCurrency(i.preco)}</option>`).join('');
    sel.onchange = () => {
      const opt = sel.selectedOptions[0];
      if (opt?.dataset.preco) document.getElementById('obraItemPreco').value = opt.dataset.preco;
    };
  },

  adicionarItem() {
    const sel = document.getElementById('obraSelectItem');
    const opt = sel.selectedOptions[0];
    if (!opt?.value) { Utils.showToast('Selecione um item.', 'warning'); return; }
    const qtd   = parseFloat(document.getElementById('obraItemQtd').value)  || 1;
    const preco = parseFloat(document.getElementById('obraItemPreco').value) || 0;
    this.itensSelecionados.push({ id: opt.value, produto: opt.dataset.produto, qtd, precoUnit: preco, total: qtd * preco });
    sel.value = '';
    document.getElementById('obraItemQtd').value  = 1;
    document.getElementById('obraItemPreco').value = '';
    this.renderItensModal();
  },

  removerItem(idx) {
    this.itensSelecionados.splice(idx, 1);
    this.renderItensModal();
  },

  renderItensModal() {
    const tbody = document.getElementById('tbodyObraItens');
    const totalMaterial = this.itensSelecionados.reduce((s, i) => s + i.total, 0);
    if (!this.itensSelecionados.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center py-2 small">Nenhum item adicionado.</td></tr>';
    } else {
      tbody.innerHTML = this.itensSelecionados.map((item, idx) => `
        <tr>
          <td class="small">${item.produto}</td>
          <td class="text-end small">${item.qtd}</td>
          <td class="text-end small">${Utils.formatCurrency(item.precoUnit)}</td>
          <td class="text-end fw-semibold">${Utils.formatCurrency(item.total)}</td>
          <td class="text-center"><button class="btn btn-link text-danger p-0 btn-sm" onclick="Obras.removerItem(${idx})"><i class="bi bi-x-circle"></i></button></td>
        </tr>`).join('');
    }
    document.getElementById('obraTotalMaterial').textContent = Utils.formatCurrency(totalMaterial);
    document.getElementById('obraMaterial').value = totalMaterial.toFixed(2);
    this.recalcular();
  },

  // ── Pagamentos ────────────────────────────────────────────────
  adicionarPagamento() {
    const data  = document.getElementById('pagData').value;
    const valor = parseFloat(document.getElementById('pagValor').value);
    const obs   = document.getElementById('pagObs').value.trim();
    if (!data)        return Utils.showToast('Informe a data do pagamento.', 'warning');
    if (!valor || valor <= 0) return Utils.showToast('Informe um valor válido.', 'warning');

    if (this.editandoPagIdx >= 0) {
      this.pagamentos[this.editandoPagIdx] = { data, valor, obs };
      this.editandoPagIdx = -1;
      document.getElementById('btnCancelarPag').style.display = 'none';
    } else {
      this.pagamentos.push({ data, valor, obs });
    }
    document.getElementById('pagData').value  = '';
    document.getElementById('pagValor').value = '';
    document.getElementById('pagObs').value   = '';
    this.renderPagamentos();
  },

  editarPagamento(idx) {
    const p = this.pagamentos[idx];
    document.getElementById('pagData').value  = p.data;
    document.getElementById('pagValor').value = p.valor;
    document.getElementById('pagObs').value   = p.obs || '';
    this.editandoPagIdx = idx;
    document.getElementById('btnCancelarPag').style.display = '';
    document.getElementById('pagValor').focus();
  },

  cancelarEdicaoPag() {
    this.editandoPagIdx = -1;
    document.getElementById('pagData').value  = '';
    document.getElementById('pagValor').value = '';
    document.getElementById('pagObs').value   = '';
    document.getElementById('btnCancelarPag').style.display = 'none';
  },

  removerPagamento(idx) {
    this.pagamentos.splice(idx, 1);
    this.renderPagamentos();
  },

  renderPagamentos() {
    const tbody = document.getElementById('tbodyPagamentos');
    const total = this.pagamentos.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
    if (!this.pagamentos.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center py-2 small">Nenhum pagamento registrado.</td></tr>';
    } else {
      tbody.innerHTML = this.pagamentos.map((p, idx) => `
        <tr>
          <td class="small">${Utils.formatDate(p.data)}</td>
          <td class="text-end fw-semibold text-success">${Utils.formatCurrency(p.valor)}</td>
          <td class="small text-muted">${p.obs || '—'}</td>
          <td class="text-center" style="white-space:nowrap">
            <button class="btn btn-link text-primary p-0 btn-sm me-2" onclick="Obras.editarPagamento(${idx})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-link text-danger p-0 btn-sm" onclick="Obras.removerPagamento(${idx})"><i class="bi bi-x-circle"></i></button>
          </td>
        </tr>`).join('');
    }
    document.getElementById('totalPagoFoot').textContent = Utils.formatCurrency(total);
    document.getElementById('obraPagoDisplay').value = Utils.formatCurrency(total).replace('R$ ', '');
    this.recalcular();
  },

  // ── Custos Extras ─────────────────────────────────────────────
  adicionarCusto() {
    const categoria = document.getElementById('custoCategoria').value;
    const desc      = document.getElementById('custoDesc').value.trim();
    const valor     = parseFloat(document.getElementById('custoValor').value);
    if (!categoria) return Utils.showToast('Selecione uma categoria.', 'warning');
    if (!valor || valor <= 0) return Utils.showToast('Informe um valor válido.', 'warning');

    if (this.editandoCustoIdx >= 0) {
      this.custosExtras[this.editandoCustoIdx] = { categoria, desc, valor };
      this.editandoCustoIdx = -1;
      document.getElementById('btnCancelarCusto').style.display = 'none';
    } else {
      this.custosExtras.push({ categoria, desc, valor });
    }
    document.getElementById('custoDesc').value  = '';
    document.getElementById('custoValor').value = '';
    this.renderCustos();
  },

  editarCusto(idx) {
    const c = this.custosExtras[idx];
    document.getElementById('custoCategoria').value = c.categoria;
    document.getElementById('custoDesc').value      = c.desc || '';
    document.getElementById('custoValor').value     = c.valor;
    this.editandoCustoIdx = idx;
    document.getElementById('btnCancelarCusto').style.display = '';
    document.getElementById('custoValor').focus();
  },

  cancelarEdicaoCusto() {
    this.editandoCustoIdx = -1;
    document.getElementById('custoDesc').value  = '';
    document.getElementById('custoValor').value = '';
    document.getElementById('btnCancelarCusto').style.display = 'none';
  },

  removerCusto(idx) {
    this.custosExtras.splice(idx, 1);
    this.renderCustos();
  },

  renderCustos() {
    const tbody = document.getElementById('tbodyCustos');
    if (!tbody) return;
    const total = this.custosExtras.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
    if (!this.custosExtras.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-muted text-center py-2 small">Nenhum custo extra registrado.</td></tr>';
    } else {
      tbody.innerHTML = this.custosExtras.map((c, idx) => `
        <tr>
          <td class="small fw-semibold">${c.categoria}</td>
          <td class="small text-muted">${c.desc || '—'}</td>
          <td class="text-end text-danger fw-semibold">${Utils.formatCurrency(c.valor)}</td>
          <td class="text-center" style="white-space:nowrap">
            <button class="btn btn-link text-primary p-0 btn-sm me-2" onclick="Obras.editarCusto(${idx})"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-link text-danger p-0 btn-sm" onclick="Obras.removerCusto(${idx})"><i class="bi bi-x-circle"></i></button>
          </td>
        </tr>`).join('');
    }
    if (document.getElementById('totalCustosFoot'))
      document.getElementById('totalCustosFoot').textContent = Utils.formatCurrency(total);
    this.recalcular();
  },

  // ── Gerenciar Categorias ──────────────────────────────────────
  abrirGerenciarCats() {
    this._renderListaCats();
    new bootstrap.Modal(document.getElementById('modalCustoCats')).show();
  },

  _renderListaCats() {
    const lista = document.getElementById('listaCustoCats');
    if (!lista) return;
    const cats = CustosExtrasCats.get();
    lista.innerHTML = cats.map(c => `
      <li class="list-group-item d-flex justify-content-between align-items-center py-1 px-2">
        <span class="small">${c}</span>
        <button class="btn btn-link text-danger btn-sm p-0" onclick="Obras._removerCat('${c.replace(/'/g, "\\'")}')">
          <i class="bi bi-x-lg"></i>
        </button>
      </li>`).join('') || '<li class="list-group-item text-muted small">Nenhuma categoria.</li>';
  },

  adicionarCat() {
    const inp = document.getElementById('novaCustoCat');
    if (!CustosExtrasCats.add(inp.value)) {
      Utils.showToast('Categoria já existe ou inválida.', 'warning');
      return;
    }
    inp.value = '';
    this._renderListaCats();
    this._atualizarSelectCat();
  },

  _removerCat(nome) {
    CustosExtrasCats.remove(nome);
    this._renderListaCats();
    this._atualizarSelectCat();
  },

  _atualizarSelectCat() {
    const sel = document.getElementById('custoCategoria');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = CustosExtrasCats.get().map(c => `<option value="${c}"${c===cur?' selected':''}>${c}</option>`).join('');
  },

  recalcular() {
    const orcamento   = parseFloat(document.getElementById('obraOrcamento')?.value) || 0;
    const fechado     = parseFloat(document.getElementById('obraFechado')?.value)   || 0;
    const mo          = parseFloat(document.getElementById('obraMO')?.value)        || 0;
    const material    = parseFloat(document.getElementById('obraMaterial')?.value)  || 0;
    const variaveis   = parseFloat(document.getElementById('obraVariaveis')?.value) || 0;
    const pago        = this.pagamentos.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
    const extrasTotal = this.custosExtras.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);

    const receber = fechado - pago;
    const custo   = mo + material + variaveis + extrasTotal;
    const lucro   = orcamento - custo;

    if (document.getElementById('obraReceber'))    document.getElementById('obraReceber').value     = Utils.formatCurrency(receber);
    if (document.getElementById('obraCusto'))      document.getElementById('obraCusto').textContent = Utils.formatCurrency(custo);
    if (document.getElementById('obraOrcDisplay')) document.getElementById('obraOrcDisplay').textContent = Utils.formatCurrency(orcamento);
    if (document.getElementById('obraLucro')) {
      const el = document.getElementById('obraLucro');
      el.textContent = Utils.formatCurrency(lucro);
      el.className   = 'fw-bold fs-5 ' + (lucro >= 0 ? 'text-success' : 'text-danger');
    }
  },

  abrirModal(dados = null) {
    this.itensSelecionados = [];
    this.pagamentos        = [];
    this.custosExtras      = [];
    this.editandoPagIdx    = -1;
    this.editandoCustoIdx  = -1;

    if (dados?.itens)        { try { this.itensSelecionados = JSON.parse(dados.itens);        } catch (_) {} }
    if (dados?.pagamentos)   { try { this.pagamentos        = JSON.parse(dados.pagamentos);   } catch (_) {} }
    if (dados?.custosExtras) { try { this.custosExtras      = JSON.parse(dados.custosExtras); } catch (_) {} }

    document.getElementById('obraId').value       = dados?.id             || '';
    document.getElementById('obraNome').value      = dados?.nome          || '';
    document.getElementById('obraInicio').value    = dados?.dtInicio      || '';
    document.getElementById('obraEntrega').value   = dados?.dtEntrega     || '';
    document.getElementById('obraFase').value      = dados?.fase          || 'ANDAMENTO';
    document.getElementById('obraOrcamento').value = dados?.valorOrcamento|| 0;
    document.getElementById('obraFechado').value   = dados?.valorFechado  || 0;
    document.getElementById('obraMO').value        = dados?.maoDeObra     || 0;
    document.getElementById('obraVariaveis').value = dados?.variaveis     || 0;
    document.getElementById('pagData').value       = '';
    document.getElementById('pagValor').value      = '';
    document.getElementById('pagObs').value        = '';
    document.getElementById('btnCancelarPag').style.display  = 'none';
    document.getElementById('custoDesc').value  = '';
    document.getElementById('custoValor').value = '';
    document.getElementById('btnCancelarCusto').style.display = 'none';
    this._atualizarSelectCat();

    this.preencherSelectItens();
    this.renderItensModal();
    this.renderPagamentos();
    this.renderCustos();

    if (!this.itensSelecionados.length) {
      document.getElementById('obraMaterial').value = dados?.material || 0;
      this.recalcular();
    }

    new bootstrap.Modal(document.getElementById('modalObra')).show();
  },

  editar(id) {
    const o = this.dados.find(x => x.id === id);
    if (o) this.abrirModal(o);
  },

  async salvar() {
    const form = document.getElementById('formObra');
    if (!form.reportValidity()) return;

    const orcamento = parseFloat(document.getElementById('obraOrcamento').value) || 0;
    const fechado   = parseFloat(document.getElementById('obraFechado').value)   || 0;
    const mo        = parseFloat(document.getElementById('obraMO').value)        || 0;
    const material  = parseFloat(document.getElementById('obraMaterial').value)  || 0;
    const variaveis = parseFloat(document.getElementById('obraVariaveis').value) || 0;
    const pago        = this.pagamentos.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
    const extrasTotal = this.custosExtras.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
    const custo       = mo + material + variaveis + extrasTotal;
    const lucro       = orcamento - custo;

    const payload = {
      id:             document.getElementById('obraId').value,
      nome:           document.getElementById('obraNome').value,
      dtInicio:       document.getElementById('obraInicio').value,
      dtEntrega:      document.getElementById('obraEntrega').value,
      fase:           document.getElementById('obraFase').value,
      valorOrcamento: orcamento,
      valorFechado:   fechado,
      valorPago:      pago,
      valorReceber:   fechado - pago,
      variaveis,
      material,
      maoDeObra:      mo,
      custoObra:      custo,
      lucro,
      itens:          JSON.stringify(this.itensSelecionados),
      pagamentos:     JSON.stringify(this.pagamentos),
      custosExtras:   JSON.stringify(this.custosExtras),
    };

    try {
      Utils.showLoading(true);
      await Api.saveObra(payload);
      bootstrap.Modal.getInstance(document.getElementById('modalObra')).hide();
      Utils.showToast('Obra salva com sucesso!');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Deseja excluir esta obra?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteObra(id);
      Utils.showToast('Obra excluída.');
      await this.carregar();
    } catch (e) {
      Utils.showToast('Erro ao excluir: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },
};
