document.addEventListener("DOMContentLoaded", function () {
    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    const captureButton = document.getElementById("capture");
    const capturedImage = document.getElementById("captured-image");
    const resultsDiv = document.getElementById("results");
    const placeholder = document.getElementById("placeholder");

    let stream = null;

    // Start Camera
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.classList.remove("hidden");
            capturedImage.classList.add("hidden");
            placeholder.classList.add("hidden");
        } catch (error) {
            alert("Error accessing camera: " + error);
        }
    }

    // Stop Camera
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    // Reset the canvas and previous image
    function resetCapture() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        capturedImage.src = "";
        capturedImage.classList.add("hidden");
        video.classList.remove("hidden");
    }

    // Generate small recommendation cards with GIFs
    function generateRecommendationCards(data, type) {
        let gif = "";
        if (type === "game") gif = "/static/games.gif";
        else if (type === "music") gif = "/static/songs.gif";
    
        return data.map(item => `
            <div class="bg-white rounded-lg shadow-md p-3 flex items-center space-x-3 w-48 hover:scale-105 transition-transform">
                ${gif ? `<img src="${gif}" class="w-12 h-12 rounded-lg object-cover" alt="${type} gif">` : ""}
                <div class="flex-1">
                    ${item['Game Name'] ? `<a href="${item['Online Play Link']}" target="_blank" class="text-blue-600 font-semibold">${item['Game Name']}</a>` : ""}
                    ${item['Song Name'] ? `<a href="${item['Song Link']}" target="_blank" class="text-green-600 font-semibold">${item['Song Name']}</a>` : ""}
                    ${type === "quote" ? `<span class="text-pink-500">${item}</span>` : ""}
                </div>
            </div>
        `).join('');
    }
    

    // Capture and Detect Emotion
    captureButton.addEventListener("click", async () => {
        if (!stream) {
            await startCamera();
            return;
        }

        resetCapture(); // Ensure a fresh capture each time

        // Capture Frame
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to image blob
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append("image", blob, "captured.jpg");

            try {
                const response = await fetch("/detect_emotion", { method: "POST", body: formData });
                const data = await response.json();

                if (data.error) {
                    resultsDiv.innerHTML = `<p class="text-red-500 font-semibold">Error: ${data.error}</p>`;
                } else {
                    // Show recommendations with GIFs
                    resultsDiv.innerHTML = `
                        <h2 class="text-xl font-bold mb-3">Detected Emotion: ${data.emotion}</h2>

                        <h3 class="text-lg font-semibold mt-4">Recommended Games:</h3>
                        <div class="flex gap-3 flex-wrap justify-center">
                            ${generateRecommendationCards(data.recommendations.games, "game")}
                        </div>

                        <h3 class="text-lg font-semibold mt-4">Recommended Songs:</h3>
                        <div class="flex gap-3 flex-wrap justify-center">
                            ${generateRecommendationCards(data.recommendations.songs, "music")}
                        </div>

                        <h3 class="text-lg font-semibold mt-4">Recommended Quotes:</h3>
                        <div class="flex gap-3 flex-wrap justify-center">
                            ${generateRecommendationCards(data.recommendations.quotes, "quote")}
                        </div>
                    `;

                    // Show captured image properly
                    capturedImage.src = URL.createObjectURL(blob);
                    capturedImage.classList.remove("hidden");
                    video.classList.add("hidden");

                    // Apply animation to recommendations
                    resultsDiv.classList.remove("opacity-0", "scale-95");
                    resultsDiv.classList.add("opacity-100", "scale-100");
                }
            } catch (error) {
                resultsDiv.innerHTML = `<p class="text-red-500 font-semibold">Error processing request.</p>`;
            }

            stopCamera();
        }, "image/jpeg");
    });
});
