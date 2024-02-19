# LoveBeacon
![Dot Product Circuit](circuit.jpeg)

Love Beacon is a MatchMaking app. After filling out your profile, a language model converts it into an embedding. A match occurs if you have a high cosine similarity with others. At no point does your embedding leave your device or is shared with other people.

So how are we able to calculate cosine similarity? Don't the two vectors need to be on the same computer to do the multiply and add operations?

Well... 2PC comes to the rescue!

This is an implementation of Yao's Garbled Circuits (a 2PC protocol). The main code was based on https://github.com/tdjsnelling/garbled-circuits/tree/master. It was very helpful because they found out how to use Verilog to define the circuits.

However, I modified it for optimization reasons AND to make the 2PC happen between different browser clients (rather than in just one nodeJS process)

### Why 2PC?
- Cause the tech is cool
  - Note: I don't believe that 2PC is that useful because we can have privacy-preserving compute using a Trusted Execution Environment (TEE). But I did have a REALLY fun time writing and debugging this over TreeHacks.
- I listened to Barry Whitehat's talk on [2PC is for Lovers](https://www.youtube.com/watch?v=PzcDqegGoKI) and have wanted to implement it ever since.

### Why a Matchmaking app?
- We were inspired by our friends at Resonant for hosting a matchmaking round last week (during Valentines!)
- We wanted to pressure ourselves to deploy on mobile so it doesn't take too much compute
- We wanted to deploy this during Treehacks and see people use it! (ran out of time)

### Optimizations Used
- 4-bit quantization
- Using only first 50 dimensions of the dimension vector (ikik. this isn't so good)
- "Chunking" the 2pc 10 dimensions at a time. So we do the dot product for the first 10, then the next 10, etc. until we're done
  - At the end we do a sum of these dot product chunks. It DOES leak info, but makes the circuit much smaller
- Reducing the number of back and forth calls during the Oblivious Transfer (although, at least one call can be removed)
- Fast modular exponentiation