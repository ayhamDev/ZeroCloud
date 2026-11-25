import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const https = z.url({ protocol: /^https$/ });
const apps = defineCollection({
  loader: glob({
    base: './src/content/apps',
    pattern: '*/app.json',
    generateId: ({ entry }) => entry.replace(/\\/g, '/').replace(/\/app\.json$/, ''),
  }),
  schema: z
    .object({
      name: z.string().min(1),
      shortName: z.string().min(1),
      order: z.number().int().default(100),
      category: z.string().min(1).default('Utilities'),
      featured: z.boolean().default(false),
      description: z.string().min(1),
      introduction: z.string().min(1),
      overview: z.object({
        heading: z.string().min(1),
        steps: z
          .array(z.object({ title: z.string().min(1), description: z.string().min(1) }))
          .min(1),
        note: z.object({ title: z.string().min(1), description: z.string().min(1) }),
      }),
      status: z.string().min(1),
      targets: z.array(z.string()).min(1),
      webUrl: https.optional(),
      faqs: z
        .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
        .default([]),
      source: https,
      releases: https,
      technologies: z.array(z.string()),
      platformGuides: z.record(z.string(), z.string()).default({}),
      downloads: z.array(
        z.object({
          platform: z.string().min(1),
          version: z.string().min(1),
          file: z.string().min(1),
          url: https,
          releasedOn: z.iso.date().optional(),
          channel: z.enum(['stable', 'beta', 'alpha', 'rc', 'nightly']).default('stable'),
          architecture: z.string().min(1).optional(),
          bytes: z.number().int().positive().optional(),
          sha256: z
            .string()
            .regex(/^[a-f0-9]{64}$/i)
            .optional(),
          notesUrl: https.optional(),
        }),
      ),
    })
    .refine(
      (app) => !app.webUrl || app.targets.includes('Web'),
      'A web app URL must have Web declared as a target.',
    )
    .refine(
      (app) => app.downloads.every((item) => app.targets.includes(item.platform)),
      'Downloads must use a declared target platform.',
    )
    .refine(
      (app) =>
        Object.entries(app.platformGuides).every(
          ([platform, guide]) => app.targets.includes(platform) && app.technologies.includes(guide),
        ),
      'Each platform guide must match a target platform and a guide selected for the app.',
    ),
});
const chapters = defineCollection({
  loader: glob({ base: './src/content/apps', pattern: '*/*.md' }),
  schema: z.object({ title: z.string(), description: z.string(), order: z.number().int() }),
});
const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    group: z.string(),
    order: z.number().int(),
    kind: z.enum(['Guide', 'Example']).default('Guide'),
    keywords: z.array(z.string()).default([]),
  }),
});
export const collections = { apps, chapters, guides };
