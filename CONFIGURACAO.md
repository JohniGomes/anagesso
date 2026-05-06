# Como configurar o ERP Anagesso

## 1. Criar a Planilha Google

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha nova
2. Copie o **ID** da URL: `https://docs.google.com/spreadsheets/d/**SEU_ID_AQUI**/edit`
3. Cole esse ID no arquivo `backend/Code.gs`, na variável `SHEET_ID`

## 2. Configurar o Google Apps Script

1. Na planilha, vá em **Extensões → Apps Script**
2. Apague o código padrão e cole todo o conteúdo de `backend/Code.gs`
3. Salve (Ctrl+S)
4. Rode a função `seedBaseItens` uma vez para popular a base de itens:
   - Selecione `seedBaseItens` no menu dropdown
   - Clique em ▶ Executar
   - Autorize as permissões quando solicitado

## 3. Publicar como Web App

1. Clique em **Implantar → Nova implantação**
2. Tipo: **App da Web**
3. Configurações:
   - Executar como: **Eu (meu e-mail)**
   - Quem tem acesso: **Qualquer pessoa**
4. Clique em **Implantar** e copie a **URL gerada**

## 4. Conectar o Frontend

1. Abra o arquivo `js/config.js`
2. Substitua `'https://script.google.com/macros/s/SEU_SCRIPT_ID/exec'` pela URL copiada no passo anterior

## 5. Publicar no GitHub Pages

```bash
cd erp-anagesso
git init
git add .
git commit -m "ERP Anagesso v1.0"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/erp-anagesso.git
git push -u origin main
```

Depois, no repositório GitHub:
- Vá em **Settings → Pages**
- Source: **Deploy from a branch → main → / (root)**
- Salve e aguarde o link ser gerado

## Estrutura das Abas (criadas automaticamente)

| Aba | Conteúdo |
|-----|----------|
| `Clientes` | id, nome, telefone, email, dataCadastro |
| `Base_Itens` | id, produto, preco |
| `Obras` | id, nome, datas, fase, valores financeiros |
| `Controle_MO` | id, funcionario, data, dia, servico, valor, vale |
| `Orcamentos` | id, cliente, contato, data, status, itens (JSON), valorTotal |

> As abas são criadas automaticamente no primeiro acesso de cada módulo.
