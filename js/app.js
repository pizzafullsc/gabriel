let pedidoActual = null;
let cancelarEscuchaPedidos = null;
let pedidoSeleccionadoId = null;
let pedidoVisible = null;
let timeoutBusquedaCliente = null;

const estadoFormulario = {
    tipoPedido: "delivery",
    items: [],
    menuListo: false
};

const preguntasCliente = {
    delivery: "¿A quién le avisamos?",
    pickup: "¿Quién retira el pedido?",
    "dine-in": "¿A quién lo dejamos?"
};

document.addEventListener("DOMContentLoaded", async () => {

    iniciarPedidosEnTiempoReal();
    await iniciarCatalogoMenu();
    iniciarFormularioPedido();
    sincronizarVistaFormulario();
    actualizarPreviewDesdeFormulario();

});

async function iniciarCatalogoMenu() {

    try {

        await MenuService.init();
        estadoFormulario.menuListo = true;
        renderizarSelectorMenu();

    } catch (e) {

        console.error(e);
        estadoFormulario.menuListo = false;
        bloquearSelectorMenu("No se pudo cargar el menu.");

    }

}

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
        .getElementById("imagen-whatsapp")
        .addEventListener("change", limpiarEstadoOcr);

    document
        .getElementById("formulario-pedido")
        .addEventListener("submit", registrarPedido);

    document
        .getElementById("pedido")
        .addEventListener("click", manejarAccionPedido);

    document
        .getElementById("agregar-producto")
        .addEventListener("click", agregarProductoDesdeMenu);

    document
        .getElementById("cantidad-producto")
        .addEventListener("keydown", manejarTeclaProducto);

    document
        .getElementById("categoria-menu")
        .addEventListener("change", manejarCambioCategoriaMenu);

    document
        .getElementById("producto-menu")
        .addEventListener("change", manejarCambioProductoMenu);

    document
        .getElementById("presentacion-menu")
        .addEventListener("change", actualizarPrecioProductoMenu);

    document
        .getElementById("gustos-menu")
        .addEventListener("change", actualizarPrecioProductoMenu);

    document
        .getElementById("cantidad-producto")
        .addEventListener("input", actualizarPrecioProductoMenu);

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
        .getElementById("pago")
        .addEventListener("input", actualizarVisibilidadVuelto);

    document
        .getElementById("pago")
        .addEventListener("change", actualizarVisibilidadVuelto);

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
    actualizarVisibilidadVuelto();

}

function actualizarVisibilidadVuelto() {

    const campo = document.getElementById("campo-vuelto");
    const input = document.getElementById("pago");
    const esEfectivo = String(input.value || "").trim().toLowerCase() === "efectivo";

    campo.hidden = !esEfectivo;

    if (!esEfectivo) {
        document.getElementById("cambio").value = "";
    }

    actualizarPreviewDesdeFormulario();

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
    agregarProductoDesdeMenu();

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
    document.getElementById("imagen-whatsapp").value = "";
    actualizarEstadoOcr("");

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

async function interpretarMensaje() {

    let texto = document
        .getElementById("mensaje")
        .value
        .trim();
    const imagen = document.getElementById("imagen-whatsapp").files[0];

    if (imagen) {

        try {

            actualizarEstadoOcr("Leyendo imagen...");
            texto = await OcrService.reconocerImagen(imagen, actualizarEstadoOcr);
            document.getElementById("mensaje").value = texto;

        } catch (e) {

            console.error(e);
            actualizarEstadoOcr("No se pudo leer la imagen.");
            alert("No se pudo ejecutar OCR. Podés pegar el texto manualmente.");
            return;

        }

    }

    if (!texto) {
        alert("Pegá un mensaje o seleccioná una imagen.");
        return;
    }

    actualizarEstadoOcr("Interpretando pedido...");
    const pedidoInterpretado = interpretarPedido(texto);
    poblarFormulario(pedidoInterpretado);
    cerrarFlujoWhatsApp();
    pedidoSeleccionadoId = null;
    actualizarPreviewDesdeFormulario();

}

function actualizarEstadoOcr(mensaje) {

    const estado = document.getElementById("ocr-estado");

    if (estado) {
        estado.textContent = mensaje || "";
    }

}

function limpiarEstadoOcr() {

    actualizarEstadoOcr("");

}

function poblarFormulario(datos) {

    if (datos.tipoPedido) {
        estadoFormulario.tipoPedido = datos.tipoPedido;
    } else if (datos.mesa) {
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
    document.getElementById("cambio").value = datos.cambio || "";
    document.getElementById("observaciones").value = datos.observaciones || "";
    document.getElementById("notas-cliente").value = "";
    actualizarVisibilidadVuelto();

    estadoFormulario.items = normalizarItemsDesdeTexto(datos.pedido);
    renderizarProductos();

}

function normalizarItemsDesdeTexto(texto) {

    return String(texto || "")
        .split("\n")
        .map(linea => linea.trim())
        .filter(Boolean)
        .map((linea, index) => crearItemDesdeTexto(linea, index));

}

function crearItemDesdeTexto(linea, index) {

    const cantidad = extraerCantidadLinea(linea);
    const descripcion = limpiarCantidadLinea(linea);
    const itemCatalogo = resolverItemCatalogoDesdeTexto(descripcion, cantidad);

    if (itemCatalogo) {
        return itemCatalogo;
    }

    return normalizarItemPedido({
        id: crearIdItemPedido(index),
        nombre: descripcion,
        cantidad,
        observaciones: ""
    }, index);

}

function extraerCantidadLinea(linea) {

    const coincidencia = String(linea || "").trim().match(/^(\d+)\s*x?\s+/i);

    return coincidencia
        ? normalizarCantidad(coincidencia[1])
        : 1;

}

function limpiarCantidadLinea(linea) {

    return String(linea || "")
        .trim()
        .replace(/^(\d+)\s*x?\s+/i, "")
        .trim();

}

function resolverItemCatalogoDesdeTexto(texto, cantidad) {

    if (!estadoFormulario.menuListo || !texto) {
        return null;
    }

    const productos = MenuService.buscar(texto);

    if (productos.length !== 1) {
        return null;
    }

    const producto = productos[0];
    const presentacion = resolverPresentacionDesdeTexto(producto, texto);

    if (!presentacion) {
        return null;
    }

    return crearItemPedido({
        producto,
        presentacion,
        cantidad,
        gustos: resolverGustosDesdeTexto(texto)
    });

}

function resolverPresentacionDesdeTexto(producto, texto) {

    const normalizado = normalizarTexto(texto);
    const presentaciones = producto.presentaciones || [];
    const mencionada = presentaciones.find(presentacion =>
        normalizado.includes(normalizarTexto(presentacion.nombre)) ||
        normalizado.includes(normalizarTexto(presentacion.id))
    );

    return mencionada || (presentaciones.length === 1 ? presentaciones[0] : null);

}

function resolverGustosDesdeTexto(texto) {

    const normalizado = normalizarTexto(texto);

    return MenuService.getGustos()
        .filter(gusto =>
            normalizado.includes(normalizarTexto(gusto.nombre)) ||
            normalizado.includes(normalizarTexto(gusto.id))
        )
        .map(gusto => ({
            id: gusto.id,
            nombre: gusto.nombre
        }));

}

function renderizarSelectorMenu() {

    const categorias = MenuService.getCategorias();
    const selectCategoria = document.getElementById("categoria-menu");

    selectCategoria.innerHTML = categorias
        .map(categoria => `
            <option value="${escaparHtml(categoria.id)}">${escaparHtml(categoria.nombre)}</option>
        `)
        .join("");

    manejarCambioCategoriaMenu();

}

function bloquearSelectorMenu(mensaje) {

    ["categoria-menu", "producto-menu", "presentacion-menu", "cantidad-producto", "agregar-producto"]
        .forEach(id => {
            const campo = document.getElementById(id);

            if (campo) {
                campo.disabled = true;
            }
        });

    document.getElementById("gustos-menu").innerHTML = "";
    document.getElementById("precio-producto").textContent = mensaje;

}

function manejarCambioCategoriaMenu() {

    const categoriaId = document.getElementById("categoria-menu").value;
    const productos = MenuService.getProductosPorCategoria(categoriaId)
        .filter(producto => producto.disponible !== false);

    document.getElementById("producto-menu").innerHTML = productos
        .map(producto => `
            <option value="${escaparHtml(producto.id)}">${escaparHtml(producto.nombre)}</option>
        `)
        .join("");

    manejarCambioProductoMenu();

}

function manejarCambioProductoMenu() {

    const productoId = document.getElementById("producto-menu").value;
    const presentaciones = MenuService.getPresentaciones(productoId);

    document.getElementById("presentacion-menu").innerHTML = presentaciones
        .map(presentacion => `
            <option value="${escaparHtml(presentacion.id)}">${escaparHtml(presentacion.nombre)}</option>
        `)
        .join("");

    renderizarGustosMenu();
    actualizarPrecioProductoMenu();

}

function renderizarGustosMenu() {

    const producto = obtenerProductoMenuSeleccionado();
    const contenedor = document.getElementById("gustos-menu");

    if (!producto || !producto.permiteGustos) {
        contenedor.innerHTML = "";
        return;
    }

    const gustos = MenuService.getGustos();

    contenedor.innerHTML = `
        <span>Gustos</span>
        <div class="taste-options">
            ${gustos.map(gusto => `
                <label>
                    <input type="checkbox" value="${escaparHtml(gusto.id)}">
                    <span>${escaparHtml(gusto.nombre)}</span>
                </label>
            `).join("")}
        </div>
    `;

}

function actualizarPrecioProductoMenu() {

    const producto = obtenerProductoMenuSeleccionado();
    const presentacion = obtenerPresentacionMenuSeleccionada();
    const cantidad = obtenerCantidadProductoMenu();
    const gustos = obtenerGustosMenuSeleccionados();
    const precio = producto && presentacion
        ? MenuService.calcularPrecio(producto.id, presentacion.id, gustos.length)
        : 0;
    const subtotal = producto && presentacion
        ? MenuService.calcularSubtotal(producto.id, presentacion.id, gustos.length, cantidad)
        : 0;

    document.getElementById("precio-producto").textContent = precio
        ? `Unitario: $${precio} | Subtotal: $${subtotal}`
        : "";

}

function agregarProductoDesdeMenu() {

    if (!estadoFormulario.menuListo) {
        alert("El menu todavia no esta listo.");
        return;
    }

    const producto = obtenerProductoMenuSeleccionado();
    const presentacion = obtenerPresentacionMenuSeleccionada();
    const cantidad = obtenerCantidadProductoMenu();
    const gustos = obtenerGustosMenuSeleccionados();

    if (!producto || !presentacion) {
        return;
    }

    estadoFormulario.items.push(crearItemPedido({
        producto,
        presentacion,
        cantidad,
        gustos
    }));

    document.getElementById("cantidad-producto").value = "1";
    limpiarGustosMenu();
    actualizarPrecioProductoMenu();
    renderizarProductos();
    actualizarPreviewDesdeFormulario();
    document.getElementById("producto-menu").focus();

}

function crearItemPedido(datos) {

    const producto = MenuService.getProducto(datos.producto.id);
    const presentacion = obtenerPresentacionDeProducto(producto, datos.presentacion.id);
    const gustos = Array.isArray(datos.gustos) ? datos.gustos : [];
    const cantidad = normalizarCantidad(datos.cantidad);
    const precioUnitario = MenuService.calcularPrecio(
        producto.id,
        presentacion.id,
        gustos.length
    );
    const subtotal = MenuService.calcularSubtotal(
        producto.id,
        presentacion.id,
        gustos.length,
        cantidad
    );
    const item = {
        id: crearIdItemPedido(),
        categoriaId: producto.categoria,
        productoId: producto.id,
        nombre: nombreProductoParaPedido(producto, presentacion, gustos),
        presentacionId: presentacion.id,
        presentacion: presentacion.nombre,
        cantidad,
        gustos,
        observaciones: datos.observaciones || "",
        precioUnitario,
        subtotal
    };

    return item;

}

function obtenerPresentacionDeProducto(producto, presentacionId) {

    return (producto.presentaciones || [])
        .find(presentacion => presentacion.id === presentacionId) || null;

}

function crearIdItemPedido(sufijo) {

    const base = Date.now().toString(36);
    const extra = typeof sufijo === "undefined"
        ? Math.random().toString(36).slice(2, 8)
        : String(sufijo);

    return `item_${base}_${extra}`;

}

function obtenerProductoMenuSeleccionado() {

    const id = document.getElementById("producto-menu").value;
    return id ? MenuService.getProducto(id) : null;

}

function obtenerPresentacionMenuSeleccionada() {

    const producto = obtenerProductoMenuSeleccionado();
    const id = document.getElementById("presentacion-menu").value;

    if (!producto || !id) {
        return null;
    }

    return (producto.presentaciones || [])
        .find(presentacion => presentacion.id === id) || null;

}

function obtenerCantidadProductoMenu() {

    const cantidad = Number(document.getElementById("cantidad-producto").value || 1);
    return Math.max(1, Math.floor(cantidad));

}

function obtenerGustosMenuSeleccionados() {

    return Array.from(document.querySelectorAll("#gustos-menu input[type='checkbox']:checked"))
        .map(input => {
            const gusto = MenuService.getGustos()
                .find(item => item.id === input.value);

            return gusto
                ? { id: gusto.id, nombre: gusto.nombre }
                : { id: input.value, nombre: input.value };
        });

}

function limpiarGustosMenu() {

    document
        .querySelectorAll("#gustos-menu input[type='checkbox']")
        .forEach(input => {
            input.checked = false;
        });

}

function nombreProductoParaPedido(producto, presentacion, gustos) {

    const partes = [
        producto.nombre,
        presentacion && presentacion.nombre
    ].filter(Boolean);

    if (gustos.length > 0) {
        partes.push(gustos.map(gusto => gusto.nombre).join(", "));
    }

    return partes.join(" - ");

}

function manejarAccionProducto(event) {

    const boton = event.target.closest("[data-product-action]");

    if (!boton) {
        return;
    }

    const index = Number(boton.dataset.index);
    const item = estadoFormulario.items[index];

    if (!item) {
        return;
    }

    if (boton.dataset.productAction === "increase") {
        item.cantidad += 1;
        recalcularItemPedido(item);
    }

    if (boton.dataset.productAction === "decrease") {
        item.cantidad -= 1;
        recalcularItemPedido(item);
    }

    if (boton.dataset.productAction === "remove" || item.cantidad <= 0) {
        estadoFormulario.items.splice(index, 1);
    }

    renderizarProductos();
    actualizarPreviewDesdeFormulario();

}

function recalcularItemPedido(item) {

    if (item) {
        item.cantidad = normalizarCantidad(item.cantidad);
        item.subtotal = MenuService.calcularSubtotalPorCantidad(item.precioUnitario, item.cantidad);
    }

    return item;

}

function normalizarCantidad(cantidad) {

    return Math.max(1, Math.floor(Number(cantidad || 1)));

}

function renderizarProductos() {

    const lista = document.getElementById("lista-productos");

    if (estadoFormulario.items.length === 0) {
        lista.innerHTML = "<p class='vacio'>Todavía no hay productos.</p>";
        return;
    }

    lista.innerHTML = estadoFormulario.items
        .map((item, index) => `
            <div class="product-row">
                <div>
                    <strong>${escaparHtml(item.cantidad)}x ${escaparHtml(item.nombre)}</strong>
                    ${item.precioUnitario ? `<small>$${escaparHtml(item.precioUnitario)} c/u - subtotal $${escaparHtml(item.subtotal)}</small>` : ""}
                    ${item.observaciones ? `<small>${escaparHtml(item.observaciones)}</small>` : ""}
                </div>
                <div class="quantity-controls">
                    <button type="button" data-product-action="decrease" data-index="${index}" aria-label="Disminuir ${escaparHtml(item.nombre)}">-</button>
                    <button type="button" data-product-action="increase" data-index="${index}" aria-label="Aumentar ${escaparHtml(item.nombre)}">+</button>
                    <button type="button" data-product-action="remove" data-index="${index}" aria-label="Quitar ${escaparHtml(item.nombre)}">Quitar</button>
                </div>
            </div>
        `)
        .join("");

}

function nuevoPedido() {

    document.getElementById("formulario-pedido").reset();
    estadoFormulario.tipoPedido = "delivery";
    estadoFormulario.items = [];
    pedidoActual = null;
    pedidoSeleccionadoId = null;
    pedidoVisible = null;

    sincronizarVistaFormulario();
    if (estadoFormulario.menuListo) {
        renderizarSelectorMenu();
    }
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
    const items = normalizarItemsPedido(estadoFormulario.items);
    const totales = calcularTotalesPedido(items);
    const pedido = crearTextoPedidoCompatibilidad(items);

    return {
        firestoreId: pedidoActual && pedidoActual.firestoreId ? pedidoActual.firestoreId : null,
        id: pedidoActual && pedidoActual.id ? pedidoActual.id : null,
        numero: pedidoActual && pedidoActual.numero ? pedidoActual.numero : null,
        fecha: pedidoActual && pedidoActual.fecha ? pedidoActual.fecha : null,
        tipoPedido: tipo,
        tipo: etiquetaTipoPedido(tipo),
        cliente: document.getElementById("cliente").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        mesa,
        direccion: ubicacion,
        referencia: tipo === "delivery" ? referencia : "",
        items,
        subtotal: totales.subtotal,
        descuentos: totales.descuentos,
        total: totales.total,
        estado: pedidoActual && pedidoActual.estado ? pedidoActual.estado : "Nuevo",
        pedido,
        productos: crearProductosCompatibilidad(items),
        pago: document.getElementById("pago").value.trim(),
        cambio: document.getElementById("cambio").value.trim(),
        observaciones: document.getElementById("observaciones").value.trim()
    };

}

function normalizarItemsPedido(items) {

    return (Array.isArray(items) ? items : [])
        .map((item, index) => normalizarItemPedido(item, index));

}

function normalizarItemPedido(item, index) {

    const cantidad = normalizarCantidad(item.cantidad);
    const precioUnitario = Number(item.precioUnitario || 0);
    const presentacion = typeof item.presentacion === "object"
        ? item.presentacion.nombre
        : item.presentacion;

    return {
        id: item.id || crearIdItemPedido(index),
        categoriaId: item.categoriaId || item.categoria || "",
        productoId: item.productoId || item.idProducto || "",
        nombre: item.nombre || "",
        presentacionId: item.presentacionId || (item.presentacion && item.presentacion.id) || "",
        presentacion: presentacion || "",
        cantidad,
        gustos: Array.isArray(item.gustos) ? item.gustos : [],
        observaciones: item.observaciones || item.observacion || "",
        precioUnitario,
        subtotal: MenuService.calcularSubtotalPorCantidad(precioUnitario, cantidad)
    };

}

function calcularTotalesPedido(items) {

    const subtotal = items.reduce((total, item) => total + Number(item.subtotal || 0), 0);
    const descuentos = 0;

    return {
        subtotal,
        descuentos,
        total: Math.max(0, subtotal - descuentos)
    };

}

function crearTextoPedidoCompatibilidad(items) {

    return items
        .map(item => `${item.cantidad}x ${item.nombre}`)
        .join("\n");

}

function crearProductosCompatibilidad(items) {

    return items.map(item => ({
        ...item,
        categoria: item.categoriaId,
        observacion: item.observaciones
    }));

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
        document.getElementById("producto-menu").focus();
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

    editarPedido(event);
    imprimirPedido(event);
    entregarPedido(event);
    cancelarPedido(event);

}

function editarPedido(event) {

    const boton = event.target.closest("[data-editar-pedido]");

    if (!boton || !pedidoVisible) {
        return;
    }

    cargarPedidoEnFormulario(pedidoVisible);

}

function cargarPedidoEnFormulario(pedido) {

    const tipoPedido = pedido.tipoPedido || inferirTipoPedido(pedido);

    pedidoActual = pedido;
    pedidoSeleccionadoId = pedido.firestoreId || pedido.id || null;
    estadoFormulario.tipoPedido = tipoPedido;

    sincronizarVistaFormulario();

    document.getElementById("telefono").value = pedido.telefono || "";
    document.getElementById("cliente").value = pedido.cliente || "";
    document.getElementById("direccion").value = tipoPedido === "dine-in" ? "" : pedido.direccion || "";
    document.getElementById("referencia").value = pedido.referencia || "";
    document.getElementById("mesa").value = pedido.mesa || (tipoPedido === "dine-in" ? pedido.direccion || "" : "");
    document.getElementById("pago").value = pedido.pago || "";
    document.getElementById("cambio").value = pedido.cambio || "";
    document.getElementById("observaciones").value = pedido.observaciones || "";
    document.getElementById("notas-cliente").value = "";
    actualizarVisibilidadVuelto();

    if (Array.isArray(pedido.items) && pedido.items.length > 0) {
        estadoFormulario.items = normalizarItemsPedido(pedido.items);
    } else if (Array.isArray(pedido.productos) && pedido.productos.length > 0) {
        estadoFormulario.items = normalizarItemsPedido(pedido.productos);
    } else {
        estadoFormulario.items = normalizarItemsDesdeTexto(pedido.pedido);
    }

    renderizarProductos();
    actualizarPreviewDesdeFormulario();
    document.getElementById("cliente").focus();

}

function inferirTipoPedido(pedido) {

    if (pedido.mesa || pedido.tipo === "Salon") {
        return "dine-in";
    }

    if (!pedido.direccion) {
        return "pickup";
    }

    return "delivery";

}

function imprimirPedido(event) {

    const botonCocina = event.target.closest("[data-imprimir-cocina]");
    const botonCaja = event.target.closest("[data-imprimir-caja]");

    if (!botonCocina && !botonCaja) {
        return;
    }

    if (botonCaja) {
        TicketPrinter.imprimirCaja(pedidoVisible);
        return;
    }

    TicketPrinter.imprimirCocina(pedidoVisible);

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

async function cancelarPedido(event) {

    const boton = event.target.closest("[data-cancelar-id]");

    if (!boton) {
        return;
    }

    boton.disabled = true;

    try {

        await Storage.marcarCancelado(boton.dataset.cancelarId);

    } catch (e) {

        console.error(e);
        alert("No se pudo cancelar el pedido.");
        boton.disabled = false;

    }

}
