from flask import Flask, render_template, request, jsonify
import cv2
from ultralytics import YOLO
import numpy as np

app = Flask(__name__)
model = YOLO('best.pt')
camera = None  # Initialize camera object globally

def cm_to_feet(cm):
    return cm / 30.48

def check_flame_height(height_cm):
    height_feet = cm_to_feet(height_cm)
    if height_feet == 4:
        return "Perfect heat"
    elif height_feet > 7:
        return "Too high flame but acceptable"
    else:
        return "Too low, requires more heat"

def detect_flame(frame):
    results = model.predict(source=frame, conf=0.1)  # Adjust the confidence threshold here (e.g., 0.1)
    boxes = results[0].boxes.data.tolist()
    flame_heights = []
    for box in boxes:
        x1, y1, x2, y2, _, _ = box
        height = y2 - y1
        flame_heights.append(height)
    if flame_heights:
        average_flame_height = sum(flame_heights) / len(flame_heights)
        return check_flame_height(average_flame_height)
    else:
        return "No flame detected"

@app.route('/', methods=['GET', 'POST'])
def fire_detection():
    if request.method == 'POST':
        image_file = request.files['imageFile']  # Corrected key to 'imageFile'
        if image_file:
            nparr = np.frombuffer(image_file.read(), np.uint8)  # Convert image data to numpy array
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)  # Decode image using OpenCV
            result = detect_flame(frame)  # Perform flame detection
            return jsonify({'result': result})  # Return result as JSON
    return render_template('index.html')  # Render HTML template for initial GET request

@app.route('/shutdown', methods=['POST'])
def shutdown():
    # Clean up camera and other resources before shutting down the server
    global camera
    if camera is not None:
        camera.release()
    return 'Server shutting down...'

if __name__ == "__main__":
    app.run(debug=True)
