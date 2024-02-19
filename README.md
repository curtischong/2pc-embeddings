# LoveBeacon



https://github.com/curtischong/love-beacon/assets/10677873/5a4e6303-77fc-4385-9e19-8460bdfac9f0



Love Beacon is a MatchMaking app. After filling out your profile, a language model converts it into an embedding. A match occurs if you have a high cosine similarity with others. At no point does your embedding leave your device or is shared with other people.

So how are we able to calculate cosine similarity? Don't the two vectors need to be on the same computer to do the multiply and add operations?

Well... Two Party Computation (2PC) solves this problem! (computing on multiple private inputs)

![Dot Product Circuit](circuit.jpeg)

This is an implementation of Yao's Garbled Circuits (a 2PC protocol). The main code was based on https://github.com/tdjsnelling/garbled-circuits/tree/master. It was very helpful because they figured out how to use Verilog to define the circuits.

However, I modified it for optimization reasons AND to make the 2PC happen between different browser clients (rather than in just one nodeJS process)

### Why 2PC?
- Cause the tech is cool
  - Note: I don't believe that 2PC is that useful because we can have privacy-preserving computing using a Trusted Execution Environment (TEE). But I did have a REALLY fun time writing and debugging this over TreeHacks.
- I listened to Barry Whitehat's talk on [2PC is for Lovers](https://www.youtube.com/watch?v=PzcDqegGoKI) and have wanted to implement it ever since.

### Why a Matchmaking app?
- We were inspired by our friends at Resonant for hosting a matchmaking round last week (during Valentine's!)
- We wanted to pressure ourselves to deploy on mobile so it doesn't take too much compute
- We wanted to deploy this during Treehacks and see people use it! (ran out of time)

### Optimizations Used
- 4-bit quantization
- "Chunking" the 2pc 10 dimensions at a time. So we do the dot product for the first 10, then the next 10, etc. until we're done
  - At the end, we do a sum of these dot product chunks. It DOES leak info (you know the dot product of every 10 dimensions of the embedding), but this makes the circuit much smaller
- Reducing the number of back-and-forth calls during the Oblivious Transfer (although, at least one call can be removed)
- Using only the first 50 dimensions of the dimension vector (ikik. This loses a lot of info)
- Fast modular exponentiation


### Getting Started

In 3 diff terminals, run:

```
cd webrtc/client_server
python3 -m venv venv
pip install -r requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8000
```

```
cd webrtc/user_server
npm i
npm run dev
```

```
cd webrtc/websocket_server
npm i
npm start
```

Now open `http://localhost:3000/` in two tabs: one normally and one in Incognito mode


Now fill out "Find Your Match" in both pages

Now click Activate Beacon in both windows.

Finally, click on "Check compatibility with Bob/Alice" on one of the windows
- This will trigger the 2PC protocol. The person that triggers the protocol is Alice (in the code).

- Note: I suggest opening the console to see the logs!
