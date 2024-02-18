module DotProduct(
    input [39:0] vectorA, // 10 elements, each 4 bits
    input [39:0] vectorB,
    input [9:0] vectorC, // New binary vector of length 10
    input [9:0] vectorD, // New binary vector of length 10
    output reg signed [11:0] result // Adjusted for sum of products
);

integer i;

always @(vectorA or vectorB or vectorC or vectorD) begin
    result = 0; // Reset result for each calculation
    
    for (i = 0; i < 10; i = i + 1) begin
        // Directly use XOR to decide if we add or subtract, without storing xorResult
        if (vectorC[i] ^ vectorD[i] == 1'b0) begin
            // If XOR result is 0 (vectors C and D are the same for this bit), add to result
            result = result + ((vectorA[4*i +: 4]) * (vectorB[4*i +: 4]));
        end else begin
            // If XOR result is 1 (vectors C and D are different for this bit), subtract from result
            result = result - ((vectorA[4*i +: 4]) * (vectorB[4*i +: 4]));
        end
    end
end

endmodule
