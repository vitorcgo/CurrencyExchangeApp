# FrankFrutyh

SPA em React para conversão e análise de moedas, usando as taxas de referência
do Banco Central Europeu (BCE) através da Frankfurter API.

Projeto didático desenvolvido de forma incremental, aplicando os conteúdos
trabalhados em aula: componentes, props, estado, efeitos, custom hooks,
consumo de API, gráficos, filtros, ordenação e exportação CSV.

## Funcionalidades

- Conversão entre as 30 moedas suportadas pela API
- Atalhos de valor (100, 500, 1.000 e 5.000) e pares rápidos
- Inversão de moedas com um clique
- Congelamento da taxa por 60 segundos, com contagem regressiva
- Ticker no cabeçalho com a variação recente (USD/BRL, EUR/USD, GBP/USD, AUD/USD)
- Gráfico histórico em SVG com tooltip, médias móveis SMA(20) e SMA(50) e
  períodos de análise (7d, 15d, 30d, 3m, 6m, 1a e Max)
- Painel de estatísticas: tendência, volatilidade diária, mínimo e última cotação
- Tabela de cotações com busca por data, filtro de altas/baixas, ordenação
  por data ou valor e paginação
- Exportação CSV do resultado filtrado, pronta para o Excel em português
- Favoritos do usuário salvos no navegador (localStorage)
- Validação do valor digitado, dos favoritos e das respostas da API
- Estados de carregamento, mensagens de erro com "tentar novamente" e
  cancelamento de requisições antigas (AbortController)

## Tecnologias

- React 19 + Vite 8
- Tailwind CSS 4
- Frankfurter API (taxas diárias do BCE, sem necessidade de chave)

O gráfico não usa biblioteca externa: é um SVG desenhado do zero.

## Como rodar

```bash
npm install
npm run dev
```

Depois acesse http://localhost:5173.

Outros comandos:

```bash
npm run build    # gera a versão de produção na pasta dist
npm run preview  # pré-visualiza a versão de produção
```

## Estrutura de arquivos

```
src/
  api/frankfurter.js        cliente da API (fetch + async/await)
  hooks/
    useCurrencies.js        lista de moedas
    useTimeSeries.js        série histórica do par (com refetch e AbortController)
    useTicker.js            cotações do cabeçalho
    useLocalStorage.js      persistência de par e favoritos
    useElementWidth.js      largura do gráfico (responsivo)
  components/
    Header.jsx              cabeçalho, ticker e status da conexão
    Converter.jsx           formulário de conversão
    ConvertedHero.jsx       valor convertido em destaque
    RateChart.jsx           gráfico histórico em SVG
    StatsGrid.jsx           estatísticas do período
    RatesTable.jsx          tabela, filtros, ordenação e CSV
    Card.jsx                cartão base do layout
  utils/
    format.js               formatação de números, moedas e datas
    stats.js                variação, média móvel, volatilidade e tendência
    dates.js                períodos de análise e série de paridade
    csv.js                  geração e download do CSV
    validation.js           validação de moedas, favoritos e valor digitado
  App.jsx                   estado compartilhado (lifting state up)
  main.jsx                  ponto de entrada
  index.css                 tema cinza chumbo, preto e verde (tokens do Tailwind)
```

## API utilizada

Base: `https://api.frankfurter.dev/v1`

- `GET /currencies` lista as moedas disponíveis
- `GET /{inicio}..{fim}?base=USD&symbols=BRL` série histórica do par

As taxas são publicadas pelo BCE em dias úteis, por volta das 16h no horário
de Frankfurt. Não há publicação em fins de semana e feriados; o app usa sempre
a última cotação disponível. Quando origem e destino são a mesma moeda, o app
exibe uma série de paridade 1:1 gerada localmente.

## Onde está cada conteúdo das aulas

| Conteúdo | Onde encontrar |
| --- | --- |
| React e JSX | `src/main.jsx` e todos os componentes |
| Componentização | `src/components` |
| Props | `Converter`, `ConvertedHero`, `RateChart` |
| Eventos | `onChange` do valor, botão de inversão, ordenação da tabela |
| useState | `App.jsx` e componentes específicos (filtros, hover do gráfico) |
| Lifting State Up | estado compartilhado em `src/App.jsx` |
| useEffect | hooks de dados, localStorage, título da aba e congelamento da taxa |
| Custom Hooks | `src/hooks` |
| fetch e async/await | `src/api/frankfurter.js` |
| Arrays e objetos | `src/utils/stats.js`, `toPoints` em `frankfurter.js` |
| Gráficos | `src/components/RateChart.jsx` |
| Filtros e ordenação | `src/components/RatesTable.jsx` |
| Exportação CSV | `src/utils/csv.js` |
| Git e GitHub | histórico de commits deste repositório |

## Git e GitHub

O histórico foi organizado em commits pequenos, em português, no padrão
`feat:`, `fix:` e `docs:`.

Para publicar no seu GitHub:

```bash
git remote add origin https://github.com/SEU-USUARIO/frankfurter-pro-terminal.git
git push -u origin main
```

Antes de novos commits, configure sua identidade:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

Observação: os commits existentes usam um autor provisório
(`FrankFrutyh <frankfrutyh@users.noreply.github.com>`). Se quiser assinar com
o seu nome, avise que eu refaço o histórico.

## Próximos passos

- Tema claro/escuro
- Comparação de vários pares no mesmo gráfico
- Alertas de preço
- Testes automatizados (Vitest + Testing Library)
- Deploy (Vercel, Netlify ou GitHub Pages)
