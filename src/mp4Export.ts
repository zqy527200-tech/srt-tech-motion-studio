import {Muxer, ArrayBufferTarget} from 'mp4-muxer';
import type {Scene} from './scenes';

const W=540, H=960, FPS=30;
const wait=()=>new Promise<void>(r=>setTimeout(r,0));
const cyan='#50e7ff', white='#eefaff', muted='#a7c5dc';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function line(ctx:CanvasRenderingContext2D,x:number,y:number,x2:number,y2:number,color=cyan,width=2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function label(ctx:CanvasRenderingContext2D,t:string,x:number,y:number,size=18,color=white,bold=false){ctx.fillStyle=color;ctx.font=`${bold?'bold ':''}${size}px "Microsoft YaHei",Arial,sans-serif`;ctx.fillText(t,x,y)}
function wrap(ctx:CanvasRenderingContext2D,t:string,maxWidth:number,maxLines=3){const out:string[]=[];let s='';for(const ch of Array.from(t)){if(ctx.measureText(s+ch).width>maxWidth&&s){out.push(s);s=ch}else s+=ch}if(s)out.push(s);return out.slice(0,maxLines)}
function dot(ctx:CanvasRenderingContext2D,x:number,y:number,r=4,color=cyan){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function panel(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,transparent:boolean){rr(ctx,x,y,w,h,14);ctx.fillStyle=transparent?'rgba(9,34,59,.70)':'#102a45';ctx.fill();ctx.strokeStyle='#3bdaff';ctx.lineWidth=1.5;ctx.stroke()}
function workflow(ctx:CanvasRenderingContext2D,t:number,transparent:boolean){
 const names=['输入','识别','处理','输出'];
 names.forEach((name,i)=>{const x=35+i*124;panel(ctx,x,570,97,91,transparent);label(ctx,name,x+48,610,18,white,true);label(ctx,String(i+1).padStart(2,'0'),x+48,638,12,muted);if(i<3){line(ctx,x+99,617,x+122,617,'#307c9c');const progress=clamp(t*1.4-i*.27);dot(ctx,x+99+23*progress,617,3)}});
 const active=Math.floor((t*1.3)%4);rr(ctx,35+active*124,570,97,91,14);ctx.strokeStyle='#e6ffff';ctx.lineWidth=3;ctx.stroke();
}
function chip(ctx:CanvasRenderingContext2D,t:number,transparent:boolean){
 const x=192,y=553,s=156;panel(ctx,x,y,s,s,transparent);rr(ctx,x+29,y+29,s-58,s-58,8);ctx.fillStyle='rgba(22,131,165,.35)';ctx.fill();ctx.strokeStyle='#8ef9ff';ctx.lineWidth=2;ctx.stroke();label(ctx,'AI',270,630,30,white,true);label(ctx,'CHIP',270,661,13,cyan);
 for(let i=0;i<8;i++){const p=565+i*18;line(ctx,x-24,p,x,p,'#4cc7e4');line(ctx,x+s,p,x+s+24,p,'#4cc7e4');}
 for(let i=0;i<7;i++){const p=x+16+i*21;line(ctx,p,y-22,p,y,'#4cc7e4');line(ctx,p,y+s,p,y+s+22,'#4cc7e4');}
 for(let i=0;i<8;i++){const phase=(t*.8+i/8)%1;const angle=i*Math.PI/4;const dx=Math.cos(angle),dy=Math.sin(angle);dot(ctx,270+dx*(92+phase*90),631+dy*(92+phase*90),3)}
}
function data(ctx:CanvasRenderingContext2D,t:number,transparent:boolean){
 panel(ctx,45,547,450,210,transparent);line(ctx,75,716,465,716,'#38738c');line(ctx,75,570,75,716,'#38738c');
 for(let i=0;i<9;i++){const h=30+Math.abs(Math.sin(i*.75+t*.85))*112;ctx.fillStyle=i%2===0?'rgba(67,220,255,.68)':'rgba(39,137,205,.55)';ctx.fillRect(93+i*40,716-h,23,h)}
 ctx.beginPath();for(let i=0;i<=100;i++){const x=84+i*3.7,y=632-34*Math.sin(i*.085+t*.9)-12*Math.cos(i*.19);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.strokeStyle='#c2ffff';ctx.lineWidth=2;ctx.stroke();
 for(let i=0;i<5;i++){const x=90+((t*55+i*91)%355);dot(ctx,x,632-34*Math.sin(((x-84)/3.7)*.085+t*.9)-12*Math.cos(((x-84)/3.7)*.19),3,'#fff')}
}
function network(ctx:CanvasRenderingContext2D,t:number,transparent:boolean){
 const pts:[[number,number],...[number,number][]]=[[270,633],[125,563],[410,563],[105,720],[435,720],[270,760],[270,522]];
 const edges:[[number,number],...[number,number][]]=[[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,3],[2,4],[3,5],[4,5]];
 edges.forEach(([a,b],i)=>{const [x,y]=pts[a],[xx,yy]=pts[b];line(ctx,x,y,xx,yy,'rgba(70,222,255,.55)',2);const p=(t*.55+i*.13)%1;dot(ctx,x+(xx-x)*p,y+(yy-y)*p,3,'#d5ffff')});
 pts.forEach(([x,y],i)=>{dot(ctx,x,y,i===0?22:12,'rgba(15,79,109,.95)');ctx.beginPath();ctx.arc(x,y,i===0?22:12,0,Math.PI*2);ctx.strokeStyle=cyan;ctx.lineWidth=2;ctx.stroke()});label(ctx,'AI',270,634,15,white,true);
}
export function draw(ctx:CanvasRenderingContext2D,scenes:Scene[],sec:number,transparent=false){
 ctx.clearRect(0,0,W,H);
 if(!scenes.length)return;
 if(!transparent){const bg=ctx.createRadialGradient(W/2,H/2,10,W/2,H/2,650);bg.addColorStop(0,'#10213b');bg.addColorStop(1,'#050914');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H)}
 const scene=scenes.find(s=>sec>=s.start&&sec<s.end)??scenes[scenes.length-1];
 const local=Math.max(0,sec-scene.start),dur=Math.max(.01,scene.end-scene.start),fade=clamp(Math.min(local/.35,(dur-local)/.3));
 ctx.save();ctx.globalAlpha=fade;ctx.textAlign='center';ctx.textBaseline='middle';
 label(ctx,`AI MOTION / ${String(scene.id).padStart(2,'0')}`,270,326,14,cyan);
 ctx.font='bold 37px "Microsoft YaHei",Arial,sans-serif';wrap(ctx,scene.keyword,460,2).forEach((s,i)=>label(ctx,s,270,390+i*44,37,white,true));
 ctx.font='18px "Microsoft YaHei",Arial,sans-serif';wrap(ctx,scene.text,450,3).forEach((s,i)=>label(ctx,s,270,476+i*30,18,muted));
 const t=local;
 switch(scene.type){case 'chip':chip(ctx,t,transparent);break;case 'data':data(ctx,t,transparent);break;case 'network':network(ctx,t,transparent);break;default:workflow(ctx,t,transparent)}
 ctx.restore();
 ctx.fillStyle=transparent?'rgba(45,125,150,.45)':'#28445f';ctx.fillRect(36,914,468,2);
 ctx.fillStyle=cyan;const duration=Math.max(1,...scenes.map(s=>s.end));ctx.fillRect(36,914,468*clamp(sec/duration),2);
}
export async function exportMp4(scenes:Scene[],onProgress:(percent:number)=>void):Promise<Blob>{
 if(!('VideoEncoder' in window))throw new Error('当前浏览器不支持 MP4 编码，请使用最新版 Chrome 或 Edge。');
 if(!scenes.length)throw new Error('请先生成分镜。');
 const duration=Math.max(1,...scenes.map(s=>s.end));
 if(duration>180)throw new Error('浏览器导出目前限制 3 分钟，请先分段导出。');
 const supported=await VideoEncoder.isConfigSupported({codec:'avc1.42001f',width:W,height:H,bitrate:2500000,framerate:FPS});
 if(!supported.supported)throw new Error('浏览器无法编码 H.264，请升级 Chrome 或 Edge。');
 const target=new ArrayBufferTarget();const muxer=new Muxer({target,video:{codec:'avc',width:W,height:H},fastStart:'in-memory',firstTimestampBehavior:'offset'});
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('无法创建画布');
 let encoderError:Error|undefined;
 const encoder=new VideoEncoder({output:(chunk,meta)=>muxer.addVideoChunk(chunk,meta),error:e=>{encoderError=e}});
 encoder.configure({codec:'avc1.42001f',width:W,height:H,bitrate:2500000,framerate:FPS,latencyMode:'quality'});
 try{const total=Math.ceil(duration*FPS);for(let i=0;i<total;i++){if(encoderError)throw encoderError;draw(ctx,scenes,i/FPS);const frame=new VideoFrame(canvas,{timestamp:Math.round(i*1000000/FPS),duration:Math.round(1000000/FPS)});encoder.encode(frame,{keyFrame:i%60===0});frame.close();if(i%10===0){onProgress(Math.round(i/total*100));await wait()}if(encoder.encodeQueueSize>20)await encoder.flush()}await encoder.flush();if(encoderError)throw encoderError;muxer.finalize();onProgress(100);return new Blob([target.buffer],{type:'video/mp4'})}finally{encoder.close()}
}
