# BeautyCycle 🌿 Monitor de Gastos e Desperdício para Salões de Beleza

Projeto de extensão **TI Verde** (Trilha C: EcoTI Monitor), desenvolvido na **UNIG EAD** (Universidade Iguaçu), curso de Análise e Desenvolvimento de Sistemas.

**Cliente:** Salão de Beleza Lucia, Nova Cidade, Nilópolis/RJ
**Professor:** Hamilcar Silva

## 🔗 Links

- Aplicação online: _(adicionar link do deploy)_
- Documento de Visão de Escopo: _(adicionar link)_
- Diagrama do banco (DER): _(adicionar imagem ou link)_

## 📌 Sobre o projeto

O BeautyCycle ajuda a proprietária de um pequeno salão a **registrar mensalmente seus gastos com água, energia e produtos** e a **acompanhar o desperdício de produtos** (sobras, validade vencida, erros de mistura). Gráficos comparativos mostram a evolução mês a mês, apoiando a redução de custos e da pegada ambiental.

O sistema foi pensado para uso principalmente em **celular** (mobile first), por uma única usuária.

## 🌍 Alinhamento com os ODS da ONU

- **ODS 12:** Consumo e Produção Responsáveis
- **ODS 13:** Ação Contra a Mudança Global do Clima
- **ODS 11:** Cidades e Comunidades Sustentáveis

## ✅ Funcionalidades

- Login com e-mail e senha
- CRUD de auditorias mensais (criar, listar, editar, excluir/inativar)
- Registro de consumos (água, energia, produtos) por auditoria
- Registro de desperdícios (produto, quantidade, valor, motivo)
- Dashboard com gráficos de gastos e desperdício por mês
- Filtro de auditorias por período

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Front-end | React + Tailwind CSS (gerado com Lovable) |
| Back-end / Banco | Supabase (PostgreSQL, Auth, API REST) |
| Versionamento | Git e GitHub |
| Deploy | _(Lovable / Vercel / Netlify)_ |

## 🗄️ Modelo de dados

Banco relacional com 4 tabelas e integridade referencial:

```
salao (1) ──< auditorias (N) ──< consumos (N)
                    └─────────< desperdicios (N)
```

| Tabela | Descrição |
|---|---|
| `salao` | Dados do estabelecimento e vínculo com o usuário |
| `auditorias` | Registro mensal (um por mês) |
| `consumos` | Água, energia e produtos de cada mês |
| `desperdicios` | Produtos desperdiçados de cada mês |

## 🚀 Como executar localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/RafaelSouza-hub/beautycycle.git
cd beautycycle

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# 4. Rodar o projeto
npm run dev
```

> As chaves do Supabase **não** devem ser enviadas ao GitHub. Use sempre o arquivo `.env`.

## 👥 Equipe

| Integrante | Responsabilidades |
|---|---|
| Rafael de Souza Santos | _(banco de dados e documentação)_ |
| Leandro Machado Antunes da Silva Pinto | _(front-end e deploy)_ |

## 📄 Licença

Projeto acadêmico de extensão, doado ao Salão de Beleza Lucia.
