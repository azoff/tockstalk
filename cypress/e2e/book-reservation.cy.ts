/// <reference types="cypress" />

interface Target {
	reservation: string,
	partySize: number,
	timePreferences: string[]
}

const targetId = Cypress.env('target')
const target: Target = require(`../fixtures/${targetId}.json`)
const patron = require('../fixtures/patron.json')

const tid = (id:string, eq:string = '=') => `[data-testid${eq}${id}]`

function addGuestsUntilEqualTo(partySize:number) {
	return new Cypress.Promise((resolve, reject) => {
		cy.get(tid('experience-dialog-content'))
			.get(tid('guest-selector-text') + ' p')
			.last().then((textNode) => {
				const numberOfGuests = parseInt(textNode.text(), 10)
				if (numberOfGuests === target.partySize) {
					resolve(textNode);
					return
				}
				const slector = numberOfGuests > target.partySize 
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
				cy.wrap(rejectAllCookies).click().then(resolve)
			else 
				resolve(body) 
		})
	})
}

function openBookingModal() {
	cy.get(tid('offering-link', '*='))
			.contains(target.reservation)
			.click()
}

function fetchAvailableDays(): Promise<JQuery> {
	return new Cypress.Promise((resolve, reject) => {
		cy.get(tid('consumer-calendar-day')).then((days) => {
			resolve(days.filter('[aria-disabled=false].is-available'))
		})
	})
}

function findFirstPreferredTime(days:Array<HTMLElement>) {
	return new Cypress.Promise((resolve, reject) => {
		if (days.length === 0) {
			reject(new Error('unable to find any available timeslots matching preferences'))
			return
		}
		cy.wrap(days[0]).click()
		cy.get(tid('search-result-list-item')).then((results) => {
			cy.log(`searching ${results.length} available slots on ${days[0].ariaLabel} for preference...`)
			const matchedPreferences = results
				.filter((i, el) => 
					target.timePreferences.indexOf(el.innerText) >= 0)
			if (matchedPreferences.length === 0) {
				findFirstPreferredTime(days.slice(1)).then(resolve)
			} else {
				resolve(Cypress.$([days[0], matchedPreferences[0]]))
			}
		})
	})
}

function authenticate() {
	cy.visit(`https://www.exploretock.com/login?continue=%2F${targetId}`)
	cy.get(tid('email-input')).type(patron.email)
	cy.get(tid('email-password')).type(patron.password)
	cy.get(tid('sign-in')).click()
}

function checkOut(timeSlot:HTMLElement) {
	return new Cypress.Promise((resolve, reject) => {
		cy.wrap(timeSlot).click()
		cy.get(tid('credit-card-form'))
	})
}

describe(targetId, () => {
	it('attempt booking', async () => {
		authenticate()
		closeTrusteModal()
		openBookingModal()
		addGuestsUntilEqualTo(target.partySize)
		fetchAvailableDays().then((days) => {
			cy.log(`found ${days.length} days available to book...`)
			return findFirstPreferredTime(Array.from(days))
		}).then((match) => {
			cy.log(`found match for preference: ${match[0].ariaLabel} @ ${match[1].innerText}`)
			return checkOut(match[1])
		})
	})
})
