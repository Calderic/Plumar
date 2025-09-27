import { ERROR_CODES } from '../constants.js';

/**
 * Plumar 自定义错误类
 * 提供错误代码和建议信息支持
 */
export class PlumarError extends Error {
  /**
   * 创建 PlumarError 实例
   * @param {string} message - 错误消息
   * @param {string} code - 错误代码
   * @param {string[]} suggestions - 解决建议
   * @param {Error} originalError - 原始错误对象
   */
  constructor(message, code = ERROR_CODES.UNKNOWN_ERROR, suggestions = [], originalError = null) {
    super(message);
    
    this.name = 'PlumarError';
    this.code = code;
    this.suggestions = suggestions;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    // 确保错误堆栈正确显示
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PlumarError);
    }
  }

  /**
   * 创建站点未找到错误
   * @param {string} directory - 目录路径
   * @returns {PlumarError}
   */
  static siteNotFound(directory = process.cwd()) {
    return new PlumarError(
      `未在目录 "${directory}" 中找到 Plumar 站点配置`,
      ERROR_CODES.SITE_NOT_FOUND,
      [
        '请确保您在 Plumar 站点根目录中运行此命令',
        '如果这是新项目，请先运行 "plumar init <site-name>" 初始化站点',
        '检查当前目录是否包含 plumar.config.yml 文件'
      ]
    );
  }

  /**
   * 创建配置文件错误
   * @param {string} message - 错误消息
   * @param {string} configPath - 配置文件路径
   * @param {Error} originalError - 原始错误
   * @returns {PlumarError}
   */
  static configError(message, configPath, originalError = null) {
    return new PlumarError(
      `配置文件错误: ${message}`,
      ERROR_CODES.CONFIG_INVALID,
      [
        `检查配置文件 "${configPath}" 的语法是否正确`,
        '确保所有必需的配置项都已设置',
        '参考文档了解正确的配置格式',
        '可以删除配置文件让系统重新生成默认配置'
      ],
      originalError
    );
  }

  /**
   * 创建模板未找到错误
   * @param {string} templateName - 模板名称
   * @param {string[]} searchPaths - 搜索路径
   * @returns {PlumarError}
   */
  static templateNotFound(templateName, searchPaths = []) {
    const suggestions = [
      '检查 Plumar 是否正确安装',
      '确保模板文件没有被意外删除',
      '尝试重新安装 Plumar'
    ];
    
    if (searchPaths.length > 0) {
      suggestions.push(`搜索路径: ${searchPaths.join(', ')}`);
    }

    return new PlumarError(
      `未找到模板 "${templateName}"`,
      ERROR_CODES.TEMPLATE_NOT_FOUND,
      suggestions
    );
  }

  /**
   * 创建文件操作错误
   * @param {string} operation - 操作类型
   * @param {string} filePath - 文件路径
   * @param {Error} originalError - 原始错误
   * @returns {PlumarError}
   */
  static fileOperationError(operation, filePath, originalError = null) {
    const suggestions = [];
    
    if (originalError?.code === 'ENOENT') {
      suggestions.push('检查文件或目录是否存在', '确保路径拼写正确');
    } else if (originalError?.code === 'EACCES') {
      suggestions.push('检查文件权限', '尝试使用管理员权限运行');
    } else if (originalError?.code === 'ENOSPC') {
      suggestions.push('检查磁盘空间是否充足', '清理不必要的文件');
    } else {
      suggestions.push('检查文件路径和权限', '确保目标目录存在');
    }

    return new PlumarError(
      `文件操作失败: 无法${operation} "${filePath}"`,
      ERROR_CODES.FILE_OPERATION_ERROR,
      suggestions,
      originalError
    );
  }

  /**
   * 创建 YAML 解析错误
   * @param {string} message - 错误消息
   * @param {string} filePath - 文件路径
   * @param {number} line - 错误行号
   * @param {number} column - 错误列号
   * @returns {PlumarError}
   */
  static yamlParseError(message, filePath, line = null, column = null) {
    let errorMessage = `YAML 解析错误: ${message}`;
    if (line !== null) {
      errorMessage += ` (第 ${line} 行`;
      if (column !== null) {
        errorMessage += `, 第 ${column} 列`;
      }
      errorMessage += ')';
    }

    return new PlumarError(
      errorMessage,
      ERROR_CODES.YAML_PARSE_ERROR,
      [
        `检查文件 "${filePath}" 的 YAML 语法`,
        '确保缩进使用空格而不是制表符',
        '检查引号、冒号和破折号的使用',
        '使用在线 YAML 验证器检查语法'
      ]
    );
  }

  /**
   * 创建参数错误
   * @param {string} message - 错误消息
   * @param {string} argument - 参数名
   * @returns {PlumarError}
   */
  static argumentError(message, argument = null) {
    const suggestions = [
      '使用 --help 查看命令用法',
      '检查参数格式是否正确'
    ];
    
    if (argument) {
      suggestions.push(`检查参数 "${argument}" 的值`);
    }

    return new PlumarError(
      `参数错误: ${message}`,
      ERROR_CODES.INVALID_ARGUMENT,
      suggestions
    );
  }

  /**
   * 将错误转换为 JSON 格式
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      suggestions: this.suggestions,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        code: this.originalError.code
      } : null
    };
  }

  /**
   * 获取用户友好的错误描述
   * @returns {string}
   */
  getUserFriendlyMessage() {
    let message = `❌ ${this.message}`;
    
    if (this.suggestions.length > 0) {
      message += '\n\n💡 建议解决方案:';
      this.suggestions.forEach((suggestion, index) => {
        message += `\n  ${index + 1}. ${suggestion}`;
      });
    }
    
    return message;
  }
}