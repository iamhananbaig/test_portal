import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm, useWatch, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import api from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import PageHeader from '@/components/ui/PageHeader'
import { useToast } from '@/context/useToast'
import { getErrorMessage } from '@/lib/errors'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  duration_minutes: z.string().min(1, 'Duration is required'),
  categories: z.array(z.object({
    category_id: z.string().min(1, 'Category is required'),
    question_count: z.string().min(1, 'Count is required'),
  })).min(1, 'At least one category required'),
})

type ProfileForm = z.infer<typeof profileSchema>

interface Category {
  id: number
  name: string
}

export default function TestProfileForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data.data as Category[]
    },
  })

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['test-profile', id],
    queryFn: async () => {
      const response = await api.get(`/test-profiles/${id}`)
      return response.data.data
    },
    enabled: isEdit,
  })

  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      duration_minutes: '60',
      categories: [{ category_id: '', question_count: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'categories' })

  const watchedCategories = useWatch({ control, name: 'categories' })

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name,
        duration_minutes: String(profile.duration_minutes),
        categories: profile.categories.map((cat: { category_id: number; question_count: number }) => ({
          category_id: String(cat.category_id),
          question_count: String(cat.question_count),
        })),
      })
    }
  }, [profile, reset])

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => {
      const payload = {
        name: data.name,
        duration_minutes: Number(data.duration_minutes),
        categories: data.categories.map((cat) => ({
          category_id: Number(cat.category_id),
          question_count: Number(cat.question_count),
        })),
      }
      return isEdit
        ? api.put(`/test-profiles/${id}`, payload)
        : api.post('/test-profiles', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-profiles'] })
      success(isEdit ? 'Profile updated.' : 'Profile created.')
      navigate('/admin/profiles')
    },
    onError: (err) => {
      toastError(getErrorMessage(err))
    },
  })

  const usedCategories = watchedCategories.map((cat) => cat.category_id).filter(Boolean)
  const availableCategories = (categories ?? []).filter((cat) => !usedCategories.includes(String(cat.id)) || isEdit)

  if (isEdit && profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/profiles')}
          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title={isEdit ? 'Edit Test Profile' : 'New Test Profile'} />
      </div>

      <Card className="mt-6">
        <CardHeader>{isEdit ? 'Update profile details' : 'Create a new test profile'}</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
            <Input
              label="Profile Name"
              placeholder="e.g. Software Engineer, Data Analyst"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Duration (minutes)"
              type="text"
              inputMode="numeric"
              placeholder="60"
              error={errors.duration_minutes?.message}
              {...register('duration_minutes')}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Categories
              </label>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-3">
                    <div className="flex-1">
                      <Select
                        placeholder="Select category"
                        error={errors.categories?.[index]?.category_id?.message}
                        value={watchedCategories[index]?.category_id ?? ''}
                        onChange={(e) => {
                          const event = { target: { value: e.target.value, name: `categories.${index}.category_id` } }
                          register(`categories.${index}.category_id`).onChange(event)
                        }}
                        options={availableCategories.map((cat) => ({
                          value: String(cat.id),
                          label: cat.name,
                        }))}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        placeholder="#"
                        type="text"
                        inputMode="numeric"
                        error={errors.categories?.[index]?.question_count?.message}
                        {...register(`categories.${index}.question_count`)}
                      />
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => append({ category_id: '', question_count: '' })}
                icon={<Plus className="h-4 w-4" />}
              >
                Add Category
              </Button>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/profiles')}>
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                {isEdit ? 'Update Profile' : 'Create Profile'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
