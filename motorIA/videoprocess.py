import sys
import json
import os
import warnings
from collections import Counter

# Silencia logs e avisos internos do PyTorch/Ultralytics no stdout
os.environ["YOLO_VERBOSE"] = "False"
warnings.filterwarnings("ignore")

import cv2
import urllib.request
import bz2
import torch
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
        
        # 1. Detecção automática de Modelo OpenVINO (Intel Iris Xe) ou PyTorch (.pt)
        openvino_model_path = os.path.join(diretorio_motor_ia, "model", "best_openvino_model")
        pt_model_path = os.path.join(diretorio_motor_ia, "model", "best.pt")

        if os.path.exists(openvino_model_path):
            # Carrega versão acelerada OpenVINO
            model_path = openvino_model_path
            device = "GPU"  # GPU integrada Intel Iris Xe
            use_half = False
        elif os.path.exists(pt_model_path):
            # Carrega versão .pt via PyTorch
            model_path = pt_model_path
            device = "cuda" if torch.cuda.is_available() else "cpu"
            use_half = True if device == "cuda" else False
        else:
            raise FileNotFoundError(f"Nenhum arquivo de modelo encontrado na pasta: {os.path.join(diretorio_motor_ia, 'model')}")

        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Arquivo de vídeo não encontrado em: {video_path}")

        model = YOLO(model_path, task="detect")

        pasta_uploads = os.path.dirname(video_path)
        nome_base = os.path.splitext(os.path.basename(video_path))[0]
        video_processado_nome = f"{nome_base}_processado.mp4"
        video_processado_path = os.path.join(pasta_uploads, video_processado_nome)

        VID_STRIDE = 3

        # Inferência com tratamento de dispositivo
        resultados = model.track(
            source=video_path,
            conf=0.65,
            iou=0.40,
            imgsz=800,           
            vid_stride=VID_STRIDE,
            device=device,
            half=use_half,
            persist=True,
            tracker="bytetrack.yaml",
            stream=True,
            verbose=False
        )

        historico_ids = Counter()

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

            if r.boxes is not None and r.boxes.id is not None:
                ids = r.boxes.id.int().tolist()
                boxes = r.boxes.xywh.tolist()

                ids_frame_validos = []
                for obj_id, box in zip(ids, boxes):
                    largura, altura = box[2], box[3]
                    if (largura * altura) > 500:
                        ids_frame_validos.append(obj_id)

                historico_ids.update(ids_frame_validos)

        if writer and writer.isOpened():
            writer.release()

        # Ajuste dinâmico de persistência temporal proporcional ao vid_stride
        min_frames_necessarios = max(3, int(15 / VID_STRIDE))
        ids_confirmados = [obj_id for obj_id, count in historico_ids.items() if count >= min_frames_necessarios]
        total_gado = len(ids_confirmados)

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