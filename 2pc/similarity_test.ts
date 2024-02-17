
// just to hceck that we are doing the circuits properly
let dotProduct = (a:number[], b:number[]) => {
    // TODO: use the circuit
    return a.map((_, i) => a[i] * b[i]).reduce((a, b) => a + b);
}

let require = <T>(a:T, b:T) =>{
    if(a !== b){
        throw new Error("Error: " + a + " !== " + b);
    }
}

{
    // simple similarity
    let a = [1, 2, 3];
    let b = [1, 1, 1];
    require(dotProduct(a, b), 6);
}
{
    // negative
    let a = [1, 2, 3];
    let b = [1, -1, -1];
    require(dotProduct(a, b), -4);
}
{
    // decimals
    let a = [1.5, 1];
    let b = [1, 1.5];
    require(dotProduct(a, b), 3);
}