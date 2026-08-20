import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ClipboardCopy, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import { formatTime } from '../../utils/dates'
import { testGenerateSchema } from '../../lib/validations'

interface Category {
  id: number
  name: string
  is_active: boolean
}

type TestGenerateFormData = {
  candidate_name: string
  candidate_cnic: string
  duration: string
  category_rows: { category_id: string; count: string }[]
}

export default function TestCreate() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [successModal, setSuccessModal] = useState(false)
  const [generatedTestId, setGeneratedTestId] = useState('')
  const [generatedExpiry, setGeneratedExpiry] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories', { params: { per_page: 100 } })
      return response.data.data.filter((c: Category) => c.is_active)
    },
  })

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<TestGenerateFormData>({
    resolver: zodResolver(testGenerateSchema),
    defaultValues: {
      candidate_name: '',
      candidate_cnic: '',
      duration: '60',
      category_rows: [{ category_id: '', count: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'category_rows',
  })

  const categoryRows = watch('category_rows')

  const generateMutation = useMutation({
    mutationFn: (payload: {
      candidate_name: string
      candidate_cnic: string
      categories: { category_id: number; count: number }[]
      duration_minutes: number
    }) => api.post('/tests/generate', payload),
    onSuccess: (response) => {
      setGeneratedTestId(response.data.data.test_id)
      setGeneratedExpiry(response.data.data.expires_at)
      setSuccessModal(true)
      setError('')
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setError(err.response?.data?.message || 'Failed to generate test')
    },
  })

  const onSubmit = (data: TestGenerateFormData) => {
    setError('')
    const categoriesPayload = data.category_rows
      .filter((r) => r.category_id && r.count)
      .map((r) => ({
        category_id: Number(r.category_id),
        count: Number(r.count),
      }))

    if (categoriesPayload.length === 0) {
      setError('Add at least one category with question count')
      return
    }

    generateMutation.mutate({
      candidate_name: data.candidate_name,
      candidate_cnic: data.candidate_cnic,
      categories: categoriesPayload,
      duration_minutes: Number(data.duration),
    })
  }

  const copyTestId = () => {
    navigator.clipboard.writeText(generatedTestId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const availableCategories = (excludeIndex: number) => {
    const usedIds = categoryRows
      .filter((_, i) => i !== excludeIndex)
      .map((r) => r.category_id)
      .filter(Boolean)
    return categories.filter((c) => !usedIds.includes(String(c.id)))
  }

  return (
    <div>
      <PageHeader title="Create Test" />

      <Card className="mt-6">
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-700 dark:text-rose-400">{error}</div>
          )}

          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Candidate Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Candidate Name"
              {...register('candidate_name')}
              error={errors.candidate_name?.message}
              placeholder="e.g. Ahmed Ali"
            />
            <Input
              label="CNIC"
              {...register('candidate_cnic')}
              error={errors.candidate_cnic?.message}
              placeholder="e.g. 35202-1234567-1"
            />
          </div>

          <h2 className="mb-4 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Test Configuration
          </h2>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-3">
                <div className="flex-1">
                  <Select
                    label={index === 0 ? 'Category' : undefined}
                    {...register(`category_rows.${index}.category_id`)}
                    error={errors.category_rows?.[index]?.category_id?.message}
                    options={availableCategories(index).map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    placeholder="Select category"
                  />
                </div>
                <div className="w-32">
                  <Input
                    label={index === 0 ? 'Questions' : undefined}
                    type="number"
                    min="1"
                    {...register(`category_rows.${index}.count`)}
                    error={errors.category_rows?.[index]?.count?.message}
                    placeholder="Count"
                  />
                </div>
                {fields.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="mt-3" onClick={() => append({ category_id: '', count: '' })}>
            + Add Category
          </Button>

          {errors.category_rows?.message && (
            <p className="mt-1 text-sm text-rose-600">{errors.category_rows.message}</p>
          )}

          <div className="mt-6">
            <Input
              label="Duration (minutes)"
              type="number"
              min="1"
              {...register('duration')}
              error={errors.duration?.message}
              placeholder="e.g. 60"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/tests')}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={generateMutation.isPending}
            >
              Generate Test
            </Button>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={successModal}
        onClose={() => {
          setSuccessModal(false)
          navigate('/admin/tests')
        }}
        title="Test Generated"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-4 text-center">
            <CheckCircle className="mx-auto h-7 w-7 text-emerald-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Candidate</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{watch('candidate_name')}</p>
          </div>
          <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Test ID</p>
            <p className="text-2xl font-bold tracking-wider text-primary-700 dark:text-primary-400">
              {generatedTestId}
            </p>
          </div>
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            Valid until: {formatTime(generatedExpiry)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={copyTestId}
              icon={copied ? <CheckCircle className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            >
              {copied ? 'Copied!' : 'Copy Test ID'}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setSuccessModal(false)
                navigate('/admin/tests')
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
