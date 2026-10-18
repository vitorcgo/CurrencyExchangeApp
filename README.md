# Frankfurter Pro Terminal

SPA em React para conversão e análise de moedas, usando as taxas de referência
do Banco Central Europeu (BCE) através da Frankfurter API.

Projeto didático desenvolvido de forma incremental, aplicando os conteúdos
trabalhados em aula: componentes, props, estado, efeitos, custom hooks,
consumo de API, gráficos, filtros, ordenação, exportação CSV e publicação.

## Funcionalidades

- Conversão entre as 30 moedas suportadas pela API
- Atalhos de valor (100, 500, 1.000 e 5.000) e pares rápidos
- Inversão de moedas com um clique
- Congelamento da taxa por 60 segundos, com contagem regressiva
- Ticker no cabeçalho com a variação recente (USD/BRL, EUR/USD, GBP/USD, AUD/USD)
- Gráfico histórico em SVG com tooltip, médias móveis SMA(20) e SMA(50) e
  períodos de análise (7d, 15d, 30d, 3m, 6m, 1a e Max)
- Navegação pelos gráficos com teclado: setas, Home, End e Escape
- Exportação do gráfico em PNG com o dobro da resolução da tela
- Painel de estatísticas: tendência, volatilidade diária, mínimo e última cotação
- Tabela de cotações com busca por data, filtro de altas/baixas, ordenação
  por data ou valor e paginação
- Exportação CSV do resultado filtrado, pronta para o Excel em português
- Favoritos do usuário salvos no navegador (localStorage)
- Histórico das últimas 8 conversões, com data, hora e valores
- Link compartilhável com par, valor e período na própria URL
- Atualização automática em 1, 5 ou 15 minutos, além do botão manual
- Alerta de cotação acima ou abaixo de um valor alvo, com notificação do
  navegador quando a permissão é concedida
- Comparação de duas moedas no mesmo gráfico, normalizadas em base 100
- Painel com todas as moedas cotadas a partir da moeda de origem
- Tema escuro e tema claro, com preferência salva no navegador
- PWA instalável, com app shell e respostas da API em cache para uso offline
- Validação do valor digitado, dos favoritos e das respostas da API
- Estados de carregamento, mensagens de erro com "tentar novamente" e
  cancelamento de requisições antigas (AbortController)

## Tecnologias

- React 19 + Vite 8
- Tailwind CSS 4
- Frankfurter API (taxas diárias do BCE, sem necessidade de chave)
- Vitest + Testing Library
- Service worker e manifest para o modo PWA
- GitHub Actions + GitHub Pages

O gráfico não usa biblioteca externa: é um SVG desenhado do zero. A exportação
em PNG também é feita no navegador, sem dependência adicional.

## Como rodar

```bash
npm install
npm run dev
```

Depois acesse http://localhost:5173.

Outros comandos:

```bash
npm run build       # gera a versão de produção na pasta dist
npm run preview     # pré-visualiza a versão de produção
npm test            # roda os testes uma vez
npm run test:watch  # roda os testes em modo watch
```

O service worker é registrado apenas no build de produção. Para testar o modo
offline e a instalação do PWA, rode `npm run build` e depois `npm run preview`.

## URL compartilhável

O estado principal fica sincronizado na URL. Os parâmetros são opcionais e
validados antes de serem aplicados:

| Parâmetro | Exemplo | Descrição |
| --- | --- | --- |
| `from` | `USD` | moeda de origem |
| `to` | `BRL` | moeda de destino |
| `amount` | `1.234,56` | valor a converter |
| `period` | `3m` | período do gráfico |

Exemplo:

```text
http://localhost:5173/?from=EUR&to=BRL&amount=1000&period=3m
```

Os valores padrão (`amount=100` e `period=30d`) são omitidos da URL. O botão
"Copiar link" no conversor copia o endereço atual.

## Estrutura de arquivos

```text
src/
  api/frankfurter.js        cliente da API (fetch + async/await)
  hooks/
    useCurrencies.js        lista de moedas
    useTimeSeries.js        série histórica do par (com refetch e AbortController)
    useTicker.js            cotações do cabeçalho
    useLatestRates.js       cotações de todas as moedas a partir de uma base
    useConversionHistory.js histórico de conversões no localStorage
    useRateAlert.js         alerta de cotação e notificação do navegador
    useTheme.js             tema claro/escuro
    useLocalStorage.js      persistência de par, favoritos e preferências
    useElementWidth.js      largura do gráfico (responsivo)
  components/
    Header.jsx              cabeçalho, ticker, tema e status da conexão
    Converter.jsx           formulário, máscara, link e congelamento
    ConvertedHero.jsx       valor convertido em destaque
    RateChart.jsx           gráfico histórico em SVG, teclado e exportação PNG
    ComparisonChart.jsx     duas séries normalizadas em base 100
    AllRates.jsx            painel com as demais moedas
    ConversionHistory.jsx   histórico recente de conversões
    RateAlert.jsx           criação e acompanhamento do alerta
    RatesTable.jsx          tabela, filtros, ordenação e CSV
    StatsGrid.jsx           estatísticas do período
    TimeAgo.jsx             tempo desde a última atualização
    Card.jsx                cartão base do layout
  utils/
    format.js               formatação de números, moedas e datas
    stats.js                variação, média móvel, volatilidade e tendência
    dates.js                períodos de análise e série de paridade
    csv.js                  geração e download do CSV
    chartExport.js          serialização do SVG e download do PNG
    validation.js           validação de moedas, favoritos, datas e valor
    urlState.js             leitura e escrita dos parâmetros da URL
    history.js              limpeza e limite do histórico salvo
  test/setup.js             configuração do Testing Library
  App.jsx                   estado compartilhado (lifting state up)
  main.jsx                  ponto de entrada e registro do service worker
  index.css                 tokens, temas e estilos globais
public/
  manifest.webmanifest      configuração do PWA
  icon.svg                  ícone vetorial do app
  icon-192.png              ícone para instalação
  icon-512.png              ícone para instalação e máscara
  sw.js                     cache offline do app shell, dos assets e da API
```

## API utilizada

Base: `https://api.frankfurter.dev/v1`

- `GET /currencies` lista as moedas disponíveis
- `GET /latest?base=USD` cotações mais recentes para todas as moedas
- `GET /{inicio}..{fim}?base=USD&symbols=BRL` série histórica do par

As taxas são publicadas pelo BCE em dias úteis, por volta das 16h no horário
de Frankfurt. Não há publicação em fins de semana e feriados; o app usa sempre
a última cotação disponível. Quando origem e destino são a mesma moeda, o app
exibe uma série de paridade 1:1 gerada localmente.

## Testes

Os testes cobrem as funções puras e o comportamento principal do conversor:

- validação de moedas, datas e valores
- geração da série de paridade e intervalos de tempo
- estatísticas, médias móveis e variações
- CSV com BOM, escape e proteção contra fórmulas
- leitura e escrita do estado na URL
- limpeza do histórico salvo
- máscara do valor, erro de entrada, favorito e frequência de atualização

```bash
npm test
```

## PWA e modo offline

Depois da primeira visita em produção, o service worker guarda o app shell e
as respostas da Frankfurter API. No build, o Vite gera `precache-manifest.json`
com os arquivos versionados (JavaScript, CSS e ícones) para que o app já abra
offline na primeira recarga. Ao abrir sem conexão, o painel usa a última série
disponível em cache. Os dados de câmbio continuam sendo de referência e podem
estar desatualizados quando não há rede.

O alerta de cotação é verificado enquanto a aba estiver aberta. A notificação
do navegador depende da permissão do usuário e de a atualização automática
estar ativa para que novas taxas sejam consultadas.

## Deploy no GitHub Pages

O workflow `.github/workflows/deploy.yml` roda os testes e gera o build a cada
push na branch `main`. A publicação no GitHub Pages acontece apenas quando a
variável de repositório `ENABLE_PAGES` estiver definida como `true` em Settings
> Secrets and variables > Actions > Variables. Sem essa variável, o workflow
apenas testa e gera o build, sem falhar quando o Pages não está disponível.

Passos:

1. Envie o repositório para o GitHub.
2. Crie a variável de repositório `ENABLE_PAGES` com o valor `true`.
3. Em Settings > Pages, escolha a origem "GitHub Actions" caso o workflow ainda
   não tenha habilitado o Pages automaticamente.
4. Faça um push na branch `main` ou execute o workflow manualmente.

O `vite.config.js` detecta o nome do repositório em `GITHUB_REPOSITORY` e ajusta
o caminho base para `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Observação: em repositórios privados, o GitHub Pages pode exigir um plano que
inclua publicação de sites. Se o Pages não estiver disponível, o build continua
funcionando localmente e pode ser publicado em Vercel, Netlify ou outro host
estático.

## Onde está cada conteúdo das aulas

| Conteúdo | Onde encontrar |
| --- | --- |
| React e JSX | `src/main.jsx` e todos os componentes |
| Componentização | `src/components` |
| Props | `Converter`, `ConvertedHero`, `RateChart`, `ComparisonChart` |
| Eventos | `onChange` do valor, inversão, ordenação, teclado e tema |
| useState | `App.jsx` e componentes específicos (filtros, hover do gráfico) |
| Lifting State Up | estado compartilhado em `src/App.jsx` |
| useEffect | hooks de dados, localStorage, título, URL e congelamento |
| Custom Hooks | `src/hooks` |
| fetch e async/await | `src/api/frankfurter.js` |
| Arrays e objetos | `src/utils/stats.js`, `toPoints` em `frankfurter.js` |
| Gráficos | `RateChart.jsx` e `ComparisonChart.jsx` |
| Filtros e ordenação | `src/components/RatesTable.jsx` |
| Exportação CSV | `src/utils/csv.js` |
| Exportação de imagem | `src/utils/chartExport.js` |
| Estado na URL | `src/utils/urlState.js` |
| PWA e cache | `public/sw.js` e `src/main.jsx` |
| Testes | arquivos `*.test.js` e `*.test.jsx` |
| Git e GitHub | histórico de commits e workflow de deploy |

## Git e GitHub

O histórico foi organizado em commits pequenos, em português, no padrão
`feat:`, `fix:`, `docs:`, `test:` e `build:`.

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

## Limitações conhecidas

- O alerta não funciona com a aba fechada, pois não há servidor de background.
- O modo offline usa a última resposta em cache, sem atualizar as cotações.
- A exportação em PNG usa as fontes disponíveis no navegador no momento da
  geração da imagem.
- O GitHub Pages em repositório privado depende do plano da conta.
