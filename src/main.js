import App from './App.js';

async function init() {
  try {
    const app = new App();
    await app.init();
    window.appInstance = app;
  } catch (err) {
    console.error('App init failed:', err);
    document.getElementById('app').innerHTML = `
      <div style="padding:2rem; color:red; font-family:sans-serif;">
        <h2>Error inicializando la aplicación</h2>
        <p>${err.message}</p>
        <pre style="overflow:auto;">${err.stack}</pre>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
