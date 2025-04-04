from ultralytics import YOLO
import torch
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
import tempfile
import os

app = FastAPI()

@app.post("/analyze")
async def analyze_image(photo: UploadFile = File(...)):
    contents = await photo.read()
    photo_name=photo.filename
    output_path = run_tumor_detection(contents)
    return FileResponse(output_path, media_type="image/jpg", filename=photo_name)

# Your AI logic goes here
def run_tumor_detection(image_bytes):
    # Save image bytes to a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    # Load image and model, run prediction, return result
    modelBest = YOLO("C:/Users/mateu/Desktop/6semestr/praca_licencjacka/runs/detect/train/weights/best.pt")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    print(f"Ładowany model: {modelBest.model.yaml}")
    
    results = modelBest(tmp_path, save=True)  # Testujemy na nowym obrazie
    
    # Step 4: Get the path to the saved, processed image
    result_dir = results[0].save_dir  # e.g., 'runs/detect/predict'
    result_filename = os.path.basename(tmp_path)  # same as input file name
    result_path = os.path.join(result_dir, result_filename)  # full path

    return result_path  # 👈 return this to FastAPI handler

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

