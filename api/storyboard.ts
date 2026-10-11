
type SceneType = 'workflow' | 'chip' | 'data' | 'network';

type Scene = {
  id: number;
  start: number;
  end: number;
  text: string;
  keyword: string;
  type: SceneType;
};

const allowedTypes = new Set<SceneType>([
  'workflow', 'chip', 'data', 'network'
]);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: '服务端尚未配置 OPENAI_API_KEY'
    });
  }

  try {
    const scenes = req.body?.scenes as Scene[];

    if (
      !Array.isArray(scenes) ||
      scenes.length === 0 ||
      scenes.length > 30
    ) {
      return res.status(400).json({
        error: '请提供 1 到 30 个有效字幕片段'
      });
    }

    if (scenes.some(s =>
      !Number.isFinite(s.start) ||
      !Number.isFinite(s.end) ||
      s.end <= s.start ||
      typeof s.text !== 'string' ||
      !s.text.trim() ||
      s.text.length > 500
    )) {
      return res.status(400).json({
        error: '字幕时间或内容格式不正确'
      });
    }

    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `你是专业的中文科技科普视频动画分镜导演。
根据字幕语义，为每句字幕选择最合适的动画类型。

可选类型：
workflow：流程、步骤、自动化、制作过程
chip：芯片、处理器、硬件、电子电路
data：数据、AI模型、算法、统计、计算
network：网络、服务器、云端、通信、连接

返回 JSON 对象，格式为：


{"shots":[{"id":1,"keyword":"AI视频制作","type":"workflow","visualElements":["选题","写稿","配音","成片"],"motion":"sequence","highlight":"自动化","flowSteps":["选题","写稿","配音","成片"]}]}


要求：
1. 每句字幕返回一个镜头，保持原始顺序。
2. keyword 为 2 到 10 个中文字符左右。
3. type 必须是四种类型之一。
4. 不要改变字幕时间。
5. 只返回 JSON。`

6. visualElements：提供 2 到 4 个适合画面呈现的中文视觉元素，每个元素尽量简短。
7. motion：必须从以下五种运动方式中选择：
   flow：数据流动、粒子移动
   pulse：核心闪烁、能量脉冲
   expand：结构展开、数值增长
   connect：节点连接、线路形成
   sequence：步骤依次出现
8. highlight：从原字幕中提取最值得强调的数字或关键词，最多 12 个字符；没有合适内容时返回空字符串。
9. visualElements、motion、highlight 都必须出现在每个镜头中。
10. 不要编造原字幕中不存在的具体数值。

11. 每个镜头都必须返回 flowSteps 字段，类型为字符串数组。
12. 当 type 为 workflow 时，根据字幕语义生成 2 到 4 个流程节点，节点名称使用简短中文，每个节点不超过 6 个字符。
13. 流程节点必须符合字幕所表达的实际顺序，不要机械地使用“输入、识别、处理、输出”。
14. 当字幕没有明确流程时，flowSteps 返回空数组 []，不要编造流程步骤。
15. flowSteps 和 visualElements 可以不同：flowSteps 表示有先后顺序的步骤，visualElements 表示画面中的关键元素。

            },
            {
              role: 'user',
              content: JSON.stringify(
                scenes.map(s => ({
                  id: s.id,
                  text: s.text
                }))
              )
            }
          ]
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: result?.error?.message || 'AI 服务调用失败'
      });
    }

    const content = result?.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      throw new Error('AI 没有返回有效内容');
    }

    const parsed = JSON.parse(content);
    const shots = parsed?.shots;

    if (!Array.isArray(shots) || shots.length !== scenes.length) {
      throw new Error('AI 返回的镜头数量不匹配');
    }

    const updated = scenes.map((scene, index) => {
      const shot = shots[index];
      const type = shot?.type as SceneType;

      
const allowedMotions = [
  'flow',
  'pulse',
  'expand',
  'connect',
  'sequence'
];

return {
  ...scene,
  keyword:
    typeof shot?.keyword === 'string' &&
    shot.keyword.trim()
      ? shot.keyword.trim().slice(0, 20)
      : scene.keyword,

  type: allowedTypes.has(type)
    ? type
    : scene.type,

  visualElements:
    Array.isArray(shot?.visualElements)
      ? shot.visualElements
          .filter((item: unknown): item is string =>
            typeof item === 'string'
          )
          .slice(0, 4)
          .map((item: string) => item.slice(0, 20))
      : [],

  motion:
    allowedMotions.includes(shot?.motion)
      ? shot.motion
      : 'pulse',

  
highlight:
  typeof shot?.highlight === 'string'
    ? shot.highlight.slice(0, 12)
    : '',

flowSteps:
  Array.isArray(shot?.flowSteps) && type === 'workflow'
    ? shot.flowSteps
        .filter((item: unknown): item is string =>
          typeof item === 'string'
        )
        .map((item: string) => item.trim().slice(0, 6))
        .filter((item: string) => item.length > 0)
        .slice(0, 4)
    : []

};

    });

    return res.status(200).json({ scenes: updated });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error
        ? error.message
        : 'AI 分镜生成失败'
    });
  }
}

