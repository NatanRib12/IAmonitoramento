// src/ai/orchestrator.ts
import OpenAI from 'openai';
import { construirSystemPrompt } from '../ai/SystemPrompt';
import { chatTools } from './tools';
import { executarTool } from '../ai/ToolHandlers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'MOCK_KEY_AGUARDANDO_CHAVE'
});

interface ChatPayload {
  mensagem: string;
  contexto: {
    perfil: 'PRODUTOR' | 'CONSUMIDOR';
    telaAtual: string;
    fazendaId?: string;
    consumidorId?: string;
  };
  historicoMensagens?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export async function processarChatCopilot(payload: ChatPayload): Promise<string> {
  const systemPrompt = construirSystemPrompt(payload.contexto.perfil, payload.contexto.telaAtual);

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(payload.historicoMensagens || []),
    { role: 'user', content: payload.mensagem }
  ];

  const primeiraResposta = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools: chatTools,
    tool_choice: 'auto',
    temperature: 0.2
  });

  const responseMessage = primeiraResposta.choices[0].message;

  if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
    messages.push(responseMessage);

    for (const toolCall of responseMessage.tool_calls) {
      if (toolCall.type === 'function') {
        const nomeFuncao = toolCall.function.name;
        const argumentos = JSON.parse(toolCall.function.arguments);

        // O backend passa o contexto (IDs da sessão) diretamente para a Tool
        const resultadoBanco = await executarTool(nomeFuncao, argumentos, payload.contexto);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(resultadoBanco)
        });
      }
    }

    const segundaResposta = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2
    });

    return segundaResposta.choices[0].message.content || 'Não foi possível formatar os dados.';
  }

  return responseMessage.content || 'Sem resposta gerada.';
}