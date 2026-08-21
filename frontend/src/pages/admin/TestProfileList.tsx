import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import api from '@/services/api'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import Table, { TableRow, TableCell } from '@/components/ui/Table'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { useToast } from '@/context/useToast'
import { getErrorMessage } from '@/lib/errors'

interface ProfileCategory {
  id: number
  category_id: number
  category_name: string
  question_count: number
}

interface TestProfile {
  id: number
  name: string
  duration_minutes: number
  categories: ProfileCategory[]
  created_at: string
}

export default function TestProfileList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['test-profiles'],
    queryFn: async () => {
      const response = await api.get('/test-profiles')
      return response.data.data as TestProfile[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/test-profiles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-profiles'] })
      success('Profile deleted.')
    },
    onError: (err) => {
      toastError(getErrorMessage(err))
    },
  })

  const profiles = data ?? []

  return (
    <div>
      <PageHeader
        title="Test Profiles"
        description="Reusable templates for test creation."
        action={
          <Button onClick={() => navigate('/admin/profiles/new')} icon={<Plus className="h-4 w-4" />}>
            New Profile
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              message="No test profiles"
              description="Create a profile to speed up test creation."
              action={
                <Button onClick={() => navigate('/admin/profiles/new')} size="sm">
                  Create Profile
                </Button>
              }
            />
          ) : (
            <Table
              columns={[
                { key: 'name', header: 'Name' },
                { key: 'duration', header: 'Duration' },
                { key: 'categories', header: 'Categories' },
                { key: 'questions', header: 'Total Questions' },
                { key: 'actions', header: '' },
              ]}
            >
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {profile.name}
                    </span>
                  </TableCell>
                  <TableCell>{profile.duration_minutes} min</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {profile.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        >
                          {cat.category_name} ({cat.question_count})
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {profile.categories.reduce((sum, cat) => sum + cat.question_count, 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/profiles/${profile.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this profile?')) {
                            deleteMutation.mutate(profile.id)
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
