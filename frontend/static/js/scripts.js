// cortate/frontend/static/js/scripts.js

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("link-home")?.addEventListener("click", () => {
    window.location.href = "/";
  });

  document.getElementById("link-mapa")?.addEventListener("click", () => {
    window.location.href = "/mapa";
  });

  document.getElementById("link-lista")?.addEventListener("click", () => {
    window.location.href = "/lista";
  });

  document.getElementById("link-login")?.addEventListener("click", () => {
    window.location.href = "/login";
  });

  document.getElementById("link-register")?.addEventListener("click", () => {
    window.location.href = "/registro";
  });
});
