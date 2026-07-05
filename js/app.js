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

    const texto = document
        .getElementById("mensaje")
        .value
        .trim();

    if (!texto) {
        alert("Pegá un mensaje.");
        return;
    }

    pedidoActual = interpretarPedido(texto);

    mostrarComanda(pedidoActual);

}

function registrarPedido() {

    if (!pedidoActual) {
        alert("No hay ningún pedido para registrar.");
        return;
    }

    Storage.guardar(pedidoActual);

    pedidoActual = null;

    document.getElementById("mensaje").value = "";

    document.getElementById("pedido").innerHTML = `
        <div class="vacio">
            🍕<br><br>
            Esperando un nuevo pedido...
        </div>
    `;

    actualizarHistorial();

}