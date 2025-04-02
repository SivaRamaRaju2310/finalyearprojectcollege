from fer import FER
import cv2

detector = FER()

def detect_emotion(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None  # Image not found

    detected_emotions = detector.detect_emotions(img)
    
    if not detected_emotions:
        return None  # No face detected
    
    # Get the dominant emotion
    top_emotion = max(detected_emotions[0]['emotions'], key=detected_emotions[0]['emotions'].get)
    
    return top_emotion
