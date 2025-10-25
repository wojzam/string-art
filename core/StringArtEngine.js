/**
 * Simulates realistic string art internally at high resolution
 * Generates line sequence using greedy algorithm
 */

export class StringArtEngine {
    /**
     * @param {HTMLCanvasElement} sourceCanvas processed circular grayscale image
     * @param {Array<{x:number,y:number}>} pins array of pin positions
     * @param {number} maxLines maximum number of lines to generate
     * @param {number} scale internal resolution multiplier (e.g., 5x)
     * @param {Function} progressCallback callback(percent) to update progress
     */
    constructor(sourceCanvas, pins, maxLines=2000, scale=5, progressCallback=null){
        this.pins = pins;
        this.maxLines = maxLines;
        this.scale = scale;
        this.progressCallback = progressCallback;

        this.sourceCanvas = document.createElement('canvas');
        this.sourceCanvas.width = sourceCanvas.width*scale;
        this.sourceCanvas.height = sourceCanvas.height*scale;
        const ctx = this.sourceCanvas.getContext('2d');
        ctx.drawImage(sourceCanvas,0,0,this.sourceCanvas.width,this.sourceCanvas.height);

        const imgData = ctx.getImageData(0,0,this.sourceCanvas.width,this.sourceCanvas.height);
        this.width = this.sourceCanvas.width;
        this.height = this.sourceCanvas.height;
        this.targetPixels = new Float32Array(this.width*this.height);
        this.currentPixels = new Float32Array(this.width*this.height).fill(255); // white background

        // fill targetPixels
        for(let i=0;i<this.width*this.height;i++){
            this.targetPixels[i]=imgData.data[i*4]; // grayscale
        }

        // scale pins to internal resolution
        this.scaledPins = pins.map(p=>({x:p.x*scale, y:p.y*scale}));

        this.lineSequence = [];
    }

    /**
     * Compute all pixel coordinates along line using Bresenham
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @returns {Array<{x:number,y:number}>}
     */
    static getLinePixels(x0,y0,x1,y1){
        const pixels=[];
        const dx = Math.abs(x1-x0);
        const dy = Math.abs(y1-y0);
        const sx = x0<x1?1:-1;
        const sy = y0<y1?1:-1;
        let err = dx-dy;
        let x=x0, y=y0;
        while(true){
            pixels.push({x,y});
            if(x===x1 && y===y1) break;
            const e2 = 2*err;
            if(e2>-dy){ err-=dy; x+=sx;}
            if(e2<dx){ err+=dx; y+=sy;}
        }
        return pixels;
    }

    /**
     * Apply a line to currentPixels with very small strength
     * @param {Array<{x:number,y:number}>} linePixels
     * @param {number} strength amount to darken
     */
    applyLine(linePixels,strength=0.002){
        for(const p of linePixels){
            const idx = p.y*this.width + p.x;
            this.currentPixels[idx] = Math.max(0,this.currentPixels[idx]-strength*255);
        }
    }

    /**
     * Compute error reduction for a line
     * @param {Array<{x:number,y:number}>} linePixels
     */
    computeErrorReduction(linePixels){
        let reduction=0;
        for(const p of linePixels){
            const idx = p.y*this.width + p.x;
            reduction += Math.max(0,this.currentPixels[idx]-this.targetPixels[idx]);
        }
        return reduction;
    }

    /**
     * Generate full line sequence
     */
    generateSequence(){
        const nPins = this.scaledPins.length;
        const allLines=[];
        for(let i=0;i<nPins;i++){
            for(let j=i+1;j<nPins;j++){
                const line = StringArtEngine.getLinePixels(
                    Math.round(this.scaledPins[i].x),
                    Math.round(this.scaledPins[i].y),
                    Math.round(this.scaledPins[j].x),
                    Math.round(this.scaledPins[j].y)
                );
                allLines.push({from:i,to:j,pixels:line});
            }
        }

        for(let k=0;k<this.maxLines;k++){
            let bestLine=null;
            let bestReduction=-1;
            for(const line of allLines){
                const red = this.computeErrorReduction(line.pixels);
                if(red>bestReduction){
                    bestReduction=red;
                    bestLine=line;
                }
            }
            if(bestLine){
                this.applyLine(bestLine.pixels);
                this.lineSequence.push({from:bestLine.from,to:bestLine.to});
            }
            if(this.progressCallback && k%10===0){
                this.progressCallback(Math.floor(k/this.maxLines*100));
            }
        }
        if(this.progressCallback) this.progressCallback(100);
    }

    /**
     * Render final simulation to canvas
     * @param {number} displaySize size of output canvas
     * @returns {HTMLCanvasElement}
     */
    renderToCanvas(displaySize=800){
        const canvas = document.createElement('canvas');
        canvas.width = displaySize;
        canvas.height = displaySize;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(this.width,this.height);
        for(let i=0;i<this.width*this.height;i++){
            const v = Math.round(this.currentPixels[i]);
            imgData.data[i*4]=imgData.data[i*4+1]=imgData.data[i*4+2]=v;
            imgData.data[i*4+3]=255;
        }

        // draw at full internal resolution then scale down
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imgData,0,0);

        ctx.drawImage(tempCanvas,0,0,displaySize,displaySize);
        return canvas;
    }
}
