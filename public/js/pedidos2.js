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

// El CSS de pedidos2.css ya está incluido en el HTML principal, no es necesario agregarlo dinámicamente aquí.

// Sonido de alerta para nuevos pedidos
const alertaAudio = new Audio('/assets/sounds/alerta1.mp3');
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
    let tablaProductos = `
      <table class="w-full text-sm text-left border border-gray-300 rounded-lg overflow-hidden">
        <thead>
          <tr>
            <th class="bg-cyan-600 text-white font-bold px-2 py-1 rounded-tl rounded-bl border-b border-gray-300">PRODUCTO</th>
            <th class="bg-cyan-600 text-white font-bold px-2 py-1 rounded-tr rounded-br border-b border-gray-300">CANTIDAD</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (let i = 0; i < productos.length; i++) {
        const prod = productos[i] ? productos[i].trim().toUpperCase() : '';
        let cant = cantidades[i] ? cantidades[i].trim() : '';
        if (cant && !isNaN(cant)) {
            cant = parseInt(cant);
        }
        if (prod || cant) {
            tablaProductos += `
              <tr class="border-b border-gray-200 last:border-b-0">
                <td class="font-semibold text-orange-600 px-2 py-1 border-r border-gray-200">${prod}</td>
                <td class="px-2 py-1"><span class="inline-block bg-orange-500 text-white font-bold rounded-full px-3 py-1">${cant}</span></td>
              </tr>
            `;
        }
    }
    tablaProductos += '</tbody></table>';

    // Mostrar tipo de pedido
    let tipoPedido = '-';
    let tipoPedidoClass = '';
    let primerLlevar = (pedido.llevar || '').split(',')[0]?.trim();
    if (primerLlevar === '1' || primerLlevar === 1) {
        tipoPedido = 'PARA LLEVAR';
        tipoPedidoClass = 'bg-orange-500 text-white rounded px-2 py-1 font-bold ml-2';
    } else if (primerLlevar === '0' || primerLlevar === 0) {
        tipoPedido = 'PARA MESA';
        tipoPedidoClass = 'bg-cyan-600 text-white rounded px-2 py-1 font-bold ml-2';
    } else if (primerLlevar) {
        tipoPedido = primerLlevar.toUpperCase();
        tipoPedidoClass = 'bg-gray-400 text-white rounded px-2 py-1 font-bold ml-2';
    }

    let obs = (pedido.observaciones && pedido.observaciones.trim()) ? pedido.observaciones.toUpperCase() : 'SIN OBSERVACIONES';
    let pedidoIdUnico = getPedidoIdUnico(pedido);
    let contador = filtroHoyActivo ? (idx + 1) : (pedido["Factura ID"] || '').toString().toUpperCase();

    // Estado badge
    function estadoBadgeTW(estado) {
        if (!estado || estado.toLowerCase() === 'concluido') return '';
        switch (estado) {
            case 'pendiente':
                return '<span class="inline-block bg-yellow-300 text-yellow-900 font-bold rounded px-2 py-1">Pendiente</span>';
            case 'preparando':
                return '<span class="inline-block bg-cyan-200 text-cyan-900 font-bold rounded px-2 py-1">Preparando</span>';
            case 'listo':
                return '<span class="inline-block bg-green-400 text-white font-bold rounded px-2 py-1">Listo</span>';
            default:
                return `<span class="inline-block bg-gray-400 text-white font-bold rounded px-2 py-1">${estado}</span>`;
        }
    }

    return `
    <div id="pedido-${pedidoIdUnico}" class="pedido-card animate-fade-in-up will-change-transform will-change-opacity">
      <div class="bg-white rounded-xl shadow-lg flex flex-col h-full border-2 border-yellow-100 hover:border-yellow-300 transition-transform transition-shadow duration-300 ease-out hover:scale-[1.025] hover:shadow-2xl">
        <div class="flex items-center justify-between px-4 py-2 bg-orange-100 rounded-t-xl border-b">
          <span class="flex items-center gap-1 text-orange-600 font-bold text-lg"><i class="fas fa-hashtag"></i> ${contador}</span>
          ${estadoBadgeTW(pedido.estado)}
        </div>
        <div class="flex-1 px-4 py-3">
          <h5 class="text-lg font-semibold mb-2 flex items-center gap-2"><i class="fas fa-user text-gray-400"></i> ${(pedido.cliente || 'SIN NOMBRE').toUpperCase()}</h5>
          <div class="mb-2">
            <span class="inline-block bg-yellow-200 text-yellow-900 font-bold rounded px-2 py-1 mb-1"><i class="fas fa-hamburger mr-1"></i> PRODUCTOS Y CANTIDADES</span>
            ${tablaProductos}
          </div>
          <div class="mb-2">
            <span class="inline-block bg-gray-100 text-gray-700 border font-semibold rounded px-2 py-1"><i class="fas fa-box-open mr-1"></i> TIPO PEDIDO</span>
            <span class="${tipoPedidoClass}">${tipoPedido}</span>
          </div>
          <div class="mb-2">
            <span class="inline-block bg-gray-100 text-gray-700 border font-semibold rounded px-2 py-1"><i class="fas fa-comment-alt mr-1"></i> OBSERVACIONES</span><br>
            <span class="inline-block italic text-white bg-red-500 rounded px-2 py-1 mt-1 border border-red-500 animate-pulse-slow">${obs}</span>
          </div>
          <button class="w-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg px-3 py-2 mt-3 flex items-center justify-center gap-2 transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-400 animate-btn-pop" onclick="marcarPedidoCompletado('${pedidoIdUnico}')">
            <i class="fas fa-check-circle"></i> MARCAR PEDIDO COMO COMPLETADO
          </button>
        </div>
        <div class="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-b-xl border-t text-sm text-gray-600">
          <span><i class="far fa-clock mr-1"></i> ${pedido.fecha ? tiempoRelativo(pedido.fecha) : ''}</span>
          ${pedido.estado && pedido.estado.toLowerCase() !== 'concluido' ? `<span class="font-bold">ESTADO: ${pedido.estado.toUpperCase()}</span>` : ''}
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
        <div class="flex flex-wrap items-center justify-center gap-2 bg-yellow-50 border-2 border-yellow-200 rounded-xl px-4 py-3 shadow">
          <button id="btnAnterior" class="px-4 py-2 rounded-lg font-semibold bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition disabled:opacity-50" ${paginaActual === 1 ? 'disabled' : ''}>Anterior</button>
          <span class="text-gray-700 font-medium">Página ${paginaActual} de ${totalPaginas}</span>
          <select id="selectPagina" class="px-3 py-2 rounded-lg border border-yellow-300 bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400" style="width:auto;display:inline-block;">
            ${opcionesPaginas}
          </select>
          <button id="btnSiguiente" class="px-4 py-2 rounded-lg font-semibold bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition disabled:opacity-50" ${paginaActual === totalPaginas ? 'disabled' : ''}>Siguiente</button>
        </div>
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
    // Animación de fade-in-up con stagger
    setTimeout(() => {
      const cards = document.querySelectorAll('.pedido-card');
      cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(40px)';
        setTimeout(() => {
          card.style.transition = 'opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 80 * i);
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

        // Detectar nuevos pedidos (sin filtrar por completados ni por fecha)
        const allIds = (res.data.pedidos || res.data).map(getPedidoIdUnico);
        const nuevos = allIds.filter(id => !ultimosIdsPedidos.includes(id));
        if (ultimosIdsPedidos.length > 0 && nuevos.length > 0) {
            alertaAudio.currentTime = 0;
            alertaAudio.play();
        }
        ultimosIdsPedidos = allIds;

        // Aplicar filtro de fecha si corresponde
        if (filtroHoyActivo) {
            const ahora = new Date();
            const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 1, 0, 0, 0); // 1:00 AM hoy
            pedidos = pedidos.filter(p => {
                if (!p.fecha) return false;
                const fechaPedido = new Date(p.fecha);
                return fechaPedido >= inicioDia && fechaPedido <= ahora;
            });
        }
        // Generar ids únicos para todos los pedidos (filtrados por completados)
        todosLosPedidos = pedidos.filter((p) => {
            const idUnico = getPedidoIdUnico(p);
            return !completados.includes(idUnico);
        });
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
            innerCard.classList.remove('pulse', 'fade-out', 'animate-complete-pop', 'animate-complete-shrink');
            void innerCard.offsetWidth;
            // Secuencia: pop -> shrink -> fade
            innerCard.classList.add('animate-complete-pop');
            setTimeout(() => {
                innerCard.classList.remove('animate-complete-pop');
                innerCard.classList.add('animate-complete-shrink');
                setTimeout(() => {
                    innerCard.classList.remove('animate-complete-shrink');
                    innerCard.classList.add('fade-out');
                    setTimeout(() => {
                        card.remove();
                        // Guardar el ID como completado en localStorage
                        let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
                        if (!completados.includes(facturaId)) {
                            completados.push(facturaId);
                            localStorage.setItem('pedidosCompletados', JSON.stringify(completados));
                        }
                        cargarPedidos();
                    }, 350);
                }, 220);
            }, 120);
        } else {
            // fallback si no hay innerCard
            setTimeout(() => {
                card.remove();
                let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
                if (!completados.includes(facturaId)) {
                    completados.push(facturaId);
                    localStorage.setItem('pedidosCompletados', JSON.stringify(completados));
                }
                cargarPedidos();
            }, 600);
        }
    }
};

// Animación sencilla al pasar el mouse sobre la tarjeta
function addCardHoverAnimation() {
  tarjetasPedidos.addEventListener('mouseover', function(e) {
    const card = e.target.closest('.pedido-card');
    if (card) {
      card.classList.add('animate-pulse-fast');
    }
  });
  tarjetasPedidos.addEventListener('mouseout', function(e) {
    const card = e.target.closest('.pedido-card');
    if (card) {
      card.classList.remove('animate-pulse-fast');
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
