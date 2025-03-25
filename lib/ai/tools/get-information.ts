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
  
  // 3. Remove only potentially harmful characters while preserving Unicode
  // This regex only removes control characters and some specific potentially dangerous characters
  sanitized = sanitized
    .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g, '') // Remove control characters
    .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/;/g, ''); // Remove semicolons (basic SQLi protection)
  
  // No need to escape quotes as your ORM should handle parameterized queries
  
  return sanitized;
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