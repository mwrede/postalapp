# Mailbox Arrow Lock Detector

A web application that uses Roboflow Inference.js to detect and count arrow locks on mailboxes from uploaded or camera-captured images.

## Features

- 📷 Take photos directly from your device camera
- 📁 Upload images from your device
- 🔍 Real-time arrow lock detection using Roboflow
- 📊 Visual bounding boxes showing detected locks
- 🔢 Automatic counting of detected arrow locks
- 📱 Responsive design for mobile and desktop

## Setup Instructions

### 1. Get Your Roboflow API Key

1. Sign up or log in to [Roboflow](https://roboflow.com)
2. Go to your account settings
3. Copy your **Publishable API Key**

### 2. Train or Use a Model

You have two options:

**Option A: Use an existing model**
- If you already have a trained model for arrow lock detection, note down:
  - Your model ID (e.g., `mailbox-arrow-locks`)
  - Your model version (e.g., `1`)

**Option B: Train a new model**
1. Collect images of mailboxes with arrow locks
2. Upload them to Roboflow
3. Annotate the arrow locks in each image
4. Train a custom object detection model
5. Deploy the model and get your model ID and version

### 3. Configure the Application

1. Open `app.js`
2. Replace `YOUR_API_KEY_HERE` with your Roboflow Publishable API Key
3. Replace `YOUR_MODEL_ID/YOUR_MODEL_VERSION` with your model information
   - Example: `"mailbox-arrow-locks/1"`

```javascript
const ROBOFLOW_API_KEY = "your-actual-api-key";
const ROBOFLOW_MODEL = "your-model-id/your-model-version";
```

### 4. Adjust Class Names (if needed)

If your model uses different class names for arrow locks, update the filtering logic in the `detectArrowLocks` function in `app.js`:

```javascript
detections = predictions.filter(pred => {
    const className = pred.class?.toLowerCase() || '';
    // Adjust these conditions based on your model's class names
    return className.includes('arrow') || className.includes('lock');
});
```

### 5. Run the Application

**Option A: Simple HTTP Server (Python)**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B: Node.js HTTP Server**
```bash
npx http-server
```

**Option C: VS Code Live Server**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

Then open your browser and navigate to `http://localhost:8000` (or the port shown by your server).

## Usage

1. Click **"Take Photo"** to capture an image using your device camera, or
2. Click **"Upload Image"** to select an image from your device
3. Once the image is displayed, click **"Detect Arrow Locks"**
4. The app will process the image and display:
   - Bounding boxes around detected arrow locks
   - A count of the total number of arrow locks found
   - Confidence scores for each detection

## Troubleshooting

### "Roboflow is not initialized"
- Check that your API key is correctly set in `app.js`
- Ensure you're using a valid Publishable API Key (not a Private API Key)

### "Detection failed" or "Model not found"
- Verify your model ID and version are correct
- Ensure your model is deployed and accessible via the API
- Check that your API key has access to the model

### No detections found
- Try images with better lighting and clearer views of the mailbox
- Verify your model was trained on similar images
- Check the class name filtering in `app.js` matches your model's class names
- Consider using all predictions if class filtering is too strict

### Camera not working
- Ensure you've granted camera permissions to your browser
- Try using the "Upload Image" option instead
- Some browsers may require HTTPS for camera access

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may require HTTPS for camera)
- Mobile browsers: Supported

## Notes

- The application runs entirely in the browser - no backend server required
- Images are processed locally and not uploaded to any server
- For best results, use clear, well-lit images of mailboxes
- The detection accuracy depends on the quality of your trained model

## License

This project is open source and available for personal and commercial use.

# postalapp
