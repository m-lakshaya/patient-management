import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'

import PatientDashboard from './pages/patient/PatientDashboard'
import TreatmentHistory from './pages/patient/TreatmentHistory'
import MedicalReports from './pages/patient/MedicalReports'
import SupportQueries from './pages/patient/SupportQueries'
import Appointments from './pages/patient/Appointments'
import ErrorBoundary from './components/ErrorBoundary'

import StaffDashboard from './pages/staff/StaffDashboard'
import QueryManagement from './pages/staff/QueryManagement'
import TreatmentManagement from './pages/staff/TreatmentManagement'
import PatientList from './pages/staff/PatientList'

import UserManagement from './pages/admin/UserManagement'
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard'

function App() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Patient Routes */}
                <Route path="/patient/*" element={
                    <ProtectedRoute allowedRoles={['patient']}>
                        <DashboardLayout>
                            <ErrorBoundary>
                                <Routes>
                                    <Route path="dashboard" element={<PatientDashboard />} />
                                    <Route path="treatments" element={<TreatmentHistory />} />
                                    <Route path="appointments" element={<Appointments />} />
                                    <Route path="reports" element={<MedicalReports />} />
                                    <Route path="queries" element={<SupportQueries />} />
                                </Routes>
                            </ErrorBoundary>
                        </DashboardLayout>
                    </ProtectedRoute>
                } />

                {/* Staff Routes */}
                <Route path="/staff/*" element={
                    <ProtectedRoute allowedRoles={['staff']}>
                        <DashboardLayout>
                            <ErrorBoundary>
                                <Routes>
                                    <Route path="dashboard" element={<StaffDashboard />} />
                                    <Route path="queries" element={<QueryManagement />} />
                                    <Route path="treatments" element={<TreatmentManagement />} />
                                    <Route path="patients" element={<PatientList />} />
                                </Routes>
                            </ErrorBoundary>
                        </DashboardLayout>
                    </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/*" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <DashboardLayout>
                            <ErrorBoundary>
                                <Routes>
                                    <Route path="dashboard" element={<AnalyticsDashboard />} />
                                    <Route path="users" element={<UserManagement />} />
                                    <Route path="doctors" element={<div>Doctors</div>} />
                                    <Route path="analytics" element={<AnalyticsDashboard />} />
                                </Routes>
                            </ErrorBoundary>
                        </DashboardLayout>
                    </ProtectedRoute>
                } />
            </Routes>
        </div>
    )
}

export default App
