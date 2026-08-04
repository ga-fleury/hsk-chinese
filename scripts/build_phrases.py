"""Build src/data/phrases.json — the Translation phrase set. See docs/adr/0005.

Two provenances:
  * AUTHORED   — thematic sentences written for this app. May use non-HSK-1
                 words, but every one MUST appear in EXTRA and is emitted as a
                 Gloss (CONTEXT.md: glossed words are given, never tested).
  * CORPUS     — sentences curated from the Tatoeba cmn-eng export (CC-BY 2.0 FR).
                 These must segment entirely into HSK 1 words, so they never
                 need a Gloss. Attribution ids are carried through as `ref`.

Usage:
    curl -O https://www.manythings.org/anki/cmn-eng.zip && unzip cmn-eng.zip
    python3 scripts/build_phrases.py cmn.txt
"""
import json, collections, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORDS = json.load(open(os.path.join(ROOT, 'src/data/hsk1.json')))
VOCAB = {w['hanzi']: w for w in WORDS}
MAXLEN = max(len(w) for w in VOCAB)
HSK_CHARS = set(''.join(w['hanzi'] for w in WORDS))
PUNCT = set('。，？！、：；“”‘’（）《》…—·,.?!"\' ')

# Non-HSK-1 words permitted in authored Phrases. Every one MUST be glossed.
EXTRA = {
    '咖啡': ('kā fēi', 'coffee'),
    '饺子': ('jiǎo zi', 'dumplings'),
    '超市': ('chāo shì', 'supermarket'),
    '地铁': ('dì tiě', 'subway'),
    '姓':   ('xìng', 'surname; to be surnamed'),
    '欢迎': ('huān yíng', 'to welcome'),
    '便宜': ('pián yi', 'cheap'),
    '银行': ('yín háng', 'bank'),
    '每天': ('měi tiān', 'every day'),
    '外面': ('wài miàn', 'outside'),
    '雪':   ('xuě', 'snow'),
    '问题': ('wèn tí', 'question; problem'),
    '作业': ('zuò yè', 'homework'),
    '公司': ('gōng sī', 'company'),
    '舒服': ('shū fu', 'comfortable; well'),
}

def segment(zh):
    s = ''.join(c for c in zh if c not in PUNCT)
    toks, residue, i = [], [], 0
    while i < len(s):
        for L in range(min(MAXLEN, len(s) - i), 0, -1):
            chunk = s[i:i+L]
            if chunk in VOCAB or chunk in EXTRA:
                toks.append(chunk); i += L; break
        else:
            residue.append(s[i]); toks.append(s[i]); i += 1
    return toks, residue


def load_candidates(path):
    """HSK-1-only candidate sentences from the Tatoeba cmn-eng export."""
    out, seen = [], set()
    for line in open(path, encoding='utf-8'):
        parts = line.rstrip('\n').split('\t')
        if len(parts) < 3:
            continue
        en, zh, attr = parts[0], parts[1], parts[2]
        body = [c for c in zh if c not in PUNCT]
        if not (4 <= len(body) <= 11) or len(en) > 55 or zh in seen:
            continue
        if not all(c in HSK_CHARS for c in body):
            continue
        seen.add(zh)
        out.append({'en': en, 'zh': zh, 'ids': re.findall(r'#(\d+)', attr)})
    return out

def word_ids(toks):
    """HSK 1 Word ids appearing in this Phrase; glossed extras have no id."""
    return sorted({VOCAB[t]['id'] for t in toks if t in VOCAB})

def pinyin_for(zh):
    toks, residue = segment(zh)
    if residue:
        return None, residue
    parts = [VOCAB[t]['pinyin'] if t in VOCAB else EXTRA[t][0] for t in toks]
    return ' '.join(parts), []

# (chinese, english, theme, [accepted variants])
AUTHORED = [
 ('你好，很高兴认识你。','Hello, nice to meet you.','greetings',['你好，很高兴认识您。']),
 ('你叫什么名字？','What is your name?','greetings',['您叫什么名字？','你叫什么？']),
 ('你姓什么？','What is your surname?','greetings',['您姓什么？']),
 ('早上好！','Good morning!','greetings',[]),
 ('老师好！','Hello, teacher!','greetings',[]),
 ('再见，明天见！','Goodbye, see you tomorrow!','greetings',[]),
 ('谢谢你！','Thank you!','greetings',['谢谢您！','谢谢！']),
 ('欢迎你来我家。','Welcome to my home.','greetings',['欢迎您来我家。']),
 ('这是我的爸爸和妈妈。','These are my father and mother.','family',[]),
 ('我有一个哥哥和一个妹妹。','I have an older brother and a younger sister.','family',[]),
 ('我家有四口人。','There are four people in my family.','family',[]),
 ('我姐姐是老师。','My older sister is a teacher.','family',[]),
 ('我弟弟八岁了。','My younger brother is eight years old.','family',[]),
 ('你有孩子吗？','Do you have children?','family',['您有孩子吗？']),
 ('我爱我的家。','I love my family.','family',[]),
 ('你妈妈在家吗？','Is your mother at home?','family',['您妈妈在家吗？']),
 ('现在几点了？','What time is it now?','time',['现在几点？']),
 ('现在是三点半。','It is half past three.','time',['现在三点半。']),
 ('今天是几月几号？','What is the date today?','time',[]),
 ('明天是星期几？','What day is it tomorrow?','time',[]),
 ('我七点起床。','I get up at seven.','time',[]),
 ('我们中午一起吃饭吧。','Let us have lunch together.','time',[]),
 ('昨天我很忙。','I was very busy yesterday.','time',['我昨天很忙。']),
 ('下午我有课。','I have class in the afternoon.','time',['我下午有课。']),
 ('我想喝一杯茶。','I would like a cup of tea.','food',['我想喝杯茶。']),
 ('你要吃什么？','What would you like to eat?','food',['您要吃什么？']),
 ('这个菜很好吃。','This dish is delicious.','food',[]),
 ('我不喝咖啡。','I do not drink coffee.','food',[]),
 ('我们去吃饺子吧。','Let us go eat dumplings.','food',[]),
 ('我很饿。','I am very hungry.','food',[]),
 ('水果很好吃。','The fruit is delicious.','food',[]),
 ('我喜欢吃米饭。','I like eating rice.','food',[]),
 ('这个多少钱？','How much is this?','shopping',['这多少钱？']),
 ('太贵了，便宜一点吧。','Too expensive, a little cheaper please.','shopping',[]),
 ('我要买两个。','I want to buy two.','shopping',['我想买两个。']),
 ('你们有小的吗？','Do you have a small one?','shopping',[]),
 ('我想买衣服。','I want to buy clothes.','shopping',['我要买衣服。']),
 ('这个我不要，谢谢。','I do not want this one, thank you.','shopping',[]),
 ('超市在哪里？','Where is the supermarket?','shopping',['超市在哪儿？']),
 ('我没有钱了。','I have no money left.','shopping',['我没钱了。']),
 ('火车站在哪里？','Where is the train station?','directions',['火车站在哪儿？']),
 ('请问，医院怎么走？','Excuse me, how do I get to the hospital?','directions',[]),
 ('我住在学校旁边。','I live next to the school.','directions',[]),
 ('银行在商店旁边。','The bank is next to the shop.','directions',[]),
 ('我不认识路。','I do not know the way.','directions',[]),
 ('地铁站远吗？','Is the subway station far?','directions',[]),
 ('我们走路去吧。','Let us walk there.','directions',[]),
 ('你住在哪里？','Where do you live?','directions',['您住在哪里？','你住在哪儿？']),
 ('我每天都上网。','I go online every day.','daily',[]),
 ('我在看电视。','I am watching television.','daily',[]),
 ('我要去睡觉了。','I am going to sleep.','daily',[]),
 ('你在做什么？','What are you doing?','daily',['您在做什么？']),
 ('我在学习汉语。','I am studying Chinese.','daily',[]),
 ('我想休息一下。','I want to rest a while.','daily',[]),
 ('我要洗衣服。','I need to wash clothes.','daily',[]),
 ('我早上喝牛奶。','I drink milk in the morning.','daily',[]),
 ('今天天气很好。','The weather is nice today.','weather',[]),
 ('外面在下雨。','It is raining outside.','weather',[]),
 ('今天很冷。','It is very cold today.','weather',[]),
 ('明天会下雨吗？','Will it rain tomorrow?','weather',[]),
 ('今天很热。','It is very hot today.','weather',[]),
 ('外面有风。','It is windy outside.','weather',[]),
 ('我喜欢下雪。','I like it when it snows.','weather',[]),
 ('天气不好，我们在家吧。','The weather is bad, let us stay home.','weather',[]),
 ('我是学生。','I am a student.','school',['我是个学生。']),
 ('我在学校学习汉语。','I study Chinese at school.','school',[]),
 ('老师，我有问题。','Teacher, I have a question.','school',[]),
 ('明天有考试。','There is an exam tomorrow.','school',[]),
 ('我要做作业。','I have to do homework.','school',[]),
 ('我在公司工作。','I work at a company.','school',[]),
 ('你的工作忙吗？','Is your job busy?','school',['您的工作忙吗？']),
 ('我今天要上班。','I have to go to work today.','school',[]),
 ('我很高兴。','I am very happy.','feelings',[]),
 ('我有点累。','I am a little tired.','feelings',['我有点累了。']),
 ('我不舒服，想去医院。','I do not feel well, I want to go to the hospital.','feelings',[]),
 ('你怎么了？','What is wrong with you?','feelings',['您怎么了？']),
 ('我很想你。','I miss you very much.','feelings',['我很想您。']),
 ('我生气了。','I am angry.','feelings',[]),
 ('别生气。','Do not be angry.','feelings',[]),
 ('我觉得很好。','I feel good.','feelings',[]),
]

# Corpus picks, keyed by sentence so they survive corpus updates.
CORPUS_PICKS = [
    "一会儿见！",
    "见到你真好。",
    "我是个学生。",
    "您叫什么名字？",
    "你叫什么？",
    "您是学生吗？",
    "你是老师吗？",
    "你是医生吗？",
    "你是不是医生？",
    "我是日本人。",
    "我爸爸很忙。",
    "那个是我爸爸。",
    "我的孩子病了。",
    "我们有两个孩子。",
    "他有三个儿子。",
    "你妈妈呢？",
    "现在几点？",
    "差不多六点了。",
    "睡觉时间到了。",
    "吃饭时间到了。",
    "时间到了。",
    "我喜欢茶。",
    "我不喜欢喝茶。",
    "我吃面包。",
    "我在吃米饭。",
    "我不喜欢鸡蛋。",
    "我还饿着呢。",
    "饭做好了。",
    "您吃不吃肉？",
    "这个几块？",
    "我没钱了。",
    "那是我的钱。",
    "不用找零钱了。",
    "我能试一下吗？",
    "我住在这里。",
    "谁住在这儿？",
    "门在哪里？",
    "我们去哪儿？",
    "你在哪儿?",
    "你在家里吗？",
    "他不在家。",
    "我生病了。",
    "我很难过。",
    "我太高兴了。",
    "我有点累了。",
    "我没生病。",
    "我身体很好。",
    "他非常生气。",
    "他生气了。",
    "我去学校。",
    "我在找工作。",
    "我今天忙。",
    "我今天休息。",
    "我们一起工作。",
    "我们是同学。",
    "他是老师。",
    "他在看电视。",
    "我在读书。",
    "我上网了。",
    "我在打电话。",
    "他喜欢睡觉。",
    "我起床早。",
    "今天有风。",
    "天快要下雨了。",
    "不在下雨。",
    "请坐一下。",
    "请再试一次。",
    "请给我打电话。",
    "您能帮我吗？",
    "帮我一下。",
    "请跟我来。",
    "我能看看那个吗？",
    "我能坐这里吗？",
    "我能休息一会儿吗？",
    "我明白了。",
    "我不喜欢。",
    "我想知道。",
    "我听不见你。",
    "我做不到。",
    "你记得吗？",
    "你认识我吗？",
    "我认识你吗？",
    "你会来吗？",
    "您准备好了吗？",
    "你们准备好了吗？",
    "你准备好了吗？",
    "你没事吧？",
    "你在开玩笑吗？",
    "你是认真的吗？",
    "你认真的？",
    "你试过吗？",
    "再试一下。",
    "试试这个。",
    "我会打电话给你。",
    "我会回来的。",
    "他会回来的。",
    "我会做饭。",
    "您会唱歌吗？",
    "您会开车吗？",
    "你有车吗？",
    "您有车吗？",
    "你有电视吗？",
    "我没时间。",
    "我们没时间。",
    "我有一个家。",
    "我家很大。",
    "你们的房间很大。",
    "您的房间很大。",
    "这个房子是我的。",
    "这是我的书。",
    "这是一本书。",
    "这本书是新的。",
    "那本书在这里。",
    "看这本书。",
    "这是我的。",
    "那是我的。",
    "不是我的。",
    "那个包是我的。",
    "那是我的包。",
    "那是什么？",
    "这是谁的？",
    "你想要什么？",
    "他说了什么？",
    "你做了什么？",
    "那个男人是谁？",
    "那男人是谁？",
    "谁来了这里？",
    "有人来了。",
    "谁也不知道。",
    "家里有没有人？",
    "那边有人吗？",
    "他们都知道。",
    "他们在这里。",
    "我们是朋友。",
    "你们是朋友？",
    "你们是朋友吗？",
    "他是你的朋友。",
    "我喜欢他们。",
    "我们喜欢你们。",
    "我喜欢你。",
    "我喜欢你！",
    "你爱我吗？",
    "你想我吗？",
    "你想我了？",
    "我非常想你。",
    "我喜欢您的车。",
    "我喜欢你的房间。",
    "他们是孩子。",
    "她们是孩子。",
    "她十七岁了。",
    "我十二岁了。",
    "你有多高？",
    "我非常高。",
    "他走路很快。",
    "他慢慢地走。",
    "他说话太快了。",
    "来吧，快一点。",
    "来吧，我们一起去。",
    "我们现在去吧。",
    "我们走走吧。",
    "回去工作。",
    "明天打电话给我。",
    "别忘了我们。",
    "不要告诉我。",
    "不要说话了。",
    "开车慢点。",
    "现在读这个。",
    "好好学习。",
    "请笑一笑！",
    "和我们一起来吧。",
    "现在就跟我来。",
    "您会告诉我吗？",
    "你能告诉我们。",
    "你是对的吗？",
    "我错了吗？",
    "我想错了。",
    "这是我的错。",
    "这不是真的。",
    "是真的吗？",
    "真的有用。",
    "这没什么大不了的。",
    "这不好笑。",
    "那真是太好了。",
    "真是太好了。",
    "看起来不错。",
    "这是最好的。",
    "那是很大的。",
    "这不是新的。",
    "汽车准备好了。",
    "这个没人要。",
    "没有人高兴。",
    "人人都好。",
    "大家笑了。",
    "大家都还行。",
    "他们都爱我。",
    "他们不帮忙。",
    "我们明白。",
    "我们笑了。",
    "我们知道。",
    "我做到了！",
    "我回来了！",
    "你做到了。",
    "你在这里。",
    "我觉得很热。",
    "我觉得冷。",
    "我真的冷。",
    "你不冷吗？",
    "你不热吗？",
    "我不高兴。",
    "你现在高兴吗？",
    "您生气了吗？",
    "你生气了吗？",
    "你在难过吗？",
    "她跟我生气了。",
    "她认识我。",
    "我认识你儿子。",
    "你认识他吗?",
    "你认识他吗？",
    "他是日本人吗？",
]

THEME_RULES = [
 ('greetings', ['见到你','一会儿见','名字','你好','谢谢','再见','欢迎']),
 ('family',    ['爸爸','妈妈','哥哥','姐姐','弟弟','妹妹','儿子','孩子','家人','太太']),
 ('time',      ['几点','点了','时间','星期','昨天','明天','今天早','岁']),
 ('food',      ['吃','喝','茶','饭','面包','鸡蛋','肉','水果','饿','菜']),
 ('shopping',  ['多少钱','钱','买','卖','贵','便宜','块']),
 ('directions',['哪里','哪儿','住','站','门','走','去哪']),
 ('weather',   ['天气','下雨','风','冷','热','雪']),
 ('school',    ['学校','学生','老师','工作','公司','考试','上班','同学','学习']),
 ('feelings',  ['高兴','生气','累','难过','生病','舒服','想你','喜欢','爱']),
]

def theme_for(zh, en):
    for theme, keys in THEME_RULES:
        if any(k in zh for k in keys):
            return theme
    return 'daily'

def norm_en(en):
    return re.sub(r'[^a-z ]', '', en.lower()).strip()

def main():
    out, errors = [], []
    seen_zh = set()

    for zh, en, theme, accept in AUTHORED:
        py, residue = pinyin_for(zh)
        if residue:
            errors.append(f'AUTHORED unsegmentable {zh}: residue {residue}')
            continue
        toks, _ = segment(zh)
        glosses = [{'word': t, 'pinyin': EXTRA[t][0], 'meaning': EXTRA[t][1]}
                   for t in dict.fromkeys(toks) if t in EXTRA]
        out.append({'zh': zh, 'pinyin': py, 'en': en, 'theme': theme,
                    'accept': [zh] + accept, 'glosses': glosses, 'source': 'authored',
                    'wordIds': word_ids(toks)})
        seen_zh.add(zh)

    cands = load_candidates(sys.argv[1] if len(sys.argv) > 1 else 'cmn.txt')
    by_en = collections.defaultdict(list)
    for c in cands:
        _, residue = segment(c['zh'])
        if not residue:
            by_en[norm_en(c['en'])].append(c)

    by_zh = {c['zh']: c for c in cands}
    for zh_key in dict.fromkeys(CORPUS_PICKS):
        c = by_zh.get(zh_key)
        if c is None:
            errors.append(f'CORPUS pick missing from export: {zh_key}')
            continue
        if c['zh'] in seen_zh:
            continue
        py, residue = pinyin_for(c['zh'])
        if residue:
            errors.append(f'CORPUS unsegmentable {c["zh"]}: residue {residue}')
            continue
        # Every corpus rendering of the same English becomes an accepted answer.
        variants = [v['zh'] for v in by_en[norm_en(c['en'])]]
        accept = list(dict.fromkeys([c['zh']] + variants))
        ids = set(c['ids'])
        for v in by_en[norm_en(c['en'])]:
            ids.update(v['ids'])
        toks, _ = segment(c['zh'])
        out.append({'zh': c['zh'], 'pinyin': py, 'en': c['en'],
                    'theme': theme_for(c['zh'], c['en']), 'accept': accept,
                    'glosses': [], 'source': 'tatoeba',
                    'ref': sorted(ids, key=int)[:6],
                    'wordIds': word_ids(toks)})
        seen_zh.add(c['zh'])

    for i, p in enumerate(out):
        p['id'] = i

    if errors:
        print(f'--- {len(errors)} problems:')
        for e in errors[:40]:
            print(' ', e)

    json.dump(out, open(os.path.join(ROOT, 'src/data/phrases.json'), 'w'),
              ensure_ascii=False, indent=1)
    themes = collections.Counter(p['theme'] for p in out)
    srcs = collections.Counter(p['source'] for p in out)
    print(f'wrote {len(out)} phrases  {dict(srcs)}')
    print('themes:', dict(themes))
    print('with glosses:', sum(1 for p in out if p['glosses']))
    print('multi-answer:', sum(1 for p in out if len(p['accept']) > 1))

if __name__ == '__main__':
    main()
