import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { HelpCircle, Plus } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Card, { CardContent } from '../../components/ui/Card'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/ui/PageHeader'
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
      <PageHeader
        title="Question Bank"
        action={
          <Button onClick={() => navigate('/admin/questions/new')} icon={<Plus className="h-4 w-4" />}>
            Add Question
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent>
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="py-12 flex justify-center"><Spinner /></div>
          ) : questions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              message="No questions found"
              description="Get started by adding your first question."
              action={<Button onClick={() => navigate('/admin/questions/new')} size="sm">Add Question</Button>}
            />
          ) : (
            <>
              <Table
                columns={[
                  { key: 'category', header: 'Category' },
                  { key: 'type', header: 'Type' },
                  { key: 'text', header: 'Question' },
                  { key: 'marks', header: 'Marks' },
                  { key: 'status', header: 'Status' },
                  { key: 'actions', header: 'Actions', className: 'text-right' },
                ]}
                caption="Questions list"
              >
                {questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>{q.category?.name}</TableCell>
                    <TableCell>
                      <Badge variant={q.type === 'mcq' ? 'info' : 'warning'}>
                        {q.type === 'mcq' ? 'MCQ' : 'Descriptive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{q.text}</TableCell>
                    <TableCell>{q.marks}</TableCell>
                    <TableCell>
                      <Badge variant={q.is_active ? 'success' : 'gray'}>
                        {q.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/questions/${q.id}/edit`)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(q)}>
                          {q.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
