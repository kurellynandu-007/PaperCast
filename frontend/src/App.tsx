import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Configure } from './pages/Configure';
import { ScriptEditor } from './pages/ScriptEditor';
import { Listen } from './pages/Listen';
import { Transformations } from './pages/Transformations';
import { DebateScore } from './pages/DebateScore';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-brand-bg text-brand-text font-body selection:bg-brand-primary/30">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/debate-score" element={<DebateScore />} />
                <Route path="/configure" element={<Configure />} />
                <Route path="/edit" element={<ScriptEditor />} />
                <Route path="/listen" element={<Listen />} />
                <Route path="/transformations" element={<Transformations />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
