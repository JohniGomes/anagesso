const Compras = {
  obras: [],
  itens: [],       // itens manuais adicionados
  notaBase64: '',  // imagem comprimida da nota fiscal

  async render() {
    const isOperador = sessionStorage.getItem('anagesso_role') === 'operador';
    document.getElementById('pageTitle').textContent = 'Compras de Material';
    document.getElementById('content').innerHTML = `
      ${isOperador ? '' : `
      <div class="d-flex flex-wrap gap-2 mb-4">
        <select class="form-select form-select-sm" id="filtroObraCompra" style="max-width:280px" onchange="Compras.filtrarLista()">
          <option value="">Todas as obras</option>
        </select>
        <button class="btn btn-success btn-sm ms-auto" onclick="Compras.abrirModal()">
          <i class="bi bi-plus-lg me-1"></i>Lançar Compra
        </button>
      </div>
      <div class="card shadow-sm mb-4">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-dark">
                <tr><th>Data</th><th>Obra</th><th>Operador</th><th>Itens</th><th class="text-end">Total</th><th>Nota</th><th class="text-center">Ações</th></tr>
              </thead>
              <tbody id="tbodyCompras"><tr><td colspan="7" class="text-center py-4">Carregando...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>`}

      ${isOperador ? `
      <div class="container" style="max-width:600px">
        <div class="text-center mb-4">
          <h4 class="fw-bold text-primary">Lançar Material Comprado</h4>
          <p class="text-muted small">Selecione a obra e informe o que foi comprado</p>
        </div>
        ${Compras._formHtml()}
      </div>` : ''}

      <!-- Modal (admin) -->
      ${isOperador ? '' : `
      <div class="modal fade" id="modalCompra" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-dark text-white">
              <h5 class="modal-title"><i class="bi bi-cart-plus me-2"></i>Lançar Compra de Material</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">${Compras._formHtml('modal-')}</div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button class="btn btn-primary" onclick="Compras.salvar('modal-')"><i class="bi bi-save me-1"></i>Salvar</button>
            </div>
          </div>
        </div>
      </div>`}`;

    await this.carregarObras();
    if (!isOperador) await this.carregarLista();
  },

  _formHtml(prefix = '') {
    return `
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label fw-semibold">Obra *</label>
          <select class="form-select" id="${prefix}compraObra" required>
            <option value="">Selecione a obra...</option>
          </select>
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Data *</label>
          <input type="date" class="form-control" id="${prefix}compraData" required value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="col-6">
          <label class="form-label fw-semibold">Operador *</label>
          <input type="text" class="form-control" id="${prefix}compraOperador" required placeholder="Seu nome">
        </div>

        <div class="col-12">
          <label class="form-label fw-semibold">Itens Comprados</label>
          <div class="input-group input-group-sm mb-2">
            <input type="text" class="form-control" id="${prefix}itemNome" placeholder="Ex: Gesso, Tábua, Parafuso...">
            <input type="number" class="form-control" id="${prefix}itemQtd" placeholder="Qtd" min="0" step="0.01" style="max-width:80px">
            <input type="text" class="form-control" id="${prefix}itemUnid" placeholder="Un" style="max-width:70px">
            <input type="number" class="form-control" id="${prefix}itemPreco" placeholder="R$ unit." min="0" step="0.01" style="max-width:100px">
            <button class="btn btn-outline-success" type="button" onclick="Compras.addItem('${prefix}')"><i class="bi bi-plus-lg"></i></button>
          </div>
          <div id="${prefix}listaItens" class="border rounded p-2 mb-1" style="min-height:60px;background:#f8f9fa">
            <p class="text-muted small text-center mb-0 mt-1">Nenhum item adicionado. Use o campo acima.</p>
          </div>
          <div class="d-flex justify-content-between small text-muted px-1">
            <span>Total estimado:</span>
            <span class="fw-bold text-success" id="${prefix}totalItens">R$ 0,00</span>
          </div>
        </div>

        <div class="col-12">
          <label class="form-label fw-semibold">Nota Fiscal / Comprovante <span class="text-muted fw-normal">(opcional)</span></label>
          <input type="file" class="form-control" id="${prefix}compraFoto" accept="image/*" capture="environment"
            onchange="Compras.processarFoto(this, '${prefix}')">
          <div id="${prefix}fotoPreview" class="mt-2" style="display:none">
            <img id="${prefix}fotoImg" src="" style="max-height:200px;max-width:100%;border-radius:8px;border:1px solid #ddd">
            <button type="button" class="btn btn-link text-danger btn-sm p-0 ms-2" onclick="Compras.removerFoto('${prefix}')">Remover</button>
          </div>
        </div>

        <div class="col-12">
          <label class="form-label fw-semibold">Observação</label>
          <input type="text" class="form-control" id="${prefix}compraObs" placeholder="Detalhes adicionais...">
        </div>

        ${prefix === '' ? `
        <div class="col-12">
          <button type="button" class="btn btn-primary w-100 py-3 fw-bold" onclick="Compras.salvar('')" id="btnSalvarCompra">
            <i class="bi bi-send me-2"></i>ENVIAR LANÇAMENTO
          </button>
        </div>` : ''}
      </div>`;
  },

  addItem(prefix) {
    const nome  = document.getElementById(`${prefix}itemNome`)?.value.trim();
    const qtd   = parseFloat(document.getElementById(`${prefix}itemQtd`)?.value)   || 1;
    const unid  = document.getElementById(`${prefix}itemUnid`)?.value.trim()  || 'Un';
    const preco = parseFloat(document.getElementById(`${prefix}itemPreco`)?.value) || 0;
    if (!nome) { Utils.showToast('Informe o nome do item.', 'warning'); return; }

    // Armazenar no escopo certo (modal vs inline)
    const key = `_itens_${prefix}`;
    if (!Compras[key]) Compras[key] = [];
    Compras[key].push({ nome, qtd, unid, preco, total: qtd * preco });

    document.getElementById(`${prefix}itemNome`).value  = '';
    document.getElementById(`${prefix}itemQtd`).value   = '';
    document.getElementById(`${prefix}itemUnid`).value  = '';
    document.getElementById(`${prefix}itemPreco`).value = '';
    this._renderItens(prefix);
  },

  _renderItens(prefix) {
    const key   = `_itens_${prefix}`;
    const lista = Compras[key] || [];
    const el    = document.getElementById(`${prefix}listaItens`);
    const tot   = document.getElementById(`${prefix}totalItens`);
    const total = lista.reduce((s, i) => s + (i.total || 0), 0);

    if (!lista.length) {
      el.innerHTML = '<p class="text-muted small text-center mb-0 mt-1">Nenhum item adicionado. Use o campo acima.</p>';
    } else {
      el.innerHTML = lista.map((it, idx) => `
        <div class="d-flex align-items-center justify-content-between py-1 border-bottom">
          <span class="small"><strong>${it.qtd} ${it.unid}</strong> ${it.nome}</span>
          <span class="d-flex align-items-center gap-2">
            <span class="small text-success fw-semibold">${it.preco > 0 ? Utils.formatCurrency(it.total) : ''}</span>
            <button class="btn btn-link text-danger p-0 btn-sm" onclick="Compras._removeItem('${prefix}',${idx})"><i class="bi bi-x-circle"></i></button>
          </span>
        </div>`).join('');
    }
    if (tot) tot.textContent = Utils.formatCurrency(total);
  },

  _removeItem(prefix, idx) {
    const key = `_itens_${prefix}`;
    if (Compras[key]) { Compras[key].splice(idx, 1); this._renderItens(prefix); }
  },

  async processarFoto(input, prefix) {
    const file = input.files[0];
    if (!file) return;
    try {
      const b64 = await this._comprimirImg(file);
      const key = `_nota_${prefix}`;
      Compras[key] = b64;
      document.getElementById(`${prefix}fotoImg`).src = b64;
      document.getElementById(`${prefix}fotoPreview`).style.display = '';
    } catch (e) {
      Utils.showToast('Erro ao processar imagem.', 'error');
    }
  },

  removerFoto(prefix) {
    const key = `_nota_${prefix}`;
    Compras[key] = '';
    document.getElementById(`${prefix}fotoPreview`).style.display = 'none';
    document.getElementById(`${prefix}compraFoto`).value = '';
  },

  _comprimirImg(file, maxW = 800, q = 0.65) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const scale  = Math.min(1, maxW / img.width);
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(img.width  * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', q));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async carregarObras() {
    try {
      this.obras = await Api.getObras();
      ['compraObra', 'modal-compraObra', 'filtroObraCompra'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const isFilter = id === 'filtroObraCompra';
        el.innerHTML = (isFilter ? '<option value="">Todas as obras</option>' : '<option value="">Selecione a obra...</option>') +
          this.obras.filter(o => o.fase !== 'EXECUTADO' || isFilter)
            .map(o => `<option value="${o.id}" data-nome="${o.nome}">${o.nome}</option>`).join('');
      });
    } catch (_) {}
  },

  async carregarLista() {
    try {
      Utils.showLoading(true);
      const dados = await Api.getCompras();
      dados.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
      const tbody = document.getElementById('tbodyCompras');
      if (!tbody) return;
      if (!dados.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Nenhuma compra lançada.</td></tr>';
        return;
      }
      tbody.innerHTML = dados.map(c => {
        let resumoItens = '—';
        try { const arr = JSON.parse(c.itens); resumoItens = arr.map(i=>`${i.qtd} ${i.unid} ${i.nome}`).join(', '); } catch(_) {}
        return `<tr>
          <td>${Utils.formatDate(c.data)}</td>
          <td class="fw-semibold">${c.obraNome || '—'}</td>
          <td>${c.operador || '—'}</td>
          <td class="small text-muted" style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${resumoItens}">${resumoItens}</td>
          <td class="text-end fw-semibold text-success">${Utils.formatCurrency(c.valorTotal)}</td>
          <td class="text-center">${c.temNota === 'sim' ? '<span class="badge bg-success">✓ Sim</span>' : '<span class="badge bg-secondary">Não</span>'}</td>
          <td class="text-center">
            <button class="btn btn-outline-danger btn-sm" onclick="Compras.excluir('${c.id}')"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`;
      }).join('');
    } catch (e) {
      Utils.showToast('Erro ao carregar compras.', 'error');
    } finally {
      Utils.showLoading(false);
    }
  },

  filtrarLista() { this.carregarLista(); },

  abrirModal() {
    Compras['_itens_modal-'] = [];
    Compras['_nota_modal-']  = '';
    this._renderItens('modal-');
    const pref = 'modal-';
    document.getElementById(`${pref}compraData`).value     = new Date().toISOString().split('T')[0];
    document.getElementById(`${pref}compraOperador`).value = '';
    document.getElementById(`${pref}compraObs`).value      = '';
    document.getElementById(`${pref}fotoPreview`).style.display = 'none';
    new bootstrap.Modal(document.getElementById('modalCompra')).show();
  },

  async salvar(prefix) {
    const obraEl = document.getElementById(`${prefix}compraObra`);
    const obraId = obraEl?.value;
    const obraNome = obraEl?.selectedOptions[0]?.dataset.nome || '';
    const data     = document.getElementById(`${prefix}compraData`)?.value;
    const operador = document.getElementById(`${prefix}compraOperador`)?.value.trim();
    const obs      = document.getElementById(`${prefix}compraObs`)?.value.trim();

    if (!obraId)  return Utils.showToast('Selecione a obra.', 'warning');
    if (!data)    return Utils.showToast('Informe a data.', 'warning');
    if (!operador) return Utils.showToast('Informe o operador.', 'warning');

    const itens = Compras[`_itens_${prefix}`] || [];
    if (!itens.length) return Utils.showToast('Adicione ao menos um item.', 'warning');

    const valorTotal = itens.reduce((s, i) => s + (i.total || 0), 0);
    const nota = Compras[`_nota_${prefix}`] || '';

    const payload = {
      obraId, obraNome, data, operador, obs,
      itens:      JSON.stringify(itens),
      valorTotal: valorTotal.toFixed(2),
      temNota:    nota ? 'sim' : 'nao',
    };

    const btn = document.getElementById('btnSalvarCompra');
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

    try {
      Utils.showLoading(true);
      await Api.saveCompra(payload);

      // Armazena a imagem localmente associada ao lançamento
      if (nota) {
        const chave = `nota_${obraId}_${Date.now()}`;
        try { localStorage.setItem(chave, nota); } catch(_) {}
      }

      if (prefix === '') {
        // Operador: limpa form
        Compras['_itens_'] = [];
        Compras['_nota_']  = '';
        this._renderItens('');
        document.getElementById('compraOperador').value = '';
        document.getElementById('compraObs').value      = '';
        document.getElementById('compraData').value     = new Date().toISOString().split('T')[0];
        document.getElementById('compraObra').value     = '';
        document.getElementById('fotoPreview').style.display = 'none';
        Utils.showToast('✅ Compra enviada com sucesso!');
      } else {
        bootstrap.Modal.getInstance(document.getElementById('modalCompra')).hide();
        Utils.showToast('Compra registrada!');
        await this.carregarLista();
      }
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-send me-2"></i>ENVIAR LANÇAMENTO'; }
    }
  },

  async excluir(id) {
    if (!Utils.confirm('Excluir este lançamento?')) return;
    try {
      Utils.showLoading(true);
      await Api.deleteCompra(id);
      Utils.showToast('Removido.');
      await this.carregarLista();
    } catch (e) {
      Utils.showToast('Erro: ' + e.message, 'error');
    } finally {
      Utils.showLoading(false);
    }
  },
};
