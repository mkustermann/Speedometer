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
      _38: x0 => new Array(x0),
      _43: (x0,x1,x2) => x0[x1] = x2,
      _47: (x0,x1,x2) => new DataView(x0,x1,x2),
      _50: x0 => new Int8Array(x0),
      _51: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _52: x0 => new Uint8Array(x0),
      _55: x0 => new Uint8ClampedArray(x0),
      _58: x0 => new Int16Array(x0),
      _60: x0 => new Uint16Array(x0),
      _62: x0 => new Int32Array(x0),
      _64: x0 => new Uint32Array(x0),
      _67: x0 => new Float32Array(x0),
      _70: x0 => new Float64Array(x0),
      _85: () => {
        let stackString = new Error().stack.toString();
        let frames = stackString.split('\n');
        let drop = 2;
        if (frames[0] === 'Error') {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _115: s => JSON.stringify(s),
      _116: s => printToConsole(s),
      _119: Function.prototype.call.bind(String.prototype.toLowerCase),
      _125: Function.prototype.call.bind(String.prototype.indexOf),
      _128: Object.is,
      _145: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _146: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _147: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _148: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _149: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _150: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _151: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _154: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _155: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _156: (t, s) => t.set(s),
      _158: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _160: o => o.buffer,
      _161: o => o.byteOffset,
      _162: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _163: (b, o) => new DataView(b, o),
      _164: (b, o, l) => new DataView(b, o, l),
      _165: Function.prototype.call.bind(DataView.prototype.getUint8),
      _166: Function.prototype.call.bind(DataView.prototype.setUint8),
      _167: Function.prototype.call.bind(DataView.prototype.getInt8),
      _168: Function.prototype.call.bind(DataView.prototype.setInt8),
      _169: Function.prototype.call.bind(DataView.prototype.getUint16),
      _170: Function.prototype.call.bind(DataView.prototype.setUint16),
      _171: Function.prototype.call.bind(DataView.prototype.getInt16),
      _172: Function.prototype.call.bind(DataView.prototype.setInt16),
      _173: Function.prototype.call.bind(DataView.prototype.getUint32),
      _174: Function.prototype.call.bind(DataView.prototype.setUint32),
      _175: Function.prototype.call.bind(DataView.prototype.getInt32),
      _176: Function.prototype.call.bind(DataView.prototype.setInt32),
      _181: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _182: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _183: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _184: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _211: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _219: (x0,x1) => x0.createElement(x1),
      _222: f => finalizeWrapper(f, function(x0) { return dartInstance.exports._222(f,arguments.length,x0) }),
      _224: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _225: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _233: x0 => x0.preventDefault(),
      _234: (x0,x1) => x0.item(x1),
      _235: (x0,x1,x2) => x0.createElementNS(x1,x2),
      _236: (x0,x1) => x0.item(x1),
      _237: (x0,x1,x2) => x0.replaceChild(x1,x2),
      _238: (x0,x1) => x0.append(x1),
      _239: (x0,x1) => x0.item(x1),
      _240: (x0,x1) => x0.removeAttribute(x1),
      _241: x0 => new Text(x0),
      _242: (x0,x1) => x0.replaceWith(x1),
      _243: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _244: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _245: (x0,x1) => x0.removeChild(x1),
      _246: (x0,x1) => x0.removeChild(x1),
      _247: (x0,x1) => x0.hasAttribute(x1),
      _248: (x0,x1) => x0.removeAttribute(x1),
      _249: (x0,x1) => x0.getAttribute(x1),
      _250: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _251: (x0,x1) => x0.querySelector(x1),
      _269: (x0,x1) => x0.item(x1),
      _293: o => o === undefined,
      _312: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _316: (l, r) => l === r,
      _317: o => o,
      _318: o => o,
      _319: o => o,
      _320: b => !!b,
      _321: o => o.length,
      _324: (o, i) => o[i],
      _325: f => f.dartFunction,
      _332: (o, p) => o[p],
      _336: o => String(o),
      _338: o => {
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
      _353: x0 => new ArrayBuffer(x0),
      _372: x0 => x0.random(),
      _373: x0 => x0.random(),
      _377: () => globalThis.Math,
      _380: Function.prototype.call.bind(Number.prototype.toString),
      _381: Function.prototype.call.bind(BigInt.prototype.toString),
      _382: Function.prototype.call.bind(Number.prototype.toString),
      _1464: x0 => x0.checked,
      _1471: x0 => x0.files,
      _1514: x0 => x0.type,
      _1518: x0 => x0.value,
      _1519: (x0,x1) => x0.value = x1,
      _1520: x0 => x0.valueAsDate,
      _1522: x0 => x0.valueAsNumber,
      _1607: x0 => x0.selectedOptions,
      _1610: x0 => x0.value,
      _1611: (x0,x1) => x0.value = x1,
      _1630: x0 => x0.value,
      _1669: x0 => x0.value,
      _4919: x0 => x0.target,
      _4971: x0 => x0.length,
      _4974: x0 => x0.length,
      _5026: x0 => x0.parentNode,
      _5028: x0 => x0.childNodes,
      _5029: x0 => x0.firstChild,
      _5031: x0 => x0.previousSibling,
      _5032: x0 => x0.nextSibling,
      _5035: x0 => x0.textContent,
      _5036: (x0,x1) => x0.textContent = x1,
      _5040: () => globalThis.document,
      _5478: x0 => x0.namespaceURI,
      _5481: x0 => x0.tagName,
      _5489: x0 => x0.attributes,
      _5618: x0 => x0.length,
      _5622: x0 => x0.name,
      _12012: () => globalThis.Element,
      _12013: () => globalThis.HTMLInputElement,
      _12014: () => globalThis.HTMLAnchorElement,
      _12015: () => globalThis.HTMLSelectElement,
      _12016: () => globalThis.HTMLTextAreaElement,
      _12017: () => globalThis.HTMLOptionElement,
      _12018: () => globalThis.Text,

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
"Null check operator used on a null value",
"Concurrent modification during iteration: ",
".",
"body",
"Future already completed",
"onError",
"Error handler must accept one Object or one Object and a StackTrace as arguments, and return a value of the returned future's type",
"Null",
"Never",
"Cannot complete a future with itself",
"The error handler of Future.then must return a value of the returned future's type",
"The error handler of Future.catchError must return a value of the future's type",
"_stackTrace=",
"{...}",
"NoSuchMethodError: method not found: '",
"'\n",
"Receiver: ",
"\n",
"Arguments: [",
"Type '",
"' is not a subtype of type '",
" in type cast",
"Symbol(\"",
"\")",
":",
"s",
"@",
",",
"=",
"IndexError (details omitted due to --minify)",
"_stackTrace",
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
"call",
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
"isActive",
"todo",
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
"toggle-all-container",
"toggle-all",
"checked",
"toggle-all-label",
"for",
"Mark all as complete",
"todo-list",
"completed",
"data-id",
"view",
"toggle",
"-",
"destroy",
"todo-count",
" item",
" left",
"filters",
"All",
"Active",
"Completed",
"selected",
"clear-completed",
"Clear completed",
"section",
"midFrameCallback",
"postFrameCallbacks",
"idle",
"Error on rebuilding component: ",
"defunct",
"SchedulerPhase.",
"span",
"strong",
"ul",
"li",
"autofocus",
"disabled",
"<'",
"'>",
"label",
"type",
"isActive: ",
"todo: ",
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
