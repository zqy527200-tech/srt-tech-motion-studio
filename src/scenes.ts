export type Scene = { id: number; start: number; end: number; text: string; keyword: string; type: 'workflow'|'chip'|'data'|'network' };

export const parseSrt = (srt: string): Scene[] => {
  const blocks = srt.replace(/\r/g, '').trim().split(/\n\s*\n/);
  const rows: Scene[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((x) => x.trim()).filter(Boolean);
    const timeLine = lines.find((x) => x.includes('-->'));
    if (!timeLine) continue;
    const [a,b] = timeLine.split('-->').map((x) => x.trim().split(/[ ,]/)[0]);
    const toSec = (v: string) => { const m = v.match(/(\d+):(\d+):(\d+)[,.](\d+)/); return m ? +m[1]*3600 + +m[2]*60 + +m[3] + +(m[4].padEnd(3,'0').slice(0,3))/1000 : 0; };
    const text = lines.filter((x) => x !== timeLine && !/^\d+$/.test(x)).join(' ').replace(/<[^>]+>/g,'');
    if (!text) continue;
    const keyword = /芯片|硬件|处理器/.test(text) ? '芯片结构' : /数据|算力|模型|算法/.test(text) ? '数据流' : /流程|步骤|工作流|选题|拆解|写稿|配音|数字人|动画|批量/.test(text) ? '工作流程' : '科技概念';
    const type = /芯片|硬件|处理器/.test(text) ? 'chip' : /数据|算力|模型|算法/.test(text) ? 'data' : /流程|步骤|工作流|选题|拆解|写稿|配音|数字人|动画|批量/.test(text) ? 'workflow' : 'network';
    rows.push({id: rows.length + 1, start: toSec(a), end: Math.max(toSec(b), toSec(a)+1), text, keyword, type});
  }
  return rows;
};

export const demoScenes: Scene[] = [
  {id:1,start:0,end:3,text:'选题：发现值得讲的主题',keyword:'选题',type:'workflow'},
  {id:2,start:3,end:6,text:'拆解：提炼逻辑与关键步骤',keyword:'拆解',type:'network'},
  {id:3,start:6,end:9,text:'写稿：组织清晰的解说文案',keyword:'写稿',type:'data'},
  {id:4,start:9,end:12,text:'动画：关键词驱动科技动效',keyword:'动画',type:'chip'},
];
