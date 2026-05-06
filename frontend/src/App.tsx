import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/pages/LoginPage'
import { LandingPage } from '@/pages/LandingPage'
import { StudentDashboard } from '@/pages/StudentDashboard'
import { FacultyDashboard } from '@/pages/FacultyDashboard'
import { AITutorPage } from '@/pages/AITutorPage'
import { CoursesPage } from '@/pages/CoursesPage'
import { SkillTreePage } from '@/pages/SkillTreePage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { InsightsPage } from '@/pages/InsightsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { Spinner } from '@/components/ui/spinner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth()
    if (loading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl brand-gradient">
                        <Spinner className="size-6 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading Cogniva...</p>
                </div>
            </div>
        )
    }
    if (!session) return <Navigate to="/?auth=login" replace />
    return <>{children}</>
}

function DashboardRoute() {
    const { profile, loading } = useAuth()
    if (loading) return null
    if (profile?.role === 'faculty') return <FacultyDashboard />
    return <StudentDashboard />
}

function AppRoutes() {
    const { session } = useAuth()

    return (
        <Routes>
            <Route
                path="/"
                element={session ? <Navigate to="/dashboard" replace /> : <LandingPage />}
            />
            <Route
                path="/login"
                element={<Navigate to="/?auth=login" replace />}
            />
            <Route
                path="/dashboard"
                element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>}
            />
            <Route
                path="/tutor"
                element={<ProtectedRoute><AITutorPage /></ProtectedRoute>}
            />
            <Route
                path="/courses"
                element={<ProtectedRoute><CoursesPage /></ProtectedRoute>}
            />
            <Route
                path="/skill-tree"
                element={<ProtectedRoute><SkillTreePage /></ProtectedRoute>}
            />
            <Route
                path="/skill-tree/:id"
                element={<ProtectedRoute><SkillTreePage /></ProtectedRoute>}
            />
            <Route
                path="/resources"
                element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>}
            />
            <Route
                path="/insights"
                element={<ProtectedRoute><InsightsPage /></ProtectedRoute>}
            />
            <Route
                path="/settings"
                element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
