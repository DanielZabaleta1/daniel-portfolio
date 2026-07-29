import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="wrap" style="padding-top: 80px; text-align: center;">
    <span class="mark">Daniel<b>Zabaleta</b><span class="dot"></span></span>
    <p style="color: var(--ink-2); margin-top: 16px;">Scaffold ready — sections land in Phase 2.</p>
  </div>
`;
