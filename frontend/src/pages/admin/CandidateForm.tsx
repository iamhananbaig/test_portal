import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Upload, FileText, X } from 'lucide-react'
import api from '@/services/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardContent, CardHeader } from '@/components/ui/Card'
import Skeleton from '@/components/ui/Skeleton'
import PageHeader from '@/components/ui/PageHeader'
import { useToast } from '@/context/useToast'
import { getErrorMessage } from '@/lib/errors'

const candidateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  cnic: z.string().length(15, 'CNIC must be 15 characters (XXXXX-XXXXXXX-X)'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
})

type CandidateForm = z.infer<typeof candidateSchema>

export default function CandidateForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvPreview, setCvPreview] = useState<string | null>(null)

  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const response = await api.get(`/candidates/${id}`)
      return response.data.data
    },
    enabled: isEdit,
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: '',
      cnic: '',
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (candidate) {
      reset({
        name: candidate.name,
        cnic: candidate.cnic,
        email: candidate.email ?? '',
        phone: candidate.phone ?? '',
      })
      if (candidate.cv_path) {
        setCvPreview(candidate.cv_path)
      }
    }
  }, [candidate, reset])

  const mutation = useMutation({
    mutationFn: async (data: CandidateForm) => {
      const payload = {
        name: data.name,
        cnic: data.cnic,
        email: data.email || null,
        phone: data.phone || null,
      }

      let response
      if (isEdit) {
        response = await api.put(`/candidates/${id}`, payload)
      } else {
        response = await api.post('/candidates', payload)
      }

      if (cvFile) {
        const candidateId = isEdit ? id : response.data.data.id
        const formData = new FormData()
        formData.append('cv', cvFile)
        await api.post(`/candidates/${candidateId}/cv`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      success(isEdit ? 'Candidate updated.' : 'Candidate created.')
      navigate('/admin/candidates')
    },
    onError: (err) => {
      toastError(getErrorMessage(err))
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toastError('File must be under 5MB.')
      return
    }
    setCvFile(file)
    setCvPreview(file.name)
  }

  if (isEdit && candidateLoading) {
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
          onClick={() => navigate('/admin/candidates')}
          className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title={isEdit ? 'Edit Candidate' : 'Add Candidate'} />
      </div>

      <Card>
        <CardHeader>{isEdit ? 'Update candidate details' : 'Add a new candidate'}</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="CNIC"
              placeholder="12345-1234567-1"
              error={errors.cnic?.message}
              {...register('cnic')}
            />

            <Input
              label="Email"
              placeholder="john@example.com (optional)"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone"
              placeholder="0300-1234567 (optional)"
              error={errors.phone?.message}
              {...register('phone')}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                CV (optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {cvPreview ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <span className="flex-1 text-sm truncate">{cvPreview}</span>
                  <button
                    type="button"
                    onClick={() => { setCvFile(null); setCvPreview(null) }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-6 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Click to upload CV (PDF, DOC, DOCX — max 5MB)
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <Button type="button" variant="ghost" onClick={() => navigate('/admin/candidates')}>
                Cancel
              </Button>
              <Button type="submit" loading={mutation.isPending}>
                {isEdit ? 'Update Candidate' : 'Add Candidate'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
