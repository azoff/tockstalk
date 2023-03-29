const { IncomingWebhook } = require('@slack/webhook');
const webhookUrl = Cypress.env('slackWebhookUrl');
const webhook = new IncomingWebhook(webhookUrl);

Cypress.Commands.overwrite('log', (originalFn, ...msgs) => {
	msgs.forEach(text => {
		const payload = text.text ? text : { text }
		payload.username = Cypress.env('slackUsername')
		payload.icon_emoji = Cypress.env('slackIconEmoji')
		webhook.send(payload)
	})
	return originalFn(...msgs);
})
	