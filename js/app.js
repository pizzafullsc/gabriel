let pedidoActual = null;

document.addEventListener("DOMContentLoaded", () => {
    actualizarHistorial();
});

document
    .getElementById("interpretar")
    .addEventListener("click", interpretarMensaje);

document
    .getElementById("registrar")
    .addEventListener("click", registrarPedido);

function interpretarMensaje() {

    const texto = document.getElementById("mensaje").value.trim();

    if (!texto) {
        alert("Pegá un mensaje.");
        return;
    }

    pedidoActual = interpretarPedido(texto);

    mostrarComanda(pedidoActual);

}

function registrarPedido() {

    if (!pedidoActual) {
        alert("Primero interpretá un pedido.");
        return;
    }

    Storage.guardar(pedidoActual);

    pedidoActual = null;

    document.getElementById("mensaje").value = "";

    document.getElementById("pedido").innerHTML = `
        <div class="vacio">
            Esperando un nuevo pedido...
        </div>
    `;

    actualizarHistorial();

}