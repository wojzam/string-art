import { ImageProcessor } from './core/ImageProcessor.js';
import { PinsGenerator } from './core/PinsGenerator.js';
import { FileUtils } from './utils/FileUtils.js';

const fileInput = document.getElementById('fileInput');
const pinCountInput = document.getElementById('pinCount');
const maxLinesInput = document.getElementById('maxLines');
const contrastInput = document.getElementById('contrast');
const brightnessInput = document.getElementById('brightness');
const generateBtn = document.getElementById('generateBtn');
const progressBar = document.getElementById('progressBar');

const canvasTarget = document.getElementById('canvasTarget');
const canvasLow = document.getElementById('canvasLow');
const canvasMedium = document.getElementById('canvasMedium');
const canvasHigh = document.getElementById('canvasHigh');
const qualitySelect = document.getElementById('qualitySelect');
const exportCsvBtn = document.getElementById('exportCsvBtn');

let loadedImage = null;
let processedCanvas = null;
let pins = [], lineSequence = [];
let worker = null;

async function updatePreview() {
    if (!loadedImage) return;
    processedCanvas = ImageProcessor.process(loadedImage, 400,
        parseFloat(contrastInput.value), parseFloat(brightnessInput.value));
    const ctx = canvasTarget.getContext('2d');
    ctx.clearRect(0, 0, 400, 400);
    ctx.drawImage(processedCanvas, 0, 0);
}

fileInput.addEventListener('change', async () => {
    if (fileInput.files.length === 0) return;
    loadedImage = await ImageProcessor.loadImage(fileInput.files[0]);
    await updatePreview();
});

contrastInput.addEventListener('input', updatePreview);
brightnessInput.addEventListener('input', updatePreview);

generateBtn.addEventListener('click', () => {
    if (!processedCanvas) { alert("Load image first"); return; }
    if (worker) { worker.terminate(); worker = null; } // stop previous generation

    const pinsCount = parseInt(pinCountInput.value);
    const maxLines = parseInt(maxLinesInput.value);
    pins = PinsGenerator.generate(200, 200, 198, pinsCount);

    const ctx = processedCanvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);

    worker = new Worker('worker.js');
    worker.postMessage({ cmd: 'start', imageData, pins, maxLines, scale: 5 });

    worker.onmessage = function (e) {
        if (e.data.type === 'progress') {
            progressBar.value = e.data.value;
            lineSequence = e.data.sequence;
            renderAllVariants(lineSequence);
        } else if (e.data.type === 'done') {
            lineSequence = e.data.sequence;
            renderAllVariants(lineSequence);
        }
    }
});

function renderAllVariants(seq) {
    renderVariant(seq.slice(0, Math.floor(seq.length * 0.25)), canvasLow, pins);
    renderVariant(seq.slice(0, Math.floor(seq.length * 0.5)), canvasMedium, pins);
    renderVariant(seq, canvasHigh, pins);
}

function renderVariant(seq, canvas, pins) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    seq.forEach(l => {
        const p1 = pins[l.from];
        const p2 = pins[l.to];
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
    });
    ctx.stroke();
}

exportCsvBtn.addEventListener('click', () => {
    const selected = qualitySelect.value;
    let seq = [];
    if (selected === 'low') seq = lineSequence.slice(0, Math.floor(lineSequence.length * 0.25));
    else if (selected === 'medium') seq = lineSequence.slice(0, Math.floor(lineSequence.length * 0.5));
    else seq = lineSequence;
    FileUtils.exportCSV(seq);
});
