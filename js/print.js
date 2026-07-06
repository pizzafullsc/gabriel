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
    font-size: 11px;
    line-height: 1.25;
}

.ticket {
    width: 58mm;
    padding: 4mm 3mm;
}

h1 {
    margin: 0 0 3mm;
    text-align: center;
    font-size: 16px;
    letter-spacing: 0;
}

.centrado {
    text-align: center;
}

.linea {
    border-top: 1px dashed #000;
    margin: 3mm 0;
}

.fila {
    margin-bottom: 1.5mm;
}

.etiqueta {
    font-weight: bold;
}

ul {
    margin: 1.5mm 0 0;
    padding-left: 4mm;
}

li {
    margin-bottom: 1mm;
}
</style>
</head>
<body>
<div class="ticket">
    <h1>GABRIEL</h1>
    <div class="centrado">Pedido #${this.escaparHtml(this.numeroPedido(pedido))}</div>
    <div class="centrado">${this.escaparHtml(this.fechaPedido(pedido))}</div>

    <div class="linea"></div>

    <div class="fila"><span class="etiqueta">Cliente:</span> ${this.escaparHtml(pedido.cliente)}</div>
    <div class="fila"><span class="etiqueta">Telefono:</span> ${this.escaparHtml(pedido.telefono)}</div>
    <div class="fila"><span class="etiqueta">Direccion:</span> ${this.escaparHtml(pedido.direccion)}</div>

    <div class="linea"></div>

    <div class="fila etiqueta">Pedido:</div>
    <ul>${items}</ul>

    <div class="linea"></div>

    <div class="fila"><span class="etiqueta">Pago:</span> ${this.escaparHtml(pedido.pago)}</div>
    <div class="fila"><span class="etiqueta">Cambio:</span> ${this.escaparHtml(pedido.cambio)}</div>
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

    escaparHtml(valor) {

        return String(valor || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

};
