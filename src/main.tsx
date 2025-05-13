
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Import the CSS files for react-pdf but let the worker be configured in the component
import 'react-pdf/dist/esm/Page/TextLayer.css'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

createRoot(document.getElementById("root")!).render(<App />);
