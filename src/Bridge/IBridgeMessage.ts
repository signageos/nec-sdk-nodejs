export default interface IBridgeMessage<TMessage> {
	invocationUid: string;
	message: TMessage;
}
