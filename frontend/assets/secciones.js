document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedor-secciones');
    const formSeccion = document.getElementById('formSeccion');
    const modal = document.getElementById('modal-matricula');
    const listaAlumnos = document.getElementById('lista-alumnos');
    let seccionActual = null;

    formSeccion.parentNode.insertBefore(contenedor, formSeccion.nextSibling);

    formSeccion.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombreSeccion').value;
        const anio = document.getElementById('anioSeccion').value;
        try {
            const res = await fetch('http://localhost:4000/secciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nombre, anio })
            });
            if (!res.ok) {
                const err = await res.json();
                return alert(err.message || 'Error al guardar sección');
            }
            formSeccion.reset();
            cargarSecciones();
        } catch (err) {
            console.error('Error al guardar sección:', err);
            alert('No se pudo conectar con el servidor');
        }
    });

    async function cargarSecciones() {
        const res = await fetch('http://localhost:4000/seccionesListar', { credentials: 'include' });
        const secciones = await res.json();
        contenedor.innerHTML = '';

        secciones.forEach(sec => {
            const wrapper = document.createElement('div');
            wrapper.className = 'bg-white p-4 rounded-md mb-6';
            wrapper.innerHTML = `
        <h2 class="text-gray-500 text-lg font-semibold pb-4">
          ${sec.nombre} ${sec.anio}
        </h2>
        <div class="my-1"></div>
        <div class="bg-gradient-to-r from-cyan-300 to-cyan-500 h-px mb-6"></div>
        <table class="w-full table-auto text-sm mb-2">
          <thead>
            <tr class="text-sm leading-normal">
              <th class="py-2 px-4 bg-grey-lightest font-bold uppercase text-grey-light border-b border-grey-light">Carnet</th>
              <th class="py-2 px-4 bg-grey-lightest font-bold uppercase text-grey-light border-b border-grey-light">Nombre</th>
              <th class="py-2 px-4 bg-grey-lightest font-bold uppercase text-grey-light border-b border-grey-light">Acciones</th>
            </tr>
          </thead>
          <tbody id="int-body-${sec.id}">
            <tr><td colspan="3" class="py-2 px-4 text-center">Cargando...</td></tr>
          </tbody>
        </table>
        <div class="p-2">
          <a href="#"
             data-id="${sec.id}"
             class="matricular-btn block py-2.5 px-4 my-2 rounded transition duration-200 hover:bg-gradient-to-r hover:from-orange-600 hover:to-orange-300 hover:text-white text-center">
            Matricular Usuario
          </a>
        </div>
      `;
            contenedor.appendChild(wrapper);
            cargarIntegrantes(sec.id);
        });

        document.querySelectorAll('.matricular-btn')
            .forEach(btn => btn.addEventListener('click', abrirModal));
    }

    async function cargarIntegrantes(id) {
        const res = await fetch(`http://localhost:4000/secciones/${id}/integrantes`, {
            credentials: 'include'
        });
        const alumnos = await res.json();
        const tbody = document.getElementById(`int-body-${id}`);

        tbody.innerHTML = alumnos.length
            ? alumnos.map(a => `
        <tr class="hover:bg-grey-lighter">
          <td class="py-2 px-4 border-b border-grey-light text-center">${a.codigo}</td>
          <td class="py-2 px-4 border-b border-grey-light text-center">${a.nombre}</td>
          <td class="py-2 px-4 border-b border-grey-light text-center">
            <button
              data-seccion="${id}"
              data-alumno="${a.id}"
              class="eliminar-btn px-2 py-1 bg-red-500 text-white rounded">
              Eliminar
            </button>
          </td>
        </tr>
      `).join('')
            : `<tr><td colspan="3" class="text-center py-2">No hay alumnos</td></tr>`;

    }


    async function abrirModal(e) {
        e.preventDefault();
        seccionActual = e.currentTarget.dataset.id;
        modal.classList.remove('hidden');
        listaAlumnos.innerHTML = '<li class="py-1">Cargando...</li>';
        try {
            const res = await fetch('http://localhost:4000/alumnos', { credentials: 'include' });
            const alumnos = await res.json();
            listaAlumnos.innerHTML = alumnos.map(a => `
        <li class="flex justify-between items-center mb-2">
          <div>
            <span class="font-semibold">${a.codigo}</span>
            <span class="ml-2 text-gray-600">${a.nombre}</span>
          </div>
          <button data-id="${a.id}" class="matricular-alumno px-2 py-1 bg-green-500 text-white rounded">
            Matricular
          </button>
        </li>
      `).join('');
            document.querySelectorAll('.matricular-alumno')
                .forEach(btn => btn.addEventListener('click', matricularAlumno));
        } catch (err) {
            console.error('Error al cargar alumnos:', err);
            listaAlumnos.innerHTML = '<li class="text-red-500">Error cargando alumnos</li>';
        }
    }

    async function matricularAlumno(e) {
        const id_alumno = parseInt(e.currentTarget.dataset.id);
        try {
            const res = await fetch(`http://localhost:4000/secciones/${seccionActual}/matricular`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id_alumno })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Error al matricular');
                return;
            }

            cargarIntegrantes(seccionActual);
        } catch (err) {
            console.error('Error al matricular alumno:', err);
            alert('Error al matricular');
        }
    }



    document.getElementById('cerrar-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    cargarSecciones();

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('eliminar-btn')) {
            const secId = e.target.getAttribute('data-seccion');
            const alumnoId = e.target.getAttribute('data-alumno');

            const confirmacion = confirm('¿Estás seguro de que quieres eliminar este alumno de la sección?');
            if (!confirmacion) return;

            try {
                const delRes = await fetch(
                    `http://localhost:4000/secciones/${secId}/integrantes/${alumnoId}`,
                    { method: 'DELETE', credentials: 'include' }
                );

                if (delRes.ok) {
                    await cargarIntegrantes(secId);
                } else {
                    const err = await delRes.json();
                    alert(err.message || 'Error al eliminar');
                }
            } catch (err) {
                console.error('Error al eliminar alumno:', err);
                alert('Error de conexión al eliminar');
            }
        }
    });

});