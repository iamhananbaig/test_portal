import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Card, { CardContent } from '../../components/ui/Card'
import Skeleton from '../../components/ui/Skeleton'
import PageHeader from '../../components/ui/PageHeader'

interface Category {
  id: number
  name: string
}

interface Option {
  label: string
  text: string
  is_correct: boolean
}

export default function QuestionForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [type, setType] = useState('mcq')
  const [text, setText] = useState('')
  const [marks, setMarks] = useState('')
  const [options, setOptions] = useState<Option[]>([
    { label: 'A', text: '', is_correct: false },
    { label: 'B', text: '', is_correct: false },
    { label: 'C', text: '', is_correct: false },
    { label: 'D', text: '', is_correct: false },
  ])
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const catRes = await api.get('/categories', { params: { per_page: 100 } })
        setCategories(catRes.data.data)
        if (isEditing) {
          const qRes = await api.get(`/questions/${id}`)
          const q = qRes.data.data
          setCategoryId(String(q.category_id))
          setType(q.type)
          setText(q.text)
          setMarks(String(q.marks))
          if (q.options?.length) {
            setOptions(q.options)
          }
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, isEditing])

  const setCorrectOption = (index: number) => {
    setOptions(options.map((opt, i) => ({ ...opt, is_correct: i === index })))
  }

  const updateOptionText = (index: number, value: string) => {
    setOptions(options.map((opt, i) => (i === index ? { ...opt, text: value } : opt)))
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        category_id: Number(categoryId),
        type,
        text,
        marks: Number(marks),
      }
      if (type === 'mcq') {
        payload.options = options
      }
      if (isEditing) {
        await api.put(`/questions/${id}`, payload)
      } else {
        await api.post('/questions', payload)
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
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: 'mcq', label: 'MCQ' },
                { value: 'descriptive', label: 'Descriptive' },
              ]}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Question Text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Enter question text..."
            />
          </div>
          <div className="mt-4">
            <Input
              label="Marks"
              type="number"
              min="0.5"
              step="0.5"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder="e.g. 4"
            />
          </div>
          {type === 'mcq' && (
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
              onClick={handleSave}
              loading={saving}
              disabled={!categoryId || !text.trim() || !marks}
            >
              Save Question
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
