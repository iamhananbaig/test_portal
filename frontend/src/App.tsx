import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import RequireAuth from '@/components/RequireAuth'
import GuestRoute from '@/components/GuestRoute'
import AdminLayout from '@/layouts/AdminLayout'
import Skeleton from '@/components/ui/Skeleton'

const Login = lazy(() => import('@/pages/admin/Login'))
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'))
const Categories = lazy(() => import('@/pages/admin/Categories'))
const QuestionBank = lazy(() => import('@/pages/admin/QuestionBank'))
const QuestionForm = lazy(() => import('@/pages/admin/QuestionForm'))
const BulkUpload = lazy(() => import('@/pages/admin/BulkUpload'))
const TestProfileList = lazy(() => import('@/pages/admin/TestProfileList'))
const TestProfileForm = lazy(() => import('@/pages/admin/TestProfileForm'))
const CandidateList = lazy(() => import('@/pages/admin/CandidateList'))
const CandidateForm = lazy(() => import('@/pages/admin/CandidateForm'))
const CandidateDetail = lazy(() => import('@/pages/admin/CandidateDetail'))
const TestCreate = lazy(() => import('@/pages/admin/TestCreate'))
const TestList = lazy(() => import('@/pages/admin/TestList'))
const Marking = lazy(() => import('@/pages/admin/Marking'))
const MarkingDetail = lazy(() => import('@/pages/admin/MarkingDetail'))
const Results = lazy(() => import('@/pages/admin/Results'))
const ResultDetail = lazy(() => import('@/pages/admin/ResultDetail'))
const CandidateLogin = lazy(() => import('@/pages/candidate/CandidateLogin'))
const CandidateInstructions = lazy(() => import('@/pages/candidate/CandidateInstructions'))
const CandidateTest = lazy(() => import('@/pages/candidate/CandidateTest'))
const CandidateComplete = lazy(() => import('@/pages/candidate/CandidateComplete'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function PageLoader() {
  return (
    <div className="py-12 px-6 space-y-4">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route
                    path="/admin/login"
                    element={
                      <GuestRoute>
                        <Login />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <RequireAuth>
                        <AdminLayout />
                      </RequireAuth>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="questions" element={<QuestionBank />} />
                    <Route path="questions/new" element={<QuestionForm />} />
                    <Route path="questions/:id/edit" element={<QuestionForm />} />
                    <Route path="questions/bulk-upload" element={<BulkUpload />} />
                    <Route path="profiles" element={<TestProfileList />} />
                    <Route path="profiles/new" element={<TestProfileForm />} />
                    <Route path="profiles/:id/edit" element={<TestProfileForm />} />
                    <Route path="candidates" element={<CandidateList />} />
                    <Route path="candidates/new" element={<CandidateForm />} />
                    <Route path="candidates/:id" element={<CandidateDetail />} />
                    <Route path="candidates/:id/edit" element={<CandidateForm />} />
                    <Route path="tests" element={<TestList />} />
                    <Route path="tests/new" element={<TestCreate />} />
                    <Route path="marking" element={<Marking />} />
                    <Route path="marking/:id" element={<MarkingDetail />} />
                    <Route path="results" element={<Results />} />
                    <Route path="results/:id" element={<ResultDetail />} />
                  </Route>
                  <Route path="/candidate" element={<CandidateLogin />} />
                  <Route path="/candidate/:testId/instructions" element={<CandidateInstructions />} />
                  <Route path="/candidate/:testId/test" element={<CandidateTest />} />
                  <Route path="/candidate/:testId/complete" element={<CandidateComplete />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
