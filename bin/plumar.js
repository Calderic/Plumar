#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { CLI } from '../src/cli.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取版本信息
const packagePath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

const cli = new CLI(packageJson.version);
cli.run(process.argv.slice(2)); 