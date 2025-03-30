# POC - Integração OpenAI com Ferramentas (Tools)

Este repositório demonstra uma prova de conceito (POC) para integrar a API do **OpenAI** com ferramentas externas (tools). O OpenAI é usado para receber uma mensagem do usuário, determinar qual ferramenta precisa ser acionada (com base na mensagem) e executar a ação correspondente.

## Funcionalidades

A POC inclui três ferramentas de exemplo implementadas como funções:
1. **Obter a previsão do tempo** para uma cidade (via **wttr.in**).
2. **Obter o próximo lançamento da SpaceX** (via **SpaceX API**).
3. **Obter informações sobre um país**, como sua capital e população (via **restcountries.com**).

Essas ferramentas são integradas ao modelo da OpenAI por meio do recurso de "tools", que permite chamadas de funções personalizadas (function calling) e abre caminho para futuras expansões.

## Requisitos

- **Node.js** (v23 ou superior).
- **Chave de API do OpenAI**. Obtenha sua chave em [OpenAI](https://platform.openai.com/account/api-keys).
- **Dependências**:
  - `openai`: Para interagir com a API da OpenAI.
  - `fetch`: Para fazer requisições HTTP externas.

### Instalação

1. **Clone este repositório**:

    ```bash
    git clone https://github.com/seu-usuario/poc-openai-tools.git
    cd poc-openai-tools
    ```

2. **Instale as dependências**:

    ```bash
    npm install
    ```

3. **Configure a chave da API**:
   Crie um arquivo `.env` na raiz do projeto e adicione sua chave de API do OpenAI:

    ```
    OPENAI_API_KEY=SuaChaveAqui
    ```

4. **Inicie o script**:

    Após configurar a chave da API, execute o script para testar a integração.

    ```bash
    node index.js
    ```

## Como Funciona

1. **Definição das Ferramentas**:
   O objeto `functions` contém três funções que atuam como ferramentas, executadas quando chamadas pelo modelo OpenAI. Cada uma faz uma requisição externa e retorna os dados processados.

2. **Registro das Ferramentas no OpenAI**:
   As ferramentas são definidas no array `tools`, onde cada uma é registrada como um objeto do tipo `function`. Elas incluem nome, descrição e parâmetros necessários, conforme a especificação da API.

3. **Uso das Ferramentas**:
   Quando o usuário envia uma mensagem, o modelo da OpenAI analisa o contexto e decide se deve acionar uma ferramenta (via "tool calls") ou responder diretamente com texto. Se uma ferramenta for escolhida, ela é executada com os argumentos fornecidos pelo modelo.

4. **Função Principal (`chatWithTools`)**:
   A função principal processa a mensagem do usuário, interage com a API da OpenAI usando o parâmetro `tools`, executa a ferramenta selecionada e retorna uma resposta elaborada ao usuário.

### Exemplo de Uso

Ao chamar `chatWithTools` com a mensagem "Qual é o tempo atual em Brasília?", o modelo da OpenAI aciona a ferramenta `getWeather` com o argumento "Brasília" e retorna a previsão do tempo.

```typescript
chatWithTools("Qual é o tempo atual em Brasília?");
```

### Ferramentas Definidas

1. **getWeather**:
   - **Descrição**: Obtém a previsão do tempo para uma cidade.
   - **Exemplo**: "Qual é o tempo em Londres?".

2. **getNextLaunchSpaceX**:
   - **Descrição**: Retorna informações sobre o próximo lançamento da SpaceX.
   - **Exemplo**: "Quando é o próximo lançamento da SpaceX?".

3. **getCountryInfo**:
   - **Descrição**: Obtém informações sobre um país, como capital e população.
   - **Exemplo**: "Qual é a capital da Alemanha?".

## Estrutura de Arquivos

```
 /poc-openai-tools
 ├── index.js       # Código principal que integra as ferramentas com a OpenAI
 ├── package.json   # Gerenciador de pacotes
 ├── .env           # Variáveis de ambiente (incluindo chave de API)
 └── README.md      # Este arquivo
```