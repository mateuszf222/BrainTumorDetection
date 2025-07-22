from ultralytics import YOLO
import torch
import os


if __name__ == "__main__":
    model = YOLO(model=os.path.abspath("C:/Users/mateu/Desktop/6semestr/praca_licencjacka/yolo11m.pt"))  # Ładujemy gotowy model
    model.info()  # Wyświetla szczegóły modelu

    modelBest = YOLO("C:/Users/mateu/Desktop/6semestr/praca_licencjacka/runs/detect/train/weights/best.pt")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    data_yaml_path = os.path.abspath("C:/Users/mateu/Desktop/6semestr/praca_licencjacka/brain-tumor/data.yaml")

    # model.train(data=data_yaml_path, epochs=30, imgsz=512, batch=-1, device="cuda", model="C:/Users/mateu/Desktop/6semestr/praca_licencjacka/yolov8m.pt")
    print(f"Ładowany model: {model.model.yaml}")
    # model.train(data=data_yaml_path, epochs=20, imgsz=640, batch=-1, device="cuda")

    results = modelBest("00056_110.jpg", save=True)  # Testujemy na nowym obrazie
    print(modelBest.val())

