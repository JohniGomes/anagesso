const Financeiro = {
  render() {
    document.getElementById('pageTitle').textContent = 'Financeiro';
    document.getElementById('content').innerHTML = `
      <iframe
        src="financeiro.html"
        id="frameFinanceiro"
        style="width:100%;height:calc(100vh - 56px);border:none;display:block;"
        allow="same-origin"
        title="Módulo Financeiro"
      ></iframe>`;
  }
};
