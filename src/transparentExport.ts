import JSZip from 'jszip';
import type {Scene} from './scenes';
import {draw} from './mp4Export';

/** Lossless RGBA PNG frames. The zip is ready for ProRes 4444 conversion. */
export async function exportTransparentFrames(scenes:Scene[], onProgress:(p:number)=>void):Promise<Blob>{
 if(!scenes.length) throw new Error('请先生成分镜');
 const fps=30, duration=Math.max(1,...scenes.map(s=>s.end));
 if(duration>30) throw new Error('透明 PNG 序列暂限 30 秒，请分段导出，避免浏览器内存不足。');
 const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw new Error('无法创建透明画布');
 const zip=new JSZip();const folder=zip.folder('frames')!;
 const count=Math.ceil(duration*fps);
 for(let i=0;i<count;i++){
  draw(ctx,scenes,i/fps,true);
  const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG 编码失败')),'image/png'));
  folder.file(`frame_${String(i+1).padStart(6,'0')}.png`,png);
  if(i%5===0){onProgress(Math.round(i/count*90));await new Promise<void>(r=>setTimeout(r,0));}
 }
 zip.file('README.txt','透明 PNG 帧序列：540x960 / 30fps / RGBA Alpha。解压后使用 FFmpeg 转 ProRes 4444 MOV。');
 const blob=await zip.generateAsync({type:'blob',compression:'STORE'},m=>onProgress(90+Math.round(m.percent/10)));
 onProgress(100);return blob;
}
