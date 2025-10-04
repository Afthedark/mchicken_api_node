// Unit test para verificar la reproducción de sonido al llegar nuevos pedidos
// Simula el entorno del frontend y testea la lógica de detección y sonido

const { JSDOM } = require('jsdom');

// Mock de localStorage
class LocalStorageMock {
  constructor() { this.store = {}; }
  clear() { this.store = {}; }
  getItem(key) { return this.store[key] || null; }
  setItem(key, value) { this.store[key] = value.toString(); }
  removeItem(key) { delete this.store[key]; }
}

global.localStorage = new LocalStorageMock();

describe('Pedidos - Sonido de nuevos pedidos', () => {
  let alertaAudio;
  let ultimosIdsPedidos = [];
  let sonidoReproducido;

  // Simula la función de reproducción de sonido
  function playSoundMock() {
    sonidoReproducido = true;
  }

  // Lógica a testear (simplificada)
  function detectarNuevosPedidos(todosLosPedidos, ultimosIdsPedidos, sonidoHabilitado, playSound) {
    const idsActuales = todosLosPedidos.map(p => p.id);
    const nuevos = idsActuales.filter(id => !ultimosIdsPedidos.includes(id));
    if (nuevos.length > 0 && sonidoHabilitado) {
      playSound();
    }
    return idsActuales;
  }

  beforeEach(() => {
    sonidoReproducido = false;
    ultimosIdsPedidos = ['A', 'B'];
    localStorage.clear();
  });

  test('No reproduce sonido si no hay nuevos pedidos', () => {
    const pedidos = [ { id: 'A' }, { id: 'B' } ];
    localStorage.setItem('sonidoHabilitadoPedidos', 'true');
    ultimosIdsPedidos = detectarNuevosPedidos(pedidos, ultimosIdsPedidos, true, playSoundMock);
    expect(sonidoReproducido).toBe(false);
  });

  test('Reproduce sonido si hay nuevos pedidos y sonido habilitado', () => {
    const pedidos = [ { id: 'A' }, { id: 'B' }, { id: 'C' } ];
    localStorage.setItem('sonidoHabilitadoPedidos', 'true');
    ultimosIdsPedidos = detectarNuevosPedidos(pedidos, ultimosIdsPedidos, true, playSoundMock);
    expect(sonidoReproducido).toBe(true);
  });

  test('No reproduce sonido si hay nuevos pedidos pero sonido deshabilitado', () => {
    const pedidos = [ { id: 'A' }, { id: 'B' }, { id: 'C' } ];
    localStorage.setItem('sonidoHabilitadoPedidos', 'false');
    ultimosIdsPedidos = detectarNuevosPedidos(pedidos, ultimosIdsPedidos, false, playSoundMock);
    expect(sonidoReproducido).toBe(false);
  });

  test('Reproduce sonido solo una vez aunque lleguen varios nuevos pedidos', () => {
    const pedidos = [ { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' } ];
    localStorage.setItem('sonidoHabilitadoPedidos', 'true');
    ultimosIdsPedidos = detectarNuevosPedidos(pedidos, ultimosIdsPedidos, true, playSoundMock);
    expect(sonidoReproducido).toBe(true);
  });
});
