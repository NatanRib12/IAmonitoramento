#  Relatório Técnico

---

# 1. Como a Solução Foi Projetada e Por quê

1. **Re-treinamento e Padronização do Dataset na Raiz:**
   * Migração de anotações parciais (somente dorso/segmentação sem pernas) para anotações estritas de **corpo inteiro**, eliminando a geração de caixas internas duplicadas.
   * Separação manual de agrupamentos incorretos no Roboflow para ensinar o modelo a delimitar cada animal individualmente em oclusões.

2. **Pipeline de Pós-Processamento e Filtro Temporal:**
   * **NMS  (`iou=0.40`, `conf=0.45`):** Eliminação de caixas sobrepostas no mesmo animal.
   * **ByteTrack Integrado:** Substituição do `BoT-SORT` pelo algoritmo ByteTrack para manter a identidade (`ID`) do animal mesmo em oclusões prolongadas.
   * **Filtro de Persistência Temporal:** Um ID só é contabilizado no laudo final se permanecer visível no vídeo por **pelo menos 15 frames válidos**, eliminando instantaneamente ruídos de 1 a 2 frames.

3. **Otimização de Desempenho para CPU:**
   * Aplicação do pulo de quadros e redimensionamento de inferência.

4. **Compatibilidade de Reprodução na Web (Codec H.264):**
   * Implementação de rotina de renderização em H.264 via `OpenH264/avc1` no OpenCV, permitindo que os vídeos anotados com as *bounding boxes* sejam reproduzidos diretamente em qualquer navegador via HTML5.

## Motivo

* **Oclusão e Aglomeração:** Quando animais caminham juntos ou um passa na frente do outro, o modelo perde o rastreio e gera múltiplos IDs para o mesmo animal.
* **Detecção Parcial:** Inconsistências na anotação do dataset fazem a IA detectar pernas, dorsos e cabeças como animais isolados, criando caixas duplicadas.
* **Falsos Positivos Temporários:** Ruídos visuais de apenas 1 frame inflam a contagem de gados final.

---

# 2. Stack Tecnológica Escolhida

**IA**: Python 3.12, PyTorch, Ultralytics YOLOv8;
**Backend**: Node.js, Fastify, TypeScript;
**Banco de Dados**: Prisma junto com PostgreSQL;
**Frontend**: React, TypeScript e Tailwind CSS;

---

# 3. Relatos

## Tião
- De acordo com o seu Tião, ele costuma arrendar o pasto para três vizinhos. Porém um deles sempre alega que na hora de retomar com seu gado, a quantidade de animais é menor.
- Além disso, seu Tião afirma que todos sabem quantos animais entram no pasto. Mas ele não entende o motivo da quantidade sempre voltar diferente.
- Seu Tião afirma que seu genro já passou o drone pelo pasto, a imagem ficou bonita. Entretanto ninguém sabe contar boi em vídeo.

---

# 4. Resultados 

**Desempenho da IA:**
- **Antes:** Em testes de campo com um lote real de 12 a 13 animais, a IA acumulava contagens de **47 a 45 gados** (devido a trocas de IDs e detecções duplicadas).
- **Depois:** Com o novo dataset de corpo inteiro, ByteTrack e NMS `0.40`, a contagem ficou entre **13 e 14 cabeças**, estando mais coerente com a real quantidade de animais no pasto.

**Desempenho em CPU:**
- O tempo de processamento de um vídeo de 30 segundos rodando exclusivamente em processador (CPU Intel Core i3) caiu de **~120 segundos para ~50 segundos** com o uso de `vid_stride=2` e `imgsz=640`.

**Plataforma que conecta produtor ao consumidor:**
- A plataforma da AgroIntelli permitiu a conexão ao produtor que gostaria de disponibilizar seus lotes de gado para venda e ao consumidor (donos de restaurantes, frigoríficos e etc). Dessa forma, possibilitando a comunicação e realização de négocios entre as duas pontas por meio da AgroIntelli. 

---

# 5. O Que Ficou de Fora

- Nada, toda a proposta da ideia fui cumprida.