
## Plano: Adicionar botão de "Testar com 10 registos" na aba Processos

### 1. Novo Estado
Vamos adicionar um estado `importLimit` no componente `TabProcessos` para memorizar o limite selecionado caso o utilizador seja interrompido pelo modal de duplicados.
`const [importLimit, setImportLimit] = useState<number | null>(null);`

### 2. Atualizar Lógica de Importação
Modificaremos as funções principais que lidam com a importação para apenas terem em conta as primeiras 10 linhas caso o teste seja selecionado:
- **`doImport`**: Passará a receber um argumento `limit`. Faremos `const rowsToImport = limit ? parsed.slice(0, limit) : parsed;` e usaremos `rowsToImport` em todo o ciclo de importação, progresso e no toast de sucesso.
- **`handleImport`**: Passará a receber um argumento `limit` opcional. Guardará este limite no estado `importLimit` e fará a verificação de duplicados **apenas** para as linhas limitadas.
- **`handleDupDecision`**: Será atualizado para passar o `importLimit` memorizado para a chamada final a `doImport`.

### 3. Interface de Botões
Na área de botões onde atualmente está o botão para importar todos os processos, substituiremos por um layout lado a lado com os 2 botões:
- **Testar com 10 registos**: Usará `variant="outline"` e fará `onClick={() => handleImport(10)}`. Este botão só aparecerá se houverem processos para importar, importando os primeiros 10 registos (20 linhas no CRM).
- **Importar [X] processos**: O botão existente que fará `onClick={() => handleImport()}`.

Esta abordagem reaproveita a mesma infraestrutura que já lida com barras de progresso e notificações para os totais corretos e com o limite certo de forma muito natural.
