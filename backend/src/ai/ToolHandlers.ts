// src/ai/toolHandlers.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function executarTool(nomeFuncao: string, args: any, contexto: any) {
  const userIdOuFazendaId = contexto.fazendaId || contexto.entityId;
  const consumidorId = contexto.consumidorId || contexto.entityId;

  switch (nomeFuncao) {
    case 'obterResumoVendasEFluxo': {
      const { ano } = args;

      // Localiza a fazenda vinculada ao usuário logado ou pega a primeira cadastrada
      let fazendaAtiva = null;
      if (userIdOuFazendaId) {
        fazendaAtiva = await prisma.fazenda.findFirst({
          where: {
            OR: [{ id: userIdOuFazendaId }, { usuarioId: userIdOuFazendaId }]
          }
        });
      }

      if (!fazendaAtiva) {
        fazendaAtiva = await prisma.fazenda.findFirst();
      }

      if (!fazendaAtiva) {
        return { mensagem: 'Nenhum registro de fazenda ou vendas encontrado no banco de dados.' };
      }

      const lotesVendidos = await prisma.lote.findMany({
        where: {
          fazendaId: fazendaAtiva.id,
          status: 'VENDIDO',
          ...(ano && {
            updatedAt: {
              gte: new Date(`${ano}-01-01T00:00:00.000Z`),
              lte: new Date(`${ano}-12-31T23:59:59.999Z`)
            }
          })
        },
        select: {
          id: true,
          quantidadeCabecas: true,
          valorTotal: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      const totalCabecasVendidas = lotesVendidos.reduce((acc, l) => acc + l.quantidadeCabecas, 0);
      const faturamentoTotal = lotesVendidos.reduce((acc, l) => acc + (l.valorTotal || 0), 0);

      return {
        nomeFazenda: fazendaAtiva.nome,
        totalLotesVendidos: lotesVendidos.length,
        totalCabecasVendidas,
        faturamentoTotal,
        precoMedioPorCabeca: totalCabecasVendidas > 0 ? (faturamentoTotal / totalCabecasVendidas) : 0,
        lotes: lotesVendidos
      };
    }

    case 'obterStatusFazendaEPastos': {
      let fazendaAtiva = null;
      if (userIdOuFazendaId) {
        fazendaAtiva = await prisma.fazenda.findFirst({
          where: {
            OR: [{ id: userIdOuFazendaId }, { usuarioId: userIdOuFazendaId }]
          }
        });
      }

      if (!fazendaAtiva) {
        fazendaAtiva = await prisma.fazenda.findFirst();
      }

      if (!fazendaAtiva) {
        return { mensagem: 'Nenhum registro de fazenda encontrado no banco de dados.' };
      }

      const fazendaCompleta = await prisma.fazenda.findUnique({
        where: { id: fazendaAtiva.id },
        include: {
          pastos: { select: { id: true, nome: true } },
          lotes: { select: { id: true, quantidadeCabecas: true, status: true } }
        }
      });

      const cabecasNoPasto = fazendaCompleta?.lotes
        .filter((l) => l.status !== 'VENDIDO')
        .reduce((acc, l) => acc + l.quantidadeCabecas, 0) || 0;

      return {
        nome: fazendaCompleta?.nome,
        capacidadeTotal: fazendaCompleta?.cattleCapacity,
        totalPastos: fazendaCompleta?.pastos.length,
        cabecasNoPastoAtualmente: cabecasNoPasto
      };
    }

    case 'obterLotesDisponiveisMercado': {
      const { regiao, quantidadeMinima } = args;

      const lotes = await prisma.lote.findMany({
        where: {
          status: 'DISPONIVEL',
          ...(quantidadeMinima && { quantidadeCabecas: { gte: Number(quantidadeMinima) } }),
          ...(regiao && {
            fazenda: {
              localizacao: { contains: String(regiao), mode: 'insensitive' }
            }
          })
        },
        take: 10,
        select: {
          id: true,
          quantidadeCabecas: true,
          valorTotal: true,
          fazenda: { select: { nome: true, localizacao: true } }
        }
      });

      return { totalEncontrado: lotes.length, lotes };
    }

    case 'obterAlertasConsumidor': {
      const consumidor = await prisma.consumidor.findFirst({
        where: consumidorId ? { id: consumidorId } : {}
      });

      if (!consumidor) {
        return { alertas: [] };
      }

      const alertas = await prisma.alertaRadar.findMany({
        where: { consumidorId: consumidor.id }
      });

      return { totalAlertas: alertas.length, alertas };
    }

    default:
      throw new Error(`Tool ${nomeFuncao} não mapeada.`);
  }
}