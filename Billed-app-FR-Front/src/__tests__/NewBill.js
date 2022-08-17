/**
 * @jest-environment jsdom
 */


 import "@testing-library/jest-dom"
 import { screen, fireEvent, getByTestId, waitFor } from "@testing-library/dom"
 import mockStore from "../__mocks__/store.js"
 import { localStorageMock } from "../__mocks__/localStorage.js"
 import NewBill from "../containers/NewBill.js"
 import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
 import router from "../app/Router.js"
 
 jest.mock("../app/Store", () => mockStore)
 
 
describe("Given I am connected as an employee", () => {
	describe("When I am on NewBill Page...", () => {
		test("...Mail icon Should be Highlighted", async () => {
			Object.defineProperty(window, 'localStorage', { value: localStorageMock })
			window.localStorage.setItem('user', JSON.stringify({
				type: 'Employee'
			}))
			const root = document.createElement("div")
			root.setAttribute("id", "root")
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.NewBill)
			await waitFor(() => screen.getByTestId('icon-mail'))
			const windowIcon = screen.getByTestId('icon-mail')
			expect(windowIcon).toHaveClass('active-icon')
		})
	})
})



// Integration Test
/// Method POST
describe("When I Submit a Form from the NewBill", () => {
	beforeEach(() => {
		jest.spyOn(mockStore, "bills")
		Object.defineProperty(
			window,
			'localStorage',
			{ value: localStorageMock }
		)
		window.localStorage.setItem('user', JSON.stringify({
			type: 'Employee',
			email: "r@domEm@il"
		}))
		const root = document.createElement("div")
		root.setAttribute("id", "root")
		document.body.appendChild(root)
		router()
	})
	describe("When API POST is a Success", () => {
		test("Then It Should Update the Refresh trough updateBill ", async () => {
			const newBill = new NewBill({
				document, 
				onNavigate, 
				store: mockStore, 
				localeStorage: localStorageMock
			})
			const handleSubmit = jest.fn(newBill.handleSubmit)
			const form = screen.getByTestId("form-new-bill")
			form.addEventListener("submit", handleSubmit)
			fireEvent.submit(form)
				expect(mockStore.bills).toHaveBeenCalled()
		})
	})
	describe("When API POST Fails", () => {
		test("Then It Should Display an Error", async () => {
			window.onNavigate(ROUTES_PATH.NewBill)
			mockStore.bills.mockImplementationOnce(() => {
				return {
					update: () => {
						return Promise.reject(new Error("Une Erreur est Survenu"))
					}
				}
			})
			const newBill = new NewBill({
				document, 
				onNavigate, 
				store: mockStore, 
				localeStorage: localStorageMock
			})
			const handleSubmit = jest.fn(newBill.handleSubmit)
			const form = screen.getByTestId("form-new-bill")
			form.addEventListener("submit", handleSubmit)
			fireEvent.submit(form)
			setTimeout(() => {
				expect(getByTestId(document.body, "error").classList).not.toContain("hidden")
			}, 1000)
		})
	})
})