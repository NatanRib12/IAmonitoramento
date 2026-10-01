import os
import sys
import cv2
from collections import Counter
from ultralytics import YOLO

def testar_ia(video_path, conf_threshold=0.50, iou_threshold=0.40):
    dir_atual = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(dir_atual, "model", "best.pt")

    if not os.path.exists(model_path):
        print(f"❌ Modelo não encontrado em: {model_path}")
        return

    if not os.path.exists(video_path):
        print(f"❌ Vídeo não encontrado em: {video_path}")
        return

    print(f"🚀 Carregando modelo: {model_path}")
    model = YOLO(model_path)

    print(f"🎥 Processando vídeo: {video_path}")
    
    # Executa a inferência usando ByteTrack (muito mais estável em aglomerações)
    results = model.track(
        source=video_path,
        conf=conf_threshold,   # Descarta detecções com menos de 50% de certeza
        iou=iou_threshold,     # Elimina caixas sobrepostas no mesmo boi (NMS)
        persist=True,
        tracker="bytetrack.yaml",
        stream=True
    )

    out_video_path = os.path.join(dir_atual, "resultado_com_boxes.mp4")
    writer = None
    
    # Contador de presença dos IDs ao longo do vídeo
    historico_ids = Counter()
    max_simultaneo = 0

    for frame_idx, r in enumerate(results):
        annotated_frame = r.plot()

        if writer is None:
            h, w, _ = annotated_frame.shape
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            writer = cv2.VideoWriter(out_video_path, fourcc, 30.0, (w, h))

        writer.write(annotated_frame)

        ids_frame_atual = []
        if r.boxes.id is not None:
            # Pega IDs e caixas delimitadoras
            ids = r.boxes.id.int().tolist()
            boxes = r.boxes.xywh.tolist()  # x_center, y_center, width, height

            for obj_id, box in zip(ids, boxes):
                largura, altura = box[2], box[3]
                area = largura * altura

                # Filtro de área mínima: ignora pedaços muito pequenos (patas/caudas isoladas)
                if area > 1500:  
                    ids_frame_atual.append(obj_id)

            # Atualiza histórico global
            historico_ids.update(ids_frame_atual)
            
            if len(ids_frame_atual) > max_simultaneo:
                max_simultaneo = len(ids_frame_atual)

            print(f"Frame {frame_idx}: {len(ids_frame_atual)} bois válidos na tela | Pico simultâneo: {max_simultaneo}")

        cv2.imshow("Teste IA AgroIntelli", annotated_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    if writer:
        writer.release()
    cv2.destroyAllWindows()

    # FILTRO DE PERSISTÊNCIA:
    # O ID precisa aparecer no mínimo em 20 frames do vídeo para ser contabilizado
    MIN_FRAMES_PERSISTENCIA = 20
    ids_confirmados = [obj_id for obj_id, count in historico_ids.items() if count >= MIN_FRAMES_PERSISTENCIA]

    print("\n" + "="*50)
    print(f"📊 RESULTADO AJUSTADO:")
    print(f"• Total de IDs brutos detectados: {len(historico_ids)}")
    print(f"• Máximo de bois visíveis simultaneamente num frame: {max_simultaneo}")
    print(f"• Total final filtrado (IDs que persistiram > {MIN_FRAMES_PERSISTENCIA} frames): {len(ids_confirmados)}")
    print(f"Vídeo gravado em: {out_video_path}")
    print("="*50)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        caminho_video = sys.argv[1]
    else:
        caminho_video = input("Arraste ou digite o caminho do vídeo (.mp4): ").strip('"')

    testar_ia(caminho_video)