const TicketPrinter = {

    imprimir(pedido) {

        if (!pedido) {
            alert("No hay ningun pedido para imprimir.");
            return;
        }

        const ventana = window.open("", "_blank", "width=380,height=640");

        if (!ventana) {
            alert("El navegador bloqueo la ventana de impresion.");
            return;
        }

        ventana.document.open();
        ventana.document.write(this.generarDocumento(pedido));
        ventana.document.close();

        ventana.onload = () => {
            ventana.focus();
            ventana.print();
            ventana.close();
        };

    },

    generarDocumento(pedido) {

        const items = (pedido.pedido || "")
            .split("\n")
            .filter(item => item.trim() !== "")
            .map(item => `<li>${this.escaparHtml(item)}</li>`)
            .join("");
        const ubicacionEtiqueta = pedido.tipoPedido === "dine-in" ? "Mesa" : "Dirección";
        const referencia = pedido.referencia
            ? `<div class="fila"><span class="etiqueta">Referencia:</span> ${this.escaparHtml(pedido.referencia)}</div>`
            : "";

        return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Ticket pedido ${this.escaparHtml(this.numeroPedido(pedido))}</title>
<style>
@page {
    size: 58mm auto;
    margin: 0;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    background: #fff;
    color: #000;
    font-family: "Courier New", monospace;
    font-size: 10.5px;
    line-height: 1.2;
}

.ticket {
    width: 58mm;
    padding: 3mm 2.5mm;
}

h1 {
    margin: 0 0 1mm;
    text-align: center;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 0;
}

.centrado {
    text-align: center;
}

.tipo {
    margin-top: 1mm;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
}

.linea {
    border-top: 1px dashed #000;
    margin: 2mm 0;
}

.fila {
    margin-bottom: 1mm;
}

.etiqueta {
    font-weight: bold;
}

ul {
    margin: 1mm 0 0;
    padding-left: 3.5mm;
}

li {
    margin-bottom: .8mm;
}
</style>
</head>
<body>
<div class="ticket">
    <h1>PEDIDO #${this.escaparHtml(this.numeroPedido(pedido))}</h1>
    <div class="tipo">${this.escaparHtml(this.tipoPedido(pedido))}</div>
    <div class="centrado">${this.escaparHtml(this.fechaPedido(pedido))}</div>

    <div class="linea"></div>

    <div class="fila"><span class="etiqueta">Cliente:</span> ${this.escaparHtml(pedido.cliente)}</div>
    <div class="fila"><span class="etiqueta">Telefono:</span> ${this.escaparHtml(pedido.telefono)}</div>
    <div class="fila"><span class="etiqueta">${ubicacionEtiqueta}:</span> ${this.escaparHtml(pedido.direccion)}</div>
    ${referencia}

    <div class="linea"></div>

    <div class="fila etiqueta">Pedido:</div>
    <ul>${items}</ul>

    <div class="linea"></div>

    <div class="fila"><span class="etiqueta">Pago:</span> ${this.escaparHtml(pedido.pago)}</div>
    <div class="fila"><span class="etiqueta">Vuelto para:</span> ${this.escaparHtml(pedido.cambio)}</div>
    <div class="fila"><span class="etiqueta">Notas:</span> ${this.escaparHtml(pedido.observaciones)}</div>
</div>
</body>
</html>`;

    },

    numeroPedido(pedido) {

        return pedido.id || pedido.firestoreId || "";

    },

    fechaPedido(pedido) {

        return pedido.fecha || new Date().toLocaleString("es-UY");

    },

    tipoPedido(pedido) {

        return pedido.tipo || pedido.tipoPedido || pedido.orderType || "";

    },

    escaparHtml(valor) {

        return String(valor || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

};
