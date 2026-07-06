let pedidoActual = null;
let cancelarEscuchaPedidos = null;
let pedidoSeleccionadoId = null;
let pedidoVisible = null;

document.addEventListener("DOMContentLoaded", () => {

    iniciarPedidosEnTiempoReal();

});

document
    .getElementById("interpretar")
    .addEventListener("click", interpretarMensaje);

document
    .getElementById("registrar")
    .addEventListener("click", registrarPedido);

document
    .getElementById("pedido")
    .addEventListener("click", manejarAccionPedido);

function iniciarPedidosEnTiempoReal() {

    if (cancelarEscuchaPedidos) {
        cancelarEscuchaPedidos();
    }

    cancelarEscuchaPedidos = Storage.suscribir(pedidos => {

        actualizarHistorial(pedidos, seleccionarPedido);

        if (pedidoSeleccionadoId) {

            const seleccionado = pedidos.find(p =>
                String(p.firestoreId || p.id) === String(pedidoSeleccionadoId)
            );

            if (seleccionado) {
                mostrarPedidoVisible(seleccionado);
            }

        }

    });

}

function interpretarMensaje() {

    const texto = document
        .getElementById("mensaje")
        .value
        .trim();

    if (!texto) {
        alert("Pega un mensaje.");
        return;
    }

    pedidoActual = interpretarPedido(texto);
    pedidoSeleccionadoId = null;

    mostrarPedidoVisible(pedidoActual);

}

async function registrarPedido() {

    if (!pedidoActual) {
        alert("No hay ningun pedido para registrar.");
        return;
    }

    try {

        if (typeof Clientes !== "undefined") {

            const existente = await Clientes.buscarPorTelefono(
                pedidoActual.telefono
            );

            if (!existente) {

                await Clientes.guardar(pedidoActual);

            }

        }

        await Storage.guardar(pedidoActual);

        pedidoActual = null;
        pedidoSeleccionadoId = null;
        pedidoVisible = null;

        document.getElementById("mensaje").value = "";

        document.getElementById("pedido").innerHTML = `
            <div class="vacio">
                &#127829;<br><br>
                Esperando un nuevo pedido...
            </div>
        `;

    } catch (e) {

        console.error(e);

        alert("Ocurrio un error al registrar el pedido.");

    }

}

function seleccionarPedido(pedido) {

    pedidoSeleccionadoId = pedido.firestoreId || pedido.id;
    mostrarPedidoVisible(pedido);

}

function mostrarPedidoVisible(pedido) {

    pedidoVisible = pedido;
    mostrarComanda(pedido);

}

function manejarAccionPedido(event) {

    imprimirPedido(event);
    entregarPedido(event);

}

function imprimirPedido(event) {

    const boton = event.target.closest("[data-imprimir-pedido]");

    if (!boton) {
        return;
    }

    TicketPrinter.imprimir(pedidoVisible);

}

async function entregarPedido(event) {

    const boton = event.target.closest("[data-entregar-id]");

    if (!boton) {
        return;
    }

    boton.disabled = true;

    try {

        await Storage.marcarEntregado(boton.dataset.entregarId);

    } catch (e) {

        console.error(e);
        alert("Solo se pueden entregar pedidos que estan listos.");
        boton.disabled = false;

    }

}
