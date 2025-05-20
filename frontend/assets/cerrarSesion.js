document.getElementById('logoutBtn').addEventListener('click', () => {
  fetch('http://localhost:3000/logout', {
    method: 'POST',
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    console.log(data.mensaje);
    window.location.href = 'login.html';
  })
  .catch(error => {
    console.error('Error cerrando sesión:', error);
  });
});
