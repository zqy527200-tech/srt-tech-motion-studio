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


function drawVisualElements(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  t: number,
  transparent: boolean
) {
  const elements = (scene.visualElements ?? [])
    .filter((s): s is string => typeof s === 'string' && !!s.trim())
    .slice(0, 4);

  if (!elements.length) return;

  const count = elements.length;
  const boxW = count === 2 ? 172 : count === 3 ? 138 : 112;
  const gap = count === 2 ? 34 : count === 3 ? 18 : 10;
  const totalW = count * boxW + (count - 1) * gap;
  const startX = (540 - totalW) / 2;
  const y = 780;
  const boxH = 58;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  elements.forEach((element, i) => {
    const appear = clamp((t - i * 0.22) / 0.45);
    if (appear <= 0) return;

    const x = startX + i * (boxW + gap);
    const rise = (1 - appear) * 18;

    ctx.save();
    ctx.globalAlpha *= appear;

    panel(ctx, x, y + rise, boxW, boxH, transparent);

    const text = element.slice(0, 9);
    const fontSize = count >= 4 ? 13 : 15;
    label(
      ctx,
      text,
      x + boxW / 2,
      y + rise + boxH / 2,
      fontSize,
      white,
      true
    );

    ctx.restore();
  });

  // 节点之间依次建立连接
  for (let i = 0; i < count - 1; i++) {
    const progress = clamp((t - 0.25 - i * 0.22) / 0.4);
    if (progress <= 0) continue;

    const x1 = startX + i * (boxW + gap) + boxW;
    const x2 = x1 + gap;
    const yy = y + boxH / 2;

    line(ctx, x1, yy, x1 + (x2 - x1) * progress, yy, cyan, 2);

    if (scene.motion === 'flow' && progress >= 1) {
      const p = (t * 0.9 + i * 0.2) % 1;
      dot(ctx, x1 + (x2 - x1) * p, yy, 3, white);
    }
  }

  ctx.restore();
}
function aiEffects(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  t: number
) {
  const motion = scene.motion ?? 'flow';
  const cx = 270;
  const cy = 650;

  ctx.save();

  if (motion === 'pulse') {
    const phase = (t * 0.7) % 1;

    for (let i = 0; i < 3; i++) {
      const p = (phase + i / 3) % 1;

      ctx.beginPath();
      ctx.arc(cx, cy, 45 + p * 175, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(80,231,255,${0.35 * (1 - p)})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  if (motion === 'flow') {
    for (let i = 0; i < 18; i++) {
      const p = (t * 0.45 + i / 18) % 1;
      const x = 45 + p * 450;
      const y = 785 + Math.sin(p * 12 + i) * 18;

      dot(ctx, x, y, 2 + 2 * (1 - p), cyan);
    }
  }

  if (motion === 'expand') {
    const p = clamp(t / 1.2);
    const r = 35 + p * 175;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(80,231,255,${0.55 * (1 - p)})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (motion === 'connect') {
    const points = [
      [120, 805],
      [220, 775],
      [320, 805],
      [420, 775]
    ];

    points.forEach(([x, y], i) => {
      if (i > 0) {
        const [px, py] = points[i - 1];
        const progress = clamp(t * 1.4 - (i - 1) * 0.35);

        line(
          ctx,
          px,
          py,
          px + (x - px) * progress,
          py + (y - py) * progress,
          cyan,
          2
        );
      }

      if (t > i * 0.35) {
        dot(ctx, x, y, 6, cyan);
      }
    });
  }

  if (motion === 'sequence') {
    for (let i = 0; i < 4; i++) {
      const p = clamp(t * 1.5 - i * 0.45);

      ctx.globalAlpha = p;
      rr(ctx, 70 + i * 105, 785, 85, 42, 8);
      ctx.fillStyle = 'rgba(80,231,255,.18)';
      ctx.fill();
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      label(
        ctx,
        String(i + 1).padStart(2, '0'),
        112 + i * 105,
        806,
        17,
        white,
        true
      );
    }
  }

  ctx.restore();

  if (scene.highlight) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const scale = 1 + 0.04 * Math.sin(t * 4);
    ctx.translate(cx, 858);
    ctx.scale(scale, scale);

    ctx.font = 'bold 27px "Microsoft YaHei",Arial,sans-serif';

    const text = scene.highlight.slice(0, 12);
    const width = Math.min(440, ctx.measureText(text).width + 46);

    rr(ctx, -width / 2, -24, width, 48, 12);
    ctx.fillStyle = 'rgba(10,55,82,.88)';
    ctx.fill();
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    label(ctx, text, 0, 0, 27, white, true);
    ctx.restore();
  }
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
 drawVisualElements(ctx,scene,t,transparent);
 aiEffects(ctx,scene,t);
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
