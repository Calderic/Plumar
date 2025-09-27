/**
 * 错误代码常量定义
 */
export const ERROR_CODES = {
  // 环境相关错误
  SITE_NOT_FOUND: 'SITE_NOT_FOUND',
  NOT_IN_SITE_DIRECTORY: 'NOT_IN_SITE_DIRECTORY',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DISK_SPACE_INSUFFICIENT: 'DISK_SPACE_INSUFFICIENT',
  
  // 配置相关错误
  CONFIG_NOT_FOUND: 'CONFIG_NOT_FOUND',
  CONFIG_INVALID: 'CONFIG_INVALID',
  CONFIG_PARSE_ERROR: 'CONFIG_PARSE_ERROR',
  CONFIG_REQUIRED_FIELD_MISSING: 'CONFIG_REQUIRED_FIELD_MISSING',
  CONFIG_TYPE_MISMATCH: 'CONFIG_TYPE_MISMATCH',
  
  // 模板相关错误
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
  TEMPLATE_DIRECTORY_NOT_FOUND: 'TEMPLATE_DIRECTORY_NOT_FOUND',
  TEMPLATE_FILE_CORRUPTED: 'TEMPLATE_FILE_CORRUPTED',
  TEMPLATE_STRUCTURE_INVALID: 'TEMPLATE_STRUCTURE_INVALID',
  
  // YAML 解析错误
  YAML_PARSE_ERROR: 'YAML_PARSE_ERROR',
  YAML_SYNTAX_ERROR: 'YAML_SYNTAX_ERROR',
  YAML_VALIDATION_ERROR: 'YAML_VALIDATION_ERROR',
  
  // 文件操作错误
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ALREADY_EXISTS: 'FILE_ALREADY_EXISTS',
  FILE_OPERATION_ERROR: 'FILE_OPERATION_ERROR',
  DIRECTORY_CREATION_FAILED: 'DIRECTORY_CREATION_FAILED',
  FILE_WRITE_FAILED: 'FILE_WRITE_FAILED',
  FILE_READ_FAILED: 'FILE_READ_FAILED',
  
  // 参数相关错误
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  MISSING_ARGUMENT: 'MISSING_ARGUMENT',
  ARGUMENT_PARSE_ERROR: 'ARGUMENT_PARSE_ERROR',
  
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

/**
 * 配置验证模式
 */
export const CONFIG_SCHEMA = {
  required: ['title', 'source_dir', 'theme'],
  optional: ['subtitle', 'description', 'author', 'per_page', 'render_drafts', 'url', 'root'],
  types: {
    title: 'string',
    subtitle: 'string',
    description: 'string',
    author: 'string',
    source_dir: 'string',
    theme: 'string',
    url: 'string',
    root: 'string',
    per_page: 'number',
    render_drafts: 'boolean'
  },
  defaults: {
    source_dir: 'src/content/blog',
    theme: '2025Plumar',
    per_page: 10,
    render_drafts: false,
    url: 'http://localhost:4321',
    root: '/'
  }
};

/**
 * 文件类型常量
 */
export const FILE_TYPES = {
  POST: 'post',
  PAGE: 'page',
  DRAFT: 'draft'
};

/**
 * 模板路径优先级
 */
export const TEMPLATE_PATH_PRIORITIES = [
  'DEVELOPMENT',
  'NPM_LINK',
  'GLOBAL_INSTALL',
  'LOCAL_NODE_MODULES',
  'CUSTOM_PATH'
];

/**
 * 默认配置文件名
 */
export const CONFIG_FILES = {
  PLUMAR: 'plumar.config.yml',
  PACKAGE: 'package.json'
};

/**
 * 支持的文件扩展名
 */
export const SUPPORTED_EXTENSIONS = {
  MARKDOWN: ['.md', '.markdown'],
  YAML: ['.yml', '.yaml'],
  CONFIG: ['.js', '.mjs', '.json', '.yml', '.yaml']
};