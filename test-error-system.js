#!/usr/bin/env node

import { PlumarError } from './src/core/plumar-error.js';
import { ErrorHandler } from './src/core/error-handler.js';
import { ERROR_CODES } from './src/constants.js';

console.log('🧪 测试错误处理系统...\n');

// 测试 1: PlumarError 基本功能
console.log('1. 测试 PlumarError 基本功能:');
try {
  const error = new PlumarError(
    '这是一个测试错误',
    ERROR_CODES.CONFIG_INVALID,
    ['建议1', '建议2']
  );
  console.log('✅ PlumarError 创建成功');
  console.log('   错误代码:', error.code);
  console.log('   建议数量:', error.suggestions.length);
} catch (e) {
  console.log('❌ PlumarError 创建失败:', e.message);
}

// 测试 2: 静态工厂方法
console.log('\n2. 测试静态工厂方法:');
try {
  const siteError = PlumarError.siteNotFound('/test/path');
  console.log('✅ siteNotFound 方法正常');
  console.log('   错误代码:', siteError.code);
  
  const configError = PlumarError.configError('配置解析失败', 'config.yml');
  console.log('✅ configError 方法正常');
  console.log('   错误代码:', configError.code);
} catch (e) {
  console.log('❌ 静态工厂方法失败:', e.message);
}

// 测试 3: ErrorHandler 错误推断
console.log('\n3. 测试 ErrorHandler 错误推断:');
try {
  const fsError = new Error('ENOENT: no such file or directory');
  fsError.code = 'ENOENT';
  const inferredCode = ErrorHandler.inferErrorCode(fsError);
  console.log('✅ 错误推断正常');
  console.log('   推断结果:', inferredCode);
  console.log('   期望结果:', ERROR_CODES.FILE_NOT_FOUND);
  console.log('   匹配:', inferredCode === ERROR_CODES.FILE_NOT_FOUND ? '✅' : '❌');
} catch (e) {
  console.log('❌ 错误推断失败:', e.message);
}

// 测试 4: 建议生成
console.log('\n4. 测试建议生成:');
try {
  const suggestions = ErrorHandler.generateSuggestions(ERROR_CODES.SITE_NOT_FOUND);
  console.log('✅ 建议生成正常');
  console.log('   建议数量:', suggestions.length);
  console.log('   第一个建议:', suggestions[0]);
} catch (e) {
  console.log('❌ 建议生成失败:', e.message);
}

// 测试 5: 错误转换
console.log('\n5. 测试错误转换:');
try {
  const originalError = new Error('原始错误消息');
  const convertedError = ErrorHandler.convertToPlumarError(originalError);
  console.log('✅ 错误转换正常');
  console.log('   转换后类型:', convertedError.constructor.name);
  console.log('   是否为 PlumarError:', convertedError instanceof PlumarError ? '✅' : '❌');
} catch (e) {
  console.log('❌ 错误转换失败:', e.message);
}

// 测试 6: 用户友好消息
console.log('\n6. 测试用户友好消息:');
try {
  const error = PlumarError.siteNotFound();
  const friendlyMessage = error.getUserFriendlyMessage();
  console.log('✅ 用户友好消息生成正常');
  console.log('   消息长度:', friendlyMessage.length);
  console.log('   包含建议:', friendlyMessage.includes('建议解决方案') ? '✅' : '❌');
} catch (e) {
  console.log('❌ 用户友好消息生成失败:', e.message);
}

console.log('\n🎉 错误处理系统测试完成!');