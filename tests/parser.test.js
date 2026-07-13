const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const parserPath = path.join(__dirname, '..', 'js', 'parser.js');
const parserSource = fs.readFileSync(parserPath, 'utf8');

const context = { console, String, Array, Object, RegExp, Date, Math };
vm.createContext(context);
vm.runInContext(parserSource, context);

const texto = [
  'Cliente: Ana',
  'Telefono: 1122334455',
  'Direccion: Av Siempre Viva 123',
  'Pedido:',
  '2x Muzzarella',
  '1x Pepsi',
  'Observaciones: sin cebolla'
].join('\n');

const resultado = context.interpretarPedido(texto);

assert.strictEqual(resultado.cliente, 'Ana');
assert.strictEqual(resultado.telefono, '1122334455');
assert.strictEqual(resultado.direccion, 'Av Siempre Viva 123');
assert.strictEqual(resultado.tipoPedido, 'delivery');
assert.ok(resultado.pedido.includes('2x Muzzarella'));
assert.strictEqual(resultado.observaciones, 'sin cebolla');

console.log('parser tests passed');
