import { generateKeyPairSync } from "crypto";
import * as ot from "./oblivious-transfer";
import { getJwkInt, getNthBit } from "./utils";
import { InputValue } from "./circuit/gates";
import { Circuit, garbleCircuit, GarbledTable, Labels, NamedLabel } from "./circuit/garble";
import {
  evalGarbledCircuit,
  resolveOutputLabels,
  NamedInputOutput,
} from "./circuit/evaluate";
import { parseVerilog } from "./verilog";

// In practice this would be multiple steps as only Alice knows labelledCircuit
// and only Bob knows his input
function doObliviousTransfer(
  labelledCircuit: Labels, // Alice
  inputName: string, // Bob
  inputValue: InputValue, // Bob
) {
  console.log(`oblivious transfer -> value:${inputName}=${inputValue}`);

  // ALICE
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  const pubkey = publicKey.export({ format: "jwk" });
  const privkey = privateKey.export({ format: "jwk" });

  const m0 = Buffer.from(labelledCircuit[inputName][0], "utf-8");
  const m1 = Buffer.from(labelledCircuit[inputName][1], "utf-8");

  const e = getJwkInt(pubkey.e as string);
  const N = getJwkInt(pubkey.n as string);
  const d = getJwkInt(privkey.d as string);

  const { x0, x1 } = ot.otSend1();

  // BOB
  const { v, k } = ot.otRecv1(inputValue, e, N, x0, x1);

  // ALICE
  const { m0k, m1k } = ot.otSend2(d, N, x0, x1, v, m0, m1);

  // BOB
  const m = ot.otRecv2(inputValue, N, k, m0k, m1k);
  return m.toString("utf-8");
}

// const { circuit, outputNames } = parseVerilog("../verilog/dotproduct/out.v");
const { circuit, outputNames } = parseVerilog("../verilog/millionaire/out.v");

const aliceInit2pc = () => {
    // ALICE
    const {
    labelledCircuit,
    garbledCircuit, // -> Alice will send to Bob
    } = garbleCircuit(circuit);
    // TODO(Curtis): send via bluetooth

    const aliceWealth = 2e6;
    const aliceInputs: NamedInputOutput = {};
    for (let i = 0; i < 32; i++) {
    aliceInputs[`A_${i}`] = getNthBit(aliceWealth, i);
    }

    const aliceInputLabels = Object.entries(aliceInputs).reduce(
    (inputs: NamedLabel, [name, value]) => {
        inputs[name] = labelledCircuit[name][value];
        return inputs;
    },
    {},
    );

    console.log(`alice inputs -> ${JSON.stringify(aliceInputs)}`);
    console.log(`alice input labels -> ${JSON.stringify(aliceInputLabels)}`);
}

const receive2pcReq = (labelledCircuit: Labels, aliceInputLabels: NamedLabel, garbledCircuit: GarbledTable[]) => {
    // BOB
    const bobWealth = 1e6;
    const bobInputs: NamedInputOutput = {};
    for (let i = 0; i < 32; i++) {
    bobInputs[`B_${i}`] = getNthBit(bobWealth, i);
    }

    const bobInputLabels = Object.entries(bobInputs).reduce(
    (inputs: NamedLabel, [name, value]) => {
        // TODO(Curtis): send via bluetooth
        inputs[name] = doObliviousTransfer(labelledCircuit, name, value);
        return inputs;
    },
    {},
    );

    console.log(`bob inputs -> ${JSON.stringify(bobInputs)}`);
    console.log(`bob input labels -> ${JSON.stringify(bobInputLabels)}`);

    // garbledCircuit and aliceInputLabels received from Alice
    // bobInputLabels received from Alice via oblivious transfer
    const outputLabels = evalGarbledCircuit(
    garbledCircuit,
    { ...aliceInputLabels, ...bobInputLabels },
    circuit,
    ); // -> Bob will send to Alice
    // TODO(Curtis): send via bluetooth
    console.log("output labels ->", JSON.stringify(outputLabels));
}

const aliceResolve2pc = (labelledCircuit: Labels, outputLabels: NamedLabel) => {
    // ALICE
    const outputs = resolveOutputLabels(outputLabels, outputNames, labelledCircuit);
    console.log(`output => ${JSON.stringify(outputs)}`); // -> Alice shares with Bob
    // TODO(Curtis): send via bluetooth
}



// 1) alice sends circuits
// 2) bob asks Alice for the labels corresponding to her input, and he uses a protocol called "1-of-2 oblivious transfer"
//    - this gets bob the data needed to run the value through the circuit to get the result
// 3) bob sends result to alice


