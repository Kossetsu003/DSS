async function checkLogin() {
  const res = await fetch('http://localhost:3000/perfil', {
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok) {
    window.location.href = '/login.html';
  }
}
checkLogin();