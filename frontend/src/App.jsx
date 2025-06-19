// frontend/src/App.jsx (Versión de Prueba Minimalista y Limpia)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Solo importamos lo mínimo indispensable
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import './styles/index.css';

// Un componente de página de prueba súper simple
const TestPage = () => {
  return (
    <div style={{ padding: '100px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', color: '#FBBF24' }}>¡CÓRTATE.CL FUNCIONA!</h1>
      <p style={{ fontSize: '24px', color: 'white' }}>El despliegue ha sido un éxito.</p>
      <p style={{ color: 'gray' }}>Ahora podemos restaurar las rutas una por una.</p>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <main className="flex-1 pt-16">
          <Routes>
            {/* RENDERIZAMOS UNA ÚNICA RUTA QUE NO PUEDE FALLAR */}
            <Route path="*" element={<TestPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
