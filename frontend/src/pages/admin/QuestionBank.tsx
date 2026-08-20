import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Card, { CardContent } from '../../components/ui/Card'
import { useDebounce } from '../../hooks/useDebounce'

interface Category {
  id: number
  name: string
}

interface Question {
  id: number
  category_id: number
  category: Category
  type: string
  text: string
  marks: number
  is_active: boolean
}

export default function QuestionBank() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category_id: '',
    type: '',
    is_active: '',
    search: '',
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const debouncedSearch = useDebounce(filters.search, 300)

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page }
      if (filters.category_id) params.category_id = filters.category_id
      if (filters.type) params.type = filters.type
      if (filters.is_active) params.is_active = filters.is_active
      if (debouncedSearch) params.search = debouncedSearch

      const response = await api.get('/questions', { params })
      setQuestions(response.data?.data ?? [])
      setTotalPages(response.data?.meta?.last_page ?? 1)
    } catch {
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories', { params: { per_page: 100 } })
      setCategories(response.data?.data ?? [])
    } catch {
      setCategories([])
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [filters.category_id, filters.type, filters.is_active, debouncedSearch, page])

  const toggleStatus = async (q: Question) => {
    await api.put(`/questions/${q.id}/status`)
    fetchQuestions()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <Button onClick={() => navigate('/admin/questions/new')}>Add Question</Button>
      </div>

      <Card className="mt-6">
        <CardContent>
          <div className="mb-4 grid grid-cols-4 gap-4">
            <Select
              label="Category"
              value={filters.category_id}
              onChange={(e) => { setFilters({ ...filters, category_id: e.target.value }); setPage(1) }}
              options={[{ value: '', label: 'All' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Select
              label="Type"
              value={filters.type}
              onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1) }}
              options={[
                { value: '', label: 'All' },
                { value: 'mcq', label: 'MCQ' },
                { value: 'descriptive', label: 'Descriptive' },
              ]}
            />
            <Select
              label="Status"
              value={filters.is_active}
              onChange={(e) => { setFilters({ ...filters, is_active: e.target.value }); setPage(1) }}
              options={[
                { value: '', label: 'All' },
                { value: '1', label: 'Active' },
                { value: '0', label: 'Inactive' },
              ]}
            />
            <Input
              label="Search"
              placeholder="Search questions..."
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1) }}
            />
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">Loading...</p>
          ) : questions.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No questions found.</p>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Questions list</caption>
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600">
                    <th scope="col" className="pb-3 font-medium">Category</th>
                    <th scope="col" className="pb-3 font-medium">Type</th>
                    <th scope="col" className="pb-3 font-medium">Question</th>
                    <th scope="col" className="pb-3 font-medium">Marks</th>
                    <th scope="col" className="pb-3 font-medium">Status</th>
                    <th scope="col" className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-gray-600">{q.category?.name}</td>
                      <td className="py-3">
                        <Badge variant={q.type === 'mcq' ? 'info' : 'warning'}>
                          {q.type === 'mcq' ? 'MCQ' : 'Descriptive'}
                        </Badge>
                      </td>
                      <td className="max-w-xs truncate py-3 text-gray-900">{q.text}</td>
                      <td className="py-3 text-gray-600">{q.marks}</td>
                      <td className="py-3">
                        <Badge variant={q.is_active ? 'success' : 'gray'}>
                          {q.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/questions/${q.id}/edit`)}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(q)}>
                            {q.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
