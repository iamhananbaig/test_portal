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
    text: z.string().min(1, 'Option text is required'),
    is_correct: z.boolean(),
  })).optional(),
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

export const markingSchema = z.object({
  marks: z.record(z.string(), z.string()),
})
