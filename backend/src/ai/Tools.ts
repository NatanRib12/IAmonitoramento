// src/ai/tools.ts
import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const chatTools: ChatCompletionTool[] = [
  // --- TOOLS DO PRODUTOR ---
  {
    type: 'function',
    function: {
      name: 'obterResumoVendasEFluxo',
      description: 'Busca o histórico de vendas, faturamento, total de cabeças vendidas e métricas de comercialização da fazenda.',
      parameters: {
        type: 'object',
        properties: {
          ano: { type: 'number', description: 'Ano de referência (padrão: 2026).' },
          mes: { type: 'number', description: 'Número do mês (1 a 12).' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'obterStatusFazendaEPastos',
      description: 'Retorna a capacidade da fazenda, área, quantidade de pastos e animais atualmente no pasto.',
      parameters: { type: 'object', properties: {} }
    }
  },

  // --- TOOLS DO CONSUMIDOR / COMPRADOR ---
  {
    type: 'function',
    function: {
      name: 'obterLotesDisponiveisMercado',
      description: 'Busca os lotes de gado disponíveis para compra na vitrine do mercado B2B.',
      parameters: {
        type: 'object',
        properties: {
          regiao: { type: 'string', description: 'Nome da cidade, estado ou localização para filtrar.' },
          quantidadeMinima: { type: 'number', description: 'Quantidade mínima de cabeças desejada.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'obterAlertasConsumidor',
      description: 'Busca os alertas ativos no Radar de Compras do comprador logado.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'obterHistoricoComprasConsumidor',
      description: 'Busca o histórico de lotes já comprados ou reservados pelo comprador/frigorífico.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'obterAnaliseFazendaFornecedora',
      description: 'Busca a reputação, capacidade e histórico de vendas de uma fazenda fornecedora específica.',
      parameters: {
        type: 'object',
        properties: {
          nomeFazenda: { type: 'string', description: 'Nome da fazenda fornecedora a ser analisada.' }
        }
      }
    }
  }
];