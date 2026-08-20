import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Upload, X, ImageIcon } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Card, { CardContent } from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import PageHeader from '../../components/ui/PageHeader'
import { questionSchema } from '../../lib/validations'

interface Category {
  id: number
  name: string
}

interface Option {
  label: string
  text: string
  is_correct: boolean
  image_path?: string | null
  id?: number
}

interface QuestionFormData {
  category_id: string
  type: string
  text: string
  marks: string
  options?: Option[]
}

export default function QuestionForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [options, setOptions] = useState<Option[]>([
    { label: 'A', text: '', is_correct: false },
    { label: 'B', text: '', is_correct: false },
    { label: 'C', text: '', is_correct: false },
    { label: 'D', text: '', is_correct: false },
  ])
  const [error, setError] = useState('')
  const [questionImagePath, setQuestionImagePath] = useState<string | null>(null)
  const [pendingQuestionImage, setPendingQuestionImage] = useState<File | null>(null)
  const [pendingQuestionImagePreview, setPendingQuestionImagePreview] = useState<string | null>(null)
  const [pendingOptionImages, setPendingOptionImages] = useState<(File | null)[]>([null, null, null, null])
  const questionImageRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema) as never,
    defaultValues: {
      category_id: '',
      type: 'mcq',
      text: '',
      marks: '',
      options: [
        { label: 'A', text: '', is_correct: false },
        { label: 'B', text: '', is_correct: false },
        { label: 'C', text: '', is_correct: false },
        { label: 'D', text: '', is_correct: false },
      ],
    },
  })

  const watchType = useWatch({ control, name: 'type' })

  const optionImagePreviews = useMemo(() => {
    return pendingOptionImages.map((file, i) => {
      if (file) return URL.createObjectURL(file)
      if (options[i]?.image_path) return `/storage/${options[i].image_path}`
      return null
    })
  }, [pendingOptionImages, options])

  useEffect(() => {
    const urls = optionImagePreviews.filter((url): url is string => url !== null && url.startsWith('blob:'))
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [optionImagePreviews])

  useEffect(() => {
    return () => {
      if (pendingQuestionImagePreview) URL.revokeObjectURL(pendingQuestionImagePreview)
    }
  }, [pendingQuestionImagePreview])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const catRes = await api.get('/categories', { params: { per_page: 100 } })
        setCategories(catRes.data.data)
        if (isEditing) {
          const qRes = await api.get(`/questions/${id}`)
          const q = qRes.data.data
          reset({
            category_id: String(q.category_id),
            type: q.type,
            text: q.text,
            marks: String(q.marks),
            options: q.options?.length ? q.options : [
              { label: 'A', text: '', is_correct: false },
              { label: 'B', text: '', is_correct: false },
              { label: 'C', text: '', is_correct: false },
              { label: 'D', text: '', is_correct: false },
            ],
          })
          if (q.options?.length) {
            setOptions(q.options)
          }
          if (q.image_path) {
            setQuestionImagePath(q.image_path)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, isEditing, reset])

  const setCorrectOption = (index: number) => {
    const updated = options.map((opt, i) => ({ ...opt, is_correct: i === index }))
    setOptions(updated)
    setValue('options', updated)
  }

  const updateOptionText = (index: number, value: string) => {
    const updated = options.map((opt, i) => (i === index ? { ...opt, text: value } : opt))
    setOptions(updated)
    setValue('options', updated)
  }

  const handleQuestionImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPendingQuestionImage(file)
    setPendingQuestionImagePreview(URL.createObjectURL(file))
    setQuestionImagePath(null)

    if (questionImageRef.current) questionImageRef.current.value = ''
  }, [])

  const handleQuestionImageRemove = useCallback(() => {
    setPendingQuestionImage(null)
    if (pendingQuestionImagePreview) {
      URL.revokeObjectURL(pendingQuestionImagePreview)
    }
    setPendingQuestionImagePreview(null)
  }, [pendingQuestionImagePreview])

  const handleQuestionImageDeleteExisting = useCallback(async () => {
    if (!id) return
    try {
      await api.delete(`/questions/${id}/image`)
      setQuestionImagePath(null)
    } catch {
      setError('Failed to remove image')
    }
  }, [id])

  const handleOptionImageSelect = useCallback((optionIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPendingOptionImages((prev) => {
      const next = [...prev]
      next[optionIndex] = file
      return next
    })

    const updated = options.map((opt, i) =>
      i === optionIndex ? { ...opt, image_path: null } : opt,
    )
    setOptions(updated)
    setValue('options', updated)
  }, [options, setValue])

  const handleOptionImageRemove = useCallback((optionIndex: number) => {
    setPendingOptionImages((prev) => {
      const next = [...prev]
      next[optionIndex] = null
      return next
    })
  }, [])

  const handleOptionImageDeleteExisting = useCallback(async (optionIndex: number) => {
    const option = options[optionIndex]
    const optionId = option.id
    if (!id || !optionId) return

    try {
      await api.delete(`/questions/${id}/options/${optionId}/image`)
      const updated = options.map((opt, i) =>
        i === optionIndex ? { ...opt, image_path: null } : opt,
      )
      setOptions(updated)
      setValue('options', updated)
    } catch {
      setError('Failed to remove option image')
    }
  }, [id, options, setValue])

  const onSubmit = async (data: QuestionFormData) => {
    setError('')
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('category_id', data.category_id)
      formData.append('type', data.type)
      formData.append('text', data.text)
      formData.append('marks', data.marks)

      if (pendingQuestionImage) {
        formData.append('question_image', pendingQuestionImage)
      }

      if (data.type === 'mcq') {
        options.forEach((opt, i) => {
          formData.append(`options[${i}][label]`, opt.label)
          formData.append(`options[${i}][text]`, opt.text)
          formData.append(`options[${i}][is_correct]`, opt.is_correct ? '1' : '0')
          if (pendingOptionImages[i]) {
            formData.append(`options[${i}][image]`, pendingOptionImages[i] as File)
          } else if (isEditing && opt.image_path) {
            formData.append(`options[${i}][image_path]`, opt.image_path)
          }
        })
      }

      if (isEditing) {
        await api.put(`/questions/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/questions', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      navigate('/admin/questions')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: { data?: { message?: string; errors?: Record<string, string[]> } }
        }
        const errors = axiosErr.response?.data?.errors
        if (errors) {
          setError(Object.values(errors).flat().join(', '))
        } else {
          setError(axiosErr.response?.data?.message || 'An error occurred')
        }
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="py-12 px-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-28 w-full mt-4" />
        <Skeleton className="h-10 w-1/3 mt-4" />
        <div className="mt-6 flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    )

  const questionImagePreview = pendingQuestionImagePreview || (questionImagePath ? `/storage/${questionImagePath}` : null)

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Question' : 'Add Question'}
        action={
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/questions')}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
        }
      />
      <Card className="mt-6">
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-700 dark:text-rose-400">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              {...register('category_id')}
              error={errors.category_id?.message}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <Select
              label="Type"
              {...register('type')}
              error={errors.type?.message}
              options={[
                { value: 'mcq', label: 'MCQ' },
                { value: 'descriptive', label: 'Descriptive' },
              ]}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Question Text"
              {...register('text')}
              error={errors.text?.message}
              rows={4}
              placeholder="Enter question text..."
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Question Image (optional)
            </label>
            {questionImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={questionImagePreview}
                  alt="Question"
                  className="max-h-40 rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={pendingQuestionImage ? handleQuestionImageRemove : handleQuestionImageDeleteExisting}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={questionImageRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleQuestionImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => questionImageRef.current?.click()}
                  icon={<Upload className="h-4 w-4" />}
                >
                  Upload Image
                </Button>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">JPG or PNG, max 5MB</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Input
              label="Marks"
              type="number"
              min="0.5"
              step="0.5"
              {...register('marks')}
              error={errors.marks?.message}
              placeholder="e.g. 4"
            />
          </div>
          {watchType === 'mcq' && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Answer Options</h3>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Select the correct answer by clicking the radio button.
              </p>
              <div className="space-y-3">
                {options.map((opt, i) => (
                    <div key={opt.label} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correct_option"
                        checked={opt.is_correct}
                        onChange={() => setCorrectOption(i)}
                        className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                      />
                      <span className="w-6 text-sm font-medium text-slate-500 dark:text-slate-400">{opt.label}.</span>
                      <Input
                        value={opt.text}
                        onChange={(e) => updateOptionText(i, e.target.value)}
                        placeholder={`Option ${opt.label}`}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        {optionImagePreviews[i] ? (
                          <div className="relative">
                            <img
                              src={optionImagePreviews[i]!}
                              alt={`Option ${opt.label}`}
                              className="h-8 w-8 object-cover rounded border border-slate-200 dark:border-slate-700"
                            />
                            <button
                              type="button"
                              onClick={pendingOptionImages[i]
                                ? () => handleOptionImageRemove(i)
                                : () => handleOptionImageDeleteExisting(i)
                              }
                              className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-600"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer text-slate-400 hover:text-primary-500 transition-colors">
                            <ImageIcon className="h-4 w-4" />
                            <input
                              type="file"
                              accept="image/jpeg,image/png"
                              className="hidden"
                              onChange={(e) => handleOptionImageSelect(i, e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/questions')}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={saving}
            >
              Save Question
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
