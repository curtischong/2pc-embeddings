module DotProduct(
    input [4:0] vectorA[3:0], // 4 elements, each 5 bits wide, two's complement
    input [4:0] vectorB[3:0], // 4 elements, each 5 bits wide, two's complement
    output reg [15:0] result  // Output wide enough to hold the sum of products
);

// Intermediate variables for products
wire signed [9:0] products[3:0]; // Each product could be up to 10 bits wide (5 bits * 5 bits)

// Perform multiplication of corresponding elements
// and extend the sign bit to ensure correct signed multiplication
genvar i;
generate
    for (i = 0; i < 4; i = i + 1) begin : multiply
        assign products[i] = $signed(vectorA[i]) * $signed(vectorB[i]);
    end
endgenerate

// Sum the products to get the dot product
// Initial block to compute the result once inputs are set
always @(*) begin
    result = $signed(products[0]) + $signed(products[1]) + $signed(products[2]) + $signed(products[3]);
end

endmodule