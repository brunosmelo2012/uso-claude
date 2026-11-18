import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit } from 'claude-code'

import type { Uso } from '../types'

const uso = atom({ plugin: 'uso-claude', key: 'uso' } as const, null)

const CINZA = '#8f8e89'
const LARANJA = '#D97757'
const TRILHO = '#000000'
const TEXTO = '#b8b7b2'

function montar(limites: SessionRateLimit[], contexto: SessionContextUsage): Uso {
  return {
    limites: limites.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })),
    contexto: contexto.percent,
  }
}

// ---------- ícones ----------
const tracos = `fill="none" stroke="${TEXTO}" stroke-width="1.6" stroke-linecap="round"`

function relogio(x: number, y: number, s: number): string {
  const r = s / 2 - 1
  const cx = x + s / 2
  const cy = y + s / 2
  return `<g ${tracos}><circle cx="${cx}" cy="${cy}" r="${r}"/><path d="M${cx} ${cy - r * 0.55}V${cy}l${r * 0.4} ${r * 0.3}"/></g>`
}

function calendario(x: number, y: number, s: number): string {
  return `<g ${tracos}><rect x="${x + 1}" y="${y + 2}" width="${s - 2}" height="${s - 3}" rx="2.5"/><path d="M${x + 1} ${y + s * 0.4}H${x + s - 1}M${x + s * 0.32} ${y}v${s * 0.22}M${x + s * 0.68} ${y}v${s * 0.22}"/></g>`
}

function linhas(x: number, y: number, s: number): string {
  return `<g ${tracos}><path d="M${x + 2} ${y + 3}h${s - 4}M${x + 2} ${y + s / 2}h${s - 4}M${x + 2} ${y + s - 3}h${(s - 4) * 0.6}"/></g>`
}

// ---------- barra ----------
function barra(x: number, y: number, w: number, h: number, pct: number, cor: string, esfarela: boolean): string {
  const p = Math.max(0, Math.min(100, pct))
  const fw = Math.max(h, (w * p) / 100)
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${TRILHO}"/>`

  if (!esfarela) {
    s += `<rect x="${x}" y="${y}" width="${fw}" height="${h}" rx="${h / 2}" fill="${cor}"/>`
    if (p >= 90) s += `<rect x="${x + fw - 1}" y="${y - 2}" width="2" height="${h + 4}" fill="${cor}"/>`
    return s
  }

  // parte sólida + pixels se desfazendo na ponta
  const solido = fw * 0.78
  s += `<rect x="${x}" y="${y}" width="${solido}" height="${h}" rx="${h / 2}" fill="${cor}"/>`
  const px = Math.max(2, h / 4)
  let semente = 7
  const sorteio = () => {
    semente = (semente * 9301 + 49297) % 233280
    return semente / 233280
  }
  const ini = x + solido - h / 2
  const fim = Math.min(x + w, x + fw + h * 1.5)
  const span = fw - solido + h * 2
  for (let cx = ini; cx < fim; cx += px) {
    const t = (cx - ini) / span
    for (let cy = y; cy < y + h - 0.1; cy += px) {
      if (sorteio() > t * 1.05) {
        s += `<rect x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" width="${px}" height="${px}" fill="${cor}" opacity="${(1 - t * 0.6).toFixed(2)}"/>`
      }
    }
  }
  return s
}

function texto(x: number, y: number, t: string): string {
  return `<text x="${x}" y="${y}" fill="${TEXTO}" font-family="ui-monospace,Consolas,monospace" font-size="11">${t}</text>`
}

type Item = { icone: 'relogio' | 'calendario' | 'linhas'; pct: number; cor: string; esfarela: boolean; largura: number; nome: string }

function desenhar(itens: Item[]): { svg: string; largura: number } {
  let x = 0
  let corpo = ''
  for (const i of itens) {
    corpo += i.icone === 'relogio' ? relogio(x, 2, 14) : i.icone === 'calendario' ? calendario(x, 2, 14) : linhas(x, 2, 14)
    corpo += barra(x + 20, 4, i.largura, 10, i.pct, i.cor, i.esfarela)
    corpo += texto(x + 26 + i.largura, 13, `${Math.round(i.pct)}%`)
    x += 26 + i.largura + 44
  }
  const largura = Math.max(1, x - 14)
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="18" viewBox="0 0 ${largura} 18">${corpo}</svg>`,
    largura,
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    const u = await $.session.usage()
    await update($, uso, () => montar(u.rateLimits, u.context))
    return r
  })

  on('session.measure', async ($, e, next) => {
    await update($, uso, () => montar(e.rateLimits, e.context))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const u = await read($, uso)
    if (e.props.hasSurvey || u === null || (u.limites.length === 0 && u.contexto === undefined)) {
      return next(e)
    }

    const itens: Item[] = []
    for (const l of u.limites) {
      if (l.kind === 'five_hour') itens.push({ icone: 'relogio', pct: l.percentUsed, cor: CINZA, esfarela: true, largura: 120, nome: '5h' })
      else if (l.kind === 'seven_day') itens.push({ icone: 'calendario', pct: l.percentUsed, cor: LARANJA, esfarela: false, largura: 120, nome: '7 dias' })
    }
    if (u.contexto !== undefined) itens.push({ icone: 'linhas', pct: u.contexto, cor: CINZA, esfarela: false, largura: 90, nome: 'contexto' })

    const alt = itens.map(i => `${i.nome} ${Math.round(i.pct)}%`).join(', ')
    const { Box, Text, Svg } = $.ui.resolve(e)

    // terminal não desenha SVG: versão em texto
    if (e.surface === 'terminal') {
      return (
        <Box flexDirection="row" justifyContent="center">
          <Text dimColor>{alt}</Text>
        </Box>
      )
    }

    const { svg, largura } = desenhar(itens)
    return (
      <Box flexDirection="row" justifyContent="center">
        <Svg source={svg} alt={`Uso: ${alt}`} width={largura} height={18} />
      </Box>
    )
  })
}
