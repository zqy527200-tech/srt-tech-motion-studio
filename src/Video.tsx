import React, {useEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from './scenes';
import {draw} from './mp4Export';

/** Browser preview uses the exact same canvas drawing routine as MP4 / PNG / MOV exports. */
export const TechVideo: React.FC<{scenes:Scene[]; transparent?:boolean}> = ({scenes,transparent=false}) => {
 const frame=useCurrentFrame();
 const {fps}=useVideoConfig();
 const canvasRef=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=canvasRef.current;
  const ctx=canvas?.getContext('2d',{alpha:true});
  if(ctx)draw(ctx,scenes,frame/fps,transparent);
 },[frame,fps,scenes,transparent]);
 return <AbsoluteFill style={{background:transparent?'transparent':'#050914'}}>
  <canvas ref={canvasRef} width={540} height={960} style={{width:'100%',height:'100%',display:'block'}} />
 </AbsoluteFill>;
};
