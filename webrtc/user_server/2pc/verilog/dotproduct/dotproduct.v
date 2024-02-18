module DotProduct(
    input signed [39:0] vectorA, // 10 elements, each 4 bits
    input signed [39:0] vectorB,
    // input [9:0] vectorC, // New binary vector of length 10
    // input [9:0] vectorD, // New binary vector of length 10
    output reg signed [11:0] result // Adjusted for sum of products
);

integer i;

always @(vectorA or vectorB or vectorC or vectorD) begin
    result = 0; // Reset result for each calculation
    
    for (i = 0; i < 10; i = i + 1) begin
        result = result + ((vectorA[4*i +: 4]) * (vectorB[4*i +: 4]));
    end
end

endmodule
