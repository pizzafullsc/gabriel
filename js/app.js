let pedidoActual = null;
let cancelarEscuchaPedidos = null;
let pedidoSeleccionadoId = null;
let pedidoVisible = null;
let timeoutBusquedaCliente = null;

const estadoFormulario = {
    tipoPedido: "delivery",
    productos: []
};

const preguntasCliente = {
    delivery: "¿A quién le avisamos?",
    pickup: "¿Quién retira el pedido?",
    "dine-in": "¿A quién lo dejamos?"
};

document.addEventListener("DOMContentLoaded", () => {

    iniciarPedidosEnTiempoReal();
    iniciarFormularioPedido();
    sincronizarVistaFormulario();
    actualizarPreviewDesdeFormulario();

});

function iniciarFormularioPedido() {

    document
        .getElementById("nuevo-pedido")
        .addEventListener("click", nuevoPedido);

    document
        .getElementById("pegar-whatsapp")
        .addEventListener("click", abrirFlujoWhatsApp);

    document
        .getElementById("cancelar-whatsapp")
        .addEventListener("click", cerrarFlujoWhatsApp);

    document
        .getElementById("interpretar")
        .addEventListener("click", interpretarMensaje);

    document
        .getElementById("formulario-pedido")
        .addEventListener("submit", registrarPedido);

    document
        .getElementById("pedido")
        .addEventListener("click", manejarAccionPedido);

    document
        .getElementById("agregar-producto")
        .addEventListener("click", agregarProductoDesdeBusqueda);

    document
        .getElementById("producto-busqueda")
        .addEventListener("keydown", manejarTeclaProducto);

    document
        .getElementById("telefono")
        .addEventListener("keydown", manejarTeclaTelefono);

    document
        .getElementById("telefono")
        .addEventListener("input", manejarCambioTelefono);

    document
        .getElementById("telefono")
        .addEventListener("blur", manejarBlurTelefono);

    document
        .getElementById("observaciones")
        .addEventListener("keydown", manejarTeclaObservaciones);

    document
        .querySelectorAll("[data-order-type]")
        .forEach(boton => {
            boton.addEventListener("click", () => seleccionarTipoPedido(boton.dataset.orderType));
            boton.addEventListener("keydown", manejarTeclaTipoPedido);
        });

    document
        .querySelectorAll("#formulario-pedido input, #formulario-pedido textarea, #formulario-pedido select")
        .forEach(campo => {
            campo.addEventListener("input", actualizarPreviewDesdeFormulario);
            campo.addEventListener("change", actualizarPreviewDesdeFormulario);
        });

    document
        .getElementById("lista-productos")
        .addEventListener("click", manejarAccionProducto);

}

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

function seleccionarTipoPedido(tipo) {

    estadoFormulario.tipoPedido = tipo;
    sincronizarVistaFormulario();
    enfocarPrimerCampoDelTipo();
    actualizarPreviewDesdeFormulario();

}

function sincronizarVistaFormulario() {

    const tipo = estadoFormulario.tipoPedido;
    const esDelivery = tipo === "delivery";
    const esMesa = tipo === "dine-in";

    document
        .querySelectorAll("[data-order-type]")
        .forEach(boton => {
            const activo = boton.dataset.orderType === tipo;
            boton.setAttribute("aria-checked", String(activo));
            boton.tabIndex = activo ? 0 : -1;
        });

    document.querySelector("[data-section='delivery']").hidden = !esDelivery;
    document.querySelector("[data-section='table']").hidden = !esMesa;
    document.getElementById("customer-question").textContent = preguntasCliente[tipo];

}

function enfocarPrimerCampoDelTipo() {

    const id = estadoFormulario.tipoPedido === "dine-in"
        ? "mesa"
        : "telefono";

    document.getElementById(id).focus();

}

function manejarTeclaTipoPedido(event) {

    const teclas = ["ArrowLeft", "ArrowRight", "Enter", " "];

    if (!teclas.includes(event.key)) {
        return;
    }

    event.preventDefault();

    const botones = Array.from(document.querySelectorAll("[data-order-type]"));
    const actual = botones.indexOf(event.currentTarget);
    const direccion = event.key === "ArrowLeft" ? -1 : 1;

    if (event.key === "Enter" || event.key === " ") {
        seleccionarTipoPedido(event.currentTarget.dataset.orderType);
        return;
    }

    const siguiente = (actual + direccion + botones.length) % botones.length;
    botones[siguiente].focus();

}

async function manejarTeclaTelefono(event) {

    if (event.key !== "Enter") {
        return;
    }

    event.preventDefault();

    await buscarClientePorTelefono();
    enfocarSiguienteCampoSinResolver(event.currentTarget);

}

function manejarCambioTelefono() {

    if (timeoutBusquedaCliente) {
        window.clearTimeout(timeoutBusquedaCliente);
    }

    const valor = document.getElementById("telefono").value.trim();
    const numero = Clientes && typeof Clientes.normalizarTelefono === "function"
        ? Clientes.normalizarTelefono(valor)
        : valor.replace(/\D/g, "");

    if (numero.length < 6) {
        return;
    }

    timeoutBusquedaCliente = window.setTimeout(() => {
        buscarClientePorTelefono();
    }, 350);

}

function manejarBlurTelefono() {

    if (timeoutBusquedaCliente) {
        window.clearTimeout(timeoutBusquedaCliente);
    }

    buscarClientePorTelefono();

}

function manejarTeclaProducto(event) {

    if (event.key !== "Enter") {
        return;
    }

    event.preventDefault();
    agregarProductoDesdeBusqueda();

}

function manejarTeclaObservaciones(event) {

    if (event.key === "Enter" && event.ctrlKey) {
        event.preventDefault();
        registrarPedido(event);
    }

}

async function buscarClientePorTelefono() {

    const telefonoInput = document.getElementById("telefono");
    const telefono = Clientes && typeof Clientes.normalizarTelefono === "function"
        ? Clientes.normalizarTelefono(telefonoInput.value)
        : telefonoInput.value.trim();

    if (telefono.replace(/\D/g, "").length < 6 || typeof Clientes === "undefined") {
        return;
    }

    const cliente = await Clientes.buscarPorTelefono(telefono);

    if (!cliente) {
        return;
    }

    document.getElementById("cliente").value = cliente.nombre || "";
    document.getElementById("direccion").value = cliente.direccion || "";
    document.getElementById("referencia").value = cliente.referencia || "";
    document.getElementById("notas-cliente").value = cliente.observaciones || "";

    actualizarPreviewDesdeFormulario();

}

function enfocarSiguienteCampoSinResolver(campoActual) {

    const campos = Array.from(
        document.querySelectorAll("#formulario-pedido input, #formulario-pedido select, #formulario-pedido textarea, #registrar")
    ).filter(campo => !campo.closest("[hidden]"));

    const pendiente = campos.find(campo =>
        campo !== campoActual &&
        !campo.disabled &&
        campo.id !== "referencia" &&
        "value" in campo &&
        String(campo.value || "").trim() === ""
    );

    if (pendiente) {
        pendiente.focus();
    }

}

function abrirFlujoWhatsApp() {

    const dialog = document.getElementById("whatsapp-dialog");
    document.getElementById("mensaje").value = "";

    if (dialog.showModal) {
        dialog.showModal();
    } else {
        dialog.setAttribute("open", "");
    }

    document.getElementById("mensaje").focus();

}

function cerrarFlujoWhatsApp() {

    const dialog = document.getElementById("whatsapp-dialog");

    if (dialog.close) {
        dialog.close();
    } else {
        dialog.removeAttribute("open");
    }

}

function interpretarMensaje() {

    const texto = document
        .getElementById("mensaje")
        .value
        .trim();

    if (!texto) {
        alert("Pegá un mensaje.");
        return;
    }

    const pedidoInterpretado = interpretarPedido(texto);
    poblarFormulario(pedidoInterpretado);
    cerrarFlujoWhatsApp();
    pedidoSeleccionadoId = null;
    actualizarPreviewDesdeFormulario();

}

function poblarFormulario(datos) {

    if (datos.mesa) {
        estadoFormulario.tipoPedido = "dine-in";
    } else if (!datos.direccion) {
        estadoFormulario.tipoPedido = "pickup";
    } else {
        estadoFormulario.tipoPedido = "delivery";
    }

    sincronizarVistaFormulario();

    document.getElementById("telefono").value = datos.telefono || "";
    document.getElementById("cliente").value = datos.cliente || "";
    document.getElementById("direccion").value = datos.direccion || "";
    document.getElementById("referencia").value = datos.referencia || "";
    document.getElementById("mesa").value = datos.mesa || "";
    document.getElementById("pago").value = datos.pago || "";
    document.getElementById("observaciones").value = datos.observaciones || "";
    document.getElementById("notas-cliente").value = "";

    estadoFormulario.productos = normalizarProductos(datos.pedido);
    renderizarProductos();

}

function normalizarProductos(texto) {

    return String(texto || "")
        .split("\n")
        .map(linea => linea.trim())
        .filter(Boolean)
        .map(nombre => ({
            nombre,
            cantidad: 1,
            observacion: ""
        }));

}

function agregarProductoDesdeBusqueda() {

    const input = document.getElementById("producto-busqueda");
    const nombre = input.value.trim();

    if (!nombre) {
        return;
    }

    estadoFormulario.productos.push({
        nombre,
        cantidad: 1,
        observacion: ""
    });

    input.value = "";
    renderizarProductos();
    actualizarPreviewDesdeFormulario();
    input.focus();

}

function manejarAccionProducto(event) {

    const boton = event.target.closest("[data-product-action]");

    if (!boton) {
        return;
    }

    const index = Number(boton.dataset.index);
    const producto = estadoFormulario.productos[index];

    if (!producto) {
        return;
    }

    if (boton.dataset.productAction === "increase") {
        producto.cantidad += 1;
    }

    if (boton.dataset.productAction === "decrease") {
        producto.cantidad -= 1;
    }

    if (boton.dataset.productAction === "remove" || producto.cantidad <= 0) {
        estadoFormulario.productos.splice(index, 1);
    }

    renderizarProductos();
    actualizarPreviewDesdeFormulario();

}

function renderizarProductos() {

    const lista = document.getElementById("lista-productos");

    if (estadoFormulario.productos.length === 0) {
        lista.innerHTML = "<p class='vacio'>Todavía no hay productos.</p>";
        return;
    }

    lista.innerHTML = estadoFormulario.productos
        .map((producto, index) => `
            <div class="product-row">
                <div>
                    <strong>${escaparHtml(producto.cantidad)}x ${escaparHtml(producto.nombre)}</strong>
                    ${producto.observacion ? `<small>${escaparHtml(producto.observacion)}</small>` : ""}
                </div>
                <div class="quantity-controls">
                    <button type="button" data-product-action="decrease" data-index="${index}" aria-label="Disminuir ${escaparHtml(producto.nombre)}">-</button>
                    <button type="button" data-product-action="increase" data-index="${index}" aria-label="Aumentar ${escaparHtml(producto.nombre)}">+</button>
                    <button type="button" data-product-action="remove" data-index="${index}" aria-label="Quitar ${escaparHtml(producto.nombre)}">Quitar</button>
                </div>
            </div>
        `)
        .join("");

}

function nuevoPedido() {

    document.getElementById("formulario-pedido").reset();
    estadoFormulario.tipoPedido = "delivery";
    estadoFormulario.productos = [];
    pedidoActual = null;
    pedidoSeleccionadoId = null;
    pedidoVisible = null;

    sincronizarVistaFormulario();
    renderizarProductos();
    actualizarPreviewDesdeFormulario();
    document.querySelector("[data-order-type='delivery']").focus();

}

function construirPedidoDesdeFormulario() {

    const tipo = estadoFormulario.tipoPedido;
    const mesa = document.getElementById("mesa").value.trim();
    const direccion = document.getElementById("direccion").value.trim();
    const referencia = document.getElementById("referencia").value.trim();
    const ubicacion = tipo === "dine-in" ? mesa : direccion;
    const pedido = estadoFormulario.productos
        .map(producto => `${producto.cantidad}x ${producto.nombre}`)
        .join("\n");

    return {
        tipoPedido: tipo,
        tipo: etiquetaTipoPedido(tipo),
        cliente: document.getElementById("cliente").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        mesa,
        direccion: ubicacion,
        referencia: tipo === "delivery" ? referencia : "",
        pedido,
        productos: estadoFormulario.productos.map(producto => ({ ...producto })),
        pago: document.getElementById("pago").value.trim(),
        cambio: "",
        observaciones: document.getElementById("observaciones").value.trim()
    };

}

function etiquetaTipoPedido(tipo) {

    switch (tipo) {
        case "pickup":
            return "Retiro";
        case "dine-in":
            return "Salón";
        default:
            return "Delivery";
    }

}

function actualizarPreviewDesdeFormulario() {

    pedidoActual = construirPedidoDesdeFormulario();
    pedidoVisible = pedidoActual;

    if (
        !pedidoActual.cliente &&
        !pedidoActual.telefono &&
        !pedidoActual.direccion &&
        !pedidoActual.pedido &&
        !pedidoActual.pago &&
        !pedidoActual.observaciones
    ) {
        document.getElementById("pedido").innerHTML = `
            <p class="vacio">
                Armá un pedido para ver la comanda.
            </p>
        `;
        return;
    }

    mostrarPedidoVisible(pedidoActual);

}

async function registrarPedido(event) {

    if (event && event.preventDefault) {
        event.preventDefault();
    }

    pedidoActual = construirPedidoDesdeFormulario();

    if (!pedidoActual.pedido) {
        alert("Agregá al menos un producto.");
        document.getElementById("producto-busqueda").focus();
        return;
    }

    if (pedidoActual.tipoPedido === "delivery" && !pedidoActual.direccion) {
        alert("Agregá la dirección.");
        document.getElementById("direccion").focus();
        return;
    }

    if (pedidoActual.tipoPedido === "dine-in" && !pedidoActual.mesa) {
        alert("Agregá la mesa.");
        document.getElementById("mesa").focus();
        return;
    }

    try {

        if (typeof Clientes !== "undefined") {

            await Clientes.guardarDesdePedido({
                telefono: pedidoActual.telefono,
                nombre: pedidoActual.cliente,
                direccion: document.getElementById("direccion").value.trim(),
                referencia: document.getElementById("referencia").value.trim(),
                observaciones: document.getElementById("notas-cliente").value.trim()
            });

        }

        await Storage.guardar(pedidoActual);
        nuevoPedido();

    } catch (e) {

        console.error(e);
        alert("Hubo un error al confirmar el pedido.");

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
        alert("Solo se pueden entregar pedidos que estén listos.");
        boton.disabled = false;

    }

}
