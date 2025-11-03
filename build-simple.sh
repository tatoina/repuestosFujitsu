#!/bin/bash
# Script de build simplificado para Vercel
echo "Iniciando build simplificado..."

# Solo exportar sin procesar imágenes
npx expo export:web --dev false --clear

echo "Build completado"