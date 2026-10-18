# Análise manual de Test Smells

## Etapa 1 — Preparação do ambiente

- O repositório já está clonado neste diretório. O remoto `origin` aponta para `https://github.com/guilhermeas04/test-smelly.git` e `upstream` para `https://github.com/CleitonSilvaT/test-smelly.git`, configuração compatível com um fork. A relação de fork no GitHub não foi verificada remotamente; não foi necessário criar outro clone.
- `npm install` foi executado com sucesso.
- A execução inicial da suíte passou: **1 suíte aprovada, 4 testes aprovados e 1 ignorado**, de 5 testes no total.
- Neste projeto, o arquivo está em `test/userService.smelly.test.js`, apesar de o enunciado e o README mencionarem `__tests__/userService.smelly.test.js`.

## Etapa 2 — Observações por teste

### 1. Teste com responsabilidades múltiplas (Eager Test)

**Local:** `test/userService.smelly.test.js`, linhas 18–30.

O teste “deve criar e buscar um usuário corretamente” verifica tanto `createUser` quanto `getUserById`. Uma falha na criação impede a avaliação da busca, dificultando identificar qual comportamento está incorreto. A quantidade de asserts, isoladamente, não é o problema: o teste reúne comportamentos distintos.

**Melhoria sugerida:** separar o teste de criação do teste de busca, com preparação explícita dos dados necessários para cada cenário.

### 2. Lógica condicional no teste (Conditional Test Logic)

**Local:** `test/userService.smelly.test.js`, linhas 33–51.

O teste de desativação usa um `for` e um `if/else` para decidir quais expectativas executar conforme `user.isAdmin`. Isso acrescenta lógica ao próprio teste e mistura os cenários de usuário comum e administrador, tornando a leitura e o diagnóstico de falhas mais difíceis.

**Melhoria sugerida:** criar dois testes independentes: um para desativar usuário comum e outro para impedir a desativação de administrador. No segundo, também verificar que o status continua ativo.

### 3. Teste frágil (Fragile Test)

**Local:** `test/userService.smelly.test.js`, linhas 54–63.

O teste de relatório exige uma linha com pontuação, espaços e quebra de linha exatos, além de um cabeçalho literal. Uma mudança de apresentação pode quebrá-lo mesmo que o relatório continue contendo os dados corretos.

**Ressalva:** se esse formato exato fizer parte do contrato do serviço, essas verificações são legítimas. A fragilidade depende de o teste estar fixando detalhes de apresentação que poderiam variar.

**Melhoria sugerida:** definir primeiro o contrato do relatório e verificar somente os detalhes exigidos por ele. Bob é criado, mas seu conteúdo no relatório não é verificado.

### 4. Tratamento inadequado de exceção (Exception Handling)

**Local:** `test/userService.smelly.test.js`, linhas 66–74.

O teste de menor de idade coloca o único `expect` dentro do `catch`. Se `createUser` deixar de lançar a exceção, nenhuma asserção será executada e o teste ainda passará: um falso positivo. O comentário que diz que ele “só passa se o catch for executado” está incorreto; ele também passa quando não há exceção.

**Melhoria sugerida:** usar uma asserção que exija explicitamente a exceção:

```js
expect(() => userService.createUser('Menor', 'menor@email.com', 17))
  .toThrow('O usuário deve ser maior de idade.');
```

### 5. Teste ignorado e vazio (Ignored Test / Empty Test)

**Local:** `test/userService.smelly.test.js`, linhas 77–79.

O cenário sem usuários usa `test.skip` e contém apenas um TODO. Portanto, não valida comportamento algum, embora apareça na suíte. Seu título também menciona uma lista vazia, enquanto `generateUserReport` retorna texto, incluindo “Nenhum usuário cadastrado.” quando não há usuários.

**Melhoria sugerida:** implementar o cenário conforme o contrato pretendido, ajustar o título e remover o `.skip`.

## Observação sobre Convidado Misterioso

Não foi identificado um caso claro de **Mystery Guest**: os dados estão declarados no próprio arquivo e o banco é em memória. O uso de `_clearDB()` no setup cria acoplamento a um método interno, mas não basta, por si só, para caracterizar uma dependência externa oculta.

Esta etapa registra a análise manual; os testes originais foram preservados.

## Etapa 4 — Detecção automática e comparação

Foi executado `npx eslint .` na raiz do projeto, usando a configuração da Etapa 3. A análise encontrou **6 problemas: 4 erros e 2 avisos**, todos em `test/userService.smelly.test.js`. Nenhum diagnóstico foi reportado nos demais arquivos analisados.

| Local (linha:coluna) | Severidade | Regra | Resultado e relação com a análise manual |
| --- | --- | --- | --- |
| 44:9, 46:9 e 49:9 | Erro (3 ocorrências) | `jest/no-conditional-expect` | Confirma as expectativas condicionais nos ramos do `if/else` do teste de desativação. |
| 73:7 | Erro (1 ocorrência) | `jest/no-conditional-expect` | Confirma que o `expect` no `catch` depende de uma exceção. Corresponde ao risco de falso positivo identificado manualmente no teste de menor de idade. |
| 77:3 | Aviso | `jest/no-disabled-tests` | Confirma que o cenário sem usuários está desativado com `test.skip`. |
| 77:3 | Aviso | `jest/expect-expect` | Confirma que esse mesmo teste não contém asserções. Essa regra vem de `plugin:jest/recommended`. |

### O que a ferramenta confirmou

A detecção automática coincide com a análise manual sobre lógica condicional, tratamento inadequado de exceção e teste ignorado/vazio. Os seis diagnósticos não representam seis tipos diferentes de smells: há repetições da mesma regra e dois avisos para um único teste.

No teste de menor de idade, a ferramenta identifica a execução condicional da asserção. A leitura manual explica a consequência: se a validação for removida e nenhuma exceção for lançada, o teste poderá continuar passando sem executar o `expect`.

### O que depende da análise manual

- **Responsabilidades múltiplas:** a configuração atual não reportou que o primeiro teste reúne criação e busca. Identificar esse problema exige avaliar o objetivo do teste e os comportamentos envolvidos.
- **Fragilidade do relatório:** não houve diagnóstico sobre a comparação com texto formatado. É necessário conhecer o contrato do relatório para decidir se espaços, pontuação e cabeçalho são requisitos ou detalhes sujeitos a mudança.
- **Lógica do cenário de desativação:** a regra sinalizou os `expect` condicionais; não emitiu um diagnóstico separado para o `for` nem verificou se os dois cenários deveriam ser separados.
- **Título incompatível com o retorno:** a ferramenta não apontou que o teste vazio menciona uma lista, enquanto o método de relatório retorna texto.

A regra `jest/no-identical-title` está configurada, mas não encontrou títulos duplicados. A ausência de diagnósticos para outros smells não significa que eles não existam: a análise está limitada às regras habilitadas e aos padrões que elas reconhecem.

Os resultados mostram por que a suíte pode passar no Jest e ainda apresentar problemas de qualidade no ESLint. Nesta etapa, foram registrados os diagnósticos e sua comparação; os testes originais continuam preservados para uma futura refatoração.
