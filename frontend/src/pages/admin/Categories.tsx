import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderOpen } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card, { CardContent } from '../../components/ui/Card'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Skeleton from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import Toast from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import { categorySchema } from '../../lib/validations'

interface Category {
  id: number
  name: string
  is_active: boolean
  questions_count: number
}

export default function Categories() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(categorySchema),
  })

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string }) => api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setToast({ message: 'Category created.', type: 'success' })
      setModalOpen(false)
    },
    onError: () => {
      setToast({ message: 'Failed to save category.', type: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => api.put(`/categories/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setToast({ message: 'Category updated.', type: 'success' })
      setModalOpen(false)
    },
    onError: () => {
      setToast({ message: 'Failed to save category.', type: 'error' })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.put(`/categories/${id}`, { is_active }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setToast({
        message: `Category ${vars.is_active ? 'deactivated' : 'activated'}.`,
        type: 'success',
      })
    },
  })

  const openCreate = () => {
    setEditingCategory(null)
    reset()
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    reset({ name: cat.name })
    setModalOpen(true)
  }

  const onSubmit = (data: { name: string }) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name: data.name })
    } else {
      createMutation.mutate({ name: data.name })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Categories"
        action={<Button onClick={openCreate}>Add Category</Button>}
      />

      <Card className="mt-6">
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              message="No categories found"
              description="Create your first category to organize questions."
              action={
                <Button onClick={openCreate} size="sm">
                  Add Category
                </Button>
              }
            />
          ) : (
            <Table
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'questions', header: 'Questions' },
                { key: 'status', header: 'Status' },
                { key: 'actions', header: 'Actions' },
              ]}
            >
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">{cat.name}</TableCell>
                  <TableCell>{cat.questions_count}</TableCell>
                  <TableCell>
                    <Badge variant={cat.is_active ? 'success' : 'gray'}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate({ id: cat.id, is_active: cat.is_active })}>
                        {cat.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={isSaving}>
              Save
            </Button>
          </>
        }
      >
        <Input
          label="Category Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g. Accounting"
        />
      </Modal>
    </div>
  )
}
