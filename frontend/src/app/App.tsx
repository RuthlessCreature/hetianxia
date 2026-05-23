import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Layout from './components/Layout';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import ProjectListPage from '../features/projects/ProjectListPage';
import ProjectDetailPage from '../features/projects/ProjectDetailPage';
import ImageListPage from '../features/images/ImageListPage';
import AnnotationPage from '../features/annotation/AnnotationPage';
import TrainingPage from '../features/training/TrainingPage';
import EvaluationPage from '../features/evaluation/EvaluationPage';
import ModelPage from '../features/models/ModelPage';
import LicensePage from '../features/license/LicensePage';
import DatasetPage from '../features/datasets/DatasetPage';
import MemberPage from '../features/members/MemberPage';
import ModelComparePage from '../features/models/ModelComparePage';
import DeploymentPage from '../features/deployment/DeploymentPage';
import NotificationPage from '../features/notifications/NotificationPage';
import AnomalyDetectionPage from '../features/anomaly/AnomalyDetectionPage';
import ProjectSettingsPage from '../features/projects/ProjectSettingsPage';
import ReviewQueuePage from '../features/review/ReviewQueuePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectListPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/projects/:id/images" element={<ImageListPage />} />
                <Route path="/projects/:projectId/images/:imageId/annotate" element={<AnnotationPage />} />
                <Route path="/projects/:id/training" element={<TrainingPage />} />
                <Route path="/projects/:id/evaluation" element={<EvaluationPage />} />
                <Route path="/projects/:id/models" element={<ModelPage />} />
                <Route path="/projects/:id/datasets" element={<DatasetPage />} />
                <Route path="/projects/:id/compare" element={<ModelComparePage />} />
                <Route path="/projects/:id/deploy" element={<DeploymentPage />} />
                <Route path="/projects/:id/anomaly" element={<AnomalyDetectionPage />} />
                <Route path="/projects/:id/settings" element={<ProjectSettingsPage />} />
                <Route path="/projects/:id/review" element={<ReviewQueuePage />} />
                <Route path="/members" element={<MemberPage />} />
                <Route path="/notifications" element={<NotificationPage />} />
                <Route path="/license" element={<LicensePage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
