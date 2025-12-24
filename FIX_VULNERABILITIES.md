# Guia para Corrigir Vulnerabilidades e Testar Build

## Passo 1: Verificar Vulnerabilidades

Execute o comando para ver detalhes das vulnerabilidades:

```bash
npm audit
```

## Passo 2: Corrigir Vulnerabilidades Automaticamente

Execute o comando para corrigir automaticamente as vulnerabilidades que podem ser corrigidas:

```bash
npm audit fix
```

## Passo 3: Verificar Vulnerabilidades Restantes

Após a correção automática, verifique se ainda há vulnerabilidades:

```bash
npm audit
```

## Passo 4: Corrigir Vulnerabilidades que Requerem Atenção Manual

Se ainda houver vulnerabilidades após `npm audit fix`, você pode tentar:

```bash
npm audit fix --force
```

**⚠️ ATENÇÃO:** O `--force` pode atualizar dependências para versões que podem quebrar compatibilidade. Use com cuidado.

## Passo 5: Testar o Build

Execute o build para garantir que tudo funciona:

```bash
npm run build
```

## Passo 6: Verificar o Resultado

Se o build for bem-sucedido, você verá uma pasta `dist` com os arquivos compilados.

## Alternativa: Executar o Script Automatizado

Você também pode executar o script que faz tudo automaticamente:

```bash
chmod +x fix-vulnerabilities-and-build.sh
./fix-vulnerabilities-and-build.sh
```

## Notas Importantes

- Se `npm audit fix` não resolver todas as vulnerabilidades, algumas podem requerer atualização manual de dependências
- Sempre teste o build após corrigir vulnerabilidades
- O Vercel usará `npm run build` para fazer o deploy, então é essencial que funcione localmente

