import { Routes, Route } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'
import GuestRoute from './components/GuestRoute'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Categories from './pages/admin/Categories'
import QuestionBank from './pages/admin/QuestionBank'
import QuestionForm from './pages/admin/QuestionForm'
import TestCreate from './pages/admin/TestCreate'
import TestList from './pages/admin/TestList'
import Marking from './pages/admin/Marking'
import MarkingDetail from './pages/admin/MarkingDetail'
import Results from './pages/admin/Results'
import ResultDetail from './pages/admin/ResultDetail'
import CandidateLogin from './pages/candidate/CandidateLogin'
import CandidateInstructions from './pages/candidate/CandidateInstructions'
import CandidateTest from './pages/candidate/CandidateTest'
import CandidateComplete from './pages/candidate/CandidateComplete'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}
