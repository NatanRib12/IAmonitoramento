// src/ai/orchestrator.ts
import OpenAI from 'openai';
import { construirSystemPrompt } from '../ai/SystemPrompt';
import { chatTools } from '../ai/Tools';
import { executarTool } from '../ai/ToolHandlers'

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

export async function processarChatCopilot(payload: ChatPayload): Promise<string> {
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

  // Primeira chamada: a IA avalia a intenção, faz perguntas de slot-filling ou chama tools
  const primeiraResposta = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools: chatTools,
    tool_choice: 'auto',
    temperature: 0.3
  });

  const responseMessage = primeiraResposta.choices[0].message;

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.type === 'function') {
        const nomeFuncao = toolCall.function.name;
        const argumentos = JSON.parse(toolCall.function.arguments);

        // Executa a busca no banco de dados com os contextos de ID
        const resultadoBanco = await executarTool(nomeFuncao, argumentos, payload.contexto);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(resultadoBanco)
        });
      }
    }

    // Segunda chamada: formata o resultado no modelo consultivo (Resumo + Opções + Next Step)
    const segundaResposta = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3
    });

    return segundaResposta.choices[0].message.content || 'Não foi possível formatar os dados da consulta.';
  }

  return responseMessage.content || 'Sem resposta gerada.';
}