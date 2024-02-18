export enum MessageType {
    // <person it's from> <action it did>
    AliceInit2pc = "AliceInit2pc",
    BobReceive2pc = "BobReceive2pc",
    AliceReceiveVFromBob= "aliceReceiveVFromBob",
    BobResolveInputs = "BobResolveInputs",
    AliceSumAllSubEmbeddings = "AliceSumAllSubEmbeddings",
    EndConversation = 'EndConversation',
}