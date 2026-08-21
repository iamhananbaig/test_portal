import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm, useWatch, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ClipboardCopy, CheckCircle } from 'lucide-react'
import api from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SearchableSelect from '@/components/ui/SearchableSelect'
import Card, { CardContent } from '@/components/ui/Card'
import Modal from '@/components/ui/Modal'
import PageHeader from '@/components/ui/PageHeader'
import { formatTime } from '@/utils/dates'
import { getErrorMessage } from '@/lib/errors'

interface Category {
  id: number
  name: string
  is_active: boolean
}

interface TestProfile {
  id: number
  name: string
  duration_minutes: number
  categories: { category_id: number; category_name: string; question_count: number }[]
}

interface CandidateOption {
  id: number
  name: string
  cnic: string
}

const testCreateSchema = z.object({
  test_profile_id: z.string().optional(),
  candidate_id: z.string().optional(),
  candidate_name: z.string().min(1, 'Candidate name is required'),
  candidate_cnic: z.string().min(1, 'CNIC is required'),
  duration: z.string().min(1, 'Duration is required'),
  category_rows: z.array(z.object({
    category_id: z.string().min(1, 'Category is required'),
    count: z.string().min(1, 'Count is required').refine((v) => Number(v) > 0, 'Count must be at least 1'),
  })).min(1, 'Add at least one category'),
})

type TestCreateForm = z.infer<typeof testCreateSchema>

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

  const { data: profiles = [] } = useQuery<TestProfile[]>({
    queryKey: ['test-profiles'],
    queryFn: async () => {
      const response = await api.get('/test-profiles')
      return response.data.data
    },
  })

  const { data: candidatesData } = useQuery({
    queryKey: ['candidates-list'],
    queryFn: async () => {
      const response = await api.get('/candidates', { params: { per_page: 100 } })
      return response.data.data as CandidateOption[]
    },
  })

  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<TestCreateForm>({
    resolver: zodResolver(testCreateSchema),
    defaultValues: {
      test_profile_id: '',
      candidate_id: '',
      candidate_name: '',
      candidate_cnic: '',
      duration: '60',
      category_rows: [{ category_id: '', count: '' }],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'category_rows',
  })

  const categoryRows = useWatch({ control, name: 'category_rows' })
  const candidateName = useWatch({ control, name: 'candidate_name' })
  const selectedProfileId = useWatch({ control, name: 'test_profile_id' })
  const selectedCandidateId = useWatch({ control, name: 'candidate_id' })

  const isProfileMode = Boolean(selectedProfileId)

  const handleProfileChange = (profileId: string) => {
    setValue('test_profile_id', profileId)
    const profile = profiles.find((p) => p.id === Number(profileId))
    if (profile) {
      setValue('duration', String(profile.duration_minutes))
      replace(profile.categories.map((cat) => ({
        category_id: String(cat.category_id),
        count: String(cat.question_count),
      })))
    }
  }

  const handleCandidateChange = (candidateId: string) => {
    setValue('candidate_id', candidateId)
    const candidate = candidatesData?.find((c) => c.id === Number(candidateId))
    if (candidate) {
      setValue('candidate_name', candidate.name)
      setValue('candidate_cnic', candidate.cnic)
    }
  }

  const generateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/tests/generate', payload),
    onSuccess: (response) => {
      setGeneratedTestId(response.data.data.test_id)
      setGeneratedExpiry(response.data.data.expires_at)
      setSuccessModal(true)
      setError('')
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, 'Failed to generate test'))
    },
  })

  const onSubmit = (data: TestCreateForm) => {
    setError('')

    if (data.test_profile_id) {
      generateMutation.mutate({
        test_profile_id: Number(data.test_profile_id),
        candidate_name: data.candidate_name,
        candidate_cnic: data.candidate_cnic,
        candidate_id: data.candidate_id ? Number(data.candidate_id) : undefined,
      })
      return
    }

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
      candidate_id: data.candidate_id ? Number(data.candidate_id) : undefined,
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
    const filtered = categories.filter((c) => !usedIds.includes(String(c.id)))
    return filtered
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
            Test Profile
          </h2>
          <SearchableSelect
            name="test_profile_id"
            placeholder="Select a profile (optional)"
            value={selectedProfileId}
            onChange={(val) => handleProfileChange(String(val))}
            options={[
              { value: '', label: 'Manual Configuration' },
              ...profiles.map((p) => ({
                value: String(p.id),
                label: `${p.name} (${p.duration_minutes} min, ${p.categories.reduce((s, c) => s + c.question_count, 0)} questions)`,
                searchTerms: p.name,
              })),
            ]}
          />

          <h2 className="mb-4 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Candidate Information
          </h2>
          <div className="space-y-4">
            <SearchableSelect
              name="candidate_id"
              placeholder="Select existing candidate (optional)"
              value={selectedCandidateId}
              onChange={(val) => handleCandidateChange(String(val))}
              options={[
                { value: '', label: 'Enter manually' },
                ...(candidatesData ?? []).map((c) => ({
                  value: String(c.id),
                  label: `${c.name} — ${c.cnic}`,
                  searchTerms: `${c.name} ${c.cnic}`,
                })),
              ]}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Candidate Name"
                {...register('candidate_name')}
                error={errors.candidate_name?.message}
                placeholder="e.g. Ahmed Ali"
                readOnly={Boolean(selectedCandidateId)}
              />
              <Input
                label="CNIC"
                {...register('candidate_cnic')}
                error={errors.candidate_cnic?.message}
                placeholder="e.g. 35202-1234567-1"
                readOnly={Boolean(selectedCandidateId)}
              />
            </div>
          </div>

          {!isProfileMode && (
            <>
              <h2 className="mb-4 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Test Configuration
              </h2>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-3">
                    <div className="flex-1">
                      <SearchableSelect
                        name={`category_rows.${index}.category_id`}
                        label={index === 0 ? 'Category' : undefined}
                        value={categoryRows[index]?.category_id ?? ''}
                        onChange={(val) => {
                          setValue(`category_rows.${index}.category_id`, String(val), { shouldValidate: true })
                        }}
                        error={errors.category_rows?.[index]?.category_id?.message}
                        options={availableCategories(index).map((c) => ({
                          value: String(c.id),
                          label: c.name,
                        }))}
                        placeholder="Select category"
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        label={index === 0 ? 'Questions' : undefined}
                        type="text"
                        inputMode="numeric"
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
                  type="text"
                  inputMode="numeric"
                  {...register('duration')}
                  error={errors.duration?.message}
                  placeholder="e.g. 60"
                />
              </div>
            </>
          )}

          {isProfileMode && (
            <div className="mt-6">
              <Input
                label="Duration (minutes)"
                type="text"
                inputMode="numeric"
                {...register('duration')}
                error={errors.duration?.message}
                placeholder="e.g. 60"
                readOnly
              />
            </div>
          )}

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
            <p className="font-semibold text-slate-900 dark:text-slate-100">{candidateName}</p>
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
