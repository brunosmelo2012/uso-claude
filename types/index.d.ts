export type Janela = { kind: string; percentUsed: number; resetsAt?: string }

export type Uso = {
  limites: Janela[]
  contexto?: number
}

declare module 'claude-code' {
  interface PluginState {
    'uso-claude': { uso: Uso | null }
  }
}
