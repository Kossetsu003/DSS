async function checkLogin() {
  const res = await fetch('http://localhost:4000/perfil', {
    credentials: 'include'
  });
  const data = await res.json();
  if (data.rol == 1) {
    window.location.href = '/DSS/frontend/Vista_Index_Alu.html';
  } else if (data.rol == 2) {
    window.location.href = '/DSS/frontend/vista_index_Doce.html';
  }
}
checkLogin();