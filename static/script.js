document.addEventListener('DOMContentLoaded', function () {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const captureButton = document.getElementById('captureButton');
    const captureForm = document.getElementById('fireDetectionForm');
    const capturedImageDataInput = document.getElementById('capturedImageData');

    let mediaStream;

    // Start the webcam and display video feed
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            video.srcObject = stream;
            mediaStream = stream;
        })
        .catch(function (err) {
            console.error('Error accessing the camera:', err);
            alert('Error accessing the camera. Please make sure the camera is connected and accessible.');
        });

    // Capture image from webcam
    captureButton.addEventListener('click', function () {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        capturedImageDataInput.value = imageData; // Set the captured image data in the hidden input
    });

    // Submit the form when 'Detect Fire' button is clicked
    captureForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent default form submission
        const formData = new FormData(captureForm);
        // Convert the captured image data URL to a Blob
        fetch(capturedImageDataInput.value)
            .then(res => res.blob())
            .then(blob => {
                formData.append('imageFile', blob, 'capture.jpg'); // Append the image Blob to the form data under the key 'imageFile'
                return fetch('/', {
                    method: 'POST',
                    body: formData
                });
            })
            .then(response => response.json()) // Expecting JSON response
            .then(result => {
                // Update the page with the result
                const resultElement = document.getElementById('result');
                resultElement.innerHTML = `<p>${result.result}</p>`; // Display the result in the 'result' paragraph
                if (result.result) {
                    // If there is a result, display the captured image
                    const img = document.createElement('img');
                    img.src = capturedImageDataInput.value; // Set the source of the image to the captured image data URL
                    img.alt = 'Captured Image';
                    resultElement.appendChild(img); // Add the image to the result element
                }
            })
            .catch(error => {
                console.error('Error processing image:', error);
                alert('Error processing image. Please try again.');
            });
    });
    // Stop the webcam when the page is unloaded
    window.addEventListener('unload', function () {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
    });
});
