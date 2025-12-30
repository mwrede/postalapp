// Roboflow Configuration
const ROBOFLOW_API_KEY = "jIlsPhHeCYPv0LCOooQT";
const ROBOFLOW_WORKSPACE = "michael-h89ju";
const ROBOFLOW_WORKFLOW_ID = "detect-count-and-visualize";
const ROBOFLOW_API_URL = "https://serverless.roboflow.com";

// Initialize variables
let currentImage = null;
let detections = [];
let stream = null;
let correctedCount = 0;

// Session statistics
let totalPictures = 0;
let totalLocks = 0;

// Store detected count for database
let lastDetectedCount = 0;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const firstName = localStorage.getItem('firstName');
    const postOffice = localStorage.getItem('postOffice');

    if (!firstName || !postOffice) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }

    // Display user info
    document.getElementById('user-welcome').textContent = `Welcome, ${firstName} (${postOffice})`;

    // Load session statistics
    loadSessionStats();

    // Setup logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('firstName');
        localStorage.removeItem('postOffice');
        window.location.href = 'login.html';
    });

    setupEventListeners();
    startCamera();
});

// Start camera stream
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        const video = document.getElementById('video-stream');
        video.srcObject = stream;
        video.play();
    } catch (error) {
        console.error('Error accessing camera:', error);
        showError('Could not access camera. Please grant camera permissions or use the upload option.');
    }
}

// Stop camera stream
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Setup event listeners
function setupEventListeners() {
    const captureBtn = document.getElementById('capture-btn');
    const fileInput = document.getElementById('file-input');
    const backBtn = document.getElementById('back-btn');
    const decreaseBtn = document.getElementById('decrease-btn');
    const increaseBtn = document.getElementById('increase-btn');
    const correctedCountInput = document.getElementById('corrected-count');
    const confirmBtn = document.getElementById('confirm-btn');
    const retakeBtn = document.getElementById('retake-btn');

    captureBtn.addEventListener('click', captureAndDetect);
    fileInput.addEventListener('change', (e) => handleFileUpload(e));
    backBtn.addEventListener('click', backToCamera);
    retakeBtn.addEventListener('click', retakeImage);
    
    // Correction controls
    decreaseBtn.addEventListener('click', () => {
        const current = parseInt(correctedCountInput.value) || 0;
        if (current > 0) {
            correctedCountInput.value = current - 1;
        }
    });
    
    increaseBtn.addEventListener('click', () => {
        const current = parseInt(correctedCountInput.value) || 0;
        correctedCountInput.value = current + 1;
    });
    
    correctedCountInput.addEventListener('input', (e) => {
        const value = parseInt(e.target.value) || 0;
        if (value < 0) e.target.value = 0;
    });
    
    confirmBtn.addEventListener('click', confirmCount);
}

// Capture image from video and detect
async function captureAndDetect() {
    const video = document.getElementById('video-stream');
    const canvas = document.getElementById('capture-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert canvas to image
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    
    await new Promise((resolve) => {
        img.onload = resolve;
    });
    
    currentImage = img;
    
    // Hide camera section, show preview
    document.getElementById('camera-section').style.display = 'none';
    document.getElementById('preview-section').style.display = 'block';
    
    // Display captured image
    displayImage(img);
    
    // Automatically run detection
    await detectArrowLocks();
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
            currentImage = img;
            
            // Hide camera section, show preview
            document.getElementById('camera-section').style.display = 'none';
            document.getElementById('preview-section').style.display = 'block';
            
            displayImage(img);
            
            // Automatically run detection
            await detectArrowLocks();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Back to camera view
function backToCamera() {
    stopCamera();
    startCamera();
    document.getElementById('preview-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('count-overlay').style.display = 'none';
    document.getElementById('camera-section').style.display = 'block';
    currentImage = null;
    detections = [];
    correctedCount = 0;
}

// Display the selected image
function displayImage(img) {
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw image on canvas
    ctx.drawImage(img, 0, 0);
}

// Detect arrow locks using Roboflow Workflow API
async function detectArrowLocks() {
    if (!currentImage) {
        showError('Please select an image first.');
        return;
    }

    // Show loading state
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';

    try {
        // Convert image to base64
        const canvas = document.createElement('canvas');
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(currentImage, 0, 0);

        // Get base64 image data
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

        // Call Roboflow Workflow API
        const response = await fetch(`${ROBOFLOW_API_URL}/${ROBOFLOW_WORKSPACE}/workflows/${ROBOFLOW_WORKFLOW_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: ROBOFLOW_API_KEY,
                inputs: {
                    image: {
                        type: 'base64',
                        value: base64Image
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // LOG EVERYTHING TO CONSOLE
        console.log('═══════════════════════════════════════════');
        console.log('📋 FULL WORKFLOW RESULT:');
        console.log('═══════════════════════════════════════════');
        console.log(JSON.stringify(result, null, 2));
        console.log('═══════════════════════════════════════════');

        // Log the entire result object directly
        console.log('📋 FULL RESULT OBJECT:', result);

        // Check if outputs is an array or object
        if (result.outputs) {
            console.log('🔍 OUTPUTS IS ARRAY:', Array.isArray(result.outputs));
            console.log('🔍 OUTPUTS TYPE:', typeof result.outputs);
            console.log('🔍 OUTPUTS:', result.outputs);

            // Get the first output if it's an array
            const output = Array.isArray(result.outputs) ? result.outputs[0] : result.outputs;
            console.log('🔍 FIRST OUTPUT:', output);

            if (output) {
                console.log('🔍 count_objects value:', output.count_objects);
                console.log('🔍 label_visualization:', output.label_visualization);

                // Log the first 500 chars of label_visualization if it exists
                if (output.label_visualization) {
                    const viz = output.label_visualization;
                    console.log('🖼️ label_visualization TYPE:', typeof viz);
                    console.log('🖼️ label_visualization OBJECT:', viz);

                    if (viz.value) {
                        console.log('🖼️ label_visualization.value (first 500 chars):', viz.value.substring(0, 500));
                    } else if (typeof viz === 'string') {
                        console.log('🖼️ label_visualization string (first 500 chars):', viz.substring(0, 500));
                    }
                }
            }
        }

        // Extract count_objects - handle both array and object formats
        let detectedCount = 0;

        // Get the output (either from array or direct object)
        const output = Array.isArray(result.outputs) ? result.outputs[0] : result.outputs;

        // Try different possible locations for the count
        if (output && output.count_objects !== undefined) {
            detectedCount = parseInt(output.count_objects) || 0;
            console.log('✅ FOUND count_objects in output.count_objects:', detectedCount);
        } else if (result.outputs && result.outputs.count_objects !== undefined) {
            detectedCount = parseInt(result.outputs.count_objects) || 0;
            console.log('✅ FOUND count_objects in result.outputs.count_objects:', detectedCount);
        } else if (result.count_objects !== undefined) {
            detectedCount = parseInt(result.count_objects) || 0;
            console.log('✅ FOUND count_objects in result.count_objects:', detectedCount);
        } else if (output && output.count !== undefined) {
            detectedCount = parseInt(output.count) || 0;
            console.log('✅ FOUND count in output.count:', detectedCount);
        } else {
            console.error('❌ count_objects NOT FOUND in any location');
        }

        console.log('📊 RAW VALUE:', output?.count_objects);
        console.log('📊 FINAL PARSED COUNT:', detectedCount);

        // Extract the annotated image - handle both array and object formats
        let annotatedImageBase64 = null;

        if (output && output.label_visualization) {
            const viz = output.label_visualization;

            // Try different formats
            if (viz.type === 'base64' && viz.value) {
                annotatedImageBase64 = viz.value;
                console.log('✅ FOUND label_visualization.value (base64 object)');
            } else if (typeof viz === 'string') {
                annotatedImageBase64 = viz;
                console.log('✅ FOUND label_visualization (string)');
            } else if (viz.value) {
                annotatedImageBase64 = viz.value;
                console.log('✅ FOUND label_visualization.value (direct)');
            } else {
                console.log('⚠️ label_visualization exists but format unknown:', typeof viz);
                console.log('⚠️ viz object:', viz);
            }
        } else if (result.outputs && result.outputs.label_visualization) {
            const viz = result.outputs.label_visualization;
            if (typeof viz === 'string') {
                annotatedImageBase64 = viz;
                console.log('✅ FOUND label_visualization (string in result.outputs)');
            } else if (viz.value) {
                annotatedImageBase64 = viz.value;
                console.log('✅ FOUND label_visualization.value (in result.outputs)');
            }
        } else if (result.label_visualization) {
            // Try root level
            const viz = result.label_visualization;
            if (typeof viz === 'string') {
                annotatedImageBase64 = viz;
                console.log('✅ FOUND label_visualization in result root (string)');
            } else if (viz.value) {
                annotatedImageBase64 = viz.value;
                console.log('✅ FOUND label_visualization.value in result root');
            }
        } else {
            console.error('❌ label_visualization NOT FOUND in any location');
        }

        console.log('═══════════════════════════════════════════');
        console.log('📊 FINAL COUNT:', detectedCount);
        console.log('🖼️ IMAGE FOUND:', !!annotatedImageBase64);
        console.log('═══════════════════════════════════════════');

        // Store the detected count for later database save
        lastDetectedCount = detectedCount;

        // If we have an annotated image, load it
        if (annotatedImageBase64) {
            const annotatedImg = new Image();
            annotatedImg.onload = () => {
                // Update the canvas with the annotated image
                const canvas = document.getElementById('preview-canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = annotatedImg.width;
                canvas.height = annotatedImg.height;
                ctx.drawImage(annotatedImg, 0, 0);

                // Display results with the count
                displayResults([], detectedCount);
            };
            annotatedImg.onerror = () => {
                console.warn('Failed to load annotated image, using original');
                // Fall back to showing original image
                const canvas = document.getElementById('preview-canvas');
                const ctx = canvas.getContext('2d');
                ctx.drawImage(currentImage, 0, 0);
                displayResults([], detectedCount);
            };
            // Convert base64 to data URL
            annotatedImg.src = 'data:image/jpeg;base64,' + annotatedImageBase64;
        } else {
            // No annotated image, just show the original with count
            const canvas = document.getElementById('preview-canvas');
            const ctx = canvas.getContext('2d');
            ctx.drawImage(currentImage, 0, 0);
            displayResults([], detectedCount);
        }
    } catch (error) {
        console.error('Detection error:', error);
        showError(`Detection failed: ${error.message || 'Unknown error'}. Please check your API key and workflow configuration.`);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Process detections and draw them
function processDetections(predictions, detectedCount) {
    // Filter for arrow lock detections
    detections = Array.isArray(predictions) ? predictions : [];

    if (Array.isArray(detections) && detections.length > 0) {
        const filtered = detections.filter(pred => {
            const className = pred.class?.toLowerCase() || pred.class_name?.toLowerCase() || '';
            return className.includes('arrow') || className.includes('lock') ||
                   className === 'arrow-lock' || className === 'arrowlock';
        });

        // Use filtered results if we found specific matches, otherwise use all
        if (filtered.length > 0) {
            detections = filtered;
        }
    }

    // Use count from API if available, otherwise use detection length
    let finalCount = 0;
    if (detectedCount > 0) {
        // Use the count from the workflow
        finalCount = detectedCount;
    } else if (detections.length > 0) {
        // Use the number of detections
        finalCount = detections.length;
    } else {
        finalCount = 0;
    }

    console.log('Final detections count:', finalCount);

    // Display results with count overlay
    displayResults(detections, finalCount);
    drawDetections(detections);
}

// Draw bounding boxes on the canvas
function drawDetections(detections) {
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');
    
    // Redraw the original image
    ctx.drawImage(currentImage, 0, 0);
    
    // Draw each detection
    detections.forEach((detection, index) => {
        let x, y, width, height;
        
        // Handle different coordinate formats from Roboflow
        if (detection.x !== undefined && detection.y !== undefined) {
            // Center-based coordinates (x, y are center points)
            x = detection.x;
            y = detection.y;
            width = detection.width || detection.w;
            height = detection.height || detection.h;
            
            // Convert to top-left coordinates
            x = x - width / 2;
            y = y - height / 2;
        } else if (detection.x_center !== undefined) {
            // Center-based with explicit naming
            x = detection.x_center - (detection.width || detection.w) / 2;
            y = detection.y_center - (detection.height || detection.h) / 2;
            width = detection.width || detection.w;
            height = detection.height || detection.h;
        } else {
            // Top-left based coordinates
            x = detection.x_min || detection.x;
            y = detection.y_min || detection.y;
            width = (detection.x_max || detection.x + detection.width) - x;
            height = (detection.y_max || detection.y + detection.height) - y;
        }
        
        const confidence = detection.confidence || detection.conf || 0;
        const className = detection.class || detection.class_name || 'Arrow Lock';
        
        // Draw bounding box (vintage postal red)
        ctx.strokeStyle = '#c41e3a';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
        
        // Draw label background (postal navy)
        const label = `${className} ${(confidence * 100).toFixed(1)}%`;
        ctx.font = 'bold 14px "Playfair Display", serif';
        ctx.fillStyle = '#1a3a5f';
        const textMetrics = ctx.measureText(label);
        const textWidth = textMetrics.width;
        const textHeight = 22;
        
        ctx.fillRect(
            x,
            y - textHeight - 5,
            textWidth + 12,
            textHeight + 5
        );
        
        // Draw label border
        ctx.strokeStyle = '#c41e3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            x,
            y - textHeight - 5,
            textWidth + 12,
            textHeight + 5
        );
        
        // Draw label text
        ctx.fillStyle = '#faf8f3';
        ctx.fillText(
            label,
            x + 6,
            y - 8
        );
        
        // Draw detection number badge
        ctx.fillStyle = '#c41e3a';
        ctx.beginPath();
        ctx.arc(x + 15, y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1a3a5f';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#faf8f3';
        ctx.font = 'bold 16px "Playfair Display", serif';
        ctx.textAlign = 'center';
        ctx.fillText(
            (index + 1).toString(),
            x + 15,
            y + 25
        );
        ctx.textAlign = 'left';
    });
}

// Display detection results
function displayResults(detections, detectedCount) {
    const count = detectedCount || detections.length;
    const countDisplay = document.getElementById('count-display');
    const overlayCount = document.getElementById('overlay-count');
    const correctedCountInput = document.getElementById('corrected-count');
    
    // Update all count displays
    countDisplay.textContent = count;
    overlayCount.textContent = count;
    correctedCountInput.value = count;
    correctedCount = count;
    
    // Show the overlay on the image
    document.getElementById('count-overlay').style.display = 'block';
    
    // Show results section
    document.getElementById('results-section').style.display = 'block';
}

// Retake image - clear detection data and return to camera
function retakeImage() {
    // Clear all detection data
    currentImage = null;
    detections = [];
    correctedCount = 0;

    // Clear file input
    const fileInput = document.getElementById('file-input');
    fileInput.value = '';

    // Return to camera view
    backToCamera();
}

// Confirm the corrected count
async function confirmCount() {
    const correctedCountInput = document.getElementById('corrected-count');
    correctedCount = parseInt(correctedCountInput.value) || 0;

    // Update all displays
    document.getElementById('count-display').textContent = correctedCount;
    document.getElementById('overlay-count').textContent = correctedCount;

    // Update session statistics
    totalPictures++;
    totalLocks += correctedCount;
    saveSessionStats();
    updateStatsDisplay();

    // Save detection to Supabase database
    await saveDetectionToDatabase(lastDetectedCount, correctedCount);

    // Show confirmation message
    const confirmBtn = document.getElementById('confirm-btn');
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = '✓ CONFIRMED!';
    confirmBtn.style.background = '#10b981';

    console.log('Final arrow lock count:', correctedCount);
    console.log('Session stats - Pictures:', totalPictures, 'Total Locks:', totalLocks);

    // Return to camera view after 1 second
    setTimeout(() => {
        backToCamera();
    }, 1000);
}

// Save detection record to Supabase database
async function saveDetectionToDatabase(detectedCount, confirmedCount) {
    try {
        const firstName = localStorage.getItem('firstName');
        const postOffice = localStorage.getItem('postOffice');
        const userId = localStorage.getItem('userId');

        if (!firstName || !postOffice) {
            console.error('User info not found in localStorage');
            return;
        }

        const detectionData = {
            user_id: userId || null,
            first_name: firstName,
            location: postOffice,
            timestamp: new Date().toISOString(),
            detected_count: detectedCount,
            confirmed_count: confirmedCount
        };

        const { data, error } = await supabase
            .from('detections')
            .insert([detectionData])
            .select();

        if (error) {
            console.error('Error saving detection to database:', error);
        } else {
            console.log('Detection saved to database:', data);
        }
    } catch (error) {
        console.error('Database save error:', error);
    }
}

// Load session statistics from localStorage
function loadSessionStats() {
    const savedPictures = localStorage.getItem('totalPictures');
    const savedLocks = localStorage.getItem('totalLocks');

    totalPictures = savedPictures ? parseInt(savedPictures) : 0;
    totalLocks = savedLocks ? parseInt(savedLocks) : 0;

    updateStatsDisplay();
}

// Save session statistics to localStorage
function saveSessionStats() {
    localStorage.setItem('totalPictures', totalPictures.toString());
    localStorage.setItem('totalLocks', totalLocks.toString());
}

// Update stats display on screen
function updateStatsDisplay() {
    document.getElementById('total-pictures').textContent = totalPictures;
    document.getElementById('total-locks').textContent = totalLocks;
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

