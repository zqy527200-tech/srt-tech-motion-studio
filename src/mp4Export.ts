import {Muxer, ArrayBufferTarget} from 'mp4-muxer';
import type {Scene} from './scenes';

const W=540, H=960, FPS=30;
const wait = () => new Promise<void>(r=>setTimeout(r,0));
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function textLines(ctx:CanvasRenderingContext2D,text:string,maxWidth:number,maxLines=4){
 const chars=Array.from(text); const lines:string[]=[];let line='';
 for(const c of chars){if(ctx.measureText(line+c).width>maxWidth&&line){lines.push(line);line=c}else line+=c;}
 if(line)lines.push(line);return lines.slice(0,maxLines);
}
export function draw(ctx:CanvasRenderingContext2D,scenes:Scene[],sec:number,transparent=false){
 const scene=scenes.find(s=>sec>=s.start&&sec<s.end)??scenes[scenes.length-1];
 const local=Math.max(0,sec-scene.start),dur=scene.end-scene.start;
 const fade=Math.min(1,local/.4,Math.max(0,(dur-local)/.35));
 ctx.clearRect(0,0,W,H);
if(!transparent){
 const bg=ctx.createRadialGradient(W/2,H/2,10,W/2,H/2,650);
 bg.addColorStop(0,'#10213b');
 bg.addColorStop(1,'#050914');
 ctx.fillStyle=bg;
 ctx.fillRect(0,0,W,H);
}
 ctx.save();ctx.globalAlpha=Math.max(0,fade);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#65e8ff';ctx.font='12px monospace';ctx.fillText(`AI WORKFLOW / ${String(scene.id).padStart(2,'0')}`,W/2,330);
 ctx.font='bold 36px "Microsoft YaHei",sans-serif';ctx.fillStyle='#f2fbff';
 textLines(ctx,scene.keyword,440,3).forEach((line,i)=>ctx.fillText(line,W/2,390+i*44));
 ctx.font='18px "Microsoft YaHei",sans-serif';ctx.fillStyle='#b7cde3';
 textLines(ctx,scene.text,440,4).forEach((line,i)=>ctx.fillText(line,W/2,470+i*30));
 const nodes=scene.type==='workflow'?['识别','拆解','生成','输出']:scene.type==='chip'?['输入','计算','推理','结果']:scene.type==='data'?['数据','模型','分析','洞察']:['连接','协同','反馈','进化'];
 const pulse=1+.025*Math.sin(sec*5);ctx.translate(W/2,620);ctx.scale(pulse,pulse);ctx.translate(-W/2,-620);
 nodes.forEach((node,i)=>{const x=31+i*124;rounded(ctx,x,595,105,65,9);ctx.fillStyle=transparent?'rgba(16,42,69,0.72)':'#102a45';ctx.fill();ctx.strokeStyle='#46dfff';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#e1faff';ctx.font='bold 17px "Microsoft YaHei",sans-serif';ctx.fillText(node,x+52,628);if(i<3){ctx.fillStyle='#46dfff';ctx.fillRect(x+106,626,18,2)}});
 ctx.restore();ctx.fillStyle='#28445f';ctx.fillRect(36,914,468,2);ctx.fillStyle='#50e7ff';ctx.fillRect(36,914,468*Math.min(1,sec/Math.max(1,scenes[scenes.length-1].end)),2);
}
export async function exportMp4(scenes:Scene[],onProgress:(percent:number)=>void):Promise<Blob>{
 if(!('VideoEncoder' in window))throw new Error('当前浏览器不支持 MP4 编码，请使用最新版 Chrome 或 Edge。');
 if(!scenes.length)throw new Error('请先生成分镜。');
 const duration=Math.max(1,scenes[scenes.length-1].end);
 if(duration>180)throw new Error('浏览器导出目前限制 3 分钟，请先分段导出。');
 const supported=await VideoEncoder.isConfigSupported({codec:'avc1.42001f',width:W,height:H,bitrate:2500000,framerate:FPS});
 if(!supported.supported)throw new Error('浏览器无法编码 H.264，请升级 Chrome 或 Edge。');
 const target=new ArrayBufferTarget();const muxer=new Muxer({target,video:{codec:'avc',width:W,height:H},fastStart:'in-memory',firstTimestampBehavior:'offset'});
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法创建画布');
 let encoderError:Error|undefined;
 const encoder=new VideoEncoder({output:(chunk,meta)=>muxer.addVideoChunk(chunk,meta),error:e=>{encoderError=e}});
 encoder.configure({codec:'avc1.42001f',width:W,height:H,bitrate:2500000,framerate:FPS,latencyMode:'quality'});
 try{
 const total=Math.ceil(duration*FPS);
 for(let i=0;i<total;i++){
  if(encoderError)throw encoderError;
  draw(ctx,scenes,i/FPS);
  const frame=new VideoFrame(canvas,{timestamp:Math.round(i*1000000/FPS),duration:Math.round(1000000/FPS)});
  encoder.encode(frame,{keyFrame:i%60===0});frame.close();
  if(i%10===0){onProgress(Math.round(i/total*100));await wait()}
  if(encoder.encodeQueueSize>20)await encoder.flush();
 }
 await encoder.flush();if(encoderError)throw encoderError;muxer.finalize();onProgress(100);
 return new Blob([target.buffer],{type:'video/mp4'});
 }finally{encoder.close()}
}
