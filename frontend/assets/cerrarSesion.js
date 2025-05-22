document.getElementById('logoutBtn').addEventListener('click', () => {
  fetch('http://localhost:4000/logout', {
    method: 'POST',
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    console.log(data.mensaje);
    localStorage.clear();
    window.location.href = '/DSS/frontend/Vista_login.html';
  })
  .catch(error => {
    console.error('Error cerrando sesión:', error);
  });
});
