document.addEventListener('DOMContentLoaded', async () => {
    const filtroTextarea = document.getElementById('filtroTextarea');
    const guardarBtn = document.getElementById('guardarFiltrosBtn');
    const msg = document.getElementById('filtroAlertMsg');
    const btnLimpiarCache = document.getElementById('btnLimpiarCache');

    // 1. Cargar filtros actuales desde el servidor
    try {
        const res = await axios.get('/ajustes/filtros');
        if (Array.isArray(res.data)) {
            filtroTextarea.value = res.data.join('\n');
        }
    } catch (err) {
        console.error('Error al cargar filtros:', err);
        filtroTextarea.value = "Error al intentar conectarse al servidor.";
    }

    // 2. Guardar filtros al servidor
    if (guardarBtn) {
        guardarBtn.addEventListener('click', async () => {
            if (!filtroTextarea) return;
            
            const lineas = filtroTextarea.value.split('\n')
                                         .map(l => l.trim())
                                         .filter(l => l.length > 0);
            
            try {
                guardarBtn.disabled = true;
                guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
                
                const res = await axios.post('/ajustes/filtros', { filtros: lineas });
                if (res.data.success) {
                    msg.innerHTML = '<i class="fas fa-check-circle me-1"></i> Filtros guardados y aplicados exitosamente.';
                    msg.className = 'alert-message text-success bg-success bg-opacity-10';
                    msg.style.display = 'block';
                    
                    setTimeout(() => { msg.style.display = 'none'; }, 4000);
                }
            } catch (err) {
                console.error(err);
                msg.innerHTML = '<i class="fas fa-times-circle me-1"></i> Error al intentar guardar los filtros.';
                msg.className = 'alert-message text-danger bg-danger bg-opacity-10';
                msg.style.display = 'block';
            } finally {
                guardarBtn.disabled = false;
                guardarBtn.innerHTML = '<i class="fas fa-save me-2"></i> Guardar Filtros al Servidor';
            }
        });
    }

    // 3. Botón para Limpiar la Caché Local
    if (btnLimpiarCache) {
        btnLimpiarCache.addEventListener('click', () => {
            const confirmed = confirm("¿Está seguro de limpiar la caché de órdenes?\nEsto hará que las órdenes que ya había ocultado o marcado como 'completadas' regresen nuevamente a las pantallas de la cocina en esta computadora.");
            
            if (confirmed) {
                localStorage.removeItem('pedidosCompletados');
                localStorage.removeItem('completedOrders');
                
                alert("¡Memoria de pedidos completados limpiada exitosamente!");
            }
        });
    }
});
