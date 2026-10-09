
export type Scene = {
  id: number;
  start: number;
  end: number;
  text: string;
  keyword: string;
  type: 'workflow' | 'chip' | 'data' | 'network';
};

// 将 SRT 时间转换为秒
function toSeconds(value: string): number {
  const match = value.trim().match(
    /^(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})$/
  );

  if (!match) return NaN;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const milliseconds = Number(match[4].padEnd(3, '0'));

  if (minutes > 59 || seconds > 59) return NaN;

  return (
    hours * 3600 +
    minutes * 60 +
    seconds +
    milliseconds / 1000
  );
}

// 根据字幕内容匹配科技动画
function matchAnimation(text: string): {
  keyword: string;
  type: Scene['type'];
} {
  const rules: Array<{
    pattern: RegExp;
    keyword: string;
    type: Scene['type'];
  }> = [
    {
      pattern: /芯片|CPU|GPU|处理器|半导体|晶体管|电路|硬件|制程/i,
      keyword: '芯片结构',
      type: 'chip'
    },
    {
      pattern: /数据|数据库|算力|算法|大模型|神经网络|训练|推理|参数|计算/i,
      keyword: '数据流',
      type: 'data'
    },
    {
      pattern: /网络|联网|云端|服务器|互联网|连接|通信|传输|节点/i,
      keyword: '网络连接',
      type: 'network'
    },
    {
      pattern: /选题|拆解|写稿|文案|配音|数字人|动画|剪辑|制作|步骤|流程|工作流|自动化|批量|生成|输出|导出/i,
      keyword: '工作流程',
      type: 'workflow'
    }
  ];

  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      return {
        keyword: rule.keyword,
        type: rule.type
      };
    }
  }

  return {
    keyword: '科技概念',
    type: 'network'
  };
}

// 解析完整 SRT 字幕
export const parseSrt = (srt: string): Scene[] => {
  const normalized = srt
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .trim();

  if (!normalized) return [];

  const blocks = normalized.split(/\n\s*\n/);
  const scenes: Scene[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const timeIndex = lines.findIndex(
      line => line.includes('-->')
    );

    if (timeIndex === -1) continue;

    const timeLine = lines[timeIndex];
    const timeMatch = timeLine.match(
      /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/
    );

    if (!timeMatch) continue;

    const start = toSeconds(timeMatch[1]);
    const end = toSeconds(timeMatch[2]);

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    ) {
      continue;
    }

    const text = lines
      .slice(timeIndex + 1)
      .join(' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\{\\[^}]*\}/g, '')
      .trim();

    if (!text) continue;

    const animation = matchAnimation(text);

    scenes.push({
      id: scenes.length + 1,
      start,
      end,
      text,
      keyword: animation.keyword,
      type: animation.type
    });
  }

  return scenes.sort(
    (a, b) => a.start - b.start || a.id - b.id
  );
};

// 默认演示分镜
export const demoScenes: Scene[] = [
  {
    id: 1,
    start: 0,
    end: 3,
    text: '选题：发现值得讲的主题',
    keyword: '选题',
    type: 'workflow'
  },
  {
    id: 2,
    start: 3,
    end: 6,
    text: '拆解：提炼逻辑与关键步骤',
    keyword: '拆解',
    type: 'network'
  },
  {
    id: 3,
    start: 6,
    end: 9,
    text: '写稿：组织清晰的解说文案',
    keyword: '写稿',
    type: 'data'
  },
  {
    id: 4,
    start: 9,
    end: 12,
    text: '动画：关键词驱动科技动效',
    keyword: '动画',
    type: 'chip'
  }
];
