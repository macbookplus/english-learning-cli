const fs = require('fs');
const path = require('path');
const prompts = require('@inquirer/prompts');

// 读取指定目录中的所有 JSON 文件
const loadUnits = () => {
  const dataDir = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataDir);
  const units = [];

  files.forEach(file => {
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
    console.log(`\n中文释义：${question.chinese}`);

    // 等待玩家输入
    let userAnswer = await prompts.input({ message: '请输入英文翻译：' });
    userAnswer = userAnswer.trim();

    // 校验答案
    while (!checkAnswer(userAnswer, question.english)) {
      errorCount++;
    
      console.log('回答错误，请再试。');
      if (errorCount >= 3) {
        console.log(`\x1b[31m正确答案是：${question.english}\x1b[0m`);
      }
      userAnswer = await prompts.input({ message: '请输入英文翻译：' });
      
      // 确保直到正确答案
      if (checkAnswer(userAnswer, question.english)) {
        break;
      }
    }

    // 如果正确，继续到下一个问题
    console.log('回答正确！\n');
    questionIndex++;

    errorCount = 0; // 重置错误次数
  }

  console.log('恭喜完成所选单元！\n');
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
      message: '请选择模式：',
      choices: [
        { name: '手动选择单元', value: 'manual' },
        { name: '随机选择单元', value: 'random' }
      ]
    });
  
    let selectedUnits = [];
  
    if (modeChoice === 'manual') {
      const unitChoice = await prompts.checkbox({
        message: '选择一个或多个单元：',
        choices: units.map((unit, index) => ({ name: unit.name, value: index })),
        min: 1 // 至少选择一个单元
      });
  
      selectedUnits = unitChoice.map(index => units[index].data);
    } else {
      const randomUnit = selectRandomUnit(units);
      selectedUnits = [randomUnit.data];
    }
  
    const shuffleChoice = await prompts.select({
      message: '是否按顺序做题：',
      choices: [
        { name: '是', value: 'ordered' },
        { name: '否（打乱顺序）', value: 'shuffled' }
      ]
    });
  
    if (shuffleChoice === 'shuffled') {
      selectedUnits.forEach(unit => {
        unit.sort(() => Math.random() - 0.5);
      });
    }
  
    for (const unitData of selectedUnits) {
      await askQuestions(unitData);
    }
  
    const returnToMenu = await prompts.input({
      message: '输入任意键返回首页...'
    });
  
    mainMenu(); // 返回主菜单
  };
  

// 启动游戏
mainMenu();