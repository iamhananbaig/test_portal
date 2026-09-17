import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
})

export const questionSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  type: z.string().min(1, 'Type is required'),
  text: z.string().min(1, 'Question text is required'),
  marks: z.string().min(1, 'Marks are required').refine((v) => Number(v) > 0, 'Marks must be greater than 0'),
  options: z.array(z.object({
    label: z.string(),
    text: z.string(),
    is_correct: z.boolean(),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'mcq') {
    if (!data.options || data.options.length !== 4) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'MCQ must have exactly 4 options', path: ['options'] })
    } else if (data.options.some(o => o.text.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'All options must have text', path: ['options'] })
    } else if (data.options.filter(o => o.is_correct).length !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'MCQ must have exactly one correct option', path: ['options'] })
    }
  }
})

export const testGenerateSchema = z.object({
  candidate_name: z.string().min(1, 'Candidate name is required'),
  candidate_cnic: z.string().min(1, 'CNIC is required'),
  duration: z.string().min(1, 'Duration is required'),
  category_rows: z.array(z.object({
    category_id: z.string().min(1, 'Category is required'),
    count: z.string().min(1, 'Count is required').refine((v) => Number(v) > 0, 'Count must be at least 1'),
  })).min(1, 'Add at least one category'),
})

export const candidateLoginSchema = z.object({
  test_id: z.string().min(1, 'Test ID is required'),
})
