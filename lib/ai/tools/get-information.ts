// import { tool } from 'ai';
// import { z } from 'zod';
// import { findRelevantContent } from '@/lib/ai/embedding';

// export const getInformation = tool({
//   description: `get information from your knowledge base to answer questions.`,
//   parameters: z.object({
//     question: z.string().describe('the users question'),
//   }),
//   execute: async ({ question }) => findRelevantContent(question),
// });


import { tool } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';

// Helper function for input sanitization
const sanitizeInput = (input: string): string => {
  // 1. Trim whitespace and normalize
  let sanitized = input.trim().normalize();
  
  // 2. Limit length (prevent DoS with extremely long inputs)
  const MAX_LENGTH = 500; // Adjust as needed
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  // 3. Filter out control characters using character code checking
  let result = '';
  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized.charCodeAt(i);
    // Skip control characters (0-31 and 127-159)
    if ((code >= 32 && code <= 126) || code >= 160) {
      result += sanitized.charAt(i);
    }
  }
  
  // 4. Replace newlines and clean up spaces
  result = result
    .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ')          // Replace multiple spaces with a single space
    .replace(/;/g, '');            // Remove semicolons (basic SQLi protection)
  
  return result;
};

export const getInformation = tool({
  description: `get information from your knowledge base to answer questions.`,
  parameters: z.object({
    question: z
      .string()
      .max(500, "Question is too long")
      .describe('the users question'),
  }),
  execute: async ({ question }) => {
   
    const sanitizedQuestion = sanitizeInput(question);
    
    return findRelevantContent(sanitizedQuestion);
  },
});