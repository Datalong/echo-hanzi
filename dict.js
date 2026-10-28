/* dict.js — 汉字即时微词典（部首、释义与常用搭配）
 * 面向非母语者的字形拆解与词汇拓展库
 */
(function (global) {
  'use strict';

  // 核心汉字字典库：部首、造字释义、高频组词搭配
  var CHAR_DICT = {
    '你': {
      pinyin: 'nǐ',
      radical: '亻',
      radicalMeaning: '人 (person)',
      definition: 'you (singular)',
      collocations: ['你好 (hello)', '你们 (you all)', '你的 (yours)']
    },
    '好': {
      pinyin: 'hǎo',
      radical: '女',
      radicalMeaning: '女 (woman) + 子 (child) = good / well',
      definition: 'good; well; pleasant',
      collocations: ['很好 (very good)', '好人 (good person)', '好吃 (delicious)']
    },
    '中': {
      pinyin: 'zhōng',
      radical: '丨',
      radicalMeaning: '丨 (vertical line through the center)',
      definition: 'middle; center; China',
      collocations: ['中国 (China)', '中文 (Chinese language)', '中午 (noon)']
    },
    '国': {
      pinyin: 'guó',
      radical: '囗',
      radicalMeaning: '囗 (enclosure / boundary)',
      definition: 'country; nation; state',
      collocations: ['国家 (country)', '出国 (go abroad)', '外国 (foreign country)']
    },
    '大': {
      pinyin: 'dà',
      radical: '大',
      radicalMeaning: 'person stretching arms wide = big',
      definition: 'big; large; great',
      collocations: ['大家 (everyone)', '大学 (university)', '大人 (adult)']
    },
    '小': {
      pinyin: 'xiǎo',
      radical: '小',
      radicalMeaning: 'divided small particles = small',
      definition: 'small; little; young',
      collocations: ['小狗 (puppy)', '小时 (hour)', '小姐 (Miss)']
    },
    '人': {
      pinyin: 'rén',
      radical: '人',
      radicalMeaning: 'standing human profile',
      definition: 'person; people; human',
      collocations: ['男人 (man)', '女人 (woman)', '人们 (people)']
    },
    '吃': {
      pinyin: 'chī',
      radical: '口',
      radicalMeaning: '口 (mouth / eating action)',
      definition: 'to eat; to consume',
      collocations: ['吃饭 (eat a meal)', '好吃 (delicious)', '吃药 (take medicine)']
    },
    '喝': {
      pinyin: 'hē',
      radical: '口',
      radicalMeaning: '口 (mouth / drinking action)',
      definition: 'to drink; to beverage',
      collocations: ['喝茶 (drink tea)', '喝水 (drink water)', '喝酒 (drink alcohol)']
    },
    '茶': {
      pinyin: 'chá',
      radical: '艹',
      radicalMeaning: '艹 (plants / herbs)',
      definition: 'tea; tea plant / beverage',
      collocations: ['红茶 (black tea)', '绿茶 (green tea)', '中国茶 (Chinese tea)']
    },
    '水': {
      pinyin: 'shuǐ',
      radical: '水',
      radicalMeaning: 'flowing stream of water',
      definition: 'water; river; liquid',
      collocations: ['开水 (boiled water)', '水果 (fruit)', '水滴 (water drop)']
    },
    '电': {
      pinyin: 'diàn',
      radical: '雨',
      radicalMeaning: 'atmospheric lightning phenomenon',
      definition: 'electric; electricity',
      collocations: ['电话 (telephone)', '电脑 (computer)', '电影 (movie)']
    },
    '话': {
      pinyin: 'huà',
      radical: '讠',
      radicalMeaning: '讠 (words / speech)',
      definition: 'spoken words; talk; language',
      collocations: ['说话 (to speak)', '打电话 (make a call)', '汉语 (Chinese language)']
    },
    '猫': {
      pinyin: 'māo',
      radical: '犭',
      radicalMeaning: '犭 (quadruped animal / feline)',
      definition: 'cat (feline animal)',
      collocations: ['小猫 (kitten)', '黑猫 (black cat)', '花猫 (calico cat)']
    },
    '狗': {
      pinyin: 'gǒu',
      radical: '犭',
      radicalMeaning: '犭 (quadruped animal / canine)',
      definition: 'dog (canine animal)',
      collocations: ['小狗 (puppy)', '导盲犬 (guide dog)', '看门狗 (watchdog)']
    },
    '家': {
      pinyin: 'jiā',
      radical: '宀',
      radicalMeaning: '宀 (roof / house) + 豕 (pig under roof) = home',
      definition: 'family; home; household',
      collocations: ['回家 (go home)', '大家 (everyone)', '家人 (family members)']
    },
    '看': {
      pinyin: 'kàn',
      radical: '目',
      radicalMeaning: '手 (hand shading) over 目 (eye) = look',
      definition: 'to see; to look at; to watch; to read',
      collocations: ['看见 (see)', '看书 (read books)', '好看 (good-looking)']
    },
    '听': {
      pinyin: 'tīng',
      radical: '口',
      radicalMeaning: '口 (mouth/listen) + 斤 (sound resonance)',
      definition: 'to listen; to hear; to obey',
      collocations: ['听到 (hear)', '听歌 (listen to music)', '听写 (dictation)']
    },
    '说': {
      pinyin: 'shuō',
      radical: '讠',
      radicalMeaning: '讠 (speech / words)',
      definition: 'to speak; to say; to talk',
      collocations: ['说话 (talk)', '说明 (explain)', '小说 (novel)']
    },
    '写': {
      pinyin: 'xiě',
      radical: '冖',
      radicalMeaning: '冖 (cover) + 与 = transcribe / record',
      definition: 'to write; to compose',
      collocations: ['写字 (write characters)', '写作 (writing)', '写信 (write letter)']
    },
    '学': {
      pinyin: 'xué',
      radical: '子',
      radicalMeaning: '子 (child underneath roof receiving knowledge)',
      definition: 'to study; to learn; school of thought',
      collocations: ['学习 (to study)', '学生 (student)', '学校 (school)']
    },
    '生': {
      pinyin: 'shēng',
      radical: '生',
      radicalMeaning: 'plant sprouting out of ground = live / birth',
      definition: 'to be born; life; raw; student',
      collocations: ['生活 (life)', '生日 (birthday)', '先生 (Mr. / sir)']
    },
    '师': {
      pinyin: 'shī',
      radical: '巾',
      radicalMeaning: '巾 (cloth/banner) = master / expert',
      definition: 'teacher; master; specialist',
      collocations: ['老师 (teacher)', '律师 (lawyer)', '师傅 (master)']
    },
    '朋': {
      pinyin: 'péng',
      radical: '月',
      radicalMeaning: 'two strings of cowrie shells = peer / friend',
      definition: 'friend; companion; peer',
      collocations: ['朋友 (friend)', '小朋友 (little kid)', '亲朋 (relatives & friends)']
    },
    '友': {
      pinyin: 'yǒu',
      radical: '又',
      radicalMeaning: '又 (two right hands joined in friendship)',
      definition: 'friend; friendly; companion',
      collocations: ['友好 (friendly)', '好友 (close friend)', '友谊 (friendship)']
    },
    '爱': {
      pinyin: 'ài',
      radical: '爫',
      radicalMeaning: '爫 (hand) + 冖 + 心 (heart) + 夂 = love with all heart',
      definition: 'to love; affection; to like',
      collocations: ['爱好 (hobby)', '可爱 (cute)', '爱情 (love)']
    },
    '北': {
      pinyin: 'běi',
      radical: '匕',
      radicalMeaning: 'two people back-to-back facing north',
      definition: 'north (cardinal direction)',
      collocations: ['北京 (Beijing)', '北方 (north region)', '北极 (North Pole)']
    },
    '京': {
      pinyin: 'jīng',
      radical: '亠',
      radicalMeaning: 'tall watchtower mound = capital',
      definition: 'capital city; metropolis',
      collocations: ['北京 (Beijing)', '南京 (Nanjing)', '东京 (Tokyo)']
    },
    '飞': {
      pinyin: 'fēi',
      radical: '飞',
      radicalMeaning: 'bird wings flapping in air',
      definition: 'to fly; to hover',
      collocations: ['飞机 (airplane)', '飞快 (flying fast)', '起飞 (take off)']
    },
    '机': {
      pinyin: 'jī',
      radical: '木',
      radicalMeaning: '木 (wood / loom mechanical parts)',
      definition: 'machine; engine; opportunity; aircraft',
      collocations: ['手机 (cell phone)', '机会 (opportunity)', '机场 (airport)']
    },
    '高': {
      pinyin: 'gāo',
      radical: '高',
      radicalMeaning: 'tall multi-story pavilion tower',
      definition: 'high; tall; elevated; noble',
      collocations: ['高兴 (happy)', '高山 (high mountain)', '高速 (high speed)']
    },
    '兴': {
      pinyin: 'xìng',
      radical: '八',
      radicalMeaning: 'hands raising up together in celebration',
      definition: 'interest; excitement; prosperity',
      collocations: ['兴趣 (interest)', '高兴 (glad/happy)', '兴奋 (excited)']
    }
  };

  /**
   * 查询字符字典信息，若字典中未专门收录，则根据内置词库自动生成标准释义
   * @param {string} ch - 单个汉字
   * @returns {Object} 字典卡片数据
   */
  function lookup(ch, fallbackPinyin) {
    if (!ch) return null;
    var char = ch.trim().charAt(0);
    if (CHAR_DICT[char]) {
      return Object.assign({ char: char }, CHAR_DICT[char]);
    }

    // 智能后备：从现有词库搜索包含该字词汇
    var py = '';
    var def = '';
    var collocations = [];

    if (global.WORD_LISTS) {
      ['hsk1', 'hsk2'].forEach(function (k) {
        (global.WORD_LISTS[k] || []).forEach(function (w) {
          if (w.hanzi.indexOf(char) !== -1) {
            if (!py && w.hanzi === char) {
              py = w.pinyin;
              def = w.english;
            }
            if (collocations.length < 3 && collocations.indexOf(w.hanzi) === -1) {
              collocations.push(w.hanzi + ' (' + w.english + ')');
            }
          }
        });
      });
    }

    return {
      char: char,
      pinyin: fallbackPinyin || py || (global.Pinyin ? global.Pinyin.toPlain(char) : '') || 'hànyǔ',
      radical: '汉字部件',
      radicalMeaning: 'Common Chinese radical component',
      definition: def || 'Chinese character',
      collocations: collocations.length ? collocations : [char]
    };
  }

  var api = {
    CHAR_DICT: CHAR_DICT,
    lookup: lookup
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Dict = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
