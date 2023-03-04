/// <reference types="cypress" />

interface Reservation {
	slug: string,
	offering: string,
	partySize: number,
	timePreferences: string[]
}

interface Patron {
	email: string,
	password: string,
	cvv: number
}

describe('book reservation', () => {
	
	let patron: Patron
	let reservation: Reservation
	
	before(() => {
		patron = {
			email: Cypress.env('email'),
			password: Cypress.env('password'),
			cvv: Cypress.env('cvv'),
		}
		cy.wrap(patron.email).should('be.ok')
		cy.wrap(patron.password).should('be.ok')
		cy.wrap(patron.cvv).should('be.a', 'number')
		reservation = {
			offering: Cypress.env('offering'),
			partySize: Cypress.env('partySize'),
			slug: Cypress.env('slug'),
			timePreferences: Cypress.env('timePreferences')
		}
		cy.wrap(reservation.slug).should('be.ok')
		cy.wrap(reservation.offering).should('be.ok')
		cy.wrap(reservation.partySize).should('be.a', 'number')
		cy.wrap(reservation.timePreferences).should('be.a', 'array')
	})

	const tid = (id:string, eq:string = '=') => `[data-testid${eq}${id}]`

	function addGuestsUntilEqualTo(partySize:number) {
		return cy
			.get(tid('experience-dialog-content'))
			.find(tid('guest-selector-text') + ' p')
			.last().then((textNode) => {
					const numberOfGuests = parseInt(textNode.text(), 10)
					if (numberOfGuests === reservation.partySize)
						return textNode
					const slector = numberOfGuests > reservation.partySize 
						? 'guest-selector_minus'
						: 'guest-selector_plus'
						;
						cy.get(tid(slector)).last().click()
						// recurse until party size is reached (or fails)
						return addGuestsUntilEqualTo(partySize)
			})
	}

	function closeTrusteModal() {
		return cy
			.get('#truste-consent-required')
			.click() 
	}

	function openBookingModal() {
		cy.get(tid('offering-link', '*='))
				.contains(reservation.offering)
				.click()
	}

	function fetchAvailableDays() {
		return cy
			.get(tid('consumer-calendar-day'))
			.filter('[aria-disabled=false].is-available')
	}

	function findFirstPreferredTime(days:Array<HTMLElement>) {
		cy.wrap(days.length).should('be.greaterThan', 0) 
		cy.wrap(days[0]).click()
		return cy.get(tid('search-result-time')).then((results) => {
			cy.log(`searching ${results.length} available slots on ${days[0].ariaLabel} for preference...`)
			const matchedPreferences = results
				.filter((i, el) => 
					reservation.timePreferences.length === 0 ||
					reservation.timePreferences.indexOf(el.innerText) >= 0)
			if (matchedPreferences.length === 0) {
				return findFirstPreferredTime(days.slice(1))
			} else {
				return cy.wrap(Cypress.$([days[0], matchedPreferences[0]]))
			}
		})
	}

	function authenticate() {
		cy.get(tid('email-input')).type(patron.email)
		cy.get(tid('password-input')).type(patron.password)
		cy.get(tid('signin')).click()
	}

	function visit() {
		cy.visit(`https://www.exploretock.com/login?continue=%2F${reservation.slug}`)
		closeTrusteModal()
	}

	function fillFormFields(timeSlot:HTMLElement) {
		cy.wrap(timeSlot).click()
		return cy.get('body').then((body) => {
			const root = body.find('span#cvv')
			if (root.length) {
				cy.intercept('https://payments.braintree-api.com/graphql').as('braintree')
				cy.wait('@braintree')
				return cy
					.get('iframe[type=cvv]')
					.its('0.contentDocument.body')
					.find('#cvv')
					.type(patron.cvv.toString())
			} else {
				return cy.wrap(null)
			}
		})
	}

	function submitBooking() {
		cy.log('booking reservation...')
		cy.get('[data-testid="submit-purchase-button"]').click()
		cy.get('.Receipt-container--header p').then(p => {
			cy.log(`reservation booked! ${p.text()}`)
		})
	}

	it('for first available time preference', async () => {
		visit()
		authenticate()
		openBookingModal()
		addGuestsUntilEqualTo(reservation.partySize)
		fetchAvailableDays().then((days) => {
			cy.log(`found ${days.length} days available to book...`)
			return findFirstPreferredTime(Array.from(days))
		}).then((match) => {
			cy.log(`found match for preference: ${match[0].ariaLabel} @ ${match[1].innerText}`)
			return fillFormFields(match[1])
		})
		submitBooking()
	})
})
