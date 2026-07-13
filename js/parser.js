function normalizarTexto(valor) {

    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

}

function extraerCampo(texto, campos) {

    const nombres = Array.isArray(campos) ? campos : [campos];
    const lineas = String(texto || "").split(/\r?\n/);
    const etiquetasBuscadas = nombres.map(normalizarTexto);
    const etiquetasConocidas = [
        "cliente",
        "nombre",
        "name",
        "celular",
        "telefono",
        "phone",
        "direccion",
        "address",
        "referencia",
        "reference",
        "pedido",
        "productos",
        "order",
        "pago",
        "payment",
        "cambio",
        "observaciones",
        "notas",
        "notes",
        "mesa",
        "table",
        "tipo",
        "tipo de pedido"
    ];

    let capturando = false;
    const resultado = [];

    for (const linea of lineas) {

        const separador = linea.indexOf(":");

        if (separador > -1) {

            const etiqueta = normalizarTexto(linea.slice(0, separador).trim());
            const valor = linea.slice(separador + 1).trim();

            if (etiquetasBuscadas.includes(etiqueta)) {
                capturando = true;
                resultado.push(valor);
                continue;
            }

            if (capturando && etiquetasConocidas.includes(etiqueta)) {
                break;
            }

        }

        if (capturando) {
            resultado.push(linea.trim());
        }

    }

    return resultado.join("\n").trim();

}

const WhatsappParser = {

    interpretar(texto) {

        const original = String(texto || "");
        const normalizado = normalizarTexto(original);
        const telefonoLibre =
            (original.match(/(\+?\d[\d\s-]{7,})/) || [])[1]?.replace(/\s|-/g, "") || "";
        const direccionLibre =
            (original.match(/\b(?:av\.?|avenida|calle|ruta)?\s*[A-Za-z\s]+\s+\d{1,5}\b/) || [])[0] || "";
        const pedidoEtiquetado = extraerCampo(original, ["Pedido", "Productos", "Order"]);
        const mesa = extraerCampo(original, ["Mesa", "Table"]);
        const direccion = extraerCampo(original, ["Direccion", "Address"]) || direccionLibre;

        return {
            cliente: extraerCampo(original, ["Cliente", "Nombre", "Name"]),
            telefono: extraerCampo(original, ["Celular", "Telefono", "Phone"]) || telefonoLibre,
            direccion,
            referencia: extraerCampo(original, ["Referencia", "Reference"]),
            mesa,
            tipoPedido: this.detectarTipoPedido(normalizado, { mesa, direccion }),
            pedido: pedidoEtiquetado || original.trim(),
            pago: extraerCampo(original, ["Pago", "Payment"]) || this.detectarPago(normalizado),
            cambio: extraerCampo(original, ["Cambio"]),
            observaciones: extraerCampo(original, ["Observaciones", "Notas", "Notes"])
        };

    },

    detectarPago(texto) {

        if (texto.includes("transfer")) {
            return "Transferencia";
        }

        if (texto.includes("efectivo")) {
            return "Efectivo";
        }

        if (texto.includes("debito")) {
            return "Debito";
        }

        if (texto.includes("credito")) {
            return "Credito";
        }

        if (texto.includes("qr")) {
            return "Pago con QR";
        }

        return "";

    },

    detectarTipoPedido(texto, datos) {

        if (datos.mesa || texto.includes("salon") || texto.includes("mesa")) {
            return "dine-in";
        }

        if (texto.includes("retiro") || texto.includes("retira") || texto.includes("paso a buscar")) {
            return "pickup";
        }

        if (datos.direccion || texto.includes("delivery") || texto.includes("envio")) {
            return "delivery";
        }

        return "";

    }

};

function interpretarPedido(texto) {

    return WhatsappParser.interpretar(texto);

}
