let pedidosPrevios = new Map();
let inicializado = false;
let audioContext = null;
let sonidoEnCola = false;

function prepararAudio() {

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume().catch((err) => {
            console.log("[cocina] exception while generating sound", err);
        });
    }

}

document.addEventListener("pointerdown", prepararAudio, { once: true });
document.addEventListener("touchstart", prepararAudio, { once: true });

function playNewOrderSound() {

    console.log("[cocina] playNewOrderSound() entered");

    if (sonidoEnCola) {
        return;
    }

    sonidoEnCola = true;

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    console.log("[cocina] audioCtx state before resume:", audioContext.state);

    const reproducir = () => {
        if (!audioContext) {
            sonidoEnCola = false;
            return;
        }

        const now = audioContext.currentTime;
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        gain.connect(audioContext.destination);

        const osc = audioContext.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1180, now + 0.08);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.18);

        const osc2 = audioContext.createOscillator();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1040, now + 0.08);
        osc2.frequency.setValueAtTime(1320, now + 0.16);
        osc2.connect(gain);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.26);

        setTimeout(() => {
            sonidoEnCola = false;
        }, 300);
    };

    if (audioContext.state === "suspended") {
        audioContext.resume().then(() => {
            console.log("[cocina] audioCtx state after resume:", audioContext.state);
            reproducir();
        }).catch((err) => {
            console.log("[cocina] exception while generating sound", err);
        });
    } else {
        console.log("[cocina] audioCtx state after resume:", audioContext.state);
        reproducir();
    }

}

document.addEventListener("DOMContentLoaded", () => {

    console.log("[cocina] Storage.suscribir() called");

    Storage.suscribir((pedidos) => {

        console.log("[cocina] Storage callback executed");
        console.log("[cocina] number of orders received:", pedidos.length);

        renderizarCocina(pedidos);

        if (!inicializado) {
            inicializado = true;
            pedidosPrevios = new Map();
            pedidos.forEach(p => {
                const id = p.firestoreId || p.id;
                if (id) {
                    pedidosPrevios.set(String(id), true);
                }
            });
            return;
        }

        pedidos.forEach(p => {
            const id = p.firestoreId || p.id;
            if (!id) {
                return;
            }

            const key = String(id);
            if (!pedidosPrevios.has(key) && (p.estado || "Nuevo") === "Nuevo") {
                console.log("[cocina] new order detected", key, p);
                playNewOrderSound();
            }
        });

        pedidosPrevios = new Map();
        pedidos.forEach(p => {
            const id = p.firestoreId || p.id;
            if (id) {
                pedidosPrevios.set(String(id), true);
            }
        });

    }, {
        incluirEntregados: false,
        direccion: "asc"
    });

});

document.getElementById("cocina").addEventListener("click", cambiarEstado);

function escaparHtml(valor) {

    return String(valor || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function renderizarCocina(pedidos) {

    const activos = pedidos.filter(p => p.estado !== "Entregado");
    const cocina = document.getElementById("cocina");

    document.getElementById("estado").textContent =
        "Pedidos activos: " + activos.length;

    cocina.innerHTML = "";

    activos.forEach(p => {

        const card = document.createElement("div");
        const estado = p.estado || "Nuevo";

        card.className = "tarjeta";

        if (estado === "Preparando") {
            card.classList.add("preparando");
        }

        if (estado === "Listo") {
            card.classList.add("listo");
        }

        card.innerHTML = `
            <h2>&#128100; ${escaparHtml(p.cliente)}</h2>

            <strong>${escaparHtml(estado)}</strong>

            <hr>

            <pre>${escaparHtml(textoPedidoCocina(p))}</pre>

            <hr>

            <div>&#128205; ${escaparHtml(p.direccion)}</div>

            <div>&#128179; ${escaparHtml(p.pago)}</div>

            <div>&#128221; ${escaparHtml(p.observaciones)}</div>

            ${botonesParaPedido(p)}
        `;

        cocina.appendChild(card);

    });

}

function textoPedidoCocina(pedido) {

    if (Array.isArray(pedido.items) && pedido.items.length > 0) {
        return pedido.items
            .map(item => `${item.cantidad}x ${item.nombre}`)
            .join("\n");
    }

    return pedido.pedido || "";

}

function botonesParaPedido(pedido) {

    const estado = pedido.estado || "Nuevo";
    const id = escaparHtml(pedido.firestoreId || pedido.id);

    if (estado === "Nuevo") {
        return `
            <div class="botones">
                <button class="preparar" data-estado="preparando" data-id="${id}">
                    &#9654; Preparando
                </button>
            </div>`;
    }

    if (estado === "Preparando") {
        return `
            <div class="botones">
                <button class="listo" data-estado="listo" data-id="${id}">
                    &#10004; Listo
                </button>
            </div>`;
    }

    return "";

}

async function cambiarEstado(event) {

    const boton = event.target.closest("[data-estado]");

    if (!boton) {
        return;
    }

    boton.disabled = true;

    try {

        if (boton.dataset.estado === "preparando") {
            await Storage.marcarPreparando(boton.dataset.id);
        }

        if (boton.dataset.estado === "listo") {
            await Storage.marcarListo(boton.dataset.id);
        }

    } catch (e) {

        console.error(e);
        alert("No se pudo actualizar el estado del pedido.");
        boton.disabled = false;

    }

}
