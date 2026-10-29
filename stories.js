/* stories.js — 场景化分级故事短文库
 * 每篇故事结构：
 *   id, title, englishTitle, level, intro,
 *   sentences: [
 *     { hanzi: "...", pinyin: "...", english: "..." }
 *   ]
 */
(function (global) {
  'use strict';

  var STORIES = [
    {
      id: 'beijing-trip',
      quiz: [
        { q: '大卫怎么去北京？', en: 'How does David go to Beijing?', options: ['坐飞机', '坐火车', '骑自行车'], answer: 0 },
        { q: '他在饭店喝什么？', en: 'What does he drink at the restaurant?', options: ['咖啡', '中国茶', '水'], answer: 1 }
      ],
      title: '第一次去北京',
      englishTitle: 'First Trip to Beijing',
      level: 'HSK 1',
      intro: 'Follow David on his first exciting journey to China’s capital city.',
      sentences: [
        {
          hanzi: '今天天气很好。',
          pinyin: 'jīntiān tiānqì hěn hǎo。',
          english: 'The weather is very nice today.'
        },
        {
          hanzi: '大卫坐飞机去北京。',
          pinyin: 'dàwèi zuò fēijī qù Běijīng。',
          english: 'David flies to Beijing by airplane.'
        },
        {
          hanzi: '北京是一个很大的城市。',
          pinyin: 'Běijīng shì yī gè hěn dà de chéngshì。',
          english: 'Beijing is a very large city.'
        },
        {
          hanzi: '他在饭店喝中国茶。',
          pinyin: 'tā zài fàndiàn hē Zhōngguó chá。',
          english: 'He drinks Chinese tea in the restaurant.'
        },
        {
          hanzi: '认识很多新朋友，他很高兴。',
          pinyin: 'rènshi hěn duō xīn péngyou，tā hěn gāoxìng。',
          english: 'Meeting many new friends makes him very happy.'
        }
      ]
    },
    {
      id: 'my-cat',
      quiz: [
        { q: '咪咪是什么颜色的？', en: 'What color is Mimi?', options: ['黑色的', '白色的', '黄色的'], answer: 1 },
        { q: '咪咪最喜欢吃什么？', en: 'What does Mimi like eating most?', options: ['新鲜的鱼', '米饭', '水果'], answer: 0 }
      ],
      title: '我的小猫咪咪',
      englishTitle: 'My Cat Mimi',
      level: 'HSK 1',
      intro: 'A warm little story about a beloved white cat and her playful day.',
      sentences: [
        {
          hanzi: '我家有一只白色的猫。',
          pinyin: 'wǒ jiā yǒu yī zhī báisè de māo。',
          english: 'My family has a white cat.'
        },
        {
          hanzi: '它的名字叫咪咪。',
          pinyin: 'tā de míngzi jiào mīmī。',
          english: 'Its name is Mimi.'
        },
        {
          hanzi: '咪咪最喜欢吃新鲜的鱼。',
          pinyin: 'mīmī zuì xǐhuan chī xīnxiān de yú。',
          english: 'Mimi likes eating fresh fish the most.'
        },
        {
          hanzi: '下午它在椅子上睡觉。',
          pinyin: 'xiàwǔ tā zài yǐzi shàng shuìjiào。',
          english: 'In the afternoon, she sleeps on the chair.'
        },
        {
          hanzi: '我们一家人都非常喜欢它。',
          pinyin: 'wǒmen yī jiā rén dōu fēicháng xǐhuan tā。',
          english: 'All of our family members love her very much.'
        }
      ]
    },
    {
      id: 'coffee-shop',
      quiz: [
        { q: '谁在咖啡馆等朋友？', en: 'Who is waiting at the coffee shop?', options: ['大卫', '王老师', '服务员'], answer: 1 },
        { q: '外面天气怎么样？', en: 'How is the weather outside?', options: ['下雨很冷', '晴天很热', '下雪'], answer: 0 }
      ],
      title: '在咖啡馆见面',
      englishTitle: 'Meeting at the Coffee Shop',
      level: 'HSK 2',
      intro: 'Two friends meet at a quiet cafe on a rainy afternoon to catch up.',
      sentences: [
        {
          hanzi: '外面下着雨，天气真冷。',
          pinyin: 'wàimiàn xià zhe yǔ，tiānqì zhēn lěng。',
          english: 'It is raining outside, and the weather is really cold.'
        },
        {
          hanzi: '王老师在咖啡馆等他的朋友。',
          pinyin: 'Wáng lǎoshī zài kāfēiguǎn děng tā de péngyou。',
          english: 'Teacher Wang is waiting for his friend in the coffee shop.'
        },
        {
          hanzi: '服务员送来了一杯热咖啡。',
          pinyin: 'fúwùyuán sòng lái le yī bēi rè kāfēi。',
          english: 'The waiter brought a cup of hot coffee.'
        },
        {
          hanzi: '他们一边喝咖啡，一边说话。',
          pinyin: 'tāmen yībiān hē kāfēi，yībiān shuō huà。',
          english: 'They talk together while enjoying their coffee.'
        },
        {
          hanzi: '时间过得真快，准备回家了。',
          pinyin: 'shíjiān guò de zhēn kuài，zhǔnbèi huí jiā le。',
          english: 'Time flies so fast, and they are preparing to go home.'
        }
      ]
    },
    {
      id: 'weekend-sports',
      quiz: [
        { q: '今天星期几？', en: 'What day is it today?', options: ['星期日', '星期六', '星期一'], answer: 1 },
        { q: '操场上的同学在打什么？', en: 'What are classmates playing?', options: ['篮球', '乒乓球', '棒球'], answer: 0 }
      ],
      title: '周末的运动时光',
      englishTitle: 'Weekend Sports Time',
      level: 'HSK 2',
      intro: 'Sunny mornings are best spent playing basketball and running with friends.',
      sentences: [
        {
          hanzi: '今天是星期六，早上的空气很好。',
          pinyin: 'jīntiān shì xīngqīliù，zǎoshang de kōngqì hěn hǎo。',
          english: 'Today is Saturday, and the morning air is very refreshing.'
        },
        {
          hanzi: '我和哥哥一起去学校跑步。',
          pinyin: 'wǒ hé gēge yīqǐ qù xuéxiào pǎo bù。',
          english: 'My brother and I go running at school together.'
        },
        {
          hanzi: '那里的操场有很多同学打篮球。',
          pinyin: 'nàlǐ de cāochǎng yǒu hěn duō tóngxué dǎ lánqiú。',
          english: 'There are many classmates playing basketball on the sports ground.'
        },
        {
          hanzi: '大家踢足球，玩得非常快乐。',
          pinyin: 'dàjiā tī zúqiú，wán de fēicháng kuàilè。',
          english: 'Everyone plays football and has a very happy time.'
        },
        {
          hanzi: '经常运动让我们的身体更健康。',
          pinyin: 'jīngcháng yùndòng ràng wǒmen de shēntǐ gèng jiànkāng。',
          english: 'Exercising frequently makes our bodies much healthier.'
        }
      ]
    },
    {
      id: 'my-bedroom',
      title: '我的房间',
      englishTitle: 'My Bedroom',
      level: 'HSK 1',
      intro: 'A short tour of a tidy student bedroom.',
      sentences: [
        { hanzi: '这是我的房间。', pinyin: 'zhè shì wǒ de fángjiān。', english: 'This is my room.' },
        { hanzi: '房间里有一张桌子和一把椅子。', pinyin: 'fángjiān li yǒu yī zhāng zhuōzi hé yī bǎ yǐzi。', english: 'There is a desk and a chair in the room.' },
        { hanzi: '我的电脑在桌子上。', pinyin: 'wǒ de diànnǎo zài zhuōzi shàng。', english: 'My computer is on the desk.' },
        { hanzi: '床很干净，被子是蓝色的。', pinyin: 'chuáng hěn gānjìng，bèizi shì lánsè de。', english: 'The bed is clean, and the quilt is blue.' },
        { hanzi: '我喜欢我的小房间。', pinyin: 'wǒ xǐhuan wǒ de xiǎo fángjiān。', english: 'I like my little room.' },
      ],
      quiz: [
        { q: '房间里有什么？', en: 'What is in the room?', options: ['桌子和椅子', '电视机', '冰箱'], answer: 0 },
        { q: '被子是什么颜色的？', en: 'What color is the quilt?', options: ['红色', '黄色', '蓝色'], answer: 2 },
      ]
    },
    {
      id: 'bus-to-work',
      title: '坐公交上班',
      englishTitle: 'Taking the Bus to Work',
      level: 'HSK 2',
      intro: 'Every morning, Lin takes the bus to the office.',
      sentences: [
        { hanzi: '我每天早上七点半坐公交车上班。', pinyin: 'wǒ měitiān zǎoshang qī diǎn bàn zuò gōngjiāochē shàngbān。', english: 'I take the bus to work at 7:30 every morning.' },
        { hanzi: '车站就在我家门口。', pinyin: 'chēzhàn jiù zài wǒ jiā ménkǒu。', english: 'The bus stop is right outside my home.' },
        { hanzi: '车上人很多，但是我不介意。', pinyin: 'chē shàng rén hěn duō，dànshì wǒ bù jièyì。', english: 'The bus is crowded, but I do not mind.' },
        { hanzi: '坐车的时候我听中文播客。', pinyin: 'zuò chē de shíhou wǒ tīng Zhōngwén bōkè。', english: 'While riding, I listen to Chinese podcasts.' },
        { hanzi: '四十分钟后，我就到公司了。', pinyin: 'sìshí fēnzhōng hòu，wǒ jiù dào gōngsī le。', english: 'Forty minutes later, I arrive at the office.' },
      ],
      quiz: [
        { q: '他几点坐公交？', en: 'When does he take the bus?', options: ['七点半', '八点', '六点'], answer: 0 },
        { q: '坐车时他做什么？', en: 'What does he do on the bus?', options: ['睡觉', '听中文播客', '看书'], answer: 1 },
      ]
    },
    {
      id: 'rainy-day',
      title: '雨天的周末',
      englishTitle: 'A Rainy Weekend',
      level: 'HSK 2',
      intro: 'A quiet rainy Saturday spent indoors with family.',
      sentences: [
        { hanzi: '星期六下了一整天的雨。', pinyin: 'xīngqīliù xià le yī zhěng tiān de yǔ。', english: 'It rained all day on Saturday.' },
        { hanzi: '我们不能出去踢球了。', pinyin: 'wǒmen bù néng chūqù tī qiú le。', english: 'We could not go out to play football.' },
        { hanzi: '妈妈做了很好吃的面条。', pinyin: 'māma zuò le hěn hǎochī de miàntiáo。', english: 'Mom made very delicious noodles.' },
        { hanzi: '下午我们一起看了电影。', pinyin: 'xiàwǔ wǒmen yīqǐ kàn le diànyǐng。', english: 'In the afternoon we watched a movie together.' },
        { hanzi: '下雨的周末也很快乐。', pinyin: 'xià yǔ de zhōumò yě hěn kuàilè。', english: 'A rainy weekend can be happy too.' },
      ],
      quiz: [
        { q: '妈妈做了什么？', en: 'What did Mom make?', options: ['面条', '饺子', '蛋糕'], answer: 0 },
        { q: '他们下午做了什么？', en: 'What did they do in the afternoon?', options: ['踢球', '看电影', '买东西'], answer: 1 },
      ]
    },
    {
      id: 'at-the-market',
      title: '在菜市场',
      englishTitle: 'At the Wet Market',
      level: 'HSK 2',
      intro: 'Shopping for fresh vegetables with a friendly vendor.',
      sentences: [
        { hanzi: '周末我跟奶奶去菜市场买菜。', pinyin: 'zhōumò wǒ gēn nǎinai qù càishìchǎng mǎi cài。', english: 'On weekends I go to the market with Grandma.' },
        { hanzi: '市场里的人真多，真热闹。', pinyin: 'shìchǎng li de rén zhēn duō，zhēn rènao。', english: 'The market is really crowded and lively.' },
        { hanzi: '奶奶会跟卖菜的人说价。', pinyin: 'nǎinai huì gēn mài cài de rén shuō jià。', english: 'Grandma likes to bargain with the vendors.' },
        { hanzi: '我们买了西红柿、鸡蛋和鱼。', pinyin: 'wǒmen mǎi le xīhóngshì、jīdàn hé yú。', english: 'We bought tomatoes, eggs, and fish.' },
        { hanzi: '回家以后，奶奶做了一桌好菜。', pinyin: 'huí jiā yǐhòu，nǎinai zuò le yī zhuō hǎo cài。', english: 'After we got home, Grandma cooked a table full of good dishes.' },
      ],
      quiz: [
        { q: '他们买了什么？', en: 'What did they buy?', options: ['西红柿、鸡蛋和鱼', '苹果和香蕉', '牛肉'], answer: 0 },
        { q: '奶奶和谁说价？', en: 'Who does Grandma bargain with?', options: ['卖菜的人', '我', '服务员'], answer: 0 },
      ]
    },
    {
      id: 'learning-chinese',
      title: '学中文的日子',
      englishTitle: 'Days of Learning Chinese',
      level: 'HSK 2',
      intro: 'The honest diary of a learner typing Chinese every day.',
      sentences: [
        { hanzi: '我叫玛丽亚，学中文半年了。', pinyin: 'wǒ jiào Mǎlìyà，xué Zhōngwén bàn nián le。', english: 'My name is Maria, and I have studied Chinese for half a year.' },
        { hanzi: '刚开始，声调让我头疼。', pinyin: 'gāng kāishǐ，shēngdiào ràng wǒ tóuténg。', english: 'At the beginning, tones gave me a headache.' },
        { hanzi: '现在我每天打字练习半小时。', pinyin: 'xiànzài wǒ měitiān dǎzì liànxí bàn xiǎoshí。', english: 'Now I practice typing for half an hour every day.' },
        { hanzi: '打错的时候，我就记住那个词。', pinyin: 'dǎ cuò de shíhou，wǒ jiù jìzhù nàge cí。', english: 'When I type a word wrong, I remember it.' },
        { hanzi: '能用自己的话聊天，感觉真好。', pinyin: 'néng yòng zìjǐ de huà liáotiān，gǎnjué zhēn hǎo。', english: 'It feels great to chat in my own words.' },
      ],
      quiz: [
        { q: '玛丽亚学中文多久了？', en: 'How long has Maria studied Chinese?', options: ['半年', '两年', '一个月'], answer: 0 },
        { q: '她现在每天做什么？', en: 'What does she do every day now?', options: ['看电视剧', '打字练习半小时', '写汉字'], answer: 1 },
      ]
    },
    {
      id: 'winter-snow',
      title: '第一场雪',
      englishTitle: 'The First Snow',
      level: 'HSK 2',
      intro: 'The city turns white and children run outside.',
      sentences: [
        { hanzi: '今天早上，外面下雪了。', pinyin: 'jīntiān zǎoshang，wàimiàn xià xuě le。', english: 'It snowed outside this morning.' },
        { hanzi: '这是今年冬天的第一场雪。', pinyin: 'zhè shì jīnnián dōngtiān de dì yī chǎng xuě。', english: 'This is the first snow of this winter.' },
        { hanzi: '孩子们在公园里堆雪人。', pinyin: 'háizimen zài gōngyuán li duī xuěrén。', english: 'The children are building snowmen in the park.' },
        { hanzi: '弟弟的手虽然冷，但是他很开心。', pinyin: 'dìdi de shǒu suīrán lěng，dànshì tā hěn kāixīn。', english: 'My little brother has cold hands, but he is very happy.' },
        { hanzi: '妈妈给我们拍了好多照片。', pinyin: 'māma gěi wǒmen pāi le hǎoduō zhàopiàn。', english: 'Mom took lots of photos of us.' },
      ],
      quiz: [
        { q: '孩子们在公园做什么？', en: 'What are the children doing in the park?', options: ['堆雪人', '跑步', '拍照'], answer: 0 },
        { q: '谁拍了照片？', en: 'Who took the photos?', options: ['爸爸', '妈妈', '老师'], answer: 1 },
      ]
    },
    {
      id: 'grandmas-dumplings',
      title: '奶奶的饺子',
      englishTitle: 'Grandma and the Dumplings',
      level: 'HSK 3',
      intro: 'Sunday dumpling-making is a family tradition.',
      sentences: [
        { hanzi: '每个星期天，我们全家在奶奶家包饺子。', pinyin: 'měi gè xīngqītiān，wǒmen quánjiā zài nǎinai jiā bāo jiǎozi。', english: 'Every Sunday, our whole family makes dumplings at Grandma\'s place.' },
        { hanzi: '奶奶调的馅儿特别香。', pinyin: 'nǎinai tiáo de xiànr tèbié xiāng。', english: 'The filling Grandma mixes is especially fragrant.' },
        { hanzi: '我包的饺子总是站不住，可是味道不错。', pinyin: 'wǒ bāo de jiǎozi zǒngshì zhàn bu zhù，kěshì wèidào búcuò。', english: 'My dumplings never stand up, but they taste fine.' },
        { hanzi: '爸爸负责煮饺子，他一会儿就端上来了。', pinyin: 'bàba fùzé zhǔ jiǎozi，tā yíhuìr jiù duān shàng lái le。', english: 'Dad is in charge of boiling them, and he serves them in no time.' },
        { hanzi: '一家人围着一桌热饺子，比什么都幸福。', pinyin: 'yī jiā rén wéi zhe yī zhuō rè jiǎozi，bǐ shénme dōu xìngfú。', english: 'The whole family around a table of hot dumplings is happier than anything.' },
      ],
      quiz: [
        { q: '他们星期天做什么？', en: 'What do they do on Sundays?', options: ['去饭店', '在奶奶家包饺子', '看电影'], answer: 1 },
        { q: '谁负责煮饺子？', en: 'Who boils the dumplings?', options: ['奶奶', '我', '爸爸'], answer: 2 },
      ]
    },
    {
      id: 'lost-phone',
      title: '手机不见了',
      englishTitle: 'The Lost Phone',
      level: 'HSK 3',
      intro: 'A small panic on the subway turns into a lesson.',
      sentences: [
        { hanzi: '昨天下午，我发现手机不见了。', pinyin: 'zuótiān xiàwǔ，wǒ fāxiàn shǒujī bú jiàn le。', english: 'Yesterday afternoon, I discovered my phone was missing.' },
        { hanzi: '我把书包翻了个遍，也没有找到。', pinyin: 'wǒ bǎ shūbāo fān le gè biàn，yě méiyou zhǎodào。', english: 'I searched my bag completely but could not find it.' },
        { hanzi: '我着急地沿着原路一边走一边找。', pinyin: 'wǒ zháojí de yánzhe yuánlù yībiān zǒu yībiān zhǎo。', english: 'Anxiously, I walked back along my route while searching.' },
        { hanzi: '最后，地铁站的叔叔把手机还给了我。', pinyin: 'zuìhòu，dìtiě zhàn de shūshu bǎ shǒujī huán gěi le wǒ。', english: 'In the end, an uncle at the subway station returned my phone to me.' },
        { hanzi: '从那以后，我再也不马虎了。', pinyin: 'cóng nà yǐhòu，wǒ zài yě bù mǎhu le。', english: 'Since then, I am never careless anymore.' },
      ],
      quiz: [
        { q: '手机是在哪里找到的？', en: 'Where was the phone found?', options: ['书包里', '地铁站', '饭店'], answer: 1 },
        { q: '作者最后明白了什么？', en: 'What did the writer learn?', options: ['别马虎', '别坐地铁', '别丢书包'], answer: 0 },
      ]
    },
  ];

  var api = {
    STORIES: STORIES,
    getById: function (id) {
      for (var i = 0; i < STORIES.length; i++) {
        if (STORIES[i].id === id) return STORIES[i];
      }
      return STORIES[0];
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.Stories = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
