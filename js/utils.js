const Utils = {
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('pt-BR');
  },

  today() {
    return new Date().toISOString().split('T')[0];
  },

  diaSemana(dateStr) {
    if (!dateStr) return '';
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[new Date(dateStr + 'T12:00:00').getDay()];
  },

  showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const id = 'toast_' + Date.now();
    const color = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-warning';
    container.insertAdjacentHTML('beforeend', `
      <div id="${id}" class="toast align-items-center text-white ${color} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">${msg}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`);
    const el = document.getElementById(id);
    const toast = new bootstrap.Toast(el, { delay: 3500 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  },

  confirm(msg) {
    return window.confirm(msg);
  },

  showLoading(show = true) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
  },

  getMesAno() {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  },

  parseDate(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-');
    return new Date(y, m - 1, d);
  },
};
