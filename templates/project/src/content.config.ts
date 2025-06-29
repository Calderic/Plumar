// 注意：此文件的类型错误在运行 npm install 后会自动消失
// @ts-ignore
import { defineCollection, z } from 'astro:content';
// @ts-ignore  
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    slug: z.string(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    description: z.string().default(''),
  }),
});

export const collections = {
  blog,
}; 