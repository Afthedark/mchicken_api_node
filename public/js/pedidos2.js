// pedidos2.js
// Este script carga los pedidos desde la API y los muestra como tarjetas usando Bootstrap

const API_URL = '/pedidos'; // Ajusta si tu endpoint es diferente
const tarjetasPedidos = document.getElementById('tarjetasPedidos');
const refreshBtn = document.getElementById('refreshBtn');

let todosLosPedidos = [];
let paginaActual = 1;
const pedidosPorPagina = 20;
let totalPaginas = 1;

// Agregar el CSS personalizado de pedidos2.css
const head = document.head || document.getElementsByTagName('head')[0];
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = '/css/pedidos2.css';
head.appendChild(link);

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

function crearTarjetaPedido(pedido) {
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
    return `
    <div class="col-md-6 col-lg-4" id="pedido-${pedido["Factura ID"]}">
        <div class="card pedido-card shadow-sm animate__animated animate__fadeInUp">
            <div class="card-header pedido-header d-flex justify-content-between align-items-center">
                <span><i class="fas fa-hashtag me-1"></i> ${(pedido["Factura ID"] || '').toString().toUpperCase()}</span>
                ${estadoBadge(pedido.estado)}
            </div>
            <div class="card-body">
                <h5 class="card-title mb-3"><i class="fas fa-user me-1"></i> ${(pedido.cliente || 'SIN NOMBRE').toUpperCase()}</h5>
                <div class="mb-2">
                    <span class="badge bg-warning text-dark"><i class="fas fa-hamburger me-1"></i> PRODUCTOS Y CANTIDADES</span>
                    ${tablaProductos}
                </div>
                <div class="mb-2"><span class="badge bg-light text-dark border"><i class="fas fa-box-open me-1"></i> TIPO PEDIDO</span><span class="ps-2 ${tipoPedidoClass}">${tipoPedido}</span></div>
                <div class="mb-2"><span class="badge bg-light text-dark border"><i class="fas fa-comment-alt me-1"></i> OBSERVACIONES</span><br><span class="ps-2 obs-text">${obs}</span></div>
                <button class="btn btn-success mt-3 w-100 shadow-sm fw-semibold" onclick="marcarPedidoCompletado('${pedido["Factura ID"]}')">
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
    paginador.innerHTML = `
        <nav aria-label="Paginador de pedidos">
            <ul class="pagination justify-content-center">
                <li class="page-item${paginaActual === 1 ? ' disabled' : ''}">
                    <button class="page-link" id="btnAnterior">Anterior</button>
                </li>
                <li class="page-item disabled">
                    <span class="page-link">Página ${paginaActual} de ${totalPaginas}</span>
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
    tarjetasPedidos.innerHTML = pedidosPagina.map(crearTarjetaPedido).join('');
    renderPaginador();
}

async function cargarPedidos() {
    // Guardar posición de scroll antes de actualizar
    const scrollY = window.scrollY;
    tarjetasPedidos.innerHTML = '<div class="text-center w-100 py-5"><div class="spinner-border" role="status"></div></div>';
    try {
        const res = await axios.get(`${API_URL}`);
        let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
        todosLosPedidos = (res.data.pedidos || res.data).filter(p => !completados.includes(p["Factura ID"]?.toString()));
        // Si la página actual es mayor al total de páginas, volver a la última
        totalPaginas = Math.ceil(todosLosPedidos.length / pedidosPorPagina) || 1;
        if (paginaActual > totalPaginas) {
            paginaActual = totalPaginas;
        }
        renderPedidos();
        // Restaurar posición de scroll después de renderizar
        window.scrollTo({ top: scrollY, behavior: 'auto' });
    } catch (err) {
        tarjetasPedidos.innerHTML = '<div class="alert alert-danger w-100">Error al cargar pedidos.</div>';
        renderPaginador();
    }
}

window.marcarPedidoCompletado = function(facturaId) {
    const card = document.getElementById(`pedido-${facturaId}`);
    if (card) {
        card.classList.add('fade-out');
        setTimeout(() => {
            card.remove();
            // Guardar el ID como completado en localStorage
            let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
            if (!completados.includes(facturaId)) {
                completados.push(facturaId);
                localStorage.setItem('pedidosCompletados', JSON.stringify(completados));
            }
        }, 500);
    }
};

// Animación pulse en hover usando JS para evitar conflicto con la animación de entrada
function addPulseAnimation() {
  tarjetasPedidos.addEventListener('mouseenter', function(e) {
    const card = e.target.closest('.pedido-card');
    if (card) {
      card.classList.add('pulse');
    }
  }, true);
  tarjetasPedidos.addEventListener('mouseleave', function(e) {
    const card = e.target.closest('.pedido-card');
    if (card) {
      card.classList.remove('pulse');
    }
  }, true);
  tarjetasPedidos.addEventListener('animationend', function(e) {
    if (e.animationName === 'cardPulse') {
      e.target.classList.remove('pulse');
    }
  }, true);
}

window.addEventListener('DOMContentLoaded', () => {
  cargarPedidos();
  addPulseAnimation();
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
