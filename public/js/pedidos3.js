// pedidos2.js
// Este script carga los pedidos desde la API y los muestra como tarjetas usando Bootstrap

let API_URL = '/pedidos'; // Se ajusta dinámicamente según el filtro
const tarjetasPedidos = document.getElementById('tarjetasPedidos');
const refreshBtn = document.getElementById('refreshBtn');

let todosLosPedidos = [];
let paginaActual = 1;
const pedidosPorPagina = 24; // Actualizado a múltiplo de 6 para cuadrícula perfecta
let totalPaginas = 1;
let filtroHoyActivo = true;
let esCargaInicial = true;
let filtrosProductos = [];

// Función para cargar los filtros desde el backend
async function cargarFiltros() {
    try {
        const res = await axios.get('/ajustes/filtros');
        if (Array.isArray(res.data)) {
            filtrosProductos = res.data.map(f => f.toLowerCase().trim());
            const textarea = document.getElementById('filtroProductosTextarea');
            if (textarea) {
                textarea.value = res.data.join('\n');
            }
        }
    } catch (err) {
        console.error('Error al cargar filtros:', err);
    }
}

function filtrarPedidoPorProductos(pedido) {
    if (filtrosProductos.length === 0) return null; // Si la lista está vacía, no mostrar nada
    
    let productos = (pedido.producto || '').split(',');
    let cantidades = (pedido.cantidad || '').split(',');
    let obsPorProducto = (pedido.observaciones_por_pedido || '').split(' | ');

    let productosFiltrados = [];
    let cantidadesFiltradas = [];
    let obsFiltradas = [];

    for (let i = 0; i < productos.length; i++) {
        let prodName = productos[i] ? productos[i].trim() : '';
        let prodNameLower = prodName.toLowerCase();
        
        let coincidencia = filtrosProductos.some(filtro => prodNameLower.includes(filtro) || prodNameLower === filtro);
        
        if (coincidencia) {
            productosFiltrados.push(productos[i]);
            cantidadesFiltradas.push(cantidades[i]);
            if (obsPorProducto[i] !== undefined) {
                obsFiltradas.push(obsPorProducto[i]);
            }
        }
    }

    if (productosFiltrados.length === 0) return null;

    let pedidoFiltrado = { ...pedido };
    pedidoFiltrado.producto = productosFiltrados.join(',');
    pedidoFiltrado.cantidad = cantidadesFiltradas.join(',');
    if(obsPorProducto.length > 0) {
        pedidoFiltrado.observaciones_por_pedido = obsFiltradas.join(' | ');
    }
    
    return pedidoFiltrado;
}

// Agregar el CSS personalizado de pedidos2.css
const head = document.head || document.getElementsByTagName('head')[0];
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = '/css/pedidos2.css';
head.appendChild(link);

// Sonido de alerta para nuevos pedidos
// Usar el <audio> global si existe, si no, crear uno
// Sonidos para nuevos pedidos (selección aleatoria)
const SONIDOS_PEDIDOS = [
    '/assets/sounds/pedidos/pedido1.mp3',
    '/assets/sounds/pedidos/pedido2.mp3',
    '/assets/sounds/pedidos/pedido3.mp3'
];
function reproducirSonidoPedido() {
    const idx = Math.floor(Math.random() * SONIDOS_PEDIDOS.length);
    const ids = ['alertaAudioP1', 'alertaAudioP2', 'alertaAudioP3'];
    const audio = document.getElementById(ids[idx]);
    if (audio) {
        audio.currentTime = 0;
        return audio.play().catch(() => {});
    }
    // Fallback si el elemento no existe en el DOM
    const fallback = new Audio(SONIDOS_PEDIDOS[idx]);
    return fallback.play().catch(() => {});
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
    // Unificar productos y cantidades en formato jerárquico
    let productos = (pedido.producto || '').split(',');
    let cantidades = (pedido.cantidad || '').split(',');
    let observacionesPorProducto = (pedido.observaciones_por_pedido || '').split(' | ');
    if (!Array.isArray(productos)) productos = [];
    if (!Array.isArray(cantidades)) cantidades = [];
    if (!Array.isArray(observacionesPorProducto)) observacionesPorProducto = [];

    let productosHtml = '<div class="productos-container">';
    let hayProductosValidos = false;

    for (let i = 0; i < productos.length; i++) {
        const prod = productos[i] ? productos[i].trim().toUpperCase() : '';
        let cant = cantidades[i] ? cantidades[i].trim() : '';
        if (cant && !isNaN(cant)) {
            cant = parseInt(cant);
        }
        // Observación por producto (si existe)
        let obsProd = observacionesPorProducto[i] ? observacionesPorProducto[i].trim().toLowerCase() : '';
        // Si hay al menos un nombre o cantidad válida, procedemos
        if (prod || cant) {
            hayProductosValidos = true;
            productosHtml += `
                <div class="producto-item-modern">
                    <div class="producto-cantidad-modern">${cant}</div>
                    <div class="producto-detalle">
                        <div class="producto-nombre-modern">${prod}</div>
                        ${obsProd ? `<div class="producto-observacion">${obsProd.charAt(0).toUpperCase() + obsProd.slice(1)}</div>` : ''}
                    </div>
                </div>`;
        }
    }

    // Fallback visual contundente si la orden vino vacía o corrupta desde el POS
    if (!hayProductosValidos) {
        productosHtml += `
            <div class="producto-item-modern justify-content-center text-center p-3" style="background: transparent; border: 2px dashed #ffcdd2; color: #d32f2f;">
                <div>
                    <div class="fw-bold" style="font-size: 0.95rem;">
                        <i class="fas fa-exclamation-triangle me-1"></i> SIN PRODUCTOS REGISTRADOS
                    </div>
                    <div style="font-size: 0.75rem; color: #e57373;">(Orden enviada vacía desde caja)</div>
                </div>
            </div>`;
    }

    productosHtml += '</div>';
    // Detectar tipo de pedido y asignar color de encabezado
    let headerClass = ''; // Default (naranja/primary)
    let tipoPedidoTexto = '-';
    let tipoPedidoClass = '';

    // Normalizar observación general para búsqueda
    let obsGeneral = (pedido['observacion general'] || '').trim();
    let obsGeneralLower = obsGeneral.toLowerCase();

    // Lógica de detección por palabras clave
    if (obsGeneralLower.includes('callcenter')) {
        headerClass = 'header-amarillo';
        tipoPedidoTexto = 'CALL CENTER';
        tipoPedidoClass = 'tipo-pedido-llevar'; // Reutilizamos estilo de texto
    } else if (obsGeneralLower.includes('autopollo')) {
        headerClass = 'header-celeste';
        tipoPedidoTexto = 'AUTOPOLLO';
        tipoPedidoClass = 'tipo-pedido-llevar';
    } else {
        // Si no es especial, usar lógica estándar (Mesa o Llevar) -> VERDE
        headerClass = 'header-verde';

        // Lógica original para determinar texto
        let primerLlevar = (pedido.llevar !== undefined && pedido.llevar !== null) ? pedido.llevar.toString().split(',')[0]?.trim() : '';
        if (primerLlevar === '1') {
            tipoPedidoTexto = 'PARA LLEVAR';
            tipoPedidoClass = 'tipo-pedido-llevar';
        } else if (primerLlevar === '0') {
            tipoPedidoTexto = 'PARA MESA';
            tipoPedidoClass = 'tipo-pedido-mesa';
        } else if (primerLlevar) {
            tipoPedidoTexto = primerLlevar.toUpperCase();
        }
    }

    // Detectar atraso (> 10 minutos)
    let claseAtraso = '';
    if (pedido.fecha) {
        const ahora = new Date();
        const fechaPedido = new Date(pedido.fecha);
        const diffMs = ahora - fechaPedido;
        const diffMin = Math.floor(diffMs / 1000 / 60);

        if (diffMin > 10) {
            claseAtraso = 'alerta-atraso';
        }
    }

    // Mostrar observaciones en mayúsculas o 'SIN OBSERVACIONES' si está vacío
    let obs = obsGeneral ? obsGeneral.toUpperCase() : 'SIN OBSERVACIONES';

    // Formatear Fecha y Hora exacta
    let fechaFormateada = 'FECHA DESCONOCIDA';
    if (pedido.fecha) {
        const d = new Date(pedido.fecha);
        // Formato ej: 14/10/2026 - 15:30
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();
        const horas = String(d.getHours()).padStart(2, '0');
        const minutos = String(d.getMinutes()).padStart(2, '0');
        fechaFormateada = `${dia}/${mes}/${anio} - ${horas}:${minutos}`;
    }

    let pedidoIdUnico = getPedidoIdUnico(pedido);
    // Si el filtro de hoy está activo, usar idx+1 como contador visible, si no mostrar el ID real
    let contador = filtroHoyActivo ? (idx + 1) : (pedido["Factura ID"] || '').toString().toUpperCase();
    // Elimina clases de animación previas si existen (para evitar conflictos)
    return `
    <div class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" id="pedido-${pedidoIdUnico}">
        <div class="pedido-card ${claseAtraso}">
            <div class="pedido-header ${headerClass}">
                #${contador}
            </div>
            
            <div class="cliente-header-section">
                <h5 class="cliente-nombre">
                    <i class="fas fa-user-circle"></i> ${(pedido.cliente || 'SIN NOMBRE').toUpperCase()}
                </h5>
            </div>

            <div class="pedido-body-content">
                ${productosHtml}

                <div class="tipo-pedido-badge">
                    <i class="fas fa-shopping-bag"></i> ${tipoPedidoTexto}
                </div>
                
                ${obsGeneral ? `
                <div class="obs-general-box">
                    <div class="obs-general-title">
                        <i class="fas fa-comment-alt"></i> OBSERVACIÓN GENERAL
                    </div>
                    <p class="obs-general-text">${obs}</p>
                </div>
                ` : ''}
                
                <button class="btn-completar-modern" onclick="marcarPedidoCompletado('${pedidoIdUnico}')">
                    <i class="fas fa-check"></i> COMPLETADO
                </button>

                <div class="text-center mt-3 text-muted" style="font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px;">
                    <i class="far fa-clock"></i> ${fechaFormateada}
                </div>
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
                    <select id="selectPagina" class="form-select form-select-sm mx-2 paginador-select-inline">
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
        selectPagina.addEventListener('change', function () {
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

    // --- Renderizado eficiente: solo actualiza el DOM si hay cambios ---
    // Obtener los IDs actuales en el DOM
    const domIds = Array.from(document.querySelectorAll('[id^="pedido-"]')).map(el => el.id.replace('pedido-', ''));
    const nuevosIds = pedidosPagina.map(p => getPedidoIdUnico(p));

    // Eliminar tarjetas que ya no están
    domIds.forEach(id => {
        if (!nuevosIds.includes(id)) {
            const card = document.getElementById(`pedido-${id}`);
            if (card) card.remove();
        }
    });

    // Agregar o actualizar tarjetas
    pedidosPagina.forEach((pedido, idx) => {
        const id = getPedidoIdUnico(pedido);
        let card = document.getElementById(`pedido-${id}`);
        const cardHtml = crearTarjetaPedido(pedido, idx);
        if (!card) {
            // Nueva tarjeta, agregarla
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHtml;
            tarjetasPedidos.appendChild(tempDiv.firstElementChild);
        } else {
            // Si el contenido cambió, actualizarlo
            if (card.outerHTML !== cardHtml) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cardHtml;
                tarjetasPedidos.replaceChild(tempDiv.firstElementChild, card);
            }
        }
    });

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
        // Selecciona el endpoint según el filtro
        API_URL = filtroHoyActivo ? '/pedidos/hoy' : '/pedidos';
        const res = await axios.get(`${API_URL}`);
        let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
        let pedidos = (res.data.pedidos || res.data);
        // Ya no es necesario filtrar por fecha aquí, el backend lo hace
        // Generar ids únicos para todos los pedidos
        todosLosPedidos = pedidos.map(filtrarPedidoPorProductos)
            .filter(p => p !== null)
            .filter((p) => {
                const idUnico = getPedidoIdUnico(p);
                return !completados.includes(idUnico);
            });
        // Detectar nuevos pedidos
        const idsActuales = todosLosPedidos.map((p) => getPedidoIdUnico(p));
        const nuevos = idsActuales.filter(id => !ultimosIdsPedidos.includes(id));
        // Solo sonar si el usuario habilitó el sonido y no es la carga inicial
        const sonidoHabilitado = localStorage.getItem('sonidoHabilitadoPedidos') === 'true';
        if (!esCargaInicial && nuevos.length > 0 && sonidoHabilitado) {
            reproducirSonidoPedido();
        }
        ultimosIdsPedidos = idsActuales;
        // Después de la primera carga, ya no es la carga inicial
        if (esCargaInicial) {
            esCargaInicial = false;
        }
        // Actualizar total de páginas
        totalPaginas = Math.ceil(todosLosPedidos.length / pedidosPorPagina) || 1;

        // Manejar navegación automática de páginas
        if (paginaActual > totalPaginas) {
            // Si la página actual es mayor al total, ir a la última página
            paginaActual = totalPaginas;
        } else {
            // Verificar si la página actual tiene pedidos después del filtrado
            const inicio = (paginaActual - 1) * pedidosPorPagina;
            const fin = inicio + pedidosPorPagina;
            const pedidosPaginaActual = todosLosPedidos.slice(inicio, fin);

            // Si la página actual quedó vacía pero hay más páginas disponibles
            if (pedidosPaginaActual.length === 0 && totalPaginas > 0) {
                // Ir a la primera página que tenga contenido
                paginaActual = 1;
            }
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

async function cargarPedidosIncremental() {
    try {
        // Selecciona el endpoint según el filtro
        API_URL = filtroHoyActivo ? '/pedidos/hoy' : '/pedidos';
        const res = await axios.get(`${API_URL}`);
        let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
        let pedidos = (res.data.pedidos || res.data);

        // Generar ids únicos para todos los pedidos
        const nuevosPedidos = pedidos.map(filtrarPedidoPorProductos)
            .filter(p => p !== null)
            .filter((p) => {
                const idUnico = getPedidoIdUnico(p);
                return !completados.includes(idUnico);
            });

        // Detectar cambios
        const nuevosIds = nuevosPedidos.map((p) => getPedidoIdUnico(p));
        const idsActuales = todosLosPedidos.map((p) => getPedidoIdUnico(p));

        // Detectar nuevos pedidos
        const pedidosNuevos = nuevosPedidos.filter(p => !idsActuales.includes(getPedidoIdUnico(p)));

        // --- SONIDO: Solo si el usuario lo activó y hay nuevos pedidos ---
        const sonidoHabilitado = localStorage.getItem('sonidoHabilitadoPedidos') === 'true';
        if (pedidosNuevos.length > 0 && sonidoHabilitado) {
            reproducirSonidoPedido();
        }

        // Detectar pedidos eliminados
        const pedidosEliminados = todosLosPedidos.filter(p => !nuevosIds.includes(getPedidoIdUnico(p)));

        // Actualizar el estado local
        todosLosPedidos = nuevosPedidos;

        // Actualizar el DOM de manera incremental
        pedidosEliminados.forEach(p => {
            const id = getPedidoIdUnico(p);
            const card = document.getElementById(`pedido-${id}`);
            if (card) card.remove();
        });

        pedidosNuevos.forEach((pedido, idx) => {
            const id = getPedidoIdUnico(pedido);
            const cardHtml = crearTarjetaPedido(pedido, idx);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cardHtml;
            const newCard = tempDiv.firstElementChild;
            newCard.classList.add('animate__animated', 'animate__fadeInUp');
            tarjetasPedidos.appendChild(newCard);
        });

        // Actualizar páginas y manejar navegación automática
        totalPaginas = Math.ceil(todosLosPedidos.length / pedidosPorPagina) || 1;

        // Verificar si la página actual quedó sin pedidos
        const pedidosEnPaginaActual = document.querySelectorAll('[id^="pedido-"]').length;
        let necesitaRenderizado = false;

        if (pedidosEnPaginaActual === 0 && totalPaginas > 0) {
            // Si la página actual quedó vacía, manejar navegación
            if (paginaActual <= totalPaginas) {
                // La página actual aún es válida, solo renderizar
                necesitaRenderizado = true;
            } else if (paginaActual > 1) {
                // Ir a la página anterior
                paginaActual--;
                necesitaRenderizado = true;
            } else {
                // Ir a la primera página
                paginaActual = 1;
                necesitaRenderizado = true;
            }
        } else if (paginaActual > totalPaginas) {
            // Si la página actual es mayor al total, ajustar
            paginaActual = totalPaginas;
            necesitaRenderizado = true;
        }

        if (necesitaRenderizado) {
            renderPedidos();
        } else {
            renderPaginador();
        }

        actualizarUltimaActualizacion();
    } catch (err) {
        console.error('Error al cargar pedidos:', err);
    }
}

window.marcarPedidoCompletado = function (facturaId) {
    const card = document.getElementById(`pedido-${facturaId}`);
    if (card) {
        // Primero actualizamos el estado local y localStorage
        let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
        if (!completados.includes(facturaId)) {
            completados.push(facturaId);
            localStorage.setItem('pedidosCompletados', JSON.stringify(completados));

            // También actualizamos el array local de pedidos
            todosLosPedidos = todosLosPedidos.filter(p => getPedidoIdUnico(p) !== facturaId);
        }

        // Animar y quitar la tarjeta
        const innerCard = card.querySelector('.pedido-card');
        if (innerCard) {
            innerCard.classList.remove('pulse');
            void innerCard.offsetWidth;
            innerCard.classList.add('fade-out');
        }

        setTimeout(() => {
            card.remove();

            // Recalcular total de páginas
            totalPaginas = Math.ceil(todosLosPedidos.length / pedidosPorPagina) || 1;

            // Verificar cuántos pedidos quedan en la página actual
            const pedidosEnPaginaActual = document.querySelectorAll('[id^="pedido-"]').length;

            // Si la página actual quedó vacía
            if (pedidosEnPaginaActual === 0) {
                // Si hay más páginas después de la actual, avanzar a la siguiente
                if (paginaActual < totalPaginas) {
                    // No cambiar la página actual, solo renderizar (la página siguiente se convierte en la actual)
                    renderPedidos();
                }
                // Si no hay más páginas después, ir a la página anterior
                else if (paginaActual > 1) {
                    paginaActual--;
                    renderPedidos();
                }
                // Si es la única página y quedó vacía, solo actualizar el paginador
                else {
                    renderPedidos();
                }
            } else {
                // Si aún hay pedidos en la página, solo actualizar el paginador
                renderPaginador();
            }
        }, 600);
    }
};

// Animación sencilla al pasar el mouse sobre la tarjeta
function addCardHoverAnimation() {
    tarjetasPedidos.addEventListener('mouseover', function (e) {
        if (e.target.classList.contains('pedido-card')) {
            e.target.classList.add('hover-simple');
        }
    });
    tarjetasPedidos.addEventListener('mouseout', function (e) {
        if (e.target.classList.contains('pedido-card')) {
            e.target.classList.remove('hover-simple');
        }
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    // Cargar filtros antes de la primera carga de pedidos
    await cargarFiltros();
    
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
        filtroHoySwitch.addEventListener('change', function () {
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
        localStorage.setItem(LIMPIAR_FECHA_KEY, new Date().toISOString().slice(0, 10));
        if (notificacionLimpieza) {
            notificacionLimpieza.textContent = automatico ? 'Memoria limpiada automáticamente para el nuevo día.' : 'Memoria limpiada manualmente.';
            notificacionLimpieza.style.display = '';
            setTimeout(() => { notificacionLimpieza.style.display = 'none'; }, 3000);
        }
    }

    // Al cargar, si es un nuevo día, limpiar (pero nunca el primer día de uso)
    (function () {
        const ultimaLimpieza = localStorage.getItem(LIMPIAR_FECHA_KEY);
        const hoy = new Date().toISOString().slice(0, 10);
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

    // Configuración para guardar filtros admin
    const guardarBtn = document.getElementById('guardarFiltrosBtn');
    if (guardarBtn) {
        guardarBtn.addEventListener('click', async () => {
            const textarea = document.getElementById('filtroProductosTextarea');
            const msg = document.getElementById('guardarFiltrosMsg');
            if (!textarea) return;
            
            const lineas = textarea.value.split('\n')
                                         .map(l => l.trim())
                                         .filter(l => l.length > 0);
            
            try {
                guardarBtn.disabled = true;
                guardarBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
                
                const res = await axios.post('/ajustes/filtros', { filtros: lineas });
                if (res.data.success) {
                    msg.innerHTML = '<i class="fas fa-check-circle"></i> Filtros guardados y aplicados.';
                    msg.className = 'mt-2 text-center text-success';
                    msg.style.display = 'block';
                    filtrosProductos = lineas.map(l => l.toLowerCase());
                    
                    setTimeout(() => { msg.style.display = 'none'; }, 4000);
                    
                    // Forzar recarga completa de pedidos
                    paginaActual = 1;
                    cargarPedidos();
                }
            } catch (err) {
                console.error(err);
                msg.innerHTML = '<i class="fas fa-times-circle"></i> Error al guardar los filtros.';
                msg.className = 'mt-2 text-center text-danger';
                msg.style.display = 'block';
            } finally {
                guardarBtn.disabled = false;
                guardarBtn.innerHTML = '<i class="fas fa-save me-1"></i> Guardar Filtros';
            }
        });
    }
    cargarPedidos();
    addCardHoverAnimation();
    setInterval(() => {
        cargarPedidosIncremental();
    }, 10000); // Actualiza cada 10 segundos

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
