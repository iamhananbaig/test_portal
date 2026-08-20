import { useState, useEffect } from 'react'
import { FolderOpen } from 'lucide-react'
import api from '../../services/api'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card, { CardContent } from '../../components/ui/Card'
import Table, { TableRow, TableCell } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Toast from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'

interface Category {
  id: number
  name: string
  is_active: boolean
  questions_count: number
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const openCreate = () => {
    setEditingCategory(null)
    setName('')
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, { name })
        setToast({ message: 'Category updated.', type: 'success' })
      } else {
        await api.post('/categories', { name })
        setToast({ message: 'Category created.', type: 'success' })
      }
      setModalOpen(false)
      fetchCategories()
    } catch {
      setToast({ message: 'Failed to save category.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (cat: Category) => {
    await api.put(`/categories/${cat.id}`, { is_active: !cat.is_active })
    setToast({ message: `Category ${cat.is_active ? 'deactivated' : 'activated'}.`, type: 'success' })
    fetchCategories()
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Categories"
        action={<Button onClick={openCreate}>Add Category</Button>}
      />

      <Card className="mt-6">
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center"><Spinner /></div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              message="No categories found"
              description="Create your first category to organize questions."
              action={<Button onClick={openCreate} size="sm">Add Category</Button>}
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
                  <TableCell className="font-medium text-gray-900">{cat.name}</TableCell>
                  <TableCell>{cat.questions_count}</TableCell>
                  <TableCell>
                    <Badge variant={cat.is_active ? 'success' : 'gray'}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(cat)}>
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
            <Button onClick={handleSave} loading={saving} disabled={!name.trim()}>
              Save
            </Button>
          </>
        }
      >
        <Input
          label="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Accounting"
        />
      </Modal>
    </div>
  )
}
