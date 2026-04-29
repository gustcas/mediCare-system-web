import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout }    from './components/layout/DashboardLayout';
import { ProtectedRoute }     from './components/auth/ProtectedRoute';
import { LoginPage }          from './pages/LoginPage';
import { DashboardPage }      from './pages/DashboardPage';
import { PatientsPage }       from './pages/PatientsPage';
import { AppointmentsPage }   from './pages/AppointmentsPage';
import { DoctorsPage }        from './pages/DoctorsPage';
import { ClinicalRecordsPage} from './pages/ClinicalRecordsPage';
import { BillingPage }        from './pages/BillingPage';
import { LabResultsPage }     from './pages/LabResultsPage';
import { AdmissionsPage }     from './pages/AdmissionsPage';
import { PrescriptionsPage }  from './pages/PrescriptionsPage';
import { CarePlansPage }      from './pages/CarePlansPage';
import { InsurancePage }      from './pages/InsurancePage';
import { MedicationsPage }    from './pages/MedicationsPage';
import { ConfigPage }         from './pages/ConfigPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"      element={<DashboardPage />} />
        <Route path="/pacientes"      element={<PatientsPage />} />
        <Route path="/citas"          element={<AppointmentsPage />} />
        <Route path="/doctores"       element={<DoctorsPage />} />
        <Route path="/expedientes"    element={<ClinicalRecordsPage />} />
        <Route path="/admisiones"     element={<AdmissionsPage />} />
        <Route path="/recetas"        element={<PrescriptionsPage />} />
        <Route path="/laboratorio"    element={<LabResultsPage />} />
        <Route path="/facturacion"    element={<BillingPage />} />
        <Route path="/planes-cuidado" element={<CarePlansPage />} />
        <Route path="/seguros"        element={<InsurancePage />} />
        <Route path="/medicamentos"   element={<MedicationsPage />} />
        <Route path="/configuracion"  element={<ConfigPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
