// src/ai/toolHandlers.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Funções auxiliares de formatação para evitar bugs de tabela na LLM
function formatarData(data: Date): string {
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(data: Date): string {
  const d = new Date(data);
  const horas = String(d.getHours()).padStart(2, '0');
  const minutos = String(d.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export async function executarTool(nomeFuncao: string, args: any, contexto: any) {
  const userIdOuFazendaId = contexto.fazendaId || contexto.entityId;
  const consumidorId = contexto.consumidorId || contexto.entityId;
  const entidadeAtiva = contexto.entidadeAtiva;

  switch (nomeFuncao) {
    // =========================================================================
    // 1. PRODUTOR: Resumo de Vendas e Fluxo
    // =========================================================================
    case 'obterResumoVendasEFluxo': {
      const anoConsulta = Number(args.ano) || 2026;
      const mesConsulta = args.mes ? Number(args.mes) : null;

      let fazendaAtiva = null;
      if (userIdOuFazendaId) {
        fazendaAtiva = await prisma.fazenda.findFirst({
          where: { OR: [{ id: userIdOuFazendaId }, { usuarioId: userIdOuFazendaId }] }
        });
      }
      if (!fazendaAtiva) fazendaAtiva = await prisma.fazenda.findFirst();
      if (!fazendaAtiva) return { mensagem: 'Nenhum registro de fazenda encontrado.' };

      const todosLotes = await prisma.lote.findMany({
        where: { fazendaId: fazendaAtiva.id },
        select: {
          id: true,
          quantidadeCabecas: true,
          valorTotal: true,
          status: true,
          consumerPhone: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      const lotesProcessados = todosLotes.map((l) => {
        let propQtd = 0;
        let propVal = 0;

        if (l.consumerPhone && typeof l.consumerPhone === 'string' && l.consumerPhone.startsWith('{')) {
          try {
            const parsed = JSON.parse(l.consumerPhone);
            propQtd = Number(parsed.propostaQtd || 0);
            propVal = Number(parsed.propostaValor || 0);
          } catch (e) {}
        }

        const quantOriginal = Number(l.quantidadeCabecas || 0);
        const quantVendida = propQtd > 0 ? propQtd : (l.status === 'VENDIDO' ? quantOriginal : 0);
        const valOriginal = Number(l.valorTotal || 0);
        const valVendido = propVal > 0 ? propVal : (l.status === 'VENDIDO' ? valOriginal : 0);
        const dataRef = new Date(l.updatedAt || l.createdAt);

        return {
          id: l.id,
          status: l.status,
          quantidadeVendida: quantVendida,
          valorVendido: valVendido,
          valorVendidoFormatado: formatarMoeda(valVendido),
          data: formatarData(dataRef),
          hora: formatarHora(dataRef),
          dataObj: dataRef
        };
      });

      const lotesFiltrados = lotesProcessados.filter((l) => {
        if (l.quantidadeVendida <= 0 && l.status !== 'VENDIDO') return false;
        if (l.dataObj.getFullYear() !== anoConsulta) return false;
        if (mesConsulta !== null && mesConsulta >= 1 && mesConsulta <= 12) {
          if (l.dataObj.getMonth() !== (mesConsulta - 1)) return false;
        }
        return true;
      });

      const totalCabecasVendidas = lotesFiltrados.reduce((acc, l) => acc + l.quantidadeVendida, 0);
      const faturamentoTotal = lotesFiltrados.reduce((acc, l) => acc + l.valorVendido, 0);

      return {
        nomeFazenda: fazendaAtiva.nome,
        ano: anoConsulta,
        mes: mesConsulta ? MESES_NOMES[mesConsulta - 1] : 'Todos os meses',
        totalLotesVendidos: lotesFiltrados.length,
        totalCabecasVendidas,
        faturamentoTotal: formatarMoeda(faturamentoTotal),
        precoMedioPorCabeca: totalCabecasVendidas > 0 ? formatarMoeda(faturamentoTotal / totalCabecasVendidas) : 'R$ 0,00',
        vendasDetalhes: lotesFiltrados.map((l) => ({
          dataVenda: `${l.data} ${l.hora}`,
          quantidadeVendida: `${l.quantidadeVendida} cabeças`,
          valorVendido: l.valorVendidoFormatado
        }))
      };
    }

    // =========================================================================
    // 2. CONSUMIDOR: Vitrine de Lotes Disponíveis no Mercado
    // =========================================================================
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
          createdAt: true,
          fazenda: { select: { nome: true, localizacao: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        totalEncontrado: lotes.length,
        lotes: lotes.map((l) => ({
          loteId: l.id,
          fazenda: l.fazenda.nome,
          localizacao: l.fazenda.localizacao,
          quantidadeCabecas: `${l.quantidadeCabecas} cabeças`,
          valorTotal: formatarMoeda(l.valorTotal || 0),
          precoPorCabeca: formatarMoeda((l.valorTotal || 0) / (l.quantidadeCabecas || 1)),
          dataAnuncio: formatarData(l.createdAt)
        }))
      };
    }

    // =========================================================================
    // 3. CONSUMIDOR: Radar de Alertas
    // =========================================================================
    case 'obterAlertasConsumidor': {
      let consumidor = null;
      if (consumidorId) {
        consumidor = await prisma.consumidor.findUnique({
          where: { id: consumidorId },
          include: { alertas: true }
        });
      }

      if (!consumidor) {
        consumidor = await prisma.consumidor.findFirst({
          include: { alertas: true }
        });
      }

      if (!consumidor) {
        return { mensagem: 'Nenhum perfil de comprador/consumidor foi localizado.' };
      }

      return {
        comprador: consumidor.nome,
        empresa: consumidor.empresa,
        totalAlertas: consumidor.alertas.length,
        alertas: consumidor.alertas.map((a) => ({
          regiao: a.regiao || 'Todas as regiões',
          quantidadeDesejada: `${a.quantidadeDesejada} cabeças`,
          dataCriacao: formatarData(a.createdAt)
        }))
      };
    }

    // =========================================================================
    // 4. CONSUMIDOR: Histórico de Compras Efetuadas
    // =========================================================================
    case 'obterHistoricoComprasConsumidor': {
      let consumidor = null;
      if (consumidorId) {
        consumidor = await prisma.consumidor.findUnique({ where: { id: consumidorId } });
      }
      if (!consumidor) {
        consumidor = await prisma.consumidor.findFirst();
      }

      const compras = await prisma.lote.findMany({
        where: {
          OR: [
            { consumerId: consumidor?.id },
            { consumerName: consumidor?.nome },
            { status: 'VENDIDO' }
          ]
        },
        take: 10,
        select: {
          id: true,
          quantidadeCabecas: true,
          valorTotal: true,
          updatedAt: true,
          fazenda: { select: { nome: true, localizacao: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const totalInvestido = compras.reduce((acc, c) => acc + (c.valorTotal || 0), 0);
      const totalCabecasCompradas = compras.reduce((acc, c) => acc + c.quantidadeCabecas, 0);

      return {
        comprador: consumidor?.nome || 'Comprador',
        empresa: consumidor?.empresa || 'Frigorífico',
        totalLotesAdquiridos: compras.length,
        totalCabecasCompradas,
        totalInvestido: formatarMoeda(totalInvestido),
        compras: compras.map((c) => ({
          fazendaVendedora: c.fazenda.nome,
          localizacao: c.fazenda.localizacao,
          quantidade: `${c.quantidadeCabecas} cabeças`,
          valorTotal: formatarMoeda(c.valorTotal || 0),
          dataCompra: formatarData(c.updatedAt)
        }))
      };
    }

    // =========================================================================
    // 5. CONSUMIDOR: Análise da Fazenda Fornecedora
    // =========================================================================
    case 'obterAnaliseFazendaFornecedora': {
      const { nomeFazenda } = args;

      const fazenda = await prisma.fazenda.findFirst({
        where: nomeFazenda ? { nome: { contains: String(nomeFazenda), mode: 'insensitive' } } : {},
        include: {
          lotes: { select: { status: true, quantidadeCabecas: true, valorTotal: true } }
        }
      });

      if (!fazenda) {
        return { mensagem: `Fazenda "${nomeFazenda || ''}" não foi encontrada no cadastro.` };
      }

      const totalLotesVendidos = fazenda.lotes.filter((l) => l.status === 'VENDIDO').length;
      const totalCabecasVendidas = fazenda.lotes
        .filter((l) => l.status === 'VENDIDO')
        .reduce((acc, l) => acc + l.quantidadeCabecas, 0);

      return {
        nomeFazenda: fazenda.nome,
        localizacao: fazenda.localizacao,
        capacidadeTotal: `${fazenda.cattleCapacity} cabeças`,
        area: `${fazenda.areaValue} ${fazenda.areaUnit}`,
        historicoComercial: {
          totalLotesEntregues: totalLotesVendidos,
          totalCabecasComercializadas: totalCabecasVendidas,
          statusConfiabilidade: totalLotesVendidos > 0 ? 'Alta Confiabilidade (Fornecedor Ativo)' : 'Fornecedor Novo'
        }
      };
    }

    case 'obterStatusFazendaEPastos': {
      let fazendaAtiva = null;
      if (userIdOuFazendaId) {
        fazendaAtiva = await prisma.fazenda.findFirst({
          where: { OR: [{ id: userIdOuFazendaId }, { usuarioId: userIdOuFazendaId }] }
        });
      }
      if (!fazendaAtiva) fazendaAtiva = await prisma.fazenda.findFirst();
      if (!fazendaAtiva) return { mensagem: 'Nenhum registro de fazenda encontrado.' };

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
        capacidadeTotal: `${fazendaCompleta?.cattleCapacity} cabeças`,
        totalPastos: fazendaCompleta?.pastos.length,
        cabecasNoPastoAtualmente: `${cabecasNoPasto} cabeças`
      };
    }

    default:
      throw new Error(`Tool ${nomeFuncao} não foi mapeada.`);
  }
}