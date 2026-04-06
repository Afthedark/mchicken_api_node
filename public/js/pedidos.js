document.addEventListener('alpine:init', () => {
    Alpine.data('pedidosAdmin', () => ({
        filtroTexto: 'Cargando configuración actual...',
        guardando: false,
        msgInfo: { show: false, text: '', class: '' },
        linkP2: '',
        linkP3: '',
        
        async init() {
            this.setupLinks();
            this.cargarFiltros();
        },

        setupLinks() {
            fetch('/ajustes/ip')
                .then(res => res.json())
                .then(data => {
                    const port = window.location.port ? `:${window.location.port}` : '';
                    const base = `http://${data.ip}${port}`;
                    this.linkP2 = `${base}/pedidos2.html`;
                    this.linkP3 = `${base}/pedidos3.html`;
                })
                .catch(err => {
                    console.error('Error obteniendo IP:', err);
                    this.linkP2 = window.location.origin + '/pedidos2.html';
                    this.linkP3 = window.location.origin + '/pedidos3.html';
                });
        },

        async copyLink(linkKey, btnEl) {
            const url = this[linkKey];
            if (!url) return;
            try {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                } else {
                     // fallback si falla el clipboard api
                    const input = document.createElement('input');
                    input.value = url;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                }
                
                const origHtml = btnEl.innerHTML;
                btnEl.innerHTML = '<i class="fas fa-check text-success"></i>';
                setTimeout(() => { btnEl.innerHTML = origHtml; }, 2000);
            } catch (err) {
                console.error("Error al copiar", err);
            }
        },

        async cargarFiltros() {
            try {
                const res = await axios.get('/ajustes/filtros');
                if (Array.isArray(res.data)) {
                    this.filtroTexto = res.data.join('\n');
                }
            } catch (err) {
                console.error('Error al cargar filtros:', err);
                this.filtroTexto = "Error al intentar conectarse al servidor.";
            }
        },

        async guardarFiltros() {
            const lineas = this.filtroTexto.split('\n')
                                         .map(l => l.trim())
                                         .filter(l => l.length > 0);
            try {
                this.guardando = true;
                const res = await axios.post('/ajustes/filtros', { filtros: lineas });
                
                if (res.data.success) {
                    this.showMsg('<i class="fas fa-check-circle me-1"></i> Filtros guardados y aplicados exitosamente.', 'alert-message text-success bg-success bg-opacity-10');
                }
            } catch (err) {
                console.error(err);
                this.showMsg('<i class="fas fa-times-circle me-1"></i> Error al intentar guardar los filtros.', 'alert-message text-danger bg-danger bg-opacity-10');
            } finally {
                this.guardando = false;
            }
        },

        showMsg(text, className) {
            this.msgInfo = { show: true, text: text, class: className };
            setTimeout(() => { this.msgInfo.show = false; }, 4000);
        },

        limpiarCache() {
            const confirmed = confirm("¿Está seguro de limpiar la caché de órdenes?\\nEsto hará que las órdenes que ya había ocultado o marcado como 'completadas' regresen nuevamente a las pantallas de la cocina en esta computadora.");
            
            if (confirmed) {
                localStorage.removeItem('pedidosCompletados');
                localStorage.removeItem('completedOrders');
                alert("¡Memoria de pedidos completados limpiada exitosamente!");
            }
        }
    }));
});
