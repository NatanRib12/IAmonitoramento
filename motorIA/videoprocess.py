import sys
import json
import os
import warnings

# Silencia logs e avisos internos do PyTorch/Ultralytics
os.environ["YOLO_VERBOSE"] = "False"
warnings.filterwarnings("ignore")

import cv2
import urllib.request
import bz2
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
        garantir_openh264()

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

        # CONFIGURAÇÃO DE ALTA PERFORMANCE PARA CPU:
        # - vid_stride=3 (Processa 1 a cada 3 frames -> Ganho de 3x em velocidade)
        # - device="cpu" (Força execução otimizada em processador)
        resultados = model.track(
            source=video_path,
            conf=0.25,
            iou=0.45,
            imgsz=1024,
            vid_stride=4, 
            device="cpu", 
            persist=True,
            tracker="bytetrack.yaml",
            stream=True,
            verbose=False
        )

        contagem_por_frame = []

        for r in resultados:
            annotated_frame = r.plot()

            if writer is None or not writer.isOpened():
                h, w, _ = annotated_frame.shape
                for codec in ['avc1', 'H264', 'mp4v']:
                    fourcc = cv2.VideoWriter_fourcc(*codec)
                    writer = cv2.VideoWriter(video_processado_path, fourcc, 30.0, (w, h))
                    if writer.isOpened():
                        break

            if writer and writer.isOpened() and annotated_frame is not None:
                writer.write(annotated_frame)

            if r.boxes is not None:
                boxes = r.boxes.xywh.tolist()
                valid_boxes = [b for b in boxes if (b[2] * b[3]) > 200]
                contagem_por_frame.append(len(valid_boxes))

        if writer and writer.isOpened():
            writer.release()

        if contagem_por_frame:
            contagem_por_frame.sort()
            idx_pico = int(len(contagem_por_frame) * 0.90)
            total_gado = contagem_por_frame[idx_pico]
        else:
            total_gado = 0

        resposta = {
            "sucesso": True,
            "total_gado": total_gado,
            "video_processado": os.path.abspath(video_processado_path),
            "mensagem": "Processamento concluído com sucesso."
        }
        
        sys.stdout.write(json.dumps(resposta) + "\n")
        sys.stdout.flush()

    except Exception as e:
        if writer and writer.isOpened():
            writer.release()
        resposta = {
            "sucesso": False,
            "erro": str(e)
        }
        sys.stdout.write(json.dumps(resposta) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        caminho_video = sys.argv[1]
        processar_video(caminho_video)
    else:
        err = {"sucesso": False, "erro": "Caminho do vídeo não fornecido."}
        sys.stdout.write(json.dumps(err) + "\n")
        sys.stdout.flush()