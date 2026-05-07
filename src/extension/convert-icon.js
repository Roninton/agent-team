#!/usr/bin/env node
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

const inputPath = path.join(__dirname, 'resources/icon.svg');
const outputPath = path.join(__dirname, 'resources/icon.png');

async function convertSvgToPng() {
  try {
    // 检查SVG文件是否存在
    await fs.access(inputPath);
    
    // 转换为128x128 PNG，符合VS Code扩展图标要求
    await sharp(inputPath)
      .resize(128, 128)
      .png({ quality: 100 })
      .toFile(outputPath);
    
    console.log('✅ 图标转换成功！已生成 resources/icon.png (128x128)');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('❌ 错误：未找到 resources/icon.svg 文件，请先创建SVG图标');
    } else {
      console.error('❌ 转换失败：', error.message);
    }
    process.exit(1);
  }
}

convertSvgToPng();
