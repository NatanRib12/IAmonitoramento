import cv2
import os
import glob

# Configurações de diretórios
video_folder = r"C:\Users\natan\Downloads\video"  # Pasta com os novos vídeos
output_folder = r"C:\Users\natan\Downloads\frames_extraidos"
fps_to_extract = 1  # Quantos frames salvar por segundo de vídeo

os.makedirs(output_folder, exist_ok=True)

# Busca arquivos de vídeo com extensões comuns (.mp4, .avi, .mov)
video_extensions = ("*.mp4", "*.avi", "*.mov", "*.mkv")
video_files = []
for ext in video_extensions:
    video_files.extend(glob.glob(os.path.join(video_folder, ext)))

print(f"Total de vídeos encontrados: {len(video_files)}")

total_saved = 0

for video_path in video_files:
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Erro ao abrir o vídeo: {video_path}")
        continue

    video_fps = cap.get(cv2.CAP_PROP_FPS)
    if video_fps == 0 or float('nan') in [video_fps]:
        video_fps = 30  # FPS padrão de segurança caso não seja detectado

    frame_interval = int(video_fps / fps_to_extract)
    if frame_interval < 1:
        frame_interval = 1

    current_frame = 0
    saved_in_video = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if current_frame % frame_interval == 0:
            filename = os.path.join(output_folder, f"{video_name}_frame_{saved_in_video:04d}.jpg")
            cv2.imwrite(filename, frame)
            saved_in_video += 1
            total_saved += 1

        current_frame += 1

    cap.release()
    print(f"Vídeo '{video_name}': {saved_in_video} frames salvos.")

print(f"\nProcesso concluído! Total de {total_saved} frames extraídos em '{output_folder}'.")