# uso-claude

> Mod não oficial, feito por um usuário. Não tem vínculo com a Anthropic nem é mantido por ela.

Mod para o Claude Code que mostra, numa faixa acima da caixa de texto, quanto você já usou do Claude:

- **Relógio** — limite de 5 horas (barra cinza)
- **Calendário** — limite semanal de 7 dias (barra laranja, com marcação a partir de 90%)
- **Linhas** — quanto da conversa atual já ocupa o contexto

Os números vêm do próprio Claude Code e se atualizam a cada resposta. No app de desktop aparecem como barras; no terminal, como texto.

## Instalar

No prompt de uma sessão do Claude Code no terminal:

```
/plugin install uso-claude --marketplace brunosmelo2012/uso-claude
```

Responda `y` para adicionar o marketplace e escolha o escopo de usuário. Ou, direto no terminal:

```
claude plugin install uso-claude --marketplace brunosmelo2012/uso-claude
```
