// Lógica específica para la vista de pedidos
let currentPage = 1;

// Funciones para manejar pedidos
async function fetchPedidos(page, callback) {
    try {
        const response = await fetch(`/pedidos?page=${page}`);
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
            completedButton.className = 'btn btn-success btn-sm';
            completedButton.textContent = '✓ Completado';
            completedButton.addEventListener('click', () => markOrderAsCompleted(orderId));

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${pedido.cliente || 'N/A'}</td>
                <td>${pedido.producto || 'N/A'}</td>
                <td>${pedido.cantidad || 'N/A'}</td>
                <td>${pedido.fecha ? new Date(pedido.fecha).toLocaleString() : 'N/A'}</td>
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

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    loadPedidos(); // Cargar los pedidos iniciales primero
    initializeEventListeners(); // Inicializar los event listeners después
});