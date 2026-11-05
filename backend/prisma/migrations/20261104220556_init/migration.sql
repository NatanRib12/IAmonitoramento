-- AlterTable
ALTER TABLE "Consumidor" ADD COLUMN     "localizacao" TEXT NOT NULL DEFAULT 'Não informada';

-- AlterTable
ALTER TABLE "Fazenda" ADD COLUMN     "geojson" TEXT;
