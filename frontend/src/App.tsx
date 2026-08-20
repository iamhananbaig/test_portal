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
        </Route>
        <Route path="/candidate" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Candidate Portal</h1><p className="mt-2 text-gray-600">Coming soon</p></div>} />
      </Routes>
    </AuthProvider>
  )
}
