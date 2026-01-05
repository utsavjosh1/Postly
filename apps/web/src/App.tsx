import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@components/Layout';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { ChatPage } from '@pages/ChatPage';
import { ResumePage } from '@pages/ResumePage';
import { JobsPage } from '@pages/JobsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="chat" element={<ChatPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="jobs" element={<JobsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
