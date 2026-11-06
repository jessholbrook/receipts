// Shared by the theme toggle (client) and the pre-paint script in the root layout (server).
export const THEME_KEY = "receipts-theme";

export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;
