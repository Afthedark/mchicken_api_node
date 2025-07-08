// pedidos2.js
// Este script carga los pedidos desde la API y los muestra como tarjetas usando Bootstrap

const API_URL = '/pedidos'; // Ajusta si tu endpoint es diferente
const tarjetasPedidos = document.getElementById('tarjetasPedidos');
const refreshBtn = document.getElementById('refreshBtn');

let todosLosPedidos = [];
let paginaActual = 1;
const pedidosPorPagina = 20;
let totalPaginas = 1;
let filtroHoyActivo = true;

// Agregar el CSS personalizado de pedidos2.css
const head = document.head || document.getElementsByTagName('head')[0];
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = '/css/pedidos2.css';
head.appendChild(link);

// Sonido de alerta para nuevos pedidos
// Usar el <audio> global si existe, si no, crear uno
let alertaAudio = null;
if (window && document.getElementById('alertaAudio')) {
  alertaAudio = document.getElementById('alertaAudio');
} else {
  alertaAudio = new Audio('/assets/sounds/alerta1.mp3');
}
let ultimosIdsPedidos = [];

function estadoBadge(estado) {
    if (!estado || estado.toLowerCase() === 'concluido') return '';
    switch (estado) {
        case 'pendiente':
            return '<span class="badge bg-warning text-dark">Pendiente</span>';
        case 'preparando':
            return '<span class="badge bg-info text-dark">Preparando</span>';
        case 'listo':
            return '<span class="badge bg-success">Listo</span>';
        default:
            return `<span class="badge bg-secondary">${estado}</span>`;
    }
}

function tiempoRelativo(fecha) {
  if (!fecha) return '';
  const ahora = new Date();
  const fechaPedido = new Date(fecha);
  const diffMs = ahora - fechaPedido;
  const diffSeg = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSeg / 60);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffSeg < 60) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin === 1 ? '' : 's'}`;
  if (diffHoras < 24) return `hace ${diffHoras} hora${diffHoras === 1 ? '' : 's'}`;
  // Si es más de 24 horas, mostrar la fecha en formato local
  return fechaPedido.toLocaleString().toUpperCase();
}

function getPedidoIdUnico(pedido) {
    let id = pedido["Factura ID"];
    if (id && id.toString().trim() !== "") return id.toString();
    // Si no hay Factura ID, usa hash de fecha+cliente+productos
    let base = (pedido.fecha || '') + '|' + (pedido.cliente || '') + '|' + (pedido.producto || '') + '|' + (pedido.cantidad || '');
    // Hash simple para evitar caracteres raros
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
        hash = ((hash << 5) - hash) + base.charCodeAt(i);
        hash |= 0;
    }
    return `sinid-${Math.abs(hash)}`;
}

function crearTarjetaPedido(pedido, idx) {
    // Unificar productos y cantidades en una tabla
    let productos = (pedido.producto || '').split(',');
    let cantidades = (pedido.cantidad || '').split(',');
    let tablaProductos = '<table class="table table-sm tabla-productos mb-2"><thead><tr><th>PRODUCTO</th><th>CANTIDAD</th></tr></thead><tbody>';
    for (let i = 0; i < productos.length; i++) {
        const prod = productos[i] ? productos[i].trim().toUpperCase() : '';
        let cant = cantidades[i] ? cantidades[i].trim() : '';
        // Mostrar cantidad solo como número entero
        if (cant && !isNaN(cant)) {
            cant = parseInt(cant);
        }
        if (prod || cant) {
            tablaProductos += `<tr><td class='producto-nombre'>${prod}</td><td><span class='cantidad-badge'>${cant}</span></td></tr>`;
        }
    }
    tablaProductos += '</tbody></table>';
    // Mostrar tipo de pedido como texto legible (solo el primer valor)
    let tipoPedido = '-';
    let tipoPedidoClass = '';
    let primerLlevar = (pedido.llevar || '').split(',')[0]?.trim();
    if (primerLlevar === '1' || primerLlevar === 1) {
        tipoPedido = 'PARA LLEVAR';
        tipoPedidoClass = 'tipo-pedido-llevar';
    } else if (primerLlevar === '0' || primerLlevar === 0) {
        tipoPedido = 'PARA MESA';
        tipoPedidoClass = 'tipo-pedido-mesa';
    } else if (primerLlevar) {
        tipoPedido = primerLlevar.toUpperCase();
    }
    // Mostrar observaciones en mayúsculas o 'SIN OBSERVACIONES' si está vacío
    let obs = (pedido.observaciones && pedido.observaciones.trim()) ? pedido.observaciones.toUpperCase() : 'SIN OBSERVACIONES';
    let pedidoIdUnico = getPedidoIdUnico(pedido);
    // Si el filtro de hoy está activo, usar idx+1 como contador visible, si no mostrar el ID real
    let contador = filtroHoyActivo ? (idx + 1) : (pedido["Factura ID"] || '').toString().toUpperCase();
    // Elimina clases de animación previas si existen (para evitar conflictos)
    return `
    <div class="col-md-6 col-lg-4" id="pedido-${pedidoIdUnico}">
        <div class="card pedido-card shadow-sm">
            <div class="card-header pedido-header d-flex justify-content-between align-items-center">
                <span><i class="fas fa-hashtag me-1"></i> ${contador}</span>
                ${estadoBadge(pedido.estado)}
            </div>
            <div class="card-body">
                <h5 class="card-title mb-3"><i class="fas fa-user me-1"></i> ${(pedido.cliente || 'SIN NOMBRE').toUpperCase()}</h5>
                <div class="mb-2">
                    <span class="badge bg-warning text-dark"><i class="fas fa-hamburger me-1"></i> PRODUCTOS Y CANTIDADES</span>
                    ${tablaProductos}
                </div>
                <div class="mb-2"><span class="badge bg-light text-dark border"><i class="fas fa-box-open me-1"></i> TIPO PEDIDO</span><span class="ps-2 ${tipoPedidoClass}">${tipoPedido}</span></div>
                <div class="mb-2"><span class="badge bg-light text-dark border"><i class="fas fa-comment-alt me-1"></i> OBSERVACION GENERAL</span><br><span class="ps-2 obs-text">${obs}</span></div>
                <button class="btn btn-success mt-3 w-100 shadow-sm fw-semibold" onclick="marcarPedidoCompletado('${pedidoIdUnico}')">
                    <i class="fas fa-check-circle me-1"></i> MARCAR PEDIDO COMO COMPLETADO
                </button>
            </div>
            <div class="card-footer pedido-footer d-flex justify-content-between align-items-center">
                <span><i class="far fa-clock me-1"></i> ${pedido.fecha ? tiempoRelativo(pedido.fecha) : ''}</span>
                ${pedido.estado && pedido.estado.toLowerCase() !== 'concluido' ? `<span><strong>ESTADO:</strong> ${pedido.estado.toUpperCase()}</span>` : ''}
            </div>
        </div>
    </div>
    `;
}

function renderPaginador() {
    const paginador = document.getElementById('paginadorPedidos');
    if (!paginador) return;
    let opcionesPaginas = '';
    for (let i = 1; i <= totalPaginas; i++) {
        opcionesPaginas += `<option value="${i}"${i === paginaActual ? ' selected' : ''}>${i}</option>`;
    }
    paginador.innerHTML = `
        <nav aria-label="Paginador de pedidos">
            <ul class="pagination justify-content-center align-items-center">
                <li class="page-item${paginaActual === 1 ? ' disabled' : ''}">
                    <button class="page-link" id="btnAnterior">Anterior</button>
                </li>
                <li class="page-item disabled">
                    <span class="page-link">Página ${paginaActual} de ${totalPaginas}</span>
                </li>
                <li class="page-item">
                    <select id="selectPagina" class="form-select form-select-sm mx-2" style="width:auto;display:inline-block;">
                        ${opcionesPaginas}
                    </select>
                </li>
                <li class="page-item${paginaActual === totalPaginas ? ' disabled' : ''}">
                    <button class="page-link" id="btnSiguiente">Siguiente</button>
                </li>
            </ul>
        </nav>
    `;
    document.getElementById('btnAnterior').onclick = () => {
        if (paginaActual > 1) {
            paginaActual--;
            renderPedidos();
        }
    };
    document.getElementById('btnSiguiente').onclick = () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            renderPedidos();
        }
    };
    const selectPagina = document.getElementById('selectPagina');
    if (selectPagina) {
        selectPagina.addEventListener('change', function() {
            paginaActual = parseInt(this.value, 10);
            renderPedidos();
        });
    }
}

function renderPedidos() {
    if (!Array.isArray(todosLosPedidos) || todosLosPedidos.length === 0) {
        tarjetasPedidos.innerHTML = '<div class="alert alert-info w-100">No hay pedidos para mostrar.</div>';
        renderPaginador();
        return;
    }
    totalPaginas = Math.ceil(todosLosPedidos.length / pedidosPorPagina) || 1;
    const inicio = (paginaActual - 1) * pedidosPorPagina;
    const fin = inicio + pedidosPorPagina;
    const pedidosPagina = todosLosPedidos.slice(inicio, fin);
    tarjetasPedidos.innerHTML = pedidosPagina.map((pedido, idx) => crearTarjetaPedido(pedido, idx)).join('');
    // Limpia clases de animación innecesarias
    setTimeout(() => {
      document.querySelectorAll('.pedido-card').forEach(card => {
        card.classList.remove('fade-out', 'pulse', 'hover-simple', 'animate__animated', 'animate__fadeInUp');
        card.style.opacity = '';
        card.style.transform = '';
      });
    }, 10);
    renderPaginador();
}

function actualizarUltimaActualizacion() {
  const el = document.getElementById('ultimaActualizacion');
  if (el) {
    const ahora = new Date();
    el.textContent = `Última actualización: ${ahora.toLocaleString()}`;
  }
}

async function cargarPedidos() {
    // Guardar posición de scroll antes de actualizar
    const scrollY = window.scrollY;
    // Animación de fade suave
    tarjetasPedidos.classList.add('fade-soft');
    setTimeout(() => { tarjetasPedidos.classList.remove('fade-soft'); }, 400);
    tarjetasPedidos.innerHTML = '<div class="text-center w-100 py-5"><div class="spinner-border" role="status"></div></div>';
    try {
        const res = await axios.get(`${API_URL}`);
        let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
        let pedidos = (res.data.pedidos || res.data);
        if (filtroHoyActivo) {
            const ahora = new Date();
            const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 1, 0, 0, 0); // 1:00 AM hoy
            pedidos = pedidos.filter(p => {
                if (!p.fecha) return false;
                const fechaPedido = new Date(p.fecha);
                return fechaPedido >= inicioDia && fechaPedido <= ahora;
            });
        }
        // Generar ids únicos para todos los pedidos
        todosLosPedidos = pedidos.filter((p) => {
            const idUnico = getPedidoIdUnico(p);
            return !completados.includes(idUnico);
        });
        // Detectar nuevos pedidos
        const idsActuales = todosLosPedidos.map((p) => getPedidoIdUnico(p));
        const nuevos = idsActuales.filter(id => !ultimosIdsPedidos.includes(id));
        // Solo sonar si el usuario habilitó el sonido
        const sonidoHabilitado = localStorage.getItem('sonidoHabilitadoPedidos') === 'true';
        if (ultimosIdsPedidos.length > 0 && nuevos.length > 0 && sonidoHabilitado) {
            try {
                alertaAudio.currentTime = 0;
                alertaAudio.play();
            } catch (e) {
                // Si el navegador bloquea el sonido, ignorar
            }
        }
        ultimosIdsPedidos = idsActuales;
        // Si la página actual es mayor al total de páginas, volver a la última
        totalPaginas = Math.ceil(todosLosPedidos.length / pedidosPorPagina) || 1;
        if (paginaActual > totalPaginas) {
            paginaActual = totalPaginas;
        }
        renderPedidos();
        actualizarUltimaActualizacion();
        // Restaurar posición de scroll después de renderizar
        window.scrollTo({ top: scrollY, behavior: 'auto' });
    } catch (err) {
        tarjetasPedidos.innerHTML = '<div class="alert alert-danger w-100">Error al cargar pedidos.</div>';
        renderPaginador();
        actualizarUltimaActualizacion();
    }
}

window.marcarPedidoCompletado = function(facturaId) {
    const card = document.getElementById(`pedido-${facturaId}`);
    if (card) {
        const innerCard = card.querySelector('.pedido-card');
        if (innerCard) {
            // Elimina animaciones previas antes de fade-out
            innerCard.classList.remove('pulse');
            void innerCard.offsetWidth;
            innerCard.classList.add('fade-out');
        }
        setTimeout(() => {
            card.remove();
            // Guardar el ID como completado en localStorage
            let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
            if (!completados.includes(facturaId)) {
                completados.push(facturaId);
                localStorage.setItem('pedidosCompletados', JSON.stringify(completados));
            }
            cargarPedidos();
        }, 600);
    }
};

// Animación sencilla al pasar el mouse sobre la tarjeta
function addCardHoverAnimation() {
  tarjetasPedidos.addEventListener('mouseover', function(e) {
    if (e.target.classList.contains('pedido-card')) {
      e.target.classList.add('hover-simple');
    }
  });
  tarjetasPedidos.addEventListener('mouseout', function(e) {
    if (e.target.classList.contains('pedido-card')) {
      e.target.classList.remove('hover-simple');
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // Restaurar el estado del filtro desde localStorage
  const filtroHoySwitch = document.getElementById('ajustesFiltroHoy');
  const filtroHoyGuardado = localStorage.getItem('filtroHoyActivo');
  if (filtroHoySwitch) {
    if (filtroHoyGuardado !== null) {
      filtroHoyActivo = filtroHoyGuardado === 'true';
      filtroHoySwitch.checked = filtroHoyActivo;
    } else {
      filtroHoyActivo = true;
      filtroHoySwitch.checked = true;
      localStorage.setItem('filtroHoyActivo', 'true');
    }
    filtroHoySwitch.addEventListener('change', function() {
      filtroHoyActivo = filtroHoySwitch.checked;
      localStorage.setItem('filtroHoyActivo', filtroHoyActivo);
      paginaActual = 1;
      cargarPedidos();
    });
  }

  // --- LIMPIEZA AUTOMÁTICA DE LOCALSTORAGE SIEMPRE ACTIVA ---
  const notificacionLimpieza = document.getElementById('limpiezaNotificacion');
  const LIMPIAR_FECHA_KEY = 'ultimaLimpiezaLocalStorage';

  function limpiarLocalStoragePedidos(automatico = true) {
    // Borra claves relacionadas a pedidos completados y filtros
    localStorage.removeItem('pedidosCompletados');
    localStorage.removeItem('completedOrders');
    localStorage.removeItem('filtroHoyActivo');
    localStorage.setItem(LIMPIAR_FECHA_KEY, new Date().toISOString().slice(0,10));
    if (notificacionLimpieza) {
      notificacionLimpieza.textContent = automatico ? 'Memoria limpiada automáticamente para el nuevo día.' : 'Memoria limpiada manualmente.';
      notificacionLimpieza.style.display = '';
      setTimeout(() => { notificacionLimpieza.style.display = 'none'; }, 3000);
    }
  }

  // Al cargar, si es un nuevo día, limpiar (pero nunca el primer día de uso)
  (function() {
    const ultimaLimpieza = localStorage.getItem(LIMPIAR_FECHA_KEY);
    const hoy = new Date().toISOString().slice(0,10);
    if (!ultimaLimpieza) {
      // Primera vez: solo registrar la fecha, NO limpiar
      localStorage.setItem(LIMPIAR_FECHA_KEY, hoy);
    } else if (ultimaLimpieza !== hoy) {
      limpiarLocalStoragePedidos(true);
    }
  })();

  // Programar limpieza diaria a las 12:00 am (siempre activa)
  function programarLimpiezaDiaria() {
    const ahora = new Date();
    const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 5, 0); // 12:00:05 am
    const msHastaManana = manana - ahora;
    setTimeout(() => {
      limpiarLocalStoragePedidos(true);
      programarLimpiezaDiaria();
    }, msHastaManana);
  }
  programarLimpiezaDiaria();

  // El switch queda solo informativo y siempre activado
  const limpiarSwitch = document.getElementById('ajustesLimpiarLocalStorage');
  if (limpiarSwitch) {
    limpiarSwitch.checked = true;
    limpiarSwitch.disabled = true;
    limpiarSwitch.parentElement.classList.add('opacity-50');
    limpiarSwitch.title = 'Esta función está siempre activa para evitar saturación.';
  }
  cargarPedidos();
  addCardHoverAnimation();
  setInterval(() => {
    cargarPedidos();
  }, 8000); // Actualiza cada 8 segundos

  // Asegura que el modal de ajustes se abra correctamente si falla el data-bs-toggle
  const ajustesBtn = document.getElementById('ajustesBtn');
  const ajustesModalEl = document.getElementById('ajustesModal');
  if (ajustesBtn && window.bootstrap && ajustesModalEl) {
    ajustesBtn.addEventListener('click', (e) => {
      const modal = new bootstrap.Modal(ajustesModalEl);
      modal.show();
    });
    // Mueve el foco al botón de ajustes justo antes de ocultar el modal (accesibilidad)
    ajustesModalEl.addEventListener('hide.bs.modal', () => {
      setTimeout(() => ajustesBtn.focus(), 0);
    });
  }
});
