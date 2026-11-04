import OpenAI from 'openai';
import { construirSystemPrompt } from '../ai/SystemPrompt';
import { chatTools } from '../ai/Tools';
import { executarTool } from '../ai/ToolHandlers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY 
});

interface ChatPayload {
  mensagem: string;
  contexto: {
    perfil: 'PRODUTOR' | 'CONSUMIDOR';
    telaAtual: string;
    entityId?: string;
    entidadeAtiva?: { nome?: string; id?: string; tipo?: string };
    fazendaId?: string;
    consumidorId?: string;
  };
  historicoMensagens?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export interface ChatResponsePayload {
  resposta: string;
  acao?: {
    tipo: 'FILTRAR_MAPA' | 'ROTA_MAIS_PROXIMA' | 'SELECIONAR_FAZENDA';
    parametros?: {
      distanciaKm?: number | null;
      cidade?: string | null;
      nomeFazenda?: string | null;
    };
  };
}

export async function processarChatCopilot(payload: ChatPayload): Promise<ChatResponsePayload> {
  const systemPrompt = construirSystemPrompt(
    payload.contexto.perfil,
    payload.contexto.telaAtual,
    payload.contexto.entidadeAtiva
  );

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(payload.historicoMensagens || []),
    { role: 'user', content: payload.mensagem }
  ];

  let acaoCapturada: any = null;

  // 1. Primeira chamada à OpenAI
  const primeiraResposta = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools: chatTools,
    tool_choice: 'auto',
    temperature: 0.1 // Temperatura reduzida para aumentar a precisão na escolha de ferramentas
  });

  const responseMessage = primeiraResposta.choices[0].message;

  // 2. Verifica se a IA decidiu chamar alguma função
  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.type === 'function') {
        const nomeFuncao = toolCall.function.name;
        const argumentos = JSON.parse(toolCall.function.arguments);

        console.log(`\x1b[33m[COPILOT TOOL CALL]: ${nomeFuncao}\x1b[0m`, argumentos);

        const resultadoBanco = await executarTool(nomeFuncao, argumentos, payload.contexto);

        if (nomeFuncao === 'filtrarMapaFazendas' || resultadoBanco?.acaoExecutada === 'FILTRAR_MAPA') {
          acaoCapturada = {
            tipo: 'FILTRAR_MAPA',
            parametros: resultadoBanco.parametros || argumentos
          };
        } else if (nomeFuncao === 'tracarRotaFazendaMaisProxima' || resultadoBanco?.acaoExecutada === 'ROTA_MAIS_PROXIMA') {
          acaoCapturada = {
            tipo: 'ROTA_MAIS_PROXIMA'
          };
        } else if (nomeFuncao === 'selecionarFazendaNoMapa' || resultadoBanco?.acaoExecutada === 'SELECIONAR_FAZENDA') {
          acaoCapturada = {
            tipo: 'SELECIONAR_FAZENDA',
            parametros: { nomeFazenda: argumentos.nomeFazenda }
          };
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(resultadoBanco)
        });
      }
    }

    // 3. Segunda chamada para formatar a resposta textual ao usuário
    const segundaResposta = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3
    });

    const textoFinal = segundaResposta.choices[0].message.content || 'Ação executada com sucesso no mapa!';

    return {
      resposta: textoFinal,
      ...(acaoCapturada && { acao: acaoCapturada })
    };
  }

  return { resposta: responseMessage.content || 'Sem resposta gerada.' };
}