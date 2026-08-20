import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn } from 'lucide-react'
import { candidateApi } from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { candidateLoginSchema } from '../../lib/validations'

export default function CandidateLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(candidateLoginSchema),
  })

  const onSubmit = async (data: { test_id: string }) => {
    setError('')
    setLoading(true)

    try {
      const { data: response } = await candidateApi.post('/candidate/validate', {
        test_id: data.test_id.trim().toUpperCase(),
      })

      if (response.status === 'in_progress') {
        navigate(`/candidate/${data.test_id.trim().toUpperCase()}/test`)
      } else if (response.status === 'ready') {
        navigate(`/candidate/${data.test_id.trim().toUpperCase()}/instructions`)
      } else {
        setError(response.message || 'Test cannot be accessed')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        setError(axiosErr.response?.data?.message || 'Test not found')
      } else {
        setError('Network error. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-600/20">
            <span className="text-xl font-bold text-white">T</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Candidate Portal</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Enter your Test ID to continue</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Test ID"
              placeholder="e.g. A8KM-P2Q7"
              {...register('test_id')}
              error={errors.test_id?.message || error}
              autoFocus
              autoComplete="off"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              icon={<LogIn className="h-4 w-4" />}
            >
              Continue
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Contact your administrator if you don&apos;t have a Test ID
        </p>
      </div>
    </div>
  )
}
