import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ClipboardCopy, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Card, { CardContent } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import { formatTime } from '../../utils/dates'

interface Category {
  id: number
  name: string
}

interface CategoryRow {
  category_id: string
  count: string
}

export default function TestCreate() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [candidateName, setCandidateName] = useState('')
  const [candidateCnic, setCandidateCnic] = useState('')
  const [duration, setDuration] = useState('60')
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([
    { category_id: '', count: '' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successModal, setSuccessModal] = useState(false)
  const [generatedTestId, setGeneratedTestId] = useState('')
  const [generatedExpiry, setGeneratedExpiry] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await api.get('/categories', { params: { per_page: 100 } })
      setCategories(
        response.data.data.filter((c: Category & { is_active: boolean }) => c.is_active),
      )
    }
    fetchCategories()
  }, [])

  const addRow = () => {
    setCategoryRows([...categoryRows, { category_id: '', count: '' }])
  }

  const removeRow = (index: number) => {
    setCategoryRows(categoryRows.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof CategoryRow, value: string) => {
    const updated = [...categoryRows]
    updated[index] = { ...updated[index], [field]: value }
    setCategoryRows(updated)
  }

  const handleGenerate = async () => {
    setError('')
    setSaving(true)
    try {
      const categoriesPayload = categoryRows
        .filter((r) => r.category_id && r.count)
        .map((r) => ({
          category_id: Number(r.category_id),
          count: Number(r.count),
        }))

      if (categoriesPayload.length === 0) {
        setError('Add at least one category with question count')
        setSaving(false)
        return
      }

      const response = await api.post('/tests/generate', {
        candidate_name: candidateName,
        candidate_cnic: candidateCnic,
        categories: categoriesPayload,
        duration_minutes: Number(duration),
      })

      setGeneratedTestId(response.data.data.test_id)
      setGeneratedExpiry(response.data.data.expires_at)
      setSuccessModal(true)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } }
        setError(axiosErr.response?.data?.message || 'Failed to generate test')
      }
    } finally {
      setSaving(false)
    }
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
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. Ahmed Ali"
            />
            <Input
              label="CNIC"
              value={candidateCnic}
              onChange={(e) => setCandidateCnic(e.target.value)}
              placeholder="e.g. 35202-1234567-1"
            />
          </div>

          <h2 className="mb-4 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Test Configuration
          </h2>
          <div className="space-y-3">
            {categoryRows.map((row, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="flex-1">
                  <Select
                    label={index === 0 ? 'Category' : undefined}
                    value={row.category_id}
                    onChange={(e) => updateRow(index, 'category_id', e.target.value)}
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
                    value={row.count}
                    onChange={(e) => updateRow(index, 'count', e.target.value)}
                    placeholder="Count"
                  />
                </div>
                {categoryRows.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeRow(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="mt-3" onClick={addRow}>
            + Add Category
          </Button>

          <div className="mt-6">
            <Input
              label="Duration (minutes)"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 60"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/admin/tests')}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              loading={saving}
              disabled={!candidateName || !candidateCnic}
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
          <div className="rounded-lg bg-primary-50 p-4 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Test ID</p>
            <p className="text-2xl font-bold tracking-wider text-primary-700">
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
