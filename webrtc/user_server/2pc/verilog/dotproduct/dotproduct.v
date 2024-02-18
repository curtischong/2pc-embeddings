module DotProduct(
    input [39:0] vectorA, // 10 elements, each 4 bits
    input [39:0] vectorB,
    input [9:0] vectorC, // New binary vector of length 10
    input [9:0] vectorD, // New binary vector of length 10
    output reg [11:0] result, // Adjusted for sum of products
    output reg [9:0] xorResult // Result of XORing vectorC and vectorD
);

integer i;

always @(vectorA or vectorB) begin
    result = 0; // Reset result for each calculation
    for (i = 0; i < 10; i = i + 1) begin
        // Multiply each pair of 4-bit numbers and add to result
        result = result + ((vectorA[4*i +: 4]) * (vectorB[4*i +: 4]));
    end
end

always @(vectorC or vectorD) begin
    xorResult = 0; // Reset xorResult for each calculation
    for (i = 0; i < 10; i = i + 1) begin
        // Perform XOR on each bit of vectorC and vectorD and store in xorResult
        xorResult[i] = vectorC[i] ^ vectorD[i];
    end
end

endmodule
