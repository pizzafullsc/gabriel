const Clientes = {

    coleccion: null,

    iniciar() {

        if (typeof db !== "undefined") {
            this.coleccion = db.collection("clientes");
        }

    },

    async buscarPorTelefono(telefono) {

        if (!telefono || !this.coleccion)
            return null;

        try {

            const doc = await this.coleccion.doc(telefono).get();

            if (!doc.exists)
                return null;

            return doc.data();

        } catch (e) {

            console.error(e);
            return null;

        }

    },

    async guardar(datos) {

        if (!this.coleccion)
            return;

        if (!datos.telefono)
            return;

        const cliente = {

            nombre: datos.cliente,
            telefono: datos.telefono,
            direcciones: [
                datos.direccion
            ],
            observaciones: "",
            fechaAlta: new Date().toISOString(),
            ultimaCompra: new Date().toISOString()

        };

        await this.coleccion
            .doc(datos.telefono)
            .set(cliente, { merge: true });

    }

};

Clientes.iniciar();