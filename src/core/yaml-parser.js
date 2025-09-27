import { PlumarError } from './plumar-error.js';

/**
 * 轻量级 YAML 解析与序列化工具
 * 支持缩进式对象、数组、基础标量以及简单内联对象
 */
class YAMLParser {
  /**
   * 解析 YAML 字符串
   * @param {string} input - YAML 内容
   * @param {{ filePath?: string, context?: string }} [options]
   * @returns {Object}
   */
  static parse(input, options = {}) {
    const { filePath = '配置文件', context = '配置' } = options;

    if (typeof input !== 'string') {
      throw PlumarError.yamlParseError(
        `${context}解析失败: 输入类型无效`,
        filePath
      );
    }

    const normalized = input.replace(/\t/g, '  ');
    const lines = normalized.split(/\r?\n/);
    const stack = [{ indent: -1, container: {} }];
    const pathStack = ['root'];

    for (let index = 0; index < lines.length; index += 1) {
      const rawLine = lines[index];
      const line = YAMLParser.stripComments(rawLine);

      if (!line.trim()) {
        continue;
      }

      const indent = YAMLParser.getIndent(line, filePath, index + 1);
      const trimmed = line.trim();

      while (indent < stack[stack.length - 1].indent) {
        stack.pop();
        pathStack.pop();
      }

      const currentContainer = stack[stack.length - 1].container;
      const currentPath = pathStack[pathStack.length - 1];

      try {
        if (trimmed.startsWith('- ')) {
          YAMLParser.parseArrayItem({
            line: trimmed,
            indent,
            stack,
            pathStack,
            lineNumber: index + 1,
            filePath,
            context,
          });
          continue;
        }

        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) {
          throw new Error('缺少键名或冒号');
        }

        const key = trimmed.slice(0, colonIndex).trim();
        const valuePart = trimmed.slice(colonIndex + 1).trim();

        if (!key) {
          throw new Error('检测到空键名');
        }

        if (valuePart === '') {
          const nextMeaningful = YAMLParser.peekNextMeaningfulLine(lines, index + 1);

          let value;
          if (nextMeaningful && nextMeaningful.indent > indent) {
            value = nextMeaningful.trimmed.startsWith('- ') ? [] : {};
          } else {
            value = {};
          }

          currentContainer[key] = value;
          stack.push({ indent: indent + 2, container: value });
          pathStack.push(`${currentPath}.${key}`);
        } else {
          currentContainer[key] = YAMLParser.parseScalar(valuePart);
        }
      } catch (error) {
        throw PlumarError.yamlParseError(
          `${context}解析失败: ${error.message}`,
          filePath,
          index + 1
        );
      }
    }

    return stack[0].container;
  }

  /**
   * 将对象序列化为 YAML 字符串
   * @param {any} value - 要序列化的值
   * @param {number} indent - 缩进级别
   * @returns {string}
   */
  static stringify(value, indent = 0) {
    if (Array.isArray(value)) {
      return YAMLParser.stringifyArray(value, indent);
    }

    if (value && typeof value === 'object') {
      return YAMLParser.stringifyObject(value, indent);
    }

    return YAMLParser.formatScalar(value);
  }

  /**
   * 解析数组项
   */
  static parseArrayItem({ line, indent, stack, pathStack, lineNumber, filePath, context }) {
    const parentFrame = stack[stack.length - 1];
    const container = parentFrame.container;

    if (!Array.isArray(container)) {
      throw new Error('数组项位置错误');
    }

    const valueString = line.slice(1).trim();

    if (!valueString) {
      const newItem = {};
      container.push(newItem);
      stack.push({ indent: indent + 2, container: newItem });
      pathStack.push(`${pathStack[pathStack.length - 1]}[${container.length - 1}]`);
      return;
    }

    if (valueString.includes(':')) {
      const colonIndex = valueString.indexOf(':');
      const key = valueString.slice(0, colonIndex).trim();
      const rest = valueString.slice(colonIndex + 1).trim();

      if (!key) {
        throw new Error('数组内对象的键名为空');
      }

      const obj = { [key]: YAMLParser.parseScalar(rest) };
      container.push(obj);
      stack.push({ indent: indent + 2, container: obj });
      pathStack.push(`${pathStack[pathStack.length - 1]}[${container.length - 1}]`);
      return;
    }

    container.push(YAMLParser.parseScalar(valueString));
  }

  /**
   * 去除注释
   */
  static stripComments(line) {
    let result = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      }

      if (char === '#' && !inSingleQuote && !inDoubleQuote) {
        break;
      }

      result += char;
    }

    return result;
  }

  /**
   * 计算缩进
   */
  static getIndent(line, filePath, lineNumber) {
    const match = line.match(/^(\s*)/);
    const spaces = (match ? match[1] : '').replace(/\t/g, '  ');

    if (spaces.length % 2 !== 0) {
      throw new Error(`缩进非 2 的倍数 (第 ${lineNumber} 行)`);
    }

    return spaces.length;
  }

  /**
   * 预览下一行有意义的内容，用于判断对象/数组
   */
  static peekNextMeaningfulLine(lines, startIndex) {
    for (let i = startIndex; i < lines.length; i += 1) {
      const stripped = YAMLParser.stripComments(lines[i]);
      if (!stripped.trim()) {
        continue;
      }

      const indent = YAMLParser.getIndent(stripped, '', i + 1);
      return { indent, trimmed: stripped.trim() };
    }

    return null;
  }

  /**
   * 解析标量值
   */
  static parseScalar(value) {
    if (value === '[]') return [];
    if (value === '{}') return {};
    if (value === '~' || value.toLowerCase() === 'null') return null;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    if (/^[-+]?\d+$/.test(value)) {
      const intValue = Number(value);
      if (!Number.isNaN(intValue)) {
        return intValue;
      }
    }

    if (/^[-+]?\d*\.\d+$/.test(value)) {
      const floatValue = Number(value);
      if (!Number.isNaN(floatValue)) {
        return floatValue;
      }
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    return value;
  }

  /**
   * 序列化对象
   */
  static stringifyObject(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let output = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          output += `${spaces}${key}:\n${YAMLParser.stringifyArray(value, indent + 1)}`;
        } else {
          output += `${spaces}${key}:\n${YAMLParser.stringifyObject(value, indent + 1)}`;
        }
      } else {
        output += `${spaces}${key}: ${YAMLParser.formatScalar(value)}\n`;
      }
    }

    return output;
  }

  /**
   * 序列化数组
   */
  static stringifyArray(arr, indent = 0) {
    const spaces = '  '.repeat(indent);
    let output = '';

    for (const item of arr) {
      if (item && typeof item === 'object') {
        if (Array.isArray(item)) {
          output += `${spaces}-\n${YAMLParser.stringifyArray(item, indent + 1)}`;
        } else {
          const nested = YAMLParser.stringifyObject(item, indent + 1);
          output += `${spaces}-\n${nested}`;
        }
      } else {
        output += `${spaces}- ${YAMLParser.formatScalar(item)}\n`;
      }
    }

    return output;
  }

  /**
   * 格式化标量用于输出
   */
  static formatScalar(value) {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value.length === 0 ? '[]' : JSON.stringify(value);
    }

    if (typeof value === 'string') {
      if (value === '' || /[:\-\s#]/.test(value)) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }

    return JSON.stringify(value);
  }
}

export const parseYAML = (input, options) => YAMLParser.parse(input, options);
export const stringifyYAML = (value, indent = 0) => YAMLParser.stringify(value, indent);

export { YAMLParser };
