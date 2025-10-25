import { ImageProcessor } from './ImageProcessor.js';
import { Renderer } from './Renderer.js';
import { FileUtils } from './FileUtils.js';

// --- DOM Elements ---
const UIElements = {
    imageUpload: document.getElementById('imageUpload'),
    contrastSlider: document.getElementById('contrast'),
    brightnessSlider: document.getElementById('brightness'),
    pinsInput: document.getElementById('pinsCount'),
    linesInput: document.getElementById('maxLines'),
    generateBtn: document.getElementById('generateBtn'),
    progressBar: document.getElementById('progressBar'),
    downloadBtn: document.getElementById('downloadBtn'),
    sourceCanvas: document.getElementById('sourceCanvas'),
    resultCanvas: document.getElementById('resultCanvas'),
    linesCount: document.getElementById('linesCount'),
};

const SRC_SIZE = UIElements.sourceCanvas.width;

// --- Application State ---
const state = {
    originalImage: null,
    processedImageData: null,
    sequence: [],
    pins: [],
    worker: null,
    isGenerating: false,
};

// --- Event Handlers ---

/**
 * Loads and processes an image file.
 */
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        state.originalImage = await ImageProcessor.loadImage(file);
        updateSourcePreview();
    } catch (err) {
        console.error("Error loading image:", err);
        alert("Failed to load image.");
    }
}

/**
 * Re-applies processing when sliders change.
 */
function handleParamsChange() {
    if (!state.originalImage) return;
    updateSourcePreview();
}

/**
 * Starts or stops the string art generation worker.
 */
function handleGenerateClick() {
    if (state.isGenerating) {
        stopGeneration();
    } else {
        startGeneration();
    }
}

/**
 * Downloads the pin sequence as a TXT file.
 */
function handleDownloadClick() {
    if (state.sequence.length === 0) {
        alert("Please generate a sequence first.");
        return;
    }

    FileUtils.exportTXT(state.sequence, `string_art_sequence.txt`);
}

// --- Core Logic ---

/**
 * Uses ImageProcessor to create and display the source preview.
 */
function updateSourcePreview() {
    const contrast = parseFloat(UIElements.contrastSlider.value);
    const brightness = parseFloat(UIElements.brightnessSlider.value);

    const processedCanvas = ImageProcessor.processBase(
        state.originalImage,
        SRC_SIZE,
        contrast,
        brightness
    );

    // Draw to the source canvas
    const ctx = UIElements.sourceCanvas.getContext('2d');
    ctx.clearRect(0, 0, SRC_SIZE, SRC_SIZE);
    ctx.drawImage(processedCanvas, 0, 0);

    // Store the pixel data for the worker
    state.processedImageData = ctx.getImageData(0, 0, SRC_SIZE, SRC_SIZE);
}

/**
 * Initializes the web worker and sends it the image data.
 */
function startGeneration() {
    if (!state.processedImageData) {
        alert("Please load an image first.");
        return;
    }

    // Clear previous results
    Renderer.clear(UIElements.resultCanvas);
    UIElements.linesCount.textContent = "0 lines";
    UIElements.progressBar.value = 0;

    state.worker = new Worker('worker.js', { type: 'module' });
    state.worker.onmessage = handleWorkerMessage;

    const pinsCount = parseInt(UIElements.pinsInput.value);
    const maxLines = parseInt(UIElements.linesInput.value);

    const targetOptions = {
        edgeWeight: 0.3,
        intensityWeight: 0.7,
    };

    state.worker.postMessage({
        cmd: 'generate',
        imageData: state.processedImageData,
        pinsCount,
        maxLines,
        targetOptions,
    });

    setGeneratingState(true);
}

/**
 * Terminates the worker and resets the UI state.
 */
function stopGeneration() {
    if (!state.worker) return;

    state.worker.terminate();
    setGeneratingState(false);
}

/**
 * Handles messages (progress, done) from the web worker.
 */
function handleWorkerMessage(e) {
    const { type, progress, partial, full } = e.data;

    if (type === 'progress') {
        UIElements.progressBar.value = progress;
        // Render partial result
        if (partial && partial.seq.length > 0) {
            Renderer.draw(UIElements.resultCanvas, partial.pins, partial.seq);
            UIElements.linesCount.textContent = `${partial.seq.length} lines`;
        }
    } else if (type === 'done') {
        state.sequence = full.sequence;
        state.pins = full.pins;

        // Render final result
        Renderer.draw(UIElements.resultCanvas, state.pins, state.sequence);
        UIElements.linesCount.textContent = `${state.sequence.length} lines`;

        stopGeneration();
    }
}

/**
 * Toggles the UI state between "generating" and "idle".
 */
function setGeneratingState(isGenerating) {
    state.isGenerating = isGenerating;
    UIElements.generateBtn.textContent = isGenerating ? 'Stop' : 'Generate';
    UIElements.progressBar.value = isGenerating ? 0 : 100;

    [
        UIElements.imageUpload,
        UIElements.contrastSlider,
        UIElements.brightnessSlider,
        UIElements.pinsInput,
        UIElements.linesInput,
    ].forEach(el => el.disabled = isGenerating);
}

// --- Initial Setup ---
UIElements.imageUpload.addEventListener('change', handleImageUpload);
UIElements.contrastSlider.addEventListener('input', handleParamsChange);
UIElements.brightnessSlider.addEventListener('input', handleParamsChange);
UIElements.generateBtn.addEventListener('click', handleGenerateClick);
UIElements.downloadBtn.addEventListener('click', handleDownloadClick);