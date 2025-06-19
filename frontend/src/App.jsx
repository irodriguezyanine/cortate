// frontend/src/App.jsx (Versión de Despliegue Garantizado)

import React fromónico, pero si el componente de error intenta usar un contexto, fallará.

### El Plan Final (Operación "T 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

//ierra Quemada")

Vamos a hacer la prueba más drástica y definitiva. Si esto no funciona, el problema es algo Layout components
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// ÚNICA PÁGINA QUE VAMOS A RENDERIZAR
import Landing from './pages/Landing';  muy, muy extraño. El plan es dejar tu `App.jsx` en su forma más minimalista posible, render

// Styles
import './styles/index.css';

// Layout simple para la prueba
const Layout = ({izando **una sola cosa simple** que no use ningún contexto ni lógica compleja.

Si esta versión minimalista se despliega, sab children }) => {
  return (
    <div className="min-h-screen bg-black text-white flexremos que el 100% de la configuración (backend, build, etc.) es correcta, y que el error está en flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
};


function uno de los componentes que quitamos. Luego los iremos añadiendo uno por uno hasta encontrar al culpable.

---

### Código App() {
  return (
    // ¡SIN ERROR BOUNDARY POR AHORA! Para ver el error real Definitivo para el Despliegue

**Paso 1: Archivo `frontend/src/main si lo hay.
    <Router>
      <Routes>
        {/*
          RUTA ÚNICA:.jsx`**
Este archivo ya debería estar correcto con la versión que te di (con los `Provider` envolviendo a
          Cualquier visita a tu sitio web cargará SOLAMENTE la página de Landing.
          Esto elimina cualquier `App`). Lo mantenemos así, es la forma correcta.

**Paso 2: Archivo `frontend/ otra página o componente complejo de la ecuación.
        */}
        <Route 
          path="*" 
          element={
            <Layout>
              <Landing />
            </Layout>
          } 
        />
src/App.jsx` (Versión "Tierra Quemada")**

Reemplaza TODO el contenido de tu `      </Routes>
    </Router>
  );
}

export default App;
