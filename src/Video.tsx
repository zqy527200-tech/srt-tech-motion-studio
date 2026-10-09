import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from './scenes';

export const TechVideo: React.FC<{scenes: Scene[]; transparent?: boolean}> = ({scenes, transparent = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const scene = scenes.find((s) => seconds >= s.start && seconds < s.end) ?? scenes[scenes.length-1];
  const local = Math.max(0, seconds - scene.start);
  const pulse = interpolate(Math.sin(frame/8), [-1,1], [0.78,1.08]);
  const fade = interpolate(local, [0, .4, Math.max(.5, scene.end-scene.start-.35), scene.end-scene.start], [0,1,1,0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  const nodes = scene.type === 'workflow' ? ['识别','拆解','生成','输出'] : scene.type === 'chip' ? ['输入','计算','推理','结果'] : scene.type === 'data' ? ['数据','模型','分析','洞察'] : ['连接','协同','反馈','进化'];
  return <AbsoluteFill style={{background: transparent ? 'transparent' : 'radial-gradient(ellipse at center, #10213b 0%, #050914 70%)', color:'#f2fbff', fontFamily:'Arial, "Microsoft YaHei", sans-serif', overflow:'hidden', opacity:fade}}>
    <AbsoluteFill style={{justifyContent:'center',alignItems:'center',padding:54}}>
      <div style={{fontSize:22,letterSpacing:7,color:'#65e8ff',textTransform:'uppercase',marginBottom:35}}>AI WORKFLOW / {String(scene.id).padStart(2,'0')}</div>
      <div style={{fontSize:58,fontWeight:800,lineHeight:1.22,textAlign:'center',textShadow:'0 0 30px #20cfff66',maxWidth:850}}>{scene.keyword}</div>
      <div style={{fontSize:27,color:'#b7cde3',textAlign:'center',marginTop:24,lineHeight:1.5,maxWidth:820}}>{scene.text}</div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginTop:65,transform:`scale(${pulse})`}}>
        {nodes.map((node,i)=><React.Fragment key={node}><div style={{width:132,height:98,border:'1px solid #46dfff',borderRadius:16,background:'linear-gradient(145deg,#122a45cc,#07121dcc)',boxShadow:'0 0 22px #14cfff2b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700,color:i===scene.id%4?'#b7fffb':'#d5eaff'}}>{node}</div>{i<nodes.length-1&&<div style={{width:20,height:2,background:'#46dfff',boxShadow:'0 0 10px #46dfff'}}/>}</React.Fragment>)}
      </div>
      <div style={{position:'absolute',bottom:54,left:70,right:70,height:2,background:'#28445f'}}><div style={{height:'100%',width:`${Math.min(100,seconds/Math.max(1,scenes[scenes.length-1].end)*100)}%`,background:'#50e7ff',boxShadow:'0 0 14px #50e7ff'}}/></div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
