#!/bin/bash

echo "🚀 Iniciando build para Vercel..."

# Verificar Node.js
node --version
npm --version

# Limpiar cache de npm
npm cache clean --force

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# Generar archivos PWA
echo "📱 Generando archivos PWA..."
node generatePWA.js

# Verificar que expo esté disponible
echo "🔧 Verificando Expo CLI..."
npx expo --version

# Build para web
echo "🌐 Building para web..."
npx expo export -p web

# Verificar que se generó el directorio dist
echo "📁 Verificando directorio de salida..."
ls -la
if [ -d "dist" ]; then
    echo "✅ Directorio dist creado exitosamente"
    ls -la dist/
else
    echo "❌ Error: directorio dist no encontrado"
    exit 1
fi

echo "✅ Build completado exitosamente!"