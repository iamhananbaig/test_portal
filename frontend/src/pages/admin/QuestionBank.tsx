import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HelpCircle, Plus } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Card, { CardContent } from '../../components/ui/Card'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import Skeleton from '../../components/ui/Skeleton'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const filters = {
    category_id: searchParams.get('category_id') || '',
    type: searchParams.get('type') || '',
    is_active: searchParams.get('is_active') || '',
    search: searchParams.get('search') || '',
  }
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1)
  const debouncedSearch = useDebounce(filters.search, 300)

  const updateFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value)
      else prev.delete(key)
      prev.delete('page')
      return prev
    })
    setPage(1)
  }

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories', { params: { per_page: 100 } })
      return response.data?.data ?? []
    },
  })

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions', page, filters.category_id, filters.type, filters.is_active, debouncedSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { page }
      if (filters.category_id) params.category_id = filters.category_id
      if (filters.type) params.type = filters.type
      if (filters.is_active) params.is_active = filters.is_active
      if (debouncedSearch) params.search = debouncedSearch

      const response = await api.get('/questions', { params })
      return { data: response.data?.data ?? [], totalPages: response.data?.meta?.last_page ?? 1 }
    },
  })

  const questions = questionsData?.data ?? []
  const totalPages = questionsData?.totalPages ?? 1

  const toggleMutation = useMutation({
    mutationFn: (q: Question) => api.put(`/questions/${q.id}/status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] })
    },
  })

  return (
    <div>
      <PageHeader
        title="Question Bank"
        action={
          <Button
            onClick={() => navigate('/admin/questions/new')}
            icon={<Plus className="h-4 w-4" />}
          >
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
              onChange={(e) => updateFilter('category_id', e.target.value)}
              options={[
                { value: '', label: 'All' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              label="Type"
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              options={[
                { value: '', label: 'All' },
                { value: 'mcq', label: 'MCQ' },
                { value: 'descriptive', label: 'Descriptive' },
              ]}
            />
            <Select
              label="Status"
              value={filters.is_active}
              onChange={(e) => updateFilter('is_active', e.target.value)}
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
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-2/6" />
                  <Skeleton className="h-4 w-1/12" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              message="No questions found"
              description="Get started by adding your first question."
              action={
                <Button
                  onClick={() => navigate('/admin/questions/new')}
                  size="sm"
                >
                  Add Question
                </Button>
              }
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
                {questions.map((q: Question) => (
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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate(q)}>
                          {q.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
              <Pagination page={page} totalPages={totalPages} onPageChange={(p) => {
                setPage(p)
                setSearchParams((prev) => { prev.set('page', String(p)); return prev })
              }} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
