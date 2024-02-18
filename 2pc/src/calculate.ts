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

const numDimensionsToDot = 10
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

const aliceInit2pc = (subEmbeddingIdx: number) => {
    // ALICE
    const {
    labelledCircuit,
    garbledCircuit, // -> Alice will send to Bob
    } = garbleCircuit(circuit);
    // TODO(Curtis): send via bluetooth

    const aliceWealth = 2e6; // TODO: set subEmbedding
    const aliceInputs: NamedInputOutput = {};
    for (let i = 0; i < 32; i++) {
        aliceInputs[`A_${i}`] = getNthBit(aliceWealth, i);
    }

    // TODO: get subEmbedding
    // const quantizedInput = quantizeVector(subEmbedding)

    // const subEmbedding = subEmbeddings[subEmbeddingIdx]
    // for(let dim = 0; dim < numDimensionsToDot; dim++) {
    //     for(let bit = 0; bit < 4; bit++) {
    //         aliceInputs[`vectorA_${dim*4 + bit}`] = getNthBit(subEmbedding.quantized[dim], bit);
    //     }
    // }

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
    // send(garbledCircuit, bobOtInputs, aliceInputLabels, subEmbeddingIdx)

    // TODO: setup the xor
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

const bobReceive2pc = (ot_bob_input: BobOTInputs, subEmbeddingIdx:number) => {
    // BOB
    const bobWealth = 1e6;
    const bobInputs: NamedInputOutput = {};
    for (let i = 0; i < 32; i++) {
        bobInputs[`B_${i}`] = getNthBit(bobWealth, i);
    }

    // const subEmbedding = subEmbeddings[subEmbeddingIdx]
    // for(let dim = 0; dim < numDimensionsToDot; dim++) {
    //     for(let bit = 0; bit < 4; bit++) {
    //         bobInputs[`vectorB_${dim*4 + bit}`] = getNthBit(subEmbedding.quantized[dim], bit);
    //     }
    // }

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

    // NOTE: we do not send to bob. Since alice will be the one that gets the final dot product
}


// 1) alice sends circuits
// 2) bob asks Alice for the labels corresponding to her input, and he uses a protocol called "1-of-2 oblivious transfer"
//    - this gets bob the data needed to run the value through the circuit to get the result
// 3) bob sends result to alice

const quantizeTo4Bits = (value: number): number => {
    // Ensure the value is within the expected range
    if (value < 0 || value > 1) {
      throw new Error('Value must be between 0 and 1');
    }
  
    // Scale the value to the range 0 to 15 and round it
    const quantized = Math.round(value * 15);
  
    return quantized;
  }

interface QuantizedInput {
    isPositive: boolean[],
    quantized: number[]
}

const quantizeVector = (embedding:number[]): QuantizedInput => {
    const isPositive = embedding.map((x) => x > 0 ? true : false)
    const quantized = embedding.map(quantizeTo4Bits)

    return {
        isPositive,
        quantized
    }
}

const calculateDotProduct = (subEmbeddingIdx:number):number => {
    // TODO: init 2PC
    return 0
}

const getSubEmbedding = (subEmbeddingIdx: number) => {
    const embedding = [1,2,3,4]
    // pad embedding to be a multiple of numDimensionsToDot
    const padding = new Array(numDimensionsToDot - (embedding.length % numDimensionsToDot)).fill(0)
    const paddedEmbedding = embedding.concat(padding)
    const subEmbedding = paddedEmbedding.slice(subEmbeddingIdx*numDimensionsToDot, subEmbeddingIdx*numDimensionsToDot + numDimensionsToDot)
    return subEmbedding
}

const aliceComputeDotProduct = () => {
    const embedding = [1,2,3,4]
    // pad embedding to be a multiple of numDimensionsToDot
    const padding = new Array(numDimensionsToDot - (embedding.length % numDimensionsToDot)).fill(0)
    const paddedEmbedding = embedding.concat(padding)
    const numSubEmbeddings = paddedEmbedding.length / numDimensionsToDot

    let totalDotProduct = 0
    for(let subEmbeddingIdx = 0; subEmbeddingIdx < numSubEmbeddings; subEmbeddingIdx++){
        const embeddingDotProduct = calculateDotProduct(subEmbeddingIdx);
        totalDotProduct += embeddingDotProduct;
    }

    // TODO:
    // sendToBob(totalDotProduct)
    return totalDotProduct;
}

