import {FFmpeg} from '@ffmpeg/ffmpeg';
import {toBlobURL} from '@ffmpeg/util';
import type {Scene} from './scenes';
import {draw} from './mp4Export';

const FPS=30, W=540, H=960, SEGMENT_SECONDS=5, MAX_SECONDS=30;
const CORE='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js';
const WASM='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm';
const yieldUI=()=>new Promise<void>(r=>setTimeout(r,0));

// ZIP "stored" entries (no compression): MOV is already compressed.
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function makeZip(entries:{name:string;data:Uint8Array}[]):Blob{
 const encoder=new TextEncoder();const parts:BlobPart[]=[];const central:Uint8Array[]=[];let offset=0;
 for(const {name,data} of entries){const filename=encoder.encode(name);const crc=crc32(data);const local=new Uint8Array(30+filename.length);const lv=new DataView(local.buffer);
  lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(8,0,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,filename.length,true);local.set(filename,30);
  parts.push(local,data);const cd=new Uint8Array(46+filename.length);const cv=new DataView(cd.buffer);
  cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,filename.length,true);cv.setUint32(42,offset,true);cd.set(filename,46);central.push(cd);offset+=local.length+data.length;
 }
 const centralSize=central.reduce((n,p)=>n+p.length,0);const end=new Uint8Array(22);const ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
 return new Blob([...parts,...central,end],{type:'application/zip'});
}

export async function exportLongTransparentMov(scenes:Scene[],onProgress:(n:number)=>void):Promise<Blob>{
 if(!scenes.length)throw new Error('请先生成分镜');
 const duration=Math.max(...scenes.map(s=>s.end));
 if(duration>MAX_SECONDS)throw new Error(`长视频测试版暂限 ${MAX_SECONDS} 秒，请将 SRT 分成多份。`);
 if(!navigator.onLine)throw new Error('首次导出需要联网加载 FFmpeg。');
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw new Error('无法创建透明画布');
 const ffmpeg=new FFmpeg();const entries:{name:string;data:Uint8Array}[]=[];
 try{
  onProgress(1);
  await ffmpeg.load({coreURL:await toBlobURL(CORE,'text/javascript'),wasmURL:await toBlobURL(WASM,'application/wasm')});
  const totalFrames=Math.ceil(duration*FPS);const segmentFrames=SEGMENT_SECONDS*FPS;
  const count=Math.ceil(totalFrames/segmentFrames);
  const notes=['透明 MOV 分段文件','每段按原视频绝对时间定位到剪映时间线。','画面分辨率 540×960，30 FPS。',''];
  for(let segment=0;segment<count;segment++){
   const startFrame=segment*segmentFrames;const n=Math.min(segmentFrames,totalFrames-startFrame);
   const names:string[]=[];const output=`segment_${String(segment+1).padStart(2,'0')}.mov`;
   try{
    for(let i=0;i<n;i++){
     draw(ctx,scenes,(startFrame+i)/FPS,true);
     const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG 帧编码失败')),'image/png'));
     const name=`frame_${String(i+1).padStart(6,'0')}.png`;names.push(name);
     await ffmpeg.writeFile(name,new Uint8Array(await blob.arrayBuffer()));
     if(i%5===0){onProgress(Math.min(95,Math.round(((startFrame+i)/totalFrames)*95)));await yieldUI();}
    }
    const result=await ffmpeg.exec(['-y','-framerate',String(FPS),'-start_number','1','-i','frame_%06d.png','-frames:v',String(n),'-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','-alpha_bits','16','-vendor','apl0',output]);
    if(result!==0)throw new Error(`第 ${segment+1} 段 ProRes 编码失败，请先尝试短 MOV 导出。`);
    const bytes=await ffmpeg.readFile(output);if(typeof bytes==='string'||bytes.byteLength===0)throw new Error('MOV 输出为空');
    entries.push({name:output,data:new Uint8Array(bytes)});
    notes.push(`${output}  放置时间：${(startFrame/FPS).toFixed(3)} 秒  时长：${(n/FPS).toFixed(3)} 秒`);
   }finally{
    for(const name of names){try{await ffmpeg.deleteFile(name)}catch{/* cleanup */}}
    try{await ffmpeg.deleteFile(output)}catch{/* cleanup */}
   }
  }
  entries.push({name:'使用说明.txt',data:new TextEncoder().encode(notes.join('\r\n'))});
  onProgress(100);return makeZip(entries);
 }finally{try{ffmpeg.terminate()}catch{/* cleanup */}}
}

