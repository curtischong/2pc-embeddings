module DotProduct(
    input [39:0] vectorA, // 10 elements, each 4 bits
    input [39:0] vectorB,
    output reg [11:0] result // Adjusted for sum of products
);

integer i;

always @(vectorA or vectorB) begin
    result = 0; // Reset result for each calculation
    for (i = 0; i < 10; i = i + 1) begin
        // Multiply each pair of 4-bit numbers and add to result
        result = result + ((vectorA[4*i +: 4]) * (vectorB[4*i +: 4]));
    end
end

endmodule
