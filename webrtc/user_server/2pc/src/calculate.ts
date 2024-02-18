import * as ot from "./oblivious-transfer";
import { base64urlToBigInt, bufferToBigInt, getJwkInt, getNthBit, twosComplementToNumber, verifyRSA } from "./utils";
import { InputValue } from "./circuit/gates";
import { Circuit, garbleCircuit, GarbledTable, Labels, NamedLabel } from "./circuit/garble";
import { MessageType } from "../../types"
import {
  evalGarbledCircuit,
  resolveOutputLabels,
  NamedInputOutput,
} from "./circuit/evaluate";
import { parseVerilog } from "./verilog";
import { circuitStr } from "./circuitStr";

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

async function generateRsaKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048, // Can be 1024, 2048, or 4096
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true, // whether the key is extractable (i.e., can be exported)
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey(
    "jwk", // JSON Web Key format
    keyPair.publicKey
  );

  // Public key parts
//   console.log('Public key parts:');
//   console.log('Modulus (n):', publicKey.n); // Base64url-encoded
//   console.log('Exponent (e):', publicKey.e); // Base64url-encoded

  // Assuming the environment allows private key export
  const privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  // Private key parts
//   console.log('Private key parts:');
//   console.log('Modulus (n):', privateKey.n); // Same as public key
//   console.log('Private Exponent (d):', privateKey.d); // Base64url-encoded

  // TODO: verify these are the keys
  return {
    e: base64urlToBigInt(publicKey.e),
    N: base64urlToBigInt(publicKey.n),
    d: base64urlToBigInt(privateKey.d)
  }
}

async function ot_alice1(
    inputName: string,
    labelledCircuit: Labels, // Alice
):Promise<AliceOTVals> {
//   console.log(`oblivious transfer -> value:${inputName}=${inputValue}`);

// ALICE
// const { publicKey, privateKey } = generateKeyPairSync("rsa", {
//     modulusLength: 2048,
//   });

//   const pubkey = publicKey.export({ format: "jwk" });
//   const privkey = privateKey.export({ format: "jwk" });

  const m0 = Buffer.from(labelledCircuit[inputName][0], "utf-8");
  const m1 = Buffer.from(labelledCircuit[inputName][1], "utf-8");

//   const e = getJwkInt(pubkey.e as string);
//   const N = getJwkInt(pubkey.n as string);
//   const d = getJwkInt(privkey.d as string);
    const {e,N,d} = await generateRsaKeyPair()
    // verifyRSA(e, N, d) // it works!


  const { x0, x1 } = ot.otSend1();
  return {
        e, N, d, x0, x1, m0, m1
  }
}

function ot_bob1(
    inputValue: InputValue,
    bobOTVals: BobOTVals,
) {
    // console.log("ot_bob1", bobOTVals)
  // BOB
  return ot.otRecv1(inputValue, bobOTVals.e, bobOTVals.N, bobOTVals.x0, bobOTVals.x1);
}

function ot_alice2(
    bobV: bigint,
    aliceOTVals: AliceOTVals,
): mVals {
  // ALICE
  // const { m0k, m1k } = 
  console.log("bobV", bobV)
  console.log("aliceOTVals", aliceOTVals)
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


const { circuit, outputNames } = parseVerilog(circuitStr);

const aliceInit2pc = async (subEmbeddingIdx: number, sendMessage: any) => {
    console.log("aliceInit2pc")
    clearStorage();
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

    // const subEmbedding = getSubEmbedding(subEmbeddingIdx)
    // for(let dim = 0; dim < numDimensionsToDot; dim++) {
    //     for(let bit = 0; bit < 4; bit++) {
    //         aliceInputs[`vectorA_${dim*4 + bit}`] = getNthBit(subEmbedding.quantized[dim], bit);
    //     }
    // }
    // for(let i = 0; i < numDimensionsToDot; i++){
    //     aliceInputs[`vectorC_${i}`] = subEmbedding.isPositive[i]
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
        const aliceOtVals = await ot_alice1(inputName, labelledCircuit);
        aliceOtInputs[inputName] = aliceOtVals

        bobOtInputs[inputName] = {
            e: aliceOtVals.e,
            N: aliceOtVals.N,
            x0: aliceOtVals.x0,
            x1: aliceOtVals.x1,
        }
    }

    toStorage("labelledCircuit", labelledCircuit)
    toStorage("aliceOtInputs", aliceOtInputs)
    toStorage("subEmbeddingIdx", subEmbeddingIdx)

    // send the OT data to bob
    sendMessage({
        garbledCircuit, bobOtInputs, aliceInputLabels, subEmbeddingIdx
    }, MessageType.AliceInit2pc)
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

const bobReceive2pc = (garbledCircuit:GarbledTable[], bobOtInputs: BobOTInputs, aliceInputLabels: NamedLabel, subEmbeddingIdx: number, sendMessage: any) => {
    console.log("bobReceive2pc")
    toStorage("garbledCircuit", garbledCircuit)
    toStorage("bobOtInputs", bobOtInputs)
    toStorage("aliceInputLabels", aliceInputLabels)
    toStorage("subEmbeddingIdx", subEmbeddingIdx)
    // BOB
    const bobWealth = 1e6;
    const bobInputs: NamedInputOutput = {};
    for (let i = 0; i < 32; i++) {
        bobInputs[`B_${i}`] = getNthBit(bobWealth, i);
    }

    // const subEmbedding = getSubEmbedding(subEmbeddingIdx)
    // for(let dim = 0; dim < numDimensionsToDot; dim++) {
    //     for(let bit = 0; bit < 4; bit++) {
    //         bobInputs[`vectorB_${dim*4 + bit}`] = getNthBit(subEmbedding.quantized[dim], bit);
    //     }
    // }
    // for(let i = 0; i < numDimensionsToDot; i++){
    //     bobInputs[`vectorD_${i}`] = subEmbedding.isPositive[i]
    // }

    const bobVKVals: BobVKVals = {}
    const aliceVVals: AliceVVals = {}

    for(let i = 0; i < 32; i++) {
        const inputName = `B_${i}`
        const { v, k } = ot_bob1(bobInputs[inputName], bobOtInputs[inputName]);
        console.log("v", v, "k", k)
        bobVKVals[inputName] = { v, k }
        aliceVVals[inputName] = v
    }
    toStorage("bobVKVals", bobVKVals)
    toStorage("bobInputs", bobInputs)
    // TODO: save to localStorage: aliceVVals
    sendMessage({
        aliceVVals,
    }, MessageType.BobReceive2pc)
}

interface mVals {
    m0k: bigint,
    m1k: bigint
}
interface BobMVals {
    [bobInputName: string]: mVals
}

const aliceReceiveVFromBob = (aliceVVals:AliceVVals, sendMessage: any) => {
    console.log("aliceReceiveVFromBob")
    const aliceOtInputs = fromStorage("aliceOtInputs") as AliceOTInputs
    const bobMVals: BobMVals = {}
    for(const [inputName, aliceOtVals] of Object.entries(aliceOtInputs)) {
        // const { m0k, m1k } = ot_alice2(bobV, aliceOtVals);
        // we need to send this back to bob: const { m0k, m1k } = 
        console.log("aliceVVals", aliceVVals, "inputName", inputName)
        bobMVals[inputName] = ot_alice2(aliceVVals[inputName], aliceOtVals)
    }
    sendMessage({
        bobMVals
    }, MessageType.AliceReceiveVFromBob)
}

const bobResolveInputs = (bobMVals: BobMVals, sendMessage: any) => {
    console.log("bobResolveInputs")
    const bobInputs = fromStorage("bobInputs") as NamedInputOutput
    const bobVKVals = fromStorage("bobVKVals") as BobVKVals
    const bobOTInputs = fromStorage("bobOTInputs") as BobOTInputs
    const garbledCircuit = fromStorage("garbledCircuit") as GarbledTable[]
    const aliceInputLabels = fromStorage("aliceInputLabels") as NamedLabel

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
    sendMessage({
        outputLabels
    }, MessageType.BobResolveInputs)
}

// the reason why bob needs to send the outputLabels back to alice is because Bob doesn't know which labels correspond
// to a 1 or a 0
// This is why we need to do one extra step to resolve the output labels. We can avoid this if Alice sends the output labels to bob at the start.
const aliceCalcFinalSum = (outputLabels: NamedLabel) => {
    console.log("aliceCalcFinalSum")
    const labelledCircuit = fromStorage("labelledCircuit") as Labels
    // ALICE
    const outputs = resolveOutputLabels(outputLabels, outputNames, labelledCircuit);
    console.log(`output => ${JSON.stringify(outputs)}`); // -> Alice shares with Bob


    // by inspection of the diagram, result_0 is the least significant bit

    // let numOutputs = 12
    // // NOTE: we do not send to bob. Since alice will be the one that gets the final dot product
    // let finalSum = 0 
    // for(let i = 0; i < numOutputs; i++){
//         const jthBit = outputs[`result_${i}`]
//         const finalSum = finalSum + (jthBit << i)
    // }
    // return finalSum

    // let binaryBits = ""
    // for(let i = 0; i < numOutputs; i++){
    //     binaryBits = outputs[`result_${i}`] + binaryBits
    // }
    // return twosComplementToNumber(binaryBits)
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
  
    return quantized >= 0 ? quantized : -quantized;
  }

interface QuantizedInput {
    isPositive: number[],
    quantized: number[]
}

const quantizeVector = (embedding:number[]): QuantizedInput => {
    const isPositive = embedding.map((x) => x > 0 ? 1 : 0)
    const quantized = embedding.map(quantizeTo4Bits)

    return {
        isPositive,
        quantized
    }
}

const calculateDotProduct = (subEmbeddingIdx:number, sendMessage:any):number => {
    // TODO: init 2PC
    aliceInit2pc(subEmbeddingIdx, sendMessage);
    // TODO: return a value one all of the embeddings is finished
    return 0
}

const getSubEmbedding = (subEmbeddingIdx: number): QuantizedInput => {
    const embedding = fromStorage("embedding") as number[]
    // pad embedding to be a multiple of numDimensionsToDot
    const padding = new Array(numDimensionsToDot - (embedding.length % numDimensionsToDot)).fill(0)
    const paddedEmbedding = embedding.concat(padding)
    const subEmbedding = paddedEmbedding.slice(subEmbeddingIdx*numDimensionsToDot, subEmbeddingIdx*numDimensionsToDot + numDimensionsToDot)
    return quantizeVector(subEmbedding)
}

// TODO: figure this out
const aliceComputeDotProduct = (sendMessage: any) => {
    const embedding = fromStorage("embedding") as number[]
    // pad embedding to be a multiple of numDimensionsToDot
    const paddedEmbeddingLen = embedding.length + (numDimensionsToDot - (embedding.length % numDimensionsToDot))
    const numSubEmbeddings = paddedEmbeddingLen / numDimensionsToDot

    let totalDotProduct = 0
    for(let subEmbeddingIdx = 0; subEmbeddingIdx < numSubEmbeddings; subEmbeddingIdx++){
        const embeddingDotProduct = calculateDotProduct(subEmbeddingIdx, sendMessage);
        totalDotProduct += embeddingDotProduct;
    }

    sendMessage({totalDotProduct}, MessageType.AliceComputeDotProduct)
    return totalDotProduct;
}


const clearStorage = () => {
    const savedToStorage = ["labelledCircuit", "aliceOtInputs", "subEmbeddingIdx", "garbledCircuit", "bobOtInputs", "aliceInputLabels", "bobVKVals", "bobInputs"]
    for(const key of savedToStorage){
        localStorage.removeItem(key)
    }
}

BigInt.prototype.toJSON = function() { return this.toString() }
const toStorage = (key:string, val:any) => {
    localStorage.setItem(key, JSON.stringify(val));
}

const fromStorage = (key:string) => {
    return JSON.parse(localStorage.getItem(key));
}

export { aliceComputeDotProduct, aliceInit2pc, bobReceive2pc, aliceReceiveVFromBob, bobResolveInputs, aliceCalcFinalSum};
