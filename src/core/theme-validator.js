import { existsSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

export class ThemeValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  // 验证主题
  validate(themePath, themeName) {
    this.errors = [];
    this.warnings = [];
    this.info = [];

    console.log(`🔍 验证主题: ${themeName}`);
    console.log(`📁 主题路径: ${themePath}`);
    console.log('');

    // 基础检查
    this.validateBasicStructure(themePath, themeName);
    
    // 文件检查
    this.validateFiles(themePath);
    
    // 配置检查
    this.validateConfig(themePath);
    
    // 布局检查
    this.validateLayouts(themePath);
    
    // 组件检查
    this.validateComponents(themePath);
    
    // 样式检查
    this.validateStyles(themePath);

    // 输出结果
    this.outputResults();

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info
    };
  }

  // 验证基础结构
  validateBasicStructure(themePath, themeName) {
    if (!existsSync(themePath)) {
      this.errors.push(`主题目录不存在: ${themePath}`);
      return;
    }

    if (!statSync(themePath).isDirectory()) {
      this.errors.push(`主题路径不是目录: ${themePath}`);
      return;
    }

    this.info.push('✅ 主题目录存在');

    // 检查主题信息文件
    const infoFile = join(themePath, 'theme.info.yml');
    if (existsSync(infoFile)) {
      this.info.push('✅ theme.info.yml 存在');
    } else {
      this.errors.push('❌ 缺少 theme.info.yml 文件');
    }

    // 检查必需目录
    const requiredDirs = [
      { name: 'layouts', required: true },
      { name: 'components', required: false },
      { name: 'styles', required: false },
      { name: 'public', required: false },
      { name: 'templates', required: false }
    ];

    for (const dir of requiredDirs) {
      const dirPath = join(themePath, dir.name);
      if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
        this.info.push(`✅ ${dir.name}/ 目录存在`);
      } else if (dir.required) {
        this.errors.push(`❌ 缺少必需目录: ${dir.name}/`);
      } else {
        this.warnings.push(`⚠️  可选目录不存在: ${dir.name}/`);
      }
    }
  }

  // 验证文件
  validateFiles(themePath) {
    try {
      const files = this.scanDirectory(themePath);
      
      if (files.length === 0) {
        this.warnings.push('⚠️  主题目录为空');
        return;
      }

      // 按类型统计文件
      const fileTypes = {
        astro: files.filter(f => f.endsWith('.astro')).length,
        css: files.filter(f => f.endsWith('.css')).length,
        scss: files.filter(f => f.endsWith('.scss')).length,
        js: files.filter(f => f.endsWith('.js')).length,
        ts: files.filter(f => f.endsWith('.ts')).length,
        yml: files.filter(f => f.endsWith('.yml') || f.endsWith('.yaml')).length,
        md: files.filter(f => f.endsWith('.md')).length
      };

      this.info.push(`📊 文件统计:`);
      for (const [type, count] of Object.entries(fileTypes)) {
        if (count > 0) {
          this.info.push(`   ${type.toUpperCase()}: ${count} 个文件`);
        }
      }

    } catch (error) {
      this.errors.push(`❌ 扫描文件时出错: ${error.message}`);
    }
  }

  // 验证配置
  validateConfig(themePath) {
    const configFiles = [
      'theme.config.yml',
      'theme.config.yaml',
      'theme.config.js',
      'theme.config.mjs'
    ];

    let configFound = false;
    for (const configFile of configFiles) {
      const configPath = join(themePath, configFile);
      if (existsSync(configPath)) {
        this.info.push(`✅ 配置文件: ${configFile}`);
        configFound = true;
        
        // 验证 YAML 配置
        if (configFile.endsWith('.yml') || configFile.endsWith('.yaml')) {
          this.validateYamlConfig(configPath);
        }
        break;
      }
    }

    if (!configFound) {
      this.warnings.push('⚠️  没有找到主题配置文件');
    }
  }

  // 验证 YAML 配置
  validateYamlConfig(configPath) {
    try {
      const { readFileSync } = require('fs');
      const content = readFileSync(configPath, 'utf8');
      
      // 基本 YAML 语法检查
      const lines = content.split('\n');
      let hasContent = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed && !trimmed.startsWith('#')) {
          hasContent = true;
          
          // 检查基本语法
          if (trimmed.includes(':')) {
            // 键值对格式检查
            const [key, ...value] = trimmed.split(':');
            if (!key.trim()) {
              this.warnings.push(`⚠️  配置文件第 ${i + 1} 行: 空键名`);
            }
          }
        }
      }
      
      if (!hasContent) {
        this.warnings.push('⚠️  配置文件为空');
      } else {
        this.info.push('✅ 配置文件语法正确');
      }
      
    } catch (error) {
      this.errors.push(`❌ 配置文件验证失败: ${error.message}`);
    }
  }

  // 验证布局
  validateLayouts(themePath) {
    const layoutsPath = join(themePath, 'layouts');
    
    if (!existsSync(layoutsPath)) {
      this.errors.push('❌ layouts/ 目录不存在');
      return;
    }

    try {
      const layoutFiles = readdirSync(layoutsPath)
        .filter(file => file.endsWith('.astro'));

      if (layoutFiles.length === 0) {
        this.errors.push('❌ layouts/ 目录中没有 .astro 文件');
        return;
      }

      // 检查必需的布局
      const requiredLayouts = ['default.astro'];
      const recommendedLayouts = ['post.astro', 'page.astro'];

      for (const layout of requiredLayouts) {
        if (layoutFiles.includes(layout)) {
          this.info.push(`✅ 必需布局: ${layout}`);
        } else {
          this.errors.push(`❌ 缺少必需布局: ${layout}`);
        }
      }

      for (const layout of recommendedLayouts) {
        if (layoutFiles.includes(layout)) {
          this.info.push(`✅ 推荐布局: ${layout}`);
        } else {
          this.warnings.push(`⚠️  建议添加布局: ${layout}`);
        }
      }

      // 验证布局文件内容
      for (const layoutFile of layoutFiles) {
        this.validateAstroFile(join(layoutsPath, layoutFile), 'layout');
      }

    } catch (error) {
      this.errors.push(`❌ 验证布局时出错: ${error.message}`);
    }
  }

  // 验证组件
  validateComponents(themePath) {
    const componentsPath = join(themePath, 'components');
    
    if (!existsSync(componentsPath)) {
      this.warnings.push('⚠️  components/ 目录不存在（可选）');
      return;
    }

    try {
      const componentFiles = readdirSync(componentsPath)
        .filter(file => file.endsWith('.astro'));

      if (componentFiles.length === 0) {
        this.warnings.push('⚠️  components/ 目录中没有 .astro 文件');
        return;
      }

      this.info.push(`✅ 找到 ${componentFiles.length} 个组件文件`);

      // 验证组件文件
      for (const componentFile of componentFiles) {
        this.validateAstroFile(join(componentsPath, componentFile), 'component');
      }

    } catch (error) {
      this.warnings.push(`⚠️  验证组件时出错: ${error.message}`);
    }
  }

  // 验证样式
  validateStyles(themePath) {
    const stylesPath = join(themePath, 'styles');
    
    if (!existsSync(stylesPath)) {
      this.warnings.push('⚠️  styles/ 目录不存在（可选）');
      return;
    }

    try {
      const styleFiles = readdirSync(stylesPath)
        .filter(file => file.endsWith('.css') || file.endsWith('.scss'));

      if (styleFiles.length === 0) {
        this.warnings.push('⚠️  styles/ 目录中没有样式文件');
        return;
      }

      this.info.push(`✅ 找到 ${styleFiles.length} 个样式文件`);

      // 检查推荐的样式文件
      const recommendedStyles = ['main.css', 'style.css', 'index.css'];
      const hasRecommended = recommendedStyles.some(style => 
        styleFiles.includes(style) || styleFiles.includes(style.replace('.css', '.scss'))
      );

      if (hasRecommended) {
        this.info.push('✅ 包含推荐的主样式文件');
      } else {
        this.warnings.push('⚠️  建议添加主样式文件（如 main.css）');
      }

    } catch (error) {
      this.warnings.push(`⚠️  验证样式时出错: ${error.message}`);
    }
  }

  // 验证 Astro 文件
  validateAstroFile(filePath, type) {
    try {
      const { readFileSync } = require('fs');
      const content = readFileSync(filePath, 'utf8');
      const fileName = filePath.split('/').pop();

      // 基本结构检查
      const hasFrontmatter = content.includes('---');
      const hasHtml = content.includes('<') && content.includes('>');

      if (!hasFrontmatter && !hasHtml) {
        this.warnings.push(`⚠️  ${type} ${fileName}: 可能缺少有效内容`);
        return;
      }

      // 检查 Astro 特定语法
      if (type === 'layout') {
        if (!content.includes('<slot')) {
          this.warnings.push(`⚠️  布局 ${fileName}: 建议使用 <slot> 元素`);
        }
        
        if (!content.includes('<html') && !content.includes('<HTML')) {
          this.warnings.push(`⚠️  布局 ${fileName}: 建议包含完整的 HTML 结构`);
        }
      }

      this.info.push(`✅ ${type} ${fileName}: 语法正确`);

    } catch (error) {
      this.errors.push(`❌ 验证 ${type} 文件失败: ${error.message}`);
    }
  }

  // 扫描目录
  scanDirectory(dirPath, relativePath = '') {
    const files = [];
    
    try {
      const items = readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = join(dirPath, item);
        const stats = statSync(itemPath);
        const relativeItemPath = relativePath ? join(relativePath, item) : item;
        
        if (stats.isDirectory()) {
          // 递归扫描子目录
          const subFiles = this.scanDirectory(itemPath, relativeItemPath);
          files.push(...subFiles);
        } else {
          files.push(relativeItemPath);
        }
      }
    } catch (error) {
      this.warnings.push(`⚠️  扫描目录失败: ${error.message}`);
    }
    
    return files;
  }

  // 输出结果
  outputResults() {
    console.log('📋 验证结果:\n');

    // 输出错误
    if (this.errors.length > 0) {
      console.log('❌ 错误:');
      for (const error of this.errors) {
        console.log(`   ${error}`);
      }
      console.log('');
    }

    // 输出警告
    if (this.warnings.length > 0) {
      console.log('⚠️  警告:');
      for (const warning of this.warnings) {
        console.log(`   ${warning}`);
      }
      console.log('');
    }

    // 输出信息
    if (this.info.length > 0) {
      console.log('ℹ️  信息:');
      for (const info of this.info) {
        console.log(`   ${info}`);
      }
      console.log('');
    }

    // 总结
    if (this.errors.length === 0) {
      if (this.warnings.length === 0) {
        console.log('🎉 主题验证通过！没有发现任何问题。');
      } else {
        console.log('✅ 主题基本有效，但有一些建议优化的地方。');
      }
    } else {
      console.log('❌ 主题验证失败，请修复上述错误后重试。');
    }
  }

  // 生成验证报告
  generateReport(themePath, themeName) {
    const result = this.validate(themePath, themeName);
    
    const report = {
      theme: themeName,
      path: themePath,
      timestamp: new Date().toISOString(),
      isValid: result.isValid,
      summary: {
        errors: result.errors.length,
        warnings: result.warnings.length,
        info: result.info.length
      },
      details: {
        errors: result.errors,
        warnings: result.warnings,
        info: result.info
      }
    };

    return report;
  }
} 