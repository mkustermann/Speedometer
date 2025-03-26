// Compiles a dart2wasm-generated main module from `source` which can then
// instantiatable via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm modules from `bytes` which is then
// instantiatable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export async function instantiate(modulePromise, importObjectPromise) {
  var moduleOrCompiledApp = await modulePromise;
  if (!(moduleOrCompiledApp instanceof CompiledApp)) {
    moduleOrCompiledApp = new CompiledApp(moduleOrCompiledApp);
  }
  const instantiatedApp = await moduleOrCompiledApp.instantiate(await importObjectPromise);
  return instantiatedApp.instantiatedModule;
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export const invoke = (moduleInstance, ...args) => {
  moduleInstance.exports.$invokeMain(args);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredWasm` is a JS function that takes a module name matching a
  //   wasm file produced by the dart2wasm compiler and returns the bytes to
  //   load the module. These bytes can be in either a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  async instantiate(additionalImports, {loadDeferredWasm, loadDynamicModule} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + js;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            _4: (o, c) => o instanceof c,
      _37: x0 => new Array(x0),
      _42: (x0,x1,x2) => x0[x1] = x2,
      _45: (x0,x1,x2) => new DataView(x0,x1,x2),
      _47: x0 => new Int8Array(x0),
      _48: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _49: x0 => new Uint8Array(x0),
      _51: x0 => new Uint8ClampedArray(x0),
      _53: x0 => new Int16Array(x0),
      _55: x0 => new Uint16Array(x0),
      _57: x0 => new Int32Array(x0),
      _59: x0 => new Uint32Array(x0),
      _61: x0 => new Float32Array(x0),
      _63: x0 => new Float64Array(x0),
      _78: () => {
        let stackString = new Error().stack.toString();
        let frames = stackString.split('\n');
        let drop = 2;
        if (frames[0] === 'Error') {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _99: s => JSON.stringify(s),
      _100: s => printToConsole(s),
      _103: Function.prototype.call.bind(String.prototype.toLowerCase),
      _109: Function.prototype.call.bind(String.prototype.indexOf),
      _112: Object.is,
      _129: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _130: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _131: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _132: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _133: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _134: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _135: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _138: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _139: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _140: (t, s) => t.set(s),
      _142: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _144: o => o.buffer,
      _145: o => o.byteOffset,
      _146: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _147: (b, o) => new DataView(b, o),
      _148: (b, o, l) => new DataView(b, o, l),
      _149: Function.prototype.call.bind(DataView.prototype.getUint8),
      _150: Function.prototype.call.bind(DataView.prototype.setUint8),
      _151: Function.prototype.call.bind(DataView.prototype.getInt8),
      _152: Function.prototype.call.bind(DataView.prototype.setInt8),
      _153: Function.prototype.call.bind(DataView.prototype.getUint16),
      _154: Function.prototype.call.bind(DataView.prototype.setUint16),
      _155: Function.prototype.call.bind(DataView.prototype.getInt16),
      _156: Function.prototype.call.bind(DataView.prototype.setInt16),
      _157: Function.prototype.call.bind(DataView.prototype.getUint32),
      _158: Function.prototype.call.bind(DataView.prototype.setUint32),
      _159: Function.prototype.call.bind(DataView.prototype.getInt32),
      _160: Function.prototype.call.bind(DataView.prototype.setInt32),
      _165: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _166: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _167: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _168: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _190: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _198: (x0,x1) => x0.createElement(x1),
      _200: (x0,x1) => x0.querySelector(x1),
      _201: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._201(f,arguments.length,x0) }),
      _203: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _204: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _205: x0 => x0.preventDefault(),
      _212: (x0,x1) => x0.item(x1),
      _213: (x0,x1,x2) => x0.createElementNS(x1,x2),
      _214: (x0,x1) => x0.item(x1),
      _215: (x0,x1,x2) => x0.replaceChild(x1,x2),
      _216: (x0,x1) => x0.append(x1),
      _217: (x0,x1) => x0.removeAttribute(x1),
      _218: x0 => new Text(x0),
      _219: (x0,x1) => x0.replaceWith(x1),
      _220: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _221: (x0,x1) => x0.removeChild(x1),
      _222: (x0,x1) => x0.hasAttribute(x1),
      _223: (x0,x1) => x0.getAttribute(x1),
      _224: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _229: (x0,x1) => x0.item(x1),
      _247: o => o === undefined,
      _266: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _270: (l, r) => l === r,
      _271: o => o,
      _272: o => o,
      _273: o => o,
      _274: b => !!b,
      _275: o => o.length,
      _278: (o, i) => o[i],
      _279: f => f.dartFunction,
      _286: (o, p) => o[p],
      _290: o => String(o),
      _292: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        return 17;
      },
      _307: x0 => new ArrayBuffer(x0),
      _322: x0 => x0.random(),
      _325: () => globalThis.Math,
      _326: Function.prototype.call.bind(Number.prototype.toString),
      _327: Function.prototype.call.bind(BigInt.prototype.toString),
      _328: Function.prototype.call.bind(Number.prototype.toString),
      _1395: x0 => x0.checked,
      _1402: x0 => x0.files,
      _1445: x0 => x0.type,
      _1449: x0 => x0.value,
      _1450: (x0,x1) => x0.value = x1,
      _1451: x0 => x0.valueAsDate,
      _1453: x0 => x0.valueAsNumber,
      _1536: x0 => x0.selectedOptions,
      _1539: x0 => x0.value,
      _1540: (x0,x1) => x0.value = x1,
      _1559: x0 => x0.value,
      _1598: x0 => x0.value,
      _4732: x0 => x0.target,
      _4782: x0 => x0.length,
      _4784: x0 => x0.length,
      _4828: x0 => x0.parentNode,
      _4830: x0 => x0.childNodes,
      _4831: x0 => x0.firstChild,
      _4833: x0 => x0.previousSibling,
      _4834: x0 => x0.nextSibling,
      _4837: x0 => x0.textContent,
      _4838: (x0,x1) => x0.textContent = x1,
      _4842: () => globalThis.document,
      _5250: x0 => x0.namespaceURI,
      _5253: x0 => x0.tagName,
      _5261: x0 => x0.attributes,
      _5387: x0 => x0.length,
      _5391: x0 => x0.name,
      _11680: () => globalThis.Element,
      _11681: () => globalThis.HTMLInputElement,
      _11682: () => globalThis.HTMLAnchorElement,
      _11683: () => globalThis.HTMLSelectElement,
      _11684: () => globalThis.HTMLTextAreaElement,
      _11685: () => globalThis.HTMLOptionElement,
      _11686: () => globalThis.Text,

    };

    const baseImports = {
      dart2wasm: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
            s: [
        "Attempt to execute code removed by Dart AOT compiler (TFA)",
"Could not call main",
"null",
"",
" (",
")",
": ",
"Instance of '",
"'",
"Object?",
"Object",
"dynamic",
"void",
"Invalid top type kind",
"Invalid argument",
"(s)",
"0.0",
"-0.0",
"1.0",
"-1.0",
"NaN",
"-Infinity",
"Infinity",
"e",
".0",
"Infinity or NaN toInt",
"Unsupported operation: ",
"RangeError (details omitted due to --minify)",
"minified:Class",
"<",
", ",
">",
"?",
"T",
"true",
"false",
"JavaScriptError",
"[",
"]",
"...",
"Runtime type check failed (details omitted due to --minify)",
"Type parameter should have been substituted already.",
"Type argument substitution not supported for ",
"X",
" extends ",
"(",
"{",
"}",
" => ",
"Closure: ",
" ",
"FutureOr",
"required ",
"Type '",
"' is not a subtype of type '",
" in type cast",
"Null",
"Never",
"Null check operator used on a null value",
"Concurrent modification during iteration: ",
".",
"body",
"Future already completed",
"onError",
"Error handler must accept one Object or one Object and a StackTrace as arguments, and return a value of the returned future's type",
"Cannot complete a future with itself",
"The error handler of Future.then must return a value of the returned future's type",
"The error handler of Future.catchError must return a value of the future's type",
"AA==",
"{...}",
"NoSuchMethodError: method not found: '",
"'\n",
"Receiver: ",
"\n",
"Arguments: [",
"Symbol(\"",
"\")",
":",
"s",
"@",
",",
"=",
"IndexError (details omitted due to --minify)",
"AQ==",
"Bad state: ",
"active",
"_ElementLifecycle.",
"Field 'beforeStart' has already been initialized.",
"LateInitializationError: ",
"Expected integer value, but was not integer.",
"Unhandled dartifyRaw type case: ",
"(...)",
"IntegerDivisionByZeroException._stackTrace",
"Division resulted in non-finite value",
"IntegerDivisionByZeroException",
"Function?",
"Function",
"buffer",
"start",
"Invalid value",
": Not greater than or equal to ",
": Not in inclusive range ",
"..",
": Valid value range is empty",
": Only valid value is ",
"RangeError",
"Too few elements",
"index",
"Index out of range",
": index must not be negative",
": no indices are valid",
": index should be less than ",
"attachTarget",
"Field '",
"' has not been initialized.",
"attachBetween",
"initial",
"beforeStart",
"inactive",
"div",
"Error on building component: ",
"Error: ",
"svg",
"http://www.w3.org/2000/svg",
"math",
"http://www.w3.org/1998/Math/MathML",
"id",
"class",
"style",
"value",
"MapEntry(",
"; ",
"http://www.w3.org/1999/xhtml",
"Too few arguments passed. Expected 1 or more, got ",
" instead.",
"Ag==",
"elem",
"Local '",
"attributesToRemove",
"info",
"Double-click to edit a todo",
"Created by the Dart team",
"Part of ",
"http://todomvc.com",
"TodoMVC",
"footer",
"a",
"href",
"click",
"input",
"change",
"button",
"checkbox",
"color",
"date",
"datetime-local",
"dateTimeLocal",
"email",
"file",
"hidden",
"image",
"month",
"number",
"password",
"radio",
"range",
"reset",
"search",
"submit",
"tel",
"text",
"time",
"url",
"week",
"InputType.",
"p",
"all",
"DisplayState.",
"root",
"todoapp",
"header",
"data-testid",
"todos",
"input-container",
"main",
"display",
"none;",
"block;",
"todo-list",
"completed",
"filters",
"All",
"Active",
"Completed",
"selected",
"clear-completed",
"Clear completed",
"section",
"autofocus",
"disabled",
"midFrameCallback",
"postFrameCallbacks",
"idle",
"Error on rebuilding component: ",
"defunct",
"SchedulerPhase.",
"li",
"span",
"todo-count",
" item",
" left",
"strong",
"ul",
"data-id",
"view",
"toggle",
"-",
"checked",
"destroy",
"label",
"type",
"<'",
"'>",
"toggle-all-container",
"toggle-all",
"toggle-all-label",
"for",
"Mark all as complete",
"new-todo",
"placeholder",
"What needs to be done?",
"h1"
      ],

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s == '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
