document.addEventListener('alpine:init', () => {
    Alpine.data('gestorPedidos', (usarFiltros = false) => ({
        todosLosPedidos: [],
        paginaActual: 1,
        pedidosPorPagina: 24,
        filtroHoyActivo: true,
        esCargaInicial: true,
        ultimosIdsPedidos: [],
        alertaAudio: null,
        alertaAudioTest: null,
        textoSonidoAyuda: true,
        sonidosPedidos: [
            '/assets/sounds/pedidos/pedido1.mp3',
            '/assets/sounds/pedidos/pedido2.mp3',
            '/assets/sounds/pedidos/pedido3.mp3'
        ],
        
        // Settings & IP
        linkActual: '',
        ipServidor: 'Cargando...',

        // Filtros logic (active only if usarFiltros is true)
        filtrosProductos: [],
        filtroTexto: 'Cargando filtros...',
        guardando: false,
        msgFiltros: { show: false, text: '', class: '' },

        get totalPaginas() {
            return Math.max(1, Math.ceil(this.todosLosPedidos.length / this.pedidosPorPagina));
        },

        get pedidosPaginados() {
            if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) this.paginaActual = this.totalPaginas;
            const inicio = (this.paginaActual - 1) * this.pedidosPorPagina;
            return this.todosLosPedidos.slice(inicio, inicio + this.pedidosPorPagina);
        },

        get paginasArray() {
            return Array.from({length: this.totalPaginas}, (_, i) => i + 1);
        },

        async init() {
            this.linkActual = window.location.href;
            this.alertaAudio = document.getElementById('alertaAudio') || new Audio();
            this.alertaAudioTest = document.getElementById('alertaAudioTest') || new Audio('/assets/sounds/notificaciones.mp3');
            
            // Sonido
            if (localStorage.getItem('sonidoHabilitadoPedidos') !== 'true') {
                localStorage.setItem('sonidoHabilitadoPedidos', 'false');
                this.textoSonidoAyuda = true;
            } else {
                this.textoSonidoAyuda = false;
            }

            // Filtro Hoy
            const filtroHoyGuardado = localStorage.getItem('filtroHoyActivo');
            if (filtroHoyGuardado !== null) {
                this.filtroHoyActivo = filtroHoyGuardado === 'true';
            } else {
                this.filtroHoyActivo = true;
                localStorage.setItem('filtroHoyActivo', 'true');
            }

            this.checkDailyClean();
            this.scheduleDailyClean();
            this.cargarIP();

            // Cargar filtros si es necesario
            if (usarFiltros) {
                await this.cargarFiltros();
            }
            
            this.cargarPedidos(true);
            setInterval(() => this.cargarPedidos(false), 10000);
        },

        async cargarFiltros() {
            try {
                const res = await axios.get('/ajustes/filtros');
                if (Array.isArray(res.data)) {
                    this.filtrosProductos = res.data.map(f => f.toLowerCase().trim());
                    this.filtroTexto = res.data.join('\n');
                }
            } catch (err) {
                console.error('Error al cargar filtros:', err);
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
                    this.showMsg('<i class="fas fa-check-circle"></i> Filtros guardados y aplicados.', 'text-success');
                    this.filtrosProductos = lineas.map(f => f.toLowerCase().trim());
                    this.paginaActual = 1;
                    this.cargarPedidos(true);
                }
            } catch (err) {
                console.error(err);
                this.showMsg('<i class="fas fa-times-circle"></i> Error al guardar filtros.', 'text-danger');
            } finally {
                this.guardando = false;
            }
        },

        showMsg(text, classes) {
            this.msgFiltros = { show: true, text, class: classes };
            setTimeout(() => { this.msgFiltros.show = false; }, 4000);
        },

        toggleFiltroHoy() {
            this.filtroHoyActivo = !this.filtroHoyActivo;
            localStorage.setItem('filtroHoyActivo', this.filtroHoyActivo);
            this.paginaActual = 1;
            this.cargarPedidos(true);
        },

        probarSonido() {
            // Siempre permitimos reproducir el sonido de prueba para "desbloquear" el audio en la sesión actual del navegador
            this.alertaAudioTest.currentTime = 0;
            this.alertaAudioTest.play().then(() => {
                localStorage.setItem('sonidoHabilitadoPedidos', 'true');
                this.textoSonidoAyuda = false;
                const btn = document.getElementById('btnProbarSonido');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-check-circle me-2"></i> <span>Sonido Activado</span>';
                    btn.classList.add('sonido-activado');
                }
                console.log('[KDS] Sonido habilitado y activo mediante gesto de usuario.');
            }).catch((err) => {
                console.error('[KDS] Error al activar sonido:', err);
                alert('No se pudo reproducir el sonido. Por favor, asegúrese de haber interactuado con la página y que el navegador no esté bloqueando el audio.');
            });
        },

        async cargarIP() {
            try {
                const res = await fetch('/ajustes/ip');
                const data = await res.json();
                this.ipServidor = data.ip;
            } catch (err) {
                this.ipServidor = 'Error al obtener IP';
            }
        },

        seleccionarPagina(val) {
            this.paginaActual = parseInt(val, 10);
        },

        async copiarTexto(texto, btnEl) {
            if (!texto) return;
            try {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(texto);
                } else {
                    const input = document.createElement('input');
                    input.value = texto;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                }
                const iconoOri = btnEl.innerHTML;
                btnEl.innerHTML = '<i class="fas fa-check text-success"></i>';
                setTimeout(() => { btnEl.innerHTML = iconoOri; }, 2000);
            } catch (err) {
                console.error("No se pudo copiar", err);
            }
        },

        filtrarPedidoPorProductos(pedido) {
            if (!usarFiltros || this.filtrosProductos.length === 0) return pedido;
            
            let productos = (pedido.producto || '').split(',');
            let cantidades = (pedido.cantidad || '').split(',');
            let obsPorProducto = (pedido.observaciones_por_pedido || '').split(' | ');

            let productosFiltrados = [];
            let cantidadesFiltradas = [];
            let obsFiltradas = [];

            for (let i = 0; i < productos.length; i++) {
                let prodName = productos[i] ? productos[i].trim() : '';
                let prodNameLower = prodName.toLowerCase();
                
                let coincidencia = this.filtrosProductos.some(filtro => prodNameLower.includes(filtro) || prodNameLower === filtro);
                
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
        },

        async cargarPedidos(isFullLoad = false) {
            try {
                const API_URL = this.filtroHoyActivo ? '/pedidos/hoy' : '/pedidos';
                const res = await axios.get(API_URL);
                let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
                let rawPedidos = (res.data.pedidos || res.data);

                let parsedPedidos = rawPedidos.map(p => this.filtrarPedidoPorProductos(p))
                                              .filter(p => p !== null)
                                              .filter(p => !completados.includes(this.getPedidoIdUnico(p)))
                                              .map(p => this.parsePedido(p));

                const idsActuales = parsedPedidos.map(p => p.idUnico);
                const nuevos = idsActuales.filter(id => !this.ultimosIdsPedidos.includes(id));
                
                if (nuevos.length > 0) {
                    console.log(`[KDS] ${nuevos.length} nuevos pedidos detectados:`, nuevos);
                }

                const sonidoHabilitado = localStorage.getItem('sonidoHabilitadoPedidos') === 'true';
                if (!this.esCargaInicial && nuevos.length > 0 && sonidoHabilitado) {
                    try {
                        const randomSound = this.sonidosPedidos[Math.floor(Math.random() * this.sonidosPedidos.length)];
                        console.log(`[KDS] Intentando reproducir sonido: ${randomSound}`);
                        this.alertaAudio.src = randomSound;
                        this.alertaAudio.currentTime = 0;
                        const playPromise = this.alertaAudio.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                console.log('[KDS] Sonido reproducido con éxito.');
                            }).catch((err) => {
                                console.warn('[KDS] Error al reproducir sonido (bloqueo de navegador?):', err);
                            });
                        }
                    } catch (e) {
                        console.error('[KDS] Error crítico en lógica de sonido:', e);
                    }
                } else if (!this.esCargaInicial && nuevos.length > 0 && !sonidoHabilitado) {
                    console.info('[KDS] Nuevo pedido detectado pero el sonido está desactivado en este equipo.');
                }

                this.todosLosPedidos = parsedPedidos;
                this.ultimosIdsPedidos = idsActuales;
                this.esCargaInicial = false;
                
                // Paginación fix
                if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
                    this.paginaActual = this.totalPaginas;
                }
                const elActualizacion = document.getElementById('ultimaActualizacion');
                if (elActualizacion) elActualizacion.textContent = `Última actualización: ${new Date().toLocaleString()}`;
            } catch (err) {
                console.error('Error al cargar pedidos:', err);
            }
        },

        getPedidoIdUnico(pedido) {
            let id = pedido["Factura ID"];
            if (id && id.toString().trim() !== "") return id.toString();
            let base = (pedido.fecha || '') + '|' + (pedido.cliente || '') + '|' + (pedido.producto || '') + '|' + (pedido.cantidad || '');
            let hash = 0;
            for (let i = 0; i < base.length; i++) {
                hash = ((hash << 5) - hash) + base.charCodeAt(i);
                hash |= 0;
            }
            return `sinid-${Math.abs(hash)}`;
        },

        parsePedido(pedido) {
            let p = {
                idUnico: this.getPedidoIdUnico(pedido),
                facturaId: (pedido["Factura ID"] || '').toString().toUpperCase(),
                clienteDisplay: (pedido.cliente || 'SIN NOMBRE').toUpperCase(),
                obsGeneral: '',
                obsGeneralText: '',
                headerClass: '',
                tipoPedidoTexto: '-',
                claseAtraso: '',
                fechaFormateada: 'FECHA DESCONOCIDA',
                productosParsed: []
            };

            let productos = (pedido.producto || '').split(',');
            let cantidades = (pedido.cantidad || '').split(',');
            let observacionesPorProducto = (pedido.observaciones_por_pedido || '').split(' | ');
            
            p.productosParsed = productos.map((prodName, i) => {
                let name = prodName ? prodName.trim().toUpperCase() : '';
                let cant = cantidades[i] ? cantidades[i].trim() : '';
                if (cant && !isNaN(cant)) cant = parseInt(cant);
                let obs = observacionesPorProducto[i] ? observacionesPorProducto[i].trim().toLowerCase() : '';
                if (obs) obs = obs.charAt(0).toUpperCase() + obs.slice(1);
                return { id: i, name, cant, obs };
            }).filter(item => item.name || item.cant);

            let obsGeneral = (pedido['observacion general'] || '').trim();
            p.obsGeneralText = obsGeneral ? obsGeneral.toUpperCase() : 'SIN OBSERVACIONES';
            p.obsGeneral = obsGeneral ? obsGeneral.toUpperCase() : '';
            let obsGeneralLower = obsGeneral.toLowerCase();

            if (obsGeneralLower.includes('callcenter')) {
                p.headerClass = 'header-amarillo';
                p.tipoPedidoTexto = 'CALL CENTER';
            } else if (obsGeneralLower.includes('autopollo')) {
                p.headerClass = 'header-celeste';
                p.tipoPedidoTexto = 'AUTOPOLLO';
            } else {
                p.headerClass = 'header-verde';
                let primerLlevar = (pedido.llevar !== undefined && pedido.llevar !== null) ? pedido.llevar.toString().split(',')[0]?.trim() : '';
                if (primerLlevar === '1') {
                    p.tipoPedidoTexto = 'PARA LLEVAR';
                } else if (primerLlevar === '0') {
                    p.tipoPedidoTexto = 'PARA MESA';
                } else if (primerLlevar) {
                    p.tipoPedidoTexto = primerLlevar.toUpperCase();
                }
            }

            if (pedido.fecha) {
                const diffMin = Math.floor((new Date() - new Date(pedido.fecha)) / 1000 / 60);
                if (diffMin > 10) p.claseAtraso = 'alerta-atraso';
                
                const d = new Date(pedido.fecha);
                const pd = String(d.getDate()).padStart(2, '0');
                const pm = String(d.getMonth() + 1).padStart(2, '0');
                p.fechaFormateada = `${pd}/${pm}/${d.getFullYear()} - ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }

            return p;
        },

        marcarPedidoCompletado(idUnico) {
            let completados = JSON.parse(localStorage.getItem('pedidosCompletados') || '[]');
            if (!completados.includes(idUnico)) {
                completados.push(idUnico);
                localStorage.setItem('pedidosCompletados', JSON.stringify(completados));
                this.todosLosPedidos = this.todosLosPedidos.filter(p => p.idUnico !== idUnico);
                
                if (this.pedidosPaginados.length === 0 && this.paginaActual > 1) {
                    this.paginaActual--;
                }
            }
        },

        checkDailyClean() {
            const ultimaLimpieza = localStorage.getItem('ultimaLimpiezaLocalStorage');
            const hoy = new Date().toISOString().slice(0, 10);
            if (!ultimaLimpieza) {
                localStorage.setItem('ultimaLimpiezaLocalStorage', hoy);
            } else if (ultimaLimpieza !== hoy) {
                this.limpiarLocalStoragePedidos();
            }
        },

        scheduleDailyClean() {
            const ahora = new Date();
            const manana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 5, 0);
            setTimeout(() => {
                this.limpiarLocalStoragePedidos();
                this.scheduleDailyClean();
            }, manana - ahora);
        },

        limpiarLocalStoragePedidos() {
            localStorage.removeItem('pedidosCompletados');
            localStorage.removeItem('completedOrders');
            localStorage.removeItem('filtroHoyActivo');
            localStorage.setItem('ultimaLimpiezaLocalStorage', new Date().toISOString().slice(0, 10));
        }
    }));
});
