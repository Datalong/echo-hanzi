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
    }
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
