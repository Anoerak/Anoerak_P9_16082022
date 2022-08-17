/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import Bills from "../containers/Bills.js"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When the Bill Page is Loading...", () => {
    test("...Then the LoadingPage should be Called", () => {
        const html = BillsUI({ 
          data: bills, 
          loading: true 
        });
        document.body.innerHTML = html;
        const isLoading = screen.getAllByText("Loading...");
        expect(isLoading).toBeTruthy();
    })
  })
  describe("When I am on Bills Page...", () => {
    test("...Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { 
        value: localStorageMock 
      })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe("When There is an Error with Bill page While Loading...", () => {
    test("...Then ErrorPage Should be Called", () => {
        const html = BillsUI({ 
          data: bills, 
          error: true 
        });
        document.body.innerHTML = html;
        const hasError = screen.getAllByText("Erreur");
        expect(hasError).toBeTruthy();
    })
  })
})
describe("Given I am connected as an Employee and The Page is Loaded without Error...", () => {
  describe("When I Create a Request...", () => {
    test("...Then I Should be Redirected to the New Bill Page", () => {
      Object.defineProperty(window, 'localStorage', { 
        value: localStorageMock 
      })
        window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const html = BillsUI({data : bills})
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname})
      }
      const mockBills = new Bills({document, onNavigate, localStorage: window.localStorage, store: null});
      const btnNewBill = screen.getByTestId('btn-new-bill');

      // Mock Handle Click for New Bill
      const mockFunctionHandleClick = jest.fn(mockBills.handleClickNewBill);
      btnNewBill.addEventListener('click',mockFunctionHandleClick)
      fireEvent.click(btnNewBill)
      expect(mockFunctionHandleClick).toHaveBeenCalled();
    }) 
  })
  describe("When I Click on the Preview Icon...", () => {
    test("...Then the Modal Should Open", () => {
      Object.defineProperty(window, localStorage, {value: localStorageMock})
      window.localStorage.setItem("user", JSON.stringify({type: 'Employee'}))
      const html = BillsUI({data: bills})
      document.body.innerHTML = html
    
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
        
      const billsContainer = new Bills({
        document,
        onNavigate,
        localStorage:localStorageMock,
        store: null,
      });

      // Mock The Modal
      $.fn.modal = jest.fn();

      // Mock the Handle Click Icon
      const handleClickIconEye = jest.fn(() => {
        billsContainer.handleClickIconEye
      });
      const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
      firstEyeIcon.addEventListener("click", handleClickIconEye)
      fireEvent.click(firstEyeIcon)
      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled();
    })
  })
})



// Integration Tests
/// Method GET
describe('Given I am connected as an employee', () => {
  describe('When I request the Bills Page', () => {
    test("Fetches Bills from Mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      expect(await waitFor(() => screen.getByText('Mes notes de frais'))).toBeTruthy()
    })
  })
  describe("When an Error Occurs in the Request", () => {
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
    // 404 Error Test
    test("Fetches Bills from an API and Fails with 404 Message Error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await waitFor(() => screen.getByText(/Erreur 404/))
      expect(message).toBeTruthy()
    })
    // 500 Error Test
    test("Fetches Messages from an API and Fails with 500 Message Error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await waitFor(() => screen.getByText(/Erreur 500/))
      expect(message).toBeTruthy()
    })
  })
})
