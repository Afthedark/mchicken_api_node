// Este archivo se encarga de reproducir un sonido cuando hay nuevos pedidos
let audioContext = null;
let audioBuffer = null;

async function initAudio() {
    try {
        // Crear el contexto de audio solo si no existe
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Cargar el archivo de sonido
            const response = await fetch('/assets/sounds/alerta1.mp3');
            const arrayBuffer = await response.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            console.log('Audio inicializado correctamente');
        }
        return true;
    } catch (error) {
        console.error('Error al inicializar el audio:', error);
        return false;
    }
}

export async function playNewOrderSound() {
    try {
        // Asegurarse de que el audio está inicializado
        if (!audioContext && !(await initAudio())) {
            throw new Error('No se pudo inicializar el audio');
        }

        // Si el contexto está suspendido (por políticas del navegador), reanudarlo
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // Crear una nueva fuente de sonido (necesario cada vez)
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);

        console.log('Sonido reproducido correctamente');
    } catch (error) {
        console.error('Error al reproducir el sonido:', error);
    }
}

// Función para probar el sonido
export async function testSound() {
    await playNewOrderSound();
}
