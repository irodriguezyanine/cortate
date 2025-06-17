#!/bin/bash
set -e

echo "🚀 Iniciando build de Córtate.cl..."

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install --production=false
cd ..

# Instalar y construir frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install

echo "🔨 Construyendo frontend..."
npm run build

# Verificar que el build se completó
if [ -d "dist" ]; then
    echo "✅ Frontend construido exitosamente"
    ls -la dist/
else
    echo "❌ Error: El directorio dist no fue creado"
    exit 1
fi

cd ..

echo "✅ Build completado exitosamente"
