// src/ai/tools.ts
import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const chatTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'obterResumoVendasEFluxo',
      description: 'Busca o histórico de vendas, faturamento, total de cabeças vendidas e métricas de comercialização.',
      parameters: {
        type: 'object',
        properties: {
          ano: { type: 'number', description: 'Ano de referência desejado (ex: 2026).' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'obterStatusFazendaEPastos',
      description: 'Retorna dados sobre a capacidade da fazenda, área, pastos e animais atualmente no pasto.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'obterLotesDisponiveisMercado',
      description: 'Busca os lotes de gado disponíveis para compra na vitrine do mercado.',
      parameters: {
        type: 'object',
        properties: {
          regiao: { type: 'string', description: 'Nome da cidade ou estado para filtrar.' },
          quantidadeMinima: { type: 'number', description: 'Quantidade mínima de cabeças.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'obterAlertasConsumidor',
      description: 'Busca os alertas configurados no Radar de Compras do comprador.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];