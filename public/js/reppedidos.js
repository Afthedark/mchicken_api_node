// Lógica específica para la vista de reppedidos
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
        document.getElementById('reppedidosTableBody').innerHTML = 
            `<tr><td colspan="5" class="mensaje-error">${error.message}</td></tr>`;
    }
}

function renderPedidos(pedidos, tableBodyId) {
    const tableBody = document.getElementById(tableBodyId);
    tableBody.innerHTML = '';

    if (!pedidos || !Array.isArray(pedidos)) {
        tableBody.innerHTML = 
            `<tr><td colspan="5" class="mensaje-error">No se encontraron pedidos o formato inválido</td></tr>`;
        return;
    }

    try {
        pedidos.forEach((pedido, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${pedido.cliente || 'N/A'}</td>
                <td>${pedido.producto || 'N/A'}</td>
                <td>${pedido.cantidad || 'N/A'}</td>
                <td>${pedido.fecha ? new Date(pedido.fecha).toLocaleString() : 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al renderizar pedidos:', error);
        tableBody.innerHTML = 
            `<tr><td colspan="5" class="mensaje-error">Error al mostrar los pedidos</td></tr>`;
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

// Configurar listeners para los botones de paginación
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

// Función principal para cargar pedidos
function loadPedidos() {
    document.getElementById('reppedidosTableBody').innerHTML = 
        `<tr><td colspan="5" class="mensaje-centrado">Cargando pedidos...</td></tr>`;
    
    fetchPedidos(currentPage, (data) => {
        renderPedidos(data.pedidos, 'reppedidosTableBody');
        updatePageInfo(currentPage, data.totalPages);
        updateLastUpdated();
        
        // Deshabilitar botones si es necesario
        document.getElementById('prevPage').disabled = currentPage <= 1;
        document.getElementById('nextPage').disabled = currentPage >= data.totalPages;
    });
}

// Inicializar
loadPedidos();