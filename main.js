import { ImageProcessor } from './core/ImageProcessor.js';
import { PinsGenerator } from './core/PinsGenerator.js';
import { StringArtEngine } from './core/StringArtEngine.js';
import { FileUtils } from './utils/FileUtils.js';

const fileInput=document.getElementById('fileInput');
const pinCountInput=document.getElementById('pinCount');
const maxLinesInput=document.getElementById('maxLines');
const contrastInput=document.getElementById('contrast');
const brightnessInput=document.getElementById('brightness');
const processBtn=document.getElementById('processBtn');
const exportCsvBtn=document.getElementById('exportCsvBtn');
const exportPngBtn=document.getElementById('exportPngBtn');
const progressBar=document.getElementById('progressBar');

const canvasLow=document.getElementById('canvasLow');
const canvasMedium=document.getElementById('canvasMedium');
const canvasHigh=document.getElementById('canvasHigh');

let loadedImage=null;
let processedCanvas=null;
let lineSequence=[];

fileInput.addEventListener('change',async ()=>{
    if(fileInput.files.length===0) return;
    loadedImage = await ImageProcessor.loadImage(fileInput.files[0]);
});

processBtn.addEventListener('click',async ()=>{
    if(!loadedImage){alert("Please load image");return;}
    const pinsCount=parseInt(pinCountInput.value);
    const maxLines=parseInt(maxLinesInput.value);
    const contrast=parseFloat(contrastInput.value);
    const brightness=parseFloat(brightnessInput.value);

    const size=800;
    processedCanvas = ImageProcessor.process(loadedImage,size,contrast,brightness);
    const pins = PinsGenerator.generate(size/2,size/2,size/2-2,pinsCount);

    const engine = new StringArtEngine(processedCanvas,pins,maxLines,5,(p)=>{
        progressBar.value=p;
    });

    setTimeout(()=>{
        engine.generateSequence();

        lineSequence=engine.lineSequence;

        // render 3 quality variants
        const lowCanvas=engine.renderToCanvas(size);
        const medCanvas=engine.renderToCanvas(size);
        const highCanvas=engine.renderToCanvas(size);

        // simulate trimming for quality
        const trimLow=Math.floor(lineSequence.length*0.25);
        const trimMed=Math.floor(lineSequence.length*0.5);
        engine.lineSequence=lineSequence.slice(0,trimLow);
        const canvasL=engine.renderToCanvas(size);
        engine.lineSequence=lineSequence.slice(0,trimMed);
        const canvasM=engine.renderToCanvas(size);
        engine.lineSequence=lineSequence;
        const canvasH=engine.renderToCanvas(size);

        [canvasLow,canvasMedium,canvasHigh].forEach((c,idx)=>{
            const ctx=c.getContext('2d');
            ctx.clearRect(0,0,c.width,c.height);
        });
        canvasLow.getContext('2d').drawImage(canvasL,0,0);
        canvasMedium.getContext('2d').drawImage(canvasM,0,0);
        canvasHigh.getContext('2d').drawImage(canvasH,0,0);
    },10);
});

exportCsvBtn.addEventListener('click',()=>{
    if(!lineSequence.length){alert("Generate first");return;}
    FileUtils.exportCSV(lineSequence);
});
exportPngBtn.addEventListener('click',()=>{
    if(!canvasHigh){alert("Generate first");return;}
    FileUtils.exportPNG(canvasHigh);
});
