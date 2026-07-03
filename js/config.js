// Substitua pela URL do seu Google Apps Script após publicar como Web App
const API_URL = 'https://script.google.com/macros/s/AKfycbxzCogd1T8ypCCO7XmVbNllhEDv428sD3jVyZKMm7N0qhryF1VEgXmSAG2as_xK46nioA/exec';

const CONFIG = {
  apiUrl: API_URL,
  empresa: 'Anagesso',
  moeda: 'BRL',
  funcionarios: ['Thadeu', 'Vitor', 'Gabriel', 'Dim', 'Edir', 'Leandro'],
  // Admin — acesso completo
  login: { usuario: 'anagesso', senha: 'anagesso@2026' },
  // Operador de obras — acesso apenas à tela de Compras de Material
  loginOperador: { usuario: 'obras', senha: 'obras2026' },
};
