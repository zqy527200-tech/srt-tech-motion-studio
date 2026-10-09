import {FFmpeg} from '@ffmpeg/ffmpeg';
import {toBlobURL} from '@ffmpeg/util';
import type {Scene} from './scenes';
import {draw} from './mp4Export';

const FPS=30, W=540, H=960;
const pause=()=>new Promise<void>(r=>setTimeout(r,0));

/** Experimental browser-only ProRes 4444 encoding; limited to short clips to avoid memory exhaustion. */
export async function exportTransparentMov(scenes:Scene[],onProgress:(n:number)=>void):Promise<Blob>{
 if(!scenes.length)throw new Error('请先生成分镜');
 const duration=Math.max(...scenes.map(s=>s.end));
 if(duration>8)throw new Error('浏览器透明 MOV 测试版暂限 8 秒。请先使用短 SRT 测试；长视频仍可用 PNG 序列 + Windows FFmpeg。');
 if(!navigator.onLine)throw new Error('首次使用需要联网加载 FFmpeg 编码组件。');
 const ffmpeg=new FFmpeg();
const coreURL='/ffmpeg/ffmpeg-core.js';
const wasmURL='/ffmpeg/ffmpeg-core.wasm';
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw new Error('无法创建透明画布');
 try{
  onProgress(1);
  await ffmpeg.load({
  coreURL: new URL(coreURL, window.location.origin).href,
  wasmURL: new URL(wasmURL, window.location.origin).href
});
  onProgress(12);
  const count=Math.ceil(duration*FPS);
  for(let i=0;i<count;i++){
   draw(ctx,scenes,i/FPS,true);
   const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG 帧编码失败')),'image/png'));
   await ffmpeg.writeFile(`frame_${String(i+1).padStart(6,'0')}.png`,new Uint8Array(await png.arrayBuffer()));
   if(i%5===0){onProgress(12+Math.round(i/count*48));await pause();}
  }
  onProgress(60);
  const result=await ffmpeg.exec(['-y','-framerate',String(FPS),'-start_number','1','-i','frame_%06d.png','-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','-alpha_bits','16','-vendor','apl0','transparent_animation.mov']);
  if(result!==0)throw new Error('当前浏览器 FFmpeg 内核无法生成 ProRes 4444（可能未包含 prores_ks 编码器）。请继续使用 PNG 序列 + Windows 转换方式。');
  const data=await ffmpeg.readFile('transparent_animation.mov');
  if(typeof data==='string'||data.byteLength===0)throw new Error('MOV 编码结果为空');
  onProgress(100);
  return new Blob([new Uint8Array(data)],{type:'video/quicktime'});
 }catch(e){
  if(e instanceof Error)throw e;
  throw new Error(`MOV 编码失败：${String(e)}`);
 }finally{try{ffmpeg.terminate()}catch{/* ignore */}}
}
