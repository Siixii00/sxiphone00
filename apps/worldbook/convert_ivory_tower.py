import json
import os
import re

SOURCE_FILE = os.path.join(os.path.dirname(__file__), '..', '..', '..', '【请先解压】象牙塔 v2.3.0 @电波系', '【请先解压】象牙塔 v2.3.0 @电波系', '0.预设本体', '【MoM】象牙塔 v2.3.0 @电波系.json')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'ivory_tower_worldbook.json')

CATEGORIES = {
    'cot': [],
    'style': [],
    'global': [],
    'keywords': [],
    'backend': []
}

STYLE_COURSES = [
    '🍁叙事动力学', '🍁烟火摄影学', '🍁复调群像学', '🍁共时生态学', '🍁禁忌关系学',
    '🍁怪诞式美学', '🍁悬疑构筑学', '🍁记忆迷宫学', '🎟️生活喜剧', '🎟️黑色幽默',
    '🎟️抒情现实', '🎟️东方古典', '🎟️幻想文学', '🎟️悬疑推理', '🎟️中式恐怖',
    '🎟️扭曲情感', '🎟️理想主义', '🎟️女性主义', '🎟️感官主义', '🎟️虚无主义',
    '🎟️极繁主义', '🎟️超现实主义', '🎟️自定义文风'
]

TOWERS = [
    '🎁盲盒之塔', '🎁涩涩之塔', '🎁游戏之塔', '🎁群聊之塔', '🎁恋爱之塔',
    '🎁论坛之塔', '🎁同人之塔', '🎁八卦之塔', '🎁回忆之塔', '🎁平行之塔',
    '🎁美食之塔', '🎁广告之塔', '🎁报告之塔', '🎁每日之塔', '🎁文学之塔',
    '🎁哀伤之塔', '🎁幸福之塔'
]

GOSSIP_GROUPS = [
    '🛟海底小纵队', '💥AI也疯狂', '🎲博德之门', '⚔️武林外传', '👩\u200d🏫回声教研室',
    '💖恋爱观察员', '💅宫斗甄嬛传', '🌸大观园之旅', '🚗疯狂动物城', '🥊日漫大乱斗',
    '🥊漫威DC大乱斗', '🥊综英美大乱斗', '🥊卡普空大乱斗', '🥊任天堂大乱斗',
    '🥊中国文学大乱斗', '🥊外国文学大乱斗'
]

NSFW_MODULES = [
    '❤️\u200d🔥英抓色情指导', '💘温柔性爱前置', '💘粗暴性爱前置', '💘BDSM前置',
    '🔥M4A', '🔥M4F', '🔥M4M', '🔥F4A', '🔥F4M', '🔥F4F', '🔥多人', '🔥双性', '🔥人外',
    '💗保护屁股', '💗不許睡了', '💗安全措施', '💓澀個不停', '💓不許澀了',
    '💋凝视主导方', '💋凝视被动方'
]

CORE_MODULES = [
    '🏛️象牙塔的回声', '🕸️方尖碑', '🌍世界公理', '🕹️全局写作', '📜获取变量',
    '💎写作规范', '💖好感指南', '🧭内在罗盘·常规', '🔗关系引力·自然',
    '⛔综合禁令', '🚫防男同', '🚫防短句泛滥', '🚫防修罗场', '🚫防转折', '🚫防昇华',
    '✅适当比喻', '✅加强对白', '✅回复扩写'
]

COT_MODULES = [
    '📍常规创作思维', '📍简化创作思维', '✂️评审草稿', '❄️字数检测', '❄️防抢检测',
    '❄️文笔加强', '❄️创作心锚', '❄️禁词检测'
]

SKIP_ENTRIES = [
    '×┈┈┈୨୧┈┈┈×', '✉️入学须知', '🌱 新生指南', '🔒防429 by 果实',
    '˙⟡🪄选修课程选修课程课程₊˚⊹', '˙⟡📚文学工坊₊˚⊹', '✧─叙事节奏─✧', '📸自由变奏',
    '📸慢板舒缓', '📸急板快叙', '╔文风指导开启╗', '╚文风指导结束╝',
    '✦✦背景信息开启✦✦', '✦✦读取用户信息✦✦', '✦✦读取角色信息✦✦',
    '✦✦背景信息结束✦✦', '✦✦历史前文开启✦✦', '✦✦历史前文结束✦✦',
    '˙⟡💕禁忌报告厅₊˚⊹', '╔NSFW特化开启╗', '✧─三选一指导─✧', '✧─多选一标签─✧',
    '✧─可选补丁─✧', '╔小剧场开启╗', '✧─二选一头部─✧', '✧─小剧场内容─✧',
    '╚小剧场结束╝', '╔文末吐槽开启╗', '🎉NPC乱入', '🎉NPC不乱入',
    '✧─令行禁止─✧', '✧─字数控制─✧', '✧─语言选择─✧', '˙⟡🔭课外活动₊˚⊹',
    '✧─神秘补丁─✧', '✧─摘要定制─✧', '📌常规正文要求', '📌评审正文要求',
    '📎长段落补丁', '📎自由段落补丁', '💜强制中文', '💜双语对话'
]

MARKER_ENTRIES = [
    '🌐世界书·前', '🌐世界书·后', '🪶用户描述', '🪶角色描述', '🪶角色设定',
    '🪶场景描述', 'Chat Examples', 'Chat History'
]

def generate_triggers(name):
    triggers = []
    clean_name = re.sub(r'^[^\s]+\s*', '', name)
    clean_name = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9]', ' ', clean_name).strip()
    
    if '塔' in name:
        triggers.append('小劇場')
        tower_name = clean_name.replace('之塔', '').strip()
        if tower_name:
            triggers.append(tower_name)
    elif '吐槽' in name:
        triggers.append('吐槽')
        group_name = clean_name.replace('文末吐槽：', '').replace('吐槽：', '').strip()
        if group_name:
            triggers.append(group_name)
    elif any(s in name for s in ['敘事動力', '叙事动力']):
        triggers.extend(['敘事', '節奏', '張力'])
    elif any(s in name for s in ['煙火攝影', '烟火摄影']):
        triggers.extend(['生活流', '細節', '日常'])
    elif any(s in name for s in ['復調群像', '复调群像']):
        triggers.extend(['群像', '多角色', '配角'])
    elif any(s in name for s in ['共時生態', '共时生态']):
        triggers.extend(['景深', '環境', '平行'])
    elif any(s in name for s in ['禁忌關係', '禁忌关系']):
        triggers.extend(['禁忌', '權力', '灰色'])
    elif any(s in name for s in ['怪誕', '怪诞']):
        triggers.extend(['怪誕', '氛圍', '恐怖'])
    elif any(s in name for s in ['懸疑構築', '悬疑构筑']):
        triggers.extend(['懸疑', '信息', '謎題'])
    elif any(s in name for s in ['記憶迷宮', '记忆迷宫']):
        triggers.extend(['記憶', '碎片', '非線性'])
    elif '喜劇' in name or '喜剧' in name:
        triggers.extend(['喜劇', '日常', '幽默'])
    elif '黑色幽默' in name:
        triggers.extend(['黑色', '諷刺', '都市'])
    elif '抒情現實' in name or '抒情现实' in name:
        triggers.extend(['抒情', '溫柔', '詩意'])
    elif '東方古典' in name or '东方古典' in name:
        triggers.extend(['古風', '古典', '意境'])
    elif '幻想文學' in name or '幻想文学' in name:
        triggers.extend(['奇幻', '科幻', '史詩'])
    elif '懸疑推理' in name or '悬疑推理' in name:
        triggers.extend(['懸疑', '推理', '謎題'])
    elif '中式恐怖' in name:
        triggers.extend(['恐怖', '民俗', '陰森'])
    elif '扭曲情感' in name:
        triggers.extend(['病嬌', '黑泥', '佔有'])
    elif '理想主義' in name or '理想主义' in name:
        triggers.extend(['純愛', '溫暖', '治癒'])
    elif '女性主義' in name or '女性主义' in name:
        triggers.extend(['女性', '獨立', '主體'])
    elif '感官主義' in name or '感官主义' in name:
        triggers.extend(['感官', '慾望', '張力'])
    elif '虛無主義' in name or '虚无主义' in name:
        triggers.extend(['虛無', '崩壞', '荒謬'])
    elif '極繁主義' in name or '极繁主义' in name:
        triggers.extend(['極繁', '巴洛克', '繁複'])
    elif '超現實' in name or '超现实' in name:
        triggers.extend(['超現實', '夢境', '潛意識'])
    elif '自定義文風' in name or '自定义文风' in name:
        triggers.extend(['自定義', '文風'])
    elif '英抓色情指導' in name:
        triggers.extend(['NSFW', '性愛', '指導'])
    elif '溫柔性愛' in name or '温柔性爱' in name:
        triggers.extend(['NSFW', '溫柔', '性愛'])
    elif '粗暴性愛' in name:
        triggers.extend(['NSFW', '粗暴', '性愛'])
    elif 'BDSM' in name:
        triggers.extend(['NSFW', 'BDSM'])
    elif 'M4F' in name:
        triggers.extend(['NSFW', '男對女'])
    elif 'M4M' in name:
        triggers.extend(['NSFW', '男對男'])
    elif 'F4M' in name:
        triggers.extend(['NSFW', '女對男'])
    elif 'F4F' in name:
        triggers.extend(['NSFW', '女對女'])
    elif 'M4A' in name or 'F4A' in name:
        triggers.extend(['NSFW', '全體'])
    elif '多人' in name:
        triggers.extend(['NSFW', '多人'])
    elif '雙性' in name or '双性' in name:
        triggers.extend(['NSFW', '雙性'])
    elif '人外' in name:
        triggers.extend(['NSFW', '人外'])
    elif '象牙塔' in name:
        triggers.extend(['系統', '人設', '象牙塔'])
    elif '方尖碑' in name:
        triggers.extend(['指令', '解析', '42'])
    elif '世界公理' in name:
        triggers.extend(['公理', '物理', '時間'])
    elif '全局寫作' in name or '全局写作' in name:
        triggers.extend(['寫作', '敘事', '鏡頭'])
    elif '寫作規範' in name or '写作规范' in name:
        triggers.extend(['規範', '結構', '節奏'])
    elif '好感指南' in name:
        triggers.extend(['好感', '數值', '判定'])
    elif '內在羅盤' in name or '内在罗盘' in name:
        triggers.extend(['羅盤', '核心', '慾望'])
    elif '關係引力' in name or '关系引力' in name:
        triggers.extend(['關係', '引力', '化學'])
    elif '綜合禁令' in name or '综合禁令' in name:
        triggers.extend(['禁令', '油膩', '戀愛腦'])
    elif '防男同' in name:
        triggers.extend(['BG', '異性戀'])
    elif '防短句' in name:
        triggers.extend(['短句', '排版', '段落'])
    elif '防修羅場' in name or '防修罗场' in name:
        triggers.extend(['修羅場', '爭風'])
    elif '防轉折' in name or '防转折' in name:
        triggers.extend(['轉折', '突兀'])
    elif '防昇華' in name or '防升华' in name:
        triggers.extend(['昇華', '結尾'])
    elif '適當比喻' in name or '适当比喻' in name:
        triggers.extend(['比喻', '明喻'])
    elif '加強對白' in name or '加强对白' in name:
        triggers.extend(['對白', '對話'])
    elif '回覆擴寫' in name or '回复扩写' in name:
        triggers.extend(['擴寫', '複述'])
    elif '常規創作思維' in name or '常规创作思维' in name:
        triggers.extend(['ECoT', '思維鏈', '創作'])
    elif '簡化創作思維' in name or '简化创作思维' in name:
        triggers.extend(['簡化', '快速', '思維鏈'])
    elif '評審草稿' in name or '评审草稿' in name:
        triggers.extend(['評審', '草稿', '批改'])
    elif '字數檢測' in name or '字数检测' in name:
        triggers.extend(['字數', '檢測'])
    elif '防搶檢測' in name or '防抢检测' in name:
        triggers.extend(['防搶', '演繹'])
    elif '文筆加強' in name or '文笔加强' in name:
        triggers.extend(['文筆', '文學'])
    elif '創作心錨' in name or '创作心锚' in name:
        triggers.extend(['心錨', '教授'])
    elif '禁詞檢測' in name or '禁词检测' in name:
        triggers.extend(['禁詞', '風險'])
    elif '海底小縱隊' in name or '海底小纵队' in name:
        triggers.extend(['吐槽', '海底'])
    elif 'AI也瘋狂' in name or 'AI也疯狂' in name:
        triggers.extend(['吐槽', 'AI'])
    elif '博德之門' in name or '博德之门' in name:
        triggers.extend(['吐槽', '博德'])
    elif '武林外傳' in name or '武林外传' in name:
        triggers.extend(['吐槽', '武林'])
    elif '回聲教研室' in name or '回声教研室' in name:
        triggers.extend(['吐槽', '教研室'])
    elif '戀愛觀察員' in name or '恋爱观察员' in name:
        triggers.extend(['吐槽', '戀愛'])
    elif '宮鬥甄嬛傳' in name or '宫斗甄嬛传' in name:
        triggers.extend(['吐槽', '宮鬥'])
    elif '大觀園' in name or '大观园' in name:
        triggers.extend(['吐槽', '紅樓'])
    elif '瘋狂動物城' in name or '疯狂动物城' in name:
        triggers.extend(['吐槽', '動物城'])
    elif '日漫大亂鬥' in name or '日漫大乱斗' in name:
        triggers.extend(['吐槽', '日漫'])
    elif '漫威DC' in name:
        triggers.extend(['吐槽', '漫威', 'DC'])
    elif '綜英美' in name or '综英美' in name:
        triggers.extend(['吐槽', '英美'])
    elif '卡普空' in name:
        triggers.extend(['吐槽', '卡普空'])
    elif '任天堂' in name:
        triggers.extend(['吐槽', '任天堂'])
    elif '中國文學' in name or '中国文学' in name:
        triggers.extend(['吐槽', '中國文學'])
    elif '外國文學' in name or '外国文学' in name:
        triggers.extend(['吐槽', '外國文學'])
    
    if not triggers:
        words = [w for w in re.split(r'[\s,，、]+', clean_name) if w]
        triggers.extend(words[:3])
    
    return list(dict.fromkeys(triggers))[:5]

def get_default_enabled(name):
    if name == '©️作者声明':
        return True
    if any(m in name for m in [c.split('·')[0] if '·' in c else c for c in CORE_MODULES]):
        return True
    if '盲盒之塔' in name or '每日之塔' in name:
        return True
    if '海底小纵队' in name:
        return True
    if '英抓色情指导' in name:
        return True
    return False

def classify_entry(entry):
    name = entry.get('name', '')
    
    if name in SKIP_ENTRIES or name in MARKER_ENTRIES:
        return None
    
    if name == '©️作者声明':
        return {'category': 'global', 'priority': 0}
    
    for m in COT_MODULES:
        if m in name or m.replace('·', '') in name:
            return {'category': 'cot', 'priority': 100}
    
    for s in STYLE_COURSES:
        if s in name or s.replace('🍁', '').replace('🎟️', '') in name:
            return {'category': 'style', 'priority': 100}
    
    for t in TOWERS:
        if t in name or t.replace('🎁', '') in name:
            return {'category': 'keywords', 'priority': 100}
    
    for g in GOSSIP_GROUPS:
        if g in name or g.replace('🛟', '').replace('💥', '').replace('🎲', '').replace('⚔️', '').replace('👩\u200d🏫', '').replace('💖', '').replace('💅', '').replace('🌸', '').replace('🚗', '').replace('🥊', '') in name:
            return {'category': 'keywords', 'priority': 200}
    
    for n in NSFW_MODULES:
        if n in name or n.replace('❤️\u200d🔥', '').replace('💘', '').replace('🔥', '').replace('💗', '').replace('💓', '').replace('💋', '') in name:
            return {'category': 'keywords', 'priority': 300}
    
    for m in CORE_MODULES:
        if m in name or m.replace('🏛️', '').replace('🕸️', '').replace('🌍', '').replace('🕹️', '').replace('📜', '').replace('💎', '').replace('💖', '').replace('🧭', '').replace('🔗', '').replace('⛔', '').replace('🚫', '').replace('✅', '') in name:
            return {'category': 'global', 'priority': 100}
    
    if '內在羅盤' in name or '关系引力' in name or '内在罗盘' in name:
        return {'category': 'global', 'priority': 100}
    
    if '禁' in name or '防' in name or '✅' in name:
        return {'category': 'global', 'priority': 100}
    
    if '神秘补丁' in name or '🧸' in name:
        return {'category': 'keywords', 'priority': 400}
    
    if '🔮' in name or '角色关系' in name or '绝密档案' in name or '摘要伏笔' in name:
        return {'category': 'keywords', 'priority': 500}
    
    if '状态栏' in name or '顶部栏' in name or '心绪回响' in name or '有求必应' in name:
        return {'category': 'keywords', 'priority': 600}
    
    return {'category': 'global', 'priority': 200}

def create_model_configs():
    models = [
        {
            'title': '模型配置：Claude',
            'triggers': ['Claude', 'Anthropic'],
            'content': '''[模型特性：Claude]
- 擅長：文學性寫作、情感細節、心理描寫
- 觸發詞：roleplay, narrative, immersive, creative writing
- 系統提示詞前綴：You are an expert creative writer engaging in immersive roleplay...
- 思維鏈格式：<thinking>...</thinking>
- 建議溫度：1.0-1.2
- 建議 top_p：0.9-0.95
- 特殊指令：支持 XML 標籤、支持長上下文''',
            'enabled': False
        },
        {
            'title': '模型配置：GPT',
            'triggers': ['GPT', 'OpenAI'],
            'content': '''[模型特性：GPT]
- 擅長：對話流暢、邏輯推理、多角色互動
- 觸發詞：roleplay, character, dialogue, storytelling
- 系統提示詞前綴：You are a skilled roleplay partner...
- 思維鏈格式：無特定格式要求
- 建議溫度：0.8-1.0
- 建議 top_p：0.9-1.0
- 特殊指令：支持 function calling、支持 JSON mode''',
            'enabled': False
        },
        {
            'title': '模型配置：Gemini',
            'triggers': ['Gemini', 'Google'],
            'content': '''[模型特性：Gemini]
- 擅長：創意寫作、場景描寫、節奏控制
- 觸發詞：creative writing, storytelling, immersive
- 系統提示詞前綴：You are a creative storyteller...
- 思維鏈格式：<thinking>...</thinking>
- 建議溫度：1.2-1.5
- 建議 top_p：0.88-0.95
- 特殊指令：支持多模態、支持長上下文''',
            'enabled': False
        },
        {
            'title': '模型配置：DeepSeek',
            'triggers': ['DeepSeek', '深度求索'],
            'content': '''[模型特性：DeepSeek]
- 擅長：邏輯推理、技術細節、代碼相關
- 觸發詞：roleplay, narrative, reasoning
- 系統提示詞前綴：You are an AI assistant engaging in creative roleplay...
- 思維鏈格式：自由格式
- 建議溫度：0.9-1.1
- 建議 top_p：0.9-0.95
- 特殊指令：支持代碼執行、支持推理模式''',
            'enabled': False
        },
        {
            'title': '模型配置：智譜GLM',
            'triggers': ['智譜', 'GLM'],
            'content': '''[模型特性：智譜 GLM]
- 擅長：中文寫作、對話、知識問答
- 觸發詞：角色扮演, 創作, 敘事
- 系統提示詞前綴：你是一位專業的創作者，正在進行沉浸式角色扮演...
- 思維鏈格式：自由格式
- 建議溫度：0.9-1.2
- 建議 top_p：0.9-0.95
- 特殊指令：支持中文優化、支持長文本''',
            'enabled': False
        },
        {
            'title': '模型配置：Kimi',
            'triggers': ['Kimi', '月之暗面'],
            'content': '''[模型特性：Kimi]
- 擅長：長文本處理、文檔理解、中文寫作
- 觸發詞：角色扮演, 創作, 敘事
- 系統提示詞前綴：你是一位專業的創作者...
- 思維鏈格式：自由格式
- 建議溫度：0.9-1.1
- 建議 top_p：0.9-0.95
- 特殊指令：支持超長上下文（200K）''',
            'enabled': False
        },
        {
            'title': '模型配置：MiniMax',
            'triggers': ['MiniMax'],
            'content': '''[模型特性：MiniMax]
- 擅長：創意寫作、多輪對話、語音合成
- 觸發詞：角色扮演, 創作, 敘事
- 系統提示詞前綴：你是一位專業的創作者...
- 思維鏈格式：自由格式
- 建議溫度：1.0-1.3
- 建議 top_p：0.9-0.95
- 特殊指令：支持語音合成、支持多模態''',
            'enabled': False
        },
        {
            'title': '模型配置：本地模型',
            'triggers': ['本地', 'Llama', 'Mistral', 'Qwen', 'Yi'],
            'content': '''[模型特性：本地模型]
- 擅長：通用寫作、對話
- 觸發詞：roleplay, narrative
- 系統提示詞前綴：You are a creative writer...
- 思維鏈格式：自由格式
- 建議溫度：0.8-1.2
- 建議 top_p：0.9-1.0
- 特殊指令：無''',
            'enabled': False
        },
        {
            'title': '模型配置：自定義',
            'triggers': ['自定義', 'custom'],
            'content': '''[模型特性：自定義模型]
請根據您的模型特性自行調整以下參數：
- 擅長：[請填寫]
- 觸發詞：[請填寫]
- 系統提示詞前綴：[請填寫]
- 思維鏈格式：[請填寫]
- 建議溫度：[請填寫]
- 建議 top_p：[請填寫]
- 特殊指令：[請填寫]''',
            'enabled': False
        }
    ]
    return models

def convert_entry(entry):
    classification = classify_entry(entry)
    if not classification:
        return None
    
    return {
        'title': entry.get('name', ''),
        'triggers': generate_triggers(entry.get('name', '')),
        'content': entry.get('content', ''),
        'enabled': get_default_enabled(entry.get('name', '')),
        'category': classification['category'],
        'priority': classification['priority']
    }

def main():
    print('讀取象牙塔預設文件...')
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        source_data = json.load(f)
    
    print(f"找到 {len(source_data.get('prompts', []))} 個條目")
    
    converted_entries = []
    
    for entry in source_data.get('prompts', []):
        converted = convert_entry(entry)
        if converted:
            converted_entries.append(converted)
    
    for entry in converted_entries:
        CATEGORIES[entry['category']].append(entry)
    
    for cat in CATEGORIES:
        CATEGORIES[cat].sort(key=lambda x: x.get('priority', 100))
    
    model_configs = create_model_configs()
    for config in model_configs:
        CATEGORIES['backend'].append({
            **config,
            'priority': 100
        })
    
    output = {
        'sx_worldbook_cot': [{
            'title': e['title'],
            'triggers': e['triggers'],
            'content': e['content'],
            'enabled': e['enabled']
        } for e in CATEGORIES['cot']],
        'sx_worldbook_style': [{
            'title': e['title'],
            'triggers': e['triggers'],
            'content': e['content'],
            'enabled': e['enabled']
        } for e in CATEGORIES['style']],
        'sx_worldbook_global': [{
            'title': e['title'],
            'triggers': e['triggers'],
            'content': e['content'],
            'enabled': e['enabled']
        } for e in CATEGORIES['global']],
        'sx_worldbook_keywords': [{
            'title': e['title'],
            'triggers': e['triggers'],
            'content': e['content'],
            'enabled': e['enabled']
        } for e in CATEGORIES['keywords']],
        'sx_worldbook_backend': [{
            'title': e['title'],
            'triggers': e['triggers'],
            'content': e['content'],
            'enabled': e['enabled']
        } for e in CATEGORIES['backend']]
    }
    
    print('\n轉換統計：')
    print(f"  思維鏈 (cot): {len(output['sx_worldbook_cot'])} 條")
    print(f"  文風 (style): {len(output['sx_worldbook_style'])} 條")
    print(f"  全域 (global): {len(output['sx_worldbook_global'])} 條")
    print(f"  關鍵字 (keywords): {len(output['sx_worldbook_keywords'])} 條")
    print(f"  後端 (backend): {len(output['sx_worldbook_backend'])} 條")
    
    enabled_count = sum(1 for cat in output.values() for e in cat if e['enabled'])
    print(f"\n默認啟用條目：{enabled_count} 條")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n輸出文件：{OUTPUT_FILE}")

if __name__ == '__main__':
    main()
