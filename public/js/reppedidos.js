// Lógica específica para la vista de reporte de pedidos
let currentPage = 1;
let currentFilters = {
    fechaInicio: null,
    fechaFin: null
};

// Funciones para manejar pedidos
async function fetchPedidos(page, callback) {
    try {
        let url = `/pedidos?page=${page}`;
        if (currentFilters.fechaInicio) {
            url += `&fechaInicio=${currentFilters.fechaInicio}`;
        }
        if (currentFilters.fechaFin) {
            url += `&fechaFin=${currentFilters.fechaFin}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        callback({
            pedidos: data.pedidos,
            totalPages: data.totalPages || 1
        });
    } catch (error) {
        console.error('Error al obtener los pedidos:', error);
        document.getElementById('pedidosTableBody').innerHTML = 
            `<tr><td colspan="4" class="mensaje-error">${error.message}</td></tr>`;
    }
}

function renderPedidos(pedidos, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    tableBody.innerHTML = '';

    if (!pedidos || !Array.isArray(pedidos)) {
        tableBody.innerHTML = 
            `<tr><td colspan="4" class="mensaje-error">No se encontraron pedidos o formato inválido</td></tr>`;
        return;
    }

    try {
        pedidos.forEach((pedido, index) => {
            const row = document.createElement('tr');

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
            const timeAgo = getTimeAgo(orderDate);
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
                </td>
                <td>
                    <div class="products-container">
                        ${productList}
                    </div>
                </td>
                <td>
                    <div class="date-info" title="${formattedDate}">
                        <i class="far fa-clock"></i>
                        <span>${timeAgo}</span>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Si no hay pedidos
        if (tableBody.children.length === 0) {
            tableBody.innerHTML = 
                `<tr><td colspan="4" class="mensaje-centrado">No hay pedidos</td></tr>`;
        }
    } catch (error) {
        console.error('Error al renderizar pedidos:', error);
        tableBody.innerHTML = 
            `<tr><td colspan="4" class="mensaje-error">Error al mostrar los pedidos</td></tr>`;
    }
}

function updatePageInfo(currentPage, totalPages) {
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
}

function updateLastUpdated() {
    const lastUpdated = document.getElementById('ultimoActualizado');
    if (lastUpdated) {
        lastUpdated.textContent = `Última actualización: ${new Date().toLocaleString()}`;
    }
}

// Función para formatear el tiempo transcurrido
function getTimeAgo(date) {
    if (!date) return 'N/A';
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

// Función para inicializar los event listeners
function initializeEventListeners() {
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPedidos();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        loadPedidos();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Event listeners para los filtros de fecha
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
        `<tr><td colspan="4" class="mensaje-centrado">Cargando pedidos...</td></tr>`;
    
    fetchPedidos(currentPage, (data) => {
        renderPedidos(data.pedidos, 'pedidosTableBody');
        updatePageInfo(currentPage, data.totalPages);
        updateLastUpdated();
        
        // Deshabilitar botones si es necesario
        document.getElementById('prevPage').disabled = currentPage <= 1;
        document.getElementById('nextPage').disabled = currentPage >= data.totalPages;
    });
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    loadPedidos(); // Cargar los pedidos iniciales primero
    initializeEventListeners(); // Inicializar los event listeners después
    
    // Configurar actualización automática cada 5 segundos
    setInterval(() => {
        loadPedidos();
    }, 5000);
});