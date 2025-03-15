const fs = require('fs');
const path = require('path');
const prompts = require('@inquirer/prompts');
const natsort = require('natsort').default;

let language = 'en'; // zh:中文 en:英文
const i18n = require(`./locales/${language}.js`);
const minWordsForLongSentence = 5; // 定义长句子的最小单词数

// 读取指定目录中的所有 JSON 文件
const loadUnits = () => {
  const dataDir = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataDir);
  const units = [];

  // 对文件名进行自然排序
  const sortedFiles = files.sort(natsort());

  sortedFiles.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(dataDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      units.push({ name: file, data: content });
    }
  });

  return units;
};

// 清理用户输入的多余空格
const cleanInput = (input) => {
  return input.trim().replace(/\s+/g, ' ').toLowerCase();
};

// 校验答案是否正确
const checkAnswer = (userInput, correctAnswer) => {
  return cleanInput(userInput) === cleanInput(correctAnswer);
};

// 游戏题目展示
const askQuestions = async (unitData) => {
  let questionIndex = 0;
  let errorCount = 0;
  
  while (questionIndex < unitData.length) {
    const question = unitData[questionIndex];
    
    // 显示中文提示
    console.log(`\n${i18n.chineseHint}\x1b[30m${question.chinese}\x1b[0m`);
    console.log('\n');

    // 等待玩家输入
    let userAnswer = await prompts.input({ message: i18n.inputTranslation });
    userAnswer = userAnswer.trim();

    // 校验答案
    while (!checkAnswer(userAnswer, question.english)) {
      errorCount++;
    
      console.log(i18n.wrongAnswer);
      if (errorCount >= 3) {
        console.log(`\x1b[31m${i18n.correctAnswer}${question.english}\x1b[0m`);
      }
      userAnswer = await prompts.input({ message: i18n.inputTranslation });
      
      // 确保直到正确答案
      if (checkAnswer(userAnswer, question.english)) {
        break;
      }
    }

    // 如果正确，继续到下一个问题
    console.log(`${i18n.correct}\n`);
    questionIndex++;

    errorCount = 0; // 重置错误次数
  }

  console.log(`${i18n.unitCompleted}\n`);
};

// 随机选择单元
const selectRandomUnit = (units) => {
  const randomIndex = Math.floor(Math.random() * units.length);
  return units[randomIndex];
};

// 主菜单
const mainMenu = async () => {
    const units = loadUnits();
  
    const modeChoice = await prompts.select({
      message: i18n.selectMode,
      choices: [
        { name: i18n.manualMode, value: 'manual' },
        { name: i18n.randomMode, value: 'random' }
      ]
    });
  
    let selectedUnits = [];
  
    if (modeChoice === 'manual') {
      const unitChoice = await prompts.checkbox({
        message: i18n.selectUnits,
        choices: units.map((unit, index) => ({ name: unit.name, value: index })),
        min: 1 // 至少选择一个单元
      });
  
      selectedUnits = unitChoice.map(index => units[index].data);
    } else {
      const randomUnit = selectRandomUnit(units);
      selectedUnits = [randomUnit.data];
    }
  
    const practiceMode = await prompts.select({
      message: i18n.practiceMode,
      choices: [
        { name: i18n.normalOrdered, value: 'ordered' },
        { name: i18n.normalShuffled, value: 'shuffled' },
        { name: i18n.longSentenceMode, value: 'longSentence' }
      ]
    });
  
    if (practiceMode === 'shuffled') {
      selectedUnits.forEach(unit => {
        unit.sort(() => Math.random() - 0.5);
      });
    } else if (practiceMode === 'longSentence') {
      // 合并所有单元的数据
      let allSentences = [];
      selectedUnits.forEach(unit => {
        allSentences = allSentences.concat(unit);
      });

      // 筛选出长句子（英文单词数大于设定值的句子）
      const longSentences = allSentences.filter(sentence => 
        sentence.english.split(' ').length >= minWordsForLongSentence
      );

      // 打乱长句子的顺序
      selectedUnits = [longSentences.sort(() => Math.random() - 0.5)];
    }
  
    for (const unitData of selectedUnits) {
      await askQuestions(unitData);
    }
  
    const returnToMenu = await prompts.input({
      message: i18n.pressAnyKey
    });
  
    mainMenu();
};
  

// 启动游戏
mainMenu();