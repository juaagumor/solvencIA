
# SolvencIA - Dpto. Contabilidad y Economía Financiera

SolvencIA es una plataforma educativa avanzada basada en inteligencia artificial, diseñada específicamente para el entorno académico del Departamento de Contabilidad y Economía Financiera de la Universidad de Sevilla.

## 🚀 Características principales
- **Conocimiento Privado:** Basada en 50 temas especializados de la asignatura.
- **Fuentes Invisibles:** La IA responde con rigor académico sin citar archivos externos, manteniendo una interfaz limpia.
- **Herramientas de Estudio:**
  - 📝 Generación de Tests interactivos.
  - 🧠 Mapas Conceptuales automáticos.
  - 🎙️ Podcast Educativos (Dúo Profesor/Alumno).
  - 📊 Infografías visuales generadas por IA.
- **Panel Maestro:** Control total sobre el branding y la base de conocimientos.

## 🛠️ Configuración para GitHub Pages

Este proyecto utiliza **GitHub Actions** para el despliegue automático.

1. **API KEY:** Debes añadir tu clave de Gemini API en los secretos del repositorio:
   - Ve a `Settings > Secrets and variables > Actions`.
   - Crea un secreto llamado `API_KEY`.
2. **Despliegue:** En `Settings > Pages`, asegúrate de que la fuente sea `GitHub Actions`.

## 🔒 Acceso Administrador
El panel de configuración está oculto para los alumnos. Para acceder:
1. Haz clic 5 veces seguidas en el logo de la aplicación.
2. Introduce la clave maestra: `US-2025`.

## 📁 Estructura del Conocimiento
Los 50 temas base se encuentran en el archivo `knowledge.ts`. Puedes editarlos directamente allí o usar el Panel Maestro para añadir contenido dinámico que se guardará en el navegador del administrador.

---
*Desarrollado para el Dpto. de Contabilidad y Economía Financiera.*
