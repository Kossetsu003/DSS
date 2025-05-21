async function checkLogin() {
  const res = await fetch('http://localhost:4000/perfil', {
    credentials: 'include'
  });
  const data = await res.json();
  if (!res.ok) {
    window.location.href = '/DSS/frontend/Vista_login.html';
  } else if (data.rol == 1) {
    window.location.href = '/DSS/frontend/vista_Index_Alu.html';
  }
}
checkLogin();