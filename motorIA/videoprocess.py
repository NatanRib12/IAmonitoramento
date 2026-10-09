import sys
import json
import os
import cv2
import urllib.request
import bz2
from collections import Counter
from ultralytics import YOLO


def garantir_openh264():
    try:
        dll_name = "openh264-2.5.0-win64.dll"
        target_dir = os.path.dirname(sys.executable)
        dll_path = os.path.join(target_dir, dll_name)

        if not os.path.exists(dll_path):
            url = "https://github.com/cisco/openh264/releases/download/v2.5.0/openh264-2.5.0-win64.dll.bz2"
            compressed_path = os.path.join(target_dir, "openh264.bz2")
            urllib.request.urlretrieve(url, compressed_path)
            with bz2.open(compressed_path, 'rb') as f_in:
                with open(dll_path, 'wb') as f_out:
                    f_out.write(f_in.read())
            if os.path.exists(compressed_path):
                os.remove(compressed_path)
    except Exception:
        pass

def processar_video(video_path):
    annotated_frame = None
    writer = None
    
    try:
        diretorio_motor_ia = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(diretorio_motor_ia, "model", "best.pt")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Arquivo de modelo não encontrado em: {model_path}")

        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Arquivo de vídeo não encontrado em: {video_path}")

        model = YOLO(model_path)

        pasta_uploads = os.path.dirname(video_path)
        nome_base = os.path.splitext(os.path.basename(video_path))[0]
        video_processado_nome = f"{nome_base}_processado.mp4"
        video_processado_path = os.path.join(pasta_uploads, video_processado_nome)

        # Executa inferência com NMS e ByteTrack
        resultados = model.track(
            source=video_path,
            conf=0.45,
            iou=0.40,
            imgsz=640,           
            vid_stride=2,
            persist=True,
            tracker="bytetrack.yaml",
            stream=True,
            verbose=False
        )

        historico_ids = Counter()

        for r in resultados:
            annotated_frame = r.plot()

            # Inicialização segura do VideoWriter testando codecs compatíveis
            if writer is None or not writer.isOpened():
                h, w, _ = annotated_frame.shape
                for codec in ['avc1', 'H264', 'mp4v']:
                    fourcc = cv2.VideoWriter_fourcc(*codec)
                    writer = cv2.VideoWriter(video_processado_path, fourcc, 30.0, (w, h))
                    if writer.isOpened():
                        break

            if writer and writer.isOpened() and annotated_frame is not None:
                writer.write(annotated_frame)

            if r.boxes.id is not None:
                ids = r.boxes.id.int().tolist()
                boxes = r.boxes.xywh.tolist()

                ids_frame_validos = []
                for obj_id, box in zip(ids, boxes):
                    largura, altura = box[2], box[3]
                    if (largura * altura) > 1000:
                        ids_frame_validos.append(obj_id)

                historico_ids.update(ids_frame_validos)

        if writer and writer.isOpened():
            writer.release()

        # Filtro de persistência temporal
        MIN_FRAMES = 15
        ids_confirmados = [obj_id for obj_id, count in historico_ids.items() if count >= MIN_FRAMES]
        total_gado = len(ids_confirmados)

        # Retorna o caminho absoluto do arquivo para o Node.js localizar sem falhar
        resposta = {
            "sucesso": True,
            "total_gado": total_gado,
            "video_processado": os.path.abspath(video_processado_path),
            "mensagem": "Processamento concluído com sucesso."
        }
        print(json.dumps(resposta))

    except Exception as e:
        if writer and writer.isOpened():
            writer.release()
        resposta = {
            "sucesso": False,
            "erro": str(e)
        }
        print(json.dumps(resposta))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        caminho_video = sys.argv[1]
        processar_video(caminho_video)
    else:
        print(json.dumps({"sucesso": False, "erro": "Caminho do vídeo não fornecido."}))