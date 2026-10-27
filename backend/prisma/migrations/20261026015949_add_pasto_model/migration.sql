-- DropIndex
DROP INDEX "Fazenda_usuarioId_key";

-- AlterTable
ALTER TABLE "Fazenda" ADD COLUMN     "areaUnit" TEXT NOT NULL DEFAULT 'ha',
ADD COLUMN     "areaValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "cattleCapacity" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Lote" ADD COLUMN     "consumerCompany" TEXT,
ADD COLUMN     "consumerId" TEXT,
ADD COLUMN     "consumerName" TEXT,
ADD COLUMN     "consumerPhone" TEXT,
ADD COLUMN     "pastoId" TEXT,
ADD COLUMN     "recusasCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "valorTotal" DOUBLE PRECISION DEFAULT 0,
ALTER COLUMN "videoOriginalUrl" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'RASCUNHO';

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "telefone" TEXT NOT NULL DEFAULT '(16) 99876-5432';

-- CreateTable
CREATE TABLE "Chamado" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT 'Sem assunto',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Em análise',
    "fazendaNome" TEXT DEFAULT 'Não especificada',
    "usuarioId" TEXT,
    "consumidorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chamado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pasto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "geojson" TEXT,
    "fazendaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consumidor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consumidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaRadar" (
    "id" TEXT NOT NULL,
    "regiao" TEXT,
    "quantidadeDesejada" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumidorId" TEXT NOT NULL,

    CONSTRAINT "AlertaRadar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Consumidor_email_key" ON "Consumidor"("email");

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_consumidorId_fkey" FOREIGN KEY ("consumidorId") REFERENCES "Consumidor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasto" ADD CONSTRAINT "Pasto_fazendaId_fkey" FOREIGN KEY ("fazendaId") REFERENCES "Fazenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_pastoId_fkey" FOREIGN KEY ("pastoId") REFERENCES "Pasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaRadar" ADD CONSTRAINT "AlertaRadar_consumidorId_fkey" FOREIGN KEY ("consumidorId") REFERENCES "Consumidor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
