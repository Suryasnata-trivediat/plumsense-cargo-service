const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");
const eventBridge = new EventBridgeClient({ region: process.env.REGION });

// ********* Send command to event bridge to invoke corresponding rule ********* //
const sendCommand = async (data)  => { 
    try {
        const command = new PutEventsCommand({
			Entries: [
				{
					EventBusName: data.EventBusName,
					Source: data.Source,
					DetailType: data.DetailType,
					Detail: JSON.stringify(data.Detail)
				}
			]
		});
        await eventBridge.send(command);
		return "done";
    } catch(error) {
        console.log("### Error in send() ###");
        throw error;
    }
};

module.exports = {
    send: sendCommand
};