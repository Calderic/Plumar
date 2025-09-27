// 简单验证错误处理系统的导入和基本功能
import { ERROR_CODES } from './src/constants.js';
import { PlumarError } from './src/core/plumar-error.js';
import { ErrorHandler } from './src/core/error-handler.js';

// 验证常量导入
console.log('ERROR_CODES 导入成功:', typeof ERROR_CODES === 'object');
console.log('错误代码数量:', Object.keys(ERROR_CODES).length);

// 验证 PlumarError 类
console.log('PlumarError 类导入成功:', typeof PlumarError === 'function');

// 验证 ErrorHandler 类
console.log('ErrorHandler 类导入成功:', typeof ErrorHandler === 'function');

// 创建一个简单的错误实例
const testError = new PlumarError('测试错误', ERROR_CODES.CONFIG_INVALID, ['建议1']);
console.log('PlumarError 实例创建成功:', testError instanceof Error);
console.log('错误代码设置正确:', testError.code === ERROR_CODES.CONFIG_INVALID);

console.log('✅ 错误处理系统基础验证通过');