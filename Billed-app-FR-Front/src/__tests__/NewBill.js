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
		describe("When I Upload a File and the MIME is not Allowed...", () => {
			test("...An Error Message is Displayed", async () => {
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname })
				}
				Object.defineProperty(window, 'localStorage', { value: localStorageMock })
				window.localStorage.setItem('user', JSON.stringify({
					type: 'Employee'
				}))
				const newBill = new NewBill({
					document, onNavigate, store: mockStore, localStorage: localStorageMock
				})
				const handleChangeFile = jest.fn(newBill.handleChangeFile)
				const inputFile = screen.getByTestId("file")
				inputFile.addEventListener("change", handleChangeFile)
				fireEvent.change(inputFile, {
					target: {
						files: [
							new File(["document.txt"], "document.txt", {
								type: "document/txt"
							})
						]
					}
				  })
				  expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
				  expect(handleChangeFile).toBeCalled()
				  await waitFor(() => getByTestId(document.body, "file-error-message"))
				  expect(getByTestId(document.body, "file-error-message").classList).not.toContain("hidden")			
			})	
		})
		describe("When I Upload a File and the MIME is Allowed...", () => {
			test("...Te Name of the File Appears in the Input", async () => {
				const onNavigate = (pathname) => {
					document.body.innerHTML = ROUTES({ pathname })
				}
				Object.defineProperty(window, 'localStorage', { value: localStorageMock })
				window.localStorage.setItem('user', JSON.stringify({
					type: 'Employee'
				}))
				const newBill = new NewBill({
					document, 
					onNavigate, 
					store: mockStore, 
					localeStorage: localStorageMock
				})
				const handleChangeFile = jest.fn(newBill.handleChangeFile)
				const inputFile = screen.getByTestId("file")
				inputFile.addEventListener("change", handleChangeFile)
				fireEvent.change(inputFile, {
					target: {
					files: [
						new File(["image.png"], "image.png", {
							type: "image/png"
						})
					]}
				})
				expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
				expect(handleChangeFile).toBeCalled()
				await waitFor(() => getByTestId(document.body, "file-error-message"))
				expect(getByTestId(document.body, "file-error-message").classList).toContain("hidden")
				setTimeout(async () => {
					await waitFor(() => screen.getByText("image.png"))
				expect(screen.getByText("image.png")).toBeTruthy()
				expect(inputFile.files[0].name).toBe("image.png")
				}, 1000)
			})
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
						return Promise.reject(new Error("Une Erreur est Survenue"))
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