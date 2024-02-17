// tysm vitalik: https://vitalik.eth.limo/general/2020/03/21/garbled.html

interface Profile {
    embedding: number[];
}

let a:Profile = {
    embedding: [1, 2, 3], // not just an int. can be a double. can be negative
};
let b:Profile = {
    embedding: [1, 1, 1]
}

let bit_len = 256;

let intToBinary = (n:number) => {
    let binary = n.toString(2);
    return "0".repeat(bit_len - binary.length) + binary;
}

let setup = (a:Profile) => {
    let a_bin = a.embedding.map(intToBinary);
    for(let i = 0; i < a_bin.length; i++){
        let label = Math.random() > 0.5 ? 0 : 1;
        a_bin[i] = a_bin[i] + label;
    }

    // first generate two labels
    
}