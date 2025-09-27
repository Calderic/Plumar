import { PlumarError } from './plumar-error.js';
import { ERROR_CODES } from '../constants.js';

/**
 * 统一错误处理器
 * 提供用户友好的错误信息展示和错误恢复机制
 */
export class ErrorHandler {
  /**
   * 处理错误并显示用户友好的信息
   * @param {Error} error - 要处理的错误
   * @param {boolean} exitProcess - 是否退出进程
   * @param {boolean} verbose - 是否显示详细信息
   */
  static handle(error, exitProcess = true, verbose = false) {
    let displayError;
    
    if (error instanceof PlumarError) {
      displayError = error;
    } else {
      // 将普通错误转换为 PlumarError
      displayError = this.convertToPlumarError(error);
    }
    
    // 显示错误信息
    this.displayError(displayError, verbose);
    
    // 尝试错误恢复
    this.attemptRecovery(displayError);
    
    if (exitProcess) {
      process.exit(1);
    }
  }

  /**
   * 将普通错误转换为 PlumarError
   * @param {Error} error - 原始错误
   * @returns {PlumarError}
   */
  static convertToPlumarError(error) {
    // 根据错误类型和消息推断错误代码
    const code = this.inferErrorCode(error);
    const suggestions = this.generateSuggestions(code, error);
    
    return new PlumarError(
      error.message || '发生未知错误',
      code,
      suggestions,
      error
    );
  }

  /**
   * 推断错误代码
   * @param {Error} error - 错误对象
   * @returns {string}
   */
  static inferErrorCode(error) {
    if (!error) return ERROR_CODES.UNKNOWN_ERROR;
    
    const message = error.message?.toLowerCase() || '';
    const code = error.code;
    
    // 文件系统错误
    if (code === 'ENOENT') return ERROR_CODES.FILE_NOT_FOUND;
    if (code === 'EACCES') return ERROR_CODES.PERMISSION_DENIED;
    if (code === 'ENOSPC') return ERROR_CODES.DISK_SPACE_INSUFFICIENT;
    if (code === 'EEXIST') return ERROR_CODES.FILE_ALREADY_EXISTS;
    
    // 网络错误
    if (code === 'ENOTFOUND' || code === 'ECONNREFUSED') return ERROR_CODES.NETWORK_ERROR;
    if (code === 'ETIMEDOUT') return ERROR_CODES.TIMEOUT_ERROR;
    
    // 根据错误消息推断
    if (message.includes('yaml') || message.includes('parse')) {
      return ERROR_CODES.YAML_PARSE_ERROR;
    }
    if (message.includes('config')) {
      return ERROR_CODES.CONFIG_INVALID;
    }
    if (message.includes('template')) {
      return ERROR_CODES.TEMPLATE_NOT_FOUND;
    }
    if (message.includes('argument') || message.includes('parameter')) {
      return ERROR_CODES.INVALID_ARGUMENT;
    }
    
    return ERROR_CODES.UNKNOWN_ERROR;
  }

  /**
   * 根据错误代码生成建议
   * @param {string} errorCode - 错误代码
   * @param {Error} originalError - 原始错误
   * @returns {string[]}
   */
  static generateSuggestions(errorCode, originalError = null) {
    const suggestions = [];
    
    switch (errorCode) {
      case ERROR_CODES.SITE_NOT_FOUND:
        suggestions.push(
          '确保您在 Plumar 站点根目录中运行此命令',
          '如果这是新项目，请先运行 "plumar init <site-name>"',
          '检查当前目录是否包含 plumar.config.yml 文件'
        );
        break;
        
      case ERROR_CODES.PERMISSION_DENIED:
        suggestions.push(
          '检查文件和目录的权限设置',
          '尝试使用管理员权限运行命令',
          '确保当前用户有足够的权限访问目标文件'
        );
        break;
        
      case ERROR_CODES.FILE_NOT_FOUND:
        suggestions.push(
          '检查文件路径是否正确',
          '确保文件确实存在',
          '检查文件名的拼写'
        );
        break;
        
      case ERROR_CODES.CONFIG_INVALID:
        suggestions.push(
          '检查配置文件的语法是否正确',
          '确保所有必需的配置项都已设置',
          '参考文档了解正确的配置格式'
        );
        break;
        
      case ERROR_CODES.TEMPLATE_NOT_FOUND:
        suggestions.push(
          '检查 Plumar 是否正确安装',
          '确保模板文件没有被删除',
          '尝试重新安装 Plumar'
        );
        break;
        
      case ERROR_CODES.YAML_PARSE_ERROR:
        suggestions.push(
          '检查 YAML 文件的语法',
          '确保缩进使用空格而不是制表符',
          '检查引号和特殊字符的使用'
        );
        break;
        
      case ERROR_CODES.DISK_SPACE_INSUFFICIENT:
        suggestions.push(
          '检查磁盘空间是否充足',
          '清理不必要的文件',
          '选择其他位置保存文件'
        );
        break;
        
      case ERROR_CODES.NETWORK_ERROR:
        suggestions.push(
          '检查网络连接',
          '确认目标服务器是否可访问',
          '检查防火墙设置'
        );
        break;
        
      case ERROR_CODES.INVALID_ARGUMENT:
        suggestions.push(
          '使用 --help 查看命令用法',
          '检查参数格式是否正确',
          '确保提供了所有必需的参数'
        );
        break;
        
      default:
        suggestions.push(
          '检查命令是否正确',
          '查看文档获取更多帮助',
          '如果问题持续存在，请报告此错误'
        );
    }
    
    return suggestions;
  }

  /**
   * 显示错误信息
   * @param {PlumarError} error - 错误对象
   * @param {boolean} verbose - 是否显示详细信息
   */
  static displayError(error, verbose = false) {
    console.error('\n' + error.getUserFriendlyMessage());
    
    if (verbose && error.originalError) {
      console.error('\n🔍 详细错误信息:');
      console.error(`  原始错误: ${error.originalError.name}: ${error.originalError.message}`);
      if (error.originalError.code) {
        console.error(`  错误代码: ${error.originalError.code}`);
      }
      if (error.originalError.stack) {
        console.error(`  堆栈跟踪:\n${error.originalError.stack}`);
      }
    }
    
    console.error(''); // 添加空行
  }

  /**
   * 尝试错误恢复
   * @param {PlumarError} error - 错误对象
   */
  static attemptRecovery(error) {
    switch (error.code) {
      case ERROR_CODES.CONFIG_NOT_FOUND:
        console.log('🔧 尝试创建默认配置文件...');
        // 这里可以调用配置创建逻辑
        break;
        
      case ERROR_CODES.TEMPLATE_NOT_FOUND:
        console.log('🔧 尝试使用内置模板...');
        // 这里可以调用备用模板逻辑
        break;
        
      default:
        // 大多数错误不需要自动恢复
        break;
    }
  }

  /**
   * 创建错误报告
   * @param {PlumarError} error - 错误对象
   * @returns {string}
   */
  static createErrorReport(error) {
    const report = {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      error: error.toJSON()
    };
    
    return JSON.stringify(report, null, 2);
  }

  /**
   * 安全地执行可能出错的操作
   * @param {Function} operation - 要执行的操作
   * @param {string} operationName - 操作名称
   * @param {boolean} throwOnError - 是否在出错时抛出异常
   * @returns {Promise<any>}
   */
  static async safeExecute(operation, operationName = '操作', throwOnError = false) {
    try {
      return await operation();
    } catch (error) {
      const plumarError = error instanceof PlumarError 
        ? error 
        : new PlumarError(
            `执行${operationName}时出错: ${error.message}`,
            this.inferErrorCode(error),
            this.generateSuggestions(this.inferErrorCode(error), error),
            error
          );
      
      if (throwOnError) {
        throw plumarError;
      } else {
        this.handle(plumarError, false);
        return null;
      }
    }
  }

  /**
   * 验证环境是否为 Plumar 站点
   * @param {string} directory - 目录路径
   * @throws {PlumarError}
   */
  static async validateSiteEnvironment(directory = process.cwd()) {
    const { existsSync } = await import('fs');
    const { join } = await import('path');
    
    const configPath = join(directory, 'plumar.config.yml');
    if (!existsSync(configPath)) {
      throw PlumarError.siteNotFound(directory);
    }
  }

  /**
   * 包装异步函数以提供统一错误处理
   * @param {Function} fn - 要包装的函数
   * @returns {Function}
   */
  static wrapAsync(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error);
      }
    };
  }
}