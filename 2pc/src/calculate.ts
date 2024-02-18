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

type AliceOTVals = {
    e: bigint,
    N: bigint,
    d: bigint,
    x0: bigint,
    x1: bigint,
    m0: Buffer,
    m1: Buffer
}

type BobOTVals = {
    e: bigint,
    N: bigint,
    x0: bigint,
    x1: bigint,
}

type AliceOTInputs = { [key: string]: AliceOTVals };
type BobOTInputs = { [key: string]: BobOTVals };
function ot_alice1(
    inputName: string,
    labelledCircuit: Labels, // Alice
):AliceOTVals {
//   console.log(`oblivious transfer -> value:${inputName}=${inputValue}`);

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
  return {
        e, N, d, x0, x1, m0, m1
  }
}

function ot_bob1(
    inputValue: InputValue,
    bobOTVals: BobOTVals,
) {
  // BOB
  return ot.otRecv1(inputValue, bobOTVals.e, bobOTVals.N, bobOTVals.x0, bobOTVals.x1);
}

function ot_alice2(
    bobV: bigint,
    aliceOTVals: AliceOTVals,
): mVals {
  // ALICE
  // const { m0k, m1k } = 
  return ot.otSend2(aliceOTVals.d, aliceOTVals.N, aliceOTVals.x0, aliceOTVals.x1, bobV, aliceOTVals.m0, aliceOTVals.m1);
}

function ot_bob2(
    inputValue: InputValue, 
    bobOTVals: BobOTVals,
    bobVK: BobVK,
    mVals: mVals
) {
  // BOB
  const m = ot.otRecv2(inputValue, bobOTVals.N, bobVK.k, mVals.m0k, mVals.m1k);
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

    const aliceOtInputs: AliceOTInputs = {}
    const bobOtInputs: BobOTInputs = {} // same as AliceOTInputs, but we hide the m0 and m1 values
    // alice starts the OT for all the inputs that bob needs.
    // we already know that bob needs these inputs. so just send it in the starting packet.
    for (let i = 0; i < 32; i++) {
        const inputName = `B_${i}`
        const aliceOtVals = ot_alice1(inputName, labelledCircuit);
        aliceOtInputs[inputName] = aliceOtVals

        bobOtInputs[inputName] = {
            e: aliceOtVals.e,
            N: aliceOtVals.N,
            x0: aliceOtVals.x0,
            x1: aliceOtVals.x1,
        }
    }

    // send the OT data to bob
    // send(garbledCircuit, bobOtInputs, aliceInputLabels)
}

interface BobVK {
    v: bigint,
    k: bigint
}

interface BobVKVals{
    [inputName: string]: BobVK
}

interface AliceVVals{
    [inputName: string]: bigint
}

const bobReceive2pc = (ot_bob_input: BobOTInputs) => {
    // BOB
    const bobWealth = 1e6;
    const bobInputs: NamedInputOutput = {};
    for (let i = 0; i < 32; i++) {
        bobInputs[`B_${i}`] = getNthBit(bobWealth, i);
    }

    const bobVKVals: BobVKVals = {}
    const aliceVVals: AliceVVals = {}

    for(let i = 0; i < 32; i++) {
        const inputName = `B_${i}`
        const { v, k } = ot_bob1(bobInputs[inputName], ot_bob_input[inputName]);
        bobVKVals[inputName] = { v, k }
        aliceVVals[inputName] = v
    }
    // sendToAlice(aliceVals)
}

interface mVals {
    m0k: bigint,
    m1k: bigint
}
interface BobMVals {
    [bobInputName: string]: mVals
}

const aliceReceiveVFromBob = (aliceVVals:AliceVVals, aliceOtInputs:AliceOTInputs) => {
    const bobMVals: BobMVals = {}
    for(const [inputName, aliceOtVals] of Object.entries(aliceOtInputs)) {
        // const { m0k, m1k } = ot_alice2(bobV, aliceOtVals);
        // we need to send this back to bob: const { m0k, m1k } = 
        bobMVals[inputName] = ot_alice2(aliceVVals[inputName], aliceOtVals)
    }
    // send(bobMVals)
}

const bobResolveInputs = (bobMVals: BobMVals, bobInputs: NamedInputOutput,
    bobOTInputs: BobOTInputs, bobVKVals: BobVKVals, garbledCircuit: GarbledTable[],
    aliceInputLabels:NamedLabel) => {

    const bobInputLabels:NamedLabel = {}
    for(let i = 0; i < 32; i++) {
        const inputName = `B_${i}`
        const m = ot_bob2(bobInputs[inputName], bobOTInputs[inputName], bobVKVals[inputName], bobMVals[inputName]);
        console.log("m", m)
        bobInputLabels[inputName] = m
    }

    console.log(`bob inputs -> ${JSON.stringify(bobInputs)}`);
    console.log(`bob input labels -> ${JSON.stringify(bobInputLabels)}`);

    // garbledCircuit and aliceInputLabels received from Alice
    // bobInputLabels received from Alice via oblivious transfer
    const outputLabels = evalGarbledCircuit(
    garbledCircuit,
    { ...aliceInputLabels, ...bobInputLabels },
    circuit,
    ); // -> Bob will send to Alice
    console.log("output labels ->", JSON.stringify(outputLabels));
    // sendToAlice(outputLabels)
}

// the reason why bob needs to send the outputLabels back to alice is because Bob doesn't know which labels correspond
// to a 1 or a 0
// This is why we need to do one extra step to resolve the output labels. We can avoid this if Alice sends the output labels to bob at the start.
const aliceResolve2pc = (labelledCircuit: Labels, outputLabels: NamedLabel) => {
    // ALICE
    const outputs = resolveOutputLabels(outputLabels, outputNames, labelledCircuit);
    console.log(`output => ${JSON.stringify(outputs)}`); // -> Alice shares with Bob
    // sendToBob(outputs)
}


// 1) alice sends circuits
// 2) bob asks Alice for the labels corresponding to her input, and he uses a protocol called "1-of-2 oblivious transfer"
//    - this gets bob the data needed to run the value through the circuit to get the result
// 3) bob sends result to alice


