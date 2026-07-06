const Clientes = {

    coleccion: null,

    iniciar() {

        if (typeof db !== "undefined") {
            this.coleccion = db.collection("clientes");
        }

    },

    normalizarTelefono(telefono) {

        return String(telefono || "")
            .replace(/\D/g, "")
            .trim();

    },

    async buscarPorTelefono(telefono) {

        const numero = this.normalizarTelefono(telefono);

        if (!numero || !this.coleccion)
            return null;

        try {

            const snapshot = await this.coleccion
                .where("telefono", "==", numero)
                .limit(1)
                .get();

            if (snapshot.empty)
                return null;

            const doc = snapshot.docs[0];

            return {
                id: doc.id,
                ...doc.data()
            };

        } catch (e) {

            console.error(e);
            return null;

        }

    },

    async guardarDesdePedido(datos) {

        if (!this.coleccion)
            return null;

        const telefono = this.normalizarTelefono(datos.telefono);

        if (!telefono)
            return null;

        const ahora = new Date().toISOString();
        const datosCliente = {
            telefono,
            nombre: datos.nombre || "",
            direccion: datos.direccion || "",
            referencia: datos.referencia || "",
            observaciones: datos.observaciones || "",
            ultimaCompra: ahora
        };

        try {

            const snapshot = await this.coleccion
                .where("telefono", "==", telefono)
                .limit(1)
                .get();

            if (snapshot.empty) {

                await this.coleccion.add({
                    ...datosCliente,
                    creadoEn: ahora,
                    cantidadPedidos: 1
                });

                return { creado: true };

            }

            const doc = snapshot.docs[0];
            const actual = doc.data() || {};
            const cambios = {};

            if (String(actual.nombre || "") !== String(datosCliente.nombre)) {
                cambios.nombre = datosCliente.nombre;
            }

            if (String(actual.direccion || "") !== String(datosCliente.direccion)) {
                cambios.direccion = datosCliente.direccion;
            }

            if (String(actual.referencia || "") !== String(datosCliente.referencia)) {
                cambios.referencia = datosCliente.referencia;
            }

            if (String(actual.observaciones || "") !== String(datosCliente.observaciones)) {
                cambios.observaciones = datosCliente.observaciones;
            }

            cambios.ultimaCompra = ahora;
            cambios.cantidadPedidos = (Number(actual.cantidadPedidos) || 0) + 1;

            if (!actual.creadoEn) {
                cambios.creadoEn = ahora;
            }

            if (Object.keys(cambios).length > 0) {
                await this.coleccion.doc(doc.id).update(cambios);
            }

            return { creado: false };

        } catch (e) {

            console.error(e);
            return null;

        }

    }

};

Clientes.iniciar();