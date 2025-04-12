import base64, os, joblib, cv2, numpy as np, json
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from tensorflow.keras.models import load_model

# Adjust paths as needed
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml_models", "hybrid_stress_model.h5")
ENCODER_PATH = os.path.join(BASE_DIR, "ml_models", "label_encoder.joblib")
CAPTURE_PATH = os.path.join(BASE_DIR, "media", "captured_image.png")

# Load models (once on server startup)
model = load_model(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)


def preprocess_image(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.resize(img, (48, 48))
    img = img.astype('float32') / 255.0
    img = np.expand_dims(img, axis=-1)  # shape: (48, 48, 1)
    img = np.expand_dims(img, axis=0)  # shape: (1, 48, 48, 1)
    return img


@csrf_exempt
def capture_image(request):
    if request.method == "POST":
        try:
            # Extract Base64 image data from form POST (not JSON here)
            data = request.POST.get("image")
            if not data:
                return JsonResponse({"error": "No image data received"}, status=400)

            # Decode image data and save it
            image_data = data.split(",")[1]
            image_bytes = base64.b64decode(image_data)
            with open(CAPTURE_PATH, "wb") as f:
                f.write(image_bytes)

            # Preprocess image and predict stress level
            image = preprocess_image(CAPTURE_PATH)
            prediction = model.predict(image)
            class_index = np.argmax(prediction)
            stress_label = label_encoder.inverse_transform([class_index])[0]

            # Return JSON response (for our first fetch call)
            return JsonResponse({"stress_level": stress_label}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    return render(request, "capture.html")


@csrf_exempt
def result2(request):
    if request.method == "POST":
        try:
            # Parse the JSON POSTed from the second fetch call.
            data = json.loads(request.body)
            stress_level = data.get("stress_level")
            if stress_level is None:
                return HttpResponseBadRequest("Missing stress_level")

            # Render your results template with the stress level
            return render(request, "result2.html", {"stress_level": stress_level})
        except Exception as e:
            return HttpResponse(f"Error: {e}", status=400)
    return HttpResponse("Invalid request", status=405)
