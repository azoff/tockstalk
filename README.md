# tockstalk

A [Cypress](https://docs.cypress.io/guides/overview/why-cypress) bot to book restaurants on [Tock](exploretock.com) and report attempts to [Slack](https://slack.com).

![image](https://user-images.githubusercontent.com/160452/228733212-c30c234a-ee89-4167-8b30-b7a2edac4c91.png)

## Prerequisites

Ensure your computer has `node` and `npm` installed. You can use [nodenv](https://github.com/nodenv/nodenv#installation) if you don't. Once installed,
use `npm install` to pull down the dependencies for the project. Before you can run the bot, you'll also need to configure it. Read on to the next section for
how to do that.

## Configuration

If you don't already have an account on Tock, [make one](https://www.exploretock.com/signup). Once you've created your account, take note 
of your credentials as you'll need them in a bit. Next, navigate to [your account billing page](https://www.exploretock.com/profile/account/billing) 
and ensure you have a credit card on file. Take note of the CVV number for the card.

![image](https://user-images.githubusercontent.com/160452/228451227-fe38296a-e545-4bfc-a94c-de605b206e81.png)

Next go find the restaurant you'd like to book, and grab the path for the booking page. In the example above, that would be:

```
/otiumgrillandgreens/experience/330688/reservation
```

Last but not least, create [an incoming webhook](https://api.slack.com/incoming-webhooks) for your Slack account. This will send notifications 
from the cypress run to the slack room of your choice.

With all this in-hand, you can create your configuration file. There's [an example](./cypress.env.example.json) in the repo you can start with, 
though you'll need to create a real one named `cypress.env.json` in the project root. Using the example information we just took down, let's
create one:

```js
echo '
{
	"email": "{{ the email address used for Tock }}",
	"password": "{{ the password used for Tock }}",
	"cvv": {{ the CVV code for the card saved on Tock }},
	"bookingPage": "/otiumgrillandgreens/experience/330688/reservation",
	"partySize": 4,
	"desiredTimeSlots": [ "11:00 AM" ],
	"excludedDays": [ "2023-03-29" ],
	"slackWebhookUrl": "https://hooks.slack.com/services/00000000000/00000000000/00000000000000000000000",
	"slackUsername": "Otium Grill and Greens",
	"slackIconEmoji": ":meat_on_bone:",
	"dryRun": true
}
' > cypress.env.json
```

The fields are all pretty self explanatory, though you can use `dryRun` to avoid actually booking if you just want to test the whole thing out.

## Scheduling

![image](https://user-images.githubusercontent.com/160452/228456115-a510e933-29be-4c65-aad9-bf01aab9a213.png)

A lot of restaurants set their next month's schedule on a particular day and time. You can use github actions to 
[schedule jobs on a cron](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule) and try to snag a spot as things
open up. The [example in this repo](.github/workflows/schedule.yml) attempts bookings every 15 minutes. You can fork the repo and try it out yourself. 
Just be sure to set a secret `CYPRESS_ENV` with the above JSON so that the action will run.
