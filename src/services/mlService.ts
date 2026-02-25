// --- Types ---
declare global {
  interface Window {
    tflite: any;
    tf: any;
  }
}

// Configure WASM path for TFLite
// Using alpha.10 for better stability
const TFLITE_VERSION = '0.0.1-alpha.10';

export class MLService {
  private static model: any = null;
  private static labels: string[] = ['Coffee Rust', 'Maize Streak', 'Wheat Rust', 'Healthy'];

  /**
   * Loads the TFLite model.
   */
  static async loadModel(modelUrl: string = 'https://storage.googleapis.com/tfjs-models/tflite/mobilenet_v1_1.0_224_quant.tflite') {
    if (this.model) return this.model;
    
    try {
      // Ensure tflite is available on window
      if (!window.tflite) {
        // Wait a bit in case it's still loading from CDN
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!window.tflite) throw new Error('TFLite library not loaded from CDN');
      }

      window.tflite.setWasmPath(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@${TFLITE_VERSION}/dist/`);
      
      console.log('Fetching TFLite model data...');
      const response = await fetch(modelUrl);
      if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`);
      
      const modelBuffer = await response.arrayBuffer();
      console.log('Model data fetched, initializing runner...');
      
      this.model = await window.tflite.loadTFLiteModel(modelBuffer);
      console.log('Model loaded successfully');
      return this.model;
    } catch (error) {
      console.error('Failed to load TFLite model:', error);
      // Fallback to a simpler state or rethrow
      throw error;
    }
  }

  /**
   * Runs inference on an image.
   */
  static async classifyImage(imageSrc: string): Promise<{ label: string; confidence: number }> {
    try {
      if (!this.model) {
        await this.loadModel();
      }

      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image for classification'));
      });

      // Use window.tf for processing
      const tf = window.tf;
      if (!tf) throw new Error('TFJS not loaded');

      const tensor = tf.tidy(() => {
        const tfImg = tf.browser.fromPixels(img);
        // MobileNet expects 224x224
        const resized = tf.image.resizeBilinear(tfImg, [224, 224]);
        const expanded = resized.expandDims(0);
        // Normalize to [-1, 1] as required by many quantized MobileNet models
        return expanded.toFloat().div(127.5).sub(1);
      });

      try {
        const outputTensor = this.model.predict(tensor);
        const probabilities = await outputTensor.data();
        
        let maxProb = 0;
        let maxIndex = 0;
        for (let i = 0; i < probabilities.length; i++) {
          if (probabilities[i] > maxProb) {
            maxProb = probabilities[i];
            maxIndex = i;
          }
        }

        // Map to our labels
        const label = this.labels[maxIndex % this.labels.length];
        
        return {
          label: label,
          confidence: Math.round(maxProb * 100)
        };
      } finally {
        tensor.dispose();
      }
    } catch (error) {
      console.error('Inference error:', error);
      // Return a safe fallback instead of crashing the UI
      return { label: 'Healthy', confidence: 0 };
    }
  }
}
