/* Generated by Yosys 0.38+17 (git sha1 cd8e6cbc6, aarch64-apple-darwin21.4-clang++ 14.0.0-1ubuntu1.1 -fPIC -Os) */

module fulladd(A_0, A_1, A_2, A_3, B_0, B_1, B_2, B_3, C_in, C_out, sum_0, sum_1, sum_2, sum_3);
  wire _00_;
  wire _01_;
  wire _02_;
  wire _03_;
  wire _04_;
  wire _05_;
  wire _06_;
  wire _07_;
  wire _08_;
  wire _09_;
  wire _10_;
  wire _11_;
  wire _12_;
  wire _13_;
  wire _14_;
  input A_0;
  wire A_0;
  input A_1;
  wire A_1;
  input A_2;
  wire A_2;
  input A_3;
  wire A_3;
  input B_0;
  wire B_0;
  input B_1;
  wire B_1;
  input B_2;
  wire B_2;
  input B_3;
  wire B_3;
  input C_in;
  wire C_in;
  output C_out;
  wire C_out;
  output sum_0;
  wire sum_0;
  output sum_1;
  wire sum_1;
  output sum_2;
  wire sum_2;
  output sum_3;
  wire sum_3;
  assign _00_ = ~(A_3 & B_3);
  assign _01_ = ~(A_2 & B_2);
  assign _02_ = A_2 ^ B_2;
  assign _03_ = ~(A_1 & B_1);
  assign _04_ = ~(A_0 & B_0);
  assign _05_ = A_0 ^ B_0;
  assign _06_ = ~(C_in & _05_);
  assign _07_ = ~(_04_ & _06_);
  assign _08_ = A_1 ^ B_1;
  assign _09_ = ~(_07_ & _08_);
  assign _10_ = ~(_03_ & _09_);
  assign _11_ = ~(_02_ & _10_);
  assign _12_ = ~(_01_ & _11_);
  assign _13_ = A_3 ^ B_3;
  assign _14_ = ~(_12_ & _13_);
  assign C_out = ~(_00_ & _14_);
  assign sum_0 = C_in ^ _05_;
  assign sum_1 = _07_ ^ _08_;
  assign sum_2 = _02_ ^ _10_;
  assign sum_3 = _12_ ^ _13_;
endmodule
