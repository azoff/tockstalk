/// <reference types="cypress" />

interface TockFixture {
	reservation: string,
	partySize: number
}

const fixtureId = Cypress.env('fixture')
const fixture: TockFixture = require(`../fixtures/${fixtureId}.json`)

const tid = (id:string, eq:string = '=') => `[data-testid${eq}${id}]`

function addGuestsUntilEqualTo(partySize:number) {
	return new Cypress.Promise((resolve, reject) => {
		cy.get(tid('experience-dialog-content'))
			.get(tid('guest-selector-text') + ' p')
			.last().then((textNode) => {
				const numberOfGuests = parseInt(textNode.text(), 10)
				if (numberOfGuests === fixture.partySize) {
					resolve(textNode);
					return
				}
				const slector = numberOfGuests > fixture.partySize 
					? 'guest-selector_minus'
					: 'guest-selector_plus'
					;
				cy.get(tid(slector)).last().click().then(() => {
					// recurse until party size is reached (or fails)
					addGuestsUntilEqualTo(partySize).then(resolve)
				})
		})
	})
}

function closeTrusteModal() {
	return new Cypress.Promise((resolve, reject) => {
		cy.get('body').then((body) => {
			const rejectAllCookies = body.find('#truste-consent-required')
			if (rejectAllCookies.length > 0) 
				cy.get('#truste-consent-required').click().then(resolve)
			else 
				resolve(body) 
		})
	})
}

describe(fixtureId, () => {
	it('attempt booking', async () => {
		cy.visit(`https://exploretock.com/${fixtureId}`)
		closeTrusteModal()
		cy.get(tid('offering-link', '*='))
			.contains(fixture.reservation)
			.click()
		addGuestsUntilEqualTo(fixture.partySize)
	})
})
