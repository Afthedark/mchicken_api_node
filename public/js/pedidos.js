import { playNewOrderSound, testSound } from './pedidos_sound.js';

// Lógica específica para la vista de pedidos
let currentPage = 1;
let currentFilters = {
    fechaInicio: null,
    fechaFin: null
};

// Variables para el control de pedidos
let lastPedidosData = [];
let isFirstLoad = true;

// Funciones para manejar pedidos
async function fetchPedidos(page, callback) {
    try {
        let url = `/pedidos?page=${page}`;
        // Si el switch está activo, forzar filtro de hoy
        if (typeof getPedidosHoySwitch === 'function' && getPedidosHoySwitch()) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const fechaHoy = `${yyyy}-${mm}-${dd}`;
            url += `&fechaInicio=${fechaHoy}`;
            url += `&fechaFin=${fechaHoy}`;
        } else {
            if (currentFilters.fechaInicio) {
                url += `&fechaInicio=${currentFilters.fechaInicio}`;
            }
            if (currentFilters.fechaFin) {
                url += `&fechaFin=${currentFilters.fechaFin}`;
            }
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Only check for new orders and play sound if we're on the first page
        // and it's not the first load or a page navigation
        if (!isFirstLoad && page === 1) {
            const newPedidosCount = comparePedidos(lastPedidosData, data.pedidos || []);
            console.log(`Nuevos pedidos detectados: ${newPedidosCount}`);
            
            if (newPedidosCount > 0) {
                console.log('¡Nuevos pedidos! Reproduciendo sonido...');
                await playNewOrderSound();
            }
        } else {
            console.log('Primera carga o navegación de página, no reproducir sonido');
            if (isFirstLoad) isFirstLoad = false;
        }
        
        // Only update lastPedidosData when we're on the first page
        if (page === 1) {
            lastPedidosData = data.pedidos || [];
        }

        callback({
            pedidos: data.pedidos,
            totalPages: data.totalPages || 1
        });
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        document.getElementById('pedidosTableBody').innerHTML = 
            `<tr><td colspan="5" class="mensaje-error">${error.message}</td></tr>`;
    }
}

function renderPedidos(pedidos, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    tableBody.innerHTML = '';
    const completedOrders = getCompletedOrders();

    if (!pedidos || !Array.isArray(pedidos)) {
        tableBody.innerHTML = 
            `<tr><td colspan="6" class="mensaje-error">No se encontraron pedidos o formato inválido</td></tr>`;
        return;
    }

    try {
        pedidos.forEach((pedido, index) => {
            // Crear un ID único para el pedido basado en sus propiedades
            const orderId = `${pedido.cliente}-${pedido.producto}-${pedido.fecha}-${index}`;
            
            // Si el pedido está marcado como completado, no lo mostramos
            if (completedOrders.includes(orderId)) {
                return;
            }

            const row = document.createElement('tr');
            const completedButton = document.createElement('button');
            completedButton.className = 'btn-complete';
            completedButton.innerHTML = '<i class="fas fa-check"></i> Completar Pedido';
            completedButton.addEventListener('click', (e) => {
                e.target.closest('tr').style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => markOrderAsCompleted(orderId), 500);
            });

            // Split productos and cantidades if they are concatenated strings
            const productos = pedido.producto ? pedido.producto.split(', ') : ['N/A'];
            const cantidades = pedido.cantidad ? pedido.cantidad.split(', ') : ['N/A'];
            
            // Create a formatted list of productos with their cantidades
            const productList = productos.map((prod, i) => {
                const cant = cantidades[i] ? parseInt(parseFloat(cantidades[i])) : 'N/A';
                return `
                    <div class="product-item">
                        <span class="product-name">${prod}</span>
                        <span class="product-quantity">${cant}</span>
                    </div>`;
            }).join('');

            const orderDate = pedido.fecha ? new Date(pedido.fecha) : null;
            const timeAgo = orderDate ? getTimeAgo(orderDate) : 'N/A';
            const formattedDate = orderDate ? orderDate.toLocaleString() : 'N/A';

            row.innerHTML = `
                <td>
                    <span class="order-number">#${index + 1}</span>
                </td>
                <td>
                    <div class="customer-info">
                        <i class="fas fa-user-circle"></i>
                        <span>${pedido.cliente || 'N/A'}</span>
                    </div>
                </td>                <td>
                    <div class="products-container">
                        ${productList}
                    </div>
                </td>
                <td>
                    <div class="type-pedido-container">
                        <span class="${pedido.llevar === '1' ? 'tipo-llevar' : 'tipo-mesa'}">${pedido.llevar === '1' ? 'Para Llevar' : 'Para la mesa'}</span>
                    </div>
                </td>
                <td>
                    <div class="observation-container">
                        ${pedido.observaciones ? `<div class="observation-text" title="${pedido.observaciones}">${pedido.observaciones}</div>` : '<span class="no-observation">Sin observaciones</span>'}
                    </div>
                </td>
                <td>
                    <div class="date-info" title="${formattedDate}">
                        <i class="far fa-clock"></i>
                        <span>${timeAgo}</span>
                    </div>
                </td>
            `;
            
            const actionCell = document.createElement('td');
            actionCell.appendChild(completedButton);
            row.appendChild(actionCell);
            tableBody.appendChild(row);
        });

        // Si no hay pedidos visibles después de filtrar los completados
        if (tableBody.children.length === 0) {
            tableBody.innerHTML = 
                `<tr><td colspan="6" class="mensaje-centrado">No hay pedidos pendientes</td></tr>`;
        }
    } catch (error) {
        console.error('Error al renderizar pedidos:', error);
        tableBody.innerHTML = 
            `<tr><td colspan="6" class="mensaje-error">Error al mostrar los pedidos</td></tr>`;
    }
}

function updatePageInfo(currentPage, totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    const pageNumberSelect = document.getElementById('pageNumberSelect');
    if (pageInfo) {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
    if (pageNumberSelect) {
        pageNumberSelect.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            if (i === currentPage) option.selected = true;
            pageNumberSelect.appendChild(option);
        }
    }
}

function updateLastUpdated() {
    const lastUpdated = document.getElementById('ultimoActualizado');
    if (lastUpdated) {
        lastUpdated.textContent = `Última actualización: ${new Date().toLocaleString()}`;
    }
}

// Función para inicializar los event listeners
function initializeEventListeners() {
    // Agregar el evento para el botón de prueba de sonido
    document.getElementById('testSoundBtn').addEventListener('click', async () => {
        console.log('Probando sonido...');
        await testSound();
    });

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPedidos();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const pageNumberSelect = document.getElementById('pageNumberSelect');
        if (currentPage < parseInt(pageNumberSelect.options[pageNumberSelect.options.length-1].value)) {
            currentPage++;
            loadPedidos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById('pageNumberSelect').addEventListener('change', (e) => {
        const selectedPage = parseInt(e.target.value);
        if (!isNaN(selectedPage)) {
            currentPage = selectedPage;
            loadPedidos();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById('filtrarFechas').addEventListener('click', () => {
        currentFilters.fechaInicio = document.getElementById('fechaInicio').value;
        currentFilters.fechaFin = document.getElementById('fechaFin').value;
        currentPage = 1; // Resetear a la primera página al filtrar
        loadPedidos();
    });

    document.getElementById('limpiarFiltros').addEventListener('click', () => {
        document.getElementById('fechaInicio').value = '';
        document.getElementById('fechaFin').value = '';
        currentFilters.fechaInicio = null;
        currentFilters.fechaFin = null;
        currentPage = 1; // Resetear a la primera página al limpiar filtros
        loadPedidos();
    });

    // Validar que la fecha fin no sea menor que la fecha inicio
    document.getElementById('fechaFin').addEventListener('change', function() {
        const fechaInicio = document.getElementById('fechaInicio').value;
        if (fechaInicio && this.value < fechaInicio) {
            alert('La fecha final no puede ser menor que la fecha inicial');
            this.value = fechaInicio;
        }
    });
}

// Función principal para cargar pedidos
function loadPedidos() {
    document.getElementById('pedidosTableBody').innerHTML = 
        `<tr><td colspan="6" class="mensaje-centrado">Cargando pedidos...</td></tr>`;
    
    fetchPedidos(currentPage, (data) => {
        renderPedidos(data.pedidos, 'pedidosTableBody');
        updatePageInfo(currentPage, data.totalPages);
        updateLastUpdated();
        
        // Deshabilitar botones si es necesario
        document.getElementById('prevPage').disabled = currentPage <= 1;
        document.getElementById('nextPage').disabled = currentPage >= data.totalPages;
    });
}

// Función para obtener pedidos completados del localStorage
function getCompletedOrders() {
    const completed = localStorage.getItem('completedOrders');
    return completed ? JSON.parse(completed) : [];
}

// Función para marcar un pedido como completado
function markOrderAsCompleted(orderId) {
    const completed = getCompletedOrders();
    if (!completed.includes(orderId)) {
        completed.push(orderId);
        localStorage.setItem('completedOrders', JSON.stringify(completed));
    }
    loadPedidos(); // Recargar la lista de pedidos
}

// Función para formatear el tiempo transcurrido
function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInSeconds < 60) {
        return 'Hace un momento';
    } else if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
        return `Hace ${diffInHours}h`;
    } else {
        return date.toLocaleDateString();
    }
}

function comparePedidos(oldPedidos, newPedidos) {
    const oldIds = oldPedidos.map(p => `${p.cliente}-${p.producto}-${p.fecha}`);
    const newIds = newPedidos.map(p => `${p.cliente}-${p.producto}-${p.fecha}`);
    
    // Encontrar pedidos que están en newIds pero no en oldIds
    return newIds.filter(id => !oldIds.includes(id)).length;
}

// Configuración modal y contraseña + switch de pedidos de hoy
const configBtn = document.getElementById('configBtn');
const configModal = new bootstrap.Modal(document.getElementById('configModal'));
const configPasswordSection = document.getElementById('configPasswordSection');
const configContent = document.getElementById('configContent');
const configPasswordInput = document.getElementById('configPassword');
const configPasswordBtn = document.getElementById('configPasswordBtn');
const configPasswordError = document.getElementById('configPasswordError');
const switchPedidosHoy = document.getElementById('switchPedidosHoy');

function getPedidosHoySwitch() {
    // Por defecto, si no existe el valor en localStorage, el switch está activado (true)
    const val = localStorage.getItem('soloPedidosHoy');
    return val === null ? true : val === 'true';
}
function setPedidosHoySwitch(val) {
    localStorage.setItem('soloPedidosHoy', val ? 'true' : 'false');
}

if (configBtn) {
    configBtn.addEventListener('click', () => {
        configPasswordSection.style.display = '';
        configContent.style.display = 'none';
        configPasswordInput.value = '';
        configPasswordError.style.display = 'none';
        configModal.show();
        // Actualizar el estado del switch al abrir el modal
        setTimeout(() => {
            if (switchPedidosHoy) {
                switchPedidosHoy.checked = getPedidosHoySwitch();
            }
        }, 200);
    });
}

if (configPasswordBtn) {
    configPasswordBtn.addEventListener('click', () => {
        if (configPasswordInput.value === 'dev123++') {
            configPasswordSection.style.display = 'none';
            configContent.style.display = '';
            configPasswordError.style.display = 'none';
            if (switchPedidosHoy) {
                switchPedidosHoy.checked = getPedidosHoySwitch();
            }
        } else {
            configPasswordError.style.display = '';
        }
    });
    configPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') configPasswordBtn.click();
    });
}

if (switchPedidosHoy) {
    switchPedidosHoy.addEventListener('change', (e) => {
        setPedidosHoySwitch(e.target.checked);
        loadPedidos();
    });
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    loadPedidos(); // Cargar los pedidos iniciales primero
    initializeEventListeners(); // Inicializar los event listeners después
    
    // Configurar actualización automática cada 30 segundos
    setInterval(() => {
        loadPedidos();
    }, 5000);
});