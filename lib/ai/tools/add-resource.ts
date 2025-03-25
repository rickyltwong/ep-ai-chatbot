import { tool } from 'ai';
import { z } from 'zod';
import { createResource } from '@/lib/actions/resources';

export const addResource = tool({
  description: 'Add a resource to your knowledge base',
  parameters: z.object({
    content: z.string(),
  }),
  execute: async ({ content }) => createResource({ content }),
});
